import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return Response.json({ error: "No business" }, { status: 404 })
  }

  const now = new Date()
  const periodStart = business.currentPeriodStart ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = business.currentPeriodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const usageCount = await db.onboardingUsage.count({
    where: {
      businessId: business.id,
      completedAt: { gte: periodStart, lte: periodEnd },
    },
  })

  const limits = PLAN_LIMITS[business.plan]
  const included = limits.includedOnboardings
  const overageCount = Math.max(0, usageCount - included)
  const overageCents = overageCount * limits.overagePriceCents

  return Response.json({
    plan: business.plan,
    periodStart,
    periodEnd,
    usageCount,
    included,
    overageCount,
    overageCents,
  })
}
