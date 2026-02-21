# Architecture Review: Entity Management Hub

> **Auditor:** architecture-strategist
> **Date:** 2026-02-20
> **Scope:** System domain routes/services, Overview layout, Entity components, Prisma schema, monorepo package structure, domain boundaries
> **Risk Level:** HIGH

---

## Architecture Assessment Summary

| Metric | Value |
|--------|-------|
| Issues Found | 11 |
| P0 (Critical) | 2 |
| P1 (High) | 5 |
| P2 (Medium) | 4 |

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `apps/api/src/domains/system/routes.ts` | 433 | Main system routes — entity, user, settings, audit inline |
| `apps/api/src/domains/system/routes/entity.ts` | 84 | Entity sub-route for business details update |
| `apps/api/src/domains/system/services/entity.service.ts` | 119 | Entity CRUD with tenant isolation |
| `apps/web/src/app/(dashboard)/overview/layout.tsx` | 21 | Overview tab layout (Dashboard, Cash Flow, Net Worth) |
| `apps/web/src/app/(dashboard)/overview/page.tsx` | 213 | Dashboard page with entities embedded in Row 5 |
| `apps/web/src/components/dashboard/EntitiesSection.tsx` | 50 | Collapsible entity section for dashboard |
| `apps/web/src/components/dashboard/EntitiesList.tsx` | 109 | Entity card grid with GlowCard |
| `apps/web/src/components/dashboard/EntityFormSheet.tsx` | 338 | Entity creation sheet form |
| `apps/web/src/lib/api/entities.ts` | 49 | Frontend Entity types and API client |
| `apps/web/src/providers/entity-provider.tsx` | 110 | Entity context provider (cookie+URL-based switching) |
| `apps/web/src/components/layout/Navbar.tsx` | 214 | Navbar with entity selector dropdown |
| `apps/web/src/components/shared/DomainTabs.tsx` | 50 | Tab navigation component |
| `apps/web/src/app/(dashboard)/system/entities/page.tsx` | 37 | Existing "Coming Soon" stub page |
| `apps/web/src/app/(dashboard)/layout.tsx` | 80+ | Dashboard shell — fetches entities at layout level |
| `packages/db/prisma/schema.prisma` | Entity model (lines 62-109), EntityType enum (lines 1056-1062) |

---

## Architecture Strengths

1. **Tenant isolation pattern is established.** `EntityService` takes `tenantId` in its constructor (line 9) and filters every query. The plan's Task 4 correctly extends this pattern for new methods.

2. **Server-first data flow.** The dashboard layout (`layout.tsx`) fetches entities server-side at line 65-68 and passes them to client components. The plan's Task 10 follows this pattern for the new entities page.

3. **Existing tab infrastructure.** `DomainTabs` component and the Overview layout pattern make Task 9 (adding the Entities tab) genuinely a one-line change. Clean.

4. **Loading/error state discipline.** The plan explicitly includes `loading.tsx` and `error.tsx` for both `/overview/entities/` and `/overview/entities/[id]/`, which satisfies Invariant #6.

5. **Wizard state machine design.** Task 18's `useEntityWizard` hook with explicit path/step state machine is a sound pattern for multi-path wizard flows. Keeping all state in a hook rather than scattered across components is correct.

---

## Findings

### P0-1: ownershipPercent Proposed as Float — Violates Invariant #2

**Severity:** P0 (Critical)
**File:** `docs/plans/2026-02-20-entity-management-hub.md`, Task 2, lines 58-59
**Issue:** The plan specifies `ownershipPercent Float?` on the `EntityRelationship` model. While ownership percentages are not monetary amounts, the Prisma schema and project conventions strongly discourage Float types for any numeric precision-sensitive data. More critically, the plan's Task 5 (line 120) validates that `sum of ownership % for an entity <= 100`. Float arithmetic in PostgreSQL introduces precision errors. For example, `33.33 + 33.33 + 33.34` may not equal `100.0` exactly due to IEEE 754 representation, causing false rejection of valid ownership splits.

