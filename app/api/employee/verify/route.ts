import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    )
  }

  const employee = await db.employee.findUnique({
    where: { magicLinkToken: token },
  })

  if (!employee) {
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 401 }
    )
  }

  if (
    !employee.magicLinkExpiresAt ||
    employee.magicLinkExpiresAt < new Date()
  ) {
    // Clear the expired token
    await db.employee.update({
      where: { id: employee.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiresAt: null,
      },
    })
    return NextResponse.json(
      { error: "Link has expired. Please request a new one." },
      { status: 401 }
    )
  }

  // Create session (7 days)
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.employeeSession.create({
    data: {
      employeeId: employee.id,
      token: sessionToken,
      expiresAt,
    },
  })

  // Clear magic link fields
  await db.employee.update({
    where: { id: employee.id },
    data: {
      magicLinkToken: null,
      magicLinkExpiresAt: null,
    },
  })

  const response = NextResponse.json({ success: true })

  response.cookies.set("employee_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  return response
}
