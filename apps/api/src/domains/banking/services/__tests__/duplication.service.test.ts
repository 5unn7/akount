import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findDuplicates,
  deduplicateExistingTransactions,
  findInternalDuplicates,
  type DuplicateResult,
} from '../duplication.service';
import type { ParsedTransaction } from '../../../../schemas/import';

// Mock Prisma
const mockFindMany = vi.fn();
const mockUpdateMany = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

const ACCOUNT_ID = 'acc-123';

function mockParsedTransaction(overrides: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    tempId: 'temp-1',
    date: '2026-02-15',
    description: 'STARBUCKS COFFEE',
    amount: 550, // $5.50
    balance: 10000,
    isDuplicate: false,
    ...overrides,
  };
}

function mockExistingTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    date: new Date('2026-02-15'),
    description: 'STARBUCKS COFFEE',
    amount: 550,
    createdAt: new Date('2026-02-10'),
    journalEntryId: null,
    categoryId: null,
    ...overrides,
  };
}

describe('DuplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findDuplicates', () => {
    it('should return empty array for empty transactions', async () => {
      const result = await findDuplicates([], ACCOUNT_ID);
      expect(result).toEqual([]);
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it('should return no duplicates when no existing transactions', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const transactions = [mockParsedTransaction()];
      const result = await findDuplicates(transactions, ACCOUNT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].isDuplicate).toBe(false);
      expect(result[0].duplicateConfidence).toBe(0);
      expect(result[0].tempId).toBe('temp-1');
    });

    it('should detect perfect match (score 100)', async () => {
      const existing = mockExistingTransaction();
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          tempId: 'temp-1',
          date: '2026-02-15', // Same date (40 points)
          amount: 550, // Same amount (40 points)
          description: 'STARBUCKS COFFEE', // Exact description (20 points)
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      expect(result[0].isDuplicate).toBe(true);
      expect(result[0].duplicateConfidence).toBe(100);
      expect(result[0].matchedTransactionId).toBe('txn-1');
      expect(result[0].matchReason).toContain('Same date');
      expect(result[0].matchReason).toContain('Exact amount');
      expect(result[0].matchReason).toContain('Description exact match');
    });

    it('should detect high confidence duplicate (≥80)', async () => {
      const existing = mockExistingTransaction({
        date: new Date('2026-02-16'), // +1 day (30 points)
        description: 'STARBUCKS COFFEE DOWNTOWN', // Similar (18+ points)
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 550, // Exact (40 points)
          description: 'STARBUCKS COFFEE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      expect(result[0].isDuplicate).toBe(true);
      expect(result[0].duplicateConfidence).toBeGreaterThanOrEqual(80);
    });

    it('should not detect low confidence match (<80)', async () => {
      const existing = mockExistingTransaction({
        date: new Date('2026-02-18'), // +3 days (10 points)
        description: 'WALMART', // Different description (0 points)
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 550, // Exact (40 points) → Total: 50 points
          description: 'STARBUCKS COFFEE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      expect(result[0].isDuplicate).toBe(false);
      expect(result[0].duplicateConfidence).toBeLessThan(80);
    });

    it('should score ±1 day as 30 points', async () => {
      const existing = mockExistingTransaction({
        date: new Date('2026-02-16'), // +1 day
        description: 'STARBUCKS COFFEE',
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 550, // 40 points
          description: 'STARBUCKS COFFEE', // 20 points
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      // 30 (±1 day) + 40 (amount) + 20 (description) = 90
      expect(result[0].duplicateConfidence).toBe(90);
      expect(result[0].matchReason).toContain('±1 day');
    });

    it('should score ±2 days as 20 points', async () => {
      const existing = mockExistingTransaction({
        date: new Date('2026-02-17'), // +2 days
        description: 'STARBUCKS COFFEE',
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 550,
          description: 'STARBUCKS COFFEE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      // 20 (±2 days) + 40 + 20 = 80 (exact threshold)
      expect(result[0].duplicateConfidence).toBe(80);
      expect(result[0].isDuplicate).toBe(true);
      expect(result[0].matchReason).toContain('±2 days');
    });

    it('should score ±3 days as 10 points', async () => {
      const existing = mockExistingTransaction({
        date: new Date('2026-02-18'), // +3 days
        description: 'STARBUCKS COFFEE',
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 550,
          description: 'STARBUCKS COFFEE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      // 10 (±3 days) + 40 + 20 = 70 (below threshold)
      expect(result[0].duplicateConfidence).toBe(70);
      expect(result[0].isDuplicate).toBe(false);
      expect(result[0].matchReason).toContain('±3 days');
    });

    it('should match amount by absolute value (handles sign differences)', async () => {
      const existing = mockExistingTransaction({
        amount: -2599, // Negative (credit card charge stored as negative)
        description: 'AMAZON PURCHASE',
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 2599, // Positive (parser may give positive)
          description: 'AMAZON PURCHASE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      // Should match: abs(-2599) === abs(2599)
      expect(result[0].isDuplicate).toBe(true);
      expect(result[0].duplicateConfidence).toBe(100);
    });

    it('should skip candidates with different amounts', async () => {
      const existing = mockExistingTransaction({
        amount: 1000, // Different amount
        description: 'STARBUCKS COFFEE',
      });
      mockFindMany.mockResolvedValueOnce([existing]);

      const transactions = [
        mockParsedTransaction({
          amount: 550,
          description: 'STARBUCKS COFFEE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      // Should not match - amount is mandatory
      expect(result[0].isDuplicate).toBe(false);
      expect(result[0].duplicateConfidence).toBe(0);
    });

    it('should pick best match when multiple candidates exist', async () => {
      const weakMatch = mockExistingTransaction({
        id: 'txn-weak',
        date: new Date('2026-02-18'), // +3 days (10 points)
        description: 'STARBUCKS',
      });

      const strongMatch = mockExistingTransaction({
        id: 'txn-strong',
        date: new Date('2026-02-15'), // Same day (40 points)
        description: 'STARBUCKS COFFEE',
      });

      mockFindMany.mockResolvedValueOnce([weakMatch, strongMatch]);

      const transactions = [
        mockParsedTransaction({
          date: '2026-02-15',
          amount: 550,
          description: 'STARBUCKS COFFEE',
        }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      // Should pick the stronger match
      expect(result[0].matchedTransactionId).toBe('txn-strong');
      expect(result[0].duplicateConfidence).toBe(100);
    });

    it('should exclude soft-deleted transactions (deletedAt filter)', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const transactions = [mockParsedTransaction()];
      await findDuplicates(transactions, ACCOUNT_ID);

      // Verify the query includes deletedAt: null filter
      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.deletedAt).toBe(null);
      expect(queryArgs.where.accountId).toBe(ACCOUNT_ID);
    });

    it('should query with ±3 day date buffer for optimization', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const transactions = [
        mockParsedTransaction({ date: '2026-02-15' }),
        mockParsedTransaction({ date: '2026-02-20', tempId: 'temp-2' }),
      ];

      await findDuplicates(transactions, ACCOUNT_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      const minDate = new Date(queryArgs.where.date.gte);
      const maxDate = new Date(queryArgs.where.date.lte);

      // Should be: 2026-02-15 - 3 days = 2026-02-12
      //            2026-02-20 + 3 days = 2026-02-23
      expect(minDate.toISOString().slice(0, 10)).toBe('2026-02-12');
      expect(maxDate.toISOString().slice(0, 10)).toBe('2026-02-23');
    });

    it('should handle batch of multiple transactions', async () => {
      const existing1 = mockExistingTransaction({ id: 'txn-1' });
      const existing2 = mockExistingTransaction({ id: 'txn-2', description: 'WALMART' });

      mockFindMany.mockResolvedValueOnce([existing1, existing2]);

      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS COFFEE' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'WALMART', amount: 550 }),
      ];

      const result = await findDuplicates(transactions, ACCOUNT_ID);

      expect(result).toHaveLength(2);
      expect(result[0].tempId).toBe('temp-1');
      expect(result[1].tempId).toBe('temp-2');
    });
  });

  describe('deduplicateExistingTransactions', () => {
    it('should return 0 removed when no duplicates exist', async () => {
      mockFindMany.mockResolvedValueOnce([
        mockExistingTransaction({ id: 'txn-1' }),
        mockExistingTransaction({ id: 'txn-2', description: 'WALMART' }),
      ]);

      const result = await deduplicateExistingTransactions(ACCOUNT_ID);

      expect(result.removed).toBe(0);
      expect(result.groups).toBe(0);
      expect(mockUpdateMany).not.toHaveBeenCalled();
    });

    it('should soft-delete duplicates in a single group', async () => {
      const duplicate1 = mockExistingTransaction({
        id: 'txn-1',
        createdAt: new Date('2026-02-10'),
      });
      const duplicate2 = mockExistingTransaction({
        id: 'txn-2',
        createdAt: new Date('2026-02-11'), // Newer
      });

      mockFindMany.mockResolvedValueOnce([duplicate1, duplicate2]);
      mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

      const result = await deduplicateExistingTransactions(ACCOUNT_ID);

      expect(result.removed).toBe(1);
      expect(result.groups).toBe(1);

      // Verify soft delete call
      const updateCall = mockUpdateMany.mock.calls[0][0];
      expect(updateCall.where.id.in).toEqual(['txn-2']); // Newer one deleted
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
    });

    it('should handle multiple duplicate groups', async () => {
      const group1_txn1 = mockExistingTransaction({
        id: 'txn-1',
        description: 'STARBUCKS',
        createdAt: new Date('2026-02-10'),
      });
      const group1_txn2 = mockExistingTransaction({
        id: 'txn-2',
        description: 'STARBUCKS',
        createdAt: new Date('2026-02-11'),
      });

      const group2_txn1 = mockExistingTransaction({
        id: 'txn-3',
        description: 'WALMART',
        amount: 1000,
        createdAt: new Date('2026-02-12'),
      });
      const group2_txn2 = mockExistingTransaction({
        id: 'txn-4',
        description: 'WALMART',
        amount: 1000,
        createdAt: new Date('2026-02-13'),
      });

      mockFindMany.mockResolvedValueOnce([group1_txn1, group1_txn2, group2_txn1, group2_txn2]);
      mockUpdateMany.mockResolvedValue({ count: 1 } as never);

      const result = await deduplicateExistingTransactions(ACCOUNT_ID);

      expect(result.removed).toBe(2); // One from each group
      expect(result.groups).toBe(2);
      expect(mockUpdateMany).toHaveBeenCalledTimes(2);
    });

    it('should prefer transaction with journalEntryId', async () => {
      const withJE = mockExistingTransaction({
        id: 'txn-with-je',
        journalEntryId: 'je-1',
        createdAt: new Date('2026-02-11'), // Newer, but has JE
      });
      const withoutJE = mockExistingTransaction({
        id: 'txn-without-je',
        createdAt: new Date('2026-02-10'), // Older
      });

      mockFindMany.mockResolvedValueOnce([withoutJE, withJE]);
      mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

      await deduplicateExistingTransactions(ACCOUNT_ID);

      // Should delete the one without JE
      const updateCall = mockUpdateMany.mock.calls[0][0];
      expect(updateCall.where.id.in).toEqual(['txn-without-je']);
    });

    it('should prefer transaction with categoryId when neither has JE', async () => {
      const withCategory = mockExistingTransaction({
        id: 'txn-with-cat',
        categoryId: 'cat-1',
        createdAt: new Date('2026-02-11'), // Newer
      });
      const withoutCategory = mockExistingTransaction({
        id: 'txn-without-cat',
        createdAt: new Date('2026-02-10'), // Older
      });

      mockFindMany.mockResolvedValueOnce([withoutCategory, withCategory]);
      mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

      await deduplicateExistingTransactions(ACCOUNT_ID);

      // Should delete the one without category
      const updateCall = mockUpdateMany.mock.calls[0][0];
      expect(updateCall.where.id.in).toEqual(['txn-without-cat']);
    });

    it('should keep oldest when neither has JE nor category', async () => {
      const oldest = mockExistingTransaction({
        id: 'txn-oldest',
        createdAt: new Date('2026-02-10'),
      });
      const newer = mockExistingTransaction({
        id: 'txn-newer',
        createdAt: new Date('2026-02-11'),
      });

      mockFindMany.mockResolvedValueOnce([oldest, newer]);
      mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

      await deduplicateExistingTransactions(ACCOUNT_ID);

      // Should delete the newer one
      const updateCall = mockUpdateMany.mock.calls[0][0];
      expect(updateCall.where.id.in).toEqual(['txn-newer']);
    });

    it('should only query active transactions (deletedAt: null)', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await deduplicateExistingTransactions(ACCOUNT_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.accountId).toBe(ACCOUNT_ID);
      expect(queryArgs.where.deletedAt).toBe(null);
    });

    it('should group by date + amount + normalized description', async () => {
      // These should be grouped together (case-insensitive, special chars removed)
      const txn1 = mockExistingTransaction({
        id: 'txn-1',
        description: 'STARBUCKS COFFEE!!!',
        createdAt: new Date('2026-02-10'),
      });
      const txn2 = mockExistingTransaction({
        id: 'txn-2',
        description: 'starbucks coffee',
        createdAt: new Date('2026-02-11'),
      });

      mockFindMany.mockResolvedValueOnce([txn1, txn2]);
      mockUpdateMany.mockResolvedValueOnce({ count: 1 } as never);

      const result = await deduplicateExistingTransactions(ACCOUNT_ID);

      expect(result.removed).toBe(1);
      expect(result.groups).toBe(1);
    });
  });

  describe('findInternalDuplicates', () => {
    it('should return empty map for empty array', () => {
      const result = findInternalDuplicates([]);
      expect(result.size).toBe(0);
    });

    it('should return empty map when no duplicates exist', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'WALMART', amount: 1000 }),
      ];

      const result = findInternalDuplicates(transactions);
      expect(result.size).toBe(0);
    });

    it('should detect exact duplicates in batch', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'STARBUCKS' }), // Exact duplicate
      ];

      const result = findInternalDuplicates(transactions);

      expect(result.size).toBe(1);
      expect(result.get('temp-1')).toEqual(['temp-2']);
    });

    it('should match by normalized description (case-insensitive, special chars)', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS COFFEE!!!' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'starbucks coffee' }),
      ];

      const result = findInternalDuplicates(transactions);

      expect(result.size).toBe(1);
      expect(result.get('temp-1')).toEqual(['temp-2']);
    });

    it('should group multiple duplicates of same transaction', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-3', description: 'STARBUCKS' }),
      ];

      const result = findInternalDuplicates(transactions);

      // The algorithm creates entries for each transaction that has duplicates after it
      // temp-1 → [temp-2, temp-3]
      // temp-2 → [temp-3]
      expect(result.size).toBe(2);
      expect(result.get('temp-1')).toContain('temp-2');
      expect(result.get('temp-1')).toContain('temp-3');
      expect(result.get('temp-1')?.length).toBe(2);
      expect(result.get('temp-2')).toEqual(['temp-3']);
    });

    it('should handle multiple separate duplicate groups', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS', amount: 550 }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'STARBUCKS', amount: 550 }),
        mockParsedTransaction({ tempId: 'temp-3', description: 'WALMART', amount: 1000 }),
        mockParsedTransaction({ tempId: 'temp-4', description: 'WALMART', amount: 1000 }),
      ];

      const result = findInternalDuplicates(transactions);

      expect(result.size).toBe(2);
      expect(result.get('temp-1')).toEqual(['temp-2']);
      expect(result.get('temp-3')).toEqual(['temp-4']);
    });

    it('should not match transactions with different dates', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', date: '2026-02-15', description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-2', date: '2026-02-16', description: 'STARBUCKS' }),
      ];

      const result = findInternalDuplicates(transactions);
      expect(result.size).toBe(0);
    });

    it('should not match transactions with different amounts', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', amount: 550, description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-2', amount: 600, description: 'STARBUCKS' }),
      ];

      const result = findInternalDuplicates(transactions);
      expect(result.size).toBe(0);
    });

    it('should detect fuzzy duplicates with similar descriptions (PDF summary vs detail)', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'GROCERY STORE #1234 MAIN ST' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'GROCERY STORE' }),
      ];

      const result = findInternalDuplicates(transactions);

      // "grocery store" is a substring of "grocery store 1234 main st" → duplicate
      expect(result.size).toBe(1);
      expect(result.get('temp-1')).toEqual(['temp-2']);
    });

    it('should detect fuzzy duplicates with Levenshtein similarity ≥ 0.6', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', description: 'STARBUCKS COFFEE DOWNTOWN' }),
        mockParsedTransaction({ tempId: 'temp-2', description: 'STARBUCKS COFFEE' }),
      ];

      const result = findInternalDuplicates(transactions);

      expect(result.size).toBe(1);
      expect(result.get('temp-1')).toEqual(['temp-2']);
    });

    it('should match amounts by absolute value (handles sign differences)', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', amount: 550, description: 'STARBUCKS' }),
        mockParsedTransaction({ tempId: 'temp-2', amount: -550, description: 'STARBUCKS' }),
      ];

      const result = findInternalDuplicates(transactions);

      // abs(550) === abs(-550) → same amount → duplicate
      expect(result.size).toBe(1);
      expect(result.get('temp-1')).toEqual(['temp-2']);
    });

    it('should NOT match genuinely different transactions on same day with same amount', () => {
      const transactions = [
        mockParsedTransaction({ tempId: 'temp-1', amount: 550, description: 'STARBUCKS COFFEE' }),
        mockParsedTransaction({ tempId: 'temp-2', amount: 550, description: 'WALMART GROCERY' }),
      ];

      const result = findInternalDuplicates(transactions);

      // Completely different descriptions → not duplicates
      expect(result.size).toBe(0);
    });
  });
});
