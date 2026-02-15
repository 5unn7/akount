# Overview Page Comprehensive Refresh — Implementation Plan

**Created:** 2026-02-14
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-14-overview-page-comprehensive-refresh-brainstorm.md](../brainstorms/2026-02-14-overview-page-comprehensive-refresh-brainstorm.md)

---

## Overview

Refine the Overview dashboard page to establish clear visual hierarchy, wire real performance data, and polish spacing/alignment issues. Implements a "blended hierarchy layout" with three distinct zones: (1) Liquidity Hero (primary), (2) Spark KPIs (secondary), (3) AI Brief + Actions (tertiary). All three zones visible above-the-fold with color-coded glow effects for instant financial clarity.

**Key changes:**
- Bump Liquidity Hero balance font size (3xl → 4xl)
- Add navbar vertical padding (12px)
- Fix sparkline alignment in Spark KPIs
- Add color-coded glow effects to spark cards (green/red/amber/blue/purple)
- Create new performance API endpoint with real transaction aggregates
- Remove all hardcoded demo data (sparklines, trend percentages)
- Add subtle purple border-left accent to AI Brief

---

## Success Criteria

- [x] **Visual hierarchy clear:** User's eyes drawn to Liquidity → Spark KPIs → AI Brief (validated via 3-second user test)
- [x] **Color guidance functional:** Green = positive, Red = negative, Amber = primary action (no confusion)
- [x] **Real data wired:** All sparklines and trends calculated from actual Transaction records
- [x] **Spacing consistent:** Navbar padding added, spark cards aligned, zones have breathing room (space-y-8)
- [x] **Mobile responsive:** All three zones stack vertically and remain functional on 375px width
- [x] **Performance optimized:** Performance endpoint responds in <500ms with 1000+ transactions
- [x] **Tests passing:** 15+ tests for performance calculations, 100% invariant coverage

---

## Tasks

### Task 1: Add Navbar Vertical Padding
**File:** `apps/web/src/components/layout/Navbar.tsx`
**What:** Change line 192 from `h-14` to `min-h-14 py-3` for 12px vertical breathing room. Improves tap targets on mobile and adds visual polish.
**Depends on:** none
**Success:** Navbar height visibly increased, buttons easier to tap on mobile, layout doesn't break

---

### Task 2: Bump Liquidity Hero Balance Font Size
**File:** `apps/web/src/components/dashboard/LiquidityHero.tsx`
**What:** Change line 69 from `text-3xl` to `text-4xl` to increase visual dominance of the hero balance. Establishes clear primary hierarchy.
**Depends on:** none
**Success:** Balance value noticeably larger, hero card feels more prominent without breaking layout

---

### Task 3: Fix Sparkline Alignment in Spark Cards
**File:** `apps/web/src/components/dashboard/SparkCards.tsx`
**What:**
- Wrap value section in `<div className="min-w-0 flex-1">` (line 100-107)
- Wrap sparkline in `<div className="shrink-0 w-20">` (line 108-110)
- Ensures value stays left-aligned even when sparkline is absent, and sparkline occupies fixed 80px width.
**Depends on:** none
**Success:** Values align consistently across all cards, sparklines don't cause layout shift

---

### Task 4: Add Color-Coded Glow Effects to Spark Cards
**File:** `apps/web/src/components/dashboard/SparkCards.tsx`
**What:**
- Add `glowMap` constant mapping colors to Tailwind shadow classes (before component)
- Apply glow class to card div via `cn()` utility (line 94-97)
- Each card glows with semantic color on hover (green for revenue, red for expenses, etc.)
**Depends on:** Task 3 (need aligned layout first)
**Success:** Hover over each card shows subtle colored glow matching semantic meaning, no layout shift

---

### Task 5: Increase Spacing Between Overview Zones
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Change line 94 from `space-y-6` to `space-y-8` for more vertical breathing room between zones
**Depends on:** none
**Success:** Zones feel less cramped, clearer visual separation, page looks more polished

---

### Task 6: Add Purple Border-Left Accent to AI Brief Card
**File:** `apps/web/src/components/dashboard/AIBrief.tsx`
**What:** Add `border-l-2 border-ak-purple` to the GlowCard className to create subtle purple accent indicating AI-generated content
**Depends on:** none
**Success:** AI Brief card has visible purple left border, distinct from other cards

---

### Task 7: Create Performance Metrics Schema
**File:** `apps/api/src/domains/overview/schemas/performance.schema.ts` (NEW)
**What:** Define Zod schemas for performance query params and response structure. Validates `entityId`, `currency`, `period` params. Response schema matches `PerformanceMetrics` interface from brainstorm.
**Depends on:** none
**Success:** Schema exports, validates sample requests, TypeScript types inferred correctly

