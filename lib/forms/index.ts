import { w4Form } from "./w4"
import { i9Form } from "./i9"
import { directDepositForm } from "./direct-deposit"
import { offerLetterForm } from "./offer-letter"
import { w9Form } from "./w9"
import { emergencyContactForm } from "./emergency-contact"
import { backgroundCheckForm } from "./background-check"
import { drugTestConsentForm } from "./drug-test-consent"
import { employeeCensusForm } from "./employee-census"
import type { FormDefinition } from "./types"

export { w4Form, i9Form, directDepositForm, offerLetterForm, w9Form, emergencyContactForm, backgroundCheckForm, drugTestConsentForm, employeeCensusForm }
export type { FormDefinition, FormField, FormFieldType, SignatureData } from "./types"

export const FORM_DEFINITIONS: Record<string, FormDefinition> = {
  W4: w4Form,
  I9: i9Form,
  DIRECT_DEPOSIT: directDepositForm,
  OFFER_LETTER: offerLetterForm,
  W9: w9Form,
  EMERGENCY_CONTACT: emergencyContactForm,
  BACKGROUND_CHECK: backgroundCheckForm,
  DRUG_TEST_CONSENT: drugTestConsentForm,
  EMPLOYEE_CENSUS: employeeCensusForm,
}

export function getFormDefinition(docType: string): FormDefinition | null {
  return FORM_DEFINITIONS[docType] ?? null
}
