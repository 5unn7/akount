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

/**
 * AI Data Retention Tiers (SEC-36)
 *
 * Different AI data types have different retention requirements
 * based on compliance, debugging needs, and storage costs.
 */

/** AIDecisionLog retention - same as audit logs (compliance requirement) */
export const AI_DECISION_LOG_RETENTION_DAYS = RETENTION_DAYS;

/** Uploaded documents (bills, invoices, receipts) - regulatory compliance */
export const UPLOADED_DOCUMENTS_RETENTION_DAYS: Record<TenantPlan, number> = {
  FREE: 90,         // 3 months (minimal)
  PRO: 365,         // 1 year (standard)
  ENTERPRISE: 2555, // 7 years (regulatory - matches financial records)
};

/** LLM prompt/response logs - debugging and compliance only (not long-term) */
export const LLM_LOGS_RETENTION_DAYS: Record<TenantPlan, number> = {
  FREE: 90,   // 90 days (all plans - fixed for compliance)
  PRO: 90,    // 90 days (debugging window)
  ENTERPRISE: 90, // 90 days (no long-term value after debugging period)
};

/** User corrections - no automatic expiry (deleted only on user request) */
export const USER_CORRECTIONS_RETENTION_DAYS = null; // Never auto-delete

/** RAG store - linked to document lifecycle (deleted when document deleted) */
export const RAG_STORE_RETENTION_DAYS = null; // Document-linked, not time-based

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

/**
 * Purge expired AIDecisionLog entries for a specific tenant.
 *
 * Uses same retention tiers as audit logs (regulatory compliance).
 * Batch deletion pattern prevents lock contention.
 *
 * @param tenantId - Tenant to purge AI decision logs for
 * @param batchSize - Number of entries to delete per batch
 * @returns Number of purged entries and cutoff date
 */
export async function purgeExpiredAIDecisionLogs(
  tenantId: string,
  batchSize = 500
): Promise<{ purgedCount: number; cutoffDate: Date }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? 'FREE';
  const retentionDays = AI_DECISION_LOG_RETENTION_DAYS[plan];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let totalPurged = 0;

  // Delete in batches to avoid lock contention
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await prisma.aIDecisionLog.findMany({
      where: { tenantId, createdAt: { lt: cutoffDate } },
      select: { id: true },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    if (batch.length === 0) break;

    await prisma.aIDecisionLog.deleteMany({
      where: { id: { in: batch.map((e) => e.id) } },
    });

    totalPurged += batch.length;

    logger.info(
      { tenantId, batchPurged: batch.length, totalPurged, dataType: 'AIDecisionLog' },
      'Purged AI decision log batch'
    );
  }

  logger.info(
    { tenantId, totalPurged, cutoffDate, dataType: 'AIDecisionLog' },
    'AI decision log purge completed'
  );

  return { purgedCount: totalPurged, cutoffDate };
}

/**
 * Purge expired LLM prompt/response logs for a specific tenant.
 *
 * Fixed 90-day retention across all plans (debugging window only).
 * Future implementation - currently a no-op placeholder.
 *
 * @param tenantId - Tenant to purge LLM logs for
 * @returns Number of purged entries
 */
export async function purgeExpiredLLMLogs(
  tenantId: string
): Promise<{ purgedCount: number; cutoffDate: Date }> {
  // TODO: Implement when LLMLog model exists
  // const plan = tenant?.plan ?? 'FREE';
  // const retentionDays = LLM_LOGS_RETENTION_DAYS[plan]; // Always 90
  const retentionDays = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  logger.info(
    { tenantId, dataType: 'LLMLogs', status: 'not_implemented' },
    'LLM logs purge: Not yet implemented (future)'
  );

  return { purgedCount: 0, cutoffDate };
}

/**
 * Purge expired uploaded documents for a specific tenant.
 *
 * Plan-based retention (7yr ENT, 1yr PRO, 90d FREE).
 * Includes both database records and cloud storage files (S3, etc.).
 * Future implementation - currently a no-op placeholder.
 *
 * @param tenantId - Tenant to purge uploaded documents for
 * @returns Number of purged documents
 */
export async function purgeExpiredUploadedDocuments(
  tenantId: string
): Promise<{ purgedCount: number; cutoffDate: Date }> {
  // TODO: Implement when Document model exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? 'FREE';
  const retentionDays = UPLOADED_DOCUMENTS_RETENTION_DAYS[plan];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Future: Delete files from cloud storage + metadata from DB

  logger.info(
    { tenantId, dataType: 'UploadedDocuments', status: 'not_implemented' },
    'Uploaded documents purge: Not yet implemented (Phase 2 B8-B11)'
  );

  return { purgedCount: 0, cutoffDate };
}

/**
 * Purge all expired AI data for a tenant.
 *
 * Combined cleanup job for all AI data categories:
 * - AIDecisionLog (compliance requirement)
 * - LLM logs (debugging window)
 * - Uploaded documents (regulatory compliance)
 *
 * User corrections and RAG store are NOT purged automatically:
 * - User corrections: Deleted only on user request
 * - RAG store: Linked to document lifecycle (cascade delete)
 *
 * @param tenantId - Tenant to purge AI data for
 * @returns Summary of purged data by category
 */
export async function purgeAllExpiredAIData(tenantId: string): Promise<{
  tenantId: string;
  aiDecisionLogs: { purgedCount: number; cutoffDate: Date };
  llmLogs: { purgedCount: number; cutoffDate: Date };
  uploadedDocuments: { purgedCount: number; cutoffDate: Date };
  totalPurged: number;
}> {
  logger.info({ tenantId }, 'Starting AI data retention purge for tenant');

  const [aiDecisionLogs, llmLogs, uploadedDocuments] = await Promise.all([
    purgeExpiredAIDecisionLogs(tenantId),
    purgeExpiredLLMLogs(tenantId),
    purgeExpiredUploadedDocuments(tenantId),
  ]);

  const totalPurged =
    aiDecisionLogs.purgedCount +
    llmLogs.purgedCount +
    uploadedDocuments.purgedCount;

  logger.info(
    { tenantId, totalPurged, breakdown: { aiDecisionLogs: aiDecisionLogs.purgedCount, llmLogs: llmLogs.purgedCount, uploadedDocuments: uploadedDocuments.purgedCount } },
    'AI data retention purge completed'
  );

  return {
    tenantId,
    aiDecisionLogs,
    llmLogs,
    uploadedDocuments,
    totalPurged,
  };
}

/**
 * Purge expired AI data for ALL tenants.
 *
 * Intended to be called from a scheduled job (cron).
 * Runs daily or weekly to enforce retention policies.
 */
export async function purgeAllTenantsAIData(): Promise<Array<{
  tenantId: string;
  totalPurged: number;
}>> {
  const tenants = await prisma.tenant.findMany({
    select: { id: true },
  });

  const results = [];

  for (const tenant of tenants) {
    try {
      const result = await purgeAllExpiredAIData(tenant.id);
      if (result.totalPurged > 0) {
        results.push({
          tenantId: result.tenantId,
          totalPurged: result.totalPurged,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, tenantId: tenant.id },
        'Failed to purge AI data for tenant'
      );
    }
  }

  logger.info(
    { tenantsProcessed: tenants.length, tenantsWithPurges: results.length },
    'AI data retention purge completed for all tenants'
  );

  return results;
}

/** Exported for testing */
export { RETENTION_DAYS };
