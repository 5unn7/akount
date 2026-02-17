# Phase 5 Fastify API Review -- Reports & Data Export

**Reviewer:** fastify-api-reviewer
**Date:** 2026-02-17
**Scope:** 12 files across accounting domain (reports, export, cache) and system domain (data export)
**Verdict:** CONDITIONAL PASS -- 3 P0 blockers, 6 P1 issues, 9 P2 improvements

---

## Summary

The Phase 5 report API is well-structured overall. Route handlers are thin, business logic lives in `ReportService`, Zod schemas validate all inputs, tenant isolation is enforced via `tenantScopedQuery`, and error handling is consistent. The code demonstrates strong awareness of financial invariants (BigInt handling, integer cents, soft delete filters) and security concerns (CSV injection prevention, rate limiting, filename sanitization).

However, there are three blocking issues related to tenant isolation in a helper method, a type-safety gap that could cause runtime errors, and an incomplete CSV injection defense. Six additional P1 issues and nine P2 improvements are documented below.

---

## P0 -- BLOCKING

### P0-1: `validateMultiEntityCurrency` missing tenantId filter

**File:** `apps/api/src/domains/accounting/services/report.service.ts:285-299`
**Issue:** The `validateMultiEntityCurrency` method queries entities by `id IN (...)` but does NOT include `tenantId` in the where clause. While the `entityIds` array is sourced from `getEntityIds()` (which does filter by tenantId), this violates defense-in-depth. If any caller ever passes entity IDs from a different source, it could leak cross-tenant currency information.

```typescript
// CURRENT (line 286-288)
const entities = await prisma.entity.findMany({
  where: { id: { in: entityIds } },  // Missing tenantId!
  select: { functionalCurrency: true },
});

// SHOULD BE
const entities = await prisma.entity.findMany({
  where: { id: { in: entityIds }, tenantId: this.tenantId },
  select: { functionalCurrency: true },
});
```

**Impact:** Violates the project's "every query MUST filter by tenantId" invariant. The current flow is safe because callers produce tenant-filtered IDs, but defense-in-depth requires the query itself to be safe regardless of caller context.

**Fix:** Add `tenantId: this.tenantId` to the where clause.

---

### P0-2: `sanitizeCsvCell` in ReportExportService accepts `string` but receives `string | null`

**File:** `apps/api/src/domains/accounting/services/report-export.service.ts:26,275`
**Issue:** The `sanitizeCsvCell` method signature is `(value: string): string` but `glLedgerToCsv` passes `entry.memo` which is typed as `string | null` (per the `GLLedgerEntry` interface at `report.service.ts:143`). This is a TypeScript type mismatch that only works because the `!value` guard on line 27 happens to catch null. In strict mode or with future refactors, this could become a runtime error.

```typescript
// Line 275 -- passing null to a string parameter
this.sanitizeCsvCell(entry.memo),  // entry.memo: string | null
```

**Impact:** Type unsafety. If TypeScript strict null checks are enabled (or the guard is modified), this causes a compile-time or runtime error.

**Fix:** Change the method signature to `(value: string | null): string` or coerce at the call site: `this.sanitizeCsvCell(entry.memo ?? '')`.

---

### P0-3: CSV injection defense bypasses comma/quote escaping for formula-prefixed values

**File:** `apps/api/src/domains/accounting/services/report-export.service.ts:26-39`
**Issue:** When a cell value starts with a formula character (`=`, `+`, `-`, `@`, tab, CR) AND also contains commas or quotes, the function returns early with just a single-quote prefix (`'value`) but does NOT wrap the result in double quotes. This means commas in the value will break the CSV column structure.

Example: input `"-Revenue, Net"` triggers the formula guard (starts with `-`), returns `'"-Revenue, Net"` -- the comma splits this across columns incorrectly.

