import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportService } from '../import.service';
import type { ParsedTransaction } from '../../../../schemas/import';

// Mock dependencies
vi.mock('@akount/db', () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
    },
    importBatch: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('../parser.service', () => ({
  parseCSV: vi.fn(),
  parsePDF: vi.fn(),
}));

vi.mock('../duplication.service', () => ({
  findDuplicates: vi.fn(),
  findInternalDuplicates: vi.fn(),
}));

import { prisma } from '@akount/db';
import { parseCSV, parsePDF } from '../parser.service';
import { findDuplicates, findInternalDuplicates } from '../duplication.service';

const TENANT_ID = 'tenant-abc-123';
const ACCOUNT_ID = 'acc-xyz-789';
const ENTITY_ID = 'entity-123';
const IMPORT_BATCH_ID = 'batch-123';

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: ACCOUNT_ID,
    name: 'Business Checking',
    type: 'BANK',
    currency: 'CAD',
    entityId: ENTITY_ID,
    entity: {
      id: ENTITY_ID,
      tenantId: TENANT_ID,
    },
    deletedAt: null,
    ...overrides,
  };
}

function mockImportBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: IMPORT_BATCH_ID,
    tenantId: TENANT_ID,
    entityId: ENTITY_ID,
    sourceType: 'CSV',
    status: 'PROCESSING',
    error: null,
    createdAt: new Date('2024-01-15'),
    ...overrides,
  };
}

function mockParsedTransaction(overrides: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    tempId: `temp-${Math.random()}`,
    date: '2024-01-15',
    description: 'Coffee shop',
    amount: 550, // $5.50 in cents
    isDuplicate: false,
    ...overrides,
  };
}

function mockDuplicateResult(tempId: string, isDuplicate: boolean) {
  return {
    tempId,
    isDuplicate,
    duplicateConfidence: isDuplicate ? 95 : 0,
    matchedTransactionId: isDuplicate ? 'existing-txn-123' : undefined,
    matchReason: isDuplicate ? 'Exact amount, same date' : undefined,
  };
}

