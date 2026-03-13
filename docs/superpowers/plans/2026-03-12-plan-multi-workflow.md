# Multi-Workflow & Pricing Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Transform Filezy from a single-workflow employer tool into a multi-workflow platform (Employer, Accountant, Staffing Agency) with hybrid usage+subscription pricing.

**Architecture:** Additive layer on existing code. Add WorkflowType enum to Business, replace Plan enum (FREE/STARTER/PRO/BUSINESS → STARTER/GROWTH/PRO), add OnboardingUsage model for metered billing, new document types and form definitions, workflow-aware UI labels, white-label branding, CSV bulk invite, and updated signup flow.

**Tech Stack:** Prisma 7, Stripe metered billing, S3 (logo upload), Resend email, existing Next.js 16 App Router

**Spec:** `docs/superpowers/specs/2026-03-12-multi-workflow-pricing-redesign.md`

---

## Task 1: Schema Migration — WorkflowType, Plan, OnboardingUsage

Add WorkflowType enum, modify Business model, change Plan enum, add OnboardingUsage model, and run migration.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/plans.ts` (update Plan references)
- Modify: `lib/generated/prisma/` (regenerated)

### Steps:

- [ ] Add `WorkflowType` enum to `prisma/schema.prisma`:
```prisma
enum WorkflowType {
  EMPLOYER
  ACCOUNTANT
  STAFFING_AGENCY
}
```

- [ ] Add fields to `Business` model:
```prisma
  workflowType       WorkflowType @default(EMPLOYER)
  brandLogoUrl       String?
  brandPrimaryColor  String?
  brandAccentColor   String?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
