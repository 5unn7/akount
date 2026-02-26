import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FxRateService } from '../fx-rate.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('FxRateService', () => {
  let service: FxRateService;

  beforeEach(() => {
    service = new FxRateService();
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('getRate', () => {
    it('should return 1.0 for same currency', async () => {
      const rate = await service.getRate('CAD', 'CAD', new Date());
      expect(rate).toBe(1.0);
    });

    it('should return 1.0 for USD to USD', async () => {
      const rate = await service.getRate('USD', 'USD', new Date());
      expect(rate).toBe(1.0);
    });

    it('should fetch rate from database when available', async () => {
      const mockRate = { base: 'USD', quote: 'CAD', rate: 1.35, date: new Date() };
      mockPrisma.fXRate.findFirst.mockResolvedValueOnce(mockRate);

      const rate = await service.getRate('USD', 'CAD', new Date());

      expect(rate).toBe(1.35);
      expect(mockPrisma.fXRate.findFirst).toHaveBeenCalledOnce();
    });

    it('should calculate inverse rate when direct rate not found', async () => {
      // First call (direct rate) returns null
      mockPrisma.fXRate.findFirst.mockResolvedValueOnce(null);
      // Second call (inverse rate) returns a rate
      mockPrisma.fXRate.findFirst.mockResolvedValueOnce({
        base: 'CAD',
        quote: 'USD',
        rate: 0.74,
        date: new Date(),
      });

      const rate = await service.getRate('USD', 'CAD', new Date());

      // 1 / 0.74 ≈ 1.35
      expect(rate).toBeCloseTo(1.35, 1);
      expect(mockPrisma.fXRate.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should use fallback rate for common pairs', async () => {
      // No rates in database
      mockPrisma.fXRate.findFirst.mockResolvedValue(null);

      const rate = await service.getRate('USD', 'CAD', new Date());

      // Should use manual fallback rate
      expect(rate).toBe(1.35);
    });

    it('should throw error for unknown currency pair', async () => {
      // No rates in database
      mockPrisma.fXRate.findFirst.mockResolvedValue(null);

      await expect(service.getRate('XYZ', 'ABC', new Date())).rejects.toThrow(
        'FX Rate not found for XYZ/ABC'
      );
    });
  });

  describe('convert', () => {
    it('should return same amount for same currency', async () => {
      const result = await service.convert(1000, 'CAD', 'CAD');
      expect(result).toBe(1000);
    });

    it('should convert cents correctly', async () => {
      const mockRate = { base: 'USD', quote: 'CAD', rate: 1.35, date: new Date() };
      mockPrisma.fXRate.findFirst.mockResolvedValueOnce(mockRate);

      // $10.00 USD = 1000 cents
      const result = await service.convert(1000, 'USD', 'CAD');

      // 1000 * 1.35 = 1350 cents = $13.50 CAD
      expect(result).toBe(1350);
    });

    it('should round result to nearest cent', async () => {
      const mockRate = { base: 'USD', quote: 'CAD', rate: 1.333333, date: new Date() };
      mockPrisma.fXRate.findFirst.mockResolvedValueOnce(mockRate);

      const result = await service.convert(1000, 'USD', 'CAD');

      // 1000 * 1.333333 = 1333.333 → rounds to 1333
      expect(result).toBe(1333);
    });
  });

  describe('getRateBatch', () => {
    it('should return 1.0 for all same-currency pairs', async () => {
      const pairs = [
        { from: 'CAD', to: 'CAD' },
        { from: 'USD', to: 'USD' },
      ];

      const rates = await service.getRateBatch(pairs);

      expect(rates.get('CAD_CAD')).toBe(1.0);
      expect(rates.get('USD_USD')).toBe(1.0);
      expect(mockPrisma.fXRate.findMany).not.toHaveBeenCalled();
    });

    it('should fetch multiple rates in single query', async () => {
      const mockRates = [
        { base: 'USD', quote: 'CAD', rate: 1.35, date: new Date() },
        { base: 'EUR', quote: 'CAD', rate: 1.47, date: new Date() },
      ];
      mockPrisma.fXRate.findMany.mockResolvedValueOnce(mockRates);

      const pairs = [
        { from: 'USD', to: 'CAD' },
        { from: 'EUR', to: 'CAD' },
      ];

      const rates = await service.getRateBatch(pairs);

      expect(rates.get('USD_CAD')).toBe(1.35);
      expect(rates.get('EUR_CAD')).toBe(1.47);
      expect(mockPrisma.fXRate.findMany).toHaveBeenCalledOnce();
    });

    it('should calculate inverse rates from batch results', async () => {
      // Only inverse rate is in database
      const mockRates = [{ base: 'CAD', quote: 'USD', rate: 0.74, date: new Date() }];
      mockPrisma.fXRate.findMany.mockResolvedValueOnce(mockRates);

      const pairs = [{ from: 'USD', to: 'CAD' }];

      const rates = await service.getRateBatch(pairs);

      // 1 / 0.74 ≈ 1.35
      expect(rates.get('USD_CAD')).toBeCloseTo(1.35, 1);
    });
  });
});
