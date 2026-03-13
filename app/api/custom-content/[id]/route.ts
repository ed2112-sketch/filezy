import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContentType } from "@/lib/generated/prisma/client"

export async function GET(
  _request: NextRequest,
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
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const content = await db.customContent.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true } },
      _count: {
        select: { hireCustomContent: true, roleTemplateCustomContent: true },
      },
    },
  })

  if (!content || content.businessId !== business.id) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  return NextResponse.json({ customContent: content })
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

  const existing = await db.customContent.findUnique({ where: { id } })
  if (!existing || existing.businessId !== business.id) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  const body = await request.json()
  const {
    name,
    description,
    contentType,
    fileUrl,
    externalUrl,
    requiresSignature,
    requiresAcknowledgment,
    sortOrder,
    isActive,
    locationId,
  } = body

  const updates: Record<string, unknown> = {}

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }
    updates.name = name.trim()
  }

  if (description !== undefined) updates.description = description?.trim() ?? null
  if (fileUrl !== undefined) updates.fileUrl = fileUrl?.trim() ?? null
  if (externalUrl !== undefined) updates.externalUrl = externalUrl?.trim() ?? null
  if (requiresSignature !== undefined) updates.requiresSignature = Boolean(requiresSignature)
  if (requiresAcknowledgment !== undefined) updates.requiresAcknowledgment = Boolean(requiresAcknowledgment)
  if (typeof sortOrder === "number") updates.sortOrder = sortOrder
  if (typeof isActive === "boolean") updates.isActive = isActive

  if (contentType !== undefined) {
    const validContentTypes: ContentType[] = ["DOCUMENT", "VIDEO", "LINK", "CUSTOM_FORM"]
    if (!validContentTypes.includes(contentType as ContentType)) {
      return NextResponse.json(
        { error: `contentType must be one of: ${validContentTypes.join(", ")}` },
        { status: 400 }
      )
    }
    updates.contentType = contentType as ContentType
  }

  if (locationId !== undefined) {
    if (locationId === null) {
      updates.locationId = null
    } else {
      const location = await db.location.findUnique({ where: { id: locationId } })
      if (!location || location.businessId !== business.id) {
        return NextResponse.json({ error: "Location not found" }, { status: 404 })
      }
      updates.locationId = locationId
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ customContent: existing })
  }

  const updated = await db.customContent.update({
    where: { id },
    data: updates,
    include: {
      location: { select: { id: true, name: true } },
      _count: {
        select: { hireCustomContent: true, roleTemplateCustomContent: true },
      },
    },
  })

  return NextResponse.json({ customContent: updated })
}

export async function DELETE(
  _request: NextRequest,
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

  const existing = await db.customContent.findUnique({ where: { id } })
  if (!existing || existing.businessId !== business.id) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  await db.customContent.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
