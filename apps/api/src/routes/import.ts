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
  type ImportBatchMetadata,
} from '../schemas/import';
import { parseCSV, parsePDF } from '../services/parserService';
import { findDuplicates, findInternalDuplicates } from '../services/duplicationService';
import { categorizeTransactions } from '../services/categorizationService';
import { matchAccountToBankConnection, findDuplicateAccounts } from '../services/accountMatcherService';
import { randomUUID } from 'crypto';

/**
 * Import routes for bank statement import feature
 *
 * Handles file upload, parsing, column mapping, and transaction import
 */

// In-memory cache for parsed data (parseId -> parsed data)
// TODO: Replace with Redis in production for multi-server support
const parseCache = new Map<string, {
  accountId: string;
  fileName: string;
  fileSize: number;
  sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
  columns?: string[];
  columnMappings?: any;
  preview?: any;
  transactions: ParsedTransaction[];
  externalAccountData?: ExternalAccountData;
  createdAt: Date;
}>();

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
        const accountId = (data.fields as any).accountId?.value; // Optional now
        const dateFormat = (data.fields as any).dateFormat?.value;
        const entityId = (data.fields as any).entityId?.value; // For account suggestions

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

        // Validate file type
        const fileName = data.filename;
        const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
        const validExtensions = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls'];

        if (!ext || !validExtensions.includes(ext)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Invalid file type. Supported formats: CSV, PDF, OFX, XLSX. Got: ${ext || 'unknown'}`,
          });
        }

        // If accountId provided, verify ownership (tenant isolation)
        let account: any = null;
        let tenantId: string | null = null;

        if (accountId) {
          account = await prisma.account.findFirst({
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

          if (!account) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'Account not found or access denied',
            });
          }

          tenantId = account.entity.tenantId;
        } else {
          // No accountId provided - get user's tenant for later suggestions
          const user = await prisma.user.findUnique({
            where: { clerkUserId: request.userId },
            include: {
              tenantMemberships: {
                include: {
                  tenant: true,
                },
                take: 1,
              },
            },
          });

          if (!user || user.tenantMemberships.length === 0) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'User has no tenant access',
            });
          }

          tenantId = user.tenantMemberships[0].tenant.id;
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
        let parseResult: any;

        if (sourceType === 'CSV') {
          parseResult = parseCSV(fileBuffer, undefined, dateFormat);
        } else if (sourceType === 'PDF') {
          parseResult = await parsePDF(fileBuffer, dateFormat);
        } else {
          // TODO: Implement OFX and XLSX parsing in Phase 2
          return reply.status(501).send({
            error: 'Not Implemented',
            message: `${sourceType} parsing will be implemented in Phase 2. Please use CSV export for now.`,
          });
        }

        // Generate parse ID
        const parseId = randomUUID();

        // Run duplicate detection (only if accountId is provided)
        let duplicateResults: any[] = [];
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
          tenantId
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
            suggestedCategory: categorySuggestion.categoryId
              ? {
                  id: categorySuggestion.categoryId,
                  name: categorySuggestion.categoryName,
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
        let suggestedAccounts: any[] = [];
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
              if (externalData.accountType && acc.type.toLowerCase() === externalData.accountType) {
                score += 20;
                reasons.push('Account type match');
              }

              // Check import batch metadata for external identifiers
              const importBatch = acc.transactions[0]?.importBatch;
              if (importBatch?.metadata) {
                const metadata = importBatch.metadata as any;
                const storedExternalData = metadata.externalAccountData || {};

                // Match masked account number
                if (
                  externalData.externalAccountId &&
                  storedExternalData.externalAccountId &&
                  externalData.externalAccountId.endsWith(
                    storedExternalData.externalAccountId.slice(-4)
                  )
                ) {
                  score += 50;
                  reasons.push(`Account number match (${externalData.externalAccountId})`);
                }

                // Match institution name
                if (externalData.institutionName && storedExternalData.institutionName) {
                  const normalizedExternal = externalData.institutionName.toLowerCase();
                  const normalizedStored = storedExternalData.institutionName.toLowerCase();

                  if (normalizedExternal.includes(normalizedStored) || normalizedStored.includes(normalizedExternal)) {
                    score += 30;
                    reasons.push('Institution match');
                  }
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

          // Sort by match score (descending)
          suggestedAccounts.sort((a, b) => b.matchScore - a.matchScore);

          // Return top 5 suggestions
          suggestedAccounts = suggestedAccounts.slice(0, 5);
        }

        // Store parsed data in cache
        parseCache.set(parseId, {
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
        const response: any = {
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
      } catch (error: any) {
        request.log.error({ error }, 'Error uploading file');

        // Handle specific parsing errors
        if (error.message?.includes('CSV parsing error')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }

        if (error.message?.includes('Invalid date') || error.message?.includes('Invalid amount')) {
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
        const { parseId, columnMappings } = request.body as any;

        // Retrieve cached parse data
        const cached = parseCache.get(parseId);
        if (!cached) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Parse session not found or expired. Please upload the file again.',
          });
        }

        // Re-parse with new column mappings
        const fileBuffer = Buffer.from([]); // TODO: Store original file buffer in cache
        // For now, return error asking to re-upload
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Column mapping update requires re-uploading the file (will be fixed in next iteration)',
        });
      } catch (error: any) {
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
        const { parseId } = request.params as any;

        const cached = parseCache.get(parseId);
        if (!cached) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Parse session not found or expired.',
          });
        }

        // Verify user has access to this account (tenant isolation)
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
            message: 'Access denied',
          });
        }

        // Calculate summary from cached enriched transactions
        const duplicateCount = cached.transactions.filter((t: any) => t.isDuplicate).length;
        const categorizedCount = cached.transactions.filter(
          (t: any) => t.suggestedCategory && t.suggestedCategory.confidence >= 70
        ).length;
        const needsReviewCount = cached.transactions.filter(
          (t: any) => !t.isDuplicate && (!t.suggestedCategory || t.suggestedCategory.confidence < 70)
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
      } catch (error: any) {
        request.log.error({ error }, 'Error retrieving parse data');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while retrieving parse data.',
        });
      }
    }
  );
}