---

### Task 8: Create Performance Service
**File:** `apps/api/src/domains/overview/services/performance.service.ts` (NEW)
**What:** Implement `PerformanceService` class with `getPerformanceMetrics()` method. Queries Transaction aggregates grouped by category type (income/expense), calculates sparkline data (daily aggregates over 30 days), computes period-over-period percentage changes.
**Depends on:** Task 7
**Risk:** high (financial calculations, tenant isolation required)
**Success:**
- Service returns metrics for test tenant with transactions
- Revenue = SUM(amount WHERE category.type = 'INCOME')
- Expenses = SUM(amount WHERE category.type = 'EXPENSE')
- Profit = revenue - expenses
- Sparkline has 15 data points (every 2 days over 30d period)
- Tenant isolation enforced (filters by account.entity.tenantId)

**Implementation notes:**
- Use integer cents throughout (already stored in Transaction.amount)
- Handle empty categories gracefully (return 0 values, empty sparkline)
- Receivables calculation: Query Invoice model for outstanding amounts (entityId filter)
- Period comparison: Current = last 30d, Previous = days -60 to -30
- Sparkline aggregation: `GROUP BY DATE_TRUNC('day', date) ORDER BY date` → take every 2nd day

---

### Task 9: Add Performance Route Handler
**File:** `apps/api/src/domains/overview/routes.ts`
**What:** Add `GET /performance` route with schema validation, tenant middleware, and service call. Returns performance metrics in standardized format.
**Depends on:** Task 8
**Success:**
- `GET /api/overview/performance?entityId=xxx&currency=CAD` returns 200 with metrics
- Missing entityId returns all entities for tenant
- Invalid currency returns 400 validation error
- Cross-tenant entityId returns 404 (tenant isolation)

---

### Task 10: Write Performance Service Tests
**File:** `apps/api/src/domains/overview/services/__tests__/performance.service.test.ts` (NEW)
**What:** Comprehensive test suite for performance calculations (15+ tests):
- Revenue/expense/profit calculations with sample transactions
- Sparkline data point generation (30 days → 15 points)
- Period-over-period percentage change (positive, negative, zero cases)
- Empty state (no transactions → zero values)
- Multi-currency conversion (if entityId spans multiple accounts with different currencies)
- Tenant isolation (rejects cross-tenant access)
- Receivables calculation (outstanding invoices)
- Edge case: Transactions on period boundaries (day 1, day 30, day -30, day -60)
**Depends on:** Task 8
**Risk:** high (validates financial calculation correctness)
**Success:** All 15+ tests pass, 100% coverage of performance.service.ts, financial invariants verified

**Test checklist:**
- [ ] Calculates revenue from INCOME category transactions
- [ ] Calculates expenses from EXPENSE category transactions
- [ ] Profit = revenue - expenses
- [ ] Sparkline has exactly 15 data points for 30d period
- [ ] Percentage change calculated correctly (current vs previous)
- [ ] Returns zero values when no transactions exist
- [ ] Converts multi-currency amounts to target currency
- [ ] Filters by entityId when provided
- [ ] Rejects cross-tenant entityId (returns empty/null)
- [ ] Receivables = SUM(invoices WHERE status != 'PAID')
- [ ] Handles period boundary transactions correctly
- [ ] Integer cents preserved throughout (no float corruption)
- [ ] Returns correct currency in response
- [ ] Handles missing categories gracefully
- [ ] Performance < 500ms with 1000+ transactions (benchmark test)

---

### Task 11: Wire Performance API to Overview Page
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:**
- Import new `getPerformanceMetrics()` API client function
- Add to parallel fetch (line 39-42 Promise.allSettled)
- Replace hardcoded sparkline/trend data in `sparkCards` array (line 55-91)
- Map API response to spark card format
- Add loading skeleton (reuse DashboardMetricsSkeleton pattern)
**Depends on:** Task 9
**Success:**
- Overview page shows real sparkline trends from transaction data
- Revenue/expense/profit values match API response
- Percentage changes reflect actual period-over-period calculations
- No hardcoded demo data remains
- Loading skeleton displays during fetch

---

### Task 12: Add Performance API Client Function
**File:** `apps/web/src/lib/api/performance.ts` (NEW)
**What:** Create `getPerformanceMetrics(entityId?, currency?, period?)` function using apiClient pattern. Returns typed PerformanceMetrics response.
**Depends on:** Task 9
**Success:** Function exports, types correct, calls `/api/overview/performance`, handles auth via Clerk

---

