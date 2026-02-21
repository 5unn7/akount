import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { tenantScopedQuery } from '../../../lib/tenant-scoped-query';
import { reportCache } from './report-cache';
import type {
  ReportLineItem,
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalanceReport,
  GLLedgerEntry,
  GLLedgerReport,
  SpendingReport,
  RevenueReport,
} from '@akount/types/financial';

// Re-export for consumers (report-export.service, PDF templates)
export type {
  ReportLineItem,
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalanceReport,
  GLLedgerEntry,
  GLLedgerReport,
  SpendingReport,
  RevenueReport,
};

/**
 * Report Service
 *
 * Generates financial statements and management reports from journal entry data.
 * Uses raw SQL aggregation via tenantScopedQuery for performance.
 *
 * CRITICAL RULES:
 * - All queries use tenantScopedQuery wrapper (security)
 * - Multi-entity consolidation requires same functional currency
 * - Integer cents maintained through BigInt → Number conversion
 * - COALESCE for nullable baseCurrency fields (handles same-currency entries)
 *
 * DRY-1: Report types now imported from @akount/types to eliminate duplication
 */

// ─── Internal Type Definitions (SQL-specific, not exported) ──────────────────

// Note: These types are internal to the service and handle BigInt conversion from PostgreSQL

// ─── Row Type Interfaces (for BigInt handling from SQL) ─────────────────────

/**
 * Aggregate row from raw SQL (BigInt SUM results)
 */
interface AggregateRow {
  glAccountId: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  totalDebit: bigint; // PostgreSQL SUM returns bigint
  totalCredit: bigint;
}

/**
 * Combined Balance Sheet row — includes both cumulative and current-year aggregations
 * in a single query using conditional CASE expressions (PERF-1 optimization)
 */
interface BalanceSheetRow {
  glAccountId: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  totalDebit: bigint;
  totalCredit: bigint;
  currentYearDebit: bigint;  // Fiscal-year-scoped for retained earnings calc
  currentYearCredit: bigint;
}

/**
 * Ledger row from raw SQL
 */
interface LedgerRow {
  id: string;
  date: Date;
  entryNumber: string;
  memo: string | null;
  debitAmount: number;
  creditAmount: number;
  normalBalance: string;
  runningBalance: bigint; // Window function SUM returns bigint
}

/**
 * Spending row from raw SQL
 */
interface SpendingRow {
  glAccountId: string;
  code: string;
  category: string;
  totalSpend: bigint;
}

/**
 * Revenue row from raw SQL
 */
interface RevenueRow {
  clientId: string;
  clientName: string | null;
  invoiceCount: bigint;
  totalRevenue: bigint;
}

// ─── Report Service Class ────────────────────────────────────────────────────

