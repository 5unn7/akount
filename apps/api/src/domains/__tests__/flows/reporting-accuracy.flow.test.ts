/**
 * Reporting Accuracy Flow Tests
 *
 * Tests mathematical invariants and cross-report consistency for financial reports.
 *
 * Strategy: Mock the raw SQL layer ($queryRaw) to return known journal entry
 * aggregations, then verify the ReportService produces mathematically correct
 * outputs. Tests the conversion logic, not the SQL itself.
 *
 * Key invariants tested:
 * - Trial Balance: totalDebits === totalCredits
 * - P&L: netIncome = revenue.total - expenses.total
 * - Balance Sheet: totalAssets === totalLiabilitiesAndEquity
 * - All amounts as integer cents
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertIntegerCents } from '../../../test-utils/financial-assertions';

// ─────────────────────────────────────────────────────────────────
// Mock Variables (hoisted)
// ─────────────────────────────────────────────────────────────────

const {
  mockQueryRaw,
  mockEntityFindUnique,
  mockEntityFindUniqueOrThrow,
  mockEntityFindMany,
  mockFiscalCalendarFindFirst,
  mockReportCacheGet,
} = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
  mockEntityFindUnique: vi.fn(),
  mockEntityFindUniqueOrThrow: vi.fn(),
  mockEntityFindMany: vi.fn(),
  mockFiscalCalendarFindFirst: vi.fn(),
  mockReportCacheGet: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    entity: {
      findUnique: (...args: unknown[]) => mockEntityFindUnique(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockEntityFindUniqueOrThrow(...args),
      findMany: (...args: unknown[]) => mockEntityFindMany(...args),
    },
    fiscalCalendar: {
      findFirst: (...args: unknown[]) => mockFiscalCalendarFindFirst(...args),
    },
  },
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
    }),
    join: (arr: unknown[]) => arr.join(','),
    raw: (s: string) => s,
  },
}));

vi.mock('../../../lib/tenant-scoped-query', () => ({
  tenantScopedQuery: async (_tenantId: string, queryBuilder: (id: string) => unknown) => {
    // Build the SQL template to satisfy tenantScopedQuery's security checks
    // Then delegate to the mock
    queryBuilder(_tenantId);
    return mockQueryRaw();
  },
}));

vi.mock('../../accounting/services/report-cache', () => ({
  reportCache: {
    get: (...args: unknown[]) => mockReportCacheGet(...args),
    set: vi.fn(),
  },
  reportCacheService: { invalidate: vi.fn() },
}));

import { ReportService } from '../../accounting/services/report.service';

// ─────────────────────────────────────────────────────────────────
// Shared Constants
// ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-report-123';
const ENTITY_ID = 'entity-report-456';
const USER_ID = 'user-report-111';

const ENTITY_MOCK = {
  id: ENTITY_ID,
  name: 'Report Test Corp',
  tenantId: TENANT_ID,
  functionalCurrency: 'USD',
  fiscalYearStart: 1,
};

// ─────────────────────────────────────────────────────────────────
// Aggregate Row Factories (BigInt as returned by PostgreSQL)
// ─────────────────────────────────────────────────────────────────

function makeRevenueRow(code: string, name: string, creditCents: number) {
  return {
    glAccountId: `gl-${code}`,
    code,
    name,
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    totalDebit: BigInt(0),
    totalCredit: BigInt(creditCents),
  };
}

function makeExpenseRow(code: string, name: string, debitCents: number) {
  return {
    glAccountId: `gl-${code}`,
    code,
    name,
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    totalDebit: BigInt(debitCents),
    totalCredit: BigInt(0),
  };
}

function makeAssetRow(code: string, name: string, debitCents: number) {
  return {
    glAccountId: `gl-${code}`,
    code,
    name,
    type: 'ASSET',
    normalBalance: 'DEBIT',
    totalDebit: BigInt(debitCents),
    totalCredit: BigInt(0),
    currentYearDebit: BigInt(0),
    currentYearCredit: BigInt(0),
  };
}

function makeLiabilityRow(code: string, name: string, creditCents: number) {
  return {
    glAccountId: `gl-${code}`,
    code,
    name,
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    totalDebit: BigInt(0),
    totalCredit: BigInt(creditCents),
    currentYearDebit: BigInt(0),
    currentYearCredit: BigInt(0),
  };
}

function makeEquityRow(code: string, name: string, creditCents: number) {
  return {
    glAccountId: `gl-${code}`,
    code,
    name,
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    totalDebit: BigInt(0),
    totalCredit: BigInt(creditCents),
    currentYearDebit: BigInt(0),
    currentYearCredit: BigInt(0),
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Reporting Accuracy Flow', () => {
  let reportService: ReportService;

  beforeEach(() => {
    vi.resetAllMocks();
    reportService = new ReportService(TENANT_ID, USER_ID);

    // Default entity mocks
    mockEntityFindUnique.mockResolvedValue(ENTITY_MOCK);
    mockEntityFindUniqueOrThrow.mockResolvedValue(ENTITY_MOCK);
    mockEntityFindMany.mockResolvedValue([ENTITY_MOCK]);
    mockFiscalCalendarFindFirst.mockResolvedValue(null); // Fallback to calendar year
    mockReportCacheGet.mockReturnValue(null); // No cache
  });

  // ────────────────────────────────────────────────────────────
  // Trial Balance Invariants
  // ────────────────────────────────────────────────────────────

  describe('Trial Balance', () => {
    it('should have totalDebits === totalCredits (balanced)', async () => {
      // Set up: 3 accounts with balanced debit/credit
      mockQueryRaw.mockResolvedValueOnce([
        {
          glAccountId: 'gl-1000',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000),  // $1,000.00
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl-2000',
          code: '2000',
          name: 'Accounts Payable',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(60000),  // $600.00
        },
        {
          glAccountId: 'gl-3000',
          code: '3000',
          name: 'Equity',
          type: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(40000),  // $400.00
        },
      ]);

      const result = await reportService.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      expect(result.totalDebits).toBe(result.totalCredits);
      expect(result.isBalanced).toBe(true);
      expect(result.severity).toBe('OK');
    });

    it('should detect imbalanced trial balance', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        {
          glAccountId: 'gl-1000',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000),
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl-2000',
          code: '2000',
          name: 'AP',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(50000), // NOT equal to 100000
        },
      ]);

      const result = await reportService.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      expect(result.totalDebits).not.toBe(result.totalCredits);
      expect(result.isBalanced).toBe(false);
      expect(result.severity).toBe('CRITICAL');
    });

    it('should return all amounts as integer cents', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        {
          glAccountId: 'gl-1000',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(123456),
          totalCredit: BigInt(0),
        },
      ]);

      const result = await reportService.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      assertIntegerCents(result.totalDebits);
      assertIntegerCents(result.totalCredits);
      for (const account of result.accounts) {
        assertIntegerCents(account.debit);
        assertIntegerCents(account.credit);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Profit & Loss Invariants
  // ────────────────────────────────────────────────────────────

  describe('Profit & Loss', () => {
    it('should compute netIncome = revenue.total - expenses.total', async () => {
      // Revenue: $5,000 + $3,000 = $8,000
      // Expenses: $2,000 + $1,500 = $3,500
      // Net Income: $4,500
      mockQueryRaw.mockResolvedValueOnce([
        makeRevenueRow('4000', 'Consulting Revenue', 500000),
        makeRevenueRow('4100', 'Product Sales', 300000),
        makeExpenseRow('5000', 'Rent', 200000),
        makeExpenseRow('5100', 'Utilities', 150000),
      ]);

      const result = await reportService.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result.revenue.total).toBe(800000); // $8,000
      expect(result.expenses.total).toBe(350000); // $3,500
      expect(result.netIncome).toBe(800000 - 350000); // $4,500
      assertIntegerCents(result.netIncome);
    });

    it('should handle net loss (expenses > revenue)', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        makeRevenueRow('4000', 'Sales', 100000), // $1,000
        makeExpenseRow('5000', 'Costs', 300000), // $3,000
      ]);

      const result = await reportService.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result.netIncome).toBe(-200000); // -$2,000 (net loss)
      expect(result.netIncome).toBe(result.revenue.total - result.expenses.total);
    });

    it('should return all amounts as integer cents', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        makeRevenueRow('4000', 'Revenue', 543210),
        makeExpenseRow('5000', 'Expense', 123456),
      ]);

      const result = await reportService.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      assertIntegerCents(result.revenue.total);
      assertIntegerCents(result.expenses.total);
      assertIntegerCents(result.netIncome);
      for (const section of result.revenue.sections) {
        assertIntegerCents(section.balance);
      }
    });

    it('should group revenue and expense accounts correctly', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        makeRevenueRow('4000', 'Sales', 500000),
        makeRevenueRow('4100', 'Service Revenue', 200000),
        makeExpenseRow('5000', 'COGS', 100000),
        makeExpenseRow('6000', 'Marketing', 50000),
      ]);

      const result = await reportService.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      // Revenue sections should contain only revenue accounts
      const revenueCodes = result.revenue.sections.map((s) => s.code);
      expect(revenueCodes).toContain('4000');
      expect(revenueCodes).toContain('4100');
      expect(revenueCodes).not.toContain('5000');

      // Expense sections should contain only expense accounts
      const expenseCodes = result.expenses.sections.map((s) => s.code);
      expect(expenseCodes).toContain('5000');
      expect(expenseCodes).toContain('6000');
      expect(expenseCodes).not.toContain('4000');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Balance Sheet Invariants
  // ────────────────────────────────────────────────────────────

  describe('Balance Sheet', () => {
    it('should maintain totalAssets === totalLiabilitiesAndEquity', async () => {
      // Assets: $10,000 cash
      // Liabilities: $4,000 AP
      // Equity: $6,000 capital
      // Retained earnings = 0 (no P&L activity)
      mockQueryRaw.mockResolvedValueOnce([
        makeAssetRow('1000', 'Cash', 1000000),
        makeLiabilityRow('2000', 'AP', 400000),
        makeEquityRow('3000', 'Capital', 600000),
      ]);

      const result = await reportService.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      expect(result.totalAssets).toBe(result.totalLiabilitiesAndEquity);
      expect(result.isBalanced).toBe(true);
    });

    it('should detect unbalanced balance sheet', async () => {
      // Assets don't match liabilities + equity
      mockQueryRaw.mockResolvedValueOnce([
        makeAssetRow('1000', 'Cash', 1000000), // $10,000
        makeLiabilityRow('2000', 'AP', 300000), // $3,000
        makeEquityRow('3000', 'Capital', 500000), // $5,000
        // Missing $2,000 — unbalanced
      ]);

      const result = await reportService.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      expect(result.totalAssets).not.toBe(result.totalLiabilitiesAndEquity);
      expect(result.isBalanced).toBe(false);
    });

    it('should return all amounts as integer cents', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        makeAssetRow('1000', 'Cash', 543210),
        makeLiabilityRow('2000', 'AP', 543210),
      ]);

      const result = await reportService.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      assertIntegerCents(result.totalAssets);
      assertIntegerCents(result.totalLiabilitiesAndEquity);
      for (const item of result.assets.items) {
        assertIntegerCents(item.balance);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Report Metadata
  // ────────────────────────────────────────────────────────────

  describe('Report Metadata', () => {
    it('should include entity name and currency in P&L', async () => {
      mockQueryRaw.mockResolvedValueOnce([
        makeRevenueRow('4000', 'Revenue', 100000),
      ]);

      const result = await reportService.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result.entityName).toBe('Report Test Corp');
      expect(result.currency).toBe('USD');
    });

    it('should include entity name and currency in trial balance', async () => {
      mockQueryRaw.mockResolvedValueOnce([]);

      const result = await reportService.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate: new Date('2024-12-31'),
      });

      expect(result.entityName).toBe('Report Test Corp');
      expect(result.currency).toBe('USD');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Tenant Isolation
  // ────────────────────────────────────────────────────────────

  describe('Tenant Isolation', () => {
    it('should validate entity belongs to tenant before generating report', async () => {
      mockEntityFindUnique.mockResolvedValueOnce(null); // Not found for this tenant

      await expect(
        reportService.generateTrialBalance({
          entityId: 'other-entity',
          asOfDate: new Date('2024-12-31'),
        })
      ).rejects.toThrow('Entity not found');
    });
  });
});
