import { prisma } from '@akount/db';
import { parseCSV, parsePDF, parseXLSX } from './parser.service';
import { findDuplicates, findInternalDuplicates } from './duplication.service';
import { CategoryService } from './category.service';
import { CategorizationService } from '../../ai/services/categorization.service';
import { InsightGeneratorService } from '../../ai/services/insight-generator.service';
import type { ColumnMappings } from '../../../schemas/import';
import { logger } from '../../../lib/logger';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Account types where positive PDF amounts represent expenses (charges)
// For these accounts, positive amounts should be negated to represent outflows
const CREDIT_ACCOUNT_TYPES = ['CREDIT_CARD', 'LOAN', 'MORTGAGE'];

/**
 * Adjust amount sign based on account type.
 *
 * Credit card/loan statements show charges as positive numbers,
 * but in our system positive = income and negative = expense.
 * For credit accounts, flip positive amounts to negative (charges)
 * and negative amounts to positive (payments).
 */
function adjustAmountForAccountType(amount: number, accountType: string): number {
  if (CREDIT_ACCOUNT_TYPES.includes(accountType)) {
    return -amount; // Flip sign: charges become negative, payments become positive
  }
  return amount;
}

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

export interface CreateXLSXImportParams {
  file: Buffer;
  accountId: string;
  columnMappings?: ColumnMappings;
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

      // 4a. Remove internal duplicates (within the same file)
      const internalDups = findInternalDuplicates(parseResult.transactions);
      const internalDupIds = new Set<string>();
      for (const dupes of internalDups.values()) {
        for (const id of dupes) internalDupIds.add(id);
      }
      const deduped = parseResult.transactions.filter(
        (txn) => !internalDupIds.has(txn.tempId)
      );

      // 4b. Detect duplicates against existing DB transactions
      const duplicateResults = await findDuplicates(deduped, accountId);
      const duplicateMap = new Map(duplicateResults.map((d) => [d.tempId, d]));

      // 5. Filter out duplicates and create Transaction records
      const transactionsToImport = deduped.filter((txn) => {
        const dupResult = duplicateMap.get(txn.tempId);
        return !dupResult || !dupResult.isDuplicate;
      });

      const totalDuplicates =
        internalDupIds.size + (deduped.length - transactionsToImport.length);

