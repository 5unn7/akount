# Phase 5: Understand Your Money — Implementation Plan (AMENDED)

**Created:** 2026-02-16
**Amended:** 2026-02-16 (post-review)
**Status:** Ready for Implementation
**Brainstorm:** [docs/brainstorms/2026-02-16-phase5-understand-your-money-brainstorm.md](../brainstorms/2026-02-16-phase5-understand-your-money-brainstorm.md)
**Review Synthesis:** [.reviews/SYNTHESIS.md](../../.reviews/SYNTHESIS.md)

## Overview

Phase 5 delivers the three core financial statements (Profit & Loss, Balance Sheet, Cash Flow), supporting reports (Trial Balance, GL Ledger, Spending by Category, Revenue by Client), PDF/CSV export, full data backup, and basic charts. Reports use raw SQL aggregation via `prisma.$queryRaw` against existing GL data — **one schema migration for composite indexes only**. Frontend moves reports from `/planning/reports/` to `/accounting/reports/`.

**Review Results:** 4 agents reviewed the original plan (architecture, financial, security, performance). 57 findings identified: 7 P0 critical, 18 P1 high, 32 P2 medium. This amended plan addresses all P0 and P1 issues, with P2 improvements tracked for future polish.

## Success Criteria

### Financial Correctness
- [ ] P&L statement generates correctly (revenue - expenses, account hierarchy, period comparison)
- [ ] Balance Sheet balances (A = L + E, retained earnings use account 3100 + current year dynamic)
- [ ] Cash Flow statement classifies by operating/investing/financing with complete code range mapping
- [ ] All 3 statements support multi-entity consolidation with currency validation
- [ ] Trial Balance debits always equal credits (system integrity error if not)
- [ ] GL Ledger running balance respects normalBalance direction
- [ ] Management reports work (spending by GL account, revenue by client via sourceDocument)

### Security & Tenant Isolation
- [ ] All raw SQL queries use `tenantScopedQuery` wrapper (no direct `$queryRaw`)
- [ ] All report queries include tenant isolation and respect both je.deletedAt AND jl.deletedAt
- [ ] Multi-entity consolidation validates entity ownership
- [ ] Data export endpoint in System domain with OWNER/ADMIN permission only
- [ ] All export operations logged in audit log
- [ ] Rate limiting applied to all report and export endpoints
- [ ] `accounting:reports` key added to RBAC permission matrix

### Performance
- [ ] Composite indexes on JournalEntry and JournalLine improve query speed 2-5x
- [ ] In-memory cache with 500-entry limit and active eviction prevents unbounded growth
- [ ] Cash Flow consolidates to 3 queries (not 7) for optimal performance
- [ ] Data backup uses streaming ZIP generation (no memory spikes)
- [ ] All monetary amounts remain integer cents through SQL → API → display with BigInt handling

### Export & UX
- [ ] PDF export produces audit-grade documents (max 1000 entries, timeout protection)
- [ ] CSV export prevents formula injection and uses proper escaping
- [ ] Full data backup downloads ZIP with streaming (OWNER/ADMIN only)
- [ ] Reports accessible at `/accounting/reports/` with proper navigation
- [ ] Frontend uses URL search params for server-side data fetching (not client-side)

---

## Tasks

### Sprint 0: Infrastructure & Security Foundations

**Purpose:** Address all P0 critical issues before writing report logic. Estimated time: 2-4 hours.

---

#### Task 0.1: Create tenantScopedQuery Wrapper

**File:** `apps/api/src/lib/tenant-scoped-query.ts`

**What:** Create wrapper that enforces tenant filtering on all raw SQL queries:

```typescript
import { prisma, Prisma } from '@akount/db';

/**
 * Execute tenant-scoped raw SQL.
 * Enforces that tenantId is passed and the query references it.
 *
 * All Phase 5 report queries MUST use this wrapper instead of direct $queryRaw.
 *
 * @throws Error if tenantId is missing or query doesn't reference tenantId
 */
export async function tenantScopedQuery<T>(
  tenantId: string,
  queryBuilder: (tenantId: string) => Prisma.Sql
): Promise<T[]> {
  if (!tenantId) {
    throw new Error('tenantId is required for all raw SQL queries');
  }

  const sql = queryBuilder(tenantId);

  // Runtime assertion: verify the SQL text contains a tenantId parameter
  // This is defense-in-depth, not a substitute for correct SQL
  const sqlString = sql.strings.join('');
  if (!sqlString.includes('tenantId') && !sqlString.includes('tenant_id')) {
    throw new Error(
      'Raw SQL query does not reference tenantId. ' +
      'All report queries must filter by tenant for security.'
    );
  }

  return prisma.$queryRaw<T[]>(sql);
}
```

**Depends on:** none
**Review:** `security-sentinel`
**Success:** Wrapper compiles, throws error when tenantId missing or not referenced in SQL

---

#### Task 0.2: Add Guardrail Hook for $queryRawUnsafe

**File:** `.claude/hooks/hard-rules.sh`

**What:** Block `$queryRawUnsafe` usage (prevents SQL injection via string interpolation):

```bash
# Add after existing guardrails:

# Block $queryRawUnsafe usage (Security P1-1)
if grep -rn '\$queryRawUnsafe' apps/api/src/ --include="*.ts" --include="*.tsx"; then
  echo "❌ ERROR: \$queryRawUnsafe is banned for security."
  echo "   Use \$queryRaw with tagged template literals instead."
  echo "   Or better: use tenantScopedQuery() from apps/api/src/lib/tenant-scoped-query.ts"
  exit 1
fi
```

**Depends on:** none
**Success:** Commit with `$queryRawUnsafe` is blocked by pre-commit hook

---

#### Task 0.3: Database Migration — Add Composite Indexes

**File:** `packages/db/prisma/migrations/YYYYMMDD_add_report_indexes/migration.sql`

**What:** Add composite indexes for report query performance (Performance F1):

```sql
-- JournalEntry covering index for report WHERE clause
CREATE INDEX "JournalEntry_entityId_status_deletedAt_date_idx"
ON "JournalEntry"("entityId", "status", "deletedAt", "date");

-- JournalLine index for GROUP BY with soft delete filter
CREATE INDEX "JournalLine_glAccountId_deletedAt_idx"
ON "JournalLine"("glAccountId", "deletedAt");
```

**Schema changes:**

```prisma
model JournalEntry {
  // ... existing indexes ...
  @@index([entityId, status, deletedAt, date])
}

model JournalLine {
  // ... existing indexes ...
  @@index([glAccountId, deletedAt])
}
```

**Depends on:** none
**Risk:** low (index-only, no data changes)
**Success:** Migration runs cleanly, `EXPLAIN` shows index usage on report queries

---

#### Task 0.4: Add accounting:reports to RBAC Permission Matrix

**File:** `packages/types/src/rbac/permissions.ts`

**What:** Add missing permission key (Security P1-4):

```typescript
// Add to PERMISSION_MATRIX:
'accounting:reports': {
  OWNER: 'VIEW',
  ADMIN: 'VIEW',
  ACCOUNTANT: 'VIEW',
  BOOKKEEPER: 'HIDDEN',
  INVESTOR: 'VIEW',
  ADVISOR: 'VIEW',
},
```

**Depends on:** none
**Success:** `accounting:reports` key exists in matrix, type-checks correctly

---

#### Task 0.5: Update DocumentPostingService for Multi-Currency

**File:** `apps/api/src/domains/accounting/services/document-posting.service.ts`

**What:** Populate `baseCurrencyDebit/Credit` fields when posting invoices/bills/payments (Financial P1-6):

