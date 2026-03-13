# Plan 1: Foundation & Schema Migration

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the database schema to support all V2 features — new models, modified models, new enums, plan tier update, multi-location, multi-admin, and audit log infrastructure.

**Architecture:** Prisma 7 schema-first approach. Add all new models and modify existing ones in a single migration. Update lib/ utilities to match new schema. Add middleware for role-based access control. Build audit log helper for consistent logging.

**Tech Stack:** Prisma 7, PostgreSQL, Next.js 16 API routes, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-12-filezy-v2-feature-expansion-design.md`

---

## Chunk 1: Schema Migration & Prisma Client

### Task 1: Add New Enums to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new enums after existing enums**

Add these enums at the end of `prisma/schema.prisma`, after the existing `OutreachStatus` enum:

```prisma
enum UserRole {
  OWNER
  ADMIN
  VIEWER
}

enum DocumentVersionStatus {
  CURRENT
  PENDING_REVIEW
  ARCHIVED
  REJECTED
}

enum UploaderType {
  EMPLOYEE
  ADMIN
}

enum ActorType {
  EMPLOYEE
  ADMIN
  SYSTEM
}

enum AuditAction {
  UPLOADED
  SIGNED
  APPROVED
  REJECTED
  REPLACED
  DOWNLOADED
  VIEWED
  CHECKLIST_COMPLETED
  LOGIN
  REMINDER_SENT
  REPORT_GENERATED
  HIRE_CREATED
  HIRE_APPROVED
  CONTENT_VIEWED
  CONTENT_SIGNED
}

enum ContentType {
  DOCUMENT
  VIDEO
  LINK
  CUSTOM_FORM
}

enum HireCustomContentStatus {
  PENDING
  VIEWED
  ACKNOWLEDGED
  SIGNED
}

enum AccountantAccessLevel {
  DOCUMENTS_ONLY
  FULL
  DOCUMENTS_AND_COMPLIANCE
}
```

- [ ] **Step 2: Update Plan enum**

Replace the existing `Plan` enum:

```prisma
enum Plan {
  FREE
  STARTER
  PRO
  BUSINESS
}
```

- [ ] **Step 3: Verify schema parses**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid"

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "schema: add V2 enums and update Plan tier"
```

---

### Task 2: Add New Models to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Employee model**

```prisma
model Employee {
  id                 String            @id @default(cuid())
  email              String            @unique
  name               String?
  phone              String?
  magicLinkToken     String?           @unique
  magicLinkExpiresAt DateTime?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  sessions EmployeeSession[]
  hires    Hire[]

  uploadedVersions DocumentVersion[] @relation("EmployeeUploads")
}
```

- [ ] **Step 2: Add EmployeeSession model**

```prisma
model EmployeeSession {
  id         String   @id @default(cuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  token      String   @unique
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([token])
}
```

- [ ] **Step 3: Add Location model**

```prisma
model Location {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name       String
  address    String?
  city       String?
  state      String?
  zip        String?
  phone      String?
  stateEIN   String?
  isDefault  Boolean  @default(false)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())

  hires          Hire[]
  userLocations  UserLocation[]
  roleTemplates  RoleTemplate[]
  customContent  CustomContent[]
}
```

- [ ] **Step 4: Add UserLocation join table**

```prisma
model UserLocation {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  locationId String
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([userId, locationId])
  @@index([userId])
  @@index([locationId])
}
```

- [ ] **Step 5: Add DocumentVersion model**

```prisma
model DocumentVersion {
  id                    String                @id @default(cuid())
  documentId            String
  document              Document              @relation(fields: [documentId], references: [id], onDelete: Cascade)
  version               Int
  filePath              String
  fileName              String
  fileSize              Int?
  mimeType              String?
  uploaderType          UploaderType
  uploadedByEmployeeId  String?
  uploadedByEmployee    Employee?             @relation("EmployeeUploads", fields: [uploadedByEmployeeId], references: [id])
  uploadedByUserId      String?
  uploadedByUser        User?                 @relation("AdminUploads", fields: [uploadedByUserId], references: [id])
  status                DocumentVersionStatus @default(CURRENT)
  reviewedBy            String?
  reviewedAt            DateTime?
  reviewerNotes         String?
  uploadedAt            DateTime              @default(now())

  currentForDocument Document? @relation("CurrentVersion")
}
```

