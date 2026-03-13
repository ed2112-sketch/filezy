# Filezy V2 — Feature Expansion Design Spec

**Date:** 2026-03-12
**Status:** Approved

## Overview

Filezy V2 expands from a simple document collection tool into a full new-hire onboarding platform. This spec covers interconnected features built on the existing Next.js 16 / Prisma 7 / S3 / Stripe stack, deployed on Railway.

---

## 1. Data Model Changes

### New Models

**Employee** — Separate auth entity for employees (not the business User model).

- `id`, `email`, `name`, `phone`
- `magicLinkToken`, `magicLinkExpiresAt`
- `createdAt`, `updatedAt`
- Relations: many Hires (one per employer), many EmployeeSessions

**EmployeeSession** — Session tracking for employee magic link auth.

- `id`, `employeeId`, `token`, `expiresAt`, `createdAt`

**DocumentVersion** — Individual file versions within a Document container.

- `id`, `documentId` (parent), `version` (integer)
- `filePath`, `fileName`, `fileSize`, `mimeType`
- `uploadedAt`
- `uploaderType` enum: EMPLOYEE, ADMIN
- `uploadedByEmployeeId` (nullable FK to Employee), `uploadedByUserId` (nullable FK to User)
- `status`: CURRENT, PENDING_REVIEW, ARCHIVED, REJECTED
- `reviewedBy`, `reviewedAt`, `reviewerNotes`

**Location** — Physical locations within a Business.

- `id`, `businessId`, `name`, `address`, `city`, `state`, `zip`, `phone`
- `stateEIN` (state employer ID for new hire reporting)
- `isDefault`, `isActive`, `createdAt`

**OnboardingChecklist** — Custom task templates per business.

- `id`, `businessId`, `name`, `description`, `isDefault`

**ChecklistItem** — Individual tasks in a checklist.

- `id`, `checklistId`, `label`, `description`, `sortOrder`, `requiresFile`

**HireChecklistItem** — Instance of a checklist item for a specific hire.

- `id`, `hireId`, `checklistItemId`
- `completedAt`, `completedBy`, `fileDocumentId` (optional)

**CustomContent** — Employer-defined onboarding materials.

- `id`, `businessId`, `locationId` (optional, null = global)
- `name`, `description`
- `contentType` enum: DOCUMENT, VIDEO, LINK, CUSTOM_FORM
- `fileUrl` (S3 path) or `externalUrl` (YouTube, etc.)
- `requiresSignature` (boolean), `requiresAcknowledgment` (boolean)
- `sortOrder`, `isActive`, `createdAt`

**HireCustomContent** — Instance of custom content for a specific hire.

- `id`, `hireId`, `customContentId`
- `viewedAt`, `acknowledgedAt`, `signedAt`, `signatureData` (JSON)
- `status`: PENDING, VIEWED, ACKNOWLEDGED, SIGNED

**RoleTemplate** — Predefined doc packages per position.

- `id`, `businessId`, `locationId` (optional, null = global)
- `name`, `docTypes` (JSON array of DocType enum values), `checklistId` (optional)
- Custom content linked via `RoleTemplateCustomContent` join table (see Modified Models)

**DocumentExpiration** — Tracks expiring documents.

- `id`, `documentId`, `expiresAt`
- `reminder30SentAt`, `reminder7SentAt`, `expirationSentAt`
- `isResolved`

**AuditLog** — Every action recorded.

- `id`, `businessId`, `hireId` (optional), `documentId` (optional)
- `action` enum: UPLOADED, SIGNED, APPROVED, REJECTED, REPLACED, DOWNLOADED, VIEWED, CHECKLIST_COMPLETED, LOGIN, REMINDER_SENT, REPORT_GENERATED, etc.
- `actorType` enum: EMPLOYEE, ADMIN, SYSTEM
- `actorId`, `ip`, `userAgent`, `metadata` (JSON), `createdAt`

### Modified Models

**Document** — Becomes a container for versions.