The Prisma schema currently has **zero** Float fields for any stored business data (all monetary fields use `Int`). The only `Float` in the schema is `exchangeRate` on journal lines, which is explicitly documented as acceptable because rates are never summed or compared for equality.

**Impact:** Ownership validation (`validateOwnershipTotal`) will produce incorrect results for thirds, sixths, and other common fractional splits. Users will be unable to create valid 33.33/33.33/33.34 ownership structures.

**Suggested Fix:** Use `Int` with basis points (100 = 1%, 10000 = 100%) or `Decimal` with explicit precision:

```prisma
// Option A: Integer basis points (preferred, matches int-cents pattern)
ownershipBasisPoints Int?  // 3333 = 33.33%, max 10000 = 100%

// Option B: Prisma Decimal with fixed precision
ownershipPercent Decimal? @db.Decimal(5, 2)  // 5 total digits, 2 decimal (max 999.99)
```

Option A is preferred because it mirrors the integer-cents pattern already established in the codebase and makes sum validation exact: `SUM(basisPoints) <= 10000`.

---

### P0-2: Existing entity.ts Sub-Route Bypasses Tenant Isolation

**Severity:** P0 (Critical)
**File:** `apps/api/src/domains/system/routes/entity.ts`, lines 33-47
**Issue:** The existing `PATCH /api/system/entity/business-details` route does NOT use `EntityService` or the `request.tenantId` from the tenant middleware. Instead, it performs its own tenant lookup via `prisma.tenantUser.findFirst({ where: { userId: request.userId } })` (line 33-35) and then gets the "first entity" for that tenant (line 45-47).

This creates two problems:
1. **No tenant isolation enforcement on the update itself.** The `prisma.entity.update` at line 58 uses `where: { id: entity.id }` without verifying `tenantId`, relying on the assumption that the `findFirst` above returned the correct entity. If a user belongs to multiple tenants (which is supported by the `TenantUser` model), this will always update the first entity of the first tenant found, not necessarily the entity in the currently active tenant context.
2. **The plan's Task 7 proposes adding new routes to `routes.ts` (the parent file), not `routes/entity.ts`.** This means the plan will create *two separate routing patterns* for entity operations: inline routes in `routes.ts` and sub-routes in `routes/entity.ts`, both registered under `/entity` and `/entities` respectively.

**Impact:** The existing route is a pre-existing tenant isolation vulnerability. The plan should fix this as part of the entity service expansion (Task 4), not leave it as-is while building new routes alongside it.

**Suggested Fix:** As part of Task 4, migrate the `PATCH /business-details` endpoint to use `EntityService`:

```typescript
// In entity.service.ts (Task 4 expansion)
async updateBusinessDetails(entityId: string, data: BusinessDetailsInput) {
  const existing = await prisma.entity.findFirst({
    where: { id: entityId, tenantId: this.tenantId },  // Tenant isolation!
  });
  if (!existing) return null;
  return prisma.entity.update({ where: { id: entityId }, data });
}
```

And consolidate all entity routes into a single file (see P1-1).

---

### P1-1: SRP Violation — Entity Routes Split Across Two Files

**Severity:** P1 (High)
**File:** `apps/api/src/domains/system/routes.ts` (lines 76-210) and `apps/api/src/domains/system/routes/entity.ts` (lines 1-84)
**Issue:** Entity route handlers are currently split between two files:
- `routes.ts` contains `GET /entities`, `GET /entities/:id`, `POST /entities` inline (lines 84-210)
- `routes/entity.ts` contains `PATCH /entity/business-details` as a sub-route registered under prefix `/entity` (line 72 of `routes.ts`)

The plan's Task 7 proposes adding 7 more entity endpoints to `routes.ts` (the inline file), which will push it from 433 lines to approximately 600+ lines. This file already handles 5 different concerns: entities, users, settings, data-export, and audit-log.

