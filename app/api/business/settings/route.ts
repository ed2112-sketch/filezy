import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  return NextResponse.json({
    name: business.name,
    state: business.state,
    accountantName: business.accountantName,
    accountantEmail: business.accountantEmail,
    plan: business.plan,
    brandLogoUrl: business.brandLogoUrl,
    brandPrimaryColor: business.brandPrimaryColor,
    brandAccentColor: business.brandAccentColor,
  })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const body = await request.json()
  const {
    name,
    state,
    accountantName,
    accountantEmail,
    brandPrimaryColor,
    brandAccentColor,
    selfOnboardingEnabled,
    selfOnboardingSlug,
    smsEnabled,
    reminderDay1,
    reminderDay2,
    reminderDay3,
    defaultRoleTemplateId,
  } = body

  if (name !== undefined && (!name || typeof name !== "string")) {
    return NextResponse.json(
      { error: "Business name is required." },
      { status: 400 }
    )
  }

  const hexColorRegex = /^#[0-9a-fA-F]{6}$/

  if (brandPrimaryColor !== undefined && brandPrimaryColor !== null && brandPrimaryColor !== "" && !hexColorRegex.test(brandPrimaryColor)) {
    return NextResponse.json(
      { error: "Invalid primary color format. Use a 6-digit hex color (e.g. #136334)." },
      { status: 400 }
    )
  }

  if (brandAccentColor !== undefined && brandAccentColor !== null && brandAccentColor !== "" && !hexColorRegex.test(brandAccentColor)) {
    return NextResponse.json(
      { error: "Invalid accent color format. Use a 6-digit hex color (e.g. #36c973)." },
      { status: 400 }
    )
  }

  const urlSafeSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  if (selfOnboardingSlug !== undefined && selfOnboardingSlug !== null && selfOnboardingSlug !== "" && !urlSafeSlugRegex.test(selfOnboardingSlug)) {
    return NextResponse.json(
      { error: "Invalid self-onboarding slug. Use only lowercase letters, numbers, and hyphens (e.g. my-business)." },
      { status: 400 }
    )
  }

  if (reminderDay1 !== undefined && (!Number.isInteger(reminderDay1) || reminderDay1 < 1)) {
    return NextResponse.json(
      { error: "reminderDay1 must be a positive integer." },
      { status: 400 }
    )
  }

  if (reminderDay2 !== undefined && (!Number.isInteger(reminderDay2) || reminderDay2 < 1)) {
    return NextResponse.json(
      { error: "reminderDay2 must be a positive integer." },
      { status: 400 }
    )
  }

  if (reminderDay3 !== undefined && (!Number.isInteger(reminderDay3) || reminderDay3 < 1)) {
    return NextResponse.json(
      { error: "reminderDay3 must be a positive integer." },
      { status: 400 }
    )
  }

  const updated = await db.business.update({
    where: { id: business.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(state !== undefined && { state: state || null }),
      ...(accountantName !== undefined && {
        accountantName: accountantName?.trim() || null,
      }),
      ...(accountantEmail !== undefined && {
        accountantEmail: accountantEmail?.trim() || null,
      }),
      ...(brandPrimaryColor !== undefined && {
        brandPrimaryColor: brandPrimaryColor || null,
      }),
      ...(brandAccentColor !== undefined && {
        brandAccentColor: brandAccentColor || null,
      }),
      ...(selfOnboardingEnabled !== undefined && {
        selfOnboardingEnabled: Boolean(selfOnboardingEnabled),
      }),
      ...(selfOnboardingSlug !== undefined && {
        selfOnboardingSlug: selfOnboardingSlug || null,
      }),
      ...(smsEnabled !== undefined && {
        smsEnabled: Boolean(smsEnabled),
      }),
      ...(reminderDay1 !== undefined && { reminderDay1 }),
      ...(reminderDay2 !== undefined && { reminderDay2 }),
      ...(reminderDay3 !== undefined && { reminderDay3 }),
      ...(defaultRoleTemplateId !== undefined && {
        defaultRoleTemplateId: defaultRoleTemplateId || null,
      }),
    },
  })

  return NextResponse.json({
    name: updated.name,
    state: updated.state,
    accountantName: updated.accountantName,
    accountantEmail: updated.accountantEmail,
    plan: updated.plan,
    brandLogoUrl: updated.brandLogoUrl,
    brandPrimaryColor: updated.brandPrimaryColor,
    brandAccentColor: updated.brandAccentColor,
    selfOnboardingEnabled: updated.selfOnboardingEnabled,
    selfOnboardingSlug: updated.selfOnboardingSlug,
    smsEnabled: updated.smsEnabled,
    reminderDay1: updated.reminderDay1,
    reminderDay2: updated.reminderDay2,
    reminderDay3: updated.reminderDay3,
    defaultRoleTemplateId: updated.defaultRoleTemplateId,
  })
}
