import { prisma } from '@akount/db';
import { logger } from '../../../lib/logger';
import { deleteUserConsent } from './ai-consent.service';

/**
 * AI Data Deletion Service (SEC-35)
 *
 * Implements GDPR Article 17 (Right to Erasure) for AI-related personal data.
 *
 * **What is deleted:**
 * - AI consent preferences (AIConsent)
 * - Uploaded documents (future: file storage metadata)
 * - Training/correction data (future: RAG store entries)
 * - LLM prompt/response logs (future: when implemented)
 *
 * **What is preserved:**
 * - Financial records created by AI (invoices, bills, journal entries)
 *   These are TENANT-owned business records, not user personal data.
 * - Tenant-level AI decision logs (AIDecisionLog)
 *   These log business decisions, not user personal data.
 *
 * **SLA:** Maximum 24 hours for complete erasure.
 *
 * **Compliance:**
 * - GDPR Article 17 (Right to Erasure)
 * - CCPA Section 1798.105 (Right to Delete)
 * - PIPEDA 4.5 (Retention limits)
 *
 * @module ai-data-deletion
 */

export interface DeletionResult {
  userId: string;
  deletedAt: Date;
  itemsDeleted: {
    aiConsent: boolean;
    uploadedDocuments: number;
    trainingData: number;
    ragEntries: number;
    llmLogs: number;
  };
  preservedRecords: {
    financialRecords: string[]; // List of preserved record types
    tenantDecisionLogs: boolean; // AIDecisionLog preserved
  };
  auditLogId?: string; // Audit log entry ID for this deletion
}

/**
 * Delete all AI-related personal data for a user.
 *
 * This function implements GDPR Article 17 (Right to Erasure) by removing
 * all AI-related personal data while preserving tenant-owned business records.
 *
 * **User vs Tenant data distinction:**
 * - User personal data: Consent preferences, uploaded files, corrections
 * - Tenant business data: Financial records, decision logs, aggregated insights
 *
 * @param userId - User ID to delete data for
 * @returns Deletion result summary
 *
 * @throws Error if userId is invalid or deletion fails
 *
 * @example
 * ```typescript
 * const result = await deleteUserAIData('user_123');
 * console.log(`Deleted AI consent: ${result.itemsDeleted.aiConsent}`);
 * console.log(`Preserved financial records: ${result.preservedRecords.financialRecords.join(', ')}`);
 * ```
 */
export async function deleteUserAIData(userId: string): Promise<DeletionResult> {
  if (!userId) {
    throw new Error('userId is required for AI data deletion');
  }

  logger.info({ userId }, 'Starting GDPR AI data deletion for user');

  const deletionStart = new Date();
  const result: DeletionResult = {
    userId,
    deletedAt: deletionStart,
    itemsDeleted: {
      aiConsent: false,
      uploadedDocuments: 0,
      trainingData: 0,
      ragEntries: 0,
      llmLogs: 0,
    },
    preservedRecords: {
      financialRecords: [
        'Invoice',
        'Bill',
        'JournalEntry',
        'Payment',
        'Transaction',
        'Category',
      ],
      tenantDecisionLogs: true,
    },
  };

  try {
    // Phase 1: Delete AI Consent (user's personal preferences)
    try {
      await deleteUserConsent(userId);
      result.itemsDeleted.aiConsent = true;
      logger.info({ userId }, 'AI consent deleted');
    } catch (error) {
      // If consent doesn't exist, that's OK (already deleted or never created)
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        logger.info({ userId }, 'AI consent already deleted or never existed');
        result.itemsDeleted.aiConsent = false;
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Phase 2: Delete uploaded documents (future implementation)
    // TODO: When file upload is implemented (Phase 2 B8-B11), add:
    // - Query Document model for userId
    // - Delete files from cloud storage (S3, etc.)
    // - Delete metadata from database
    // - Update result.itemsDeleted.uploadedDocuments
    logger.info({ userId }, 'Uploaded documents: Not yet implemented (Phase 2)');

    // Phase 3: Delete training/correction data (future implementation)
    // TODO: When user corrections are implemented (Phase 4 F2-F4), add:
    // - Query TrainingData or CorrectionLog for userId
    // - Delete correction entries
    // - Update result.itemsDeleted.trainingData
    logger.info({ userId }, 'Training data: Not yet implemented (Phase 4)');

    // Phase 4: Delete RAG store entries (future implementation)
    // TODO: When RAG is implemented (Phase 4 F1), add:
    // - Query RAGEntry model for userId (if user-scoped)
    // - Delete vector embeddings
    // - Update result.itemsDeleted.ragEntries
    logger.info({ userId }, 'RAG entries: Not yet implemented (Phase 4)');

    // Phase 5: Delete LLM prompt/response logs (future implementation)
    // TODO: When LLM logging is implemented, add:
    // - Query LLMLog model for userId (if tracking per-user)
    // - Delete prompt/response pairs
    // - Update result.itemsDeleted.llmLogs
    logger.info({ userId }, 'LLM logs: Not yet implemented (future)');

    // Create audit log entry for this deletion
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId: 'SYSTEM', // System-level action (not tenant-specific)
        userId,
        model: 'User',
        recordId: userId,
        action: 'DELETE', // Standard audit action
        before: {},
        after: {
          ...result.itemsDeleted,
          // GDPR metadata in after field (no separate metadata field in schema)
          deletionType: 'AI_DATA',
          gdprArticle: 17,
          gdprRightToErasure: true,
          preservedRecords: result.preservedRecords,
          completedAt: new Date().toISOString(),
        },
      },
    });

    result.auditLogId = auditLog.id;

    logger.info(
      {
        userId,
        itemsDeleted: result.itemsDeleted,
        auditLogId: auditLog.id,
        durationMs: Date.now() - deletionStart.getTime(),
      },
      'GDPR AI data deletion completed successfully'
    );

    return result;
  } catch (error) {
    logger.error(
      {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'GDPR AI data deletion failed'
    );

    throw new Error(
      `Failed to delete AI data for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if user has any AI data that would be deleted.
 *
 * Useful for showing users what data exists before deletion.
 *
 * @param userId - User ID to check
 * @returns Object indicating what AI data exists
 */
export async function checkUserAIData(userId: string): Promise<{
  hasAIConsent: boolean;
  hasUploadedDocuments: boolean;
  hasTrainingData: boolean;
  hasRAGEntries: boolean;
}> {
  const aiConsent = await prisma.aIConsent.findUnique({
    where: { userId },
    select: { id: true },
  });

  return {
    hasAIConsent: !!aiConsent,
    hasUploadedDocuments: false, // Future: Query Document model
    hasTrainingData: false, // Future: Query TrainingData model
    hasRAGEntries: false, // Future: Query RAGEntry model
  };
}

/**
 * Estimate time required for deletion (for SLA compliance).
 *
 * @param userId - User ID
 * @returns Estimated deletion time in milliseconds
 */
export async function estimateDeletionTime(userId: string): Promise<number> {
  const data = await checkUserAIData(userId);

  // Base time: 100ms
  let estimatedMs = 100;

  // AI Consent: +50ms
  if (data.hasAIConsent) estimatedMs += 50;

  // Future phases will add more time based on data volume
  // Uploaded documents: +100ms per document
  // Training data: +50ms per entry
  // RAG entries: +200ms per entry (vector deletion)

  // SLA: 24 hours = 86,400,000ms
  // Current max: ~1 second (well within SLA)
  return Math.min(estimatedMs, 1000); // Cap at 1 second for current implementation
}
