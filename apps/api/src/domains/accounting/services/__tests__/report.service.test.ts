import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prisma } from '@akount/db';
import { ReportService } from '../report.service';
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
      },
      fiscalCalendar: {
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

const mockPrisma = vi.mocked(prisma);
const { tenantScopedQuery } = await import('../../../../lib/tenant-scoped-query');
const mockTenantScopedQuery = vi.mocked(tenantScopedQuery);
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
    type: 'COMPANY',
    functionalCurrency: 'CAD',
    fiscalYearStart: 1, // January
    taxIdNumber: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    countryCode: 'CA',
    region: 'North America',
  };

  const mockEntity2: Entity = {
    id: 'entity_test790',
    tenantId: TENANT_ID,
    name: 'Test Entity 2 Ltd',
    type: 'COMPANY',
    functionalCurrency: 'CAD', // Same currency for multi-entity consolidation
    fiscalYearStart: 1,
    taxIdNumber: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    countryCode: 'CA',
    region: 'North America',
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
    });
  });
});
