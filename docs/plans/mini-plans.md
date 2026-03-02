# Mini-Plans — Needs-Context Task Clusters

> Generated 2026-02-21. Lightweight context for tasks that don't have full plans.
> Format: Files, Pattern, Acceptance, Dependencies per cluster.

---

## Cluster A: Testing Infrastructure

**Tasks:** TEST-1, TEST-2, TEST-3, DEV-2

### MINI-PLAN: TEST-1 — Service tests for 4 remaining reports (BS, CF, TB, GL)

**Files:**
- `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts` (extend)
- `apps/api/src/domains/accounting/services/report.service.ts` (reference)
- `apps/api/src/domains/accounting/routes/__tests__/` (add route tests)
**Pattern:** Follow existing test structure in `report.service.test.ts` — mock Prisma, test each report method, assert integer cents + tenant isolation.
**Acceptance:** 4 report methods have >3 test cases each. All pass. Financial assertions (integer cents, balanced JEs) included.
**Dependencies:** None

### MINI-PLAN: TEST-2 — E2E tests for critical user flows

**Files:**
- `apps/web/tests/` (create E2E directory)
- `apps/web/playwright.config.ts` (create)
- Test files: `onboarding.spec.ts`, `import.spec.ts`, `posting.spec.ts`, `reports.spec.ts`
**Pattern:** Playwright E2E. Each test: login → navigate → action → assert result. Use test fixtures for auth.
**Acceptance:** 4 critical flows tested E2E. CI-runnable. No flaky tests.
**Dependencies:** Needs running API + DB for E2E

### MINI-PLAN: DEV-2 — Service tests for client/invoice/bill/vendor services

**Files:**
- `apps/api/src/domains/clients/services/__tests__/client.service.test.ts` (create)
- `apps/api/src/domains/invoicing/services/__tests__/invoice.service.test.ts` (create)
- `apps/api/src/domains/invoicing/services/__tests__/bill.service.test.ts` (create)
- `apps/api/src/domains/vendors/services/__tests__/vendor.service.test.ts` (create)
**Pattern:** Follow `apps/api/src/domains/banking/services/__tests__/account.service.test.ts` — mock Prisma, test CRUD + tenant isolation + soft delete + integer cents.
**Acceptance:** Each service has >=5 test cases. All financial assertions pass.
**Dependencies:** None

---

## Cluster B: Business Domain Features

**Tasks:** UX-17, UX-29, UX-31, UX-32, UX-33, UX-34, UX-36, UX-44, UX-52, UX-55, DEV-59, DEV-83, DEV-85, DEV-122, DEV-123

### MINI-PLAN: UX-17 — App-wide toast notifications

**Files:**
- Already wired: `sonner` v2.0.7 installed, `toast` imported in JE form
- Add to 16 mutation files in `apps/web/src/lib/api/`: `bills.ts`, `invoices.ts`, `vendors.ts`, `clients.ts`, `accounts.ts`, `transactions.ts`, `entities.ts`, `payments.ts`, `categories.ts`, `accounting.ts`
- Components calling mutations: search for `apiClient` with POST/PUT/DELETE in `apps/web/src/`
**Pattern:** After each `apiClient` mutation call, add `toast.success('Record created')` / `toast.error(err.message)`. Follow existing pattern in `journal-entry-form.tsx:127,131`.
**Acceptance:** Every create/update/delete mutation across all domains shows a toast. Success = green, Error = red with message.
**Dependencies:** None (sonner already installed)

### MINI-PLAN: UX-29 — Confirmation dialogs on destructive actions

**Files:**
- `apps/web/src/components/ui/alert-dialog.tsx` (existing shadcn component)
- Create: `apps/web/src/components/shared/ConfirmDialog.tsx` (wrapper)
- Add to: JE void/delete, invoice cancel, bill cancel, account deactivate, bulk delete handlers
**Pattern:** Create `ConfirmDialog` wrapper around shadcn `AlertDialog`. Props: `title`, `description`, `onConfirm`, `variant: 'destructive' | 'warning'`. Use in all delete/void/cancel handlers.
**Acceptance:** 6+ destructive actions have confirmation dialogs. No destructive action fires without user confirmation.
**Dependencies:** None

