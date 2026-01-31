# Accounts Overview - Dashboard Brainstorm

**Date:** 2026-01-30
**Status:** Brainstormed → Implementation Plan Created
**Phase:** Phase 1 - Accounts Overview
**Related:**
- [Implementation Plan](../plans/2026-01-31-feature-accounts-overview-plan.md) - **START HERE**
- [Product Overview](../product/overview.md)
- [Feature Spec](../features/01-accounts-overview.md)
- [Analytics Feature Spec](../features/05-analytics.md) - Advanced dashboard (Phase 5)
- [Current Dashboard](../../apps/web/src/app/(dashboard)/dashboard/page.tsx)

**Note:** This brainstorm covers both Phase 1 (Accounts Overview) and Phase 5 (Advanced Analytics). The implementation plan focuses on Phase 1 MVP features first.

---

## Problem Statement

The current dashboard has placeholder data (hardcoded revenue, expenses, net income) and limited functionality. Users need a comprehensive financial command center that provides:

1. **At-a-glance financial health check** (real metrics, not placeholders)
2. **Actionable insights and alerts** (what needs attention right now)
3. **Deep financial analysis** (charts, trends, category breakdowns)
4. **Entity-aware views** (switch between entities or see aggregated view)
5. **Educational content** (financial tips, insights, random facts)

The dashboard should serve multiple user personas (solo entrepreneurs, business owners, accountants) with varying needs while maintaining excellent performance and mobile responsiveness.

---

## User Needs

### Target Users
- **Solo Entrepreneurs**: Managing 1-2 entities, need quick financial overview and health checks
- **Small Business Owners**: Multiple entities, need detailed insights and entity comparisons
- **Accountants/Bookkeepers**: Managing finances for multiple clients, need actionable alerts and reconciliation status

### Desired Outcomes
1. **Quick Financial Health Check**: Users can see at-a-glance if their business is healthy, profitable, and on track
2. **Actionable Insights and Alerts**: Dashboard highlights what needs attention (unpaid invoices, reconciliation needed, tax deadlines)
3. **Deep Financial Analysis**: Users can drill into trends, compare periods, analyze spending patterns with interactive charts

### User Workflow
1. User logs in → sees aggregated view across all entities by default
2. Immediately identifies financial health from metric cards at the top
3. Scans action items (unpaid invoices, bills due, accounts needing reconciliation)
4. Reviews cash flow chart to understand money movement
5. Explores category breakdowns to find optimization opportunities
6. Reads personalized insights and financial tips
7. (Optional) Switches to specific entity view for detailed analysis

---

## Proposed Approach: Progressive Enhancement Dashboard

### Overview

Build the dashboard in phases, starting with real data for existing metrics, then adding widgets progressively. Uses a flexible grid system that adapts to content with potential for customization later.

### Architecture

#### Layout System
- **Collapsible Sidebar**: Can collapse to icons-only (64px) or expand to full labels (256px)
  - Saves screen space for data-heavy dashboards
  - User preference persisted in localStorage
  - Smooth transition animation (Framer Motion or Tailwind transitions)

- **Main Content Area**: Responsive grid layout using CSS Grid
  - Mobile: Single column stack
  - Tablet: 2-column grid
  - Desktop: 3-column grid with flexible widget sizing

- **Progressive Disclosure**: Content organized top-to-bottom by priority
  - Zone 1: Financial metrics cards (revenue, expenses, net income, profit margin)
  - Zone 2: Action items and alerts (unpaid invoices, bills due, reconciliation needed)
  - Zone 3: Charts (cash flow, category breakdowns)
  - Zone 4: Recent transactions list
  - Zone 5: Insights and tips (AI-generated, financial facts)

#### Data Loading Strategy
- **Server Components** (Next.js 16): Initial data fetch server-side for fast First Contentful Paint
- **Client Components**: Interactive widgets (charts, filters, real-time updates)
- **Parallel Loading**: Each widget fetches its own data independently
  - If one query is slow, other widgets still render
  - Loading skeletons per-widget (not global loading state)
- **TanStack Query**: Client-side caching and automatic refetching
  - 5-minute stale time for financial metrics
  - 1-minute stale time for action items
  - Manual refresh button to force refetch

