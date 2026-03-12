import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkHireLimit } from "@/lib/plans"

export async function GET() {
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

  const hires = await db.hire.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: { documents: true },
  })

  return NextResponse.json(hires)
}

export async function POST(request: NextRequest) {
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

  // Check plan limits
  const withinLimit = await checkHireLimit(business.id, business.plan)
  if (!withinLimit) {
    return NextResponse.json(
      {
        error:
          "You've reached your plan's hire limit. Please upgrade to add more hires.",
      },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { employeeName, employeeEmail, employeePhone, position, startDate } =
    body

  if (!employeeName || typeof employeeName !== "string") {
    return NextResponse.json(
      { error: "Employee name is required." },
      { status: 400 }
    )
  }

  const hire = await db.hire.create({
    data: {
      businessId: business.id,
      employeeName: employeeName.trim(),
      employeeEmail: employeeEmail?.trim() || null,
      employeePhone: employeePhone?.trim() || null,
      position: position?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
    },
  })

  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}`

  return NextResponse.json({ hire, uploadUrl }, { status: 201 })
}
