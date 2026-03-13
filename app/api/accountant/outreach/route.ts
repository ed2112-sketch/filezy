import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResend, FROM_EMAIL, FROM_NAME } from "@/lib/resend"
import { render } from "@react-email/components"
import AccountantOutreach1 from "@/emails/AccountantOutreach1"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, triggeredByBusinessId } = body as {
      email?: string
      triggeredByBusinessId?: string
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if accountant already exists and is a partner
    const existingAccountant = await db.accountant.findUnique({
      where: { email },
    })
    if (existingAccountant?.joinedAt) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Accountant is already a partner",
      })
    }

    // Check for existing outreach sequence
    const existingOutreach = await db.accountantOutreach.findUnique({
      where: { email },
    })

    if (existingOutreach) {
      // Skip if terminal status
      if (
        ["CONVERTED", "EXHAUSTED", "OPTED_OUT"].includes(
          existingOutreach.status
        )
      ) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: `Outreach already in ${existingOutreach.status} status`,
        })
      }

      // Already in progress
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Outreach already in progress",
      })
    }

    // Create new outreach record
    // Link to existing accountant record if found
    const outreach = await db.accountantOutreach.create({
      data: {
        email,
        accountantId: existingAccountant?.id ?? null,
        triggeredByBusinessId: triggeredByBusinessId ?? null,
        emailsSent: 1,
        status: "IN_PROGRESS",
        nextEmailAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
    })

    // Send Email 1 immediately (fire and forget)
    const businessName = outreach.triggeredByBusinessId
      ? (await db.business.findUnique({ where: { id: outreach.triggeredByBusinessId }, select: { name: true } }))?.name ?? "A Filezy client"
      : "A Filezy client"
    render(AccountantOutreach1({ accountantEmail: email, businessName })).then((html) => {
      getResend().emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email,
        subject: `${businessName} just used Filezy — and listed you as their accountant`,
        html,
      })
    }).catch((err) => console.error("Accountant outreach email 1 failed:", err))

    return NextResponse.json(
      {
        success: true,
        outreachId: outreach.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Outreach error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
