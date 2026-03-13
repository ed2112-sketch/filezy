# Multi-Workflow & Pricing Redesign Spec

**Date:** 2026-03-12
**Status:** Draft

## Overview

Transform Filezy from a single-workflow employer tool into a multi-workflow platform serving three audiences: Employers, Accountants, and Staffing Agencies. All three share a core document-request engine and unified dashboard, but get purpose-built default templates and tailored UI. Pricing shifts from flat tiers to a hybrid usage+subscription model.

---

## 1. Workflow Types

Selected at signup. Stored on Business as `workflowType`.

### Employer
Standard new-hire onboarding:
- Personal info collection
- I-9 with ID upload
- W-4 creation (already built)
- Auto-detect state tax form by location
- Direct deposit setup
- Offer/assignment letter e-sign
- Handbook acknowledgment
- Certification uploads
- Emergency contact capture
- Document validation prompts (guided tips for photo quality, correct form version, etc.)
- Onboarding completion analytics (time-to-complete metrics, bottleneck identification)

### Accountant
Collect financial/payroll documents from business clients:
- W-9 form collection
- EIN confirmation letter
- Bank account details
- Prior payroll records
- Contractor onboarding packets (1099 setup)
- Recurring document request workflows (annual W-9 refresh, automated annual W-9 refresh reminders)
- Can also receive documents FROM employer clients (existing accountant portal)
- Employee census data collection (names, DOB, salary for benefits enrollment)
- State tax registration documents
- Client-specific document portals (each client gets their own upload area)
- White-label branding (logo + colors on client-facing pages)

### Staffing Agency
High-volume worker onboarding:
- CSV bulk invites (upload spreadsheet of workers)
- Reusable worker profiles across placements
- Automated reminder chasing (email + SMS)
- Real-time progress dashboard (complete / missing / not started)
- Background check authorization capture
- Drug test consent form capture
- Assignment-specific agreements (with pay rate details)
- Assignment-specific onboarding templates (different doc sets per assignment type)
- Certification tracking with expiration
- White-label branding (logo + colors on upload pages)
- Usage analytics (onboardings per period, completion rates, avg time-to-complete)

---

## 2. Data Model Changes

### New Enum
```prisma
enum WorkflowType {
  EMPLOYER
  ACCOUNTANT
  STAFFING_AGENCY
}
```

### Modified: Business model
```prisma
model Business {
  // ... existing fields
  workflowType  WorkflowType @default(EMPLOYER)

  // White-label (Staffing Agency feature, available to all)
  brandLogoUrl      String?
  brandPrimaryColor String?   // hex, e.g. "#136334"
  brandAccentColor  String?   // hex

  // Usage-based billing
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
}
```

### Modified: Plan enum
Replace:
```
FREE | STARTER | PRO | BUSINESS
```
With:
```
STARTER | GROWTH | PRO
```

- **STARTER** (pay-as-you-go): $3 per completed onboarding, no monthly fee
- **GROWTH** ($49/mo): 25 onboardings included, $2 per additional
- **PRO** ($99/mo): 75 onboardings included, $1.50 per additional

All plans get all features. The only difference is pricing structure.

### New Model: OnboardingUsage
Tracks completed onboardings per billing period for usage billing.
```prisma
model OnboardingUsage {
  id              String   @id @default(cuid())
  businessId      String
  hireId          String   @unique
  completedAt     DateTime
  periodStart     DateTime
  periodEnd       DateTime
  chargedCents    Int?     // null = not yet billed
  stripeUsageId   String?  // Stripe usage record ID
  business        Business @relation(...)
  hire            Hire     @relation(...)

  @@index([businessId, periodStart])
}
```

### New Document Types
Add to the `DOCUMENT_TYPES` config in `lib/documents.ts`:
- W9 — W-9 Request for Taxpayer ID
- EIN_LETTER — EIN Confirmation Letter
- BANK_DETAILS — Bank Account Information
- PRIOR_PAYROLL — Prior Payroll Records
- CONTRACTOR_1099 — 1099 Contractor Setup
- BACKGROUND_CHECK — Background Check Authorization
- DRUG_TEST_CONSENT — Drug Test Consent Form
- EMPLOYEE_CENSUS — Employee Census Data (for benefits enrollment)
- STATE_TAX_REG — State Tax Registration Documents
- EMERGENCY_CONTACT — Emergency Contact Information
- CERTIFICATION — Professional Certification
- ASSIGNMENT_AGREEMENT — Assignment Agreement
- STATE_TAX (already exists)
- HANDBOOK (already exists)

### New Form Definitions
Add to `lib/forms/`:
- `w9.ts` — W-9 form (TIN, name, business name, entity type, address)
- `emergency-contact.ts` — Name, relationship, phone, alternate phone
- `background-check.ts` — Authorization consent form with signature
- `drug-test-consent.ts` — Drug test authorization consent with signature
- `employee-census.ts` — Name, DOB, salary, dependents for benefits enrollment

---

## 3. Signup Flow Changes

