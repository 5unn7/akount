import { prisma, Prisma } from '@akount/db';
import { generateEntryNumber } from '../../accounting/utils/entry-number';
import { CategorizationService, type CategorySuggestion } from './categorization.service';
import { logger } from '../../../lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JESuggestionInput {
  transactionId: string;
  description: string;
  amount: number; // Integer cents (positive = income, negative = expense)
  currency: string;
  date: Date;
  sourceType: string; // TransactionSourceType
  accountId: string; // Bank/credit card account
}

export interface JournalLineSuggestion {
  glAccountId: string;
  glAccountCode: string;
  debitAmount: number; // Integer cents
  creditAmount: number; // Integer cents
  memo: string;
}

export interface JESuggestion {
  transactionId: string;
  entryNumber: string | null; // Assigned on creation, null for preview
  date: Date;
  memo: string;
  sourceType: 'AI_SUGGESTION';
  sourceId: string; // transactionId
  status: 'DRAFT';
  lines: JournalLineSuggestion[];
  categorization: CategorySuggestion;
  confidence: number; // 0-100 integer
}

export interface JESuggestionBatchResult {
  suggestions: JESuggestion[];
  skipped: Array<{
    transactionId: string;
    reason: string;
  }>;
  summary: {
    total: number;
    suggested: number;
    skipped: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Source types that should NOT get AI-drafted JEs */
const SKIP_SOURCE_TYPES = new Set(['TRANSFER']);

/** Well-known COA codes (from coa-template.ts) */
const WELL_KNOWN_CODES = {
  BANK_ACCOUNT: '1100',
} as const;

// ---------------------------------------------------------------------------
// JE Suggestion Service
// ---------------------------------------------------------------------------

export class JESuggestionService {
  private categorizationService: CategorizationService;

  constructor(
    private tenantId: string,
    private entityId: string,
    private userId: string
  ) {
    this.categorizationService = new CategorizationService(tenantId, entityId);
  }

  /**
   * Generate JE suggestions for a batch of transactions.
   *
   * Guards:
   * - Skip TRANSFER sourceType (transfers have their own JE logic)
   * - Skip zero-amount transactions
   * - Skip transactions that already have a journalEntryId
   *
   * For each transaction:
   * 1. Categorize (keyword + AI fallback with GL resolution)
   * 2. Build balanced JE: DR/CR bank account <-> DR/CR expense/income GL
   * 3. Return suggestions with confidence scores
   */
  async suggestBatch(
    transactions: JESuggestionInput[]
  ): Promise<JESuggestionBatchResult> {
    const suggestions: JESuggestion[] = [];
    const skipped: Array<{ transactionId: string; reason: string }> = [];

    // Partition: filter out skippable transactions
    const eligible: JESuggestionInput[] = [];
    for (const txn of transactions) {
      if (SKIP_SOURCE_TYPES.has(txn.sourceType)) {
        skipped.push({ transactionId: txn.transactionId, reason: 'Transfer transactions use dedicated transfer JE logic' });
        continue;
      }
      if (txn.amount === 0) {
        skipped.push({ transactionId: txn.transactionId, reason: 'Zero-amount transaction' });
        continue;
      }
      eligible.push(txn);
    }

    if (eligible.length === 0) {
      return this.buildResult(suggestions, skipped, transactions.length);
    }

    // Batch categorize eligible transactions
    const categorizations = await this.categorizationService.categorizeBatch(
      eligible.map((t) => ({ description: t.description, amount: t.amount }))
    );

    // Resolve bank GL accounts for all unique accountIds
    const accountIds = [...new Set(eligible.map((t) => t.accountId))];
    const bankGLMap = await this.resolveBankGLAccounts(accountIds);

    // Build JE suggestions
    for (let i = 0; i < eligible.length; i++) {
      const txn = eligible[i];
      const cat = categorizations[i];

      // Need both a bank GL and a category GL to build a JE
      const bankGL = bankGLMap.get(txn.accountId);
      if (!bankGL) {
        skipped.push({
          transactionId: txn.transactionId,
          reason: 'Bank account has no linked GL account',
        });
        continue;
      }

      if (!cat.resolvedGLAccountId || !cat.resolvedGLAccountCode) {
        skipped.push({
          transactionId: txn.transactionId,
          reason: 'Could not resolve GL account for category',
        });
        continue;
      }

      const lines = this.buildJournalLines(
        txn,
        bankGL,
        { id: cat.resolvedGLAccountId, code: cat.resolvedGLAccountCode },
        cat
      );

      suggestions.push({
        transactionId: txn.transactionId,
        entryNumber: null, // Assigned on actual creation
        date: txn.date,
        memo: this.buildMemo(txn, cat),
        sourceType: 'AI_SUGGESTION',
        sourceId: txn.transactionId,
        status: 'DRAFT',
        lines,
        categorization: cat,
        confidence: cat.confidence,
      });
    }

    return this.buildResult(suggestions, skipped, transactions.length);
  }

  /**
   * Create actual DRAFT journal entries from suggestions.
   * Each JE is created in its own transaction for atomicity.
   *
   * Returns created JE IDs mapped to transaction IDs.
   */
  async createDraftJEs(
    suggestions: JESuggestion[]
  ): Promise<Array<{ transactionId: string; journalEntryId: string }>> {
    const results: Array<{ transactionId: string; journalEntryId: string }> = [];

    for (const suggestion of suggestions) {
      try {
        const jeId = await prisma.$transaction(async (tx) => {
          const entryNumber = await generateEntryNumber(tx, this.entityId);

          // Verify double-entry balance before creating
          const totalDebits = suggestion.lines.reduce((sum, l) => sum + l.debitAmount, 0);
          const totalCredits = suggestion.lines.reduce((sum, l) => sum + l.creditAmount, 0);
          if (totalDebits !== totalCredits) {
            throw new Error(
              `JE not balanced: debits=${totalDebits} credits=${totalCredits} for txn ${suggestion.transactionId}`
            );
          }

          const je = await tx.journalEntry.create({
            data: {
              entityId: this.entityId,
              entryNumber,
              date: suggestion.date,
              memo: suggestion.memo,
              sourceType: 'AI_SUGGESTION',
              sourceId: suggestion.transactionId,
              sourceDocument: {
                transactionId: suggestion.transactionId,
                categorization: suggestion.categorization,
                confidence: suggestion.confidence,
                generatedAt: new Date().toISOString(),
              } satisfies Prisma.InputJsonValue,
              status: 'DRAFT',
              createdBy: this.userId,
              journalLines: {
                create: suggestion.lines.map((line) => ({
                  glAccountId: line.glAccountId,
                  debitAmount: line.debitAmount,
                  creditAmount: line.creditAmount,
                  memo: line.memo,
                })),
              },
            },
            select: { id: true },
          });

          // Link transaction to the draft JE
          await tx.transaction.update({
            where: { id: suggestion.transactionId },
            data: { journalEntryId: je.id },
          });

          return je.id;
        });

        results.push({ transactionId: suggestion.transactionId, journalEntryId: jeId });
      } catch (error) {
        logger.error(
          { err: error, transactionId: suggestion.transactionId },
          'Failed to create draft JE for transaction'
        );
        // Continue with remaining suggestions — don't fail the batch
      }
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Build balanced journal lines for a transaction.
   *
   * Expense (negative amount):
   *   DR Expense GL account  (abs amount)
   *   CR Bank GL account     (abs amount)
   *
   * Income (positive amount):
   *   DR Bank GL account     (amount)
   *   CR Income GL account   (amount)
   */
  private buildJournalLines(
    txn: JESuggestionInput,
    bankGL: { id: string; code: string },
    categoryGL: { id: string; code: string },
    cat: CategorySuggestion
  ): JournalLineSuggestion[] {
    const absAmount = Math.abs(txn.amount);
    const isExpense = txn.amount < 0;

    if (isExpense) {
      return [
        {
          glAccountId: categoryGL.id,
          glAccountCode: categoryGL.code,
          debitAmount: absAmount,
          creditAmount: 0,
          memo: `${cat.categoryName || 'Expense'}: ${txn.description}`,
        },
        {
          glAccountId: bankGL.id,
          glAccountCode: bankGL.code,
          debitAmount: 0,
          creditAmount: absAmount,
          memo: `Bank payment: ${txn.description}`,
        },
      ];
    } else {
      // Income
      return [
        {
          glAccountId: bankGL.id,
          glAccountCode: bankGL.code,
          debitAmount: absAmount,
          creditAmount: 0,
          memo: `Bank deposit: ${txn.description}`,
        },
        {
          glAccountId: categoryGL.id,
          glAccountCode: categoryGL.code,
          debitAmount: 0,
          creditAmount: absAmount,
          memo: `${cat.categoryName || 'Income'}: ${txn.description}`,
        },
      ];
    }
  }

  /**
   * Resolve bank/credit card accounts to their linked GL accounts.
   * Account model has a glAccountId FK for the linked GL.
   */
  private async resolveBankGLAccounts(
    accountIds: string[]
  ): Promise<Map<string, { id: string; code: string }>> {
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: {
        id: true,
        glAccountId: true,
        glAccount: { select: { id: true, code: true } },
      },
    });

    const map = new Map<string, { id: string; code: string }>();
    for (const acct of accounts) {
      if (acct.glAccount) {
        map.set(acct.id, { id: acct.glAccount.id, code: acct.glAccount.code });
      }
    }

    // For accounts without linked GL, try to find by well-known bank code
    const missingIds = accountIds.filter((id) => !map.has(id));
    if (missingIds.length > 0) {
      const bankGL = await prisma.gLAccount.findFirst({
        where: {
          entityId: this.entityId,
          code: WELL_KNOWN_CODES.BANK_ACCOUNT,
          isActive: true,
        },
        select: { id: true, code: true },
      });

      if (bankGL) {
        for (const id of missingIds) {
          map.set(id, bankGL);
        }
      }
    }

    return map;
  }

  private buildMemo(txn: JESuggestionInput, cat: CategorySuggestion): string {
    const catLabel = cat.categoryName ? ` — ${cat.categoryName}` : '';
    return `AI-drafted: ${txn.description}${catLabel}`;
  }

  private buildResult(
    suggestions: JESuggestion[],
    skipped: Array<{ transactionId: string; reason: string }>,
    totalInput: number
  ): JESuggestionBatchResult {
    return {
      suggestions,
      skipped,
      summary: {
        total: totalInput,
        suggested: suggestions.length,
        skipped: skipped.length,
        highConfidence: suggestions.filter((s) => s.categorization.confidenceTier === 'high').length,
        mediumConfidence: suggestions.filter((s) => s.categorization.confidenceTier === 'medium').length,
        lowConfidence: suggestions.filter((s) => s.categorization.confidenceTier === 'low').length,
      },
    };
  }
}
