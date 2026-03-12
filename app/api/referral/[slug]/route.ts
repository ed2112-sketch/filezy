import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const referralLink = await db.referralLink.findUnique({
      where: { slug },
    })

    if (!referralLink) {
      return NextResponse.json(
        { error: "Referral link not found" },
        { status: 404 }
      )
    }

    // Increment clicks
    await db.referralLink.update({
      where: { id: referralLink.id },
      data: { clicks: { increment: 1 } },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://filezy.com"
    const redirectUrl = `${appUrl}/signup?ref=${referralLink.accountantId}`

    return NextResponse.redirect(redirectUrl, 302)
  } catch (error) {
    console.error("Referral route error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
