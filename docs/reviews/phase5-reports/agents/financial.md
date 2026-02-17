# Financial Data Integrity Review: Phase 5 Reports

**Reviewer:** financial-data-validator (Claude Opus 4.6)
**Date:** 2026-02-17
**Scope:** Phase 5 report generation, export, document posting, data backup
**Risk Level:** MEDIUM (2 P0, 4 P1, 8 P2 findings)

---

## Executive Summary

The Phase 5 reports implementation is architecturally solid. Integer cents are maintained throughout report aggregation with proper BigInt-to-Number conversion and overflow protection. Tenant isolation uses the `tenantScopedQuery` wrapper for all raw SQL queries. Double-entry validation is present in document posting. The PDF and CSV export pipelines correctly convert cents to display values without corrupting the stored integer representation.

However, several issues require attention before production use:

- **P0-1:** Data backup exports Client and Vendor tables without tenant isolation (Prisma silently ignores non-existent field filter)
- **P0-2:** GL Ledger running balance omits opening balance from prior periods, producing incorrect running totals
- **P1-1 through P1-4:** Spending and Revenue reports use one-sided aggregation (debit-only or credit-only), Cash Flow has incorrect working capital sign convention, and the `format` query parameter is unvalidated

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `apps/api/src/domains/accounting/services/report.service.ts` | 1232 | Core report generation (7 reports) |
| `apps/api/src/domains/accounting/services/report-cache.ts` | 158 | In-memory bounded cache |
| `apps/api/src/domains/accounting/services/report-export.service.ts` | 290 | CSV export with injection protection |
| `apps/api/src/domains/accounting/schemas/report.schema.ts` | 98 | Zod validation schemas |
| `apps/api/src/domains/accounting/routes/report.ts` | 420 | Report API routes |
| `apps/api/src/domains/accounting/services/document-posting.service.ts` | 873 | Invoice/bill/payment posting |
| `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx` | 110 | P&L PDF template |
| `apps/api/src/domains/accounting/templates/balance-sheet-pdf.tsx` | 140 | Balance Sheet PDF template |
| `apps/api/src/domains/accounting/templates/cash-flow-pdf.tsx` | 131 | Cash Flow PDF template |
| `apps/api/src/domains/accounting/templates/shared-styles.ts` | 210 | PDF shared utilities |
| `apps/api/src/lib/tenant-scoped-query.ts` | 33 | Tenant isolation wrapper |
| `apps/api/src/domains/system/services/data-export.service.ts` | 277 | Data backup/export |

---

## P0 - Critical Findings (Must Fix Before Production)

### P0-1: Data Backup Exports Client/Vendor Without Tenant Isolation

**File:** `apps/api/src/domains/system/services/data-export.service.ts:59-73,242-276`
**Impact:** Cross-tenant data leakage. Client and Vendor records from ALL tenants may be exported.

**Root Cause:** The `clients` and `vendors` table configs (lines 59-73) are NOT marked as `entityScoped: true`, so `buildWhere()` falls through to the `else` branch at line 271 and sets `where.tenantId = tenantId`. However, the Prisma schema shows:

- `Client` has `entityId` (NOT `tenantId`)
- `Vendor` has `entityId` (NOT `tenantId`)

Prisma silently ignores unknown fields in `where` clauses, meaning `where.tenantId = tenantId` will match ALL Client/Vendor records across all tenants.

```typescript
// CURRENT (lines 59-62) - WRONG
{
  name: 'clients',
  model: 'client',
  columns: [...],
  // Missing entityScoped: true!
}

// FIX: Mark both as entity-scoped
{
  name: 'clients',
  model: 'client',
  columns: [...],
  entityScoped: true,
}
{
  name: 'vendors',
  model: 'vendor',
  columns: [...],
  entityScoped: true,
}
```

**Verification:** Check the `Client` schema -- it has `entityId` and a relation to `Entity`, not a direct `tenantId`. Same for `Vendor`. The `buildWhere` entity-scoped path correctly uses `where.entity = { tenantId }` for these models.

