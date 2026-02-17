# Phase 5: Understand Your Money — Brainstorm

**Date:** 2026-02-16
**Status:** Brainstormed

---

## Problem

Users have built their financial data through Phases 1-4 (accounts, transactions, GL postings, invoices, payments). But they can't yet answer the fundamental questions:

- **"Am I profitable?"** — Need a Profit & Loss statement
- **"What's my financial position?"** — Need a Balance Sheet
- **"Where does my cash go?"** — Need a Cash Flow Statement
- **"Can I get my data out?"** — Need export/backup

**Audience:** Both the solopreneur (for decision-making) AND their accountant/auditor (for compliance). Reports must be interactive for daily use and print-ready/audit-grade for professional review.

---

## Chosen Approach: Service-Per-Report with Raw SQL

### Architecture

Single `report.service.ts` with dedicated methods per report type. Uses `prisma.$queryRaw` for SQL aggregation (10-50x faster than JS-based reduction). PDF templates via `@react-pdf/renderer` for audit-grade export. Reports home page with type selector + parameter controls.

**Why this approach:**
- Raw SQL aggregation handles the JOIN + GROUP BY pattern that Prisma ORM can't express efficiently
- Solopreneur data volumes (hundreds to low thousands of journal lines) don't need materialized views
- `@react-pdf/renderer` is lightweight (~5MB, no Chromium) and produces professional financial tables
- Fits existing Route > Schema > Service pattern
- Each report method is independently testable with known GL data

**Future optimization path:** If performance degrades at scale, add PostgreSQL materialized views as a Phase 6 concern.

### Key Features

#### Standard Financial Statements (Priority 1)

1. **Profit & Loss (Income Statement)**
   - Revenue (INCOME accounts) minus Expenses (EXPENSE accounts) for a date range
   - Account hierarchy with subtotals (parent accounts roll up children)
   - Period comparison toggle (this period vs previous period)
   - Drill-down to individual journal entries

2. **Balance Sheet**
   - Assets = Liabilities + Equity (point-in-time, inception through as-of date)
   - **Retained Earnings computed dynamically** — cumulative INCOME minus EXPENSE (no year-end close needed)
   - Balance equation validation (`isBalanced` flag — warn if unbalanced)
   - Account hierarchy with subtotals

3. **Cash Flow Statement (Indirect Method)**
   - Start with Net Income (from P&L)
   - Add back non-cash items (depreciation — account code 5900)
   - Adjust for working capital changes (compare two balance sheet dates)
   - Classify by GL account code ranges (Operating/Investing/Financing)
   - No schema changes needed — infer classification from COA template code ranges

#### Supporting Reports (Priority 2)

4. **Trial Balance** — UI for existing `GET /accounting/chart-of-accounts/balances` endpoint
5. **General Ledger Report** — All entries for a specific GL account with running balance (drill-down target)
6. **Spending by Category** — Group expense transactions by category
7. **Revenue by Client** — Group INCOME entries by source invoice → client

#### Export & Data Portability (Priority 3)

8. **Per-report export:** PDF + CSV buttons on every report
9. **Full data backup:** Settings page with "Download all data" (ZIP containing JSON/CSV per table)

#### Charts (Secondary — Tables First)

10. **P&L Trend** — Revenue vs Expenses over time (AreaChart, Recharts)
11. **Expense Breakdown** — Pie/donut chart by category
12. **Balance Sheet Composition** — Stacked bar (assets vs liabilities)

### Constraints

- **No schema migrations** — reports are read-only views of existing GL data
- **Integer cents throughout** — all amounts stay as integer cents in SQL; format only at display/PDF layer
- **Tenant isolation** — every report query includes `entity.tenantId` filter
- **Multi-entity support** — standard statements (P&L, BS, CF) support entity selection: single entity, or "All Entities" consolidated view (simple aggregation, no elimination entries)
- **Accrual basis only** — Cash vs Accrual toggle deferred to post-launch
- **Soft delete respected** — all queries filter `deletedAt IS NULL`
- **No materialized views for MVP** — raw SQL is fast enough for solopreneur scale

### Report Parameters (Shared)

All reports accept:
- `entityId` (optional) — single entity, or omit for "All Entities" consolidated view
- `startDate` / `endDate` (P&L, Cash Flow) or `asOfDate` (Balance Sheet)
- `comparisonPeriod` (optional) — previous period for side-by-side comparison
- `fiscalYearId` (optional) — filter by fiscal year (uses `FiscalCalendar` model)
- `format` (optional) — `json` (default), `csv`, `pdf`

