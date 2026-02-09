import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../dashboard.service';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    account: {
      findMany: vi.fn(),
    },
  },
}));

// Mock FxRateService - use a function constructor so `new` works
const mockGetRateBatchFn = vi.fn().mockResolvedValue(new Map());
vi.mock('../../../../services/fxRate.service', () => {
  return {
    FxRateService: function () {
      this.getRateBatch = mockGetRateBatchFn;
    },
  };
});

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-abc-123';

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    currentBalance: 100000, // $1000.00
    isActive: true,
    entityId: 'entity-1',
    ...overrides,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRateBatchFn.mockResolvedValue(new Map([['USD_USD', 1.0]]));
    service = new DashboardService(TENANT_ID);
  });

  describe('getMetrics', () => {
    it('should aggregate single-currency accounts correctly', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', type: 'BANK', currentBalance: 500000 }), // $5000
        mockAccount({ id: 'acc-2', type: 'BANK', currentBalance: 300000 }), // $3000
        mockAccount({ id: 'acc-3', type: 'CREDIT_CARD', currentBalance: 150000 }), // $1500
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map([['USD_USD', 1.0]]));

      const metrics = await service.getMetrics(undefined, 'USD');

      // Assets = 500000 + 300000 = 800000
      // Liabilities = 150000
      // Net worth = 800000 - 150000 = 650000
      expect(metrics.netWorth.amount).toBe(650000);
      expect(metrics.netWorth.currency).toBe('USD');
      expect(metrics.cashPosition.cash).toBe(800000);
      expect(metrics.cashPosition.debt).toBe(150000);
      expect(metrics.cashPosition.net).toBe(650000);
    });

    it('should convert multi-currency accounts to target currency', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', type: 'BANK', currency: 'CAD', currentBalance: 100000 }),
        mockAccount({ id: 'acc-2', type: 'BANK', currency: 'EUR', currentBalance: 200000 }),
        mockAccount({ id: 'acc-3', type: 'BANK', currency: 'USD', currentBalance: 50000 }),
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(
        new Map([
          ['CAD_USD', 0.74],
          ['EUR_USD', 1.08],
          ['USD_USD', 1.0],
        ])
      );

      const metrics = await service.getMetrics(undefined, 'USD');

      // CAD: Math.round(100000 * 0.74) = 74000
      // EUR: Math.round(200000 * 1.08) = 216000
      // USD: Math.round(50000 * 1.0) = 50000
      // Total assets = 74000 + 216000 + 50000 = 340000
      expect(metrics.netWorth.amount).toBe(340000);
      expect(metrics.cashPosition.cash).toBe(340000);
    });

    it('should round fractional conversion results correctly', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', type: 'BANK', currency: 'CAD', currentBalance: 33333 }),
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map([['CAD_USD', 0.74]]));

      const metrics = await service.getMetrics(undefined, 'USD');

      // Math.round(33333 * 0.74) = Math.round(24666.42) = 24666
      expect(metrics.netWorth.amount).toBe(24666);
    });

    it('should filter by entityId when provided', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map());

      await service.getMetrics('entity-xyz', 'USD');

      const whereArg = vi.mocked(prisma.account.findMany).mock.calls[0][0]!.where;
      expect(whereArg).toEqual(
        expect.objectContaining({
          entity: expect.objectContaining({
            tenantId: TENANT_ID,
            id: 'entity-xyz',
          }),
        })
      );
    });

    it('should not include entity.id when entityId is not provided', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map());

      await service.getMetrics(undefined, 'USD');

      const whereArg = vi.mocked(prisma.account.findMany).mock.calls[0][0]!.where;
      expect(whereArg!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter by tenantId', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map());

      await service.getMetrics(undefined, 'USD');

      const whereArg = vi.mocked(prisma.account.findMany).mock.calls[0][0]!.where;
      expect(whereArg!.entity).toHaveProperty('tenantId', TENANT_ID);
    });

    it('should not cause N+1 queries - single findMany and single getRateBatch', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', currency: 'CAD', currentBalance: 100000 }),
        mockAccount({ id: 'acc-2', currency: 'USD', currentBalance: 200000 }),
        mockAccount({ id: 'acc-3', currency: 'EUR', currentBalance: 300000 }),
        mockAccount({ id: 'acc-4', currency: 'CAD', currentBalance: 400000 }),
        mockAccount({ id: 'acc-5', currency: 'USD', currentBalance: 500000 }),
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(
        new Map([
          ['CAD_USD', 0.74],
          ['USD_USD', 1.0],
          ['EUR_USD', 1.08],
        ])
      );

      await service.getMetrics(undefined, 'USD');

      // Only 1 database query for accounts
      expect(prisma.account.findMany).toHaveBeenCalledOnce();
      // Only 1 batch FX rate fetch
      expect(mockGetRateBatchFn).toHaveBeenCalledOnce();
    });

    it('should classify INVESTMENT as asset but not cash', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', type: 'INVESTMENT', currentBalance: 500000 }),
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map([['USD_USD', 1.0]]));

      const metrics = await service.getMetrics(undefined, 'USD');

      expect(metrics.netWorth.amount).toBe(500000); // Asset
      expect(metrics.cashPosition.cash).toBe(0); // Not cash
    });

    it('should classify MORTGAGE as liability but not debt', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', type: 'MORTGAGE', currentBalance: 200000 }),
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map([['USD_USD', 1.0]]));

      const metrics = await service.getMetrics(undefined, 'USD');

      expect(metrics.netWorth.amount).toBe(-200000); // Liability
      expect(metrics.cashPosition.debt).toBe(0); // Not counted as debt
    });

    it('should return all zeros when no accounts exist', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map());

      const metrics = await service.getMetrics(undefined, 'USD');

      expect(metrics.netWorth.amount).toBe(0);
      expect(metrics.cashPosition.cash).toBe(0);
      expect(metrics.cashPosition.debt).toBe(0);
      expect(metrics.cashPosition.net).toBe(0);
      expect(metrics.accounts.total).toBe(0);
    });

    it('should count BANK with negative balance as asset (uses Math.abs)', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', type: 'BANK', currentBalance: -50000 }),
      ];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);
      mockGetRateBatchFn.mockResolvedValueOnce(new Map([['USD_USD', 1.0]]));

      const metrics = await service.getMetrics(undefined, 'USD');

      // Math.abs(-50000) * 1.0 = 50000, classified as asset
      expect(metrics.netWorth.amount).toBe(50000);
      // Negative balance BANK should NOT count as cash (balance <= 0)
      expect(metrics.cashPosition.cash).toBe(0);
    });
  });
});
