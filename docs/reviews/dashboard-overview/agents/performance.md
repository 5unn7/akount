# Performance Review: Phase 5 Reports -- Post-Implementation

**Reviewer:** performance-oracle
**Date:** 2026-02-17
**Scope:** Post-implementation review of Phase 5 financial reports (P&L, Balance Sheet, Cash Flow, Trial Balance, GL Ledger, Revenue, Spending)
**Prior Review:** Pre-implementation review dated 2026-02-16 (12 findings)

---

## Performance Assessment

- **Risk Level:** MEDIUM
- **Bottlenecks Identified:** 14 (5 new, 9 carried from pre-implementation)
- **Projected Scale:** Adequate at solopreneur scale (low thousands of journal lines). Critical path becomes the Balance Sheet inception-to-date query at 50K+ journal lines. Cache and PDF protections are well-implemented.
- **Pre-Implementation Findings Addressed:** 8 of 12 fully addressed, 2 partially addressed, 2 deferred correctly

---

## Pre-Implementation Findings: Resolution Status

| # | Pre-Implementation Finding | Status | Notes |
|---|---------------------------|--------|-------|
| 1 | Missing composite indexes | **FIXED** | Both indexes added in migration `20260216190747` |
| 2 | Multi-entity subquery injection risk | **FIXED** | Uses `Prisma.join(entityIds)` with pre-fetched array, not subquery |
| 3 | Balance Sheet inception-to-date scaling | **PARTIALLY FIXED** | Composite index helps; no snapshot optimization yet (correctly deferred) |
| 4 | Cash Flow double-query overhead | **PARTIALLY FIXED** | Reduced from 7 to 4 queries; P&L cache reuse works; cash queries parallelized |
| 5 | Retained earnings two queries | **NOT FIXED** | Still uses separate query for income statement in Balance Sheet |
| 6 | Unbounded in-memory cache | **FIXED** | 500-entry cap, 60s sweep, LRU-like eviction implemented |
| 7 | Cache TTL appropriateness | **FIXED** | TTL configurable via `REPORT_CACHE_TTL_MS` env var |
| 8 | GL Ledger cursor pagination | **FIXED** | Orders by `jl.id` (CUID, approximately chronological) |
| 9 | PDF generation memory/CPU | **FIXED** | 1000-entry limit, 30s timeout via `Promise.race` |
| 10 | Data backup memory pressure | **DEFERRED** | Not in scope of reviewed files (separate service) |
| 11 | Frontend payload size | **FIXED** | GL Ledger uses cursor pagination with configurable limit |
| 12 | getAccountBalances() O(n*m) | **CONFIRMED** | New ReportService uses SQL aggregation correctly |

---

## Post-Implementation Findings

### P0-1: Balance Sheet Issues Two Separate Heavy SQL Queries (Retained Earnings Not Consolidated)

**Severity:** P1 (High)
**Category:** Database
**Location:** `apps/api/src/domains/accounting/services/report.service.ts:493-683`
**Impact:** 2x the necessary database work on every Balance Sheet request. At 100K journal lines, this means two full scans of the GL data.

**Description:**

The `generateBalanceSheet()` method executes two major SQL queries:

1. **Lines 519-549:** Aggregates all ASSET, LIABILITY, EQUITY accounts with cumulative balances up to `asOfDate` (inception-to-date).
2. **Lines 597-623:** A second aggregation query for REVENUE and EXPENSE accounts to compute current-year net income for retained earnings.

Both queries scan the same `JournalLine`/`JournalEntry` tables with nearly identical join patterns and filter conditions. The only difference is the account type filter (`IN ('ASSET', 'LIABILITY', 'EQUITY')` vs `IN ('REVENUE', 'EXPENSE')`) and a different date lower bound (fiscal year start vs inception).

Additionally, `getFiscalYearBoundaries()` at line 305-330 issues 1-2 more queries (FiscalCalendar lookup + Entity lookup).