```typescript
// In postInvoice(), postBill(), postPaymentAllocation():
for (const line of journalLines) {
  // Set currency from source document
  line.currency = invoice.currency; // or bill.currency, payment.currency

  // If currency differs from entity's functional currency, convert
  if (line.currency !== entity.functionalCurrency) {
    const fxRate = await getFxRate(line.currency, entity.functionalCurrency, je.date);
    line.exchangeRate = fxRate;
    line.baseCurrencyDebit = line.debitAmount ? Math.round(line.debitAmount * fxRate) : null;
    line.baseCurrencyCredit = line.creditAmount ? Math.round(line.creditAmount * fxRate) : null;
  }
  // If same currency, leave baseCurrency fields NULL (COALESCE handles this in reports)
}
```

**Depends on:** none
**Risk:** medium (touches existing posting logic)
**Review:** `financial-data-validator`
**Success:** Invoices/bills in foreign currencies have baseCurrency fields populated

---

### Sprint 1: Backend Core Reports

---

#### Task 1: Report Zod Schemas

**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts`

**What:** Define Zod schemas for all report parameters:

- `ProfitLossQuerySchema` — entityId (`.cuid().optional()` — strict), startDate, endDate, comparisonPeriod (optional)
- `BalanceSheetQuerySchema` — entityId (`.cuid().optional()`), asOfDate, comparisonDate (optional)
- `CashFlowQuerySchema` — entityId (`.cuid().optional()`), startDate, endDate
- `TrialBalanceQuerySchema` — entityId (`.cuid()` — **required**), asOfDate (optional, defaults to today)
- `GLLedgerQuerySchema` — entityId (`.cuid()` required), glAccountId (`.cuid()` required), startDate, endDate, cursor (optional), limit (`.int().min(1).max(200).default(50)`)
- `SpendingQuerySchema` — entityId (`.cuid().optional()`), startDate, endDate
- `RevenueQuerySchema` — entityId (`.cuid().optional()`), startDate, endDate
- `ExportFormatSchema` — format enum: `json` | `csv` | `pdf`

**Key changes from original:**
- All entityId fields use `.cuid().optional()` (never empty string — Security P0-6)
- GL Ledger limit has explicit default 50, max 200 (Performance F11)
- All dates use `.datetime()` with clear field names

**Depends on:** none
**Success:** Schemas compile, `.cuid()` rejects empty strings, limits enforced

---

#### Task 2: Report Service — TypeScript Interfaces & Helpers

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

**What:** Define the `ReportService` class skeleton, interfaces, and helper functions:

**Interfaces:**
- `ProfitLossReport` — sections (revenue, expenses), line items with hierarchy, totals, comparison, netIncome, **currency** field
- `BalanceSheetReport` — sections (assets, liabilities, equity), retainedEarnings (split: priorYears + currentYear), isBalanced flag, totalAssets, totalLiabilitiesAndEquity, **currency** field
- `CashFlowReport` — sections (operating, investing, financing), netIncome, adjustments, netCashChange, opening/closing cash, **currency** field
- `ReportLineItem` — accountId, code, name, type, normalBalance, balance, previousBalance (optional), depth, isSubtotal, children
- `TrialBalanceReport` — accounts with debit/credit columns, totals, isBalanced flag, **severity: 'OK' | 'CRITICAL'**
- `GLLedgerReport` — entries with running balance, cursor pagination, nextCursor
- **Row type interfaces** (for BigInt handling — Financial P1-7):
  ```typescript
  interface AggregateRow {
    glAccountId: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    totalDebit: bigint;   // PostgreSQL SUM returns bigint
    totalCredit: bigint;
  }
  ```

**Class structure:**
```typescript
export class ReportService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  // Helper: validate entity ownership (Security P0-6)
  private async validateEntityOwnership(entityId: string): Promise<void> {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404);
    }
  }

  // Helper: get all entity IDs for tenant (multi-entity mode)
  private async getEntityIds(): Promise<string[]> {
    const entities = await prisma.entity.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true },
    });
    return entities.map(e => e.id);
  }

  // Helper: validate multi-entity currency consistency (Financial P0-1, P1-5)
  private async validateMultiEntityCurrency(entityIds: string[]): Promise<string> {
    const entities = await prisma.entity.findMany({
      where: { id: { in: entityIds } },
      select: { functionalCurrency: true },
    });
    const currencies = new Set(entities.map(e => e.functionalCurrency));
    if (currencies.size > 1) {
      throw new AccountingError(
        `Multi-entity consolidation requires all entities to use the same functional currency. Found: ${Array.from(currencies).join(', ')}`,
        'MULTI_CURRENCY_CONSOLIDATION_NOT_SUPPORTED',
        400
      );
    }
    return entities[0].functionalCurrency;
  }

  // Helper: get fiscal year boundaries with fallback (Financial P0-3)
  private async getFiscalYearBoundaries(entityId: string, asOfDate: Date): Promise<{ start: Date; end: Date }> {
    // 1. Try FiscalCalendar
    const calendar = await prisma.fiscalCalendar.findFirst({
      where: { entityId, year: asOfDate.getFullYear() },
    });
    if (calendar) return { start: calendar.startDate, end: calendar.endDate };

    // 2. Use Entity.fiscalYearStart with fallback to January
    const entity = await prisma.entity.findUniqueOrThrow({ where: { id: entityId } });
    const fiscalMonth = entity.fiscalYearStart ?? 1;

    // Compute fiscal year dates from fiscalMonth
    const year = asOfDate.getFullYear();
    const start = new Date(year, fiscalMonth - 1, 1);
    if (asOfDate < start) {
      start.setFullYear(year - 1);
    }
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + 1);
    end.setDate(end.getDate() - 1);

    return { start, end };
  }

  // Helper: convert BigInt to Number safely (Financial P1-7)
  private convertBigInt(value: bigint): number {
    const num = Number(value);
    if (!Number.isSafeInteger(num)) {
      throw new AccountingError(
        'Amount exceeds safe integer range',
        'AMOUNT_OVERFLOW',
        500
      );
    }
    return num;
  }

  // Public methods defined in subsequent tasks...
}
```

**Depends on:** none
**Success:** Types compile, helpers work correctly, class instantiates

---

#### Task 3: Report Service — Profit & Loss

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

**What:** Implement `generateProfitLoss(params)` method with all P0/P1 fixes:

**Key implementation points:**

1. **Use tenantScopedQuery wrapper** (Security P0-5)
2. **Strict entity branching** (Security P0-6):
   ```typescript
   let entityFilter: Prisma.Sql;
   let currency: string;

   if (params.entityId) {
     await this.validateEntityOwnership(params.entityId);
     const entity = await prisma.entity.findUniqueOrThrow({ where: { id: params.entityId } });
     currency = entity.functionalCurrency;
     entityFilter = Prisma.sql`je."entityId" = ${params.entityId}`;
   } else {
     const entityIds = await this.getEntityIds();
     currency = await this.validateMultiEntityCurrency(entityIds);
     entityFilter = Prisma.sql`je."entityId" IN (
       SELECT id FROM "Entity" WHERE "tenantId" = ${this.tenantId}
     )`;
   }
   ```

3. **COALESCE for nullable baseCurrency fields** (Financial P0-1):
   ```typescript
   const results = await tenantScopedQuery<AggregateRow>(this.tenantId, (tenantId) => Prisma.sql`
     SELECT
       ga.id as "glAccountId",
       ga.code,
       ga.name,
       ga.type,
       ga."normalBalance",
       COALESCE(SUM(jl."baseCurrencyDebit"), SUM(jl."debitAmount"), 0) as "totalDebit",
       COALESCE(SUM(jl."baseCurrencyCredit"), SUM(jl."creditAmount"), 0) as "totalCredit"
     FROM "JournalLine" jl
     JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
     JOIN "GLAccount" ga ON jl."glAccountId" = ga.id
     WHERE je.status = 'POSTED'
       AND je."deletedAt" IS NULL
       AND jl."deletedAt" IS NULL
       AND je.date BETWEEN ${params.startDate} AND ${params.endDate}
       AND ${entityFilter}
       AND ga.type IN ('INCOME', 'EXPENSE')
     GROUP BY ga.id, ga.code, ga.name, ga.type, ga."normalBalance"
   `);
   ```

4. **Use normalBalance for direction** (Financial P1-3):
   ```typescript
   const balance = account.normalBalance === 'DEBIT'
     ? this.convertBigInt(account.totalDebit) - this.convertBigInt(account.totalCredit)
     : this.convertBigInt(account.totalCredit) - this.convertBigInt(account.totalDebit);
   ```

5. **Account hierarchy:** Build parent-child tree, roll up subtotals
6. **Period comparison:** If comparisonPeriod provided, run same query for previous period
7. **Return:** `ProfitLossReport` with `netIncome = totalRevenue - totalExpenses`, `currency` field

**Depends on:** Task 0.1, Task 0.3, Task 2
**Risk:** high (financial calculation, raw SQL, multi-currency)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** P&L correctly sums INCOME and EXPENSE with tenant isolation, currency validation, BigInt handling

---

#### Task 4: Report Service — Balance Sheet

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

**What:** Implement `generateBalanceSheet(params)` method with retained earnings fix:

**Key implementation points:**

1. **Same entity/currency logic as P&L** (uses `validateEntityOwnership`, `validateMultiEntityCurrency`)

2. **Retained Earnings — FIXED approach** (Financial P0-2, P1-4):
   ```typescript
   // Get GL account 3100 (Retained Earnings) balance as-of fiscal year start
   const fiscalYear = await this.getFiscalYearBoundaries(entityId, params.asOfDate);

   const priorYearsRetainedEarnings = await this.getGLAccountBalance(
     '3100', // Retained Earnings account code
     entityId,
     fiscalYear.start
   );

   // Current year: dynamic INCOME - EXPENSE from fiscal year start to asOfDate
   const currentYearNetIncome = await this.computeNetIncome(
     entityId,
     fiscalYear.start,
     params.asOfDate
   );

   const totalRetainedEarnings = priorYearsRetainedEarnings + currentYearNetIncome;

   // Add to Equity section as two synthetic line items:
   // - "Retained Earnings (Prior Years)": priorYearsRetainedEarnings
   // - "Net Income (Current Year)": currentYearNetIncome
   ```

   **Note:** This approach respects manual year-end closing entries (captured in account 3100) and does NOT double-count earnings.

3. **Balance equation validation** (Financial P1-4):
   ```typescript
   const isBalanced = totalAssets === (totalLiabilities + totalEquity + totalRetainedEarnings);
   ```

4. **Multi-entity:** Same as P&L (COALESCE, currency validation)

5. **Account hierarchy with subtotals**

**Depends on:** Task 0.1, Task 0.3, Task 2, Task 3
**Risk:** high (retained earnings logic, balance equation, fiscal year boundaries)
**Review:** `financial-data-validator`
**Success:** Balance sheet balances (A = L + E), retained earnings computed without double-counting

---

#### Task 5: Report Service — Cash Flow Statement

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

**What:** Implement `generateCashFlow(params)` method using **optimized indirect method** (Performance F4, F5):

**Key implementation points:**

1. **Consolidate to 3 queries** (not 7):
   - Query 1: Reuse P&L for Net Income (cache-aware)
   - Query 2: Balance sheet as-of startDate (all accounts)
   - Query 3: Balance sheet as-of endDate (all accounts)
   - Classify in application code using complete code ranges

2. **Complete code range mapping** (Financial P1-1, P1-2):
   ```typescript
   const CASH_FLOW_RANGES = {
     CASH: { min: '1000', max: '1199' },
     OPERATING_ASSETS: { min: '1200', max: '1499' },
     INVESTING: { min: '1500', max: '1999' },
     OPERATING_LIABILITIES: { min: '2000', max: '2499' },
     FINANCING_DEBT: { min: '2500', max: '2999' },
     FINANCING_EQUITY: { min: '3000', max: '3999' },
     OPERATING_INCOME: { min: '4000', max: '4999' },
     OPERATING_EXPENSE: { min: '5000', max: '5899' },
     OPERATING_DEPRECIATION: { min: '5900', max: '5909' }, // Range, not single code
     OPERATING_OTHER_EXPENSE: { min: '5910', max: '9999' },
   };

   // Classify function with explicit handling for non-numeric codes
   function classifyAccount(code: string): string {
     if (!/^\d+$/.test(code)) {
       request.log.warn({ code }, 'Non-numeric GL account code found');
       return 'UNCLASSIFIED';
     }
     // ... range matching logic
   }
   ```

3. **Non-cash adjustments:** Use code range 5900-5909 (not just 5900)

4. **Working capital:** Compute net change during period (Performance P2-1 optimization)

5. **Validation:** closing cash = opening cash + net cash change

**Depends on:** Task 0.1, Task 2, Task 3, Task 4
**Risk:** high (complex financial logic, code range classification)
**Review:** `financial-data-validator`
**Success:** Cash flow sections sum correctly, optimized to 3 queries, complete code range handling

---

#### Task 6: Report Routes with Rate Limiting

**File:** `apps/api/src/domains/accounting/routes/report.ts`

**What:** Create route handlers for the 3 core statements with security enhancements:

**Key implementation:**

```typescript
import { statsRateLimitConfig } from '../../../middleware/rate-limit';