describe('ImportService', () => {
  let service: ImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImportService(TENANT_ID);
    // Default: no internal duplicates
    vi.mocked(findInternalDuplicates).mockReturnValue(new Map());
  });

  describe('createCSVImport', () => {
    const csvBuffer = Buffer.from('date,description,amount\n2024-01-15,Coffee,5.50');

    it('should create import batch and transactions from CSV', async () => {
      // Mock account lookup
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);

      // Mock import batch creation
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(mockImportBatch() as never);

      // Mock CSV parsing
      const parsedTxns = [
        mockParsedTransaction({ tempId: 'temp-1', amount: 550 }),
        mockParsedTransaction({ tempId: 'temp-2', amount: 1200 }),
      ];
      vi.mocked(parseCSV).mockReturnValueOnce({
        transactions: parsedTxns,
        columns: ['date', 'description', 'amount'],
      });

      // Mock duplicate detection (no duplicates)
      vi.mocked(findDuplicates).mockResolvedValueOnce([
        mockDuplicateResult('temp-1', false),
        mockDuplicateResult('temp-2', false),
      ]);

      // Mock transaction creation
      vi.mocked(prisma.transaction.createMany).mockResolvedValueOnce({ count: 2 } as never);

      // Mock batch update
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'PROCESSED' }) as never
      );

      const result = await service.createCSVImport({
        file: csvBuffer,
        accountId: ACCOUNT_ID,
      });

      // Verify account was checked
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          id: ACCOUNT_ID,
          deletedAt: null,
          entity: { tenantId: TENANT_ID },
        },
        include: { entity: true },
      });

      // Verify CSV was parsed
      expect(parseCSV).toHaveBeenCalledWith(csvBuffer, undefined, undefined);

      // Verify duplicates were checked
      expect(findDuplicates).toHaveBeenCalledWith(parsedTxns, ACCOUNT_ID);

      // Verify transactions were created
      expect(prisma.transaction.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            accountId: ACCOUNT_ID,
            amount: 550,
            currency: 'CAD',
            sourceType: 'BANK_FEED',
            importBatchId: IMPORT_BATCH_ID,
          }),
          expect.objectContaining({
            accountId: ACCOUNT_ID,
            amount: 1200,
            currency: 'CAD',
            sourceType: 'BANK_FEED',
            importBatchId: IMPORT_BATCH_ID,
          }),
        ]),
      });

      // Verify batch was updated to PROCESSED
      expect(prisma.importBatch.update).toHaveBeenCalledWith({
        where: { id: IMPORT_BATCH_ID },
        data: { status: 'PROCESSED' },
      });

      // Verify result
      expect(result).toEqual({
        id: IMPORT_BATCH_ID,
        tenantId: TENANT_ID,
        entityId: ENTITY_ID,
        sourceType: 'CSV',
        status: 'PROCESSED',
        error: null,
        createdAt: expect.any(Date),
        stats: {
          total: 2,
          imported: 2,
          duplicates: 0,
          skipped: 0,
        },
      });
    });

    it('should throw error if account not found (tenant isolation)', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null);

      await expect(
        service.createCSVImport({
          file: csvBuffer,
          accountId: ACCOUNT_ID,
        })
      ).rejects.toThrow('Account not found or access denied');
    });

    it('should handle empty CSV file (0 transactions)', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(mockImportBatch() as never);
      vi.mocked(parseCSV).mockReturnValueOnce({
        transactions: [],
        columns: ['date', 'description', 'amount'],
      });
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'FAILED', error: 'CSV file contains no valid transactions' }) as never
      );

      const result = await service.createCSVImport({
        file: csvBuffer,
        accountId: ACCOUNT_ID,
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('CSV file contains no valid transactions');
      expect(result.stats.total).toBe(0);
      expect(result.stats.imported).toBe(0);
    });

    it('should skip duplicate transactions', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(mockImportBatch() as never);

      const parsedTxns = [
        mockParsedTransaction({ tempId: 'temp-1', amount: 550 }),
        mockParsedTransaction({ tempId: 'temp-2', amount: 1200 }), // duplicate
        mockParsedTransaction({ tempId: 'temp-3', amount: 800 }),
      ];
      vi.mocked(parseCSV).mockReturnValueOnce({
        transactions: parsedTxns,
        columns: [],
      });

      // temp-2 is a duplicate
      vi.mocked(findDuplicates).mockResolvedValueOnce([
        mockDuplicateResult('temp-1', false),
        mockDuplicateResult('temp-2', true), // Duplicate!
        mockDuplicateResult('temp-3', false),
      ]);

      vi.mocked(prisma.transaction.createMany).mockResolvedValueOnce({ count: 2 } as never);
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'PROCESSED' }) as never
      );

      const result = await service.createCSVImport({
        file: csvBuffer,
        accountId: ACCOUNT_ID,
      });

      // Should only create 2 transactions (temp-1 and temp-3)
      expect(prisma.transaction.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ amount: 550 }),
          expect.objectContaining({ amount: 800 }),
        ]),
      });

      expect(result.stats.total).toBe(3);
      expect(result.stats.imported).toBe(2);
      expect(result.stats.duplicates).toBe(1);
    });

    it('should handle all transactions being duplicates', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(mockImportBatch() as never);

      const parsedTxns = [
        mockParsedTransaction({ tempId: 'temp-1', amount: 550 }),
        mockParsedTransaction({ tempId: 'temp-2', amount: 1200 }),
      ];
      vi.mocked(parseCSV).mockReturnValueOnce({
        transactions: parsedTxns,
        columns: [],
      });

      // All are duplicates
      vi.mocked(findDuplicates).mockResolvedValueOnce([
        mockDuplicateResult('temp-1', true),
        mockDuplicateResult('temp-2', true),
      ]);

      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'PROCESSED' }) as never
      );

      const result = await service.createCSVImport({
        file: csvBuffer,
        accountId: ACCOUNT_ID,
      });

      // Should not call createMany if all are duplicates
      expect(prisma.transaction.createMany).not.toHaveBeenCalled();

      expect(result.stats.total).toBe(2);
      expect(result.stats.imported).toBe(0);
      expect(result.stats.duplicates).toBe(2);
    });

    it('should handle CSV parsing errors', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(mockImportBatch() as never);
      vi.mocked(parseCSV).mockImplementation(() => {
        throw new Error('Invalid CSV format');
      });
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'FAILED', error: 'Invalid CSV format' }) as never
      );

      await expect(
        service.createCSVImport({
          file: csvBuffer,
          accountId: ACCOUNT_ID,
        })
      ).rejects.toThrow('Invalid CSV format');

      // Verify batch was updated to FAILED
      expect(prisma.importBatch.update).toHaveBeenCalledWith({
        where: { id: IMPORT_BATCH_ID },
        data: {
          status: 'FAILED',
          error: 'Invalid CSV format',
        },
      });
    });
  });

  describe('createPDFImport', () => {
    const pdfBuffer = Buffer.from('fake-pdf-content');

    it('should create import batch and transactions from PDF', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(
        mockImportBatch({ sourceType: 'PDF' }) as never
      );

      const parsedTxns = [mockParsedTransaction({ tempId: 'temp-1', amount: 550 })];
      vi.mocked(parsePDF).mockResolvedValueOnce({
        transactions: parsedTxns,
      });

      vi.mocked(findDuplicates).mockResolvedValueOnce([mockDuplicateResult('temp-1', false)]);
      vi.mocked(prisma.transaction.createMany).mockResolvedValueOnce({ count: 1 } as never);
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'PROCESSED' }) as never
      );

      const result = await service.createPDFImport({
        file: pdfBuffer,
        accountId: ACCOUNT_ID,
      });

      expect(parsePDF).toHaveBeenCalledWith(pdfBuffer, undefined);
      expect(result.sourceType).toBe('PDF');
      expect(result.status).toBe('PROCESSED');
      expect(result.stats.total).toBe(1);
      expect(result.stats.imported).toBe(1);
    });

    it('should handle empty PDF file (0 transactions)', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(
        mockImportBatch({ sourceType: 'PDF' }) as never
      );
      vi.mocked(parsePDF).mockResolvedValueOnce({
        transactions: [],
      });
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({
          sourceType: 'PDF',
          status: 'FAILED',
          error: 'PDF file contains no valid transactions',
        }) as never
      );

      const result = await service.createPDFImport({
        file: pdfBuffer,
        accountId: ACCOUNT_ID,
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('PDF file contains no valid transactions');
    });

    it('should handle PDF parsing errors', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(mockAccount() as never);
      vi.mocked(prisma.importBatch.create).mockResolvedValueOnce(
        mockImportBatch({ sourceType: 'PDF' }) as never
      );
      vi.mocked(parsePDF).mockRejectedValueOnce(new Error('PDF is password-protected'));
      vi.mocked(prisma.importBatch.update).mockResolvedValueOnce(
        mockImportBatch({ status: 'FAILED', error: 'PDF is password-protected' }) as never
      );

      await expect(
        service.createPDFImport({
          file: pdfBuffer,
          accountId: ACCOUNT_ID,
        })
      ).rejects.toThrow('PDF is password-protected');

      expect(prisma.importBatch.update).toHaveBeenCalledWith({
        where: { id: IMPORT_BATCH_ID },
        data: {
          status: 'FAILED',
          error: 'PDF is password-protected',
        },
      });
    });
  });

  describe('getImportBatch', () => {
    it('should return import batch with transactions for valid ID in tenant', async () => {
      const mockBatch = {
        ...mockImportBatch(),
        transactions: [
          {
            id: 'txn-1',
            accountId: ACCOUNT_ID,
            date: new Date('2024-01-15'),
            description: 'Transaction 1',
            amount: 550,
            deletedAt: null,
          },
        ],
        _count: {
          transactions: 1,
        },
      };

      vi.mocked(prisma.importBatch.findFirst).mockResolvedValueOnce(mockBatch as never);

      const result = await service.getImportBatch(IMPORT_BATCH_ID);

      expect(prisma.importBatch.findFirst).toHaveBeenCalledWith({
        where: {
          id: IMPORT_BATCH_ID,
          tenantId: TENANT_ID,
        },
        include: {
          transactions: {
            where: { deletedAt: null },
            orderBy: { date: 'desc' },
          },
          _count: {
            select: { transactions: true },
          },
        },
      });

      expect(result).toEqual(mockBatch);
    });

    it('should return null for batch in different tenant', async () => {
      vi.mocked(prisma.importBatch.findFirst).mockResolvedValueOnce(null);

      const result = await service.getImportBatch(IMPORT_BATCH_ID);

      expect(result).toBeNull();
    });

    it('should return null for non-existent batch ID', async () => {
      vi.mocked(prisma.importBatch.findFirst).mockResolvedValueOnce(null);

      const result = await service.getImportBatch('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('listImportBatches', () => {
    it('should return batches for tenant only', async () => {
      const mockBatches = [
        { ...mockImportBatch({ id: 'batch-1' }), transactions: [], _count: { transactions: 0 } },
        { ...mockImportBatch({ id: 'batch-2' }), transactions: [], _count: { transactions: 5 } },
      ];

      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce(mockBatches as never);

      const result = await service.listImportBatches();

      expect(prisma.importBatch.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
        include: {
          transactions: {
            where: { deletedAt: null },
            orderBy: { date: 'desc' },
            take: 10,
          },
          _count: { select: { transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 51, // DEFAULT_PAGE_SIZE + 1
      });

      expect(result.batches).toEqual(mockBatches);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by entityId correctly', async () => {
      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce([] as never);

      await service.listImportBatches({ entityId: ENTITY_ID });

      expect(prisma.importBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            entityId: ENTITY_ID,
          }),
        })
      );
    });

    it('should filter by sourceType correctly', async () => {
      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce([] as never);

      await service.listImportBatches({ sourceType: 'CSV' });

      expect(prisma.importBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            sourceType: 'CSV',
          }),
        })
      );
    });

    it('should filter by status correctly', async () => {
      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce([] as never);

      await service.listImportBatches({ status: 'PROCESSED' });

      expect(prisma.importBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            status: 'PROCESSED',
          }),
        })
      );
    });

    it('should return cursor pagination with hasMore=true when extra record exists', async () => {
      // Return 11 batches for limit of 10
      const mockBatches = Array.from({ length: 11 }, (_, i) => ({
        ...mockImportBatch({ id: `batch-${i}` }),
        transactions: [],
        _count: { transactions: 0 },
      }));

      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce(mockBatches as never);

      const result = await service.listImportBatches({ limit: 10 });

      expect(result.batches).toHaveLength(10); // Should only return 10
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('batch-9'); // Last item's ID
    });

    it('should respect limit parameter', async () => {
      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce([] as never);

      await service.listImportBatches({ limit: 25 });

      expect(prisma.importBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 26, // limit + 1
        })
      );
    });

    it('should use cursor for pagination', async () => {
      vi.mocked(prisma.importBatch.findMany).mockResolvedValueOnce([] as never);

      await service.listImportBatches({ cursor: 'batch-cursor-123' });

      expect(prisma.importBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'batch-cursor-123' },
          skip: 1,
        })
      );
    });
  });
});
