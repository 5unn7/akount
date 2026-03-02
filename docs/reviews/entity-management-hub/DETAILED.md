# Entity Management Hub — Review Synthesis

**Date:** 2026-02-20
**Plan:** `docs/plans/2026-02-20-entity-management-hub.md`
**Files reviewed:** 30+ across API, Web, DB, and Types packages
**Agents completed:** 6/6 (security, architecture, prisma, financial, simplicity, nextjs)

---

## Verdict: CHANGES REQUIRED

**4 P0 blockers** must be fixed before implementation. **8 P1 issues** should be fixed during implementation. The plan is **2-3x over-scoped** for the target user (solopreneurs with 1-3 entities). A Lean V1 (12 tasks / 3 sprints) delivers 80% of the value at 40% of the effort.

**Estimated fix effort:** ~2 hours for P0s (pre-existing bugs), ~6 hours for P1s (plan design fixes)

---

## P0 — Critical (Must Resolve Before Implementation)

### 1. Cross-Tenant Relationship Leakage — Missing `tenantId` in Unique Constraint
**Flagged by:** Security (C1), Prisma (P0-3)
**File:** `docs/plans/2026-02-20-entity-management-hub.md:70`
**Issue:** The proposed `@@unique([sourceEntityId, targetEntityId, relationshipType])` has no `tenantId`. If the service-level tenant check has a bug, the database allows cross-tenant entity linking. Additionally, `EntityRelationship` is not in `TENANT_SCOPED_MODELS` in `packages/db/index.ts`, so even read-path warnings won't fire.
**Fix:** Add `tenantId` to the unique constraint: `@@unique([tenantId, sourceEntityId, targetEntityId, relationshipType])`. Add `EntityRelationship` to `TENANT_SCOPED_MODELS`. **15 min.**

### 2. Broken Tenant Isolation in `PATCH /entity/business-details` (Pre-Existing)
**Flagged by:** Security (P0-1), Architecture (P0-2)
**File:** `apps/api/src/domains/system/routes/entity.ts:33-35`
**Issue:** Route queries `prisma.tenantUser.findFirst({ where: { userId: request.userId } })` where `request.userId` is a Clerk external ID (`user_2abc...`) but `TenantUser.userId` references internal cuid (`clz1abc...`). ID format mismatch causes the query to fail silently. Route bypasses the already-attached `request.tenantId` from tenant middleware.
**Fix:** Replace with `const tenantId = request.tenantId`. **15 min.**

```typescript
// BEFORE (broken):
const tenantUser = await prisma.tenantUser.findFirst({
  where: { userId: request.userId },
});

// AFTER (correct):
const tenantId = request.tenantId;
const entity = await prisma.entity.findFirst({ where: { tenantId } });
```

### 3. Missing RBAC on Entity Read Routes (Pre-Existing)
**Flagged by:** Security (P0-2)
**File:** `apps/api/src/domains/system/routes.ts:84-138`
**Issue:** `GET /api/system/entities` and `GET /api/system/entities/:id` have no RBAC check. Per the permission matrix, BOOKKEEPER, INVESTOR, and ADVISOR should have HIDDEN access. Any authenticated tenant member can currently read all entity data.
**Fix:** Add `withPermission('system', 'entities', 'VIEW')` to both routes. **10 min.**

### 4. `ownershipPercent Float?` Violates Integer-Precision Invariant
**Flagged by:** Security (P1-3), Architecture (P0-1), Prisma (P0-1), Financial (P1-1) — **4 agents**
**File:** Plan Task 2, proposed `EntityRelationship` model
**Issue:** `33.33 + 33.33 + 33.34` may not equal `100.0` in IEEE 754 float arithmetic. The project uses integer cents everywhere to avoid this class of bug. Ownership percentages are used in consolidation calculations (`ConsolidationElimination` model, schema line 821).
**Fix:** Use `ownershipBasisPoints Int?` (10000 = 100%). Sum validation becomes exact: `SUM(basisPoints) <= 10000`. **5 min schema change.**

```prisma
// BEFORE (broken):
ownershipPercent Float?  // 33.33 + 33.33 + 33.34 != 100.0

// AFTER (correct):
ownershipBasisPoints Int?  // 3333 + 3333 + 3334 = 10000 (exactly 100%)
```

