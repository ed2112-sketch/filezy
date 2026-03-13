import { db } from "@/lib/db"
import type { Plan } from "@/lib/generated/prisma/client"

export interface PlanLimits {
  hiresPerYear: number
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
  FREE: {
    hiresPerYear: 1, customContentItems: 2, roleTemplates: 1, checklistItemsPerTemplate: 3,
    locations: 1, adminUsers: 0, smsEnabled: false, selfOnboarding: false,
    docExpirationAlerts: false, auditLog: "none", complianceReport: false,
    bulkDownload: false, newHireReport: false, accountantInbox: false,
    apiAccess: false, customBranding: false,
  },
  STARTER: {
    hiresPerYear: 10, customContentItems: 10, roleTemplates: 5, checklistItemsPerTemplate: 10,
    locations: 1, adminUsers: 2, smsEnabled: false, selfOnboarding: true,
    docExpirationAlerts: true, auditLog: "basic", complianceReport: false,
    bulkDownload: true, newHireReport: false, accountantInbox: false,
    apiAccess: false, customBranding: false,
  },
  PRO: {
    hiresPerYear: 30, customContentItems: 25, roleTemplates: 15, checklistItemsPerTemplate: 20,
    locations: 3, adminUsers: 5, smsEnabled: true, selfOnboarding: true,
    docExpirationAlerts: true, auditLog: "full", complianceReport: false,
    bulkDownload: true, newHireReport: true, accountantInbox: true,
    apiAccess: false, customBranding: false,
  },
  BUSINESS: {
    hiresPerYear: Infinity, customContentItems: Infinity, roleTemplates: Infinity,
    checklistItemsPerTemplate: Infinity, locations: Infinity, adminUsers: Infinity,
    smsEnabled: true, selfOnboarding: true, docExpirationAlerts: true,
    auditLog: "full", complianceReport: true, bulkDownload: true,
    newHireReport: true, accountantInbox: true, apiAccess: true, customBranding: true,
  },
}

export async function checkHireLimit(businessId: string, plan: Plan): Promise<boolean> {
  const limit = PLAN_LIMITS[plan].hiresPerYear
  if (limit === Infinity) return true
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const count = await db.hire.count({ where: { businessId, createdAt: { gte: yearStart } } })
  return count < limit
}

export function checkFeatureAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const value = PLAN_LIMITS[plan][feature]
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0
  if (typeof value === "string") return value !== "none"
  return false
}
