import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("employee_session")?.value

  if (sessionToken) {
    await db.employeeSession.deleteMany({
      where: { token: sessionToken },
    })
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set("employee_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })

  return response
}
