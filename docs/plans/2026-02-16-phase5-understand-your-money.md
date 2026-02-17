# Phase 5: Understand Your Money — Implementation Plan

**Created:** 2026-02-16
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-16-phase5-understand-your-money-brainstorm.md](../brainstorms/2026-02-16-phase5-understand-your-money-brainstorm.md)

## Overview

Phase 5 delivers the three core financial statements (Profit & Loss, Balance Sheet, Cash Flow), supporting reports (Trial Balance, GL Ledger, Spending by Category, Revenue by Client), PDF/CSV export, full data backup, and basic charts. Reports use raw SQL aggregation via `prisma.$queryRaw` against existing GL data — no schema migrations needed. Frontend moves reports from `/planning/reports/` to `/accounting/reports/`.

## Success Criteria

- [ ] P&L statement generates correctly (revenue - expenses, account hierarchy, period comparison)
- [ ] Balance Sheet balances (A = L + E, retained earnings computed dynamically per fiscal year)
- [ ] Cash Flow statement classifies by operating/investing/financing using GL code ranges
- [ ] All 3 statements support multi-entity consolidation (simple aggregation)
- [ ] Trial Balance and GL Ledger reports work with drill-down
- [ ] Management reports (spending by category, revenue by client) function
- [ ] PDF export produces audit-grade documents for all 3 statements
- [ ] CSV export works for all report types
- [ ] Full data backup downloads ZIP with all entity data
- [ ] In-memory cache with 5-min TTL improves repeat view performance
- [ ] Reports accessible at `/accounting/reports/` with proper navigation
- [ ] All report queries include tenant isolation and respect soft delete
- [ ] All monetary amounts remain integer cents through SQL → API → display

---

## Tasks

### Sprint 1: Backend Core Reports

