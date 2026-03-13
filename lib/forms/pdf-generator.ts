import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { SignatureData } from "./types"
import { embedSignatureOnPage, addAuditFooter } from "./pdf-helpers"

export type GeneratePDFOptions = {
  docType: string
  formData: Record<string, string>
  signature?: SignatureData
  employeeName: string
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function generateSignedPDF(options: GeneratePDFOptions): Promise<Blob> {
  const { docType } = options

  switch (docType) {
    case "w4":
      return generateW4PDF(options)
    case "i9":
      return generateI9PDF(options)
    case "direct_deposit":
    case "directDeposit":
      return generateDirectDepositPDF(options)
    case "offer_letter":
    case "offerLetter":
      return generateOfferLetterPDF(options)
    default:
      return generateGenericPDF(options)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadTemplatePDF(path: string): Promise<PDFDocument | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const bytes = await res.arrayBuffer()
    return await PDFDocument.load(bytes, { ignoreEncryption: true })
  } catch {
    return null
  }
}

function formatDate(isoOrRaw: string): string {
  if (!isoOrRaw) return ""
  try {
    const d = new Date(isoOrRaw)
    if (isNaN(d.getTime())) return isoOrRaw
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  } catch {
    return isoOrRaw
  }
}

async function applySignatureAndFooter(
  pdfDoc: PDFDocument,
  options: GeneratePDFOptions,
  sigX: number,
  sigY: number,
  maxWidth = 200,
  maxHeight = 50
) {
  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]

  if (options.signature) {
    await embedSignatureOnPage(pdfDoc, lastPage, options.signature, sigX, sigY, maxWidth, maxHeight)

    const signerName = options.employeeName || options.formData["firstName"] || "Employee"
    const signedAt = formatDate(new Date().toISOString())
    const signatureType = options.signature.type

    await addAuditFooter(pdfDoc, lastPage, { signerName, signedAt, signatureType })
  }
}

// ---------------------------------------------------------------------------
// W-4
// ---------------------------------------------------------------------------

async function generateW4PDF(options: GeneratePDFOptions): Promise<Blob> {
  const pdfDoc = await loadTemplatePDF("/forms/w4-2026.pdf")

  if (pdfDoc) {
    try {
      const form = pdfDoc.getForm()
      const fieldMap: Record<string, string> = {
        // Common IRS W-4 2026 field names
        "topmostSubform[0].Page1[0].f1_1[0]": options.formData["firstName"] ?? "",
        "topmostSubform[0].Page1[0].f1_2[0]": options.formData["lastName"] ?? "",
        "topmostSubform[0].Page1[0].f1_3[0]": options.formData["ssn"] ?? "",
        "topmostSubform[0].Page1[0].f1_4[0]": options.formData["address"] ?? "",
        "topmostSubform[0].Page1[0].f1_5[0]": options.formData["cityStateZip"] ?? "",
        // Simpler field names used in some versions
        "First name and middle initial": options.formData["firstName"] ?? "",
        "Last name": options.formData["lastName"] ?? "",
        "Social security number": options.formData["ssn"] ?? "",
        "Address": options.formData["address"] ?? "",
        "City or town state and ZIP code": options.formData["cityStateZip"] ?? "",
        "Filing status": options.formData["filingStatus"] ?? "",
        "Additional withholding": options.formData["additionalWithholding"] ?? "",
      }

      const fields = form.getFields()
      for (const f of fields) {
        const name = f.getName()
        const val = fieldMap[name]
        if (val !== undefined) {
          try {
            const tf = form.getTextField(name)
            tf.setText(val)
          } catch {
            // Field might be a different type — skip
          }
        }
      }

      form.flatten()
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]
      const { height } = lastPage.getSize()

      if (options.signature) {
        await embedSignatureOnPage(pdfDoc, lastPage, options.signature, 72, height * 0.15, 220, 55)
        await addAuditFooter(pdfDoc, lastPage, {
          signerName: options.employeeName,
          signedAt: formatDate(new Date().toISOString()),
          signatureType: options.signature.type,
        })
      }

      const bytes = await pdfDoc.save()
      return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
    } catch {
      // AcroForm filling failed — fall through to generated version
    }
  }

  // Fallback: generated W-4 style PDF
  return generateFallbackFormPDF(options, "W-4 Employee's Withholding Certificate", [
    { label: "First Name", value: options.formData["firstName"] ?? "" },
    { label: "Last Name", value: options.formData["lastName"] ?? "" },
    { label: "SSN", value: options.formData["ssn"] ? `***-**-${options.formData["ssn"].slice(-4)}` : "" },
    { label: "Address", value: options.formData["address"] ?? "" },
    { label: "City, State, ZIP", value: options.formData["cityStateZip"] ?? "" },
    { label: "Filing Status", value: options.formData["filingStatus"] ?? "" },
    { label: "Additional Withholding", value: options.formData["additionalWithholding"] ?? "" },
  ])
}