Note the URL inconsistency: the sub-route uses singular `/entity/business-details` while the inline routes use plural `/entities`. The plan adds routes under `/entities/:id/archive`, `/entities/:id/relationships`, etc. — all in the inline file.

**Impact:** The `routes.ts` file will exceed 600 lines with 7+ entity endpoints, 2 user endpoints, 2 settings endpoints, 1 data-export endpoint, and 1 audit-log endpoint. This violates SRP and makes the file difficult to maintain. The singular/plural URL inconsistency will also cause confusion.

**Suggested Fix:** Create a dedicated `apps/api/src/domains/system/routes/entities.ts` (plural) that consolidates all entity routes, and remove the inline entity routes from `routes.ts`:

```typescript
// routes.ts — clean orchestration only
await tenantScope.register(entityRoutes, { prefix: '/entities' });
// Remove ALL inline entity handlers

// routes/entities.ts — single file for all entity routes
export async function entityRoutes(fastify: FastifyInstance) {
  const service = new EntityService(/* ... */);
  fastify.get('/', ...);           // List entities
  fastify.get('/:id', ...);        // Get entity detail
  fastify.post('/', ...);          // Create entity
  fastify.patch('/:id', ...);      // Update entity
  fastify.post('/:id/archive', ...);
  fastify.post('/:id/upgrade', ...);
  // Relationship sub-routes
  fastify.get('/:id/relationships', ...);
  fastify.post('/:id/relationships', ...);
  // etc.
}
```

Delete the old `routes/entity.ts` (singular) after migrating its business-details logic into the entity service.

---

### P1-2: Domain Boundary Confusion — Entities Under /overview vs /system

**Severity:** P1 (High)
**File:** Plan Tasks 9-10 vs existing `apps/web/src/app/(dashboard)/system/entities/page.tsx`
**Issue:** The plan places the new Entities Hub under `/overview/entities` (as a tab alongside Dashboard, Cash Flow, Net Worth). However, there is already an existing entities page at `/system/entities/page.tsx` (currently a "Coming Soon" stub). The sidebar navigation documented in `apps/web/CLAUDE.md` lists "Entities" under the System section.

This creates a domain boundary violation:
- **Overview** is an analytics/dashboard domain (read-heavy, aggregated views)
- **System** is an administration domain (CRUD operations, entity management, settings)
- Entity creation, editing, archiving, and relationship management are *administrative CRUD operations*, not dashboard analytics

The plan does not address what happens to the existing `/system/entities` route. Users navigating via sidebar "System > Entities" will land on the stub, while the real functionality lives under "Overview > Entities".

**Impact:** Two different URLs for the same concept. Sidebar navigation points to dead page. Domain boundaries confused — management CRUD operations mixed with analytics dashboards.

**Suggested Fix:** There are two valid approaches:

**Option A (Recommended): Keep entities under /system, add a summary widget to /overview.**
- Build the full Entity Hub at `/system/entities` (where it already has stub routes)
- Replace the dashboard's Row 5 entity matrix with a compact "Entity Summary" card that links to `/system/entities`
- This respects the domain boundary: Overview = analytics, System = administration

**Option B: Move to /overview but update sidebar and remove /system/entities.**
- If the product decision is firm on `/overview/entities`, explicitly delete the `/system/entities` stub
- Update the sidebar navigation to remove "System > Entities"
- Document why an administrative CRUD feature lives under an analytics domain

Either way, the plan MUST address the existing `/system/entities` page (3 files: `page.tsx`, `loading.tsx`, `error.tsx`).

---

### P1-3: New Monorepo Package Without Turborepo Configuration