#### Entity Selection
- **Global Entity Selector**: Dropdown in navbar (similar to Clerk UserButton placement)
  - Options: "All Entities" (default), Individual entities, "Compare Entities"
  - Persisted in URL query param: `?entity=all` or `?entity={entityId}`
  - Server Components read from URL, Client Components use `useSearchParams()`

- **Combined View (Default)**: Aggregates data across all entities
  - Multi-currency handling: Convert to user's primary currency using latest FX rates
  - Show individual entity breakdowns in charts (stacked bars, multi-line charts)

- **Entity-Specific View**: Filter all widgets to single entity
  - Breadcrumb shows current entity: `Dashboard > Acme Corp`
  - All metrics, charts, and lists filtered by `entityId`

#### Widget System
Modular components that encapsulate:
- Data fetching logic (React Query hooks)
- Loading and error states
- Empty states
- Responsive layout

**Core Widgets:**
1. **Financial Metrics Cards** (4 cards)
   - Revenue (income categories sum)
   - Expenses (expense categories sum)
   - Net Income (revenue - expenses)
   - Profit Margin (net income / revenue * 100)
   - Each card shows: Current value, comparison to previous period, trend indicator

2. **Cash Flow Chart** (line or area chart)
   - X-axis: Time (daily, weekly, monthly based on date range)
   - Y-axis: Amount in base currency
   - Two lines: Money In (green), Money Out (red)
   - Net cash flow (Money In - Money Out) shown as annotation
   - Interactive: Hover to see exact values, click to drill into day/week

3. **Recent Transactions List** (last 10 transactions)
   - Columns: Date, Description, Category, Entity, Amount
   - Color-coded by type (income green, expense red)
   - Click to view transaction details
   - Quick actions: Categorize, Edit, Mark as reconciled

4. **Action Items / Alerts** (critical notifications)
   - Unpaid invoices (count + total amount)
   - Bills due soon (within 7 days)
   - Accounts needing reconciliation (count)
   - Tax deadlines approaching (if applicable)
   - Each item is clickable → navigates to relevant page

5. **Expense & Income Category Oversight** (donut or bar charts)
   - Expense Categories: Top 5 categories by total spend
   - Income Categories: Revenue sources breakdown
   - Show percentage of total and absolute amount
   - Click category to filter transactions

6. **Insights Box** (AI-generated + curated)
   - Personalized insights: "Your expenses increased 15% this month"
   - Financial tips: "Did you know? You can deduct home office expenses"
   - Industry benchmarks: "Your profit margin is 8% above industry average"
   - Random motivational facts: "78% of successful entrepreneurs track expenses weekly"
   - Rotates through insights (carousel or random on each load)

7. **Pending Tasks** (user-specific to-dos)
   - Categorize transactions (count)
   - Review unreconciled accounts (count)
   - Upload receipts for expenses (count)
   - Each task links to action page

8. **Quick Add Button** (floating action button or dropdown)
   - Add Transaction
   - Create Invoice
   - Record Bill
   - Add Client
   - Add Vendor
   - Accessible from anywhere on dashboard

### Tech Stack

**Frontend:**
- **Next.js 16 App Router**: Server + Client Components
- **React 18**: Suspense boundaries for progressive loading
- **TanStack Query (React Query v5)**: Data fetching, caching, synchronization
- **Zustand**: Lightweight global state (entity selection, sidebar collapse state)
- **Tremor** (recommended) or **Recharts**: Chart library
  - Tremor pros: Purpose-built for dashboards, consistent with shadcn/ui
  - Recharts pros: More customizable, larger community
- **Framer Motion**: Smooth transitions and animations
- **shadcn/ui**: Consistent UI components (already in use)

**Backend:**
- **Fastify API**: Already set up with authentication and Prisma
- **New Endpoints Needed**:
  - `GET /api/dashboard/metrics?entity={id}&period={range}` - Financial metrics
  - `GET /api/dashboard/cashflow?entity={id}&period={range}` - Cash flow data
  - `GET /api/dashboard/transactions?entity={id}&limit=10` - Recent transactions
  - `GET /api/dashboard/action-items?entity={id}` - Alerts and to-dos
  - `GET /api/dashboard/categories?entity={id}&period={range}` - Category breakdowns
  - `GET /api/dashboard/insights?entity={id}` - AI-generated insights
  - `POST /api/dashboard/refresh` - Force refresh all data

