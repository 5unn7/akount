# Banking Command Center — Implementation Plan

**Created:** 2026-02-20
**Status:** Draft
**Mockup:** [banking-redesign-concepts.html](../../docs/design-system/03-screens/banking-redesign-concepts.html)
**Related:** [Command Center Dashboard Plan](./2026-02-20-command-center-dashboard.md) (shares design language but no blocking dependencies — this plan uses `StatsGrid` and `MiniSparkline` which already exist standalone)

---

## Overview

Transform the Banking > Accounts list, Account Detail (`/banking/accounts/[id]`), and Transactions pages from basic list views into intelligence-driven command center layouts. The Accounts page gets a gradient hero, account cards in a grid, and banking health insight. The Account Detail page gets a type-colored gradient hero with running balance sparkline, account insight card, balance history chart, per-account spending breakdown, and enhanced transaction table with running balance column. The Transactions page becomes a "Transaction Intelligence" hub with spending breakdown by category, AI categorization queue, daily cash flow timeline, recurring detection, anomaly highlights, and an enhanced table with inline actions.

## Success Criteria

- [ ] Accounts page matches mockup: hero + action pills + insight panel + stats + account cards grid
- [ ] Account Detail page matches mockup: type-colored hero + sparkline + insight + stats + balance chart + spending + table with running balance
- [ ] Transactions page matches mockup: 6 stats with sparklines + spending breakdown + AI queue + timeline + enhanced table
- [ ] All existing functionality preserved (filters, bulk actions, categorization, GL posting)
- [ ] No new backend needed for Sprint 1/1.5 (use existing APIs only)
- [ ] Mobile responsive (1-col mobile, 2-col tablet, 4-col desktop)
- [ ] Design system compliant (semantic tokens, glass, correct fonts)

---

## Sprint 1: Accounts Page Redesign (6 tasks)

### Task 1: Create BankingBalanceHero component
**File:** `apps/web/src/components/banking/BankingBalanceHero.tsx` (NEW)
**What:** Replace `AccountsBalanceHero` + `AccountsPageHeader` with a unified gradient hero card. Features:
- Blue-teal gradient background (`bg-gradient-to-br from-ak-blue/[0.08] to-ak-teal/[0.05]`, `border-ak-blue/15`)
- Page title "Banking" (Newsreader) + subtitle ("5 accounts across 2 currencies")
- Total balance (40px mono, green) with monthly change indicator (+$4,200 this month)
- Sub-items row: Checking, Savings, Credit Cards, Investments — each with balance grouped by account type
- Action pills integrated into hero header (Import Statement, Reconcile, Transfer, Add Account)
- Connect Account button opens existing `AccountFormSheet`
**Props:** `accounts: Account[]`, `entities: Entity[]`, `currencies: string[]`
**Reuse:** `groupAccountsByCurrency()` from `account-helpers.ts`, `formatCurrency()` from `currency.ts`
**Depends on:** none
**Success:** Hero renders with gradient, total balance, type breakdown, and action pills.

### Task 2: Create BankingInsightPanel component
**File:** `apps/web/src/components/banking/BankingInsightPanel.tsx` (NEW)
**What:** Right-side panel that fills the grid column. Two sections:
1. **Banking Insight** — Glass card with blue accent line (2px gradient), pulsing dot, activity icon, Newsreader italic body text about account health. Content is server-generated from account data (e.g., "Your checking account has grown 8% this month. Credit card utilization at 2.6% — excellent for credit score.")
2. **Needs Attention** — List of items: Unreconciled count, Uncategorized count, Last import date. Each as a row with label + value. Values link to relevant pages.
**Props:** `stats: { unreconciledCount: number; uncategorizedCount: number; lastImportDate?: string }`, `accounts: Account[]`
**Depends on:** none
**Success:** Panel shows insight card + attention items. Insight text is dynamic based on account data.

### Task 3: Create AccountCardGrid component
**File:** `apps/web/src/components/banking/AccountCardGrid.tsx` (NEW)
**What:** 4-column grid of account cards (replaces `AccountsListClient` + `AccountRow` list layout). Each card:
- Type badge (colored per `accountTypeColors`: BANK=`text-ak-blue`, CREDIT_CARD=`text-primary`, INVESTMENT=`text-ak-green`, LOAN=`text-ak-red`, MORTGAGE=`text-ak-purple`, OTHER=`text-muted-foreground`)
- Account name + institution + last 4 digits
- Balance (20px mono, colored by type)
- Footer: transaction count this month + mini sparkline placeholder
- Type filter tabs above grid (All, Bank, Credit Card, Investment, Loan, Mortgage) — labels from `accountTypeLabels` map
- Click navigates to account detail (`/banking/accounts/[id]`)
**Props:** `accounts: Account[]`
**Reuse:** `accountTypeColors` from `account-helpers.ts`, existing `AccountCard.tsx` as design reference (actively used on accounts list — will be replaced by this component)
**Depends on:** none
**Success:** Grid renders 4 account cards with type badges, filter tabs work.

