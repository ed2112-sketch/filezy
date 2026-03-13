import type { FormDefinition } from "./types"

export const directDepositForm: FormDefinition = {
  id: "direct-deposit",
  docType: "DIRECT_DEPOSIT",
  title: "Direct Deposit Authorization",
  description: "Authorize your employer to deposit your pay directly into your bank account.",
  sections: [
    { id: "bank", title: "Bank Information" },
  ],
  fields: [
    {
      name: "bankName",
      label: "Bank Name",
      type: "text",
      required: true,
      section: "bank",
    },
    {
      name: "routingNumber",
      label: "Routing Number",
      type: "routing",
      required: true,
      placeholder: "XXXXXXXXX",
      validation: {
        pattern: "^\\d{9}$",
        minLength: 9,
        maxLength: 9,
        message: "Routing number must be exactly 9 digits",
      },
      section: "bank",
    },
    {
      name: "accountNumber",
      label: "Account Number",
      type: "account",
      required: true,
      section: "bank",
    },
    {
      name: "accountType",
      label: "Account Type",
      type: "select",
      required: true,
      options: [
        { value: "checking", label: "Checking" },
        { value: "savings", label: "Savings" },
      ],
      section: "bank",
    },
    {
      name: "confirmAccountNumber",
      label: "Confirm Account Number",
      type: "account",
      required: true,
      helpText: "Re-enter account number",
      section: "bank",
    },
  ],
  requiresSignature: false,
}
