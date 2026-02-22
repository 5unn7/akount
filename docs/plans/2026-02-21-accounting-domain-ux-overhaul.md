# Accounting Domain UX Overhaul — Amended Plan

> **Created:** 2026-02-21 | **Reviewed:** 2026-02-21
> **Source:** HTML prototype (`brand/explorations/html/pages/accounting*.html`)
> **Scope:** Full Accounting domain — Overview hub, Chart of Accounts, Journal Entries, Assets, Tax Rates, Fiscal Periods, Reports
> **Design reference:** `brand/explorations/html/` (served at localhost:3333)

---

## Context

The Accounting domain has 6 functional features (COA, JE list/detail/create, Reports hub + 7 reports) and 3 stub "Coming Soon" pages (Assets, Tax Rates, Fiscal Periods). The user reviewed HTML prototypes and wants the domain transformed into a cohesive, tab-navigated experience with an Overview hub, full-stack implementation of the 3 stubs, and polished existing pages. No circular rings. Empty states everywhere.

---

## Review Findings (Incorporated)

| # | Finding | Resolution |
|---|---------|------------|
| 1 | Plan proposed creating new `DomainTabNav` component | **Reuse existing `DomainTabs`** at `apps/web/src/components/shared/DomainTabs.tsx` — already used by Banking, Business, Overview. Task 1 eliminated. |
| 2 | Tasks 5-10 all target one `accounting-overview.tsx` (mega-component, ~400+ lines) | **Split into sub-components:** `balance-equation.tsx`, `income-summary.tsx`, `coa-snapshot.tsx`, `recent-entries.tsx`, orchestrator `accounting-overview.tsx` |
| 3 | TaxRate.rate precision undecided ("basis points or float?") | **Resolved: Float is correct.** Confirmed `rate: Float` in Prisma schema (line 202). Tax rates are not monetary — Float handles 9.975% (QST) correctly. |
| 4 | Missing `error.tsx` for stub page rewrites | **Already exist.** All 3 stubs (assets, tax-rates, fiscal-periods) have `error.tsx`. No work needed. |
| 5 | Task 44 (depreciation schedule) is too complex as single task | **Split into 3 sub-tasks:** 44a (calculation), 44b (JE creation), 44c (idempotency guard). |
| 6 | No explicit task for `navigation.ts` update | **Folded into task 3** — create `layout.tsx` AND add "Overview" to `navigation.ts` sidebar |
| 7 | Need to verify `apps/web/src/lib/api/accounting.ts` exists | **Confirmed: exists** with 323 lines (GLAccount + JournalEntry functions). New API functions will be appended. |

---

## Executive Summary

Transform the Accounting domain from a collection of individual pages into a **cohesive, tab-navigated domain** with an Overview hub that gives users one-glance awareness of their books. Implement the 3 stub pages (Assets, Tax Rates, Fiscal Periods) end-to-end. Add empty/new-user states throughout.

### User Feedback (from prototype review)
- ✅ Overview tab pattern — wants it on ALL domains
- ✅ Tax flow visualization (Revenue → Tax Collected → ITC → Net Owing)
- ✅ Asset life-bar cards
- ✅ Balance Equation bar (A = L + E)
- ✅ Income Statement waterfall
- ❌ Skip circular ring visualizations (fiscal year ring, balance orb)
- ❌ Assets chart: use horizontal waterfall/stacked bars, not area chart
- ❌ Missing Chart of Accounts on hub (add it)

---

## Current State

### What's Built
| Feature | Backend | Frontend | Tests |
|---------|---------|----------|-------|
| Chart of Accounts CRUD | ✅ 7 endpoints | ✅ Full page | ✅ |
| Journal Entries lifecycle | ✅ 9 endpoints | ✅ List + Detail + Create | ✅ |
| Transaction → GL posting | ✅ 3 endpoints | ✅ | ✅ |
| Financial Reports (7 types) | ✅ 7 endpoints | ✅ 7 report pages | ✅ |
| PDF/CSV export | ✅ | ✅ | ✅ |
| Assets | ❌ No backend | ❌ Stub | ❌ |
| Tax Rates | ❌ No CRUD routes | ❌ Stub | ❌ |
| Fiscal Periods | ❌ 501 stubs | ❌ Stub | ❌ |

