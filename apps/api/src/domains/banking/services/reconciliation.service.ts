import { prisma, Prisma, TransactionMatchStatus, BankFeedStatus } from '@akount/db';
import { compareTwoStrings } from 'string-similarity';
import { createAuditLog } from '../../../lib/audit';

// Constants
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_SUGGESTIONS = 5;

// Confidence thresholds
const HIGH_CONFIDENCE = 0.80;
const MEDIUM_CONFIDENCE = 0.60;

// Date proximity windows (in days)
const CLOSE_DATE_WINDOW = 3;
const FAR_DATE_WINDOW = 7;

// Description similarity threshold
const DESCRIPTION_MATCH_THRESHOLD = 0.70;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MatchSuggestion {
  transactionId: string;
  confidence: number;
  reasons: string[];
  transaction: {
    id: string;
    date: Date;
    description: string;
    amount: number;
    currency: string;
    account: {
      id: string;
      name: string;
    };
  };
}

export interface ReconciliationStatus {
  accountId: string;
  totalBankFeed: number;
  matched: number;
  unmatched: number;
  suggested: number;
  reconciliationPercent: number;
}

export interface CreateMatchInput {
  bankFeedTransactionId: string;
  transactionId: string;
}

export interface ListMatchesParams {
  accountId?: string;
  status?: TransactionMatchStatus;
  cursor?: string;
  limit?: number;
}

export interface PaginatedMatches {
  matches: MatchWithRelations[];
  nextCursor?: string;
  hasMore: boolean;
}

