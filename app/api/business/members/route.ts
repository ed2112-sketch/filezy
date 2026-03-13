import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const [owner, members] = await Promise.all([
    db.user.findUnique({
      where: { id: business.ownerId },
      select: { id: true, name: true, email: true, role: true },
    }),
    db.user.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, email: true, role: true },
    }),
  ])

  return NextResponse.json({ owner, members })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = currentUser?.ownedBusiness ?? currentUser?.business
  if (!business || !currentUser) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (currentUser.role !== UserRole.OWNER) {
    return NextResponse.json(
      { error: "Only the business owner can invite team members" },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { email, name, password, role } = body

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    )
  }

  if (!role || role === UserRole.OWNER) {
    return NextResponse.json(
      { error: "Role must be ADMIN or VIEWER" },
      { status: 400 }
    )
  }

  if (role !== UserRole.ADMIN && role !== UserRole.VIEWER) {
    return NextResponse.json(
      { error: "Role must be ADMIN or VIEWER" },
      { status: 400 }
    )
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const member = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role as UserRole,
      businessId: business.id,
    },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json({ member }, { status: 201 })
}
