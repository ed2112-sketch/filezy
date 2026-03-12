import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const hire = await db.hire.findUnique({
    where: { id },
    include: { documents: true },
  })

  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  return NextResponse.json(hire)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const hire = await db.hire.findUnique({
    where: { id },
  })

  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  const body = await request.json()

  // Handle special actions
  if (body.action === "resend_invite") {
    // TODO: Send email/SMS to employee with upload link
    return NextResponse.json({ success: true, message: "Invite resent" })
  }

  if (body.action === "notify_accountant") {
    if (!business.accountantEmail) {
      return NextResponse.json(
        { error: "No accountant email configured. Add one in Settings." },
        { status: 400 }
      )
    }

    // TODO: Send email to accountant with completed documents
    await db.hire.update({
      where: { id },
      data: { accountantNotifiedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: "Accountant notified",
    })
  }

  // Generic field updates
  const allowedFields = [
    "employeeName",
    "employeeEmail",
    "employeePhone",
    "position",
    "startDate",
  ] as const

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "startDate") {
        updates[field] = body[field] ? new Date(body[field]) : null
      } else {
        updates[field] = body[field]?.trim() || null
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(hire)
  }

  const updated = await db.hire.update({
    where: { id },
    data: updates,
    include: { documents: true },
  })

  return NextResponse.json(updated)
}