Total queries per Balance Sheet: 5 (validateEntityOwnership + entity fetch + main aggregation + retained earnings aggregation + fiscal year boundary).

**Suggested Fix:**

Combine the two aggregation queries into a single query that fetches ALL account types and uses CASE expressions for the retained earnings split:

```sql
SELECT
  gl."id" as "glAccountId",
  gl."code", gl."name", gl."type", gl."normalBalance",
  COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
  COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit",
  -- For retained earnings: only sum income/expense from fiscal year start
  COALESCE(SUM(CASE WHEN gl."type" IN ('REVENUE','EXPENSE')
    AND je."date" >= $fiscalYearStart THEN jl."debitAmount" ELSE 0 END), 0) as "fyDebit",
  COALESCE(SUM(CASE WHEN gl."type" IN ('REVENUE','EXPENSE')
    AND je."date" >= $fiscalYearStart THEN jl."creditAmount" ELSE 0 END), 0) as "fyCredit"
FROM "GLAccount" gl
INNER JOIN "Entity" e ON e.id = gl."entityId"
LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
WHERE e."tenantId" = $tenantId
  AND gl."entityId" IN ($entityIds)
  AND gl."type" IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')
  AND (jl.id IS NULL OR (je."status" = 'POSTED' AND je."date" <= $asOfDate
    AND je."deletedAt" IS NULL AND jl."deletedAt" IS NULL))
GROUP BY gl.id, gl.code, gl.name, gl.type, gl."normalBalance"
ORDER BY gl.code ASC
```

This eliminates one full table scan and reduces Balance Sheet generation to 3-4 queries total.

**Expected Improvement:** 30-40% faster Balance Sheet generation. Eliminates redundant I/O at scale.

---

### P0-2: Balance Sheet Missing Cache

**Severity:** P1 (High)
**Category:** Caching
**Location:** `apps/api/src/domains/accounting/services/report.service.ts:493-683`
**Impact:** Every Balance Sheet request hits the database, even for identical parameters within the cache TTL window.

**Description:**

The `generateProfitLoss()` method (line 364-368) correctly checks the cache before querying and stores the result after. However, `generateBalanceSheet()` has NO cache check or cache store. This is the most expensive report (inception-to-date scan), and it receives zero caching benefit.

All other reports that should be cached are also missing cache integration: `generateCashFlow()`, `generateTrialBalance()`, `generateSpendingByCategory()`, and `generateRevenueByClient()`.

Only `generateProfitLoss()` implements caching.

**Suggested Fix:**

Apply the same cache-check/cache-store pattern from `generateProfitLoss()` to all report generation methods, especially `generateBalanceSheet()`:

```typescript
async generateBalanceSheet(params) {
  const cacheKey = `report:balance-sheet:${params.entityId || 'all'}:${params.asOfDate.toISOString()}`;
  const cached = reportCache.get(this.tenantId, cacheKey);
  if (cached) return cached as BalanceSheetReport;

  // ... existing query logic ...

  reportCache.set(this.tenantId, cacheKey, report);
  return report;
}
```

**Expected Improvement:** Eliminates database queries for repeated Balance Sheet views within the 5-minute TTL. At typical usage patterns (user views report, adjusts parameters, views again), this prevents 50-70% of redundant queries.

---

### P0-3: Cash Flow Calls generateProfitLoss() Which Has Redundant Entity Validation

**Severity:** P2 (Medium)
**Category:** Algorithm / Database
**Location:** `apps/api/src/domains/accounting/services/report.service.ts:695-905`
**Impact:** 3 redundant database queries per Cash Flow request (entity ownership + entity fetch duplicated in both Cash Flow and the nested P&L call)

**Description:**

`generateCashFlow()` performs the following sequence:

1. Lines 705-718: Validates entity ownership and fetches entity details (2 queries).
2. Line 721-726: Calls `this.generateProfitLoss()` which validates entity ownership AGAIN and fetches entity details AGAIN (2 more queries internally at lines 376-388).
3. Lines 730-781: Two parallel cash balance queries (2 queries).
4. Lines 801-833: Account changes query (1 query).

