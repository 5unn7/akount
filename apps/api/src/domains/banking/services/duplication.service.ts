import { prisma } from '@akount/db';
import { compareTwoStrings } from 'string-similarity';
import type { ParsedTransaction } from '../../../schemas/import';

/**
 * Duplication Detection Service
 *
 * Identifies duplicate transactions using fuzzy matching on date, amount, and description.
 * Uses Levenshtein distance algorithm for description similarity.
 */

export interface DuplicateResult {
  tempId: string;
  isDuplicate: boolean;
  duplicateConfidence: number; // 0-100
  matchedTransactionId?: string;
  matchReason?: string;
}

interface ExistingTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
}

/**
 * Find potential duplicates for imported transactions
 *
 * Matching criteria:
 * - Date within ±3 days (40 points)
 * - Amount exact match (40 points)
 * - Description similarity ≥80% (20 points)
 *
 * Total ≥80 = duplicate, 50-79 = possible duplicate, <50 = unique
 */
export async function findDuplicates(
  transactions: ParsedTransaction[],
  accountId: string
): Promise<DuplicateResult[]> {
  if (transactions.length === 0) {
    return [];
  }

  // Get date range for query optimization
  const dates = transactions.map((t) => new Date(t.date));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Add ±3 day buffer
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);

  // Query existing transactions in date range (respect soft deletes)
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
      date: {
        gte: minDate,
        lte: maxDate,
      },
    },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
    },
  });

  // Check each imported transaction against existing ones
  const results: DuplicateResult[] = [];

  for (const transaction of transactions) {
    const match = findBestMatch(transaction, existingTransactions);

    results.push({
      tempId: transaction.tempId,
      isDuplicate: match.confidence >= 80,
      duplicateConfidence: match.confidence,
      matchedTransactionId: match.transactionId,
      matchReason: match.reason,
    });
  }

  return results;
}

/**
 * Find best matching existing transaction for an imported transaction
 */
function findBestMatch(
  transaction: ParsedTransaction,
  existingTransactions: ExistingTransaction[]
): {
  confidence: number;
  transactionId?: string;
  reason?: string;
} {
  if (existingTransactions.length === 0) {
    return { confidence: 0 };
  }

  let bestMatch: {
    score: number;
    transactionId: string;
    reasons: string[];
  } | null = null;

  const transactionDate = new Date(transaction.date);

  for (const existing of existingTransactions) {
    let score = 0;
    const reasons: string[] = [];

    // Date proximity (40 points max)
    const daysDiff = Math.abs(
      (transactionDate.getTime() - existing.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      score += 40;
      reasons.push('Same date');
    } else if (daysDiff <= 1) {
      score += 30;
      reasons.push('±1 day');
    } else if (daysDiff <= 2) {
      score += 20;
      reasons.push('±2 days');
    } else if (daysDiff <= 3) {
      score += 10;
      reasons.push('±3 days');
    }

    // Amount exact match (40 points) — compare absolute values because
    // the sign may differ between raw parsed amounts and stored amounts
    // (e.g., credit card charges: parser gives +2599, DB stores -2599)
    if (Math.abs(transaction.amount) === Math.abs(existing.amount)) {
      score += 40;
      reasons.push('Exact amount');
    } else {
      // Skip if amount doesn't match - very unlikely to be duplicate
      continue;
    }

    // Description similarity (20 points)
    const similarity = compareTwoStrings(
      normalizeDescription(transaction.description),
      normalizeDescription(existing.description)
    );

    if (similarity >= 0.95) {
      score += 20;
      reasons.push('Description exact match');
    } else if (similarity >= 0.85) {
      score += 18;
      reasons.push('Description very similar');
    } else if (similarity >= 0.75) {
      score += 15;
      reasons.push('Description similar');
    } else if (similarity >= 0.65) {
      score += 10;
      reasons.push('Description somewhat similar');
    }

    // Update best match
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        score,
        transactionId: existing.id,
        reasons,
      };
    }
  }

  if (!bestMatch) {
    return { confidence: 0 };
  }

  return {
    confidence: Math.min(100, bestMatch.score),
    transactionId: bestMatch.transactionId,
    reason: bestMatch.reasons.join(', '),
  };
}

/**
 * Normalize description for comparison
 *
 * Removes extra whitespace, special characters, and standardizes case
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Deduplicate existing transactions for an account.
 *
 * Finds groups of transactions with identical (date, amount, description),
 * keeps the oldest in each group, and soft-deletes the rest.
 *
 * Returns count of duplicates removed.
 */
export async function deduplicateExistingTransactions(
  accountId: string
): Promise<{ removed: number; groups: number }> {
  // Get all active transactions for this account
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
    },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      createdAt: true,
      journalEntryId: true,
      categoryId: true,
    },
    orderBy: { createdAt: 'asc' }, // oldest first
  });

  // Group by (date + amount + normalized description)
  const groups = new Map<string, typeof transactions>();
  for (const txn of transactions) {
    const dateStr = txn.date.toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `${dateStr}::${txn.amount}::${normalizeDescription(txn.description)}`;
    const group = groups.get(key) ?? [];
    group.push(txn);
    groups.set(key, group);
  }

  let removed = 0;
  let groupCount = 0;

  for (const [, group] of groups) {
    if (group.length <= 1) continue;
    groupCount++;

    // Keep the one that has a journal entry posted, or has a category, or is oldest
    group.sort((a, b) => {
      // Prefer posted transactions
      if (a.journalEntryId && !b.journalEntryId) return -1;
      if (!a.journalEntryId && b.journalEntryId) return 1;
      // Prefer categorized
      if (a.categoryId && !b.categoryId) return -1;
      if (!a.categoryId && b.categoryId) return 1;
      // Oldest first
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const losers = group.slice(1);

    // Soft-delete duplicates
    await prisma.transaction.updateMany({
      where: {
        id: { in: losers.map((l) => l.id) },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    removed += losers.length;
  }

  return { removed, groups: groupCount };
}

/**
 * Find duplicates within the imported batch (before comparing to database)
 *
 * Uses fuzzy matching to catch duplicates that appear in different sections
 * of the same document (e.g., PDF summary table + detail table) where
 * descriptions may differ slightly.
 *
 * Match criteria: same date + same amount + similar description
 * (Levenshtein similarity ≥ 0.6 OR one description contains the other)
 */
export function findInternalDuplicates(transactions: ParsedTransaction[]): Map<string, string[]> {
  const duplicateGroups = new Map<string, string[]>();

  for (let i = 0; i < transactions.length; i++) {
    const groups: string[] = [];

    for (let j = i + 1; j < transactions.length; j++) {
      const t1 = transactions[i];
      const t2 = transactions[j];

      // Must match on date and amount (absolute value to handle sign differences)
      if (t1.date !== t2.date || Math.abs(t1.amount) !== Math.abs(t2.amount)) {
        continue;
      }

      // Check description similarity (fuzzy match)
      const desc1 = normalizeDescription(t1.description);
      const desc2 = normalizeDescription(t2.description);

      if (
        desc1 === desc2 ||
        compareTwoStrings(desc1, desc2) >= 0.6 ||
        desc1.includes(desc2) ||
        desc2.includes(desc1)
      ) {
        groups.push(t2.tempId);
      }
    }

    if (groups.length > 0) {
      duplicateGroups.set(transactions[i].tempId, groups);
    }
  }

  return duplicateGroups;
}
