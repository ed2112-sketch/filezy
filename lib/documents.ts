export const REQUIRED_DOC_TYPES = [
  "W4",
  "I9",
  "DIRECT_DEPOSIT",
  "OFFER_LETTER",
] as const
export type RequiredDocType = (typeof REQUIRED_DOC_TYPES)[number]

export const DOCUMENT_TYPES = {
  W4: {
    id: "W4",
    label: "W-4 Federal Tax Form",
    description: "Employee's Withholding Certificate",
    required: true,
    instructions:
      "Complete and sign the W-4 form. If you're unsure, the default settings work for most people.",
    acceptedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/heic",
    ],
  },
  I9: {
    id: "I9",
    label: "I-9 Identity Verification",
    description: "Photo of your government-issued ID",
    required: true,
    instructions:
      "Upload a photo of your driver's license AND Social Security card — or just your passport.",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/heic",
      "application/pdf",
    ],
    multipleFiles: true,
  },
  DIRECT_DEPOSIT: {
    id: "DIRECT_DEPOSIT",
    label: "Direct Deposit",
    description: "Voided check or bank account details",
    required: true,
    instructions:
      "Take a photo of a voided check, or write your routing and account numbers on paper and photograph it.",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/heic",
      "application/pdf",
    ],
  },
  OFFER_LETTER: {
    id: "OFFER_LETTER",
    label: "Signed Offer Letter",
    description: "Your signed employment offer",
    required: true,
    instructions:
      "Sign the offer letter your employer sent you and upload it here.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  STATE_TAX: {
    id: "STATE_TAX",
    label: "State Tax Form",
    description: "State withholding form",
    required: false,
    instructions:
      "Your employer may require a state tax withholding form.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  HANDBOOK: {
    id: "HANDBOOK",
    label: "Handbook Acknowledgment",
    description: "Signed employee handbook receipt",
    required: false,
    instructions:
      "Sign and upload your acknowledgment of receiving the employee handbook.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  W9: {
    id: "W9",
    label: "W-9 Request for Taxpayer ID",
    description: "Taxpayer identification number and certification",
    required: false,
    instructions: "Complete and sign the W-9 form with your taxpayer identification information.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
  },
  EIN_LETTER: {
    id: "EIN_LETTER",
    label: "EIN Confirmation Letter",
    description: "IRS EIN confirmation letter",
    required: false,
    instructions: "Upload your IRS EIN confirmation letter (CP 575 or 147C).",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  BANK_DETAILS: {
    id: "BANK_DETAILS",
    label: "Bank Account Information",
    description: "Business bank account details",
    required: false,
    instructions: "Upload a voided check or bank letter showing your account details.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
  },
  PRIOR_PAYROLL: {
    id: "PRIOR_PAYROLL",
    label: "Prior Payroll Records",
    description: "Previous payroll provider records",
    required: false,
    instructions: "Upload your most recent payroll reports from your previous provider.",
    acceptedMimeTypes: ["application/pdf"],
  },
  CONTRACTOR_1099: {
    id: "CONTRACTOR_1099",
    label: "1099 Contractor Setup",
    description: "Independent contractor onboarding packet",
    required: false,
    instructions: "Complete the contractor information form for 1099 reporting.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  BACKGROUND_CHECK: {
    id: "BACKGROUND_CHECK",
    label: "Background Check Authorization",
    description: "Consent for background screening",
    required: false,
    instructions: "Review and sign the background check authorization form.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  DRUG_TEST_CONSENT: {
    id: "DRUG_TEST_CONSENT",
    label: "Drug Test Consent",
    description: "Authorization for drug testing",
    required: false,
    instructions: "Review and sign the drug test consent form.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  EMPLOYEE_CENSUS: {
    id: "EMPLOYEE_CENSUS",
    label: "Employee Census Data",
    description: "Employee information for benefits enrollment",
    required: false,
    instructions: "Provide employee details including name, date of birth, and salary information.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  STATE_TAX_REG: {
    id: "STATE_TAX_REG",
    label: "State Tax Registration",
    description: "State tax registration documents",
    required: false,
    instructions: "Upload your state tax registration or withholding account documents.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  EMERGENCY_CONTACT: {
    id: "EMERGENCY_CONTACT",
    label: "Emergency Contact Information",
    description: "Emergency contact details",
    required: false,
    instructions: "Provide your emergency contact information.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  CERTIFICATION: {
    id: "CERTIFICATION",
    label: "Professional Certification",
    description: "Professional license or certification",
    required: false,
    instructions: "Upload your professional certification or license.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
  },
  ASSIGNMENT_AGREEMENT: {
    id: "ASSIGNMENT_AGREEMENT",
    label: "Assignment Agreement",
    description: "Work assignment or placement agreement",
    required: false,
    instructions: "Review and sign your assignment agreement.",
    acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
} as const

export function calculateCompletionPct(uploadedDocTypes: string[], requiredDocTypes?: string[]): number {
  const required = requiredDocTypes && requiredDocTypes.length > 0 ? requiredDocTypes : [...REQUIRED_DOC_TYPES]
  if (required.length === 0) return 100
  const uploaded = new Set(uploadedDocTypes)
  const count = required.filter((t) => uploaded.has(t)).length
  return Math.round((count / required.length) * 100)
}
