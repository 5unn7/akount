# Dashboard Redesign Implementation Plan

**Date:** 2026-01-30
**Type:** feature
**Status:** Planning
**Related:**
- [Dashboard Redesign Brainstorm](../brainstorms/2026-01-30-dashboard-redesign-brainstorm.md)
- [Analytics Feature Spec](../features/05-analytics.md)
- [Product Overview](../product/overview.md)

---

## Summary

Transform the current placeholder dashboard into a comprehensive financial command center with real-time data, interactive charts, action items, and multi-entity support. This Phase 1 MVP focuses on replacing placeholder metrics with real data and implementing core widgets (financial metrics cards, cash flow chart, recent transactions, action items, category breakdowns) with a collapsible sidebar and entity selector.

**Target:** 2-3 weeks for Phase 1 MVP

---

## User Story

**As a** solo entrepreneur or small business owner managing multiple entities,

**I want to** see my real financial data at-a-glance on the dashboard (revenue, expenses, cash flow, recent transactions, and action items),

**So that** I can quickly assess my business health, identify what needs my attention, and make informed financial decisions without navigating through multiple pages.

---

## Success Criteria

### Functional
- [ ] Dashboard displays real financial metrics (revenue, expenses, net income, profit margin) from database
- [ ] Cash flow chart shows money in/out over the last 30 days with actual transaction data
- [ ] Recent transactions widget displays last 10 transactions across selected entities
- [ ] Action items widget shows counts for unpaid invoices, bills due, and accounts needing reconciliation
- [ ] Category breakdown charts show top expense and income categories with percentages
- [ ] Entity selector allows switching between "All Entities" (aggregated) and individual entity views
- [ ] Sidebar can collapse to icons-only and expand to full labels (state persisted)

### Performance
- [ ] Initial dashboard load completes in <2 seconds (target <1.5s)
- [ ] Each widget loads independently with skeleton loaders
- [ ] Database queries optimized (no N+1 queries, proper indexes)
- [ ] API responses cached appropriately (5-minute stale time for metrics)

