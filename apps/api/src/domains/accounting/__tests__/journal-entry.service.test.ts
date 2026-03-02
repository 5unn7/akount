import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountingError } from '../errors';
import { TENANT_ID, USER_ID, ENTITY_ID, OTHER_ENTITY_ID } from './helpers';

// Mock Prisma
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

const mockGLAccountFindMany = vi.fn();
const mockFiscalPeriodFindFirst = vi.fn();
const mockEntityFindFirst = vi.fn();

// Transaction client mirrors for $transaction
const txClient = {
  journalEntry: { findFirst: mockFindFirst, findMany: mockFindMany, create: mockCreate, update: mockUpdate },
  gLAccount: { findMany: mockGLAccountFindMany },
  fiscalPeriod: { findFirst: mockFiscalPeriodFindFirst },
  entity: { findFirst: mockEntityFindFirst },
};

vi.mock('@akount/db', () => ({
  prisma: {
    journalEntry: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    gLAccount: { findMany: (...args: any[]) => mockGLAccountFindMany(...args) },
    fiscalPeriod: { findFirst: (...args: any[]) => mockFiscalPeriodFindFirst(...args) },
    entity: { findFirst: (...args: any[]) => mockEntityFindFirst(...args) },
    $transaction: vi.fn(async (fn: any) => fn(txClient)),
  },
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
    JsonNull: null,
  },
}));