### Task 4: Create BankingStatsRow component
**File:** `apps/web/src/components/banking/BankingStatsRow.tsx` (NEW)
**What:** 4-stat row: Income MTD, Expenses MTD, Net Cash Flow, Accounts count. Each stat card uses the `StatsGrid` pattern (glass, 10px label, mono value, trend indicator). Reuse existing `StatsGrid` component — just compute new stats.
**Props:** `stats: StatItem[]`
**Depends on:** none (reuses existing `StatsGrid`)
**Success:** 4 stat cards render with correct values and trends.

### Task 5: Rewrite Accounts page.tsx with grid layout
**File:** `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` (REWRITE)
**What:** Replace current flat layout with CSS grid matching mockup:
```
Grid Row 1: [BankingBalanceHero (3 cols)] [BankingInsightPanel (1 col)]
Grid Row 2: [BankingStatsRow (full width, 4 cards)]
Grid Row 3: [AccountCardGrid (full width)]
Grid Row 4: [RecentTransactions (3 cols)] [CashFlowMini (1 col)]
```
- Fetch accounts, entities, compute stats, compute transaction stats for insight panel
- Keep `Promise.all` pattern for parallel data fetching
- Remove `AccountsPageHeader`, `AccountsBalanceHero`, `AccountsListClient`, `StatsGrid` imports
- Add `BankingBalanceHero`, `BankingInsightPanel`, `AccountCardGrid`, `BankingStatsRow`
- Recent transactions reuse existing `RecentTransactions` component (fetch last 5 txns)
- Cash flow mini: simple bar chart component (glass card with monthly bars)
**Depends on:** Tasks 1-4
**Review:** `nextjs-app-router-reviewer`
**Success:** Accounts page renders as 4-col grid matching mockup.

### Task 6: Update Accounts loading.tsx skeleton
**File:** `apps/web/src/app/(dashboard)/banking/accounts/loading.tsx` (MODIFY)
**What:** Update skeleton to match new grid layout (hero+panel row, stats row, cards grid row, transactions+chart row).
**Depends on:** Task 5
**Success:** Loading state shows grid-shaped skeletons matching content areas.

---

## Sprint 1.5: Account Detail Page Redesign (7 tasks)

### Task 7: Create AccountDetailHero component
**File:** `apps/web/src/components/banking/AccountDetailHero.tsx` (NEW)
**What:** Replace `AccountDetailHeader` with a full-width gradient hero card, color-coded by account type. Features:
- Breadcrumb navigation: Banking / Accounts / [Account Name] (clickable links)
- Type-colored gradient background using actual `AccountType` enum: BANK=`from-ak-blue/[0.08] to-ak-teal/[0.05]`, CREDIT_CARD=`from-primary/[0.08] to-ak-red/[0.05]`, INVESTMENT=`from-ak-green/[0.08] to-ak-teal/[0.05]`, LOAN=`from-ak-red/[0.08] to-ak-purple/[0.05]`, MORTGAGE=`from-ak-purple/[0.08] to-ak-blue/[0.05]`, OTHER=`from-muted/[0.08] to-muted/[0.05]`
- Account type icon (48px circle, type-colored) + account name (Newsreader heading) + institution name (muted)
- Status pill (Active/Inactive) + type badge (Checking/Savings/etc) + currency badge
- Action pills: Import, Reconcile, Manage (open existing `AccountFormSheet`)
- Balance display: large mono value (40px) + 30-day running balance trend sparkline (MiniSparkline, 80x30px)
- Monthly change indicator below balance (+$4,200 this month / -$1,300 this month)
**Props:** `account: Account`, `monthlyChange: number`, `runningBalanceData: number[]`
**Reuse:** `accountTypeIcons`, `accountTypeColors` from `account-helpers.ts`, `MiniSparkline.tsx`, `formatCurrency()`
**Depends on:** none
**Success:** Hero renders with type-colored gradient, breadcrumbs, balance with sparkline, action pills.

### Task 8: Create AccountInsightCard component
**File:** `apps/web/src/components/banking/AccountInsightCard.tsx` (NEW)
**What:** Small glass card with green accent line (2px gradient), pulsing dot, Newsreader italic body text. Content generated from account data:
- For Checking: growth rate insight ("Your checking has grown 8% this month...")
- For Credit: utilization insight ("Credit utilization at 2.6% — excellent for credit score")
- For Savings: savings rate insight
- For Investment: performance insight
**Props:** `account: Account`, `stats: AccountTransactionStats`
**Depends on:** none
**Success:** Insight card shows dynamic text based on account type and data.

