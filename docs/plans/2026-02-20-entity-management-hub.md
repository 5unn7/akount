# Entity Management Hub — Implementation Plan (Lean V1)

**Created:** 2026-02-20
**Amended:** 2026-02-20 (post-review — scoped to Lean V1)
**Status:** Approved
**Brainstorm:** [entity-management-hub-brainstorm.md](../brainstorms/2026-02-20-entity-management-hub-brainstorm.md)
**Review:** [docs/reviews/entity-management-hub/SUMMARY.md](../reviews/entity-management-hub/SUMMARY.md)

## Overview

Upgrade the existing entity management stub at `/system/entities` into a full entity hub with list, detail/edit, archival, and jurisdiction-aware entity types for 3 core markets (US, CA, IN). Build at the existing `/system/entities` route (where `page.tsx`, `loading.tsx`, and `error.tsx` already exist). The System domain has no DomainTabs layout — entities are accessible via the sidebar navigation (already wired).

**Scope:** Lean V1 — 14 tasks, 3 sprints, ~1,400-1,800 LOC. Delivers 80% of value at 40% of original plan effort.

## Review-Driven Design Decisions

These decisions come from the [6-agent review](../reviews/entity-management-hub/SUMMARY.md) (4 P0, 8 P1, 17 P2 findings):

| Decision | Rationale | Review Reference |
|----------|-----------|------------------|
| Build at `/system/entities` (not `/overview/entities`) | System domain is for admin config; Overview is read-only dashboard. Stub already exists with loading/error. | Architecture P1-2, Next.js P0-1 |
| `EntityStatus` = `ACTIVE` / `ARCHIVED` only | Defer `PRE_REGISTRATION` — every service joining through entity would need status guards (22 models). | Simplicity, Financial P0-1/P0-2 |
| Jurisdiction data in `apps/api/src/lib/data/jurisdictions/` | 3 JSON files consumed by one app. No new monorepo package needed. | Architecture P1-3, Simplicity |
| Defer `EntityRelationship` model to V2 | Zero demand signal. Solopreneurs with 1-3 entities don't model ownership graphs. No schema migration needed. | Simplicity, Architecture |
| Defer 8-file wizard to V2 | Existing `EntityFormSheet` works. Entity creation happens 1-3 times per account. Enhance existing sheet instead. | Simplicity |
| Defer AI Advisor to V2 | AI infrastructure has 501 stubs. Wire in when AI backend is ready. | Simplicity |
| Use `ownershipBasisPoints Int?` (not Float) if relationships are built in V2 | `33.33 + 33.33 + 33.34 != 100.0` in IEEE 754. Project uses integer cents everywhere. 10000 = 100%. | Security P0-4, Architecture P0-1, Prisma P0-1, Financial P1-1 (4 agents) |
| Add `tenantId` to any future unique constraint | Prevents cross-tenant entity linking at database level. | Security P0-1, Prisma P0-3 |
| Add RBAC to entity read routes (pre-existing fix) | `GET /entities` and `GET /entities/:id` currently have no permission check. | Security P0-2 |
| Fix broken tenant lookup in `entity.ts` (pre-existing fix) | Route queries with Clerk external ID instead of using `request.tenantId`. | Security P0-1, Architecture P0-2 |
| Add audit logging to entity mutations | Zero `createAuditLog()` calls currently. SHA-256 hash chain infrastructure exists but isn't used. | Security P1-2, Financial P1-2 |
| Consolidate entity routes into single file | Routes split across `routes.ts` (inline) and `routes/entity.ts`. Merge into `routes/entities.ts`. | Architecture P1-1 |

## Success Criteria