// ---------------------------------------------------------------------------
// I-9
// ---------------------------------------------------------------------------

async function generateI9PDF(options: GeneratePDFOptions): Promise<Blob> {
  const pdfDoc = await loadTemplatePDF("/forms/i9.pdf")

  if (pdfDoc) {
    try {
      const form = pdfDoc.getForm()
      const fieldMap: Record<string, string> = {
        "Last Name (Family Name)": options.formData["lastName"] ?? "",
        "First Name (Given Name)": options.formData["firstName"] ?? "",
        "Middle Initial": options.formData["middleInitial"] ?? "",
        "Address (Street Number and Name)": options.formData["address"] ?? "",
        "Apt. Number": options.formData["apt"] ?? "",
        "City or Town": options.formData["city"] ?? "",
        "State": options.formData["state"] ?? "",
        "ZIP Code": options.formData["zip"] ?? "",
        "Date of Birth (mm/dd/yyyy)": options.formData["dob"] ?? "",
        "U.S. Social Security Number": options.formData["ssn"] ?? "",
        "Employee's E-mail Address": options.formData["email"] ?? "",
        "Employee's Telephone Number": options.formData["phone"] ?? "",
      }

      const fields = form.getFields()
      for (const f of fields) {
        const name = f.getName()
        const val = fieldMap[name]
        if (val !== undefined) {
          try {
            const tf = form.getTextField(name)
            tf.setText(val)
          } catch {
            // skip
          }
        }
      }

      form.flatten()
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]
      const { height } = lastPage.getSize()

      if (options.signature) {
        await embedSignatureOnPage(pdfDoc, lastPage, options.signature, 72, height * 0.15, 220, 55)
        await addAuditFooter(pdfDoc, lastPage, {
          signerName: options.employeeName,
          signedAt: formatDate(new Date().toISOString()),
          signatureType: options.signature.type,
        })
      }

      const bytes = await pdfDoc.save()
      return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
    } catch {
      // fall through
    }
  }

  return generateFallbackFormPDF(options, "I-9 Employment Eligibility Verification", [
    { label: "Last Name", value: options.formData["lastName"] ?? "" },
    { label: "First Name", value: options.formData["firstName"] ?? "" },
    { label: "Date of Birth", value: options.formData["dob"] ?? "" },
    { label: "SSN", value: options.formData["ssn"] ? `***-**-${options.formData["ssn"].slice(-4)}` : "" },
    { label: "Address", value: options.formData["address"] ?? "" },
    { label: "City", value: options.formData["city"] ?? "" },
    { label: "State", value: options.formData["state"] ?? "" },
    { label: "ZIP", value: options.formData["zip"] ?? "" },
    { label: "Email", value: options.formData["email"] ?? "" },
    { label: "Phone", value: options.formData["phone"] ?? "" },
    { label: "Citizenship Status", value: options.formData["citizenshipStatus"] ?? "" },
  ])
}

// ---------------------------------------------------------------------------
// Direct Deposit
// ---------------------------------------------------------------------------