#### Task 1: Report Zod Schemas
**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts`
**What:** Define Zod schemas for all report parameters:
- `ProfitLossQuerySchema` — entityId (optional), startDate, endDate, comparisonPeriod (optional)
- `BalanceSheetQuerySchema` — entityId (optional), asOfDate, comparisonDate (optional)
- `CashFlowQuerySchema` — entityId (optional), startDate, endDate
- `TrialBalanceQuerySchema` — entityId (required), asOfDate (optional)
- `GLLedgerQuerySchema` — entityId (required), glAccountId, startDate, endDate, cursor, limit
- `SpendingQuerySchema` — entityId (optional), startDate, endDate
- `RevenueQuerySchema` — entityId (optional), startDate, endDate
- `ExportFormatSchema` — format enum: `json` | `csv` | `pdf`
- Shared: all dates as `.datetime()`, entityId as `.cuid().optional()`, tenantId injected at route level
- Export inferred types for each schema
**Depends on:** none
**Success:** Schemas compile, validate sample params correctly

#### Task 2: Report Service — TypeScript Interfaces
**File:** `apps/api/src/domains/accounting/services/report.service.ts`
**What:** Define the `ReportService` class skeleton and all return type interfaces:
- `ProfitLossReport` — sections (revenue, expenses), line items with account hierarchy, totals, comparison columns, netIncome
- `BalanceSheetReport` — sections (assets, liabilities, equity), retainedEarnings, isBalanced flag, totalAssets, totalLiabilitiesAndEquity
- `CashFlowReport` — sections (operating, investing, financing), netIncome, adjustments, netCashChange, opening/closing cash
- `ReportLineItem` — accountId, code, name, type, balance, previousBalance (optional), depth, isSubtotal, children
- `TrialBalanceReport` — accounts with debit/credit columns, totals
- `GLLedgerReport` — entries with running balance, cursor pagination
- Class constructor: `constructor(private tenantId: string, private userId: string)`
- Private helpers: `validateEntityOwnership()`, `getEntityIds()` (returns all entity IDs for tenant when entityId omitted)
**Depends on:** none
**Success:** Types compile, class instantiates

#### Task 3: Report Service — Profit & Loss
**File:** `apps/api/src/domains/accounting/services/report.service.ts`
**What:** Implement `generateProfitLoss(params)` method:
- Raw SQL via `prisma.$queryRaw`: JOIN `JournalLine` → `JournalEntry` → `GLAccount`, GROUP BY `glAccountId`
- WHERE: `je.status = 'POSTED'`, `je."deletedAt" IS NULL`, `jl."deletedAt" IS NULL`, `je.date BETWEEN startDate AND endDate`
- Multi-entity: if entityId provided, filter by it; otherwise aggregate all tenant entities via `je."entityId" IN (SELECT id FROM "Entity" WHERE "tenantId" = $tenant)`
- Use `baseCurrencyDebit`/`baseCurrencyCredit` for multi-entity (already in reporting currency)
- For single entity: use `debitAmount`/`creditAmount` (original currency)
- Account hierarchy: query all GL accounts, build parent-child tree, roll up subtotals
- Balance direction: INCOME accounts = Credit - Debit, EXPENSE accounts = Debit - Credit
- Period comparison: if comparisonPeriod provided, run same query for previous period
- Return `ProfitLossReport` with `netIncome = totalRevenue - totalExpenses`
**Depends on:** Task 2
**Risk:** high (financial calculation, raw SQL, multi-currency)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** P&L correctly sums INCOME and EXPENSE accounts for a date range with tenant isolation

#### Task 4: Report Service — Balance Sheet
**File:** `apps/api/src/domains/accounting/services/report.service.ts`
**What:** Implement `generateBalanceSheet(params)` method:
- Raw SQL: same JOIN pattern, but WHERE `je.date <= asOfDate` (inception through as-of date)
- Sections: ASSET, LIABILITY, EQUITY account types
- **Retained Earnings** (dynamic):
  - Get entity's `fiscalYearStart` month
  - Compute current fiscal year start date from `asOfDate`
  - Query FiscalCalendar for the entity's fiscal year boundaries
  - Sum INCOME - EXPENSE from fiscal year start through asOfDate = current year retained earnings
  - Sum INCOME - EXPENSE from inception through fiscal year start = prior years' retained earnings
  - Add both to Equity section as synthetic line items
- Validation: `isBalanced = (totalAssets === totalLiabilities + totalEquity + retainedEarnings)`
- Multi-entity: same pattern as P&L (aggregate all entities, use baseCurrency amounts)
- Account hierarchy with subtotals
**Depends on:** Task 3
**Risk:** high (retained earnings logic, balance equation, fiscal year boundaries)
**Review:** `financial-data-validator`
**Success:** Balance sheet balances (A = L + E) with retained earnings computed per fiscal year

#### Task 5: Report Service — Cash Flow Statement
**File:** `apps/api/src/domains/accounting/services/report.service.ts`
**What:** Implement `generateCashFlow(params)` method using indirect method:
- Start with Net Income from P&L (reuse `generateProfitLoss` internally)
- **Non-cash adjustments:** Query EXPENSE accounts with code 5900 (depreciation) — add back
- **Working capital changes:** Compare balance sheet at startDate vs endDate for:
  - Operating: codes 1200-1499 (AR, inventory, prepaid) and 2000-2499 (AP, accrued, tax)
  - Direction: increase in current assets = cash outflow, increase in current liabilities = cash inflow
- **Classification by code range:**
  - Operating: net income + non-cash + working capital
  - Investing: codes 1500-1999 (fixed assets, investments) — net change
  - Financing: codes 2500+ (loans) and 3000-3200 (equity, draws) — net change
- Cash section: codes 1000-1199 (cash and bank accounts) — opening and closing balances
- Net cash change = Operating + Investing + Financing
- Validate: closing cash = opening cash + net cash change
**Depends on:** Task 3, Task 4
**Risk:** high (complex financial logic, code range classification)
**Review:** `financial-data-validator`
**Success:** Cash flow sections sum correctly, net change reconciles to cash position change

#### Task 6: Report Routes
**File:** `apps/api/src/domains/accounting/routes/report.ts`
**What:** Create route handlers for the 3 core statements:
- `GET /reports/profit-loss` — validates query with `ProfitLossQuerySchema`, calls `ReportService.generateProfitLoss()`
- `GET /reports/balance-sheet` — validates query with `BalanceSheetQuerySchema`, calls `ReportService.generateBalanceSheet()`
- `GET /reports/cash-flow` — validates query with `CashFlowQuerySchema`, calls `ReportService.generateCashFlow()`
- All routes use `withPermission('accounting', 'reports', 'VIEW')`
- Construct `ReportService` with `request.tenantId, request.userId`
- Error handling: reuse `AccountingError` pattern from gl-account routes
- Register in `apps/api/src/domains/accounting/routes/index.ts`: `await fastify.register(reportRoutes, { prefix: '/reports' })`
**Depends on:** Task 1, Task 3, Task 4, Task 5
**Success:** GET endpoints return JSON report data with tenant isolation

#### Task 7: Report Service Tests — Core Statements
**File:** `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts`
**What:** Test all 3 core statements:
- Mock `prisma.$queryRaw` to return known journal line aggregates
- P&L tests: single entity, multi-entity (no entityId), comparison period, empty GL data
- Balance Sheet tests: balance equation (A = L + E), retained earnings, unbalanced warning, as-of-date filtering
- Cash Flow tests: indirect method calculation, code range classification, net change reconciliation
- Tenant isolation: verify tenantId appears in all raw SQL queries
- Integer cents: `assertIntegerCents()` on all monetary fields
- Edge cases: no GL data returns empty report, zero-balance accounts included
- ~25 tests
**Depends on:** Task 3, Task 4, Task 5
**Risk:** high (financial assertions critical)
**Review:** `financial-data-validator`
**Success:** All tests pass with correct financial calculations

---

### Sprint 2: Supporting Reports + Cache

#### Task 8: Report Service — Trial Balance + GL Ledger
**File:** `apps/api/src/domains/accounting/services/report.service.ts`
**What:** Add two methods:
- `generateTrialBalance(params)`:
  - Raw SQL: sum debits and credits per account as-of-date
  - Return: list of accounts with debit column, credit column, totals
  - Validation: `totalDebits === totalCredits`
  - Single entity only (entityId required)
- `generateGLLedger(params)`:
  - Query individual journal lines for a specific GL account, ordered by date
  - Running balance: cumulative debit-credit (or credit-debit based on normalBalance)
  - Cursor pagination (same pattern as `JournalEntryService.listEntries`)
  - Include: entry date, memo, debit, credit, running balance, journal entry reference
**Depends on:** Task 2
**Success:** Trial Balance debits equal credits, GL Ledger shows running balance

#### Task 9: Report Service — Management Reports
**File:** `apps/api/src/domains/accounting/services/report.service.ts`
**What:** Add two management report methods:
- `generateSpendingByCategory(params)`:
  - Query EXPENSE journal lines grouped by category (via `Transaction.categoryId` → `Category`)
  - Fallback: group by GL account if no category assigned
  - Return: list of categories with total spend, percentage of total
- `generateRevenueByClient(params)`:
  - Query INCOME journal entries where `sourceType = 'INVOICE'`
  - Join `sourceId` → `Invoice` → `Client` to get client name
  - Return: list of clients with total revenue, invoice count, percentage of total
- Both support entityId filter (optional) and date range
**Depends on:** Task 2
**Success:** Spending groups by category, revenue groups by client with correct totals

#### Task 10: In-Memory Report Cache
**File:** `apps/api/src/domains/accounting/services/report-cache.ts`
**What:** Create lightweight in-memory cache:
- `ReportCache` class with `Map<string, { data: unknown; expiry: number }>`
- Methods: `get(key)`, `set(key, data, ttlMs)`, `invalidate(pattern)`, `clear()`
- Key format: `report:{type}:{entityId}:{startDate}:{endDate}:{tenantId}`
- Default TTL: 5 minutes (300000ms)
- `invalidate(pattern)`: regex match against keys (for cache busting on posting)
- Singleton export: `export const reportCache = new ReportCache()`
- Add `X-Cache: HIT|MISS` header in report routes
- Wire cache into `ReportService`: check cache before query, set after query
- Wire invalidation into `PostingService` and `DocumentPostingService`: call `reportCache.invalidate()` after creating/voiding entries
**Depends on:** Task 6
**Success:** Second request for same report within 5 min returns cached data with `X-Cache: HIT`

#### Task 11: Supporting Report Routes + Tests
**Files:** `apps/api/src/domains/accounting/routes/report.ts`, `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts`
**What:** Add routes for supporting reports + tests for Sprint 2:
- Routes:
  - `GET /reports/trial-balance` — requires entityId
  - `GET /reports/general-ledger` — requires entityId + glAccountId
  - `GET /reports/spending` — spending by category
  - `GET /reports/revenue` — revenue by client
- Tests (~15 tests):
  - Trial Balance: debits equal credits, single entity required
  - GL Ledger: running balance accuracy, cursor pagination, date range filter
  - Spending: groups correctly, handles uncategorized
  - Revenue: groups by client via invoice source
  - Cache: hit/miss behavior, invalidation on posting
**Depends on:** Task 8, Task 9, Task 10
**Success:** All supporting report endpoints work with correct data, cache functions

---

### Sprint 3: Frontend — Reports Home + P&L + Balance Sheet

#### Task 12: Move Reports to Accounting + Navigation Update
**Files:**
- `apps/web/src/lib/navigation.ts`
- Delete: `apps/web/src/app/(dashboard)/planning/reports/` (page.tsx, loading.tsx, error.tsx)
- Create: `apps/web/src/app/(dashboard)/accounting/reports/` (page.tsx, loading.tsx, error.tsx)
**What:**
- Update `navigation.ts`: move Reports from `planning` group to `accounting` group
  - Add `{ label: 'Reports', icon: BarChart3, href: '/accounting/reports' }` to accounting items
  - Remove Reports entry from planning items
- Delete old stub at `planning/reports/`
- Create new reports home page at `accounting/reports/page.tsx`:
  - Server component with metadata
  - Cards grid linking to each report type (P&L, Balance Sheet, Cash Flow, Trial Balance, GL Ledger, Spending, Revenue)
  - Each card: icon, title, description, link
  - Glass styling, proper semantic tokens
- Create `loading.tsx` and `error.tsx` siblings (REQUIRED per conventions)
**Depends on:** none (can parallel with backend)
**Success:** Reports accessible at `/accounting/reports/`, navigation updated, old stub removed

#### Task 13: Reports API Client
**File:** `apps/web/src/lib/api/reports.ts`
**What:** Create API client functions for all report endpoints:
- `getProfitLoss(params)` → `GET /api/accounting/reports/profit-loss?...`
- `getBalanceSheet(params)` → `GET /api/accounting/reports/balance-sheet?...`
- `getCashFlow(params)` → `GET /api/accounting/reports/cash-flow?...`
- `getTrialBalance(params)` → `GET /api/accounting/reports/trial-balance?...`
- `getGLLedger(params)` → `GET /api/accounting/reports/general-ledger?...`
- `getSpendingByCategory(params)` → `GET /api/accounting/reports/spending?...`
- `getRevenueByClient(params)` → `GET /api/accounting/reports/revenue?...`
- TypeScript interfaces for all report response types (mirror backend types)
- Use `URLSearchParams` pattern from `accounting.ts`
- Use `apiClient<T>()` from `client.ts`
**Depends on:** none
**Success:** All API client functions typed and callable

#### Task 14: Profit & Loss Report Page
**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/error.tsx`
**What:**
- `page.tsx`: Server component with metadata, renders `<PLReportView />`
- `pl-report-view.tsx` (client component):
  - Controls: entity selector (with "All Entities"), date range picker (start/end), comparison toggle
  - Report table: expandable account hierarchy (parent → children), amounts in `font-mono`
  - Revenue section, Expenses section, Net Income row (bold, highlighted)
  - Comparison columns (current vs previous period) when enabled
  - Format amounts: cents → dollars with currency symbol
  - Empty state: "Post transactions to see your P&L"
  - Export buttons placeholder (wired in Sprint 5)
  - Uses `glass` card styling, `text-ak-green` for income, `text-ak-red` for expenses
