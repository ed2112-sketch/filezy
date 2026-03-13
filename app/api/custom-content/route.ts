import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContentType } from "@/lib/generated/prisma/client"

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

  const customContent = await db.customContent.findMany({
    where: { businessId: business.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      location: { select: { id: true, name: true } },
      _count: {
        select: { hireCustomContent: true, roleTemplateCustomContent: true },
      },
    },
  })

  return NextResponse.json({ customContent })
}

export async function POST(request: NextRequest) {
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
    locationId,
  } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const validContentTypes: ContentType[] = ["DOCUMENT", "VIDEO", "LINK", "CUSTOM_FORM"]
  if (!contentType || !validContentTypes.includes(contentType as ContentType)) {
    return NextResponse.json(
      { error: `contentType must be one of: ${validContentTypes.join(", ")}` },
      { status: 400 }
    )
  }

  // Verify locationId belongs to this business if provided
  if (locationId) {
    const location = await db.location.findUnique({ where: { id: locationId } })
    if (!location || location.businessId !== business.id) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }
  }

  const content = await db.customContent.create({
    data: {
      businessId: business.id,
      locationId: locationId ?? null,
      name: name.trim(),
      description: description?.trim() ?? null,
      contentType: contentType as ContentType,
      fileUrl: fileUrl?.trim() ?? null,
      externalUrl: externalUrl?.trim() ?? null,
      requiresSignature: Boolean(requiresSignature),
      requiresAcknowledgment: Boolean(requiresAcknowledgment),
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      isActive: true,
    },
    include: {
      location: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ customContent: content }, { status: 201 })
}