---

### P0-2: GL Ledger Running Balance Omits Opening Balance

**File:** `apps/api/src/domains/accounting/services/report.service.ts:1017-1052`
**Impact:** Running balance column shows incorrect values. First entry in the date range starts at 0 instead of carrying forward prior-period balance.

The window function `SUM(...) OVER (ORDER BY jl.id)` at line 1030-1035 only operates over rows matching the `WHERE` clause, which filters to `je.date >= startDate AND je.date <= endDate`. This means:

- An account with a $5,000 balance from January
- Querying February entries
- First entry in February shows running balance as just that entry's amount, NOT $5,000 + entry

```sql
-- CURRENT: Running balance starts at 0 for the filtered window
SUM(...) OVER (ORDER BY jl.id) as "runningBalance"

-- FIX: Calculate opening balance separately and add it
-- Option A: Subquery for prior balance
-- Option B: Two-pass approach (query opening balance first, then add to window)
```

**Suggested fix:** Calculate the opening balance in a separate query (sum of all posted entries before `startDate`), then add it to the window function result in the TypeScript mapping at lines 1055-1063.

```typescript
// Step 1: Query opening balance
const openingBalance = await tenantScopedQuery<...>(
  this.tenantId,
  (tenantId) => Prisma.sql`
    SELECT SUM(
      CASE WHEN gl."normalBalance" = 'DEBIT'
        THEN jl."debitAmount" - jl."creditAmount"
        ELSE jl."creditAmount" - jl."debitAmount"
      END
    ) as "balance"
    FROM "JournalLine" jl
    JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
    JOIN "GLAccount" gl ON jl."glAccountId" = gl.id
    INNER JOIN "Entity" e ON e.id = je."entityId"
    WHERE e."tenantId" = ${tenantId}
      AND jl."glAccountId" = ${params.glAccountId}
      AND je."entityId" = ${params.entityId}
      AND je."status" = 'POSTED'
      AND je."deletedAt" IS NULL
      AND jl."deletedAt" IS NULL
      AND je.date < ${params.startDate}
  `
);

// Step 2: Add opening balance to each running balance
const openingBal = this.convertBigInt(openingBalance[0]?.balance ?? 0n);
const entries = results.map((row) => ({
  ...row,
  runningBalance: openingBal + this.convertBigInt(row.runningBalance),
}));
```

---

## P1 - Important Findings (Fix Before Audit/Compliance)

### P1-1: Spending Report Uses Debit-Only Aggregation

**File:** `apps/api/src/domains/accounting/services/report.service.ts:1116`
**Impact:** Expense refunds or credit-side entries on expense accounts are not netted, overstating total spending.

```sql
-- CURRENT (line 1116): Only sums debits
COALESCE(SUM(jl."debitAmount"), 0) as "totalSpend"

-- FIX: Net debits minus credits for correct expense total
COALESCE(SUM(jl."debitAmount") - SUM(jl."creditAmount"), 0) as "totalSpend"
```

Expense accounts have debit normal balance. When a refund is recorded as a credit to an expense account, the current query ignores it entirely. This mirrors the correct logic already used in the P&L report at line 436: `debit - credit` for expense accounts.

---

### P1-2: Revenue Report Uses Credit-Only Aggregation

**File:** `apps/api/src/domains/accounting/services/report.service.ts:1191`
**Impact:** Revenue reversals, credit notes, or debit-side entries on revenue accounts are not netted, overstating total revenue.

```sql
-- CURRENT (line 1191): Only sums credits
COALESCE(SUM(jl."creditAmount"), 0) as "totalRevenue"

-- FIX: Net credits minus debits for correct revenue total
COALESCE(SUM(jl."creditAmount") - SUM(jl."debitAmount"), 0) as "totalRevenue"
```

