import type { FormDefinition } from "./types"

export const drugTestConsentForm: FormDefinition = {
  id: "drug-test-consent",
  docType: "DRUG_TEST_CONSENT",
  title: "Drug Test Consent Form",
  description: "Authorization for drug testing as a condition of employment.",
  sections: [
    { id: "personal", title: "Personal Information" },
    { id: "consent", title: "Consent & Authorization" },
  ],
  fields: [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      section: "personal",
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
      section: "personal",
    },
    {
      name: "consentAcknowledgment",
      label: "I consent to drug testing as a condition of employment",
      type: "checkbox",
      required: true,
      section: "consent",
    },
  ],
  requiresSignature: true,
}