- Keeps: `id`, `hireId`, `docType`
- Adds: `currentVersionId` (FK to DocumentVersion)
- Adds: `signedAt`, `signatureData` (JSON with type, IP, user agent, timestamp, consent)
- Removes: `filePath`, `fileName`, `fileSize`, `mimeType` (moved to DocumentVersion)
- **Migration**: For each existing Document row, create a DocumentVersion with status=CURRENT using the existing file fields, set `currentVersionId`, then drop the old columns.

**Hire** — Enhanced with new relations.

- Adds: `employeeId` (FK to Employee), `locationId` (FK to Location)
- Adds: `roleTemplateId`, `checklistId`, `selfOnboarded` (boolean)
- Adds: `reminder1SentAt`, `reminder2SentAt`, `reminder3SentAt`
- `employeeName`, `employeeEmail`, `employeePhone` are kept as snapshot fields (captured at hire creation time). The Employee model is the source of truth for current info; Hire fields preserve the values at time of hire.

**Business** — Multi-location and self-onboarding support.

- Adds: `selfOnboardingEnabled`, `selfOnboardingSlug`
- Adds: `defaultRoleTemplateId`
- Adds: `reminderDay1` (default 3), `reminderDay2` (default 7), `reminderDay3` (default 14)
- Adds: `smsEnabled` (boolean, Pro+ plans)

**User** — Multi-admin support.

- Adds: `role` enum: OWNER, ADMIN, VIEWER
- Adds: `businessId` FK (many-to-one relation to Business, replacing the current 1:1 via `Business.ownerId`)
- Existing `Business.ownerId` is preserved as a convenience field pointing to the OWNER user. Multiple Users can now belong to one Business via `User.businessId`.

**UserLocation** — Join table for admin location scoping (replaces JSON array).

- `id`, `userId` (FK to User), `locationId` (FK to Location)
- If a User has no UserLocation rows, they have access to all locations.

**RoleTemplateCustomContent** — Join table for role template content assignments (replaces JSON array).

- `id`, `roleTemplateId` (FK to RoleTemplate), `customContentId` (FK to CustomContent)

**AccountantBusinessAccess** — Tracks accountant access level per business.

- `id`, `accountantId` (FK to Accountant), `businessId` (FK to Business)
- `accessLevel` enum: DOCUMENTS_ONLY, FULL, DOCUMENTS_AND_COMPLIANCE

### New Enums

- `DocumentVersionStatus`: CURRENT, PENDING_REVIEW, ARCHIVED, REJECTED
- `AuditAction`: UPLOADED, SIGNED, APPROVED, REJECTED, REPLACED, DOWNLOADED, VIEWED, CHECKLIST_COMPLETED, LOGIN, REMINDER_SENT, REPORT_GENERATED, HIRE_CREATED, HIRE_APPROVED, CONTENT_VIEWED, CONTENT_SIGNED
- `ActorType`: EMPLOYEE, ADMIN, SYSTEM
- `UploaderType`: EMPLOYEE, ADMIN
- `UserRole`: OWNER, ADMIN, VIEWER
- `ContentType`: DOCUMENT, VIDEO, LINK, CUSTOM_FORM
- `HireCustomContentStatus`: PENDING, VIEWED, ACKNOWLEDGED, SIGNED
- `AccountantAccessLevel`: DOCUMENTS_ONLY, FULL, DOCUMENTS_AND_COMPLIANCE

### Modified Enums

- `Plan`: Change from `{FREE, STARTER, GROWTH}` to `{FREE, STARTER, PRO, BUSINESS}`
  - **Migration**: Existing GROWTH subscribers map to PRO. No existing BUSINESS subscribers.
  - Update `lib/plans.ts` with new tier limits.
  - Stripe price IDs: add `STRIPE_PRICE_PRO` and `STRIPE_PRICE_BUSINESS` env vars.

### Required Database Indexes

- `AuditLog(businessId, createdAt)` — Dashboard queries
- `AuditLog(hireId)` — Per-hire audit views
- `DocumentExpiration(expiresAt, isResolved)` — Cron job queries
- `Employee(email)` — Login lookups
- `EmployeeSession(token)` — Session validation
- `Hire(locationId)` — Location-filtered queries
- `Hire(employeeId)` — Employee portal queries
- `UserLocation(userId)`, `UserLocation(locationId)` — Access control

