import { prisma } from '@akount/db';
import { parseCSV, parsePDF } from './parser.service';
import { findDuplicates } from './duplication.service';
import type { ColumnMappings } from '../../../schemas/import';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Types for import operations
export interface CreateCSVImportParams {
  file: Buffer;
  accountId: string;
  columnMappings?: ColumnMappings;
  dateFormat?: string;
}

export interface CreatePDFImportParams {
  file: Buffer;
  accountId: string;
  dateFormat?: string;
}

export interface ImportBatchWithStats {
  id: string;
  tenantId: string;
  entityId: string | null;
  sourceType: string;
  status: string;
  error: string | null;
  createdAt: Date;
  stats: {
    total: number;
    imported: number;
    duplicates: number;
    skipped: number;
  };
}

export interface ImportBatchWithTransactions {
  id: string;
  tenantId: string;
  entityId: string | null;
  sourceType: string;
  status: string;
  error: string | null;
  createdAt: Date;
  transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>>;
  _count: {
    transactions: number;
  };
}

export interface ListImportBatchesParams {
  entityId?: string;
  sourceType?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedImportBatches {
  batches: ImportBatchWithTransactions[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * ImportService - Orchestrates CSV and PDF import workflow
 *
 * Responsibilities:
 * - Create import batches for CSV and PDF files
 * - Parse files using ParserService
 * - Deduplicate using DuplicationService
 * - Store transactions in database
 * - Track import status and errors
 */
export class ImportService {
  constructor(private tenantId: string) {}

  /**
   * Create CSV import batch
   *
   * Workflow:
   * 1. Validate account belongs to tenant
   * 2. Create ImportBatch (status: PROCESSING)
   * 3. Parse CSV with column mappings
   * 4. Detect duplicates
   * 5. Create Transaction records (excluding duplicates)
   * 6. Update ImportBatch (status: PROCESSED or FAILED)
   */
  async createCSVImport(params: CreateCSVImportParams): Promise<ImportBatchWithStats> {
    const { file, accountId, columnMappings, dateFormat } = params;

    // 1. Verify account belongs to tenant
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        deletedAt: null,
        entity: {
          tenantId: this.tenantId,
        },
      },
      include: {
        entity: true,
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // 2. Create ImportBatch record (status: PROCESSING)
    const importBatch = await prisma.importBatch.create({
      data: {
        tenantId: this.tenantId,
        entityId: account.entityId,
        sourceType: 'CSV',
        status: 'PROCESSING',
      },
    });

    try {
      // 3. Parse CSV file
      const parseResult = parseCSV(file, columnMappings, dateFormat);

      if (parseResult.transactions.length === 0) {
        // Update batch with error
        await prisma.importBatch.update({
          where: { id: importBatch.id },
          data: {
            status: 'FAILED',
            error: 'CSV file contains no valid transactions',
          },
        });

        return {
          id: importBatch.id,
          tenantId: this.tenantId,
          entityId: account.entityId,
          sourceType: 'CSV',
          status: 'FAILED',
          error: 'CSV file contains no valid transactions',
          createdAt: importBatch.createdAt,
          stats: {
            total: 0,
            imported: 0,
            duplicates: 0,
            skipped: 0,
          },
        };
      }

      // 4. Detect duplicates
      const duplicateResults = await findDuplicates(parseResult.transactions, accountId);

      // Map duplicate results to parsed transactions
      const duplicateMap = new Map(duplicateResults.map((d) => [d.tempId, d]));

      // 5. Filter out duplicates and create Transaction records
      const transactionsToImport = parseResult.transactions.filter((txn) => {
        const dupResult = duplicateMap.get(txn.tempId);
        return !dupResult || !dupResult.isDuplicate;
      });

      // Create transactions in batch
      if (transactionsToImport.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToImport.map((txn) => ({
            accountId: accountId,
            date: new Date(txn.date),
            description: txn.description,
            amount: txn.amount,
            currency: account.currency,
            sourceType: 'BANK_FEED', // CSV import is considered bank feed
            sourceId: null,
            isStaged: false, // Not staged - ready to post to GL
            isSplit: false,
            importBatchId: importBatch.id,
          })),
        });
      }

      // 6. Update ImportBatch (status: PROCESSED)
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'PROCESSED',
        },
      });