- [ ] Entities page at `/system/entities` shows entity cards with name, type, status, jurisdiction flag, currency, metrics
- [ ] Entity detail page at `/system/entities/[id]` with edit capabilities and settings form
- [ ] Entity archival with active-data pre-check validation
- [ ] `EntityStatus` enum with `ACTIVE`/`ARCHIVED` values, `status` field on Entity
- [ ] Jurisdiction data for US, CA, IN with entity types, tax ID formats, fiscal year defaults
- [ ] Tax ID format validation per jurisdiction (warn, not block)
- [ ] RBAC on all entity routes (`withPermission('system', 'entities', 'VIEW'|'ADMIN')`)
- [ ] Audit logging on all entity mutations via `createAuditLog()`
- [ ] Navbar entity switcher filters out archived entities
- [ ] All existing entity functionality preserved (navbar switcher, entity creation via EntityFormSheet)
- [ ] Tests for entity service expansion, archival validation, tax ID validation

---

## Sprint 1: Schema, Data & Backend

### Task 1: Jurisdiction entity type data files
**File:** `apps/api/src/lib/data/jurisdictions/` (new directory: `us.json`, `ca.json`, `in.json`, `index.ts`)
**What:** Create JSON data files for 3 core markets containing:
- Available entity types with display names, descriptions, and Prisma `EntityType` enum mapping
- Tax ID name, format label, validation regex pattern
- Default fiscal year start month
- Common currency

Each file exports a typed `JurisdictionConfig` interface. The `index.ts` re-exports a `getJurisdictionConfig(countryCode: string)` lookup function. Unknown countries return `null`.

**Jurisdictions:**
- **US:** Corporation, LLC, Sole Proprietorship, Partnership. Tax ID: EIN (XX-XXXXXXX). Fiscal year: January.
- **CA:** Corporation (Federal/Provincial), Sole Proprietorship, Partnership. Tax ID: BN (9 digits). Fiscal year: January.
- **IN:** Private Limited, LLP, Sole Proprietorship, Partnership, OPC. Tax ID: PAN (XXXXX0000X), GSTIN (15 chars). Fiscal year: April.

**Type:** `JurisdictionConfig` is defined in `packages/types/src/jurisdiction.ts` (new, ~30 lines).

**Depends on:** none
**Success:** `getJurisdictionConfig('US')` returns config; `getJurisdictionConfig('XX')` returns `null`

### Task 2: Prisma schema additions
**File:** `packages/db/prisma/schema.prisma`
**What:**
1. Add `EntityStatus` enum: `ACTIVE`, `ARCHIVED`
2. Add `status EntityStatus @default(ACTIVE)` field to Entity model
3. Add `entitySubType String?` field to Entity (jurisdiction-specific sub-type, e.g., `"S_CORP"`, `"FEDERAL_CORP"`)
4. Add `registrationDate DateTime?` field to Entity
5. Add `@@index([tenantId, status])` to Entity model for efficient status filtering

**No new models in V1.** `EntityRelationship` deferred to V2 (when demand signal exists).

**Depends on:** none
**Risk:** high (schema migration on Entity model — widely referenced across 22 models)
**Review:** `prisma-migration-reviewer`
**Success:** `npx prisma migrate dev` runs cleanly; new fields visible; existing data gets `ACTIVE` default

### Task 3: Generate and verify Prisma migration
**File:** `packages/db/prisma/migrations/`
**What:** Run `npx prisma migrate dev --name add-entity-status-and-subtype`. Verify:
- `status` gets default `ACTIVE` (safe for existing rows — no data migration needed)
- `entitySubType` and `registrationDate` are nullable (safe)
- No data loss on existing Entity rows
- Index `[tenantId, status]` created

**Depends on:** Task 2
**Risk:** high (production migration)
**Review:** `prisma-migration-reviewer`
**Success:** Migration runs against dev DB; existing data intact; `npx prisma migrate status` shows clean

### Task 4: Fix pre-existing security issues
**File:** `apps/api/src/domains/system/routes/entity.ts`, `apps/api/src/domains/system/routes.ts`
**What:** Fix 2 pre-existing bugs discovered in review:

1. **Broken tenant lookup** (`routes/entity.ts:33-35`): Replace manual `TenantUser` lookup with `request.tenantId`:
   ```typescript
   // BEFORE (broken — Clerk ID vs cuid mismatch):
   const tenantUser = await prisma.tenantUser.findFirst({
     where: { userId: request.userId },
   });
   // AFTER (correct):
   const tenantId = request.tenantId;
   ```

