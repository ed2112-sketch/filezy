import type { FormDefinition } from "./types"

export const emergencyContactForm: FormDefinition = {
  id: "emergency-contact",
  docType: "EMERGENCY_CONTACT",
  title: "Emergency Contact Information",
  description: "Provide emergency contact details for your records.",
  sections: [
    { id: "primary", title: "Primary Contact" },
    { id: "secondary", title: "Secondary Contact" },
  ],
  fields: [
    {
      name: "contactName",
      label: "Contact Name",
      type: "text",
      required: true,
      section: "primary",
    },
    {
      name: "relationship",
      label: "Relationship",
      type: "text",
      required: true,
      section: "primary",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "phone",
      required: true,
      section: "primary",
    },
    {
      name: "alternatePhone",
      label: "Alternate Phone",
      type: "phone",
      required: false,
      section: "primary",
    },
    {
      name: "email",
      label: "Email Address",
      type: "text",
      required: false,
      section: "primary",
    },
    {
      name: "secondaryName",
      label: "Contact Name",
      type: "text",
      required: false,
      section: "secondary",
    },
    {
      name: "secondaryRelationship",
      label: "Relationship",
      type: "text",
      required: false,
      section: "secondary",
    },
    {
      name: "secondaryPhone",
      label: "Phone Number",
      type: "phone",
      required: false,
      section: "secondary",
    },
  ],
  requiresSignature: false,
}