**Severity:** P1 (High)
**File:** Plan Task 1, line 29 — `packages/data/jurisdictions/`
**Issue:** The plan creates a new `packages/data/` package in the monorepo. The current packages are: `packages/db`, `packages/design-tokens`, `packages/types`, `packages/ui`. A new package requires:
1. A `package.json` with a proper name (e.g., `@akount/data`)
2. A `tsconfig.json` extending the root config
3. Registration in `turbo.json` build pipeline
4. Dependency declarations in consuming packages (`apps/api/package.json`, `apps/web/package.json`)
5. TypeScript path mappings if using aliases

None of this is mentioned in the plan. Without it, imports like `import { getJurisdictionConfig } from '@akount/data'` will fail at build time.

**Impact:** Build pipeline will fail. The plan underestimates Task 1 complexity — it is not just "create JSON files", it is "create a new shared package in the monorepo".

**Suggested Fix:** Either:

**Option A (Simpler):** Put jurisdiction data in `packages/types/src/jurisdictions/` since it is type-adjacent reference data with no runtime dependencies. This avoids creating a new package entirely.

**Option B (If new package is justified):** Add explicit sub-tasks to Task 1:
- Create `packages/data/package.json` with `@akount/data` name
- Create `packages/data/tsconfig.json`
- Add `@akount/data` to `apps/api/package.json` and `apps/web/package.json` dependencies
- Update `turbo.json` if build tasks are needed
- Verify `turbo build` succeeds

Option A is recommended. The jurisdiction data is a set of typed constants with no external dependencies — exactly what `packages/types` is for.

---

### P1-4: EntityRelationship Hard Delete Contradicts Audit Requirements

**Severity:** P1 (High)
**File:** Plan Task 5, line 117 — `deleteRelationship(id)` with comment "hard delete (relationships are not financial records)"
**Issue:** The plan asserts that entity relationships are "not financial records" and therefore can be hard deleted. However, entity relationships with ownership percentages directly affect:
1. **Consolidated financial reporting** — The plan itself notes (line 509): "consolidated reports across related entities"
2. **Tax compliance** — Ownership percentages determine related-party transaction disclosure requirements
3. **Audit trail** — If Entity A owns 60% of Entity B, and that relationship is hard-deleted, auditors lose the context for why inter-company transactions existed

The `AuditLog` model captures changes, but a hard delete means the `after` field in the audit log will be the only remaining record. If someone queries "what entities were related to Entity X on date Y?" there is no way to reconstruct the historical state.

**Impact:** Loss of historical relationship data that may be required for tax audits, consolidated reporting, and related-party disclosures.

**Suggested Fix:** Add `deletedAt DateTime?` to `EntityRelationship` and use soft delete:

```prisma
model EntityRelationship {
  // ... existing fields
  deletedAt DateTime?  // Soft delete — ownership history preserved for audit

  @@index([tenantId, deletedAt])
}
```

The service's `deleteRelationship` method should set `deletedAt` rather than using `prisma.entityRelationship.delete()`. All queries should filter `deletedAt: null`.

---

### P1-5: EntityProvider Does Not Support New Status/SubType Fields

**Severity:** P1 (High)
**File:** `apps/web/src/providers/entity-provider.tsx` (lines 14-23) and `apps/web/src/lib/api/entities.ts` (lines 8-14)
**Issue:** The `Entity` interface and `EntityProvider` context are used by the dashboard layout, navbar, and all downstream components. Currently, `Entity` has only `{ id, name, type, currency, country? }`. The plan's Task 13 expands the interface with `status`, `entitySubType`, and `_count`, but does not address:

1. **The EntityProvider** — It passes `entities` to child components and drives the entity switcher. With the new `status` field, archived entities should be filtered out of the switcher. The plan's Task 28 mentions this for the Navbar but does not address the `EntityProvider` itself, which is where the filtering should happen.
2. **The dashboard layout** — `layout.tsx` line 67 calls `listEntities()` and passes the result to `Navbar`. If the API now returns archived entities, the layout needs to filter them before passing to the navbar (or the API needs a `status=ACTIVE` default filter).
3. **The `listEntities()` server function** — The plan's Task 4 says "add optional status filter param" to the service, but the plan's Task 7 does not specify whether the `GET /api/system/entities` endpoint defaults to `status=ACTIVE` or returns all statuses.

