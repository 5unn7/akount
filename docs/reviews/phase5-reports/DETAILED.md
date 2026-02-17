# Phase 5 Reports — Review Synthesis

**Date:** 2026-02-17
**Branch:** `feature/phase5-reports`
**Files reviewed:** 109 changed (+21,347 / -460 lines)
**Agents completed:** 6/6 (financial, architecture, security, performance, fastify, nextjs)

---

## Verdict: CHANGES REQUIRED

**5 P0 blockers** must be fixed before merge. **13 P1 issues** should be fixed before production. The foundation is architecturally solid — tenant isolation, integer cents, BigInt safety, bounded cache, CSV injection protection, rate limiting, loading/error states — but several functional bugs, a server/client boundary violation, and financial calculation errors need attention.

**Estimated fix effort:** ~4 hours for P0s, ~6 hours for P1s, ~5 hours for P2s

---

## P0 — Critical (Blocks Merge)

### 1. Data Export Client/Vendor Missing Tenant Isolation
**Flagged by:** Financial (P0-1), Security (P2-3)
**File:** `apps/api/src/domains/system/services/data-export.service.ts:59-73`
**Issue:** `clients` and `vendors` table configs are NOT marked `entityScoped: true`. Prisma silently ignores the `tenantId` filter on entity-scoped models, potentially exporting ALL clients/vendors across tenants.
**Fix:** Add `entityScoped: true` to both configs. **15 min.**

### 2. GL Ledger Running Balance Omits Opening Balance
**Flagged by:** Financial (P0-2)
**File:** `apps/api/src/domains/accounting/services/report.service.ts:1017-1052`
**Issue:** Window function `SUM(...) OVER (ORDER BY jl.id)` only operates over rows in the filtered date range. An account with $5,000 balance from January shows February entries starting at 0.
**Fix:** Calculate opening balance in a separate query and add to window results. **1-2 hours.**

### 3. GL "Load More" Imports Server-Only Module in Client Component
**Flagged by:** Next.js (P0-1)
**File:** `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx:13,52`
**Issue:** `'use client'` component imports `getGLLedgerReport` which calls `apiClient` -> `@clerk/nextjs/server`. Runtime crash when user clicks "Load More Entries."
**Fix:** Create a Server Action wrapper in `actions.ts`. **15 min.**

### 4. Mixed Server/Client Module (`reports.ts`)
**Flagged by:** Next.js (P0-2)
**File:** `apps/web/src/lib/api/reports.ts`
**Issue:** Single file mixes server-only API functions (importing `@clerk/nextjs/server`), client-only `downloadReport` (accessing `window`), and universal helpers. Bundler instability and the GL crash above stem from this.
**Fix:** Split into `reports.ts` (server), `reports-client.ts` (client), `reports-types.ts` (shared). **30 min.**

### 5. CSV Injection Defense Incomplete in Report Export
**Flagged by:** Fastify (P0-3), Security (P2-5)
**File:** `apps/api/src/domains/accounting/services/report-export.service.ts:26-39`
**Issue:** Formula-prefixed values get single-quote prefix but are NOT wrapped in double quotes. A value like `"-Revenue, Net"` breaks CSV column structure. The `data-export.service.ts` version handles this correctly.
**Fix:** Match the robust pattern: `"'${escaped}"`. **15 min.**

---

## P1 — Important (Fix Before Production)

### 6. Cash Flow Working Capital Sign Convention Inverted
**Flagged by:** Financial (P1-3)
**File:** `report.service.ts:844,873-874`
**Issue:** Indirect method: asset increases should SUBTRACT from operating cash (cash went out), but current code ADDs them. Overstates operating cash flow.
**Fix:** Negate balance change for asset-type accounts in operating section. **2-3 hours.**

### 7. Spending Report Debit-Only Aggregation (Overstates Spending)
**Flagged by:** Financial (P1-1), Fastify (P2-5)
**File:** `report.service.ts:1116`
**Issue:** Only sums debits, ignoring expense refunds/credits.
**Fix:** Change to `SUM(debitAmount) - SUM(creditAmount)`. **15 min.**

### 8. Revenue Report Credit-Only Aggregation (Overstates Revenue)
**Flagged by:** Financial (P1-2)
**File:** `report.service.ts:1191`
**Issue:** Same pattern — only sums credits, ignoring revenue reversals.
**Fix:** Change to `SUM(creditAmount) - SUM(debitAmount)`. **15 min.**

### 9. Frontend Types Diverge From API (`items` vs `sections`)
**Flagged by:** Architecture (P1-3)
**File:** `apps/web/src/lib/api/reports.ts:37-49` vs `report.service.ts:47-56`
**Issue:** API returns `revenue.items`, frontend expects `revenue.sections`. P&L revenue/expense sections render **empty**. Same divergence exists for CashFlowReport.
**Fix:** Align frontend types with API or move shared types to `packages/types`. **30 min.**

