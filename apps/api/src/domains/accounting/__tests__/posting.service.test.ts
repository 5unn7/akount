import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountingError } from '../errors';
import { TENANT_ID, USER_ID, ENTITY_ID } from './helpers';

// Mock Prisma
const mockTxnFindFirst = vi.fn();
const mockTxnFindMany = vi.fn();
const mockTxnUpdate = vi.fn();
const mockGLFindFirst = vi.fn();
const mockJECreate = vi.fn();
const mockJEFindFirst = vi.fn();
const mockFiscalPeriodFindFirst = vi.fn();

const txClient = {
  transaction: {
    findFirst: mockTxnFindFirst,
    findMany: mockTxnFindMany,
    update: mockTxnUpdate,
  },
  gLAccount: { findFirst: mockGLFindFirst },
  journalEntry: { create: mockJECreate, findFirst: mockJEFindFirst },
  fiscalPeriod: { findFirst: mockFiscalPeriodFindFirst },
};

vi.mock('@akount/db', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: any) => fn(txClient)),
  },
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
  },
}));

vi.mock('../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

const GL_EXPENSE = 'gl-expense';
const GL_BANK = 'gl-bank';

const MOCK_TRANSACTION = {
  id: 'txn-1',
  date: new Date('2026-01-15'),
  description: 'Coffee shop',
  amount: -500, // $5.00 outflow
  currency: 'CAD',
  journalEntryId: null,
  accountId: 'acct-1',
  account: {
    id: 'acct-1',
    name: 'Business Checking',
    entityId: ENTITY_ID,
    glAccountId: GL_BANK,
  },
};

const MOCK_GL_ACCOUNT = {
  id: GL_EXPENSE,
  entityId: ENTITY_ID,
  isActive: true,
  code: '5000',
  name: 'Expenses',
};

const { PostingService } = await import('../services/posting.service');

describe('PostingService', () => {
  let service: InstanceType<typeof PostingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PostingService(TENANT_ID, USER_ID);

    // Default: no fiscal period blocking
    mockFiscalPeriodFindFirst.mockResolvedValue(null);
    // Default: no existing entry for number generation
    mockJEFindFirst.mockResolvedValue(null);
  });

  // ==========================================================================
  // postTransaction
  // ==========================================================================

  describe('postTransaction', () => {
    it('should post outflow transaction (DR expense, CR bank)', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockJECreate.mockResolvedValue({
        id: 'je-1', entryNumber: 'JE-001', status: 'POSTED',
        journalLines: [
          { id: 'jl-1', glAccountId: GL_EXPENSE, debitAmount: 500, creditAmount: 0 },
          { id: 'jl-2', glAccountId: GL_BANK, debitAmount: 0, creditAmount: 500 },
        ],
      });

      const result = await service.postTransaction('txn-1', GL_EXPENSE);

      expect(result.journalEntryId).toBe('je-1');
      expect(result.amount).toBe(500);

      // Verify journal lines: outflow → DR expense, CR bank
      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines[0].glAccountId).toBe(GL_EXPENSE);
      expect(lines[0].debitAmount).toBe(500);
      expect(lines[1].glAccountId).toBe(GL_BANK);
      expect(lines[1].creditAmount).toBe(500);
    });

    it('should post inflow transaction (DR bank, CR income)', async () => {
      const inflowTxn = { ...MOCK_TRANSACTION, id: 'txn-2', amount: 2000, description: 'Payment received' };
      mockTxnFindFirst.mockResolvedValue(inflowTxn);
      mockGLFindFirst.mockResolvedValue({ ...MOCK_GL_ACCOUNT, id: 'gl-income', name: 'Income' });
      mockJECreate.mockResolvedValue({
        id: 'je-2', entryNumber: 'JE-001', status: 'POSTED',
        journalLines: [
          { id: 'jl-1', glAccountId: GL_BANK, debitAmount: 2000, creditAmount: 0 },
          { id: 'jl-2', glAccountId: 'gl-income', debitAmount: 0, creditAmount: 2000 },
        ],
      });

      const result = await service.postTransaction('txn-2', 'gl-income');

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      // Inflow → DR bank, CR income
      expect(lines[0].glAccountId).toBe(GL_BANK);
      expect(lines[0].debitAmount).toBe(2000);
      expect(lines[1].glAccountId).toBe('gl-income');
      expect(lines[1].creditAmount).toBe(2000);
    });

    it('should reject already posted transaction', async () => {
      mockTxnFindFirst.mockResolvedValue({ ...MOCK_TRANSACTION, journalEntryId: 'je-existing' });

      await expect(service.postTransaction('txn-1', GL_EXPENSE)).rejects.toThrow('already posted');
    });

    it('should reject if transaction not found', async () => {
      mockTxnFindFirst.mockResolvedValue(null);

      await expect(service.postTransaction('nonexistent', GL_EXPENSE)).rejects.toThrow(AccountingError);
    });

    it('should reject if bank account has no GL mapping', async () => {
      const unmapped = { ...MOCK_TRANSACTION, account: { ...MOCK_TRANSACTION.account, glAccountId: null } };
      mockTxnFindFirst.mockResolvedValue(unmapped);

      await expect(service.postTransaction('txn-1', GL_EXPENSE)).rejects.toThrow('not mapped');
    });

    it('should reject if target GL account not found', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(null);

      await expect(service.postTransaction('txn-1', 'nonexistent')).rejects.toThrow(AccountingError);
    });

    it('should reject if target GL account is inactive', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue({ ...MOCK_GL_ACCOUNT, isActive: false });

      await expect(service.postTransaction('txn-1', GL_EXPENSE)).rejects.toThrow('inactive');
    });

    it('should reject cross-entity posting', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue({ ...MOCK_GL_ACCOUNT, entityId: 'other-entity' });

      await expect(service.postTransaction('txn-1', GL_EXPENSE)).rejects.toThrow('different entities');
    });

    it('should reject posting to CLOSED fiscal period', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockFiscalPeriodFindFirst.mockResolvedValue({
        id: 'fp-1', name: 'January 2026', status: 'CLOSED',
      });

      await expect(service.postTransaction('txn-1', GL_EXPENSE)).rejects.toThrow('fiscal period');
    });

    it('should set sourceType to BANK_FEED and capture source document', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockJECreate.mockResolvedValue({
        id: 'je-1', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postTransaction('txn-1', GL_EXPENSE);

      const createCall = mockJECreate.mock.calls[0][0];
      expect(createCall.data.sourceType).toBe('BANK_FEED');
      expect(createCall.data.sourceId).toBe('txn-1');
      expect(createCall.data.sourceDocument.id).toBe('txn-1');
      expect(createCall.data.sourceDocument.amount).toBe(-500);
      expect(createCall.data.sourceDocument.capturedAt).toBeDefined();
    });

    it('should link transaction to journal entry after posting', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockJECreate.mockResolvedValue({
        id: 'je-1', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postTransaction('txn-1', GL_EXPENSE);

      expect(mockTxnUpdate).toHaveBeenCalledWith({
        where: { id: 'txn-1' },
        data: { journalEntryId: 'je-1' },
      });
    });
  });

  // ==========================================================================
  // postBulkTransactions
  // ==========================================================================

  describe('postBulkTransactions', () => {
    it('should post multiple transactions', async () => {
      const txn2 = { ...MOCK_TRANSACTION, id: 'txn-2', amount: -300 };
      mockTxnFindMany.mockResolvedValue([MOCK_TRANSACTION, txn2]);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockJECreate
        .mockResolvedValueOnce({ id: 'je-1', entryNumber: 'JE-001' })
        .mockResolvedValueOnce({ id: 'je-2', entryNumber: 'JE-002' });
      mockJEFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ entryNumber: 'JE-001' });

      const result = await service.postBulkTransactions(['txn-1', 'txn-2'], GL_EXPENSE);

      expect(result.posted).toBe(2);
      expect(result.entries).toHaveLength(2);
    });

    it('should reject if some transactions not found', async () => {
      mockTxnFindMany.mockResolvedValue([MOCK_TRANSACTION]); // Only 1 of 2 found

      await expect(
        service.postBulkTransactions(['txn-1', 'txn-missing'], GL_EXPENSE)
      ).rejects.toThrow('not found');
    });

    it('should reject if target GL account not found', async () => {
      mockTxnFindMany.mockResolvedValue([MOCK_TRANSACTION]);
      mockGLFindFirst.mockResolvedValue(null);

      await expect(
        service.postBulkTransactions(['txn-1'], 'nonexistent')
      ).rejects.toThrow(AccountingError);
    });

    it('should reject cross-entity bulk posting', async () => {
      const crossEntityTxn = {
        ...MOCK_TRANSACTION, id: 'txn-cross',
        account: { ...MOCK_TRANSACTION.account, entityId: 'other-entity' },
      };
      mockTxnFindMany.mockResolvedValue([crossEntityTxn]);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);

      await expect(
        service.postBulkTransactions(['txn-cross'], GL_EXPENSE)
      ).rejects.toThrow('different entity');
    });

    it('should reject if bank accounts not mapped', async () => {
      const unmapped = {
        ...MOCK_TRANSACTION,
        account: { ...MOCK_TRANSACTION.account, glAccountId: null },
      };
      mockTxnFindMany.mockResolvedValue([unmapped]);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);

      await expect(
        service.postBulkTransactions(['txn-1'], GL_EXPENSE)
      ).rejects.toThrow('not mapped');
    });
  });
});