```typescript
// Line 30-31 -- returns BEFORE comma/quote escaping
if (/^[=+\-@\t\r]/.test(value)) {
  return `'${value}`;  // No quoting applied!
}
```

**Impact:** Malformed CSV output when expense/account names start with `-` or `+` and contain commas. This is both a data integrity and a security issue (partial injection defense).

**Fix:** Apply both defenses:
```typescript
if (/^[=+\-@\t\r]/.test(value)) {
  const escaped = value.replace(/"/g, '""');
  return `"'${escaped}"`;  // Prefix AND quote
}
```

Note: the `data-export.service.ts:113-131` implementation handles this correctly with `"'${str.replace(/"/g, '""')}"` -- the two services are inconsistent.

---

## P1 -- SHOULD FIX

### P1-1: `format` query parameter not included in Zod schemas

**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts` (all schemas)
**File:** `apps/api/src/domains/accounting/routes/report.ts:63,121,179,236,288`
**Issue:** Routes cast the query to `XxxQuery & { format?: string }` to access a `format` parameter, but none of the Zod schemas define `format`. This means the `format` value bypasses Zod validation entirely -- any string value is accepted without type checking.

```typescript
// Route casts around validation (line 63)
const query = request.query as ProfitLossQuery & { format?: string };

// Schema does NOT include format
export const ProfitLossQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  // format is missing!
});
```

Since the `ExportFormatSchema` exists at line 95 (`z.enum(['json', 'csv', 'pdf'])`), it should be integrated into the query schemas.

**Impact:** Unvalidated user input for the format field. A malicious or erroneous `format=xml` silently falls through to JSON response (which is safe but incorrect behavior). More importantly, this sets a bad precedent for bypassing validation.

**Fix:** Add `format: ExportFormatSchema.optional()` to each query schema, or add it as a shared extension.

---

### P1-2: Spending and Revenue reports lack CSV/PDF export support

**File:** `apps/api/src/domains/accounting/routes/report.ts:337-390`
**Issue:** The Spending and Revenue route handlers do not check for `format` and always return JSON. This is inconsistent with the other 5 report endpoints that support `format=csv` and/or `format=pdf`. The `reportExportService` also does not have `spendingToCsv` or `revenueToCsv` methods.

**Impact:** Inconsistent API behavior. Users expect all report endpoints to support export formats.

**Fix:** Either add CSV/PDF export to spending/revenue endpoints, or document that these endpoints only support JSON. At minimum, add a `format` check that returns 400 for unsupported formats.

---

### P1-3: `GLLedgerReport` and `SpendingReport` interfaces missing `currency` field

**File:** `apps/api/src/domains/accounting/services/report.service.ts:152-161,166-177`
**Issue:** The `GLLedgerReport` interface does not include a `currency` field, yet the route handler accesses `report.currency` at line 300 of `report.ts`. The `SpendingReport` interface similarly lacks `currency`. Other report interfaces (ProfitLossReport, BalanceSheetReport, CashFlowReport) all include it.

```typescript
// GLLedgerReport (line 152-161) -- no currency field
export interface GLLedgerReport {
  entityId: string;
  glAccountId: string;
  accountCode: string;
  accountName: string;
  // ...no currency!
}

// But route accesses it (report.ts:300)
report.currency  // This should be a TypeScript error
```

**Impact:** Either the `currency` field is returned at runtime (untyped) or this causes an `undefined` value in CSV export headers. Financial reports without currency denomination are ambiguous.

**Fix:** Add `currency: string` to both `GLLedgerReport` and `SpendingReport` interfaces, and ensure the service populates them.

---

### P1-4: No date range validation (endDate must be after startDate)

**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts` (all date-range schemas)
**Issue:** The schemas validate that dates are valid dates (via `z.coerce.date()`), but none validate that `endDate >= startDate`. A request with `endDate` before `startDate` will execute expensive SQL queries that return empty results.

```typescript
// Should add .refine() for date range validation
export const ProfitLossQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});
```

**Impact:** Wasted database resources on meaningless queries. Poor developer experience (no error message explaining the empty result).

**Fix:** Add `.refine()` to all schemas with start/end date pairs (ProfitLoss, CashFlow, GLLedger, Spending, Revenue).

---

### P1-5: No route-level integration tests for report endpoints