vi.mock('../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

const GL_ACCOUNT_1 = 'gl-acct-cash';
const GL_ACCOUNT_2 = 'gl-acct-revenue';

const MOCK_ENTRY = {
  id: 'je-1',
  entityId: ENTITY_ID,
  entryNumber: 'JE-001',
  date: new Date('2026-01-15'),
  memo: 'Test entry',
  sourceType: null,
  sourceId: null,
  sourceDocument: null,
  linkedEntryId: null,
  status: 'DRAFT',
  createdBy: USER_ID,
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  journalLines: [
    { id: 'jl-1', glAccountId: GL_ACCOUNT_1, debitAmount: 1000, creditAmount: 0, memo: null, glAccount: { id: GL_ACCOUNT_1, code: '1000', name: 'Cash', type: 'ASSET' } },
    { id: 'jl-2', glAccountId: GL_ACCOUNT_2, debitAmount: 0, creditAmount: 1000, memo: null, glAccount: { id: GL_ACCOUNT_2, code: '4000', name: 'Revenue', type: 'INCOME' } },
  ],
};

// Dynamic import to apply mocks
// @ts-expect-error vitest supports top-level await
const { JournalEntryService } = await import('../services/journal-entry.service');

describe('JournalEntryService', () => {
  let service: InstanceType<typeof JournalEntryService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JournalEntryService(TENANT_ID, USER_ID, 'OWNER');

    // Default mock: entity exists
    mockEntityFindFirst.mockResolvedValue({ id: ENTITY_ID });
    // Default: no fiscal period blocking
    mockFiscalPeriodFindFirst.mockResolvedValue(null);
  });

  // ==========================================================================
  // listEntries
  // ==========================================================================

  describe('listEntries', () => {
    it('should list entries with tenant filter and cursor pagination', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'je-1', entityId: ENTITY_ID, entryNumber: 'JE-001',
          date: new Date(), memo: 'Test', sourceType: null, status: 'DRAFT',
          createdBy: USER_ID, createdAt: new Date(),
          _count: { journalLines: 2 },
          journalLines: [{ debitAmount: 1000 }, { debitAmount: 0 }],
        },
      ]);

      const result = await service.listEntries({ entityId: ENTITY_ID, limit: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].lineCount).toBe(2);
      expect(result.items[0].totalAmount).toBe(1000);
      expect(result.nextCursor).toBeNull();
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      await expect(
        service.listEntries({ entityId: OTHER_ENTITY_ID, limit: 50 })
      ).rejects.toThrow(AccountingError);
    });
  });

  // ==========================================================================
  // getEntry
  // ==========================================================================

  describe('getEntry', () => {
    it('should return entry with lines and GL account details', async () => {
      mockFindFirst.mockResolvedValue(MOCK_ENTRY);

      const result = await service.getEntry('je-1');
      expect(result.id).toBe('je-1');
      expect(result.journalLines).toHaveLength(2);
    });

    it('should throw when not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(service.getEntry('nonexistent')).rejects.toThrow(AccountingError);
    });
  });

  // ==========================================================================
  // createEntry
  // ==========================================================================

  describe('createEntry', () => {
    const validInput = {
      entityId: ENTITY_ID,
      date: '2026-01-15T00:00:00.000Z',
      memo: 'Test journal entry',
      lines: [
        { glAccountId: GL_ACCOUNT_1, debitAmount: 1000, creditAmount: 0 },
        { glAccountId: GL_ACCOUNT_2, debitAmount: 0, creditAmount: 1000 },
      ],
    };

    it('should create a balanced DRAFT entry', async () => {
      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }, { id: GL_ACCOUNT_2 }]);
      mockFindFirst.mockResolvedValue(null); // No existing entry for number generation
      mockCreate.mockResolvedValue(MOCK_ENTRY);

      const result = await service.createEntry(validInput);
      expect(result.status).toBe('DRAFT');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should reject unbalanced entry (defense-in-depth)', async () => {
      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }, { id: GL_ACCOUNT_2 }]);

      const unbalanced = {
        ...validInput,
        lines: [
          { glAccountId: GL_ACCOUNT_1, debitAmount: 1000, creditAmount: 0 },
          { glAccountId: GL_ACCOUNT_2, debitAmount: 0, creditAmount: 500 },
        ],
      };

      await expect(service.createEntry(unbalanced)).rejects.toThrow('not balanced');
    });

    it('should reject cross-entity GL account references (IDOR)', async () => {
      // Only 1 of 2 GL accounts found (other belongs to different entity)
      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }]);

      await expect(service.createEntry(validInput)).rejects.toThrow(AccountingError);

      try {
        await service.createEntry(validInput);
      } catch (e: any) {
        expect(e.code).toBe('CROSS_ENTITY_REFERENCE');
      }
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      await expect(service.createEntry(validInput)).rejects.toThrow(AccountingError);
    });

    it('should reject posting to CLOSED fiscal period', async () => {
      mockFiscalPeriodFindFirst.mockResolvedValue({
        id: 'fp-1', name: 'January 2026', status: 'CLOSED',
      });

      await expect(service.createEntry(validInput)).rejects.toThrow('fiscal period');
    });

    it('should generate sequential entry numbers', async () => {
      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }, { id: GL_ACCOUNT_2 }]);
      mockFindFirst.mockResolvedValue({ entryNumber: 'JE-005' }); // Last entry
      mockCreate.mockResolvedValue({ ...MOCK_ENTRY, entryNumber: 'JE-006' });

      await service.createEntry(validInput);

      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.entryNumber).toBe('JE-006');
    });
  });

  // ==========================================================================
  // approveEntry
  // ==========================================================================

  describe('approveEntry', () => {
    it('should approve DRAFT entry (DRAFT → POSTED)', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, date: new Date(), status: 'DRAFT', createdBy: 'other-user',
      });
      mockUpdate.mockResolvedValue({ ...MOCK_ENTRY, status: 'POSTED' });

      const result = await service.approveEntry('je-1');
      expect(result.status).toBe('POSTED');
    });

    it('should reject approving already POSTED entry', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, date: new Date(), status: 'POSTED', createdBy: 'other-user',
      });

      await expect(service.approveEntry('je-1')).rejects.toThrow('DRAFT');

      try {
        await service.approveEntry('je-1');
      } catch (e: any) {
        expect(e.code).toBe('ALREADY_POSTED');
      }
    });

    it('should enforce separation of duties (creator cannot approve, non-OWNER)', async () => {
      const nonOwnerService = new JournalEntryService(TENANT_ID, USER_ID, 'ADMIN');
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, date: new Date(), status: 'DRAFT', createdBy: USER_ID,
      });

      await expect(nonOwnerService.approveEntry('je-1')).rejects.toThrow('Creator cannot approve');
    });

    it('should allow OWNER to approve own entry (solo business exception)', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, date: new Date(), status: 'DRAFT', createdBy: USER_ID,
      });
      mockUpdate.mockResolvedValue({ ...MOCK_ENTRY, status: 'POSTED' });

      // Service created with OWNER role
      const result = await service.approveEntry('je-1');
      expect(result.status).toBe('POSTED');
    });

    it('should reject approval to CLOSED fiscal period', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, date: new Date('2026-01-15'), status: 'DRAFT', createdBy: 'other-user',
      });
      mockFiscalPeriodFindFirst.mockResolvedValue({
        id: 'fp-1', name: 'January 2026', status: 'LOCKED',
      });

      await expect(service.approveEntry('je-1')).rejects.toThrow('fiscal period');
    });
  });

  // ==========================================================================
  // voidEntry
  // ==========================================================================

  describe('voidEntry', () => {
    it('should void POSTED entry by creating reversing entry', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, entryNumber: 'JE-001',
        date: new Date(), memo: 'Original', status: 'POSTED',
        linkedFrom: [],
        journalLines: [
          { glAccountId: GL_ACCOUNT_1, debitAmount: 1000, creditAmount: 0, memo: 'Cash in' },
          { glAccountId: GL_ACCOUNT_2, debitAmount: 0, creditAmount: 1000, memo: 'Revenue' },
        ],
      });
      // For entry number generation
      mockFindFirst.mockResolvedValueOnce({
        id: 'je-1', entityId: ENTITY_ID, entryNumber: 'JE-001',
        date: new Date(), memo: 'Original', status: 'POSTED',
        linkedFrom: [],
        journalLines: [
          { glAccountId: GL_ACCOUNT_1, debitAmount: 1000, creditAmount: 0, memo: 'Cash in' },
          { glAccountId: GL_ACCOUNT_2, debitAmount: 0, creditAmount: 1000, memo: 'Revenue' },
        ],
      });
      mockCreate.mockResolvedValue({ id: 'je-reversal' });

      const result = await service.voidEntry('je-1');
      expect(result.voidedEntryId).toBe('je-1');
      expect(result.reversalEntryId).toBe('je-reversal');

      // Verify reversing entry swaps debit/credit
      const createCall = mockCreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines[0].debitAmount).toBe(0);    // Was 1000 (swapped)
      expect(lines[0].creditAmount).toBe(1000); // Was 0 (swapped)
      expect(lines[1].debitAmount).toBe(1000);  // Was 0 (swapped)
      expect(lines[1].creditAmount).toBe(0);    // Was 1000 (swapped)
    });

    it('should reject voiding already VOIDED entry', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, status: 'VOIDED',
        linkedFrom: [], journalLines: [],
      });

      await expect(service.voidEntry('je-1')).rejects.toThrow('already voided');
    });

    it('should reject voiding DRAFT entry', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, status: 'DRAFT',
        linkedFrom: [], journalLines: [],
      });

      await expect(service.voidEntry('je-1')).rejects.toThrow('Only POSTED');
    });

    it('should reject double-void (entry already has reversal)', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'je-1', entityId: ENTITY_ID, status: 'POSTED',
        linkedFrom: [{ id: 'je-reversal-existing' }], // Already reversed
        journalLines: [],
      });

      await expect(service.voidEntry('je-1')).rejects.toThrow('already has a reversal');
    });
  });

  // ==========================================================================
  // deleteEntry
  // ==========================================================================

  describe('deleteEntry', () => {
    it('should soft-delete DRAFT entry', async () => {
      mockFindFirst.mockResolvedValue({ id: 'je-1', entityId: ENTITY_ID, status: 'DRAFT' });
      mockUpdate.mockResolvedValue({});

      const result = await service.deleteEntry('je-1');
      expect(result.deleted).toBe(true);
    });

    it('should reject deleting POSTED entry', async () => {
      mockFindFirst.mockResolvedValue({ id: 'je-1', entityId: ENTITY_ID, status: 'POSTED' });

      await expect(service.deleteEntry('je-1')).rejects.toThrow('void');

      try {
        await service.deleteEntry('je-1');
      } catch (e: any) {
        expect(e.code).toBe('IMMUTABLE_POSTED_ENTRY');
      }
    });

    it('should reject deleting VOIDED entry', async () => {
      mockFindFirst.mockResolvedValue({ id: 'je-1', entityId: ENTITY_ID, status: 'VOIDED' });

      await expect(service.deleteEntry('je-1')).rejects.toThrow('void');
    });

    it('should throw when entry not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(service.deleteEntry('nonexistent')).rejects.toThrow(AccountingError);
    });
  });

  // ==========================================================================
  // Multi-Currency Journal Entry Creation
  // ==========================================================================

  describe('createEntry (multi-currency)', () => {
    const multiCurrencyInput = {
      entityId: ENTITY_ID,
      date: '2026-01-15T00:00:00.000Z',
      memo: 'USD invoice payment',
      lines: [
        {
          glAccountId: GL_ACCOUNT_1,
          debitAmount: 1000,
          creditAmount: 0,
          currency: 'USD',
          exchangeRate: 1.35,
          baseCurrencyDebit: 1350,
          baseCurrencyCredit: 0,
        },
        {
          glAccountId: GL_ACCOUNT_2,
          debitAmount: 0,
          creditAmount: 1000,
          currency: 'USD',
          exchangeRate: 1.35,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: 1350,
        },
      ],
    };

    it('should create entry with multi-currency fields', async () => {
      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }, { id: GL_ACCOUNT_2 }]);
      mockFindFirst.mockResolvedValue(null); // No existing entry for number generation
      mockCreate.mockResolvedValue({ ...MOCK_ENTRY, status: 'DRAFT' });

      const result = await service.createEntry(multiCurrencyInput);
      expect(result.status).toBe('DRAFT');

      // Verify multi-currency fields passed to Prisma create
      const createCall = mockCreate.mock.calls[0][0];
      const lines = createCall.data.journalLines.create;
      expect(lines[0].currency).toBe('USD');
      expect(lines[0].exchangeRate).toBe(1.35);
      expect(lines[0].baseCurrencyDebit).toBe(1350);
      expect(lines[1].baseCurrencyCredit).toBe(1350);
    });

    it('should reject unbalanced base currency amounts', async () => {
      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }, { id: GL_ACCOUNT_2 }]);

      const unbalancedBase = {
        ...multiCurrencyInput,
        lines: [
          {
            glAccountId: GL_ACCOUNT_1,
            debitAmount: 1000,
            creditAmount: 0,
            currency: 'USD',
            exchangeRate: 1.35,
            baseCurrencyDebit: 1350,
            baseCurrencyCredit: 0,
          },
          {
            glAccountId: GL_ACCOUNT_2,
            debitAmount: 0,
            creditAmount: 1000,
            currency: 'USD',
            exchangeRate: 1.30, // Different rate!
            baseCurrencyDebit: 0,
            baseCurrencyCredit: 1300, // 1350 ≠ 1300
          },
        ],
      };

      await expect(service.createEntry(unbalancedBase)).rejects.toThrow('not balanced');
    });

    it('should skip base currency check for same-currency entries', async () => {
      const sameCurrencyInput = {
        entityId: ENTITY_ID,
        date: '2026-01-15T00:00:00.000Z',
        memo: 'CAD entry',
        lines: [
          { glAccountId: GL_ACCOUNT_1, debitAmount: 1000, creditAmount: 0 },
          { glAccountId: GL_ACCOUNT_2, debitAmount: 0, creditAmount: 1000 },
        ],
      };

      mockGLAccountFindMany.mockResolvedValue([{ id: GL_ACCOUNT_1 }, { id: GL_ACCOUNT_2 }]);
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue(MOCK_ENTRY);

      // Should not throw — no currency field means no base currency check
      const result = await service.createEntry(sameCurrencyInput);
      expect(result).toBeDefined();
    });
  });
});
