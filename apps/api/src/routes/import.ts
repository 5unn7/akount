import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  uploadRequestSchema,
  uploadResponseSchema,
  updateMappingRequestSchema,
  updateTransactionsRequestSchema,
  confirmImportRequestSchema,
  type ParsedTransaction,
  type ExternalAccountData,
  type ColumnMappings,
} from '../schemas/import';
import { parseCSV, parsePDF } from '../services/parserService';
import { findDuplicates, findInternalDuplicates } from '../services/duplicationService';
import { categorizeTransactions } from '../services/categorizationService';
import { matchAccountToBankConnection, findDuplicateAccounts } from '../services/accountMatcherService';
import { randomUUID } from 'crypto';
import type { Account } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Import routes for bank statement import feature
 *
 * Handles file upload, parsing, column mapping, and transaction import
 */

// TYPES: Additional type definitions for type safety
type PreviewData = {
  rows: Array<Record<string, string>>;
};

type ParseResult = {
  columns?: string[];  // Optional - may not be present for all file types
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
  accountId?: string;  // Optional - may not be set until account selection
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

// In-memory cache for parsed data (parseId -> parsed data)
// FUTURE ENHANCEMENT (Phase 8 - Production Readiness):
// Replace with Redis for:
// - Multi-server support (horizontal scaling)
// - Persistence across API restarts
// - TTL management
// - Better memory management
// Current implementation is suitable for single-server MVP

// SECURITY: Cache limits to prevent abuse
const MAX_CACHE_SIZE_MB = 100; // 100MB total cache size
const MAX_FILES_PER_USER = 5;  // Maximum files per user in cache

const parseCache = new Map<string, {
  userId: string;        // SECURITY: Track who uploaded this
  tenantId: string;      // SECURITY: Track which tenant owns this
  accountId?: string;    // Optional - may not be set until account selection
  fileName: string;
  fileSize: number;
  sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
  columns?: string[];
  columnMappings?: ColumnMappings;
  preview?: PreviewData;
  transactions: ParsedTransaction[];
  externalAccountData?: ExternalAccountData;
  createdAt: Date;
}>();

// Helper function to check if we can add to cache (prevent DoS)
function canAddToCache(userId: string, fileSize: number): boolean {
  // Check total cache size
  let totalSize = 0;
  for (const entry of parseCache.values()) {
    totalSize += entry.fileSize;
  }

  if (totalSize + fileSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
    return false;
  }

  // Check per-user file count
  let userFiles = 0;
  for (const entry of parseCache.values()) {
    if (entry.userId === userId) {
      userFiles++;
    }
  }

  return userFiles < MAX_FILES_PER_USER;
}

// Clean up old parse sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [parseId, data] of parseCache.entries()) {
    if (data.createdAt < oneHourAgo) {
      parseCache.delete(parseId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function importRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/import/upload
   *
   * Upload file and get parsed transactions preview
   */
  fastify.post(
    '/import/upload',
    {
      onRequest: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get multipart data
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        // Get form fields
        const fields = data.fields as MultipartFields;
        const accountId = fields.accountId?.value; // Optional now
        const dateFormat = fields.dateFormat?.value;
        const entityId = fields.entityId?.value; // For account suggestions

        // Validate file size (10MB limit)
        const fileBuffer = await data.toBuffer();
        const fileSize = fileBuffer.length;
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (fileSize > maxSize) {
          return reply.status(413).send({
            error: 'Payload Too Large',
            message: `File size exceeds maximum allowed size of 10MB. Your file is ${(fileSize / 1024 / 1024).toFixed(2)}MB.`,
          });
        }

        // SECURITY: Sanitize filename to prevent path traversal attacks
        const rawFileName = data.filename;
        const fileName = rawFileName
          .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace unsafe characters
          .replace(/\.{2,}/g, '_')            // Remove consecutive dots (path traversal)
          .replace(/^\.+/, '')                // Remove leading dots
          .substring(0, 255);                 // Limit length

        // Validate file extension
        const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
        const validExtensions = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls'];

        if (!ext || !validExtensions.includes(ext)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Invalid file type. Supported formats: CSV, PDF, OFX, XLSX. Got: ${ext || 'unknown'}`,
          });
        }

        // SECURITY: Validate file content matches extension (magic byte check)
        const fileType = await fileTypeFromBuffer(fileBuffer);

        // Map extensions to expected MIME types
        const expectedMimeTypes: Record<string, string[]> = {
          '.csv': ['text/csv', 'text/plain', 'application/csv'],
          '.pdf': ['application/pdf'],
          '.ofx': ['text/plain', 'application/x-ofx'],
          '.qfx': ['text/plain', 'application/x-ofx'],
          '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          '.xls': ['application/vnd.ms-excel'],
        };

        // For text-based formats (CSV, OFX), file-type may not detect MIME type
        // Only validate for binary formats (PDF, XLSX, XLS)
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

        // If accountId provided, verify ownership (tenant isolation)
        let account: Account | null = null;
        let tenantId: string | null = null;

        if (accountId) {
          const accountWithEntity = await prisma.account.findFirst({
            where: {
              id: accountId,
              entity: {
                tenant: {
                  memberships: {
                    some: {
                      user: {
                        clerkUserId: request.userId,
                      },
                    },
                  },
                },
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
        } else {
          // No accountId provided - get user's tenant for later suggestions
          const user = await prisma.user.findUnique({
            where: { clerkUserId: request.userId ?? undefined },
            include: {
              memberships: {
                include: {
                  tenant: true,
                },
                take: 1,
              },
            },
          });

          if (!user || user.memberships.length === 0) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'User has no tenant access',
            });
          }

          tenantId = user.memberships[0].tenant.id;
        }

        // Determine source type
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

        // Parse file based on type
        let parseResult: ParseResult;

        if (sourceType === 'CSV') {
          parseResult = parseCSV(fileBuffer, undefined, dateFormat);
        } else if (sourceType === 'PDF') {
          parseResult = await parsePDF(fileBuffer, dateFormat);
        } else {
          // PHASE 2 ENHANCEMENT: OFX/QFX and XLSX/XLS parsing
          // Priority: Medium (after core features)
          // Estimated effort: 8-12 hours
          // Dependencies:
          // - OFX: node-ofx or ofx-js library
          // - XLSX: xlsx or exceljs library
          // Benefits: Direct import from Quicken/QuickBooks and Excel exports
          return reply.status(501).send({
            error: 'Not Implemented',
            message: `${sourceType} parsing will be implemented in Phase 2. Please use CSV export for now.`,
          });
        }

        // Generate parse ID
        const parseId = randomUUID();

        // Run duplicate detection (only if accountId is provided)
        let duplicateResults: DuplicateCheckResult[] = [];
        if (accountId) {
          duplicateResults = await findDuplicates(parseResult.transactions, accountId);
        }
        const internalDuplicates = findInternalDuplicates(parseResult.transactions);

        // Create duplicate lookup map
        const duplicateMap = new Map(
          duplicateResults.map(d => [d.tempId, d])
        );

        // Mark internal duplicates (duplicates within the CSV itself)
        for (const [tempId, duplicateIds] of internalDuplicates.entries()) {
          const existing = duplicateMap.get(tempId);
          if (existing && !existing.isDuplicate) {
            existing.isDuplicate = true;
            existing.duplicateConfidence = 100;
            existing.matchReason = 'Duplicate within uploaded file';
          }
          // Also mark the duplicate entries
          for (const dupId of duplicateIds) {
            const dupResult = duplicateMap.get(dupId);
            if (dupResult) {
              dupResult.isDuplicate = true;
              dupResult.duplicateConfidence = 100;
              dupResult.matchReason = 'Duplicate within uploaded file';
            }
          }
        }

        // Run categorization (batch operation)
        const categorySuggestions = await categorizeTransactions(
          parseResult.transactions.map(t => ({
            description: t.description,
            amount: t.amount,
          })),
          tenantId!  // Asserted non-null - we verified tenant access above
        );

        // Merge duplicate and category data with transactions
        const enrichedTransactions = parseResult.transactions.map((t: ParsedTransaction, index: number) => {
          const duplicateInfo = duplicateMap.get(t.tempId);
          const categorySuggestion = categorySuggestions[index];

          return {
            ...t,
            isDuplicate: duplicateInfo?.isDuplicate || false,
            duplicateConfidence: duplicateInfo?.duplicateConfidence,
            matchedTransactionId: duplicateInfo?.matchedTransactionId,
            matchReason: duplicateInfo?.matchReason,
            suggestedCategory: categorySuggestion.categoryId && categorySuggestion.categoryName
              ? {
                  id: categorySuggestion.categoryId,
                  name: categorySuggestion.categoryName,  // Now guaranteed non-null
                  confidence: categorySuggestion.confidence,
                  reason: categorySuggestion.matchReason,
                }
              : undefined,
          };
        });

        // Calculate summary statistics
        const duplicateCount = enrichedTransactions.filter(t => t.isDuplicate).length;
        const categorizedCount = enrichedTransactions.filter(
          t => t.suggestedCategory && t.suggestedCategory.confidence >= 70
        ).length;
        const needsReviewCount = enrichedTransactions.filter(
          t => !t.isDuplicate && (!t.suggestedCategory || t.suggestedCategory.confidence < 70)
        ).length;

        // If no accountId provided, suggest matching accounts based on external identifiers
        let suggestedAccounts: SuggestedAccount[] = [];
        if (!accountId && parseResult.externalAccountData && tenantId) {
          // Get all entities for this tenant
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

          // Score each account for matching
          for (const entity of entities) {
            for (const acc of entity.accounts) {
              let score = 0;
              const reasons: string[] = [];

              // Match currency (if we can infer it from transactions)
              const externalData = parseResult.externalAccountData;

              // Match account type
              if (externalData?.accountType && acc.type.toLowerCase() === externalData.accountType) {
                score += 20;
                reasons.push('Account type match');
              }

              // Match institution name from account name/institution field
              if (externalData?.institutionName && acc.institution) {
                const normalizedExternal = externalData.institutionName.toLowerCase();
                const normalizedStored = acc.institution.toLowerCase();

                if (normalizedExternal.includes(normalizedStored) || normalizedStored.includes(normalizedExternal)) {
                  score += 30;
                  reasons.push('Institution match');
                }
              }

              // TODO: Add ImportBatch.metadata field to schema for external identifier matching
              // This would allow matching by account number and other identifiers from previous imports

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

          // Sort by match score (descending)
          suggestedAccounts.sort((a, b) => b.matchScore - a.matchScore);

          // Return top 5 suggestions
          suggestedAccounts = suggestedAccounts.slice(0, 5);
        }

        // SECURITY: Check cache limits before adding
        // Note: userId is guaranteed by authMiddleware
        if (!canAddToCache(request.userId!, fileSize)) {
          return reply.status(429).send({
            error: 'Too Many Requests',
            message: 'Cache limit reached. Please wait a few minutes and try again, or complete pending imports.',
          });
        }

        // Store parsed data in cache with user/tenant tracking
        parseCache.set(parseId, {
          userId: request.userId!,        // SECURITY: Track ownership (guaranteed by authMiddleware)
          tenantId: tenantId!,            // SECURITY: Track tenant
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

        // Return preview with duplicate detection and categorization
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

        // Add suggested accounts if no accountId was provided
        if (!accountId) {
          response.suggestedAccounts = suggestedAccounts;
          response.requiresAccountSelection = true;
        }

        return reply.status(200).send(response);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error uploading file');

        // Handle specific parsing errors
        if (error instanceof Error && error.message?.includes('CSV parsing error')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }

        if (error instanceof Error && (error.message?.includes('Invalid date') || error.message?.includes('Invalid amount'))) {
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
   * POST /api/import/update-mapping
   *
   * Update column mappings for CSV/XLSX (before confirming import)
   */
  fastify.post(
    '/import/update-mapping',
    {
      onRequest: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { parseId, columnMappings } = request.body as { parseId: string; columnMappings: ColumnMappings };

        // Retrieve cached parse data
        const cached = parseCache.get(parseId);
        if (!cached) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Parse session not found or expired. Please upload the file again.',
          });
        }

        // Re-parse with new column mappings
        // IMPROVEMENT NEEDED: Store original file buffer in cache for re-parsing
        // Current workaround: User must re-upload file with new mappings
        // Reason for limitation: Keeping memory footprint low (avoiding 10MB+ buffers in cache)
        // Future: Store in Redis or S3 with presigned URL
        const fileBuffer = Buffer.from([]);
        // For now, return error asking to re-upload
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Column mapping update requires re-uploading the file (will be fixed in next iteration)',
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
   * GET /api/import/parse/:parseId
   *
   * Get cached parse data by parseId
   */
  fastify.get(
    '/import/parse/:parseId',
    {
      onRequest: [authMiddleware],
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

        // SECURITY: Verify this parseId belongs to the requesting user
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

        // SECURITY: Double-check tenant isolation via database
        // Verify user still has access to the tenant (in case membership was revoked)
        const user = await prisma.user.findFirst({
          where: {
            clerkUserId: request.userId,
            memberships: {
              some: {
                tenantId: cached.tenantId,
              },
            },
          },
        });

        if (!user) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Access denied - tenant membership not found',
          });
        }

        // If accountId is provided in cache, verify access to that specific account
        if (cached.accountId) {
          const account = await prisma.account.findFirst({
            where: {
              id: cached.accountId,
              entity: {
                tenant: {
                  memberships: {
                    some: {
                      user: {
                        clerkUserId: request.userId,
                      },
                    },
                  },
                },
              },
            },
          });

          if (!account) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'Access denied - account not found or no access',
            });
          }
        }

        // Calculate summary from cached enriched transactions
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
