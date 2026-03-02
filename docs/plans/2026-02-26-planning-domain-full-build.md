# Planning Domain — Full Build Implementation Plan

**Created:** 2026-02-26
**Status:** Draft
**Brainstorm:** None (task-driven from TASKS.md audit)

## Overview

Build the entire Planning domain from its current stub state into a fully functional system with Budgets, Goals, and Forecasts. This covers 22 tasks from TASKS.md spanning backend services, frontend pages, and advanced features like variance analysis, auto-tracking, and AI-powered forecasting.

## Current State

| Component | Status |
|-----------|--------|
| Prisma Models | Budget ✅, Goal ✅, Forecast ❌ (missing) |
| API Routes | All 501 stubs (routes.ts = 200 lines of placeholders) |
| API Services | None exist |
| API Schemas | Only partial CreateGoalSchema in routes.ts |
| API Tests | Schema validation only (goals.test.ts) |
| Frontend Pages | 3 "Coming Soon" placeholders |
| Frontend Layout | Missing (no layout.tsx, no DomainTabs) |
| API Client | None (no planning.ts in lib/api/) |
| Navigation | Done ✅ (3 nav items with RBAC) |

## Success Criteria

- [ ] Budget CRUD (create, list, get, update, delete) fully operational
- [ ] Goal CRUD with progress tracking fully operational
- [ ] Forecast model + CRUD + scenario modeling
- [ ] Budget variance analysis (budget vs actual from GL)
- [ ] Goal auto-tracking with milestone notifications
- [ ] Planning landing page with summary cards
- [ ] All pages have interactive forms, data tables, glass UI
- [ ] 100% test coverage on services (unit tests)
- [ ] All financial amounts in integer cents
- [ ] Tenant isolation on every query

---

## Sprint Structure (7 Sprints)

### Sprint 1: Foundation — Schema + Services (DEV-97, DEV-98, DEV-106)
**Effort:** 6-8h | **Priority:** High (everything depends on this)

#### Task 1.1: Add soft delete + Forecast model to Prisma schema (DEV-106, DEV-102 partial)
**File:** `packages/db/prisma/schema.prisma`
**What:**
- Add `deletedAt DateTime?` to Budget model
- Add `deletedAt DateTime?` to Goal model
- Add `glAccountId String?` relation to Goal (for account-linked goals)
- Create `Forecast` model:
  ```prisma
  model Forecast {
    id          String    @id @default(cuid())
    entityId    String
    name        String
    type        String    // CASH_FLOW, REVENUE, EXPENSE
    scenario    String    // BASELINE, OPTIMISTIC, PESSIMISTIC
    periodStart DateTime
    periodEnd   DateTime
    data        Json      // Array of {month, amount} projections
    assumptions Json?     // User-provided assumptions
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
    deletedAt   DateTime?
    entity      Entity    @relation(fields: [entityId], references: [id])
    @@index([entityId])
    @@index([type, scenario])
  }
  ```
- Run `npx prisma migrate dev`
**Depends on:** none
**Risk:** high (schema migration)
**Review:** `prisma-migration-reviewer`
**Success:** Migration runs clean, `npx prisma generate` works, all existing tests pass

#### Task 1.2: Build Goal service — full CRUD (DEV-97)
**File:** `apps/api/src/domains/planning/services/goal.service.ts`
**What:** Create GoalService class following AccountService pattern:
- `constructor(private tenantId: string)`
- `listGoals(params)` — paginated, filtered by entityId/status/type, soft delete filter
- `getGoal(id)` — single get with tenant isolation
- `createGoal(data)` — validate entityId belongs to tenant, integer cents
- `updateGoal(id, data)` — partial update, ownership check
- `deleteGoal(id)` — soft delete (set deletedAt)
**Depends on:** Task 1.1
**Risk:** high (financial data — targetAmount/currentAmount in cents)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** Service creates/reads/updates/deletes Goals filtered by tenantId; amounts are integer cents

#### Task 1.3: Build Budget service — full CRUD (DEV-98)
**File:** `apps/api/src/domains/planning/services/budget.service.ts`
**What:** Create BudgetService class:
- `constructor(private tenantId: string)`
- `listBudgets(params)` — paginated, filtered by entityId/period/categoryId, soft delete filter
- `getBudget(id)` — single get with tenant isolation
- `createBudget(data)` — validate entityId + categoryId + glAccountId ownership, integer cents
- `updateBudget(id, data)` — partial update, FK ownership checks
- `deleteBudget(id)` — soft delete
**Depends on:** Task 1.1
**Risk:** high (financial data — amount in cents, FK ownership)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** Service CRUD works with tenant isolation and integer cents