**Impact:** After implementing archiving (Task 4), archived entities could appear in the navbar switcher and entity provider unless explicit filtering is added at the API or frontend level. This is a data leakage issue (showing unusable entities) rather than a security issue, but it affects UX across the entire application.

**Suggested Fix:** Add explicit handling in the plan:
- Task 7: `GET /api/system/entities` should default to `status IN (ACTIVE, PRE_REGISTRATION)` and accept an optional `includeArchived=true` query param
- Task 13: Update `EntityProvider` to accept the new fields and filter archived entities from the switcher
- Task 28: Should modify `EntityProvider`, not just the Navbar

---

### P2-1: Zod Schema Defined Inline in Route Handler

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/system/routes.ts`, lines 153-170
**Issue:** The `CreateEntitySchema` Zod schema is defined *inside* the route handler function body (line 153), not in a separate schema file. The established project pattern (documented in `api-conventions.md`) is: Route -> Schema -> Service -> Register. The plan's Task 7 says "Add Zod schemas for all new endpoints" but does not specify creating a schema file.

With 7 new endpoints being added (Task 7), defining all schemas inline in the route handler will make the routes file even harder to maintain. The existing entity service already has a sub-route file (`routes/entity.ts`) with its own inline schema (`UpdateBusinessDetailsSchema` at line 13).

**Impact:** Inconsistency with established patterns. Schemas cannot be reused for frontend validation or API documentation generation if they are buried inside handler closures.

**Suggested Fix:** Create `apps/api/src/domains/system/schemas/entity.schema.ts`:

```typescript
import { z } from 'zod';

export const CreateEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['PERSONAL', 'CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC']),
  status: z.enum(['ACTIVE', 'PRE_REGISTRATION']).optional(),
  // ... rest
});

export const UpdateEntitySchema = z.object({ /* ... */ });
export const CreateRelationshipSchema = z.object({ /* ... */ });
// etc.
```

---

### P2-2: EntityType Enum Expansion Not Addressed

**Severity:** P2 (Medium)
**File:** `packages/db/prisma/schema.prisma`, lines 1056-1062
**Issue:** The current `EntityType` enum has 5 values: `PERSONAL`, `CORPORATION`, `LLC`, `PARTNERSHIP`, `SOLE_PROPRIETORSHIP`. The plan's Task 1 creates jurisdiction-specific entity types (e.g., "S_CORP", "FEDERAL_CORP" for US; Canadian corporation types for CA) and stores them in the new `entitySubType String?` field.

However, the plan does not address whether the base `EntityType` enum needs expansion. For example:
- UK has "LLP" (Limited Liability Partnership) which is distinct from a US LLC
- India has "Private Limited Company" and "One Person Company" which do not cleanly map to any existing enum value
- Australia has "Pty Ltd" which is similar to LLC but legally distinct

The plan uses `entitySubType` as a free-form `String?` to handle this. This means jurisdiction-specific types are unvalidated at the database level — any string can be stored. While this provides flexibility, it also means:
1. No referential integrity on sub-types
2. Typos in sub-type values will not be caught
3. Queries filtering by sub-type require exact string matching

**Impact:** Low immediate risk (free-form string is workable for MVP), but creates technical debt. As more jurisdictions are added, the lack of validation will compound.

**Suggested Fix:** The `String?` approach is acceptable for Sprint 1, but add a comment in the migration noting this is intentional, and create a follow-up task: "Evaluate whether entitySubType should be constrained (enum or check constraint) after 6 core markets are stable."

Also ensure the Zod schema for entity creation validates `entitySubType` against the jurisdiction config (Task 1 data), even if the database does not enforce it:

```typescript
// In entity.schema.ts
entitySubType: z.string().max(50).optional()
  .refine((val, ctx) => {
    if (!val) return true;
    const country = ctx.parent.country;
    const config = getJurisdictionConfig(country);
    return config?.entityTypes.some(t => t.subType === val);
  }, 'Invalid entity sub-type for this jurisdiction'),