### Step 1: Account details (existing)
Name, email, password, business name

### Step 2: Workflow selection (NEW)
Three cards with icons:
- **Employer** — "Onboard new hires with tax forms, direct deposit, and e-signatures"
- **Accountant** — "Collect W-9s, payroll docs, and financial records from clients"
- **Staffing Agency** — "High-volume worker onboarding with bulk invites and tracking"

Selection sets `business.workflowType`.

### Step 3: Auto-generate default templates
Based on workflow type, create default RoleTemplate(s):

**Employer** → "Standard New Hire" template:
- W4, I9, DIRECT_DEPOSIT, OFFER_LETTER, STATE_TAX, HANDBOOK, EMERGENCY_CONTACT

**Accountant** → "New Client Setup" template:
- W9, EIN_LETTER, BANK_DETAILS, PRIOR_PAYROLL, EMPLOYEE_CENSUS

**Staffing Agency** → "Worker Onboarding" template:
- W4, I9, DIRECT_DEPOSIT, ASSIGNMENT_AGREEMENT, BACKGROUND_CHECK, DRUG_TEST_CONSENT, EMERGENCY_CONTACT, CERTIFICATION

---

## 4. Pricing & Billing Changes

### Stripe Integration
- **STARTER**: No subscription. Use Stripe Payment Intents or invoice for usage charges.
- **GROWTH**: Stripe subscription ($49/mo) + metered usage for overages ($2/onboarding over 25).
- **PRO**: Stripe subscription ($99/mo) + metered usage for overages ($1.50/onboarding over 75).

### Usage Tracking
When a hire reaches status COMPLETE:
1. Create OnboardingUsage record
2. For STARTER: create Stripe usage record ($3)
3. For GROWTH/PRO: check if over included count, create Stripe usage record for overage

### Migration
- Existing FREE businesses → STARTER (they keep access, just pay per use)
- Existing STARTER ($19) → GROWTH (closest match, grandfather for 3 months?)
- Existing PRO ($39) → PRO ($99) — price increase, needs communication
- Existing BUSINESS ($79) → PRO ($99) — they had unlimited, PRO has 75 included

This is a breaking pricing change. For now, implement the new model. Migration strategy TBD with the user.

---

## 5. Referral/Partner System Changes

Generalize from accountant-only to all partner types. The Accountant model already has referral fields (commissionTier, activeReferralCount, totalEarnedCents).

For now, keep using the existing Accountant model for referrals — any workflow type can refer others. The partner dashboard already exists at `/portal/referral`.

Commission tiers (already implemented):
- 1-50 active referrals: 20%
- 51-200: 25%
- 200+: 30%

Commissions calculated on both subscription revenue AND usage overage charges (update webhook handler).

---

## 6. CSV Bulk Invite (Staffing Agency)

New API: `POST /api/hires/bulk-invite`

Accept CSV with columns: name, email, phone, position (optional).
- Parse CSV
- Create Hire records for each row
- Send invite emails via Resend
- Return summary: created, failed, skipped (duplicates)

Plan limit: available to all plans but rate-limited.

---

## 7. White-Label Branding

Available to all workflow types (Employer, Accountant, Staffing Agency).

Business settings page: upload logo, set primary/accent colors.

Applied to:
- Upload page (`/upload/[token]`) — show business logo instead of Filezy logo, use brand colors
- Email templates — business logo in header
- Client-facing portals (accountant client portals, employee portal) — brand colors

Storage: Logo uploaded to S3, URL stored in `business.brandLogoUrl`.

---

## 8. UI Terminology Adaptation

Based on `workflowType`, adapt labels:

| Concept | Employer | Accountant | Staffing Agency |
|---------|----------|------------|-----------------|
| "Hire" | New Hire | Client | Worker |
| "Hires" page | Hires | Clients | Workers |
| "Add New Hire" | Add New Hire | Add Client | Add Worker |
| "Employee" | Employee | Client Contact | Worker |
| "Position" | Position | Service Type | Assignment |

Store label overrides in a `lib/workflow-labels.ts` utility.

---

## 9. Document Validation Prompts

On the upload page, show contextual tips for each document type to reduce re-uploads:
- Photo quality guidance ("Make sure all text is readable", "Avoid glare")
- Correct form version checks ("This should be the 2026 W-4")
- Common mistake warnings ("Don't forget to sign page 2")

Stored as static config in `lib/document-validation-tips.ts`, keyed by doc type.

---

## 10. Landing Page

Update to show three use cases with tabs or sections, plus new pricing.

---

## 11. Impact on Remaining Plans

Plans 4-8 should work with minimal changes since the core engine is shared. Key adjustments:
- Plan 4 (Employee Portal): rename to "Recipient Portal" — works for employees, clients, and workers
- Plan 5 (Custom Content): works as-is, just different default content per workflow
- Plan 6 (Notifications): works as-is
- Plan 7 (Self-Onboarding): works as-is, just different default templates
- Plan 8 (Reports): employer-specific reports stay, add accountant/staffing reports later
