import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"

export async function recordOnboardingUsage(hireId: string, businessId: string) {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { plan: true, stripeCustomerId: true, currentPeriodStart: true, currentPeriodEnd: true },
  })
  if (!business) return

  const now = new Date()
  const periodStart = business.currentPeriodStart ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = business.currentPeriodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Check if already recorded
  const existing = await db.onboardingUsage.findUnique({ where: { hireId } })
  if (existing) return

  // Count existing usage this period
  const periodCount = await db.onboardingUsage.count({
    where: {
      businessId,
      completedAt: { gte: periodStart, lte: periodEnd },
    },
  })

  const limits = PLAN_LIMITS[business.plan]
  const included = limits.includedOnboardings
  const isOverage = business.plan === "STARTER" || periodCount >= included
  const chargeCents = isOverage ? limits.overagePriceCents : 0

  await db.onboardingUsage.create({
    data: {
      businessId,
      hireId,
      completedAt: now,
      periodStart,
      periodEnd,
      chargedCents: chargeCents > 0 ? chargeCents : null,
    },
  })
}