type MatchWithRelations = Prisma.TransactionMatchGetPayload<{
  include: {
    bankFeedTransaction: true;
    transaction: {
      include: {
        account: { select: { id: true; name: true } };
      };
    };
  };
}>;

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * ReconciliationService - Match bank feed transactions to posted transactions
 *
 * Single Responsibility: Handle transaction matching and reconciliation status
 * - NO HTTP handling (that's in routes)
 * - NO validation (that's in schemas)
 * - NO import logic (that's in ImportService)
 */
export class ReconciliationService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * Suggest matches for a bank feed transaction
   *
   * Algorithm:
   * 1. Exact amount + date within ±3 days + description >70% = 0.95 (HIGH)
   * 2. Exact amount + date within ±3 days = 0.80 (MEDIUM-HIGH)
   * 3. Exact amount + date within ±7 days = 0.60 (MEDIUM)
   * 4. Amount match only = 0.40 (LOW)
   *
   * Returns top 5 suggestions sorted by confidence DESC
   */
  async suggestMatches(
    bankFeedTransactionId: string,
    limit: number = MAX_SUGGESTIONS
  ): Promise<MatchSuggestion[]> {
    // 1. Get the bank feed transaction (with tenant isolation via account → entity)
    const bankFeedTxn = await prisma.bankFeedTransaction.findFirst({
      where: {
        id: bankFeedTransactionId,
        deletedAt: null,
        account: {
          entity: {
            tenantId: this.tenantId,
          },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            entityId: true,
            entity: {
              select: { tenantId: true },
            },
          },
        },
      },
    });

    if (!bankFeedTxn) {
      throw new Error('Bank feed transaction not found');
    }

    // 2. Check if already matched
    const existingMatch = await prisma.transactionMatch.findFirst({
      where: {
        bankFeedTransactionId,
        status: TransactionMatchStatus.MATCHED,
      },
    });

    if (existingMatch) {
      throw new Error('Bank feed transaction is already matched');
    }

    // 3. Find candidate transactions (same account, date range, not deleted, not already matched)
    const dateWindow = new Date(bankFeedTxn.date);
    const minDate = new Date(dateWindow);
    minDate.setDate(minDate.getDate() - FAR_DATE_WINDOW);
    const maxDate = new Date(dateWindow);
    maxDate.setDate(maxDate.getDate() + FAR_DATE_WINDOW);

    // Get already matched transaction IDs to exclude
    const matchedTxnIds = await prisma.transactionMatch.findMany({
      where: {
        status: TransactionMatchStatus.MATCHED,
        transactionId: { not: null },
      },
      select: { transactionId: true },
    });
    const excludeIds = matchedTxnIds
      .map((m) => m.transactionId)
      .filter((id): id is string => id !== null);

    const candidates = await prisma.transaction.findMany({
      where: {
        accountId: bankFeedTxn.accountId,
        deletedAt: null,
        date: {
          gte: minDate,
          lte: maxDate,
        },
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        account: {
          entity: {
            tenantId: this.tenantId,
          },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 4. Score each candidate
    const scored: MatchSuggestion[] = [];

    for (const candidate of candidates) {
      const { confidence, reasons } = this.scoreMatch(bankFeedTxn, candidate);

      if (confidence > 0) {
        scored.push({
          transactionId: candidate.id,
          confidence,
          reasons,
          transaction: {
            id: candidate.id,
            date: candidate.date,
            description: candidate.description,
            amount: candidate.amount,
            currency: candidate.currency,
            account: candidate.account,
          },
        });
      }
    }

    // 5. Sort by confidence DESC, take top N
    scored.sort((a, b) => b.confidence - a.confidence);
    return scored.slice(0, limit);
  }

  /**
   * Create a manual match between bank feed and posted transaction
   */
  async createMatch(input: CreateMatchInput): Promise<MatchWithRelations> {
    const { bankFeedTransactionId, transactionId } = input;

    // 1. Verify bank feed transaction belongs to tenant
    const bankFeedTxn = await prisma.bankFeedTransaction.findFirst({
      where: {
        id: bankFeedTransactionId,
        deletedAt: null,
        account: {
          entity: {
            tenantId: this.tenantId,
          },
        },
      },
      select: {
        id: true,
        accountId: true,
        account: {
          select: { entityId: true },
        },
      },
    });

    if (!bankFeedTxn) {
      throw new Error('Bank feed transaction not found');
    }

    // 2. Verify posted transaction belongs to tenant
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        deletedAt: null,
        account: {
          entity: {
            tenantId: this.tenantId,
          },
        },
      },
      select: { id: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 3. Check if bank feed transaction is already matched
    const existingMatch = await prisma.transactionMatch.findFirst({
      where: {
        bankFeedTransactionId,
        status: TransactionMatchStatus.MATCHED,
      },
    });

    if (existingMatch) {
      throw new Error('Bank feed transaction is already matched');
    }

    // 4. Check if posted transaction is already matched
    const existingTxnMatch = await prisma.transactionMatch.findFirst({
      where: {
        transactionId,
        status: TransactionMatchStatus.MATCHED,
      },
    });

    if (existingTxnMatch) {
      throw new Error('Transaction is already matched');
    }

    // 5. Create match, update bank feed status, and audit log atomically (ARCH-8)
    const match = await prisma.$transaction(async (tx) => {
      // Create the match record
      const created = await tx.transactionMatch.create({
        data: {
          bankFeedTransactionId,
          transactionId,
          status: TransactionMatchStatus.MATCHED,
          confidence: 1.0, // Manual match = full confidence
        },
        include: {
          bankFeedTransaction: true,
          transaction: {
            include: {
              account: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      // Update bank feed transaction status to POSTED
      await tx.bankFeedTransaction.update({
        where: { id: bankFeedTransactionId },
        data: { status: BankFeedStatus.POSTED },
      });

      // 6. Audit log inside transaction for atomicity
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId: bankFeedTxn.account.entityId,
        model: 'TransactionMatch',
        recordId: created.id,
        action: 'CREATE',
        after: {
          bankFeedTransactionId,
          transactionId,
          status: 'MATCHED',
        },
      }, tx);

      return created;
    });

    return match;
  }

  /**
   * Unmatch a transaction match (soft operation - deletes match record,
   * resets bank feed status to PENDING)
   */
  async unmatch(matchId: string): Promise<void> {
    // 1. Find the match with tenant isolation
    const match = await prisma.transactionMatch.findFirst({
      where: {
        id: matchId,
        bankFeedTransaction: {
          account: {
            entity: {
              tenantId: this.tenantId,
            },
          },
        },
      },
      select: {
        id: true,
        bankFeedTransactionId: true,
        transactionId: true,
        bankFeedTransaction: {
          select: {
            account: {
              select: { entityId: true },
            },
          },
        },
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // 2. Delete match, reset bank feed status, and audit log atomically (ARCH-8)
    await prisma.$transaction(async (tx) => {
      // Delete the match record
      await tx.transactionMatch.delete({
        where: { id: matchId },
      });

      // Reset bank feed transaction status to PENDING
      await tx.bankFeedTransaction.update({
        where: { id: match.bankFeedTransactionId },
        data: { status: BankFeedStatus.PENDING },
      });

      // 3. Audit log inside transaction for atomicity
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId: match.bankFeedTransaction.account.entityId,
        model: 'TransactionMatch',
        recordId: matchId,
        action: 'DELETE',
        before: {
          bankFeedTransactionId: match.bankFeedTransactionId,
          transactionId: match.transactionId,
          status: 'MATCHED',
        },
      }, tx);
    });
  }

  /**
   * Get reconciliation status for a specific account
   */
  async getReconciliationStatus(accountId: string): Promise<ReconciliationStatus> {
    // 1. Verify account belongs to tenant
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        entity: {
          tenantId: this.tenantId,
        },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // 2. Count bank feed transactions by status
    const [totalBankFeed, matchedCount, suggestedCount] = await Promise.all([
      prisma.bankFeedTransaction.count({
        where: {
          accountId,
          deletedAt: null,
        },
      }),
      prisma.bankFeedTransaction.count({
        where: {
          accountId,
          deletedAt: null,
          status: BankFeedStatus.POSTED,
        },
      }),
      prisma.transactionMatch.count({
        where: {
          bankFeedTransaction: {
            accountId,
            deletedAt: null,
          },
          status: TransactionMatchStatus.SUGGESTED,
        },
      }),
    ]);

    const unmatched = totalBankFeed - matchedCount;
    const reconciliationPercent =
      totalBankFeed > 0 ? Math.round((matchedCount / totalBankFeed) * 100) : 100;

    return {
      accountId,
      totalBankFeed,
      matched: matchedCount,
      unmatched,
      suggested: suggestedCount,
      reconciliationPercent,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Score a candidate transaction against a bank feed transaction
   *
   * Scoring:
   * - Exact amount match: required (skip if no match)
   * - Date proximity ±3 days: +0.40
   * - Date proximity ±7 days: +0.20
   * - Description similarity >70%: +0.15 to +0.20
   * - Combined: max 1.0
   */
  private scoreMatch(
    bankFeedTxn: { date: Date; description: string; amount: number },
    candidate: { date: Date; description: string; amount: number }
  ): { confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Amount must match exactly (integer cents comparison)
    if (bankFeedTxn.amount !== candidate.amount) {
      return { confidence: 0, reasons: [] };
    }
    score += 0.40;
    reasons.push('Exact amount match');

    // Date proximity
    const daysDiff = Math.abs(
      (bankFeedTxn.date.getTime() - candidate.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= CLOSE_DATE_WINDOW) {
      score += 0.40;
      reasons.push(daysDiff === 0 ? 'Same date' : `Within ${Math.ceil(daysDiff)} day(s)`);
    } else if (daysDiff <= FAR_DATE_WINDOW) {
      score += 0.20;
      reasons.push(`Within ${Math.ceil(daysDiff)} days`);
    }
    // Beyond 7 days: no date score (but still a candidate via amount)

    // Description similarity
    const similarity = compareTwoStrings(
      normalizeDescription(bankFeedTxn.description),
      normalizeDescription(candidate.description)
    );

    if (similarity >= 0.90) {
      score += 0.20;
      reasons.push('Description near-identical');
    } else if (similarity >= DESCRIPTION_MATCH_THRESHOLD) {
      score += 0.15;
      reasons.push('Description similar');
    }

    // Cap at 1.0
    return {
      confidence: Math.min(1.0, Math.round(score * 100) / 100),
      reasons,
    };
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Normalize description for comparison
 * Consistent with DuplicationService normalization
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