### Prisma Models
- `GLAccount` — Full model with hierarchy ✅
- `JournalEntry` + `JournalLine` — Full model ✅
- `TaxRate` — Model exists (`rate: Float`, entityId, code, name, jurisdiction, glAccountId, dates) ✅
- `FiscalCalendar` + `FiscalPeriod` — Models exist (year, periods, `FiscalPeriodStatus`: OPEN/LOCKED/CLOSED) ✅
- `FixedAsset` — ❌ Does NOT exist yet

### Existing Code to Reuse
| Component/File | Location | Reuse For |
|----------------|----------|-----------|
| `DomainTabs` | `apps/web/src/components/shared/DomainTabs.tsx` | Tab navigation (DO NOT create new) |
| Banking `layout.tsx` | `apps/web/src/app/(dashboard)/banking/layout.tsx` | Pattern for accounting layout |
| `accounting.ts` API client | `apps/web/src/lib/api/accounting.ts` | Extend with tax/fiscal/asset functions |
| `getAccountBalances()` | Same file, line 204 | Overview Balance Equation |
| `listJournalEntries()` | Same file, line 228 | Overview Recent JEs |
| `formatAmount()` / `formatDate()` | Same file, lines 308-322 | Reuse everywhere |
| Existing `error.tsx` files | All 3 stub directories | Already satisfy Invariant #6 |

---

## Architecture Decisions

### AD-1: Reuse Existing DomainTabs (AMENDED)
Reuse the existing `DomainTabs` component from `apps/web/src/components/shared/DomainTabs.tsx`. It accepts `Tab[]`, handles active state via pathname matching, uses glass styling. Already proven in 3 domains (Banking, Business, Overview). Create `layout.tsx` for accounting following the banking pattern.

### AD-2: No Circular Ring Visualizations
Per user feedback, skip SVG ring/donut/arc visualizations. Use:
- Horizontal bars for progress
- Waterfall/stacked bars for breakdowns
- Glass stat cards for numbers
- Timeline lists for sequential data (fiscal periods)

### AD-3: New User Empty States
Every page handles "zero data":
- No GL accounts → COA seed wizard
- No journal entries → "Your books are empty" with CTA
- No assets → "Capitalize your first asset"
- No tax rates → Tax setup with Canadian presets
- No fiscal periods → "Create Fiscal Year" (pick start month)

### AD-4: Backend-First for Stubs
Schema → Service → Routes → Tests → Frontend.

### AD-5: Split Overview Hub Components (NEW)
The Overview hub is composed of focused sub-components (~100-150 lines each) instead of one mega-component:
- `balance-equation.tsx` — A = L + E cards
- `income-summary.tsx` — Revenue waterfall
- `coa-snapshot.tsx` — Account group totals
- `recent-entries.tsx` — Last 5 JEs
- `accounting-overview.tsx` — Orchestrator + Quick Stats + Quick Actions

---

## Implementation Plan

### Phase 1: Domain Tab Navigation + Overview Hub (11 tasks, ~2-3h)
> **Risk:** Low | **Deps:** None

#### Sprint 1.1: Tab Navigation Setup
| # | Task | Files |
|---|------|-------|
| 1 | ~~Create DomainTabNav~~ **REMOVED** — reuse existing `DomainTabs` | N/A |
| 2 | Define accounting tab config | `apps/web/src/app/(dashboard)/accounting/tabs.ts` |
| 3 | Create accounting `layout.tsx` with `DomainTabs` + add "Overview" to `navigation.ts` sidebar | `accounting/layout.tsx`, `apps/web/src/lib/navigation.ts` |
| 4 | Create Accounting Overview hub page | `accounting/page.tsx` + `loading.tsx` + `error.tsx` |