### Caching Strategy

**In-memory cache with TTL** for better UX on repeat views:
- Cache key: `report:{type}:{entityId}:{startDate}:{endDate}:{tenantId}`
- TTL: 5 minutes (financial data is append-mostly)
- Invalidation: flush cache keys when PostingService creates/voids entries
- Implementation: Simple `Map<string, { data, expiry }>` — no Redis needed for MVP
- Cache-Control header: `X-Cache: HIT|MISS` for debugging

### Fiscal Year Integration

**Already modeled in schema** — no migrations needed:
- `Entity.fiscalYearStart` (month 1-12) — defines when fiscal year begins
- `FiscalCalendar` model — manages multi-year calendars per entity
- `FiscalPeriod` model — individual periods (OPEN/LOCKED/CLOSED status)
- Reports respect fiscal year boundaries for retained earnings cutoff
- P&L defaults to current fiscal year period (not calendar year)
- Balance Sheet retained earnings: cumulative from fiscal year start (not inception)

### Multi-Entity Consolidation (Basic)

For the 3 standard statements (P&L, BS, CF):
- **Single entity mode:** Filter by `entityId` — standard behavior
- **All Entities mode:** Omit `entityId` — aggregate across all tenant entities
- Consolidated view converts all amounts to tenant's reporting currency using `baseCurrencyDebit/Credit`
- **No elimination entries** — simple aggregation (intercompany elimination deferred to post-launch)
- **No CTA (Cumulative Translation Adjustment)** — deferred
- UI: Entity selector dropdown with "All Entities" option at top

### Edge Cases

- **No GL data yet** — Show empty state with message: "Post transactions to see your financial statements"
- **Unbalanced Balance Sheet** — Show warning banner: "Balance sheet doesn't balance — check journal entries"
- **Retained Earnings** — Compute dynamically from INCOME/EXPENSE since fiscal year start (uses `FiscalCalendar`). Prior years' earnings rolled into opening balance.
- **Accounts with zero balance** — Include in report (accountants expect to see all active accounts)
- **Multi-currency entries** — Use `baseCurrencyDebit/Credit` (already converted at posting time)
- **Voided entries** — Excluded (status !== 'POSTED')
- **Draft journal entries** — Excluded from all reports
- **Large date ranges** — SQL aggregation handles this; no pagination needed for report totals (drill-down may need cursor pagination)

---

## Technical Decisions

### PDF Library: @react-pdf/renderer

- Reports use `@react-pdf/renderer` for PDF generation (declarative React components for complex tables)
- Invoice PDFs stay on PDFKit (already working, no reason to rewrite)
- Two PDF libraries coexist — different use cases, minimal overhead
- API needs JSX support in `tsconfig.json` for `.tsx` template files

### Cash Flow: Indirect Method with Code-Range Classification

| Code Range | Cash Flow Section |
|---|---|
| 1000-1199 (Cash, Bank) | Cash itself (not classified) |
| 1200-1499 (AR, Inventory, Prepaid) | Operating (working capital) |
| 2000-2499 (AP, Accrued, Tax) | Operating (working capital) |
| 2500+ (Loans) | Financing |
| 3000-3200 (Equity, Draws) | Financing |
| 4000-4999 (Revenue) | Operating (net income) |
| 5000-5899 (Expenses excl depreciation) | Operating (net income) |
| 5900 (Depreciation) | Operating (non-cash adjustment) |

Future: Add `cashFlowClassification` field to GLAccount for user overrides.

### Charts: Recharts with Design Tokens

- Recharts already in dependency tree via shadcn/ui Chart components
- Use CSS variables for colors: `var(--color-ak-green)` for income, `var(--color-ak-red)` for expenses
- Never hardcode hex values in charts

### Data Export: ZIP Package

Full backup downloads a ZIP containing:
- `entities.csv`, `accounts.csv`, `transactions.csv`, `journal-entries.csv`, `journal-lines.csv`
- `invoices.csv`, `bills.csv`, `payments.csv`, `clients.csv`, `vendors.csv`
- `metadata.json` (export date, entity info, schema version)
- Scoped by entity + tenant isolation

---

## Navigation & URL Changes

- **Move reports from Planning to Accounting:** `/planning/reports/` → `/accounting/reports/`
- **Update sidebar navigation:** Reports entry moves from `planning` group to `accounting` group
- **Delete stub:** Remove `apps/web/src/app/(dashboard)/planning/reports/` (page/loading/error)
- **Existing infrastructure:** Reports stub page + loading/error already exist at planning path — recreate under accounting