### Task 9: Create AccountDetailsPanel component
**File:** `apps/web/src/components/banking/AccountDetailsPanel.tsx` (NEW)
**What:** Glass card showing account metadata in a structured layout:
- Institution name
- Account number (masked: ****1234)
- Entity name
- Last import date
- Total transactions count
- Account type + currency
Each as label (muted, 10px uppercase) + value (mono) row.
**Props:** `account: Account`, `transactionCount: number`, `lastImportDate?: string`
**Depends on:** none
**Success:** Details panel renders all account metadata in clean label/value pairs.

### Task 10: Create AccountStatsRow component
**File:** `apps/web/src/components/banking/AccountStatsRow.tsx` (NEW)
**What:** 5-stat row scoped to this account: Income MTD, Expenses MTD, Unreconciled, Avg Daily Flow, Transactions. Each stat card with MiniSparkline (for Income/Expenses) or count value. Uses existing `StatsGrid` pattern — compute stats from account transactions.
- Income MTD: sum of positive amounts this month + sparkline (daily income)
- Expenses MTD: sum of negative amounts this month + sparkline (daily expenses)
- Unreconciled: count of transactions without reconciliation
- Avg Daily Flow: average net daily amount over last 30 days
- Transactions: total count this month
**Props:** `stats: AccountTransactionStats`, `currency: string`, `dailyFlows?: number[]`
**Reuse:** `StatsGrid.tsx` (columns=5)
**Depends on:** none
**Success:** 5 stat cards render with accurate values from account-scoped data.

### Task 11: Create BalanceHistoryChart component
**File:** `apps/web/src/components/banking/BalanceHistoryChart.tsx` (NEW)
**What:** Full-width SVG area chart showing account balance over time. Features:
- 6-month default view with period toggles (1M, 3M, 6M, 1Y)
- SVG area chart with gradient fill (green→transparent for positive trend, red→transparent for negative)
- Gridlines (horizontal: dollar amounts, vertical: month labels)
- Hover shows tooltip with exact balance + date
- Low/high annotations on chart (optional)
- Client-side: compute running balance from transactions sorted by date
**Props:** `transactions: Transaction[]`, `currentBalance: number`, `currency: string`
**Depends on:** none
**Success:** Area chart renders balance over time with period toggles and hover tooltips.

### Task 12: Rewrite Account Detail page.tsx with grid layout
**File:** `apps/web/src/app/(dashboard)/banking/accounts/[id]/page.tsx` (REWRITE)
**What:** Replace current flat layout with CSS grid matching mockup:
```
Grid Row 1: [AccountDetailHero (3 cols)] [AccountInsightCard + AccountDetailsPanel (1 col)]
Grid Row 2: [AccountStatsRow (full width, 5 cards)]
Grid Row 3: [BalanceHistoryChart (2 cols)] [AccountSpendingMini — client-side category groupBy (2 cols)]
Grid Row 4: [TransactionsList with running balance (full width)]
```
- Fetch: account, account transactions (for stats, chart, spending), compute running balance data
- Keep `Promise.all` pattern for parallel data fetching
- Remove `AccountDetailHeader`, `AccountStatsPills` imports
- Add `AccountDetailHero`, `AccountInsightCard`, `AccountDetailsPanel`, `AccountStatsRow`, `BalanceHistoryChart`
- **Spending breakdown (CRIT-4 fix):** Do NOT depend on Sprint 2's `SpendingBreakdown` component (circular dependency). Instead, create a lightweight `AccountSpendingMini` inline component that groups already-fetched transactions by `categoryId` client-side. Sprint 2's full `SpendingBreakdown` can replace this later as a backport.
- Transaction table: pass `showRunningBalance: true` prop to `TransactionsTableClient` (not the server-side `TransactionsList` wrapper — see ADV-7)
- **Suspense decision (CRIT-5):** Keep Suspense boundary for transaction list — this is correct for [id] page (enables hero/stats to render immediately while table streams in). Other banking pages use `loading.tsx` instead, but Suspense here provides finer-grained streaming.
**Depends on:** Tasks 7-11
**Review:** `nextjs-app-router-reviewer`
**Success:** Account detail page renders as 4-col grid matching mockup. All existing features work.

### Task 13: Update Account Detail loading.tsx skeleton
**File:** `apps/web/src/app/(dashboard)/banking/accounts/[id]/loading.tsx` (MODIFY)
**What:** Update skeleton to match new grid layout (hero+sidebar row, stats row, chart+spending row, table row).
**Depends on:** Task 12
**Success:** Loading state shows grid-shaped skeletons matching content areas.

---

## Sprint 2: Transactions Command Center (10 tasks)