Total: 7+ queries, with 2-3 being redundant due to the nested `generateProfitLoss()` call re-validating.

The P&L cache mitigates this if P&L was recently generated for the same parameters, but on cold cache the redundancy is present.

**Suggested Fix:**

Two options:

Option A: Pass validated entity context into `generateProfitLoss()` to skip re-validation (requires adding an internal parameter).

Option B (simpler): Rely on the P&L cache. If `generateProfitLoss()` is always cached, the redundant entity validation is trivially fast (cache hit returns immediately). Ensure Balance Sheet and Cash Flow both populate the cache so nested calls benefit.

**Expected Improvement:** Eliminates 2-3 redundant queries on cold cache. Negligible impact on warm cache.

---

### P0-4: ReportService Constructor Creates No Connection Pool Awareness

**Severity:** P2 (Medium)
**Category:** Architecture
**Location:** `apps/api/src/domains/accounting/services/report.service.ts:248-252`
**Impact:** New `ReportService` instance created per request, but this is stateless and cheap. No connection pool issue, but worth documenting.

**Description:**

Every route handler creates `new ReportService(request.tenantId, request.userId)`. The class is stateless (no database connection held), so this is not a leak. However, it means there is no request-level query deduplication: if a user requests both P&L and Cash Flow simultaneously, the two `ReportService` instances share no state.

**Suggested Fix:**

No immediate fix needed. This is the correct pattern for a stateless service in Fastify's request model. Document that cross-report deduplication relies entirely on the shared `reportCache` singleton.

**Expected Improvement:** None needed. This is a validation finding.

---

### P0-5: Revenue Report Uses JSONB Extraction Without Index

**Severity:** P1 (High)
**Category:** Database
**Location:** `apps/api/src/domains/accounting/services/report.service.ts:1184-1208`
**Impact:** PostgreSQL cannot use an index on `je."sourceDocument"->>'clientId'` without a GIN or expression index. At scale, this causes a sequential scan on the GROUP BY clause.

**Description:**

The Revenue by Client report groups by `je."sourceDocument"->>'clientId'` and `je."sourceDocument"->>'clientName'`. The `sourceDocument` column is a JSONB field containing a snapshot of the source invoice.

PostgreSQL cannot use standard B-tree indexes on JSONB path expressions. Without a GIN index or expression index, the GROUP BY must scan and extract values from every matching row.

At solopreneur scale (low hundreds of invoices), this is fine. At 10K+ journal entries with `sourceType = 'INVOICE'`, the JSONB extraction becomes the bottleneck.

**Suggested Fix:**

Option A (recommended for Phase 6): Add a GIN index on `sourceDocument`:

```sql
CREATE INDEX "JournalEntry_sourceDocument_gin"
ON "JournalEntry" USING gin("sourceDocument");
```

Option B (alternative): Add an expression index specifically for the clientId path:

```sql
CREATE INDEX "JournalEntry_sourceDocument_clientId_idx"
ON "JournalEntry" (("sourceDocument"->>'clientId'))
WHERE "sourceType" = 'INVOICE';
```

For Phase 5 MVP, this is acceptable without the index. The `sourceType = 'INVOICE'` filter significantly narrows the scan, and the composite index on `[entityId, status, deletedAt, date]` handles the primary WHERE clause efficiently.

**Expected Improvement:** 3-5x faster Revenue by Client at 10K+ journal entries. Not critical at MVP scale.

---

### P0-6: CSV Export Buffers Entire Report in Memory

**Severity:** P2 (Medium)
**Category:** Memory
**Location:** `apps/api/src/domains/accounting/services/report-export.service.ts:100-283`
**Impact:** For reports with thousands of line items, the entire CSV string is built in memory before sending. Peak memory: O(report_size).

**Description:**

