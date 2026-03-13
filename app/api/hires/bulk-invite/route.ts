import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"
import { DEFAULT_TEMPLATES } from "@/lib/default-templates"
import type { WorkflowType } from "@/lib/generated/prisma/client"
import { logAudit, extractRequestInfo } from "@/lib/audit"

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBusiness: { select: { id: true, name: true, accountantEmail: true, brandLogoUrl: true, workflowType: true } },
      business: { select: { id: true, name: true, accountantEmail: true, brandLogoUrl: true, workflowType: true } },
    },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return Response.json({ error: "No business found" }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

  if (lines.length < 2) {
    return Response.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 })
  }
  if (lines.length > 501) {
    return Response.json({ error: "Maximum 500 rows per upload" }, { status: 400 })
  }

  // Parse header
  const header = parseCSVLine(lines[0].toLowerCase()).map(h => h.trim())
  const nameIdx = header.indexOf("name")
  const emailIdx = header.indexOf("email")
  const phoneIdx = header.indexOf("phone")
  const positionIdx = header.indexOf("position")

  if (nameIdx === -1 || emailIdx === -1) {
    return Response.json({ error: "CSV must have 'name' and 'email' columns" }, { status: 400 })
  }

  const results = {
    created: 0,
    failed: [] as { row: number; reason: string }[],
    skipped: 0,
  }

  // Get existing emails for dedup
  const existingHires = await db.hire.findMany({
    where: { businessId: business.id },
    select: { employeeEmail: true },
  })
  const existingEmails = new Set(
    existingHires.map(h => h.employeeEmail?.toLowerCase()).filter(Boolean)
  )

  // Get default doc types for this business's workflow (once, outside loop)
  const defaultTemplate = await db.roleTemplate.findFirst({
    where: { businessId: business.id },
    select: { docTypes: true },
  })
  const requiredDocTypes = defaultTemplate && Array.isArray(defaultTemplate.docTypes) && (defaultTemplate.docTypes as string[]).length > 0
    ? defaultTemplate.docTypes as string[]
    : DEFAULT_TEMPLATES[business.workflowType as WorkflowType].docTypes

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const name = cols[nameIdx]
    const email = cols[emailIdx]?.toLowerCase()
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : undefined
    const position = positionIdx >= 0 ? cols[positionIdx] : undefined

    if (!name || !email) {
      results.failed.push({ row: i + 1, reason: "Missing name or email" })
      continue
    }

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      results.failed.push({ row: i + 1, reason: "Invalid email address" })
      continue
    }

    if (existingEmails.has(email)) {
      results.skipped++
      continue
    }

    try {
      const hire = await db.hire.create({
        data: {
          businessId: business.id,
          employeeName: name,
          employeeEmail: email,
          employeePhone: phone || null,
          position: position || null,
          requiredDocTypes,
        },
      })

      existingEmails.add(email)
      results.created++

      const { ip, userAgent } = extractRequestInfo(req)
      logAudit({
        businessId: business.id,
        hireId: hire.id,
        action: "HIRE_CREATED",
        actorType: "ADMIN",
        actorId: session.user.id,
        ip,
        userAgent,
        metadata: { employeeName: name, position: position || undefined, source: "bulk-invite" },
      }).catch(err => console.error("Audit log failed for hire", hire.id, err))

      // Send invite email (fire and forget)
      const logoHtml = business.brandLogoUrl
        ? `<img src="${business.brandLogoUrl}" alt="${business.name}" style="max-height: 40px; max-width: 200px; object-fit: contain;" />`
        : `<strong>${business.name}</strong>`
      getResend().emails.send({
        from: `${business.name} via Filezy <noreply@filezy.com>`,
        to: email,
        subject: `${business.name} — Document upload request`,
        html: `<div style="margin-bottom: 16px;">${logoHtml}</div><p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(business.name)} has requested documents from you. Please use the link below to upload them.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}">Upload your documents</a></p><p>If you have questions, contact ${escapeHtml(business.name)} directly.</p>`,
      }).catch(err => console.error("Bulk invite email failed for", email, err))
    } catch {
      results.failed.push({ row: i + 1, reason: "Failed to create record" })
    }
  }

  return Response.json(results)
}