### MINI-PLAN: UX-31 — Search/filter bars on business lists

**Files:**
- Create: `apps/web/src/components/shared/SearchFilterBar.tsx`
- Modify: `apps/web/src/components/business/InvoiceTable.tsx`, `BillsTable.tsx`, `ClientsTable.tsx`, `VendorsTable.tsx`
- API already supports: `search` param in `clients.ts:38`, `vendors.ts:38`
**Pattern:** Shared `SearchFilterBar` with debounced search input + status dropdown + date range. Passes filter params to API client. Follow banking TransactionsFilters pattern.
**Acceptance:** All 4 business list pages have working search + status filter. Debounced (300ms). Clears with X button.
**Dependencies:** None

### MINI-PLAN: UX-32 — Pagination controls

**Files:**
- Create: `apps/web/src/components/shared/LoadMoreButton.tsx`
- Modify: `InvoiceTable.tsx`, `BillsTable.tsx`, `ClientsTable.tsx`, `VendorsTable.tsx`
- API already returns: `nextCursor` in response (57 files use cursor pattern)
**Pattern:** `LoadMoreButton` shows "Load More" when `nextCursor` exists. Appends new page to existing data. Shows "No more items" when cursor is null.
**Acceptance:** All 4 business lists support infinite scroll / load-more. Works with filters applied.
**Dependencies:** None

### MINI-PLAN: UX-33 — Cross-links between related records

**Files:**
- Modify: Invoice detail → add Client link, JE detail → add Transaction link, Bill detail → add Vendor link, Payment detail → add Invoice/Bill links
- Components in `apps/web/src/components/business/` and `apps/web/src/app/(dashboard)/accounting/`
**Pattern:** Add clickable `<Link href="/business/clients/{id}">` badges/buttons near related fields. Use `lucide-react` ExternalLink icon.
**Acceptance:** Invoice shows clickable client name. Transaction shows JE link. Bill shows vendor link. Payment shows invoice/bill links.
**Dependencies:** Client/vendor detail pages should exist (DEV-122, DEV-123)

### MINI-PLAN: DEV-59 — Transaction posting UI

**Files:**
- Backend exists: `apps/api/src/domains/accounting/services/posting.service.ts:24` — `postTransaction(transactionId, glAccountId)`
- Create: `apps/web/src/components/transactions/TransactionPostingDialog.tsx`
- Modify: `apps/web/src/components/transactions/TransactionsTable.tsx` (add "Post to GL" action)
- API client: `apps/web/src/lib/api/accounting.ts` (add postTransaction function)
**Pattern:** Dialog with: GL account combobox (searchable) + debit/credit radio + memo field. Submit calls posting endpoint. Success shows toast + updates transaction row.
**Acceptance:** User can select transaction(s) → click "Post to GL" → pick account → creates journal entry. Transaction shows posted status.
**Dependencies:** None

### MINI-PLAN: DEV-83 — Credit notes feature

**Files:**
- Schema: `CreditNote` model exists in `packages/db/prisma/schema.prisma`
- Create backend: `apps/api/src/domains/invoicing/services/credit-note.service.ts`, `credit-note.schema.ts`, routes
- Create frontend: `apps/web/src/app/(dashboard)/business/credit-notes/` (page + list + form)
- API client: `apps/web/src/lib/api/credit-notes.ts`
**Pattern:** Follow invoice pattern exactly — CRUD service, Zod schemas, route registration, frontend page with table + form sheet. Include GL posting (reverse of invoice posting).
**Acceptance:** Full CRUD for credit notes. Can create from invoice. Posts reverse JE. Shows in invoice detail.
**Dependencies:** None

### MINI-PLAN: DEV-122 — Client detail page

