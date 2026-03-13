import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { name, email, password, businessName } = await req.json()

  if (!email || !password || !name || !businessName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
      },
    })

    const business = await tx.business.create({
      data: {
        name: businessName,
        ownerId: user.id,
      },
    })

    await tx.user.update({
      where: { id: user.id },
      data: { businessId: business.id },
    })

    await tx.location.create({
      data: {
        businessId: business.id,
        name: "Main Office",
        isDefault: true,
      },
    })

    return { user, business }
  })

  return Response.json({ success: true, userId: result.user.id })
}