#### Sprint 1.2: Overview Hub Components (Split — AD-5)
| # | Task | Files |
|---|------|-------|
| 5 | Balance Equation Bar: A = L + E with 3 glass cards | `accounting/balance-equation.tsx` (uses `getAccountBalances()`) |
| 6 | Income Statement Summary: Revenue waterfall from P&L API | `accounting/income-summary.tsx` (uses `/reports/profit-loss`) |
| 7 | COA snapshot: 5 account groups with totals, link to full COA | `accounting/coa-snapshot.tsx` (uses `getAccountBalances()` grouped by type) |
| 8 | Recent Journal Entries: Last 5 entries with status badges | `accounting/recent-entries.tsx` (uses `listJournalEntries({limit: 5})`) |
| 9 | Orchestrator: Quick Stats + Quick Actions + compose all above | `accounting/accounting-overview.tsx` |

#### Sprint 1.3: New User Empty State
| # | Task | Files |
|---|------|-------|
| 10 | Empty state: "Set Up Your Books" wizard (Seed COA → First JE → Trial Balance) | `accounting/accounting-empty.tsx` |
| 11 | Detect new user: if `glAccounts.length === 0`, show empty state | `accounting/page.tsx` |

---

### Phase 2: Tax Rates Full Stack (13 tasks, ~3-4h)
> **Risk:** Low | **Deps:** Phase 1 (tabs)

#### Sprint 2.1: Backend
| # | Task | Files |
|---|------|-------|
| 12 | Tax Rate Zod schemas (Create, Update, List, Delete) | `domains/accounting/schemas/tax-rate.schema.ts` |
| 13 | Tax Rate service (list, get, create, update, deactivate) | `domains/accounting/services/tax-rate.service.ts` |
| 14 | Tax Rate routes (GET list, GET/:id, POST, PATCH/:id, DELETE/:id) | `domains/accounting/routes/tax-rate.ts` |
| 15 | Register under `/api/accounting/tax-rates` | `domains/accounting/routes/index.ts` |
| 16 | Service tests (CRUD, tenant isolation, rate validation) | `services/__tests__/tax-rate.service.test.ts` |
| 17 | Route tests (HTTP layer) | `routes/__tests__/tax-rate.routes.test.ts` |

#### Sprint 2.2: Frontend
| # | Task | Files |
|---|------|-------|
| 18 | API client: `listTaxRates`, `getTaxRate`, `createTaxRate`, `updateTaxRate`, `deleteTaxRate` | `apps/web/src/lib/api/accounting.ts` (extend) |
| 19 | Tax Rate list page (glass cards: name, code, rate %, breakdown bar, jurisdiction, active badge) | `tax-rates/page.tsx` + `tax-rates-client.tsx` |
| 20 | Tax Rate form sheet (create/edit) | `tax-rates/tax-rate-sheet.tsx` |
| 21 | Component registry section (GST, PST, QST, HST individual items) | Part of `tax-rates-client.tsx` |
| 22 | Tax collection summary (Revenue → Tax Collected → ITCs → Net Owing) | Part of `tax-rates-client.tsx` |
| 23 | Empty state with Canadian presets (HST-ON 13%, GST 5%, etc.) | `tax-rates/tax-rates-empty.tsx` |
| 24 | Update `loading.tsx` skeleton | `tax-rates/loading.tsx` |

---

### Phase 3: Fiscal Periods Full Stack (14 tasks, ~3-4h)
> **Risk:** Medium (period locking affects JE creation) | **Deps:** Phase 1

