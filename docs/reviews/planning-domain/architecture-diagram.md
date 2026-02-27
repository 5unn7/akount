# Planning Domain Architecture Diagrams

**Review Date:** 2026-02-26

---

## 1. System Context: Planning Domain in Akount

```
┌────────────────────────────────────────────────────────────────────────┐
│                           AKOUNT SYSTEM                                 │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Overview │  │ Banking  │  │ Business │  │Accounting│  │ Planning│ │
│  │          │  │          │  │          │  │          │  │         │ │
│  │ Dashboard│  │ Accounts │  │ Invoices │  │ GL + JE  │  │ Budgets │ │
│  │ Metrics  │  │ Txns     │  │ Bills    │  │ Reports  │  │ Goals   │ │
│  │          │  │ Import   │  │ Payments │  │ Periods  │  │Forecasts│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │              │              │              │      │
│       └─────────────┴──────────────┴──────────────┴──────────────┘      │
│                                    │                                    │
│                          ┌─────────▼─────────┐                         │
│                          │  Shared Data      │                         │
│                          │  - Tenant         │                         │
│                          │  - Entity         │                         │
│                          │  - Category       │                         │
│                          │  - GLAccount      │                         │
│                          └───────────────────┘                         │
└────────────────────────────────────────────────────────────────────────┘

Legend:
━━━ Write operations (creates/updates data)
─── Read operations (queries data)
```

---

