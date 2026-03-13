import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      { error: "Only the business owner can change roles" },
      { status: 403 }
    )
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { role } = body

  if (!role || role === UserRole.OWNER) {
    return NextResponse.json(
      { error: "Role must be ADMIN or VIEWER" },
      { status: 400 }
    )
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target || target.businessId !== business.id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  const updated = await db.user.update({
    where: { id },
    data: { role: role as UserRole },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json({ member: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      { error: "Only the business owner can remove members" },
      { status: 403 }
    )
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself" },
      { status: 400 }
    )
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target || target.businessId !== business.id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  await db.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
