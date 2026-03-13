import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { getResend, FROM_EMAIL, FROM_NAME } from "@/lib/resend"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email } = body

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    )
  }

  const trimmedEmail = email.trim().toLowerCase()

  const employee = await db.employee.findUnique({
    where: { email: trimmedEmail },
  })

  if (!employee) {
    // Return success even if not found to avoid email enumeration
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await db.employee.update({
    where: { id: employee.id },
    data: {
      magicLinkToken: token,
      magicLinkExpiresAt: expiresAt,
    },
  })

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/employee/verify?token=${token}`

  try {
    await getResend().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: trimmedEmail,
      subject: "Your Filezy login link",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #136334; margin-bottom: 16px;">Sign in to Filezy</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Hi${employee.name ? ` ${employee.name}` : ""},
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Click the button below to access your document portal. This link expires in 15 minutes.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #136334; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 500; font-size: 15px; margin: 24px 0;">
            Sign in to your portal
          </a>
          <p style="color: #9CA3AF; font-size: 13px; margin-top: 32px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send magic link email:", err)
  }

  return NextResponse.json({ success: true })
}
