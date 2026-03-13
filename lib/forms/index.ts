import { w4Form } from "./w4"
import { i9Form } from "./i9"
import { directDepositForm } from "./direct-deposit"
import { offerLetterForm } from "./offer-letter"
import type { FormDefinition } from "./types"

export { w4Form, i9Form, directDepositForm, offerLetterForm }
export type { FormDefinition, FormField, FormFieldType, SignatureData } from "./types"

export const FORM_DEFINITIONS: Record<string, FormDefinition> = {
  W4: w4Form,
  I9: i9Form,
  DIRECT_DEPOSIT: directDepositForm,
  OFFER_LETTER: offerLetterForm,
}

export function getFormDefinition(docType: string): FormDefinition | null {
  return FORM_DEFINITIONS[docType] ?? null
}
