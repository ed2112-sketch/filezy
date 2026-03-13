import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"
import { UserRole } from "@/lib/generated/prisma/client"
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

  const [owner, members] = await Promise.all([
    db.user.findUnique({
      where: { id: business.ownerId },
      select: { id: true, name: true, email: true, image: true, role: true },
    }),
    db.user.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        userLocations: {
          select: {
            locationId: true,
            location: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ])

  return NextResponse.json({ owner, members })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = currentUser?.ownedBusiness ?? currentUser?.business
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (currentUser.role !== UserRole.OWNER) {
    return NextResponse.json({ error: "Only the business owner can invite team members" }, { status: 403 })
  }

  const body = await request.json()
  const { email, role, locationIds } = body

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  if (!role || role === UserRole.OWNER) {
    return NextResponse.json(
      { error: "Role must be ADMIN or VIEWER" },
      { status: 400 }
    )
  }

  if (role !== UserRole.ADMIN && role !== UserRole.VIEWER) {
    return NextResponse.json(
      { error: "Role must be ADMIN or VIEWER" },
      { status: 400 }
    )
  }

  const limit = PLAN_LIMITS[business.plan].adminUsers
  if (limit !== Infinity) {
    const memberCount = await db.user.count({ where: { businessId: business.id } })
    if (memberCount >= limit) {
      return NextResponse.json(
        { error: `Your plan allows a maximum of ${limit} admin user(s). Upgrade to add more.` },
        { status: 403 }
      )
    }
  }

  const member = await db.user.upsert({
    where: { email },
    create: {
      email,
      role: role as UserRole,
      businessId: business.id,
    },
    update: {
      role: role as UserRole,
      businessId: business.id,
    },
  })

  if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
    await db.userLocation.createMany({
      data: locationIds.map((locationId: string) => ({
        userId: member.id,
        locationId,
      })),
      skipDuplicates: true,
    })
  }

  const memberWithLocations = await db.user.findUnique({
    where: { id: member.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      userLocations: {
        select: {
          locationId: true,
          location: { select: { id: true, name: true } },
        },
      },
    },
  })

  return NextResponse.json({ member: memberWithLocations }, { status: 201 })
}
