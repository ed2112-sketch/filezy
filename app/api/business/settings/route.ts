import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

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

  return NextResponse.json({
    name: business.name,
    state: business.state,
    accountantName: business.accountantName,
    accountantEmail: business.accountantEmail,
    plan: business.plan,
  })
}

export async function PATCH(request: NextRequest) {
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

  const body = await request.json()
  const { name, state, accountantName, accountantEmail } = body

  if (name !== undefined && (!name || typeof name !== "string")) {
    return NextResponse.json(
      { error: "Business name is required." },
      { status: 400 }
    )
  }

  const updated = await db.business.update({
    where: { id: business.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(state !== undefined && { state: state || null }),
      ...(accountantName !== undefined && {
        accountantName: accountantName?.trim() || null,
      }),
      ...(accountantEmail !== undefined && {
        accountantEmail: accountantEmail?.trim() || null,
      }),
    },
  })

  return NextResponse.json({
    name: updated.name,
    state: updated.state,
    accountantName: updated.accountantName,
    accountantEmail: updated.accountantEmail,
    plan: updated.plan,
  })
}