---

## 2. E-Sign & PDF Fill System

### Approach

Client-side PDF generation using `pdf-lib`. Employees see clean React forms — never raw PDFs. Forms are validated in real-time, then `pdf-lib` injects values + signature image into blank PDF templates and uploads the result to S3.

### Form Definitions

Stored in `lib/forms/`:

- `w4.ts` — Name, SSN, address, filing status, dependents, extra withholding, signature
- `i9.ts` — Section 1: name, address, DOB, SSN, citizenship status, signature
- `direct-deposit.ts` — Bank name, routing number, account number, account type
- `offer-letter.ts` — Template with merge fields (name, position, start date, pay rate), signature

Each definition maps form field names to PDF coordinates and page numbers for `pdf-lib` injection.

### Signature Capture

Two modes, employee chooses:

- **Type-to-sign**: Text input rendered in a script font (Dancing Script via Google Fonts). Live preview.
- **Draw-to-sign**: HTML5 canvas, touch-friendly, with clear/undo buttons.

Below signature: legal consent checkbox — "I agree this electronic signature is legally binding."

### Signature Audit Trail

Stored in `Document.signatureData` as JSON:

```json
{
  "type": "typed" | "drawn",
  "value": "Maria Garcia" | "<base64 canvas PNG>",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-03-12T14:30:00Z",
  "consentGiven": true,
  "consentText": "I agree this electronic signature is legally binding"
}
```

### PDF Template Storage

- Blank W-4 and I-9 PDFs stored in `public/forms/` (public IRS/USCIS forms)
- Offer letter: `pdf-lib` generates from a blank PDF template with text injection (employer configures template fields in Settings)
- Direct deposit: `pdf-lib` generates a standard form PDF
- `pdf-lib` loads template, fills fields, embeds signature image, outputs final PDF
- Final PDF uploaded to S3 via existing upload API
- All PDF generation happens client-side in the browser

### New Dependencies (for this section)

- `pdf-lib` — Client-side PDF generation, form filling, signature embedding
- Dancing Script font (Google Fonts) — typed signature rendering

---

## 3. Employee Web Portal

### Magic Link Authentication

1. Employee first arrives via existing upload token link (`/upload/[token]`)
2. After first upload (or immediately), prompted: "Save your access — enter your email to log in anytime"
3. Email matched to existing Employee record or new one created
4. Future logins at `/employee/login`: enter email → magic link via Resend → 15-min token → 30-day session
5. Middleware checks `employee-token` cookie on `/employee/*` routes

### Portal Pages (`app/(employee)/`)

- **`/employee/dashboard`** — All employers with Hire records, completion status per employer
- **`/employee/[hireId]`** — Documents for a specific employer: upload, replace (triggers approval), fill & sign forms, checklist items, custom content, progress bar
- **`/employee/documents`** — Flat view of all documents across all employers, downloadable
- **`/employee/profile`** — Update name, email, phone

### Document Replacement Flow

1. Employee clicks "Replace" on existing document
2. Uploads new version or re-fills form
3. New DocumentVersion created with status `PENDING_REVIEW`
4. Current version stays active (status `CURRENT`)
5. Business owner notified via email: "Maria wants to replace her W-4"
6. Owner reviews → Approve (new = CURRENT, old = ARCHIVED) or Reject (new = REJECTED, old stays CURRENT)
7. Employee notified of decision

### Auth Separation

- Business owners: NextAuth credentials at `/login`
- Employees: Magic links at `/employee/login`
- Separate middleware, session cookies, layouts
- Same email can exist as both Employee and User — they're separate entities

---

## 4. Custom Content & Employer-Defined Documents

### Content Types

- **DOCUMENT** — Employer uploads a PDF (NDA, handbook, safety manual). Can require signature.
- **VIDEO** — YouTube/Vimeo URL. Embedded player. Can require acknowledgment.
- **LINK** — Any external URL. Can require acknowledgment.
- **CUSTOM_FORM** — Future: custom form builder.

### Employer Setup

Dashboard section: "Onboarding Content." Add content → choose type → configure requirements:

