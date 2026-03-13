import type { FormDefinition } from "./types"

export const offerLetterForm: FormDefinition = {
  id: "offer-letter",
  docType: "OFFER_LETTER",
  title: "Offer Letter",
  description: "Review your offer letter and sign to accept",
  sections: [
    { id: "review", title: "Review & Sign" },
  ],
  fields: [
    {
      name: "employeeName",
      label: "Employee Name",
      type: "text",
      required: true,
      helpText: "Your full legal name",
      section: "review",
    },
    {
      name: "acknowledgeTerms",
      label: "I have read and agree to the terms of this offer letter",
      type: "checkbox",
      required: true,
      section: "review",
    },
  ],
  requiresSignature: true,
}
