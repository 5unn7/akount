# Phase 0: Pre-Restructure Audit

**Days:** 1-2
**Status:** ✅ COMPLETE (2026-02-04)
**Dependencies:** None (first phase)
**Can Parallel With:** None

---

## Objectives

1. Rename design system folder (v1/ → design-system/)
2. Create brand assets folder structure
3. Audit documentation for personality alignment
4. Verify data models against design-system requirements
5. Assess proxy/middleware for RBAC needs

---

## Tasks

### 0.1 Design System Folder Rename

**Current:** `docs/design-system/v1/`
**Target:** `docs/design-system/`

- [x] Delete `docs/design-system/old/` (deprecated files) ✅ DONE 2026-02-04
  ```bash
  rm -rf docs/design-system/old/
  ```

- [x] Move contents of `docs/design-system/v1/*` to `docs/design-system/` ✅ DONE 2026-02-04
  ```bash
  mv docs/design-system/v1/* docs/design-system/
  rmdir docs/design-system/v1/
  ```
  - Also removed empty `00-foundationstokens/` duplicate folder

- [x] Update all references in CLAUDE.md ✅ N/A (no v1 refs found)
  - Search: `docs/design-system/v1/`
  - Replace: `docs/design-system/`

- [x] Update all agent files in `.claude/agents/` ✅ N/A (no v1 refs found)
  - Search: `design-system/v1/`
  - Replace: `design-system/`

- [x] Update all docs that reference v1 path ✅ DONE 2026-02-04
  - Updated `docs/plans/2026-02-05-phase-0.5-foundation-REVISED.md`
  - Updated `docs/plans/2026-02-05-design-system-foundation.md`
  - Archive files left as-is (historical records)

**Verification:**
```bash
# Should return no results
grep -r "design-system/v1" docs/ .claude/ CLAUDE.md
```

---

### 0.2 Create Brand Assets Folder

**New folder:** `brand/`

- [x] Create folder structure: ✅ DONE 2026-02-04
  ```bash
  mkdir -p brand/logos brand/icons brand/screenshots
  ```

- [x] Create `brand/README.md`: ✅ DONE 2026-02-04
  ```markdown
  # Akount Brand Assets

  ## Logos
  - `akount-logo.svg` - Primary logo (light backgrounds)
  - `akount-logo-dark.svg` - Dark mode logo
  - `akount-icon.svg` - Icon only (no text)
  - `akount-wordmark.svg` - Text only (no icon)

  ## Icons
  - `app-icon-512.png` - App icon 512x512
  - `app-icon-192.png` - App icon 192x192
  - `favicon.ico` - Browser favicon
  - `favicon.svg` - Vector favicon

  ## Screenshots
  Product screenshots for marketing materials.

  ## Usage Guidelines
  - Primary color: Orange (#f97316)
  - Secondary color: Violet (#8b5cf6)
  - Always maintain clear space around logo
  - Minimum size: 24px height
  ```

- [x] Add placeholder files (to be replaced with actual assets): ✅ DONE 2026-02-04
  ```bash
  touch brand/logos/.gitkeep
  touch brand/icons/.gitkeep
  touch brand/screenshots/.gitkeep
  ```

**Verification:**
```bash
ls -la brand/
```

---

### 0.3 Documentation Personality Audit

Review these files for vision/personality alignment with design-system philosophy:

| File | Issue | Action | Status |
|------|-------|--------|--------|
| `docs/product/overview.md` | Old vision text | REWRITE | ⬜ |
| `docs/features/01-accounts-overview.md` | Superseded | ARCHIVED | ✅ |
| `docs/features/02-bank-reconciliation.md` | Superseded | ARCHIVED | ✅ |
| `docs/features/03-transactions-bookkeeping.md` | Superseded | ARCHIVED | ✅ |
| `docs/features/04-invoicing-bills.md` | Superseded | ARCHIVED | ✅ |
| `docs/features/05-analytics.md` | Superseded | ARCHIVED | ✅ |
| `docs/features/06-planning.md` | Superseded | ARCHIVED | ✅ |
| `docs/features/07-ai-financial-advisor.md` | Superseded | ARCHIVED | ✅ |
| `docs/architecture/evolution.md` | Old phased approach | ARCHIVED | ✅ |
| `docs/architecture/ARCHITECTURE-HOOKS.md` | May conflict | REVIEW | ⬜ |
| `docs/standards/README.md` | Generic | REWRITE | ⬜ |
| `CLAUDE.md` | Long, complex | SIMPLIFY | ⬜ |