```

- [ ] Change `Plan` enum from `FREE | STARTER | PRO | BUSINESS` to `STARTER | GROWTH | PRO`. Since existing data uses old values, create a two-step migration:
  1. Add GROWTH to the enum
  2. Update existing data: FREE → STARTER, old STARTER → GROWTH, old BUSINESS → PRO
  3. Remove FREE and BUSINESS from enum

  **Important:** Prisma 7 may not support enum value removal in a single migration. Use raw SQL in the migration file:
  ```sql
  -- Step 1: Add new values
  ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'GROWTH';

  -- Step 2: Map old plans to new
  UPDATE "Business" SET plan = 'STARTER' WHERE plan = 'FREE';
  UPDATE "Business" SET plan = 'GROWTH' WHERE plan = 'STARTER' AND plan != 'STARTER';
  UPDATE "Business" SET plan = 'PRO' WHERE plan = 'BUSINESS';
  ```

  **Actually**, since FREE→STARTER collision exists, handle carefully:
  ```sql
  -- First rename old STARTER to GROWTH
  UPDATE "Business" SET plan = 'GROWTH' WHERE plan = 'STARTER';
  -- Then rename FREE to STARTER
  UPDATE "Business" SET plan = 'STARTER' WHERE plan = 'FREE';
  -- Then rename BUSINESS to PRO
  UPDATE "Business" SET plan = 'PRO' WHERE plan = 'BUSINESS';
  ```

  Then update the enum in schema to only have STARTER, GROWTH, PRO. Run `npx prisma migrate dev --create-only` first, edit the migration SQL, then apply.

- [ ] Add `OnboardingUsage` model:
```prisma
model OnboardingUsage {
  id            String   @id @default(cuid())
  businessId    String
  hireId        String   @unique
  completedAt   DateTime
  periodStart   DateTime
  periodEnd     DateTime
  chargedCents  Int?
  stripeUsageId String?
  business      Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  hire          Hire     @relation(fields: [hireId], references: [id], onDelete: Cascade)

  @@index([businessId, periodStart])
}
```

- [ ] Add relation fields on Business and Hire:
  - `Business`: `onboardingUsage OnboardingUsage[]`
  - `Hire`: `onboardingUsage OnboardingUsage?`

- [ ] Update `lib/plans.ts`:
  - Change `PLAN_LIMITS` keys from FREE/STARTER/PRO/BUSINESS to STARTER/GROWTH/PRO
  - All plans get all features (the only difference is pricing/included counts)
  - Replace `hiresPerYear` with `includedOnboardings: number` (STARTER: 0, GROWTH: 25, PRO: 75)
  - Add `monthlyPriceCents: number` (STARTER: 0, GROWTH: 4900, PRO: 9900)
  - Add `overagePriceCents: number` (STARTER: 300, GROWTH: 200, PRO: 150)
  - Set all boolean features to `true` for all plans
  - Update `checkHireLimit` to always return true (no per-year limits anymore, usage-based instead)
  - Keep `checkFeatureAccess` but all features return true

- [ ] Run `npx prisma generate` to regenerate client
- [ ] Run `npx prisma migrate dev` (may need `--create-only` + manual edit for enum rename)
- [ ] Fix any TypeScript errors from Plan enum change (imports referencing "FREE" or "BUSINESS")
- [ ] Commit: "feat: add WorkflowType enum, update Plan enum to usage-based model"

**Files likely needing Plan enum fix:**
- `app/(dashboard)/settings/billing/page.tsx` — plan keys
- `app/api/webhooks/stripe/route.ts` — getPriceToPlan mapping
- `app/api/checkout/route.ts` — price ID references
- `lib/plans.ts` — already handled above
- Any file importing `Plan` type and using old values

---

## Task 2: New Document Types & Form Definitions

Add new document type configs and form definitions for multi-workflow support.

**Files:**
- Modify: `lib/documents.ts` — add new doc types
- Create: `lib/forms/w9.ts`
- Create: `lib/forms/emergency-contact.ts`
- Create: `lib/forms/background-check.ts`
- Create: `lib/forms/drug-test-consent.ts`
- Create: `lib/forms/employee-census.ts`
- Modify: `lib/forms/index.ts` — register new forms

### Steps:

- [ ] Add new document types to `DOCUMENT_TYPES` in `lib/documents.ts`:
```ts
W9: {
  id: "W9",
  label: "W-9 Request for Taxpayer ID",
  description: "Taxpayer identification number and certification",
  required: false,
  instructions: "Complete and sign the W-9 form with your taxpayer identification information.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
},
EIN_LETTER: {
  id: "EIN_LETTER",
  label: "EIN Confirmation Letter",
  description: "IRS EIN confirmation letter",
  required: false,
  instructions: "Upload your IRS EIN confirmation letter (CP 575 or 147C).",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
BANK_DETAILS: {
  id: "BANK_DETAILS",
  label: "Bank Account Information",
  description: "Business bank account details",
  required: false,
  instructions: "Upload a voided check or bank letter showing your account details.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
},
PRIOR_PAYROLL: {
  id: "PRIOR_PAYROLL",
  label: "Prior Payroll Records",
  description: "Previous payroll provider records",
  required: false,
  instructions: "Upload your most recent payroll reports from your previous provider.",
  acceptedMimeTypes: ["application/pdf"],
},
CONTRACTOR_1099: {
  id: "CONTRACTOR_1099",
  label: "1099 Contractor Setup",
  description: "Independent contractor onboarding packet",
  required: false,
  instructions: "Complete the contractor information form for 1099 reporting.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
BACKGROUND_CHECK: {
  id: "BACKGROUND_CHECK",
  label: "Background Check Authorization",
  description: "Consent for background screening",
  required: false,
  instructions: "Review and sign the background check authorization form.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
DRUG_TEST_CONSENT: {
  id: "DRUG_TEST_CONSENT",
  label: "Drug Test Consent",
  description: "Authorization for drug testing",
  required: false,
  instructions: "Review and sign the drug test consent form.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
EMPLOYEE_CENSUS: {
  id: "EMPLOYEE_CENSUS",
  label: "Employee Census Data",
  description: "Employee information for benefits enrollment",
  required: false,
  instructions: "Provide employee details including name, date of birth, and salary information.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
STATE_TAX_REG: {
  id: "STATE_TAX_REG",
  label: "State Tax Registration",
  description: "State tax registration documents",
  required: false,
  instructions: "Upload your state tax registration or withholding account documents.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
EMERGENCY_CONTACT: {
  id: "EMERGENCY_CONTACT",
  label: "Emergency Contact Information",
  description: "Emergency contact details",
  required: false,
  instructions: "Provide your emergency contact information.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
CERTIFICATION: {
  id: "CERTIFICATION",
  label: "Professional Certification",
  description: "Professional license or certification",
  required: false,
  instructions: "Upload your professional certification or license.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/heic"],
},
ASSIGNMENT_AGREEMENT: {
  id: "ASSIGNMENT_AGREEMENT",
  label: "Assignment Agreement",
  description: "Work assignment or placement agreement",
  required: false,
  instructions: "Review and sign your assignment agreement.",
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
},
```

- [ ] Create `lib/forms/w9.ts` — W-9 form definition:
  - Sections: Taxpayer Information, Address, Certification
  - Fields: name, businessName (optional), entityType (select: Individual/Sole proprietor, C Corporation, S Corporation, Partnership, Trust/estate, LLC, Other), exemptPayeeCode (optional), exemptionFromFATCA (optional), address, city, state, zip, tinType (select: SSN, EIN), tin (text, 9-digit validation)
  - requiresSignature: true

- [ ] Create `lib/forms/emergency-contact.ts`:
  - Sections: Primary Contact, Secondary Contact (optional)
  - Fields: contactName, relationship, phone, alternatePhone (optional), email (optional), secondaryName (optional), secondaryRelationship (optional), secondaryPhone (optional)
  - requiresSignature: false

- [ ] Create `lib/forms/background-check.ts`:
  - Sections: Personal Information, Authorization
  - Fields: fullName, dateOfBirth, ssn, driversLicense, driversLicenseState, currentAddress, previousAddresses (text area), consentCheckbox
  - requiresSignature: true

- [ ] Create `lib/forms/drug-test-consent.ts`:
  - Sections: Personal Information, Consent
  - Fields: fullName, dateOfBirth, consentCheckbox ("I consent to drug testing as a condition of employment")
  - requiresSignature: true

- [ ] Create `lib/forms/employee-census.ts`:
  - Sections: Employee Information, Employment Details, Dependents
  - Fields: fullName, dateOfBirth, ssn, gender (select), maritalStatus (select), hireDate (date), jobTitle, annualSalary (number), payFrequency (select: Weekly, Biweekly, Semi-monthly, Monthly), numberOfDependents (number)
  - requiresSignature: false

- [ ] Update `lib/forms/index.ts` to register all new form definitions in `FORM_DEFINITIONS`

- [ ] Commit: "feat: add new document types and form definitions for multi-workflow"

---

## Task 3: Workflow Labels Utility

Create a utility that adapts UI terminology based on the business's workflow type.

**Files:**
- Create: `lib/workflow-labels.ts`

### Steps:

- [ ] Create `lib/workflow-labels.ts`:
```ts
import type { WorkflowType } from "@/lib/generated/prisma/client"

export type WorkflowLabels = {
  hire: string        // "New Hire" | "Client" | "Worker"
  hires: string       // "Hires" | "Clients" | "Workers"
  addHire: string     // "Add New Hire" | "Add Client" | "Add Worker"
  employee: string    // "Employee" | "Client Contact" | "Worker"
  position: string    // "Position" | "Service Type" | "Assignment"
  onboarding: string  // "Onboarding" | "Document Collection" | "Onboarding"
}

const LABELS: Record<WorkflowType, WorkflowLabels> = {
  EMPLOYER: {
    hire: "New Hire",
    hires: "Hires",
    addHire: "Add New Hire",
    employee: "Employee",
    position: "Position",
    onboarding: "Onboarding",
  },
  ACCOUNTANT: {
    hire: "Client",
    hires: "Clients",
    addHire: "Add Client",
    employee: "Client Contact",
    position: "Service Type",
    onboarding: "Document Collection",
  },
  STAFFING_AGENCY: {
    hire: "Worker",
    hires: "Workers",
    addHire: "Add Worker",
    employee: "Worker",
    position: "Assignment",
    onboarding: "Onboarding",
  },
}

export function getWorkflowLabels(workflowType: WorkflowType): WorkflowLabels {
  return LABELS[workflowType]
}
```

- [ ] Commit: "feat: add workflow-labels utility for multi-workflow UI adaptation"

---

## Task 4: Document Validation Tips

Static config for upload page tips per document type.

**Files:**
- Create: `lib/document-validation-tips.ts`

### Steps:

- [ ] Create `lib/document-validation-tips.ts`:
```ts
export type ValidationTip = {
  icon: string  // lucide icon name
  text: string
}

export const DOCUMENT_VALIDATION_TIPS: Record<string, ValidationTip[]> = {
  W4: [
    { icon: "FileCheck", text: "Make sure you're using the 2026 W-4 form" },
    { icon: "PenLine", text: "Don't forget to sign and date at the bottom" },
  ],
  I9: [
    { icon: "Camera", text: "Make sure all text on your ID is clearly readable" },
    { icon: "Sun", text: "Avoid glare and shadows on the photo" },
    { icon: "FileCheck", text: "Both front and back of your ID if applicable" },
  ],
  DIRECT_DEPOSIT: [
    { icon: "FileCheck", text: "Use a voided check — not a deposit slip" },
    { icon: "Eye", text: "Routing and account numbers must be visible" },
  ],
  OFFER_LETTER: [
    { icon: "PenLine", text: "Sign and date all pages that require a signature" },
    { icon: "FileCheck", text: "Initial any pages that require initials" },
  ],
  W9: [
    { icon: "FileCheck", text: "Use the current year W-9 form" },
    { icon: "PenLine", text: "Sign and date in the Certification section" },
    { icon: "AlertCircle", text: "TIN must match the name on Line 1" },
  ],
  BACKGROUND_CHECK: [
    { icon: "PenLine", text: "All fields must be completed — no blanks" },
    { icon: "FileCheck", text: "Signature and date are required" },
  ],
  CERTIFICATION: [
    { icon: "Calendar", text: "Make sure the certification is not expired" },
    { icon: "Camera", text: "Upload a clear, full-page photo or scan" },
  ],
}

export function getValidationTips(docType: string): ValidationTip[] {
  return DOCUMENT_VALIDATION_TIPS[docType] ?? []
}
```

- [ ] Commit: "feat: add document validation tips for upload guidance"

---

## Task 5: Update Signup Flow with Workflow Selection

Add a second step to signup where users select their workflow type. Auto-create default RoleTemplate based on selection.

**Files:**
- Modify: `app/(auth)/signup/page.tsx` — add workflow selection step
- Modify: `app/api/auth/signup/route.ts` — accept workflowType, create default template
- Create: `lib/default-templates.ts` — default doc types per workflow

### Steps:

- [ ] Create `lib/default-templates.ts`:
```ts
import type { WorkflowType } from "@/lib/generated/prisma/client"

export const DEFAULT_TEMPLATES: Record<WorkflowType, {
  name: string
  docTypes: string[]
}> = {
  EMPLOYER: {
    name: "Standard New Hire",
    docTypes: ["W4", "I9", "DIRECT_DEPOSIT", "OFFER_LETTER", "STATE_TAX", "HANDBOOK", "EMERGENCY_CONTACT"],
  },
  ACCOUNTANT: {
    name: "New Client Setup",
    docTypes: ["W9", "EIN_LETTER", "BANK_DETAILS", "PRIOR_PAYROLL", "EMPLOYEE_CENSUS"],
  },
  STAFFING_AGENCY: {
    name: "Worker Onboarding",
    docTypes: ["W4", "I9", "DIRECT_DEPOSIT", "ASSIGNMENT_AGREEMENT", "BACKGROUND_CHECK", "DRUG_TEST_CONSENT", "EMERGENCY_CONTACT", "CERTIFICATION"],
  },
}
```

- [ ] Update `app/api/auth/signup/route.ts`:
  - Accept `workflowType` in request body (default: "EMPLOYER")
  - Validate it's a valid WorkflowType enum value
  - Set `workflowType` on the Business create
  - After creating the business and location, create a default RoleTemplate using `DEFAULT_TEMPLATES[workflowType]`:
    ```ts
    const defaultTemplate = DEFAULT_TEMPLATES[workflowType as WorkflowType]
    const roleTemplate = await tx.roleTemplate.create({
      data: {
        businessId: business.id,
        name: defaultTemplate.name,
        docTypes: defaultTemplate.docTypes,
      },
    })
    await tx.business.update({
      where: { id: business.id },
      data: { defaultRoleTemplateId: roleTemplate.id },
    })
    ```

- [ ] Update `app/(auth)/signup/page.tsx`:
  - Add a two-step form: Step 1 = existing fields (name, email, password, businessName), Step 2 = workflow selection
  - Step 2 shows three cards:
    - **Employer** (Briefcase icon) — "Onboard new hires with tax forms, direct deposit, and e-signatures"
    - **Accountant** (Calculator icon) — "Collect W-9s, payroll docs, and financial records from clients"
    - **Staffing Agency** (Users icon) — "High-volume worker onboarding with bulk invites and tracking"
  - Cards are selectable (click to select, highlighted border)
  - "Create Account" button submits both steps' data
  - Send `workflowType` field in POST body

- [ ] Commit: "feat: add workflow selection to signup flow with default templates"

---

## Task 6: Update Billing Page & Checkout for New Pricing

Replace the 4-tier flat pricing with 3-tier usage-based pricing. Update billing page UI, checkout API, and Stripe webhook.

**Files:**
- Modify: `app/(dashboard)/settings/billing/page.tsx` — new plan cards
- Modify: `app/api/checkout/route.ts` — new price IDs
- Modify: `app/api/webhooks/stripe/route.ts` — update plan mapping, add usage billing support
- Modify: `lib/plans.ts` — already updated in Task 1

### Steps:

- [ ] Update `app/(dashboard)/settings/billing/page.tsx`:
  - Replace `PLANS` array with new 3-tier pricing:
    ```ts
    const PLANS = [
      {
        key: "STARTER",
        name: "Starter",
        price: "$3",
        period: "/onboarding",
        description: "Pay as you go — no monthly fee",
        features: [
          "All features included",
          "$3 per completed onboarding",
          "No monthly commitment",
          "Unlimited team members",
        ],
        priceId: null, // No subscription needed
        icon: Zap,
      },
      {
        key: "GROWTH",
        name: "Growth",
        price: "$49",
        period: "/mo",
        description: "25 onboardings included",
        features: [
          "All features included",
          "25 onboardings/mo included",
          "$2 per additional onboarding",
          "Unlimited team members",
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID!,
        icon: Zap,
        popular: true,
      },
      {
        key: "PRO",
        name: "Pro",
        price: "$99",
        period: "/mo",
        description: "75 onboardings included",
        features: [
          "All features included",
          "75 onboardings/mo included",
          "$1.50 per additional onboarding",
          "Unlimited team members",
          "Priority support",
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
        icon: Rocket,
      },
    ]
    ```
  - Add usage meter section below current plan banner showing:
    - Onboardings this period: X / Y included (or "pay-as-you-go" for STARTER)
    - Overage charges this period: $X
  - Fetch usage data from a new API endpoint
  - Remove `isDowngrade` logic, simplify to upgrade/downgrade/current
  - Update the "Current Plan" banner to show usage info
  - For STARTER plan, show "Upgrade" button (no subscription to manage)
  - For GROWTH/PRO, show "Manage Billing" for existing subscribers

- [ ] Update `app/api/checkout/route.ts`:
  - Update env var references: `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
  - Remove STARTER and BUSINESS price references
  - For GROWTH/PRO: create Stripe checkout session with subscription + metered component

- [ ] Update `app/api/webhooks/stripe/route.ts`:
  - Update `getPriceToPlan()` mapping:
    ```ts
    function getPriceToPlan(): Record<string, Plan> {
      return {
        [process.env.STRIPE_PRICE_GROWTH || ""]: "GROWTH",
        [process.env.STRIPE_PRICE_PRO || ""]: "PRO",
      }
    }
    ```
  - On subscription deleted: revert to STARTER (not FREE)
  - Commission calculation stays the same (on invoice.payment_succeeded)

- [ ] Create `app/api/business/usage/route.ts` — GET endpoint:
  - Returns current period usage count, included count, overage count, overage charges
  - Queries `OnboardingUsage` for current period

- [ ] Commit: "feat: update billing to usage-based pricing model"

---

## Task 7: Usage Tracking on Onboarding Completion

When a hire reaches COMPLETE status, create an OnboardingUsage record and report usage to Stripe.

**Files:**
- Create: `lib/usage-tracking.ts` — usage tracking logic
- Modify: any API that sets hire status to COMPLETE (find via grep)

### Steps:

- [ ] Find all places where hire status is set to COMPLETE:
  - Likely in upload API, document approval, or a status update endpoint
  - Search for `status: "COMPLETE"` or `HireStatus.COMPLETE`

- [ ] Create `lib/usage-tracking.ts`:
```ts
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { PLAN_LIMITS } from "@/lib/plans"
import type { Plan } from "@/lib/generated/prisma/client"

export async function recordOnboardingUsage(hireId: string, businessId: string) {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { plan: true, stripeCustomerId: true, currentPeriodStart: true, currentPeriodEnd: true },
  })
  if (!business) return

  const now = new Date()
  const periodStart = business.currentPeriodStart ?? startOfMonth(now)
  const periodEnd = business.currentPeriodEnd ?? endOfMonth(now)

  // Check if already recorded
  const existing = await db.onboardingUsage.findUnique({ where: { hireId } })
  if (existing) return

  // Count existing usage this period
  const periodCount = await db.onboardingUsage.count({
    where: { businessId, periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
  })

  const limits = PLAN_LIMITS[business.plan]
  const included = limits.includedOnboardings
  const isOverage = periodCount >= included
  const overageCents = isOverage ? limits.overagePriceCents : (business.plan === "STARTER" ? limits.overagePriceCents : 0)

  // Create usage record
  const usage = await db.onboardingUsage.create({
    data: {
      businessId,
      hireId,
      completedAt: now,
      periodStart,
      periodEnd,
      chargedCents: overageCents > 0 ? overageCents : null,
    },
  })

  // Report to Stripe if there's a charge
  if (overageCents > 0 && business.stripeCustomerId) {
    try {
      // Create Stripe usage record or invoice item
      // For STARTER (no subscription): create invoice item
      // For GROWTH/PRO (subscription): create metered usage record
      if (business.plan === "STARTER") {
        await getStripe().invoiceItems.create({
          customer: business.stripeCustomerId,
          amount: overageCents,
          currency: "usd",
          description: "Completed onboarding",
        })
      }
      // For GROWTH/PRO with metered billing, Stripe handles via subscription meter
    } catch (err) {
      console.error("Failed to report usage to Stripe:", err)
    }
  }

  return usage
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}
```

- [ ] Integrate `recordOnboardingUsage` into the hire completion flow — call it wherever `status` is set to `COMPLETE`

- [ ] Commit: "feat: track onboarding usage for billing"

---

## Task 8: CSV Bulk Invite API

Create endpoint for bulk-inviting hires via CSV upload.

**Files:**
- Create: `app/api/hires/bulk-invite/route.ts`

### Steps:

- [ ] Create `app/api/hires/bulk-invite/route.ts`:
  - POST handler, auth required (session user)
  - Accept multipart form data with CSV file
  - Parse CSV (use simple line splitting — no library needed for basic CSV)
  - Expected columns: name, email, phone (optional), position (optional)
  - For each row:
    - Validate name and email
    - Skip duplicates (same email for same business)
    - Create Hire record with upload token
    - Queue invite email via Resend
  - Return JSON summary: `{ created: number, failed: { row: number, reason: string }[], skipped: number }`
  - Rate limit: max 500 rows per request
  - Associate with business from session user

```ts
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return Response.json({ error: "No business found" }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

  if (lines.length < 2) {
    return Response.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 })
  }
  if (lines.length > 501) {
    return Response.json({ error: "Maximum 500 rows per upload" }, { status: 400 })
  }

  const header = lines[0].toLowerCase().split(",").map(h => h.trim())
  const nameIdx = header.indexOf("name")
  const emailIdx = header.indexOf("email")
  const phoneIdx = header.indexOf("phone")
  const positionIdx = header.indexOf("position")

  if (nameIdx === -1 || emailIdx === -1) {
    return Response.json({ error: "CSV must have 'name' and 'email' columns" }, { status: 400 })
  }

  const results = { created: 0, failed: [] as { row: number; reason: string }[], skipped: 0 }

  // Get existing emails for dedup
  const existingEmails = new Set(
    (await db.hire.findMany({
      where: { businessId: business.id },
      select: { employeeEmail: true },
    })).map(h => h.employeeEmail?.toLowerCase())
  )

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim())
    const name = cols[nameIdx]
    const email = cols[emailIdx]?.toLowerCase()
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : undefined
    const position = positionIdx >= 0 ? cols[positionIdx] : undefined

    if (!name || !email) {
      results.failed.push({ row: i + 1, reason: "Missing name or email" })
      continue
    }

    if (existingEmails.has(email)) {
      results.skipped++
      continue
    }

    try {
      const hire = await db.hire.create({
        data: {
          businessId: business.id,
          employeeName: name,
          employeeEmail: email,
          employeePhone: phone || null,
          position: position || null,
        },
      })

      existingEmails.add(email)
      results.created++

      // Send invite email (fire and forget)
      getResend().emails.send({
        from: "Filezy <noreply@filezy.com>",
        to: email,
        subject: `${business.name} — Document upload request`,
        html: `<p>Hi ${name},</p><p>${business.name} has requested documents from you.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}">Upload your documents</a></p>`,
      }).catch(err => console.error("Bulk invite email failed:", err))
    } catch (err) {
      results.failed.push({ row: i + 1, reason: "Database error" })
    }
  }

  return Response.json(results)
}
```

- [ ] Commit: "feat: add CSV bulk invite API for multi-workflow"

---

## Task 9: White-Label Branding — Settings

Add logo upload and brand color settings to the business settings page.

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx` — add branding section
- Modify: `app/api/business/settings/route.ts` — handle brand fields
- Create: `app/api/business/logo/route.ts` — logo upload to S3

### Steps:

- [ ] Create `app/api/business/logo/route.ts`:
  - POST: accept image file via FormData
  - Validate file type (image/jpeg, image/png, image/svg+xml) and size (max 2MB)
  - Upload to S3 with key `brands/{businessId}/logo.{ext}`
  - Update `business.brandLogoUrl` with the S3 URL
  - Return `{ url: string }`
  - DELETE: remove logo from S3, set `brandLogoUrl` to null

- [ ] Update `app/api/business/settings/route.ts`:
  - Accept `brandPrimaryColor` and `brandAccentColor` in PATCH body
  - Validate hex color format (`/^#[0-9a-fA-F]{6}$/`)
  - Save to business record

- [ ] Update `app/(dashboard)/settings/page.tsx`:
  - Add "Branding" section below existing settings:
    - Logo upload area (drag-and-drop or click, shows preview)
    - Primary Color picker (hex input with color swatch preview)
    - Accent Color picker (same)
    - "Save Branding" button
  - Logo upload calls `/api/business/logo` POST
  - Color save calls existing `/api/business/settings` PATCH

- [ ] Commit: "feat: add white-label branding settings (logo + colors)"

---

## Task 10: White-Label Application — Upload Page & Emails

Apply white-label branding to the upload page and email templates.

**Files:**
- Modify: `app/upload/[token]/page.tsx` — use brand logo/colors
- Modify: `app/api/upload/[token]/route.ts` — return brand data in GET response

### Steps:

- [ ] Update `app/api/upload/[token]/route.ts` GET handler:
  - Include `business.brandLogoUrl`, `business.brandPrimaryColor`, `business.brandAccentColor` in response

- [ ] Update `app/upload/[token]/page.tsx`:
  - If `brandLogoUrl` exists, show business logo instead of Filezy logo in header
  - If `brandPrimaryColor` exists, use it for primary buttons and accents (apply as CSS custom property)
  - If `brandAccentColor` exists, use for secondary elements
  - Set CSS variables in a style tag or inline:
    ```tsx
    <div style={{
      '--brand-primary': data.brandPrimaryColor || '#136334',
      '--brand-accent': data.brandAccentColor || '#36c973',
    } as React.CSSProperties}>
    ```
  - Update button classes to use CSS variables

- [ ] Update email templates (wherever invite emails are sent):
  - If business has `brandLogoUrl`, include it in email header HTML
  - Fall back to Filezy logo if no brand logo

- [ ] Commit: "feat: apply white-label branding to upload page and emails"

---

## Task 11: Update Landing Page

Update the landing page to showcase three workflow types and new pricing.

**Files:**
- Modify: `app/page.tsx`

### Steps:

- [ ] Update Hero section:
  - Change headline to something like "Document onboarding for every business"
  - Subheadline: "Whether you're hiring employees, onboarding clients, or placing workers — collect forms, signatures, and documents in minutes."

- [ ] Update "How It Works" section:
  - Keep the 3-step flow but make it generic

- [ ] Add Workflow Types section (between How It Works and Features):
  - Three tabs or cards:
    - **For Employers** — "Onboard new hires with W-4, I-9, direct deposit, and offer letters"
    - **For Accountants** — "Collect W-9s, EIN letters, bank details, and payroll records from clients"
    - **For Staffing Agencies** — "High-volume worker onboarding with bulk invites and real-time tracking"
  - Each tab shows relevant feature highlights

- [ ] Update Pricing section:
  - Replace 4-tier cards with 3-tier usage-based cards matching the billing page
  - STARTER: $3/onboarding, GROWTH: $49/mo (25 included), PRO: $99/mo (75 included)
  - All features included on all plans

- [ ] Update CTA buttons to "Start free" (goes to signup)

- [ ] Keep accountant referral section but update copy to "Partner Program" (not accountant-specific)

- [ ] Commit: "feat: update landing page for multi-workflow platform"

---

## Task 12: Apply Workflow Labels Across Dashboard

Update dashboard pages to use workflow-aware labels.

**Files:**
- Modify: `app/(dashboard)/hires/page.tsx` — page title, column headers
- Modify: `app/(dashboard)/hires/hires-list.tsx` — button labels, search placeholder
- Modify: `app/(dashboard)/dashboard/page.tsx` — card labels
- Modify: `app/(dashboard)/layout.tsx` — sidebar nav labels (if applicable)

### Steps:

- [ ] In each dashboard page that shows "Hires", "New Hire", "Employee", or "Position":
  - Fetch `workflowType` from the business (already available in most server components)
  - Call `getWorkflowLabels(workflowType)` to get the correct labels
  - Pass labels to client components as props
  - Replace hardcoded strings with label values

- [ ] Key replacements:
  - Page title: "Hires" → `labels.hires`
  - Add button: "Add New Hire" → `labels.addHire`
  - Table columns: "Employee" → `labels.employee`, "Position" → `labels.position`
  - Empty states: "No hires yet" → `No ${labels.hires.toLowerCase()} yet`

- [ ] Commit: "feat: apply workflow-aware labels to dashboard"

---

## Task 13: Validation Tips on Upload Page

Show document validation tips on the upload page.

**Files:**
- Modify: `app/upload/[token]/page.tsx` — show tips per document type

### Steps:

- [ ] Import `getValidationTips` from `lib/document-validation-tips.ts`
- [ ] In each DocumentCard, below the instructions text:
  - Call `getValidationTips(doc.docType)`
  - If tips exist, render them as a small tip list with icons
  - Style as subtle info text (text-xs, muted color)
  - Only show tips for documents that haven't been uploaded yet

- [ ] Commit: "feat: show document validation tips on upload page"

---

## Task 14: Final Build Verification & Cleanup

- [ ] Run `npx prisma generate`
- [ ] Run `npx next build`
- [ ] Fix any TypeScript errors
- [ ] Search for remaining references to old Plan values ("FREE", "BUSINESS") and update
- [ ] Search for hardcoded "Hire" / "New Hire" strings that should use workflow labels
- [ ] Commit: "chore: fix build errors and clean up old plan references"