```

---

### P2-3: Entity Archive vs Soft Delete Semantic Confusion

**Severity:** P2 (Medium)
**File:** Plan Tasks 2 and 4
**Issue:** The plan introduces an `EntityStatus` enum with `ARCHIVED` state (Task 2) and an `archiveEntity()` service method (Task 4). However, the Entity model currently does NOT have a `deletedAt` field (confirmed by reviewing the schema at lines 62-109 — no `deletedAt` present). This is correct per the `packages/db/CLAUDE.md` table which shows Entity scope as "Tenant" with "No" for Soft Delete.

The plan does not add `deletedAt` to Entity either. This means archiving is purely a status change (`status = ARCHIVED`), not a soft delete. This is a valid design choice, but it creates a semantic inconsistency with the rest of the system:

- For all other models, "hidden from normal queries" uses `deletedAt IS NULL`
- For Entity, "hidden from normal queries" will use `status != ARCHIVED`
- Any new developer or code reviewer will need to remember this exception

Additionally, the plan's Task 4 says `archiveEntity` should "validate no active financial data before archiving", but does not specify what "active financial data" means. Does it mean:
- No DRAFT invoices? No PENDING bills? No unreconciled transactions?
- What about accounts with non-zero balances?

**Impact:** Ambiguity in archival validation could lead to data integrity issues or overly permissive/restrictive archiving.

**Suggested Fix:** Add explicit archival preconditions to the plan:

```typescript
async archiveEntity(id: string): Promise<ArchiveResult> {
  // Preconditions — ALL must pass:
  // 1. No accounts with currentBalance != 0
  // 2. No invoices with status IN (DRAFT, SENT, PARTIALLY_PAID, OVERDUE)
  // 3. No bills with status IN (DRAFT, PENDING, PARTIALLY_PAID, OVERDUE)
  // 4. No unposted journal entries (status = DRAFT)
  // 5. No active bank connections (status = ACTIVE)

  // Return structured errors: { canArchive: false, blockers: [...] }
}
```

---

### P2-4: Wizard Component Count Exceeds Typical Feature Scope

**Severity:** P2 (Medium)
**File:** Plan Sprint 5 (Tasks 18-25) — 8 new files
**Issue:** Sprint 5 creates 8 new files for the wizard:
- `useEntityWizard.ts` (state machine hook)
- `EntityCreationWizard.tsx` (shell)
- `SituationStep.tsx`
- `FastPathStep.tsx`
- `GuidedQuestionsStep.tsx`
- `RecommendationStep.tsx`
- `PreRegistrationStep.tsx`
- `ReviewStep.tsx`

Plus Sprint 7 adds AI integration (2 more files). That is 10 files for entity creation alone. The existing `EntityFormSheet.tsx` (338 lines) handles creation in a single file.

While the wizard design is architecturally sound (each step is a separate component, state is centralized in a hook), the scope is significant. Consider:
- The `GuidedQuestionsStep` depends on jurisdiction decision tree data (Task 1) which is 6 JSON files
- The `RecommendationStep` has a comparison table and AI integration
- The wizard has 3 separate paths with different step sequences

This is not a flaw per se, but the plan should acknowledge the complexity and suggest a phased rollout: Fast path first (most common), then guided, then pre-registration.

**Impact:** Sprint 5 is likely underestimated in effort. If blocked, entity creation still works via the existing `EntityFormSheet`.

**Suggested Fix:** Split Sprint 5 into two sub-sprints:
- **Sprint 5a:** Wizard shell + Fast path only (Tasks 18, 19, 20, 21, 25) — this covers 90% of experienced users
- **Sprint 5b:** Guided + Pre-registration paths (Tasks 22, 23, 24) — can be deferred without blocking

Mark Sprint 7 (AI Advisor) as explicitly optional/deferrable.

---

## Scope Assessment

**Over-engineered areas:**
- The 3-path wizard (Sprint 5) is ambitious for an entity creation flow. Most SaaS products ship with a single form first and add guided flows based on user feedback. The existing `EntityFormSheet` already handles creation well.
- AI Advisor integration (Sprint 7) adds 2 API files, rate limiting, and AI prompt engineering for a feature that has a static fallback. This should be explicitly flagged as "Phase 2" or "optional".

**Under-addressed areas:**
- The plan does not mention updating the sidebar navigation. The System section currently lists "Entities" as a nav item pointing to `/system/entities`. If entities move to `/overview/entities`, the sidebar needs updating.
- The plan does not address the `EntityProvider` (a critical piece of app-wide state) beyond Task 13's type expansion.
- There is no mention of how the existing `EntitiesList.tsx` component (which embeds `EntityFormSheet`) should be deprecated or removed.
- The plan does not specify API response pagination for entities. Most tenants will have few entities, but the architecture should not assume this.

**Missing from the plan:**
- No migration rollback strategy for the schema changes (Task 2-3)
- No mention of updating `packages/db/CLAUDE.md` model table (required per schema conventions)
- No accessibility considerations for the wizard (keyboard navigation, screen reader support, focus management between steps)

---

## Domain Boundary Analysis

The plan's choice to place entities under `/overview` creates a domain boundary violation. Here is the analysis:

| Criterion | /overview/entities | /system/entities |
|-----------|-------------------|-----------------|
| Domain purpose | Analytics, dashboards, read-heavy | Administration, CRUD, settings |
| Existing pattern | Dashboard, Cash Flow, Net Worth (all read-only views) | Entities (stub), Users, Settings, Audit Log (all admin CRUD) |
| Entity operations | Create, edit, archive, relationships, wizard | Create, edit, archive, relationships, wizard |
| API routes | `GET/POST /api/system/entities` (already under system) | Same |
| Sidebar placement | Would need removal from System section | Already listed under System |

The operations being built (CRUD, archiving, relationship management) are administrative in nature. They belong under the System domain. The only argument for `/overview` is discoverability — putting entities next to the dashboard makes them more visible. But this can be solved with a dashboard widget that links to `/system/entities`.

**Recommendation:** Build at `/system/entities` (where infrastructure already exists), add a summary card to the dashboard, and update the plan accordingly.

---

## Recommendations

1. **P0: Fix the ownershipPercent Float issue immediately.** Use integer basis points (10000 = 100%) to match the integer-cents pattern. This must be resolved before Task 2 (schema migration).

2. **P0: Fix the existing tenant isolation bug in `routes/entity.ts`** as part of this plan's scope. Do not build new entity routes alongside a known vulnerability.

3. **P1: Consolidate all entity routes into a single file** (`routes/entities.ts`) and remove inline entity handlers from `routes.ts`. The current split is already problematic; adding 7 more endpoints inline will make it worse.

4. **P1: Resolve the `/overview` vs `/system` domain placement** before implementation starts. This affects routing, sidebar, and 15+ files. Changing it mid-implementation is expensive.

5. **P1: Put jurisdiction data in `packages/types`** rather than creating a new monorepo package. This avoids Turborepo configuration overhead for what is essentially typed reference data.

6. **P1: Add soft delete to EntityRelationship.** Ownership history is audit-relevant data.

7. **P1: Explicitly address EntityProvider** changes in the plan. The provider is used by every page in the dashboard.

8. **P2: Extract Zod schemas** into a dedicated schema file before adding 7 new endpoints.

9. **P2: Split Sprint 5** into fast-path first, guided/pre-registration second.

10. **P2: Define explicit archival preconditions** (which financial records block archiving).

11. **P2: Plan for deprecation** of `EntitiesSection.tsx`, `EntitiesList.tsx`, and the `/system/entities` stub page.