Revenue accounts have credit normal balance. The P&L report correctly uses `credit - debit` at line 436, but this management report does not.

---

### P1-3: Cash Flow Working Capital Sign Convention Inverted

**File:** `apps/api/src/domains/accounting/services/report.service.ts:844,873-874`
**Impact:** Indirect method Cash Flow Statement shows incorrect operating cash flow when working capital changes.

At line 844, the balance change uses `normalBalance` direction:
```typescript
const change = row.normalBalance === 'DEBIT' ? debit - credit : credit - debit;
```

At line 873-874, the operating items are added directly to net income:
```typescript
const operatingCashFlow = netIncome + operatingItems.reduce((sum, item) => sum + item.balance, 0);
```

The problem: Under indirect method, an INCREASE in Accounts Receivable (debit normal, positive change) means cash DECREASED. The current code adds this positive change to net income, which overstates operating cash. The correct adjustment should SUBTRACT increases in debit-normal current assets and ADD increases in credit-normal current liabilities.

```typescript
// FIX: Invert sign for asset account changes in operating section
for (const row of accountChanges) {
  const debit = this.convertBigInt(row.totalDebit);
  const credit = this.convertBigInt(row.totalCredit);
  const balanceChange = row.normalBalance === 'DEBIT' ? debit - credit : credit - debit;

  // For operating activities (indirect method):
  // Asset increase = cash decrease (negate)
  // Liability increase = cash increase (keep positive)
  const cashImpact = row.type === 'ASSET' ? -balanceChange : balanceChange;

  item.balance = cashImpact;
}
```

---

### P1-4: `format` Query Parameter Not Validated by Zod Schema

**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts` (entire file) and `apps/api/src/domains/accounting/routes/report.ts:63,68-86`
**Impact:** The `format` parameter (`json`, `csv`, `pdf`) is cast via `as` without validation. Any string value passes through.

In the route handlers (e.g., line 63):
```typescript
const query = request.query as ProfitLossQuery & { format?: string };
```

The `format` field is not in any Zod schema, so it is never validated. While the code defaults to `json` and only acts on `csv`/`pdf`, an `ExportFormatSchema` already exists in the schema file (line 95) but is never used in the query schemas.

```typescript
// FIX: Add format to each query schema
export const ProfitLossQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  comparisonPeriod: z.enum(['PREVIOUS_PERIOD', 'PREVIOUS_YEAR']).optional(),
  format: ExportFormatSchema.optional(), // Add this
});
```

---

## P2 - Moderate Findings (Fix in Next Sprint)

### P2-1: GLLedgerReport Interface Missing `currency` Field

**File:** `apps/api/src/domains/accounting/services/report.service.ts:152-161` and `apps/api/src/domains/accounting/routes/report.ts:300`
**Impact:** TypeScript compilation error. Route handler accesses `report.currency` but the `GLLedgerReport` interface does not define this field.

The `generateGLLedger()` method returns a `GLLedgerReport` which does not include `currency`, but the route at line 300 passes `report.currency` to `glLedgerToCsv()`. This should fail TypeScript strict checks.

```typescript
// FIX: Add currency to GLLedgerReport
export interface GLLedgerReport {
  entityId: string;
  glAccountId: string;
  accountCode: string;
  accountName: string;
  currency: string;  // Add this
  startDate: Date;
  endDate: Date;
  entries: GLLedgerEntry[];
  nextCursor: string | null;
}

// Also set it in generateGLLedger:
return {
  entityId: params.entityId,
  glAccountId: params.glAccountId,
  accountCode: glAccount.code,
  accountName: glAccount.name,
  currency: glAccount.entity?.functionalCurrency ?? 'CAD', // Add this
  ...
};
```

---

### P2-2: validateMultiEntityCurrency Missing Tenant Filter

**File:** `apps/api/src/domains/accounting/services/report.service.ts:285-298`
**Impact:** Defense-in-depth gap. The query fetches entities by ID without verifying they belong to the current tenant.

```typescript
// CURRENT (line 286-288):
const entities = await prisma.entity.findMany({
  where: { id: { in: entityIds } },
  select: { functionalCurrency: true },
});