**Depends on:** Task 13
**Review:** `nextjs-app-router-reviewer`, `design-system-enforcer`
**Success:** P&L renders with expandable hierarchy, correct formatting, entity filter works

#### Task 15: Balance Sheet Report Page
**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/error.tsx`
**What:**
- Same structure as P&L page
- `bs-report-view.tsx` (client component):
  - Controls: entity selector, as-of date picker, comparison toggle
  - Three sections: Assets, Liabilities, Equity (with retained earnings)
  - Balance equation display: "Total Assets = Total Liabilities + Equity"
  - Warning banner if `isBalanced === false`: "Balance sheet doesn't balance"
  - Expandable hierarchy per section
  - Retained earnings shown as synthetic line items (current year + prior years)
  - All amounts in `font-mono`, totals bold
**Depends on:** Task 13
**Review:** `nextjs-app-router-reviewer`
**Success:** Balance sheet renders with 3 sections, balance equation check, retained earnings

---

### Sprint 4: Frontend — Cash Flow + Supporting Reports

#### Task 16: Cash Flow Statement Page
**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/cf-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/error.tsx`
**What:**
- `cf-report-view.tsx` (client component):
  - Controls: entity selector, date range
  - Sections: Operating Activities (net income + adjustments + working capital), Investing, Financing
  - Opening cash, Net Cash Change, Closing cash
  - Reconciliation check: closing = opening + net change
  - Amounts formatted with +/- indicators
