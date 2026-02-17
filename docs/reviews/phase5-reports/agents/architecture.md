# Architecture Review: Phase 5 Reports

**Reviewer:** architecture-strategist
**Date:** 2026-02-17
**Branch:** feature/phase5-reports
**Risk Level:** MEDIUM
**Architectural Alignment:** GOOD

---

## Executive Summary

Phase 5 implements 7 financial report endpoints (P&L, Balance Sheet, Cash Flow, Trial Balance, GL Ledger, Spending by Category, Revenue by Client) with CSV/PDF export, an in-memory bounded cache, and corresponding Next.js frontend pages. The architecture is well-structured overall: clear separation of Route/Schema/Service layers, proper tenant isolation via `tenantScopedQuery`, and defense-in-depth security patterns. However, there are a handful of bugs, a significant cache invalidation gap, and several areas where the current design will need attention before production scale.

**Critical Findings:** 3 P0 issues (bugs/security), 5 P1 issues (architecture), 7 P2 issues (code quality)
**Overall Assessment:** Solid foundation with required fixes before merge
**Recommendation:** Fix P0 bugs, wire up missing cache invalidation, reconcile frontend/backend types

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `apps/api/src/domains/accounting/services/report.service.ts` | 1232 | Core report generation (7 reports) |
| `apps/api/src/domains/accounting/services/report-cache.ts` | 158 | In-memory bounded cache |
| `apps/api/src/domains/accounting/services/report-export.service.ts` | 290 | CSV export with OWASP protection |
| `apps/api/src/domains/accounting/schemas/report.schema.ts` | 98 | Zod validation schemas |
| `apps/api/src/domains/accounting/routes/report.ts` | 420 | Route handlers with format dispatch |
| `apps/api/src/domains/accounting/routes/index.ts` | 51 | Accounting domain route registration |
| `apps/api/src/domains/accounting/errors.ts` | 40 | Typed error codes |
| `apps/api/src/domains/accounting/templates/shared-styles.ts` | 210 | PDF shared styles and helpers |
| `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx` | 110 | React-PDF template for P&L |
| `apps/api/src/domains/system/services/data-export.service.ts` | 277 | Streaming ZIP data backup |
| `apps/api/src/lib/tenant-scoped-query.ts` | 33 | Tenant-scoped raw SQL wrapper |
| `apps/api/src/index.ts` | 277 | API entry point, cache lifecycle |
| `apps/web/src/app/(dashboard)/accounting/reports/page.tsx` | 121 | Reports index (Server Component) |
| `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/page.tsx` | 41 | P&L page (Server Component) |
| `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx` | 296 | P&L interactive view (Client Component) |
| `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/page.tsx` | 39 | Balance Sheet page (Server Component) |
| `apps/web/src/lib/api/reports.ts` | 415 | Frontend API client + types |

---

## P0 Findings (Must Fix Before Merge)

### P0-1: GLLedgerReport missing `currency` field causes runtime error on CSV export

**File:** `apps/api/src/domains/accounting/services/report.service.ts:152-161`
**Route:** `apps/api/src/domains/accounting/routes/report.ts:300`

The `GLLedgerReport` interface does not include a `currency` field:

```typescript
// report.service.ts:152-161
export interface GLLedgerReport {
  entityId: string;
  glAccountId: string;
  accountCode: string;
  accountName: string;
  startDate: Date;
  endDate: Date;
  entries: GLLedgerEntry[];
  nextCursor: string | null;
  // No currency field
}
```

Yet the route handler at line 300 passes `report.currency` to the CSV export function:

```typescript
// report.ts:296-301
const csv = reportExportService.glLedgerToCsv(
  report.entries,
  report.accountCode,
  report.accountName,
  report.currency  // <-- undefined at runtime
);
```

The type mismatch is masked because the route casts `request.query as GLLedgerQuery & { format?: string }`, and the `report` variable is not explicitly typed with `GLLedgerReport` in the route. At runtime, `report.currency` evaluates to `undefined`. The `glLedgerToCsv` function accepts it as the `currency: string` parameter but never uses it in the CSV body, so no visible error occurs -- but the bug will surface the moment currency is added to CSV headers.