// P&L route
fastify.get('/profit-loss', {
  ...withPermission('accounting', 'reports', 'VIEW'),
  config: { rateLimit: statsRateLimitConfig() }, // Security P1-2
  handler: async (request, reply) => {
    const params = ProfitLossQuerySchema.parse(request.query);
    const service = new ReportService(request.tenantId, request.userId);

    try {
      const report = await service.generateProfitLoss(params);
      return reply.send(report);
    } catch (error) {
      // Sanitize SQL errors (Security R-5)
      request.log.error({ err: error }, 'P&L generation failed');
      throw new AccountingError('Failed to generate report', 'REPORT_GENERATION_FAILED', 500);
    }
  },
});

// Similar for balance-sheet, cash-flow
```

**All routes:**
- Use `withPermission('accounting', 'reports', 'VIEW')` (now defined in Task 0.4)
- Apply `statsRateLimitConfig()` (50 req/min)
- Construct `ReportService` with `request.tenantId, request.userId`
- Error handling: sanitize SQL errors (don't leak schema details)
- Register in `apps/api/src/domains/accounting/routes/index.ts`

**Depends on:** Task 0.4, Task 1, Task 3, Task 4, Task 5
**Success:** GET endpoints return JSON with rate limiting, sanitized errors

---

#### Task 7: Report Service Tests — Core Statements

**File:** `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts`

**What:** Test all 3 core statements with **P0 coverage**:

**Required test cases:**

1. **Tenant isolation** (Security P0-5):
   ```typescript
   it('should reject cross-tenant access via validateEntityOwnership', async () => {
     const service = new ReportService('tenant-A', 'user-1');
     await expect(
       service.generateProfitLoss({ entityId: 'entity-belongs-to-tenant-B', startDate, endDate })
     ).rejects.toThrow('Entity not found');
   });
   ```

2. **Multi-entity currency validation** (Financial P0-1):
   ```typescript
   it('should reject multi-entity consolidation with mixed currencies', async () => {
     // Setup: tenant has 2 entities with different functionalCurrency
     const service = new ReportService('tenant-mixed-currency', 'user-1');
     await expect(
       service.generateProfitLoss({ startDate, endDate }) // No entityId = multi-entity
     ).rejects.toThrow('Multi-entity consolidation requires all entities to use the same functional currency');
   });
   ```

3. **Soft delete filters** (Financial P0-4):
   ```typescript
   it('should exclude soft-deleted journal lines', async () => {
     // Create entry with one line soft-deleted
     // Verify that line is excluded from report totals
   });
   ```

4. **baseCurrency COALESCE** (Financial P0-1):
   ```typescript
   it('should include same-currency transactions in multi-entity reports', async () => {
     // Create journal lines with NULL baseCurrency (same currency as entity)
     // Verify they appear in multi-entity report totals
   });
   ```

5. **Retained earnings** (Financial P0-2):
   ```typescript
   it('should compute retained earnings without double-counting manual closing entries', async () => {
     // Setup: GL account 3100 has prior-year balance, current year has net income
     // Verify: totalRetainedEarnings = account3100Balance + currentYearNetIncome (not double)
   });
   ```

6. **Fiscal year fallback** (Financial P0-3):
   ```typescript
   it('should default to January when fiscalYearStart is NULL', async () => {
     // Create entity with NULL fiscalYearStart
     // Verify: fiscal year boundaries use January 1 as start
   });
   ```

7. **Integer cents** (Financial P1-7):
   ```typescript
   it('should handle PostgreSQL bigint SUM results', async () => {
     // Mock $queryRaw to return bigint values
     // Verify: converted to Number safely, assertIntegerCents passes
   });
   ```

8. **normalBalance direction** (Financial P1-3):
   ```typescript
   it('should use normalBalance field for balance calculation', async () => {
     // Create contra-revenue account (INCOME type, DEBIT normalBalance)
     // Verify: balance direction is correct
   });
   ```

9. **Empty GL data:** Returns empty report (not error)
10. **Balance equation:** A = L + E validation
11. **Trial Balance unbalanced:** Severity CRITICAL if debits != credits
12. **Cash Flow net change:** Reconciles to cash position change
13. **Period comparison:** Previous period data loads correctly

**Total:** ~30 tests (up from 25 to cover all P0/P1 cases)

**Depends on:** Task 3, Task 4, Task 5
**Risk:** high (financial assertions critical)
**Review:** `financial-data-validator`
**Success:** All tests pass with P0 coverage, financial calculations correct

---

### Sprint 2: Supporting Reports + Cache

---

#### Task 8: Report Service — Trial Balance + GL Ledger

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

**What:** Add two methods with improvements:

**Trial Balance:**
```typescript
async generateTrialBalance(params: TrialBalanceQuery): Promise<TrialBalanceReport> {
  // Single entity only (entityId required)
  await this.validateEntityOwnership(params.entityId);

  // Use tenantScopedQuery
  const results = await tenantScopedQuery<AggregateRow>(this.tenantId, (tenantId) => Prisma.sql`
    SELECT
      ga.id,
      ga.code,
      ga.name,
      COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
      COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
    FROM "GLAccount" ga
    LEFT JOIN "JournalLine" jl ON jl."glAccountId" = ga.id
    LEFT JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
    WHERE ga."entityId" = ${params.entityId}
      AND ga."isActive" = true
      AND (je.status = 'POSTED' OR je.id IS NULL)
      AND (je."deletedAt" IS NULL OR je.id IS NULL)
      AND (jl."deletedAt" IS NULL OR jl.id IS NULL)
      AND (je.date <= ${params.asOfDate} OR je.id IS NULL)
    GROUP BY ga.id, ga.code, ga.name
    ORDER BY ga.code
  `);

  const totalDebits = results.reduce((sum, r) => sum + this.convertBigInt(r.totalDebit), 0);
  const totalCredits = results.reduce((sum, r) => sum + this.convertBigInt(r.totalCredit), 0);
  const isBalanced = totalDebits === totalCredits;

  // If not balanced, log CRITICAL system integrity error (Financial P2-2)
  if (!isBalanced) {
    request.log.error(
      { entityId: params.entityId, totalDebits, totalCredits, diff: totalDebits - totalCredits },
      'CRITICAL: Trial balance does not balance — double-entry invariant violated'
    );
  }

  return {
    accounts: results.map(r => ({ ...r, debit: this.convertBigInt(r.totalDebit), credit: this.convertBigInt(r.totalCredit) })),
    totalDebits,
    totalCredits,
    isBalanced,
    severity: isBalanced ? 'OK' : 'CRITICAL',
  };
}
```

**GL Ledger:**
```typescript
async generateGLLedger(params: GLLedgerQuery): Promise<GLLedgerReport> {
  // Single entity, single account
  await this.validateEntityOwnership(params.entityId);

  // Use CUID cursor for ordering (Performance F8)
  // Running balance uses normalBalance (Financial P2-3)
  const results = await tenantScopedQuery<LedgerRow>(this.tenantId, (tenantId) => Prisma.sql`
    SELECT
      jl.id,
      je.date,
      je."entryNumber",
      je.memo,
      jl."debitAmount",
      jl."creditAmount",
      ga."normalBalance",
      SUM(
        CASE WHEN ga."normalBalance" = 'DEBIT'
          THEN jl."debitAmount" - jl."creditAmount"
          ELSE jl."creditAmount" - jl."debitAmount"
        END
      ) OVER (ORDER BY jl.id) as "runningBalance"
    FROM "JournalLine" jl
    JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
    JOIN "GLAccount" ga ON jl."glAccountId" = ga.id
    WHERE jl."glAccountId" = ${params.glAccountId}
      AND je."entityId" = ${params.entityId}
      AND je.status = 'POSTED'
      AND je."deletedAt" IS NULL
      AND jl."deletedAt" IS NULL
      AND je.date BETWEEN ${params.startDate} AND ${params.endDate}
      ${params.cursor ? Prisma.sql`AND jl.id > ${params.cursor}` : Prisma.empty}
    ORDER BY jl.id
    LIMIT ${params.limit}
  `);

  return {
    entries: results.map(r => ({ ...r, runningBalance: this.convertBigInt(r.runningBalance) })),
    nextCursor: results.length === params.limit ? results[results.length - 1].id : null,
  };
}
```

**Depends on:** Task 0.1, Task 2
**Success:** Trial Balance validates double-entry, GL Ledger cursor pagination works, running balance correct

---

#### Task 9: Report Service — Management Reports (Updated)

**File:** `apps/api/src/domains/accounting/services/report.service.ts`

**What:** Add two management report methods with **sourceDocument approach** (Architecture F-01):

**Spending by Category:**
```typescript
async generateSpendingByCategory(params: SpendingQuery): Promise<SpendingReport> {
  // Use GL Account as primary grouping (not Transaction.categoryId)
  // This avoids cross-domain JOIN complexity and covers all expense sources

  const entityFilter = params.entityId
    ? Prisma.sql`je."entityId" = ${params.entityId}`
    : Prisma.sql`je."entityId" IN (SELECT id FROM "Entity" WHERE "tenantId" = ${this.tenantId})`;

  const results = await tenantScopedQuery<SpendingRow>(this.tenantId, (tenantId) => Prisma.sql`
    SELECT
      ga.id as "glAccountId",
      ga.code,
      ga.name as "category",
      COALESCE(SUM(jl."baseCurrencyDebit"), SUM(jl."debitAmount"), 0) as "totalSpend"
    FROM "JournalLine" jl
    JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
    JOIN "GLAccount" ga ON jl."glAccountId" = ga.id
    WHERE ${entityFilter}
      AND ga.type = 'EXPENSE'
      AND je.status = 'POSTED'
      AND je."deletedAt" IS NULL
      AND jl."deletedAt" IS NULL
      AND je.date BETWEEN ${params.startDate} AND ${params.endDate}
    GROUP BY ga.id, ga.code, ga.name
    ORDER BY "totalSpend" DESC
  `);

  const totalSpend = results.reduce((sum, r) => sum + this.convertBigInt(r.totalSpend), 0);

  return {
    categories: results.map(r => ({
      category: r.category,
      amount: this.convertBigInt(r.totalSpend),
      percentage: totalSpend > 0 ? (this.convertBigInt(r.totalSpend) / totalSpend) * 100 : 0,
    })),
    totalSpend,
  };
}
```

**Revenue by Client:**
```typescript
async generateRevenueByClient(params: RevenueQuery): Promise<RevenueReport> {
  // Use sourceDocument JSON snapshots (avoids cross-domain JOIN)
  // Source preservation invariant ensures invoice data is stored on journal entry

  const entityFilter = params.entityId
    ? Prisma.sql`je."entityId" = ${params.entityId}`
    : Prisma.sql`je."entityId" IN (SELECT id FROM "Entity" WHERE "tenantId" = ${this.tenantId})`;

  const results = await tenantScopedQuery<RevenueRow>(this.tenantId, (tenantId) => Prisma.sql`
    SELECT
      je."sourceDocument"->>'clientId' as "clientId",
      je."sourceDocument"->>'clientName' as "clientName",
      COUNT(DISTINCT je.id) as "invoiceCount",
      COALESCE(SUM(jl."baseCurrencyCredit"), SUM(jl."creditAmount"), 0) as "totalRevenue"
    FROM "JournalEntry" je
    JOIN "JournalLine" jl ON jl."journalEntryId" = je.id
    JOIN "GLAccount" ga ON jl."glAccountId" = ga.id
    WHERE ${entityFilter}
      AND je."sourceType" = 'INVOICE'
      AND ga.type = 'INCOME'
      AND je.status = 'POSTED'
      AND je."deletedAt" IS NULL
      AND jl."deletedAt" IS NULL
      AND je.date BETWEEN ${params.startDate} AND ${params.endDate}
    GROUP BY je."sourceDocument"->>'clientId', je."sourceDocument"->>'clientName'
    ORDER BY "totalRevenue" DESC
  `);

  const totalRevenue = results.reduce((sum, r) => sum + this.convertBigInt(r.totalRevenue), 0);

  return {
    clients: results.map(r => ({
      clientId: r.clientId,
      clientName: r.clientName || 'Unknown',
      invoiceCount: Number(r.invoiceCount),
      amount: this.convertBigInt(r.totalRevenue),
      percentage: totalRevenue > 0 ? (this.convertBigInt(r.totalRevenue) / totalRevenue) * 100 : 0,
    })),
    totalRevenue,
  };
}
```

**Depends on:** Task 0.1, Task 2
**Success:** Spending groups by GL account, revenue uses sourceDocument (no cross-domain JOIN)

---

#### Task 10: In-Memory Report Cache (Bounded)

**File:** `apps/api/src/domains/accounting/services/report-cache.ts`

**What:** Create cache with **bounded growth** (Security P2-5, Performance F6, Architecture F-03):

```typescript
export class ReportCache {
  private cache = new Map<string, { data: unknown; expiry: number }>();
  private readonly MAX_ENTRIES = 500;
  private readonly DEFAULT_TTL_MS = parseInt(process.env.REPORT_CACHE_TTL_MS || '300000', 10);
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic cleanup every 60 seconds (active eviction)
    this.cleanupTimer = setInterval(() => this.sweep(), 60_000);
    this.cleanupTimer.unref(); // Don't block process exit
  }

  get(tenantId: string, key: string): unknown | null {
    if (!tenantId) throw new Error('tenantId required for cache access');

    const fullKey = `${tenantId}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.data;
  }

  set(tenantId: string, key: string, data: unknown, ttlMs = this.DEFAULT_TTL_MS): void {
    if (!tenantId) throw new Error('tenantId required for cache access');

    // Evict oldest if at capacity (LRU approximation)
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const fullKey = `${tenantId}:${key}`;
    this.cache.set(fullKey, { data, expiry: Date.now() + ttlMs });
  }

  invalidate(tenantId: string, pattern: RegExp): void {
    if (!tenantId) throw new Error('tenantId required for cache invalidation');

    // Only iterate keys for this tenant
    for (const key of this.cache.keys()) {
      if (key.startsWith(tenantId) && pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cache.clear();
  }
}

export const reportCache = new ReportCache();

// Register cleanup in Fastify shutdown (Performance F6)
// In apps/api/src/index.ts:
// fastify.addHook('onClose', async () => { reportCache.destroy(); });
```

**Cache key format:** `{tenantId}:report:{type}:{entityId|'all'}:{startDate}:{endDate}:{comparisonPeriod|'none'}`

**Wire into ReportService:**
```typescript
// Before query:
const cacheKey = `report:profit-loss:${params.entityId || 'all'}:${params.startDate}:${params.endDate}:${params.comparisonPeriod || 'none'}`;
const cached = reportCache.get(this.tenantId, cacheKey);
if (cached) return cached as ProfitLossReport;

// After query:
reportCache.set(this.tenantId, cacheKey, report);
```

**Wire invalidation defensively** (Architecture F-15):
```typescript
// In PostingService, after creating journal entry:
try {
  reportCache.invalidate(this.tenantId, /^report:/);
} catch (err) {
  // Non-critical, log and continue
  server.log.warn({ err }, 'Report cache invalidation failed');
}
```

**Depends on:** Task 6
**Success:** Cache bounded to 500 entries, active sweep, tenant-scoped invalidation

---

#### Task 11: Supporting Report Routes + Tests

**Files:** `apps/api/src/domains/accounting/routes/report.ts`, `apps/api/src/domains/accounting/services/__tests__/report.service.test.ts`

**What:** Add routes with rate limiting + comprehensive tests:

**Routes:**
```typescript
fastify.get('/trial-balance', {
  ...withPermission('accounting', 'reports', 'VIEW'),
  config: { rateLimit: statsRateLimitConfig() },
  handler: async (request, reply) => { /* ... */ },
});

fastify.get('/general-ledger', {
  ...withPermission('accounting', 'reports', 'VIEW'),
  config: { rateLimit: statsRateLimitConfig() },
  handler: async (request, reply) => { /* ... */ },
});

fastify.get('/spending', {
  ...withPermission('accounting', 'reports', 'VIEW'),
  config: { rateLimit: statsRateLimitConfig() },
  handler: async (request, reply) => { /* ... */ },
});

fastify.get('/revenue', {
  ...withPermission('accounting', 'reports', 'VIEW'),
  config: { rateLimit: statsRateLimitConfig() },
  handler: async (request, reply) => { /* ... */ },
});
```

**Tests (~20 tests, up from 15):**
- Trial Balance: debits equal credits, CRITICAL severity if unbalanced
- GL Ledger: running balance direction, cursor pagination, limit enforcement (default 50, max 200)
- Spending: groups by GL account, handles zero spend gracefully
- Revenue: uses sourceDocument JSON, handles missing client names
- Cache: hit/miss behavior, TTL expiry, tenant-scoped invalidation, bounded growth

**Depends on:** Task 8, Task 9, Task 10
**Success:** All routes working with rate limiting, tests cover P0/P1 cases

---

### Sprint 3: Frontend — Reports Home + P&L + Balance Sheet

---

#### Task 12: Move Reports to Accounting + Navigation Update

**(No changes from original — already correct)**

**Files:**
- `apps/web/src/lib/navigation.ts`
- Delete: `apps/web/src/app/(dashboard)/planning/reports/`
- Create: `apps/web/src/app/(dashboard)/accounting/reports/` (page.tsx, loading.tsx, error.tsx)

**What:**
- Update navigation.ts: move Reports to accounting group
- Delete old planning/reports stub
- Create reports home page with cards grid
- Glass styling, semantic tokens

**Depends on:** none
**Success:** Reports accessible at `/accounting/reports/`, navigation updated

---

#### Task 13: Reports API Client

**(No changes from original — already correct)**

**File:** `apps/web/src/lib/api/reports.ts`

**What:** Create API client functions for all report endpoints using `apiClient<T>()` pattern

**Depends on:** none
**Success:** All API client functions typed and callable

---

#### Task 14: Profit & Loss Report Page (Server-Side Fetching)

**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/error.tsx`

**What:** Update to use **URL search params + server-side fetching** (Architecture F-09):

**page.tsx (Server Component):**
```typescript
export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{
    entityId?: string;
    startDate?: string;
    endDate?: string;
    comparison?: string;
  }>;
}) {
  const params = await searchParams;

  // Fetch report data server-side (auth in apiClient)
  const report = params.startDate && params.endDate
    ? await apiClient<ProfitLossReport>({
        path: `/api/accounting/reports/profit-loss?${new URLSearchParams(params)}`,
      })
    : null;

  return <PLReportView initialData={report} initialParams={params} />;
}
```

**pl-report-view.tsx (Client Component):**
```typescript
'use client';