### 10. `format` Query Parameter Bypasses Zod Validation
**Flagged by:** Financial (P1-4), Architecture (P0-3), Security (P1-2), Fastify (P1-1) — **4 agents**
**File:** `report.schema.ts` + `report.ts` (all 7 routes)
**Issue:** Routes use `as XxxQuery & { format?: string }` cast. `ExportFormatSchema` exists but is dead code.
**Fix:** Add `format` to each Zod schema, remove manual casts. **15 min.**

### 11. RBAC Middleware Uses Hardcoded Roles, Not Permission Matrix
**Flagged by:** Security (P1-1)
**File:** `apps/api/src/middleware/rbac.ts:60-78`
**Issue:** References non-existent `VIEWER` role. INVESTOR and ADVISOR incorrectly denied report access. Affects ALL domains, not just reports.
**Fix:** Wire `requirePermission()` to canonical `PERMISSION_MATRIX`. **1 hour.** (Phase 6 scope)

### 12. Only P&L is Cached (6 of 7 Reports Have No Cache)
**Flagged by:** Architecture (P1-5), Performance, Security (P2-4) — **3 agents**
**File:** `report.service.ts` — only `generateProfitLoss` has cache get/set
**Issue:** Balance Sheet (most expensive — inception-to-date) has zero caching. All other reports hit DB every time.
**Fix:** Add cache get/set to all report methods. **1 hour.**

### 13. Cache Invalidation Gap (2 Services Don't Invalidate)
**Flagged by:** Architecture (P1-1), Fastify (P2-7)
**Issue:** `posting.service.ts` and `journal-entry.service.ts` modify GL data but don't call `reportCache.invalidate()`. Only `document-posting.service.ts` does.
**Fix:** Add invalidation calls to both services. **30 min.**

### 14. Hardcoded 'CAD' Currency in Line Item Rendering
**Flagged by:** Next.js (P1-1), Performance (P0-11)
**File:** `pl-report-view.tsx:286`, `bs-report-view.tsx:329`
**Issue:** PLSection/BSSection hardcode `'CAD'` for `formatCurrency`, while parent correctly uses `initialData.currency`. USD/EUR entities show wrong currency symbol on line items.
**Fix:** Pass `currency` prop from parent. **10 min.**

### 15. `GLLedgerReport` Missing `currency` Field
**Flagged by:** Financial (P2-1), Architecture (P0-1), Fastify (P1-3) — **3 agents**
**File:** `report.service.ts:152-161`
**Issue:** Interface lacks `currency`, but route accesses `report.currency` for CSV export -> `undefined` at runtime.
**Fix:** Add field to interface and populate in `generateGLLedger()`. **15 min.**

### 16. `validateMultiEntityCurrency` Missing tenantId Filter
**Flagged by:** Financial (P2-2), Architecture (P0-2), Fastify (P0-1) — **3 agents**
**File:** `report.service.ts:285-298`
**Issue:** Queries entities by `id IN (...)` without `tenantId`. Defense-in-depth violation.
**Fix:** Add `tenantId: this.tenantId` to where clause. **5 min.**

### 17. No Accessibility Attributes on Report Tables/Progress Bars
**Flagged by:** Next.js (P1-3)
**Issue:** Zero `aria-*` attributes across all 21 report files. Tables lack `caption`, `scope`. Progress bars lack `role="progressbar"`.
**Fix:** Add ARIA attributes. **45 min.**

### 18. Empty Entity Array Crashes Reports
**Flagged by:** Architecture (P1-2), Fastify (P2-4)
**File:** `report.service.ts:272-278,298`
**Issue:** Tenant with 0 entities -> `Prisma.join([])` = invalid SQL + `entities[0].functionalCurrency` = TypeError.
**Fix:** Guard with early 404. **10 min.**

---

## P2 — Nice-to-Have (26 findings across agents)

