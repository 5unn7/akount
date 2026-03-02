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
const mockFXRateFindFirst = vi.fn();
const mockGLFindMany = vi.fn();
const mockSplitFindMany = vi.fn();
const mockSplitUpdate = vi.fn();

const txClient = {
  transaction: {
    findFirst: mockTxnFindFirst,
    findMany: mockTxnFindMany,
    update: mockTxnUpdate,
  },
  gLAccount: { findFirst: mockGLFindFirst, findMany: mockGLFindMany },
  journalEntry: { create: mockJECreate, findFirst: mockJEFindFirst },
  fiscalPeriod: { findFirst: mockFiscalPeriodFindFirst },
  fXRate: { findFirst: mockFXRateFindFirst },
  transactionSplit: { findMany: mockSplitFindMany, update: mockSplitUpdate },
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
    entity: { functionalCurrency: 'CAD' },
  },
};

const MOCK_GL_ACCOUNT = {
  id: GL_EXPENSE,
  entityId: ENTITY_ID,
  isActive: true,
  code: '5000',
  name: 'Expenses',
};

// @ts-expect-error vitest supports top-level await
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
    // Default: no FX rate (same-currency transactions don't need it)
    mockFXRateFindFirst.mockResolvedValue(null);
    // Default: empty splits
    mockSplitFindMany.mockResolvedValue([]);
    mockSplitUpdate.mockResolvedValue({});
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

  // ==========================================================================
  // Multi-Currency Posting
  // ==========================================================================

  describe('postTransaction (multi-currency)', () => {
    const USD_TRANSACTION = {
      ...MOCK_TRANSACTION,
      id: 'txn-usd',
      currency: 'USD',
      amount: -1000, // $10.00 USD outflow
      account: {
        ...MOCK_TRANSACTION.account,
        entity: { functionalCurrency: 'CAD' },
      },
    };

    it('should post USD transaction in CAD entity with FX conversion', async () => {
      mockTxnFindFirst.mockResolvedValue(USD_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockFXRateFindFirst.mockResolvedValue({ rate: 1.35 }); // 1 USD = 1.35 CAD
      mockJECreate.mockResolvedValue({
        id: 'je-fx', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      const result = await service.postTransaction('txn-usd', GL_EXPENSE);

      expect(result.journalEntryId).toBe('je-fx');
      expect(result.amount).toBe(1000);

      // Verify journal lines include FX data
      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;

      // Outflow: DR expense, CR bank
      expect(lines[0].currency).toBe('USD');
      expect(lines[0].exchangeRate).toBe(1.35);
      expect(lines[0].baseCurrencyDebit).toBe(1350); // 1000 * 1.35
      expect(lines[0].baseCurrencyCredit).toBe(0);

      expect(lines[1].currency).toBe('USD');
      expect(lines[1].exchangeRate).toBe(1.35);
      expect(lines[1].baseCurrencyDebit).toBe(0);
      expect(lines[1].baseCurrencyCredit).toBe(1350);
    });

    it('should use nearest-date FX rate (Saturday uses Friday rate)', async () => {
      const saturdayTxn = {
        ...USD_TRANSACTION,
        date: new Date('2026-01-17'), // Saturday
      };
      mockTxnFindFirst.mockResolvedValue(saturdayTxn);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      // findFirst with date lte and orderBy desc returns Friday's rate
      mockFXRateFindFirst.mockResolvedValue({ rate: 1.34 });
      mockJECreate.mockResolvedValue({
        id: 'je-sat', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postTransaction('txn-usd', GL_EXPENSE);

      // Verify the FX query used lte date
      expect(mockFXRateFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            base: 'USD',
            quote: 'CAD',
            date: { lte: saturdayTxn.date },
          }),
          orderBy: { date: 'desc' },
        })
      );
    });

    it('should reject when no FX rate found', async () => {
      mockTxnFindFirst.mockResolvedValue(USD_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockFXRateFindFirst.mockResolvedValue(null); // No rate available

      await expect(
        service.postTransaction('txn-usd', GL_EXPENSE)
      ).rejects.toThrow('No FX rate found');
    });

    it('should accept manual exchange rate override', async () => {
      mockTxnFindFirst.mockResolvedValue(USD_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockJECreate.mockResolvedValue({
        id: 'je-manual-fx', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postTransaction('txn-usd', GL_EXPENSE, 1.40);

      // Should NOT query FXRate table when override is provided
      expect(mockFXRateFindFirst).not.toHaveBeenCalled();

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines[0].exchangeRate).toBe(1.40);
      expect(lines[0].baseCurrencyDebit).toBe(1400); // 1000 * 1.40
    });

    it('should store FX rate as immutable on journal line', async () => {
      mockTxnFindFirst.mockResolvedValue(USD_TRANSACTION);
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockFXRateFindFirst.mockResolvedValue({ rate: 1.35 });
      mockJECreate.mockResolvedValue({
        id: 'je-immutable', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postTransaction('txn-usd', GL_EXPENSE);

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      // Both lines store the same immutable rate
      expect(lines[0].exchangeRate).toBe(1.35);
      expect(lines[1].exchangeRate).toBe(1.35);
    });

    it('should not set FX fields for same-currency transactions', async () => {
      // CAD transaction in CAD entity — no FX needed
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION); // currency: 'CAD', entity.functionalCurrency: 'CAD'
      mockGLFindFirst.mockResolvedValue(MOCK_GL_ACCOUNT);
      mockJECreate.mockResolvedValue({
        id: 'je-same', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postTransaction('txn-1', GL_EXPENSE);

      // Should NOT query FXRate
      expect(mockFXRateFindFirst).not.toHaveBeenCalled();

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines[0].currency).toBeUndefined();
      expect(lines[0].exchangeRate).toBeUndefined();
      expect(lines[0].baseCurrencyDebit).toBeUndefined();
    });

    it('should post inflow with correct FX conversion', async () => {
      const inflowUSD = {
        ...USD_TRANSACTION,
        id: 'txn-usd-in',
        amount: 2000, // $20.00 USD inflow
      };
      mockTxnFindFirst.mockResolvedValue(inflowUSD);
      mockGLFindFirst.mockResolvedValue({ ...MOCK_GL_ACCOUNT, id: 'gl-income', name: 'Income' });
      mockFXRateFindFirst.mockResolvedValue({ rate: 1.35 });
      mockJECreate.mockResolvedValue({
        id: 'je-inflow-fx', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      const result = await service.postTransaction('txn-usd-in', 'gl-income');

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      // Inflow: DR bank, CR income
      expect(lines[0].glAccountId).toBe(GL_BANK);
      expect(lines[0].baseCurrencyDebit).toBe(2700); // 2000 * 1.35
      expect(lines[1].baseCurrencyCredit).toBe(2700);
    });
  });

  // ==========================================================================
  // Split Transaction Posting
  // ==========================================================================

  describe('postSplitTransaction', () => {
    it('should post 2-way split (3-line journal entry)', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION); // -500 outflow
      mockGLFindMany.mockResolvedValue([{ id: 'gl-food' }, { id: 'gl-transport' }]);
      mockSplitFindMany.mockResolvedValue([{ id: 'split-1' }, { id: 'split-2' }]);
      mockJECreate.mockResolvedValue({
        id: 'je-split', entryNumber: 'JE-001', status: 'POSTED',
        journalLines: [
          { id: 'jl-1', glAccountId: 'gl-food', debitAmount: 300, creditAmount: 0 },
          { id: 'jl-2', glAccountId: 'gl-transport', debitAmount: 200, creditAmount: 0 },
          { id: 'jl-3', glAccountId: GL_BANK, debitAmount: 0, creditAmount: 500 },
        ],
      });

      const result = await service.postSplitTransaction('txn-1', [
        { glAccountId: 'gl-food', amount: 300 },
        { glAccountId: 'gl-transport', amount: 200 },
      ]);

      expect(result.journalEntryId).toBe('je-split');
      expect(result.splitCount).toBe(2);
      expect(result.amount).toBe(500);

      // Verify 3 lines created: 2 splits + 1 bank
      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines).toHaveLength(3);

      // Outflow: DR category lines, CR bank
      expect(lines[0].glAccountId).toBe('gl-food');
      expect(lines[0].debitAmount).toBe(300);
      expect(lines[1].glAccountId).toBe('gl-transport');
      expect(lines[1].debitAmount).toBe(200);
      expect(lines[2].glAccountId).toBe(GL_BANK);
      expect(lines[2].creditAmount).toBe(500);
    });

    it('should post 3-way split (4-line journal entry)', async () => {
      const txn600 = { ...MOCK_TRANSACTION, amount: -600 };
      mockTxnFindFirst.mockResolvedValue(txn600);
      mockGLFindMany.mockResolvedValue([{ id: 'gl-a' }, { id: 'gl-b' }, { id: 'gl-c' }]);
      mockSplitFindMany.mockResolvedValue([{ id: 's1' }, { id: 's2' }, { id: 's3' }]);
      mockJECreate.mockResolvedValue({
        id: 'je-3way', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      const result = await service.postSplitTransaction('txn-1', [
        { glAccountId: 'gl-a', amount: 200 },
        { glAccountId: 'gl-b', amount: 200 },
        { glAccountId: 'gl-c', amount: 200 },
      ]);

      expect(result.splitCount).toBe(3);

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines).toHaveLength(4); // 3 splits + 1 bank
    });

    it('should reject if split amounts do not sum to transaction amount', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION); // -500

      await expect(
        service.postSplitTransaction('txn-1', [
          { glAccountId: 'gl-food', amount: 300 },
          { glAccountId: 'gl-transport', amount: 100 }, // 300+100=400 ≠ 500
        ])
      ).rejects.toThrow('Split amounts');
    });

    it('should reject cross-entity split GL accounts', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      // Only 1 of 2 GL accounts found in same entity
      mockGLFindMany.mockResolvedValue([{ id: 'gl-food' }]);

      await expect(
        service.postSplitTransaction('txn-1', [
          { glAccountId: 'gl-food', amount: 300 },
          { glAccountId: 'gl-other-entity', amount: 200 },
        ])
      ).rejects.toThrow('different entity');
    });

    it('should reject if transaction already posted', async () => {
      mockTxnFindFirst.mockResolvedValue({
        ...MOCK_TRANSACTION,
        journalEntryId: 'je-existing',
      });

      await expect(
        service.postSplitTransaction('txn-1', [
          { glAccountId: 'gl-food', amount: 300 },
          { glAccountId: 'gl-transport', amount: 200 },
        ])
      ).rejects.toThrow('already posted');
    });

    it('should reject if bank account not mapped', async () => {
      const unmapped = {
        ...MOCK_TRANSACTION,
        account: { ...MOCK_TRANSACTION.account, glAccountId: null },
      };
      mockTxnFindFirst.mockResolvedValue(unmapped);

      await expect(
        service.postSplitTransaction('txn-1', [
          { glAccountId: 'gl-food', amount: 300 },
          { glAccountId: 'gl-transport', amount: 200 },
        ])
      ).rejects.toThrow('not mapped');
    });

    it('should persist glAccountId on TransactionSplit records', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindMany.mockResolvedValue([{ id: 'gl-food' }, { id: 'gl-transport' }]);
      mockSplitFindMany.mockResolvedValue([{ id: 'split-1' }, { id: 'split-2' }]);
      mockJECreate.mockResolvedValue({
        id: 'je-split', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postSplitTransaction('txn-1', [
        { glAccountId: 'gl-food', amount: 300 },
        { glAccountId: 'gl-transport', amount: 200 },
      ]);

      // Verify splits updated with glAccountId
      expect(mockSplitUpdate).toHaveBeenCalledTimes(2);
      expect(mockSplitUpdate).toHaveBeenCalledWith({
        where: { id: 'split-1' },
        data: { glAccountId: 'gl-food' },
      });
      expect(mockSplitUpdate).toHaveBeenCalledWith({
        where: { id: 'split-2' },
        data: { glAccountId: 'gl-transport' },
      });
    });

    it('should handle split with multi-currency (FX conversion)', async () => {
      const usdTxn = {
        ...MOCK_TRANSACTION,
        currency: 'USD',
        amount: -1000,
        account: {
          ...MOCK_TRANSACTION.account,
          entity: { functionalCurrency: 'CAD' },
        },
      };
      mockTxnFindFirst.mockResolvedValue(usdTxn);
      mockGLFindMany.mockResolvedValue([{ id: 'gl-food' }, { id: 'gl-transport' }]);
      mockFXRateFindFirst.mockResolvedValue({ rate: 1.35 });
      mockSplitFindMany.mockResolvedValue([{ id: 'split-1' }, { id: 'split-2' }]);
      mockJECreate.mockResolvedValue({
        id: 'je-fx-split', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postSplitTransaction('txn-1', [
        { glAccountId: 'gl-food', amount: 700 },
        { glAccountId: 'gl-transport', amount: 300 },
      ]);

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;

      // Split lines should have FX data
      expect(lines[0].currency).toBe('USD');
      expect(lines[0].exchangeRate).toBe(1.35);
      expect(lines[0].baseCurrencyDebit).toBe(945); // 700 * 1.35 = 945

      expect(lines[1].currency).toBe('USD');
      expect(lines[1].baseCurrencyDebit).toBe(405); // 300 * 1.35 = 405

      // Bank line should have total base amount
      const bankLine = lines[2];
      expect(bankLine.baseCurrencyCredit).toBe(1350); // 945 + 405 = 1350
    });

    it('should handle rounding remainder in multi-currency splits', async () => {
      const usdTxn = {
        ...MOCK_TRANSACTION,
        currency: 'USD',
        amount: -999, // Odd amount that causes rounding
        account: {
          ...MOCK_TRANSACTION.account,
          entity: { functionalCurrency: 'CAD' },
        },
      };
      mockTxnFindFirst.mockResolvedValue(usdTxn);
      mockGLFindMany.mockResolvedValue([{ id: 'gl-a' }, { id: 'gl-b' }, { id: 'gl-c' }]);
      mockFXRateFindFirst.mockResolvedValue({ rate: 1.333 }); // Rate that causes rounding
      mockSplitFindMany.mockResolvedValue([{ id: 's1' }, { id: 's2' }, { id: 's3' }]);
      mockJECreate.mockResolvedValue({
        id: 'je-round', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postSplitTransaction('txn-1', [
        { glAccountId: 'gl-a', amount: 333 },
        { glAccountId: 'gl-b', amount: 333 },
        { glAccountId: 'gl-c', amount: 333 },
      ]);

      const createCall = mockJECreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;

      // Sum of base debit amounts should equal base transaction total
      const baseTotal = Math.round(999 * 1.333); // 1332
      const splitBaseSum = lines[0].baseCurrencyDebit + lines[1].baseCurrencyDebit + lines[2].baseCurrencyDebit;
      expect(splitBaseSum).toBe(baseTotal);

      // Bank line should match
      expect(lines[3].baseCurrencyCredit).toBe(baseTotal);
    });

    it('should link transaction to journal entry after split posting', async () => {
      mockTxnFindFirst.mockResolvedValue(MOCK_TRANSACTION);
      mockGLFindMany.mockResolvedValue([{ id: 'gl-food' }, { id: 'gl-transport' }]);
      mockSplitFindMany.mockResolvedValue([{ id: 'split-1' }, { id: 'split-2' }]);
      mockJECreate.mockResolvedValue({
        id: 'je-link', entryNumber: 'JE-001', status: 'POSTED', journalLines: [],
      });

      await service.postSplitTransaction('txn-1', [
        { glAccountId: 'gl-food', amount: 300 },
        { glAccountId: 'gl-transport', amount: 200 },
      ]);

      expect(mockTxnUpdate).toHaveBeenCalledWith({
        where: { id: 'txn-1' },
        data: { journalEntryId: 'je-link' },
      });
    });
  });
});