export function PLReportView({
  initialData,
  initialParams,
}: {
  initialData: ProfitLossReport | null;
  initialParams: Record<string, string>;
}) {
  const router = useRouter();
  const [params, setParams] = useState(initialParams);

  // Update URL search params when controls change
  const handleParamChange = (newParams: Record<string, string>) => {
    const searchParams = new URLSearchParams(newParams);
    router.push(`/accounting/reports/profit-loss?${searchParams}`);
  };

  // Display report from initialData (server-rendered)
  // Controls use handleParamChange to update URL

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass rounded-xl p-6">
        <EntitySelect value={params.entityId} onChange={(v) => handleParamChange({ ...params, entityId: v })} />
        {/* Date range, comparison toggle */}
      </div>

      {/* Report table */}
      {initialData ? (
        <ReportTable data={initialData} />
      ) : (
        <EmptyState>Select date range to generate report</EmptyState>
      )}
    </div>
  );
}
```

**Benefits:**
- Server-side auth (no token in browser)
- Shareable/bookmarkable report URLs
- Leverages Next.js streaming (loading.tsx shows during fetch)
- No client-side API calls

**Depends on:** Task 13
**Review:** `nextjs-app-router-reviewer`, `design-system-enforcer`
**Success:** P&L loads server-side, URL params work, shareable links

---

#### Task 15: Balance Sheet Report Page

**(Same pattern as Task 14 — server-side fetching with URL search params)**

**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/error.tsx`

