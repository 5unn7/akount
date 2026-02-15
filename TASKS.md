# Akount - Task List

**Last Updated:** 2026-02-14 (EOD)
**Current Phase:** Code Review Fixes (3/5 complete) | Phase 3 prep

---

## 📅 Tomorrow's Focus (2026-02-15)

**Primary Goal:** Complete code review fixes (Issue 1 + Issue 5)

**Tasks:**
1. [ ] Add loading/error states to remaining 16 pages (accounting + banking domains)
2. [ ] Write service-level tests for invoice.service.ts (20+ tests)
3. [ ] Write service-level tests for bill.service.ts (20+ tests)

**Context:** 3/5 review issues complete. Security fixes committed. Remaining work: 16 page states + 70 service tests.

---

## Active Work

### Code Review Fixes — IN PROGRESS (3/5 complete)

**Plan:** [docs/plans/2026-02-14-fix-code-review-issues.md](docs/plans/2026-02-14-fix-code-review-issues.md)

**Completed Today (2026-02-14):**
- [x] **Issue 1 (Partial):** 24 loading/error pages for planning + services domains
- [x] **Issue 2:** Deleted onboarding route (overlay-only design)
- [x] **Issue 3:** Fixed badge.tsx and AIBrief.tsx semantic tokens
- [x] **Issue 4:** Split ImportUploadForm (415 → 77 lines, 3 step components)
- [x] **Security M-2:** Invoice/bill amount validation
- [x] **Security M-4:** Unique constraints on invoice/bill numbers
- [x] **Security M-5:** Stats rate limiting (50 req/min)

**Remaining:**
- [ ] **Issue 1 (Partial):** 16 pages need loading/error (6 accounting, 5 banking, 2 business, 3 AI/overview)
- [ ] **Issue 5:** Service tests for client, invoice, bill, vendor (70+ tests)

---

### Onboarding Redesign — COMPLETE

**Plan:** [docs/plans/2026-02-09-onboarding-flow-redesign.md](docs/plans/2026-02-09-onboarding-flow-redesign.md)

- [x] **OB-1:** OnboardingProgress Prisma model + migration (commit b4c00a3)
- [x] **OB-2:** Progress API routes — GET progress, POST update, POST skip, POST dismiss (commit b4c00a3)
- [x] **OB-3:** Update POST /initialize to create OnboardingProgress (commit b4c00a3)
- [x] **OB-4:** API tests for progress routes — 176 lines (commit b4c00a3)
- [x] **OB-5:** Update onboarding store — phone, timezone fields (commit b4c00a3)
- [x] **OB-6:** Minimal wizard — Welcome + EssentialInfo + EntityDetails + Completion steps (commits b4c00a3, b0cbdf4, af98f04)
- [x] **OB-7:** CircularProgress component (commit b4c00a3)
- [x] **OB-8:** OnboardingHeroCard on dashboard (commit b4c00a3)
- [x] **OB-9:** SidebarProgressIndicator (commit b4c00a3)
- [x] **OB-10:** Frontend tests for onboarding components — 55 tests across 7 files

### Overview Page Comprehensive Refresh — COMPLETE

**Brainstorm:** [docs/brainstorms/2026-02-14-overview-page-comprehensive-refresh-brainstorm.md](docs/brainstorms/2026-02-14-overview-page-comprehensive-refresh-brainstorm.md)
**Plan:** [docs/plans/2026-02-14-overview-page-comprehensive-refresh.md](docs/plans/2026-02-14-overview-page-comprehensive-refresh.md)

**Phase 1: Frontend Layout Polish (commit babf908)**
- [x] **UI-1:** Add navbar vertical padding (py-3, min-h-14) + TypeScript fix (Set → Array.from)
- [x] **UI-2:** Bump Liquidity Hero balance font (text-3xl → text-4xl)
- [x] **UI-3:** Fix sparkline alignment (flex-1 container + w-20 wrapper)
- [x] **UI-4:** Add color-coded glow effects to spark cards (green/red/amber/blue/purple)
- [x] **UI-5:** Increase spacing between zones (space-y-6 → space-y-8)
- [x] **UI-6:** Add purple border-left accent to AI Brief card

**Phase 2: Backend API (commit 87f41e3)**
- [x] **BE-PERF-1:** Performance metrics Zod schema (query + response)
- [x] **BE-PERF-2:** PerformanceService with transaction aggregates (revenue, expenses, profit, sparklines)
- [x] **BE-PERF-3:** GET /api/overview/performance route handler

**Phase 3: Frontend Integration (commits 6d61e44, cf78c9e)**
- [x] **FE-PERF-1:** Performance API client function (getPerformanceMetrics)
- [x] **FE-PERF-2:** Wire performance API to overview page (Promise.allSettled)
- [x] **FE-PERF-3:** Replace hardcoded demo data with real transaction aggregates
- [x] **FE-PERF-4:** Add SparkCardsSkeleton component
- [x] **FE-PERF-5:** Empty state handling ("—" for zero values)
- [x] **FE-PERF-6:** Error boundary (try/catch with graceful fallback)

**Result:** Visual hierarchy established, real financial data powering spark KPIs, responsive design verified.

**Deferred:** Performance service tests (15+ tests) — to be added in separate session.

---

## Next Up (Phase 3: Post Your Money)

- [ ] **BE-3.1:** Chart of Accounts API (CRUD, hierarchy, default COA seeding)
- [ ] **BE-3.2:** Transaction Posting Service (double-entry validation + journal entry generation)
- [ ] **BE-3.3:** Journal Entry API (list, detail, filtering)
- [ ] **BE-3.4:** Multi-currency posting support
- [ ] **BE-3.5:** Split transaction support
- [ ] **FE-3.1:** Chart of Accounts page (tree view, CRUD, balances)
- [ ] **FE-3.2:** Transaction entry form (splits, multi-currency, journal preview)
- [ ] **FE-3.3:** Journal entries list page
- [ ] **FE-3.4:** Transaction detail view

