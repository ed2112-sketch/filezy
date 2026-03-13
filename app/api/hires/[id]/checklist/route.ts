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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const hire = await db.hire.findUnique({
    where: { id },
  })

  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  if (!hire.checklistId) {
    return NextResponse.json({ checklist: null, items: [] })
  }

  // Fetch the assigned checklist with items and each item's completion status for this hire
  const checklist = await db.onboardingChecklist.findUnique({
    where: { id: hire.checklistId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          hireChecklistItems: {
            where: { hireId: id },
          },
        },
      },
    },
  })

  if (!checklist) {
    return NextResponse.json({ checklist: null, items: [] })
  }

  const items = checklist.items.map((item) => {
    const hireItem = item.hireChecklistItems[0] ?? null
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      sortOrder: item.sortOrder,
      requiresFile: item.requiresFile,
      completed: !!hireItem?.completedAt,
      completedAt: hireItem?.completedAt ?? null,
      completedBy: hireItem?.completedBy ?? null,
      hireChecklistItemId: hireItem?.id ?? null,
    }
  })

  return NextResponse.json({
    checklist: {
      id: checklist.id,
      name: checklist.name,
      description: checklist.description,
    },
    items,
  })
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

  const hire = await db.hire.findUnique({ where: { id } })
  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  const body = await request.json()
  const { checklistItemId, completed } = body

  if (!checklistItemId || typeof checklistItemId !== "string") {
    return NextResponse.json({ error: "checklistItemId is required" }, { status: 400 })
  }

  if (typeof completed !== "boolean") {
    return NextResponse.json({ error: "completed must be a boolean" }, { status: 400 })
  }

  // Verify the checklist item belongs to this hire's checklist
  const checklistItem = await db.checklistItem.findUnique({
    where: { id: checklistItemId },
  })

  if (!checklistItem || checklistItem.checklistId !== hire.checklistId) {
    return NextResponse.json({ error: "Checklist item not found" }, { status: 404 })
  }

  const hireChecklistItem = await db.hireChecklistItem.upsert({
    where: {
      hireId_checklistItemId: {
        hireId: id,
        checklistItemId,
      },
    },
    update: {
      completedAt: completed ? new Date() : null,
      completedBy: completed ? session.user.id : null,
    },
    create: {
      hireId: id,
      checklistItemId,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? session.user.id : null,
    },
  })

  return NextResponse.json({ hireChecklistItem })
}
