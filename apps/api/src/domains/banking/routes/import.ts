import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';
import { validateBody, validateQuery } from '../../../middleware/validation';
import { withPermission } from '../../../middleware/withPermission';
import {
  uploadRequestSchema,
  uploadResponseSchema,
  updateMappingRequestSchema,
  updateTransactionsRequestSchema,
  confirmImportRequestSchema,
  type ParsedTransaction,
  type ExternalAccountData,
  type ColumnMappings,
} from '../../../schemas/import';
import { parseCSV, parsePDF } from '../services/parser.service';
import { findDuplicates, findInternalDuplicates } from '../services/duplication.service';
import { categorizeTransactions } from '../../ai/services/categorization.service';
import {
  matchAccountToBankConnection,
  findDuplicateAccounts,
} from '../services/account-matcher.service';
import { randomUUID } from 'crypto';
import type { Account } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Import Routes for Bank Statement Import
 *
 * Handles file upload, parsing, column mapping, and transaction import.
 * Nested under /api/banking/import
 */

// TYPES: Additional type definitions for type safety
type PreviewData = {
  rows: Array<Record<string, string>>;
};

type ParseResult = {
  columns?: string[];
  suggestedMappings?: ColumnMappings;
  preview?: PreviewData;
  transactions: ParsedTransaction[];
  externalAccountData?: ExternalAccountData;
};

type DuplicateCheckResult = {
  tempId: string;
  isDuplicate: boolean;
  duplicateConfidence?: number;
  matchedTransactionId?: string;
  matchReason?: string;
};

type SuggestedAccount = {
  id: string;
  name: string;
  type: string;
  currency: string;
  entity: {
    id: string;
    name: string;
  };
  matchScore: number;
  matchReasons: string[];
};

type UploadResponse = {
  parseId: string;
  accountId?: string;
  fileName: string;
  fileSize: number;
  sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
  columns?: string[];
  columnMappings?: ColumnMappings;
  preview?: PreviewData;
  transactions: ParsedTransaction[];
  summary: {
    total: number;
    duplicates: number;
    categorized: number;
    needsReview: number;
  };
  externalAccountData?: ExternalAccountData;
  suggestedAccounts?: SuggestedAccount[];
  requiresAccountSelection?: boolean;
};

type MultipartFields = {
  accountId?: { value: string };
  dateFormat?: { value: string };
  entityId?: { value: string };
};

// SECURITY: Cache limits to prevent abuse
const MAX_CACHE_SIZE_MB = 100;
const MAX_FILES_PER_USER = 5;

const parseCache = new Map<
  string,
  {
    userId: string;
    tenantId: string;
    accountId?: string;
    fileName: string;
    fileSize: number;
    sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
    columns?: string[];
    columnMappings?: ColumnMappings;
    preview?: PreviewData;
    transactions: ParsedTransaction[];
    externalAccountData?: ExternalAccountData;
    createdAt: Date;
  }
>();

function canAddToCache(userId: string, fileSize: number): boolean {
  let totalSize = 0;
  for (const entry of parseCache.values()) {
    totalSize += entry.fileSize;
  }

  if (totalSize + fileSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
    return false;
  }

  let userFiles = 0;
  for (const entry of parseCache.values()) {
    if (entry.userId === userId) {
      userFiles++;
    }
  }

  return userFiles < MAX_FILES_PER_USER;
}

// Clean up old parse sessions (older than 1 hour)
setInterval(
  () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [parseId, data] of parseCache.entries()) {
      if (data.createdAt < oneHourAgo) {
        parseCache.delete(parseId);
      }
    }
  },
  5 * 60 * 1000
);