| # | Finding | Agents | Effort |
|---|---------|--------|--------|
| 1 | Balance Sheet: 2 redundant heavy SQL queries (combine into 1) | Performance | 2 hr |
| 2 | Balance Sheet: 1-cent tolerance on isBalanced (should be strict) | Financial | 15 min |
| 3 | Cash Flow: no reconciliation check (opening + net != closing) | Financial | 30 min |
| 4 | GL Ledger: orders by CUID not date (window function) | Financial | 15 min |
| 5 | Spending/Revenue: missing currency validation for multi-entity | Financial | 15 min |
| 6 | Data export: `includeSoftDeleted` flag never applied | Financial | 15 min |
| 7 | Report types duplicated between API and frontend | Architecture | 1 hr |
| 8 | Cash flow categorization uses hardcoded account code ranges | Architecture | Doc only |
| 9 | PDF timeout timer not cleaned up (unhandled rejection) | Architecture, Security | 15 min |
| 10 | Duplicated CSV sanitization between 2 services | Architecture, Security | 30 min |
| 11 | `window.Clerk` triple-cast in downloadReport | Architecture | 30 min |
| 12 | 7 route handlers repeat identical 40-line pattern | Architecture, Fastify | 1 hr |
| 13 | `sanitizeCsvCell` type signature should accept `null` | Architecture, Fastify | 5 min |
| 14 | `tenantScopedQuery` string check bypassable | Security | 30 min |
| 15 | Data export exposes unmasked bank account numbers | Security | 15 min |
| 16 | Error handler exposes `details` to client | Security | 15 min |
| 17 | `sanitizeFilename` can produce empty string | Security | 5 min |
| 18 | Cache TTL env var not validated (NaN = permanent cache) | Security | 10 min |
| 19 | Revenue JSONB extraction without index (Phase 6) | Performance | 30 min |
| 20 | PDF generation blocks event loop (Phase 6) | Performance | Doc only |
| 21 | Array index as React key across all report views | Next.js, Performance | 15 min |
| 22 | Entity selector dropdowns have no real options (hardcoded) | Next.js | 1-2 hr |
| 23 | GL Account ID requires raw CUID input (bad UX) | Next.js | 1 hr |
| 24 | Recharts imported without code splitting | Performance | 30 min |
| 25 | Duplicate CHART_COLORS entry in spending view | Next.js | 2 min |
| 26 | Missing service tests for 4 of 7 reports + route tests | Fastify | 3-4 hr |

---

## Cross-Agent Patterns (Highest Confidence)

These issues were independently identified by **3+ agents**:

| Issue | Agents | Consensus |
|-------|--------|-----------|
| `format` param bypasses Zod | Financial, Architecture, Security, Fastify | **4 agents** |
| `validateMultiEntityCurrency` missing tenantId | Financial, Architecture, Fastify | **3 agents** |
| `GLLedgerReport` missing `currency` field | Financial, Architecture, Fastify | **3 agents** |
| Only P&L cached, others not | Architecture, Performance, Security | **3 agents** |
| CSV sanitization inconsistency between services | Architecture, Security, Fastify | **3 agents** |

---

## Architecture Strengths (Noted by All Agents)

1. **`tenantScopedQuery` wrapper** — Runtime SQL assertion preventing tenant filter omission
2. **BigInt safety** — `Number.isSafeInteger()` check before conversion
3. **Bounded cache** — 500 entries, 60s sweep, TTL, `unref()` timer, tenant-scoped keys
4. **CSV injection prevention** — OWASP-compliant (with P0-5 fix needed)
5. **PDF protective limits** — 1000 items, 30s timeout, dedicated error codes
6. **Streaming data export** — Cursor-paginated reads, ZIP streaming, never holds full dataset
7. **Complete loading/error boundaries** — All 8 routes have both files
8. **Rate limiting** — 50 req/min reports, 3 req/min data export
9. **Composite indexes** — Migration adds both recommended indexes
10. **Soft delete filters** — All SQL queries include `deletedAt IS NULL`

---

## Recommended Fix Priority

### Before Merge (P0) — ~4 hours
1. Data export Client/Vendor tenant isolation (15 min)
2. CSV injection defense fix (15 min)
3. GL "Load More" Server Action (15 min)
4. Split reports.ts server/client/shared (30 min)
5. GL Ledger opening balance (1-2 hr)

### Before Production (P1) — ~6 hours
6. Cash Flow sign convention (2-3 hr)
7. Spending/Revenue aggregation fixes (30 min)
8. Frontend types alignment with API (30 min)
9. `format` to Zod schemas (15 min)
10. Cache all 7 reports (1 hr)
11. Hardcoded 'CAD' currency fix (10 min)
12. `GLLedgerReport` currency field (15 min)
13. `validateMultiEntityCurrency` tenantId (5 min)
14. Empty entity guard (10 min)
15. Cache invalidation in 2 missing services (30 min)

### Phase 6 Scope
16. RBAC middleware -> canonical permission matrix
17. Accessibility attributes on all report views
18. Entity selector with real options
19. Route-level integration tests
20. Service tests for 4 remaining reports
21. Revenue JSONB expression index
22. PDF worker thread for concurrent generation

---

*Generated by multi-agent review pipeline. 6 agents, ~3,700 lines of code examined across 42 files.*
