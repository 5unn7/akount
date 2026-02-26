import { prisma, TenantPlan } from '@akount/db';
import { logger } from './logger';

/**
 * Audit Log Retention Service — SEC-14
 *
 * Prevents unbounded growth of audit logs by enforcing
 * plan-based retention periods. Supports compliance requirements
 * (SOC 2 requires minimum 1 year for financial records).
 *
 * Hash chain integrity: After purging old entries, the oldest
 * remaining entry becomes the new chain anchor (its previousHash
 * references a deleted entry, which is expected and documented).
 */

/** Retention periods in days by plan */
const RETENTION_DAYS: Record<TenantPlan, number> = {
  FREE: 90,         // 3 months
  PRO: 365,         // 1 year
  ENTERPRISE: 2555, // 7 years (regulatory compliance)
};

export interface RetentionStats {
  tenantId: string;
  plan: TenantPlan;
  retentionDays: number;
  totalEntries: number;
  expiredEntries: number;
  oldestEntryDate: Date | null;
  cutoffDate: Date;
}

export interface PurgeResult {
  tenantId: string;
  purgedCount: number;
  remainingCount: number;
  cutoffDate: Date;
  newAnchorSequence: number | null;
}

/**
 * Get retention statistics for a tenant without deleting anything.
 * Useful for displaying retention info in admin dashboards.
 */
export async function getRetentionStats(tenantId: string): Promise<RetentionStats> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? 'FREE';
  const retentionDays = RETENTION_DAYS[plan];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const [totalEntries, expiredEntries, oldestEntry] = await Promise.all([
    prisma.auditLog.count({ where: { tenantId } }),
    prisma.auditLog.count({
      where: { tenantId, createdAt: { lt: cutoffDate } },
    }),
    prisma.auditLog.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  return {
    tenantId,
    plan,
    retentionDays,
    totalEntries,
    expiredEntries,
    oldestEntryDate: oldestEntry?.createdAt ?? null,
    cutoffDate,
  };
}

/**
 * Purge expired audit log entries for a specific tenant.
 *
 * Deletes entries older than the retention period in batches
 * to avoid long-running transactions. The hash chain is preserved
 * for remaining entries — the oldest surviving entry's previousHash
 * will reference a deleted entry, which is expected after purge.
 *
 * @param tenantId - Tenant to purge logs for
 * @param batchSize - Number of entries to delete per batch (prevents lock contention)
 * @returns PurgeResult with count of deleted entries
 */
export async function purgeExpiredLogs(
  tenantId: string,
  batchSize = 500,
): Promise<PurgeResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? 'FREE';
  const retentionDays = RETENTION_DAYS[plan];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let totalPurged = 0;

  // Delete in batches to avoid lock contention
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await prisma.auditLog.findMany({
      where: { tenantId, createdAt: { lt: cutoffDate } },
      select: { id: true },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    if (batch.length === 0) break;

    await prisma.auditLog.deleteMany({
      where: { id: { in: batch.map((e) => e.id) } },
    });

    totalPurged += batch.length;

    logger.info(
      { tenantId, batchPurged: batch.length, totalPurged },
      'Purged audit log batch',
    );
  }

  // Get stats for the remaining entries
  const remainingCount = await prisma.auditLog.count({ where: { tenantId } });
  const newAnchor = await prisma.auditLog.findFirst({
    where: { tenantId },
    orderBy: { sequenceNumber: 'asc' },
    select: { sequenceNumber: true },
  });

  logger.info(
    { tenantId, totalPurged, remainingCount, cutoffDate },
    'Audit log purge completed',
  );

  return {
    tenantId,
    purgedCount: totalPurged,
    remainingCount,
    cutoffDate,
    newAnchorSequence: newAnchor?.sequenceNumber ?? null,
  };
}

/**
 * Purge expired audit logs for ALL tenants.
 * Intended to be called from a scheduled job (cron).
 */
export async function purgeAllExpiredLogs(): Promise<PurgeResult[]> {
  const tenants = await prisma.tenant.findMany({
    select: { id: true },
  });

  const results: PurgeResult[] = [];

  for (const tenant of tenants) {
    try {
      const result = await purgeExpiredLogs(tenant.id);
      if (result.purgedCount > 0) {
        results.push(result);
      }
    } catch (error) {
      logger.error(
        { err: error, tenantId: tenant.id },
        'Failed to purge audit logs for tenant',
      );
    }
  }

  return results;
}

/** Exported for testing */
export { RETENTION_DAYS };