**What:**
- Server Component fetches Balance Sheet data
- Client Component displays and handles control updates via URL params
- Warning banner if `isBalanced === false`
- Retained earnings shown as two synthetic line items (prior years + current year)

**Depends on:** Task 13
**Review:** `nextjs-app-router-reviewer`
**Success:** Balance sheet renders server-side, balance equation validated

---

### Sprint 4: Frontend — Cash Flow + Supporting Reports

---

#### Task 16: Cash Flow Statement Page

**(Server-side fetching pattern)**

**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/cf-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/error.tsx`

**What:**
- Server Component fetches Cash Flow data
- 3 activity sections, reconciliation check

**Depends on:** Task 13
**Success:** Cash flow renders server-side with reconciliation

---

#### Task 17: Trial Balance Report Page

**(Server-side fetching, same pattern)**

**Files:** (page.tsx, tb-report-view.tsx, loading.tsx, error.tsx)

**What:**
- Server Component fetches Trial Balance
- **CRITICAL banner** if `severity === 'CRITICAL'` (debits != credits)

**Depends on:** Task 13
**Success:** Trial balance renders, CRITICAL alert works

---

#### Task 18: General Ledger Report Page

**(Server-side fetching with cursor pagination)**

**Files:** (page.tsx, gl-report-view.tsx, loading.tsx, error.tsx)

**What:**
- Server Component fetches first page (limit 50)
- Client Component handles "Load more" with cursor
- Running balance column respects normalBalance direction

**Depends on:** Task 13
**Success:** GL ledger loads 50 entries, pagination works

---

#### Task 19: Management Report Pages (Spending + Revenue)

**(Server-side fetching, same pattern)**

**Files:** 8 files (2 reports × 4 files each)

**What:**
- Spending: GL account grouping, percentage bars
- Revenue: client names from sourceDocument, invoice counts

**Depends on:** Task 13
**Success:** Both reports render server-side with correct data

---

### Sprint 5: PDF + CSV Export

---

#### Task 20: Install @react-pdf/renderer + Shared Styles

**(No changes from original — already correct, add truncation helper for Security P2-1)**

**Files:**
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/domains/accounting/templates/shared-styles.ts`

