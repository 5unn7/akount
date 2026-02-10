import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReconciliationService } from '../reconciliation.service';

vi.mock('@akount/db', () => ({
  prisma: {
    bankFeedTransaction: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    transaction: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    transactionMatch: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  TransactionMatchStatus: {
    MATCHED: 'MATCHED',
    SUGGESTED: 'SUGGESTED',
    UNMATCHED: 'UNMATCHED',
  },
  BankFeedStatus: {
    PENDING: 'PENDING',
    POSTED: 'POSTED',
    CANCELLED: 'CANCELLED',
  },
}));

vi.mock('../../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('string-similarity', () => ({
  compareTwoStrings: vi.fn(),
}));

import { prisma } from '@akount/db';
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
    service = new ReconciliationService(TENANT_ID, USER_ID);
    // Default: description similarity returns high score
    vi.mocked(compareTwoStrings).mockReturnValue(0.95);
  });

  // ─── suggestMatches ──────────────────────────────────────────────────────

  describe('suggestMatches', () => {
    it('should return empty array when no candidates match', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      const result = await service.suggestMatches('bft-1');

      expect(result).toEqual([]);
    });

    it('should throw if bank feed transaction not found', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.suggestMatches('bft-nonexistent')).rejects.toThrow(
        'Bank feed transaction not found'
      );
    });

    it('should throw if bank feed transaction is already matched', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(
        mockMatch() as never
      );

      await expect(service.suggestMatches('bft-1')).rejects.toThrow(
        'Bank feed transaction is already matched'
      );
    });

    it('should return HIGH confidence for exact amount + close date + similar description', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
        mockTransaction(),
      ] as never);
      vi.mocked(compareTwoStrings).mockReturnValue(0.95);

      const result = await service.suggestMatches('bft-1');

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBeGreaterThanOrEqual(0.80);
      expect(result[0].transactionId).toBe('txn-1');
    });

    it('should return MEDIUM confidence for exact amount + close date without description match', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
        mockTransaction(),
      ] as never);
      // Low description similarity
      vi.mocked(compareTwoStrings).mockReturnValue(0.30);

      const result = await service.suggestMatches('bft-1');

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.80); // 0.40 amount + 0.40 date
    });

    it('should return lower confidence for exact amount + far date', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);

      // Transaction 5 days away
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
        mockTransaction({ date: new Date('2024-01-20') }),
      ] as never);
      vi.mocked(compareTwoStrings).mockReturnValue(0.30);

      const result = await service.suggestMatches('bft-1');

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.60); // 0.40 amount + 0.20 far date
    });

    it('should skip candidates with different amounts', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);

      // Different amount
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
        mockTransaction({ amount: 999 }),
      ] as never);

      const result = await service.suggestMatches('bft-1');

      expect(result).toEqual([]);
    });

    it('should exclude already-matched transactions', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      // Return matched transaction IDs to exclude
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([
        { transactionId: 'txn-already-matched' },
      ] as never);
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.suggestMatches('bft-1');

      // Verify findMany was called with notIn filter
      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('id', { notIn: ['txn-already-matched'] });
    });

    it('should sort suggestions by confidence DESC and limit to 5', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);

      // Create 7 candidates with varying dates (all same amount)
      const candidates = Array.from({ length: 7 }, (_, i) =>
        mockTransaction({
          id: `txn-${i}`,
          date: new Date(2024, 0, 15 + i), // spread across days
        })
      );
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce(candidates as never);
      vi.mocked(compareTwoStrings).mockReturnValue(0.50); // Below threshold

      const result = await service.suggestMatches('bft-1');

      expect(result.length).toBeLessThanOrEqual(5);
      // Verify sorted by confidence DESC
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
      }
    });

    it('should respect custom limit parameter', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);

      const candidates = Array.from({ length: 5 }, (_, i) =>
        mockTransaction({ id: `txn-${i}` })
      );
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce(candidates as never);
      vi.mocked(compareTwoStrings).mockReturnValue(0.95);

      const result = await service.suggestMatches('bft-1', 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should include reasons in suggestions', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(prisma.transactionMatch.findMany).mockResolvedValueOnce([] as never);
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
        mockTransaction(),
      ] as never);
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
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(
        mockTransaction() as never
      );
      // No existing match
      vi.mocked(prisma.transactionMatch.findFirst)
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce(null as never);

      const createdMatch = mockMatch();
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
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
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-nonexistent',
          transactionId: 'txn-1',
        })
      ).rejects.toThrow('Bank feed transaction not found');
    });

    it('should throw if posted transaction not found', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-nonexistent',
        })
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw if bank feed transaction is already matched', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(
        mockTransaction() as never
      );
      // Already matched
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(
        mockMatch() as never
      );

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        })
      ).rejects.toThrow('Bank feed transaction is already matched');
    });

    it('should throw if posted transaction is already matched to another bank feed', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(
        mockTransaction() as never
      );
      // First check: bank feed not matched
      vi.mocked(prisma.transactionMatch.findFirst)
        .mockResolvedValueOnce(null as never)
        // Second check: posted transaction IS matched
        .mockResolvedValueOnce(mockMatch({ bankFeedTransactionId: 'bft-other' }) as never);

      await expect(
        service.createMatch({
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        })
      ).rejects.toThrow('Transaction is already matched');
    });

    it('should set confidence to 1.0 for manual matches', async () => {
      vi.mocked(prisma.bankFeedTransaction.findFirst).mockResolvedValueOnce(
        mockBankFeedTxn() as never
      );
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(
        mockTransaction() as never
      );
      vi.mocked(prisma.transactionMatch.findFirst)
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce(null as never);

      let capturedCreateData: Record<string, unknown> | undefined;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
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
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce({
        id: 'match-1',
        bankFeedTransactionId: 'bft-1',
        transactionId: 'txn-1',
        bankFeedTransaction: {
          account: { entityId: ENTITY_ID },
        },
      } as never);

      const mockDelete = vi.fn();
      const mockUpdate = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
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
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.unmatch('match-nonexistent')).rejects.toThrow(
        'Match not found'
      );
    });

    it('should enforce tenant isolation when finding match', async () => {
      vi.mocked(prisma.transactionMatch.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.unmatch('match-other-tenant')).rejects.toThrow(
        'Match not found'
      );

      // Verify tenant filter was applied
      const callArgs = vi.mocked(prisma.transactionMatch.findFirst).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('bankFeedTransaction');
    });
  });

  // ─── getReconciliationStatus ─────────────────────────────────────────────

  describe('getReconciliationStatus', () => {
    it('should return reconciliation status for an account', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: ACCOUNT_ID,
      } as never);

      vi.mocked(prisma.bankFeedTransaction.count)
        .mockResolvedValueOnce(100 as never) // total
        .mockResolvedValueOnce(60 as never); // matched
      vi.mocked(prisma.transactionMatch.count).mockResolvedValueOnce(10 as never); // suggested

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
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: ACCOUNT_ID,
      } as never);

      vi.mocked(prisma.bankFeedTransaction.count)
        .mockResolvedValueOnce(0 as never)
        .mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.transactionMatch.count).mockResolvedValueOnce(0 as never);

      const result = await service.getReconciliationStatus(ACCOUNT_ID);

      expect(result.reconciliationPercent).toBe(100);
      expect(result.totalBankFeed).toBe(0);
    });

    it('should throw if account not found', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.getReconciliationStatus('acc-nonexistent')).rejects.toThrow(
        'Account not found'
      );
    });

    it('should enforce tenant isolation on account lookup', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.getReconciliationStatus(ACCOUNT_ID)).rejects.toThrow(
        'Account not found'
      );

      // Verify tenant filter
      const callArgs = vi.mocked(prisma.account.findFirst).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('entity', { tenantId: TENANT_ID });
    });

    it('should calculate correct reconciliation percentage', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        id: ACCOUNT_ID,
      } as never);

      vi.mocked(prisma.bankFeedTransaction.count)
        .mockResolvedValueOnce(3 as never) // total
        .mockResolvedValueOnce(1 as never); // matched
      vi.mocked(prisma.transactionMatch.count).mockResolvedValueOnce(0 as never);

      const result = await service.getReconciliationStatus(ACCOUNT_ID);

      expect(result.reconciliationPercent).toBe(33); // Math.round(1/3 * 100)
    });
  });
});