**Depends on:** Task 13
**Success:** Cash flow renders with 3 activity sections and reconciliation

#### Task 17: Trial Balance Report Page
**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/tb-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/error.tsx`
**What:**
- `tb-report-view.tsx` (client component):
  - Controls: entity selector (required), as-of date
  - Table: Account Code, Account Name, Debit, Credit
  - Footer row: Total Debits, Total Credits (should match)
  - Warning if totals don't match
  - Sorted by account code
**Depends on:** Task 13
**Success:** Trial balance shows debit/credit columns with matching totals

#### Task 18: General Ledger Report Page
**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/error.tsx`
**What:**
- `gl-report-view.tsx` (client component):
  - Controls: entity selector (required), GL account dropdown, date range
  - Table: Date, Entry #, Memo, Debit, Credit, Running Balance
  - Cursor pagination ("Load more" button)
  - Link to journal entry detail on entry number click
  - Running balance column in `font-mono`
**Depends on:** Task 13
**Success:** GL ledger shows individual entries with running balance and pagination

#### Task 19: Management Report Pages (Spending + Revenue)
**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/spending/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/spending/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/spending/error.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/revenue/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/revenue/revenue-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/revenue/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/revenue/error.tsx`
**What:**
- Spending: category table with amount, percentage bar, total
- Revenue: client table with amount, invoice count, percentage
- Both: entity selector, date range, sorted by amount descending
**Depends on:** Task 13
**Success:** Both management reports render with percentage bars and correct totals

---

### Sprint 5: PDF + CSV Export

#### Task 20: Install @react-pdf/renderer + Shared Styles
**Files:**
- `apps/api/package.json` (add dependency)
- `apps/api/tsconfig.json` (ensure JSX support)
- `apps/api/src/domains/accounting/templates/shared-styles.ts`
**What:**
- Install `@react-pdf/renderer` in apps/api
- Verify `tsconfig.json` has `"jsx": "react-jsx"` or `"jsx": "react"` for `.tsx` template files
- Create shared styles: brand colors, fonts, table cell styles, header/footer templates, `formatCents()` helper
- Define reusable components: `<ReportHeader>` (entity name, report title, date range), `<ReportFooter>` (page number, generated date), `<TableRow>`, `<SectionHeader>`
**Depends on:** none
**Success:** Shared styles compile, reusable PDF components render correctly

#### Task 21: P&L PDF Template
**File:** `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx`
**What:** React PDF template for Profit & Loss:
- Header: entity name, "Profit & Loss Statement", date range
- Revenue section with account hierarchy (indented)
- Total Revenue row (bold)
- Expenses section with account hierarchy
- Total Expenses row (bold)
- Net Income row (double-underlined, highlighted)
- Comparison columns if provided
- Footer: "Generated by Akount", timestamp, page numbers
- All amounts formatted from integer cents
**Depends on:** Task 20
**Success:** PDF generates valid buffer with professional P&L layout

#### Task 22: Balance Sheet + Cash Flow PDF Templates
**Files:**
- `apps/api/src/domains/accounting/templates/balance-sheet-pdf.tsx`
- `apps/api/src/domains/accounting/templates/cash-flow-pdf.tsx`
**What:**
- Balance Sheet PDF: Assets / Liabilities / Equity sections, retained earnings, balance equation
- Cash Flow PDF: Operating / Investing / Financing sections, opening/closing cash
- Both use shared styles from Task 20
- Professional formatting matching P&L template style
**Depends on:** Task 20
**Success:** Both PDFs generate valid buffers with correct sections

#### Task 23: CSV Export Service
**File:** `apps/api/src/domains/accounting/services/report-export.service.ts`
**What:** Create `ReportExportService`:
- `toCsv(report, type)`: convert any report type to CSV string
  - P&L: Account Code, Account Name, Type, Current Period, Previous Period (if comparison)
  - Balance Sheet: Account Code, Account Name, Section, Balance, Previous Balance
  - Cash Flow: Category, Description, Amount
  - Trial Balance: Account Code, Account Name, Debit, Credit
  - GL Ledger: Date, Entry #, Memo, Debit, Credit, Balance
- Use native string building (no external CSV library needed for this complexity)
- Header row + data rows, amounts in dollar format (cents / 100)
- Proper escaping for commas in strings (wrap in quotes)
**Depends on:** none
**Success:** CSV strings are valid, importable into Excel/Google Sheets

#### Task 24: Export Routes + Frontend Buttons
**Files:**
- `apps/api/src/domains/accounting/routes/report.ts` (add format handling)
- Update all Sprint 3/4 frontend report views
**What:**
- Route changes: check `format` query param on each report route
  - `format=json` (default): return JSON (existing behavior)
  - `format=csv`: call `ReportExportService.toCsv()`, return with `Content-Type: text/csv` + `Content-Disposition: attachment`
  - `format=pdf`: call PDF template, return with `Content-Type: application/pdf` + `Content-Disposition: attachment`
- Frontend: add export button group to each report page header
  - "Export PDF" button → `window.open()` to report URL with `?format=pdf`
  - "Export CSV" button → same with `?format=csv`
  - Use `ButtonGlass` variant
**Depends on:** Task 21, Task 22, Task 23
**Success:** PDF and CSV downloads work from all report pages

---

### Sprint 6: Data Backup + Charts + Polish

#### Task 25: Full Data Backup Service
**File:** `apps/api/src/domains/accounting/services/report-export.service.ts`
**What:** Add `generateDataBackup(tenantId, entityId?)` method:
- Query and export to CSV: entities, accounts, transactions, journal-entries, journal-lines, invoices, bills, payments, clients, vendors
- Each table as separate CSV string
- Create `metadata.json`: export date, entity info, tenant info, schema version, row counts
- Bundle into ZIP using Node.js built-in `zlib` (deflate) or lightweight `archiver` package
- Tenant isolation: all queries scoped to tenantId
- Entity scoping: if entityId provided, filter all tables by entity
- Add route: `GET /api/accounting/reports/data-export` → returns ZIP
**Depends on:** Task 23
**Review:** `security-sentinel`
**Success:** ZIP downloads with correct CSV files and metadata

#### Task 26: Charts (P&L Trend, Expense Breakdown, BS Composition)
**Files:**
- Update `pl-report-view.tsx`, `spending-view.tsx`, `bs-report-view.tsx`
**What:** Add secondary chart visualizations using Recharts:
- **P&L Trend** (in P&L page): `AreaChart` showing revenue vs expenses over months
  - May need a new API endpoint or parameter to get monthly breakdown
  - Alternative: compute from existing data client-side if date range < 1 year
  - Colors: `var(--ak-green)` for revenue, `var(--ak-red)` for expenses
- **Expense Breakdown** (in Spending page): `PieChart` / donut showing top categories
  - Use data already returned by spending report
  - Colors: use design system chart palette
- **Balance Sheet Composition** (in BS page): `BarChart` stacked horizontal showing assets vs liabilities
  - Use data already returned by balance sheet report
- All charts wrapped in `ResponsiveContainer`
- No hardcoded hex colors — use CSS variables
- Charts are secondary — tables remain primary display
**Depends on:** Task 14, Task 15, Task 19
**Success:** Charts render correctly alongside tables, responsive, use design tokens

#### Task 27: Settings Data Export Button + Final Polish
**Files:**
- `apps/web/src/app/(dashboard)/system/settings/page.tsx` (or equivalent)
- Various cleanup across report pages
**What:**
- Add "Download All Data" button to Settings page → calls data export endpoint
- Final polish:
  - Verify all report pages have consistent header layout (title, controls, export buttons)
  - Verify empty states on all pages
  - Verify loading skeletons match report structure
  - Verify error boundaries work correctly
  - Test navigation flow: reports home → individual report → back
  - Clean up old planning reports stub (verify deleted in Task 12)
**Depends on:** Task 25, all prior tasks
**Success:** Data export accessible from settings, all report pages polished and consistent

---

## Reference Files

- `apps/api/src/domains/accounting/services/gl-account.service.ts` — existing balance calculation (JS-based, to be replaced with raw SQL)
- `apps/api/src/domains/accounting/routes/gl-account.ts` — route pattern with `withPermission()`, `validateQuery()`
- `apps/api/src/domains/accounting/schemas/gl-account.schema.ts` — Zod schema pattern
- `apps/api/src/domains/overview/services/dashboard.service.ts` — aggregation pattern, batch FX fetching
- `apps/api/src/domains/overview/services/performance.service.ts` — transaction aggregation with entity filter
- `apps/api/src/domains/invoicing/services/pdf.service.ts` — PDFKit pattern (reference, but using @react-pdf/renderer for reports)
- `apps/web/src/lib/api/accounting.ts` — API client function pattern
- `apps/web/src/lib/api/client.ts` — base `apiClient<T>()` function
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/` — frontend page structure pattern
- `apps/web/src/lib/navigation.ts` — navigation config
- `packages/db/prisma/schema.prisma` — Entity (fiscalYearStart), FiscalCalendar, FiscalPeriod, GLAccount, JournalEntry, JournalLine models

