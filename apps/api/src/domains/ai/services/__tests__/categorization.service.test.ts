import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  categorizeTransaction,
  categorizeTransactions,
  learnFromCorrection,
} from '../categorization.service';

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AI service
const mockChat = vi.fn();
const mockIsProviderAvailable = vi.fn();

vi.mock('../ai.service', () => ({
  aiService: {
    chat: (...args: unknown[]) => mockChat(...args),
    isProviderAvailable: (name: string) => mockIsProviderAvailable(name),
  },
}));

// Mock Prisma
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    category: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

const TENANT_ID = 'tenant-abc-123';

function mockCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    tenantId: TENANT_ID,
    name: 'Meals & Entertainment',
    type: 'EXPENSE',
    ...overrides,
  };
}

describe('CategorizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsProviderAvailable.mockReturnValue(false); // Default: no AI
  });

  describe('categorizeTransaction', () => {
    describe('keyword matching', () => {
      it('should categorize "Starbucks" as Meals & Entertainment', async () => {
        const category = mockCategory({ name: 'Meals & Entertainment' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Starbucks Coffee', 500, TENANT_ID);

        expect(result.categoryId).toBe('cat-1');
        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(85);
        // Could match either "starbucks" or "coffee" - both are valid
        expect(result.matchReason).toMatch(/Keyword match: "(starbucks|coffee)"/);
      });

      it('should categorize "Uber" as Transportation', async () => {
        const category = mockCategory({ id: 'cat-2', name: 'Transportation' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Uber Trip', 1500, TENANT_ID);

        expect(result.categoryName).toBe('Transportation');
        expect(result.confidence).toBe(85);
      });

      it('should categorize "AWS" as Software & Subscriptions', async () => {
        const category = mockCategory({ id: 'cat-3', name: 'Software & Subscriptions' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('AWS - Cloud Services', 5000, TENANT_ID);

        expect(result.categoryName).toBe('Software & Subscriptions');
      });

      it('should categorize "Shell Gas" as Transportation', async () => {
        const category = mockCategory({ id: 'cat-2', name: 'Transportation' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Shell Gas Station', 4500, TENANT_ID);

        expect(result.categoryName).toBe('Transportation');
      });

      it('should categorize "Stripe Payment" as Sales Revenue (income)', async () => {
        const category = mockCategory({ id: 'cat-4', name: 'Sales Revenue', type: 'INCOME' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Stripe Payment Received', 10000, TENANT_ID);

        expect(result.categoryName).toBe('Sales Revenue');
      });

      it('should handle case-insensitive matching', async () => {
        const category = mockCategory({ name: 'Meals & Entertainment' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('STARBUCKS COFFEE', 500, TENANT_ID);

        expect(result.categoryName).toBe('Meals & Entertainment');
      });

      it('should match keywords within description', async () => {
        const category = mockCategory({ name: 'Office Supplies' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Purchase from Staples Inc', 2500, TENANT_ID);

        expect(result.categoryName).toBe('Office Supplies');
      });

      it('should return null categoryId when category not found in tenant', async () => {
        mockFindFirst.mockResolvedValueOnce(null); // Category doesn't exist

        const result = await categorizeTransaction('Starbucks', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(85);
        expect(result.matchReason).toContain('category not found');
      });

      it('should return no match when no keywords match', async () => {
        const result = await categorizeTransaction('Unknown Merchant XYZ', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.categoryName).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.matchReason).toBe('No match found');
      });

      it('should choose best match when multiple keywords match', async () => {
        // Description contains both "restaurant" and "cafe"
        const category = mockCategory({ name: 'Meals & Entertainment' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction(
          'Restaurant Cafe Downtown',
          500,
          TENANT_ID
        );

        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(85);
      });
    });

    describe('AI categorization fallback', () => {
      it('should use AI when Perplexity is available and no keyword match', async () => {
        mockIsProviderAvailable.mockReturnValue(true);
        mockChat.mockResolvedValueOnce({
          content: 'Meals & Entertainment',
        });
        const category = mockCategory({ name: 'Meals & Entertainment' });
        mockFindFirst.mockResolvedValueOnce(category);

        // Use a description that truly doesn't match any keywords
        const result = await categorizeTransaction(
          'Acme Corp Store XYZ',
          500,
          TENANT_ID
        );

        expect(mockChat).toHaveBeenCalled();
        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(75);
        expect(result.matchReason).toContain('AI suggested');
      });

      it('should return categoryId when AI-suggested category exists', async () => {
        mockIsProviderAvailable.mockReturnValue(true);
        mockChat.mockResolvedValueOnce({ content: 'Office Supplies' });
        const category = mockCategory({ id: 'cat-5', name: 'Office Supplies' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Acme Corp XYZ', 500, TENANT_ID);

        expect(result.categoryId).toBe('cat-5');
        expect(result.categoryName).toBe('Office Supplies');
      });

      it('should return null categoryId when AI-suggested category not found', async () => {
        vi.clearAllMocks(); // Clear previous mocks
        mockIsProviderAvailable.mockReturnValue(true);
        mockChat.mockResolvedValueOnce({ content: 'Rare Category' });
        mockFindFirst.mockResolvedValueOnce(null);

        const result = await categorizeTransaction('Acme Corp XYZ', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.categoryName).toBe('Rare Category');
        expect(result.confidence).toBe(60);
      });

      it('should skip AI when provider not available', async () => {
        vi.clearAllMocks();
        mockIsProviderAvailable.mockReturnValue(false);

        const result = await categorizeTransaction('Acme Corp XYZ', 500, TENANT_ID);

        expect(mockChat).not.toHaveBeenCalled();
        expect(result.categoryId).toBeNull();
        expect(result.matchReason).toBe('No match found');
      });

      it('should handle AI errors gracefully', async () => {
        vi.clearAllMocks();
        mockIsProviderAvailable.mockReturnValue(true);
        mockChat.mockRejectedValueOnce(new Error('API Error'));

        const result = await categorizeTransaction('Acme Corp XYZ', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.matchReason).toBe('No match found');
      });

      it('should return null categoryName when AI suggests "Other"', async () => {
        mockIsProviderAvailable.mockReturnValue(true);
        mockChat.mockResolvedValueOnce({ content: 'Other' });

        const result = await categorizeTransaction('Unknown Store', 500, TENANT_ID);

        expect(result.categoryName).toBeNull();
      });
    });

    describe('tenant isolation', () => {
      it('should query categories for correct tenant', async () => {
        const category = mockCategory({ name: 'Meals & Entertainment' });
        mockFindFirst.mockResolvedValueOnce(category);

        await categorizeTransaction('Starbucks', 500, TENANT_ID);

        expect(mockFindFirst).toHaveBeenCalledWith({
          where: {
            tenantId: TENANT_ID,
            deletedAt: null,
            name: {
              contains: 'Meals & Entertainment',
              mode: 'insensitive',
            },
          },
        });
      });
    });
  });

  describe('categorizeTransactions (batch)', () => {
    it('should categorize multiple transactions efficiently', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Meals & Entertainment' }),
        mockCategory({ id: 'cat-2', name: 'Transportation' }),
        mockCategory({ id: 'cat-3', name: 'Software & Subscriptions' }),
      ];
      mockFindMany.mockResolvedValueOnce(categories);

      const transactions = [
        { description: 'Starbucks Coffee', amount: 500 },
        { description: 'Uber Trip', amount: 1500 },
        { description: 'AWS Services', amount: 5000 },
        { description: 'Unknown Merchant', amount: 1000 },
      ];

      const results = await categorizeTransactions(transactions, TENANT_ID);

      expect(results).toHaveLength(4);
      expect(results[0].categoryName).toBe('Meals & Entertainment');
      expect(results[1].categoryName).toBe('Transportation');
      expect(results[2].categoryName).toBe('Software & Subscriptions');
      expect(results[3].categoryName).toBeNull(); // No match
    });

    it('should fetch categories only once (avoid N+1)', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const transactions = Array(50).fill({ description: 'Test', amount: 100 });

      await categorizeTransactions(transactions, TENANT_ID);

      // Should only call findMany once, not 50 times
      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });

    it('should handle case-insensitive category matching', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Meals & Entertainment' }),
      ];
      mockFindMany.mockResolvedValueOnce(categories);

      const transactions = [
        { description: 'Starbucks', amount: 500 },
      ];

      const results = await categorizeTransactions(transactions, TENANT_ID);

      expect(results[0].categoryId).toBe('cat-1');
    });

    it('should handle partial category name matches', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Meals' }), // Shorter name
      ];
      mockFindMany.mockResolvedValueOnce(categories);

      const transactions = [
        { description: 'Starbucks', amount: 500 }, // Keywords suggest "Meals & Entertainment"
      ];

      const results = await categorizeTransactions(transactions, TENANT_ID);

      // Should match "Meals" even though keyword suggests "Meals & Entertainment"
      expect(results[0].categoryId).toBe('cat-1');
      expect(results[0].categoryName).toBe('Meals');
    });

    it('should return suggestions for all transactions even with no matches', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const transactions = [
        { description: 'Unknown A', amount: 100 },
        { description: 'Unknown B', amount: 200 },
      ];

      const results = await categorizeTransactions(transactions, TENANT_ID);

      expect(results).toHaveLength(2);
      expect(results[0].categoryId).toBeNull();
      expect(results[1].categoryId).toBeNull();
    });

    it('should handle large batch (100+ transactions)', async () => {
      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-1', name: 'Meals & Entertainment' }),
      ]);

      const transactions = Array(150)
        .fill(null)
        .map((_, i) => ({
          description: i % 2 === 0 ? 'Starbucks' : 'Unknown',
          amount: 500,
        }));

      const results = await categorizeTransactions(transactions, TENANT_ID);

      expect(results).toHaveLength(150);
      // Verify some matched, some didn't
      const matched = results.filter((r) => r.categoryId !== null);
      expect(matched.length).toBeGreaterThan(0);
    });
  });

  describe('learnFromCorrection', () => {
    it('should log correction (placeholder)', async () => {
      await learnFromCorrection('Test Description', 'cat-1', TENANT_ID);

      // Currently just logs - verify no errors thrown
      expect(true).toBe(true);
    });

    it('should not throw errors for invalid inputs', async () => {
      await expect(
        learnFromCorrection('', 'invalid-id', 'invalid-tenant')
      ).resolves.not.toThrow();
    });
  });

  describe('Bulk Operation Stress Tests', () => {
    it('should handle batch categorization of 100+ transactions efficiently', async () => {
      // Generate 150 transactions (realistic bulk import scenario)
      const transactions = Array.from({ length: 150 }, (_, i) => ({
        id: `txn-${i}`,
        description: i % 3 === 0 ? 'STARBUCKS COFFEE' : i % 3 === 1 ? 'AMAZON.COM' : 'UBER RIDE',
        amount: -1000 * (i + 1),
      }));

      // Mock categories (should be fetched once, not per transaction)
      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-meals', name: 'Meals & Entertainment' }),
        mockCategory({ id: 'cat-software', name: 'Software & Subscriptions' }),
        mockCategory({ id: 'cat-transport', name: 'Transportation' }),
      ]);

      const results = await categorizeTransactions(transactions as never, TENANT_ID);

      expect(results).toHaveLength(150);

      // Verify categories were fetched only once (efficiency check)
      expect(mockFindMany).toHaveBeenCalledTimes(1);

      // Verify categorization worked for bulk
      const categorized = results.filter((r) => r.categoryId !== null);
      expect(categorized.length).toBeGreaterThanOrEqual(100); // Most should be categorized
    });

    it('should maintain performance with 500 transactions', async () => {
      // Stress test: 500 transactions (large CSV import)
      const transactions = Array.from({ length: 500 }, (_, i) => ({
        id: `txn-${i}`,
        description: 'AWS Services', // All same category for simplicity
        amount: -10000,
      }));

      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-software', name: 'Software & Subscriptions' }),
      ]);

      const startTime = Date.now();
      const results = await categorizeTransactions(transactions as never, TENANT_ID);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(500);

      // Should complete in reasonable time (< 1 second for 500 items)
      expect(duration).toBeLessThan(1000);

      // Single category fetch (N+1 query prevention)
      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });
  });
});
