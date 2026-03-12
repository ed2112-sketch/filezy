import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { name, email, password, businessName } = await req.json()

  if (!email || !password || !businessName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      business: {
        create: { name: businessName },
      },
    },
  })

  return Response.json({ success: true, userId: user.id })
}