### User Experience
- [ ] Mobile responsive (single column on mobile, 2-column on tablet, 3-column on desktop)
- [ ] Multi-currency amounts converted to user's primary currency in "All Entities" view
- [ ] Loading skeletons shown while data fetches (no blank screens)
- [ ] Error boundaries per widget (one widget failure doesn't break entire dashboard)
- [ ] Smooth transitions when collapsing/expanding sidebar

### Quality
- [ ] All API endpoints have proper authentication and tenant isolation
- [ ] Input validation with Zod schemas on all endpoints
- [ ] TypeScript strict mode with no `any` types in new code
- [ ] Accessible UI components (keyboard navigation, ARIA labels)

---

## Technical Approach

### Architecture

**Components Affected:**
- **Frontend:**
  - `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Main dashboard page (Server Component)
  - `apps/web/src/components/dashboard/` - New dashboard widgets (mix of Server + Client Components)
  - `apps/web/src/components/layout/Sidebar.tsx` - Enhanced with collapse functionality
  - `apps/web/src/components/layout/Navbar.tsx` - Enhanced with entity selector
  - `apps/web/src/lib/hooks/useDashboard.ts` - Custom hooks for data fetching (TanStack Query)

- **API:**
  - `apps/api/src/routes/dashboard.ts` - New dashboard-specific endpoints
  - `apps/api/src/services/dashboardService.ts` - Business logic for dashboard data aggregation
  - `apps/api/src/schemas/dashboard.ts` - Zod validation schemas for dashboard requests

- **Database:**
  - No new models required (uses existing: Transaction, Invoice, Bill, Account, Entity, Category, GLAccount)
  - New indexes on frequently queried columns (see Data Model Changes section)

**Key Decisions:**

1. **Server vs Client Components**:
   - **Server Components (Default)**: Dashboard page layout, static card structures, initial data fetching
     - Benefit: Faster initial load, reduced JS bundle, SEO-friendly
   - **Client Components**: Charts (Recharts), entity selector dropdown, sidebar collapse toggle, data refetch triggers
     - Marked with `'use client'` directive
     - Use TanStack Query for data fetching and caching

2. **Data Flow**:
   ```
   User → Next.js Server Component (Initial SSR)
       ↓
   Parallel fetch dashboard data via API endpoints
       ↓
   Render page with initial data + loading skeletons for slow widgets
       ↓
   Client components hydrate and enable interactivity
       ↓
   TanStack Query handles refetching and caching
   ```

3. **Authentication**:
   - All API endpoints require Bearer token (Clerk JWT)
   - Auth middleware extracts userId from token
   - Tenant lookup: `TenantUser.findFirst({ where: { user: { clerkUserId } } })`
   - All queries filtered by `tenantId` (tenant isolation)
   - Optional entity filtering: `?entity={entityId}` or `?entity=all` (default)

### Data Model Changes

**No new Prisma models required.** Existing schema supports all dashboard features.

**New Database Indexes** (for performance):

```sql
-- apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_dashboard_indexes/migration.sql

-- Index for transaction date range queries (cash flow, recent transactions)
CREATE INDEX IF NOT EXISTS "Transaction_entityId_createdAt_idx"
ON "Transaction"("entityId", "createdAt" DESC);

-- Index for invoice status queries (action items - unpaid invoices)
CREATE INDEX IF NOT EXISTS "Invoice_entityId_status_idx"
ON "Invoice"("entityId", "status");

-- Index for bill due date queries (action items - bills due soon)
CREATE INDEX IF NOT EXISTS "Bill_entityId_status_dueDate_idx"
ON "Bill"("entityId", "status", "dueDate");

-- Index for account reconciliation queries (action items)
CREATE INDEX IF NOT EXISTS "Account_entityId_lastReconciledAt_idx"
ON "Account"("entityId", "lastReconciledAt");

-- Index for category aggregation queries (category breakdowns)
CREATE INDEX IF NOT EXISTS "Transaction_entityId_categoryId_idx"
ON "Transaction"("entityId", "categoryId");
```

**Migration Checklist:**
- [ ] Tenant isolation enforced (all queries filter by tenantId)
- [x] Indexes on frequently queried fields (see above)
- [x] Integer cents for monetary amounts (existing schema already uses Int for amounts)
- [x] Audit fields (createdAt, updatedAt exist on all relevant models)
- [x] No CASCADE deletes on financial data (existing schema uses Restrict)

### API Endpoints

**New Routes in `apps/api/src/routes/dashboard.ts`:**

#### 1. GET /api/dashboard/metrics
**Purpose:** Aggregate financial metrics (revenue, expenses, net income, profit margin)

**Query Parameters:**
- `entity` (optional): Entity ID or "all" (default: "all")
- `period` (optional): "30d" | "90d" | "ytd" | "custom" (default: "30d")
- `startDate` (optional, ISO date): For custom period
- `endDate` (optional, ISO date): For custom period

**Response:**
```typescript
{
  revenue: number,        // Total income in cents
  expenses: number,       // Total expenses in cents
  netIncome: number,      // revenue - expenses
  profitMargin: number,   // (netIncome / revenue) * 100
  revenueChange: number,  // Percentage change vs previous period
  expensesChange: number, // Percentage change vs previous period
  currency: string,       // Primary currency (USD, EUR, etc.)
  period: {
    startDate: string,    // ISO date
    endDate: string       // ISO date
  }
}
```

**Business Logic:**
- Query `Transaction` table for income and expense categories within date range
- Join with `Category` to classify transactions (INCOME vs EXPENSE)
- Aggregate amounts by category type
- Multi-currency: Convert all amounts to user's primary currency using latest FX rates
- Calculate percentage changes by comparing to previous period (same duration)

---

#### 2. GET /api/dashboard/cashflow
**Purpose:** Cash flow data for line chart (money in vs money out over time)

**Query Parameters:**
- `entity` (optional): Entity ID or "all" (default: "all")
- `period` (optional): "30d" | "90d" | "ytd" (default: "30d")
- `granularity` (optional): "daily" | "weekly" | "monthly" (default: "daily")

**Response:**
```typescript
{
  dataPoints: Array<{
    date: string,          // ISO date (YYYY-MM-DD)
    moneyIn: number,       // Income in cents
    moneyOut: number,      // Expenses in cents (absolute value)
    netCashFlow: number    // moneyIn - moneyOut
  }>,
  totals: {
    totalMoneyIn: number,
    totalMoneyOut: number,
    netCashFlow: number
  },
  currency: string
}
```

**Business Logic:**
- Query `Transaction` grouped by date (truncated by granularity)
- Sum income and expense amounts per date bucket
- Fill gaps with zero values (ensure continuous time series)
- Multi-currency conversion to primary currency

---

#### 3. GET /api/dashboard/transactions
**Purpose:** Recent transactions list (last N transactions)

**Query Parameters:**
- `entity` (optional): Entity ID or "all" (default: "all")
- `limit` (optional): Number of transactions to return (default: 10, max: 50)

**Response:**
```typescript
{
  transactions: Array<{
    id: string,
    date: string,              // ISO date
    description: string,
    category: {
      id: string,
      name: string,
      type: "INCOME" | "EXPENSE" | "TRANSFER"
    },
    entity: {
      id: string,
      name: string
    },
    amount: number,            // In cents (negative for expenses)
    currency: string,
    status: string,            // e.g., "POSTED", "PENDING"
    isReconciled: boolean
  }>,
  total: number                // Total count (for pagination)
}
```

**Business Logic:**
- Query `Transaction` with joins to `Category` and `Entity`
- Order by `createdAt` DESC
- Limit results to requested count
- Return amounts in original currency (no conversion for transaction list)

---

#### 4. GET /api/dashboard/action-items
**Purpose:** Actionable alerts (unpaid invoices, bills due, accounts needing reconciliation)

**Query Parameters:**
- `entity` (optional): Entity ID or "all" (default: "all")

**Response:**
```typescript
{
  unpaidInvoices: {
    count: number,
    totalAmount: number,      // In cents
    currency: string
  },
  billsDueSoon: {
    count: number,            // Due within 7 days
    totalAmount: number,
    currency: string
  },
  accountsNeedingReconciliation: {
    count: number,
    accounts: Array<{
      id: string,
      name: string,
      daysSinceLastReconciliation: number
    }>
  },
  taxDeadlines: Array<{     // Optional for future enhancement
    name: string,
    dueDate: string,
    daysUntilDue: number
  }>
}
```

**Business Logic:**
- **Unpaid Invoices**: Query `Invoice` where `status IN ('SENT', 'OVERDUE', 'PARTIALLY_PAID')`
- **Bills Due Soon**: Query `Bill` where `status = 'PENDING'` AND `dueDate BETWEEN NOW() AND NOW() + 7 days`
- **Accounts Needing Reconciliation**: Query `Account` where `lastReconciledAt < NOW() - 30 days` OR `lastReconciledAt IS NULL`
- Aggregate amounts and counts
- Multi-currency conversion to primary currency

---

#### 5. GET /api/dashboard/categories
**Purpose:** Category breakdown for donut/bar charts (top expense and income categories)

**Query Parameters:**
- `entity` (optional): Entity ID or "all" (default: "all")
- `period` (optional): "30d" | "90d" | "ytd" (default: "30d")
- `type` (optional): "INCOME" | "EXPENSE" | "both" (default: "both")
- `limit` (optional): Number of top categories to return (default: 5, max: 10)

**Response:**
```typescript
{
  income: Array<{
    categoryId: string,
    categoryName: string,
    amount: number,           // Total in cents
    percentage: number,       // % of total income
    transactionCount: number
  }>,
  expenses: Array<{
    categoryId: string,
    categoryName: string,
    amount: number,           // Total in cents
    percentage: number,       // % of total expenses
    transactionCount: number
  }>,
  currency: string
}
```

**Business Logic:**
- Query `Transaction` grouped by `categoryId`
- Join with `Category` to get category names and types
- Filter by date range and entity
- Calculate totals and percentages
- Order by amount DESC, limit to top N
- Multi-currency conversion

---

**Authentication (All Routes):**
```typescript
// All routes use auth middleware
{
  onRequest: [authMiddleware]
}

// Auth middleware extracts userId and validates tenant access
```

**Error Responses (Consistent format):**
```typescript
{
  error: string,           // Error type (e.g., "Unauthorized", "Not Found")
  message: string,         // User-friendly message
  details?: any            // Optional additional context (validation errors)
}
```

**Rate Limiting (Future Enhancement):**
- Implement rate limiting per tenant (e.g., 100 requests/minute)
- Use Redis for distributed rate limiting if deploying to multiple servers

---

### UI Components

**Pages:**

1. **`apps/web/src/app/(dashboard)/dashboard/page.tsx`** (Server Component)
   - Main dashboard page layout
   - Fetches initial data server-side for fast load
   - Passes data to client components as props
   - Uses Suspense boundaries for streaming

2. **`apps/web/src/app/(dashboard)/dashboard/loading.tsx`** (Loading UI)
   - Full-page skeleton loader
   - Shows while server component fetches data

3. **`apps/web/src/app/(dashboard)/dashboard/error.tsx`** (Error Boundary)
   - Global error handler for dashboard page
   - Shows user-friendly error message with retry button

---

**Dashboard Widgets (in `apps/web/src/components/dashboard/`):**

#### 1. `FinancialMetricsCards.tsx` (Client Component)
**Purpose:** 4 metric cards showing revenue, expenses, net income, profit margin

**Props:**
```typescript
{
  entityId?: string,     // Optional entity filter
  period?: string        // "30d" | "90d" | "ytd"
}
```

**Features:**
- Fetches data from `/api/dashboard/metrics` using TanStack Query
- Displays cards in responsive grid (2x2 on tablet, 4x1 on desktop)
- Shows trend indicators (↑ ↓) with percentage change
- Color coding: Green for positive, red for negative
- Loading skeleton while fetching
- Error state with retry button

**Components Used:**
- `Card`, `CardHeader`, `CardTitle`, `CardContent` from shadcn/ui
- Icons from `lucide-react`: `DollarSign`, `CreditCard`, `Activity`, `TrendingUp`

---

#### 2. `CashFlowChart.tsx` (Client Component)
**Purpose:** Line chart showing money in vs money out over time

**Props:**
```typescript
{
  entityId?: string,
  period?: string
}
```

**Features:**
- Fetches data from `/api/dashboard/cashflow`
- Renders using Recharts `LineChart` component
- Two lines: Money In (green), Money Out (red)
- Optional: Net cash flow area chart (green/red based on positive/negative)
- Interactive: Hover to see exact values, click data point to drill down (future)
- Responsive: Adjusts to container width
- Loading skeleton

**Recharts Configuration:**
```typescript
<LineChart data={dataPoints}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip content={<CustomTooltip />} />
  <Legend />
  <Line type="monotone" dataKey="moneyIn" stroke="#10b981" name="Money In" />
  <Line type="monotone" dataKey="moneyOut" stroke="#ef4444" name="Money Out" />
</LineChart>
```

---

#### 3. `RecentTransactionsList.tsx` (Client Component)
**Purpose:** Table/list of last 10 transactions

**Props:**
```typescript
{
  entityId?: string,
  limit?: number
}
```

**Features:**
- Fetches data from `/api/dashboard/transactions`
- Renders as Card with table inside
- Columns: Date, Description, Category, Entity (if "All Entities"), Amount
- Amount color-coded: Green (income), red (expense)
- Click transaction row to navigate to transaction detail page (future)
- Mobile: Card-based layout instead of table
- Loading skeleton with 10 rows

**Alternative UI (Mobile):**
- Stack cards vertically
- Each card shows transaction details

---

#### 4. `ActionItemsWidget.tsx` (Client Component)
**Purpose:** Display alerts and actionable items

**Props:**
```typescript
{
  entityId?: string
}
```

**Features:**
- Fetches data from `/api/dashboard/action-items`
- Displays 3-4 sections:
  1. Unpaid Invoices (count + total amount)
  2. Bills Due Soon (count + total amount)
  3. Accounts Needing Reconciliation (count)
  4. Tax Deadlines (optional for future)
- Each item clickable → navigates to relevant page
- Badge showing count (e.g., "3 unpaid invoices")
- Color indicators: Orange (attention needed), red (urgent)

---

#### 5. `CategoryBreakdownCharts.tsx` (Client Component)
**Purpose:** Donut or bar charts showing top expense and income categories

**Props:**
```typescript
{
  entityId?: string,
  period?: string
}
```

**Features:**
- Fetches data from `/api/dashboard/categories`
- Two charts side-by-side (or stacked on mobile):
  1. Top Expense Categories (donut chart)
  2. Top Income Categories (donut chart)
- Shows percentage and absolute amount
- Uses Recharts `PieChart` with `Cell` for custom colors
- Legend shows category names
- Click category to filter transactions by category (future)

**Chart Colors:**
- Use Tailwind chart-1 through chart-5 colors
- Assign colors consistently per category

---

#### 6. `EntitySelector.tsx` (Client Component)
**Purpose:** Dropdown to switch between "All Entities" and individual entities

**Location:** Integrated into `Navbar.tsx`

**Props:**
```typescript
{
  entities: Array<{ id: string, name: string, type: string }>,
  selectedEntityId: string | "all",
  onEntityChange: (entityId: string) => void
}
```

**Features:**
- Renders as `DropdownMenu` from shadcn/ui
- Options: "All Entities" (with icon), divider, individual entities with icons
- Selected state highlighted
- Updates URL query param: `?entity={id}`
- Triggers data refetch on change (TanStack Query invalidation)

**URL State Management:**
```typescript
const searchParams = useSearchParams()
const router = useRouter()

function handleEntityChange(entityId: string) {
  const params = new URLSearchParams(searchParams.toString())
  params.set('entity', entityId)
  router.push(`/dashboard?${params.toString()}`)
}
```

---

#### 7. `CollapsibleSidebar.tsx` (Enhanced Sidebar)
**Purpose:** Sidebar that collapses to icons-only or expands to full labels

**Enhancement to:** `apps/web/src/components/layout/Sidebar.tsx`

**State Management:**
```typescript
const [isCollapsed, setIsCollapsed] = useState(false)

// Persist state to localStorage
useEffect(() => {
  const collapsed = localStorage.getItem('sidebar-collapsed') === 'true'
  setIsCollapsed(collapsed)
}, [])

function toggleSidebar() {
  setIsCollapsed(!isCollapsed)
  localStorage.setItem('sidebar-collapsed', String(!isCollapsed))
}
```

**Features:**
- Collapse button (ChevronLeft / ChevronRight icon) in sidebar header
- Width: 256px (expanded) → 64px (collapsed)
- Show only icons when collapsed (hide labels)
- Tooltip on hover (when collapsed) showing label
- Smooth transition animation (300ms)
- Adjust main content area padding when collapsed (`md:pl-16` instead of `md:pl-72`)

---

**Design System Consistency:**

- **Colors:**
  - Primary: Orange (`text-orange-600`, `bg-orange-500`)
  - Secondary: Violet (`text-violet-600`, `bg-violet-500`)
  - Neutral: Slate (`text-slate-600`, `bg-slate-100`)
  - Success: Green (`text-green-600`, `bg-green-500`)
  - Danger: Red (`text-red-600`, `bg-red-500`)

- **Typography:**
  - Headings: Newsreader (`font-heading`)
  - Body: Manrope (`font-sans`)
  - Monospace (amounts): JetBrains Mono (`font-mono`)

- **Components:**
  - All components use existing shadcn/ui components
  - Consistent spacing: `gap-4`, `p-4`, `space-y-4`
  - Card border radius: `rounded-lg`
  - Shadows: `shadow-sm` (cards), `shadow-md` (dropdowns)

---

## Implementation Phases

### Phase 1: Database & Backend (Week 1: Days 1-3)

**Goal:** Set up API endpoints and database optimizations

#### Day 1: API Structure & Schemas

**Tasks:**
- [ ] Create `apps/api/src/routes/dashboard.ts` file
- [ ] Create `apps/api/src/schemas/dashboard.ts` with Zod schemas:
  - `dashboardMetricsQuerySchema`
  - `dashboardCashflowQuerySchema`
  - `dashboardTransactionsQuerySchema`
  - `dashboardCategoriesQuerySchema`
- [ ] Register dashboard routes in `apps/api/src/index.ts`
- [ ] Set up route structure with placeholder handlers

**Acceptance Criteria:**
- Routes respond with 200 OK (placeholder data)
- Zod validation working for query parameters
- TypeScript types generated from Zod schemas

---

#### Day 2: Business Logic & Database Queries

**Tasks:**
- [ ] Create `apps/api/src/services/dashboardService.ts`
- [ ] Implement `getFinancialMetrics()` function:
  - Query transactions for revenue and expenses
  - Calculate net income and profit margin
  - Compare to previous period for percentage changes
- [ ] Implement `getCashFlowData()` function:
  - Aggregate transactions by date (daily/weekly/monthly)
  - Group by income vs expense
  - Fill gaps in time series
- [ ] Implement `getRecentTransactions()` function:
  - Query with joins to Category and Entity
  - Apply entity filter
  - Return formatted results
- [ ] Implement `getActionItems()` function:
  - Query unpaid invoices
  - Query bills due soon
  - Query accounts needing reconciliation
- [ ] Implement `getCategoryBreakdown()` function:
  - Group transactions by category
  - Calculate totals and percentages
  - Return top N categories

**Acceptance Criteria:**
- All service functions return correct data from test database
- Multi-currency amounts converted to primary currency
- Queries optimized (use `select` to limit columns, proper joins)
- No N+1 query problems

---

#### Day 3: Database Indexes & Testing

**Tasks:**
- [ ] Create Prisma migration for dashboard indexes (see Data Model Changes)
- [ ] Run migration on development database
- [ ] Test query performance with realistic data volume (10k+ transactions)
- [ ] Write unit tests for dashboard service functions
- [ ] Test tenant isolation (ensure one tenant can't see another's data)
- [ ] Test entity filtering (verify "all" vs specific entity results)
- [ ] Add request logging for debugging

**Acceptance Criteria:**
- Migration succeeds without errors
- Queries execute in <200ms with indexed columns
- All unit tests pass
- Tenant isolation verified (manual testing with 2 test tenants)

**Review Points:**
- [x] Run `security-sentinel` on dashboard API endpoints (auth, input validation)
- [ ] Run `performance-oracle` on database queries (indexes, N+1 checks)
- [ ] Run `financial-data-validator` on metrics calculations (accuracy, currency handling)

---

### Phase 2: UI Components & Widgets (Week 1-2: Days 4-7)

**Goal:** Build dashboard widgets and integrate with API

#### Day 4: Setup & Financial Metrics Cards

**Tasks:**
- [ ] Install dependencies:
  - `npm install @tanstack/react-query recharts`
  - `npm install @tanstack/react-query-devtools --save-dev`
- [ ] Set up TanStack Query provider in `apps/web/src/app/layout.tsx`
- [ ] Create `apps/web/src/lib/hooks/useDashboard.ts` with custom hooks:
  - `useDashboardMetrics(entityId, period)`
  - `useDashboardCashflow(entityId, period)`
  - `useDashboardTransactions(entityId, limit)`
  - `useDashboardActionItems(entityId)`
  - `useDashboardCategories(entityId, period)`
- [ ] Create `apps/web/src/components/dashboard/FinancialMetricsCards.tsx`
- [ ] Fetch real data and display metrics cards
- [ ] Add loading skeletons
- [ ] Add error boundaries

**Acceptance Criteria:**
- TanStack Query setup complete (can see devtools in browser)
- Metrics cards display real data from API
- Loading states shown while fetching
- Errors caught and displayed gracefully

---

#### Day 5: Cash Flow Chart & Transactions List

**Tasks:**
- [ ] Create `apps/web/src/components/dashboard/CashFlowChart.tsx`
- [ ] Integrate Recharts LineChart
- [ ] Fetch cash flow data with `useDashboardCashflow` hook
- [ ] Configure chart styling (colors, grid, tooltip, legend)
- [ ] Make chart responsive (container queries or media queries)
- [ ] Create `apps/web/src/components/dashboard/RecentTransactionsList.tsx`
- [ ] Fetch transactions data
- [ ] Display as table on desktop, cards on mobile
- [ ] Add click handlers (navigation to transaction detail - future)

**Acceptance Criteria:**
- Cash flow chart renders with real data
- Chart is interactive (hover tooltips work)
- Chart responsive (looks good on mobile, tablet, desktop)
- Transactions list displays last 10 transactions
- Mobile layout switches to card-based view

---

#### Day 6: Action Items & Category Breakdowns

**Tasks:**
- [ ] Create `apps/web/src/components/dashboard/ActionItemsWidget.tsx`
- [ ] Fetch action items data
- [ ] Display sections for unpaid invoices, bills due, accounts needing reconciliation
- [ ] Add click handlers (navigate to relevant pages)
- [ ] Create `apps/web/src/components/dashboard/CategoryBreakdownCharts.tsx`
- [ ] Integrate Recharts PieChart for donut charts
- [ ] Fetch category data
- [ ] Render two charts: Income categories, Expense categories
- [ ] Add legend and tooltips

**Acceptance Criteria:**
- Action items widget shows correct counts and amounts
- Items are clickable (navigation stubbed for future pages)
- Category charts render with real data
- Colors assigned consistently per category
- Percentages and amounts displayed correctly

---

#### Day 7: Entity Selector & Sidebar Collapse

**Tasks:**
- [ ] Create `apps/web/src/components/dashboard/EntitySelector.tsx`
- [ ] Integrate into `Navbar.tsx`
- [ ] Fetch entities list (reuse existing `/api/entities` endpoint)
- [ ] Implement entity switching with URL query params
- [ ] Invalidate TanStack Query caches on entity change (all dashboard data refetches)
- [ ] Enhance `Sidebar.tsx` with collapse functionality
- [ ] Add collapse button and state management
- [ ] Persist collapsed state to localStorage
- [ ] Adjust main content padding when sidebar collapsed
- [ ] Add smooth transition animations (Tailwind transitions or Framer Motion)

**Acceptance Criteria:**
- Entity selector dropdown works (shows "All Entities" + individual entities)
- Selecting entity updates URL and triggers data refetch
- Sidebar collapses to icons-only (64px width)
- Sidebar state persists across page reloads (localStorage)
- Smooth transition animation when collapsing/expanding

**Review Points:**
- [ ] Run `nextjs-app-router-reviewer` on dashboard page and components (Server/Client boundaries, async patterns)
- [ ] Run `kieran-typescript-reviewer` on all TypeScript files (type safety, modern patterns)
- [ ] Manual accessibility testing (keyboard navigation, screen reader)

---

### Phase 3: Integration, Polish & Testing (Week 2: Days 8-10)

**Goal:** Integrate all widgets, polish UI, and thoroughly test

#### Day 8: Dashboard Page Integration

**Tasks:**
- [ ] Update `apps/web/src/app/(dashboard)/dashboard/page.tsx`:
  - Remove placeholder metrics
  - Import and render all new dashboard widgets
  - Set up responsive grid layout (CSS Grid or Tailwind grid classes)
  - Organize widgets by priority (metrics → action items → charts → transactions)
- [ ] Implement entity filtering across all widgets
- [ ] Test "All Entities" aggregated view
- [ ] Test individual entity views
- [ ] Create `loading.tsx` with full-page skeleton
- [ ] Create `error.tsx` with error boundary and retry button

**Acceptance Criteria:**
- Dashboard shows all widgets in correct layout
- Entity selector filters all widgets correctly
- "All Entities" view aggregates data across entities
- Loading skeleton shown on initial page load
- Error boundary catches and displays errors gracefully

---

#### Day 9: Multi-Currency & Performance Testing

**Tasks:**
- [ ] Test multi-currency scenarios:
  - Create test entities with different currencies (USD, EUR, CAD)
  - Verify amounts converted correctly in "All Entities" view
  - Verify individual entity views show original currency
  - Test missing FX rate handling (fallback behavior)
- [ ] Performance testing:
  - Measure dashboard load time (target <2s)
  - Check for N+1 queries (use Prisma query logging)
  - Verify database indexes are used (EXPLAIN ANALYZE on Postgres)
  - Test with realistic data volume (1,000+ transactions, 10+ entities)
- [ ] Optimize if needed:
  - Add `select` clauses to Prisma queries (fetch only needed fields)
  - Add database indexes if queries are slow
  - Implement API response caching (Cache-Control headers)
  - Consider caching expensive aggregations (DashboardCache table - future)

**Acceptance Criteria:**
- Multi-currency conversion working correctly
- Dashboard loads in <2s with realistic data
- No N+1 queries detected
- Database indexes used in query execution plans

---

#### Day 10: Mobile Responsiveness & Final Polish

**Tasks:**
- [ ] Mobile responsiveness testing:
  - Test on mobile breakpoint (<640px): Single column layout
  - Test on tablet breakpoint (640-1024px): 2-column layout
  - Test on desktop breakpoint (>1024px): 3-column layout
  - Verify sidebar collapses by default on mobile (bottom nav or hamburger menu)
  - Test entity selector dropdown on small screens
  - Verify charts are readable on mobile (smaller font, fewer labels)
- [ ] UI polish:
  - Consistent spacing between widgets (`gap-4`, `space-y-4`)
  - Card shadows and borders consistent
  - Color usage consistent (success, danger, warning)
  - Typography hierarchy clear (headings, body, mono for amounts)
  - Loading skeletons match final widget dimensions
- [ ] Add empty states:
  - No transactions: "No transactions yet. Add your first transaction."
  - No entities: "Create your first entity to get started."
  - No action items: "All caught up! Nothing needs attention right now."
- [ ] Add metadata for SEO:
  - `generateMetadata()` in page.tsx with title and description

**Acceptance Criteria:**
- Dashboard looks good and functions well on mobile, tablet, desktop
- All widgets responsive and readable on small screens
- UI polish complete (spacing, colors, typography consistent)
- Empty states display helpful messages
- Metadata set for SEO

**Review Points:**
- [ ] Run `code-simplicity-reviewer` to identify unnecessary complexity or over-engineering
- [ ] Run `architecture-strategist` to validate overall design and component boundaries
- [ ] Manual testing on real devices (not just browser DevTools)

---

### Phase 4: Documentation & Deployment (Week 2-3: Days 11-12)

**Goal:** Document, review, and deploy to staging

#### Day 11: Documentation

**Tasks:**
- [ ] Create `docs/features/dashboard-redesign.md`:
  - Feature overview
  - User guide (how to use entity selector, interpret charts, etc.)
  - Technical architecture (component diagram, data flow)
  - API endpoints documentation (copy from this plan)
- [ ] Update `README.md` if needed (mention dashboard redesign)
- [ ] Create demo data script:
  - Generate realistic transactions (100+)
  - Create 2-3 test entities with different currencies
  - Seed invoices, bills, categories
  - Use for staging and demo purposes
- [ ] Add inline code comments for complex logic (especially currency conversion, aggregations)

**Acceptance Criteria:**
- Documentation complete and clear
- Demo data script runs successfully
- Code comments added where needed (not over-commented)

---

#### Day 12: Final Review & Staging Deployment

**Tasks:**
- [ ] Code review:
  - Review all new files for consistency
  - Check for `any` types in TypeScript (replace with proper types)
  - Verify error handling (all API calls have try/catch)
  - Check for console.log statements (remove or replace with proper logging)
- [ ] Final testing checklist:
  - [ ] Authenticate as different users (test tenant isolation)
  - [ ] Test with empty database (empty states work)
  - [ ] Test with large dataset (performance acceptable)
  - [ ] Test entity switching (data updates correctly)
  - [ ] Test sidebar collapse (state persists)
  - [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Deploy to staging:
  - Push code to staging branch
  - Run migrations on staging database
  - Seed demo data
  - Verify deployment successful
  - Smoke test all dashboard features

**Acceptance Criteria:**
- Code review complete (no major issues found)
- All testing checklist items pass
- Staging deployment successful
- Dashboard works correctly on staging environment

**Review Points:**
- [ ] Run all reviewer agents one final time before deployment:
  - `security-sentinel` (full feature security audit)
  - `performance-oracle` (final performance check)
  - `nextjs-app-router-reviewer` (App Router best practices)
  - `kieran-typescript-reviewer` (strict type checking)
  - `code-simplicity-reviewer` (YAGNI check)

---

## Security Considerations

### Input Validation
- [ ] All API query parameters validated with Zod schemas
  - `entity`: Must be valid UUID or "all"
  - `period`: Must be one of predefined values ("30d", "90d", "ytd", "custom")
  - `startDate`, `endDate`: Must be valid ISO dates
  - `limit`: Must be positive integer, max 50
- [ ] No SQL injection risk (Prisma parameterizes all queries automatically)
- [ ] No NoSQL injection risk (N/A - using PostgreSQL)

### Authentication & Authorization
- [ ] All dashboard API endpoints require authentication (Bearer token)
- [ ] Tenant isolation enforced in all queries:
  - Get tenantId from authenticated userId
  - Filter all queries by tenantId
- [ ] Entity filtering validated:
  - If entity ID provided, verify it belongs to user's tenant
  - Return 403 Forbidden if entity doesn't belong to tenant
- [ ] Role-based access control (RBAC) considered:
  - VIEWER role: Can view dashboard (read-only)
  - ACCOUNTANT role: Can view dashboard for all entities
  - OWNER/ADMIN role: Full access
  - Check role before returning sensitive data (future enhancement)

### Data Privacy
- [ ] No sensitive data in logs or error messages
  - Don't log full queries or user data
  - Sanitize error messages before sending to client
- [ ] No PII (Personally Identifiable Information) exposed in URLs
  - Entity IDs are UUIDs (non-sequential, non-guessable)
  - Don't include amounts or names in query params
- [ ] API responses don't leak schema information
  - Generic error messages ("An error occurred")
  - Don't expose database structure or internal errors

### Rate Limiting (Future)
- [ ] Implement rate limiting per tenant (e.g., 100 requests/minute)
- [ ] Use Redis or in-memory store for rate limit counters
- [ ] Return 429 Too Many Requests when limit exceeded

### CORS & CSRF
- [ ] CORS configured correctly in API server
  - Allow only frontend origin (not wildcard in production)
- [ ] CSRF protection not needed (API is stateless, uses Bearer tokens)

---

## Performance Considerations

### Database Optimization
- [ ] Indexes on frequently queried columns (see Data Model Changes section)
- [ ] Use `select` to fetch only needed columns (reduce data transfer)
- [ ] Avoid N+1 queries (use `include` for eager loading)
- [ ] Use raw SQL for complex aggregations if Prisma is slow:
  ```typescript
  const result = await prisma.$queryRaw`
    SELECT category_id, SUM(amount) as total
    FROM "Transaction"
    WHERE entity_id = ${entityId}
    GROUP BY category_id
    ORDER BY total DESC
    LIMIT 5
  `
  ```
- [ ] Consider materialized views for expensive aggregations (future):
  - Pre-compute daily/monthly metrics
  - Refresh on transaction insert/update (trigger or cron job)

### API Response Optimization
- [ ] Response caching with `Cache-Control` headers:
  - Financial metrics: `max-age=300` (5 minutes)
  - Cash flow data: `max-age=300`
  - Recent transactions: `max-age=60` (1 minute)
  - Action items: `max-age=60`
- [ ] Compress responses (gzip/brotli) - Fastify built-in
- [ ] Pagination for large result sets (transactions list)
- [ ] Cursor-based pagination for better performance:
  ```typescript
  {
    cursor: lastTransactionId,
    limit: 10
  }
  ```

### Frontend Optimization
- [ ] TanStack Query caching:
  - `staleTime: 5 * 60 * 1000` (5 minutes for metrics)
  - `cacheTime: 30 * 60 * 1000` (30 minutes cache retention)
  - Automatic background refetching on window focus
- [ ] Code splitting for charts:
  ```typescript
  const CashFlowChart = dynamic(() => import('./CashFlowChart'), {
    loading: () => <ChartSkeleton />,
    ssr: false // Charts don't need SSR
  })
  ```
- [ ] Memoization for expensive client-side computations:
  ```typescript
  const chartData = useMemo(() => transformData(rawData), [rawData])
  ```
- [ ] Parallel data fetching with `Promise.all()` in Server Components
- [ ] Server-side caching with React `cache()` (future enhancement)

### Monitoring
- [ ] Add performance tracking:
  - Log API response times (p50, p95, p99)
  - Track dashboard load time (Web Vitals)
  - Monitor database query performance (slow query log)
- [ ] Set up alerts for degraded performance:
  - Dashboard load time >2s
  - API response time >500ms
  - Database query time >200ms

---

## Financial Integrity

### Currency Handling
- [x] All amounts stored as Integer cents (existing schema uses Int)
- [ ] Multi-currency conversion:
  - Fetch latest FX rates from external API (e.g., exchangerate-api.io)
  - Store FX rates in `FxRate` table (if not exists, add to schema)
  - Convert all amounts to user's primary currency for aggregation
  - Formula: `amountInPrimaryCurrency = (amount / 100) * fxRate * 100` (keep as cents)
- [ ] Original currency preserved:
  - Transaction list shows original currency and amount
  - Tooltip shows conversion (e.g., "€1,000 (USD $1,100)")
- [ ] Rounding consistency:
  - Always round to 2 decimal places for display
  - Never use floating-point arithmetic (only integers)

### Data Accuracy
- [ ] Aggregate calculations verified:
  - Revenue = Sum of INCOME transactions
  - Expenses = Sum of EXPENSE transactions
  - Net Income = Revenue - Expenses
  - Profit Margin = (Net Income / Revenue) * 100
- [ ] Period comparison logic correct:
  - Previous period = same duration as current period, ending at current period start
  - Example: Current = last 30 days, Previous = 30 days before that
- [ ] Date range handling:
  - Inclusive of start date, exclusive of end date (standard convention)
  - Use database timezone consistently (UTC recommended)

### Audit Trail
- [x] All financial transactions have `createdAt`, `updatedAt` fields (existing schema)
- [ ] Dashboard queries don't modify data (read-only)
- [ ] Future: Log dashboard views for compliance (optional)

---

## Testing Strategy

### Unit Tests

**Backend (Jest):**
- `apps/api/src/services/dashboardService.test.ts`
  - Test `getFinancialMetrics()` with sample data
  - Test currency conversion logic
  - Test period comparison calculations
  - Test edge cases (empty results, missing FX rates)

**Frontend (Jest + React Testing Library):**
- `apps/web/src/components/dashboard/FinancialMetricsCards.test.tsx`
  - Test rendering with mock data
  - Test loading state
  - Test error state
  - Test data formatting (currency, percentages)

---

### Integration Tests

**API Endpoints:**
- Test GET `/api/dashboard/metrics`:
  - With valid authentication → 200 OK
  - Without authentication → 401 Unauthorized
  - With invalid entity ID → 403 Forbidden
  - With "all" entities → aggregated results
  - With specific entity → filtered results

- Test GET `/api/dashboard/cashflow`:
  - Verify date range filtering works
  - Verify granularity (daily/weekly/monthly) works
  - Verify data sorted by date ascending

- Test GET `/api/dashboard/transactions`:
  - Verify limit parameter works
  - Verify pagination (future)
  - Verify entity filtering

- Test GET `/api/dashboard/action-items`:
  - Verify unpaid invoices count correct
  - Verify bills due soon count correct
  - Verify accounts needing reconciliation count correct

- Test GET `/api/dashboard/categories`:
  - Verify top N categories returned
  - Verify percentages sum to 100% (or less if "Other" category)
  - Verify amounts correct

**Multi-Tenant Isolation:**
- Create 2 test tenants with separate data
- Authenticate as Tenant A user
- Verify only Tenant A data returned
- Authenticate as Tenant B user
- Verify only Tenant B data returned
- Verify no data leakage between tenants

---

### E2E Tests (Optional - Playwright or Cypress)

**Critical User Flows:**
1. **Dashboard Load**:
   - User logs in
   - Dashboard loads with real data
   - All widgets display correctly
   - No errors shown

2. **Entity Switching**:
   - User opens entity selector
   - Selects specific entity
   - All widgets update to show entity-specific data
   - URL updates with query param

3. **Sidebar Collapse**:
   - User clicks collapse button
   - Sidebar collapses to icons-only
   - Main content expands to fill space
   - User refreshes page
   - Sidebar remains collapsed (state persisted)

---

### Performance Testing

**Load Testing (Artillery or k6):**
- Simulate 10 concurrent users loading dashboard
- Measure response times (p50, p95, p99)
- Verify no errors under load
- Target: 95% of requests <500ms

**Database Query Testing:**
- Use Prisma debug logging
- Run `EXPLAIN ANALYZE` on key queries in Postgres
- Verify indexes are used
- Target: All queries <200ms

---

## Rollout Plan

### Staging Deployment

1. **Pre-Deployment:**
   - [ ] Code review complete
   - [ ] All tests passing
   - [ ] Database migration tested locally
   - [ ] Demo data script ready

2. **Deployment:**
   - [ ] Push to staging branch
   - [ ] Deploy API service (restart Fastify server)
   - [ ] Deploy frontend (build and deploy Next.js app)
   - [ ] Run database migrations on staging database
   - [ ] Seed demo data for testing

3. **Verification:**
   - [ ] Smoke test: Load dashboard → verify all widgets render
   - [ ] Test entity switching → verify data updates
   - [ ] Test sidebar collapse → verify state persists
   - [ ] Test on mobile device → verify responsive layout
   - [ ] Check error logs → no unexpected errors

---

### Production Deployment

1. **Pre-Production Checklist:**
   - [ ] Staging testing complete (at least 2-3 days of testing)
   - [ ] Stakeholder approval (show demo to product owner)
   - [ ] Database backup completed
   - [ ] Rollback plan ready (previous version tag)
   - [ ] Monitoring alerts configured

2. **Deployment Strategy:**
   - **Option A: Feature Flag (Recommended for gradual rollout)**
     - [ ] Add feature flag: `ENABLE_NEW_DASHBOARD=true`
     - [ ] Deploy with flag off (new code deployed but not active)
     - [ ] Enable for 10% of users (A/B test)
     - [ ] Monitor metrics (load time, error rate, user engagement)
     - [ ] Gradually increase to 50%, then 100%

   - **Option B: Direct Rollout (Faster but riskier)**
     - [ ] Deploy all services simultaneously
     - [ ] Run database migrations (non-destructive - only indexes added)
     - [ ] Monitor closely for first hour
     - [ ] Rollback if error rate >5%

3. **Post-Deployment Monitoring:**
   - [ ] Watch API error rates (target <1%)
   - [ ] Monitor dashboard load times (target <2s)
   - [ ] Check database query performance (no slow queries)
   - [ ] Review user feedback (support tickets, in-app feedback)
   - [ ] Measure engagement (% of users viewing dashboard daily)

---

### Rollback Plan

**If major issues occur:**

1. **Immediate Actions:**
   - [ ] Revert frontend deployment (redeploy previous version)
   - [ ] Revert API deployment (restart with previous version)
   - [ ] No need to rollback database (migrations are additive - only indexes added)

2. **Communicate:**
   - [ ] Notify users of temporary issue (status page)
   - [ ] Post incident report after resolution

3. **Post-Rollback:**
   - [ ] Investigate root cause
   - [ ] Fix issues locally
   - [ ] Re-test thoroughly
   - [ ] Plan new deployment

---

## Open Questions

- [ ] **FX Rate API**: Which external API for exchange rates? Options:
  - **exchangerate-api.io** (Free tier: 1,500 requests/month) ✅ Recommended
  - **fixer.io** (Free tier: 1,000 requests/month)
  - **openexchangerates.org** (Free tier: 1,000 requests/month)
  - **Decision:** Start with exchangerate-api.io, cache rates daily, store in database

- [ ] **Real-Time Updates**: Phase 1 uses polling (TanStack Query refetch). Future enhancement: Server-Sent Events (SSE)?
  - **Decision:** Polling sufficient for MVP, evaluate SSE in Phase 2 based on user feedback

- [ ] **Dashboard Customization**: Allow users to hide/reorder widgets?
  - **Decision:** Not in Phase 1 (YAGNI). Fixed layout for MVP, evaluate in Phase 3 based on user requests

- [ ] **Period Selector UI**: Dropdown vs tabs vs calendar picker?
  - **Decision:** Start with simple dropdown (30d, 90d, YTD), add calendar picker in Phase 2 for custom ranges

- [ ] **Entity Comparison**: Side-by-side entity comparison view (e.g., compare 2-3 entities)?
  - **Decision:** Not in Phase 1. Single entity or aggregated view sufficient for MVP. Evaluate in Phase 2.

- [ ] **Chart Library**: Recharts vs Tremor?
  - **Decision:** Recharts (already installed, larger community, more examples). Tremor can be reconsidered in future for specific use cases.

- [ ] **Mobile Navigation**: Collapsed sidebar by default on mobile, or bottom nav bar?
  - **Decision:** Use Sheet component for drawer-style mobile nav (same as current implementation). Bottom nav bar is alternative for Phase 2.

---

## Dependencies

**Blocked By:**
- None (Phase 0 complete - auth, database, API foundation ready)

**Blocks:**
- Phase 2 features: Insights box, pending tasks, quick add button (depend on Phase 1 dashboard infrastructure)
- Analytics page (separate feature - can leverage dashboard API endpoints)
- Reporting features (P&L, Balance Sheet - depend on dashboard aggregation logic)

---

## Resources

### Internal Documentation
- [Dashboard Redesign Brainstorm](../brainstorms/2026-01-30-dashboard-redesign-brainstorm.md)
- [Product Overview](../product/overview.md)
- [Analytics Feature Spec](../features/05-analytics.md)
- [Current Dashboard Code](../../apps/web/src/app/(dashboard)/dashboard/page.tsx)

### External Resources
- **TanStack Query Docs**: https://tanstack.com/query/latest/docs/framework/react/overview
- **Recharts Docs**: https://recharts.org/en-US/
- **Next.js 16 App Router**: https://nextjs.org/docs/app
- **Prisma Performance**: https://www.prisma.io/docs/guides/performance-and-optimization
- **shadcn/ui Components**: https://ui.shadcn.com/docs

### Design Inspiration
- **Stripe Dashboard**: Clean, metrics-focused, excellent charts
- **Linear Dashboard**: Minimal, fast, great use of space
- **Plaid Dashboard**: Financial-focused, great currency handling
- **QuickBooks Dashboard**: Accounting-specific widgets, actionable insights

---

## Estimation

### Complexity
**Medium-High**

**Reasoning:**
- Multiple API endpoints (5 new routes)
- Complex database queries (aggregations, date ranges, multi-currency)
- Multiple UI components (7 new widgets)
- Real-time data fetching (TanStack Query setup)
- Multi-currency conversion logic
- Responsive design (3 breakpoints)
- Performance optimization (indexes, caching)

**Not High Because:**
- No new database models required
- No external service integrations (except FX API - simple)
- No complex state management (TanStack Query handles most)
- No authentication changes (reuses existing Clerk setup)

---

### Effort
**2-3 weeks (12-15 working days)**

**Breakdown:**
- **Backend (3-4 days)**: API endpoints, business logic, database indexes
- **Frontend (4-5 days)**: Widgets, charts, entity selector, sidebar enhancement
- **Integration & Testing (3-4 days)**: E2E testing, performance testing, polish
- **Documentation & Deployment (1-2 days)**: Docs, review, staging deployment

**Assumptions:**
- 1 developer working full-time
- No major blockers or scope changes
- Existing infrastructure (auth, database, API framework) stable

**Can Be Accelerated:**
- Parallel development (1 backend + 1 frontend developer) → 10-12 days
- Reduce scope (defer Phase 2 features) → 8-10 days

---

### Risk
**Medium**

**Risk Factors:**

1. **Performance (Medium Risk)**:
   - Dashboard with multiple widgets may be slow with large datasets
   - **Mitigation:** Database indexes, query optimization, caching, performance testing with realistic data

2. **Multi-Currency Complexity (Medium Risk)**:
   - Currency conversion logic can be tricky (FX rates, rounding, edge cases)
   - **Mitigation:** Use battle-tested libraries (dinero.js or currency.js), thorough testing, clear handling of missing FX rates

3. **Scope Creep (Low-Medium Risk)**:
   - Feature can expand (more widgets, customization, real-time updates)
   - **Mitigation:** Strict adherence to Phase 1 scope, defer enhancements to Phase 2/3

4. **UX Complexity (Low Risk)**:
   - Dashboard with many widgets can be overwhelming
   - **Mitigation:** Progressive disclosure (metrics first, details below), user testing, iterative refinement

5. **Data Accuracy (Low Risk)**:
   - Financial calculations must be 100% correct
   - **Mitigation:** Unit tests for all calculations, manual verification with test data, financial-data-validator agent review

**Overall:** Manageable risk with proper planning, testing, and iterative development.

---

## Success Metrics (Post-Launch)

### Quantitative Metrics

**Performance:**
- Dashboard load time (LCP - Largest Contentful Paint): Target <1.5s, Acceptable <2s
- API response time (p95): Target <500ms
- Database query time (p95): Target <200ms
- Error rate: Target <1%, Acceptable <3%

**Engagement:**
- % of users viewing dashboard within 24h of login: Target >80%
- Average time on dashboard: Target >2 minutes (indicates users are engaging with data)
- Entity selector usage: Target >50% of users switch between entities at least once
- Widget interaction rate: Target >30% of users click on action items or transactions

**Reliability:**
- Uptime: Target >99.9% (excluding planned maintenance)
- Widget load success rate: Target >98% (individual widgets load successfully)

---

### Qualitative Metrics

**User Feedback:**
- Positive sentiment in user feedback: Target >80% positive
- Common feedback themes: Monitor for "easy to understand", "fast", "helpful insights"
- Support ticket reduction: Target 20% reduction in "Where is my data?" tickets

**Internal Metrics:**
- Developer satisfaction: Is the code maintainable and extensible?
- Code review feedback: Minimal refactoring needed in Phase 2/3

---

### Monitoring Dashboard (Internal)

Create internal monitoring dashboard to track:
- Real-time API endpoint performance (response times, error rates)
- Dashboard usage analytics (page views, entity switches, widget interactions)
- Database query performance (slow queries, index usage)
- User feedback and support tickets related to dashboard

**Tools:**
- **Performance Monitoring**: Vercel Analytics, Sentry (error tracking)
- **Database Monitoring**: Prisma Studio, pgAdmin (query analysis)
- **User Analytics**: Plausible or PostHog (privacy-friendly)

---

## Next Steps

### Immediate Actions

1. **Approve Plan** ✅ (Current Step)
   - Review this plan with team/stakeholders
   - Get sign-off on scope, timeline, and approach

2. **Create GitHub Issues** (Optional)
   - Break plan into issues/tickets (one per day or task group)
   - Assign to developers
   - Link to this plan document

3. **Set Up Development Environment**
   - Ensure all developers have access to staging database
   - Set up FX rate API account (exchangerate-api.io)
   - Configure TanStack Query DevTools for debugging

4. **Begin Implementation** (Day 1)
   - Start with Phase 1: Database & Backend
   - Create dashboard routes and schemas
   - Set up API structure

---

### Decision Checkpoint

**After Week 1 (Backend + Core Widgets Complete):**
- Review progress against plan
- Demo financial metrics cards and cash flow chart
- Assess performance with realistic data
- Adjust timeline if needed

**After Week 2 (Integration & Testing Complete):**
- Deploy to staging
- Stakeholder review and feedback
- Decision: Deploy to production OR iterate based on feedback

---

### Follow-Up Work (Future Phases)

**Phase 2: Enhancement (After Phase 1 Launch)**
- Insights box with financial tips
- Pending tasks widget
- Quick add button
- Period selector (custom date ranges)
- UI polish and animations

**Phase 3: Intelligence (3-4 weeks after Phase 2)**
- AI-powered insights (OpenAI integration)
- Real-time updates (Server-Sent Events)
- Industry benchmarks
- Export to PDF
- Scheduled email reports

**Phase 4: Customization (6+ months out - only if user demand)**
- Drag-and-drop widget layout
- Hide/show widgets
- Dashboard templates by role
- Saved configurations

---

## Conclusion

This plan provides a clear roadmap for transforming the Akount dashboard from placeholder data to a comprehensive financial command center. The phased approach allows us to ship value quickly (Phase 1 MVP in 2-3 weeks) while keeping options open for future enhancements (Phase 2-4).

**Key Success Factors:**
1. ✅ **Clear scope**: Phase 1 MVP is well-defined and achievable
2. ✅ **Performance-first**: Database indexes, caching, and optimization built-in
3. ✅ **User-centric**: Designed for multiple personas (solo entrepreneurs, accountants)
4. ✅ **Scalable architecture**: Supports future enhancements without major refactoring
5. ✅ **Quality gates**: Multiple review points with specialized agents (security, performance, TypeScript)

**Next Action:** Get approval and start implementation! 🚀

---

**Document Owner:** Claude Code
**Plan Author:** Claude Sonnet 4.5
**Last Updated:** 2026-01-30
**Status:** Ready for implementation
**Start Date:** TBD (after approval)
**Target Completion:** 2-3 weeks from start date
