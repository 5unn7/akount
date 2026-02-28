import type { FastifyInstance } from 'fastify';
import {
  deleteUserAIData,
  checkUserAIData,
  estimateDeletionTime,
} from '../services/ai-data-deletion.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';

/**
 * AI Data Deletion Routes (SEC-35)
 *
 * Implements GDPR Article 17 (Right to Erasure) for AI-related personal data.
 *
 * **Endpoints:**
 * - GET /api/system/ai-data/check - Check what AI data exists for current user
 * - DELETE /api/system/ai-data - Delete all AI data for current user
 * - GET /api/system/ai-data/deletion-estimate - Estimate deletion time
 *
 * **Security:**
 * - Requires authentication (authMiddleware)
 * - Requires tenant membership (tenantMiddleware)
 * - User can only delete their own data (enforced by userId from auth)
 *
 * **Compliance:**
 * - GDPR Article 17 (Right to Erasure) - 24 hour SLA
 * - CCPA Section 1798.105 (Right to Delete)
 * - PIPEDA 4.5 (Retention limits)
 *
 * @module ai-data-deletion.routes
 */

export async function aiDataDeletionRoutes(fastify: FastifyInstance) {
  /**
   * Check what AI data exists for current user
   *
   * GET /api/system/ai-data/check
   *
   * Useful for showing users what data will be deleted before they confirm.
   */
  fastify.get(
    '/check',
    {
      preHandler: [authMiddleware, tenantMiddleware],
    },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const data = await checkUserAIData(userId);

        request.log.info({ userId, data }, 'AI data check completed');

        return reply.status(200).send({
          userId,
          data,
          message: data.hasAIConsent
            ? 'You have AI data that can be deleted'
            : 'No AI data found for your account',
        });
      } catch (error: unknown) {
        request.log.error({ err: error, userId }, 'AI data check failed');

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to check AI data',
        });
      }
    }
  );

  /**
   * Get estimated deletion time
   *
   * GET /api/system/ai-data/deletion-estimate
   *
   * Returns estimated time for deletion to complete (for SLA transparency).
   */
  fastify.get(
    '/deletion-estimate',
    {
      preHandler: [authMiddleware, tenantMiddleware],
    },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const estimatedMs = await estimateDeletionTime(userId);

        request.log.info({ userId, estimatedMs }, 'Deletion time estimated');

        return reply.status(200).send({
          userId,
          estimatedMs,
          estimatedSeconds: Math.ceil(estimatedMs / 1000),
          slaHours: 24,
          message: `Deletion will complete in approximately ${Math.ceil(estimatedMs / 1000)} seconds (SLA: 24 hours)`,
        });
      } catch (error: unknown) {
        request.log.error({ err: error, userId }, 'Deletion estimate failed');

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to estimate deletion time',
        });
      }
    }
  );

  /**
   * Delete all AI data for current user
   *
   * DELETE /api/system/ai-data
   *
   * **DESTRUCTIVE ACTION** - Cannot be undone.
   * Deletes all AI-related personal data while preserving financial records.
   *
   * **SLA:** Completes within 24 hours (usually instant for current data volume).
   */
  fastify.delete(
    '/',
    {
      preHandler: [authMiddleware, tenantMiddleware],
    },
    async (request, reply) => {
      const userId = request.userId!;
      const tenantId = request.tenantId!;

      try {
        // Check if user has any AI data first
        const dataCheck = await checkUserAIData(userId);
        const hasAnyData = Object.values(dataCheck).some((v) => v === true);

        if (!hasAnyData) {
          request.log.info({ userId }, 'No AI data to delete');

          return reply.status(200).send({
            userId,
            message: 'No AI data found for your account',
            deletedAt: new Date().toISOString(),
            itemsDeleted: {
              aiConsent: false,
              uploadedDocuments: 0,
              trainingData: 0,
              ragEntries: 0,
              llmLogs: 0,
            },
          });
        }

        // Perform deletion
        const result = await deleteUserAIData(userId);

        request.log.info(
          {
            userId,
            tenantId,
            itemsDeleted: result.itemsDeleted,
            auditLogId: result.auditLogId,
          },
          'AI data deleted successfully (GDPR erasure)'
        );

        return reply.status(200).send({
          ...result,
          message: 'AI data deleted successfully',
          sla: '24 hours',
          completedAt: result.deletedAt.toISOString(),
        });
      } catch (error: unknown) {
        request.log.error(
          { err: error, userId, tenantId },
          'AI data deletion failed'
        );

        return reply.status(500).send({
          error: 'Internal Server Error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to delete AI data',
        });
      }
    }
  );
}