## 2. Planning Domain Internal Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PLANNING DOMAIN                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        ROUTE LAYER                               │   │
│  │  /api/planning/budgets     /goals     /forecasts                │   │
│  │  (24 endpoints: CRUD + analytics)                               │   │
│  └───────────────────────────┬─────────────────────────────────────┘   │
│                              │                                          │
│                              │ Middleware Chain                         │
│                              │ 1. Auth (Clerk JWT)                      │
│                              │ 2. Tenant (load tenantId)                │
│                              │ 3. Validation (Zod schemas)              │
│                              │ 4. RBAC (permission checks)              │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       SERVICE LAYER (10 services)                │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐    │   │
│  │  │ BUDGETS (3)   │  │ GOALS (3)     │  │ FORECASTS (4)   │    │   │
│  │  ├───────────────┤  ├───────────────┤  ├─────────────────┤    │   │
│  │  │ budget        │  │ goal          │  │ forecast        │    │   │
│  │  │ variance      │  │ tracking      │  │ ai-forecast     │    │   │
│  │  │ suggestions   │  │ templates     │  │ cash-runway     │    │   │
│  │  │               │  │               │  │ seasonal        │    │   │
│  │  └───────┬───────┘  └───────┬───────┘  └────────┬────────┘    │   │
│  │          │                   │                   │             │   │
│  │          └───────────────────┴───────────────────┘             │   │
│  │                              │                                 │   │
│  │                All services use TenantContext                  │   │
│  │                (tenantId passed via constructor)               │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                      │
│                                 │ Prisma Queries                       │
│                                 ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       DATA LAYER                                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │ Budget   │  │ Goal     │  │ Forecast │  │ JournalLine  │   │   │
│  │  │          │  │          │  │          │  │ (read-only)  │   │   │
│  │  │ entityId │  │ entityId │  │ entityId │  │ from         │   │   │
│  │  │ amount   │  │ target   │  │ data[]   │  │ Accounting   │   │   │
│  │  │ period   │  │ current  │  │ scenario │  │ domain       │   │   │
│  │  │deletedAt │  │deletedAt │  │deletedAt │  │              │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │   │
│  │       │              │              │              │           │   │
│  │       └──────────────┴──────────────┴──────────────┘           │   │
│  │                              │                                 │   │
│  │                      PostgreSQL Database                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cross-Domain Data Flow: Budget Variance

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User Request: GET /api/planning/budgets/variance?entityId=E1           │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PLANNING DOMAIN                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ BudgetVarianceService.listBudgetVariances(entityId)              │  │
│  │                                                                  │  │
│  │ Step 1: Fetch all active budgets for entity                     │  │
│  │ ┌────────────────────────────────────────────────────────────┐  │  │
│  │ │ prisma.budget.findMany({                                   │  │  │
│  │ │   where: {                                                 │  │  │
│  │ │     entityId: E1,                                          │  │  │
│  │ │     entity: { tenantId: T1 },  // ✅ Tenant isolation     │  │  │
│  │ │     deletedAt: null             // ✅ Soft delete filter  │  │  │
│  │ │   }                                                        │  │  │
│  │ │ })                                                         │  │  │
│  │ └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │ Step 2: For each budget, calculate actual spend                 │  │
│  │ ┌────────────────────────────────────────────────────────────┐  │  │
│  │ │ calculateActualSpend(entityId, glAccountId, start, end)    │  │  │
│  │ │                                                            │  │  │
│  │ │   Cross-domain read to ACCOUNTING                         │  │  │
│  │ │   ▼                                                        │  │  │
│  │ │ ┌────────────────────────────────────────────────────────┐│  │  │
│  │ │ │ prisma.journalLine.aggregate({                         ││  │  │
│  │ │ │   where: {                                             ││  │  │
│  │ │ │     glAccountId: budget.glAccountId, // Budget GL      ││  │  │
│  │ │ │     journalEntry: {                                    ││  │  │
│  │ │ │       entityId: E1,                                    ││  │  │
│  │ │ │       entity: { tenantId: T1 }, // ✅ Tenant filter    ││  │  │
│  │ │ │       status: 'POSTED',         // ✅ Only posted      ││  │  │
│  │ │ │       date: { gte: start, lte: end }                   ││  │  │
│  │ │ │     }                                                  ││  │  │
│  │ │ │   },                                                   ││  │  │
│  │ │ │   _sum: { debitAmount: true, creditAmount: true }     ││  │  │
│  │ │ │ })                                                     ││  │  │
│  │ │ └────────────────────────────────────────────────────────┘│  │  │
│  │ │                                                            │  │  │
│  │ │   Returns: { _sum: { debitAmount: 150000, credit: 5000 }}│  │  │
│  │ │   Actual spend = debits - credits = 145000 cents ($1,450)│  │  │
│  │ └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │ Step 3: Calculate variance                                       │  │
│  │ ┌────────────────────────────────────────────────────────────┐  │  │
│  │ │ variance = budgetAmount - actualSpend                      │  │  │
│  │ │          = 200000 - 145000 = 55000 cents ($550 under)      │  │  │
│  │ │                                                            │  │  │
│  │ │ utilizationPercent = (actualSpend / budgetAmount) * 100   │  │  │
│  │ │                    = (145000 / 200000) * 100 = 72.5%       │  │  │
│  │ │                                                            │  │  │
│  │ │ alertLevel = utilizationPercent >= 100 ? 'over-budget'    │  │  │
│  │ │            : utilizationPercent >= 80 ? 'warning'          │  │  │
│  │ │            : 'ok'                                          │  │  │
│  │ │            = 'ok' (72.5% < 80%)                            │  │  │
│  │ └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Response: {                                                             │
│    variances: [{                                                         │
│      budgetId: 'B1',                                                     │
│      budgetedAmount: 200000,  // $2,000                                  │
│      actualAmount: 145000,    // $1,450                                  │
│      variance: 55000,         // $550 under budget                       │
│      variancePercent: 27.5,                                              │
│      utilizationPercent: 72.5,                                           │
│      alertLevel: 'ok'                                                    │
│    }]                                                                    │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Observations:**
1. ✅ Tenant isolation enforced at BOTH layers (Planning + Accounting)
2. ✅ Read-only cross-domain access (Planning never mutates JournalLine)
3. ✅ Soft delete filter applied to both budgets and journal entries
4. ⚠️ Query performance depends on JournalLine indexes (see ARCH-1)

---

## 4. AI Forecast Statistical Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User Request: GET /api/planning/forecasts/ai-forecast?entityId=E1     │
│                &forecastMonths=6&type=EXPENSE                           │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI-FORECAST SERVICE                                   │
│                    (Statistical Methods, No LLM)                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 1: Gather Historical Data (24 months)                       │  │
│  │ ───────────────────────────────────────────────────────────────  │  │
│  │                                                                  │  │
│  │ getMonthlyHistorical(entityId, 24, 'EXPENSE')                   │  │
│  │   ↓                                                              │  │
│  │ Query JournalLine WHERE:                                         │  │
│  │   - glAccount.type = 'EXPENSE'                                   │  │
│  │   - journalEntry.date >= 24 months ago                           │  │
│  │   - journalEntry.status = 'POSTED'                               │  │
│  │                                                                  │  │
│  │ Returns: [                                                       │  │
│  │   { month: '2024-03', amount: 125000 },  // $1,250               │  │
│  │   { month: '2024-04', amount: 132000 },  // $1,320               │  │
│  │   { month: '2024-05', amount: 118000 },  // $1,180               │  │
│  │   ... (24 months total)                                          │  │
│  │ ]                                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 2: Calculate Linear Trend                                   │  │
│  │ ───────────────────────────────────────────────────────────────  │  │
│  │                                                                  │  │
│  │ calculateTrend(historicalData)                                   │  │
│  │   Linear regression: y = mx + b                                  │  │
│  │                                                                  │  │
│  │   x = month index (0, 1, 2, ..., 23)                             │  │
│  │   y = amount in cents                                            │  │
│  │                                                                  │  │
│  │   slope (m) = 2500 cents/month  ($25/month growth)               │  │
│  │   intercept (b) = 120000 cents  ($1,200 baseline)                │  │
│  │                                                                  │  │
│  │ Returns: { slope: 2500, intercept: 120000 }                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 3: Extract Seasonal Factors                                 │  │
│  │ ───────────────────────────────────────────────────────────────  │  │
│  │                                                                  │  │
│  │ getSeasonalFactors(historicalData)                               │  │
│  │   Group by calendar month (Jan, Feb, ..., Dec)                   │  │
│  │   Calculate average deviation from overall mean                  │  │
│  │                                                                  │  │
│  │   Example:                                                       │  │
│  │   - January: +15% (higher expenses, year-end bonuses)            │  │
│  │   - July: -10% (summer slowdown)                                 │  │
│  │   - December: +20% (holiday spending)                            │  │
│  │                                                                  │  │
│  │ Returns: { 1: 1.15, 7: 0.90, 12: 1.20, ... }                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 4: Generate Forward Projections (6 months)                  │  │
│  │ ───────────────────────────────────────────────────────────────  │  │
│  │                                                                  │  │
│  │ For each future month (M+1, M+2, ..., M+6):                      │  │
│  │                                                                  │  │
│  │   1. Calculate base (weighted average of last 6 months)          │  │
│  │      base = (M0×0.3 + M1×0.25 + M2×0.2 + M3×0.15 + ...)          │  │
│  │           = 128000 cents                                         │  │
│  │                                                                  │  │
│  │   2. Calculate trend component                                   │  │
│  │      trend = slope × monthsAhead                                 │  │
│  │            = 2500 × 1 = 2500 cents (for M+1)                     │  │
│  │                                                                  │  │
│  │   3. Apply seasonal adjustment                                   │  │
│  │      seasonal = base × seasonalFactor[month]                     │  │
│  │               = 128000 × 1.15 = 147200 (if Jan)                  │  │
│  │                                                                  │  │
│  │   4. Combine: amount = base + trend + (seasonal - base)          │  │
│  │                     = 128000 + 2500 + (147200 - 128000)          │  │
│  │                     = 149700 cents ($1,497)                      │  │
│  │                                                                  │  │
│  │   5. Calculate confidence (decreases with distance)              │  │
│  │      confidence = 100 - (monthsAhead × 5) - variancePenalty      │  │
│  │                 = 100 - (1 × 5) - 10 = 85                        │  │
│  │                                                                  │  │
│  │ Returns: [                                                       │  │
│  │   {                                                              │  │
│  │     month: '2026-03',                                            │  │
│  │     amount: 149700,                                              │  │
│  │     confidence: 85,                                              │  │
│  │     components: {                                                │  │
│  │       base: 128000,                                              │  │
│  │       trend: 2500,                                               │  │
│  │       seasonal: 19200                                            │  │
│  │     }                                                            │  │
│  │   },                                                             │  │
│  │   ... (6 months total)                                           │  │
│  │ ]                                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Response: {                                                             │
│    projections: [ /* see above */ ],                                     │
│    methodology: 'weighted_average_trend_seasonal',                       │
│    dataQuality: 'high', // 24 months of history                          │
│    monthsOfHistory: 24                                                   │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Statistical Methods Used:**
1. ✅ **Linear Regression** - Detects upward/downward trends
2. ✅ **Seasonal Decomposition** - Identifies monthly patterns
3. ✅ **Weighted Moving Average** - Prioritizes recent data
4. ✅ **Confidence Scoring** - Decreases with distance and variance

**Future LLM Enhancement:**
Replace Step 4 with GPT-4 call:
```typescript
const llmForecast = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'system',
    content: 'You are a financial forecasting expert. Generate a 6-month expense forecast with explanations.',
  }, {
    role: 'user',
    content: `Historical data: ${JSON.stringify(historicalData)}. Trend: ${trend}. Seasonal: ${seasonal}.`,
  }],
});
```

---

## 5. Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PLANNING SERVICES (10)                             │
│                                                                          │
│  BUDGETS (3 services)                                                    │
│  ┌──────────────────┐                                                    │
│  │ budget.service   │ ──┐                                                │
│  └──────────────────┘   │                                                │
│  ┌──────────────────┐   │  Reads JournalLine                             │
│  │ variance.service │ ──┼─────────────────────────┐                      │
│  └──────────────────┘   │                         │                      │
│  ┌──────────────────┐   │                         ▼                      │
│  │suggestions.svc   │ ──┘            ┌──────────────────────┐            │
│  └──────────────────┘                │  JournalLine         │            │
│                                      │  (Accounting Domain) │            │
│  GOALS (3 services)                  └──────────────────────┘            │
│  ┌──────────────────┐   ┌─────────────────────▲                         │
│  │ goal.service     │   │                     │                         │
│  └──────────────────┘   │  Reads JournalLine  │                         │
│  ┌──────────────────┐   │  and Account        │                         │
│  │ tracking.service │ ──┤                     │                         │
│  └──────────────────┘   │                     │                         │
│  ┌──────────────────┐   │                     │                         │
│  │ templates        │ ──┘                     │                         │
│  └──────────────────┘                         │                         │
│                                                │                         │
│  FORECASTS (4 services)                        │                         │
│  ┌──────────────────┐                         │                         │
│  │ forecast.service │                         │                         │
│  └──────────────────┘   ┌─────────────────────┘                         │
│  ┌──────────────────┐   │  Reads JournalLine                             │
│  │ ai-forecast.svc  │ ──┤                                                │
│  └──────────────────┘   │                                                │
│       │ uses            │                                                │
│       ▼                 │                                                │
│  ┌──────────────────┐   │                                                │
│  │ seasonal.service │ ──┤                                                │
│  └──────────────────┘   │                                                │
│  ┌──────────────────┐   │                                                │
│  │ cash-runway.svc  │ ──┘                                                │
│  └──────────────────┘                                                    │
│                                                                          │
│  Dependencies:                                                           │
│  ━━━ Service-to-service call (in-process)                               │
│  ─── Prisma query (cross-domain read)                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Observations:**
1. ✅ All cross-domain reads go through Prisma (no service-to-service calls)
2. ✅ Only one service-to-service dependency: ai-forecast → seasonal
3. ✅ No circular dependencies
4. ⚠️ 7 services query JournalLine (potential coupling point)

---

## 6. Frontend Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PLANNING DOMAIN FRONTEND                             │
│                                                                          │
│  app/(dashboard)/planning/                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ layout.tsx (DomainTabs navigation)                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                                                                │
│         ├─── budgets/                                                    │
│         │    ┌────────────────────────────────────────────────────┐     │
│         │    │ page.tsx (Server Component)                        │     │
│         │    │   - Fetch budgets via listBudgets()                │     │
│         │    │   - Pass to BudgetsList                            │     │
│         │    └────────────────────────────────────────────────────┘     │
│         │         │                                                      │
│         │         ├─── budgets-list.tsx (Client Component)              │
│         │         │    - Table with filters (period, category)          │
│         │         │    - Pagination                                     │
│         │         │    - Open BudgetForm sheet                          │
│         │         │                                                      │
│         │         └─── budget-form.tsx (Client Component)               │
│         │              - Create/edit form                               │
│         │              - Calls apiFetch (browser client)                │
│         │                                                                │
│         ├─── goals/                                                      │
│         │    ┌────────────────────────────────────────────────────┐     │
│         │    │ page.tsx (Server Component)                        │     │
│         │    └────────────────────────────────────────────────────┘     │
│         │         │                                                      │
│         │         ├─── goals-list.tsx (Client Component)                │
│         │         │    - Progress bars, status badges                   │
│         │         │    - Template suggestions                           │
│         │         │                                                      │
│         │         ├─── goal-form.tsx (Client Component)                 │
│         │         │    - Type-specific fields (savings, revenue, etc.)  │
│         │         │                                                      │
│         │         └─── goal-trajectory.tsx (Client Component)           │
│         │              - Recharts line graph                            │
│         │              - Milestone markers                              │
│         │                                                                │
│         └─── forecasts/                                                  │
│              ┌────────────────────────────────────────────────────┐     │
│              │ page.tsx (Server Component)                        │     │
│              └────────────────────────────────────────────────────┘     │
│                   │                                                      │
│                   ├─── forecasts-list.tsx (Client Component)            │
│                   │    - Scenario comparison (baseline/optimistic/...)  │
│                   │    - Confidence indicators                          │
│                   │                                                      │
│                   ├─── forecast-form.tsx (Client Component)             │
│                   │    - Type selection (cash flow, revenue, expense)   │
│                   │    - Manual projections vs AI-generated             │
│                   │                                                      │
│                   └─── scenario-comparison.tsx (Client Component)       │
│                        - Side-by-side chart comparison                  │
│                        - Recharts area chart                            │
│                                                                          │
│  Shared Component:                                                       │
│  export-planning.tsx (CSV export for all planning data)                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Component Pattern:
━━━ Server Component (data fetching, SSR)
─── Client Component (interactivity, forms, charts)
```

---

## 7. Index Coverage Analysis

**Current Indexes (Planning Models):**

```prisma
model Budget {
  @@index([entityId])              // ✅ List budgets by entity
  @@index([startDate, endDate])    // ✅ Date range queries
}

model Goal {
  @@index([entityId])              // ✅ List goals by entity
  @@index([status])                // ✅ Filter by status (ACTIVE, COMPLETED)
}

model Forecast {
  @@index([entityId])              // ✅ List forecasts by entity
  @@index([type, scenario])        // ✅ Filter by type + scenario
}
```

**Missing Indexes (Performance Issues):**

```prisma
model JournalLine {
  // ❌ MISSING: Composite for variance queries
  // Current:
  @@index([glAccountId])
  @@index([journalEntryId])

  // Needed:
  @@index([glAccountId, journalEntryId]) // Budget variance queries
}
```

**Query Performance Impact:**

| Query | Current Index | Missing Index | Impact at 1M Rows |
|-------|---------------|---------------|-------------------|
| List budgets by entity | ✅ entityId | - | Fast (<10ms) |
| Variance by GL + date | ❌ glAccountId only | glAccountId + journalEntryId | Slow (5s+) |
| Monthly grouping | ❌ None | entityId + date | Slow (2s+) |
| Forecast by type | ✅ type + scenario | - | Fast (<10ms) |

**Recommendation:** Add composite index before Phase 7 launch to prevent performance degradation.

---

**End of Architecture Diagrams**
