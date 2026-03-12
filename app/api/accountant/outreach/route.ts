import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

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

    // TODO: Send Email 1 immediately via Resend
    // For now, just the record creation serves as the queue

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
