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

  const templates = await db.roleTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ templates })
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
  const { name, docTypes } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 })
  }

  if (!Array.isArray(docTypes) || docTypes.length === 0) {
    return NextResponse.json({ error: "At least one document type is required" }, { status: 400 })
  }

  const template = await db.roleTemplate.create({
    data: {
      businessId: business.id,
      name: name.trim(),
      docTypes,
    },
  })

  return NextResponse.json({ template }, { status: 201 })
}