      // Create transactions in batch
      if (transactionsToImport.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToImport.map((txn) => ({
            accountId: accountId,
            date: new Date(txn.date),
            description: txn.description,
            amount: adjustAmountForAccountType(txn.amount, account.type),
            currency: account.currency,
            sourceType: 'BANK_FEED', // CSV import is considered bank feed
            sourceId: null,
            isStaged: false, // Not staged - ready to post to GL
            isSplit: false,
            importBatchId: importBatch.id,
          })),
        });

        // 5b. Auto-categorize imported transactions
        await this.autoCategorize(importBatch.id, account.entityId);

        // 5c. Generate insights (spending anomaly + duplicate detection)
        await this.generateImportInsights(importBatch.id, account.entityId);
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
          duplicates: totalDuplicates,
          skipped: 0,
        },
      };
    } catch (error: unknown) {
      // Handle parsing or database errors
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error during CSV import',
        },
      });

      throw error;
    }
  }

  /**
   * Create XLSX/XLS import batch
   *
   * Converts spreadsheet to rows, then follows the same pipeline as CSV:
   * 1. Validate account → 2. Create ImportBatch → 3. Parse XLSX
   * 4. Deduplicate → 5. Create Transactions → 6. Update batch status
   */
  async createXLSXImport(params: CreateXLSXImportParams): Promise<ImportBatchWithStats> {
    const { file, accountId, columnMappings, dateFormat } = params;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        deletedAt: null,
        entity: { tenantId: this.tenantId },
      },
      include: { entity: true },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    const importBatch = await prisma.importBatch.create({
      data: {
        tenantId: this.tenantId,
        entityId: account.entityId,
        sourceType: 'CSV', // XLSX parsed as tabular data, same as CSV
        status: 'PROCESSING',
      },
    });

    try {
      const parseResult = await parseXLSX(file, columnMappings, dateFormat);

      if (parseResult.transactions.length === 0) {
        await prisma.importBatch.update({
          where: { id: importBatch.id },
          data: { status: 'FAILED', error: 'XLSX file contains no valid transactions' },
        });

        return {
          id: importBatch.id,
          tenantId: this.tenantId,
          entityId: account.entityId,
          sourceType: 'CSV',
          status: 'FAILED',
          error: 'XLSX file contains no valid transactions',
          createdAt: importBatch.createdAt,
          stats: { total: 0, imported: 0, duplicates: 0, skipped: 0 },
        };
      }

      // Remove internal duplicates (within the same file)
      const internalDups = findInternalDuplicates(parseResult.transactions);
      const internalDupIds = new Set<string>();
      for (const dupes of internalDups.values()) {
        for (const id of dupes) internalDupIds.add(id);
      }
      const deduped = parseResult.transactions.filter(
        (txn) => !internalDupIds.has(txn.tempId)
      );

      const duplicateResults = await findDuplicates(deduped, accountId);
      const duplicateMap = new Map(duplicateResults.map((d) => [d.tempId, d]));

      const transactionsToImport = deduped.filter((txn) => {
        const dupResult = duplicateMap.get(txn.tempId);
        return !dupResult || !dupResult.isDuplicate;
      });

      const totalDuplicates =
        internalDupIds.size + (deduped.length - transactionsToImport.length);

      if (transactionsToImport.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToImport.map((txn) => ({
            accountId,
            date: new Date(txn.date),
            description: txn.description,
            amount: adjustAmountForAccountType(txn.amount, account.type),
            currency: account.currency,
            sourceType: 'BANK_FEED',
            sourceId: null,
            isStaged: false,
            isSplit: false,
            importBatchId: importBatch.id,
          })),
        });

        await this.autoCategorize(importBatch.id, account.entityId);

        // Generate insights (spending anomaly + duplicate detection)
        await this.generateImportInsights(importBatch.id, account.entityId);
      }

      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: { status: 'PROCESSED' },
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
          duplicates: totalDuplicates,
          skipped: 0,
        },
      };
    } catch (error: unknown) {
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown error during XLSX import' },
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
      // 3. Parse PDF file (DEV-242: now using Mistral vision extraction)
      const parseResult = await parsePDF(file, this.tenantId, dateFormat, account.entityId);

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

      // 4a. Remove internal duplicates (within the same file)
      const internalDups = findInternalDuplicates(parseResult.transactions);
      const internalDupIds = new Set<string>();
      for (const dupes of internalDups.values()) {
        for (const id of dupes) internalDupIds.add(id);
      }
      const deduped = parseResult.transactions.filter(
        (txn) => !internalDupIds.has(txn.tempId)
      );

      // 4b. Detect duplicates against existing DB transactions
      const duplicateResults = await findDuplicates(deduped, accountId);
      const duplicateMap = new Map(duplicateResults.map((d) => [d.tempId, d]));

      // 5. Filter out duplicates and create Transaction records
      const transactionsToImport = deduped.filter((txn) => {
        const dupResult = duplicateMap.get(txn.tempId);
        return !dupResult || !dupResult.isDuplicate;
      });

      const totalDuplicates =
        internalDupIds.size + (deduped.length - transactionsToImport.length);

      // Create transactions in batch
      if (transactionsToImport.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToImport.map((txn) => ({
            accountId: accountId,
            date: new Date(txn.date),
            description: txn.description,
            amount: adjustAmountForAccountType(txn.amount, account.type),
            currency: account.currency,
            sourceType: 'BANK_FEED', // PDF import is considered bank feed
            sourceId: null,
            isStaged: false, // Not staged - ready to post to GL
            isSplit: false,
            importBatchId: importBatch.id,
          })),
        });

        // 5b. Auto-categorize imported transactions
        await this.autoCategorize(importBatch.id, account.entityId);

        // 5c. Generate insights (spending anomaly + duplicate detection)
        await this.generateImportInsights(importBatch.id, account.entityId);
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
          duplicates: totalDuplicates,
          skipped: 0,
        },
      };
    } catch (error: unknown) {
      // Handle parsing or database errors
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error during PDF import',
        },
      });

      throw error;
    }
  }

  /**
   * Ensure default categories exist for this tenant.
   * Delegates to CategoryService.seedDefaults() — single source of truth.
   */
  private async ensureDefaultCategories(): Promise<void> {
    const service = new CategoryService(this.tenantId, 'system');
    await service.seedDefaults();
  }

  /**
   * Auto-categorize transactions in an import batch.
   *
   * Priority: Rules (batch) → Keywords → AI fallback
   * Runs after transaction creation. Updates categoryId for high-confidence matches.
   * Non-critical — errors are logged but don't fail the import.
   */
  private async autoCategorize(importBatchId: string, entityId: string): Promise<void> {
    try {
      // Ensure categories exist before trying to match
      await this.ensureDefaultCategories();

      const created = await prisma.transaction.findMany({
        where: { importBatchId, deletedAt: null },
        select: { id: true, description: true, amount: true },
      });

      if (created.length === 0) return;

      // Use class-based API with entityId for rule evaluation + GL resolution
      const service = new CategorizationService(this.tenantId, entityId);
      const suggestions = await service.categorizeBatch(
        created.map((t) => ({ id: t.id, description: t.description, amount: t.amount }))
      );

      // Batch-update transactions that have a high-confidence category match
      const updates = created
        .map((t, idx) => ({ id: t.id, suggestion: suggestions[idx] }))
        .filter(
          ({ suggestion }) =>
            suggestion.categoryId !== null && suggestion.confidence >= 70
        );

      if (updates.length > 0) {
        // Single DB transaction instead of N parallel queries
        await prisma.$transaction(
          updates.map(({ id, suggestion }) =>
            prisma.transaction.update({
              where: { id },
              data: { categoryId: suggestion.categoryId },
            })
          )
        );
      }
    } catch (error) {
      // Non-critical — log but don't fail the import
      logger.error({ err: error }, 'Error during auto-categorization');
    }
  }

  /**
   * Run insight generation after import (spending anomaly + duplicate detection).
   * Non-critical — errors are logged but never fail the import.
   */
  private async generateImportInsights(importBatchId: string, entityId: string): Promise<void> {
    try {
      const txns = await prisma.transaction.findMany({
        where: { importBatchId, deletedAt: null },
        select: { id: true },
      });

      if (txns.length === 0) return;

      const generator = new InsightGeneratorService(this.tenantId, 'system', entityId);
      const summary = await generator.generateForImport(txns.map(t => t.id));

      logger.info(
        { importBatchId, entityId, insightsGenerated: summary.generated },
        'Import-triggered insight generation complete'
      );
    } catch (error) {
      // Non-critical — log but don't fail the import
      logger.error({ err: error, importBatchId }, 'Error during import insight generation');
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