- [ ] **Step 6: Add OnboardingChecklist and ChecklistItem models**

```prisma
model OnboardingChecklist {
  id          String          @id @default(cuid())
  businessId  String
  business    Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  description String?
  isDefault   Boolean         @default(false)
  createdAt   DateTime        @default(now())

  items         ChecklistItem[]
  roleTemplates RoleTemplate[]
  hires         Hire[]
}

model ChecklistItem {
  id           String              @id @default(cuid())
  checklistId  String
  checklist    OnboardingChecklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  label        String
  description  String?
  sortOrder    Int                 @default(0)
  requiresFile Boolean             @default(false)

  hireItems HireChecklistItem[]
}
```

- [ ] **Step 7: Add HireChecklistItem model**

```prisma
model HireChecklistItem {
  id              String        @id @default(cuid())
  hireId          String
  hire            Hire          @relation(fields: [hireId], references: [id], onDelete: Cascade)
  checklistItemId String
  checklistItem   ChecklistItem @relation(fields: [checklistItemId], references: [id], onDelete: Cascade)
  completedAt     DateTime?
  completedBy     String?
  fileDocumentId  String?

  @@unique([hireId, checklistItemId])
}
```

- [ ] **Step 8: Add CustomContent and HireCustomContent models**

```prisma
model CustomContent {
  id                     String      @id @default(cuid())
  businessId             String
  business               Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  locationId             String?
  location               Location?   @relation(fields: [locationId], references: [id])
  name                   String
  description            String?
  contentType            ContentType
  fileUrl                String?
  externalUrl            String?
  requiresSignature      Boolean     @default(false)
  requiresAcknowledgment Boolean     @default(false)
  sortOrder              Int         @default(0)
  isActive               Boolean     @default(true)
  createdAt              DateTime    @default(now())

  hireContent            HireCustomContent[]
  roleTemplateContent    RoleTemplateCustomContent[]
}

model HireCustomContent {
  id              String                  @id @default(cuid())
  hireId          String
  hire            Hire                    @relation(fields: [hireId], references: [id], onDelete: Cascade)
  customContentId String
  customContent   CustomContent           @relation(fields: [customContentId], references: [id], onDelete: Cascade)
  viewedAt        DateTime?
  acknowledgedAt  DateTime?
  signedAt        DateTime?
  signatureData   Json?
  status          HireCustomContentStatus @default(PENDING)

  @@unique([hireId, customContentId])
}
```

- [ ] **Step 9: Add RoleTemplate and RoleTemplateCustomContent models**

```prisma
model RoleTemplate {
  id           String               @id @default(cuid())
  businessId   String
  business     Business             @relation(fields: [businessId], references: [id], onDelete: Cascade)
  locationId   String?
  location     Location?            @relation(fields: [locationId], references: [id])
  name         String
  docTypes     Json                 @default("[]")
  checklistId  String?
  checklist    OnboardingChecklist? @relation(fields: [checklistId], references: [id])
  createdAt    DateTime             @default(now())

  customContent RoleTemplateCustomContent[]
  hires         Hire[]
}

model RoleTemplateCustomContent {
  id              String        @id @default(cuid())
  roleTemplateId  String
  roleTemplate    RoleTemplate  @relation(fields: [roleTemplateId], references: [id], onDelete: Cascade)
  customContentId String
  customContent   CustomContent @relation(fields: [customContentId], references: [id], onDelete: Cascade)

  @@unique([roleTemplateId, customContentId])
}
```

- [ ] **Step 10: Add DocumentExpiration model**

```prisma
model DocumentExpiration {
  id                String    @id @default(cuid())
  documentId        String    @unique
  document          Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  expiresAt         DateTime
  reminder30SentAt  DateTime?
  reminder7SentAt   DateTime?
  expirationSentAt  DateTime?
  isResolved        Boolean   @default(false)

  @@index([expiresAt, isResolved])
}
```

- [ ] **Step 11: Add AuditLog model**

```prisma
model AuditLog {
  id         String      @id @default(cuid())
  businessId String
  business   Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  hireId     String?
  documentId String?
  action     AuditAction
  actorType  ActorType
  actorId    String?
  ip         String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime    @default(now())

  @@index([businessId, createdAt])
  @@index([hireId])
}
```

- [ ] **Step 12: Add AccountantBusinessAccess model**