// FIX: Add tenant filter
const entities = await prisma.entity.findMany({
  where: { id: { in: entityIds }, tenantId: this.tenantId },
  select: { functionalCurrency: true },
});
```

While `entityIds` always comes from `getEntityIds()` which already filters by tenant, adding the filter here follows the defense-in-depth principle. If a future caller passes arbitrary IDs, this would be a security vulnerability.

---

### P2-3: resolveGLAccountByCode Missing Tenant Filter in Document Posting

**File:** `apps/api/src/domains/accounting/services/document-posting.service.ts:806-812`
**Impact:** Defense-in-depth gap. GL account lookup uses `entityId` and `code` without `entity: { tenantId }`.

```typescript
// CURRENT (lines 806-812):
const account = await tx.gLAccount.findFirst({
  where: { entityId, code, isActive: true },
  select: { id: true, code: true, name: true },
});

// FIX: Add tenant filter
const account = await tx.gLAccount.findFirst({
  where: {
    entityId,
    code,
    isActive: true,
    entity: { tenantId: this.tenantId },
  },
  select: { id: true, code: true, name: true },
});
```

---

### P2-4: Balance Sheet 1-Cent Tolerance on isBalanced Check

**File:** `apps/api/src/domains/accounting/services/report.service.ts:651`
**Impact:** Masking potential data integrity issues. A 1-cent imbalance indicates either a rounding error or a data problem.

```typescript
// CURRENT (line 651):
const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) <= 1;
```

Since all amounts are integer cents with no rounding involved in the aggregation, a perfectly maintained double-entry system should ALWAYS balance to exactly 0. Allowing 1-cent tolerance could mask real data corruption. If the balance sheet is off by exactly 1 cent, it means there is a bug somewhere in the posting pipeline. Consider:

```typescript
// RECOMMENDED: Strict check with separate warning for small imbalances
const difference = totalAssets - totalLiabilitiesAndEquity;
const isBalanced = difference === 0;
const hasMinorImbalance = Math.abs(difference) <= 1 && difference !== 0;
```

---

### P2-5: Cash Flow Report Does Not Reconcile

**File:** `apps/api/src/domains/accounting/services/report.service.ts:877,899-901`
**Impact:** No validation that `openingCash + netCashChange === closingCash`. This is a standard accounting reconciliation check.

The report calculates `netCashChange` from categorized items and independently calculates `openingCash` and `closingCash` from GL data. These three numbers should satisfy the equation:

```
closingCash === openingCash + netCashChange
```

If they don't, the report has a structural error. Adding a reconciliation check would catch sign convention bugs (like P1-3) at runtime:

```typescript
const reconciliationDifference = closingCash - openingCash - netCashChange;
if (Math.abs(reconciliationDifference) > 1) {
  request.log.warn(
    { openingCash, closingCash, netCashChange, diff: reconciliationDifference },
    'Cash flow statement does not reconcile'
  );
}
```

---

### P2-6: GL Ledger Window Function Orders by CUID, Not Date

**File:** `apps/api/src/domains/accounting/services/report.service.ts:1035,1049`
**Impact:** Running balance may be in slightly wrong order if CUIDs are not generated in strict chronological order.

```sql
-- CURRENT (line 1035):
SUM(...) OVER (ORDER BY jl.id) as "runningBalance"

-- CURRENT (line 1049):
ORDER BY jl.id ASC