#### Task 1.4: Build Zod schemas for Budget and Goal
**File:** `apps/api/src/domains/planning/schemas/budget.schema.ts`, `goal.schema.ts`
**What:**
- `CreateBudgetSchema`: name, entityId, categoryId?, glAccountId?, amount (int), period (monthly/quarterly/yearly), startDate, endDate
- `UpdateBudgetSchema`: partial of create
- `CreateGoalSchema`: name, entityId, type (REVENUE/SAVINGS/EXPENSE_REDUCTION/CUSTOM), targetAmount (int), targetDate, accountId?, categoryId?, status (ACTIVE/PAUSED/COMPLETED/ABANDONED)
- `UpdateGoalSchema`: partial of create + currentAmount
- `ListQuerySchema`: entityId, cursor, limit, status?, type?, period?
**Depends on:** none
**Success:** Schemas validate and reject invalid data (negative cents, missing required fields)

#### Task 1.5: Build Goal + Budget route handlers (replace 501 stubs)
**Files:** `apps/api/src/domains/planning/routes/goal.routes.ts`, `budget.routes.ts`, `index.ts`
**What:**
- Split monolithic routes.ts into per-resource route files
- Implement: GET /goals, GET /goals/:id, POST /goals, PATCH /goals/:id, DELETE /goals/:id
- Implement: GET /budgets, GET /budgets/:id, POST /budgets, PATCH /budgets/:id, DELETE /budgets/:id
- Wire auth + tenant middleware, Zod validation
- Structured logging on every mutation
**Depends on:** Task 1.2, 1.3, 1.4
**Review:** `fastify-api-reviewer`, `security-sentinel`
**Success:** All 10 endpoints respond correctly; old 501 stubs removed

#### Task 1.6: Service tests for Goal + Budget
**Files:** `apps/api/src/domains/planning/__tests__/goal.service.test.ts`, `budget.service.test.ts`
**What:**
- Use centralized mockPrisma pattern
- Test CRUD operations, tenant isolation, soft delete, integer cents assertions
- Test FK ownership validation (categoryId, glAccountId, accountId)
- Use financial assertion helpers
**Depends on:** Task 1.2, 1.3
**Review:** `kieran-typescript-reviewer`
**Success:** All tests pass, 100% service function coverage

---

### Sprint 2: Frontend Foundation (UX-58, UX-59, UX-60)
**Effort:** 6-8h | **Priority:** High

#### Task 2.1: Create planning API client
**File:** `apps/web/src/lib/api/planning.ts`
**What:** Typed API functions for all planning endpoints:
- `listGoals(entityId, params?)`, `getGoal(id)`, `createGoal(data)`, `updateGoal(id, data)`, `deleteGoal(id)`
- `listBudgets(entityId, params?)`, `getBudget(id)`, `createBudget(data)`, `updateBudget(id, data)`, `deleteBudget(id)`
**Depends on:** Sprint 1 complete
**Success:** All functions typed and match API schemas

#### Task 2.2: Create planning layout with DomainTabs
**File:** `apps/web/src/app/(dashboard)/planning/layout.tsx`
**What:** Standard domain layout using `getDomainTabs('planning')` + `DomainTabs` component (same pattern as banking, accounting layouts)
**Depends on:** none
**Success:** Planning pages show Budgets / Goals / Forecasts tabs

#### Task 2.3: Build Goals page — list + create form (UX-58)
**Files:**
- `apps/web/src/app/(dashboard)/planning/goals/page.tsx` (server component — data fetch)
- `apps/web/src/app/(dashboard)/planning/goals/goals-list.tsx` (client component — interactive table)
- `apps/web/src/app/(dashboard)/planning/goals/goal-form.tsx` (client component — create/edit sheet)
**What:**
- Goals list with glass table: name, type, target, current, progress %, status, target date
- Progress bar per goal (currentAmount / targetAmount)
- Create/edit form in Sheet with fields matching GoalSchema
- Status badges using semantic tokens (ACTIVE=green, PAUSED=blue, COMPLETED=primary, ABANDONED=red)
- Delete with confirmation dialog
- Empty state using EmptyState component from packages/ui
**Depends on:** Task 2.1, 2.2
**Review:** `nextjs-app-router-reviewer`, `design-system-enforcer`
**Success:** Goals page renders list, create/edit/delete all functional