**File:** `apps/api/src/domains/accounting/__tests__/` (missing `report.routes.test.ts`)
**Issue:** There are service-level unit tests (`report.service.test.ts`) and schema tests (`report.schema.test.ts`), but no route-level integration tests. Other domains have route tests (e.g., `gl-account.routes.test.ts`, `journal-entry.routes.test.ts`). Route tests verify middleware chain (auth, tenant, validation), HTTP status codes, response shapes, and error handling.

**Impact:** The middleware chain, error handler (`handleAccountingError`), format switching logic, and PDF/CSV response headers are all untested. Any regression in these layers would go undetected.

**Fix:** Create `apps/api/src/domains/accounting/__tests__/report.routes.test.ts` covering at minimum:
- Authentication required (401 without token)
- Tenant isolation (403 for wrong tenant)
- Zod validation rejection (400 for invalid params)
- JSON response (200 with correct shape)
- CSV response (200 with content-type header)
- Error handling (AccountingError maps to correct status)

---

### P1-6: Service tests missing coverage for Trial Balance, GL Ledger, Spending, and Revenue

**File:** `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts`
**Issue:** The test file only covers 3 of 7 report methods: `generateProfitLoss`, `generateBalanceSheet`, and `generateCashFlow`. The remaining 4 methods have zero test coverage:
- `generateTrialBalance` -- verifies double-entry bookkeeping integrity
- `generateGLLedger` -- cursor pagination, running balance calculation
- `generateSpendingByCategory` -- percentage calculation
- `generateRevenueByClient` -- sourceDocument JSON parsing, percentage calculation

**Impact:** Critical financial logic (double-entry validation, running balance window functions, percentage calculations) is untested. The trial balance `isBalanced` / `severity` logic and the GL ledger cursor pagination are especially important to test.

**Fix:** Add test suites for all 4 missing methods. Priority:
1. `generateTrialBalance` (verifies accounting equation)
2. `generateGLLedger` (verifies cursor pagination and running balance)
3. `generateSpendingByCategory` and `generateRevenueByClient` (verify percentage math)

---

## P2 -- IMPROVEMENTS

### P2-1: Route handlers repeat tenant context check boilerplate

**File:** `apps/api/src/domains/accounting/routes/report.ts:59-61` (repeated 7 times)
**Issue:** Every route handler starts with the same null check:
```typescript
if (!request.tenantId || !request.userId) {
  return reply.status(500).send({ error: 'Missing tenant context' });
}
```
This is defensive but redundant since the tenant middleware (registered in `routes/index.ts:18`) already sets these values and rejects requests without them.

**Impact:** Code duplication across 7 handlers. Minor maintenance burden.

**Fix:** Either trust the middleware chain (remove the checks) or extract to a shared guard function. If kept for defense-in-depth, at minimum extract to a helper.

---

### P2-2: `ReportService` creates a new instance per request instead of using TenantContext

**File:** `apps/api/src/domains/accounting/routes/report.ts:64,122,178`
**Issue:** Each route handler creates `new ReportService(request.tenantId, request.userId)`. The established Akount pattern is to pass `TenantContext` to service methods, not to constructor-inject it. This diverges from the documented pattern in `api-conventions.md`.

```typescript
// Current pattern (class-based)
const service = new ReportService(request.tenantId, request.userId);
const report = await service.generateProfitLoss(query);

// Established pattern (function-based with TenantContext)
const report = await generateProfitLoss(query, request.tenant);
```

**Impact:** Architectural inconsistency. The class pattern is not wrong, but it diverges from other services.

**Fix:** This is an acceptable deviation for the report service since it has many methods sharing the same tenant context. Document the pattern choice. Low priority.

---

### P2-3: Balance sheet does not use cache like Profit & Loss

**File:** `apps/api/src/domains/accounting/services/report.service.ts:493-683`
**Issue:** The `generateProfitLoss` method uses `reportCache.get/set` (lines 364-368, 481), but `generateBalanceSheet`, `generateCashFlow`, `generateTrialBalance`, and other methods do not cache their results. Balance sheet runs 2 SQL queries and is equally expensive.

