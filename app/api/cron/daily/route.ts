import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend"
import { DOCUMENT_TYPES } from "@/lib/documents"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Only fetch expirations that actually need an action today
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
                include: {
                  owner: true,
                },
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
  const errors: string[] = []

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
      // Expiration-day (or past-due) alert
      if (expiresAt <= now && !exp.expirationSentAt) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: ownerEmail,
          subject: `Document Expired: ${docLabel} for ${employeeName}`,
          html: `
            <p>Hi ${business.owner.name ?? "there"},</p>
            <p>The <strong>${docLabel}</strong> for <strong>${employeeName}</strong> has expired as of ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p>
            <p>Please log in to <a href="https://app.filezy.com">Filezy</a> to request an updated document.</p>
            <p>— The Filezy Team</p>
          `,
        })
        await db.documentExpiration.update({
          where: { id: exp.id },
          data: { expirationSentAt: now },
        })
        alertsExpired++
        continue
      }

      // 7-day alert
      if (expiresAt <= in7Days && expiresAt > now && !exp.reminder7SentAt) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: ownerEmail,
          subject: `Document Expiring in ${daysUntil} Day${daysUntil === 1 ? "" : "s"}: ${docLabel} for ${employeeName}`,
          html: `
            <p>Hi ${business.owner.name ?? "there"},</p>
            <p>The <strong>${docLabel}</strong> for <strong>${employeeName}</strong> will expire in <strong>${daysUntil} day${daysUntil === 1 ? "" : "s"}</strong> on ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p>
            <p>Please log in to <a href="https://app.filezy.com">Filezy</a> to take action before it expires.</p>
            <p>— The Filezy Team</p>
          `,
        })
        await db.documentExpiration.update({
          where: { id: exp.id },
          data: { reminder7SentAt: now },
        })
        alerts7++
        continue
      }

      // 30-day alert
      if (expiresAt <= in30Days && expiresAt > now && !exp.reminder30SentAt) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: ownerEmail,
          subject: `Document Expiring in ${daysUntil} Days: ${docLabel} for ${employeeName}`,
          html: `
            <p>Hi ${business.owner.name ?? "there"},</p>
            <p>This is a heads-up that the <strong>${docLabel}</strong> for <strong>${employeeName}</strong> will expire in <strong>${daysUntil} days</strong> on ${expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p>
            <p>Log in to <a href="https://app.filezy.com">Filezy</a> to review and plan ahead.</p>
            <p>— The Filezy Team</p>
          `,
        })
        await db.documentExpiration.update({
          where: { id: exp.id },
          data: { reminder30SentAt: now },
        })
        alerts30++
      }
    } catch (err) {
      errors.push(
        `exp ${exp.id}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return NextResponse.json({
    success: true,
    processed: expirations.length,
    alerts30,
    alerts7,
    alertsExpired,
    errors,
  })
}