### Task 14: Create new backend endpoint — Spending by Category
**File:** `apps/api/src/domains/banking/services/transaction.service.ts` (MODIFY) + `apps/api/src/domains/banking/routes/transactions.ts` (MODIFY)
**What:** Add `getSpendingByCategory(ctx, params)` service function + `GET /api/banking/transactions/spending-by-category` route. Uses Prisma `groupBy` on `categoryId` with `_sum: { amount }` and `_count: { id }`. Filters: tenantId (required), entityId (optional), accountId (optional), startDate/endDate (optional). Returns: `{ categories: Array<{ categoryId, categoryName, categoryColor, totalAmount, transactionCount, percentOfTotal }> }`. Ordered by absolute amount descending. Caps at top 10 categories + "Other" aggregate.
**Note (CRIT-1):** An existing endpoint `GET /api/accounting/reports/spending` groups by **GL Account** (chart of accounts) — different taxonomy. This new endpoint groups by **Transaction Category** (user-facing labels with `color` field on Category model). Both are needed: GL Account grouping for accounting reports, Transaction Category grouping for banking UI.
**Caching:** Use `reportCache` pattern (bounded 500 items, 5 min TTL) — same as existing report endpoints in `report.service.ts`.
**Rate Limiting:** Apply `statsRateLimitConfig()` (50 req/min) — consistent with other aggregation endpoints.
**Risk:** high (financial data aggregation)
**Review:** `financial-data-validator`, `security-sentinel`
**Depends on:** none
**Success:** Endpoint returns accurate category spending breakdown. Integer cents. Tenant-isolated. Cached with reportCache. Rate-limited.

### Task 15: Create frontend API client for spending breakdown
**File:** `apps/web/src/lib/api/transactions.ts` (MODIFY)
**What:** Add `getSpendingByCategory(params)` function + `SpendingByCategory` type. Calls new endpoint from Task 14.
**Depends on:** Task 14
**Success:** Frontend can fetch spending breakdown data.

### Task 16: Create SpendingBreakdown component
**File:** `apps/web/src/components/banking/SpendingBreakdown.tsx` (NEW)
**What:** Horizontal bar chart showing top expense categories. Each row: category name (110px), gradient bar (width proportional to max), amount (mono). Bars use distinct colors per category (rotate through red, purple, blue, teal, primary, muted). Period toggle: "This Month" / "Last 90d". Total footer with "View all categories" link. Supports optional `accountId` prop for per-account scoping (used by Account Detail page).
**Props:** `data: SpendingByCategory[]`, `totalExpenses: number`, `currency: string`, `accountId?: string`
**Depends on:** Task 15
**Success:** Bar chart renders with proportional bars, color-coded, responsive. Works both globally and per-account.

### Task 17: Create AICategoryQueue component
**File:** `apps/web/src/components/banking/AICategoryQueue.tsx` (NEW)
**What:** Shows uncategorized transactions with AI-suggested categories. Each item:
- Transaction description + date + amount
- AI suggestion pill (category name + checkmark) — clicking accepts the suggestion (calls `bulkCategorizeTransactions`)
- Reject button (X) — removes from queue (client-side dismiss)
- "Auto-Categorize N" button at top calls existing backend `POST /api/ai/categorize` for all uncategorized
- Shows max 3 items + "+N more uncategorized" link
**Props:** `uncategorizedTransactions: Transaction[]`, `onCategorized: () => void`
**Depends on:** none (uses existing AI categorization API)
**Success:** Queue shows suggestions, Accept/Reject work, bulk categorize triggers backend.

### Task 18: Create TopMerchants component
**File:** `apps/web/src/components/banking/TopMerchants.tsx` (NEW)
**What:** Small glass card showing top 4 merchants by spend. Client-side computation: group transactions by description (normalize: trim, lowercase, strip suffixes like "- Monthly", "#123"), sum amounts per merchant, sort descending by absolute amount, take top 4. Each row: merchant name + total amount (mono, red).
**Props:** `transactions: Transaction[]`, `currency: string`
**Depends on:** none
**Success:** Top merchants render accurately from transaction data.

### Task 19: Create RecurringDetected component
**File:** `apps/web/src/components/banking/RecurringDetected.tsx` (NEW)
**What:** Small glass card showing detected recurring transactions. Client-side detection: find transactions with same description appearing 2+ times in last 90 days at regular intervals. Each row: merchant name + frequency label (monthly/annual) + approximate amount. Uses simple heuristic: same normalized description + similar amount (within 10%) + consistent interval.
**Props:** `transactions: Transaction[]`, `currency: string`
**Depends on:** none
**Success:** Recurring items detected and displayed with frequency labels.

### Task 20: Create DailyCashFlowTimeline component
**File:** `apps/web/src/components/banking/DailyCashFlowTimeline.tsx` (NEW)
**What:** Full-width daily bar chart for the current month. Each day: green bar (income) above baseline + red bar (expense) below baseline. Day labels along bottom. Today's bar highlighted with brighter opacity + border. Legend: Income (green) / Expenses (red). Client-side computation: bucket transactions by date, sum positive (income) and negative (expense) per day.
**Props:** `transactions: Transaction[]`, `month: Date`
**Depends on:** none
**Success:** 28-31 day bars render showing income vs expense per day.

