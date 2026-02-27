import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Job } from 'bullmq';
import { queueManager, type QueueName } from '../../../lib/queue/queue-manager';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { logger } from '../../../lib/logger';

/**
 * Job Stream Routes (DEV-233)
 *
 * Server-Sent Events endpoint for real-time job status updates.
 *
 * **Usage:**
 * ```typescript
 * const eventSource = new EventSource('/api/ai/jobs/{jobId}/stream');
 * eventSource.addEventListener('progress', (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log('Progress:', data.progress);
 * });
 * ```
 *
 * **Events emitted:**
 * - `progress` — Job progress update (0-100%)
 * - `completed` — Job completed successfully
 * - `failed` — Job failed with error
 * - `active` — Job started processing
 * - `stalled` — Job stalled (worker timeout)
 *
 * **Headers:**
 * - `Content-Type: text/event-stream`
 * - `Cache-Control: no-cache`
 * - `Connection: keep-alive`
 */
export async function jobStreamRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  /**
   * GET /api/ai/jobs/:jobId/stream
   *
   * Stream real-time job status updates via Server-Sent Events.
   *
   * **Security:**
   * - Requires authentication (JWT)
   * - Tenant isolation (job must belong to authenticated tenant)
   * - Auto-disconnect after 5 minutes or when client closes connection
   */
  fastify.get(
    '/:jobId/stream',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { jobId } = request.params as { jobId: string };
      const tenantId = request.tenantId!;

      // Validate jobId format (BullMQ job IDs are numeric strings)
      if (!/^\d+$/.test(jobId)) {
        return reply.status(400).send({ error: 'Invalid job ID format' });
      }

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });

      // Send initial connection confirmation
      reply.raw.write(`data: ${JSON.stringify({ event: 'connected', jobId })}\n\n`);

      let job: Job | undefined;
      let queueName: QueueName | undefined;
      let heartbeatInterval: NodeJS.Timeout | undefined;

      // Find which queue contains this job (check all queues)
      try {
        const queueNames = queueManager.getQueueNames();

        for (const name of queueNames) {
          const queue = queueManager.getQueue(name);
          const foundJob = await queue.getJob(jobId);

          if (foundJob) {
            job = foundJob;
            queueName = name;
            break;
          }
        }

        if (!job || !queueName) {
          reply.raw.write(
            `data: ${JSON.stringify({ event: 'error', error: 'Job not found' })}\n\n`
          );
          reply.raw.end();
          return;
        }

        // Verify job belongs to this tenant (security check)
        const jobData = job.data as { tenantId?: string };
        if (jobData.tenantId !== tenantId) {
          logger.warn({ jobId, tenantId, jobTenantId: jobData.tenantId }, 'Tenant mismatch for job stream');
          reply.raw.write(
            `data: ${JSON.stringify({ event: 'error', error: 'Access denied' })}\n\n`
          );
          reply.raw.end();
          return;
        }

        logger.info({ jobId, queueName, tenantId }, 'Job stream started');

        // Send initial job state
        const state = await job.getState();
        const progress = job.progress || 0;

        reply.raw.write(
          `data: ${JSON.stringify({ event: 'initial', state, progress, jobId })}\n\n`
        );

        // Set up BullMQ event listeners
        const queue = queueManager.getQueue(queueName);

        const onProgress = async (updatedJob: Job, progressValue: number | object) => {
          if (updatedJob.id === jobId) {
            reply.raw.write(
              `data: ${JSON.stringify({ event: 'progress', progress: progressValue, jobId })}\n\n`
            );
          }
        };

        const onCompleted = async (completedJob: Job, result: unknown) => {
          if (completedJob.id === jobId) {
            reply.raw.write(
              `data: ${JSON.stringify({ event: 'completed', result, jobId })}\n\n`
            );
            reply.raw.end();
          }
        };

        const onFailed = async (failedJob: Job | undefined, error: Error) => {
          if (failedJob?.id === jobId) {
            reply.raw.write(
              `data: ${JSON.stringify({ event: 'failed', error: error.message, jobId })}\n\n`
            );
            reply.raw.end();
          }
        };

        const onActive = async (activeJob: Job) => {
          if (activeJob.id === jobId) {
            reply.raw.write(
              `data: ${JSON.stringify({ event: 'active', jobId })}\n\n`
            );
          }
        };

        const onStalled = async (stalledJobId: string) => {
          if (stalledJobId === jobId) {
            reply.raw.write(
              `data: ${JSON.stringify({ event: 'stalled', jobId })}\n\n`
            );
          }
        };

        // Attach listeners
        queue.on('progress', onProgress);
        queue.on('completed', onCompleted);
        queue.on('failed', onFailed);
        queue.on('active', onActive);
        queue.on('stalled', onStalled);

        // Send heartbeat every 15 seconds to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (!reply.raw.destroyed) {
            reply.raw.write(`: heartbeat\n\n`);
          }
        }, 15000);

        // Cleanup on client disconnect
        request.raw.on('close', () => {
          logger.info({ jobId, queueName }, 'Job stream client disconnected');

          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }

          // Remove event listeners
          queue.off('progress', onProgress);
          queue.off('completed', onCompleted);
          queue.off('failed', onFailed);
          queue.off('active', onActive);
          queue.off('stalled', onStalled);

          if (!reply.raw.destroyed) {
            reply.raw.end();
          }
        });

        // Auto-disconnect after 5 minutes (safety measure)
        setTimeout(() => {
          if (!reply.raw.destroyed) {
            logger.info({ jobId }, 'Job stream timeout — disconnecting after 5 minutes');
            reply.raw.write(
              `data: ${JSON.stringify({ event: 'timeout', jobId })}\n\n`
            );
            reply.raw.end();
          }
        }, 5 * 60 * 1000);

      } catch (error: unknown) {
        logger.error({ err: error, jobId }, 'Job stream error');
        if (!reply.raw.destroyed) {
          reply.raw.write(
            `data: ${JSON.stringify({ event: 'error', error: 'Internal server error' })}\n\n`
          );
          reply.raw.end();
        }
      }
    }
  );
}
