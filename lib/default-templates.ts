import type { WorkflowType } from "@/lib/generated/prisma/client"

export const DEFAULT_TEMPLATES: Record<WorkflowType, {
  name: string
  docTypes: string[]
}> = {
  EMPLOYER: {
    name: "Standard New Hire",
    docTypes: ["W4", "I9", "DIRECT_DEPOSIT", "OFFER_LETTER", "STATE_TAX", "HANDBOOK", "EMERGENCY_CONTACT"],
  },
  ACCOUNTANT: {
    name: "New Client Setup",
    docTypes: ["W9", "EIN_LETTER", "BANK_DETAILS", "PRIOR_PAYROLL", "EMPLOYEE_CENSUS"],
  },
  STAFFING_AGENCY: {
    name: "Worker Onboarding",
    docTypes: ["W4", "I9", "DIRECT_DEPOSIT", "ASSIGNMENT_AGREEMENT", "BACKGROUND_CHECK", "DRUG_TEST_CONSENT", "EMERGENCY_CONTACT", "CERTIFICATION"],
  },
}