**Impact:** Missed performance optimization for repeated balance sheet requests within the 5-minute TTL window.

**Fix:** Add cache get/set to `generateBalanceSheet` and `generateCashFlow`. Trial balance and GL ledger may be less beneficial to cache due to their single-entity scope and lower request frequency.

---

### P2-4: `validateMultiEntityCurrency` crashes on empty entity list

**File:** `apps/api/src/domains/accounting/services/report.service.ts:298`
**Issue:** If `getEntityIds()` returns an empty array (tenant with no entities), `validateMultiEntityCurrency` accesses `entities[0].functionalCurrency` which throws `TypeError: Cannot read properties of undefined`. The `currencies.size > 1` check does not catch the zero-entity case.

```typescript
return entities[0].functionalCurrency;  // Crashes if entities is empty
```

**Impact:** Runtime crash for tenants with no entities attempting multi-entity reports. Edge case but unhandled.

**Fix:** Add a guard: `if (entities.length === 0) throw new AccountingError('No entities found', 'ENTITY_NOT_FOUND', 404)`.

---

### P2-5: `spending` report only considers debit amounts, ignoring credit offsets

**File:** `apps/api/src/domains/accounting/services/report.service.ts:1116`
**Issue:** The spending query sums only `jl."debitAmount"` for expense accounts. If an expense account has credit entries (e.g., expense refunds, adjustments), they are excluded from the spending total. This overstates actual spending.

```sql
COALESCE(SUM(jl."debitAmount"), 0) as "totalSpend"
-- Should be: SUM(jl."debitAmount") - SUM(jl."creditAmount")
```

**Impact:** Spending totals may be overstated when expense accounts have credit adjustments. For MVP this is acceptable but should be documented.

**Fix:** Change to `COALESCE(SUM(jl."debitAmount") - SUM(jl."creditAmount"), 0) as "totalSpend"` for accurate net spending, or document this as a known limitation.

---

### P2-6: `data-export.service.ts` does not validate entityId with CUID format

**File:** `apps/api/src/domains/system/routes.ts:366`
**Issue:** The data-export route reads `entityId` from query params without Zod validation:
```typescript
const { entityId } = request.query as { entityId?: string };
```
While the service does validate entity ownership via Prisma lookup, the entityId format is not validated at the route level.

**Impact:** Minor -- invalid IDs will simply not match any entity in the database. But it bypasses the project's "all inputs validated with Zod" standard.

**Fix:** Add a Zod query schema: `z.object({ entityId: z.string().cuid().optional() })`.

---

### P2-7: Report cache not invalidated when journal entries are posted/voided

**File:** `apps/api/src/domains/accounting/services/report-cache.ts`
**Issue:** The cache has a 5-minute TTL and supports `invalidate()` with regex patterns, but there is no code that calls `invalidate()` when journal entries are created, posted, or voided. This means reports could show stale data for up to 5 minutes after financial activity.

**Impact:** For a real-time financial system, 5-minute stale data is generally acceptable for report views. However, the invalidation hook should be documented as a future enhancement.

**Fix:** Add cache invalidation calls in `journal-entry.service.ts` when entries are posted or voided:
```typescript
reportCache.invalidate(tenantId, /report:/);
```

---

### P2-8: Schema tests lack negative test cases for date validation

**File:** `apps/api/src/domains/accounting/schemas/__tests__/report.schema.test.ts`
**Issue:** Schema tests verify happy paths and one security case (empty entityId), but lack negative test cases for:
- Invalid date formats (e.g., `"not-a-date"`, `"2026-13-01"`)
- Missing required fields for each schema
- Non-CUID entity IDs
- Negative or zero limit values
- Invalid comparisonPeriod enum values

**Impact:** Weak schema test coverage. Validation regressions would not be caught.

**Fix:** Add negative test cases for each schema. Focus on boundary conditions.

---

### P2-9: `handleAccountingError` does not include request context in log

**File:** `apps/api/src/domains/accounting/routes/report.ts:405-419`
**Issue:** The generic error handler logs `{ err: error }` but does not include request context (route path, query params, entityId). This makes debugging production errors harder because you cannot tell which report or parameters caused the failure.