#### Sprint 3.1: Backend
| # | Task | Files |
|---|------|-------|
| 25 | Fiscal Period Zod schemas (List, Create Calendar, Lock, Close, Reopen) | `schemas/fiscal-period.schema.ts` |
| 26 | Service: listCalendars, getCalendar, createCalendar (auto-gen 12 periods), lockPeriod, closePeriod, reopenPeriod | `services/fiscal-period.service.ts` |
| 27 | Routes: replace 501 stubs (GET, POST, POST/:id/lock, POST/:id/close, POST/:id/reopen) | `routes/fiscal-period.ts` |
| 28 | Register routes | `routes/index.ts` |
| 29 | Period enforcement: JE validates target date's period is OPEN (verify/harden existing) | `services/journal-entry.service.ts` |
| 30 | Service tests (lifecycle: OPEN → LOCKED → CLOSED, reopen, JE enforcement) | `services/__tests__/fiscal-period.service.test.ts` |
| 31 | Route tests | `routes/__tests__/fiscal-period.routes.test.ts` |

#### Sprint 3.2: Frontend
| # | Task | Files |
|---|------|-------|
| 32 | API client functions | `apps/web/src/lib/api/accounting.ts` (extend) |
| 33 | Fiscal Periods page (years list, progress bars, current period highlight) | `fiscal-periods/page.tsx` + `fiscal-periods-client.tsx` |
| 34 | Current period snapshot card (period #, date range, revenue/expense/net income, JE count) | Part of `fiscal-periods-client.tsx` |
| 35 | Period timeline: vertical, colored dots (closed=green, current=amber pulse, future=dim) — NO circular rings | Part of `fiscal-periods-client.tsx` |
| 36 | Period actions (Lock button + confirmation, Close, Year-End wizard placeholder) | Part of `fiscal-periods-client.tsx` |
| 37 | Empty state ("Set up your fiscal year" — pick start month) | `fiscal-periods/fiscal-periods-empty.tsx` |
| 38 | Update `loading.tsx` | `fiscal-periods/loading.tsx` |

---

### Phase 4: Assets & Depreciation Full Stack (20 tasks, ~5-6h)
> **Risk:** Medium (new Prisma model) | **Deps:** Phase 1, Phase 3

#### Sprint 4.1: Schema
| # | Task | Files |
|---|------|-------|
| 39 | `FixedAsset` model: id, entityId, name, description, category (enum), acquiredDate, cost (Int cents), salvageValue (Int cents), usefulLifeMonths, depreciationMethod (enum: SL/DB/UOP), accumulatedDepreciation (Int cents), status (enum: ACTIVE/FULLY_DEPRECIATED/DISPOSED), disposedDate, disposalAmount, GL account refs, timestamps, deletedAt | `packages/db/prisma/schema.prisma` |
| 40 | `DepreciationEntry` model: id, fixedAssetId, periodDate, amount (Int cents), method, journalEntryId, createdAt | `packages/db/prisma/schema.prisma` |
| 41 | Generate and apply migration | `packages/db/prisma/migrations/` |

#### Sprint 4.2: Backend
| # | Task | Files |
|---|------|-------|
| 42 | Asset Zod schemas (Create, Update, List, Dispose, RunDepreciation) | `schemas/asset.schema.ts` |
| 43 | Asset service: listAssets, getAsset, capitalizeAsset, updateAsset, disposeAsset | `services/asset.service.ts` |
| 44a | **`calculatePeriodDepreciation()`** — per-asset calculation (SL, DB, UOP methods), handle partial periods | `services/asset.service.ts` |
| 44b | **`createDepreciationJEs()`** — JournalEntry + JournalLines (debit depreciation expense, credit accumulated depr), validate fiscal period OPEN | `services/asset.service.ts` |
| 44c | **Idempotency guard** — check if DepreciationEntry already exists for asset+period before creating | `services/asset.service.ts` |
| 45 | Asset routes (GET list, GET/:id, POST capitalize, PATCH/:id, POST/:id/dispose, POST/run-depreciation) | `routes/asset.ts` |
| 46 | Register routes | `routes/index.ts` |
| 47 | Service tests (CRUD, depreciation accuracy for all 3 methods, JE creation, idempotency, tenant isolation) | `services/__tests__/asset.service.test.ts` |
| 48 | Route tests | `routes/__tests__/asset.routes.test.ts` |

#### Sprint 4.3: Frontend
| # | Task | Files |
|---|------|-------|
| 49 | API client functions | `apps/web/src/lib/api/accounting.ts` (extend) |
| 50 | Assets page: Portfolio Health stats (total cost, NBV, monthly charge, fully depreciated count) | `assets/page.tsx` + `assets-client.tsx` |
| 51 | Asset Register: cards with life bars (gradient health indicators), cost/NBV/accumulated depr, status | Part of `assets-client.tsx` |
| 52 | Asset form sheet (capitalize): name, category, cost, salvage value, useful life, method, GL mappings | `assets/asset-sheet.tsx` |
| 53 | Dispose asset dialog (disposal date, amount, gain/loss JE) | Part of `assets-client.tsx` |
| 54 | Depreciation schedule (stacked method bars, NO area chart) | Part of `assets-client.tsx` |
| 55 | Run depreciation button + results display | Part of `assets-client.tsx` |
| 56 | Empty state ("Capitalize your first asset") | `assets/assets-empty.tsx` |
| 57 | Update `loading.tsx` | `assets/loading.tsx` |

---

### Phase 5: Polish Existing Pages (8 tasks, ~2-3h)
> **Risk:** Low | **Deps:** Phase 1

#### Sprint 5.1: Journal Entries
| # | Task | Files |
|---|------|-------|
| 58 | Stats row (total entries, auto %, manual count, total volume) | `journal-entries/journal-entries-client.tsx` |
| 59 | Debit/Credit color coding (green=debit, blue=credit) | Same |
| 60 | Source type badges (Auto-Bank, Manual, Invoice) with colored pills | Same |
| 61 | Balanced indicator per entry row | Same |

#### Sprint 5.2: Chart of Accounts
| # | Task | Files |
|---|------|-------|
| 62 | Colored group headers (green=Assets, red=Liabilities, blue=Equity, teal=Revenue, amber=Expenses) | `chart-of-accounts/chart-of-accounts-client.tsx` |
| 63 | Balance column with formatted amounts | Same |
| 64 | Tree connector lines for indentation | Same |

#### Sprint 5.3: Reports Hub
| # | Task | Files |
|---|------|-------|
| 65 | Glass cards with stat previews (P&L net income, BS total assets), quick download buttons | `reports/page.tsx` |

---

### Phase 6: New User Onboarding (3 tasks, ~1-2h)
> **Risk:** Low | **Deps:** Phases 1-4

| # | Task | Files |
|---|------|-------|
| 66 | Setup wizard: Seed COA → Set Fiscal Year → Configure Tax Rates → Optional: Capitalize Assets | `accounting/accounting-setup-wizard.tsx` |
| 67 | Detect setup state in page.tsx | `accounting/page.tsx` |
| 68 | Progressive disclosure: sub-page empty states link back to wizard | All stub page files |

---

## Page Map (Final State)

```
/accounting                    ← NEW: Overview hub (Balance Equation, P&L, COA snapshot, Recent JEs)
/accounting/chart-of-accounts  ← ENHANCED: Colored group headers, balances
/accounting/journal-entries    ← ENHANCED: Stats row, Dr/Cr coding
/accounting/journal-entries/new
/accounting/journal-entries/[id]
/accounting/reports            ← ENHANCED: Glass cards with stat previews
/accounting/reports/profit-loss
/accounting/reports/balance-sheet
/accounting/reports/trial-balance
/accounting/reports/general-ledger
/accounting/reports/cash-flow
/accounting/reports/revenue
/accounting/reports/spending
/accounting/assets             ← NEW: Full implementation (was stub)
/accounting/tax-rates          ← NEW: Full implementation (was stub)
/accounting/fiscal-periods     ← NEW: Full implementation (was stub)
```

**Tab order:** Overview | Chart of Accounts | Journal Entries | Reports | Assets | Tax Rates | Fiscal Periods

---

## Navigation Changes

### Accounting Domain Sidebar (Updated)
```
Accounting (BookOpen icon)
├── Overview         ← NEW (first item)
├── Chart of Accounts
├── Journal Entries
├── Reports          (sub-items: P&L, Balance Sheet, Trial Balance)
├── Assets
├── Tax Rates
└── Fiscal Periods
```

### "Overview Tab" Pattern (Cross-Domain — future work)
This plan establishes the pattern. Future plans will apply to Banking, Business, Planning, System.

---

## Empty States (New User Experience)

| Page | Empty State | CTA |
|------|-------------|-----|
| Accounting Overview | Setup wizard: "Set Up Your Books" | Seed COA → Set Fiscal Year → Tax Rates |
| Chart of Accounts | "No accounts yet" | Seed Default COA button |
| Journal Entries | "Your journal is empty" | Create First Entry / Post Bank Transaction |
| Reports | "Not enough data for reports" | Show sample report preview |
| Assets | "No assets tracked" | Capitalize Your First Asset |
| Tax Rates | "No tax rates configured" | Quick Setup: Canadian Presets |
| Fiscal Periods | "No fiscal year set" | Create Fiscal Year (pick start month) |

---

## Success Criteria

1. ✅ All 3 stub pages fully functional with backend + frontend + tests
2. ✅ Accounting Overview hub shows at-a-glance financial health
3. ✅ Tab navigation works across all accounting sub-pages
4. ✅ Every page has an empty state for new users
5. ✅ All financial invariants maintained (integer cents, double-entry, soft delete, tenant isolation)
6. ✅ All new backend endpoints have service + route tests
7. ✅ 0 TypeScript errors
8. ✅ Glass morphism design system fully applied

---

## Estimated Effort

| Phase | Effort | Tasks |
|-------|--------|-------|
| Phase 1: Tab Navigation + Overview Hub | 2-3h | 11 tasks |
| Phase 2: Tax Rates (Full Stack) | 3-4h | 13 tasks |
| Phase 3: Fiscal Periods (Full Stack) | 3-4h | 14 tasks |
| Phase 4: Assets & Depreciation (Full Stack) | 5-6h | 20 tasks |
| Phase 5: Polish Existing Pages | 2-3h | 8 tasks |
| Phase 6: New User Onboarding | 1-2h | 3 tasks |
| **Total** | **16-22h** | **69 tasks** |

**Suggested priority if time-constrained:** Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 4 → Phase 6

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| FixedAsset migration breaks existing data | New model (additive), no existing table changes |
| Period locking blocks JE creation | Clear error messaging, UI prevents posting to locked periods |
| Tax rate precision (9.975% QST) | **Resolved:** `rate: Float` in Prisma — acceptable for non-monetary values |
| Report cache invalidation | Existing TTL handles it; explicit invalidation on period close |
| Depreciation double-run | **Task 44c:** Idempotency guard checks DepreciationEntry exists for asset+period |
| Overview hub performance | 4-5 API calls on load — use parallel fetch in Server Component |

---

## Verification

1. **After each phase:** `cd apps/api && npx vitest run --reporter=verbose` — all tests pass
2. **After frontend work:** `cd apps/web && npx next build` — 0 TypeScript errors
3. **Manual check:** Tab navigation works, Overview renders, empty states display for zero-data
4. **Financial invariants:** Integer cents in all monetary fields, tenant isolation in all queries, soft delete, balanced JEs

---

_69 tasks across 6 phases. Backend-first, tests-always, empty-states-everywhere. Review findings incorporated._
