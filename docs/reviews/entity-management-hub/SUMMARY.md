---
review_id: entity-management-hub
date: 2026-02-20
plan: docs/plans/2026-02-20-entity-management-hub.md
verdict: changes_required
agents: [security, architecture, prisma, financial, simplicity, nextjs]
p0_count: 4
p1_count: 8
p2_count: 17
fix_effort_hours: 8

anti_patterns:
  - id: float-for-financial-precision
    pattern: "Float type for ownership percentage that feeds into consolidation calculations"
    files: [docs/plans/2026-02-20-entity-management-hub.md]
    fix: "Use ownershipBasisPoints Int? (10000 = 100%)"
    severity: P0
    line: "57"

  - id: broken-tenant-lookup
    pattern: "Route queries TenantUser.userId with Clerk external ID instead of using request.tenantId"
    files: [apps/api/src/domains/system/routes/entity.ts]
    fix: "Replace with const tenantId = request.tenantId"
    severity: P0
    line: "33-35"

  - id: missing-rbac-on-reads
    pattern: "GET entity routes missing withPermission() RBAC check"
    files: [apps/api/src/domains/system/routes.ts]
    fix: "Add withPermission('system', 'entities', 'VIEW') to both read routes"
    severity: P0
    line: "84-138"

  - id: unique-constraint-without-tenant
    pattern: "@@unique constraint without tenantId enables cross-tenant entity linking"
    files: [docs/plans/2026-02-20-entity-management-hub.md]
    fix: "Add tenantId to unique constraint: @@unique([tenantId, sourceEntityId, targetEntityId, relationshipType])"
    severity: P0
    line: "70"

recurring_issues:
  - issue: "Entity status not filtered in aggregation queries"
    occurrences: 3
    domains: [overview, accounting, invoicing]
    files: [dashboard.service.ts, report.service.ts, invoice.service.ts]
    pattern: "Queries join through entity but don't filter by entity status"

  - issue: "No audit logging on entity operations"
    occurrences: 2
    domains: [system]
    files: [entity.service.ts, entity.ts]
    pattern: "Entity create/update/archive have zero createAuditLog() calls"

  - issue: "Plan over-scoped for target user"
    occurrences: 6
    domains: [all]
    files: []
    pattern: "30 tasks for solopreneurs with 1-3 entities. Lean V1 needs 12 tasks."

architecture_strengths:
  - pattern: "Tenant isolation via EntityService constructor pattern"
    effectiveness: high
    reuse: true
    location: "apps/api/src/domains/system/services/entity.service.ts"

  - pattern: "Server-first data flow with client component interactivity"
    effectiveness: high
    reuse: true
    location: "apps/web/src/app/(dashboard)/layout.tsx"

  - pattern: "DomainTabs component makes tab addition a one-line change"
    effectiveness: high
    reuse: true
    location: "apps/web/src/components/shared/DomainTabs.tsx"

  - pattern: "EntityType enum + entitySubType String? avoids migration churn"
    effectiveness: high
    reuse: true
    location: "packages/db/prisma/schema.prisma"

cross_domain_impacts:
  - change: "Entity status field addition"
    affected:
      - apps/api/src/domains/overview/services/dashboard.service.ts
      - apps/api/src/domains/accounting/services/report.service.ts
      - apps/api/src/domains/invoicing/services/invoice.service.ts
    lesson: "Every service joining through entity: must add status filter after migration"

  - change: "Entity archival operation"
    affected: [22 entity-scoped models across banking, invoicing, vendors, accounting]
    lesson: "Archival pre-checks must enumerate all 22 child models, not just bank accounts"

  - change: "Multi-entity navigation"
    affected:
      - apps/web/src/providers/entity-provider.tsx
      - apps/web/src/components/layout/Navbar.tsx
    lesson: "Archived entities must be filtered from entity switcher and EntityProvider"

high_confidence:
  - issue: "ownershipPercent Float? violates integer-precision invariant"
    agents: [security, architecture, prisma, financial]
    priority: P0

  - issue: "Domain boundary confusion (overview vs system)"
    agents: [architecture, simplicity, nextjs]
    priority: P1

  - issue: "Plan over-scoped — 30 tasks vs 12 needed"
    agents: [simplicity, architecture]
    priority: P1
---

# Entity Management Hub — Review Summary

> **Quick scan for EOD/Audit agents.** Read [detailed findings](./DETAILED.md) or [agent reports](./agents/) for deeper context.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Date** | 2026-02-20 |
| **Plan** | `docs/plans/2026-02-20-entity-management-hub.md` |
| **Files Reviewed** | 30+ across API, Web, DB, Types |
| **Agents** | 6/6 completed (security, architecture, prisma, financial, simplicity, nextjs) |
| **Verdict** | CHANGES REQUIRED |