```typescript
// Current (line 415)
reply.request.log.error({ err: error }, 'Report generation error');

// Better
reply.request.log.error(
  { err: error, path: reply.request.url, query: reply.request.query },
  'Report generation error'
);
```

**Impact:** Reduced observability in production.

**Fix:** Add request context to the error log.

---

## Positive Observations

1. **Tenant isolation via `tenantScopedQuery` wrapper** -- All raw SQL queries go through a centralized wrapper that validates tenantId presence and checks the SQL string for tenantId references. This is excellent defense-in-depth.

2. **BigInt safety** -- The `convertBigInt` method checks `Number.isSafeInteger()` before conversion, preventing silent data corruption for very large amounts.

3. **Rate limiting** -- All report endpoints use `statsRateLimitConfig()` (50 req/min), preventing abuse of expensive aggregation queries.

4. **Permission system** -- All routes use `withPermission('accounting', 'reports', 'VIEW')`, enforcing RBAC at the route level.

5. **Filename sanitization** -- The `sanitizeFilename` function prevents path traversal and limits length to 100 chars.

6. **Bounded cache** -- The report cache has a 500-entry limit, active sweep every 60 seconds, and TTL-based expiration. The `unref()` on the timer prevents blocking process exit.

7. **CSV injection prevention** -- Both `report-export.service.ts` and `data-export.service.ts` implement OWASP-recommended formula injection prevention (though the former has a bug -- see P0-3).

8. **Soft delete filters** -- All SQL queries include `je."deletedAt" IS NULL AND jl."deletedAt" IS NULL`, correctly filtering soft-deleted records.

9. **Auth + tenant middleware chain** -- Applied at the domain level in `routes/index.ts:17-18`, ensuring all child routes inherit the middleware.

10. **Custom error types** -- `AccountingError` with typed error codes enables consistent error responses and machine-readable error handling.

---

## File Inventory

| File | Lines | Status |
|------|-------|--------|
| `apps/api/src/domains/accounting/routes/report.ts` | 420 | 3 P0, 2 P1, 2 P2 |
| `apps/api/src/domains/accounting/routes/index.ts` | 51 | PASS |
| `apps/api/src/domains/accounting/schemas/report.schema.ts` | 98 | 2 P1 |
| `apps/api/src/domains/accounting/schemas/__tests__/report.schema.test.ts` | 182 | 1 P2 |
| `apps/api/src/domains/accounting/services/report.service.ts` | 1232 | 1 P0, 1 P1, 3 P2 |
| `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts` | 610 | 1 P1 |
| `apps/api/src/domains/accounting/services/report-cache.ts` | 158 | 1 P2 |
| `apps/api/src/domains/accounting/services/report-export.service.ts` | 290 | 1 P0 |
| `apps/api/src/domains/accounting/errors.ts` | 40 | PASS |
| `apps/api/src/domains/system/services/data-export.service.ts` | 277 | PASS |
| `apps/api/src/domains/system/routes.ts` | 431 | 1 P2 |
| `apps/api/src/lib/tenant-scoped-query.ts` | 33 | PASS |

---

## Action Items (Priority Order)

1. **[P0-1]** Add `tenantId` filter to `validateMultiEntityCurrency` query
2. **[P0-2]** Fix `sanitizeCsvCell` type signature to accept `string | null`
3. **[P0-3]** Fix CSV injection defense to apply quoting after formula prefix
4. **[P1-1]** Add `format` field to Zod query schemas using `ExportFormatSchema`
5. **[P1-3]** Add `currency` field to `GLLedgerReport` and `SpendingReport` interfaces
6. **[P1-4]** Add `.refine()` date range validation to all date-range schemas
7. **[P1-5]** Create route-level integration tests for report endpoints
8. **[P1-6]** Add service tests for Trial Balance, GL Ledger, Spending, Revenue
9. **[P1-2]** Add CSV export support to Spending and Revenue endpoints (or document as JSON-only)