### Task 21: Enhance TransactionsTable with new columns + inline features
**File:** `apps/web/src/components/transactions/TransactionsTable.tsx` (MODIFY) + `TransactionsTableClient.tsx` (MODIFY to thread prop)
**What:** Add the following to the existing table:
- **Running balance column:** Optional column (enabled via `showRunningBalance` prop on `TransactionsTable` / `TransactionsTableClient`) showing cumulative balance per row. Used on Account Detail page. **Note (ADV-7):** This prop goes on the client-side `TransactionsTableClient`/`TransactionsTable` components, NOT on the server-side `TransactionsList` wrapper. The server page passes it through to the client component.
- **Uncategorized row highlighting:** Amber left border + amber background tint on rows where `categoryId` is null. Show AI suggestion inline if available (Accept/Edit buttons).
- **Anomaly detection row highlighting:** Red left border + red background tint on transactions where amount > 3x the average for that merchant. Warning icon + "Unusual — Nx your avg [merchant] spend" text.
- **Recurring icon:** Small teal rotating arrow icon next to description for detected recurring transactions.
- **Enhanced meta line:** Show account name + source type in the description's meta line.
These are additive — no existing columns removed.
**Props additions:** `showRunningBalance?: boolean`, `recurringIds?: Set<string>`, `anomalyIds?: Set<string>`, `aiSuggestions?: Map<string, { categoryName: string; confidence: number }>`
**Depends on:** none
**Success:** Table shows inline highlights for uncategorized, anomalous, and recurring rows. Running balance column works when enabled.

### Task 22: Create TransactionsStatsRow component
**File:** `apps/web/src/components/banking/TransactionsStatsRow.tsx` (NEW)
**What:** 6-stat row: Revenue, Expenses, Net Flow, Transactions (count), Categorized %, GL Posted %. Each stat has inline MiniSparkline (Revenue/Expenses/Net Flow/Transactions) or progress bar (Categorized %/GL Posted %). Uses existing `MiniSparkline` component for sparklines. Compute stats from transaction data + performance API.
**Props:** `metrics: PerformanceMetrics`, `transactions: Transaction[]`, `currency: string`
**Depends on:** none
**Success:** 6 compact stats render with sparklines and progress bars.

### Task 23: Rewrite Transactions page.tsx with Command Center layout
**File:** `apps/web/src/app/(dashboard)/banking/transactions/page.tsx` (REWRITE)
**What:** Replace current flat layout with CSS grid matching mockup:
```
Grid Row 1: [Header + Actions (full width)] — "Transaction Intelligence" title + AI Auto-Categorize CTA + New Transaction + Import + Deduplicate pills
Grid Row 2: [TransactionsStatsRow (full width, 6 cards)]
Grid Row 3: [SpendingBreakdown (2 cols)] [Intelligence Panel: AICategoryQueue + TopMerchants + RecurringDetected (2 cols)]
Grid Row 4: [DailyCashFlowTimeline (full width)]
Grid Row 5: [Filters + Smart Search (full width)]
Grid Row 6: [Enhanced TransactionsTable (full width)]
```
- Fetch: transactions (all for current month), accounts, categories, performance metrics, spending breakdown
- Pass computed data (recurring IDs, anomaly IDs, AI suggestions) to table enhancements
- Keep Suspense boundaries for heavy data sections
- Preserve all existing bulk action functionality
**Depends on:** Tasks 14-22
**Review:** `nextjs-app-router-reviewer`
**Success:** Transactions page renders as command center matching mockup. All existing features work.

---

## Sprint 3: Polish + Mobile (6 tasks)

### Task 24: Mobile responsive layout for Accounts
**File:** `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` + components (MODIFY)
**What:** Fine-tune responsive breakpoints:
- Mobile: Hero compact (32px balance, abbreviated sub-items like "$52.4k"), horizontal scroll action pills, 2-col stat grid, stacked account cards
- Tablet: 2-col grid (hero full width, stats 2x2, accounts 2-col)
- Desktop: 4-col grid as designed
**Depends on:** Sprint 1 complete
**Success:** Accounts page looks correct at 375px, 768px, and 1440px.

### Task 25: Mobile responsive layout for Account Detail
**File:** `apps/web/src/app/(dashboard)/banking/accounts/[id]/page.tsx` + components (MODIFY)
**What:** Fine-tune responsive breakpoints:
- Mobile: Hero compact (32px balance, sparkline hidden, pills horizontal scroll), stats 2-col, chart full width, spending full width below, table horizontal scroll with sticky description column
- Tablet: 2-col grid (hero full width, insight+details stacked, stats 3-col, chart+spending side-by-side)
- Desktop: 4-col grid as designed
**Depends on:** Sprint 1.5 complete
**Success:** Account detail page looks correct at 375px, 768px, and 1440px.