## Edge Cases

- **No GL data:** Show empty state message, not an error
- **Unbalanced Balance Sheet:** Show warning banner with `isBalanced: false` flag
- **Retained Earnings without FiscalCalendar:** Default to calendar year (Jan 1) if no fiscal calendar exists for entity
- **Multi-entity with mixed currencies:** Use `baseCurrencyDebit/Credit` which is already in tenant's reporting currency
- **Voided/Draft entries:** Excluded (WHERE `status = 'POSTED'`)
- **Accounts with zero balance:** Include in reports (accountants expect to see all active accounts)
- **GL account codes outside defined ranges (Cash Flow):** Classify as "Other" with warning
- **Large date ranges:** SQL aggregation handles efficiently; GL Ledger uses cursor pagination for drill-down
- **Concurrent cache invalidation:** Acceptable race condition — worst case user sees 5-min stale data
- **PDF generation timeout:** Set reasonable timeout; @react-pdf/renderer is fast for table-based reports

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 3 (P&L) | `financial-data-validator`, `security-sentinel` |
| Task 4 (Balance Sheet) | `financial-data-validator` |
| Task 5 (Cash Flow) | `financial-data-validator` |
| Task 7 (Tests) | `financial-data-validator` |
| Task 12 (Navigation) | `nextjs-app-router-reviewer` |
| Task 14 (P&L Page) | `nextjs-app-router-reviewer`, `design-system-enforcer` |
| Task 15 (BS Page) | `nextjs-app-router-reviewer` |
| Task 25 (Data Export) | `security-sentinel` |

