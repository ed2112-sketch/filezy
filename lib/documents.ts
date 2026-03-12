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
} as const

export function calculateCompletionPct(uploadedDocTypes: string[]): number {
  const uploaded = new Set(uploadedDocTypes)
  const count = REQUIRED_DOC_TYPES.filter((t) => uploaded.has(t)).length
  return Math.round((count / REQUIRED_DOC_TYPES.length) * 100)
}