**Database:**
- Existing Prisma schema supports all required data
- New table: `DashboardCache` (optional) for expensive aggregations
  - Cache key: `{tenantId}_{entityId}_{metric}_{period}`
  - TTL: 5 minutes
  - Speeds up repeated requests for same time period

**Performance Optimizations:**
- Server-side data aggregation (don't fetch raw transactions, aggregate at DB level)
- Database indexes on frequently queried columns (`entityId`, `tenantId`, `createdAt`)
- Prisma query optimization (select only needed fields, use raw SQL for complex aggregations)
- Response caching with `Cache-Control` headers
- Suspense boundaries to stream widgets as they load

---

## Key Features

### Must-Have (Phase 1 MVP)
1. ✅ Financial metrics cards with real data (revenue, expenses, net income, profit margin)
2. ✅ Cash flow chart (line chart, 30-day default view)
3. ✅ Recent transactions list (last 10, with quick actions)
4. ✅ Action items/alerts (unpaid invoices, bills due, reconciliation needed)
5. ✅ Expense & income category oversight (donut charts)
6. ✅ Collapsible sidebar navigation
7. ✅ Global entity selector (All Entities vs. specific entity)
8. ✅ Mobile responsive layout
9. ✅ Loading skeletons per widget
10. ✅ Error boundaries per widget (one widget failure doesn't break entire dashboard)

### Nice-to-Have (Phase 2 Enhancement)
1. 🔮 Insights box with AI-generated tips and financial facts
2. 🔮 Pending tasks widget (to-do items based on user actions needed)
3. 🔮 Quick add button (floating action button for common actions)
4. 🔮 Real-time updates (WebSocket or Server-Sent Events for live data)
5. 🔮 Period selector (this month, last quarter, YTD, custom date range)
6. 🔮 Export dashboard to PDF
7. 🔮 "Compare Entities" view (side-by-side entity metrics)
8. 🔮 Industry benchmarks integration (compare to similar businesses)

### Future Possibilities (Phase 3 Optional)
1. 🚀 Customizable dashboard layout (drag-and-drop widgets)
2. 🚀 Saved dashboard configurations (multiple dashboard views per user)
3. 🚀 Dashboard templates by role (entrepreneur, accountant, investor)
4. 🚀 Widget marketplace (community-contributed widgets)
5. 🚀 Advanced filtering (by entity, category, date range, transaction type)
6. 🚀 Scheduled email reports (daily/weekly dashboard summary)

---

## Constraints

### Performance
- **Target**: <2s initial dashboard load (including all widgets)
- **Strategy**:
  - Use React Server Components for initial HTML rendering
  - Stream widgets as they load (Suspense boundaries)
  - Aggressive database query optimization (indexes, aggregations, raw SQL)
  - CDN caching for static assets (charts, icons)
  - Compress API responses (gzip/brotli)
- **Monitoring**: Add performance tracking (Web Vitals, API response times)

### Multi-Currency Display
- **Challenge**: Entities can have different base currencies (USD, EUR, GBP, etc.)
- **Solution**:
  - User has a "primary currency" setting (default: USD)
  - "All Entities" view converts all amounts to primary currency using latest FX rates
  - FX rates fetched daily from external API (store in `FxRate` table)
  - Show original currency in tooltips (e.g., "€1,000 (USD $1,100)")
  - Entity-specific view shows amounts in entity's base currency
- **Edge Cases**:
  - Missing FX rate → fallback to last known rate with warning
  - Multiple currencies in single entity → handle via transaction-level currency field

### Mobile Responsiveness
- **Breakpoints**:
  - Mobile: <640px (single column, stacked widgets)
  - Tablet: 640px-1024px (2-column grid, sidebar collapsible by default)
  - Desktop: >1024px (3-column grid, sidebar expanded by default)
- **Mobile-Specific Optimizations**:
  - Simplified charts (fewer data points on small screens)
  - Horizontal scroll for transaction table (or card-based layout)
  - Bottom navigation bar (alternative to sidebar on mobile)
  - Touch-friendly hit targets (min 44x44px)
- **Testing**: Use real devices (not just browser DevTools)

### Real-Time Updates
- **Approach 1: Polling** (simpler, recommended for MVP)
  - TanStack Query refetch interval: 60 seconds
  - Manual refresh button for immediate updates
  - Visual indicator when data is stale (e.g., "Last updated 2 minutes ago")

- **Approach 2: Server-Sent Events** (future enhancement)
  - Server pushes updates when transactions are created/updated
  - Client subscribes to `/api/dashboard/stream?entity={id}`
  - More efficient (no polling overhead)
  - Requires additional infrastructure (Redis for pub/sub if multi-server)

- **Approach 3: WebSockets** (overkill for dashboard, not recommended)
  - Bi-directional communication (not needed for read-only dashboard)
  - More complex to implement and scale

---

## Edge Cases

### No Data Scenarios
1. **New User (Empty State)**:
   - No entities → Show onboarding prompt: "Create your first entity"
   - Entity exists but no transactions → Show empty state with "Add your first transaction" CTA
   - Provide sample data option: "Explore with demo data"

2. **Filtered View (No Results)**:
   - Date range has no transactions → "No activity during this period"
   - Entity has no transactions → "No transactions for this entity yet"
   - Show illustration + helpful message

### Entity Switching
1. **URL State Management**:
   - Entity selection stored in URL: `?entity=all` or `?entity=abc123`
   - Back/forward buttons work correctly
   - Shareable URLs (user can send dashboard link with specific entity view)

2. **Data Invalidation**:
   - When entity changes, invalidate all TanStack Query caches for that entity
   - Show loading state during switch (or optimistic UI with cached data)

### Multi-Currency Edge Cases
1. **Missing FX Rates**:
   - Fallback to last known rate with warning badge
   - Option to manually input exchange rate
   - Alert admin if FX rates haven't updated in 48+ hours

2. **Currency Conversion Rounding**:
   - Always store amounts in integer cents to avoid floating-point errors
   - Display with 2 decimal places in UI
   - Show conversion formula in tooltip: "€1,000 × 1.10 = $1,100"

### Error Handling
1. **API Failures**:
   - Per-widget error boundaries (one widget fails, others still work)
   - Retry logic with exponential backoff (TanStack Query built-in)
   - User-friendly error messages: "Unable to load cash flow chart. Try again?"
   - Fallback to cached data if available (show "Using cached data" warning)

2. **Authentication Issues**:
   - Token expiration → Auto-refresh or redirect to sign-in
   - Permission denied → Show "You don't have access to this entity" message

### Performance Edge Cases
1. **Large Datasets**:
   - User has 100,000+ transactions → Paginate transactions, aggregate at DB level
   - Slow queries → Use materialized views or pre-computed aggregations (DashboardCache table)
   - Timeout protection → API endpoint timeout limit (30s max), return partial data if exceeded

2. **Slow Network**:
   - Progressive enhancement → Show skeleton loaders, widgets appear as they load
   - Offline support (future) → Service Worker caches dashboard data for offline viewing

---

## Alternatives Considered

### Alternative 1: Dashboard-as-Configuration

**Description:** Define dashboard layout and widgets in a JSON configuration that users can customize via drag-and-drop interface.

**Pros:**
- Users can fully customize their dashboard
- Role-based default layouts (entrepreneur vs. accountant)
- Future-proof for power users
- A/B test different layouts easily

**Cons:**
- Significantly more complex to implement (react-grid-layout, configuration storage)
- Requires additional database tables (DashboardConfig, WidgetSettings)
- Risk of over-engineering if users don't need customization
- More testing required (each layout combination is a test case)

**Why Not:**
- **YAGNI Violation**: No user research indicates demand for customizable dashboards
- Users haven't requested this feature
- A well-designed fixed layout likely serves 90% of use cases
- Can add customization later if users request it (start with "hide widget" toggle)

---

### Alternative 2: Hybrid - Fixed Dashboard with Smart Insights

**Description:** Fixed, non-customizable dashboard with emphasis on AI-powered insights and real-time notifications instead of layout flexibility.

**Pros:**
- Faster to implement (no layout engine needed)
- Focus on content quality (insights, tips) rather than customization
- Real-time notifications provide "command center" feel
- Aligns with "AI Financial Advisor" product roadmap

**Cons:**
- No layout flexibility for users (one-size-fits-all)
- Real-time infrastructure adds complexity (WebSockets/SSE)
- AI insights cost per user (OpenAI API calls, budget ~$0.05/user/month)
- May not serve all personas equally well

**Why Not (For Phase 1):**
- AI insights should be added in Phase 2, not Phase 1 MVP
- Real-time updates can start with simple polling (Option 1) and upgrade to SSE later
- Better to nail the core dashboard UX first, then layer on intelligence

**Why Consider (For Phase 2):**
- Strong alignment with product vision ("AI Financial Advisor")
- Differentiates Akount from generic accounting dashboards
- Personalized insights are high-value for users

---

### Alternative 3: Analytics Dashboard (Separate from Main Dashboard)

**Description:** Keep current dashboard simple (entities list + placeholder metrics) and build a separate "Analytics" page for deep financial analysis.

**Pros:**
- Separates concerns (overview vs. analysis)
- Follows product docs structure (Analytics is its own section)
- Dashboard stays lightweight and fast
- Analytics page can have more complex visualizations without cluttering main dashboard

**Cons:**
- Users have to navigate to separate page for financial insights (extra click)
- Current dashboard remains underwhelming (placeholder data)
- Duplicated concepts (metrics on both pages)
- Inconsistent with "command center" vision (should see everything at a glance)

**Why Not:**
- Dashboard should be the central hub, not a landing page
- Analytics features are core to dashboard experience (cash flow, metrics)
- Better UX to have one comprehensive dashboard than two separate pages
- Can still have dedicated Analytics page for advanced features (P&L, Balance Sheet, custom reports)

---

## Open Questions

- [ ] **Insights Source**: Should insights be AI-generated (OpenAI API) or rule-based (if/then logic)?
  - AI pros: More personalized, conversational, surprising insights
  - AI cons: Cost, latency, potential for inaccurate advice
  - Rule-based pros: Free, fast, deterministic, easier to test
  - Rule-based cons: Limited, predictable, requires manual rule creation
  - **Recommendation**: Start with rule-based insights (Phase 1), add AI enhancement (Phase 2)

- [ ] **Chart Library**: Tremor vs. Recharts vs. Chart.js?
  - Tremor: Purpose-built for dashboards, consistent design, good TypeScript support
  - Recharts: More customizable, larger community, more examples
  - Chart.js: Lightweight, battle-tested, requires React wrapper
  - **Recommendation**: Tremor (best for MVP, migrating later is feasible if needed)

- [ ] **Real-Time Updates**: Polling vs. SSE vs. WebSockets?
  - **Recommendation**: Polling for Phase 1 (simple), SSE for Phase 2 (more efficient)

- [ ] **Mobile Strategy**: Responsive web vs. dedicated mobile app (future)?
  - **Recommendation**: Responsive web first (Next.js), evaluate native app in 6-12 months based on usage

- [ ] **Caching Strategy**: Client-only (TanStack Query) vs. Server-side (Redis) vs. Database materialized views?
  - **Recommendation**: Client-only (Phase 1), add server-side caching if slow queries become issue (Phase 2)

- [ ] **Date Range**: Default to "Last 30 days" or "Current month" or "All time"?
  - **Recommendation**: "Current month" (matches accounting practices, aligns with monthly reconciliation cycle)

- [ ] **Quick Add Button**: Floating action button (FAB) vs. dropdown in navbar?
  - FAB pros: Always visible, common pattern, mobile-friendly
  - FAB cons: Covers content, can be annoying
  - Dropdown pros: Less intrusive, accessible from navbar
  - Dropdown cons: Extra click, less discoverable
  - **Recommendation**: Dropdown in navbar (Phase 1), can A/B test FAB later

---

## Next Steps

### Immediate Actions

1. **User Feedback (Optional)**:
   - Show mockups to 2-3 target users (solo entrepreneurs, accountants)
   - Validate widget priority and layout
   - Confirm entity selection UX makes sense
   - Expected time: 2-3 days

2. **Technical Spike (Recommended)**:
   - Prototype one widget (e.g., financial metrics cards) with real data
   - Test Server Component + Client Component pattern
   - Validate TanStack Query caching strategy
   - Measure query performance with realistic data volume
   - Expected time: 1-2 days

3. **Create Detailed Plan**:
   - Run `/workflows:plan dashboard-redesign`
   - Break down into implementable tasks (backend API endpoints, frontend widgets, testing)
   - Estimate timeline (likely 2-3 weeks for Phase 1 MVP)

### Decision Checkpoint

After prototyping and user feedback (if applicable), choose:

- **Path A (Recommended)**: Proceed with Option 1 (Progressive Enhancement Dashboard) as described
- **Path B**: Modify approach based on feedback/prototype learnings
- **Path C**: Park this initiative and focus on other product priorities

### Success Metrics (Post-Launch)

How will we know the redesign is successful?

**Quantitative:**
- Dashboard load time <2s (target <1.5s)
- 80%+ of users view dashboard within 24 hours of login
- Average session time on dashboard >2 minutes (engagement)
- 50%+ of users switch between entity views (entity selector usage)
- <5% error rate across all widgets

**Qualitative:**
- User feedback: "I can see my financial health at a glance"
- Reduced support tickets about "Where is my data?"
- Users proactively share dashboard screenshots (social proof)

---

## Phased Implementation Plan

### Phase 1: MVP (2-3 weeks)
**Goal**: Replace placeholder data with real, functional dashboard

**Backend** (Week 1):
- [ ] Create dashboard API endpoints (metrics, cashflow, transactions, action-items, categories)
- [ ] Optimize database queries (indexes, aggregations)
- [ ] Add response caching (Cache-Control headers)
- [ ] Write API tests

**Frontend** (Week 2):
- [ ] Implement collapsible sidebar
- [ ] Create financial metrics cards (4 cards with real data)
- [ ] Build cash flow chart (Tremor line chart)
- [ ] Build recent transactions list
- [ ] Build action items widget
- [ ] Add loading skeletons and error boundaries

**Integration** (Week 3):
- [ ] Implement entity selector (global dropdown in navbar)
- [ ] Add TanStack Query for data fetching and caching
- [ ] Mobile responsive testing (3 breakpoints)
- [ ] Multi-currency conversion logic
- [ ] End-to-end testing
- [ ] Deploy to staging

**Success Criteria**:
- All widgets show real data (no placeholders)
- Dashboard loads in <2s
- Entity switching works correctly
- Mobile responsive

---

### Phase 2: Enhancement (1-2 weeks)
**Goal**: Add intelligence and polish

**Features**:
- [ ] Insights box (rule-based financial tips + random facts)
- [ ] Pending tasks widget
- [ ] Quick add dropdown button
- [ ] Period selector (this month, last quarter, YTD, custom)
- [ ] Polish animations and transitions (Framer Motion)
- [ ] Add "Last updated" timestamps
- [ ] Manual refresh button

**Success Criteria**:
- Users engage with insights (click-through rate >10%)
- Quick add button usage >20% of transaction creation
- Period selector used by 30%+ of users

---

### Phase 3: Intelligence (2-3 weeks)
**Goal**: AI-powered insights and real-time updates

**Features**:
- [ ] Integrate OpenAI API for personalized insights
- [ ] Implement Server-Sent Events for real-time updates
- [ ] Add industry benchmark data (research data sources)
- [ ] Export dashboard to PDF
- [ ] Scheduled email reports (daily digest)

**Success Criteria**:
- AI insights rated helpful by 70%+ of users
- Real-time updates reduce manual refresh clicks by 50%
- PDF exports used by 20%+ of users

---

### Phase 4: Customization (Optional Future)
**Goal**: Allow power users to customize layout

**Features**:
- [ ] Drag-and-drop widget reordering (react-grid-layout)
- [ ] Hide/show widget toggles
- [ ] Save dashboard configurations per user
- [ ] Dashboard templates by role

**Success Criteria**:
- 40%+ of users customize at least one aspect of dashboard
- Customization feature satisfaction score >8/10

---

## Conclusion

The **Progressive Enhancement Dashboard** (Option 1) is the recommended approach because it:

1. ✅ **Ships value quickly**: Real data in 2-3 weeks
2. ✅ **Scales with product growth**: Flexible architecture supports future features
3. ✅ **Avoids over-engineering**: Focuses on core features users need now
4. ✅ **Maintains high performance**: Server Components + parallel loading + caching
5. ✅ **Serves all personas**: Entity switching handles solo entrepreneurs and accountants
6. ✅ **Aligns with tech stack**: Leverages Next.js 16, Prisma, and existing APIs

**Next Action**: Create detailed implementation plan → `/workflows:plan dashboard-redesign`

---

**Document Owner**: Claude Code
**Last Updated**: 2026-01-30
**Status**: Ready for planning phase
