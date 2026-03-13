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

  const checklist = await db.onboardingChecklist.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!checklist || checklist.businessId !== business.id) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 })
  }

  return NextResponse.json({ checklist })
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

  const checklist = await db.onboardingChecklist.findUnique({ where: { id } })
  if (!checklist || checklist.businessId !== business.id) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 })
  }

  const body = await request.json()
  const { name, items } = body

  // Validate before entering the transaction
  if (name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Checklist name cannot be empty" }, { status: 400 })
    }
  }

  if (items !== undefined) {
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items must be an array" }, { status: 400 })
    }
    for (const item of items) {
      if (!item.label || typeof item.label !== "string" || !item.label.trim()) {
        return NextResponse.json({ error: "Each item must have a label" }, { status: 400 })
      }
    }
  }

  const updated = await db.$transaction(async (tx) => {
    if (name !== undefined) {
      await tx.onboardingChecklist.update({
        where: { id },
        data: { name: name.trim() },
      })
    }

    if (items !== undefined) {
      // Delete all existing items and recreate — handles add/remove/reorder
      await tx.checklistItem.deleteMany({ where: { checklistId: id } })

      if (items.length > 0) {
        await tx.checklistItem.createMany({
          data: items.map(
            (
              item: { label: string; description?: string; order?: number },
              index: number
            ) => ({
              checklistId: id,
              label: item.label.trim(),
              description: item.description?.trim() ?? null,
              sortOrder: item.order ?? index,
            })
          ),
        })
      }
    }

    return tx.onboardingChecklist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  })

  return NextResponse.json({ checklist: updated })
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

  const checklist = await db.onboardingChecklist.findUnique({ where: { id } })
  if (!checklist || checklist.businessId !== business.id) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 })
  }

  // Cascade deletes ChecklistItems (and their HireChecklistItems) via schema onDelete: Cascade
  await db.onboardingChecklist.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