## File Structure (Planned)

```
apps/api/src/domains/accounting/
  services/
    report.service.ts              # P&L, Balance Sheet, Cash Flow, Trial Balance
    report-export.service.ts       # CSV + ZIP data export
  templates/
    profit-loss-pdf.tsx            # P&L PDF template
    balance-sheet-pdf.tsx          # Balance Sheet PDF template
    cash-flow-pdf.tsx              # Cash Flow PDF template
    shared-styles.ts               # Shared PDF styling constants
  routes/
    report.ts                      # Report endpoints (GET /reports/*)
  schemas/
    report.schema.ts               # Zod schemas for report params

apps/web/src/app/(dashboard)/accounting/reports/
  page.tsx                         # Server component — reports home
  loading.tsx                      # Skeleton
  error.tsx                        # Error boundary
  profit-loss/
    page.tsx                       # P&L server component
    pl-report-view.tsx             # P&L client component (table + chart)
  balance-sheet/
    page.tsx
    bs-report-view.tsx
  cash-flow/
    page.tsx
    cf-report-view.tsx
  trial-balance/
    page.tsx
    tb-report-view.tsx
  general-ledger/
    page.tsx
    gl-report-view.tsx
  spending/
    page.tsx
    spending-view.tsx
  revenue/
    page.tsx
    revenue-view.tsx

apps/web/src/lib/api/reports.ts    # API client functions
```

---

## Deferred (Not in Phase 5)

| Feature | When |
|---------|------|
| Multi-entity consolidation — elimination entries, CTA, intercompany | Post-launch |
| Custom report builder (drag-and-drop) | Post-launch |
| AI annotations / insights on reports | Post-launch |
| Notes/commentary per line item | Post-launch |
| Scheduled reports (monthly email) | Post-launch |
| Cash vs Accrual toggle | Post-launch |
| GAAP/IFRS compliance indicators | Post-launch |
| Presentation modes (Interactive/Print/Executive) | Post-launch |
| Data lineage / "Explain this number" | Post-launch |
| XLSX export format | Post-launch |
| Report sharing (accountant view links) | Post-launch |

---

## Domain Impact

- **Primary:** Accounting (GL data is source of truth for all reports)
- **Adjacent:**
  - Banking (Cash Flow uses bank account balances)
  - Invoicing (Revenue by Client needs invoice → client mapping)
  - Vendors (Spending by Category needs AP data)
  - Overview (dashboard may surface P&L summary or link to reports)
- **No schema changes** — all reports are read-only views of existing data

## Review Concerns (from Systems Impact Check)

| Agent | Concern |
|-------|---------|
| `financial-data-validator` | Retained earnings computation, BS equation (A = L + E), integer cents in SQL |
| `security-sentinel` | Tenant isolation in raw SQL queries, no cross-entity leakage |
| `performance-oracle` | SQL query performance with JOINs, drill-down pagination |
| `kieran-typescript-reviewer` | Raw SQL return types (avoid `any`), proper typing for report interfaces |
| `nextjs-app-router-reviewer` | Server/Client component boundaries for report pages |

---

## Estimated Scope

| Sprint | Focus | Effort |
|--------|-------|--------|
| 1 | Report service (P&L + Balance Sheet + Cash Flow + multi-entity) + Zod schemas + routes | ~12h |
| 2 | Trial Balance + GL Ledger + Management reports (spending, revenue) + caching | ~6h |
| 3 | Frontend — Reports home + P&L page + Balance Sheet page (move from planning) | ~8h |
| 4 | Frontend — Cash Flow + Trial Balance + GL Ledger + management pages | ~8h |
| 5 | PDF export (3 statement templates + @react-pdf/renderer) + CSV export | ~8h |
| 6 | Full data backup (ZIP) + charts + polish + navigation update | ~6h |
| **Total** | | **~48h** |

---

## Resolved Questions

- [x] **Reports URL:** `/accounting/reports/` — moved from `/planning/reports/` to align with financial statements being an accounting concern
- [x] **Caching:** In-memory Map with 5-minute TTL, invalidated on posting operations
- [x] **Fiscal Year:** Yes — use existing `FiscalCalendar`/`FiscalPeriod` models. Retained earnings computed per fiscal year, not from inception.
- [x] **Multi-entity:** Basic consolidation (simple aggregation) for the 3 standard statements. No elimination entries.

---

## Next Steps

- [ ] Create implementation plan: `/processes:plan phase 5`