-- FIX: Order by date first, then ID for determinism within same date
SUM(...) OVER (ORDER BY je.date, jl.id) as "runningBalance"
-- ...
ORDER BY je.date ASC, jl.id ASC
```

CUIDs from the `cuid()` function are roughly time-sortable but not guaranteed to be strictly chronological across different server instances or under high concurrency.

---

### P2-7: Spending Report Missing Currency Validation for Multi-Entity

**File:** `apps/api/src/domains/accounting/services/report.service.ts:1086-1106`
**Impact:** Multi-entity spending report does not call `validateMultiEntityCurrency()`, unlike P&L and Balance Sheet which do.

```typescript
// CURRENT (lines 1102-1106):
} else {
  // Multi-entity consolidation
  entityIds = await this.getEntityIds();
  entityName = 'All Entities';
  // Missing: currency = await this.validateMultiEntityCurrency(entityIds);
}
```

This means spending from entities with different currencies (USD and CAD) could be summed together without warning. Compare with P&L at line 386 which correctly validates currency consistency.

---

### P2-8: Data Export `includeSoftDeleted` Flag Never Applied

**File:** `apps/api/src/domains/system/services/data-export.service.ts:28,242-276`
**Impact:** The `includeSoftDeleted` flag is defined in table configs but never checked in `buildWhere()`. All records are exported regardless. For a backup service this may be intentional, but the flag is misleading if not used.

```typescript
// FIX: If the flag is meaningful, apply it:
function buildWhere(table: TableConfig, tenantId: string, entityIds: string[] | undefined) {
  const where: Record<string, unknown> = {};
  // ... existing logic ...

  // Apply soft-delete filter if not including soft-deleted records
  if (!table.includeSoftDeleted) {
    where.deletedAt = null;
  }

  return where;
}
```

---

## Invariant Validation Summary

### 1. Integer Cents (NEVER Floats)

| Check | Status | Notes |
|-------|--------|-------|
| Report aggregation uses BigInt SUM | PASS | PostgreSQL SUM returns bigint, converted via `convertBigInt()` |
| BigInt overflow protection | PASS | `Number.isSafeInteger()` check at line 336-346 |
| Intermediate calculations stay integer | PASS | All arithmetic uses integer addition/subtraction |
| CSV export uses `(cents / 100).toFixed(2)` | PASS | Display-only conversion, does not modify stored values |
| PDF export uses `Intl.NumberFormat` | PASS | Display-only conversion at `shared-styles.ts:168-176` |
| Percentage calculations use float | ACCEPTABLE | Lines 1141, 1219 use float division for display percentages only |
| FX conversion uses `Math.round()` | PASS | Lines 151, 169 in document-posting |
| No `parseFloat` on monetary amounts | PASS | No occurrences found |

### 2. Double-Entry Bookkeeping

| Check | Status | Notes |
|-------|--------|-------|
| Invoice posting validates balance | PASS | Lines 193-201 in document-posting |
| Bill posting validates balance | PASS | Lines 438-446 in document-posting |
| Payment posting validates balance | PASS | Symmetric debit/credit lines at 655-709 |
| Trial Balance checks SUM(D) = SUM(C) | PASS | Lines 966-967 in report.service |
| P&L uses correct normal balance direction | PASS | Revenue: credit-debit, Expense: debit-credit (line 436) |
| Balance Sheet uses correct normal balance | PASS | DEBIT normal: debit-credit, CREDIT normal: credit-debit (line 563) |

### 3. Soft Delete

| Check | Status | Notes |
|-------|--------|-------|
| Report queries filter `je."deletedAt" IS NULL` | PASS | All SQL queries include this |
| Report queries filter `jl."deletedAt" IS NULL` | PASS | All SQL queries include this |
| Document posting checks `deletedAt: null` on load | PASS | Lines 61, 304 |
| Invoice lines filter `deletedAt: null` | PASS | Lines 63, 308 |
| Data backup includes soft-deleted records | PASS | Intentional for full backup |

### 4. Tenant Isolation

| Check | Status | Notes |
|-------|--------|-------|
| All report SQL uses `tenantScopedQuery` | PASS | Enforced wrapper with runtime assertion |
| `tenantScopedQuery` validates tenantId exists | PASS | Lines 15-17 |
| `tenantScopedQuery` verifies SQL references tenantId | PASS | Lines 23-29 |
| Entity ownership validated before report gen | PASS | `validateEntityOwnership()` called for single-entity |
| Multi-entity queries use tenant-filtered entity IDs | PASS | `getEntityIds()` filters by tenantId |
| Document posting validates tenant on load | PASS | `entity: { tenantId }` in where clause |
| Data backup validates entity belongs to tenant | PASS | Lines 161-165 |
| Client/Vendor export missing tenant filter | **FAIL** | See P0-1 |
| `validateMultiEntityCurrency` missing tenant filter | WARN | See P2-2 |
| `resolveGLAccountByCode` missing tenant filter | WARN | See P2-3 |

### 5. Source Preservation

| Check | Status | Notes |
|-------|--------|-------|
| Invoice posting captures sourceDocument | PASS | Lines 207-220 |
| Bill posting captures sourceDocument | PASS | Lines 452-465 |
| Payment posting captures sourceDocument | PASS | Lines 715-725 |
| sourceType set correctly | PASS | INVOICE, BILL, PAYMENT |
| sourceId references correct record | PASS | invoice.id, bill.id, allocationId |
| Revenue report queries sourceDocument JSON | PASS | Lines 1188-1189 |
| Audit log created for all postings | PASS | Lines 251-265, 495-510, 755-771 |

---

## Architecture Assessment

### Strengths

1. **`tenantScopedQuery` wrapper** -- Excellent defense-in-depth pattern that prevents raw SQL from forgetting tenant filters. The runtime assertion checking SQL text for `tenantId` is a smart guardrail.

2. **BigInt handling** -- Proper awareness that PostgreSQL SUM returns bigint, with a safe conversion utility that checks `Number.isSafeInteger()` before casting. This prevents silent precision loss for large aggregations.

3. **Report cache** -- Well-bounded (500 entries, 5min TTL, active sweep) with tenant-scoped keys preventing cross-tenant cache poisoning. The `invalidate()` method is called after document posting.

4. **CSV injection protection** -- Both the report export service and data export service implement OWASP CSV injection prevention by prefixing dangerous characters.

5. **Document posting atomicity** -- Uses `Prisma.TransactionIsolationLevel.Serializable` to prevent double-posting race conditions. Balance validation happens inside the transaction before commit.

6. **PDF safety limits** -- 1000 line item cap and 30-second timeout prevent DoS via large report generation.

### Concerns

1. **Cash Flow Statement accuracy** -- The simplified account-code-range approach (P1-3) combined with no reconciliation check (P2-5) means the Cash Flow report may show materially incorrect numbers. This is the weakest report from an accuracy standpoint.

2. **Management reports vs financial statements** -- The spending and revenue reports use simplified one-sided aggregation, which will produce incorrect results when expense refunds or revenue reversals exist. The core financial statements (P&L, Balance Sheet) are more robust.

3. **Multi-entity consolidation** -- The P&L and Balance Sheet correctly validate currency consistency, but the spending report does not, and the Revenue report does not call this validation either.

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **Financial Accuracy:** AT RISK (2 P0s, 4 P1s)
- **Blocking Issues:** P0-1 (data leakage), P0-2 (incorrect running balance)

### Recommended Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 (blocker) | P0-1: Client/Vendor export tenant isolation | 15 min |
| 2 (blocker) | P0-2: GL Ledger opening balance | 1-2 hours |
| 3 (before audit) | P1-1: Spending debit-only aggregation | 15 min |
| 4 (before audit) | P1-2: Revenue credit-only aggregation | 15 min |
| 5 (before audit) | P1-3: Cash Flow sign convention | 2-3 hours |
| 6 (before audit) | P1-4: format param validation | 15 min |
| 7 (next sprint) | P2-1 through P2-8 | 3-4 hours total |

---

*Generated by financial-data-validator agent on 2026-02-17*
