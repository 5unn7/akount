// AI Auto-Bookkeeper Phase 3: Duplicate Expense Analyzer (Task 7 - DEV-221)
// DB-access analyzer: queries recent transactions for duplicate detection
import { prisma } from '@akount/db';
import type { InsightResult, DuplicateExpenseMetadata } from '../../types/insight.types.js';

/** Window for duplicate detection (48 hours in milliseconds) */
const DUPLICATE_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Lookback period for recent transactions (7 days) */
const LOOKBACK_DAYS = 7;

/**
 * Detect duplicate expenses from recent transactions.
 * DB-access analyzer: queries transactions for last 7 days.
 *
 * Groups by: same description (case-insensitive trim) + same amount + within 48 hours.
 * Priority: medium (always — user must decide).
 * triggerId uses sorted IDs for determinism.
 */
export async function analyzeDuplicates(
  entityId: string,
  tenantId: string
): Promise<InsightResult[]> {
  const lookbackDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // Fetch recent expense transactions (negative amounts)
  const transactions = await prisma.transaction.findMany({
    where: {
      account: {
        entity: {
          id: entityId,
          tenantId,
        },
      },
      date: { gte: lookbackDate },
      amount: { lt: 0 }, // Expenses only
      deletedAt: null,
    },
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  if (transactions.length < 2) {
    return [];
  }

  const results: InsightResult[] = [];
  const seenPairs = new Set<string>(); // Track already-flagged pairs

  // Compare each transaction to others for potential duplicates
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const txn1 = transactions[i];
      const txn2 = transactions[j];

      // Same amount
      if (txn1.amount !== txn2.amount) {
        continue;
      }

      // Similar description (case-insensitive, trimmed)
      const desc1 = (txn1.description ?? '').trim().toLowerCase();
      const desc2 = (txn2.description ?? '').trim().toLowerCase();
      if (!desc1 || !desc2 || desc1 !== desc2) {
        continue;
      }

      // Within 48 hours
      const timeDiff = Math.abs(txn2.date.getTime() - txn1.date.getTime());
      if (timeDiff > DUPLICATE_WINDOW_MS) {
        continue;
      }

      // Deterministic pair key (sorted IDs)
      const [id1, id2] = [txn1.id, txn2.id].sort();
      const pairKey = `${id1}:${id2}`;

      if (seenPairs.has(pairKey)) {
        continue;
      }
      seenPairs.add(pairKey);

      const metadata: DuplicateExpenseMetadata = {
        transaction1: {
          id: txn1.id,
          description: txn1.description ?? '',
          amount: txn1.amount, // Already in integer cents
          date: txn1.date.toISOString(),
        },
        transaction2: {
          id: txn2.id,
          description: txn2.description ?? '',
          amount: txn2.amount,
          date: txn2.date.toISOString(),
        },
      };

      results.push({
        triggerId: `duplicate_expense:${entityId}:${id1}:${id2}`,
        title: 'Possible Duplicate Expense',
        description: `"${txn1.description}" for $${Math.abs(txn1.amount / 100).toFixed(2)} appears twice within 48 hours`,
        type: 'duplicate_expense',
        priority: 'medium', // Always medium — user must decide
        impact: Math.min(100, Math.round(Math.abs(txn1.amount) / 10000)),
        confidence: 0.7,
        actionable: true,
        metadata,
      });
    }
  }

  return results;
}
