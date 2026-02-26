// AI Auto-Bookkeeper Phase 3: Reconciliation Gap Analyzer (Task 8 - DEV-222)
// DB-access analyzer: queries bank accounts and reconciliation status
import { prisma, BankFeedStatus } from '@akount/db';
import type { InsightResult, ReconciliationGapMetadata } from '../../types/insight.types.js';

/** Threshold below which reconciliation is flagged (80%) */
const RECONCILIATION_THRESHOLD = 80;

/**
 * Analyze reconciliation gaps across bank accounts.
 *
 * For each bank account, calculates reconciliation percentage from
 * bank feed transaction statuses. Triggers reconciliation_gap per
 * account where reconciliation < 80%.
 *
 * Priority: medium (60-80%), high (<60%), critical (<40%).
 *
 * Note: Queries Prisma directly (avoids ReconciliationService dependency
 * which requires userId). All counts are integers, no cents conversion needed.
 */
export async function analyzeReconciliation(entityId: string, tenantId: string): Promise<InsightResult[]> {
  // Get all bank accounts for this entity (with tenant isolation)
  const accounts = await prisma.account.findMany({
    where: {
      entityId,
      entity: { tenantId },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (accounts.length === 0) {
    return [];
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const results: InsightResult[] = [];

  // Check reconciliation status per account
  for (const account of accounts) {
    const [totalBankFeed, matchedCount] = await Promise.all([
      prisma.bankFeedTransaction.count({
        where: {
          accountId: account.id,
          deletedAt: null,
        },
      }),
      prisma.bankFeedTransaction.count({
        where: {
          accountId: account.id,
          deletedAt: null,
          status: BankFeedStatus.POSTED,
        },
      }),
    ]);

    // Skip accounts with no bank feed data
    if (totalBankFeed === 0) {
      continue;
    }

    const unmatched = totalBankFeed - matchedCount;
    const reconciliationPercent = Math.round((matchedCount / totalBankFeed) * 100);

    // Only trigger if below threshold
    if (reconciliationPercent >= RECONCILIATION_THRESHOLD) {
      continue;
    }

    // Priority based on how low the reconciliation is
    let priority: 'medium' | 'high' | 'critical';
    if (reconciliationPercent < 40) {
      priority = 'critical';
    } else if (reconciliationPercent < 60) {
      priority = 'high';
    } else {
      priority = 'medium';
    }

    const metadata: ReconciliationGapMetadata = {
      accountId: account.id,
      accountName: account.name,
      totalBankFeed,
      matched: matchedCount,
      unmatched,
      reconciliationPercent,
    };

    results.push({
      triggerId: `reconciliation_gap:${entityId}:${account.id}:${yearMonth}`,
      title: `Reconciliation Gap: ${account.name}`,
      description: `${account.name} is ${reconciliationPercent}% reconciled (${unmatched} unmatched of ${totalBankFeed} transactions)`,
      type: 'reconciliation_gap',
      priority,
      impact: Math.min(100, 100 - reconciliationPercent),
      confidence: 1.0, // Based on actual data counts
      actionable: true,
      metadata,
    });
  }

  return results;
}