#### Task 2.4: Build Budgets page — list + create form + budget vs actual bars (UX-59)
**Files:**
- `apps/web/src/app/(dashboard)/planning/budgets/page.tsx`
- `apps/web/src/app/(dashboard)/planning/budgets/budgets-list.tsx`
- `apps/web/src/app/(dashboard)/planning/budgets/budget-form.tsx`
**What:**
- Budgets list with glass table: name, category, period, amount, spent (from GL), remaining, % used
- Visual progress bar per budget (spent / budgeted) with color coding (green <80%, amber 80-100%, red >100%)
- Create/edit form in Sheet
- Category and GL account dropdowns (fetch from existing APIs)
- Delete with confirmation
**Depends on:** Task 2.1, 2.2
**Review:** `nextjs-app-router-reviewer`, `design-system-enforcer`
**Success:** Budgets page with visual spend tracking

#### Task 2.5: Build Planning landing page with summary cards (UX-60)
**File:** `apps/web/src/app/(dashboard)/planning/page.tsx` (+ loading.tsx, error.tsx)
**What:**
- Summary cards: Total Budgets, Active Goals, Budget Health (% under/over), Goals On Track
- Quick-action buttons: "Create Budget", "Set Goal"
- Recent activity list (last 5 budget/goal changes)
- Uses glass cards with stat pattern (label → value → trend)
**Depends on:** Task 2.3, 2.4
**Review:** `design-system-enforcer`
**Success:** Landing page shows aggregated planning metrics

---

### Sprint 3: Budget Variance Analysis (DEV-99, UX-62, UX-63, DEV-105)
**Effort:** 6-8h | **Priority:** Medium

#### Task 3.1: Budget variance analysis endpoint (DEV-99)
**File:** `apps/api/src/domains/planning/services/budget-variance.service.ts`
**What:**
- Compare budget amount vs actual spend from GL journal lines
- For each budget: query JournalLines where glAccountId or categoryId matches, within budget date range
- Calculate: budgeted, actual, variance (budgeted - actual), variance %
- All amounts in integer cents
- Return per-category breakdown
**Depends on:** Sprint 1 (DEV-98)
**Risk:** high (cross-domain: reads from accounting GL data)
**Review:** `financial-data-validator`, `architecture-strategist`
**Success:** Endpoint returns accurate budget vs actual comparison

#### Task 3.2: Budget variance API route
**File:** `apps/api/src/domains/planning/routes/budget.routes.ts`
**What:** `GET /budgets/:id/variance` — returns variance analysis for a single budget
**Depends on:** Task 3.1
**Success:** Endpoint accessible and returns correct data

#### Task 3.3: Budget period selector with spend-rate indicator (UX-62)
**File:** `apps/web/src/app/(dashboard)/planning/budgets/budget-period-selector.tsx`
**What:**
- Dropdown to filter budgets by period (This Month, This Quarter, This Year, Custom)
- Visual spend-rate indicator showing daily burn rate vs expected rate
**Depends on:** Sprint 2 (UX-59)
**Success:** Period selector filters budget list and shows spend rate

#### Task 3.4: Budget vs actual drill-down (UX-63)
**File:** `apps/web/src/app/(dashboard)/planning/budgets/budget-detail.tsx` or modal
**What:**
- Click a budget category → see all matching transactions
- Table of transactions that contributed to the "actual" spend
- Link back to transaction detail
**Depends on:** Task 3.1 (DEV-99)
**Review:** `security-sentinel` (cross-domain data access)
**Success:** Click through from budget to individual transactions

#### Task 3.5: Budget alerts — threshold warnings (DEV-105)
**File:** `apps/api/src/domains/planning/services/budget-alerts.service.ts`
**What:**
- Check budget utilization: alert at 80% (warning) and 100% (over-budget)
- Return alert metadata with each budget in list response
- Frontend: show amber/red badges on budgets approaching/exceeding limits
**Depends on:** Task 3.1
**Success:** Budgets show alert badges at 80%/100% thresholds

---

### Sprint 4: Goal Tracking + Milestones (DEV-100, UX-64)
**Effort:** 4-6h | **Priority:** Medium