**Files:**
- Create: `apps/web/src/app/(dashboard)/business/clients/[id]/page.tsx` (server component)
- Create: `apps/web/src/app/(dashboard)/business/clients/[id]/client-detail-client.tsx` (client component)
- Create: `apps/web/src/app/(dashboard)/business/clients/[id]/loading.tsx`, `error.tsx`
- Reference: `apps/web/src/components/business/ClientDetailPanel.tsx` (existing sheet — promote to full page)
- API: `apps/web/src/lib/api/clients.ts:95` — `getClient(id)` already exists
**Pattern:** Follow `accounting/journal-entries/[id]/` pattern — server page fetches data, passes to client component. Tabs: Overview, Invoice History, Payments. Edit via sheet.
**Acceptance:** Navigate to `/business/clients/[id]`. Shows contact info, stats, invoice history tab, edit capability. Loading + error states.
**Dependencies:** None

### MINI-PLAN: DEV-123 — Vendor detail page

**Files:**
- Create: `apps/web/src/app/(dashboard)/business/vendors/[id]/page.tsx`
- Create: `apps/web/src/app/(dashboard)/business/vendors/[id]/vendor-detail-client.tsx`
- Create: `apps/web/src/app/(dashboard)/business/vendors/[id]/loading.tsx`, `error.tsx`
- Reference: `apps/web/src/components/business/VendorDetailPanel.tsx` (existing — promote)
- API: `apps/web/src/lib/api/vendors.ts:95` — `getVendor(id)` already exists
**Pattern:** Mirror client detail page structure. Tabs: Overview, Bill History, Payments.
**Acceptance:** Navigate to `/business/vendors/[id]`. Shows contact info, stats, bill history tab, edit capability.
**Dependencies:** None

---

## Cluster C: Accounting Features

**Tasks:** UX-18, UX-19, UX-20, UX-21, UX-22, UX-24, UX-25, DEV-61 through DEV-65

### MINI-PLAN: UX-18 — Accounting landing page

**Files:**
- Create: `apps/web/src/app/(dashboard)/accounting/page.tsx`
- Create: `apps/web/src/app/(dashboard)/accounting/loading.tsx`, `error.tsx`
- API: Use existing `listGLAccounts`, `listJournalEntries` + count queries
**Pattern:** Summary card grid: Draft JEs count, Total GL accounts, Recent activity list. Links to sub-pages. Follow dashboard command center card pattern.
**Acceptance:** `/accounting` shows summary stats. Cards link to COA, JEs, Reports. Loading + error states.
**Dependencies:** None

### MINI-PLAN: UX-19 — COA search input

**Files:**
- Modify: `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx`
- Backend: `search` param already supported in API
**Pattern:** Add `Input` with search icon above account table. Debounce 300ms. Pass `search` param to API call.
**Acceptance:** Typing in search filters GL accounts by name/code. Clears with X.
**Dependencies:** None

### MINI-PLAN: UX-22 — Fix JE filter auto-refresh

**Files:**
- Modify: `apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entries-client.tsx`
**Pattern:** Add filter state as dependency to the data-fetching `useEffect`. When status/date changes, refetch from page 1.
**Acceptance:** Changing status dropdown or date filter immediately refreshes the list.
**Dependencies:** None

### MINI-PLAN: DEV-61 — Multi-currency JE form

**Files:**
- Modify: `apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entry-form.tsx`
- Backend: JournalEntry model already has `currency` field
**Pattern:** Add currency selector dropdown. When non-base currency selected, show exchange rate input + auto-calculated base amount. Follow transaction multi-currency display pattern.
**Acceptance:** Can create JE in any currency. Exchange rate stored. Base currency amount auto-calculated.
**Dependencies:** None

### MINI-PLAN: DEV-65 — Account reconciliation page

**Files:**
- Backend exists: `apps/api/src/domains/banking/services/reconciliation.service.ts` (43 tests)
- Create: `apps/web/src/app/(dashboard)/accounting/reconciliation/page.tsx`
- Create: reconciliation client component, loading, error
**Pattern:** Two-column layout: GL balance vs Bank statement balance. Table of unmatched items. Match/unmatch buttons.
**Acceptance:** Can view reconciliation status per account. Can match/unmatch transactions. Shows balanced/unbalanced indicator.
**Dependencies:** None

---

## Cluster D: Banking Advanced Features

**Tasks:** DEV-47 through DEV-58

