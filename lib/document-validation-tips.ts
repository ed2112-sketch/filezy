export type ValidationTip = {
  icon: string
  text: string
}

export const DOCUMENT_VALIDATION_TIPS: Record<string, ValidationTip[]> = {
  W4: [
    { icon: "FileCheck", text: "Make sure you're using the 2026 W-4 form" },
    { icon: "PenLine", text: "Don't forget to sign and date at the bottom" },
  ],
  I9: [
    { icon: "Camera", text: "Make sure all text on your ID is clearly readable" },
    { icon: "Sun", text: "Avoid glare and shadows on the photo" },
    { icon: "FileCheck", text: "Both front and back of your ID if applicable" },
  ],
  DIRECT_DEPOSIT: [
    { icon: "FileCheck", text: "Use a voided check — not a deposit slip" },
    { icon: "Eye", text: "Routing and account numbers must be visible" },
  ],
  OFFER_LETTER: [
    { icon: "PenLine", text: "Sign and date all pages that require a signature" },
    { icon: "FileCheck", text: "Initial any pages that require initials" },
  ],
  W9: [
    { icon: "FileCheck", text: "Use the current year W-9 form" },
    { icon: "PenLine", text: "Sign and date in the Certification section" },
    { icon: "AlertCircle", text: "TIN must match the name on Line 1" },
  ],
  BACKGROUND_CHECK: [
    { icon: "PenLine", text: "All fields must be completed — no blanks" },
    { icon: "FileCheck", text: "Signature and date are required" },
  ],
  CERTIFICATION: [
    { icon: "Calendar", text: "Make sure the certification is not expired" },
    { icon: "Camera", text: "Upload a clear, full-page photo or scan" },
  ],
}

export function getValidationTips(docType: string): ValidationTip[] {
  return DOCUMENT_VALIDATION_TIPS[docType] ?? []
}