## Domain Impact

- **Primary:** Accounting (GL data is source of truth)
- **Adjacent:**
  - Banking (Cash Flow uses bank account balances via GL accounts)
  - Invoicing (Revenue by Client joins invoice → client)
  - Vendors (Spending by Category uses AP data via GL)
  - Overview (dashboard may link to reports)
- **Navigation:** Reports entry moves from Planning to Accounting domain
- **Cache invalidation touches:** PostingService, DocumentPostingService (existing files need small edits)

## Testing Strategy

**Backend (~40 tests total):**
- Report service tests: P&L, BS, CF, Trial Balance, GL Ledger, Spending, Revenue (~25)
- Cache tests: hit/miss, TTL expiry, invalidation (~5)
- Route tests: endpoint validation, auth, tenant isolation (~10)
- Financial assertions: `assertIntegerCents()` on ALL monetary fields
- Tenant isolation: verify raw SQL includes tenantId filter
- Balance validation: BS equation (A = L + E), TB (DR = CR)

**Frontend:**
- Visual verification: each page renders with correct structure
- Empty states: tested with no GL data
- Loading states: skeleton renders during fetch
- Error states: boundary catches API failures

## Progress

- [ ] Task 1: Report Zod Schemas
- [ ] Task 2: Report Service TypeScript Interfaces
- [ ] Task 3: Report Service — Profit & Loss
- [ ] Task 4: Report Service — Balance Sheet
- [ ] Task 5: Report Service — Cash Flow Statement
- [ ] Task 6: Report Routes
- [ ] Task 7: Report Service Tests — Core Statements
- [ ] Task 8: Trial Balance + GL Ledger
- [ ] Task 9: Management Reports (Spending, Revenue)
- [ ] Task 10: In-Memory Report Cache
- [ ] Task 11: Supporting Report Routes + Tests
- [ ] Task 12: Move Reports to Accounting + Navigation
- [ ] Task 13: Reports API Client
- [ ] Task 14: Profit & Loss Report Page
- [ ] Task 15: Balance Sheet Report Page
- [ ] Task 16: Cash Flow Statement Page
- [ ] Task 17: Trial Balance Report Page
- [ ] Task 18: General Ledger Report Page
- [ ] Task 19: Management Report Pages (Spending + Revenue)
- [ ] Task 20: Install @react-pdf/renderer + Shared Styles
- [ ] Task 21: P&L PDF Template
- [ ] Task 22: Balance Sheet + Cash Flow PDF Templates
- [ ] Task 23: CSV Export Service
- [ ] Task 24: Export Routes + Frontend Buttons
- [ ] Task 25: Full Data Backup Service
- [ ] Task 26: Charts (P&L Trend, Expense Breakdown, BS Composition)
- [ ] Task 27: Settings Data Export Button + Final Polish