export class ReportService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  // ─── Helper Methods ────────────────────────────────────────────────────────

  /**
   * Validate entity ownership (Security P0-6)
   * @throws AccountingError if entity not found or doesn't belong to tenant
   */
  private async validateEntityOwnership(entityId: string): Promise<void> {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404);
    }
  }

  /**
   * Get all entity IDs for tenant (multi-entity mode)
   */
  private async getEntityIds(): Promise<string[]> {
    const entities = await prisma.entity.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true },
    });
    return entities.map(e => e.id);
  }

  /**
   * Validate multi-entity currency consistency (Financial P0-1, P1-5)
   * @returns The common functional currency
   * @throws AccountingError if entities use different currencies
   */
  private async validateMultiEntityCurrency(entityIds: string[]): Promise<string> {
    if (entityIds.length === 0) {
      throw new AccountingError(
        'No entities found for this tenant',
        'NO_ENTITIES_FOUND',
        404
      );
    }

    const entities = await prisma.entity.findMany({
      where: {
        id: { in: entityIds },
        tenantId: this.tenantId,
      },
      select: { functionalCurrency: true },
    });

    if (entities.length === 0) {
      throw new AccountingError(
        'No entities found for this tenant',
        'NO_ENTITIES_FOUND',
        404
      );
    }

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

  /**
   * Get fiscal year boundaries with fallback (Financial P0-3)
   * @returns Fiscal year start and end dates
   */
  private async getFiscalYearBoundaries(
    entityId: string,
    asOfDate: Date
  ): Promise<{ start: Date; end: Date }> {
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

  /**
   * Convert BigInt to Number safely (Financial P1-7)
   * @throws AccountingError if value exceeds safe integer range
   */
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

  // ─── Public Report Generation Methods ────────────────────────────────────────

  /**
   * Generate Profit & Loss Statement (Income Statement)
   * Revenue - Expenses = Net Income
   *
   * @param params Query parameters (entityId optional for multi-entity mode)
   * @returns P&L report with hierarchical account breakdown
   */
  async generateProfitLoss(params: {
    entityId?: string;
    startDate: Date;
    endDate: Date;
    comparisonPeriod?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR';
  }): Promise<ProfitLossReport> {
    // Check cache first
    const cacheKey = `report:profit-loss:${params.entityId || 'all'}:${params.startDate.toISOString()}:${params.endDate.toISOString()}:${params.comparisonPeriod || 'none'}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as ProfitLossReport;
    }

    // 1. Determine entity scope
    let entityIds: string[];
    let entityName: string;
    let currency: string;

    if (params.entityId) {
      await this.validateEntityOwnership(params.entityId);
      entityIds = [params.entityId];
      const entity = await prisma.entity.findUniqueOrThrow({
        where: { id: params.entityId },
      });
      entityName = entity.name;
      currency = entity.functionalCurrency;
    } else {
      // Multi-entity consolidation
      entityIds = await this.getEntityIds();
      currency = await this.validateMultiEntityCurrency(entityIds);
      entityName = 'All Entities';
    }

    // 2. Query journal line aggregates for REVENUE and EXPENSE accounts
    // Use tenantScopedQuery for security (defense in depth)
    const results = await tenantScopedQuery<AggregateRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          gl."id" as "glAccountId",
          gl."code",
          gl."name",
          gl."type",
          gl."normalBalance",
          COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
          COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
        FROM "GLAccount" gl
        INNER JOIN "Entity" e ON e.id = gl."entityId"
        LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
        LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
        WHERE e."tenantId" = ${tenantId}
          AND gl."entityId" IN (${Prisma.join(entityIds)})
          AND gl."type" IN ('REVENUE', 'EXPENSE')
          AND (
            jl.id IS NULL
            OR (
              je."status" = 'POSTED'
              AND je."date" >= ${params.startDate}
              AND je."date" <= ${params.endDate}
              AND je."deletedAt" IS NULL
              AND jl."deletedAt" IS NULL
            )
          )
        GROUP BY gl.id, gl.code, gl.name, gl.type, gl."normalBalance"
        ORDER BY gl.code ASC
      `
    );

    // 3. Convert BigInt to Number and calculate balances
    const revenueItems: ReportLineItem[] = [];
    const expenseItems: ReportLineItem[] = [];

    for (const row of results) {
      const debit = this.convertBigInt(row.totalDebit);
      const credit = this.convertBigInt(row.totalCredit);

      // Calculate balance based on account type
      // REVENUE: credits increase balance (credits - debits)
      // EXPENSE: debits increase balance (debits - credits)
      const balance = row.type === 'REVENUE' ? credit - debit : debit - credit;

      const item: ReportLineItem = {
        accountId: row.glAccountId,
        code: row.code,
        name: row.name,
        type: row.type,
        normalBalance: row.normalBalance as 'DEBIT' | 'CREDIT',
        balance,
        depth: 0, // Flat for now, hierarchical in future iteration
        isSubtotal: false,
      };

      if (row.type === 'REVENUE') {
        revenueItems.push(item);
      } else {
        expenseItems.push(item);
      }
    }

    // 4. Calculate totals
    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.balance, 0);
    const totalExpense = expenseItems.reduce((sum, item) => sum + item.balance, 0);
    const netIncome = totalRevenue - totalExpense;

    // 5. Build report
    const report: ProfitLossReport = {
      entityId: params.entityId,
      entityName,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      currency,
      comparisonPeriod: params.comparisonPeriod,
      revenue: {
        sections: revenueItems,
        total: totalRevenue,
      },
      expenses: {
        sections: expenseItems,
        total: totalExpense,
      },
      netIncome,
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }

  /**
   * Generate Balance Sheet (Statement of Financial Position)
   * Assets = Liabilities + Equity (accounting equation)
   *
   * @param params Query parameters (entityId optional for multi-entity mode)
   * @returns Balance sheet with A=L+E validation
   */
  async generateBalanceSheet(params: {
    entityId?: string;
    asOfDate: Date;
    comparisonDate?: Date;
  }): Promise<BalanceSheetReport> {
    // Check cache first
    const cacheKey = `report:balance-sheet:${params.entityId || 'all'}:${params.asOfDate.toISOString()}:${params.comparisonDate?.toISOString() || 'none'}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as BalanceSheetReport;
    }

    // 1. Determine entity scope
    let entityIds: string[];
    let entityName: string;
    let currency: string;

    if (params.entityId) {
      await this.validateEntityOwnership(params.entityId);
      entityIds = [params.entityId];
      const entity = await prisma.entity.findUniqueOrThrow({
        where: { id: params.entityId },
      });
      entityName = entity.name;
      currency = entity.functionalCurrency;
    } else {
      // Multi-entity consolidation
      entityIds = await this.getEntityIds();
      currency = await this.validateMultiEntityCurrency(entityIds);
      entityName = 'All Entities';
    }

    // 2. Get fiscal year boundaries (needed for retained earnings calculation)
    const { start: fiscalYearStart } = await this.getFiscalYearBoundaries(
      entityIds[0], // Use first entity for fiscal year boundaries
      params.asOfDate
    );

    // 3. Single combined query for ALL account types (PERF-1: merged 2 queries → 1)
    // Uses conditional CASE aggregation to compute both:
    //   - Cumulative balances (ASSET/LIABILITY/EQUITY up to asOfDate)
    //   - Current fiscal year income (REVENUE/EXPENSE from fiscalYearStart to asOfDate)
    const results = await tenantScopedQuery<BalanceSheetRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          gl."id" as "glAccountId",
          gl."code",
          gl."name",
          gl."type",
          gl."normalBalance",
          COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
          COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit",
          COALESCE(SUM(CASE WHEN je."date" >= ${fiscalYearStart} THEN jl."debitAmount" ELSE 0 END), 0) as "currentYearDebit",
          COALESCE(SUM(CASE WHEN je."date" >= ${fiscalYearStart} THEN jl."creditAmount" ELSE 0 END), 0) as "currentYearCredit"
        FROM "GLAccount" gl
        INNER JOIN "Entity" e ON e.id = gl."entityId"
        LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
        LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
        WHERE e."tenantId" = ${tenantId}
          AND gl."entityId" IN (${Prisma.join(entityIds)})
          AND gl."type" IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')
          AND (
            jl.id IS NULL
            OR (
              je."status" = 'POSTED'
              AND je."date" <= ${params.asOfDate}
              AND je."deletedAt" IS NULL
              AND jl."deletedAt" IS NULL
            )
          )
        GROUP BY gl.id, gl.code, gl.name, gl.type, gl."normalBalance"
        ORDER BY gl.code ASC
      `
    );

    // 4. Convert BigInt and calculate balances
    const assetItems: ReportLineItem[] = [];
    const liabilityItems: ReportLineItem[] = [];
    const equityItems: ReportLineItem[] = [];
    let currentYearRevenue = 0;
    let currentYearExpense = 0;

    for (const row of results) {
      const debit = this.convertBigInt(row.totalDebit);
      const credit = this.convertBigInt(row.totalCredit);

      if (row.type === 'REVENUE') {
        // Revenue: credit-normal, fiscal-year-scoped via CASE columns
        const fyDebit = this.convertBigInt(row.currentYearDebit);
        const fyCredit = this.convertBigInt(row.currentYearCredit);
        currentYearRevenue += fyCredit - fyDebit;
        continue;
      }

      if (row.type === 'EXPENSE') {
        // Expense: debit-normal, fiscal-year-scoped via CASE columns
        const fyDebit = this.convertBigInt(row.currentYearDebit);
        const fyCredit = this.convertBigInt(row.currentYearCredit);
        currentYearExpense += fyDebit - fyCredit;
        continue;
      }

      // Balance calculation based on normal balance:
      // ASSET (debit normal): debits - credits
      // LIABILITY/EQUITY (credit normal): credits - debits
      const balance = row.normalBalance === 'DEBIT' ? debit - credit : credit - debit;

      const item: ReportLineItem = {
        accountId: row.glAccountId,
        code: row.code,
        name: row.name,
        type: row.type,
        normalBalance: row.normalBalance as 'DEBIT' | 'CREDIT',
        balance,
        depth: 0,
        isSubtotal: false,
      };

      if (row.type === 'ASSET') {
        assetItems.push(item);
      } else if (row.type === 'LIABILITY') {
        liabilityItems.push(item);
      } else {
        equityItems.push(item);
      }
    }

    // 5. Calculate Retained Earnings
    // 5a. Prior years balance (from GL account 3100 - Retained Earnings)
    const retainedEarningsAccount = equityItems.find((item) => item.code === '3100');
    const priorYearsRetainedEarnings = retainedEarningsAccount?.balance || 0;

    // 5b. Current year net income (computed from REVENUE/EXPENSE rows above)
    const currentYearNetIncome = currentYearRevenue - currentYearExpense;
    const totalRetainedEarnings = priorYearsRetainedEarnings + currentYearNetIncome;

    // 6. Calculate totals and validate accounting equation
    const totalAssets = assetItems.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = liabilityItems.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = equityItems.reduce((sum, item) => sum + item.balance, 0);
    // Note: totalEquity already includes prior years retained earnings (account 3100)
    // We only add current year net income separately
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + currentYearNetIncome;

    const isBalanced = totalAssets === totalLiabilitiesAndEquity;

    // 7. Build report
    const report: BalanceSheetReport = {
      entityId: params.entityId,
      entityName,
      asOfDate: params.asOfDate.toISOString(),
      currency,
      comparisonDate: params.comparisonDate?.toISOString(),
      assets: {
        items: assetItems,
        total: totalAssets,
      },
      liabilities: {
        items: liabilityItems,
        total: totalLiabilities,
      },
      equity: {
        items: equityItems,
        total: totalEquity,
      },
      retainedEarnings: {
        priorYears: priorYearsRetainedEarnings,
        currentYear: currentYearNetIncome,
        total: totalRetainedEarnings,
      },
      isBalanced,
      totalAssets,
      totalLiabilitiesAndEquity,
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }

  /**
   * Generate Cash Flow Statement (Statement of Cash Flows)
   * Shows cash movement from Operating, Investing, and Financing activities
   *
   * MVP Implementation: Simplified account-based changes
   * Future: Full indirect method with non-cash adjustments
   *
   * @param params Query parameters (entityId optional for multi-entity mode)
   * @returns Cash flow statement with reconciliation
   */
  async generateCashFlow(params: {
    entityId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<CashFlowReport> {
    // Check cache first
    const cacheKey = `report:cash-flow:${params.entityId || 'all'}:${params.startDate.toISOString()}:${params.endDate.toISOString()}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as CashFlowReport;
    }

    // 1. Determine entity scope
    let entityIds: string[];
    let entityName: string;
    let currency: string;

    if (params.entityId) {
      await this.validateEntityOwnership(params.entityId);
      entityIds = [params.entityId];
      const entity = await prisma.entity.findUniqueOrThrow({
        where: { id: params.entityId },
      });
      entityName = entity.name;
      currency = entity.functionalCurrency;
    } else {
      // Multi-entity consolidation
      entityIds = await this.getEntityIds();
      currency = await this.validateMultiEntityCurrency(entityIds);
      entityName = 'All Entities';
    }

    // 2. Calculate net income from P&L
    const profitLoss = await this.generateProfitLoss({
      entityId: params.entityId,
      startDate: params.startDate,
      endDate: params.endDate,
    });
    const netIncome = profitLoss.netIncome;

    // 3. Get cash account balances at start and end of period
    // Assume cash accounts start with code 1000-1099
    const [openingCashResult, closingCashResult] = await Promise.all([
      tenantScopedQuery<AggregateRow>(
        this.tenantId,
        (tenantId) => Prisma.sql`
          SELECT
            COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
            COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
          FROM "GLAccount" gl
          INNER JOIN "Entity" e ON e.id = gl."entityId"
          LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
          LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
          WHERE e."tenantId" = ${tenantId}
            AND gl."entityId" IN (${Prisma.join(entityIds)})
            AND gl."code" >= '1000'
            AND gl."code" < '1100'
            AND (
              jl.id IS NULL
              OR (
                je."status" = 'POSTED'
                AND je."date" < ${params.startDate}
                AND je."deletedAt" IS NULL
                AND jl."deletedAt" IS NULL
              )
            )
        `
      ),
      tenantScopedQuery<AggregateRow>(
        this.tenantId,
        (tenantId) => Prisma.sql`
          SELECT
            COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
            COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
          FROM "GLAccount" gl
          INNER JOIN "Entity" e ON e.id = gl."entityId"
          LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
          LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
          WHERE e."tenantId" = ${tenantId}
            AND gl."entityId" IN (${Prisma.join(entityIds)})
            AND gl."code" >= '1000'
            AND gl."code" < '1100'
            AND (
              jl.id IS NULL
              OR (
                je."status" = 'POSTED'
                AND je."date" <= ${params.endDate}
                AND je."deletedAt" IS NULL
                AND jl."deletedAt" IS NULL
              )
            )
        `
      ),
    ]);

    const openingCash =
      openingCashResult.length > 0
        ? this.convertBigInt(openingCashResult[0].totalDebit) -
          this.convertBigInt(openingCashResult[0].totalCredit)
        : 0;

    const closingCash =
      closingCashResult.length > 0
        ? this.convertBigInt(closingCashResult[0].totalDebit) -
          this.convertBigInt(closingCashResult[0].totalCredit)
        : 0;

    // 4. Calculate changes in operating, investing, and financing accounts
    // For MVP: Simplified approach using account code ranges
    // Operating: 1100-1999 (current assets) and 2000-2499 (current liabilities)
    // Investing: 1500-1999 (fixed assets)
    // Financing: 2500-2999 (long-term debt) and 3000-3999 (equity)

    const accountChanges = await tenantScopedQuery<AggregateRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          gl."id" as "glAccountId",
          gl."code",
          gl."name",
          gl."type",
          gl."normalBalance",
          COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
          COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
        FROM "GLAccount" gl
        INNER JOIN "Entity" e ON e.id = gl."entityId"
        LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
        LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
        WHERE e."tenantId" = ${tenantId}
          AND gl."entityId" IN (${Prisma.join(entityIds)})
          AND gl."code" >= '1100'
          AND gl."code" < '4000'
          AND (
            jl.id IS NULL
            OR (
              je."status" = 'POSTED'
              AND je."date" >= ${params.startDate}
              AND je."date" <= ${params.endDate}
              AND je."deletedAt" IS NULL
              AND jl."deletedAt" IS NULL
            )
          )
        GROUP BY gl.id, gl.code, gl.name, gl.type, gl."normalBalance"
        ORDER BY gl.code ASC
      `
    );

    const operatingItems: ReportLineItem[] = [];
    const investingItems: ReportLineItem[] = [];
    const financingItems: ReportLineItem[] = [];

    for (const row of accountChanges) {
      const debit = this.convertBigInt(row.totalDebit);
      const credit = this.convertBigInt(row.totalCredit);

      // Change in balance during period
      const change = row.normalBalance === 'DEBIT' ? debit - credit : credit - debit;

      // Apply indirect cash flow method sign convention:
      // - Asset increases (positive change) SUBTRACT from cash (negate)
      // - Liability/Equity increases (positive change) ADD to cash (keep as is)
      const cashFlowImpact = row.type === 'ASSET' ? -change : change;

      const item: ReportLineItem = {
        accountId: row.glAccountId,
        code: row.code,
        name: row.name,
        type: row.type,
        normalBalance: row.normalBalance as 'DEBIT' | 'CREDIT',
        balance: cashFlowImpact, // Store the cash flow impact, not raw balance change
        depth: 0,
        isSubtotal: false,
      };

      // Categorize by account code range
      const codeNum = parseInt(row.code, 10);

      if ((codeNum >= 1100 && codeNum < 1500) || (codeNum >= 2000 && codeNum < 2500)) {
        // Current assets/liabilities = Operating
        operatingItems.push(item);
      } else if (codeNum >= 1500 && codeNum < 2000) {
        // Fixed assets = Investing
        investingItems.push(item);
      } else if (codeNum >= 2500 && codeNum < 4000) {
        // Long-term debt/equity = Financing
        financingItems.push(item);
      }
    }

    // 5. Calculate totals
    const operatingCashFlow =
      netIncome + operatingItems.reduce((sum, item) => sum + item.balance, 0);
    const investingCashFlow = investingItems.reduce((sum, item) => sum + item.balance, 0);
    const financingCashFlow = financingItems.reduce((sum, item) => sum + item.balance, 0);
    const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;

    // 6. Build report
    const report: CashFlowReport = {
      entityId: params.entityId,
      entityName,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      currency,
      netIncome,
      operating: {
        items: operatingItems,
        total: operatingCashFlow,
      },
      investing: {
        items: investingItems,
        total: investingCashFlow,
      },
      financing: {
        items: financingItems,
        total: financingCashFlow,
      },
      netCashChange,
      openingCash,
      closingCash,
      isReconciled: openingCash + netCashChange === closingCash,
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }

  /**
   * Generate Trial Balance
   * Lists all GL accounts with their debit/credit totals
   * Verifies double-entry bookkeeping (SUM(debits) === SUM(credits))
   *
   * @param params Query parameters (entityId required)
   * @returns Trial balance with balance validation
   */
  async generateTrialBalance(params: {
    entityId: string;
    asOfDate: Date;
  }): Promise<TrialBalanceReport> {
    // Check cache first
    const cacheKey = `report:trial-balance:${params.entityId}:${params.asOfDate.toISOString()}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as TrialBalanceReport;
    }

    // Trial balance is single-entity only
    await this.validateEntityOwnership(params.entityId);

    const entity = await prisma.entity.findUniqueOrThrow({
      where: { id: params.entityId },
    });

    // Query all GL accounts with cumulative balances up to asOfDate
    const results = await tenantScopedQuery<AggregateRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          gl."id" as "glAccountId",
          gl."code",
          gl."name",
          gl."type",
          gl."normalBalance",
          COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
          COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
        FROM "GLAccount" gl
        LEFT JOIN "JournalLine" jl ON jl."glAccountId" = gl.id
        LEFT JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
        INNER JOIN "Entity" e ON e.id = gl."entityId"
        WHERE e."tenantId" = ${tenantId}
          AND gl."entityId" = ${params.entityId}
          AND gl."isActive" = true
          AND (je.id IS NULL OR (
            je."status" = 'POSTED'
            AND je."deletedAt" IS NULL
            AND jl."deletedAt" IS NULL
            AND je."date" <= ${params.asOfDate}
          ))
        GROUP BY gl.id, gl.code, gl.name, gl.type, gl."normalBalance"
        ORDER BY gl.code ASC
      `
    );

    // Convert BigInt and calculate totals
    const accounts: TrialBalanceReport['accounts'] = results.map((row) => ({
      id: row.glAccountId,
      code: row.code,
      name: row.name,
      debit: this.convertBigInt(row.totalDebit),
      credit: this.convertBigInt(row.totalCredit),
    }));

    const totalDebits = accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = accounts.reduce((sum, acc) => sum + acc.credit, 0);
    const isBalanced = totalDebits === totalCredits;

    // Build report
    const report: TrialBalanceReport = {
      entityId: params.entityId,
      entityName: entity.name,
      currency: entity.functionalCurrency,
      asOfDate: params.asOfDate.toISOString(),
      accounts,
      totalDebits,
      totalCredits,
      isBalanced,
      severity: isBalanced ? 'OK' : 'CRITICAL',
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }

  /**
   * Generate General Ledger (Account Activity Detail)
   * Shows all journal lines for a specific GL account with running balance
   *
   * @param params Query parameters with cursor pagination
   * @returns Ledger entries with running balance
   */
  async generateGLLedger(params: {
    entityId: string;
    glAccountId: string;
    startDate: Date;
    endDate: Date;
    cursor?: string;
    limit: number;
  }): Promise<GLLedgerReport> {
    // Check cache first (include cursor for pagination)
    const cacheKey = `report:gl-ledger:${params.entityId}:${params.glAccountId}:${params.startDate.toISOString()}:${params.endDate.toISOString()}:${params.cursor || 'first'}:${params.limit}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as GLLedgerReport;
    }

    // Validate entity ownership
    await this.validateEntityOwnership(params.entityId);

    // Get GL account details
    const glAccount = await prisma.gLAccount.findFirst({
      where: {
        id: params.glAccountId,
        entityId: params.entityId,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!glAccount) {
      throw new AccountingError(
        'GL Account not found',
        'GL_ACCOUNT_NOT_FOUND',
        404
      );
    }

    // Get entity details for currency
    const entity = await prisma.entity.findFirst({
      where: {
        id: params.entityId,
        tenantId: this.tenantId,
      },
      select: {
        name: true,
        functionalCurrency: true,
      },
    });

    if (!entity) {
      throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404);
    }

    // Calculate opening balance (sum of all entries before startDate)
    const openingBalanceResult = await tenantScopedQuery<{ openingBalance: bigint }>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          COALESCE(
            SUM(
              CASE WHEN gl."normalBalance" = 'DEBIT'
                THEN jl."debitAmount" - jl."creditAmount"
                ELSE jl."creditAmount" - jl."debitAmount"
              END
            ),
            0
          ) as "openingBalance"
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

    const openingBalance = Number(openingBalanceResult[0]?.openingBalance ?? 0n);

    // Query journal lines with running balance
    // Uses window function with normalBalance for correct direction
    const results = await tenantScopedQuery<LedgerRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          jl.id,
          je.date,
          je."entryNumber",
          je.memo,
          jl."debitAmount",
          jl."creditAmount",
          gl."normalBalance",
          SUM(
            CASE WHEN gl."normalBalance" = 'DEBIT'
              THEN jl."debitAmount" - jl."creditAmount"
              ELSE jl."creditAmount" - jl."debitAmount"
            END
          ) OVER (ORDER BY je.date, jl.id) as "runningBalance"
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
          AND je.date >= ${params.startDate}
          AND je.date <= ${params.endDate}
          ${params.cursor ? Prisma.sql`AND jl.id > ${params.cursor}` : Prisma.empty}
        ORDER BY jl.id ASC
        LIMIT ${params.limit}
      `
    );

    // Convert results and add opening balance to each running balance
    const entries: GLLedgerEntry[] = results.map((row) => ({
      id: row.id,
      date: row.date,
      entryNumber: row.entryNumber,
      memo: row.memo,
      debitAmount: row.debitAmount,
      creditAmount: row.creditAmount,
      runningBalance: openingBalance + this.convertBigInt(row.runningBalance),
    }));

    const nextCursor = results.length === params.limit ? results[results.length - 1].id : null;

    const report: GLLedgerReport = {
      entityId: params.entityId,
      glAccountId: params.glAccountId,
      accountCode: glAccount.code,
      accountName: glAccount.name,
      entityName: entity.name,
      currency: entity.functionalCurrency,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      entries,
      nextCursor,
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }

  /**
   * Generate Spending by Category Report
   * Groups expenses by GL account (avoids Transaction categoryId JOIN complexity)
   *
   * @param params Query parameters (entityId optional for multi-entity mode)
   * @returns Spending totals by GL account
   */
  async generateSpendingByCategory(params: {
    entityId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<SpendingReport> {
    // Check cache first
    const cacheKey = `report:spending:${params.entityId || 'all'}:${params.startDate.toISOString()}:${params.endDate.toISOString()}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as SpendingReport;
    }

    // 1. Determine entity scope
    let entityIds: string[];
    let entityName: string;
    let currency: string;

    if (params.entityId) {
      await this.validateEntityOwnership(params.entityId);
      entityIds = [params.entityId];
      const entity = await prisma.entity.findUniqueOrThrow({
        where: { id: params.entityId },
      });
      entityName = entity.name;
      currency = entity.functionalCurrency;
    } else {
      // Multi-entity consolidation
      entityIds = await this.getEntityIds();
      currency = await this.validateMultiEntityCurrency(entityIds);
      entityName = 'All Entities';
    }

    // 2. Query expenses grouped by GL account
    const results = await tenantScopedQuery<SpendingRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          gl."id" as "glAccountId",
          gl."code",
          gl."name" as "category",
          COALESCE(SUM(jl."debitAmount") - SUM(jl."creditAmount"), 0) as "totalSpend"
        FROM "JournalLine" jl
        JOIN "JournalEntry" je ON jl."journalEntryId" = je.id
        JOIN "GLAccount" gl ON jl."glAccountId" = gl.id
        INNER JOIN "Entity" e ON e.id = je."entityId"
        WHERE e."tenantId" = ${tenantId}
          AND je."entityId" IN (${Prisma.join(entityIds)})
          AND gl."type" = 'EXPENSE'
          AND je."status" = 'POSTED'
          AND je."deletedAt" IS NULL
          AND jl."deletedAt" IS NULL
          AND je.date >= ${params.startDate}
          AND je.date <= ${params.endDate}
        GROUP BY gl."id", gl."code", gl."name"
        ORDER BY "totalSpend" DESC
      `
    );

    // 3. Calculate totals
    const totalSpend = results.reduce((sum, r) => sum + this.convertBigInt(r.totalSpend), 0);

    // 4. Build report
    const categories = results.map((r) => ({
      category: r.category,
      amount: this.convertBigInt(r.totalSpend),
      percentage: totalSpend > 0 ? (this.convertBigInt(r.totalSpend) / totalSpend) * 100 : 0,
    }));

    const report: SpendingReport = {
      entityId: params.entityId,
      entityName,
      currency,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      categories,
      totalSpend,
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }

  /**
   * Generate Revenue by Client Report
   * Uses sourceDocument JSON to avoid cross-domain JOIN
   *
   * @param params Query parameters (entityId optional for multi-entity mode)
   * @returns Revenue totals by client
   */
  async generateRevenueByClient(params: {
    entityId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<RevenueReport> {
    // Check cache first
    const cacheKey = `report:revenue:${params.entityId || 'all'}:${params.startDate.toISOString()}:${params.endDate.toISOString()}`;
    const cached = reportCache.get(this.tenantId, cacheKey);
    if (cached) {
      return cached as RevenueReport;
    }

    // 1. Determine entity scope
    let entityIds: string[];
    let entityName: string;
    let currency: string;

    if (params.entityId) {
      await this.validateEntityOwnership(params.entityId);
      entityIds = [params.entityId];
      const entity = await prisma.entity.findUniqueOrThrow({
        where: { id: params.entityId },
      });
      entityName = entity.name;
      currency = entity.functionalCurrency;
    } else {
      // Multi-entity consolidation
      entityIds = await this.getEntityIds();
      currency = await this.validateMultiEntityCurrency(entityIds);
      entityName = 'All Entities';
    }

    // 2. Query revenue using sourceDocument JSON snapshots
    const results = await tenantScopedQuery<RevenueRow>(
      this.tenantId,
      (tenantId) => Prisma.sql`
        SELECT
          je."sourceDocument"->>'clientId' as "clientId",
          je."sourceDocument"->>'clientName' as "clientName",
          COUNT(DISTINCT je.id) as "invoiceCount",
          COALESCE(SUM(jl."creditAmount") - SUM(jl."debitAmount"), 0) as "totalRevenue"
        FROM "JournalEntry" je
        JOIN "JournalLine" jl ON jl."journalEntryId" = je.id
        JOIN "GLAccount" gl ON jl."glAccountId" = gl.id
        INNER JOIN "Entity" e ON e.id = je."entityId"
        WHERE e."tenantId" = ${tenantId}
          AND je."entityId" IN (${Prisma.join(entityIds)})
          AND je."sourceType" = 'INVOICE'
          AND gl."type" = 'REVENUE'
          AND je."status" = 'POSTED'
          AND je."deletedAt" IS NULL
          AND jl."deletedAt" IS NULL
          AND je.date >= ${params.startDate}
          AND je.date <= ${params.endDate}
        GROUP BY je."sourceDocument"->>'clientId', je."sourceDocument"->>'clientName'
        ORDER BY "totalRevenue" DESC
      `
    );

    // 3. Calculate totals
    const totalRevenue = results.reduce((sum, r) => sum + this.convertBigInt(r.totalRevenue), 0);

    // 4. Build report
    const clients = results.map((r) => ({
      clientId: r.clientId,
      clientName: r.clientName || 'Unknown',
      invoiceCount: Number(r.invoiceCount),
      amount: this.convertBigInt(r.totalRevenue),
      percentage: totalRevenue > 0 ? (this.convertBigInt(r.totalRevenue) / totalRevenue) * 100 : 0,
    }));

    const report: RevenueReport = {
      entityId: params.entityId,
      entityName,
      currency,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      clients,
      totalRevenue,
    };

    // Cache the result
    reportCache.set(this.tenantId, cacheKey, report);

    return report;
  }
}