### Task 26: Mobile responsive layout for Transactions
**File:** `apps/web/src/app/(dashboard)/banking/transactions/page.tsx` + components (MODIFY)
**What:** Fine-tune responsive breakpoints:
- Mobile: Stats 2-col, spending breakdown full width, intelligence panel stacked, timeline condensed (fewer day labels), table horizontal scroll with sticky first column
- Tablet: Stats 3-col, spending + intelligence 1-col each stacked, timeline full width
**Depends on:** Sprint 2 complete
**Success:** Transactions page looks correct at 375px, 768px, and 1440px.

### Task 27: Update Transactions loading.tsx skeleton
**File:** `apps/web/src/app/(dashboard)/banking/transactions/loading.tsx` (MODIFY)
**What:** Update skeleton to match new grid layout (header, 6 stats, spending+intelligence row, timeline, filters, table).
**Depends on:** Task 23
**Success:** Loading state shows correct skeleton shapes.

### Task 28: Cleanup deprecated components
**File:** Multiple files
**What:** After verifying the new pages work:
- Delete `AccountsPageHeader.tsx` (replaced by BankingBalanceHero)
- Delete `AccountsBalanceHero.tsx` (merged into BankingBalanceHero)
- Delete `AccountsListClient.tsx` (replaced by AccountCardGrid)
- Delete `AccountRow.tsx` (replaced by AccountCardGrid)
- Delete `AccountDetailHeader.tsx` (replaced by AccountDetailHero)
- Delete `AccountStatsPills.tsx` (replaced by AccountStatsRow)
- Delete `AccountCard.tsx` (actively used on accounts list, but fully replaced by `AccountCardGrid`)
- Keep `AccountFormSheet.tsx` (still used for create/edit)
- Keep `TransactionsListClient.tsx` (still used, possibly refactored)
- Keep all transaction components (enhanced, not replaced)
**Depends on:** Sprints 1, 1.5, and 2 verified
**Success:** No dead component imports. All banking pages functional.

---

## Component Inventory

| Component | Action | Sprint | Notes |
|-----------|--------|--------|-------|
| `BankingBalanceHero.tsx` | **NEW** | S1 | Gradient hero with balance + action pills |
| `BankingInsightPanel.tsx` | **NEW** | S1 | AI insight + needs attention |
| `AccountCardGrid.tsx` | **NEW** | S1 | 4-col account cards with type filters |
| `BankingStatsRow.tsx` | **NEW** | S1 | 4 stat cards (reuses StatsGrid) |
| `AccountDetailHero.tsx` | **NEW** | S1.5 | Type-colored hero with sparkline + action pills |
| `AccountInsightCard.tsx` | **NEW** | S1.5 | Dynamic insight based on account type |
| `AccountDetailsPanel.tsx` | **NEW** | S1.5 | Account metadata label/value pairs |
| `AccountStatsRow.tsx` | **NEW** | S1.5 | 5 account-scoped stat cards |
| `BalanceHistoryChart.tsx` | **NEW** | S1.5 | SVG area chart with period toggles |
| `SpendingBreakdown.tsx` | **NEW** | S2 | Horizontal bar chart by category (supports accountId) |
| `AICategoryQueue.tsx` | **NEW** | S2 | AI suggestion queue with accept/reject |
| `TopMerchants.tsx` | **NEW** | S2 | Top 4 merchants by spend |
| `RecurringDetected.tsx` | **NEW** | S2 | Recurring transaction detection |
| `DailyCashFlowTimeline.tsx` | **NEW** | S2 | Daily income vs expense bars |
| `TransactionsStatsRow.tsx` | **NEW** | S2 | 6 stat cards with sparklines |
| `TransactionsTable.tsx` | **MODIFY** | S2 | Add running balance, AI suggestions, anomaly, recurring |
| `transaction.service.ts` | **MODIFY** | S2 | Add getSpendingByCategory |
| `transactions route` | **MODIFY** | S2 | Add spending-by-category endpoint |
| `transactions.ts` (API client) | **MODIFY** | S2 | Add getSpendingByCategory |
| `accounts/page.tsx` | **REWRITE** | S1 | CSS grid layout |
| `accounts/[id]/page.tsx` | **REWRITE** | S1.5 | Command center grid with chart + spending |
| `transactions/page.tsx` | **REWRITE** | S2 | Command center grid |
| `accounts/loading.tsx` | **MODIFY** | S1 | Grid skeleton |
| `accounts/[id]/loading.tsx` | **MODIFY** | S1.5 | Grid skeleton |
| `transactions/loading.tsx` | **MODIFY** | S3 | Grid skeleton |
| `AccountsPageHeader.tsx` | **DELETE** | S3 | Merged into BankingBalanceHero |
| `AccountsBalanceHero.tsx` | **DELETE** | S3 | Merged into BankingBalanceHero |
| `AccountsListClient.tsx` | **DELETE** | S3 | Replaced by AccountCardGrid |
| `AccountRow.tsx` | **DELETE** | S3 | Replaced by AccountCardGrid |
| `AccountDetailHeader.tsx` | **DELETE** | S3 | Replaced by AccountDetailHero |
| `AccountStatsPills.tsx` | **DELETE** | S3 | Replaced by AccountStatsRow |