2. **Missing RBAC on reads** (`routes.ts:84-138`): Add permission checks:
   ```typescript
   // GET /api/system/entities
   { preHandler: [withPermission('system', 'entities', 'VIEW')] }
   // GET /api/system/entities/:id
   { preHandler: [withPermission('system', 'entities', 'VIEW')] }
   ```

**Depends on:** none (pre-existing — can fix immediately)
**Review:** `security-sentinel`
**Success:** `request.tenantId` used; RBAC enforced on all entity routes

### Task 5: Entity service expansion
**File:** `apps/api/src/domains/system/services/entity.service.ts`
**What:** Expand `EntityService` with:
- `listEntities(options?: { status?: EntityStatus })` — add `status`, `entitySubType`, `country`, `_count` (accounts, clients, vendors, invoices) to select. Add optional status filter.
- `getEntityDetail(id)` — return full entity with `_count` of all related models
- `updateEntity(id, data)` — expand to accept `status`, `entitySubType`, `taxId`, `address`, `city`, `state`, `postalCode`, `registrationDate`. Use `prisma.$transaction` for archive operations.
- `archiveEntity(id)` — set status to `ARCHIVED`. Pre-check: reject if entity has active bank accounts, unpaid invoices, or open bills. Return specific error message listing what blocks archival.
- Add `createAuditLog()` calls to `createEntity`, `updateEntity`, `archiveEntity` (import from `apps/api/src/lib/audit.ts`)

All methods enforce tenant isolation via `this.tenantId`.

**Depends on:** Task 3
**Review:** `security-sentinel` (tenant isolation), `financial-data-validator` (archival checks)
**Success:** All methods enforce tenant isolation; archive validates no active data; audit log created on every mutation

### Task 6: Tax ID validation utility
**File:** `apps/api/src/lib/validators/tax-id.ts` (new, ~60 lines)
**What:** Create `validateTaxId(countryCode: string, taxId: string): { valid: boolean; formatted: string; error?: string }` using regex patterns from jurisdiction data files (Task 1).

Supports:
- **US:** EIN (XX-XXXXXXX) — 9 digits
- **CA:** BN (9 digits)
- **IN:** PAN (XXXXX0000X format), GSTIN (2-digit state + PAN + 1Z + check, 15 chars)