#### Task 4.1: Goal auto-tracking + milestone notifications (DEV-100)
**File:** `apps/api/src/domains/planning/services/goal-tracking.service.ts`
**What:**
- For account-linked goals: query account balance as currentAmount
- For category-linked goals: sum transaction amounts in category
- Milestone detection: 25%, 50%, 75%, 100% thresholds
- Store milestone events (could use existing notification/insight infrastructure)
- Update goal.currentAmount on tracking run
**Depends on:** Sprint 1 (DEV-97)
**Risk:** high (cross-domain: reads banking/accounting data)
**Review:** `financial-data-validator`, `architecture-strategist`
**Success:** Goal progress auto-updates from account/category data

#### Task 4.2: Goal trajectory projection — "on pace" vs "behind" (UX-64)
**File:** `apps/web/src/app/(dashboard)/planning/goals/goal-trajectory.tsx`
**What:**
- Calculate expected progress based on linear interpolation (days elapsed / total days × target)
- Compare expected vs actual: "On Pace", "Ahead", "Behind"
- Visual trend line (simple SVG or progress comparison)
- Color coding: green (ahead/on pace), amber (slightly behind), red (significantly behind)
**Depends on:** Task 4.1
**Success:** Each goal shows trajectory status

---

### Sprint 5: Forecasts (DEV-102, UX-61, DEV-103, DEV-104)
**Effort:** 8-10h | **Priority:** Medium

#### Task 5.1: Forecast CRUD service (DEV-102)
**File:** `apps/api/src/domains/planning/services/forecast.service.ts`
**What:**
- ForecastService with full CRUD
- Support scenario types: BASELINE, OPTIMISTIC, PESSIMISTIC
- Forecast types: CASH_FLOW, REVENUE, EXPENSE
- Store projections as JSON array of monthly data points
- Each data point: { month: string, amount: int (cents) }
**Depends on:** Task 1.1 (Forecast model)
**Review:** `financial-data-validator`
**Success:** CRUD for forecasts with scenario modeling

#### Task 5.2: Forecast Zod schemas + route handlers
**Files:** `apps/api/src/domains/planning/schemas/forecast.schema.ts`, `routes/forecast.routes.ts`
**What:**
- CreateForecastSchema, UpdateForecastSchema, ListForecastsSchema
- GET /forecasts, GET /forecasts/:id, POST /forecasts, PATCH /forecasts/:id, DELETE /forecasts/:id
**Depends on:** Task 5.1
**Success:** All forecast endpoints operational

#### Task 5.3: Cash runway calculator (DEV-103)
**File:** `apps/api/src/domains/planning/services/cash-runway.service.ts`
**What:**
- Calculate: total cash balance / average monthly burn rate = months remaining
- Pull cash balance from banking accounts (sum of BANK type accounts)
- Pull burn rate from last 3-6 months of expense journal entries
- Return: { cashBalance, monthlyBurnRate, runwayMonths, runwayDate }
**Depends on:** Sprint 1
**Risk:** high (cross-domain financial calculation)
**Review:** `financial-data-validator`
**Success:** Accurate runway calculation from real data

#### Task 5.4: Seasonal pattern detection (DEV-104)
**File:** `apps/api/src/domains/planning/services/seasonal-patterns.service.ts`
**What:**
- Analyze 12+ months of revenue/expense data
- Identify high/low months (deviation from mean)
- Return: { monthlyAverages, highMonths, lowMonths, seasonalityScore }
- Used to inform forecast projections
**Depends on:** none (reads from accounting data)
**Review:** `financial-data-validator`
**Success:** Correctly identifies seasonal revenue/expense patterns

#### Task 5.5: Build Forecasts page — cash flow projection chart (UX-61)
**Files:**
- `apps/web/src/app/(dashboard)/planning/forecasts/page.tsx`
- `apps/web/src/app/(dashboard)/planning/forecasts/forecasts-list.tsx`
- `apps/web/src/app/(dashboard)/planning/forecasts/forecast-chart.tsx`
**What:**
- Forecast list with scenario selector (Baseline/Optimistic/Pessimistic)
- Cash flow projection chart (line chart showing monthly projections)
- Cash runway card (months remaining at current burn rate)
- Create forecast form
**Depends on:** Tasks 5.1, 5.2, 5.3
**Review:** `nextjs-app-router-reviewer`, `design-system-enforcer`
**Success:** Forecasts page with interactive chart and runway display

