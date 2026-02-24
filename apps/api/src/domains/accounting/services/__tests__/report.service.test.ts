import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prisma } from '@akount/db';
import { ReportService } from '../report.service';
import { AccountingError } from '../../errors';
import { assertIntegerCents, assertMoneyFields } from '../../../../test-utils/financial-assertions';
import type { Entity, GLAccount } from '@akount/db';

// Mock dependencies
vi.mock('@akount/db', async () => {
  const actual = await vi.importActual<typeof import('@akount/db')>('@akount/db');
  return {
    ...actual,
    prisma: {
      entity: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      fiscalCalendar: {
        findFirst: vi.fn(),
      },
      gLAccount: {
        findFirst: vi.fn(),
      },
      $queryRaw: vi.fn(),
    },
  };
});

vi.mock('../../../../lib/tenant-scoped-query', () => ({
  tenantScopedQuery: vi.fn(),
}));

vi.mock('../report-cache', () => ({
  reportCache: {
    get: vi.fn(() => null), // Always return null (cache miss) in tests
    set: vi.fn(),
    clear: vi.fn(),
    invalidate: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = vi.mocked(prisma) as any;
// @ts-expect-error vitest supports top-level await
const { tenantScopedQuery } = await import('../../../../lib/tenant-scoped-query');
const mockTenantScopedQuery = vi.mocked(tenantScopedQuery);
// @ts-expect-error vitest supports top-level await
const { reportCache } = await import('../report-cache');
const mockReportCache = vi.mocked(reportCache);

describe('ReportService', () => {
  const TENANT_ID = 'tenant_test123';
  const USER_ID = 'user_test456';
  const ENTITY_ID = 'entity_test789';

  let service: ReportService;

  // Mock entities
  const mockEntity: Entity = {
    id: ENTITY_ID,
    tenantId: TENANT_ID,
    name: 'Test Entity Ltd',
    type: 'CORPORATION',
    status: 'ACTIVE',
    country: 'CA',
    taxId: null,
    functionalCurrency: 'CAD',
    reportingCurrency: 'CAD',
    fiscalYearStart: 1, // January
    entitySubType: null,
    registrationDate: null,
    industryCode: null,
    coaTemplateUsed: null,
    setupCompletedAt: null,
    address: null,
    city: null,
    state: null,
    postalCode: null,
    industry: null,
    businessSize: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockEntity2: Entity = {
    id: 'entity_test790',
    tenantId: TENANT_ID,
    name: 'Test Entity 2 Ltd',
    type: 'CORPORATION',
    status: 'ACTIVE',
    country: 'CA',
    taxId: null,
    functionalCurrency: 'CAD', // Same currency for multi-entity consolidation
    reportingCurrency: 'CAD',
    fiscalYearStart: 1,
    entitySubType: null,
    registrationDate: null,
    industryCode: null,
    coaTemplateUsed: null,
    setupCompletedAt: null,
    address: null,
    city: null,
    state: null,
    postalCode: null,
    industry: null,
    businessSize: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new ReportService(TENANT_ID, USER_ID);
    vi.clearAllMocks();
    // Ensure cache always returns null (cache miss)
    mockReportCache.get.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ─── Helper Methods Tests ────────────────────────────────────────────────────

  describe('validateEntityOwnership', () => {
    it('should pass when entity belongs to tenant', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);

      await expect(
        service['validateEntityOwnership'](ENTITY_ID)
      ).resolves.not.toThrow();

      expect(mockPrisma.entity.findUnique).toHaveBeenCalledWith({
        where: { id: ENTITY_ID, tenantId: TENANT_ID },
      });
    });

    it('should throw when entity not found', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(service['validateEntityOwnership'](ENTITY_ID)).rejects.toThrow(
        'Entity not found'
      );
    });

    it('should throw when entity belongs to different tenant', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service['validateEntityOwnership']('other_entity')
      ).rejects.toThrow('Entity not found');
    });
  });

  describe('getEntityIds', () => {
    it('should return all entity IDs for tenant', async () => {
      mockPrisma.entity.findMany.mockResolvedValue([mockEntity, mockEntity2]);

      const result = await service['getEntityIds']();

      expect(result).toEqual([ENTITY_ID, 'entity_test790']);
      expect(mockPrisma.entity.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
        select: { id: true },
      });
    });

    it('should return empty array when tenant has no entities', async () => {
      mockPrisma.entity.findMany.mockResolvedValue([]);

      const result = await service['getEntityIds']();

      expect(result).toEqual([]);
    });
  });

  describe('validateMultiEntityCurrency', () => {
    it('should return common currency when all entities use same currency', async () => {
      mockPrisma.entity.findMany.mockResolvedValue([mockEntity, mockEntity2]);

      const result = await service['validateMultiEntityCurrency']([
        ENTITY_ID,
        'entity_test790',
      ]);

      expect(result).toBe('CAD');
    });

    it('should throw when entities use different currencies', async () => {
      const entityUSD: Entity = { ...mockEntity2, functionalCurrency: 'USD' };
      mockPrisma.entity.findMany.mockResolvedValue([mockEntity, entityUSD]);

      await expect(
        service['validateMultiEntityCurrency']([ENTITY_ID, 'entity_test790'])
      ).rejects.toThrow('Multi-entity consolidation requires all entities to use the same functional currency');
    });
  });

  describe('convertBigInt', () => {
    it('should convert BigInt to Number safely', () => {
      const result = service['convertBigInt'](BigInt(1050));
      expect(result).toBe(1050);
      expect(typeof result).toBe('number');
    });

    it('should throw when BigInt exceeds safe integer range', () => {
      const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
      expect(() => service['convertBigInt'](tooBig)).toThrow('Amount exceeds safe integer range');
    });
  });

  // ─── Profit & Loss Tests ─────────────────────────────────────────────────────

  describe('generateProfitLoss', () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    it('should generate P&L for single entity', async () => {
      // Mock entity validation and retrieval
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Mock SQL query results - revenue and expense accounts
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Sales Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(5000), // $50.00 returns
          totalCredit: BigInt(105000), // $1,050.00 sales
        },
        {
          glAccountId: 'gl_expense_001',
          code: '5000',
          name: 'Cost of Goods Sold',
          type: 'EXPENSE',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(60000), // $600.00
          totalCredit: BigInt(0),
        },
      ]);

      const result = await service.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      // Assertions
      expect(result.entityId).toBe(ENTITY_ID);
      expect(result.entityName).toBe('Test Entity Ltd');
      expect(result.currency).toBe('CAD');
      expect(result.startDate).toBe(startDate.toISOString());
      expect(result.endDate).toBe(endDate.toISOString());

      // Revenue: $1,050.00 - $50.00 = $1,000.00
      expect(result.revenue.total).toBe(100000);
      expect(result.revenue.sections).toHaveLength(1);
      expect(result.revenue.sections[0].balance).toBe(100000);

      // Expense: $600.00
      expect(result.expenses.total).toBe(60000);
      expect(result.expenses.sections).toHaveLength(1);
      expect(result.expenses.sections[0].balance).toBe(60000);

      // Net income: $1,000.00 - $600.00 = $400.00
      expect(result.netIncome).toBe(40000);

      // Financial invariant: all amounts must be integer cents
      assertIntegerCents(result.revenue.total, 'revenue.total');
      assertIntegerCents(result.expenses.total, 'expenses.total');
      assertIntegerCents(result.netIncome, 'netIncome');
      for (const section of result.revenue.sections) {
        assertIntegerCents(section.balance, 'revenue.section.balance');
      }
      for (const section of result.expenses.sections) {
        assertIntegerCents(section.balance, 'expenses.section.balance');
      }
    });

    it('should handle multi-entity consolidation', async () => {
      // Mock entity list
      mockPrisma.entity.findMany.mockResolvedValueOnce([mockEntity, mockEntity2]);

      // Mock currency validation
      mockPrisma.entity.findMany.mockResolvedValueOnce([mockEntity, mockEntity2]);

      // Mock SQL query results
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Sales Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(200000), // $2,000.00 from both entities
        },
      ]);

      const result = await service.generateProfitLoss({
        startDate,
        endDate,
        // No entityId = multi-entity mode
      });

      expect(result.entityName).toBe('All Entities');
      expect(result.revenue.total).toBe(200000);
      assertIntegerCents(result.revenue.total, 'multi-entity revenue.total');
    });

    it('should return zero balances when no transactions exist', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      const result = await service.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      expect(result.revenue.total).toBe(0);
      expect(result.expenses.total).toBe(0);
      expect(result.netIncome).toBe(0);
      assertIntegerCents(result.netIncome, 'empty P&L netIncome');
    });

    it('should calculate negative net income (loss)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Sales Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(50000), // $500.00 revenue
        },
        {
          glAccountId: 'gl_expense_001',
          code: '5000',
          name: 'Operating Expenses',
          type: 'EXPENSE',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000), // $1,000.00 expense
          totalCredit: BigInt(0),
        },
      ]);

      const result = await service.generateProfitLoss({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      // Net loss: $500.00 - $1,000.00 = -$500.00
      expect(result.netIncome).toBe(-50000);
      assertIntegerCents(result.netIncome, 'net loss');
    });

    it('should reject entity from different tenant (tenant isolation)', async () => {
      // Entity not found for this tenant
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service.generateProfitLoss({
          entityId: 'entity_other_tenant',
          startDate,
          endDate,
        })
      ).rejects.toThrow('Entity not found');
    });
  });

  // ─── Balance Sheet Tests ─────────────────────────────────────────────────────

  describe('generateBalanceSheet', () => {
    const asOfDate = new Date('2026-01-31');

    it('should generate balance sheet with accounting equation validation', async () => {
      // Mock entity
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Mock fiscal year lookup (called before the combined query now)
      mockPrisma.fiscalCalendar.findFirst.mockResolvedValue(null);

      // PERF-1: Single combined query returns ALL account types with currentYear CASE columns
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_asset_001',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000), // $1,000.00
          totalCredit: BigInt(0),
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_liability_001',
          code: '2000',
          name: 'Accounts Payable',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(50000), // $500.00
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_equity_002',
          code: '3200',
          name: 'Common Stock',
          type: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(0),
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_equity_001',
          code: '3100',
          name: 'Retained Earnings',
          type: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(40000), // $400.00 prior years
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(100000),
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(100000), // $1,000.00 current year revenue
        },
        {
          glAccountId: 'gl_expense_001',
          code: '5000',
          name: 'Expenses',
          type: 'EXPENSE',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(90000),
          totalCredit: BigInt(0),
          currentYearDebit: BigInt(90000), // $900.00 current year expenses
          currentYearCredit: BigInt(0),
        },
      ]);

      const result = await service.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate,
      });

      // Assertions
      expect(result.assets.total).toBe(100000); // $1,000.00
      expect(result.liabilities.total).toBe(50000); // $500.00
      expect(result.equity.total).toBe(40000); // $400.00

      // Retained earnings: prior $400 + current year net income $100 = $500
      expect(result.retainedEarnings.priorYears).toBe(40000);
      expect(result.retainedEarnings.currentYear).toBe(10000); // $1,000 rev - $900 exp
      expect(result.retainedEarnings.total).toBe(50000);

      // A = L + E + RE: $1,000 = $500 + $400 + $100
      expect(result.totalLiabilitiesAndEquity).toBe(100000);
      expect(result.isBalanced).toBe(true);

      // Financial invariant: all amounts must be integer cents
      assertIntegerCents(result.assets.total, 'assets.total');
      assertIntegerCents(result.liabilities.total, 'liabilities.total');
      assertIntegerCents(result.equity.total, 'equity.total');
      assertIntegerCents(result.retainedEarnings.total, 'retainedEarnings.total');
      assertIntegerCents(result.totalLiabilitiesAndEquity, 'totalLiabilitiesAndEquity');
    });

    it('should mark unbalanced when A ≠ L + E', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);
      mockPrisma.fiscalCalendar.findFirst.mockResolvedValue(null);

      // PERF-1: Single combined query
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_asset_001',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000), // $1,000.00
          totalCredit: BigInt(0),
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_liability_001',
          code: '2000',
          name: 'AP',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(30000), // $300.00 (doesn't balance!)
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
      ]);

      const result = await service.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate,
      });

      // $1,000 assets ≠ $300 liabilities + $0 equity
      expect(result.isBalanced).toBe(false);
    });

    it('should detect 1 cent imbalance with strict enforcement', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);
      mockPrisma.fiscalCalendar.findFirst.mockResolvedValue(null);

      // PERF-1: Single combined query
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_asset_001',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100001), // $1,000.01
          totalCredit: BigInt(0),
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_liability_001',
          code: '2000',
          name: 'AP',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(50000), // $500.00
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_equity_001',
          code: '3000',
          name: 'Equity',
          type: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(50000), // $500.00
          currentYearDebit: BigInt(0),
          currentYearCredit: BigInt(0),
        },
      ]);

      const result = await service.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate,
      });

      // $1,000.01 vs $1,000.00 = 1 cent difference (strict: not balanced)
      expect(result.isBalanced).toBe(false);
    });

    it('should return zero totals when no GL accounts have balances', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);
      mockPrisma.fiscalCalendar.findFirst.mockResolvedValue(null);

      mockTenantScopedQuery.mockResolvedValueOnce([]);

      const result = await service.generateBalanceSheet({
        entityId: ENTITY_ID,
        asOfDate,
      });

      expect(result.assets.total).toBe(0);
      expect(result.liabilities.total).toBe(0);
      expect(result.equity.total).toBe(0);
      expect(result.isBalanced).toBe(true); // 0 = 0 is balanced
      assertIntegerCents(result.assets.total, 'empty BS assets.total');
    });

    it('should reject entity from different tenant (tenant isolation)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service.generateBalanceSheet({
          entityId: 'entity_other_tenant',
          asOfDate,
        })
      ).rejects.toThrow('Entity not found');
    });
  });

  // ─── Cash Flow Tests ─────────────────────────────────────────────────────────

  describe('generateCashFlow', () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    it('should generate cash flow with reconciliation', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Mock P&L (for net income)
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(100000), // $1,000.00
        },
        {
          glAccountId: 'gl_expense_001',
          code: '5000',
          name: 'Expense',
          type: 'EXPENSE',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(60000), // $600.00
          totalCredit: BigInt(0),
        },
      ]);

      // Mock opening cash query (accounts 1000-1099)
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          totalDebit: BigInt(50000), // $500.00
          totalCredit: BigInt(0),
        },
      ]);

      // Mock closing cash query
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          totalDebit: BigInt(90000), // $900.00
          totalCredit: BigInt(0),
        },
      ]);

      // Mock account changes query (operating/investing/financing)
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_ar_001',
          code: '1200',
          name: 'Accounts Receivable',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(20000), // $200.00 increase (operating)
          totalCredit: BigInt(0),
        },
      ]);

      const result = await service.generateCashFlow({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      // Net income: $1,000 - $600 = $400
      expect(result.netIncome).toBe(40000);

      // Opening cash: $500.00
      expect(result.openingCash).toBe(50000);

      // Closing cash: $900.00
      expect(result.closingCash).toBe(90000);

      // Operating cash flow calculation (Indirect Method):
      // Net income: $400
      // Less: AR increase of $200 (cash not received yet)
      // = Operating cash flow: $200
      // Net cash change: $900 - $500 = $400
      // This means investing/financing contributed $200
      expect(result.operating.items).toHaveLength(1);
      expect(result.operating.items[0].balance).toBe(-20000); // AR increase subtracts from cash
      expect(result.operating.total).toBe(20000); // $400 net income - $200 AR increase

      // Financial invariant: all amounts must be integer cents
      assertIntegerCents(result.netIncome, 'CF netIncome');
      assertIntegerCents(result.openingCash, 'CF openingCash');
      assertIntegerCents(result.closingCash, 'CF closingCash');
      assertIntegerCents(result.operating.total, 'CF operating.total');
    });

    it('should calculate zero net cash change when opening equals closing', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Mock P&L
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      // Mock cash queries (same balance)
      mockTenantScopedQuery.mockResolvedValueOnce([
        { totalDebit: BigInt(100000), totalCredit: BigInt(0) },
      ]);
      mockTenantScopedQuery.mockResolvedValueOnce([
        { totalDebit: BigInt(100000), totalCredit: BigInt(0) },
      ]);

      // Mock account changes
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      const result = await service.generateCashFlow({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      expect(result.openingCash).toBe(100000);
      expect(result.closingCash).toBe(100000);
      expect(result.netIncome).toBe(0);
      assertIntegerCents(result.openingCash, 'zero-change openingCash');
      assertIntegerCents(result.closingCash, 'zero-change closingCash');
    });

    it('should apply correct sign convention per indirect method (P1-6 fix)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Mock P&L (net income = $0 for simplicity)
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      // Mock cash queries
      mockTenantScopedQuery.mockResolvedValueOnce([
        { totalDebit: BigInt(100000), totalCredit: BigInt(0) },
      ]);
      mockTenantScopedQuery.mockResolvedValueOnce([
        { totalDebit: BigInt(100000), totalCredit: BigInt(0) },
      ]);

      // Mock account changes with both asset and liability movements
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_ar_001',
          code: '1200',
          name: 'Accounts Receivable',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(30000), // +$300 AR increase
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_ap_001',
          code: '2100',
          name: 'Accounts Payable',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(20000), // +$200 AP increase
        },
        {
          glAccountId: 'gl_equity_001',
          code: '3000',
          name: 'Equity',
          type: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(10000), // +$100 equity increase
        },
      ]);

      const result = await service.generateCashFlow({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      // Verify sign conventions per indirect method:
      // - Asset increase (+$300 AR) should SUBTRACT from cash → balance = -$300
      // - Liability increase (+$200 AP) should ADD to cash → balance = +$200
      // - Equity increase (+$100) should ADD to cash → balance = +$100
      expect(result.operating.items).toHaveLength(2); // AR and AP (both operating)

      const arItem = result.operating.items.find((i) => i.code === '1200');
      const apItem = result.operating.items.find((i) => i.code === '2100');

      expect(arItem?.balance).toBe(-30000); // Asset increase = subtract
      expect(apItem?.balance).toBe(20000);  // Liability increase = add

      expect(result.financing.items).toHaveLength(1); // Equity
      const equityItem = result.financing.items[0];
      expect(equityItem.balance).toBe(10000); // Equity increase = add

      // Financial invariant: sign-convention amounts must be integer cents
      assertIntegerCents(arItem!.balance, 'AR balance');
      assertIntegerCents(apItem!.balance, 'AP balance');
      assertIntegerCents(equityItem.balance, 'equity balance');
    });

    it('should verify cash flow equation: operating + investing + financing = net change', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Mock P&L (net income = $500)
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(50000),
        },
      ]);

      // Mock cash: opening $200, closing $700 → net change $500
      // Net change matches net income when no working capital changes
      mockTenantScopedQuery.mockResolvedValueOnce([
        { totalDebit: BigInt(20000), totalCredit: BigInt(0) },
      ]);
      mockTenantScopedQuery.mockResolvedValueOnce([
        { totalDebit: BigInt(70000), totalCredit: BigInt(0) },
      ]);

      // No working capital changes
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      const result = await service.generateCashFlow({
        entityId: ENTITY_ID,
        startDate,
        endDate,
      });

      // Verify the cash flow equation:
      // operating + investing + financing = net cash change
      // operating.total = netIncome ($500) + adjustments ($0) = $500
      // investing.total = $0, financing.total = $0
      // net cash change = closing ($700) - opening ($200) = $500
      const netCashChange = result.closingCash - result.openingCash;
      const totalActivities = result.operating.total + result.investing.total + result.financing.total;
      expect(totalActivities).toBe(netCashChange);
      assertIntegerCents(netCashChange, 'net cash change');
    });

    it('should reject entity from different tenant (tenant isolation)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service.generateCashFlow({
          entityId: 'entity_other_tenant',
          startDate,
          endDate,
        })
      ).rejects.toThrow('Entity not found');
    });
  });

  // ─── Trial Balance Tests ───────────────────────────────────────────────────────

  describe('generateTrialBalance', () => {
    const asOfDate = new Date('2026-01-31');

    it('should generate balanced trial balance', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_asset_001',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000), // $1,000.00
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_liability_001',
          code: '2000',
          name: 'Accounts Payable',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(60000), // $600.00
        },
        {
          glAccountId: 'gl_equity_001',
          code: '3000',
          name: 'Owners Equity',
          type: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(40000), // $400.00
        },
      ]);

      const result = await service.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate,
      });

      // Structure assertions
      expect(result.entityId).toBe(ENTITY_ID);
      expect(result.entityName).toBe('Test Entity Ltd');
      expect(result.currency).toBe('CAD');
      expect(result.asOfDate).toBe(asOfDate.toISOString());
      expect(result.accounts).toHaveLength(3);

      // Balance verification: SUM(debits) === SUM(credits) → balanced
      expect(result.totalDebits).toBe(100000);
      expect(result.totalCredits).toBe(100000);
      expect(result.isBalanced).toBe(true);
      expect(result.severity).toBe('OK');

      // Financial invariant: all amounts must be integer cents
      assertIntegerCents(result.totalDebits, 'TB totalDebits');
      assertIntegerCents(result.totalCredits, 'TB totalCredits');
      for (const account of result.accounts) {
        assertIntegerCents(account.debit, `TB account ${account.code} debit`);
        assertIntegerCents(account.credit, `TB account ${account.code} credit`);
      }
    });

    it('should detect unbalanced trial balance with CRITICAL severity', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      // Unbalanced: debits $1,000 vs credits $800
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_asset_001',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(100000),
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_liability_001',
          code: '2000',
          name: 'AP',
          type: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(80000), // Only $800
        },
      ]);

      const result = await service.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate,
      });

      expect(result.totalDebits).toBe(100000);
      expect(result.totalCredits).toBe(80000);
      expect(result.isBalanced).toBe(false);
      expect(result.severity).toBe('CRITICAL');
      assertIntegerCents(result.totalDebits, 'unbalanced TB totalDebits');
      assertIntegerCents(result.totalCredits, 'unbalanced TB totalCredits');
    });

    it('should handle empty GL accounts (no journal entries)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      mockTenantScopedQuery.mockResolvedValueOnce([]);

      const result = await service.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate,
      });

      expect(result.accounts).toHaveLength(0);
      expect(result.totalDebits).toBe(0);
      expect(result.totalCredits).toBe(0);
      expect(result.isBalanced).toBe(true);
      expect(result.severity).toBe('OK');
    });

    it('should handle debit-only accounts correctly', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);

      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          glAccountId: 'gl_asset_001',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(50000),
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_asset_002',
          code: '1200',
          name: 'Accounts Receivable',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: BigInt(30000),
          totalCredit: BigInt(0),
        },
        {
          glAccountId: 'gl_revenue_001',
          code: '4000',
          name: 'Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
          totalDebit: BigInt(0),
          totalCredit: BigInt(80000),
        },
      ]);

      const result = await service.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate,
      });

      // Two debit accounts ($500 + $300 = $800) vs one credit ($800)
      expect(result.totalDebits).toBe(80000);
      expect(result.totalCredits).toBe(80000);
      expect(result.isBalanced).toBe(true);
      expect(result.accounts).toHaveLength(3);
    });

    it('should reject entity from different tenant (tenant isolation)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service.generateTrialBalance({
          entityId: 'entity_other_tenant',
          asOfDate,
        })
      ).rejects.toThrow('Entity not found');
    });

    it('should cache the trial balance result', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.entity.findUniqueOrThrow.mockResolvedValue(mockEntity);
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      await service.generateTrialBalance({
        entityId: ENTITY_ID,
        asOfDate,
      });

      expect(mockReportCache.set).toHaveBeenCalledWith(
        TENANT_ID,
        expect.stringContaining('report:trial-balance:'),
        expect.objectContaining({ entityId: ENTITY_ID })
      );
    });
  });

  // ─── General Ledger Tests ──────────────────────────────────────────────────────

  describe('generateGLLedger', () => {
    const GL_ACCOUNT_ID = 'gl_cash_001';
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    const mockGLAccount = {
      id: GL_ACCOUNT_ID,
      entityId: ENTITY_ID,
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      isActive: true,
    };

    it('should generate GL ledger with running balance including opening balance', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(mockGLAccount);
      mockPrisma.entity.findFirst.mockResolvedValue({
        name: 'Test Entity Ltd',
        functionalCurrency: 'CAD',
      });

      // Opening balance query: $500 opening
      mockTenantScopedQuery.mockResolvedValueOnce([
        { openingBalance: BigInt(50000) },
      ]);

      // Ledger entries query
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          id: 'jl_001',
          date: new Date('2026-01-05'),
          entryNumber: 'JE-001',
          memo: 'Client payment received',
          debitAmount: 20000, // $200 debit
          creditAmount: 0,
          normalBalance: 'DEBIT',
          runningBalance: BigInt(20000), // Window function result (pre-opening)
        },
        {
          id: 'jl_002',
          date: new Date('2026-01-15'),
          entryNumber: 'JE-002',
          memo: 'Rent payment',
          debitAmount: 0,
          creditAmount: 10000, // $100 credit
          normalBalance: 'DEBIT',
          runningBalance: BigInt(10000), // Window function: $200 - $100 = $100 net (pre-opening)
        },
      ]);

      const result = await service.generateGLLedger({
        entityId: ENTITY_ID,
        glAccountId: GL_ACCOUNT_ID,
        startDate,
        endDate,
        limit: 50,
      });

      // Structure assertions
      expect(result.entityId).toBe(ENTITY_ID);
      expect(result.glAccountId).toBe(GL_ACCOUNT_ID);
      expect(result.accountCode).toBe('1000');
      expect(result.accountName).toBe('Cash');
      expect(result.entityName).toBe('Test Entity Ltd');
      expect(result.currency).toBe('CAD');
      expect(result.entries).toHaveLength(2);

      // Running balance includes opening balance ($500)
      // Entry 1: $500 (opening) + $200 (window) = $700
      expect(result.entries[0].runningBalance).toBe(70000);
      // Entry 2: $500 (opening) + $100 (window) = $600
      expect(result.entries[1].runningBalance).toBe(60000);

      // No more results → null cursor
      expect(result.nextCursor).toBeNull();

      // Financial invariant: all amounts must be integer cents
      for (const entry of result.entries) {
        assertIntegerCents(entry.debitAmount, 'GL entry debitAmount');
        assertIntegerCents(entry.creditAmount, 'GL entry creditAmount');
        assertIntegerCents(entry.runningBalance, 'GL entry runningBalance');
      }
    });

    it('should return empty entries when no journal lines in date range', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(mockGLAccount);
      mockPrisma.entity.findFirst.mockResolvedValue({
        name: 'Test Entity Ltd',
        functionalCurrency: 'CAD',
      });

      // Opening balance: $1,000
      mockTenantScopedQuery.mockResolvedValueOnce([
        { openingBalance: BigInt(100000) },
      ]);

      // No entries in range
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      const result = await service.generateGLLedger({
        entityId: ENTITY_ID,
        glAccountId: GL_ACCOUNT_ID,
        startDate,
        endDate,
        limit: 50,
      });

      expect(result.entries).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it('should return nextCursor when results equal limit (pagination)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(mockGLAccount);
      mockPrisma.entity.findFirst.mockResolvedValue({
        name: 'Test Entity Ltd',
        functionalCurrency: 'CAD',
      });

      // Opening balance: $0
      mockTenantScopedQuery.mockResolvedValueOnce([
        { openingBalance: BigInt(0) },
      ]);

      // Exactly 2 entries with limit=2 → should return cursor
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          id: 'jl_001',
          date: new Date('2026-01-05'),
          entryNumber: 'JE-001',
          memo: 'Entry 1',
          debitAmount: 10000,
          creditAmount: 0,
          normalBalance: 'DEBIT',
          runningBalance: BigInt(10000),
        },
        {
          id: 'jl_002',
          date: new Date('2026-01-10'),
          entryNumber: 'JE-002',
          memo: 'Entry 2',
          debitAmount: 20000,
          creditAmount: 0,
          normalBalance: 'DEBIT',
          runningBalance: BigInt(30000),
        },
      ]);

      const result = await service.generateGLLedger({
        entityId: ENTITY_ID,
        glAccountId: GL_ACCOUNT_ID,
        startDate,
        endDate,
        limit: 2, // Match the count of returned entries
      });

      // nextCursor = last entry's id when results.length === limit
      expect(result.nextCursor).toBe('jl_002');
      expect(result.entries).toHaveLength(2);
    });

    it('should return null nextCursor when results fewer than limit', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(mockGLAccount);
      mockPrisma.entity.findFirst.mockResolvedValue({
        name: 'Test Entity Ltd',
        functionalCurrency: 'CAD',
      });

      mockTenantScopedQuery.mockResolvedValueOnce([
        { openingBalance: BigInt(0) },
      ]);

      // Only 1 entry with limit=50
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          id: 'jl_001',
          date: new Date('2026-01-05'),
          entryNumber: 'JE-001',
          memo: 'Solo entry',
          debitAmount: 5000,
          creditAmount: 0,
          normalBalance: 'DEBIT',
          runningBalance: BigInt(5000),
        },
      ]);

      const result = await service.generateGLLedger({
        entityId: ENTITY_ID,
        glAccountId: GL_ACCOUNT_ID,
        startDate,
        endDate,
        limit: 50,
      });

      expect(result.nextCursor).toBeNull();
      expect(result.entries).toHaveLength(1);
    });

    it('should throw GL_ACCOUNT_NOT_FOUND for non-existent GL account', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.generateGLLedger({
          entityId: ENTITY_ID,
          glAccountId: 'nonexistent_gl',
          startDate,
          endDate,
          limit: 50,
        })
      ).rejects.toThrow(AccountingError);

      try {
        await service.generateGLLedger({
          entityId: ENTITY_ID,
          glAccountId: 'nonexistent_gl',
          startDate,
          endDate,
          limit: 50,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AccountingError);
        expect((error as AccountingError).code).toBe('GL_ACCOUNT_NOT_FOUND');
        expect((error as AccountingError).statusCode).toBe(404);
      }
    });

    it('should reject entity from different tenant (tenant isolation)', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service.generateGLLedger({
          entityId: 'entity_other_tenant',
          glAccountId: GL_ACCOUNT_ID,
          startDate,
          endDate,
          limit: 50,
        })
      ).rejects.toThrow('Entity not found');
    });

    it('should cache the GL ledger result', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(mockGLAccount);
      mockPrisma.entity.findFirst.mockResolvedValue({
        name: 'Test Entity Ltd',
        functionalCurrency: 'CAD',
      });

      mockTenantScopedQuery.mockResolvedValueOnce([
        { openingBalance: BigInt(0) },
      ]);
      mockTenantScopedQuery.mockResolvedValueOnce([]);

      await service.generateGLLedger({
        entityId: ENTITY_ID,
        glAccountId: GL_ACCOUNT_ID,
        startDate,
        endDate,
        limit: 50,
      });

      expect(mockReportCache.set).toHaveBeenCalledWith(
        TENANT_ID,
        expect.stringContaining('report:gl-ledger:'),
        expect.objectContaining({
          entityId: ENTITY_ID,
          glAccountId: GL_ACCOUNT_ID,
        })
      );
    });

    it('should handle zero opening balance correctly', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockPrisma.gLAccount.findFirst.mockResolvedValue(mockGLAccount);
      mockPrisma.entity.findFirst.mockResolvedValue({
        name: 'Test Entity Ltd',
        functionalCurrency: 'CAD',
      });

      // Opening balance: $0 (no prior entries)
      mockTenantScopedQuery.mockResolvedValueOnce([
        { openingBalance: BigInt(0) },
      ]);

      // One entry
      mockTenantScopedQuery.mockResolvedValueOnce([
        {
          id: 'jl_001',
          date: new Date('2026-01-05'),
          entryNumber: 'JE-001',
          memo: 'First ever entry',
          debitAmount: 75000, // $750
          creditAmount: 0,
          normalBalance: 'DEBIT',
          runningBalance: BigInt(75000),
        },
      ]);

      const result = await service.generateGLLedger({
        entityId: ENTITY_ID,
        glAccountId: GL_ACCOUNT_ID,
        startDate,
        endDate,
        limit: 50,
      });

      // With $0 opening balance, running balance should equal window function result
      expect(result.entries[0].runningBalance).toBe(75000); // 0 + 75000
      assertIntegerCents(result.entries[0].runningBalance, 'zero-opening runningBalance');
    });
  });
});