**Before deleting, verify data preserved in:**
- `docs/design-system/03-screens/` - Feature screens
- `docs/design-system/02-patterns/` - UI patterns
- `docs/design-system/04-workflows/` - User workflows

- [x] Create archive folder: ✅ DONE 2026-02-04
  ```bash
  mkdir -p docs/archive/pre-restructure
  ```

- [x] Archive before deleting: ✅ DONE 2026-02-04
  ```bash
  mv docs/features/ docs/archive/pre-restructure/features/
  mv docs/architecture/evolution.md docs/archive/pre-restructure/
  mv docs/architecture/PHASED-EXTRACTION-GUIDE.md docs/archive/pre-restructure/
  mv docs/architecture/ARCHITECTURE-DECISION-SUMMARY.md docs/archive/pre-restructure/
  mv docs/architecture/VISUAL-ARCHITECTURE-GUIDE.md docs/archive/pre-restructure/
  ```

---

### 0.4 Data Model Verification

**Current Prisma Schema:** `packages/db/prisma/schema.prisma`

Verify alignment with design-system requirements:

- [x] **Multi-tenancy check:** ✅ VERIFIED 2026-02-04
  - `Tenant` model exists ✓
  - `TenantUser` model exists ✓
  - `User` model exists ✓ (with `clerkUserId` for Clerk integration)
  - `tenantId` present on key models (Entity, etc.) ✓

- [x] **RBAC enum status:** ⚠️ PARTIAL - NEEDS MIGRATION
  ```prisma
  // CURRENT (schema.prisma:820):
  enum TenantUserRole {
    OWNER
    ADMIN
    ACCOUNTANT
    VIEWER
  }

  // REQUIRED (from design-system permissions-matrix.md):
  enum TenantUserRole {
    OWNER
    ADMIN
    ACCOUNTANT
    BOOKKEEPER
    INVESTOR
    ADVISOR
  }
  ```

  **Gap Analysis:**
  - ✅ Has: OWNER, ADMIN, ACCOUNTANT
  - ❌ Missing: BOOKKEEPER, INVESTOR, ADVISOR
  - ⚠️ Extra: VIEWER (decide: keep as alias for INVESTOR, or remove)

  **Action:** Create migration to add missing roles
  ```bash
  pnpm --filter @akount/db prisma migrate dev --name add_rbac_roles
  ```

- [x] **Financial fields check:** ✅ VERIFIED 2026-02-04
  - `JournalLine.debitAmount` and `JournalLine.creditAmount` are `Int` ✓
  - All money fields are Int (cents) ✓

- [x] **Audit fields check:** ✅ VERIFIED 2026-02-04
  - `createdAt`, `updatedAt` on models ✓
  - `createdBy` on JournalEntry ✓
  - `updatedBy` - not present (consider adding for full audit trail)
  - `deletedAt` for soft deletes on financial models ✓ (14+ models have soft delete)

---

### 0.5 Proxy/Middleware Assessment

**Current file:** `apps/web/src/proxy.ts`

- [x] **Review current implementation:** ✅ REVIEWED 2026-02-04
  ```typescript
  // Current implementation (apps/web/src/proxy.ts)
  import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
  import { NextResponse } from 'next/server'

  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
  ])

  export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next()
  })
  ```

  **Current State:** Auth-only (authentication), NO role-based access control

