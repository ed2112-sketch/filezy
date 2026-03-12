import { db } from "@/lib/db"
import type { Plan } from "@/lib/generated/prisma/client"

export const PLAN_LIMITS = {
  FREE: { hiresPerYear: 1, customDocs: false, sms: false },
  STARTER: { hiresPerYear: 10, customDocs: false, sms: false },
  GROWTH: { hiresPerYear: Infinity, customDocs: true, sms: true },
}

export async function checkHireLimit(
  businessId: string,
  plan: Plan
): Promise<boolean> {
  const limit = PLAN_LIMITS[plan].hiresPerYear
  if (limit === Infinity) return true

  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const count = await db.hire.count({
    where: { businessId, createdAt: { gte: yearStart } },
  })
  return count < limit
}