### Task 13: Add Empty State Handling for Spark Cards
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** When performance API returns zero values (no transactions), show placeholder state in spark cards: value = "—", trend = "No data yet", sparkline = empty array
**Depends on:** Task 11
**Success:**
- Fresh tenant with no transactions sees "—" in spark cards
- Trend shows "No data yet" instead of "+0%"
- Layout doesn't break with empty sparklines

---

### Task 14: Add Loading Skeleton for Spark Cards
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Create `SparkCardsSkeleton` component (similar to DashboardMetricsSkeleton). Show during performance fetch. 5 skeleton cards matching spark card layout.
**Depends on:** none
**Success:**
- Skeleton displays while fetching performance data
- Matches spark card dimensions
- Smooth transition to real data

---

### Task 15: Mobile Responsiveness Check
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Verify all three zones (Liquidity Hero, Spark KPIs, AI Brief) stack vertically on mobile (375px width). Adjust grid breakpoints if needed. Spark KPIs should use `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`.
**Depends on:** Tasks 1-6 (all layout changes)
**Success:**
- iPhone 13 Pro (375px): All zones visible and functional
- iPad (768px): 2-column spark KPIs, readable text
- Desktop (1440px): Full 5-column layout, all zones above fold

---

### Task 16: Add Error Boundary for Performance Fetch
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Wrap performance fetch in try/catch. If fetch fails, show fallback UI in spark cards section (similar to DashboardMetrics error handling). Don't crash entire page.
**Depends on:** Task 11
**Success:**
- API timeout shows graceful error message in spark cards area
- Rest of page (Liquidity Hero, Metrics) continues to work
- Error message suggests refresh

---

### Task 17: Update TASKS.md with Completion Status
**File:** `TASKS.md`
**What:** Add new task section "Overview Page Polish" with checkboxes for all completed tasks. Update Phase progress if applicable.
**Depends on:** Tasks 1-16 (all implementation complete)
**Success:** TASKS.md reflects current state, tasks checked off, commit hashes added

---

## Reference Files

**Backend patterns:**
- `apps/api/src/domains/overview/services/dashboard.service.ts` — existing dashboard service pattern (constructor with tenantId, getMetrics method, FX conversion)
- `apps/api/src/domains/banking/services/transaction.service.ts` — transaction queries with includes, pagination, tenant filtering
- `apps/api/src/domains/banking/routes/__tests__/imports.routes.test.ts` — test file structure for routes

**Frontend patterns:**
- `apps/web/src/components/dashboard/DashboardMetrics.tsx` — loading skeleton pattern, error handling, GlowCard usage
- `apps/web/src/components/dashboard/SparkCards.tsx` — spark card component, MiniSparkline SVG rendering
- `apps/web/src/app/(dashboard)/overview/page.tsx` — parallel data fetching with Promise.allSettled

**Schema reference:**
- `packages/db/prisma/schema.prisma` (lines 490-522) — Transaction model (amount, date, categoryId, accountId)
- `packages/db/prisma/schema.prisma` (lines 560-584) — Category model (type enum: INCOME, EXPENSE, etc.)

---

## Edge Cases

### No Transactions Exist
**Scenario:** Fresh tenant, no accounts or transactions seeded.
**Handling:**
- Performance service returns zero values for all metrics
- Sparklines = empty arrays
- Frontend displays "—" in values, "No data yet" in trends
- Empty state card suggests importing bank data

### Multi-Currency Accounts
**Scenario:** Entity has accounts in CAD, USD, EUR. User selects CAD as target currency.
**Handling:**
- Performance service converts all transaction amounts to CAD using FxRateService (batch fetch, same pattern as dashboard.service.ts)
- Sparkline data points also converted to CAD
- Response includes `currency: 'CAD'` to confirm conversion

### Transactions at Period Boundaries
**Scenario:** Transaction dated exactly 30 days ago, or 60 days ago.
**Handling:**
- Use inclusive date ranges: `>= startDate AND <= endDate`
- Current period: `date >= NOW() - 30 days AND date <= NOW()`
- Previous period: `date >= NOW() - 60 days AND date < NOW() - 30 days`
- Boundary transactions included in appropriate period

### Category Type NULL
**Scenario:** Transaction has categoryId = null (uncategorized), or category.type not in [INCOME, EXPENSE].
**Handling:**
- Exclude from revenue/expense calculations
- Log warning if large volume of uncategorized transactions
- Frontend can show "X uncategorized" badge (Phase 4 enhancement)

### Receivables Without Invoices
**Scenario:** Entity has no Invoice records yet (Phase 3 not started).
**Handling:**
- Return `receivables: { outstanding: 0, overdue: 0, sparkline: [] }`
- Frontend displays "—" with "Coming soon" trend text
- Don't crash if Invoice model query fails