---

## At-a-Glance Metrics

| Priority | Count | Effort | Blocking? |
|----------|-------|--------|-----------|
| **P0 (Critical)** | 4 | ~2 hours | Blocks implementation |
| **P1 (Important)** | 8 | ~6 hours | Fix during implementation |
| **P2 (Nice-to-Have)** | 17 | ~8 hours | Optional |

**Scope assessment:** Plan is **2-3x over-scoped**. Lean V1 (12 tasks / 3 sprints / ~1,400 LOC) delivers 80% of value at 40% effort.

---

## Top 4 Findings (Must Fix)

### P0-1: Cross-Tenant Entity Linking — Missing `tenantId` in Unique Constraint
**Risk:** Database cannot prevent cross-tenant entity relationships
**Fix:** Add `tenantId` to `@@unique` + add to `TENANT_SCOPED_MODELS` (15 min)
**Agents:** Security, Prisma

### P0-2: Broken Tenant Isolation in `PATCH /entity/business-details` (Pre-Existing)
**Risk:** Route queries with wrong ID format, bypasses tenant middleware
**Fix:** Use `request.tenantId` instead of manual lookup (15 min)
**Agents:** Security, Architecture

### P0-3: Missing RBAC on Entity Read Routes (Pre-Existing)
**Risk:** Any authenticated tenant member can read all entity data
**Fix:** Add `withPermission('system', 'entities', 'VIEW')` (10 min)
**Agents:** Security

### P0-4: `ownershipPercent Float?` Violates Integer-Precision Invariant
**Risk:** Ownership validation fails for common splits (33.33 + 33.33 + 33.34)
**Fix:** Use `ownershipBasisPoints Int?` — 10000 = 100% (5 min)
**Agents:** Security, Architecture, Prisma, Financial (4 agents)

---

## High-Confidence Issues (3+ Agents Agree)

| Issue | Agents | Priority |
|-------|--------|----------|
| `ownershipPercent Float?` violates precision invariant | Security, Architecture, Prisma, Financial | **P0** |
| Domain boundary confusion (overview vs system) | Architecture, Simplicity, Next.js | P1 |
| Plan over-scoped (30 tasks vs 12 needed) | Simplicity, Architecture | P1 |
| No audit logging on entity mutations | Security, Financial | P1 |
| Relationship hard delete destroys audit trail | Architecture, Financial | P1 |
| `packages/data/` shouldn't be a new monorepo package | Architecture, Simplicity | P1 |

---

## Architecture Strengths

- Tenant isolation pattern via EntityService constructor
- Server-first data flow with client component interactivity
- DomainTabs infrastructure makes tab addition trivial
- Smart enum decision (EntityType + entitySubType String?)
- Correct sprint ordering (schema > backend > frontend > integration)
- Loading/error state discipline in plan specification
- Jurisdiction data as JSON (no migration for new countries)

---

## YAGNI Assessment — Lean V1 Recommendation

| Feature | Full Plan | Lean V1 | Savings |
|---------|-----------|---------|---------|
| Tasks | 30 | 12 | 18 tasks cut |
| Sprints | 7 | 3 | 4 sprints cut |
| New files | ~25 | ~10 | 15 files cut |
| New Prisma models | 1 | 0 | Defer EntityRelationship |
| New packages | 1 | 0 | Defer packages/data/ |
| Estimated LOC | ~3,500-4,500 | ~1,200-1,600 | ~2,500 LOC cut |
| Estimated effort | 4-6 days | 1.5-2 days | 3-4 days saved |

**Cut from V1:** EntityRelationship model, 8-file wizard, AI Advisor, jurisdiction data files, pre-registration lifecycle, tax ID validation, 4 extra jurisdictions

**Keep in V1:** Entity list page (upgrade `system/entities` stub), entity detail/edit page, entity archival, status field, expanded API, navbar filtering

---

## Fix Timeline

### Before Implementation (P0) — ~2 hours
1. Fix broken tenant lookup in entity.ts (15 min)
2. Add RBAC to entity read routes (10 min)
3. Fix ownershipPercent to basis points in plan (5 min)
4. Add tenantId to unique constraint in plan (5 min)

### During Implementation (P1) — ~6 hours
5. Add partial unique index for NULL targetEntityId
6. Add entity status filter to dashboard.service.ts
7. Add entity status filter to report.service.ts
8. Fix getInvoiceStats() entityId parameter (pre-existing bug)
9. Add audit logging to entity service
10. Consolidate entity routes into single file
11. Use soft delete for EntityRelationship
12. Add onDelete specifications to all relations

