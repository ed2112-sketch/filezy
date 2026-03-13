export type FormFieldType = "text" | "number" | "select" | "checkbox" | "date" | "ssn" | "phone" | "routing" | "account"

export type FormField = {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  helpText?: string
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    message?: string
  }
  section?: string
}

export type FormDefinition = {
  id: string
  docType: string
  title: string
  description: string
  sections: { id: string; title: string }[]
  fields: FormField[]
  requiresSignature: boolean
}

export type SignatureData = {
  type: "typed" | "drawn"
  value: string
  consentGiven: true
  consentText: string
}
