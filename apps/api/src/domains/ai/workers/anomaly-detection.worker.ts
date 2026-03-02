import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../../../lib/queue/queue-manager';
import { AnomalyDetectionService, type AnomalyDetectionSummary } from '../services/anomaly-detection.service';
import { logger } from '../../../lib/logger';

/**
 * Anomaly Detection Worker (DEV-252, C7)
 *
 * BullMQ worker for scheduled anomaly detection (daily).
 *
 * **Processing Flow:**
 * 1. Initialize AnomalyDetectionService
 * 2. Run all 3 analyzers (subscription creep, cash flow danger, missing transactions)
 * 3. Upsert insights via InsightService
 * 4. Create AIActions for critical/high priority anomalies
 * 5. Return summary statistics
 *
 * **Queue:** anomaly-detection
 * **Concurrency:** 2 concurrent jobs
 * **Schedule:** Daily at 6 AM UTC (configured in queue manager)
 *
 * @module anomaly-detection-worker
 */

export interface AnomalyDetectionJobData {
  /** Unique job identifier */
  jobId: string;
  /** Tenant ID for isolation */
  tenantId: string;
  /** Entity ID for business context */
  entityId: string;
  /** User ID who scheduled the detection (or 'system' for automated) */
  userId: string;
}

export interface AnomalyDetectionJobResult extends AnomalyDetectionSummary {
  /** Job completion timestamp */
  completedAt: string;
}

/**
 * Process an anomaly detection job.
 *
 * @param job - BullMQ job with anomaly detection data
 * @returns Anomaly detection summary
 */
async function processAnomalyDetection(
  job: Job<AnomalyDetectionJobData>
): Promise<AnomalyDetectionJobResult> {
  const { tenantId, entityId, userId } = job.data;

  logger.info(
    { jobId: job.id, tenantId, entityId },
    'Anomaly detection job started'
  );

  // Update progress: 10%
  await job.updateProgress(10);

  try {
    // Initialize anomaly detection service
    const service = new AnomalyDetectionService(tenantId, userId, entityId);

    logger.info(
      { jobId: job.id, entityId },
      'Running anomaly analyzers'
    );

    // Update progress: 20%
    await job.updateProgress(20);

    // Run all anomaly analyzers
    const summary = await service.detectAnomalies();

    logger.info(
      {
        jobId: job.id,
        entityId,
        generated: summary.generated,
        errors: summary.errors.length,
        anomalies: summary.anomalies,
      },
      'Anomaly detection completed'
    );

    // Update progress: 100%
    await job.updateProgress(100);

    return {
      ...summary,
      completedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    logger.error(
      { err: error, jobId: job.id, tenantId, entityId },
      'Anomaly detection job failed'
    );

    // Re-throw for BullMQ retry mechanism
    throw error;
  }
}

/**
 * Initialize Anomaly Detection Worker.
 *
 * Call this during application startup to start processing anomaly-detection jobs.
 *
 * @returns Worker instance (for graceful shutdown)
 */
export function startAnomalyDetectionWorker(): Worker {
  const connection = getRedisConnection();

  const worker = new Worker<AnomalyDetectionJobData, AnomalyDetectionJobResult>(
    'anomaly-detection',
    processAnomalyDetection,
    {
      connection,
      concurrency: 2, // Process 2 entities in parallel
      limiter: {
        max: 5, // Max 5 jobs per second
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(
      {
        jobId: job.id,
        entityId: job.data.entityId,
        generated: job.returnvalue?.generated,
        anomalies: job.returnvalue?.anomalies,
      },
      'Anomaly detection worker: Job completed'
    );
  });

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, entityId: job?.data.entityId, err: error },
      'Anomaly detection worker: Job failed'
    );
  });

  worker.on('error', (error) => {
    logger.error({ err: error }, 'Anomaly detection worker: Worker error');
  });

  logger.info({ concurrency: 2 }, 'Anomaly detection worker started');

  return worker;
}
