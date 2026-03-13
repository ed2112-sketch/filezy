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

export async function checkHireLimit(_businessId: string, _plan: Plan): Promise<boolean> {
  return true
}

export function checkFeatureAccess(_plan: Plan, _feature: keyof PlanLimits): boolean {
  return true
}
