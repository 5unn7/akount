import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client BEFORE importing service
vi.mock('@akount/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
    account: {
      aggregate: vi.fn(),
    },
  },
}));

import { PerformanceService } from '../performance.service';
import { prisma } from '@akount/db';

// Get typed mock references
const mockFindMany = vi.mocked(prisma.transaction.findMany);
const mockAggregate = vi.mocked(prisma.account.aggregate);

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'entity-xyz-456';

/**
 * Mock transaction factory
 */
function mockTransaction(overrides: {
  amount: number;
  categoryType: 'INCOME' | 'EXPENSE' | null;
  date: Date;
}) {
  return {
    amount: overrides.amount,
    date: overrides.date,
    category: overrides.categoryType ? { type: overrides.categoryType } : null,
  };
}

/**
 * Helper to create a date N days ago
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PerformanceService(TENANT_ID);

    // Default mock for account aggregates (alternates between total and active)
    // First call = total (5), second call = active (4), then repeats
    let callCount = 0;
    mockAggregate.mockImplementation(async () => {
      callCount++;
      if (callCount % 2 === 1) {
        return { _count: { id: 5 } }; // total (odd calls)
      } else {
        return { _count: { id: 4 } }; // active (even calls)
      }
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should calculate revenue from INCOME category transactions', async () => {
      // Current period: 2 INCOME transactions
      const currentTransactions = [
        mockTransaction({ amount: 50000, categoryType: 'INCOME', date: daysAgo(10) }), // $500
        mockTransaction({ amount: 30000, categoryType: 'INCOME', date: daysAgo(5) }), // $300
      ];

      // Previous period: 1 INCOME transaction
      const previousTransactions = [
        mockTransaction({ amount: 40000, categoryType: 'INCOME', date: daysAgo(40) }), // $400
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions) // Current period
        .mockResolvedValueOnce(previousTransactions); // Previous period

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Revenue = $500 + $300 = $800 (80000 cents)
      expect(result.revenue.current).toBe(80000);
      expect(result.revenue.previous).toBe(40000);
      // Percentage change: (80000 - 40000) / 40000 * 100 = +100%
      expect(result.revenue.percentChange).toBe(100);
    });

    it('should calculate expenses from EXPENSE category transactions (absolute value)', async () => {
      // Current period: 2 EXPENSE transactions (negative amounts)
      const currentTransactions = [
        mockTransaction({ amount: -20000, categoryType: 'EXPENSE', date: daysAgo(12) }), // -$200
        mockTransaction({ amount: -15000, categoryType: 'EXPENSE', date: daysAgo(8) }), // -$150
      ];

      // Previous period: 1 EXPENSE transaction
      const previousTransactions = [
        mockTransaction({ amount: -25000, categoryType: 'EXPENSE', date: daysAgo(45) }), // -$250
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce(previousTransactions);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Expenses = |-200 + -150| = $350 (35000 cents, absolute value)
      expect(result.expenses.current).toBe(35000);
      expect(result.expenses.previous).toBe(25000);
      // Percentage change: (35000 - 25000) / 25000 * 100 = +40%
      expect(result.expenses.percentChange).toBe(40);
    });

    it('should calculate profit as revenue minus expenses', async () => {
      const currentTransactions = [
        mockTransaction({ amount: 100000, categoryType: 'INCOME', date: daysAgo(10) }), // +$1000
        mockTransaction({ amount: -30000, categoryType: 'EXPENSE', date: daysAgo(5) }), // -$300
      ];

      const previousTransactions = [
        mockTransaction({ amount: 80000, categoryType: 'INCOME', date: daysAgo(40) }), // +$800
        mockTransaction({ amount: -40000, categoryType: 'EXPENSE', date: daysAgo(35) }), // -$400
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce(previousTransactions);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Current profit = 100000 - 30000 = 70000
      expect(result.profit.current).toBe(70000);
      // Previous profit = 80000 - 40000 = 40000
      expect(result.profit.previous).toBe(40000);
      // Percentage change: (70000 - 40000) / 40000 * 100 = +75%
      expect(result.profit.percentChange).toBe(75);
    });

    it('should generate sparkline with 15 data points', async () => {
      // Create 15 transactions spread across 30 days
      const transactions = Array.from({ length: 15 }, (_, i) =>
        mockTransaction({
          amount: 10000 + i * 1000, // Increasing amounts
          categoryType: 'INCOME',
          date: daysAgo(30 - i * 2), // Every 2 days
        })
      );

      mockFindMany
        .mockResolvedValueOnce(transactions) // Current period
        .mockResolvedValueOnce([]); // Previous period (empty)

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Sparkline should have exactly 15 data points
      expect(result.revenue.sparkline).toHaveLength(15);
      expect(result.expenses.sparkline).toHaveLength(15);
      expect(result.profit.sparkline).toHaveLength(15);
    });

    it('should handle empty state (no transactions)', async () => {
      mockFindMany.mockResolvedValue([]); // No transactions

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // All values should be zero
      expect(result.revenue.current).toBe(0);
      expect(result.revenue.previous).toBe(0);
      expect(result.revenue.percentChange).toBe(0);
      expect(result.expenses.current).toBe(0);
      expect(result.profit.current).toBe(0);

      // Sparklines should be arrays of zeros
      expect(result.revenue.sparkline).toHaveLength(15);
      expect(result.revenue.sparkline.every((v) => v === 0)).toBe(true);
    });

    it('should filter by tenantId (tenant isolation)', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Verify that findMany was called with tenant filter
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              entity: expect.objectContaining({
                tenantId: TENANT_ID,
              }),
            }),
          }),
        })
      );
    });

    it('should filter by entityId when provided', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Verify that findMany was called with entity filter
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              entity: expect.objectContaining({
                id: ENTITY_ID,
              }),
            }),
          }),
        })
      );
    });

    it('should filter by deletedAt IS NULL (soft delete)', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Verify that findMany was called with deletedAt: null
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });

    it('should preserve integer cents (no float corruption)', async () => {
      const currentTransactions = [
        mockTransaction({ amount: 12345, categoryType: 'INCOME', date: daysAgo(10) }), // $123.45
        mockTransaction({ amount: -6789, categoryType: 'EXPENSE', date: daysAgo(5) }), // -$67.89
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce([]);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // All amounts should be integers
      expect(Number.isInteger(result.revenue.current)).toBe(true);
      expect(Number.isInteger(result.expenses.current)).toBe(true);
      expect(Number.isInteger(result.profit.current)).toBe(true);

      // Sparkline values should also be integers
      result.revenue.sparkline.forEach((v) => {
        expect(Number.isInteger(v)).toBe(true);
      });
    });

    it('should handle zero previous value (avoid division by zero)', async () => {
      const currentTransactions = [
        mockTransaction({ amount: 50000, categoryType: 'INCOME', date: daysAgo(10) }),
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions) // Current has revenue
        .mockResolvedValueOnce([]); // Previous is zero

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // When previous = 0 and current > 0, should return 100% (not Infinity)
      expect(result.revenue.percentChange).toBe(100);
      expect(Number.isFinite(result.revenue.percentChange)).toBe(true);
    });

    it('should handle negative percentage change (revenue decline)', async () => {
      const currentTransactions = [
        mockTransaction({ amount: 30000, categoryType: 'INCOME', date: daysAgo(10) }),
      ];

      const previousTransactions = [
        mockTransaction({ amount: 50000, categoryType: 'INCOME', date: daysAgo(40) }),
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce(previousTransactions);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Percentage change: (30000 - 50000) / 50000 * 100 = -40%
      expect(result.revenue.percentChange).toBe(-40);
    });

    it('should classify uncategorized transactions by amount sign', async () => {
      const currentTransactions = [
        mockTransaction({ amount: 50000, categoryType: 'INCOME', date: daysAgo(10) }),
        mockTransaction({ amount: 20000, categoryType: null, date: daysAgo(8) }), // No category, positive = revenue
        mockTransaction({ amount: -10000, categoryType: 'EXPENSE', date: daysAgo(5) }),
        mockTransaction({ amount: -5000, categoryType: null, date: daysAgo(3) }), // No category, negative = expense
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce([]);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Revenue = INCOME (50000) + uncategorized positive (20000) = 70000
      expect(result.revenue.current).toBe(70000);
      // Expenses = EXPENSE (10000) + uncategorized negative (5000) = 15000
      expect(result.expenses.current).toBe(15000);
      // Profit = 70000 - 15000 = 55000
      expect(result.profit.current).toBe(55000);
    });

    it('should calculate account counts correctly', async () => {
      mockFindMany.mockResolvedValue([]);

      // Reset aggregate mock and set custom values for this test
      mockAggregate.mockReset();
      mockAggregate
        .mockResolvedValueOnce({ _count: { id: 8 } }) // total accounts
        .mockResolvedValueOnce({ _count: { id: 6 } }); // active accounts

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      expect(result.accounts.total).toBe(8);
      expect(result.accounts.active).toBe(6);
    });

    it('should return correct currency in response', async () => {
      mockFindMany.mockResolvedValue([]);

      const resultCAD = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');
      expect(resultCAD.currency).toBe('CAD');

      const resultUSD = await service.getPerformanceMetrics(ENTITY_ID, 'USD', '30d');
      expect(resultUSD.currency).toBe('USD');
    });

    it('should handle period boundaries correctly (inclusive ranges)', async () => {
      const now = new Date();
      const exactly30DaysAgo = new Date(now);
      exactly30DaysAgo.setDate(exactly30DaysAgo.getDate() - 30);

      const exactly60DaysAgo = new Date(now);
      exactly60DaysAgo.setDate(exactly60DaysAgo.getDate() - 60);

      const currentTransactions = [
        mockTransaction({ amount: 10000, categoryType: 'INCOME', date: now }), // Today
        mockTransaction({ amount: 10000, categoryType: 'INCOME', date: exactly30DaysAgo }), // Day 30
      ];

      const previousTransactions = [
        mockTransaction({ amount: 10000, categoryType: 'INCOME', date: exactly60DaysAgo }), // Day 60
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce(previousTransactions);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Both boundary transactions should be included
      expect(result.revenue.current).toBe(20000); // Today + Day 30
      expect(result.revenue.previous).toBe(10000); // Day 60
    });

    it('should handle receivables placeholder (Phase 3 not implemented)', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Receivables should return zero values (placeholder)
      expect(result.receivables.outstanding).toBe(0);
      expect(result.receivables.overdue).toBe(0);
      expect(result.receivables.sparkline).toEqual([]);
    });

    it('should calculate profit sparkline from revenue and expenses sparklines', async () => {
      const currentTransactions = [
        mockTransaction({ amount: 100000, categoryType: 'INCOME', date: daysAgo(5) }),
        mockTransaction({ amount: -30000, categoryType: 'EXPENSE', date: daysAgo(5) }),
      ];

      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce([]);

      const result = await service.getPerformanceMetrics(ENTITY_ID, 'CAD', '30d');

      // Each profit sparkline point = revenue point - expenses point
      result.profit.sparkline.forEach((profitPoint, i) => {
        const expectedProfit = result.revenue.sparkline[i] - result.expenses.sparkline[i];
        expect(profitPoint).toBe(expectedProfit);
      });
    });
  });
});
