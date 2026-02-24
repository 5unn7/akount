# AI Auto-Bookkeeper Phase III: AI Financial Advisor — Implementation Plan

**Created:** 2026-02-24
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-24-ai-autonomous-bookkeeper-brainstorm.md](docs/brainstorms/2026-02-24-ai-autonomous-bookkeeper-brainstorm.md) (Phase 3, lines 121-168)
**Prerequisites:** [Phase 1 Plan](docs/plans/2026-02-24-ai-auto-bookkeeper-phase1.md) (DEV-185 to DEV-200), [Phase 2 Plan](docs/plans/2026-02-24-ai-auto-bookkeeper-phase2.md)

## Context

Phase I builds "AI suggests, you approve" (categorization → JE drafting → Action Feed → batch approve). Phase II closes the learning loop (pattern detection → rule suggestions → auto-apply). Phase III makes the AI proactive: it monitors financial data, generates insights, detects anomalies, and provides a Monthly Close Package — the capstone "Close your books in 10 minutes" experience.

**Goal:** Analyze → Alert → Advise. AI generates proactive financial insights and a one-click monthly close workflow.
**Metric:** Close Readiness score accuracy; time-to-close-books < 10 minutes for active solopreneurs.

## Success Criteria

- [ ] 7 insight analyzers generate actionable insights from real financial data
- [ ] Insights replace the 501 stub at `GET /api/ai/insights`
- [ ] Critical insights also appear in Action Feed (type: ALERT) via Phase 1 AIAction
- [ ] Insights list page with filtering by type, priority, status at `/insights`
- [ ] Monthly Close pre-flight score (0-100%) with itemized checklist
- [ ] One-click "Close Month" when score = 100% (wraps fiscal period service)
- [ ] Insight deduplication via `triggerId` (no duplicate active insights)
- [ ] Dismiss/snooze support on insights
- [ ] Dashboard widget shows insight count + top priority insight
- [ ] On-import trigger generates spending/duplicate insights automatically
- [ ] All tests pass, zero TS errors

---

## Architecture Decisions

**D1: Insight Type/Status — TypeScript Unions (No Migration for Enums)**
The Insight model uses String fields for `type`, `priority`, `status`. Rather than adding Prisma enums (migration), define TypeScript string literal unions in a shared constants file. Enforce at service layer with Zod.
```typescript
const INSIGHT_TYPES = ['cash_flow_warning', 'spending_anomaly', 'duplicate_expense',
  'overdue_alert', 'tax_estimate', 'revenue_trend', 'reconciliation_gap'] as const;
const INSIGHT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const INSIGHT_STATUSES = ['active', 'dismissed', 'snoozed', 'resolved', 'expired'] as const;
```

**D2: Insight Schema Enhancement — Additive Migration**
Add fields to Insight model for dismiss/snooze and deduplication:
- `dismissedAt DateTime?`, `dismissedBy String?`, `snoozedUntil DateTime?`
- `metadata Json?` (analyzer-specific payload: threshold, comparison data, affected records)
- `@@unique([entityId, triggerId])` for dedup (upsert pattern)
No destructive changes; all new fields are optional.

**D3: Generation Triggers — API-Driven + Lightweight Timer**
Since no cron/job library exists:
1. `POST /api/ai/insights/generate` — runs all analyzers for an entity (API-triggered)
2. Lightweight `setInterval` in server startup (configurable, default disabled in dev) — follows existing `report-cache.ts` pattern
3. On-import hook: `import.service.ts` calls specific analyzers after successful import
4. Event-based: individual analyzers callable directly from services

**D4: Insight → AIAction Bridge**
Insights are standalone records (not every insight needs approval). Only *critical* and *high* priority insights with `actionable: true` also create an AIAction (type: `ALERT`) for Action Feed visibility. This keeps the Action Feed focused on items needing user action.

**D5: Deduplication via triggerId**
Each analyzer generates a deterministic `triggerId` like `cash_flow_warning:entity123:2026-02`. The `@@unique([entityId, triggerId])` constraint + upsert prevents duplicate active insights. Resolved/dismissed insights can be regenerated (new triggerId includes period).