**What:**
- Install @react-pdf/renderer
- Verify JSX support
- Create shared styles + reusable components
- **Add truncation helper** (Security P2-1):
  ```typescript
  export function truncate(str: string, max: number): string {
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  export function formatCentsForPdf(cents: number): string {
    return (cents / 100).toFixed(2);
  }
  ```

**Depends on:** none
**Success:** Shared styles compile, truncation helper works

---

#### Task 21: P&L PDF Template (With Limits)

**File:** `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx`

**What:** React PDF template with **size limits** (Performance F9):

```typescript
export async function generateProfitLossPdf(report: ProfitLossReport): Promise<Buffer> {
  const MAX_PDF_ENTRIES = 1000;

  // Count total line items
  const lineItemCount = countLineItems(report);
  if (lineItemCount > MAX_PDF_ENTRIES) {
    throw new AccountingError(
      `Report too large for PDF export (${lineItemCount} entries exceed ${MAX_PDF_ENTRIES} limit). Use CSV export instead.`,
      'PDF_TOO_LARGE',
      400
    );
  }

  const TIMEOUT_MS = 30_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('PDF generation timed out')), TIMEOUT_MS)
  );

  const pdfDoc = (
    <Document>
      <Page size="A4">
        <ReportHeader
          entityName={truncate(report.entityName, 100)}
          title="Profit & Loss Statement"
          dateRange={`${report.startDate} to ${report.endDate}`}
        />
        {/* Revenue, Expenses, Net Income sections */}
        <ReportFooter />
      </Page>
    </Document>
  );

  const buffer = await Promise.race([
    renderToBuffer(pdfDoc),
    timeoutPromise,
  ]);

  return buffer;
}
```

**Depends on:** Task 20
**Success:** PDF generates with 1000-entry limit, 30s timeout

---

#### Task 22: Balance Sheet + Cash Flow PDF Templates

**(Same size limits and timeout as Task 21)**

**Files:**
- `apps/api/src/domains/accounting/templates/balance-sheet-pdf.tsx`
- `apps/api/src/domains/accounting/templates/cash-flow-pdf.tsx`

**What:**
- Same protective limits (1000 entries, 30s timeout)
- Truncate user-supplied strings
- Professional formatting

**Depends on:** Task 20
**Success:** Both PDFs generate with limits

---

#### Task 23: CSV Export Service (Formula Injection Protection)

**File:** `apps/api/src/domains/accounting/services/report-export.service.ts`

**What:** Create export service with **CSV formula injection prevention** (Security P2-2):