---

### Sprint 6: Cross-Domain Integration (DEV-101, DEV-34, DEV-35, DEV-36)
**Effort:** 6-8h | **Priority:** Medium

#### Task 6.1: Wire planning reports to accounting endpoints (DEV-101)
**File:** `apps/api/src/domains/planning/routes/report.routes.ts`
**What:**
- Replace report stubs with proxies to accounting report endpoints
- OR: redirect planning/reports/* to accounting/reports/*
- Remove duplicate 501 stubs for P&L, Balance Sheet, Cash Flow
**Depends on:** none (accounting reports already exist)
**Success:** Planning report routes serve real data from accounting

#### Task 6.2: Overview — Goal Progress widget (DEV-34)
**File:** `apps/web/src/app/(dashboard)/overview/widgets/goal-progress-widget.tsx`
**What:**
- Display active goals with progress bars
- Show days remaining to deadline
- Color-coded: on-track (green), at-risk (amber), behind (red)
- Compact card fitting overview dashboard grid
**Depends on:** Sprint 1 (DEV-97), Sprint 4 (tracking)
**Review:** `design-system-enforcer`
**Success:** Widget shows goal progress on overview dashboard

#### Task 6.3: Overview — Budget vs Actual widget (DEV-35)
**File:** `apps/web/src/app/(dashboard)/overview/widgets/budget-vs-actual-widget.tsx`
**What:**
- Show % of budget used this month for top 3-5 budgets
- Over-budget alerts highlighted in red
- Mini bar chart per budget
**Depends on:** Sprint 3 (variance analysis)
**Review:** `design-system-enforcer`
**Success:** Widget shows budget health on overview dashboard

#### Task 6.4: Overview — Expense Forecast widget (DEV-36)
**File:** `apps/web/src/app/(dashboard)/overview/widgets/expense-forecast-widget.tsx`
**What:**
- Projected monthly spend at current 3-month run rate
- Trend arrow (up/down vs last month)
- Forecast amount in mono font
**Depends on:** Sprint 5 (DEV-103 cash runway)
**Review:** `design-system-enforcer`
**Success:** Widget shows expense projection on overview dashboard

---

### Sprint 7: Advanced Features (DEV-107, DEV-108, DEV-109, DEV-110, DEV-111, UX-65)
**Effort:** 10-14h | **Priority:** Low (nice-to-have)

#### Task 7.1: Goal templates (DEV-108)
**File:** `apps/api/src/domains/planning/services/goal-templates.ts`
**What:** Pre-built goal templates: Emergency Fund (6 months expenses), Revenue Target, Expense Reduction
**Depends on:** Sprint 1 (DEV-97)
**Success:** Users can create goals from templates

#### Task 7.2: Budget rollover (DEV-109)
**File:** `apps/api/src/domains/planning/services/budget.service.ts` (extend)
**What:** Carry unused budget forward to next period automatically
**Depends on:** Sprint 1 (DEV-98)
**Success:** Expired budgets can roll forward unused amounts

#### Task 7.3: AI-powered expense forecast (DEV-107)
**File:** `apps/api/src/domains/planning/services/ai-forecast.service.ts`
**What:** Use AI service to generate smarter forecasts based on historical patterns + seasonal detection
**Depends on:** Sprint 5 (DEV-104 seasonal patterns)
**Review:** `architecture-strategist`
**Success:** AI-enhanced forecasts more accurate than linear projection

#### Task 7.4: What-if scenario comparison (DEV-110)
**File:** Frontend component for side-by-side forecast comparison
**What:** Compare 2-3 forecast scenarios side by side with visual diff
**Depends on:** Sprint 5 (DEV-102 forecast CRUD)
**Success:** Side-by-side scenario comparison view

#### Task 7.5: Auto-suggest budgets (DEV-111)
**File:** `apps/api/src/domains/planning/services/budget-suggestions.service.ts`
**What:** Analyze last 3-6 months spending patterns to suggest budget amounts per category
**Depends on:** Sprint 1 (DEV-98)
**Success:** Budget suggestions based on actual spending history

#### Task 7.6: Budget/Goal export CSV/PDF (UX-65)
**File:** Export endpoint + frontend download button
**What:** Export budgets and goals as CSV or PDF
**Depends on:** Sprints 1-2
**Success:** Users can download budget/goal data

---

## Reference Files

- `apps/api/src/domains/banking/services/account.service.ts` — service class pattern (constructor with tenantId, pagination, soft delete)
- `apps/api/src/domains/business/services/invoice.service.ts` — VALID_TRANSITIONS pattern, void/status machine
- `apps/api/src/domains/accounting/utils/entry-number.ts` — shared utility pattern
- `apps/api/src/domains/banking/routes/account.routes.ts` — route handler pattern
- `apps/web/src/app/(dashboard)/banking/layout.tsx` — domain layout with DomainTabs
- `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` — server component data fetch pattern
- `packages/db/prisma/schema.prisma` — existing Budget/Goal models

## Edge Cases

- **Budget with no GL data yet:** Show "No spend data — track expenses to see actuals"
- **Goal with no account/category link:** Manual-only tracking (user updates currentAmount)
- **Forecast with < 3 months history:** Warn "Limited data — forecast accuracy may be low"
- **Budget date range spanning year boundary:** Handle fiscal year correctly
- **Concurrent budget updates:** Use optimistic locking via updatedAt
- **Zero-amount budget:** Reject in schema (amount must be > 0)
- **Goal 100% complete:** Auto-transition status to COMPLETED (with user confirmation)

## Review Agent Coverage

| Sprint | Tasks | Relevant Agents |
|--------|-------|-----------------|
| Sprint 1 | Schema, Services | `prisma-migration-reviewer`, `financial-data-validator`, `security-sentinel` |
| Sprint 2 | Frontend | `nextjs-app-router-reviewer`, `design-system-enforcer` |
| Sprint 3 | Variance Analysis | `financial-data-validator`, `architecture-strategist`, `security-sentinel` |
| Sprint 4 | Goal Tracking | `financial-data-validator`, `architecture-strategist` |
| Sprint 5 | Forecasts | `financial-data-validator`, `nextjs-app-router-reviewer` |
| Sprint 6 | Integration | `design-system-enforcer`, `architecture-strategist` |
| Sprint 7 | Advanced | `architecture-strategist` |

## Domain Impact

- **Primary domain:** Planning (budgets, goals, forecasts)
- **Adjacent domains:**
  - **Accounting** — variance analysis reads GL journal lines; reports integration
  - **Banking** — cash runway reads account balances; goal tracking reads account data
  - **Overview** — 3 new dashboard widgets (DEV-34/35/36)
  - **System** — RBAC already configured in navigation.ts

## Testing Strategy

**Service tests (per service):**
- CRUD operations with tenant isolation
- Integer cents assertions on all monetary fields
- Soft delete verification
- FK ownership validation (categoryId, glAccountId, accountId)
- Edge cases: empty data, invalid dates, negative amounts

**Route tests (per resource):**
- Auth/tenant middleware enforcement
- Schema validation (Zod rejects invalid input)
- 404 for cross-tenant access
- Correct status codes (201 create, 200 get, 204 delete)

**Frontend tests:**
- Component rendering with mock data
- Form validation
- Empty state rendering

## Effort Summary

| Sprint | Tasks | Effort | Priority |
|--------|-------|--------|----------|
| Sprint 1: Foundation | DEV-97, DEV-98, DEV-106 | 6-8h | High |
| Sprint 2: Frontend | UX-58, UX-59, UX-60 | 6-8h | High |
| Sprint 3: Variance | DEV-99, UX-62, UX-63, DEV-105 | 6-8h | Medium |
| Sprint 4: Tracking | DEV-100, UX-64 | 4-6h | Medium |
| Sprint 5: Forecasts | DEV-102, UX-61, DEV-103, DEV-104 | 8-10h | Medium |
| Sprint 6: Integration | DEV-101, DEV-34, DEV-35, DEV-36 | 6-8h | Medium |
| Sprint 7: Advanced | DEV-107-111, UX-65 | 10-14h | Low |
| **Total** | **22 tasks** | **46-62h** | |

## Progress

- [ ] Sprint 1: Foundation (Schema + Services)
- [ ] Sprint 2: Frontend Foundation
- [ ] Sprint 3: Budget Variance Analysis
- [ ] Sprint 4: Goal Tracking + Milestones
- [ ] Sprint 5: Forecasts
- [ ] Sprint 6: Cross-Domain Integration
- [ ] Sprint 7: Advanced Features