---

## New Backend Endpoint

### `GET /api/banking/transactions/spending-by-category`

**Note:** An existing `GET /api/accounting/reports/spending` endpoint groups by **GL Account** (chart of accounts). This new endpoint groups by **Transaction Category** (user-facing labels with `color` field). Different taxonomies for different audiences: GL grouping for accounting, Category grouping for banking UI.

**Query params:** `entityId?`, `accountId?`, `startDate?`, `endDate?`, `limit?` (default 10)

**Response:**
```json
{
  "categories": [
    {
      "categoryId": "clxyz...",
      "categoryName": "Cloud & Hosting",
      "categoryColor": null,
      "totalAmount": 384000,
      "transactionCount": 12,
      "percentOfTotal": 35.4
    }
  ],
  "totalExpenses": 1085000,
  "currency": "CAD"
}
```

**Implementation:** Prisma `groupBy` on `Transaction.categoryId` where `amount < 0`, joined with `Category` for name/color. Tenant-isolated via `entity.tenantId`. Integer cents throughout.

---

## Data Flow

### Accounts Page (Sprint 1)
```
page.tsx (Server Component)
├── listAccounts() → accounts[]
├── listEntities() → entities[]
├── listAccountTransactions(limit:200) → month transactions → computeTransactionStats()
├── getPerformanceMetrics() → revenue/expense sparklines (optional, for stat cards)
│
├── BankingBalanceHero (accounts, entities, currencies)
├── BankingInsightPanel (stats, accounts)
├── BankingStatsRow (stats from StatsGrid pattern)
├── AccountCardGrid (accounts)
├── RecentTransactions (recent 5 txns) [existing component]
└── CashFlowMini (monthly totals) [new small component or inline SVG]
```

### Account Detail Page (Sprint 1.5)
```
accounts/[id]/page.tsx (Server Component)
├── getAccount(id) → account
├── listAccountTransactions(id, { limit: 500 }) → all transactions for chart + stats
├── computeTransactionStats(transactions) → income/expense/unreconciled stats
├── computeRunningBalance(transactions, account.currentBalance) → daily balance data
├── computeDailyFlows(transactions) → daily income/expense totals
├── (no backend call) → group transactions by categoryId client-side for AccountSpendingMini
│
├── AccountDetailHero (account, monthlyChange, runningBalanceData) [NEW]
├── AccountInsightCard (account, stats) [NEW]
├── AccountDetailsPanel (account, transactionCount, lastImportDate) [NEW]
├── AccountStatsRow (stats, currency, dailyFlows) [NEW]
├── BalanceHistoryChart (transactions, currentBalance, currency) [NEW, Client]
├── AccountSpendingMini (transactions grouped by categoryId, client-side) [lightweight inline, replaced by SpendingBreakdown in Sprint 2]
└── TransactionsList → TransactionsTableClient (accountId, showRunningBalance: true) [existing, prop threaded to client component]
```

### Transactions Page (Sprint 2)
```
page.tsx (Server Component)
├── listTransactions({ limit: 200 }) → transactions[]
├── listAccounts({ isActive: true }) → accounts[]
├── listCategories({ isActive: true }) → categories[]
├── getPerformanceMetrics() → revenue/expense/profit sparklines
├── getSpendingByCategory() → category breakdown [NEW]
│
├── Header + Action Pills (server-rendered)
├── TransactionsStatsRow (metrics, transactions, currency) [NEW]
├── SpendingBreakdown (spendingData, totalExpenses) [NEW]
├── AICategoryQueue (uncategorizedTxns, onCategorized) [Client]
├── TopMerchants (transactions, currency) [Client]
├── RecurringDetected (transactions, currency) [Client]
├── DailyCashFlowTimeline (transactions, month) [Client]
├── Filters + Smart Search [Client, existing TransactionsFilters enhanced]
└── TransactionsTable (transactions, enhanced props) [Client, existing modified]
```

---

## Reference Files