---

## P1 — Important (Fix During Implementation)

### 5. `@@unique` with Nullable `targetEntityId` Is Broken in PostgreSQL
**Flagged by:** Prisma (P0-2)
**File:** Plan Task 2, proposed unique constraint
**Issue:** In PostgreSQL, `NULL != NULL`. A unique constraint including a nullable column treats every NULL as distinct. Unlimited duplicate "external" relationships can be created.
**Fix:** Add a partial unique index in raw SQL for external relationships. **15 min.**

```sql
CREATE UNIQUE INDEX "EntityRelationship_tenant_source_type_external_key"
  ON "EntityRelationship" ("tenantId", "sourceEntityId", "relationshipType")
  WHERE "targetEntityId" IS NULL;
```

### 6. Dashboard Aggregation Includes Pre-Registration Entities
**Flagged by:** Financial (P0-1)
**File:** `apps/api/src/domains/overview/services/dashboard.service.ts:43-51`
**Issue:** `getMetrics()` queries all accounts with `entity: { tenantId }` but no status filter. Pre-registration entity balances inflate net worth, cash position, and cash flow projections.
**Fix:** Add `status: 'ACTIVE'` to entity filter after migration. **10 min per service method.**

### 7. Report Service `getEntityIds()` Returns All Entities Without Status Filter
**Flagged by:** Financial (P0-2)
**File:** `apps/api/src/domains/accounting/services/report.service.ts:127-133`
**Issue:** Every consolidated report (P&L, Balance Sheet, Cash Flow, Spending, Revenue) uses `getEntityIds()` which returns ALL entity IDs. Pre-registration and archived entity data flows into formal financial statements.
**Fix:** Add `status: 'ACTIVE'` filter. **5 min.**

### 8. `getInvoiceStats()` Silently Ignores `entityId` Parameter (Pre-Existing Bug)
**Flagged by:** Financial (P0-3)
**File:** `apps/api/src/domains/invoicing/services/invoice.service.ts:185`
**Issue:** Dashboard calls `getInvoiceStats(ctx, entityId)` but the function signature only accepts `ctx: TenantContext` — no `entityId` parameter. The argument is silently dropped. All invoice stats aggregate across all entities.
**Fix:** Add `entityId?: string` parameter and filter. **15 min.**

### 9. Missing `onDelete` on EntityRelationship Relations
**Flagged by:** Prisma (P1-1)
**File:** Plan Task 2, proposed relations
**Issue:** Deleting a target entity silently sets `targetEntityId = NULL` via Prisma's default `SetNull`, converting an internal relationship into a corrupted external one with no name.
**Fix:** Add `onDelete: Restrict` on `targetEntity`, `onDelete: Cascade` on `sourceEntity` and `tenant`. **5 min.**

### 10. No Audit Logging on Entity Mutations
**Flagged by:** Security (P1-2), Financial (P1-2)
**File:** `apps/api/src/domains/system/services/entity.service.ts` (entire file)
**Issue:** Zero `createAuditLog()` calls for create, update, archive, or relationship operations. The audit infrastructure exists (SHA-256 hash chain) but is not called.
**Fix:** Add `createAuditLog()` calls to all entity mutation endpoints. **30 min.**

### 11. Entity Routes Split Across Two Files with Inconsistent URL Prefixes
**Flagged by:** Architecture (P1-1)
**File:** `routes.ts` (inline at lines 84-210) and `routes/entity.ts` (sub-route under `/entity`)
**Issue:** Entity routes use both singular `/entity/business-details` and plural `/entities`. The plan adds 7 more inline endpoints, pushing `routes.ts` past 600 lines.
**Fix:** Consolidate into `routes/entities.ts` (plural). Delete `routes/entity.ts`. **1 hour.**

### 12. Relationship Hard Delete Violates Audit Trail
**Flagged by:** Architecture (P1-4), Financial (P1-5)
**File:** Plan Task 5
**Issue:** Plan states "hard delete (relationships are not financial records)". But ownership percentages affect consolidation calculations, related-party disclosures, and tax compliance. Hard delete destroys audit history.
**Fix:** Add `deletedAt DateTime?` and `effectiveFrom`/`effectiveTo` dates. Use soft delete. **10 min schema, 15 min service.**

