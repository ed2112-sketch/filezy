import { db } from "@/lib/db"
import type { Plan } from "@/lib/generated/prisma/client"

export interface PlanLimits {
  includedOnboardings: number
  monthlyPriceCents: number
  overagePriceCents: number
  customContentItems: number
  roleTemplates: number
  checklistItemsPerTemplate: number
  locations: number
  adminUsers: number
  smsEnabled: boolean
  selfOnboarding: boolean
  docExpirationAlerts: boolean
  auditLog: "none" | "basic" | "full"
  complianceReport: boolean
  bulkDownload: boolean
  newHireReport: boolean
  accountantInbox: boolean
  apiAccess: boolean
  customBranding: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: {
    includedOnboardings: 0,
    monthlyPriceCents: 0,
    overagePriceCents: 300,
    customContentItems: Infinity,
    roleTemplates: Infinity,
    checklistItemsPerTemplate: Infinity,
    locations: Infinity,
    adminUsers: Infinity,
    smsEnabled: true,
    selfOnboarding: true,
    docExpirationAlerts: true,
    auditLog: "full",
    complianceReport: true,
    bulkDownload: true,
    newHireReport: true,
    accountantInbox: true,
    apiAccess: true,
    customBranding: true,
  },
  GROWTH: {
    includedOnboardings: 25,
    monthlyPriceCents: 4900,
    overagePriceCents: 200,
    customContentItems: Infinity,
    roleTemplates: Infinity,
    checklistItemsPerTemplate: Infinity,
    locations: Infinity,
    adminUsers: Infinity,
    smsEnabled: true,
    selfOnboarding: true,
    docExpirationAlerts: true,
    auditLog: "full",
    complianceReport: true,
    bulkDownload: true,
    newHireReport: true,
    accountantInbox: true,
    apiAccess: true,
    customBranding: true,
  },
  PRO: {
    includedOnboardings: 75,
    monthlyPriceCents: 9900,
    overagePriceCents: 150,
    customContentItems: Infinity,
    roleTemplates: Infinity,
    checklistItemsPerTemplate: Infinity,
    locations: Infinity,
    adminUsers: Infinity,
    smsEnabled: true,
    selfOnboarding: true,
    docExpirationAlerts: true,
    auditLog: "full",
    complianceReport: true,
    bulkDownload: true,
    newHireReport: true,
    accountantInbox: true,
    apiAccess: true,
    customBranding: true,
  },
}

export interface HireLimitResult {
  /** The business's current plan. */
  plan: Plan
  /** Number of hires created in the current billing period. */
  currentUsage: number
  /** Onboardings included in the plan for this period (0 for STARTER = pay-per-use). */
  includedOnboardings: number
  /**
   * Whether the business is within their included quota.
   * Always true for STARTER (pay-per-use — every hire is an overage by design).
   * For GROWTH/PRO, true while currentUsage < includedOnboardings.
   */
  canCreate: boolean
  /**
   * True when the business is already at or above their included quota.
   * Overage billing is handled externally via Stripe webhooks — hire creation
   * is never hard-blocked based on this flag.
   */
  isOverage: boolean
  /** Overage cost in cents per additional onboarding, if applicable. */
  overagePriceCents: number
}

/**
 * Returns usage info for the business's current billing period.
 *
 * Hire creation is NEVER blocked — this function is informational only.
 * Overage charges for GROWTH/PRO are handled by the Stripe invoice.created webhook.
 * STARTER is pure pay-per-use ($3/onboarding) so every hire is billed individually.
 */
export async function checkHireLimit(
  businessId: string,
  plan: Plan
): Promise<HireLimitResult> {
  const limits = PLAN_LIMITS[plan]

  // Fetch the billing period boundaries stored on the business record.
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { currentPeriodStart: true, currentPeriodEnd: true },
  })

  const periodStart = business?.currentPeriodStart
  const periodEnd = business?.currentPeriodEnd

  let currentUsage = 0

  if (plan === "STARTER") {
    // STARTER is pay-per-use — no quota concept. We still track all-time usage
    // so callers have the number available, but there is no period boundary.
    currentUsage = await db.hire.count({
      where: { businessId },
    })

    return {
      plan,
      currentUsage,
      includedOnboardings: 0,
      canCreate: true,   // always allowed — billed per use via Stripe
      isOverage: false,  // not meaningful for pay-per-use
      overagePriceCents: limits.overagePriceCents,
    }
  }

  // GROWTH / PRO — count hires created inside the current billing period.
  if (periodStart && periodEnd) {
    currentUsage = await db.hire.count({
      where: {
        businessId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })
  } else {
    // No billing period on record yet (e.g. subscription not yet synced from
    // Stripe). Fall back to a rolling 30-day window so usage is never zero
    // when it shouldn't be.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    currentUsage = await db.hire.count({
      where: {
        businessId,
        createdAt: { gte: thirtyDaysAgo },
      },
    })
  }

  const includedOnboardings = limits.includedOnboardings
  const isOverage = currentUsage >= includedOnboardings

  return {
    plan,
    currentUsage,
    includedOnboardings,
    canCreate: true,  // never block — overage billing is handled by Stripe
    isOverage,
    overagePriceCents: limits.overagePriceCents,
  }
}

/**
 * Returns whether the given plan has access to the specified feature.
 */
export function checkFeatureAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const value = PLAN_LIMITS[plan][feature]
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0
  // string features (e.g. auditLog): treat "none" as no access
  return value !== "none"
}