async function generateDirectDepositPDF(options: GeneratePDFOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const darkGreen = rgb(0.075, 0.388, 0.204)
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.9, 0.9, 0.9)

  let y = height - 60

  // Header bar
  page.drawRectangle({ x: 0, y: y - 10, width, height: 70, color: darkGreen })
  page.drawText("DIRECT DEPOSIT AUTHORIZATION", {
    x: 40, y: y + 10, size: 18, font: fontBold, color: rgb(1, 1, 1),
  })
  page.drawText("Employee Banking Information Form", {
    x: 40, y: y - 8, size: 10, font: fontReg, color: rgb(0.85, 0.95, 0.87),
  })

  y -= 60

  const drawField = (label: string, value: string, x: number, fieldY: number, w = 240) => {
    page.drawText(label, { x, y: fieldY + 4, size: 8, font: fontReg, color: gray })
    page.drawRectangle({ x, y: fieldY - 20, width: w, height: 22, color: lightGray })
    page.drawText(value || "—", { x: x + 8, y: fieldY - 13, size: 10, font: fontReg, color: black })
  }

  // Employee section
  page.drawText("Employee Information", { x: 40, y, size: 12, font: fontBold, color: darkGreen })
  y -= 20
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: darkGreen })
  y -= 30

  drawField("Full Name", options.formData["accountHolderName"] || options.employeeName, 40, y)
  drawField("Employee ID", options.formData["employeeId"] ?? "", 320, y)
  y -= 50

  // Bank section
  page.drawText("Banking Information", { x: 40, y, size: 12, font: fontBold, color: darkGreen })
  y -= 20
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: darkGreen })
  y -= 30

  drawField("Bank Name", options.formData["bankName"] ?? "", 40, y, 500)
  y -= 50

  drawField("Account Type", options.formData["accountType"] ?? "", 40, y)
  drawField("Routing Number", options.formData["routingNumber"] ?? "", 320, y)
  y -= 50

  drawField("Account Number", options.formData["accountNumber"] ? `****${options.formData["accountNumber"].slice(-4)}` : "", 40, y, 500)
  y -= 70

  // Authorization text
  const authText =
    "I authorize my employer to initiate credit entries to the account indicated above " +
    "at the financial institution named above. I understand this authorization will remain " +
    "in effect until I notify my employer in writing to cancel it."

  page.drawText("Authorization", { x: 40, y, size: 11, font: fontBold, color: darkGreen })
  y -= 20
  page.drawText(authText, { x: 40, y, size: 9, font: fontReg, color: gray, maxWidth: width - 80, lineHeight: 14 })
  y -= 70

  // Signature area
  page.drawText("Employee Signature", { x: 40, y: y + 25, size: 9, font: fontReg, color: gray })
  page.drawLine({ start: { x: 40, y }, end: { x: 300, y }, thickness: 1, color: black })

  page.drawText("Date", { x: 360, y: y + 25, size: 9, font: fontReg, color: gray })
  page.drawLine({ start: { x: 360, y }, end: { x: 560, y }, thickness: 1, color: black })

  page.drawText(formatDate(new Date().toISOString()), {
    x: 360, y: y + 4, size: 10, font: fontReg, color: black,
  })

  if (options.signature) {
    await embedSignatureOnPage(pdfDoc, page, options.signature, 42, y + 4, 250, 45)
    await addAuditFooter(pdfDoc, page, {
      signerName: options.employeeName,
      signedAt: formatDate(new Date().toISOString()),
      signatureType: options.signature.type,
    })
  }

  const bytes = await pdfDoc.save()
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
}

// ---------------------------------------------------------------------------
// Offer Letter
// ---------------------------------------------------------------------------