Import patterns from jurisdiction config. Return formatted version (auto-insert dashes, spaces). Unknown countries return `{ valid: true, formatted: taxId }` (pass-through, don't block).

**Depends on:** Task 1
**Success:** `validateTaxId('US', '123456789')` returns `{ valid: true, formatted: '12-3456789' }`

### Task 7: Consolidate and expand entity routes
**File:** `apps/api/src/domains/system/routes/entities.ts` (new — replaces inline routes in `routes.ts` and `routes/entity.ts`)
**What:**
- Move entity routes from `routes.ts` (inline, lines 84-210) and `routes/entity.ts` into `routes/entities.ts`
- Delete `routes/entity.ts` after migration
- Add/modify endpoints:
  - `GET /api/system/entities` — expand response: `status`, `entitySubType`, `country`, `_count`. Add `?status=ACTIVE` query filter.
  - `GET /api/system/entities/:id` — full detail with `_count`
  - `POST /api/system/entities` — accept `entitySubType`, validate tax ID format (warn via response field, don't block)
  - `PATCH /api/system/entities/:id` — update entity (name, taxId, address, fiscalYearStart, entitySubType)
  - `POST /api/system/entities/:id/archive` — archive entity (calls service archival with pre-checks)
- Read routes: `withPermission('system', 'entities', 'VIEW')`
- Write routes: `withPermission('system', 'entities', 'ADMIN')`
- All endpoints use Zod schemas (defined in `schemas/entity.schema.ts`, not inline)
- All `:id` params validated with `z.string().cuid()`

**Depends on:** Tasks 4, 5, 6
**Review:** `fastify-api-reviewer`, `security-sentinel`
**Success:** All endpoints return correct data; RBAC enforced; Zod validates input; old route files cleaned up

### Task 8: Zod schemas for entity routes
**File:** `apps/api/src/domains/system/schemas/entity.schema.ts` (new, ~80 lines)
**What:** Define Zod schemas for all entity endpoints:
- `ListEntitiesQuerySchema` — optional `status` filter
- `EntityIdParamSchema` — `z.object({ id: z.string().cuid() })`
- `CreateEntitySchema` — name, type, country, currency, optional: entitySubType, taxId, address fields
- `UpdateEntitySchema` — partial of create (all optional except id)
- `ArchiveEntitySchema` — just the id param

All monetary fields use `z.number().int()`. Entity type uses `z.enum([...EntityType values])`.

**Depends on:** none
**Success:** Schemas compile; imported by Task 7 routes

### Task 9: Backend tests
**File:** `apps/api/src/domains/system/services/__tests__/entity.service.test.ts` (expand existing), `apps/api/src/lib/validators/__tests__/tax-id.test.ts` (new)
**What:**
- **Entity service tests:** archive validation (reject with active accounts, approve with no active data), status filtering, expanded list with `_count`, audit log creation on mutations, tenant isolation on all methods
- **Tax ID validation tests:** valid/invalid per jurisdiction (US EIN, CA BN, IN PAN/GSTIN), formatting, unknown country pass-through

Follow test conventions: `assertIntegerCents` for monetary fields, tenant isolation test per resource, mock data uses integer cents, soft delete verification.

**Depends on:** Tasks 5, 6
**Success:** All tests pass; covers tenant isolation, archival validation, tax ID formats, audit logging

---

## Sprint 2: Frontend — Entity Hub Page

### Task 10: Entity hub page (upgrade existing stub)
**File:** `apps/web/src/app/(dashboard)/system/entities/page.tsx` (upgrade existing "Coming Soon" stub)
**File:** `apps/web/src/app/(dashboard)/system/entities/loading.tsx` (already exists — update skeleton)
**File:** `apps/web/src/app/(dashboard)/system/entities/error.tsx` (already exists — keep as-is)
**What:** Upgrade the existing server component stub from "Coming Soon" card to:
- Fetch entities via `listEntities()` from `@/lib/api/entities` (server component — uses `apiClient` with `client.ts`)
- Pass data to `EntityHubClient` component
- Keep existing metadata: `title: "Entities | Akount"`
- Update `loading.tsx` to show 3 placeholder entity cards (glass skeleton pattern)

**Depends on:** Task 7 (backend routes must be expanded)
**Review:** `nextjs-app-router-reviewer`
**Success:** `/system/entities` renders entity list; loading skeleton shows during fetch; error boundary works

### Task 11: Entity hub client component
**File:** `apps/web/src/components/entities/EntityHubClient.tsx` (new, ~120 lines)
**What:** `'use client'` component that displays:
- Header: "Entities" title (`font-heading`) + "Add Entity" button (opens existing `EntityFormSheet`)
- Filter pills: All / Active / Archived — uses `bg-ak-bg-3` for inactive, `bg-ak-pri-dim` for active filter
- Grid of `EntityCard` components (responsive: 1 col mobile, 2 col `md`, 3 col `lg`)
- Empty state if no entities (with "Add Entity" CTA using `text-primary`)
- Uses `glass` card containers, `border-ak-border` default borders
- For client-side API calls (refresh after create): use `apiFetch` from `@/lib/api/client-browser` (NOT `client.ts` which imports `'server-only'`)

**Depends on:** Task 10
**Success:** Entity cards display with correct filtering; Add Entity button opens EntityFormSheet

### Task 12: Entity card component
**File:** `apps/web/src/components/entities/EntityCard.tsx` (new, ~80 lines)
**What:** `'use client'` glass card showing:
- Entity name (`font-heading font-normal`)
- Jurisdiction flag emoji + country name (`text-muted-foreground text-sm`)
- Entity type badge (`BadgeGlass` — map type to display name)
- Entity sub-type badge if present (`text-xs text-muted-foreground`)
- Currency badge (`font-mono text-xs`)
- Status badge: Active = `bg-ak-green-dim text-ak-green`, Archived = `bg-ak-bg-3 text-muted-foreground`
- Mini metrics row: X accounts, X clients, X vendors (`font-mono text-xs text-muted-foreground`)
- Hover: `hover:border-ak-border-2 hover:-translate-y-px` lift effect
- Click: navigates to `/system/entities/[id]`
- Container: `glass rounded-xl p-5 transition-all cursor-pointer`

Uses semantic tokens only. No hardcoded hex/rgba values.

**Depends on:** Task 11
**Success:** Card renders with all data; hover effects work; click navigates to detail

### Task 13: Entity detail page
**File:** `apps/web/src/app/(dashboard)/system/entities/[id]/page.tsx` (new)
**File:** `apps/web/src/app/(dashboard)/system/entities/[id]/loading.tsx` (new)
**File:** `apps/web/src/app/(dashboard)/system/entities/[id]/error.tsx` (new)
**What:** Server component that:
- Fetches entity detail via `getEntityDetail(id)` from `@/lib/api/entities` (server-side `apiClient`)
- Passes data to `EntityDetailClient` component
- `generateMetadata` for dynamic title: `"Entity Name | Entities | Akount"`
- Loading skeleton: glass card with field placeholders
- Error boundary with retry button

**Depends on:** Task 10
**Review:** `nextjs-app-router-reviewer`
**Success:** `/system/entities/[id]` renders entity detail; loading/error states work; metadata is dynamic

### Task 14: Entity detail client component + edit form
**File:** `apps/web/src/components/entities/EntityDetailClient.tsx` (new, ~200 lines)
**What:** `'use client'` component with two sections:

**Header section:**
- Entity name (`text-2xl font-heading font-normal`)
- Type badge + status badge (same token styling as EntityCard)
- Jurisdiction flag + country
- Action buttons: "Archive" (if active, `text-destructive`), "Edit" (toggles inline edit mode)

**Settings section (inline edit form):**
- Name: text input (`InputGlass`)
- Fiscal year start: month picker (reuse pattern from `EntityFormSheet`)
- Tax ID: text input with format hint from jurisdiction config. Validate on blur using `validateTaxId` from Task 6 API call. Show expected format (e.g., "EIN: XX-XXXXXXX") as placeholder.
- Address block: street, city, state/province, postal code (`InputGlass` fields)
- Entity sub-type: dropdown filtered by country's jurisdiction config
- Save/Cancel buttons (`ButtonGlass`)

**Metrics cards row:**
- Accounts count, Clients count, Vendors count, Invoices count — `glass rounded-lg p-4` cards with `font-mono text-xl` values, `text-muted-foreground text-xs uppercase` labels

**Archive confirmation:**
- Dialog with warning message listing what blocks archival
- If no blockers: confirm archive, calls `POST /entities/:id/archive`
- Success: redirect to `/system/entities` with toast

Uses `apiFetch` from `@/lib/api/client-browser` for PATCH and archive calls (client component).

**Depends on:** Tasks 7, 13
**Review:** `security-sentinel` (no sensitive data in client state)
**Success:** Detail renders; settings save via PATCH; archive works with pre-check; toast confirms operations

---

## Sprint 3: API Client, Navbar & Integration

### Task 15: Frontend API client expansion
**File:** `apps/web/src/lib/api/entities.ts` (expand existing)
**What:** Expand Entity types and add new API functions:
- Expand `Entity` interface: add `status: EntityStatus`, `entitySubType: string | null`, `country: string`, `registrationDate: string | null`, `_count: { accounts: number; clients: number; vendors: number; invoices: number }`
- Add `EntityStatus` type: `'ACTIVE' | 'ARCHIVED'`
- Add `getEntityDetail(id: string)` — GET with full `_count`
- Add `updateEntity(id: string, data: Partial<Entity>)` — PATCH
- Add `archiveEntity(id: string)` — POST archive
- Keep existing `listEntities()` and `createEntity()` — expand response types

**Note:** `entities.ts` uses `apiClient` from `client.ts` (server-side). Client components needing entity API calls should use `apiFetch` from `client-browser.ts` directly.

**Depends on:** Task 7
**Success:** All functions compile; types match API response shapes; no `any` types

### Task 16: Navbar entity switcher — filter archived
**File:** `apps/web/src/components/layout/Navbar.tsx`
**What:**
- Filter entity list to exclude `status: 'ARCHIVED'` entities from the dropdown switcher
- If current entity becomes archived, auto-switch to first active entity
- No visual changes to navbar — just filtering logic

**Depends on:** Task 15 (expanded Entity type with status)
**Success:** Archived entities hidden from switcher; active entities still selectable

---

## Deferred to V2 (When Demand Signal Exists)

| Feature | Original Tasks | Reason to Defer | Demand Signal |
|---------|---------------|-----------------|---------------|
| `EntityRelationship` model + CRUD | 2 (partial), 5, 17 | Zero demand. Solopreneurs with 1-3 entities don't model ownership graphs. | User requests entity linking |
| Adaptive creation wizard (8 files) | 18-25 | Existing `EntityFormSheet` works. Entity creation happens 1-3 times. | User feedback that creation flow is confusing |
| AI Advisor endpoint | 29, 30 | AI infrastructure has 501 stubs. | AI backend is ready |
| Pre-registration lifecycle | 24, EntityStatus expansion | 22 models need status guards. Multi-sprint hiding in one task. | Users need to track pre-registration entities |
| 3 additional jurisdictions (UK, EU, AU) | 1 (partial) | First users are North American + Indian. Add when users from other markets onboard. | Non-covered market user signs up |
| Entity dashboard widget removal | 26 | Keep entity section on dashboard for now; dedicated page is additive. | UX testing shows redundancy |
| Tax ID format validation on frontend | — | Backend validates. Frontend hint is sufficient for V1. | Users report entering wrong formats |
| Entity type recommendation engine | 22-23 | 5 entity types per jurisdiction don't need a recommendation engine. | User feedback |

---

## Reference Files

| File | Role |
|------|------|
| `apps/web/src/app/(dashboard)/system/entities/page.tsx` | **Existing stub** to upgrade (has loading.tsx + error.tsx) |
| `apps/web/src/components/dashboard/EntityFormSheet.tsx` | Current entity creation form (**keep** — enhanced, not replaced) |
| `apps/api/src/domains/system/services/entity.service.ts` | Current entity service (119 lines — **expand**) |
| `apps/api/src/domains/system/routes.ts` | Current entity routes inline (lines 84-210 — **extract** to routes/entities.ts) |
| `apps/api/src/domains/system/routes/entity.ts` | Broken sub-route (**fix tenant lookup, then merge** into routes/entities.ts) |
| `apps/web/src/lib/api/entities.ts` | Current entity API client (49 lines — **expand** types and functions) |
| `apps/web/src/lib/api/client.ts` | Server-side API client (**use in server components**) |
| `apps/web/src/lib/api/client-browser.ts` | Browser-side API client (**use in `'use client'` components**) |
| `apps/web/src/components/shared/DomainTabs.tsx` | Tab navigation component (reference for consistent tab UX) |
| `apps/web/src/app/(dashboard)/overview/layout.tsx` | Overview tabs pattern (reference, but we build in `/system/`) |
| `apps/web/src/lib/data/countries.ts` | Country data for `CountrySelect` component |
| `apps/api/src/lib/audit.ts` | Audit log utility — `createAuditLog()` with SHA-256 hash chain |
| `packages/db/prisma/schema.prisma` | Entity model (lines 62-109), `EntityType` enum (line 1056) |
| `packages/db/index.ts` | `TENANT_SCOPED_MODELS` array — add new models here |

## Edge Cases

- **Archive entity with active bank accounts** — Block with message listing count: "Settle or transfer X active accounts before archiving"
- **Archive entity with unpaid invoices** — Block: "Close or void X outstanding invoices before archiving"
- **Archive entity with open bills** — Block: "Pay or void X open bills before archiving"
- **Archive the only active entity** — Block: "Cannot archive the only active entity. Create another entity first."
- **Entity type not supported in jurisdiction** — EntityFormSheet filters types by country. Not possible to select unsupported type.
- **Tax ID fails format validation** — Show inline warning with expected format example. Don't block entity creation — warn only.
- **Currency change after creation** — Not allowed via edit form. Show tooltip: "Currency cannot be changed after creation."
- **Existing EntityFormSheet callers** — Navbar and onboarding both use EntityFormSheet. No changes to the sheet in V1 — it continues to work as-is. V2 may enhance it.
- **Unknown country jurisdiction** — `getJurisdictionConfig()` returns `null`. Entity types fall back to Prisma `EntityType` enum values. No tax ID validation.

## Design Token Compliance

All UI components in this plan MUST use semantic tokens. Quick reference:

| Element | Token | DO NOT USE |
|---------|-------|------------|
| Card containers | `glass rounded-xl` | `bg-[rgba(...)]` |
| Card hover | `hover:border-ak-border-2 hover:-translate-y-px` | `hover:border-[rgba(...)]` |
| Default borders | `border-ak-border` | `border-[rgba(255,255,255,0.06)]` |
| Active status badge bg | `bg-ak-green-dim` | `bg-[rgba(52,211,153,0.18)]` |
| Active status badge text | `text-ak-green` | `text-[#34D399]` |
| Archived status badge bg | `bg-ak-bg-3` | `bg-[#1A1A26]` |
| Archived status badge text | `text-muted-foreground` | `text-[#71717A]` |
| Primary CTA | `bg-primary text-primary-foreground` | `bg-[#F59E0B]` |
| Filter pill active | `bg-ak-pri-dim text-ak-pri-text` | `bg-[rgba(245,158,11,0.14)]` |
| Filter pill inactive | `bg-ak-bg-3 text-muted-foreground` | Hardcoded values |
| Headings | `font-heading font-normal` | `font-serif` |
| Body text | `font-sans` | `font-[Manrope]` |
| Numbers/amounts | `font-mono` | `font-[JetBrains Mono]` |
| Labels | `text-xs text-muted-foreground uppercase tracking-wide` | Hardcoded sizes/colors |
| Destructive action | `text-destructive` | `text-[#F87171]` |
| Glass inputs | `InputGlass` component | Raw `<input>` with manual styling |
| Glass buttons | `ButtonGlass` component | Raw `<button>` with manual styling |

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 2, 3 | `prisma-migration-reviewer` |
| Task 4, 5, 7 | `security-sentinel` |
| Task 7, 8 | `fastify-api-reviewer` |
| Task 10, 13 | `nextjs-app-router-reviewer` |
| Task 5 (archival) | `financial-data-validator` |
| Task 11, 12, 14 | `design-system-enforcer` |

## Domain Impact

- **Primary domain:** System (entity API expansion, hub page, detail page)
- **Adjacent domains:**
  - **Overview** — Dashboard aggregation queries should filter by `entity.status = 'ACTIVE'` after migration (P1 fix during Sprint 3 or follow-up task)
  - **Accounting** — `report.service.ts:getEntityIds()` should filter by active status (P1 fix)
  - **Invoicing** — `getInvoiceStats()` ignores entityId parameter (pre-existing bug, separate fix)
  - **Onboarding** — No changes in V1. EntityFormSheet continues to work.
  - **Banking** — No changes needed (entity filter already works)

## Testing Strategy

- **Unit tests:** Entity service (archive validation with multiple blocker types, status filtering, audit log creation), tax ID validator (per jurisdiction — US EIN, CA BN, IN PAN/GSTIN)
- **Integration tests:** Entity routes (CRUD + archival + RBAC enforcement + Zod validation)
- **Frontend:** Manual testing of entity list, detail page, edit form, archive flow, navbar filtering
- **Regression:** Existing entity switching in navbar still works; EntityFormSheet still creates entities; dashboard loads normally

## Progress

- [ ] Sprint 1: Schema, Data & Backend (Tasks 1-9)
- [ ] Sprint 2: Frontend — Entity Hub Page (Tasks 10-14)
- [ ] Sprint 3: API Client, Navbar & Integration (Tasks 15-16)
