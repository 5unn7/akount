import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  categorizeTransaction,
  categorizeTransactions,
  learnFromCorrection,
  CategorizationService,
  CATEGORY_TO_COA_CODE,
} from '../categorization.service';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils/index.js';

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
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

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Local aliases for convenience (point to mockPrisma methods)
let mockFindFirst: typeof mockPrisma.category.findFirst;
let mockFindMany: typeof mockPrisma.category.findMany;
let mockGLFindFirst: typeof mockPrisma.gLAccount.findFirst;
let mockGLFindMany: typeof mockPrisma.gLAccount.findMany;

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'entity-xyz-456';

function mockCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    tenantId: TENANT_ID,
    name: 'Meals & Entertainment',
    type: 'EXPENSE',
    defaultGLAccountId: null,
    ...overrides,
  };
}

function mockGLAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'gl-5800',
    code: '5800',
    name: 'Travel & Meals',
    ...overrides,
  };
}

describe('CategorizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    // Re-bind local aliases after rewire
    mockFindFirst = mockPrisma.category.findFirst;
    mockFindMany = mockPrisma.category.findMany;
    mockGLFindFirst = mockPrisma.gLAccount.findFirst;
    mockGLFindMany = mockPrisma.gLAccount.findMany;
    mockIsProviderAvailable.mockReturnValue(false); // Default: no AI
  });

  describe('categorizeTransaction (backward-compat)', () => {
    describe('keyword matching', () => {
      it('should categorize "Starbucks" as Meals & Entertainment', async () => {
        const category = mockCategory({ name: 'Meals & Entertainment' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Starbucks Coffee', 500, TENANT_ID);

        expect(result.categoryId).toBe('cat-1');
        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(85);
        expect(result.confidenceTier).toBe('high');
        expect(result.matchReason).toMatch(/Keyword match: "(starbucks|coffee)"/);
        // No entityId → GL fields are null
        expect(result.resolvedGLAccountId).toBeNull();
        expect(result.resolvedGLAccountCode).toBeNull();
      });

      it('should categorize "Uber" as Transportation', async () => {
        const category = mockCategory({ id: 'cat-2', name: 'Transportation' });
        mockFindFirst.mockResolvedValueOnce(category);

        const result = await categorizeTransaction('Uber Trip', 1500, TENANT_ID);

        expect(result.categoryName).toBe('Transportation');
        expect(result.confidence).toBe(85);
        expect(result.confidenceTier).toBe('high');
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
        mockFindFirst.mockResolvedValueOnce(null);

        const result = await categorizeTransaction('Starbucks', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(85);
        expect(result.confidenceTier).toBe('high');
        expect(result.matchReason).toContain('category not found');
      });

      it('should return no match when no keywords match', async () => {
        const result = await categorizeTransaction('Unknown Merchant XYZ', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.categoryName).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.confidenceTier).toBe('low');
        expect(result.matchReason).toBe('No match found');
      });

      it('should choose best match when multiple keywords match', async () => {
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

        const result = await categorizeTransaction(
          'Acme Corp Store XYZ',
          500,
          TENANT_ID
        );

        expect(mockChat).toHaveBeenCalled();
        expect(result.categoryName).toBe('Meals & Entertainment');
        expect(result.confidence).toBe(75);
        expect(result.confidenceTier).toBe('medium');
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
        vi.clearAllMocks();
        mockIsProviderAvailable.mockReturnValue(true);
        mockChat.mockResolvedValueOnce({ content: 'Rare Category' });
        mockFindFirst.mockResolvedValueOnce(null);

        const result = await categorizeTransaction('Acme Corp XYZ', 500, TENANT_ID);

        expect(result.categoryId).toBeNull();
        expect(result.categoryName).toBe('Rare Category');
        expect(result.confidence).toBe(60);
        expect(result.confidenceTier).toBe('medium');
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
          select: { id: true, name: true, defaultGLAccountId: true },
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
      expect(results[0].confidenceTier).toBe('high');
      expect(results[1].categoryName).toBe('Transportation');
      expect(results[2].categoryName).toBe('Software & Subscriptions');
      expect(results[3].categoryName).toBeNull();
      expect(results[3].confidenceTier).toBe('low');
    });

    it('should fetch categories only once (avoid N+1)', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const transactions = Array(50).fill({ description: 'Test', amount: 100 });

      await categorizeTransactions(transactions, TENANT_ID);

      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });

    it('should handle case-insensitive category matching', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Meals & Entertainment' }),
      ];
      mockFindMany.mockResolvedValueOnce(categories);

      const transactions = [{ description: 'Starbucks', amount: 500 }];

      const results = await categorizeTransactions(transactions, TENANT_ID);

      expect(results[0].categoryId).toBe('cat-1');
    });

    it('should handle partial category name matches', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Meals' }),
      ];
      mockFindMany.mockResolvedValueOnce(categories);

      const transactions = [{ description: 'Starbucks', amount: 500 }];

      const results = await categorizeTransactions(transactions, TENANT_ID);

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
      const matched = results.filter((r) => r.categoryId !== null);
      expect(matched.length).toBeGreaterThan(0);
    });
  });

  describe('CategorizationService (class-based with GL resolution)', () => {
    it('should resolve GL via Category.defaultGLAccountId', async () => {
      const service = new CategorizationService(TENANT_ID, ENTITY_ID);
      const category = mockCategory({
        name: 'Meals & Entertainment',
        defaultGLAccountId: 'gl-custom',
      });
      mockFindFirst.mockResolvedValueOnce(category);
      // GL lookup for defaultGLAccountId
      mockGLFindFirst.mockResolvedValueOnce({ id: 'gl-custom', code: '5801' });

      const result = await service.categorize('Starbucks Coffee', -500);

      expect(result.resolvedGLAccountId).toBe('gl-custom');
      expect(result.resolvedGLAccountCode).toBe('5801');
    });

    it('should fall back to CATEGORY_TO_COA_CODE when no defaultGLAccountId', async () => {
      const service = new CategorizationService(TENANT_ID, ENTITY_ID);
      const category = mockCategory({
        name: 'Meals & Entertainment',
        defaultGLAccountId: null,
      });
      mockFindFirst
        .mockResolvedValueOnce(category)  // category lookup
      mockGLFindFirst
        .mockResolvedValueOnce(mockGLAccount({ id: 'gl-5800', code: '5800' })); // COA code lookup

      const result = await service.categorize('Starbucks Coffee', -500);

      expect(result.resolvedGLAccountId).toBe('gl-5800');
      expect(result.resolvedGLAccountCode).toBe('5800');
    });

    it('should use sign-aware fallback for expenses (5990)', async () => {
      const service = new CategorizationService(TENANT_ID, ENTITY_ID);
      // No keyword match, no AI → falls through to "No match found"
      // Amount negative → expense → 5990
      mockGLFindFirst.mockResolvedValueOnce(mockGLAccount({ id: 'gl-5990', code: '5990' }));

      const result = await service.categorize('Unknown Vendor XYZ', -1000);

      expect(result.resolvedGLAccountId).toBe('gl-5990');
      expect(result.resolvedGLAccountCode).toBe('5990');
    });

    it('should use sign-aware fallback for income (4300)', async () => {
      const service = new CategorizationService(TENANT_ID, ENTITY_ID);
      mockGLFindFirst.mockResolvedValueOnce(mockGLAccount({ id: 'gl-4300', code: '4300' }));

      const result = await service.categorize('Unknown Client Payment', 5000);

      expect(result.resolvedGLAccountId).toBe('gl-4300');
      expect(result.resolvedGLAccountCode).toBe('4300');
    });

    it('should return null GL when entityId not provided', async () => {
      const service = new CategorizationService(TENANT_ID); // no entityId
      const category = mockCategory({ name: 'Meals & Entertainment' });
      mockFindFirst.mockResolvedValueOnce(category);

      const result = await service.categorize('Starbucks', -500);

      expect(result.resolvedGLAccountId).toBeNull();
      expect(result.resolvedGLAccountCode).toBeNull();
    });

    it('should resolve GL in batch operations', async () => {
      const service = new CategorizationService(TENANT_ID, ENTITY_ID);

      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-1', name: 'Meals & Entertainment' }),
      ]);
      mockGLFindMany.mockResolvedValueOnce([
        mockGLAccount({ id: 'gl-5800', code: '5800' }),
        mockGLAccount({ id: 'gl-5990', code: '5990' }),
        mockGLAccount({ id: 'gl-4300', code: '4300' }),
      ]);

      const results = await service.categorizeBatch([
        { description: 'Starbucks', amount: -500 },
        { description: 'Unknown', amount: -1000 },
      ]);

      expect(results).toHaveLength(2);
      // Starbucks → Meals & Entertainment → COA code 5800
      expect(results[0].resolvedGLAccountCode).toBe('5800');
      // Unknown expense → fallback 5990
      expect(results[1].resolvedGLAccountCode).toBe('5990');
    });
  });

  describe('CATEGORY_TO_COA_CODE mapping', () => {
    it('should have mappings for all common category names', () => {
      expect(CATEGORY_TO_COA_CODE['meals & entertainment']).toBe('5800');
      expect(CATEGORY_TO_COA_CODE['transportation']).toBe('5800');
      expect(CATEGORY_TO_COA_CODE['office supplies']).toBe('5400');
      expect(CATEGORY_TO_COA_CODE['software & subscriptions']).toBe('5400');
      expect(CATEGORY_TO_COA_CODE['rent']).toBe('5600');
      expect(CATEGORY_TO_COA_CODE['professional services']).toBe('5500');
      expect(CATEGORY_TO_COA_CODE['marketing & advertising']).toBe('5100');
      expect(CATEGORY_TO_COA_CODE['insurance']).toBe('5300');
      expect(CATEGORY_TO_COA_CODE['bank fees']).toBe('5200');
      expect(CATEGORY_TO_COA_CODE['sales revenue']).toBe('4000');
      expect(CATEGORY_TO_COA_CODE['interest income']).toBe('4200');
      expect(CATEGORY_TO_COA_CODE['payroll']).toBe('5700');
    });

    it('should use income codes (4xxx) for income categories', () => {
      const incomeCodes = ['4000', '4200', '4300'];
      const incomeCategories = ['sales revenue', 'interest income', 'investment income'];

      for (const cat of incomeCategories) {
        expect(incomeCodes).toContain(CATEGORY_TO_COA_CODE[cat]);
      }
    });

    it('should use expense codes (5xxx) for expense categories', () => {
      const expenseCategories = [
        'meals & entertainment', 'office supplies', 'rent',
        'professional services', 'insurance', 'payroll',
      ];

      for (const cat of expenseCategories) {
        const code = CATEGORY_TO_COA_CODE[cat];
        expect(Number(code)).toBeGreaterThanOrEqual(5000);
        expect(Number(code)).toBeLessThan(6000);
      }
    });
  });

  describe('learnFromCorrection', () => {
    it('should return suggestionCreated: false when no pattern detected', async () => {
      const result = await learnFromCorrection({
        transactionId: 'txn-1',
        description: 'Test Description',
        categoryId: 'cat-1',
        entityId: 'entity-1',
        tenantId: TENANT_ID,
        userId: 'user-1',
      });
      expect(result.suggestionCreated).toBe(false);
    });

    it('should not throw errors for invalid inputs', async () => {
      await expect(
        learnFromCorrection({
          transactionId: '',
          description: '',
          categoryId: 'invalid-id',
          entityId: 'invalid-entity',
          tenantId: 'invalid-tenant',
          userId: 'invalid-user',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Bulk Operation Stress Tests', () => {
    it('should handle batch categorization of 100+ transactions efficiently', async () => {
      const transactions = Array.from({ length: 150 }, (_, i) => ({
        id: `txn-${i}`,
        description: i % 3 === 0 ? 'STARBUCKS COFFEE' : i % 3 === 1 ? 'AMAZON.COM' : 'UBER RIDE',
        amount: -1000 * (i + 1),
      }));

      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-meals', name: 'Meals & Entertainment' }),
        mockCategory({ id: 'cat-software', name: 'Software & Subscriptions' }),
        mockCategory({ id: 'cat-transport', name: 'Transportation' }),
      ]);

      const results = await categorizeTransactions(transactions as never, TENANT_ID);

      expect(results).toHaveLength(150);
      expect(mockFindMany).toHaveBeenCalledTimes(1);

      const categorized = results.filter((r) => r.categoryId !== null);
      expect(categorized.length).toBeGreaterThanOrEqual(100);
    });

    it('should maintain performance with 500 transactions', async () => {
      const transactions = Array.from({ length: 500 }, (_, i) => ({
        id: `txn-${i}`,
        description: 'AWS Services',
        amount: -10000,
      }));

      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-software', name: 'Software & Subscriptions' }),
      ]);

      const startTime = Date.now();
      const results = await categorizeTransactions(transactions as never, TENANT_ID);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(500);
      expect(duration).toBeLessThan(1000);
      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });
  });
});