**D6: Monthly Close = Orchestrator Over Existing Services**
Monthly Close service does NOT duplicate logic. It calls:
- `reconciliationService.getReconciliationStatus()` per account
- `dashboardService.getActionItems()` for overdue items
- Query for unposted DRAFT JEs in period
- Query for pending AIActions (Phase 1)
- `fiscalPeriodService.lockPeriod()` + `closePeriod()` for execution

**D7: Analyzer Architecture — Pure Functions Over Dashboard Data**
Each analyzer is a standalone function that accepts pre-fetched data (not a class with DB access). The InsightGeneratorService orchestrates: fetch data once → fan out to analyzers → collect results → upsert insights. This keeps analyzers testable and fast. Exception: revenue + reconciliation analyzers need DB access (call report/reconciliation services directly).

---

## Tasks (14 tasks, 4 sprints)

### Sprint 3a: Insight Infrastructure (Tasks 1-4)

#### Task 1: Insight schema enhancement — additive migration
**Files:** `packages/db/prisma/schema.prisma`, new migration
**What:**
- Add to Insight model: `dismissedAt DateTime?`, `dismissedBy String?`, `snoozedUntil DateTime?`, `metadata Json?`
- Add `@@unique([entityId, triggerId])` constraint for deduplication
- Keep all existing fields unchanged (additive only)
**Depends on:** none
**Success:** Migration runs, Prisma regenerates, existing tests pass
**Review:** `prisma-migration-reviewer`

#### Task 2: Insight types, constants, and Zod schemas
**Files:** new `apps/api/src/domains/ai/schemas/insight.schema.ts`, new `apps/api/src/domains/ai/types/insight.types.ts`
**What:**
- `insight.types.ts`: String literal unions for `InsightType` (7 types), `InsightPriority` (4 levels), `InsightStatus` (5 statuses). Type for `InsightMetadata` (per-analyzer payload shapes). `InsightResult` type returned by analyzers.
- `insight.schema.ts`: Zod schemas — `ListInsightsSchema` (entityId, type?, priority?, status?, cursor pagination), `DismissInsightSchema`, `SnoozeInsightSchema` (snoozedUntil date), `GenerateInsightsSchema` (entityId, types? array)
- Export `INSIGHT_TYPE_CONFIG` constant: maps each type to `{ label, icon, defaultPriority, description }`
**Depends on:** Task 1
**Success:** Types compile, schemas validate sample data

#### Task 3: Insight CRUD service
**Files:** new `apps/api/src/domains/ai/services/insight.service.ts`, new `__tests__/insight.service.test.ts`
**What:**
- `InsightService` class (constructor: tenantId, userId) following `CategoryService` pattern
- Methods: `listInsights` (cursor pagination + filters by type/priority/status/entityId), `getInsight`, `upsertInsight` (dedup via triggerId — update if active exists, create if not), `dismissInsight` (sets dismissedAt/dismissedBy, status → dismissed), `snoozeInsight` (sets snoozedUntil, status → snoozed), `resolveInsight` (status → resolved), `expireStaleInsights` (snoozedUntil < now → reactivate; active insights > 30 days → expired), `getInsightCounts` (grouped by type and priority for dashboard widget)
- All operations tenant-isolated via `entity: { tenantId }`
- Upsert uses `prisma.insight.upsert({ where: { entityId_triggerId } })` for dedup
- Audit logging on dismiss/resolve
**Depends on:** Tasks 1, 2
**Success:** CRUD lifecycle with dedup, tenant isolation, dismiss/snooze

#### Task 4: Insight API routes — replace 501 stubs
**Files:** modify `apps/api/src/domains/ai/routes.ts`, new `__tests__/insight.routes.test.ts`
**What:**
- Replace `GET /api/ai/insights` stub with real implementation: list insights with filters
- Replace `GET /api/ai/recommendations` stub → redirect concept to insights (or remove)
- Add `GET /api/ai/insights/:id` — single insight with metadata
- Add `POST /api/ai/insights/:id/dismiss` — dismiss an insight
- Add `POST /api/ai/insights/:id/snooze` — snooze with date
- Add `POST /api/ai/insights/generate` — trigger insight generation (accepts entityId + optional type filters)
- Add `GET /api/ai/insights/counts` — summary counts for dashboard widget
- Uses `handleAIError()` from Phase 1's error handler
- Tests: CRUD, tenant isolation, dismiss flow, snooze reactivation
**Depends on:** Task 3
**Review:** `fastify-api-reviewer`, `security-sentinel`

