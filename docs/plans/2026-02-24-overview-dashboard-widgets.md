# Overview Dashboard Widgets — Implementation Plan

**Created:** 2026-02-24
**Status:** Draft
**Related Tasks:** DEV-17, DEV-19, DEV-20
**Backend:** ReportService methods already exist

---

## Overview

Add 3 mini-widgets to the Overview dashboard that display financial reports using existing ReportService backend methods:

1. **P&L Summary Widget** (DEV-17) — Revenue vs Expense bars + YTD trend sparkline
2. **Trial Balance Status Widget** (DEV-19) — Balanced/unbalanced alert + account type counts
3. **Top Revenue Clients Widget** (DEV-20) — Top 5 clients by YTD revenue + concentration percentage

All backend services are ready. This plan focuses on creating the frontend widgets following existing dashboard component patterns (UpcomingPayments, StatCard).

---

## Success Criteria

- [ ] 3 widgets render on Overview page with real data from ReportService
- [ ] Each widget shows loading skeleton, empty state, and data display
- [ ] Widgets use semantic design tokens (no hardcoded colors)
- [ ] Client-side data fetching via dashboard-client.ts
- [ ] No TypeScript errors, components compile cleanly
- [ ] Widgets follow existing dashboard styling patterns (glass, micro typography, compact)

---

## Tasks

### Task 1: Add client-side API functions for reports
**File:** `apps/web/src/lib/api/dashboard-client.ts`
**What:** Add 3 functions to fetch report data from backend:
- `getProfitLossSummary(entityId?, startDate, endDate)` → calls `/api/accounting/reports/profit-loss`
- `getTrialBalanceStatus(entityId?, asOfDate?)` → calls `/api/accounting/reports/trial-balance`
- `getTopRevenueClients(entityId?, startDate, endDate, limit?)` → calls `/api/accounting/reports/revenue-by-client`

Each function uses `apiFetch` from `client-browser.ts` and returns typed responses from `@akount/types/financial`.

**Depends on:** none
**Success:** Functions export correctly, TypeScript recognizes return types from `@akount/types`

---

### Task 2: Create ProfitLossSummaryWidget component
**File:** `apps/web/src/components/dashboard/ProfitLossSummaryWidget.tsx` (NEW)
**What:** Client component that fetches P&L data and displays:
- **Header:** "P&L Summary" label (10px uppercase) + "View full report" link → `/accounting/reports`
- **Loading state:** 3 skeleton bars (revenue, expense, net income)
- **Empty state:** Icon + "No P&L data" message
- **Data display:**
  - Revenue bar (green, `bg-ak-green-dim`, value in mono font)
  - Expense bar (red, `bg-ak-red-dim`, value in mono font)
  - Net Income row (primary color if positive, red if negative)
  - Optional: Mini sparkline showing trend (if previousNetIncome available)

Uses `useEffect` to fetch on mount, `useState` for data/loading. Date range: YTD (Jan 1 to today).

**Depends on:** Task 1
**Success:** Widget renders with loading/empty/data states, matches UpcomingPayments styling pattern

---

### Task 3: Create TrialBalanceStatusWidget component
**File:** `apps/web/src/components/dashboard/TrialBalanceStatusWidget.tsx` (NEW)
**What:** Client component that fetches Trial Balance status and displays:
- **Header:** "Trial Balance" label + "View details" link → `/accounting/reports`
- **Loading state:** Skeleton circle + 3 skeleton rows
- **Empty state:** Icon + "No trial balance data"
- **Data display:**
  - Balanced indicator: ✅ green circle + "Balanced" OR ⚠️ red circle + "Out of Balance" (based on `isBalanced` flag)
  - Account type breakdown: "12 Assets · 8 Liabilities · 15 Expenses · 6 Revenue" (count by account type from `accounts` array)
  - Total debits/credits (small text, mono font)

Uses `asOfDate: today` by default. Groups accounts by type for counts.

**Depends on:** Task 1
**Success:** Widget shows balanced status and account counts, styling matches dashboard theme

---

### Task 4: Create TopRevenueClientsWidget component
**File:** `apps/web/src/components/dashboard/TopRevenueClientsWidget.tsx` (NEW)
**What:** Client component that fetches revenue by client and displays:
- **Header:** "Top Revenue Clients" label + "View all clients" link → `/business/clients`
- **Loading state:** 5 skeleton rows
- **Empty state:** Icon + "No revenue data"
- **Data display:**
  - Top 5 clients as compact rows: client name (truncate) + revenue amount (mono, green) + concentration % badge
  - Each row: `hover:bg-ak-bg-3/50` + colored bar (green, opacity based on % of total)
  - Footer: "X total clients" count

Uses date range: YTD (Jan 1 to today). Limit: 5 clients. Shows percentage of total revenue for each.

**Depends on:** Task 1
**Success:** Widget shows top 5 clients with revenue and %, styling matches UpcomingPayments pattern

---

### Task 5: Add widgets to Overview page
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Import and render the 3 new widgets in the dashboard grid layout.

**Placement strategy** (based on command-center-dashboard.md layout):
- Add a new "Reports" row in the grid after Quick Stats and before Cash Flow Chart
- 3-col grid on desktop (each widget spans 1 col), 1-col stack on mobile
- Widgets wrapped in `GlowCard` with `glass` styling for consistency