---

## High-Confidence Issues (3+ Agents Agree)

| Issue | Agents | Priority |
|-------|--------|----------|
| `ownershipPercent Float?` | Security, Architecture, Prisma, Financial | **P0** (4 agents) |
| Broken tenant lookup in entity.ts | Security, Architecture | **P0** (2 agents + pre-existing) |
| No audit logging on entity mutations | Security, Financial | **P1** (2 agents) |
| Relationship hard delete wrong | Architecture, Financial | **P1** (2 agents) |
| Domain boundary confusion (overview vs system) | Architecture, Simplicity, Next.js | **P1** (3 agents) |
| `packages/data/` shouldn't be a new package | Architecture, Simplicity | **P1** (2 agents) |

---

## YAGNI Assessment — Lean V1

The simplicity reviewer found the plan is **2-3x over-scoped**. Recommended cut:

| Feature | Plan Tasks | Lean V1 | Reason to Defer |
|---------|-----------|---------|-----------------|
| Entity hub page + detail/edit | 9-17 | **Keep (simplified)** | Real gap: no entity edit or archive capability |
| EntityRelationship model + service | 2, 5, 17 | **Defer** | Zero demand signal. Solopreneurs with 1-3 entities don't model ownership graphs |
| Guided decision tree wizard | 22, 23 | **Defer** | 5 entity types don't need a recommendation engine |
| Pre-registration lifecycle | 24, EntityStatus | **Simplify** | `taxId` is already nullable. Just add ACTIVE/ARCHIVED |
| 4 extra jurisdictions (UK, EU, IN, AU) | 1 partial | **Defer** | First users are North American |
| AI Advisor endpoint | 29, 30 | **Defer** | AI infrastructure has 501 stubs |
| 8-file wizard state machine | 18-25 | **Defer** | Existing EntityFormSheet works. Entity creation happens 1-3 times per account |
| `packages/data/` new package | 1 | **Defer** | 6 JSON files consumed by one app. Put in `apps/api/src/lib/data/` |

**Lean V1: 12 tasks, 3 sprints, ~1,200-1,600 LOC** (vs 30 tasks, 7 sprints, ~3,500-4,500 LOC)

---

## Architecture Strengths (Noted by Agents)

1. **Tenant isolation pattern established** — `EntityService` takes `tenantId` in constructor, filters every query
2. **Server-first data flow** — Dashboard layout fetches entities server-side, passes to client
3. **Existing tab infrastructure** — `DomainTabs` component makes adding Entities tab a one-line change
4. **Loading/error state discipline** — Plan explicitly includes `loading.tsx`/`error.tsx` for all new pages
5. **Smart enum decision** — `EntityType` enum + `entitySubType String?` avoids migration churn for jurisdictions
6. **Correct sprint ordering** — Schema first, backend second, frontend third, integration last
7. **Jurisdiction data as JSON** — Adding a country doesn't require a migration

---

## P2 — Nice-to-Have (17 findings across agents)

| # | Finding | Agent(s) | Effort |
|---|---------|----------|--------|
| 1 | Entity response exposes full model without `select` clause | Security | 10 min |
| 2 | No Zod validation on `:id` URL parameter in entity routes | Security | 15 min |
| 3 | Frontend tax ID field lacks format validation | Security | 30 min |
| 4 | Plan missing entity archival authorization checks | Security | 30 min |
| 5 | Zod schema defined inline in route handler (not in schema file) | Architecture | 15 min |
| 6 | EntityType enum expansion not addressed for non-Western structures | Architecture, Prisma | Doc only |
| 7 | Entity archive vs soft delete semantic confusion | Architecture, Prisma | Doc only |
| 8 | Wizard component count is high (8 files) | Architecture, Next.js | 30 min |
| 9 | Entity model lacks `deletedAt` — inconsistent with convention | Prisma, Financial | Doc only |
| 10 | Reverse relations increase Prisma Client type surface | Prisma | 15 min |
| 11 | No `$transaction` wrapper on archive/upgrade operations | Financial | 30 min |
| 12 | Pre-registration entities have no financial guardrails defined | Financial | 1-2 hours (design) |
| 13 | Entity detail sub-route breaks Overview leaf-page pattern | Next.js | 30 min |
| 14 | Wizard API client import strategy not specified (server/client risk) | Next.js | 15 min |
| 15 | Entity list page fetches entities redundantly (layout already fetches) | Next.js | Doc only |
| 16 | Missing `generateMetadata` for dynamic entity detail page | Next.js | 10 min |
| 17 | `(window as any).Clerk` TypeScript escape in browser API client | Security | 10 min |

