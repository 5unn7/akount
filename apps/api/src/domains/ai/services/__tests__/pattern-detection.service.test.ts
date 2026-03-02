import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternDetectionService, tokenizeDescription } from '../pattern-detection.service';

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Prisma
const mockTransactionFindMany = vi.fn();
const mockTransactionFindFirst = vi.fn();
const mockTransactionCount = vi.fn();
const mockRuleFindMany = vi.fn();
const mockRuleFindFirst = vi.fn();
const mockRuleSuggestionFindMany = vi.fn();
const mockRuleSuggestionFindFirst = vi.fn();
const mockEntityFindMany = vi.fn();
const mockEntityFindFirst = vi.fn();
const mockCategoryFindFirst = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => mockTransactionFindMany(...args),
      findFirst: (...args: unknown[]) => mockTransactionFindFirst(...args),
      count: (...args: unknown[]) => mockTransactionCount(...args),
    },
    rule: {
      findMany: (...args: unknown[]) => mockRuleFindMany(...args),
      findFirst: (...args: unknown[]) => mockRuleFindFirst(...args),
    },
    ruleSuggestion: {
      findMany: (...args: unknown[]) => mockRuleSuggestionFindMany(...args),
      findFirst: (...args: unknown[]) => mockRuleSuggestionFindFirst(...args),
    },
    entity: {
      findMany: (...args: unknown[]) => mockEntityFindMany(...args),
      findFirst: (...args: unknown[]) => mockEntityFindFirst(...args),
    },
    category: {
      findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args),
    },
  },
  Prisma: {
    QueryMode: { insensitive: 'insensitive' },
  },
  RuleSuggestionStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
  },
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-xyz-456';
const ENTITY_ID = 'entity-def-789';
const CATEGORY_ID_MEALS = 'cat-meals-001';
const CATEGORY_ID_TRANSPORT = 'cat-transport-002';

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    description: 'STARBUCKS STORE #1234',
    amount: -550, // Integer cents: $5.50
    categoryId: CATEGORY_ID_MEALS,
    category: { id: CATEGORY_ID_MEALS, name: 'Meals & Entertainment' },
    ...overrides,
  };
}