### MINI-PLAN: DEV-47 — Transaction full-text search

**Files:**
- Modify: `apps/web/src/components/transactions/TransactionsFilters.tsx` (add search input)
- Backend: Transaction search may need new param in API or use existing filter
**Pattern:** Add search input to TransactionsFilters. Debounce 300ms. Search on description + notes fields.
**Acceptance:** Typing in search box filters transactions by description. Works with other filters.
**Dependencies:** None

### MINI-PLAN: DEV-52 — Duplicate management UI

**Files:**
- Backend exists: `apps/api/src/domains/banking/services/duplication.service.ts`
- Create: `apps/web/src/components/banking/DuplicateManagement.tsx`
- Wire into: banking account detail or separate page
**Pattern:** Table of detected duplicates with "Keep" / "Remove" / "Merge" actions. Show similarity score. Group by account.
**Acceptance:** User can view detected duplicates, approve/dismiss each. Dismissed duplicates don't reappear.
**Dependencies:** None

### MINI-PLAN: DEV-57 — CSV import column mapping UI

**Files:**
- Backend supports: `columnMappings` parameter in import endpoints
- Existing: `apps/web/src/components/import/ColumnMappingEditor.tsx` (EXISTS)
- Wire: Ensure ColumnMappingEditor is used in import wizard flow
**Pattern:** Step in import wizard where user maps CSV columns to transaction fields. Drag-and-drop or dropdown selectors.
**Acceptance:** User can map custom CSV columns before import. Mappings persist for re-use.
**Dependencies:** None

---

## Cluster E: Planning Domain (Full Build)

**Tasks:** DEV-97 through DEV-111, UX-58 through UX-65

### MINI-PLAN: DEV-97 + DEV-98 — Goal & Budget services

**Files:**
- Schema: `Budget` (line 629) and `Goal` (line 648) models exist in schema.prisma
- Create: `apps/api/src/domains/planning/services/goal.service.ts`
- Create: `apps/api/src/domains/planning/services/budget.service.ts`
- Create: `apps/api/src/domains/planning/routes/goals.ts`, `budgets.ts`
- Create: `apps/api/src/domains/planning/schemas/goal.schema.ts`, `budget.schema.ts`
- Create: `apps/web/src/lib/api/planning.ts` (API client)
**Pattern:** Follow account.service.ts pattern — CRUD operations with TenantContext. Zod schemas for validation. Route registration in domain index. Entity-scoped queries.
**Acceptance:** Full CRUD for goals + budgets. Tenant-isolated. Integer cents for monetary fields. Tests written.
**Dependencies:** None

### MINI-PLAN: DEV-102 — Forecast model + CRUD

**Files:**
- Schema: Add `Forecast` model to `packages/db/prisma/schema.prisma`
- Create service, routes, schemas following Goal/Budget pattern
**Pattern:** Forecast model: name, type (OPTIMISTIC/PESSIMISTIC/BASELINE), period, amounts as JSON, entityId. Follow Budget pattern.
**Acceptance:** Forecast CRUD works. 3 scenario types supported. Entity-scoped.
**Dependencies:** None

### MINI-PLAN: UX-58 + UX-59 — Goals & Budgets pages

**Files:**
- Pages exist but are stubs: `apps/web/src/app/(dashboard)/planning/goals/page.tsx`, `budgets/page.tsx`
- Replace stubs with real components using API client from DEV-97/98
**Pattern:** List page with table/cards + create form sheet. Follow invoice list pattern. Goal: progress bar + deadline. Budget: used/remaining bar.
**Acceptance:** Real data displayed. Can create/edit/delete. Progress visualization works.
**Dependencies:** DEV-97, DEV-98

---

## Cluster F: Insights/AI Domain

**Tasks:** DEV-113, DEV-115, DEV-116, DEV-117, DEV-118

### MINI-PLAN: DEV-113 — AI Chat interface