- `requiresSignature` — Must e-sign (same signature flow as tax forms)
- `requiresAcknowledgment` — Must click "I have read/watched this"
- Assignable globally (all hires) or per Role Template or per Location

### Employee Experience

In their portal, alongside standard docs, a "Required Content" section:

- **Video**: YouTube embed plays inline. "I've watched this" button (enables after viewing).
- **PDF to sign**: In-browser viewer with signature pad at bottom, same e-sign flow.
- **Link**: Opens in new tab, "I've reviewed this" button.
- All interactions logged to AuditLog.

### Completion Tracking

Custom content items count toward overall onboarding progress alongside standard docs. Business owner sees: "3 of 5 content items completed."

---

## 5. Role Templates

### Structure

A Role Template defines the complete onboarding package for a position:

- Which standard docs are required (W-4, I-9, direct deposit, offer letter — selectable)
- Which custom content is required (safety video, NDA, etc.)
- Which checklist items to complete
- Scoped globally or per-location

### Usage

When creating a new hire, employer picks a Role Template → everything auto-populates. They can still add/remove items per individual hire. Examples:

- "Crew Supervisor" → W-4, I-9, direct deposit, offer letter + safety video + NDA
- "Office Manager" → W-4, I-9, direct deposit, offer letter + confidentiality agreement
- "Driver" → All above + driver's license upload + drug test checklist item

---

## 6. Automated Reminders (Email + SMS)

### Email Reminders

Configurable schedule per business (Settings):

- **Reminder 1**: Default 3 days after invite
- **Reminder 2**: Default 7 days after invite
- **Reminder 3 (final)**: Default 14 days after invite, marked "urgent"

Triggers: Any hire with PENDING or IN_PROGRESS status — missing standard docs, incomplete custom content, incomplete checklist items.

Email content: Personalized, lists exactly what's outstanding, includes magic link for direct portal access. Final reminder has stronger language.

### SMS Reminders (Twilio — Pro+ plans)

- Same trigger schedule as email
- Short message: "Hi Maria, you have 2 items left for Acme Landscaping. Complete here: [short link]"
- Short links via `/s/[code]` redirect — code is single-use and expires after 24 hours. Redirects to `/employee/verify` with a one-time token. Rate limited to 5 requests per minute per IP.
- Opt-out handling via Twilio's built-in STOP keyword
- Business owner toggles SMS in Settings

### Manual Reminders

- "Send Reminder Now" button on any incomplete hire
- Optional custom message field
- Logged in AuditLog

### Tracking

- `reminder1SentAt`, `reminder2SentAt`, `reminder3SentAt` on Hire model
- Visible in hire detail timeline
- Daily cron job (Railway cron) checks schedule, sends via Resend (email) and Twilio (SMS)

### New Dependency

- `twilio` — SMS sending

---

## 7. Document Expiration Tracking

### Setup

- When uploading certain doc types, system prompts for optional expiration date
- Applicable to: driver's license, work permits, certifications, any custom content marked "expires"
- Business owner can manually set expiration on any document from hire detail

### Alerts

- **30 days before**: Email to business owner
- **7 days before**: Second alert, marked urgent. SMS if enabled (Pro+).
- **On expiration**: Final alert, document flagged as EXPIRED in vault. SMS if enabled.
- Employee also notified: "Your [doc] expires soon — please upload an updated version"

### Dashboard Integration

- New card on main dashboard: "Expiring Soon" — docs expiring in next 30 days
- Badge on employee rows in hires list if they have expiring docs
- Filter on hires page: "Has expiring documents"

### Implementation

Same daily cron job that handles reminders checks DocumentExpiration table.

---

## 8. Onboarding Checklists

### Employer Setup

Within Role Templates or standalone: add checklist items with label, description, sort order, optional file upload requirement. Reorder via drag-and-drop (sortOrder field).

Examples: "Complete drug test", "Return uniform deposit", "Watch orientation video."

### Employee Experience

Checklist section in portal below documents. Each item: checkbox + label + description. Some require file upload (links to doc upload flow), some are just acknowledgment. Check off → timestamped, logged in AuditLog.