function mockRule(overrides: Record<string, unknown> = {}) {
  return {
    conditions: {
      operator: 'AND',
      conditions: [
        { field: 'description', op: 'contains', value: 'starbucks' },
      ],
    },
    action: {
      setCategoryId: CATEGORY_ID_MEALS,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// tokenizeDescription tests (exported helper)
// ---------------------------------------------------------------------------

describe('tokenizeDescription', () => {
  it('should split by whitespace and punctuation', () => {
    const tokens = tokenizeDescription('STARBUCKS STORE #1234 - Main Street');
    expect(tokens).toContain('starbucks');
    expect(tokens).toContain('store');
    expect(tokens).toContain('main');
    expect(tokens).toContain('street');
  });

  it('should lowercase all tokens', () => {
    const tokens = tokenizeDescription('UBER TECHNOLOGIES INC');
    expect(tokens).toEqual(expect.arrayContaining(['uber', 'technologies']));
    for (const token of tokens) {
      expect(token).toBe(token.toLowerCase());
    }
  });

  it('should filter tokens with 3 or fewer characters', () => {
    const tokens = tokenizeDescription('A to the big store on map');
    // 'big' has 3 chars => excluded, 'store' has 5 => included
    expect(tokens).not.toContain('big');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('map');
    expect(tokens).toContain('store');
  });

  it('should filter stop words', () => {
    const tokens = tokenizeDescription('payment for the online purchase at starbucks');
    // 'payment', 'online', 'purchase' are stop/financial noise words
    expect(tokens).not.toContain('payment');
    expect(tokens).not.toContain('online');
    expect(tokens).not.toContain('purchase');
    expect(tokens).toContain('starbucks');
  });

  it('should filter common financial noise words', () => {
    const tokens = tokenizeDescription('VISA DEBIT CARD TRANSACTION POS STARBUCKS');
    expect(tokens).not.toContain('visa');
    expect(tokens).not.toContain('debit');
    expect(tokens).not.toContain('card');
    expect(tokens).not.toContain('transaction');
    expect(tokens).toContain('starbucks');
  });

  it('should deduplicate tokens', () => {
    const tokens = tokenizeDescription('starbucks starbucks starbucks');
    const starbucksCount = tokens.filter((t) => t === 'starbucks').length;
    expect(starbucksCount).toBe(1);
  });

  it('should handle empty string', () => {
    const tokens = tokenizeDescription('');
    expect(tokens).toEqual([]);
  });

  it('should handle string with only stop words and short tokens', () => {
    const tokens = tokenizeDescription('the a on in to for at');
    expect(tokens).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// PatternDetectionService
// ---------------------------------------------------------------------------

describe('PatternDetectionService', () => {
  let service: PatternDetectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PatternDetectionService(TENANT_ID, USER_ID);
  });

  // -------------------------------------------------------------------------
  // detectPatterns
  // -------------------------------------------------------------------------

  describe('detectPatterns', () => {
    it('should return patterns above threshold', async () => {
      // 4 transactions with "starbucks" and same category => pattern
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS STORE #1234', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS DRIVE THRU', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS MOBILE ORDER', amount: -625 }),
        mockTransaction({ id: 'txn-4', description: 'STARBUCKS RESERVE', amount: -850 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]); // No active rules
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]); // No pending suggestions

      const patterns = await service.detectPatterns(ENTITY_ID);

      expect(patterns.length).toBeGreaterThan(0);
      const starbucksPattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(starbucksPattern).toBeDefined();
      expect(starbucksPattern!.categoryId).toBe(CATEGORY_ID_MEALS);
      expect(starbucksPattern!.categoryName).toBe('Meals & Entertainment');
      expect(starbucksPattern!.transactionCount).toBe(4);
      expect(starbucksPattern!.patternStrength).toBeGreaterThanOrEqual(0.7);
      expect(starbucksPattern!.exampleTransactions.length).toBeLessThanOrEqual(5);

      // Verify amounts are integer cents
      for (const example of starbucksPattern!.exampleTransactions) {
        expect(Number.isInteger(example.amount)).toBe(true);
      }

      // Verify suggested conditions and action
      expect(starbucksPattern!.suggestedConditions).toEqual({
        operator: 'AND',
        conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
      });
      expect(starbucksPattern!.suggestedAction).toEqual({
        setCategoryId: CATEGORY_ID_MEALS,
      });
    });

    it('should skip patterns below threshold (< 3 transactions)', async () => {
      // Only 2 transactions with "starbucks" => below threshold
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS STORE #1234', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS DRIVE THRU', amount: -475 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      // Should not reach rule/suggestion checks since no candidates pass threshold

      const patterns = await service.detectPatterns(ENTITY_ID);

      const starbucksPattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(starbucksPattern).toBeUndefined();
    });

    it('should skip patterns with low strength (keyword used across many categories)', async () => {
      // 3 transactions with "store" and meals, but 7 with "store" and other categories
      // strength = 3/10 = 0.3 (below 0.7 threshold)
      const mealsTransactions = Array.from({ length: 3 }, (_, i) =>
        mockTransaction({
          id: `txn-meals-${i}`,
          description: `STORE CHECKOUT #${i}`,
          categoryId: CATEGORY_ID_MEALS,
          category: { id: CATEGORY_ID_MEALS, name: 'Meals & Entertainment' },
          amount: -1000,
        })
      );
      const transportTransactions = Array.from({ length: 7 }, (_, i) =>
        mockTransaction({
          id: `txn-transport-${i}`,
          description: `STORE PICKUP #${i}`,
          categoryId: CATEGORY_ID_TRANSPORT,
          category: { id: CATEGORY_ID_TRANSPORT, name: 'Transportation' },
          amount: -2000,
        })
      );

      mockTransactionFindMany.mockResolvedValueOnce([...mealsTransactions, ...transportTransactions]);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      // "store" appears in both categories => strength for meals = 3/10 < 0.7
      // "store" for transport = 7/10 = 0.7 => should be included
      const storeForMeals = patterns.find(
        (p) => p.keyword === 'store' && p.categoryId === CATEGORY_ID_MEALS
      );
      expect(storeForMeals).toBeUndefined();

      const storeForTransport = patterns.find(
        (p) => p.keyword === 'store' && p.categoryId === CATEGORY_ID_TRANSPORT
      );
      expect(storeForTransport).toBeDefined();
      expect(storeForTransport!.transactionCount).toBe(7);
    });

    it('should skip patterns already covered by active rules', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS STORE #1', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS STORE #2', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS STORE #3', amount: -625 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);

      // Active rule already covers starbucks -> meals
      mockRuleFindMany.mockResolvedValueOnce([
        mockRule({
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
          },
          action: { setCategoryId: CATEGORY_ID_MEALS },
        }),
      ]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      const starbucksPattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(starbucksPattern).toBeUndefined();
    });

    it('should skip patterns with pending rule suggestions', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS STORE #1', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS STORE #2', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS STORE #3', amount: -625 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]); // No active rules
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);

      // Pending suggestion already covers starbucks -> meals
      mockRuleSuggestionFindMany.mockResolvedValueOnce([
        {
          suggestedRule: {
            conditions: {
              operator: 'AND',
              conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
            },
            action: { setCategoryId: CATEGORY_ID_MEALS },
          },
        },
      ]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      const starbucksPattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(starbucksPattern).toBeUndefined();
    });

    it('should return empty array when no transactions found', async () => {
      mockTransactionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      expect(patterns).toEqual([]);
    });

    it('should sort patterns by transactionCount descending', async () => {
      // 5 uber transactions, 3 starbucks transactions
      const uberTransactions = Array.from({ length: 5 }, (_, i) =>
        mockTransaction({
          id: `txn-uber-${i}`,
          description: `UBER TECHNOLOGIES TRIP #${i}`,
          categoryId: CATEGORY_ID_TRANSPORT,
          category: { id: CATEGORY_ID_TRANSPORT, name: 'Transportation' },
          amount: -2500,
        })
      );
      const starbucksTransactions = Array.from({ length: 3 }, (_, i) =>
        mockTransaction({
          id: `txn-sb-${i}`,
          description: `STARBUCKS COFFEE #${i}`,
          amount: -550,
        })
      );

      mockTransactionFindMany.mockResolvedValueOnce([...uberTransactions, ...starbucksTransactions]);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      // Find uber and starbucks patterns
      const uberIdx = patterns.findIndex((p) => p.keyword === 'uber');
      const starbucksIdx = patterns.findIndex((p) => p.keyword === 'starbucks');

      // uber (5) should come before starbucks (3) if both are present
      if (uberIdx !== -1 && starbucksIdx !== -1) {
        expect(uberIdx).toBeLessThan(starbucksIdx);
      }
    });

    it('should limit example transactions to 5', async () => {
      // 8 transactions => only 5 examples
      const transactions = Array.from({ length: 8 }, (_, i) =>
        mockTransaction({
          id: `txn-${i}`,
          description: `STARBUCKS LOCATION #${i}`,
          amount: -(500 + i * 50), // Integer cents
        })
      );

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      const starbucksPattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(starbucksPattern).toBeDefined();
      expect(starbucksPattern!.exampleTransactions.length).toBeLessThanOrEqual(5);
    });

    it('should use integer cents for amounts in examples', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS A', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS B', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS C', amount: -625 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);
      const pattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(pattern).toBeDefined();

      for (const example of pattern!.exampleTransactions) {
        expect(Number.isInteger(example.amount)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // analyzeCorrection
  // -------------------------------------------------------------------------

  describe('analyzeCorrection', () => {
    it('should return pattern when threshold met', async () => {
      // Corrected transaction
      mockTransactionFindFirst.mockResolvedValueOnce({
        id: 'txn-corrected',
        description: 'STARBUCKS RESERVE ROASTERY',
        amount: -950,
      });

      // Category lookup
      mockCategoryFindFirst.mockResolvedValueOnce({
        id: CATEGORY_ID_MEALS,
        name: 'Meals & Entertainment',
      });

      // Token "starbucks": 3 matching transactions with same category
      mockTransactionFindMany.mockResolvedValueOnce([
        { id: 'txn-1', description: 'STARBUCKS STORE #1', amount: -550 },
        { id: 'txn-2', description: 'STARBUCKS DRIVE THRU', amount: -475 },
        { id: 'txn-3', description: 'STARBUCKS MOBILE', amount: -625 },
      ]);
      mockTransactionCount.mockResolvedValueOnce(3); // total with "starbucks"

      // Token "reserve": no matching transactions
      mockTransactionFindMany.mockResolvedValueOnce([]);
      mockTransactionCount.mockResolvedValueOnce(0);

      // Token "roastery": no matching transactions
      mockTransactionFindMany.mockResolvedValueOnce([]);
      mockTransactionCount.mockResolvedValueOnce(0);

      // No existing rule covering starbucks
      mockRuleFindFirst.mockResolvedValueOnce(null);

      // Entity ownership check for suggestions
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockRuleSuggestionFindFirst.mockResolvedValueOnce(null);

      const result = await service.analyzeCorrection('txn-corrected', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(result).not.toBeNull();
      expect(result!.keyword).toBe('starbucks');
      expect(result!.categoryId).toBe(CATEGORY_ID_MEALS);
      expect(result!.categoryName).toBe('Meals & Entertainment');
      expect(result!.transactionCount).toBe(3);
      expect(result!.patternStrength).toBe(1.0); // 3/3 = 1.0
      expect(result!.suggestedConditions).toEqual({
        operator: 'AND',
        conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
      });
      expect(result!.suggestedAction).toEqual({
        setCategoryId: CATEGORY_ID_MEALS,
      });
    });

    it('should return null when below threshold', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce({
        id: 'txn-corrected',
        description: 'STARBUCKS RESERVE',
        amount: -950,
      });

      mockCategoryFindFirst.mockResolvedValueOnce({
        id: CATEGORY_ID_MEALS,
        name: 'Meals & Entertainment',
      });

      // Only 2 matching (below threshold of 3)
      mockTransactionFindMany.mockResolvedValueOnce([
        { id: 'txn-1', description: 'STARBUCKS STORE', amount: -550 },
        { id: 'txn-2', description: 'STARBUCKS DRIVE', amount: -475 },
      ]);
      mockTransactionCount.mockResolvedValueOnce(2);

      // "reserve" token check
      mockTransactionFindMany.mockResolvedValueOnce([]);
      mockTransactionCount.mockResolvedValueOnce(0);

      const result = await service.analyzeCorrection('txn-corrected', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(result).toBeNull();
    });

    it('should return null when rule already exists', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce({
        id: 'txn-corrected',
        description: 'STARBUCKS STORE #5678',
        amount: -550,
      });

      mockCategoryFindFirst.mockResolvedValueOnce({
        id: CATEGORY_ID_MEALS,
        name: 'Meals & Entertainment',
      });

      // Token "starbucks": 4 matching
      mockTransactionFindMany.mockResolvedValueOnce([
        { id: 'txn-1', description: 'STARBUCKS A', amount: -550 },
        { id: 'txn-2', description: 'STARBUCKS B', amount: -475 },
        { id: 'txn-3', description: 'STARBUCKS C', amount: -625 },
        { id: 'txn-4', description: 'STARBUCKS D', amount: -850 },
      ]);
      mockTransactionCount.mockResolvedValueOnce(4);

      // Token "store": no matching
      mockTransactionFindMany.mockResolvedValueOnce([]);
      mockTransactionCount.mockResolvedValueOnce(0);

      // Token "5678": no matching
      mockTransactionFindMany.mockResolvedValueOnce([]);
      mockTransactionCount.mockResolvedValueOnce(0);

      // Active rule already exists for this keyword+category
      mockRuleFindFirst.mockResolvedValueOnce({
        id: 'rule-existing',
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
        },
        action: { setCategoryId: CATEGORY_ID_MEALS },
      });

      const result = await service.analyzeCorrection('txn-corrected', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(result).toBeNull();
    });

    it('should return null when transaction not found', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce(null);

      const result = await service.analyzeCorrection('non-existent', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(result).toBeNull();
    });

    it('should return null when category not found', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce({
        id: 'txn-1',
        description: 'STARBUCKS STORE',
        amount: -550,
      });

      mockCategoryFindFirst.mockResolvedValueOnce(null);

      const result = await service.analyzeCorrection('txn-1', 'non-existent-cat', ENTITY_ID);

      expect(result).toBeNull();
    });

    it('should return null when description has only stop words', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce({
        id: 'txn-1',
        description: 'POS DEBIT CARD PAYMENT',
        amount: -100,
      });

      mockCategoryFindFirst.mockResolvedValueOnce({
        id: CATEGORY_ID_MEALS,
        name: 'Meals & Entertainment',
      });

      const result = await service.analyzeCorrection('txn-1', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(result).toBeNull();
    });

    it('should use integer cents for example transaction amounts', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce({
        id: 'txn-corrected',
        description: 'STARBUCKS RESERVE',
        amount: -950,
      });

      mockCategoryFindFirst.mockResolvedValueOnce({
        id: CATEGORY_ID_MEALS,
        name: 'Meals & Entertainment',
      });

      // Token "starbucks": 3 matching
      mockTransactionFindMany.mockResolvedValueOnce([
        { id: 'txn-1', description: 'STARBUCKS A', amount: -550 },
        { id: 'txn-2', description: 'STARBUCKS B', amount: -475 },
        { id: 'txn-3', description: 'STARBUCKS C', amount: -625 },
      ]);
      mockTransactionCount.mockResolvedValueOnce(3);

      // Token "reserve": no matching
      mockTransactionFindMany.mockResolvedValueOnce([]);
      mockTransactionCount.mockResolvedValueOnce(0);

      mockRuleFindFirst.mockResolvedValueOnce(null);
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockRuleSuggestionFindFirst.mockResolvedValueOnce(null);

      const result = await service.analyzeCorrection('txn-corrected', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(result).not.toBeNull();
      for (const example of result!.exampleTransactions) {
        expect(Number.isInteger(example.amount)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Tenant isolation
  // -------------------------------------------------------------------------

  describe('tenant isolation', () => {
    it('should enforce tenant isolation on detectPatterns transaction query', async () => {
      mockTransactionFindMany.mockResolvedValueOnce([]);

      await service.detectPatterns(ENTITY_ID);

      expect(mockTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              entityId: ENTITY_ID,
              entity: { tenantId: TENANT_ID },
            }),
          }),
        })
      );
    });

    it('should enforce tenant isolation on analyzeCorrection transaction query', async () => {
      mockTransactionFindFirst.mockResolvedValueOnce(null);

      await service.analyzeCorrection('txn-1', CATEGORY_ID_MEALS, ENTITY_ID);

      expect(mockTransactionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: expect.objectContaining({
              entityId: ENTITY_ID,
              entity: { tenantId: TENANT_ID },
            }),
          }),
        })
      );
    });

    it('should enforce tenant isolation on rule dedup query', async () => {
      // Set up transactions that create a candidate
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS A', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS B', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS C', amount: -625 }),
      ];
      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      await service.detectPatterns(ENTITY_ID);

      expect(mockRuleFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });

    it('should verify entity ownership before querying rule suggestions', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS A', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS B', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS C', amount: -625 }),
      ];
      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      await service.detectPatterns(ENTITY_ID);

      // Should verify entity belongs to tenant before querying suggestions
      expect(mockEntityFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: ENTITY_ID,
            tenantId: TENANT_ID,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle transactions with null categoryId gracefully', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1', categoryId: null, category: null }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS A', amount: -550 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS B', amount: -475 }),
        mockTransaction({ id: 'txn-4', description: 'STARBUCKS C', amount: -625 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      // Should not crash when encountering null category
      const patterns = await service.detectPatterns(ENTITY_ID);
      expect(patterns).toBeDefined();
    });

    it('should handle entity not found for suggestion dedup', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1', description: 'STARBUCKS A', amount: -550 }),
        mockTransaction({ id: 'txn-2', description: 'STARBUCKS B', amount: -475 }),
        mockTransaction({ id: 'txn-3', description: 'STARBUCKS C', amount: -625 }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([]); // Entity not found

      // Should still return patterns (just skip suggestion dedup)
      const patterns = await service.detectPatterns(ENTITY_ID);
      const starbucksPattern = patterns.find((p) => p.keyword === 'starbucks');
      expect(starbucksPattern).toBeDefined();
      // Suggestion dedup should be skipped, so mockRuleSuggestionFindMany should NOT be called
      expect(mockRuleSuggestionFindMany).not.toHaveBeenCalled();
    });

    it('should correctly compute patternStrength as a decimal between 0 and 1', async () => {
      // 4 starbucks with meals, 1 starbucks with transport => strength = 4/5 = 0.8
      const transactions = [
        ...Array.from({ length: 4 }, (_, i) =>
          mockTransaction({
            id: `txn-meals-${i}`,
            description: `STARBUCKS LOCATION #${i}`,
            amount: -550,
          })
        ),
        mockTransaction({
          id: 'txn-transport-0',
          description: 'STARBUCKS TAXI',
          categoryId: CATEGORY_ID_TRANSPORT,
          category: { id: CATEGORY_ID_TRANSPORT, name: 'Transportation' },
          amount: -2500,
        }),
      ];

      mockTransactionFindMany.mockResolvedValueOnce(transactions);
      mockRuleFindMany.mockResolvedValueOnce([]);
      mockEntityFindMany.mockResolvedValueOnce([{ id: ENTITY_ID }]);
      mockRuleSuggestionFindMany.mockResolvedValueOnce([]);

      const patterns = await service.detectPatterns(ENTITY_ID);

      const mealsPattern = patterns.find(
        (p) => p.keyword === 'starbucks' && p.categoryId === CATEGORY_ID_MEALS
      );
      expect(mealsPattern).toBeDefined();
      expect(mealsPattern!.patternStrength).toBeCloseTo(0.8, 2);
      expect(mealsPattern!.patternStrength).toBeGreaterThanOrEqual(0);
      expect(mealsPattern!.patternStrength).toBeLessThanOrEqual(1);
    });
  });
});