      return {
        id: importBatch.id,
        tenantId: this.tenantId,
        entityId: account.entityId,
        sourceType: 'CSV',
        status: 'PROCESSED',
        error: null,
        createdAt: importBatch.createdAt,
        stats: {
          total: parseResult.transactions.length,
          imported: transactionsToImport.length,
          duplicates: parseResult.transactions.length - transactionsToImport.length,
          skipped: 0,
        },
      };
    } catch (error: any) {
      // Handle parsing or database errors
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error during CSV import',
        },
      });

      throw error;
    }
  }

  /**
   * Create PDF import batch
   *
   * Workflow:
   * 1. Validate account belongs to tenant
   * 2. Create ImportBatch (status: PROCESSING)
   * 3. Parse PDF with regex patterns
   * 4. Detect duplicates
   * 5. Create Transaction records (excluding duplicates)
   * 6. Update ImportBatch (status: PROCESSED or FAILED)
   */
  async createPDFImport(params: CreatePDFImportParams): Promise<ImportBatchWithStats> {
    const { file, accountId, dateFormat } = params;

    // 1. Verify account belongs to tenant
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        deletedAt: null,
        entity: {
          tenantId: this.tenantId,
        },
      },
      include: {
        entity: true,
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // 2. Create ImportBatch record (status: PROCESSING)
    const importBatch = await prisma.importBatch.create({
      data: {
        tenantId: this.tenantId,
        entityId: account.entityId,
        sourceType: 'PDF',
        status: 'PROCESSING',
      },
    });

    try {
      // 3. Parse PDF file
      const parseResult = await parsePDF(file, dateFormat);

      if (parseResult.transactions.length === 0) {
        // Update batch with error
        await prisma.importBatch.update({
          where: { id: importBatch.id },
          data: {
            status: 'FAILED',
            error: 'PDF file contains no valid transactions',
          },
        });

        return {
          id: importBatch.id,
          tenantId: this.tenantId,
          entityId: account.entityId,
          sourceType: 'PDF',
          status: 'FAILED',
          error: 'PDF file contains no valid transactions',
          createdAt: importBatch.createdAt,
          stats: {
            total: 0,
            imported: 0,
            duplicates: 0,
            skipped: 0,
          },
        };
      }

      // 4. Detect duplicates
      const duplicateResults = await findDuplicates(parseResult.transactions, accountId);

      // Map duplicate results to parsed transactions
      const duplicateMap = new Map(duplicateResults.map((d) => [d.tempId, d]));

      // 5. Filter out duplicates and create Transaction records
      const transactionsToImport = parseResult.transactions.filter((txn) => {
        const dupResult = duplicateMap.get(txn.tempId);
        return !dupResult || !dupResult.isDuplicate;
      });

      // Create transactions in batch
      if (transactionsToImport.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToImport.map((txn) => ({
            accountId: accountId,
            date: new Date(txn.date),
            description: txn.description,
            amount: txn.amount,
            currency: account.currency,
            sourceType: 'BANK_FEED', // PDF import is considered bank feed
            sourceId: null,
            isStaged: false, // Not staged - ready to post to GL
            isSplit: false,
            importBatchId: importBatch.id,
          })),
        });
      }

      // 6. Update ImportBatch (status: PROCESSED)
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'PROCESSED',
        },
      });

      return {
        id: importBatch.id,
        tenantId: this.tenantId,
        entityId: account.entityId,
        sourceType: 'PDF',
        status: 'PROCESSED',
        error: null,
        createdAt: importBatch.createdAt,
        stats: {
          total: parseResult.transactions.length,
          imported: transactionsToImport.length,
          duplicates: parseResult.transactions.length - transactionsToImport.length,
          skipped: 0,
        },
      };
    } catch (error: any) {
      // Handle parsing or database errors
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error during PDF import',
        },
      });

      throw error;
    }
  }

  /**
   * Get import batch by ID with transactions
   *
   * Returns null if batch doesn't belong to tenant
   */
  async getImportBatch(id: string): Promise<ImportBatchWithTransactions | null> {
    const batch = await prisma.importBatch.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        transactions: {
          where: {
            deletedAt: null, // Soft delete filter
          },
          orderBy: {
            date: 'desc',
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return batch;
  }

  /**
   * List import batches with pagination
   *
   * Filters by tenant and optionally by entity, sourceType, status
   */
  async listImportBatches(params: ListImportBatchesParams = {}): Promise<PaginatedImportBatches> {
    const { entityId, sourceType, status, cursor } = params;

    // Ensure limit is within bounds
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    // Build where clause with tenant isolation
    const where = {
      tenantId: this.tenantId,
      ...(entityId && { entityId }),
      ...(sourceType && { sourceType: sourceType as 'CSV' | 'PDF' | 'BANK_FEED' | 'API' }),
      ...(status && {
        status: status as 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED',
      }),
    };

    // Fetch one extra to determine if there are more results
    const batches = await prisma.importBatch.findMany({
      where,
      include: {
        transactions: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10, // Limit transactions per batch in list view
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Newest first
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor record itself
      }),
    });

    // Check if there are more results
    const hasMore = batches.length > limit;

    // Return only the requested number of results
    const data = hasMore ? batches.slice(0, limit) : batches;

    return {
      batches: data,
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    };
  }
}