### Tracking

Checklist completion counts toward overall onboarding progress. Business owner sees combined: "Documents: 3/4, Checklist: 2/5, Content: 1/2."

---

## 9. Multi-Admin & Roles

### User Roles

- **OWNER**: Full access — billing, team management, all locations, can invite/remove admins
- **ADMIN**: Manage hires, approve documents, send reminders, manage templates. No billing access. Can be scoped to specific locations.
- **VIEWER**: Read-only access to hires and documents. Scopeable to locations. Good for accountants wanting dashboard access.

### Team Management

New Settings page: "Team" — invite users by email, assign role, assign location scope (all or specific locations).

---

## 10. Self-Onboarding

### Setup

Business enables in Settings → gets unique URL: `filezy.com/join/[business-slug]` (or per-location: `filezy.com/join/[slug]/[location-slug]`).

### Employee Flow

1. Visit link → fill in: name, email, phone, position (dropdown from Role Templates)
2. System creates Hire record with `selfOnboarded: true`, assigns Role Template
3. Business owner notified: "New self-onboarded employee: Maria Garcia"
4. Hire stays PENDING until owner approves
5. Employee can start uploading immediately, but docs aren't finalized until approved

---

## 11. Document Vault & Bulk Operations

### Per-Employee View (enhanced hire detail)

- All document versions visible with expandable version history per doc
- Each version: filename, uploaded date, uploaded by, status badge
- Download individual docs, preview PDFs inline
- Custom content items in separate tab

### Bulk Operations (enhanced hires list)

- **Filter bar**: By status, role template, location, date range, missing documents
- **Missing doc filter**: "Show everyone missing an I-9"
- **Bulk download ZIP**: Select hires → download as ZIP. Structure: `EmployeeName/W-4.pdf`, etc.
- **Bulk export for accountant**: Select hires → package and email all current docs
- **CSV export**: Employee list with completion status, dates, missing docs

### Search

Search bar on hires page: employee name, email, position.

### ZIP Generation (`/api/documents/bulk-download`)

Accepts array of hire IDs, fetches CURRENT versions from S3, streams ZIP (using `archiver` or `jszip`).

---

## 12. Multi-Location Support

### Location Model

Each Business has one or more Locations. Default location created on business signup.

### Impact on Features

- **Hires**: assigned to a location
- **Dashboard**: location switcher in top nav — filter by location or "All Locations"
- **Role Templates & Custom Content**: global or per-location
- **Admin scoping**: ADMIN/VIEWER users can be assigned to specific locations
- **Self-onboarding**: per-location links
- **New hire reporting**: uses location's state + stateEIN
- **Accountant portal**: browse by business → location

### Plan Limits

- Free: 1 location
- Starter: 1 location
- Pro: 3 locations
- Business: Unlimited locations

---

## 13. New Hire Report Generation

### Phase 1 (this spec): Report Generation

- Auto-generate state-specific new hire report PDF/CSV for all 50 states
- Data sourced from Hire + Employee + Business/Location (name, SSN, address, DOB, hire date, employer EIN)
- Downloadable from hire detail page: "Download New Hire Report"
- Bulk generation: "Generate all new hire reports for March"
- Pro and Business tier feature

### Phase 2 (future, not in this spec): Auto-Filing

- Direct submission to state agency portals for top 10-15 states
- Business tier exclusive

---

## 14. Accountant Portal Redesign

### Dashboard (`/portal`)

- **Client switcher**: Left sidebar listing all businesses, with location sub-items. Badge showing pending items per business. Search/filter.
- **Overview**: Aggregated stats — total businesses, active hires, docs received this month, "needs attention" section.

### Per-Business View (`/portal/clients/[businessId]`)

- **Location tabs**: Switch between locations or "All"
- **Hires list**: Same as business owner sees, access level configurable
- **Document access**: Download individual, bulk ZIP per location/business
- **Completion dashboard**: Who's done, who's lagging, what's missing
- **New hire reports**: View/download generated state reports

### Accountant-Specific Features

