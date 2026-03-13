import type { FormDefinition } from "./types"
import { US_STATES } from "./us-states"

export const w9Form: FormDefinition = {
  id: "w9",
  docType: "W9",
  title: "W-9 Request for Taxpayer Identification Number",
  description: "Request for Taxpayer Identification Number and Certification",
  sections: [
    { id: "taxpayer", title: "Taxpayer Information" },
    { id: "address", title: "Address" },
    { id: "certification", title: "Certification" },
  ],
  fields: [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      section: "taxpayer",
    },
    {
      name: "businessName",
      label: "Business Name (if different from above)",
      type: "text",
      required: false,
      section: "taxpayer",
    },
    {
      name: "entityType",
      label: "Federal Tax Classification",
      type: "select",
      required: true,
      options: [
        { value: "individual", label: "Individual/Sole proprietor" },
        { value: "c_corp", label: "C Corporation" },
        { value: "s_corp", label: "S Corporation" },
        { value: "partnership", label: "Partnership" },
        { value: "trust_estate", label: "Trust/estate" },
        { value: "llc", label: "LLC" },
        { value: "other", label: "Other" },
      ],
      section: "taxpayer",
    },
    {
      name: "exemptPayeeCode",
      label: "Exempt Payee Code (if any)",
      type: "text",
      required: false,
      section: "taxpayer",
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      required: true,
      section: "address",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      required: true,
      section: "address",
    },
    {
      name: "state",
      label: "State",
      type: "select",
      required: true,
      options: US_STATES,
      section: "address",
    },
    {
      name: "zip",
      label: "ZIP Code",
      type: "text",
      required: true,
      validation: {
        pattern: "^\\d{5}$",
        message: "ZIP code must be 5 digits",
      },
      section: "address",
    },
    {
      name: "tinType",
      label: "Taxpayer ID Type",
      type: "select",
      required: true,
      options: [
        { value: "ssn", label: "SSN" },
        { value: "ein", label: "EIN" },
      ],
      section: "certification",
    },
    {
      name: "tin",
      label: "Taxpayer Identification Number",
      type: "ssn",
      required: true,
      validation: {
        pattern: "^\\d{9}$",
        message: "TIN must be 9 digits",
      },
      section: "certification",
    },
  ],
  requiresSignature: true,
}