### Deferred to V2 (When Demand Signal Exists)
- EntityRelationship model + CRUD
- Adaptive creation wizard (8 files)
- AI Advisor endpoint
- Jurisdiction data files (6 JSON)
- Pre-registration entity lifecycle
- Tax ID format validation

---

## Pros and Cons

### Pros of the Plan

1. **Correct architectural patterns.** Follows Route > Schema > Service > Prisma. Specifies tenant isolation on all new queries. Uses `_count` to avoid N+1.
2. **Smart enum decision.** Keeping EntityType as stable enum + `entitySubType String?` for jurisdiction variants avoids migration churn as countries are added.
3. **Comprehensive edge cases.** Circular ownership, currency change blocking, archive-with-active-data validation — the plan thought about failure modes.
4. **Good sprint ordering.** Schema first, then backend, then frontend, then integration. Dependencies are correctly chained.
5. **Review agent coverage.** Each high-risk task has the right agent tagged (prisma-migration for schema, security-sentinel for auth, financial-data-validator for ownership).
6. **Three-path wizard is user-empathetic.** Acknowledging that beginners and experts need different flows is good product thinking.
7. **Jurisdiction data as JSON files (not enums).** Adding a country doesn't require a migration — correct for a global product.

### Cons of the Plan

1. **2-3x over-scoped.** 30 tasks for a feature used by users with 1-3 entities. EntityRelationship graphs, AI advisor, 6-country jurisdiction data, and wizard state machines are premature.
2. **4 critical security gaps.** Cross-tenant relationship leakage, plaintext tax IDs, AI prompt injection, archive-as-suppression. These would block a security review.
3. **Pre-registration entities are a Pandora's box.** Every domain (reporting, invoicing, banking, accounting) must now check entity status. The plan doesn't define which financial operations are permitted per status. This is a multi-sprint project hiding inside a single task.
4. **`ownershipPercent Float?` violates the project's numeric precision philosophy.** The codebase uses integer cents everywhere to avoid float bugs. Introducing Float for ownership summation creates the exact bug class the project explicitly avoids.
5. **Wrong location.** Entity CRUD under `/overview/entities` mixes admin config with read-only dashboard. `/system/entities` is the correct domain.
6. **New monorepo package for 6 JSON files.** `packages/data/` adds infrastructure overhead (package.json, tsconfig, Turborepo pipeline) for data consumed by one app.
7. **Legal liability from entity type "recommendations."** The guided wizard recommends entity types based on user answers. If a user forms an LLC based on this recommendation and it's wrong for their situation, Akount faces liability. Needs a prominent disclaimer at minimum, or reframe as "informational comparison" rather than "recommendation."
8. **No audit trail.** Status transitions (archive, upgrade) don't create AuditLog entries — violates financial software requirements.

---

## Recommended Next Steps

1. **Scope down to Lean V1** (12 tasks, 3 sprints) — entity list page, entity detail/edit, entity archival, expanded API, navbar filtering
2. **Fix the 2 pre-existing bugs** before Sprint 1 — broken tenant lookup in entity.ts, missing RBAC on read routes
3. **Fix the 2 plan design issues** before Sprint 1 — use Int basis points (not Float), add tenantId to unique constraint
4. **Build at `/system/entities`** (where stub + loading + error already exist), not `/overview/entities`
5. **Defer EntityRelationship model** to V2 — no schema migration needed for V1
6. **Simplify EntityStatus** to `ACTIVE` / `ARCHIVED` only — defer `PRE_REGISTRATION`
7. **Add audit logging** to all entity mutation operations
8. **Fix existing RBAC gap** on `PATCH /api/system/entity/business-details`

---

## Detailed Findings

See [full synthesis](./DETAILED.md) for:
- Complete P0/P1/P2 issue descriptions with file locations and code examples
- Cross-agent consensus patterns
- YAGNI assessment with feature-by-feature analysis
- Recommended final EntityRelationship schema (for V2)
- Cross-domain impact analysis

## Agent Reports

Individual agent analysis in [agents/](./agents/) directory:
- [security.md](./agents/security.md) — Tenant isolation, RBAC, injection, OWASP mapping (12 findings)
- [architecture.md](./agents/architecture.md) — System design, SRP, domain boundaries (11 findings)
- [prisma.md](./agents/prisma.md) — Migration safety, schema design, indexes (10 findings)
- [financial.md](./agents/financial.md) — Financial integrity, dashboard inflation, archival (11 findings)
- [simplicity.md](./agents/simplicity.md) — YAGNI analysis, lean V1 recommendation (15 features evaluated)
- [nextjs.md](./agents/nextjs.md) — Server/client boundaries, routing, wizard architecture (11 findings)

---

*Generated by `/processes:review` — 6 agents, 30+ files reviewed across API, Web, DB, and Types packages.*