**Impact:** Silent undefined value passed to export function. TypeScript type safety is bypassed. Future use of the currency parameter in CSV output will produce "undefined".

**Fix:** Add `currency: string` to `GLLedgerReport` interface. Populate it from the entity's `functionalCurrency` in `generateGLLedger()`.

---

### P0-2: `validateMultiEntityCurrency` queries entities without tenant isolation

**File:** `apps/api/src/domains/accounting/services/report.service.ts:285-298`

```typescript
// report.service.ts:285-298
private async validateMultiEntityCurrency(entityIds: string[]): Promise<string> {
  const entities = await prisma.entity.findMany({
    where: { id: { in: entityIds } },  // Missing tenantId filter
    select: { functionalCurrency: true },
  });
  const currencies = new Set(entities.map(e => e.functionalCurrency));
  if (currencies.size > 1) {
    throw new AccountingError(/* ... */);
  }
  return entities[0].functionalCurrency;
}
```

The query filters only by `id: { in: entityIds }` without `tenantId: this.tenantId`. Although the upstream `getEntityIds()` method (line 272) is tenant-scoped, the missing filter in `validateMultiEntityCurrency` violates the invariant that every Prisma query must include tenant isolation. If this method were ever called with entity IDs from a different source (or if `getEntityIds` were refactored), it could leak cross-tenant data.

**Impact:** No immediate data leak (upstream is safe), but violates the "every query MUST filter by tenantId" architectural invariant. Defense-in-depth gap.

**Fix:** Add `tenantId: this.tenantId` to the where clause:

```typescript
where: { id: { in: entityIds }, tenantId: this.tenantId },
```

---

### P0-3: `format` query parameter is unvalidated -- Zod schema bypassed

