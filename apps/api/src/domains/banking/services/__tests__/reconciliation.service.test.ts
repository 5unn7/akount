import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReconciliationService } from '../reconciliation.service';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

vi.mock('../../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('string-similarity', () => ({
  compareTwoStrings: vi.fn(),
}));

import { compareTwoStrings } from 'string-similarity';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-123';
const ACCOUNT_ID = 'acc-xyz-789';
const ENTITY_ID = 'entity-123';
const BANK_CONNECTION_ID = 'conn-123';

function mockBankFeedTxn(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bft-1',
    bankConnectionId: BANK_CONNECTION_ID,
    accountId: ACCOUNT_ID,
    bankTransactionId: 'ext-txn-001',
    date: new Date('2024-01-15'),
    description: 'STARBUCKS #1234',
    amount: 550, // $5.50
    currency: 'CAD',
    balance: null,
    rawData: null,
    merchantHints: null,
    status: 'PENDING',
    statusHistory: [],
    postedToJournalId: null,
    createdAt: new Date('2024-01-15'),
    deletedAt: null,
    account: {
      id: ACCOUNT_ID,
      entityId: ENTITY_ID,
      entity: {
        tenantId: TENANT_ID,
      },
    },
    ...overrides,
  };
}

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    accountId: ACCOUNT_ID,
    date: new Date('2024-01-15'),
    description: 'Coffee shop purchase',
    amount: 550, // $5.50
    currency: 'CAD',
    sourceType: 'MANUAL',
    sourceId: null,
    categoryId: null,
    notes: null,
    journalEntryId: null,
    isStaged: false,
    isSplit: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    deletedAt: null,
    importBatchId: null,
    account: {
      id: ACCOUNT_ID,
      name: 'Business Checking',
    },
    ...overrides,
  };
}

function mockMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'match-1',
    bankFeedTransactionId: 'bft-1',
    transactionId: 'txn-1',
    journalEntryId: null,
    status: 'MATCHED',
    confidence: 1.0,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    bankFeedTransaction: mockBankFeedTxn(),
    transaction: mockTransaction(),
    ...overrides,
  };
}

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new ReconciliationService(TENANT_ID, USER_ID);
    // Default: description similarity returns high score
    vi.mocked(compareTwoStrings).mockReturnValue(0.95);
  });

  // ─── suggestMatches ──────────────────────────────────────────────────────

  describe('suggestMatches', () => {
    it('should return empty array when no candidates match', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

      const result = await service.suggestMatches('bft-1');

      expect(result).toEqual([]);
    });

    it('should throw if bank feed transaction not found', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(null);

      await expect(service.suggestMatches('bft-nonexistent')).rejects.toThrow(
        'Bank feed transaction not found'
      );
    });

    it('should throw if bank feed transaction is already matched', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(
        mockMatch()
      );

      await expect(service.suggestMatches('bft-1')).rejects.toThrow(
        'Bank feed transaction is already matched'
      );
    });

    it('should return HIGH confidence for exact amount + close date + similar description', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        mockTransaction(),
      ]);
      vi.mocked(compareTwoStrings).mockReturnValue(0.95);

      const result = await service.suggestMatches('bft-1');

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBeGreaterThanOrEqual(0.80);
      expect(result[0].transactionId).toBe('txn-1');
    });

    it('should return MEDIUM confidence for exact amount + close date without description match', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        mockTransaction(),
      ]);
      // Low description similarity
      vi.mocked(compareTwoStrings).mockReturnValue(0.30);

      const result = await service.suggestMatches('bft-1');

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.80); // 0.40 amount + 0.40 date
    });

    it('should return lower confidence for exact amount + far date', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);

      // Transaction 5 days away
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        mockTransaction({ date: new Date('2024-01-20') }),
      ]);
      vi.mocked(compareTwoStrings).mockReturnValue(0.30);

      const result = await service.suggestMatches('bft-1');

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.60); // 0.40 amount + 0.20 far date
    });

    it('should skip candidates with different amounts', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);

      // Different amount
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        mockTransaction({ amount: 999 }),
      ]);

      const result = await service.suggestMatches('bft-1');

      expect(result).toEqual([]);
    });

    it('should exclude already-matched transactions', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      // Return matched transaction IDs to exclude
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([
        { transactionId: 'txn-already-matched' },
      ]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

      await service.suggestMatches('bft-1');

      // Verify findMany was called with notIn filter
      const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('id', { notIn: ['txn-already-matched'] });
    });

    it('should sort suggestions by confidence DESC and limit to 5', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);

      // Create 7 candidates with varying dates (all same amount)
      const candidates = Array.from({ length: 7 }, (_, i) =>
        mockTransaction({
          id: `txn-${i}`,
          date: new Date(2024, 0, 15 + i), // spread across days
        })
      );
      mockPrisma.transaction.findMany.mockResolvedValueOnce(candidates);
      vi.mocked(compareTwoStrings).mockReturnValue(0.50); // Below threshold

      const result = await service.suggestMatches('bft-1');

      expect(result.length).toBeLessThanOrEqual(5);
      // Verify sorted by confidence DESC
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
      }
    });

    it('should respect custom limit parameter', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);

      const candidates = Array.from({ length: 5 }, (_, i) =>
        mockTransaction({ id: `txn-${i}` })
      );
      mockPrisma.transaction.findMany.mockResolvedValueOnce(candidates);
      vi.mocked(compareTwoStrings).mockReturnValue(0.95);

      const result = await service.suggestMatches('bft-1', 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should include reasons in suggestions', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);
      mockPrisma.transactionMatch.findMany.mockResolvedValueOnce([]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        mockTransaction(),
      ]);
      vi.mocked(compareTwoStrings).mockReturnValue(0.95);

      const result = await service.suggestMatches('bft-1');

      expect(result[0].reasons).toContain('Exact amount match');
      expect(result[0].reasons).toContain('Same date');
      expect(result[0].reasons).toContain('Description near-identical');
    });
  });

  // ─── createMatch ─────────────────────────────────────────────────────────

  describe('createMatch', () => {
    it('should create a match between bank feed and posted transaction', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(
        mockTransaction()
      );
      // No existing match
      mockPrisma.transactionMatch.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const createdMatch = mockMatch();
      mockPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
        return fn({
          transactionMatch: { create: vi.fn().mockResolvedValue(createdMatch) },
          bankFeedTransaction: { update: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.createMatch({
        bankFeedTransactionId: 'bft-1',
        transactionId: 'txn-1',
      });

      expect(result).toEqual(createdMatch);
    });

    it('should throw if bank feed transaction not found', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-nonexistent',
          transactionId: 'txn-1',
        })
      ).rejects.toThrow('Bank feed transaction not found');
    });

    it('should throw if posted transaction not found', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-nonexistent',
        })
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw if bank feed transaction is already matched', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(
        mockTransaction()
      );
      // Already matched
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(
        mockMatch()
      );

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        })
      ).rejects.toThrow('Bank feed transaction is already matched');
    });

    it('should throw if posted transaction is already matched to another bank feed', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(
        mockTransaction()
      );
      // First check: bank feed not matched
      mockPrisma.transactionMatch.findFirst
        .mockResolvedValueOnce(null)
        // Second check: posted transaction IS matched
        .mockResolvedValueOnce(mockMatch({ bankFeedTransactionId: 'bft-other' }));

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        })
      ).rejects.toThrow('Transaction is already matched');
    });

    it('should set confidence to 1.0 for manual matches', async () => {
      mockPrisma.bankFeedTransaction.findFirst.mockResolvedValueOnce(
        mockBankFeedTxn()
      );
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(
        mockTransaction()
      );
      mockPrisma.transactionMatch.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let capturedCreateData: Record<string, unknown> | undefined;
      mockPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
        return fn({
          transactionMatch: {
            create: vi.fn().mockImplementation((args: any) => {
              capturedCreateData = args.data;
              return mockMatch();
            }),
          },
          bankFeedTransaction: { update: vi.fn().mockResolvedValue({}) },
        });
      });

      await service.createMatch({
        bankFeedTransactionId: 'bft-1',
        transactionId: 'txn-1',
      });

      expect(capturedCreateData?.confidence).toBe(1.0);
    });
  });

  // ─── unmatch ─────────────────────────────────────────────────────────────

  describe('unmatch', () => {
    it('should delete match and reset bank feed status', async () => {
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce({
        id: 'match-1',
        bankFeedTransactionId: 'bft-1',
        transactionId: 'txn-1',
        bankFeedTransaction: {
          account: { entityId: ENTITY_ID },
        },
      });

      const mockDelete = vi.fn();
      const mockUpdate = vi.fn();
      mockPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
        return fn({
          transactionMatch: { delete: mockDelete },
          bankFeedTransaction: { update: mockUpdate },
        });
      });

      await service.unmatch('match-1');

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'match-1' } });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'bft-1' },
        data: { status: 'PENDING' },
      });
    });

    it('should throw if match not found', async () => {
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);

      await expect(service.unmatch('match-nonexistent')).rejects.toThrow(
        'Match not found'
      );
    });

    it('should enforce tenant isolation when finding match', async () => {
      mockPrisma.transactionMatch.findFirst.mockResolvedValueOnce(null);

      await expect(service.unmatch('match-other-tenant')).rejects.toThrow(
        'Match not found'
      );

      // Verify tenant filter was applied
      const callArgs = mockPrisma.transactionMatch.findFirst.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('bankFeedTransaction');
    });
  });

  // ─── getReconciliationStatus ─────────────────────────────────────────────

  describe('getReconciliationStatus', () => {
    it('should return reconciliation status for an account', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({
        id: ACCOUNT_ID,
      });

      mockPrisma.bankFeedTransaction.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60); // matched
      mockPrisma.transactionMatch.count.mockResolvedValueOnce(10); // suggested

      const result = await service.getReconciliationStatus(ACCOUNT_ID);

      expect(result).toEqual({
        accountId: ACCOUNT_ID,
        totalBankFeed: 100,
        matched: 60,
        unmatched: 40,
        suggested: 10,
        reconciliationPercent: 60,
      });
    });

    it('should return 100% when no bank feed transactions exist', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({
        id: ACCOUNT_ID,
      });

      mockPrisma.bankFeedTransaction.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.transactionMatch.count.mockResolvedValueOnce(0);

      const result = await service.getReconciliationStatus(ACCOUNT_ID);

      expect(result.reconciliationPercent).toBe(100);
      expect(result.totalBankFeed).toBe(0);
    });

    it('should throw if account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      await expect(service.getReconciliationStatus('acc-nonexistent')).rejects.toThrow(
        'Account not found'
      );
    });

    it('should enforce tenant isolation on account lookup', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      await expect(service.getReconciliationStatus(ACCOUNT_ID)).rejects.toThrow(
        'Account not found'
      );

      // Verify tenant filter
      const callArgs = mockPrisma.account.findFirst.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('entity', { tenantId: TENANT_ID });
    });

    it('should calculate correct reconciliation percentage', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({
        id: ACCOUNT_ID,
      });

      mockPrisma.bankFeedTransaction.count
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(1); // matched
      mockPrisma.transactionMatch.count.mockResolvedValueOnce(0);

      const result = await service.getReconciliationStatus(ACCOUNT_ID);

      expect(result.reconciliationPercent).toBe(33); // Math.round(1/3 * 100)
    });
  });
});