- **Document inbox**: Chronological feed of new documents across all clients. Click to view/download.
- **Bulk export**: Select multiple businesses/locations → organized ZIP download.
- **Client activity feed**: Timeline of recent actions across all clients.
- **Accountant notes**: Per-hire or per-document private notes.

### Access Control

- Business owner invites accountant by email, configures access level: "Documents only" / "Full access" / "Documents + Compliance reports"
- Accountant can request additional access — owner approves
- Accountant can optionally get VIEWER-level dashboard access

---

## 15. Accountant Referral Dashboard

### Referral Hub (`/portal/referral`)

Prominent placement — tab in portal nav + banner on main dashboard.

### Stats Cards

- **Total Earnings**: Lifetime commissions
- **Monthly Recurring**: Current monthly commission
- **Active Referrals**: Number of paying referred clients
- **Current Tier**: 20%/25%/30% with progress bar to next tier

### Referral Link Section

- Unique link: `filezy.com/r/[slug]` with copy button
- Customizable slug
- Auto-generated QR code — downloadable PNG
- Pre-written share templates: email, LinkedIn, SMS blurb

### Referral Activity Table

Columns: Client, Signed Up, Plan, Status (Active/Churned/Trial), Monthly Commission. Filterable by status.

### Earnings History

- Monthly bar chart of commission payouts
- Per-month breakdown: which clients, how much each
- Payout status: Pending, Processing, Paid

### Tier Progress

Visual progress tracker showing current count, current tier %, and referrals needed for next tier. Nudge when close to next tier.

### Click Analytics

Total clicks, unique visitors, conversion rate, clicks over time (weekly chart).

### Promotional Nudges

- On client list: "Know another business? Share your link"
- After viewing completed onboarding: "This is what your other clients are missing"
- Monthly email digest: earnings summary + "Here's how to earn more"

---

## 16. Audit Log & Compliance Report

### Audit Log

Every action logged: uploads, signatures, approvals, rejections, downloads, views, logins, reminders sent. Stored in AuditLog table. Viewable in dashboard, filterable by employee, action type, date range.

- Growth plan: full audit log
- Starter: basic activity feed (last 30 days, limited actions)
- Free: no audit access

### Compliance Report (downloadable PDF per employee)

Generated on-demand via `pdf-lib`. Contains:

- Employee info (name, position, start date, location)
- Every document: type, upload date, signer, signature audit data
- Every custom content item: viewed/signed dates
- Checklist completion dates
- Full action timeline with timestamps, IPs, actors

Download from hire detail page: "Generate Compliance Report." Business tier feature.

---

## 17. Updated Plan Tiers

| Feature | Free | Starter ($19/mo) | Pro ($39/mo) | Business ($79/mo) |
|---------|------|-------------------|--------------|---------------------|
| Hires per year | 1 | 10 | 30 | Unlimited |
| E-sign & employee portal | Yes | Yes | Yes | Yes |
| Document vault | Basic | Full | Full | Full |
| Custom content items | 2 | 10 | 25 | Unlimited |
| Role templates | 1 | 5 | 15 | Unlimited |
| Checklist items per template | 3 | 10 | 20 | Unlimited |
| Locations | 1 | 1 | 3 | Unlimited |
| Email reminders | Yes | Yes | Yes | Yes |
| SMS reminders (Twilio) | No | No | Yes | Yes |
| Multi-admin users | No | 2 | 5 | Unlimited |
| Location-scoped admins | No | No | Yes | Yes |
| Self-onboarding link | No | Yes | Yes | Yes |
| Doc expiration alerts | No | Yes | Yes | Yes |
| Audit log | No | Basic (30 days) | Full | Full |
| Compliance report PDF | No | No | No | Yes |
| Bulk download ZIP | No | Yes | Yes | Yes |
| New hire report generation | No | No | Yes | Yes |
| Accountant portal access | Basic | Full | Full | Full |
| Accountant bulk export | No | Yes | Yes | Yes |
| Accountant document inbox | No | No | Yes | Yes |
| API access | No | No | No | Yes |
| Custom branding | No | No | No | Yes |
| Priority support | No | No | Yes | Yes |

---

## 18. New Dependencies