**File:** `apps/api/src/domains/accounting/routes/report.ts:63,68` (repeated across all 7 routes)
**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts:95` (dead code)

The `format` query parameter is accessed via an unsafe cast but is not included in any Zod validation schema:

```typescript
// report.ts:63-68
const query = request.query as ProfitLossQuery & { format?: string };
// ...
const format = query.format || 'json';
```

The `ExportFormatSchema` exists in `report.schema.ts` (line 95) but is never referenced in any route's `preValidation` array. This means:

1. Any arbitrary string is accepted for `format` (falls through to JSON, which is safe)
2. The existing `ExportFormatSchema` is dead code
3. The manual `& { format?: string }` cast defeats the Route > Schema > Service pattern

**Impact:** No direct security vulnerability (unknown formats default to JSON), but violates the project's schema-first convention and leaves dead code. Inconsistent with all other parameter validation in the codebase.

**Fix:** Add `format` to each query schema using the existing `ExportFormatSchema`:

```typescript
export const ProfitLossQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  comparisonPeriod: z.enum(['PREVIOUS_PERIOD', 'PREVIOUS_YEAR']).optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});
```

Remove the manual `& { format?: string }` casts from all 7 route handlers. Delete the orphaned `ExportFormatSchema` or keep it as the single source.

---

## P1 Findings (Should Fix Before Production)

### P1-1: Cache invalidation gap -- `posting.service.ts` and `journal-entry.service.ts` do not invalidate report cache

**File:** `apps/api/src/domains/accounting/services/posting.service.ts` (no `reportCache` reference)
**File:** `apps/api/src/domains/accounting/services/journal-entry.service.ts` (no `reportCache` reference)
**Contrast:** `apps/api/src/domains/accounting/services/document-posting.service.ts:269,514,775` (correctly invalidates)

Only `document-posting.service.ts` calls `reportCache.invalidate()` when journal entries are created. The other two services that modify journal entry data do NOT invalidate:

- `posting.service.ts` -- Posts bank transactions to the GL (creates journal entries)
- `journal-entry.service.ts` -- Manual journal entry creation, approval (DRAFT -> POSTED), and voiding

This means:
- User posts a bank transaction via `posting.service.ts` -> P&L cache serves stale data for up to 5 minutes
- User approves a manual journal entry via `journal-entry.service.ts` -> same stale cache issue

**Impact:** Users see stale financial reports after posting transactions or managing journal entries via non-document paths. For financial reporting, showing stale balances is a correctness issue.

**Fix:** Add `reportCache.invalidate(this.tenantId, /^report:/)` to the mutation paths in both services. Alternatively, centralize invalidation in a shared event or decorator that fires whenever a journal entry transitions to POSTED status.

---

### P1-2: `getEntityIds()` returns empty array -- causes SQL syntax error and null dereference

**File:** `apps/api/src/domains/accounting/services/report.service.ts:272-278,298`

If a tenant has zero entities (new tenant before onboarding completes), `getEntityIds()` returns `[]`. This creates two failures:

1. `Prisma.join([])` produces `IN ()` which is invalid PostgreSQL syntax -- runtime crash
2. `validateMultiEntityCurrency` at line 298 does `entities[0].functionalCurrency` on a potentially empty array -- `TypeError: Cannot read properties of undefined`

```typescript
// report.service.ts:272-278
private async getEntityIds(): Promise<string[]> {
  const entities = await prisma.entity.findMany({
    where: { tenantId: this.tenantId },
    select: { id: true },
  });
  return entities.map(e => e.id);  // Could be []
}
```

**Impact:** Runtime crash for tenants with no entities. While unlikely in normal usage (onboarding creates an entity), it is a defensive gap that will produce a 500 error instead of a meaningful 404.

**Fix:** Add an early guard:

```typescript
const entityIds = await this.getEntityIds();
if (entityIds.length === 0) {
  throw new AccountingError('No entities found for tenant', 'ENTITY_NOT_FOUND', 404);
}
```

---

### P1-3: Frontend types diverge from API response types -- `revenue.sections` vs `revenue.items`

**File:** `apps/api/src/domains/accounting/services/report.service.ts:47-56` (API returns `items`)
**File:** `apps/web/src/lib/api/reports.ts:37-49` (Frontend expects `sections`)
**File:** `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:211,234`

The API `ProfitLossReport` interface has:

```typescript
// API (report.service.ts:47-56)
revenue: {
  items: ReportLineItem[];  // <-- "items"
  total: number;
};
```

But the frontend type declares:

```typescript
// Frontend (reports.ts:37-49)
revenue: {
  sections: ReportLineItem[];  // <-- "sections" (different name)
  total: number;
  previousTotal?: number;       // Extra field not in API
};
```

The `PLReportView` client component at line 211 reads `initialData.revenue.sections`:

```tsx
<PLSection items={initialData.revenue.sections} showComparison={showComparison} />
```

Since the API returns `items` (not `sections`), this will always be `undefined`, causing the revenue section to render empty.

This same pattern of divergence exists for `CashFlowReport` (API: `operating.items` vs Frontend: `operating.adjustments`/`operating.workingCapitalChanges`).

**Impact:** Report rendering is broken -- the P&L revenue and expense sections appear empty because the frontend reads a property name (`sections`) that does not exist on the API response (`items`). This is a functional bug.

**Fix:** Move shared types to `packages/types/src/reports.ts`. Both API and frontend import from the same source. Alternatively, fix the frontend types to match the actual API response shape (`items` not `sections`).

---

### P1-4: `sanitizeCsvCell` type mismatch with nullable `memo` field

**File:** `apps/api/src/domains/accounting/services/report-export.service.ts:26,275`

`sanitizeCsvCell` accepts `(value: string)` but `GLLedgerEntry.memo` is typed as `string | null`:

```typescript
// report-export.service.ts:26
private sanitizeCsvCell(value: string): string {

// report-export.service.ts:275
this.sanitizeCsvCell(entry.memo),  // entry.memo is string | null
```

The function's falsy guard (`if (!value) return ''`) handles `null` at runtime, but the TypeScript types are misaligned. A stricter `tsconfig` or `strictNullChecks` would flag this.

**Impact:** No runtime crash (falsy check catches null), but type safety is incomplete.

**Fix:** Change signature to `sanitizeCsvCell(value: string | null | undefined): string`.

---

### P1-5: Balance Sheet and 5 other reports are not cached (only P&L is)

**File:** `apps/api/src/domains/accounting/services/report.service.ts:493-683` (Balance Sheet -- no cache)
**Contrast:** `apps/api/src/domains/accounting/services/report.service.ts:362-484` (P&L -- has cache)

`generateProfitLoss` implements cache get/set (lines 364-368, 481), but `generateBalanceSheet`, `generateCashFlow`, `generateTrialBalance`, `generateSpendingByCategory`, and `generateRevenueByClient` do NOT cache their results.

`generateCashFlow` internally calls `generateProfitLoss` (line 721-725), so it partially benefits from P&L caching, but its own result (which includes additional SQL queries for cash accounts and account changes) is not cached.

**Impact:** Repeated requests for the same Balance Sheet or Cash Flow statement execute full SQL aggregation queries every time. Under concurrent load (e.g., multiple users viewing reports simultaneously, or a user switching between reports), this creates unnecessary database pressure. The rate limit (50 req/min) mitigates but does not eliminate the concern.

**Fix:** Apply the same cache pattern to all report generation methods, especially `generateBalanceSheet` and `generateCashFlow` which run multiple aggregation queries.

---

## P2 Findings (Nice to Have)

### P2-1: `ReportService` class is 1232 lines with repeated entity scope boilerplate

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

At 1232 lines, this file exceeds the 300-400 line SRP guideline from `api-conventions.md`. The entity scope determination logic (determine entityIds, fetch entity name, get currency, validate multi-entity consistency) is repeated 5 times across `generateProfitLoss`, `generateBalanceSheet`, `generateCashFlow`, `generateSpendingByCategory`, and `generateRevenueByClient` with minor variations.

**Impact:** Maintenance burden and DRY violation. Adding a new report type requires copying ~25 lines of entity resolution boilerplate.

**Fix:** Extract a private `resolveEntityScope` helper:

```typescript
private async resolveEntityScope(entityId?: string): Promise<{
  entityIds: string[];
  entityName: string;
  currency: string;
}> {
  if (entityId) {
    await this.validateEntityOwnership(entityId);
    const entity = await prisma.entity.findUniqueOrThrow({ where: { id: entityId } });
    return { entityIds: [entityId], entityName: entity.name, currency: entity.functionalCurrency };
  }
  const entityIds = await this.getEntityIds();
  const currency = await this.validateMultiEntityCurrency(entityIds);
  return { entityIds, entityName: 'All Entities', currency };
}
```

---

### P2-2: Report types duplicated between API and frontend (beyond the naming issue)

**File:** `apps/api/src/domains/accounting/services/report.service.ts:24-196` (7 interfaces)
**File:** `apps/web/src/lib/api/reports.ts:7-237` (7 corresponding interfaces)

Beyond the `items`/`sections` naming divergence (P1-3), the full set of report types is duplicated across the API/frontend boundary. The `packages/types` package exists for exactly this purpose but is not used for report types.

**Impact:** Any change to the API response shape requires updating types in two locations.

**Fix:** Move shared report interfaces to `packages/types/src/reports.ts`. Both `apps/api` and `apps/web` import from `@akount/types`.

---

### P2-3: Cash flow categorization uses hardcoded account code ranges

**File:** `apps/api/src/domains/accounting/services/report.service.ts:797-799,857-869`

Account classification into Operating/Investing/Financing uses hardcoded string comparisons on account codes (1100-1499 = Operating, 1500-1999 = Investing, 2000-2499 = Operating, 2500-3999 = Financing). The comment at line 689 notes this is an "MVP Implementation: Simplified account-based changes".

**Impact:** Incorrect classification for tenants using non-standard chart of accounts numbering. Acceptable for MVP.

**Fix:** Document as a known limitation. For production, add a `cashFlowCategory` enum field to `GLAccount` or a configurable mapping table.

---

### P2-4: PDF timeout creates an unresolved promise (potential unhandled rejection)

**File:** `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx:36-38`

```typescript
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new AccountingError('PDF generation timed out', 'PDF_TIMEOUT', 408)), PDF_TIMEOUT_MS)
);
const buffer = await Promise.race([renderToBuffer(pdfDoc), timeoutPromise]);
```

When `renderToBuffer` resolves before the 30s timeout, the `setTimeout` continues running. It eventually fires and rejects a promise that nobody is listening to, producing an unhandled promise rejection.

**Impact:** Unhandled promise rejection warning in logs. Not a crash, but adds noise.

**Fix:** Clear the timeout on success:

```typescript
let timer: NodeJS.Timeout;
const timeoutPromise = new Promise<never>((_, reject) => {
  timer = setTimeout(() => reject(new AccountingError('PDF generation timed out', 'PDF_TIMEOUT', 408)), PDF_TIMEOUT_MS);
});
try {
  const buffer = await Promise.race([renderToBuffer(pdfDoc), timeoutPromise]);
  clearTimeout(timer!);
  return Buffer.from(buffer);
} catch (e) {
  clearTimeout(timer!);
  throw e;
}
```

---

### P2-5: Duplicated CSV sanitization between report-export and data-export services

**File:** `apps/api/src/domains/system/services/data-export.service.ts:113-131`
**File:** `apps/api/src/domains/accounting/services/report-export.service.ts:26-39`

Both files independently implement CSV formula injection prevention. The data-export version is more robust (handles `null`, `undefined`, `Date`), while the report-export version only handles `string`.

**Impact:** Maintenance risk -- a fix to sanitization in one file may not be applied to the other.

**Fix:** Extract to `apps/api/src/lib/csv-utils.ts`:

```typescript
export function sanitizeCsvCell(value: unknown): string { /* ... */ }
export function buildCsvRow(values: string[]): string { /* ... */ }
```

---

### P2-6: Frontend `downloadReport` accesses `window.Clerk` via triple-cast

**File:** `apps/web/src/lib/api/reports.ts:350-351`

```typescript
const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
const token = await clerk?.session?.getToken();
```

This bypasses the Clerk React SDK with a triple-cast (`window as unknown as ...`) to access the global `window.Clerk` object directly. This is fragile -- the Clerk SDK may change the global shape, and SSR contexts have no `window`.

**Impact:** Fragile integration that could break on Clerk SDK updates.

**Fix:** Use `@clerk/nextjs`'s `useAuth()` hook to get the token in the calling component, then pass it as a parameter:

```typescript
export async function downloadReport(
  reportPath: string,
  params: Record<string, string | undefined>,
  format: 'pdf' | 'csv',
  token: string
): Promise<void> { /* ... */ }
```

---

### P2-7: Route handler duplication -- 7 handlers follow identical 40-line pattern

**File:** `apps/api/src/domains/accounting/routes/report.ts`

All 7 route handlers follow the same structure: check tenant context, instantiate service, call method, dispatch by format (PDF/CSV/JSON), handle errors. This 40-line pattern is repeated 7 times (~280 lines of structural duplication).

**Impact:** Adding a new report type requires copying 40 lines. Bug fixes to the export dispatch must be applied 7 times.

**Fix:** Extract a route factory function:

```typescript
function createReportRoute<TQuery, TReport>(config: {
  schema: ZodSchema;
  generate: (service: ReportService, query: TQuery) => Promise<TReport>;
  toCsv?: (report: TReport) => string;
  toPdf?: (report: TReport) => Promise<Buffer>;
  filenamePrefix: string;
}): RouteHandler { /* ... */ }
```

---

## Architecture Strengths

1. **`tenantScopedQuery` wrapper** -- Elegant defense-in-depth for raw SQL. The runtime assertion that the SQL string contains a tenantId reference catches developer mistakes at the query boundary.

2. **Bounded cache design** -- 500-entry limit, 60s active sweep, TTL-based expiration, `unref()` on cleanup timer. Tenant-scoped keys prevent cache poisoning. Singleton properly destroyed in graceful shutdown (index.ts:248).

3. **CSV injection prevention** -- OWASP-compliant formula injection protection via `sanitizeCsvCell`. Covers `=`, `+`, `-`, `@`, `\t`, `\r` prefixes.

4. **PDF protective limits** -- Size limits (1000 entries), 30s generation timeout, dedicated error codes (`PDF_TOO_LARGE`, `PDF_TIMEOUT`). React-PDF used server-side for consistent rendering without browser dependencies.

5. **Domain boundary discipline** -- Revenue by Client report queries `sourceDocument` JSON snapshots on JournalEntry rather than cross-domain JOINing to the invoicing domain's Client table. This respects bounded context boundaries and aligns with the "Source Preservation" invariant.

6. **Streaming data export** -- ZIP backup uses cursor-paginated reads (500-row batches) and Node.js streams via `archiver`. Never holds entire dataset in memory. Metadata JSON summary included.

7. **Consistent security middleware** -- All report routes apply `withPermission('accounting', 'reports', 'VIEW')` and `statsRateLimitConfig()`. Auth and tenant middleware applied at the domain registration level (routes/index.ts).

8. **Complete loading/error boundaries** -- All 7 report sub-routes plus the reports index page have both `loading.tsx` and `error.tsx` sibling files.

9. **BigInt safety** -- `convertBigInt()` checks `Number.isSafeInteger()` before conversion, preventing silent precision loss for very large amounts.

10. **Filename sanitization** -- `sanitizeFilename()` in routes strips non-alphanumeric characters and limits to 100 chars, preventing path traversal in Content-Disposition headers.

---

## Compliance Checklist

- [x] **Tenant isolation enforced** -- All raw SQL queries use `tenantScopedQuery` wrapper with runtime assertion. Entity ownership validated for single-entity operations. One defense-in-depth gap in `validateMultiEntityCurrency` (P0-2).
- [x] **Domain boundaries respected** -- Reports stay within the accounting domain. Revenue by Client uses `sourceDocument` JSON rather than cross-domain JOINs. Data export in system domain is properly separate.
- [x] **Server-first architecture maintained** -- Frontend pages use Server Components for data fetching (`page.tsx`), Client Components for interactivity (`*-report-view.tsx`). Correct pattern.
- [x] **Database patterns followed** -- Integer cents throughout (BigInt to Number with safe integer check). Soft-delete filters in all queries (`deletedAt IS NULL`). Raw SQL uses parameterized queries via Prisma.sql template literals (no SQL injection risk).
- [x] **Security requirements met** -- CSV formula injection prevention. Filename sanitization. Rate limiting (50 req/min). Permission checks. PDF size limits.
- [x] **Performance considered** -- Bounded cache. Cursor pagination for GL Ledger. Rate limiting. Streaming ZIP. Parallel SQL queries where possible (Cash Flow opening/closing balance).
- [x] **Loading/error states present** -- All 8 route directories have both `loading.tsx` and `error.tsx`.
- [ ] **Cache invalidation complete** -- Only `document-posting.service.ts` invalidates. Two other mutation paths do not (P1-1).
- [ ] **Type consistency across boundary** -- Frontend and API types diverge with different field names (P1-3).

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **Architecture Quality:** GOOD

**Required before merge (P0):**
1. P0-1: Add `currency` field to `GLLedgerReport` interface and populate in `generateGLLedger()`
2. P0-2: Add `tenantId` filter to `validateMultiEntityCurrency` query
3. P0-3: Add `format` to Zod schemas, remove manual casts, clean up dead `ExportFormatSchema`

**Required before production (P1):**
4. P1-1: Add `reportCache.invalidate()` to `posting.service.ts` and `journal-entry.service.ts`
5. P1-2: Guard against empty entity array in `getEntityIds()` or at call sites
6. P1-3: Fix frontend types to match API response (`items` not `sections`, `CashFlowReport` structure)
7. P1-4: Fix `sanitizeCsvCell` signature to accept `string | null`
8. P1-5: Apply caching to Balance Sheet and other expensive report methods

**Recommended improvements (P2):**
9. P2-1: Extract `resolveEntityScope` helper to reduce 5x entity boilerplate
10. P2-2: Move shared report types to `packages/types`
11. P2-3: Document cash flow code-range categorization as MVP limitation
12. P2-4: Clear PDF timeout on success to avoid unhandled rejection
13. P2-5: Extract shared CSV sanitization utility
14. P2-6: Replace `window.Clerk` triple-cast with Clerk SDK hook
15. P2-7: Extract route factory to reduce 7x handler duplication

---

**Review Completed:** 2026-02-17
**Files Analyzed:** 17 (see table above)
**Lines of Code Examined:** ~3,700 across all files
