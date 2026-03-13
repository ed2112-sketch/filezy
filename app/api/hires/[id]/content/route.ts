import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { HireCustomContentStatus } from "@/lib/generated/prisma/client"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hireId } = await params
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

  const hire = await db.hire.findUnique({
    where: { id: hireId },
    include: {
      roleTemplate: {
        include: {
          roleTemplateCustomContent: {
            include: { customContent: true },
          },
        },
      },
      customContent: {
        include: { customContent: true },
      },
    },
  })

  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  // Collect all content IDs already tracked on the hire
  const trackedContentIds = new Set(hire.customContent.map((hcc) => hcc.customContentId))

  // Gather content from role template that isn't yet tracked
  const roleTemplateContent =
    hire.roleTemplate?.roleTemplateCustomContent
      .filter((rtcc) => !trackedContentIds.has(rtcc.customContentId))
      .map((rtcc) => rtcc.customContent) ?? []

  // Build a unified list: existing HireCustomContent entries + untracked role-template content
  const existingEntries = hire.customContent.map((hcc) => ({
    id: hcc.id,
    customContentId: hcc.customContentId,
    customContent: hcc.customContent,
    status: hcc.status,
    viewedAt: hcc.viewedAt,
    acknowledgedAt: hcc.acknowledgedAt,
    signedAt: hcc.signedAt,
    signatureData: hcc.signatureData,
    source: "direct" as const,
  }))

  const roleTemplateEntries = roleTemplateContent
    .filter((c) => c.isActive)
    .map((c) => ({
      id: null,
      customContentId: c.id,
      customContent: c,
      status: "PENDING" as HireCustomContentStatus,
      viewedAt: null,
      acknowledgedAt: null,
      signedAt: null,
      signatureData: null,
      source: "roleTemplate" as const,
    }))

  const content = [...existingEntries, ...roleTemplateEntries].sort((a, b) => {
    return a.customContent.sortOrder - b.customContent.sortOrder
  })

  return NextResponse.json({ content })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hireId } = await params
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

  const hire = await db.hire.findUnique({ where: { id: hireId } })
  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  const body = await request.json()
  const { customContentId, status, signatureData } = body

  if (!customContentId || typeof customContentId !== "string") {
    return NextResponse.json({ error: "customContentId is required" }, { status: 400 })
  }

  const validStatuses: HireCustomContentStatus[] = ["VIEWED", "ACKNOWLEDGED", "SIGNED"]
  if (!status || !validStatuses.includes(status as HireCustomContentStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  // Verify the content belongs to this business
  const customContent = await db.customContent.findUnique({
    where: { id: customContentId },
  })
  if (!customContent || customContent.businessId !== business.id) {
    return NextResponse.json({ error: "Custom content not found" }, { status: 404 })
  }

  // Validate that SIGNED status has signatureData if content requires a signature
  if (status === "SIGNED" && customContent.requiresSignature && !signatureData) {
    return NextResponse.json(
      { error: "signatureData is required for signed status on content that requires a signature" },
      { status: 400 }
    )
  }

  // Build timestamp fields based on status
  const now = new Date()
  const dataUpdates: Record<string, unknown> = { status }

  if (status === "VIEWED") {
    dataUpdates.viewedAt = now
  } else if (status === "ACKNOWLEDGED") {
    dataUpdates.viewedAt = now
    dataUpdates.acknowledgedAt = now
  } else if (status === "SIGNED") {
    dataUpdates.viewedAt = now
    dataUpdates.signedAt = now
    if (signatureData !== undefined) {
      dataUpdates.signatureData = signatureData
    }
  }

  // Upsert the HireCustomContent record
  const hireCustomContent = await db.hireCustomContent.upsert({
    where: {
      hireId_customContentId: { hireId, customContentId },
    },
    create: {
      hireId,
      customContentId,
      status: status as HireCustomContentStatus,
      viewedAt: dataUpdates.viewedAt as Date | undefined,
      acknowledgedAt: dataUpdates.acknowledgedAt as Date | undefined,
      signedAt: dataUpdates.signedAt as Date | undefined,
      signatureData: signatureData ?? undefined,
    },
    update: dataUpdates,
    include: { customContent: true },
  })

  return NextResponse.json({ hireCustomContent })
}