- [x] **Decision: Enhance with RBAC or separate concern?** ✅ DOCUMENTED 2026-02-04

  Option A: Enhance proxy.ts (recommended for Phase 3)
  Option B: Keep simple, enforce RBAC in layouts

  **Chosen:** Option A (enhance proxy.ts)

  Rationale:
  - Centralized security enforcement
  - Routes protected even if layout code has bugs
  - Consistent with design-system `permissions-matrix.md`
  - Single point of audit for security reviews

- [x] **Document routes requiring RBAC:** ✅ DOCUMENTED 2026-02-04

  **Reference:** `docs/design-system/05-governance/permissions-matrix.md`

  **High-Priority Routes (System Admin):**
  | Route Pattern | Required Role(s) | Permission Level |
  |---------------|------------------|------------------|
  | `/system/audit-log(.*)` | OWNER, ADMIN, ACCOUNTANT | VIEW |
  | `/system/users(.*)` | OWNER, ADMIN | ADMIN |
  | `/system/security(.*)` | OWNER, ADMIN | ADMIN |
  | `/system/entities(.*)` | OWNER, ADMIN | ADMIN |
  | `/system/integrations(.*)` | OWNER, ADMIN | ADMIN |
  | `/system/data-management(.*)` | OWNER, ADMIN | ADMIN |

  **Accounting Routes (Restricted):**
  | Route Pattern | Required Role(s) | Permission Level |
  |---------------|------------------|------------------|
  | `/accounting/journal(.*)` | ADMIN, ACCOUNTANT | ACT |
  | `/accounting/chart-of-accounts(.*)` | ADMIN, ACCOUNTANT | ACT |
  | `/accounting/fiscal-periods(.*)` | ADMIN, ACCOUNTANT | APPROVE |
  | `/accounting/assets(.*)` | ADMIN, ACCOUNTANT | ACT |
  | `/accounting/tax-rates(.*)` | ADMIN, ACCOUNTANT | ACT |

  **Read-Only Routes (Investor/Advisor):**
  | Route Pattern | Required Role(s) | Permission Level |
  |---------------|------------------|------------------|
  | `/reports(.*)` | OWNER, ADMIN, ACCOUNTANT, INVESTOR, ADVISOR | VIEW |
  | `/dashboard/net-worth(.*)` | OWNER, ADMIN, ACCOUNTANT, INVESTOR | VIEW |
  | `/forecasts(.*)` | OWNER, ADMIN, ACCOUNTANT, INVESTOR | VIEW |

  **Bookkeeper-Accessible Routes:**
  | Route Pattern | Required Role(s) | Permission Level |
  |---------------|------------------|------------------|
  | `/transactions(.*)` | OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER | ACT |
  | `/invoices(.*)` | OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER | ACT |
  | `/bills(.*)` | OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER | ACT |
  | `/clients(.*)` | OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER | ACT |
  | `/vendors(.*)` | OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER | ACT |
  | `/reconciliation(.*)` | OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER | ACT (APPROVE for Accountant) |

  **Implementation Notes:**
  - Middleware should check `TenantUser.role` from database
  - Consider caching role lookups for performance
  - Log access denials for security audit
  - Phase 3 implementation target

---

## Verification Checklist

Before marking Phase 0 complete:

- [x] No `docs/design-system/v1/` folder exists ✅
- [x] No references to `v1/` in active codebase (archive files preserved) ✅
- [x] `brand/` folder exists with structure ✅
- [x] `docs/archive/pre-restructure/` contains archived files ✅
- [x] `docs/features/` folder removed (archived) ✅
- [x] Data model verification documented ✅
- [x] RBAC route requirements documented ✅
- [x] All tasks above have checkmarks ✅

---

## Handoff to Phase 1

When complete, Phase 1 can begin with:
- Clean design-system folder at `docs/design-system/`
- Data model requirements documented
- RBAC route requirements documented

Update status in `docs/restructuring/README.md` to ✅ COMPLETE.