---

### Sprint 3b: Analyzers (Tasks 5-9)

#### Task 5: Insight generator service (orchestrator)
**Files:** new `apps/api/src/domains/ai/services/insight-generator.service.ts`, new `__tests__/insight-generator.service.test.ts`
**What:**
- `InsightGeneratorService` class (constructor: tenantId, userId)
- `generateAll(entityId, types?)` — orchestrator:
  1. Fetch shared data once (dashboard metrics, expense breakdown, action items, account list)
  2. Fan out to selected analyzers (or all if no filter)
  3. Each analyzer returns `InsightResult[]` (or empty)
  4. Upsert results via `InsightService.upsertInsight()`
  5. For critical/high + actionable insights: create AIAction (type: ALERT) via Phase 1 AIActionService
  6. Return summary: `{ generated: N, updated: N, skipped: N }`
- `generateForImport(entityId, transactionIds)` — import-triggered: runs only spending_anomaly + duplicate_expense analyzers with imported transaction context
- Error isolation: each analyzer wrapped in try/catch (one failure doesn't block others)
- Logging: `request.log.info` with analyzer name, entity, result count
**Depends on:** Tasks 3, 4, Phase 1 DEV-193 (AIAction service)
**Risk:** high (orchestrates financial data across multiple sources)
**Success:** Full generation produces insights from real data sources, errors isolated per analyzer
**Review:** `financial-data-validator`

#### Task 6: Cash flow + overdue analyzers
**Files:** new `apps/api/src/domains/ai/services/analyzers/cash-flow.analyzer.ts`, new `analyzers/overdue.analyzer.ts`, new `__tests__/analyzers.test.ts`
**What:**
- **Cash Flow Analyzer** — `analyzeCashFlow(projection, metrics)`:
  - Uses `getCashFlowProjection()` data (30-day forecast)
  - Triggers `cash_flow_warning` if projected balance drops below threshold (configurable, default $5,000 / 500000 cents)
  - Priority: critical if < 2 weeks, high if < 4 weeks
  - triggerId: `cash_flow_warning:{entityId}:{YYYY-MM}`
  - Metadata: `{ currentBalance, projectedLow, daysUntilLow, threshold }`
- **Overdue Analyzer** — `analyzeOverdue(actionItems)`:
  - Uses `getActionItems()` data (OVERDUE_INVOICE, OVERDUE_BILL)
  - Triggers `overdue_alert` if any overdue items exist
  - Groups by type: "3 invoices overdue totaling $4,200; 1 bill overdue totaling $500"
  - Priority: high if total > $1,000 (100000 cents), critical if > $10,000 (1000000 cents)
  - triggerId: `overdue_alert:{entityId}:{YYYY-MM}`
  - Metadata: `{ overdueInvoices: N, overdueBills: N, totalAmount, items[] }`
- Both are pure functions: accept data, return `InsightResult[]`
**Depends on:** Task 5 (types)
**Success:** Analyzers produce correct insights from sample data, amounts in integer cents
**Review:** `financial-data-validator`

#### Task 7: Spending anomaly + duplicate expense analyzers
**Files:** new `analyzers/spending.analyzer.ts`, new `analyzers/duplicate.analyzer.ts`
**What:**
- **Spending Analyzer** — `analyzeSpending(expenseBreakdown)`:
  - Uses `getExpenseBreakdown()` data (6 months by category)
  - Compares current month to 3-month rolling average
  - Triggers `spending_anomaly` if any category is >30% above average AND absolute increase > $100 (10000 cents)
  - Priority: medium (>30%), high (>50%), critical (>100%)
  - triggerId: `spending_anomaly:{entityId}:{categoryId}:{YYYY-MM}`
  - Metadata: `{ categoryName, currentAmount, averageAmount, percentIncrease }`
- **Duplicate Detector** — `analyzeDuplicates(transactions)`:
  - Accepts recent transactions (last 7 days)
  - Groups by similar description (case-insensitive exact match after trimming) + same amount + within 48 hours
  - Triggers `duplicate_expense` per duplicate pair found
  - Priority: medium (always — user must decide)
  - triggerId: `duplicate_expense:{entityId}:{txnId1}:{txnId2}` (sorted IDs for determinism)
  - Metadata: `{ transaction1: { id, description, amount, date }, transaction2: { ... } }`
- Both pure functions
**Depends on:** Task 5 (types)
**Success:** Spending detects anomalies above threshold, duplicates find similar transactions

#### Task 8: Revenue trend + reconciliation gap analyzers
**Files:** new `analyzers/revenue.analyzer.ts`, new `analyzers/reconciliation.analyzer.ts`
**What:**
- **Revenue Analyzer** — `analyzeRevenue(entityId, tenantId)`:
  - Calls `reportService.generateProfitLoss()` for current vs prior month
  - Triggers `revenue_trend` if revenue changes >15% month-over-month
  - Positive trend = low priority (informational), negative = high priority
  - triggerId: `revenue_trend:{entityId}:{YYYY-MM}`
  - Metadata: `{ currentRevenue, priorRevenue, percentChange, direction }`
  - Note: This analyzer needs DB access (calls report service directly)
- **Reconciliation Analyzer** — `analyzeReconciliation(entityId, tenantId)`:
  - Gets all bank accounts for entity, calls `reconciliationService.getReconciliationStatus()` per account
  - Triggers `reconciliation_gap` per account where `reconciliationPercent < 80%`
  - Priority: medium (60-80%), high (<60%), critical (<40%)
  - triggerId: `reconciliation_gap:{entityId}:{accountId}:{YYYY-MM}`
  - Metadata: `{ accountName, totalBankFeed, matched, unmatched, reconciliationPercent }`
  - Note: This analyzer needs DB access (calls reconciliation service)
- These two are NOT pure functions — they receive entityId/tenantId and call services
**Depends on:** Task 5 (types)
**Risk:** high (revenue uses report service financial data, reconciliation crosses banking domain)
**Success:** Revenue detects >15% changes, reconciliation flags low-match accounts
**Review:** `financial-data-validator`, `architecture-strategist`

#### Task 9: Wire import trigger + generation timer
**Files:** modify `apps/api/src/domains/banking/services/import.service.ts`, modify `apps/api/src/index.ts` (server startup)
**What:**
- **Import hook:** In `import.service.ts` after `autoCategorize()` succeeds (~line 556), call `insightGenerator.generateForImport(entityId, transactionIds)` in try/catch (non-blocking, non-critical)
- **Server timer (optional):** In `index.ts` server startup, add configurable `setInterval` for insight generation:
  - ENV var: `INSIGHT_GENERATION_INTERVAL_MS` (default: 0 = disabled)
  - If enabled: queries active entities, runs `generateAll()` for each
  - Follows `report-cache.ts` pattern (`.unref()` so it doesn't keep process alive)
  - Log each run: `server.log.info({ entityCount, insightCount }, 'Scheduled insight generation complete')`
- **Phase 1 Action Executor integration:** Add `ALERT` case to action-executor — dismiss action = dismiss linked insight
**Depends on:** Tasks 5-8, Phase 1 DEV-198 (Action Executor)
**Risk:** high (modifying import pipeline — must be non-blocking)
**Success:** Import triggers spending+duplicate analyzers, timer fires when enabled
**Review:** `architecture-strategist`

---

### Sprint 3c: Monthly Close Package (Tasks 10-11)

#### Task 10: Monthly close readiness service
**Files:** new `apps/api/src/domains/ai/services/monthly-close.service.ts`, new `__tests__/monthly-close.service.test.ts`
**What:**
- `MonthlyCloseService` class (constructor: tenantId, userId)
- `getCloseReadiness(entityId, periodId)` → `CloseReadinessReport`:
  1. Fetch fiscal period (validate it's OPEN or LOCKED)
  2. Run checklist items (each returns `{ label, status: 'pass'|'fail'|'warn', count, details }`):
     - **Unreconciled transactions:** Query bank txns in period date range with `journalEntryId: null`. Pass=0, warn<5, fail>=5.
     - **Overdue invoices:** Query invoices with dueDate in period, status SENT. Pass=0, fail=any.
     - **Overdue bills:** Same pattern for bills.
     - **Draft journal entries:** Query JEs in period with status DRAFT. Pass=0, warn<3, fail>=3.
     - **Pending AI actions:** Query AIActions for entity with status PENDING. Pass=0, warn=any.
     - **Unresolved insights:** Query active critical/high insights. Pass=0, warn=any.
     - **Account reconciliation:** `getReconciliationStatus()` per account. Pass>95%, warn>80%, fail<80%.
  3. Calculate weighted score: each item has weight (total = 100). Score = `sum(weight * pass_factor)`. pass=1.0, warn=0.5, fail=0.0.
  4. `canClose`: true only if score === 100 (no failures, no warnings)
  5. Return: `{ periodId, periodName, score, canClose, items[], generatedAt }`
- `executeClose(entityId, periodId)` — pre-validates `canClose` via `getCloseReadiness()`, then calls `fiscalPeriodService.lockPeriod()` followed by `closePeriod()`. Creates audit log entry.
**Depends on:** Phase 1 DEV-192 (AIAction model), fiscal period service (exists)
**Risk:** high (orchestrates monthly close — financial integrity critical)
**Success:** Score reflects real data; executeClose only works when score=100; wraps existing fiscal service
**Review:** `financial-data-validator`, `security-sentinel`

#### Task 11: Monthly close API routes
**Files:** modify `apps/api/src/domains/ai/routes.ts`, new `schemas/monthly-close.schema.ts`, new `__tests__/monthly-close.routes.test.ts`
**What:**
- `GET /api/ai/monthly-close/readiness?entityId=X&periodId=Y` — returns close readiness report
- `POST /api/ai/monthly-close/execute` — body: `{ entityId, periodId }` — executes close (lock + close)
- `GET /api/ai/monthly-close/history?entityId=X` — list past close events (from audit log)
- Zod schemas: `CloseReadinessSchema`, `ExecuteCloseSchema`, `CloseHistorySchema`
- Tests: readiness returns score, execute blocked when score<100, tenant isolation
**Depends on:** Task 10
**Review:** `fastify-api-reviewer`, `security-sentinel`

---

### Sprint 3d: Frontend (Tasks 12-14)

#### Task 12: Frontend API client + types for insights & monthly close
**Files:** modify `apps/web/src/lib/api/ai.ts`
**What:**
- Replace placeholder `AIInsight` type with real type matching backend (type/priority/status unions, metadata, dismiss/snooze fields, triggerId)
- Remove `AIRecommendation` type (merged into insights concept)
- Add types: `InsightCounts`, `CloseReadinessReport`, `CloseReadinessItem`, `InsightType`, `InsightPriority`, `InsightStatus`
- Replace `getInsights()` stub: add `entityId` param + query params for filters + cursor pagination
- Replace `getRecommendations()` → remove (no longer needed)
- Add: `getInsight(id)`, `dismissInsight(id)`, `snoozeInsight(id, until)`, `generateInsights(entityId, types?)`, `getInsightCounts(entityId)`, `getCloseReadiness(entityId, periodId)`, `executeClose(entityId, periodId)`, `getCloseHistory(entityId)`
**Depends on:** Tasks 4, 11
**Success:** Types match backend, all functions callable

#### Task 13: Insights list page — replace chat-only UI
**Files:** modify `apps/web/src/app/(dashboard)/insights/page.tsx`, new `insights/insights-client.tsx`, new `insights/insight-card.tsx`, modify `chat-interface.tsx` (move to sub-section or tab)
**What:**
- **page.tsx** (Server Component): Fetch insights + counts via API client, pass to client component
- **insights-client.tsx** (Client Component):
  - Tab layout: "Insights" (default) | "AI Chat" (preserves existing chat interface)
  - Filter bar: type dropdown (7 types), priority dropdown (4 levels), status dropdown
  - Insight cards list/grid
  - "Generate Insights" button → calls `generateInsights(entityId)`, refreshes list optimistically
  - Insight counts summary at top (colored badges by priority)
- **insight-card.tsx** (Client Component):
  - Glass card with: type icon + label, title (`font-heading`), description, priority badge (critical=`text-ak-red`, high=`text-primary`, medium=`text-ak-blue`, low=`text-muted-foreground`), timestamp
  - Actions: "Dismiss" button, "Snooze" dropdown (1 day, 1 week, 1 month), "View Details" expand
  - Metadata section (collapsible): analyzer-specific data (amounts in `font-mono`, formatted via `formatCurrency`)
  - Actionable insights: "Take Action" link → navigates to relevant page (overdue → invoices, reconciliation → banking)
- loading.tsx + error.tsx already exist for `/insights`
**Depends on:** Task 12
**Success:** Insights render with real data, filters work, dismiss/snooze updates list
**Review:** `design-system-enforcer`, `nextjs-app-router-reviewer`

#### Task 14: Monthly Close page + dashboard widget
**Files:** modify `apps/web/src/app/(dashboard)/insights/policy-alerts/page.tsx` (repurpose), new `monthly-close-client.tsx`, modify navigation.ts, modify dashboard overview widget area
**What:**
- **Repurpose `/insights/policy-alerts`** → Monthly Close page:
  - Update `navigation.ts`: rename "Policy Alerts" label to "Monthly Close", change icon `AlertTriangle` → `ClipboardCheck`
  - Server Component fetches close readiness for current open period
  - **monthly-close-client.tsx** (Client Component):
    - Period selector (dropdown of OPEN/LOCKED periods)
    - Close Readiness Score: large circular progress (0-100%), color-coded (`text-ak-green` >80, `text-primary` >50, `text-ak-red` <50)
    - Checklist items: glass cards, each with pass/warn/fail icon, label, count, expandable details
    - "Close Month" button: enabled only when `canClose=true`, confirmation dialog before executing
    - Close history section: table of past closes with date, period name
  - loading.tsx + error.tsx already exist at this path
- **Dashboard widget enhancement:**
  - Add "AI Insights" mini-widget to overview: count of active insights by priority, top 1 critical insight preview
  - Link to `/insights` page
  - Uses `getInsightCounts()` API
**Depends on:** Tasks 12, 13
**Success:** Monthly Close page shows real readiness score, close button works, dashboard shows insight count
**Review:** `design-system-enforcer`, `nextjs-app-router-reviewer`

---

## Sprint Dependency Graph

```
PHASE 1 Prerequisites:
  DEV-192 (AIAction model) ────────────┐
  DEV-193 (AIAction service) ──────────┤
  DEV-198 (Action Executor) ───────────┘
                                        │
Sprint 3a:  T1 (no deps) ──────────────┤
            T2 ← T1                     │
            T3 ← T1, T2                 │
            T4 ← T3                     │
                                        │
Sprint 3b:  T5 ← T3, T4, DEV-193       │
            T6 ← T5 (types)             │
            T7 ← T5 (types)             │
            T8 ← T5 (types)             │
            T9 ← T5-T8, DEV-198         │
                                        │
Sprint 3c:  T10 ← DEV-192              │
            T11 ← T10                   │
                                        │
Sprint 3d:  T12 ← T4, T11              │
            T13 ← T12                   │
            T14 ← T12, T13             │
```

**Parallelizable:** T1 (start immediately), T6+T7+T8 (all depend only on T5 types), T10 can run in parallel with Sprint 3b (independent of analyzers)

## Reference Files

| File | Pattern to Reuse |
|------|-----------------|
| `apps/api/src/domains/banking/services/category.service.ts` | Service class pattern (constructor tenantId/userId, tenant-isolated CRUD) |
| `apps/api/src/domains/accounting/services/fiscal-period.service.ts` | Monthly close wraps `lockPeriod()`/`closePeriod()` |
| `apps/api/src/domains/overview/services/dashboard.service.ts` | Data sources: `getMetrics`, `getCashFlowProjection`, `getExpenseBreakdown`, `getActionItems` |
| `apps/api/src/domains/banking/services/reconciliation.service.ts` | `getReconciliationStatus()` for reconciliation gap analyzer |
| `apps/api/src/domains/accounting/services/report.service.ts` | `generateProfitLoss()` for revenue trend analyzer |
| `apps/api/src/domains/banking/services/import.service.ts` | Hook point: after `autoCategorize()` (~line 556) |
| `apps/api/src/domains/accounting/services/report-cache.ts` | `setInterval` pattern for lightweight scheduled task |
| `apps/api/src/domains/ai/routes.ts` | Current 501 stubs to replace (lines 101-151) |
| `apps/web/src/lib/api/ai.ts` | Frontend API client with placeholder types to replace |
| `apps/web/src/app/(dashboard)/insights/` | Existing page structure (chat-interface.tsx, stubs) |
| `apps/web/src/lib/navigation.ts` | Navigation config: insights domain (lines 266-289) |

## Edge Cases

- **No fiscal period exists:** Monthly Close returns `{ score: 0, canClose: false, items: [], error: 'No open fiscal period' }`.
- **Entity with zero transactions:** Analyzers return empty. No insights generated.
- **Duplicate insight with different data:** Upsert updates title/description/metadata but preserves createdAt. Status stays active.
- **Snooze expires during generation:** `expireStaleInsights()` reactivates snoozed insights past their date.
- **Close execution fails mid-way:** If `lockPeriod()` succeeds but `closePeriod()` fails, period stays LOCKED (safe — user can retry or reopen).
- **Concurrent generation:** `triggerId` unique constraint — second upsert updates instead of duplicating.
- **Multi-entity:** Each entity's insights independent. Dashboard widget shows selected entity's counts.
- **Report service fails:** Revenue analyzer catches error, logs, returns empty. Other analyzers unaffected.
- **Import with 0 new transactions:** `generateForImport` early-returns if no transaction IDs.
- **Close when period already LOCKED:** `executeClose` skips `lockPeriod()`, proceeds to `closePeriod()`.

## Domain Impact

- **Primary:** AI/Insights (new services + routes + UI)
- **Adjacent:** Banking (import hook, reconciliation data), Accounting (report data, fiscal period wrapping), Overview (dashboard widget)
- **Schema changes:** Additive migration on Insight model (new optional fields + unique constraint)

## Testing Strategy

- **Unit tests:** Each analyzer tested with mock data (pure function pattern for 5 of 7)
- **Service tests:** InsightService CRUD with dedup, MonthlyCloseService readiness calculation
- **Route tests:** All endpoints with tenant isolation, authorization
- **Financial assertions:** All amounts in integer cents, reconciliation percentages validated
- **Integration:** Import 10 txns → generate insights → verify spending/duplicate insights created → dismiss one → verify dismissed
- **Monthly close:** Create period → generate readiness → resolve all items → close → verify period CLOSED
- **Run per task:** `cd apps/api && npx vitest run`

## Estimated Effort

| Sprint | Tasks | Days | Risk |
|--------|-------|------|------|
| 3a: Insight Infrastructure | 4 | 2-3 | Low-Med |
| 3b: Analyzers | 5 | 3-4 | High |
| 3c: Monthly Close | 2 | 2-3 | High |
| 3d: Frontend | 3 | 3-4 | Low-Med |
| **Total** | **14** | **10-14** | |

---

## Progress

- [ ] Task 1: Insight schema enhancement
- [ ] Task 2: Insight types, constants, Zod schemas
- [ ] Task 3: Insight CRUD service
- [ ] Task 4: Insight API routes
- [ ] Task 5: Insight generator service (orchestrator)
- [ ] Task 6: Cash flow + overdue analyzers
- [ ] Task 7: Spending anomaly + duplicate expense analyzers
- [ ] Task 8: Revenue trend + reconciliation gap analyzers
- [ ] Task 9: Wire import trigger + generation timer
- [ ] Task 10: Monthly close readiness service
- [ ] Task 11: Monthly close API routes
- [ ] Task 12: Frontend API client + types
- [ ] Task 13: Insights list page
- [ ] Task 14: Monthly Close page + dashboard widget
