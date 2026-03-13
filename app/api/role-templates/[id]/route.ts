import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business || !user) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (user.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const template = await db.roleTemplate.findUnique({ where: { id } })
  if (!template || template.businessId !== business.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 })
    }
    updates.name = body.name.trim()
  }

  if (body.docTypes !== undefined) {
    if (!Array.isArray(body.docTypes) || body.docTypes.length === 0) {
      return NextResponse.json({ error: "At least one document type is required" }, { status: 400 })
    }
    updates.docTypes = body.docTypes
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ template })
  }

  const updated = await db.roleTemplate.update({
    where: { id },
    data: updates,
  })

  return NextResponse.json({ template: updated })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business || !user) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (user.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const template = await db.roleTemplate.findUnique({ where: { id } })
  if (!template || template.businessId !== business.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  await db.roleTemplate.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