### Large Transaction Volume (10k+ records)
**Scenario:** Long-running business with years of transaction history.
**Handling:**
- Always filter by date range first (last 60 days max) before aggregating
- Use indexed queries (`@@index([accountId, date])` already exists)
- Add benchmark test: 10k transactions → response < 500ms
- Consider caching layer if needed (React Query with 5min TTL)

---

## Testing Strategy

### Unit Tests (Backend)
- **Performance service:** 15+ tests covering calculations, edge cases, tenant isolation
- **Route handler:** Schema validation, auth, tenant middleware
- **Mock Transaction/Category data:** Use factories for consistent test data

### Integration Tests (API)
- **End-to-end endpoint test:** Seed test data → call API → verify response structure
- **Cross-tenant isolation:** Attempt to access other tenant's entityId → expect 404
- **Performance benchmark:** 1000 transactions → verify response time < 500ms

### Frontend Tests (Component)
- **SparkCards:** Renders with real data, handles empty sparklines, glow effects apply
- **Overview page:** Fetches performance data on mount, displays loading skeleton, shows error boundary

### Manual QA Checklist
- [ ] Visual hierarchy clear (Liquidity > Spark KPIs > AI Brief)
- [ ] All sparklines aligned consistently
- [ ] Color-coded glows appear on hover (green/red/amber/blue/purple)
- [ ] Navbar padding added (visibly taller)
- [ ] Mobile: All zones stack vertically, no horizontal scroll
- [ ] Real data: Revenue/expenses match expected values from seeded transactions
- [ ] Empty state: Fresh tenant shows "—" instead of $0.00
- [ ] Loading state: Skeleton displays during fetch
- [ ] Error state: API failure shows graceful error message

---

## Performance Considerations

### Query Optimization
- Use indexed fields: `accountId, date` index already exists on Transaction model
- Batch FX rate fetches (same pattern as dashboard.service.ts)
- Limit date range to 60 days max (30d current + 30d previous)
- Avoid N+1 queries: Single query with GROUP BY for sparkline aggregation

### Caching Strategy
- React Query on frontend: 5 min TTL for performance endpoint
- Backend: Consider Redis cache for aggregated metrics (Phase 4)
- Invalidate cache on transaction create/update/delete events

### Sparkline Data Reduction
- 30 days → 15 data points (every 2 days)
- Reduces payload size: ~15 numbers instead of 30
- Still provides sufficient trend visualization

---

## Progress Tracking

### Phase 1: Layout & Hierarchy (Frontend) — 6 tasks
- [ ] Task 1: Navbar padding
- [ ] Task 2: Liquidity Hero font bump
- [ ] Task 3: Sparkline alignment fix
- [ ] Task 4: Color-coded glows
- [ ] Task 5: Zone spacing increase
- [ ] Task 6: AI Brief purple accent

### Phase 2: Real Data Wiring (Backend + Frontend) — 6 tasks
- [ ] Task 7: Performance schema
- [ ] Task 8: Performance service
- [ ] Task 9: Performance route
- [ ] Task 10: Performance tests (15+ tests)
- [ ] Task 11: Wire API to page
- [ ] Task 12: API client function

### Phase 3: Polish & Edge Cases (Frontend) — 5 tasks
- [ ] Task 13: Empty state handling
- [ ] Task 14: Loading skeleton
- [ ] Task 15: Mobile responsiveness
- [ ] Task 16: Error boundary
- [ ] Task 17: Update TASKS.md

---

## Rollout Plan

### Session 1: Frontend Layout (Tasks 1-6)
- Quick wins, visual polish
- No API changes, low risk
- Can deploy independently
- ~1 hour estimated

### Session 2: Backend API (Tasks 7-10)
- Performance service + tests
- High risk (financial calculations)
- Thorough testing required
- ~2 hours estimated

### Session 3: Integration + Polish (Tasks 11-17)
- Wire frontend to backend
- Handle edge cases
- Mobile testing
- ~1.5 hours estimated

**Total estimated effort:** 4-5 hours across 3 sessions

---

## Post-Implementation Validation

After all tasks complete:

1. **Screenshot comparison** — Before/after of Overview page (desktop + mobile)
2. **User flow test** — "Within 3 seconds, identify your current profit trend" → should be instant
3. **Data accuracy check** — Manually calculate revenue from seeded transactions, compare to API response
4. **Performance benchmark** — Seed 1000 transactions, measure API response time (< 500ms target)
5. **Mobile device test** — iPhone 13 Pro, all zones functional, no horizontal scroll
6. **Cross-browser check** — Chrome, Firefox, Safari

---

**Status:** Ready for implementation. No blockers identified. All required models and patterns exist.