Example:
```tsx
{/* Reports Row */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <GlowCard variant="glass" className="p-4">
    <ProfitLossSummaryWidget entityId={entityId} />
  </GlowCard>
  <GlowCard variant="glass" className="p-4">
    <TrialBalanceStatusWidget entityId={entityId} />
  </GlowCard>
  <GlowCard variant="glass" className="p-4">
    <TopRevenueClientsWidget entityId={entityId} />
  </GlowCard>
</div>
```

**Depends on:** Tasks 2, 3, 4
**Success:** Overview page renders with 3 new widgets, grid layout responsive at mobile/tablet/desktop

---

### Task 6: Update loading skeleton to include widgets
**File:** `apps/web/src/app/(dashboard)/overview/loading.tsx`
**What:** Add skeleton placeholders for the 3 new widgets in the Reports row.

Match the grid structure from Task 5:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="glass rounded-xl p-4 space-y-3">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
  {/* Repeat for other 2 widgets */}
</div>
```

**Depends on:** Task 5
**Success:** Loading state shows widget skeletons in correct grid positions

---

## Reference Files

**Backend Services:**
- `apps/api/src/domains/accounting/services/report.service.ts` — `generateProfitLoss()`, `generateTrialBalance()`, `generateRevenueByClient()`

**Type Definitions:**
- `packages/types/src/financial/reports.ts` — `ProfitLossReport`, `TrialBalanceReport`, `RevenueReport`

**Existing Widget Patterns:**
- `apps/web/src/components/dashboard/UpcomingPayments.tsx` — reference for widget structure (loading, empty, data states)
- `apps/web/src/components/dashboard/StatCard.tsx` — reference for stat display with trends
- `apps/web/src/lib/api/dashboard-client.ts` — reference for client-side API calls with `apiFetch`

**Utilities:**
- `apps/web/src/lib/utils/currency.ts` — `formatCurrency()`, `formatCompactNumber()`
- `apps/web/src/lib/utils/date.ts` — `formatDate()`

**Overview Page:**
- `apps/web/src/app/(dashboard)/overview/page.tsx` — main dashboard layout (Server Component)
- `apps/web/src/app/(dashboard)/overview/loading.tsx` — loading skeleton

---

## Edge Cases

- **No data:** Each widget shows empty state with icon + message (e.g., "No P&L data for this period")
- **entityId undefined:** Widgets fetch all-entity consolidated data (backend supports this)
- **Date range:** YTD (Jan 1 to today) for P&L and Revenue widgets, today for Trial Balance
- **Trial Balance unbalanced:** Show red alert badge with severity indicator
- **No clients:** TopRevenueClients shows empty state instead of crashing
- **Loading timeout:** If fetch takes >5s, show error state with retry button (follow UpcomingPayments error handling pattern)

---

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 1 | None (simple API wrapper) |
| Task 2-4 | `nextjs-app-router-reviewer` (client components), `design-system-enforcer` (color tokens) |
| Task 5-6 | `nextjs-app-router-reviewer` (page integration) |

---

## Domain Impact

- **Primary domain:** Overview (dashboard widgets)
- **Adjacent domain:** Accounting (data source via ReportService)
- **No schema changes:** All backend endpoints already exist
- **No cross-domain mutations:** Read-only data display

---

## Testing Strategy

**Manual Testing:**
1. Open `/overview` page
2. Verify all 3 widgets load (check Network tab for API calls)
3. Test with entityId filter (select different entity from dropdown)
4. Test edge cases: empty entity, no transactions, unbalanced trial balance
5. Responsive: verify 3-col desktop → 1-col mobile layout

**Unit Tests (optional for this phase):**
- Widget components can be tested with mock data (not critical for MVP)

**Verification:**
```bash
cd apps/web && npx tsc --noEmit  # No TypeScript errors
npm run dev  # Start dev server
# Open http://localhost:3000/overview
# Check widget rendering, API calls in Network tab
```

---

## Estimated Effort

| Task | Estimate |
|------|----------|
| Task 1: Client API functions | 30 min |
| Task 2: P&L Widget | 1h |
| Task 3: Trial Balance Widget | 45 min |
| Task 4: Top Revenue Clients Widget | 1h |
| Task 5: Add to Overview page | 30 min |
| Task 6: Update loading skeleton | 15 min |
| **Total** | **4 hours** |

**Approach:** Complete tasks 1-4 sequentially (foundation first), then integrate (tasks 5-6). Test after each widget completes.

---

## Progress Checklist

- [ ] Task 1: Client API functions
- [ ] Task 2: P&L Widget
- [ ] Task 3: Trial Balance Widget
- [ ] Task 4: Top Revenue Clients Widget
- [ ] Task 5: Add to Overview page
- [ ] Task 6: Update loading skeleton

---

## Notes

- **Design tokens enforced:** All colors use semantic tokens (`text-ak-green`, `bg-ak-red-dim`, `glass`)
- **No backend changes needed:** ReportService methods exist and return correct types
- **Reusable patterns:** Widgets follow UpcomingPayments structure for consistency
- **Error handling:** Each widget handles loading/empty/error states gracefully
- **Date calculations:** YTD = `new Date(new Date().getFullYear(), 0, 1)` to `new Date()`