- `docs/design-system/03-screens/banking-redesign-concepts.html` — Canonical mockup (Accounts, Transactions, Account Detail sections)
- `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` — Current accounts list page
- `apps/web/src/app/(dashboard)/banking/accounts/[id]/page.tsx` — Current account detail page
- `apps/web/src/app/(dashboard)/banking/transactions/page.tsx` — Current transactions page
- `apps/web/src/components/accounts/AccountDetailHeader.tsx` — Detail hero to replace (133 lines)
- `apps/web/src/components/accounts/AccountStatsPills.tsx` — Detail stats to replace (36 lines)
- `apps/web/src/components/accounts/AccountsBalanceHero.tsx` — List hero to replace
- `apps/web/src/components/transactions/TransactionsListClient.tsx` — 452-line client to preserve
- `apps/web/src/components/transactions/TransactionsTable.tsx` — Table to enhance
- `apps/web/src/lib/api/performance.ts` — Performance metrics API client
- `apps/web/src/lib/api/transactions.ts` — Transaction API client
- `apps/web/src/lib/utils/account-helpers.ts` — Account type colors/icons/grouping
- `apps/web/src/components/dashboard/MiniSparkline.tsx` — Reusable sparkline
- `apps/web/src/components/shared/StatsGrid.tsx` — Reusable stat grid
- `apps/api/src/domains/ai/services/categorization.service.ts` — AI categorization (138 patterns)
- `apps/api/src/domains/banking/services/transaction.service.ts` — Transaction service

---

## Edge Cases

- **No accounts:** Show empty state with "Connect your first account" CTA (existing pattern)
- **No transactions:** Show empty state with "Import a statement to get started" CTA
- **No uncategorized:** AI Queue section hidden, "Categorized" stat shows 100% with green checkmark
- **No recurring detected:** RecurringDetected card shows "No recurring transactions detected yet"
- **Single currency:** Hero sub-items show account types only, no currency suffix
- **Multi-currency:** Balance hero shows primary currency total, secondary currencies as pills
- **0 spending categories:** SpendingBreakdown shows "No expense data for this period"
- **Mobile table overflow:** Table gets horizontal scroll with sticky description column
- **Account not found:** Account detail page returns `notFound()` (existing behavior preserved)
- **Account with 0 transactions:** Balance history chart shows flat line at current balance, stats show 0
- **Negative balance (credit card):** Balance displayed in red, sparkline inverted (lower = better)
- **Running balance computation:** Sort transactions by date ascending, accumulate from oldest to newest

---

## Review Agent Coverage

| Task | Relevant Agents |
|------|-----------------|
| Task 14 (Backend endpoint) | `financial-data-validator`, `security-sentinel`, `fastify-api-reviewer` |
| Task 5, 12, 23 (Page rewrites) | `nextjs-app-router-reviewer` |
| Task 21 (Table enhancement) | `kieran-typescript-reviewer` |
| All frontend tasks | `design-system-enforcer` |

---

## Estimated Effort

| Sprint | Tasks | Estimate |
|--------|-------|----------|
| Sprint 1 (Accounts List) | 6 tasks (1-6) | 2-3 hours |
| Sprint 1.5 (Account Detail) | 7 tasks (7-13) | 2-3 hours |
| Sprint 2 (Transactions) | 10 tasks (14-23) | 4-5 hours |
| Sprint 3 (Polish + Mobile) | 5 tasks (24-28) | 1-2 hours |
| **Total** | **28 tasks** | **9-13 hours** |

**Approach:** Complete Sprint 1 (Accounts list), verify visually, commit. Then Sprint 1.5 (Account Detail) — reuses patterns from Sprint 1 + shares `SpendingBreakdown` with Sprint 2. Then Sprint 2 (Transactions) — backend first, then frontend components, then page rewrite. Sprint 3 as final polish pass.

---

## Progress

### Sprint 1: Accounts List ✅ COMPLETE
- [x] Task 1: BankingBalanceHero
- [x] Task 2: BankingInsightPanel
- [x] Task 3: AccountCardGrid
- [x] Task 4: BankingStatsRow
- [x] Task 5: Rewrite accounts/page.tsx
- [x] Task 6: Update accounts/loading.tsx

### Sprint 1.5: Account Detail ✅ COMPLETE
- [x] Task 7: AccountDetailHero
- [x] Task 8: AccountInsightCard
- [x] Task 9: AccountDetailsPanel
- [x] Task 10: AccountStatsRow
- [x] Task 11: BalanceHistoryChart
- [x] Task 12: Rewrite accounts/[id]/page.tsx
- [x] Task 13: Update accounts/[id]/loading.tsx

### Sprint 2: Transactions
- [ ] Task 14: Backend spending-by-category endpoint
- [ ] Task 15: Frontend API client for spending
- [ ] Task 16: SpendingBreakdown component
- [ ] Task 17: AICategoryQueue component
- [ ] Task 18: TopMerchants component
- [ ] Task 19: RecurringDetected component
- [ ] Task 20: DailyCashFlowTimeline component
- [ ] Task 21: Enhance TransactionsTable
- [ ] Task 22: TransactionsStatsRow component
- [ ] Task 23: Rewrite transactions/page.tsx

### Sprint 3: Polish + Mobile
- [ ] Task 24: Mobile responsive Accounts
- [ ] Task 25: Mobile responsive Account Detail
- [ ] Task 26: Mobile responsive Transactions
- [ ] Task 27: Update transactions/loading.tsx
- [ ] Task 28: Cleanup deprecated components