All CSV export methods (e.g., `profitLossToCsv()`, `trialBalanceToCsv()`, `glLedgerToCsv()`) build an array of row strings and then `join('\n')` to produce the full CSV. The report data is already in memory (it was queried for the JSON response), so the CSV is essentially a second copy of the data in string form.

For P&L, Balance Sheet, Trial Balance, and Spending/Revenue reports, this is bounded by the number of GL accounts (typically under 200) and is negligible.

For GL Ledger CSV export, the data is already paginated (max 200 entries per page), so the CSV is also bounded.

The real concern would be if a "full export" (all pages) is added in the future without streaming.

**Suggested Fix:**

No immediate fix needed. The current bounded data sizes (GL accounts < 200, GL Ledger paginated to 200) mean the CSV is always small. If a "full GL Ledger export" feature is added, implement streaming at that point.

**Expected Improvement:** None needed at current scale. This is a forward-looking note.

---

### P0-7: PDF Generation Blocks the Event Loop

**Severity:** P1 (High)
**Category:** CPU / Concurrency
**Location:** `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx:24-94`
**Impact:** `@react-pdf/renderer`'s `renderToBuffer()` is CPU-bound and runs on the main event loop. During PDF generation (200-500ms for typical reports), no other requests can be processed by that Node.js thread.

**Description:**

The PDF generation uses `renderToBuffer()` from `@react-pdf/renderer`, which performs synchronous React rendering and PDF layout computation on the main thread. The timeout guard (`Promise.race` with 30s limit) prevents hung renders but does not prevent event loop blocking.

The protective measures already in place are good:
- Max 1000 line items (prevents extremely large renders).
- 30-second timeout (prevents hung processes).
- Rate limiting at 50 req/min (limits concurrent load).

However, if 5+ users simultaneously request PDF exports, the event loop will be blocked for 1-2.5 seconds total (5 x 200-500ms), causing all other API requests to queue.

**Suggested Fix:**

For Phase 5 MVP, the current implementation is acceptable given the solopreneur target audience (low concurrency). The 50 req/min rate limit provides sufficient protection.

For Phase 6+ scaling:
1. Move PDF generation to a worker thread using `worker_threads`:
```typescript
import { Worker } from 'worker_threads';

async function generatePdfInWorker(reportData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./pdf-worker.js', { workerData: reportData });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

2. Or use a job queue (e.g., BullMQ with Redis) for async PDF generation with a download link.

**Expected Improvement:** Eliminates event loop blocking. Enables concurrent PDF generation without degrading API responsiveness.

---

### P0-8: Cache Invalidation Pattern is Overly Broad

**Severity:** P2 (Medium)
**Category:** Caching
**Location:** `apps/api/src/domains/accounting/services/document-posting.service.ts:269,514,775`
**Impact:** Every document posting invalidates ALL cached reports for the tenant, including reports for unrelated entities and date ranges.

**Description:**

The cache invalidation in `DocumentPostingService` uses:
```typescript
reportCache.invalidate(this.tenantId, /^report:/);
```

The regex `/^report:/` matches ALL report cache entries for the tenant. This is correct for data consistency (posting a journal entry could affect any report), but is unnecessarily aggressive. A posting for Entity A in February 2026 invalidates cached P&L for Entity B in January 2025.

At solopreneur scale with 1-2 entities, the blast radius is small. But frequent posting activity (e.g., bulk importing 100 transactions and posting them) will thrash the cache completely, reducing hit rates to near zero during import operations.

**Suggested Fix:**

Scope cache invalidation to the affected entity:
```typescript
const entityPattern = entityId
  ? new RegExp(`^report:.*:${entityId}:`)
  : /^report:/;
