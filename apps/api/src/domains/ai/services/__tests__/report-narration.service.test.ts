import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportNarrationService } from '../report-narration.service';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils';

// Mock environment variable
process.env.MISTRAL_API_KEY = 'test-api-key';

// Dynamic import inside factory bypasses vi.mock hoisting constraint
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Mock Mistral Provider
const mockChat = vi.fn().mockResolvedValue({
  content: 'Revenue grew 12% MoM, driven by 3 new clients. Operating expenses increased 18% due to equipment purchase.',
  model: 'mistral-large-latest',
  usage: { promptTokens: 150, completionTokens: 50, totalTokens: 200 },
});

vi.mock('../providers/mistral.provider', () => ({
  MistralProvider: class {
    chat = mockChat;
  },
}));

describe('ReportNarrationService (DEV-250)', () => {
  let service: ReportNarrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new ReportNarrationService();
    service.clearCache(); // Clear cache between tests
  });

  describe('generateNarration', () => {
    it('should generate narration for P&L report', async () => {
      const result = await service.generateNarration({
        reportType: 'PROFIT_LOSS',
        reportData: {
          revenue: { total: 50000 },
          expenses: { total: 30000 },
          netIncome: { total: 20000 },
        },
        reportHash: 'hash123',
        entityId: 'entity_123',
        tenantId: 'tenant_123',
        consentStatus: 'granted',
      });

      expect(result).toMatchObject({
        reportType: 'PROFIT_LOSS',
        reportHash: 'hash123',
        narration: expect.stringContaining('Revenue'),
        disclaimer: expect.stringContaining('AI-generated'),
        confidence: expect.any(Number),
        cached: false,
      });

      expect(result.confidence).toBeGreaterThan(50);
      expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it('should cache narration results', async () => {
      const input = {
        reportType: 'BALANCE_SHEET' as const,
        reportData: { assets: 100000, liabilities: 40000, equity: 60000 },
        reportHash: 'hash_cache_test',
        entityId: 'entity_123',
        tenantId: 'tenant_123',
      };

      // First call - not cached
      const first = await service.generateNarration(input);
      expect(first.cached).toBe(false);

      // Second call - should be cached
      const second = await service.generateNarration(input);
      expect(second.cached).toBe(true);
      expect(second.narration).toBe(first.narration);
    });

    it('should clear cache successfully', async () => {
      const input = {
        reportType: 'CASH_FLOW' as const,
        reportData: { operating: 10000, investing: -5000, financing: 0 },
        reportHash: 'hash_clear_test',
        entityId: 'entity_123',
        tenantId: 'tenant_123',
      };

      // Generate and cache
      await service.generateNarration(input);

      // Clear cache
      service.clearCache();

      // Next call should not be cached
      const result = await service.generateNarration(input);
      expect(result.cached).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });
});
