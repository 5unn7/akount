import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { queueManager } from '../../../lib/queue/queue-manager';
import { scanFile } from '../../../lib/file-scanner';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { requireConsent } from '../../../middleware/consent-gate';
import { logger } from '../../../lib/logger';

/**
 * Invoice Scan Routes (DEV-241)
 *
 * API endpoint for uploading and scanning invoices via AI.
 *
 * **Flow:**
 * 1. Client uploads image/PDF
 * 2. File security scan (SEC-31)
 * 3. Enqueue job to invoice-scan queue (DEV-239)
 * 4. Return jobId for SSE tracking (DEV-233)
 *
 * **Client usage:**
 * ```typescript
 * // Upload invoice
 * const formData = new FormData();
 * formData.append('file', invoiceImage);
 * formData.append('entityId', 'entity-123');
 *
 * const response = await fetch('/api/business/invoices/scan', {
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

const ScanInvoiceBodySchema = z.object({
  /** Entity ID for the invoice */
  entityId: z.string().cuid(),
});

export type ScanInvoiceInput = z.infer<typeof ScanInvoiceBodySchema>;

export async function invoiceScanRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  /**
   * POST /api/business/invoices/scan
   *
   * Upload and scan an invoice image.
   *
   * **Accepts:** multipart/form-data with file + entityId
   * **Returns:** { jobId, status: 'queued', streamUrl }
   *
   * **Security:**
   * - File scanner (magic bytes, polyglot detection, size limit)
   * - Rate limiting (100 jobs/tenant/minute via queueManager)
   * - Tenant isolation (entity ownership validation)
   */
  fastify.post(
    '/scan',
    {
      preHandler: [requireConsent('autoCreateInvoices')],
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
          'Invoice upload received'
        );

        // Security scan (SEC-31)
        const fileType = mimeType.split('/')[1]; // image/jpeg → jpeg
        const scanResult = await scanFile(fileBuffer, fileType);

        if (!scanResult.safe) {
          logger.warn(
            { tenantId, filename, threats: scanResult.threats },
            'Invoice upload rejected by security scan'
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

        // Enqueue job to invoice-scan queue
        const queue = queueManager.getQueue('invoice-scan');

        const job = await queue.add('scan-invoice', {
          jobId: `invoice-scan-${Date.now()}`,
          tenantId,
          entityId,
          userId,
          imageBase64: fileBuffer.toString('base64'),
          filename,
          mimeType,
        });

        logger.info(
          { tenantId, entityId, jobId: job.id, filename },
          'Invoice scan job enqueued'
        );

        return reply.status(202).send({
          jobId: job.id,
          status: 'queued',
          message: 'Invoice scan job created. Use /api/ai/jobs/{jobId}/stream to track progress.',
          streamUrl: `/api/ai/jobs/${job.id}/stream`,
        });
      } catch (error: unknown) {
        logger.error({ err: error, tenantId }, 'Invoice scan endpoint error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );
}