**Files:**
- Backend exists: `apps/api/src/domains/ai/routes.ts` — `POST /api/ai/chat`
- Frontend page exists: `apps/web/src/app/(dashboard)/insights/insights/page.tsx`
- Create: `apps/web/src/components/insights/ChatInterface.tsx`
- Needs: `apps/web/src/lib/api/ai.ts` (DEV-112 — atomic, do first)
**Pattern:** Chat UI: message list + input box. Send to `/api/ai/chat`. Stream response. Show financial context. Follow standard chat UX.
**Acceptance:** User can ask questions. AI responds with financial context. Messages persist in session.
**Dependencies:** DEV-112 (API client)

### MINI-PLAN: DEV-118 — Implement GET /api/ai/insights endpoint

**Files:**
- Current: `apps/api/src/domains/ai/routes.ts:101` — returns 501
- Schema: `Insight` model exists in Prisma
- Create: `apps/api/src/domains/ai/services/insight.service.ts`
**Pattern:** Query Insight model for entity. Return paginated insights. Generate basic insights from transaction patterns (e.g., "Spending up 20% this month").
**Acceptance:** Endpoint returns real insights. Not 501. Basic auto-generated insights from transaction data.
**Dependencies:** None

---

## Cluster G: Infrastructure & Security

**Tasks:** SEC-8, SEC-10, INFRA-1/2/3/5/7/8/11/13, ARCH-1/3/5

These are infrastructure tasks that need deployment context. Mini-plans are lighter here since they depend on hosting decisions.

### MINI-PLAN: INFRA-1 — CI/CD pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
**Pattern:** CI: lint → typecheck → test → build on PR. Deploy: on merge to main → build → deploy to hosting.
**Acceptance:** PRs run CI. Merge to main auto-deploys. Failures block merge.
**Dependencies:** INFRA-2 (needs production environment first)

### MINI-PLAN: ARCH-3 — S3 cloud storage migration

**Files:**
- Current: `apps/api/src/domains/system/services/file-upload.service.ts` (local filesystem)
- Modify: Replace `fs.writeFile` with S3 `PutObject`. Add S3 client config.
**Pattern:** Use `@aws-sdk/client-s3`. Pre-signed URLs for uploads. Store S3 key in database.
**Acceptance:** Files upload to S3. Download via pre-signed URLs. Local filesystem no longer used.
**Dependencies:** AWS account setup

---

## Cluster H: Advanced Financial

**Tasks:** FIN-7 through FIN-12, DEV-66 through DEV-70

### MINI-PLAN: FIN-7 — Fiscal period enforcement

**Files:**
- Schema: May need `FiscalPeriod` model (create if not exists)
- Modify: `apps/api/src/domains/accounting/services/journal-entry.service.ts` — add period check before posting
**Pattern:** FiscalPeriod: startDate, endDate, status (OPEN/CLOSED/LOCKED). Before posting JE, verify target date falls in OPEN period. Reject if CLOSED/LOCKED.
**Acceptance:** Cannot post JE to closed period. Error message indicates which period is closed.
**Dependencies:** None

### MINI-PLAN: FIN-8 — Fiscal year close

**Files:**
- Create: `apps/api/src/domains/accounting/services/fiscal-close.service.ts`
- Creates closing JE: revenue/expense → retained earnings
**Pattern:** Close process: lock period → generate closing entries (revenue + expense accounts → Retained Earnings) → create new period. Idempotent — can re-run safely.
**Acceptance:** Year-end close generates correct closing entries. Retained earnings balance matches. Period locked after close.
**Dependencies:** FIN-7

### MINI-PLAN: DEV-66 — Aged receivables/payables report

**Files:**
- Extend: `apps/api/src/domains/accounting/services/report.service.ts` (add aging methods)
- Create: `apps/web/src/app/(dashboard)/accounting/reports/aging/` (page + view)
**Pattern:** Query invoices/bills grouped by age bucket (0-30, 31-60, 61-90, 90+). Sum amounts per bucket. Show table + bar chart.
**Acceptance:** AR aging shows invoice amounts by bucket. AP aging shows bill amounts. Totals match outstanding balance.
**Dependencies:** None

---

_Total: 8 clusters, ~30 mini-plans covering ~84 tasks_
_Each mini-plan provides: Files, Pattern, Acceptance, Dependencies_