---

## Cross-Domain Impacts

| Change | Affected Services | Lesson |
|--------|------------------|--------|
| Entity status field addition | dashboard.service.ts, report.service.ts, invoice.service.ts | **Every service that joins through `entity:` must add status filter** |
| Entity archival | Banking (accounts), Invoicing (invoices, clients), Vendors (bills), Accounting (JEs, GL) | **22 models have direct `entityId` FK — all need consideration** |
| Multi-entity navigation | EntityProvider, Navbar, all dashboard components | **Archived entities must be filtered from entity switcher** |
| Report cache invalidation | report-cache.ts | **Entity status changes should invalidate cached reports for that entity** |

---

## Recommended Fix Priority

### Before Implementation (P0) — ~2 hours
1. Fix broken tenant lookup in `entity.ts` (15 min) — pre-existing bug
2. Add RBAC to entity read routes (10 min) — pre-existing gap
3. Change `Float?` to `Int?` basis points in plan (5 min) — plan update
4. Add `tenantId` to unique constraint in plan (5 min) — plan update

### During Sprint 1 (P1 Schema/Backend) — ~3 hours
5. Add partial unique index for NULL targetEntityId
6. Add `onDelete: Restrict/Cascade` specifications
7. Use `EntityRelationshipType` enum (not String)
8. Add `@@index([tenantId, status])` to Entity
9. Add `EntityRelationship` to `TENANT_SCOPED_MODELS`
10. Add audit logging to entity service methods

### During Sprint 2 (P1 Integration) — ~2 hours
11. Add entity status filter to `dashboard.service.ts`
12. Add entity status filter to `report.service.ts:getEntityIds()`
13. Fix `getInvoiceStats()` to accept `entityId` parameter
14. Filter archived entities from Navbar entity selector

### Phase 7+ Scope (Deferred)
15. EntityRelationship model + service (if demand signal exists)
16. 8-file wizard (if entity creation UX tested and found lacking)
17. AI Advisor endpoint (when AI infrastructure is ready)
18. Jurisdiction data files (when non-North American users onboard)
19. Tax ID format validation (when users report entering wrong formats)

---

## Recommended Final EntityRelationship Schema

If the relationship model is built (V2), the corrected schema should be:

```prisma
enum EntityRelationshipType {
  OWNERSHIP
  PARTNERSHIP
  PARENT_SUBSIDIARY
}

enum EntityStatus {
  ACTIVE
  ARCHIVED
}

model EntityRelationship {
  id                    String                    @id @default(cuid())
  tenantId              String
  sourceEntityId        String
  targetEntityId        String?
  relationshipType      EntityRelationshipType
  ownershipBasisPoints  Int?                      // 10000 = 100%
  externalName          String?
  externalDetails       Json?
  deletedAt             DateTime?
  effectiveFrom         DateTime                  @default(now())
  effectiveTo           DateTime?
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt

  tenant        Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  sourceEntity  Entity  @relation("From", fields: [sourceEntityId], references: [id], onDelete: Cascade)
  targetEntity  Entity? @relation("To", fields: [targetEntityId], references: [id], onDelete: Restrict)

  @@unique([tenantId, sourceEntityId, targetEntityId, relationshipType])
  @@index([tenantId])
  @@index([sourceEntityId])
  @@index([targetEntityId])
}
```

Plus partial unique index in migration SQL for external relationships.

---

*Generated by multi-agent review pipeline. 6 agents, 30+ files examined across API, Web, DB, and Types packages.*
