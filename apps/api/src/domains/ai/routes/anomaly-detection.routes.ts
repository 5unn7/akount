import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AnomalyDetectionService, type AnomalyType } from '../services/anomaly-detection.service';
import { queueManager } from '../../../lib/queue/queue-manager';
import type { AnomalyDetectionJobData } from '../workers/anomaly-detection.worker';

/**
 * Anomaly Detection Routes (DEV-252, C7)
 *
 * **Endpoints:**
 * - POST /anomaly-detection/detect — Run anomaly detection synchronously
 * - POST /anomaly-detection/schedule — Schedule anomaly detection job (BullMQ)
 * - GET /anomaly-detection/jobs/:jobId — Get job status
 *
 * @module anomaly-detection-routes
 */

const DetectAnomaliesSchema = z.object({
  entityId: z.string().cuid(),
  types: z.array(z.enum(['subscription_creep', 'cash_flow_danger', 'missing_transactions'])).optional(),
});

const ScheduleDetectionSchema = z.object({
  entityId: z.string().cuid(),
});

const anomalyDetectionRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /anomaly-detection/detect
   *
   * Run anomaly detection synchronously (for immediate results).
   * Use this for manual triggers or on-demand analysis.
   */
  fastify.post<{
    Body: z.infer<typeof DetectAnomaliesSchema>;
  }>(
    '/detect',
    {
      schema: {
        body: DetectAnomaliesSchema,
        response: {
          200: z.object({
            generated: z.number(),
            updated: z.number(),
            errors: z.array(z.string()),
            anomalies: z.object({
              subscriptionCreep: z.number(),
              cashFlowDanger: z.number(),
              missingTransactions: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { entityId, types } = request.body;
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      fastify.log.info(
        { tenantId, entityId, userId, types },
        'Running anomaly detection'
      );

      // Initialize service
      const service = new AnomalyDetectionService(tenantId, userId, entityId);

      // Run detection
      const summary = await service.detectAnomalies(types as AnomalyType[] | undefined);

      fastify.log.info(
        { tenantId, entityId, generated: summary.generated },
        'Anomaly detection completed'
      );

      return reply.status(200).send(summary);
    }
  );

  /**
   * POST /anomaly-detection/schedule
   *
   * Schedule an anomaly detection job via BullMQ (async).
   * Returns job ID for status tracking.
   */
  fastify.post<{
    Body: z.infer<typeof ScheduleDetectionSchema>;
  }>(
    '/schedule',
    {
      schema: {
        body: ScheduleDetectionSchema,
        response: {
          202: z.object({
            jobId: z.string(),
            status: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { entityId } = request.body;
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      fastify.log.info(
        { tenantId, entityId, userId },
        'Scheduling anomaly detection job'
      );

      // Check rate limit (INFRA-63)
      const allowed = await queueManager.checkRateLimit(tenantId);
      if (!allowed) {
        return reply.status(429).send({
          error: 'Rate limit exceeded',
          message: 'You have submitted too many jobs. Please try again later.',
        });
      }

      // Create job data
      const jobData: AnomalyDetectionJobData = {
        jobId: `anomaly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId,
        entityId,
        userId,
      };

      // Add job to queue
      const queue = queueManager.getQueue('anomaly-detection');
      const job = await queue.add('detect-anomalies', jobData, {
        removeOnComplete: {
          age: 86400, // Keep for 24 hours
        },
      });

      fastify.log.info(
        { tenantId, entityId, jobId: job.id },
        'Anomaly detection job scheduled'
      );

      return reply.status(202).send({
        jobId: job.id as string,
        status: 'scheduled',
        message: 'Anomaly detection job scheduled successfully',
      });
    }
  );

  /**
   * GET /anomaly-detection/jobs/:jobId
   *
   * Get anomaly detection job status and results.
   */
  fastify.get<{
    Params: { jobId: string };
  }>(
    '/jobs/:jobId',
    {
      schema: {
        params: z.object({
          jobId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { jobId } = request.params;
      const tenantId = request.tenantId!;

      fastify.log.info({ tenantId, jobId }, 'Fetching anomaly detection job status');

      const queue = queueManager.getQueue('anomaly-detection');
      const job = await queue.getJob(jobId);

      if (!job) {
        return reply.status(404).send({
          error: 'Job not found',
          message: `No anomaly detection job found with ID: ${jobId}`,
        });
      }

      // Verify tenant owns this job (security check)
      if (job.data.tenantId !== tenantId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied to this job',
        });
      }

      const state = await job.getState();
      const progress = job.progress as number | object;

      const response: {
        jobId: string;
        status: string;
        progress: number | object;
        result?: unknown;
        error?: string;
      } = {
        jobId: job.id as string,
        status: state,
        progress,
      };

      // Include result if completed
      if (state === 'completed' && job.returnvalue) {
        response.result = job.returnvalue;
      }

      // Include error if failed
      if (state === 'failed' && job.failedReason) {
        response.error = job.failedReason;
      }

      return reply.status(200).send(response);
    }
  );
};

export default anomalyDetectionRoutes;
