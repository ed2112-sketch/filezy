import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib"
import type { SignatureData } from "./types"

/**
 * Embed a signature (typed or drawn) onto a PDF page at the given coordinates.
 * maxWidth / maxHeight constrain drawn signatures; typed signatures use a fixed font size.
 */
export async function embedSignatureOnPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  signatureData: SignatureData,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<void> {
  if (signatureData.type === "typed") {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = Math.min(maxHeight * 0.6, 28)
    page.drawText(signatureData.value, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0.55),
    })
  } else {
    // drawn — base64 PNG
    const base64Data = signatureData.value.replace(/^data:image\/png;base64,/, "")
    const pngBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
    const pngImage = await pdfDoc.embedPng(pngBytes)

    const { width: imgW, height: imgH } = pngImage.scale(1)
    const scaleW = maxWidth / imgW
    const scaleH = maxHeight / imgH
    const scale = Math.min(scaleW, scaleH, 1)

    const drawW = imgW * scale
    const drawH = imgH * scale

    page.drawImage(pngImage, {
      x,
      y,
      width: drawW,
      height: drawH,
    })
  }
}

/**
 * Add a small audit footer at the bottom of the page.
 * Text: "Electronically signed by [name] on [date] via [type] signature — Filezy"
 */
export async function addAuditFooter(
  pdfDoc: PDFDocument,
  page: PDFPage,
  metadata: {
    signerName: string
    signedAt: string
    signatureType: string
  }
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { width } = page.getSize()

  const text = `Electronically signed by ${metadata.signerName} on ${metadata.signedAt} via ${metadata.signatureType} signature — Filezy`

  page.drawText(text, {
    x: 40,
    y: 18,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
    maxWidth: width - 80,
  })
}
