import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { queueManager } from '../../../lib/queue/queue-manager';
import { scanFile } from '../../../lib/file-scanner';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { requireConsent } from '../../../middleware/consent-gate';
import { validateBody } from '../../../middleware/validation';
import { handleBusinessError } from '../errors';
import { logger } from '../../../lib/logger';

/**
 * Bill Scan Routes (DEV-240)
 *
 * API endpoint for uploading and scanning bills/receipts via AI.
 *
 * **Flow:**
 * 1. Client uploads image/PDF
 * 2. File security scan (SEC-31)
 * 3. Enqueue job to bill-scan queue (DEV-238)
 * 4. Return jobId for SSE tracking (DEV-233)
 *
 * **Client usage:**
 * ```typescript
 * // Upload bill
 * const formData = new FormData();
 * formData.append('file', billImage);
 * formData.append('entityId', 'entity-123');
 *
 * const response = await fetch('/api/business/bills/scan', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const { jobId } = await response.json();
 *
 * // Track progress via SSE
 * const eventSource = new EventSource(`/api/ai/jobs/${jobId}/stream`);
 * ```
 */

const ScanBillBodySchema = z.object({
  /** Entity ID for the bill */
  entityId: z.string().cuid(),
});

export type ScanBillInput = z.infer<typeof ScanBillBodySchema>;

export async function billScanRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  /**
   * POST /api/business/bills/scan
   *
   * Upload and scan a bill/receipt image.
   *
   * **Accepts:** multipart/form-data with file + entityId
   * **Returns:** { jobId, status: 'queued' }
   *
   * **Security:**
   * - File scanner (magic bytes, polyglot detection, size limit)
   * - Rate limiting (100 jobs/tenant/minute via queueManager)
   * - Tenant isolation (entity ownership validation)
   */
  fastify.post(
    '/scan',
    {
      preHandler: [requireConsent('autoCreateBills')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      try {
        // Parse multipart form data
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Get entityId from fields
        const fields = data.fields as { entityId?: { value: string } };
        const entityId = fields.entityId?.value;

        if (!entityId) {
          return reply.status(400).send({ error: 'entityId required' });
        }

        // SEC-47: Validate entityId format with Zod
        const entityIdValidation = z.string().cuid().safeParse(entityId);
        if (!entityIdValidation.success) {
          return reply.status(400).send({
            error: 'Invalid entityId format',
            details: entityIdValidation.error.errors,
          });
        }

        // Validate entityId belongs to tenant (IDOR prevention)
        const entity = await prisma.entity.findFirst({
          where: { id: entityId, tenantId },
          select: { id: true },
        });

        if (!entity) {
          return reply.status(404).send({ error: 'Entity not found or access denied' });
        }

        // Read file buffer
        const fileBuffer = await data.toBuffer();
        const filename = data.filename;
        const mimeType = data.mimetype;

        logger.info(
          { tenantId, entityId, filename, mimeType, size: fileBuffer.length },
          'Bill upload received'
        );

        // Security scan (SEC-31)
        const fileType = mimeType.split('/')[1]; // image/jpeg → jpeg
        const scanResult = await scanFile(fileBuffer, fileType);

        if (!scanResult.safe) {
          logger.warn(
            { tenantId, filename, threats: scanResult.threats },
            'Bill upload rejected by security scan'
          );

          return reply.status(422).send({
            error: 'File security scan failed',
            threats: scanResult.threats,
          });
        }

        // Check rate limit (INFRA-63)
        if (!queueManager.checkRateLimit(tenantId)) {
          const rateLimitStatus = queueManager.getRateLimitStatus(tenantId);

          return reply.status(429).send({
            error: 'Rate limit exceeded',
            message: `You have submitted ${rateLimitStatus.current}/${rateLimitStatus.limit} jobs in the last minute. Please try again later.`,
            retryAfter: 60,
          });
        }

        // Enqueue job to bill-scan queue
        const queue = queueManager.getQueue('bill-scan');

        const job = await queue.add('scan-bill', {
          jobId: `bill-scan-${Date.now()}`,
          tenantId,
          entityId,
          userId,
          imageBase64: fileBuffer.toString('base64'),
          filename,
          mimeType,
        });

        // UX-107: Use request.log for request-scoped logging (includes request ID)
        request.log.info(
          { tenantId, entityId, jobId: job.id, filename },
          'Bill scan job enqueued successfully'
        );

        return reply.status(202).send({
          jobId: job.id,
          status: 'queued',
          message: 'Bill scan job created. Use /api/ai/jobs/{jobId}/stream to track progress.',
          streamUrl: `/api/ai/jobs/${job.id}/stream`,
        });
      } catch (error: unknown) {
        logger.error({ err: error, tenantId }, 'Bill scan endpoint error');
        return handleBusinessError(error, reply);
      }
    }
  );
}