| Package | Purpose |
|---------|---------|
| `pdf-lib` | Client-side PDF generation, form filling, signature embedding |
| `twilio` | SMS reminders (Pro+ plans) |
| `archiver` | Server-side ZIP file generation for bulk downloads |
| `qrcode` | QR code generation for referral links |

---

## 18b. Infrastructure & Security

### Cron Jobs

Deployed on Railway using the existing cron pattern (see `cron/accountant-outreach.ts`). A single daily cron endpoint handles:

- Employee reminder emails/SMS (section 6)
- Document expiration alerts (section 7)
- Accountant monthly digest emails (section 15)

Cron endpoint: `/api/cron/daily` — protected by a `CRON_SECRET` env var header check.

### Rate Limiting on Public Endpoints

| Endpoint | Limit |
|----------|-------|
| `/api/employee/magic-link` | 3 requests per email per hour |
| `/api/hires/self-onboard` | 10 requests per IP per hour |
| `/s/[code]` | 5 requests per IP per minute |
| `/api/upload/[token]` | 20 requests per token per hour |

Implementation: In-memory rate limiting via a simple Map with TTL (sufficient for single-instance Railway deployment).

---

## 19. New API Routes (summary)

| Route | Purpose |
|-------|---------|
| `/api/employee/magic-link` | Send magic link email |
| `/api/employee/verify` | Verify magic link token, create session |
| `/api/employee/[hireId]/documents` | Employee document operations |
| `/api/employee/[hireId]/checklist` | Employee checklist operations |
| `/api/employee/[hireId]/content` | Employee custom content operations |
| `/api/documents/[id]/versions` | Document version management |
| `/api/documents/[id]/approve` | Approve replacement version |
| `/api/documents/[id]/reject` | Reject replacement version |
| `/api/documents/bulk-download` | ZIP generation for bulk download |
| `/api/documents/[id]/sign` | E-sign submission with audit data |
| `/api/business/locations` | CRUD for locations |
| `/api/business/team` | Invite/manage admin users |
| `/api/business/content` | CRUD for custom content |
| `/api/business/templates` | CRUD for role templates |
| `/api/business/checklists` | CRUD for onboarding checklists |
| `/api/hires/self-onboard` | Public self-onboarding endpoint |
| `/api/hires/[id]/report` | Generate new hire state report |
| `/api/hires/[id]/compliance` | Generate compliance report PDF |
| `/api/audit` | Query audit log |
| `/api/portal/clients` | Accountant client list |
| `/api/portal/clients/[id]` | Accountant per-client view |
| `/api/portal/inbox` | Accountant document inbox |
| `/api/portal/referral/stats` | Referral dashboard data |
| `/api/sms/send` | Twilio SMS sending |
| `/s/[code]` | Short link redirect with magic link auth |

---

## 20. New Pages (summary)

### Employee Portal (`app/(employee)/`)
- `/employee/login` — Magic link login
- `/employee/dashboard` — Multi-employer overview
- `/employee/[hireId]` — Per-employer documents, checklist, content
- `/employee/documents` — All documents across employers
- `/employee/profile` — Edit personal info

### Dashboard Enhancements (`app/(dashboard)/`)
- `/settings/locations` — Manage locations
- `/settings/team` — Manage admin users
- `/content` — Manage custom content
- `/templates` — Manage role templates
- `/audit` — View audit log
- Enhanced `/hires` — Location filter, bulk operations, missing doc filter
- Enhanced `/hires/[id]` — Version history, approval queue, compliance report download
- Enhanced `/hires/new` — Role template selection, location selection
- Enhanced `/dashboard` — Location switcher, expiring docs card

### Accountant Portal Enhancements (`app/(accountant)/`)
- `/portal` — Redesigned dashboard with client switcher
- `/portal/clients/[id]` — Per-client view with location tabs
- `/portal/inbox` — Document inbox feed
- `/portal/referral` — Referral dashboard with stats, earnings, analytics

### Public Pages
- `/join/[slug]` — Self-onboarding (business-level)
- `/join/[slug]/[location]` — Self-onboarding (location-level)
- `/s/[code]` — Short link redirect
