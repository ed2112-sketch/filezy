import type { FormDefinition } from "./types"
import { US_STATES } from "./us-states"

export const backgroundCheckForm: FormDefinition = {
  id: "background-check",
  docType: "BACKGROUND_CHECK",
  title: "Background Check Authorization",
  description: "Authorization for background screening as a condition of employment.",
  sections: [
    { id: "personal", title: "Personal Information" },
    { id: "authorization", title: "Authorization" },
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
      name: "ssn",
      label: "Social Security Number",
      type: "ssn",
      required: true,
      placeholder: "XXX-XX-XXXX",
      section: "personal",
    },
    {
      name: "driversLicense",
      label: "Driver's License Number",
      type: "text",
      required: true,
      section: "personal",
    },
    {
      name: "driversLicenseState",
      label: "Driver's License State",
      type: "select",
      required: true,
      options: US_STATES,
      section: "personal",
    },
    {
      name: "currentAddress",
      label: "Current Address",
      type: "text",
      required: true,
      section: "personal",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      required: true,
      section: "personal",
    },
    {
      name: "state",
      label: "State",
      type: "select",
      required: true,
      options: US_STATES,
      section: "personal",
    },
    {
      name: "zip",
      label: "ZIP Code",
      type: "text",
      required: true,
      section: "personal",
    },
  ],
  requiresSignature: true,
}