export async function importRoutes(fastify: FastifyInstance) {
  /**
   * POST /upload
   *
   * Upload file and get parsed transactions preview.
   */
  fastify.post(
    '/upload',
    {
      ...withPermission('banking', 'import', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        const fields = data.fields as MultipartFields;
        const accountId = fields.accountId?.value;
        const dateFormat = fields.dateFormat?.value;
        const entityId = fields.entityId?.value;

        const fileBuffer = await data.toBuffer();
        const fileSize = fileBuffer.length;
        const maxSize = 10 * 1024 * 1024;

        if (fileSize > maxSize) {
          return reply.status(413).send({
            error: 'Payload Too Large',
            message: `File size exceeds maximum allowed size of 10MB. Your file is ${(fileSize / 1024 / 1024).toFixed(2)}MB.`,
          });
        }

        // SECURITY: Sanitize filename
        const rawFileName = data.filename;
        const fileName = rawFileName
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/\.{2,}/g, '_')
          .replace(/^\.+/, '')
          .substring(0, 255);

        const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
        const validExtensions = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls'];

        if (!ext || !validExtensions.includes(ext)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Invalid file type. Supported formats: CSV, PDF, OFX, XLSX. Got: ${ext || 'unknown'}`,
          });
        }

        // SECURITY: Validate file content matches extension
        const fileType = await fileTypeFromBuffer(fileBuffer);
        const expectedMimeTypes: Record<string, string[]> = {
          '.csv': ['text/csv', 'text/plain', 'application/csv'],
          '.pdf': ['application/pdf'],
          '.ofx': ['text/plain', 'application/x-ofx'],
          '.qfx': ['text/plain', 'application/x-ofx'],
          '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          '.xls': ['application/vnd.ms-excel'],
        };

        const binaryExtensions = ['.pdf', '.xlsx', '.xls'];
        if (binaryExtensions.includes(ext)) {
          if (!fileType) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: `File content validation failed. The file may be corrupted or not a valid ${ext.toUpperCase()} file.`,
            });
          }

          const allowedMimes = expectedMimeTypes[ext] || [];
          if (!allowedMimes.includes(fileType.mime)) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: `File content does not match extension. Expected ${ext.toUpperCase()}, but file appears to be ${fileType.ext?.toUpperCase() || 'unknown'}.`,
            });
          }
        }

        let account: Account | null = null;
        let tenantId: string | null = request.tenantId as string;

        if (accountId) {
          const accountWithEntity = await prisma.account.findFirst({
            where: {
              id: accountId,
              entity: {
                tenantId: request.tenantId,
              },
            },
            include: {
              entity: {
                select: {
                  id: true,
                  tenantId: true,
                },
              },
            },
          });

          if (!accountWithEntity) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'Account not found or access denied',
            });
          }

          account = accountWithEntity;
          tenantId = accountWithEntity.entity.tenantId;
        }

        let sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
        if (['.csv'].includes(ext)) {
          sourceType = 'CSV';
        } else if (['.pdf'].includes(ext)) {
          sourceType = 'PDF';
        } else if (['.ofx', '.qfx'].includes(ext)) {
          sourceType = 'OFX';
        } else {
          sourceType = 'XLSX';
        }

        let parseResult: ParseResult;

        if (sourceType === 'CSV') {
          parseResult = parseCSV(fileBuffer, undefined, dateFormat);
        } else if (sourceType === 'PDF') {
          parseResult = await parsePDF(fileBuffer, dateFormat);
        } else {
          return reply.status(501).send({
            error: 'Not Implemented',
            message: `${sourceType} parsing will be implemented in Phase 2. Please use CSV export for now.`,
          });
        }

        const parseId = randomUUID();

        let duplicateResults: DuplicateCheckResult[] = [];
        if (accountId) {
          duplicateResults = await findDuplicates(parseResult.transactions, accountId);
        }
        const internalDuplicates = findInternalDuplicates(parseResult.transactions);

        const duplicateMap = new Map(duplicateResults.map((d) => [d.tempId, d]));

        for (const [tempId, duplicateIds] of internalDuplicates.entries()) {
          const existing = duplicateMap.get(tempId);
          if (existing && !existing.isDuplicate) {
            existing.isDuplicate = true;
            existing.duplicateConfidence = 100;
            existing.matchReason = 'Duplicate within uploaded file';
          }
          for (const dupId of duplicateIds) {
            const dupResult = duplicateMap.get(dupId);
            if (dupResult) {
              dupResult.isDuplicate = true;
              dupResult.duplicateConfidence = 100;
              dupResult.matchReason = 'Duplicate within uploaded file';
            }
          }
        }

        const categorySuggestions = await categorizeTransactions(
          parseResult.transactions.map((t) => ({
            description: t.description,
            amount: t.amount,
          })),
          tenantId!
        );

        const enrichedTransactions = parseResult.transactions.map(
          (t: ParsedTransaction, index: number) => {
            const duplicateInfo = duplicateMap.get(t.tempId);
            const categorySuggestion = categorySuggestions[index];

            return {
              ...t,
              isDuplicate: duplicateInfo?.isDuplicate || false,
              duplicateConfidence: duplicateInfo?.duplicateConfidence,
              matchedTransactionId: duplicateInfo?.matchedTransactionId,
              matchReason: duplicateInfo?.matchReason,
              suggestedCategory:
                categorySuggestion.categoryId && categorySuggestion.categoryName
                  ? {
                      id: categorySuggestion.categoryId,
                      name: categorySuggestion.categoryName,
                      confidence: categorySuggestion.confidence,
                      reason: categorySuggestion.matchReason,
                    }
                  : undefined,
            };
          }
        );

        const duplicateCount = enrichedTransactions.filter((t) => t.isDuplicate).length;
        const categorizedCount = enrichedTransactions.filter(
          (t) => t.suggestedCategory && t.suggestedCategory.confidence >= 70
        ).length;
        const needsReviewCount = enrichedTransactions.filter(
          (t) => !t.isDuplicate && (!t.suggestedCategory || t.suggestedCategory.confidence < 70)
        ).length;

        let suggestedAccounts: SuggestedAccount[] = [];
        if (!accountId && parseResult.externalAccountData && tenantId) {
          const entities = await prisma.entity.findMany({
            where: { tenantId },
            include: {
              accounts: {
                where: { isActive: true },
                include: {
                  transactions: {
                    include: { importBatch: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          });

          for (const entity of entities) {
            for (const acc of entity.accounts) {
              let score = 0;
              const reasons: string[] = [];

              const externalData = parseResult.externalAccountData;

              if (externalData?.accountType && acc.type.toLowerCase() === externalData.accountType) {
                score += 20;
                reasons.push('Account type match');
              }

              if (externalData?.institutionName && acc.institution) {
                const normalizedExternal = externalData.institutionName.toLowerCase();
                const normalizedStored = acc.institution.toLowerCase();

                if (
                  normalizedExternal.includes(normalizedStored) ||
                  normalizedStored.includes(normalizedExternal)
                ) {
                  score += 30;
                  reasons.push('Institution match');
                }
              }

              if (score > 0) {
                suggestedAccounts.push({
                  id: acc.id,
                  name: acc.name,
                  type: acc.type,
                  currency: acc.currency,
                  entity: {
                    id: entity.id,
                    name: entity.name,
                  },
                  matchScore: score,
                  matchReasons: reasons,
                });
              }
            }
          }

          suggestedAccounts.sort((a, b) => b.matchScore - a.matchScore);
          suggestedAccounts = suggestedAccounts.slice(0, 5);
        }

        if (!canAddToCache(request.userId!, fileSize)) {
          return reply.status(429).send({
            error: 'Too Many Requests',
            message:
              'Cache limit reached. Please wait a few minutes and try again, or complete pending imports.',
          });
        }

        parseCache.set(parseId, {
          userId: request.userId!,
          tenantId: tenantId!,
          accountId,
          fileName,
          fileSize,
          sourceType,
          columns: parseResult.columns,
          columnMappings: parseResult.suggestedMappings,
          preview: parseResult.preview,
          transactions: enrichedTransactions,
          externalAccountData: parseResult.externalAccountData,
          createdAt: new Date(),
        });

        const response: UploadResponse = {
          parseId,
          accountId,
          fileName,
          fileSize,
          sourceType,
          columns: parseResult.columns,
          columnMappings: parseResult.suggestedMappings,
          preview: parseResult.preview,
          transactions: enrichedTransactions,
          summary: {
            total: parseResult.transactions.length,
            duplicates: duplicateCount,
            categorized: categorizedCount,
            needsReview: needsReviewCount,
          },
          externalAccountData: parseResult.externalAccountData,
        };

        if (!accountId) {
          response.suggestedAccounts = suggestedAccounts;
          response.requiresAccountSelection = true;
        }

        return reply.status(200).send(response);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error uploading file');

        if (error instanceof Error && error.message?.includes('CSV parsing error')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }

        if (
          error instanceof Error &&
          (error.message?.includes('Invalid date') || error.message?.includes('Invalid amount'))
        ) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while processing your file. Please try again.',
        });
      }
    }
  );

  /**
   * POST /update-mapping
   *
   * Update column mappings for CSV/XLSX.
   */
  fastify.post(
    '/update-mapping',
    {
      ...withPermission('banking', 'import', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { parseId, columnMappings } = request.body as {
          parseId: string;
          columnMappings: ColumnMappings;
        };

        const cached = parseCache.get(parseId);
        if (!cached) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Parse session not found or expired. Please upload the file again.',
          });
        }

        return reply.status(400).send({
          error: 'Bad Request',
          message:
            'Column mapping update requires re-uploading the file (will be fixed in next iteration)',
        });
      } catch (error: unknown) {
        request.log.error({ error }, 'Error updating column mappings');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while updating column mappings.',
        });
      }
    }
  );

  /**
   * GET /parse/:parseId
   *
   * Get cached parse data by parseId.
   */
  fastify.get(
    '/parse/:parseId',
    {
      ...withPermission('banking', 'import', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { parseId } = request.params as { parseId: string };

        const cached = parseCache.get(parseId);
        if (!cached) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Parse session not found or expired.',
          });
        }

        // SECURITY: Verify ownership
        if (cached.userId !== request.userId) {
          request.log.warn(
            {
              parseId,
              cachedUserId: cached.userId,
              requestUserId: request.userId,
            },
            'Attempted cross-user cache access'
          );
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Access denied',
          });
        }

        // SECURITY: Verify tenant
        if (cached.tenantId !== request.tenantId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Access denied - tenant mismatch',
          });
        }

        const duplicateCount = cached.transactions.filter((t) => t.isDuplicate).length;
        const categorizedCount = cached.transactions.filter(
          (t) => t.suggestedCategory && t.suggestedCategory.confidence >= 70
        ).length;
        const needsReviewCount = cached.transactions.filter(
          (t) => !t.isDuplicate && (!t.suggestedCategory || t.suggestedCategory.confidence < 70)
        ).length;

        return reply.status(200).send({
          parseId,
          accountId: cached.accountId,
          fileName: cached.fileName,
          fileSize: cached.fileSize,
          sourceType: cached.sourceType,
          columns: cached.columns,
          columnMappings: cached.columnMappings,
          preview: cached.preview,
          transactions: cached.transactions,
          summary: {
            total: cached.transactions.length,
            duplicates: duplicateCount,
            categorized: categorizedCount,
            needsReview: needsReviewCount,
          },
        });
      } catch (error: unknown) {
        request.log.error({ error }, 'Error retrieving parse data');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while retrieving parse data.',
        });
      }
    }
  );
}