```prisma
model AccountantBusinessAccess {
  id           String                @id @default(cuid())
  accountantId String
  accountant   Accountant            @relation(fields: [accountantId], references: [id], onDelete: Cascade)
  businessId   String
  business     Business              @relation(fields: [businessId], references: [id], onDelete: Cascade)
  accessLevel  AccountantAccessLevel @default(DOCUMENTS_ONLY)
  createdAt    DateTime              @default(now())

  @@unique([accountantId, businessId])
}
```

- [ ] **Step 13: Verify schema parses**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid"

- [ ] **Step 14: Commit**

```bash
git add prisma/schema.prisma
git commit -m "schema: add all V2 models"
```

---

### Task 3: Modify Existing Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update User model**

Replace the existing User model:

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  emailVerified DateTime?
  name          String?
  image         String?
  passwordHash  String?
  role          UserRole       @default(OWNER)
  businessId    String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  accounts       Account[]
  sessions       Session[]
  ownedBusiness  Business?      @relation("BusinessOwner")
  business       Business?      @relation("BusinessMembers", fields: [businessId], references: [id])
  accountant     Accountant?
  userLocations  UserLocation[]
  uploadedVersions DocumentVersion[] @relation("AdminUploads")
}
```

- [ ] **Step 2: Update Business model**

Replace the existing Business model:

```prisma
model Business {
  id                     String      @id @default(cuid())
  ownerId                String      @unique
  owner                  User        @relation("BusinessOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  name                   String
  accountantEmail        String?
  accountantName         String?
  state                  String?
  plan                   Plan        @default(FREE)
  stripeCustomerId       String?     @unique
  stripeSubscriptionId   String?     @unique
  referredByAccountantId String?
  referredByAccountant   Accountant? @relation("ReferredBusinesses", fields: [referredByAccountantId], references: [id])
  selfOnboardingEnabled  Boolean     @default(false)
  selfOnboardingSlug     String?     @unique
  defaultRoleTemplateId  String?
  reminderDay1           Int         @default(3)
  reminderDay2           Int         @default(7)
  reminderDay3           Int         @default(14)
  smsEnabled             Boolean     @default(false)
  createdAt              DateTime    @default(now())
  updatedAt              DateTime    @updatedAt

  members     User[]                    @relation("BusinessMembers")
  hires       Hire[]
  locations   Location[]
  commissions Commission[]
  outreach    AccountantOutreach[]
  checklists  OnboardingChecklist[]
  customContent CustomContent[]
  roleTemplates RoleTemplate[]
  auditLogs   AuditLog[]
  accountantAccess AccountantBusinessAccess[]
}
```

- [ ] **Step 3: Update Hire model**

Replace the existing Hire model:

```prisma
model Hire {
  id                      String       @id @default(cuid())
  businessId              String
  business                Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId              String?
  employee                Employee?    @relation(fields: [employeeId], references: [id])
  locationId              String?
  location                Location?    @relation(fields: [locationId], references: [id])
  roleTemplateId          String?
  roleTemplate            RoleTemplate? @relation(fields: [roleTemplateId], references: [id])
  checklistId             String?
  checklist               OnboardingChecklist? @relation(fields: [checklistId], references: [id])
  employeeName            String
  employeeEmail           String?
  employeePhone           String?
  position                String?
  startDate               DateTime?
  uploadToken             String       @unique @default(cuid())
  tokenExpiresAt          DateTime     @default(dbgenerated("NOW() + INTERVAL '30 days'"))
  status                  HireStatus   @default(PENDING)
  completionPct           Int          @default(0)
  selfOnboarded           Boolean      @default(false)
  accountantNotifiedAt    DateTime?
  ownerNotifiedCompleteAt DateTime?
  reminder1SentAt         DateTime?
  reminder2SentAt         DateTime?
  reminder3SentAt         DateTime?
  createdAt               DateTime     @default(now())
  updatedAt               DateTime     @updatedAt

  documents      Document[]
  checklistItems HireChecklistItem[]
  customContent  HireCustomContent[]

  @@index([locationId])
  @@index([employeeId])
}
```

- [ ] **Step 4: Update Document model**

Replace the existing Document model:

```prisma
model Document {
  id               String    @id @default(cuid())
  hireId           String
  hire             Hire      @relation(fields: [hireId], references: [id], onDelete: Cascade)
  docType          String
  currentVersionId String?   @unique
  currentVersion   DocumentVersion? @relation("CurrentVersion", fields: [currentVersionId], references: [id])
  signedAt         DateTime?
  signatureData    Json?
  createdAt        DateTime  @default(now())

  versions    DocumentVersion[]
  expiration  DocumentExpiration?
}
```

- [ ] **Step 5: Update Accountant model — add access relation**

Add to the Accountant model (after existing relations):

```prisma
  businessAccess AccountantBusinessAccess[]
```

- [ ] **Step 6: Verify schema parses**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid"

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "schema: update existing models for V2 relations"
```

---

### Task 4: Generate Migration and Prisma Client

**Files:**
- Modify: `prisma/schema.prisma` (already done)
- Generated: `lib/generated/prisma/` (auto-generated)

- [ ] **Step 1: Generate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" output without errors.

Note: We cannot run `prisma migrate` without a database connection. The migration will be applied on Railway deployment. For local development, the user will need `DATABASE_URL` set. If available, run:

```bash
npx prisma db push
```

This syncs the schema to the database without creating migration files (appropriate for development).

- [ ] **Step 2: Verify build compiles with new schema**

Run: `npx next build 2>&1 | tail -5`
Expected: Build may fail due to existing code referencing old Document fields (filePath, fileName, etc.) and GROWTH plan. This is expected — we'll fix in the next tasks.

- [ ] **Step 3: Commit generated client**

```bash
git add prisma/schema.prisma
git commit -m "schema: generate V2 Prisma client"
```

---

## Chunk 2: Library Updates

### Task 5: Update Plan Definitions

**Files:**
- Modify: `lib/plans.ts`

- [ ] **Step 1: Rewrite lib/plans.ts with new 4-tier structure**

Replace the entire file:

```typescript
import { db } from "@/lib/db"
import type { Plan } from "@/lib/generated/prisma/client"

export interface PlanLimits {
  hiresPerYear: number
  customContentItems: number
  roleTemplates: number
  checklistItemsPerTemplate: number
  locations: number
  adminUsers: number
  smsEnabled: boolean
  selfOnboarding: boolean
  docExpirationAlerts: boolean
  auditLog: "none" | "basic" | "full"
  complianceReport: boolean
  bulkDownload: boolean
  newHireReport: boolean
  accountantInbox: boolean
  apiAccess: boolean
  customBranding: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    hiresPerYear: 1,
    customContentItems: 2,
    roleTemplates: 1,
    checklistItemsPerTemplate: 3,
    locations: 1,
    adminUsers: 0,
    smsEnabled: false,
    selfOnboarding: false,
    docExpirationAlerts: false,
    auditLog: "none",
    complianceReport: false,
    bulkDownload: false,
    newHireReport: false,
    accountantInbox: false,
    apiAccess: false,
    customBranding: false,
  },
  STARTER: {
    hiresPerYear: 10,
    customContentItems: 10,
    roleTemplates: 5,
    checklistItemsPerTemplate: 10,
    locations: 1,
    adminUsers: 2,
    smsEnabled: false,
    selfOnboarding: true,
    docExpirationAlerts: true,
    auditLog: "basic",
    complianceReport: false,
    bulkDownload: true,
    newHireReport: false,
    accountantInbox: false,
    apiAccess: false,
    customBranding: false,
  },
  PRO: {
    hiresPerYear: 30,
    customContentItems: 25,
    roleTemplates: 15,
    checklistItemsPerTemplate: 20,
    locations: 3,
    adminUsers: 5,
    smsEnabled: true,
    selfOnboarding: true,
    docExpirationAlerts: true,
    auditLog: "full",
    complianceReport: false,
    bulkDownload: true,
    newHireReport: true,
    accountantInbox: true,
    apiAccess: false,
    customBranding: false,
  },
  BUSINESS: {
    hiresPerYear: Infinity,
    customContentItems: Infinity,
    roleTemplates: Infinity,
    checklistItemsPerTemplate: Infinity,
    locations: Infinity,
    adminUsers: Infinity,
    smsEnabled: true,
    selfOnboarding: true,
    docExpirationAlerts: true,
    auditLog: "full",
    complianceReport: true,
    bulkDownload: true,
    newHireReport: true,
    accountantInbox: true,
    apiAccess: true,
    customBranding: true,
  },
}

export async function checkHireLimit(
  businessId: string,
  plan: Plan
): Promise<boolean> {
  const limit = PLAN_LIMITS[plan].hiresPerYear
  if (limit === Infinity) return true

  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const count = await db.hire.count({
    where: { businessId, createdAt: { gte: yearStart } },
  })
  return count < limit
}

export function checkFeatureAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const value = PLAN_LIMITS[plan][feature]
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0
  if (typeof value === "string") return value !== "none"
  return false
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/plans.ts
git commit -m "feat: update plan limits to 4-tier structure (Free/Starter/Pro/Business)"
```

---

### Task 6: Create Audit Log Helper

**Files:**
- Create: `lib/audit.ts`

- [ ] **Step 1: Create lib/audit.ts**

```typescript
import { db } from "@/lib/db"
import type { AuditAction, ActorType } from "@/lib/generated/prisma/client"

interface AuditLogEntry {
  businessId: string
  hireId?: string
  documentId?: string
  action: AuditAction
  actorType: ActorType
  actorId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAudit(entry: AuditLogEntry) {
  return db.auditLog.create({
    data: {
      businessId: entry.businessId,
      hireId: entry.hireId,
      documentId: entry.documentId,
      action: entry.action,
      actorType: entry.actorType,
      actorId: entry.actorId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      metadata: entry.metadata ?? undefined,
    },
  })
}

export function extractRequestInfo(request: Request) {
  return {
    ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/audit.ts
git commit -m "feat: add audit log helper utility"
```

---

### Task 7: Create Rate Limiting Utility

**Files:**
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Create lib/rate-limit.ts**

```typescript
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  key: string
  limit: number
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  entry.count++
  const allowed = entry.count <= limit
  return { allowed, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "feat: add in-memory rate limiting utility"
```

---

### Task 8: Update Stripe Configuration for New Plans

**Files:**
- Modify: `lib/stripe.ts`

- [ ] **Step 1: Add plan-to-price mapping with lazy evaluation**

Add to the end of `lib/stripe.ts`:

```typescript
export function getPriceToPlan(): Record<string, Plan> {
  const map: Record<string, Plan> = {}
  if (process.env.STRIPE_PRICE_STARTER) map[process.env.STRIPE_PRICE_STARTER] = "STARTER"
  if (process.env.STRIPE_PRICE_PRO) map[process.env.STRIPE_PRICE_PRO] = "PRO"
  if (process.env.STRIPE_PRICE_BUSINESS) map[process.env.STRIPE_PRICE_BUSINESS] = "BUSINESS"
  return map
}

export function getPlanToPrice(): Record<string, string | undefined> {
  return {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PRO: process.env.STRIPE_PRICE_PRO,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  }
}
```

Note: You will need to import Plan type at the top of the file:

```typescript
import type { Plan } from "@/lib/generated/prisma/client"
```

- [ ] **Step 2: Commit**

```bash
git add lib/stripe.ts
git commit -m "feat: add Pro and Business tier Stripe price mappings"
```

---

## Chunk 3: Fix Existing Code for Schema Changes

### Task 9: Update Document References Throughout Codebase

The Document model no longer has `filePath`, `fileName`, `fileSize`, `mimeType` directly — these are now on DocumentVersion. However, during the transition, existing code needs to work with the new structure. We need to update all files that reference Document fields.

**Files:**
- Modify: `app/api/upload/[token]/route.ts`
- Modify: `app/api/documents/[id]/download/route.ts`
- Modify: `app/api/notify-accountant/route.ts`
- Modify: `app/(dashboard)/hires/[id]/page.tsx`
- Modify: `app/upload/[token]/page.tsx`
- Modify: `lib/documents.ts`

- [ ] **Step 1: Update upload API to create DocumentVersion**

In `app/api/upload/[token]/route.ts`, the POST handler currently creates a Document with file fields. Update it to:

1. Create or find the Document (container) for this docType
2. Create a DocumentVersion with the file data
3. Set the Document's currentVersionId

Replace the document creation section in the POST handler. Find the `db.document.create` call and replace with:

```typescript
// Create or find document container
let document = await db.document.findFirst({
  where: { hireId: hire.id, docType },
})

if (!document) {
  document = await db.document.create({
    data: { hireId: hire.id, docType },
  })
}

// Find latest version number
const latestVersion = await db.documentVersion.findFirst({
  where: { documentId: document.id },
  orderBy: { version: "desc" },
})

// Create new version
const version = await db.documentVersion.create({
  data: {
    documentId: document.id,
    version: (latestVersion?.version ?? 0) + 1,
    filePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploaderType: "EMPLOYEE",
    status: "CURRENT",
  },
})

// If there was a previous CURRENT version, archive it
if (latestVersion && latestVersion.status === "CURRENT") {
  await db.documentVersion.update({
    where: { id: latestVersion.id },
    data: { status: "ARCHIVED" },
  })
}

// Set current version on document
await db.document.update({
  where: { id: document.id },
  data: { currentVersionId: version.id },
})
```

- [ ] **Step 2: Update document download API**

In `app/api/documents/[id]/download/route.ts`, update to fetch the current version's filePath instead of the document's filePath:

```typescript
const document = await db.document.findUnique({
  where: { id: params.id },
  include: {
    currentVersion: true,
    hire: { include: { business: true } },
  },
})

if (!document || !document.currentVersion) {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

const url = await getSignedDownloadUrl(document.currentVersion.filePath)
```

- [ ] **Step 3: Update hire detail page**

In `app/(dashboard)/hires/[id]/page.tsx`, update the document display to use `currentVersion`:

When querying hire documents, include the currentVersion:

```typescript
const hire = await db.hire.findUnique({
  where: { id: params.id },
  include: {
    documents: {
      include: { currentVersion: true },
    },
  },
})
```

When displaying document info, use `doc.currentVersion?.fileName` instead of `doc.fileName`.

- [ ] **Step 4: Update employee upload page**

In `app/upload/[token]/page.tsx`, the client component receives document data from the GET API. Update the GET handler in `app/api/upload/[token]/route.ts` to return version info:

In the GET handler, update the hire query:

```typescript
const hire = await db.hire.findFirst({
  where: { uploadToken: token, tokenExpiresAt: { gt: new Date() } },
  include: {
    business: { select: { name: true } },
    documents: {
      include: { currentVersion: true },
    },
  },
})
```

Map the response to include file info from currentVersion:

```typescript
documents: hire.documents.map((d) => ({
  id: d.id,
  docType: d.docType,
  fileName: d.currentVersion?.fileName ?? null,
  uploadedAt: d.currentVersion?.uploadedAt ?? null,
})),
```

- [ ] **Step 5: Update calculateCompletionPct in lib/documents.ts**

The function queries documents — update it to check for documents with a currentVersion:

```typescript
export async function calculateCompletionPct(hireId: string): Promise<number> {
  const documents = await db.document.findMany({
    where: {
      hireId,
      docType: { in: REQUIRED_DOC_TYPES },
      currentVersionId: { not: null },
    },
  })
  return Math.round((documents.length / REQUIRED_DOC_TYPES.length) * 100)
}
```

Note: If `calculateCompletionPct` doesn't use the db directly (check the actual implementation), adjust accordingly. The key change is that a document is "complete" when it has a `currentVersionId` set.

Also update the caller in the upload route's POST handler. Replace the existing `calculateCompletionPct(allDocs.map(...))` call with:

```typescript
const newPct = await calculateCompletionPct(hire.id)
```

Import it as `import { calculateCompletionPct } from "@/lib/documents"` if not already imported.

- [ ] **Step 5b: Update notify-accountant route**

In `app/api/notify-accountant/route.ts`, update document queries to include `currentVersion`:

```typescript
const documents = await db.document.findMany({
  where: { hireId: hire.id },
  include: { currentVersion: true },
})
```

Replace any `doc.fileName` references with `doc.currentVersion?.fileName` and `doc.filePath` with `doc.currentVersion?.filePath`.

- [ ] **Step 6: Verify build compiles**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds or shows only unrelated warnings.

- [ ] **Step 7: Commit**

```bash
git add app/api/upload/[token]/route.ts app/api/documents/[id]/download/route.ts app/(dashboard)/hires/[id]/page.tsx app/upload/[token]/page.tsx lib/documents.ts
git commit -m "refactor: update document handling for version-based storage"
```

---

### Task 10: Update GROWTH References to PRO

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx`
- Modify: `app/(dashboard)/settings/billing/page.tsx`
- Modify: `app/api/checkout/route.ts`
- Modify: `app/api/webhooks/stripe/route.ts`
- Modify: `app/(accountant)/portal/page.tsx`

- [ ] **Step 1: Search for all GROWTH references**

Run: `grep -r "GROWTH" --include="*.ts" --include="*.tsx" -l`

Update every occurrence of `GROWTH` to `PRO` in business logic. The landing page pricing section also needs updating to show 4 tiers instead of 3.

- [ ] **Step 2: Update each file**

For each file found, replace `GROWTH` with `PRO` where it refers to the plan enum. Be careful not to change strings that are labels (update those to "Pro" for display).

- [ ] **Step 3: Verify build compiles**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename GROWTH plan to PRO across codebase"
```

---

### Task 11: Update Dashboard Layout for Multi-Admin

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `app/(dashboard)/dashboard-shell.tsx`

- [ ] **Step 1: Update dashboard layout to support businessId-based lookup**

In `app/(dashboard)/layout.tsx`, the current layout looks up business via `ownerId`. Update to also check `businessId`:

```typescript
const session = await auth()
if (!session?.user?.id) redirect("/login")

const user = await db.user.findUnique({
  where: { id: session.user.id },
  include: {
    ownedBusiness: true,
    business: true,
  },
})

const business = user?.ownedBusiness ?? user?.business
if (!business) redirect("/signup")
```

- [ ] **Step 2: Pass user role to DashboardShell**

Pass the user's role to the shell so it can conditionally show/hide nav items (e.g., hide Settings/Billing for VIEWERs):

```typescript
<DashboardShell
  user={{ name: user.name, email: user.email, image: user.image, role: user.role }}
>
```

- [ ] **Step 3: Update DashboardShell to respect roles**

In `app/(dashboard)/dashboard-shell.tsx`, accept `role` in the user prop and conditionally render nav items:

- VIEWER: hide Settings link (or show read-only version)
- ADMIN: show everything except Billing
- OWNER: show everything

- [ ] **Step 4: Verify build compiles**

Run: `npx next build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/layout.tsx app/(dashboard)/dashboard-shell.tsx
git commit -m "feat: support multi-admin roles in dashboard layout"
```

---

### Task 12: Add Location Management API

**Files:**
- Create: `app/api/business/locations/route.ts`

- [ ] **Step 1: Create locations CRUD API**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return NextResponse.json({ error: "No business" }, { status: 404 })
  }

  const locations = await db.location.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(locations)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return NextResponse.json({ error: "No business" }, { status: 404 })
  }

  // Check role
  if (user!.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  // Check plan limit
  const limit = PLAN_LIMITS[business.plan].locations
  if (limit !== Infinity) {
    const count = await db.location.count({ where: { businessId: business.id } })
    if (count >= limit) {
      return NextResponse.json(
        { error: `Your plan allows ${limit} location(s). Upgrade to add more.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { name, address, city, state, zip, phone, stateEIN } = body

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const isFirst = (await db.location.count({ where: { businessId: business.id } })) === 0

  const location = await db.location.create({
    data: {
      businessId: business.id,
      name,
      address,
      city,
      state,
      zip,
      phone,
      stateEIN,
      isDefault: isFirst,
    },
  })

  return NextResponse.json(location, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/business/locations/route.ts
git commit -m "feat: add location management API"
```

---

### Task 13: Add Team Management API

**Files:**
- Create: `app/api/business/team/route.ts`

- [ ] **Step 1: Create team CRUD API**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_LIMITS } from "@/lib/plans"
import type { UserRole } from "@/lib/generated/prisma/client"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) {
    return NextResponse.json({ error: "No business" }, { status: 404 })
  }

  const members = await db.user.findMany({
    where: { businessId: business.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userLocations: {
        include: { location: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // Include the owner
  const owner = await db.user.findUnique({
    where: { id: business.ownerId },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json({ owner, members })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true },
  })

  // Only OWNER can invite team members
  if (!user?.ownedBusiness || user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the business owner can manage team" }, { status: 403 })
  }

  const business = user.ownedBusiness

  // Check plan limit
  const limit = PLAN_LIMITS[business.plan].adminUsers
  if (limit === 0) {
    return NextResponse.json(
      { error: "Your plan does not include team members. Upgrade to add admins." },
      { status: 403 }
    )
  }

  if (limit !== Infinity) {
    const count = await db.user.count({ where: { businessId: business.id } })
    if (count >= limit) {
      return NextResponse.json(
        { error: `Your plan allows ${limit} team member(s). Upgrade to add more.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { email, role, locationIds } = body as {
    email: string
    role: UserRole
    locationIds?: string[]
  }

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
  }

  if (role === "OWNER") {
    return NextResponse.json({ error: "Cannot assign OWNER role" }, { status: 400 })
  }

  // Check if user exists
  let invitedUser = await db.user.findUnique({ where: { email } })

  if (invitedUser && invitedUser.businessId) {
    return NextResponse.json({ error: "User already belongs to a business" }, { status: 409 })
  }

  if (!invitedUser) {
    // Create user stub (they'll set password on first login)
    invitedUser = await db.user.create({
      data: { email, role, businessId: business.id },
    })
  } else {
    await db.user.update({
      where: { id: invitedUser.id },
      data: { role, businessId: business.id },
    })
  }

  // Set location scoping
  if (locationIds && locationIds.length > 0) {
    await db.userLocation.createMany({
      data: locationIds.map((locationId) => ({
        userId: invitedUser!.id,
        locationId,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ id: invitedUser.id, email, role }, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/business/team/route.ts
git commit -m "feat: add team management API with role-based invites"
```

---

### Task 14: Rewrite Signup Route for New Schema

**Files:**
- Modify: `app/api/auth/signup/route.ts`

- [ ] **Step 1: Rewrite the signup handler**

The old signup created User with a nested Business via 1:1 relation. The new schema has a separate `BusinessOwner` relation and `BusinessMembers` relation. Rewrite the handler to:

1. Create User with `role: "OWNER"`
2. Create Business with `ownerId: user.id`
3. Set `user.businessId = business.id` (so the owner is also a "member" for queries)
4. Create default Location

```typescript
// Create user
const user = await db.user.create({
  data: {
    email,
    passwordHash: hashedPassword,
    name,
    role: "OWNER",
  },
})

// Create business
const business = await db.business.create({
  data: {
    ownerId: user.id,
    name: businessName,
  },
})

// Link user as member too (for consistent querying)
await db.user.update({
  where: { id: user.id },
  data: { businessId: business.id },
})

// Create default location
await db.location.create({
  data: {
    businessId: business.id,
    name: "Main Office",
    isDefault: true,
  },
})
```

- [ ] **Step 2: Verify the signup flow works**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/signup/route.ts
git commit -m "feat: rewrite signup for multi-admin schema, create default location"
```

---

### Task 15: Final Build Verification and Landing Page Update

**Files:**
- Modify: `app/page.tsx` (landing page pricing section)

- [ ] **Step 1: Update landing page pricing to show 4 tiers**

The current landing page has 3 pricing tiers (Free, Starter $19, Growth $39). Update to 4 tiers:

- Free ($0/forever) — 1 hire/yr
- Starter ($19/mo) — 10 hires/yr
- Pro ($39/mo) — 30 hires/yr, SMS, compliance — "Most Popular"
- Business ($79/mo) — Unlimited everything

Update the pricing section in `app/page.tsx` to include the 4th card and move "Most Popular" badge to Pro.

- [ ] **Step 2: Verify full build**

Run: `npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: update landing page to 4-tier pricing"
```

- [ ] **Step 4: Final commit — tag Plan 1 complete**

```bash
git tag v2-plan1-foundation
```

---

## Summary

After completing Plan 1, the codebase will have:

1. **Full V2 schema** — All new models, modified models, enums, indexes
2. **4-tier plan system** — FREE/STARTER/PRO/BUSINESS with comprehensive feature gating
3. **Audit log infrastructure** — `logAudit()` helper ready for use in all API routes
4. **Rate limiting utility** — In-memory rate limiter for public endpoints
5. **Multi-admin support** — User roles (OWNER/ADMIN/VIEWER) with location scoping
6. **Multi-location support** — Location CRUD API, default location on signup
7. **Team management API** — Invite users, assign roles and location scopes
8. **Document versioning foundation** — DocumentVersion model, updated upload/download flows
9. **Updated landing page** — 4-tier pricing display

**Next plan:** Plan 2 — Document Versioning & Vault (bulk operations, ZIP export, expiration tracking, enhanced hire detail with version history)
