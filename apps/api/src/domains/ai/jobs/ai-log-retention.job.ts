import { Queue } from 'bullmq';
import { prisma } from '@akount/db';
import { getRedisConnection } from '../../../lib/queue/queue-manager';
import { logger } from '../../../lib/logger';

/**
 * AI Log Retention Job (P2-27)
 *
 * Scheduled job to purge old AIDecisionLog entries per tenant retention policy.
 *
 * **Default:** 90 days retention (configurable per tenant)
 * **Schedule:** Runs daily at 2 AM UTC
 * **Batch size:** 1000 records per run (prevent long locks)
 *
 * **Compliance:** GDPR Article 5(e) - storage limitation principle
 *
 * @module ai-log-retention
 */

const DEFAULT_RETENTION_DAYS = 90;

export interface RetentionJobData {
  tenantId?: string; // Optional: run for specific tenant, or all if omitted
  retentionDays?: number; // Optional: override default
}

export interface RetentionJobResult {
  deletedCount: number;
  tenantsProcessed: number;
  durationMs: number;
}

/**
 * Purge expired AI decision logs for a tenant.
 *
 * @param tenantId - Tenant ID
 * @param retentionDays - Number of days to retain (default: 90)
 * @returns Count of deleted records
 */
export async function purgeExpiredAILogs(
  tenantId: string,
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const result = await prisma.aIDecisionLog.deleteMany({
      where: {
        tenantId,
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      logger.info(
        {
          tenantId,
          deletedCount: result.count,
          cutoffDate,
          retentionDays,
        },
        'Purged expired AI decision logs'
      );
    }

    return result.count;
  } catch (error: unknown) {
    logger.error(
      { err: error, tenantId, retentionDays },
      'Failed to purge AI decision logs'
    );
    throw error;
  }
}

/**
 * Process retention job for all tenants.
 */
export async function processRetentionJob(data: RetentionJobData): Promise<RetentionJobResult> {
  const startTime = Date.now();
  const retentionDays = data.retentionDays || DEFAULT_RETENTION_DAYS;

  logger.info({ retentionDays, tenantId: data.tenantId }, 'AI log retention job started');

  try {
    if (data.tenantId) {
      // Single tenant
      const deletedCount = await purgeExpiredAILogs(data.tenantId, retentionDays);

      return {
        deletedCount,
        tenantsProcessed: 1,
        durationMs: Date.now() - startTime,
      };
    } else {
      // All tenants
      const tenants = await prisma.tenant.findMany({
        select: { id: true },
      });

      let totalDeleted = 0;

      for (const tenant of tenants) {
        const deleted = await purgeExpiredAILogs(tenant.id, retentionDays);
        totalDeleted += deleted;
      }

      return {
        deletedCount: totalDeleted,
        tenantsProcessed: tenants.length,
        durationMs: Date.now() - startTime,
      };
    }
  } finally {
    logger.info(
      { durationMs: Date.now() - startTime },
      'AI log retention job completed'
    );
  }
}

/**
 * Schedule the retention job to run daily at 2 AM UTC.
 */
export async function scheduleAILogRetention(): Promise<void> {
  const connection = getRedisConnection();
  const queue = new Queue('ai-log-retention', { connection });

  // Add repeatable job (cron: daily at 2 AM UTC)
  await queue.add(
    'daily-retention',
    {}, // No specific tenant = process all
    {
      repeat: {
        pattern: '0 2 * * *', // Daily at 2 AM UTC
      },
      removeOnComplete: {
        age: 7 * 24 * 60 * 60, // Keep logs for 7 days
        count: 10,
      },
    }
  );

  logger.info('AI log retention job scheduled (daily at 2 AM UTC)');

  await queue.close();
}
