import type { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import { getRedisConnection, type QueueName } from '../../../lib/queue/queue-manager';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { requireRole } from '../../../middleware/rbac';

/**
 * Failed Jobs Admin Endpoint (P1-15)
 *
 * **Endpoint:** GET /api/system/jobs/failed
 *
 * View failed jobs across all queues for debugging and monitoring.
 * Admin-only endpoint for troubleshooting stuck/failed background jobs.
 *
 * @module failed-jobs.routes
 */

const QUEUE_NAMES: QueueName[] = ['bill-scan', 'invoice-scan', 'transaction-import', 'matching', 'anomaly-detection'];

export async function failedJobsRoutes(fastify: FastifyInstance) {
  /**
   * List failed jobs across all queues
   *
   * GET /api/system/jobs/failed
   */
  fastify.get(
    '/failed',
    {
      preHandler: [
        authMiddleware,
        tenantMiddleware,
        requireRole(['OWNER', 'ADMIN']),
      ],
    },
    async (request, reply) => {
      const tenantId = request.tenantId!;

      try {
        const failedJobs: Array<{
          id: string;
          queue: string;
          data: unknown;
          failedReason: string;
          attemptsMade: number;
          timestamp: number;
        }> = [];

        const connection = getRedisConnection();

        // Query failed jobs from each queue
        for (const queueName of QUEUE_NAMES) {
          const queue = new Queue(queueName, { connection });
          const failed = await queue.getFailed(0, 50); // Get last 50 failed jobs per queue

          for (const job of failed) {
            // Filter by tenant (job data should have tenantId)
            const jobData = job.data as { tenantId?: string };
            if (jobData.tenantId === tenantId) {
              failedJobs.push({
                id: job.id!,
                queue: queueName,
                data: job.data,
                failedReason: job.failedReason || 'Unknown error',
                attemptsMade: job.attemptsMade,
                timestamp: job.timestamp,
              });
            }
          }

          await queue.close();
        }

        // Sort by timestamp (most recent first)
        failedJobs.sort((a, b) => b.timestamp - a.timestamp);

        request.log.info(
          { tenantId, failedJobCount: failedJobs.length },
          'Retrieved failed jobs'
        );

        return reply.status(200).send({
          jobs: failedJobs,
          total: failedJobs.length,
        });
      } catch (error: unknown) {
        request.log.error({ err: error, tenantId }, 'Failed to retrieve failed jobs');

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve failed jobs',
        });
      }
    }
  );
}