```typescript
export class ReportExportService {
  /**
   * Sanitize CSV cell to prevent formula injection
   * @see https://owasp.org/www-community/attacks/CSV_Injection
   */
  private sanitizeCsvCell(value: string): string {
    // Prevent formula injection (starts with =+\-@)
    if (/^[=+\-@\t\r]/.test(value)) {
      return `'${value}`; // Prefix with single quote (Excel treats as text)
    }

    // Escape quotes and wrap if contains comma, quote, or newline
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Format cents as dollars with exactly 2 decimal places
   */
  private formatCentsForCsv(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  /**
   * Convert report to CSV string
   */
  toCsv(report: ProfitLossReport | BalanceSheetReport | CashFlowReport, type: string): string {
    const rows: string[] = [];

    // Header row
    if (type === 'profit-loss') {
      rows.push('Account Code,Account Name,Type,Current Period,Previous Period');

      // Data rows with sanitization
      for (const item of flattenHierarchy(report)) {
        rows.push([
          this.sanitizeCsvCell(item.code),
          this.sanitizeCsvCell(item.name),
          this.sanitizeCsvCell(item.type),
          this.formatCentsForCsv(item.balance),
          item.previousBalance ? this.formatCentsForCsv(item.previousBalance) : '',
        ].join(','));
      }
    }
    // Similar for balance-sheet, cash-flow, trial-balance, gl-ledger

    return rows.join('\n');
  }
}
```

**Depends on:** none
**Success:** CSV exports sanitized, Excel safe, 2 decimal places

---

#### Task 24: Export Routes + Frontend Buttons (Authenticated Downloads)

**Files:**
- `apps/api/src/domains/accounting/routes/report.ts`
- All Sprint 3/4 frontend report views

**What:** Add export with **authenticated blob downloads** (Architecture F-14):

**Backend route changes:**
```typescript
// Check format query param
const format = request.query.format || 'json';