async function generateOfferLetterPDF(options: GeneratePDFOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const darkGreen = rgb(0.075, 0.388, 0.204)
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)

  let y = height - 60

  // Header
  page.drawText("OFFER LETTER ACKNOWLEDGMENT", {
    x: 40, y, size: 16, font: fontBold, color: darkGreen,
  })
  y -= 30
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: darkGreen })
  y -= 30

  // Date
  page.drawText(formatDate(new Date().toISOString()), { x: 40, y, size: 10, font: fontReg, color: gray })
  y -= 40

  // Employee name
  page.drawText(`Dear ${options.employeeName},`, { x: 40, y, size: 11, font: fontBold, color: black })
  y -= 30

  // Body paragraphs
  const paragraphs = [
    "We are pleased to confirm that you have received and reviewed the offer of employment. " +
    "By signing this acknowledgment, you confirm that you have read, understood, and accept " +
    "the terms and conditions outlined in your offer letter.",

    options.formData["offerAccepted"] === "true"
      ? "You have indicated that you ACCEPT this offer of employment."
      : "Please indicate your acceptance by signing below.",

    options.formData["startDate"]
      ? `Your anticipated start date is: ${formatDate(options.formData["startDate"])}`
      : "",

    "This acknowledgment does not constitute a contract of employment. Employment is at-will " +
    "unless otherwise specified in a separate written agreement.",
  ].filter(Boolean)

  for (const para of paragraphs) {
    page.drawText(para, {
      x: 40, y, size: 10, font: fontReg, color: black, maxWidth: width - 80, lineHeight: 16,
    })
    y -= 60
  }

  y -= 40

  // Signature area
  page.drawText("Employee Signature", { x: 40, y: y + 25, size: 9, font: fontReg, color: gray })
  page.drawLine({ start: { x: 40, y }, end: { x: 300, y }, thickness: 1, color: black })

  page.drawText("Printed Name", { x: 40, y: y - 30, size: 9, font: fontReg, color: gray })
  page.drawText(options.employeeName, { x: 40, y: y - 46, size: 10, font: fontReg, color: black })
  page.drawLine({ start: { x: 40, y: y - 48 }, end: { x: 300, y: y - 48 }, thickness: 1, color: black })

  page.drawText("Date", { x: 360, y: y + 25, size: 9, font: fontReg, color: gray })
  page.drawLine({ start: { x: 360, y }, end: { x: 560, y }, thickness: 1, color: black })
  page.drawText(formatDate(new Date().toISOString()), {
    x: 360, y: y + 4, size: 10, font: fontReg, color: black,
  })

  if (options.signature) {
    await embedSignatureOnPage(pdfDoc, page, options.signature, 42, y + 4, 250, 45)
    await addAuditFooter(pdfDoc, page, {
      signerName: options.employeeName,
      signedAt: formatDate(new Date().toISOString()),
      signatureType: options.signature.type,
    })
  }

  const bytes = await pdfDoc.save()
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
}

// ---------------------------------------------------------------------------
// Generic fallback (also used by W-4 and I-9 fallbacks)
// ---------------------------------------------------------------------------

async function generateFallbackFormPDF(
  options: GeneratePDFOptions,
  title: string,
  fields: { label: string; value: string }[]
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const darkGreen = rgb(0.075, 0.388, 0.204)
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.93, 0.93, 0.93)

  let y = height - 60

  // Header
  page.drawRectangle({ x: 0, y: y - 10, width, height: 68, color: darkGreen })
  page.drawText(title.toUpperCase(), {
    x: 40, y: y + 12, size: 16, font: fontBold, color: rgb(1, 1, 1),
  })
  page.drawText(`Prepared for: ${options.employeeName}`, {
    x: 40, y: y - 6, size: 9, font: fontReg, color: rgb(0.85, 0.95, 0.87),
  })

  y -= 60

  // Fields
  for (const f of fields) {
    if (!f.value) continue

    page.drawText(f.label, { x: 40, y: y + 4, size: 8, font: fontReg, color: gray })
    page.drawRectangle({ x: 40, y: y - 20, width: width - 80, height: 22, color: lightGray })
    page.drawText(f.value, { x: 48, y: y - 13, size: 10, font: fontReg, color: black, maxWidth: width - 96 })
    y -= 42

    if (y < 160) break
  }

  y -= 20

  // Signature
  page.drawLine({ start: { x: 40, y }, end: { x: 300, y }, thickness: 1, color: black })
  page.drawText("Employee Signature", { x: 40, y: y - 14, size: 8, font: fontReg, color: gray })

  page.drawLine({ start: { x: 360, y }, end: { x: 560, y }, thickness: 1, color: black })
  page.drawText("Date", { x: 360, y: y - 14, size: 8, font: fontReg, color: gray })
  page.drawText(formatDate(new Date().toISOString()), {
    x: 360, y: y + 4, size: 10, font: fontReg, color: black,
  })

  if (options.signature) {
    await embedSignatureOnPage(pdfDoc, page, options.signature, 42, y + 4, 250, 45)
    await addAuditFooter(pdfDoc, page, {
      signerName: options.employeeName,
      signedAt: formatDate(new Date().toISOString()),
      signatureType: options.signature.type,
    })
  }

  const bytes = await pdfDoc.save()
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" })
}

async function generateGenericPDF(options: GeneratePDFOptions): Promise<Blob> {
  const fields = Object.entries(options.formData).map(([k, v]) => ({
    label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    value: v,
  }))
  return generateFallbackFormPDF(options, options.docType.toUpperCase(), fields)
}
