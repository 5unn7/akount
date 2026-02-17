import { prisma } from '@akount/db';
import { AccountingError } from '../errors';

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
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

/**
 * Report line item (for hierarchical reports)
 */
export interface ReportLineItem {
  accountId: string;
  code: string;
  name: string;
  type: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  balance: number; // cents (integer)
  previousBalance?: number; // cents (integer)
  depth: number; // hierarchy level (0 = top-level)
  isSubtotal: boolean;
  children?: ReportLineItem[];
}

/**
 * Profit & Loss Statement
 */
export interface ProfitLossReport {
  entityId?: string;
  entityName: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  comparisonPeriod?: string;
  revenue: {
    items: ReportLineItem[];
    total: number; // cents
  };
  expenses: {
    items: ReportLineItem[];
    total: number; // cents
  };
  netIncome: number; // cents (revenue - expenses)
}

/**
 * Balance Sheet Statement
 */
export interface BalanceSheetReport {
  entityId?: string;
  entityName: string;
  asOfDate: Date;
  currency: string;
  comparisonDate?: Date;
  assets: {
    items: ReportLineItem[];
    total: number; // cents
  };
  liabilities: {
    items: ReportLineItem[];
    total: number; // cents
  };
  equity: {
    items: ReportLineItem[];
    total: number; // cents
  };
  retainedEarnings: {
    priorYears: number; // cents (from GL account 3100)
    currentYear: number; // cents (dynamic INCOME - EXPENSE)
    total: number; // cents
  };
  isBalanced: boolean; // A = L + E
  totalAssets: number; // cents
  totalLiabilitiesAndEquity: number; // cents
}

/**
 * Cash Flow Statement
 */
export interface CashFlowReport {
  entityId?: string;
  entityName: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  netIncome: number; // cents (from P&L)
  operating: {
    items: ReportLineItem[];
    total: number; // cents
  };
  investing: {
    items: ReportLineItem[];
    total: number; // cents
  };
  financing: {
    items: ReportLineItem[];
    total: number; // cents
  };
  netCashChange: number; // cents
  openingCash: number; // cents
  closingCash: number; // cents
}

/**
 * Trial Balance
 */
export interface TrialBalanceReport {
  entityId: string;
  entityName: string;
  asOfDate: Date;
  accounts: Array<{
    accountId: string;
    code: string;
    name: string;
    debit: number; // cents
    credit: number; // cents
  }>;
  totalDebits: number; // cents
  totalCredits: number; // cents
  isBalanced: boolean;
  severity: 'OK' | 'CRITICAL';
}

/**
 * General Ledger Entry
 */
export interface GLLedgerEntry {
  id: string;
  date: Date;
  entryNumber: string;
  memo: string | null;
  debitAmount: number; // cents
  creditAmount: number; // cents
  runningBalance: number; // cents
}

/**
 * General Ledger Report
 */
export interface GLLedgerReport {
  entityId: string;
  glAccountId: string;
  accountCode: string;
  accountName: string;
  startDate: Date;
  endDate: Date;
  entries: GLLedgerEntry[];
  nextCursor: string | null;
}

/**
 * Spending by Category Report
 */
export interface SpendingReport {
  entityId?: string;
  entityName: string;
  startDate: Date;
  endDate: Date;
  categories: Array<{
    category: string;
    amount: number; // cents
    percentage: number;
  }>;
  totalSpend: number; // cents
}

/**
 * Revenue by Client Report
 */
export interface RevenueReport {
  entityId?: string;
  entityName: string;
  startDate: Date;
  endDate: Date;
  clients: Array<{
    clientId: string;
    clientName: string;
    invoiceCount: number;
    amount: number; // cents
    percentage: number;
  }>;
  totalRevenue: number; // cents
}

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

  // ─── Public Report Generation Methods (implemented in subsequent tasks) ──────

  // Implemented in Task 3
  // async generateProfitLoss(params: ProfitLossQuery): Promise<ProfitLossReport>

  // Implemented in Task 4
  // async generateBalanceSheet(params: BalanceSheetQuery): Promise<BalanceSheetReport>

  // Implemented in Task 5
  // async generateCashFlow(params: CashFlowQuery): Promise<CashFlowReport>

  // Implemented in Task 8
  // async generateTrialBalance(params: TrialBalanceQuery): Promise<TrialBalanceReport>

  // Implemented in Task 8
  // async generateGLLedger(params: GLLedgerQuery): Promise<GLLedgerReport>

  // Implemented in Task 9
  // async generateSpendingByCategory(params: SpendingQuery): Promise<SpendingReport>

  // Implemented in Task 9
  // async generateRevenueByClient(params: RevenueQuery): Promise<RevenueReport>
}
