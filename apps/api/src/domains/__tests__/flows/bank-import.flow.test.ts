/**
 * Bank Import Flow Tests
 *
 * Tests the full CSV import workflow:
 * CSV upload → parse → duplicate detection → transaction creation → auto-categorize
 *
 * Strategy: Mock Prisma + parser/duplication services at module level,
 * import REAL ImportService, verify flow behavior and error handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertIntegerCents } from '../../../test-utils/financial-assertions';

// ─────────────────────────────────────────────────────────────────
// Mock Variables (hoisted)
// ─────────────────────────────────────────────────────────────────

const {
  mockAccountFindFirst,
  mockImportBatchCreate,
  mockImportBatchUpdate,
  mockTransactionCreateMany,
  mockTransactionFindMany,
  mockTransactionUpdateMany,
  mockParseCSV,
  mockFindDuplicates,
  mockFindInternalDuplicates,
  mockCategorizeTransactions,
} = vi.hoisted(() => ({
  mockAccountFindFirst: vi.fn(),
  mockImportBatchCreate: vi.fn(),
  mockImportBatchUpdate: vi.fn(),
  mockTransactionCreateMany: vi.fn(),
  mockTransactionFindMany: vi.fn(),
  mockTransactionUpdateMany: vi.fn(),
  mockParseCSV: vi.fn(),
  mockFindDuplicates: vi.fn(),
  mockFindInternalDuplicates: vi.fn(),
  mockCategorizeTransactions: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    account: {
      findFirst: (...args: unknown[]) => mockAccountFindFirst(...args),
    },
    importBatch: {
      create: (...args: unknown[]) => mockImportBatchCreate(...args),
      update: (...args: unknown[]) => mockImportBatchUpdate(...args),
    },
    transaction: {
      createMany: (...args: unknown[]) => mockTransactionCreateMany(...args),
      findMany: (...args: unknown[]) => mockTransactionFindMany(...args),
      updateMany: (...args: unknown[]) => mockTransactionUpdateMany(...args),
    },
  },
  Prisma: {},
}));

vi.mock('../../banking/services/parser.service', () => ({
  parseCSV: (...args: unknown[]) => mockParseCSV(...args),
  parsePDF: vi.fn(),
  parseXLSX: vi.fn(),
}));

vi.mock('../../banking/services/duplication.service', () => ({
  findDuplicates: (...args: unknown[]) => mockFindDuplicates(...args),
  findInternalDuplicates: (...args: unknown[]) => mockFindInternalDuplicates(...args),
}));

vi.mock('../../ai/services/categorization.service', () => ({
  categorizeTransactions: (...args: unknown[]) => mockCategorizeTransactions(...args),
}));

// Mock logger
vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Mock CategoryService
vi.mock('../../banking/services/category.service', () => ({
  CategoryService: vi.fn().mockImplementation(() => ({
    categorize: vi.fn().mockResolvedValue([]),
  })),
}));

import { ImportService } from '../../banking/services/import.service';

// ─────────────────────────────────────────────────────────────────
// Shared Constants
// ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-import-123';
const ENTITY_ID = 'entity-import-456';
const ACCOUNT_ID = 'account-import-789';
const BATCH_ID = 'batch-import-111';

function makeAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: ACCOUNT_ID,
    entityId: ENTITY_ID,
    name: 'Business Checking',
    type: 'CHECKING',
    currency: 'USD',
    deletedAt: null,
    entity: { id: ENTITY_ID, tenantId: TENANT_ID },
    ...overrides,
  };
}

function makeParsedTransactions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    tempId: `txn-temp-${i}`,
    date: '2024-06-15',
    description: `Transaction ${i}`,
    amount: (i + 1) * 1000, // Integer cents
    reference: `REF-${i}`,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Bank Import Flow', () => {
  let importService: ImportService;

  beforeEach(() => {
    vi.resetAllMocks();
    importService = new ImportService(TENANT_ID);

    // Default: account exists and belongs to tenant
    mockAccountFindFirst.mockResolvedValue(makeAccount());

    // Default: import batch creation succeeds
    mockImportBatchCreate.mockResolvedValue({
      id: BATCH_ID,
      tenantId: TENANT_ID,
      entityId: ENTITY_ID,
      sourceType: 'CSV',
      status: 'PROCESSING',
      createdAt: new Date(),
    });

    // Default: batch update succeeds
    mockImportBatchUpdate.mockResolvedValue({
      id: BATCH_ID,
      status: 'PROCESSED',
    });

    // Default: transaction creation succeeds
    mockTransactionCreateMany.mockResolvedValue({ count: 3 });

    // Default: no internal duplicates
    mockFindInternalDuplicates.mockReturnValue(new Map());

    // Default: no external duplicates
    mockFindDuplicates.mockResolvedValue([]);

    // Default: categorize returns empty
    mockCategorizeTransactions.mockResolvedValue([]);

    // Default: transaction findMany for auto-categorize
    mockTransactionFindMany.mockResolvedValue([]);
    mockTransactionUpdateMany.mockResolvedValue({ count: 0 });
  });

  // ────────────────────────────────────────────────────────────
  // Account Ownership Validation
  // ────────────────────────────────────────────────────────────

  describe('Account Ownership', () => {
    it('should validate account belongs to tenant before import', async () => {
      mockAccountFindFirst.mockResolvedValueOnce(null); // Not found

      await expect(
        importService.createCSVImport({
          file: Buffer.from('date,description,amount\n2024-06-15,Test,1000'),
          accountId: 'other-account',
        })
      ).rejects.toThrow('Account not found or access denied');
    });

    it('should accept account belonging to tenant', async () => {
      const transactions = makeParsedTransactions(2);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      const result = await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(result.status).toBe('PROCESSED');
      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.entityId).toBe(ENTITY_ID);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Import Batch Status Progression
  // ────────────────────────────────────────────────────────────

  describe('Batch Status Progression', () => {
    it('should create batch with PROCESSING status initially', async () => {
      const transactions = makeParsedTransactions(3);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      // First call to importBatch.create should have status PROCESSING
      expect(mockImportBatchCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PROCESSING',
            tenantId: TENANT_ID,
            entityId: ENTITY_ID,
            sourceType: 'CSV',
          }),
        })
      );
    });

    it('should update batch to PROCESSED on success', async () => {
      const transactions = makeParsedTransactions(3);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      const result = await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(result.status).toBe('PROCESSED');
      expect(mockImportBatchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BATCH_ID },
          data: expect.objectContaining({ status: 'PROCESSED' }),
        })
      );
    });

    it('should update batch to FAILED when CSV has no valid transactions', async () => {
      mockParseCSV.mockReturnValueOnce({ transactions: [], warnings: [] });

      const result = await importService.createCSVImport({
        file: Buffer.from('empty-csv'),
        accountId: ACCOUNT_ID,
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('CSV file contains no valid transactions');
      expect(result.stats.total).toBe(0);
      expect(result.stats.imported).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Duplicate Detection
  // ────────────────────────────────────────────────────────────

  describe('Duplicate Detection', () => {
    it('should exclude internal duplicates from import', async () => {
      const transactions = makeParsedTransactions(5);

      // Mark txn-temp-2 and txn-temp-4 as internal duplicates
      const internalDups = new Map<string, string[]>();
      internalDups.set('dup-group-1', ['txn-temp-2']);
      internalDups.set('dup-group-2', ['txn-temp-4']);

      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });
      mockFindInternalDuplicates.mockReturnValueOnce(internalDups);

      const result = await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(result.stats.total).toBe(5);
      // 2 internal dups removed, 3 remain, all unique against DB
      expect(result.stats.duplicates).toBe(2);
      expect(result.stats.imported).toBe(3);
    });

    it('should exclude external duplicates (already in DB)', async () => {
      const transactions = makeParsedTransactions(3);

      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      // Mock: txn-temp-1 is already in DB
      mockFindDuplicates.mockResolvedValueOnce([
        { tempId: 'txn-temp-0', isDuplicate: false },
        { tempId: 'txn-temp-1', isDuplicate: true, existingId: 'existing-txn-1' },
        { tempId: 'txn-temp-2', isDuplicate: false },
      ]);

      const result = await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(result.stats.total).toBe(3);
      expect(result.stats.duplicates).toBe(1);
      expect(result.stats.imported).toBe(2);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Transaction Creation
  // ────────────────────────────────────────────────────────────

  describe('Transaction Creation', () => {
    it('should store all amounts as integer cents', async () => {
      const transactions = makeParsedTransactions(2);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(mockTransactionCreateMany).toHaveBeenCalled();
      const createCall = mockTransactionCreateMany.mock.calls[0][0];
      for (const txnData of createCall.data) {
        assertIntegerCents(txnData.amount);
      }
    });

    it('should set sourceType to BANK_FEED for CSV imports', async () => {
      const transactions = makeParsedTransactions(1);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(mockTransactionCreateMany).toHaveBeenCalled();
      const createCall = mockTransactionCreateMany.mock.calls[0][0];
      expect(createCall.data[0].sourceType).toBe('BANK_FEED');
    });

    it('should link transactions to import batch', async () => {
      const transactions = makeParsedTransactions(2);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(mockTransactionCreateMany).toHaveBeenCalled();
      const createCall = mockTransactionCreateMany.mock.calls[0][0];
      for (const txnData of createCall.data) {
        expect(txnData.importBatchId).toBe(BATCH_ID);
        expect(txnData.accountId).toBe(ACCOUNT_ID);
      }
    });

    it('should flip amount sign for credit card accounts', async () => {
      // Credit card account
      mockAccountFindFirst.mockResolvedValueOnce(
        makeAccount({ type: 'CREDIT_CARD' })
      );

      const transactions = [
        { tempId: 'txn-1', date: '2024-06-15', description: 'Charge', amount: 5000 },
      ];
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(mockTransactionCreateMany).toHaveBeenCalled();
      const createCall = mockTransactionCreateMany.mock.calls[0][0];
      // Positive amount on credit card should be negated
      expect(createCall.data[0].amount).toBe(-5000);
    });

    it('should not create transactions when all are duplicates', async () => {
      const transactions = makeParsedTransactions(2);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      // All are external duplicates
      mockFindDuplicates.mockResolvedValueOnce([
        { tempId: 'txn-temp-0', isDuplicate: true },
        { tempId: 'txn-temp-1', isDuplicate: true },
      ]);

      const result = await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      // Should not call createMany when nothing to import
      expect(mockTransactionCreateMany).not.toHaveBeenCalled();
      expect(result.stats.imported).toBe(0);
      expect(result.stats.duplicates).toBe(2);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Financial Invariants
  // ────────────────────────────────────────────────────────────

  describe('Financial Invariants', () => {
    it('should maintain tenant isolation on account lookup', async () => {
      const transactions = makeParsedTransactions(1);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      // Verify account.findFirst filters by tenantId
      expect(mockAccountFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: ACCOUNT_ID,
            deletedAt: null,
            entity: expect.objectContaining({
              tenantId: TENANT_ID,
            }),
          }),
        })
      );
    });

    it('should set tenantId on import batch', async () => {
      const transactions = makeParsedTransactions(1);
      mockParseCSV.mockReturnValueOnce({ transactions, warnings: [] });

      const result = await importService.createCSVImport({
        file: Buffer.from('csv-data'),
        accountId: ACCOUNT_ID,
      });

      expect(result.tenantId).toBe(TENANT_ID);
      expect(mockImportBatchCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
          }),
        })
      );
    });
  });
});