if (format === 'pdf' || format === 'csv') {
  // Add audit logging (Security P2-3)
  await createAuditLog({
    tenantId: request.tenantId,
    userId: request.userId,
    model: 'Report',
    recordId: 'profit-loss',
    action: 'EXPORT',
    after: { format, entityId: params.entityId, dateRange: { start: params.startDate, end: params.endDate } },
  });

  // Apply stricter rate limit for exports
  // (Already handled if route uses statsRateLimitConfig)

  if (format === 'pdf') {
    const pdfBuffer = await generateProfitLossPdf(report);

    // Sanitize filename (Security P2-4)
    const filename = sanitizeFilename(`profit-loss-${params.startDate}-${params.endDate}`);

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
      .send(pdfBuffer);
  }

  if (format === 'csv') {
    const csv = reportExportService.toCsv(report, 'profit-loss');
    const filename = sanitizeFilename(`profit-loss-${params.startDate}-${params.endDate}`);

    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      .send(csv);
  }
}
```

**Sanitize filename helper:**
```typescript
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
}
```

**Frontend export buttons:**
```typescript
// pl-report-view.tsx
async function downloadReport(format: 'pdf' | 'csv') {
  const token = await getToken(); // Clerk client-side token
  const searchParams = new URLSearchParams({ ...params, format });

  const response = await fetch(
    `${API_URL}/api/accounting/reports/profit-loss?${searchParams}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `profit-loss-${params.startDate}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Depends on:** Task 21, Task 22, Task 23
**Success:** PDF/CSV downloads work with auth, audit logged, filenames sanitized

---

### Sprint 6: Data Backup + Charts + Polish

---

#### Task 25: Full Data Backup Service (System Domain, Streaming)

**File:** `apps/api/src/domains/system/routes/data-export.ts` (moved from accounting)

**What:** Move data export to **System domain with ADMIN permission** and **streaming ZIP** (Security P0-7, Performance F10):

**Route:**
```typescript
// apps/api/src/domains/system/routes/data-export.ts

export async function dataExportRoutes(fastify: FastifyInstance) {
  fastify.get('/data-export', {
    ...withPermission('system', 'data-management', 'ADMIN'),
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 minute',
      },
    },
    handler: async (request, reply) => {
      // Explicit role check (Security P0-7)
      if (request.tenant.role !== 'OWNER' && request.tenant.role !== 'ADMIN') {
        throw new Error('Only owners and admins can export data');
      }

      const { entityId } = request.query as { entityId?: string };

      // Audit logging
      await createAuditLog({
        tenantId: request.tenantId,
        userId: request.userId,
        model: 'DataExport',
        recordId: 'full-backup',
        action: 'EXPORT',
        after: { format: 'zip', entityId: entityId || 'all' },
      });

      // Streaming ZIP generation (Performance F10)
      await streamDataBackup(reply, request.tenantId, entityId);
    },
  });
}
```

**Streaming implementation:**
```typescript
import archiver from 'archiver';

async function streamDataBackup(reply: FastifyReply, tenantId: string, entityId?: string) {
  const archive = archiver('zip', { zlib: { level: 6 } });

  reply.raw.setHeader('Content-Type', 'application/zip');
  reply.raw.setHeader('Content-Disposition', `attachment; filename="akount-backup-${Date.now()}.zip"`);
  archive.pipe(reply.raw);

  const tables = ['entities', 'accounts', 'transactions', 'journal-entries', 'journal-lines', 'invoices', 'bills', 'payments', 'clients', 'vendors'];

  for (const tableName of tables) {
    const csvStream = new PassThrough();
    archive.append(csvStream, { name: `${tableName}.csv` });

    // Write CSV header
    const columns = getColumnsForTable(tableName);
    csvStream.write(columns.join(',') + '\n');

    // Cursor-paginated reads (never hold all rows in memory)
    let cursor: string | undefined;
    do {
      const batch = await queryTable(tableName, tenantId, entityId, cursor, 1000);
      for (const row of batch.rows) {
        csvStream.write(toCsvRow(row, columns) + '\n');
      }
      cursor = batch.nextCursor;
    } while (cursor);

    csvStream.end();
  }

  // Add metadata.json
  const metadata = {
    exportDate: new Date().toISOString(),
    tenantId,
    entityId: entityId || 'all',
    schemaVersion: '1.0',
    tables: tables.map(t => ({ name: t, rowCount: getRowCount(t) })),
  };
  archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

  await archive.finalize();
}
```

**Register in system routes:**
```typescript
// apps/api/src/domains/system/routes/index.ts
await fastify.register(dataExportRoutes, { prefix: '/system' });
```

**Depends on:** Task 0.4, Task 23
**Review:** `security-sentinel`
**Success:** ZIP streams with no memory spikes, OWNER/ADMIN only, audit logged

---

#### Task 26: Charts (P&L Trend, Expense Breakdown, BS Composition)

**(No changes from original — already correct, ensure CSS variables used)**

**Files:** Update `pl-report-view.tsx`, `spending-view.tsx`, `bs-report-view.tsx`

**What:** Add Recharts visualizations using design tokens:
- P&L Trend: `AreaChart` with `var(--ak-green)` / `var(--ak-red)`
- Expense Breakdown: `PieChart` with design system palette
- BS Composition: `BarChart` stacked

**Depends on:** Task 14, Task 15, Task 19
**Success:** Charts render with CSS variables, responsive

---

#### Task 27: Settings Data Export Button + Final Polish

**Files:**
- `apps/web/src/app/(dashboard)/system/settings/page.tsx`
- Various cleanup

**What:**
- Add "Download All Data" button to Settings → calls `/api/system/data-export`
- Final polish: consistent headers, empty states, loading skeletons, navigation flow

**Depends on:** Task 25, all prior tasks
**Success:** Data export in settings, all pages polished

---

## Reference Files

**(No changes from original)**

## Edge Cases (Updated)

- **No GL data:** Show empty state message, not an error
- **Unbalanced Balance Sheet:** Show warning banner with `isBalanced: false` flag
- **Unbalanced Trial Balance:** Show CRITICAL severity banner, log system integrity error
- **Retained Earnings without FiscalCalendar:** Default to calendar year (Jan 1) if no fiscal calendar exists
- **Retained Earnings with manual closing entries:** Use account 3100 balance + current year dynamic (no double-count)
- **Multi-entity with mixed currencies:** Reject with error message explaining currency mismatch
- **Multi-entity with NULL baseCurrency fields:** COALESCE to debitAmount/creditAmount (handles same-currency entries)
- **Voided/Draft entries:** Excluded (WHERE `status = 'POSTED'`, both je.deletedAt AND jl.deletedAt)
- **Accounts with zero balance:** Include in reports
- **GL account codes outside defined ranges (Cash Flow):** Classify as "UNCLASSIFIED" with warning
- **Non-numeric GL account codes:** Log warning, classify as "UNCLASSIFIED"
- **Large date ranges:** SQL aggregation handles efficiently; GL Ledger uses cursor pagination
- **Concurrent cache invalidation:** Acceptable (defensive try-catch, 5-min TTL acceptable staleness)
- **PDF generation for large reports:** Reject if > 1000 entries, timeout at 30s
- **CSV formula injection:** Prefix cells starting with `=+\-@` with single quote
- **Empty string entityId:** Zod `.cuid()` rejects, never reaches service logic
- **PostgreSQL bigint overflow:** Convert to Number with safe integer check

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 0.1 (tenantScopedQuery) | `security-sentinel` |
| Task 0.3 (Indexes) | `performance-oracle` |
| Task 0.4 (RBAC) | `security-sentinel` |
| Task 0.5 (DocumentPostingService) | `financial-data-validator` |
| Task 3 (P&L) | `financial-data-validator`, `security-sentinel` |
| Task 4 (Balance Sheet) | `financial-data-validator` |
| Task 5 (Cash Flow) | `financial-data-validator`, `performance-oracle` |
| Task 7 (Tests) | `financial-data-validator` |
| Task 12 (Navigation) | `nextjs-app-router-reviewer` |
| Task 14 (P&L Page) | `nextjs-app-router-reviewer`, `design-system-enforcer` |
| Task 15 (BS Page) | `nextjs-app-router-reviewer` |
| Task 25 (Data Export) | `security-sentinel`, `performance-oracle` |

## Domain Impact

**(Updated for System domain data export)**

- **Primary:** Accounting (GL data is source of truth)
- **Adjacent:**
  - Banking (Cash Flow uses bank account balances via GL accounts)
  - Invoicing (Revenue by Client uses sourceDocument from journal entries)
  - Vendors (Spending uses GL expense accounts)
  - Overview (dashboard may link to reports)
  - **System (data export moved here from Accounting)**
- **Navigation:** Reports entry moves from Planning to Accounting domain
- **Cache invalidation touches:** PostingService, DocumentPostingService (defensive try-catch)

## Testing Strategy

**Backend (~50 tests total, up from 40):**
- Report service tests: P&L, BS, CF, Trial Balance, GL Ledger, Spending, Revenue (~35)
  - **P0 coverage:** tenant isolation, multi-entity currency validation, soft delete filters, baseCurrency COALESCE, retained earnings, fiscal year fallback, BigInt handling (7 tests)
  - **P1 coverage:** normalBalance direction, empty string entityId rejection, cache bounded growth (3 tests)
- Cache tests: hit/miss, TTL expiry, tenant-scoped invalidation, bounded growth, sweep (~7)
- Route tests: endpoint validation, auth, rate limiting, audit logging (~8)
- Financial assertions: `assertIntegerCents()` on ALL monetary fields
- Tenant isolation: verify raw SQL uses tenantScopedQuery, test cross-tenant access rejection
- Balance validation: BS equation (A = L + E), TB (DR = CR), CF reconciliation

**Frontend:**
- Visual verification: each page renders with correct structure
- Empty states: tested with no GL data
- Loading states: skeleton renders during fetch
- Error states: boundary catches API failures
- Server-side fetching: URL params work, shareable links

## Progress

### Sprint 0: Infrastructure
- [ ] Task 0.1: Create tenantScopedQuery Wrapper
- [ ] Task 0.2: Add Guardrail Hook for $queryRawUnsafe
- [ ] Task 0.3: Database Migration — Add Composite Indexes
- [ ] Task 0.4: Add accounting:reports to RBAC Permission Matrix
- [ ] Task 0.5: Update DocumentPostingService for Multi-Currency

### Sprint 1: Backend Core Reports
- [ ] Task 1: Report Zod Schemas
- [ ] Task 2: Report Service — TypeScript Interfaces & Helpers
- [ ] Task 3: Report Service — Profit & Loss
- [ ] Task 4: Report Service — Balance Sheet
- [ ] Task 5: Report Service — Cash Flow Statement
- [ ] Task 6: Report Routes with Rate Limiting
- [ ] Task 7: Report Service Tests — Core Statements

### Sprint 2: Supporting Reports + Cache
- [ ] Task 8: Report Service — Trial Balance + GL Ledger
- [ ] Task 9: Report Service — Management Reports (Updated)
- [ ] Task 10: In-Memory Report Cache (Bounded)
- [ ] Task 11: Supporting Report Routes + Tests

### Sprint 3: Frontend — Reports Home + P&L + Balance Sheet
- [ ] Task 12: Move Reports to Accounting + Navigation Update
- [ ] Task 13: Reports API Client
- [ ] Task 14: Profit & Loss Report Page (Server-Side Fetching)
- [ ] Task 15: Balance Sheet Report Page

### Sprint 4: Frontend — Cash Flow + Supporting Reports
- [ ] Task 16: Cash Flow Statement Page
- [ ] Task 17: Trial Balance Report Page
- [ ] Task 18: General Ledger Report Page
- [ ] Task 19: Management Report Pages (Spending + Revenue)

### Sprint 5: PDF + CSV Export
- [ ] Task 20: Install @react-pdf/renderer + Shared Styles
- [ ] Task 21: P&L PDF Template (With Limits)
- [ ] Task 22: Balance Sheet + Cash Flow PDF Templates
- [ ] Task 23: CSV Export Service (Formula Injection Protection)
- [ ] Task 24: Export Routes + Frontend Buttons (Authenticated Downloads)

### Sprint 6: Data Backup + Charts + Polish
- [ ] Task 25: Full Data Backup Service (System Domain, Streaming)
- [ ] Task 26: Charts (P&L Trend, Expense Breakdown, BS Composition)
- [ ] Task 27: Settings Data Export Button + Final Polish

---

## P2 Improvements Deferred to Future Iterations

**Performance optimizations (good to have, not required for MVP):**
- Cash Flow consolidate 7 queries → 3 (F4) — partially done in Task 5
- Retained earnings combine 2 queries → 1 with CASE expression (F5)
- Cache TTL configurable via env var (F7) — already done in Task 10
- GL Ledger date column denormalization (F8) — deferred to Phase 6

**Security enhancements (nice to have, not critical):**
- Audit logging for report VIEW operations (P2-3) — only exports logged for MVP
- Response size limits for reports (R-4)
- Error response sanitization (R-5) — basic implementation in Task 6

**Architecture improvements (acceptable for MVP):**
- Service pattern consistency validation (F-05, F-07) — already consistent
- Single service file SRP concerns (F-06) — acceptable at 600-900 lines for MVP
- Dual PDF libraries (F-08) — document in package.json comment
- Task dependencies optimization (F-12) — follow as written, optimize next phase
- Cache invalidation event-based approach (F-15) — defensive try-catch acceptable for MVP

**Financial refinements (post-launch):**
- Cash Flow code range classification user overrides (F-11)
- Balance Sheet materialized snapshots (F3) — Phase 6 optimization
- Spending by Category via Transaction.categoryId (P2-6) — GL account grouping sufficient for MVP
- Revenue by Client void handling verification (P2-7)

---

**Total Changes from Original Plan:**
- **Added Sprint 0:** 5 new tasks (infrastructure setup)
- **Modified 18 tasks:** Incorporated P0/P1 fixes
- **Added ~15 tests:** P0 coverage requirements
- **Updated 3 sections:** Edge cases, success criteria, domain impact

**Estimated Additional Time:**
- Sprint 0: +2-4 hours
- Enhanced tests: +3-5 hours
- Updated implementations: absorbed into original estimates
- **Total:** +5-9 hours over original 80-100 hour estimate

**New Total Estimate:** 85-110 hours

---

**Review Status:** ✅ APPROVED — All P0 and P1 issues addressed. Ready for implementation.