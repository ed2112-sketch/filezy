import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"
import { NextResponse } from "next/server"

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

  const locations = await db.location.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ locations })
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
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (user.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const limit = PLAN_LIMITS[business.plan].locations
  if (limit !== Infinity) {
    const count = await db.location.count({ where: { businessId: business.id } })
    if (count >= limit) {
      return NextResponse.json(
        { error: `Your plan allows a maximum of ${limit} location(s). Upgrade to add more.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { name, address, city, state, zip, phone, stateEIN } = body

  if (!name) {
    return NextResponse.json({ error: "Location name is required" }, { status: 400 })
  }

  const existingCount = await db.location.count({ where: { businessId: business.id } })
  const isDefault = existingCount === 0

  const location = await db.location.create({
    data: {
      businessId: business.id,
      name,
      address: address ?? null,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,
      phone: phone ?? null,
      stateEIN: stateEIN ?? null,
      isDefault,
    },
  })

  return NextResponse.json({ location }, { status: 201 })
}
