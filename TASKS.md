# Akount - Task List

**Last Updated:** 2026-02-09
**Current Phase:** Phase 2 - Track Your Money (Backend Complete, Frontend In Progress)

---

## Active Work

### Phase 2 Frontend: Banking UI (~15-20 hours)

- [ ] **FE-2.1:** CSV Upload Component
  - Create FileUploadZone with drag-and-drop
  - File validation (CSV only, max 10MB)
  - Upload progress indicator
  - Parse error display with line numbers

- [ ] **FE-2.2:** Column Mapping Interface
  - Interactive table mapping CSV columns → expected fields
  - Dropdown per column (Date, Description, Amount, Balance, Ignore)
  - Preview first 5 rows
  - Auto-detect for common bank formats

- [x] **FE-2.3:** Transaction Matching UI (commit 2256742)
  - Reconciliation page with match/unmatch actions
  - Suggested matches with confidence scores
  - Status badges on transaction rows

- [x] **FE-2.4:** Reconciliation Status Display (commit 2256742)
  - Reconciliation status on accounts detail page
  - Matched/unmatched counts and filters

- [x] **FE-2.5:** Import History Page (commit 2256742)
  - `/money-movement/imports` page
  - List import batches with status

- [ ] **FE-2.3b:** Transaction Matching Improvements
  - Bulk selection for multi-match
  - GL match confidence color coding (green/yellow/red)

- [ ] **FE-2.5b:** Import History Enhancements
  - Import details drill-down (filename, row count, errors)
  - Re-import button for failed imports

- [ ] **FE-2.6:** Transaction List Improvements
  - Bulk actions (categorize, delete)
  - Category badges
  - Improved filters

### Phase 2: Onboarding Redesign (~10-12 hours)

**Plan:** [docs/plans/2026-02-09-onboarding-flow-redesign.md](docs/plans/2026-02-09-onboarding-flow-redesign.md)

- [ ] **OB-1:** OnboardingProgress Prisma model + migration
- [ ] **OB-2:** Progress API routes (GET progress, POST update, POST skip, POST dismiss)
- [ ] **OB-3:** Update POST /initialize to create OnboardingProgress (40%)
- [ ] **OB-4:** API tests for progress routes
- [ ] **OB-5:** Update onboarding store (phone, timezone fields)
- [ ] **OB-6:** Minimal wizard (2 steps: Welcome + EssentialInfo)
- [ ] **OB-7:** CircularProgress component (recharts donut)
- [ ] **OB-8:** OnboardingHeroCard on dashboard
- [ ] **OB-9:** SidebarProgressIndicator
- [ ] **OB-10:** Frontend tests for onboarding components

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

---

## Phase Progress

| Phase | Backend | Frontend | Status |
|-------|---------|----------|--------|
| Foundation | COMPLETE | COMPLETE | COMPLETE |
| 1: See Your Money | COMPLETE (62 tests) | COMPLETE | COMPLETE |
| 2: Track Your Money | COMPLETE (117 tests) | 0/6 tasks | 70% |
| 3: Post Your Money | Not started | Not started | Not started |

**Total Backend Tests:** 235 (62 + 117 + 35 system + 21 overview)

---

## Tomorrow's Focus (2026-02-10)

**Primary Goal:** Phase 2 Frontend — CSV upload flow + onboarding backend

**Recommended Order:**
1. **FE-2.1:** CSV Upload Component — enables the core import flow (drag-and-drop, validation)
2. **FE-2.2:** Column Mapping Interface — complete the import UX
3. **OB-1 to OB-4:** Onboarding backend (Prisma model + API routes + tests)
4. **FE-2.3b / FE-2.5b:** Polish matching UI + import history enhancements

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
