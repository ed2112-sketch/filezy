import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend, FROM_EMAIL, FROM_NAME } from "@/lib/resend"
import { DOCUMENT_TYPES } from "@/lib/documents"
import { render } from "@react-email/components"
import EmployeeReminder from "@/emails/EmployeeReminder"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const errors: string[] = []

  // ── 1. Document Expiration Alerts ──
  const { alerts30, alerts7, alertsExpired, expirationErrors } = await sendExpirationAlerts(now)
  errors.push(...expirationErrors)

  // ── 2. Employee Reminders for Incomplete Hires ──
  const { remindersSent, reminderErrors } = await sendEmployeeReminders(now)
  errors.push(...reminderErrors)

  return NextResponse.json({
    success: true,
    alerts30,
    alerts7,
    alertsExpired,
    remindersSent,
    errors,
  })
}

async function sendExpirationAlerts(now: Date) {
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const expirations = await db.documentExpiration.findMany({
    where: {
      isResolved: false,
      expiresAt: { lte: in30Days },
      OR: [
        { expirationSentAt: null, expiresAt: { lte: now } },
        { reminder7SentAt: null, expiresAt: { lte: in7Days, gt: now } },
        { reminder30SentAt: null, expiresAt: { lte: in30Days, gt: now } },
      ],
    },
    include: {
      document: {
        include: {
          hire: {
            include: {
              business: {
                include: { owner: true },
              },
            },
          },
        },
      },
    },
  })

  let alerts30 = 0
  let alerts7 = 0
  let alertsExpired = 0
  const expirationErrors: string[] = []

  for (const exp of expirations) {
    const { document } = exp
    const { hire } = document
    const { business } = hire
    const ownerEmail = business.owner?.email
    if (!ownerEmail) continue

    const docTypeKey = document.docType as keyof typeof DOCUMENT_TYPES
    const docLabel = DOCUMENT_TYPES[docTypeKey]?.label ?? document.docType
    const employeeName = hire.employeeName
    const expiresAt = exp.expiresAt
    const daysUntil = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    try {
      if (expiresAt <= now && !exp.expirationSentAt) {
        await getResend().emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: ownerEmail,
          subject: `Document Expired: ${docLabel} for ${employeeName}`,
          html: `<p>Hi ${business.owner.name ?? "there"},</p><p>The <strong>${docLabel}</strong> for <strong>${employeeName}</strong> has expired as of ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p><p>Please log in to <a href="${process.env.NEXT_PUBLIC_APP_URL}">Filezy</a> to request an updated document.</p>`,
        })
        await db.documentExpiration.update({
          where: { id: exp.id },
          data: { expirationSentAt: now },
        })
        alertsExpired++
      } else if (expiresAt <= in7Days && expiresAt > now && !exp.reminder7SentAt) {
        await getResend().emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: ownerEmail,
          subject: `Document Expiring in ${daysUntil} Day${daysUntil === 1 ? "" : "s"}: ${docLabel} for ${employeeName}`,
          html: `<p>Hi ${business.owner.name ?? "there"},</p><p>The <strong>${docLabel}</strong> for <strong>${employeeName}</strong> will expire in <strong>${daysUntil} day${daysUntil === 1 ? "" : "s"}</strong> on ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p><p>Please log in to <a href="${process.env.NEXT_PUBLIC_APP_URL}">Filezy</a> to take action before it expires.</p>`,
        })
        await db.documentExpiration.update({
          where: { id: exp.id },
          data: { reminder7SentAt: now },
        })
        alerts7++
      } else if (expiresAt <= in30Days && expiresAt > now && !exp.reminder30SentAt) {
        await getResend().emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: ownerEmail,
          subject: `Document Expiring in ${daysUntil} Days: ${docLabel} for ${employeeName}`,
          html: `<p>Hi ${business.owner.name ?? "there"},</p><p>The <strong>${docLabel}</strong> for <strong>${employeeName}</strong> will expire in <strong>${daysUntil} days</strong> on ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p><p>Log in to <a href="${process.env.NEXT_PUBLIC_APP_URL}">Filezy</a> to review and plan ahead.</p>`,
        })
        await db.documentExpiration.update({
          where: { id: exp.id },
          data: { reminder30SentAt: now },
        })
        alerts30++
      }
    } catch (err) {
      expirationErrors.push(
        `exp ${exp.id}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return { alerts30, alerts7, alertsExpired, expirationErrors }
}

async function sendEmployeeReminders(now: Date) {
  let remindersSent = 0
  const reminderErrors: string[] = []

  // Find incomplete hires that need reminders
  const hires = await db.hire.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      employeeEmail: { not: null },
      tokenExpiresAt: { gt: now },
    },
    include: {
      business: { select: { name: true, reminderDay1: true, reminderDay2: true, reminderDay3: true } },
      documents: { where: { currentVersionId: { not: null } }, select: { docType: true } },
    },
  })

  for (const hire of hires) {
    const daysSinceCreated = Math.floor(
      (now.getTime() - hire.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const { reminderDay1, reminderDay2, reminderDay3 } = hire.business

    // Determine which reminder to send
    let shouldSend = false
    let reminderField: "reminder1SentAt" | "reminder2SentAt" | "reminder3SentAt" | null = null

    if (daysSinceCreated >= reminderDay3 && !hire.reminder3SentAt) {
      shouldSend = true
      reminderField = "reminder3SentAt"
    } else if (daysSinceCreated >= reminderDay2 && !hire.reminder2SentAt) {
      shouldSend = true
      reminderField = "reminder2SentAt"
    } else if (daysSinceCreated >= reminderDay1 && !hire.reminder1SentAt) {
      shouldSend = true
      reminderField = "reminder1SentAt"
    }

    if (!shouldSend || !reminderField || !hire.employeeEmail) continue

    // Build remaining docs list
    const uploadedTypes = new Set(hire.documents.map((d) => d.docType))
    const requiredDocs = Array.isArray(hire.requiredDocTypes) && (hire.requiredDocTypes as string[]).length > 0
      ? hire.requiredDocTypes as string[]
      : ["W4", "I9", "DIRECT_DEPOSIT", "OFFER_LETTER"]

    const remainingDocs = requiredDocs
      .filter((t) => !uploadedTypes.has(t))
      .map((t) => {
        const docTypeKey = t as keyof typeof DOCUMENT_TYPES
        return DOCUMENT_TYPES[docTypeKey]?.label ?? t
      })

    if (remainingDocs.length === 0) continue

    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}`

    try {
      const html = await render(EmployeeReminder({
        employeeName: hire.employeeName,
        businessName: hire.business.name,
        uploadUrl,
        completionPct: hire.completionPct,
        remainingDocs,
      }))

      await getResend().emails.send({
        from: `${hire.business.name} via Filezy <noreply@filezy.com>`,
        to: hire.employeeEmail,
        subject: `Reminder: ${hire.business.name} is waiting on your documents`,
        html,
      })

      await db.hire.update({
        where: { id: hire.id },
        data: { [reminderField]: now },
      })

      remindersSent++
    } catch (err) {
      reminderErrors.push(
        `hire ${hire.id}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return { remindersSent, reminderErrors }
}