---

## Completed Work

### Foundation (COMPLETE)

- [x] Clerk authentication (passkeys/WebAuthn)
- [x] PostgreSQL + Prisma (38 models, 26 enums)
- [x] Fastify API with middleware chain
- [x] Design system in Figma (76 variables, 41+ components)
- [x] shadcn/ui + shadcn-glass-ui integration, Tailwind v4
- [x] Turborepo monorepo
- [x] AI categorization foundation
- [x] Bank statement import foundation (PDF parsing)
- [x] Performance optimization (50x query reduction)

### Phase 1: See Your Money (COMPLETE — 62 tests)

- [x] Dashboard with real-time metrics (net worth, cash position, assets/liabilities)
- [x] Account list page with cursor pagination + type filtering
- [x] Account CRUD (create, edit, soft-delete via Sheet panel)
- [x] Account detail page with transaction history + running balance
- [x] Entity filter dropdown + currency toggle (CAD/USD)
- [x] FX rate service with caching
- [x] 62 backend tests (services + routes)
- [x] Loading states, error boundaries, SEO metadata

### Phase 2 Backend: Track Your Money (COMPLETE — 117 tests)

**Sprint 1: Transaction Management (55 tests, commit ff37830)**

- [x] TransactionService with CRUD operations (277 lines)
- [x] Zod validation schemas (86 lines)
- [x] Fastify route handlers (216 lines)
- [x] GET/POST/PATCH/DELETE /api/banking/transactions
- [x] Filtering by accountId, date range, category, pagination
- [x] 35 service tests + 20 route tests

**Sprint 2: CSV & PDF Import (19 tests, commits 376a030, 4e89ae5)**

- [x] ImportService orchestrating CSV + PDF workflows (452 lines)
- [x] ParserService for CSV + PDF parsing (507 lines)
- [x] DuplicationService with fuzzy matching (230 lines)
- [x] POST /api/banking/imports/csv and /pdf endpoints
- [x] GET /api/banking/imports (list batches, pagination)
- [x] GET /api/banking/imports/:id (import details + transactions)

**Sprint 3: Reconciliation (43 tests, commit a1e3340)**

- [x] ReconciliationService with matching algorithm (340 lines)
- [x] Exact amount + date proximity (±3/7 days) + description similarity
- [x] Confidence scores (0-1.0), top 5 suggestions
- [x] GET /api/banking/reconciliation/:id/suggestions
- [x] POST /api/banking/reconciliation/matches
- [x] DELETE /api/banking/reconciliation/matches/:id
- [x] GET /api/banking/reconciliation/status/:accountId
- [x] 25 service tests + 18 route tests

### Phase 2 Frontend: Banking UI (COMPLETE — commits 95eb7e4, b0cbdf4, af98f04)

- [x] **FE-2.1:** CSV Upload Component — ImportUploadForm with drag-and-drop, validation (commit 95eb7e4)
- [x] **FE-2.2:** Column Mapping Interface — ColumnMappingEditor, 291 lines (commit 95eb7e4)
- [x] **FE-2.3:** Transaction Matching UI — ReconciliationDashboard (commit 2256742)
- [x] **FE-2.4:** Reconciliation Status Display (commit 2256742)
- [x] **FE-2.5:** Import History Page — ImportHistoryClient (commit 2256742)
- [x] **FE-2.3b:** Transaction Matching Improvements — BulkActionBar, bulk selection (commit 95eb7e4)
- [x] **FE-2.5b:** Import History Enhancements — ImportConfirmation, drill-down (commits b0cbdf4, af98f04)
- [x] **FE-2.6:** Transaction List Improvements — bulk actions, filters, BulkActionBar (commit 95eb7e4)
- [x] **Bonus:** Full sign-up → onboarding → dashboard flow repaired (commit af98f04)
- [x] **Bonus:** Route rename money-movement → banking (commit af98f04)

### Onboarding Redesign (9/10 tasks — commit b4c00a3)

- [x] OnboardingProgress Prisma model + API routes + tests
- [x] Wizard (Welcome + EssentialInfo + EntityDetails + Completion)
- [x] CircularProgress, OnboardingHeroCard, SidebarProgressIndicator
- [x] Complete onboarding flow with progressive completion modals

---

## Phase Progress

| Phase | Backend | Frontend | Status |
|-------|---------|----------|--------|
| Foundation | COMPLETE | COMPLETE | COMPLETE |
| 1: See Your Money | COMPLETE (62 tests) | COMPLETE | COMPLETE |
| 2: Track Your Money | COMPLETE (117 tests) | COMPLETE (8/8 tasks) | COMPLETE |
| Onboarding Redesign | COMPLETE (tests) | COMPLETE (55 tests) | COMPLETE |
| 3: Post Your Money | Not started | Not started | Not started |

**Total Backend Tests:** 235+ (62 + 117 + 35 system + 21 overview)

---

## Notes

**Task Naming Convention:**

- FE-X.Y: Frontend task in Phase X
- BE-X.Y: Backend task in Phase X
- OB-Y: Onboarding redesign (cross-cutting)

**How to Use This File:**

1. Pick tasks from "Active Work" section
2. Check boxes as you complete work
3. Move to "Completed Work" when phase finishes
4. Keep "Next Up" section populated with upcoming phase

**Weekly Rhythm:**

- Monday: Review active tasks, pick sprint focus
- Friday: Update progress, plan next week
- End of Phase: Update ROADMAP.md and STATUS.md

---

**Next Update:** 2026-02-16
