import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

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

  const checklists = await db.onboardingChecklist.findMany({
    where: { businessId: business.id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ checklists })
}

export async function POST(request: Request) {
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
  const { name, items } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Checklist name is required" }, { status: 400 })
  }

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Items must be an array" }, { status: 400 })
  }

  for (const item of items) {
    if (!item.label || typeof item.label !== "string" || !item.label.trim()) {
      return NextResponse.json({ error: "Each item must have a label" }, { status: 400 })
    }
  }

  const checklist = await db.$transaction(async (tx) => {
    const created = await tx.onboardingChecklist.create({
      data: {
        businessId: business.id,
        name: name.trim(),
      },
    })

    if (items.length > 0) {
      await tx.checklistItem.createMany({
        data: items.map((item: { label: string; description?: string; order?: number }, index: number) => ({
          checklistId: created.id,
          label: item.label.trim(),
          description: item.description?.trim() ?? null,
          sortOrder: item.order ?? index,
        })),
      })
    }

    return tx.onboardingChecklist.findUnique({
      where: { id: created.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  })

  return NextResponse.json({ checklist }, { status: 201 })
}
