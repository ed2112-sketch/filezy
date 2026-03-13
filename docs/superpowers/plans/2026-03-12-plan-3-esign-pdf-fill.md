# Plan 3: E-Sign & PDF Fill

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Add client-side PDF form filling and electronic signature capture so employees can complete W-4, I-9, direct deposit, and offer letter forms directly in the browser — producing signed PDFs uploaded to S3.

**Architecture:** All PDF generation happens client-side via `pdf-lib`. React form components collect data, `pdf-lib` injects values + signature into blank PDF templates, final PDF is uploaded through the existing `/api/upload/[token]` endpoint. A new `/api/documents/[id]/sign` API records signature audit trail.

**Tech Stack:** pdf-lib (client-side PDF), Dancing Script font (typed signatures), HTML5 Canvas (drawn signatures), existing S3 upload API

**Spec:** `docs/superpowers/specs/2026-03-12-filezy-v2-feature-expansion-design.md` (section 2)

---

## Task 1: Install pdf-lib and add Dancing Script font

- [ ] `npm install pdf-lib`
- [ ] Add Dancing Script Google Font to `app/layout.tsx` (or the upload layout) — used for typed signature rendering
- [ ] Commit

## Task 2: Add blank PDF templates

Download official blank W-4 and I-9 PDFs from IRS/USCIS. Create `public/forms/` directory.

- [ ] Create `public/forms/` directory
- [ ] Add blank `w4-2026.pdf` (IRS Form W-4) — download from https://www.irs.gov/pub/irs-pdf/fw4.pdf
- [ ] Add blank `i9.pdf` (USCIS Form I-9) — download from https://www.uscis.gov/sites/default/files/document/forms/i-9-paper-version.pdf
- [ ] Commit

**Note:** These are public government forms, freely distributable. The subagent should download these via curl/wget. If the URLs have changed, search for the current versions.

## Task 3: Form field definitions

Create form definition files in `lib/forms/` that map each form's fields to metadata. These do NOT contain PDF coordinates yet — coordinates will be added in Task 6 after we have the actual PDFs to inspect.

Create `lib/forms/types.ts`:
```ts
export type FormFieldType = "text" | "number" | "select" | "checkbox" | "date" | "ssn" | "phone" | "routing" | "account"

export type FormField = {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]  // for select fields
  helpText?: string
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    message?: string
  }
  section?: string  // group fields into sections
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
```

Create `lib/forms/w4.ts`:
- Filing status (select: Single, Married filing jointly, Head of household)
- Name fields (first, middle initial, last)
- SSN
- Address (street, city, state, zip)
- Step 2 checkbox (multiple jobs)
- Dependents amount (number)
- Other income (number)
- Deductions (number)
- Extra withholding (number)
- Signature required

Create `lib/forms/i9.ts`:
- Section 1 only (employee part): name, other names, address, DOB, SSN, email, phone
- Citizenship status (select: US citizen, Noncitizen national, Lawful permanent resident, Alien authorized to work)
- USCIS/A-number if applicable
- Foreign passport info if applicable
- Signature required

Create `lib/forms/direct-deposit.ts`:
- Bank name
- Routing number (9 digits, with validation)
- Account number
- Account type (select: Checking, Savings)
- No signature required (but has acknowledgment checkbox)

Create `lib/forms/offer-letter.ts`:
- This is a read-and-sign form — the employer pre-fills position, start date, pay rate
- Employee just reviews and signs
- Signature required

Create `lib/forms/index.ts` — exports all definitions and a lookup by docType.

## Task 4: Signature capture component

Create `components/signature/signature-pad.tsx` — client component.

Two modes, toggled by tabs:

**Type-to-sign:**
- Text input
- Live preview rendered in Dancing Script font (cursive)
- Clear button

**Draw-to-sign:**
- HTML5 Canvas element
- Touch-friendly (pointer events, not just mouse)
- Configurable stroke width and color (dark ink)
- Clear and Undo buttons
- Returns base64 PNG data URL

**Common:**
- Legal consent checkbox: "I agree this electronic signature is legally binding"
- Disabled "Sign" button until signature is provided AND consent checked
- Props: `onSign(data: SignatureData) => void`
- SignatureData type:
```ts
export type SignatureData = {
  type: "typed" | "drawn"
  value: string  // text for typed, base64 PNG for drawn
  consentGiven: true
  consentText: string
}
```

The component should work well on mobile (the upload page is mobile-first).

## Task 5: Form renderer component

Create `components/forms/form-renderer.tsx` — client component.

Takes a `FormDefinition` and renders all fields with validation:

- Groups fields by section
- Renders appropriate input type for each field type (text, number, select, checkbox, date, ssn, phone, routing, account)
- SSN field: masked display (shows last 4 only), 9-digit validation
- Routing number: 9-digit validation with ABA checksum
- Real-time validation with inline error messages
- Returns form data via `onSubmit(data: Record<string, string>) => void`

Create `components/forms/form-field.tsx` — individual field component with label, input, validation error display.

Props for FormRenderer:
```ts
{
  definition: FormDefinition
  initialValues?: Record<string, string>  // for offer letter pre-fill
  onSubmit: (data: Record<string, string>) => void
  onCancel: () => void
  submitLabel?: string  // default "Continue to Signature"
}
```

## Task 6: PDF generation utilities

Create `lib/forms/pdf-generator.ts` — client-side PDF generation.

Since real PDF coordinate mapping requires inspecting actual PDF templates (which varies by year/version), use a **generated PDF approach** instead of template filling for now:

```ts
export async function generateSignedPDF(options: {
  docType: string
  formData: Record<string, string>
  signature: SignatureData
  employeeName: string
}): Promise<Blob>
```

For W-4 and I-9: Use `pdf-lib` to load the blank template from `public/forms/`, fill in the form fields using the PDF's AcroForm fields (IRS and USCIS PDFs have fillable fields built in), embed signature image, and return the filled PDF.

For Direct Deposit and Offer Letter: Generate a clean PDF from scratch using `pdf-lib` — create pages, add text with proper formatting, embed signature.

Fallback: If AcroForm filling doesn't work for a given template (field names mismatch), fall back to generating a new PDF with the data formatted cleanly.

Also create `lib/forms/pdf-helpers.ts`:
- `embedSignatureImage(pdfDoc, signatureData, x, y, width, height)` — handles both typed (render text as image) and drawn (embed base64 PNG)
- `addSignatureAuditFooter(pdfDoc, page, auditData)` — adds small-print audit trail at bottom of signature page

## Task 7: E-sign submission API

Create `app/api/documents/[id]/sign/route.ts`.

POST: Accept signature audit data and store it on the Document record.

```ts
// Request body
{
  signatureData: {
    type: "typed" | "drawn",
    value: string,
    consentGiven: boolean,
    consentText: string
  }
}
```

Handler:
- Auth check: either session user (admin) or upload token validation
- Validate document exists and belongs to authenticated entity
- Store `signatureData` JSON and `signedAt` timestamp on the Document record
- Include IP address and user agent in the stored signature data
- Log to AuditLog with action: SIGNED
- Return success

For token-based auth (employee upload flow), accept the upload token in a header or query param and validate it against the hire's upload token.

## Task 8: Integrate form fill into upload page

Update `app/upload/[token]/page.tsx` to add a "Fill out online" option alongside the existing file upload.

For doc types that have form definitions (W4, I9, DIRECT_DEPOSIT, OFFER_LETTER):

1. **DocumentCard** gets a second button: "Fill out online" (alongside "Take photo or choose file")
2. Clicking "Fill out online" opens a **full-screen form view** (within the same page, not a modal)
3. Flow: Form fields → Signature pad (if required) → PDF generated client-side → uploaded via existing API → sign API called with audit data
4. After successful submission, returns to the document list with the doc marked as complete

Create `components/upload/form-fill-flow.tsx` — client component managing the multi-step flow:
- Step 1: Form fields (FormRenderer)
- Step 2: Signature (SignaturePad) — only if `definition.requiresSignature`
- Step 3: Generating PDF + uploading (loading state)

Props:
```ts
{
  docType: string
  definition: FormDefinition
  token: string
  employeeName: string
  onComplete: (fileName: string) => void
  onCancel: () => void
}
```

The flow:
1. User fills form → clicks "Continue to Signature"
2. User signs → clicks "Submit"
3. Client calls `generateSignedPDF()` to create PDF blob
4. Client uploads PDF via `POST /api/upload/[token]` (same as file upload)
5. Client calls `POST /api/documents/[id]/sign` with signature audit data
6. Show success, call `onComplete`

## Task 9: Update DocumentCard with dual action buttons

Update the `DocumentCard` inline component in `app/upload/[token]/page.tsx`:

- For doc types with form definitions: show two buttons side by side:
  - "Fill out online" (primary action, green button)
  - "Upload file instead" (secondary, outline button)
- For doc types without form definitions: keep existing single upload button
- When a form fill is in progress, hide the document list and show the FormFillFlow component full-screen
- Track `activeFormFill` state in the parent component

## Task 10: Final build verification

- [ ] Run `npx next build`
- [ ] Fix any errors
- [ ] Commit and tag
