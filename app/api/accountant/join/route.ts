import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, firmName, slug } = body as {
      name?: string
      email?: string
      firmName?: string
      slug?: string
    }

    // Validate required fields
    if (!name || !email || !slug) {
      return NextResponse.json(
        { error: "Name, email, and slug are required" },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Validate slug is URL-safe
    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug must be 3-30 characters, lowercase letters, numbers, and hyphens only",
        },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existingLink = await db.referralLink.findUnique({
      where: { slug },
    })
    if (existingLink) {
      return NextResponse.json(
        { error: "This referral slug is already taken" },
        { status: 409 }
      )
    }

    // Check if email already registered
    const existingAccountant = await db.accountant.findUnique({
      where: { email },
    })
    if (existingAccountant) {
      return NextResponse.json(
        { error: "An accountant with this email already exists" },
        { status: 409 }
      )
    }

    // Check if user is authenticated to link the account
    const session = await auth()
    const userId = session?.user?.id ?? null

    // Create accountant + referral link in a transaction
    const accountant = await db.$transaction(async (tx) => {
      const acct = await tx.accountant.create({
        data: {
          email,
          name,
          firmName: firmName || null,
          userId,
          joinedAt: new Date(),
          referralLink: {
            create: { slug },
          },
        },
        include: { referralLink: true },
      })
      return acct
    })

    return NextResponse.json(
      {
        success: true,
        accountantId: accountant.id,
        referralSlug: accountant.referralLink?.slug,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Accountant join error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