reportCache.invalidate(this.tenantId, entityPattern);
// Also invalidate "all entities" consolidated reports
reportCache.invalidate(this.tenantId, /^report:.*:all:/);
```

This preserves cache entries for unrelated entities while correctly invalidating affected and consolidated reports.

**Expected Improvement:** 2-3x higher cache hit rate during periods of mixed activity (posting + report viewing for different entities).

---

### P0-9: Duplicate BigInt Conversion in Spending and Revenue Reports

**Severity:** P2 (Low)
**Category:** Algorithm
**Location:** `apps/api/src/domains/accounting/services/report.service.ts:1135-1141` and `1211-1219`
**Impact:** `convertBigInt()` called twice per row (once in `reduce`, once in `map`). Minor CPU waste.

**Description:**

In `generateSpendingByCategory()`:
```typescript
// Line 1135: First conversion in reduce
const totalSpend = results.reduce((sum, r) => sum + this.convertBigInt(r.totalSpend), 0);

// Lines 1138-1141: Second conversion in map
const categories = results.map((r) => ({
  category: r.category,
  amount: this.convertBigInt(r.totalSpend),  // Converts AGAIN
  percentage: totalSpend > 0 ? (this.convertBigInt(r.totalSpend) / totalSpend) * 100 : 0,
                                 // Converts a THIRD time
}));
```

Each BigInt value is converted 2-3 times. While `convertBigInt()` is trivial (just `Number()` + safe integer check), the pattern is wasteful and could be cleaned up.

**Suggested Fix:**

Convert once and reuse:
```typescript
const converted = results.map(r => ({
  ...r,
  totalSpendNum: this.convertBigInt(r.totalSpend),
}));
const totalSpend = converted.reduce((sum, r) => sum + r.totalSpendNum, 0);
const categories = converted.map(r => ({
  category: r.category,
  amount: r.totalSpendNum,
  percentage: totalSpend > 0 ? (r.totalSpendNum / totalSpend) * 100 : 0,
}));
```

**Expected Improvement:** Negligible at current scale. Code clarity improvement.

---

### P0-10: Frontend Report Views Use Array Index as React Key

**Severity:** P2 (Medium)
**Category:** React Performance
**Location:** `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:277` and `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx:319`
**Impact:** React cannot efficiently reconcile list updates when items are reordered or filtered. Using `idx` as key forces full re-render of all items when any item changes.

**Description:**

Both `PLSection` and `BSSection` components use array index as the React key:
```tsx
{items.map((item, idx) => (
  <div key={idx} ...>
```

Each `ReportLineItem` has a unique `accountId` field that should be used as the key instead.

**Suggested Fix:**
```tsx
{items.map((item) => (
  <div key={item.accountId} ...>
```

**Expected Improvement:** Faster React reconciliation when report data changes (e.g., switching between periods). At typical report sizes (50-200 accounts), the impact is small but follows React best practices.

---

### P0-11: Frontend Hardcodes Currency 'CAD' Instead of Using Report Currency

**Severity:** P2 (Medium -- correctness, not performance)
**Category:** Frontend
**Location:** `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:286` and `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx:329`
**Impact:** Line items always display in CAD regardless of the entity's functional currency. This is a correctness bug, not a performance bug, but it was discovered during the performance review.

**Description:**

Both `PLSection` and `BSSection` hardcode `'CAD'` as the currency:
```tsx
<span>{formatCurrency(item.balance, 'CAD')}</span>
```

Meanwhile, the parent component correctly uses `initialData.currency` for totals and headers. The line-item rendering should use the report's currency.

**Suggested Fix:**

Pass the currency prop through:
```tsx
function PLSection({ items, showComparison, currency }: {
  items: ReportLineItem[];
  showComparison: boolean;
  currency: string;
}) {
  // ...
  <span>{formatCurrency(item.balance, currency)}</span>
```

**Expected Improvement:** Correctness fix for multi-currency entities.

---

### P0-12: Recharts Library Imported Without Code Splitting

**Severity:** P2 (Medium)
**Category:** Bundle Size
**Location:** `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:6` and `bs-report-view.tsx:6`
**Impact:** Recharts adds approximately 200KB to the client bundle. Both report views import it at the top level.

**Description:**

Both P&L and Balance Sheet views import Recharts components directly:
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
```

Recharts is a large library (approximately 200KB minified, approximately 60KB gzipped). Since charts are only visible when a report has been generated (conditional rendering behind `{initialData && (...)}`), the chart components could be dynamically imported to avoid loading them until needed.

**Suggested Fix:**

Use Next.js dynamic imports for the chart section:
```tsx
import dynamic from 'next/dynamic';

const ReportChart = dynamic(() => import('./pl-report-chart'), {
  loading: () => <div className="h-48 glass rounded-xl animate-pulse" />,
  ssr: false,
});
```

Or accept the current approach since report pages are rarely visited by users who don't intend to view charts.

**Expected Improvement:** Approximately 200KB reduction in initial page bundle for report pages. Marginal impact since these are deep pages, not landing pages.

---

### P0-13: Frontend downloadReport() Creates Duplicate API Request

**Severity:** P2 (Medium)
**Category:** Network / Performance
**Location:** `apps/web/src/lib/api/reports.ts:345-388`
**Impact:** When user clicks "Download PDF" or "Download CSV", the frontend issues a NEW API request that re-generates the report, even though the JSON data was already fetched.

**Description:**

The `downloadReport()` function in the frontend API client makes a fresh `fetch()` call to the API with the `format=pdf` or `format=csv` query parameter. This triggers the full report generation pipeline again on the server (query database, generate report, then convert to PDF/CSV).

For PDF, the server must re-query the database because the PDF template needs the full report data. However, the JSON report data is already available on the client.

For CSV, the data transformation is simple enough to do client-side.

**Suggested Fix:**

Option A (CSV only): Generate CSV on the client from the already-fetched JSON data. This eliminates one API call:
```typescript
export function generateClientCsv(report: ProfitLossReport): string {
  // Build CSV from report object already in memory
}
```

Option B (for both): Accept the current approach since the server-side report cache will likely return a cache hit (within the 5-minute TTL), making the re-generation fast. The real work is PDF rendering, which must happen server-side.

**Expected Improvement:** Eliminates one API round-trip for CSV exports. PDF exports still require server-side generation.

---

### P0-14: No Response Compression Visible in Report Routes

**Severity:** P2 (Medium)
**Category:** Network
**Location:** `apps/api/src/domains/accounting/routes/report.ts`
**Impact:** JSON report responses (10-50KB) are sent uncompressed unless global compression is configured elsewhere.

**Description:**

The report routes send JSON responses via `reply.send(report)`. There is no explicit compression configuration. If `@fastify/compress` is registered globally on the Fastify instance, responses will be gzipped automatically. If not, report payloads are sent uncompressed.

A 50KB JSON report compresses to approximately 5-8KB with gzip, an 85% reduction in transfer size.

**Suggested Fix:**

Verify that `@fastify/compress` is registered in `apps/api/src/app.ts`. If not, add it:
```typescript
await fastify.register(import('@fastify/compress'), { global: true });
```

**Expected Improvement:** 80-90% reduction in response size for JSON report payloads.

---

## Database Index Coverage Analysis

### Indexes Created (Migration 20260216190747)

```sql
CREATE INDEX "JournalEntry_entityId_status_deletedAt_date_idx"
ON "JournalEntry"("entityId", "status", "deletedAt", "date");

CREATE INDEX "JournalLine_glAccountId_deletedAt_idx"
ON "JournalLine"("glAccountId", "deletedAt");
```

### Index Usage by Query

| Report | Primary Filter | Index Used | Coverage |
|--------|---------------|------------|----------|
| P&L | `entityId + type IN (...) + status + deletedAt + date range` | `JournalEntry_entityId_status_deletedAt_date_idx` on JE join | GOOD -- composite index covers WHERE clause |
| | `glAccountId GROUP BY + deletedAt` | `JournalLine_glAccountId_deletedAt_idx` | GOOD -- covers GROUP BY with soft-delete filter |
| Balance Sheet | Same as P&L but `date <= asOfDate` (no lower bound) | Same indexes | GOOD -- index scan from start to asOfDate |
| Trial Balance | `entityId + isActive + status + deletedAt + date` | `GLAccount_entityId_isActive` + JE composite | ADEQUATE -- two-index strategy |
| GL Ledger | `glAccountId + deletedAt + cursor` | `JournalLine_glAccountId_deletedAt_idx` + `jl.id ORDER` | GOOD -- index narrows to account, cursor uses PK |
| Spending | `entityId + type = EXPENSE + status + deletedAt + date range` | JE composite + GL `entityId_type` | GOOD |
| Revenue | `entityId + sourceType = INVOICE + status + deletedAt + date + JSONB extraction` | JE composite | ADEQUATE -- JSONB GROUP BY not indexed (see P0-5) |

### Missing Index Opportunities

1. **JSONB path index for Revenue report** (P0-5 above) -- `("sourceDocument"->>'clientId')` with partial index on `sourceType = 'INVOICE'`
2. **GLAccount `entityId + type + isActive`** -- would benefit Trial Balance and P&L that filter by account type. Currently only `entityId + type` and `entityId + isActive` exist separately.

---

## Cache Strategy Analysis

### Implementation Quality

| Aspect | Implementation | Rating |
|--------|---------------|--------|
| Bounded size | 500 entries max | GOOD |
| Active eviction | 60-second sweep timer | GOOD |
| Lazy eviction | On `get()` for expired entries | GOOD |
| Timer cleanup | `unref()` on interval, `destroy()` method | GOOD |
| Tenant scoping | Full key prefixed with `tenantId:` | GOOD |
| Invalidation | Regex-based pattern matching on tenant keys | ADEQUATE (see P0-8) |
| TTL configurability | Via `REPORT_CACHE_TTL_MS` env var | GOOD |
| Singleton pattern | Module-level export | GOOD |

### Cache Coverage Gap

| Report | Cached? | Impact |
|--------|---------|--------|
| Profit & Loss | YES | Most expensive P&L queries served from cache |
| Balance Sheet | **NO** | Most expensive query type has no caching |
| Cash Flow | **NO** | Inherits P&L cache via nested call, but own result not cached |
| Trial Balance | **NO** | Moderate query cost, no caching |
| GL Ledger | **NO** | Paginated, caching less beneficial |
| Spending | **NO** | Light query, caching optional |
| Revenue | **NO** | JSONB extraction query, would benefit from caching |

**Only 1 of 7 reports is cached.** This is the most significant performance gap in the implementation.

### Memory Estimate

With 500-entry cap and average report size of 50KB:
- Max memory: 500 * 50KB = 25MB
- Typical memory (20% fill rate): 5MB
- Memory is well-bounded and safe for production.

---

## Performance Metrics (Estimated)

| Metric | Estimate (cold cache) | Estimate (warm cache) | Target | Status |
|--------|----------------------|----------------------|--------|--------|
| P&L (1K journal lines) | <50ms | <5ms | <200ms | PASS |
| P&L (100K journal lines) | 200-400ms | <5ms | <200ms | MARGINAL (cold) |
| Balance Sheet (1K lines, inception) | <80ms | N/A (not cached) | <200ms | PASS |
| Balance Sheet (100K lines, inception) | 400ms-1s | N/A (not cached) | <200ms | FAIL |
| Cash Flow (cold, 4 queries) | 200-400ms | <50ms (P&L cached) | <500ms | PASS |
| Trial Balance (1K lines) | <50ms | N/A (not cached) | <200ms | PASS |
| GL Ledger (50 entries, paginated) | <20ms | N/A | <50ms | PASS |
| Spending by Category | <30ms | N/A | <200ms | PASS |
| Revenue by Client | <50ms | N/A | <200ms | PASS |
| PDF generation (200 accounts) | 200-500ms | N/A | <5s | PASS |
| CSV generation | <10ms | N/A | <1s | PASS |
| Cache memory (500 entries) | 5-25MB | N/A | <100MB | PASS |
| Report JSON payload | 10-50KB | N/A | <100KB | PASS |

---

## Prioritized Action Items

### Must Fix (P1)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| P0-2 | Only P&L is cached | Add cache check/store to all 6 remaining report methods (especially Balance Sheet) | 1 hour |
| P0-1 | Balance Sheet 2 redundant queries | Combine ASSET/LIABILITY/EQUITY + REVENUE/EXPENSE into single query with CASE | 2 hours |
| P0-5 | Revenue JSONB extraction unindexed | Add expression index on `sourceDocument->>'clientId'` (Phase 6 migration) | 30 min |
| P0-7 | PDF blocks event loop | Document for Phase 6; acceptable at MVP concurrency | N/A now |

### Should Fix (P2)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| P0-3 | Cash Flow redundant entity validation | Rely on P&L cache (low priority once P0-2 is fixed) | 30 min |
| P0-8 | Cache invalidation too broad | Scope invalidation to affected entity + consolidated | 30 min |
| P0-9 | Duplicate BigInt conversion | Convert once, reuse values | 15 min |
| P0-10 | Array index as React key | Use `item.accountId` instead of `idx` | 5 min |
| P0-11 | Hardcoded 'CAD' currency | Pass currency prop from parent | 10 min |
| P0-12 | Recharts bundle size | Consider dynamic import (optional) | 30 min |
| P0-13 | Download triggers duplicate API call | Accept for MVP; client-side CSV generation optional | 1 hour |
| P0-14 | Response compression | Verify `@fastify/compress` is registered globally | 5 min |

---

## Summary of What Was Done Well

1. **Raw SQL aggregation** -- Correct use of `tenantScopedQuery` wrapper with `SUM()`/`GROUP BY` instead of JavaScript reduction. This is the single biggest performance win over the prior `getAccountBalances()` pattern.

2. **Composite indexes** -- Both recommended indexes were created in a dedicated migration. The `[entityId, status, deletedAt, date]` composite on JournalEntry directly matches the WHERE clause of every report query.

3. **Bounded cache** -- The 500-entry cap, 60-second sweep, LRU-like eviction, and `unref()` on the timer are all production-quality patterns. The cache will not grow unbounded.

4. **PDF protective limits** -- The 1000-entry cap with CSV fallback, 30-second timeout via `Promise.race`, and `countLineItems()` recursive counter are all solid defensive measures.

5. **GL Ledger cursor pagination** -- Uses CUID-based cursor with configurable limit (max 200). Efficient for the account-scoped query pattern.

6. **Tenant isolation in cache** -- Cache keys are prefixed with `tenantId:`, and the `invalidate()` method only iterates keys for the requesting tenant. This prevents cross-tenant cache access.

7. **Cash Flow parallelization** -- Opening and closing cash balance queries run via `Promise.all()` (lines 730-781), halving the sequential query time for those two operations.

8. **CSV injection prevention** -- The `sanitizeCsvCell()` function prevents OWASP CSV injection by prefixing formula-triggering characters with a single quote.

---

## Approval Status

- **Status:** OPTIMIZATION RECOMMENDED
- **Performance:** GOOD (with P0-2 cache gap fixed, it becomes EXCELLENT for MVP scale)

The implementation is architecturally sound and follows the pre-implementation recommendations on indexes, cache bounding, and PDF protection. The most critical gap is that only 1 of 7 reports actually uses the cache (P0-2), and the Balance Sheet issues an unnecessary second heavy query (P0-1). Fixing these two findings would bring all reports within target response times at solopreneur scale.

For scaling beyond 100K journal lines, the Balance Sheet inception-to-date pattern will need the snapshot optimization documented in the pre-implementation review (Phase 6 concern, correctly deferred).
