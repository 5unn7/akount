import { prisma } from '@akount/db';

/**
 * Budget Suggestion Service
 *
 * Analyzes historical spending patterns (last 3-6 months) to suggest
 * realistic budget amounts per GL account. Helps users set budgets
 * based on actual spend rather than guesswork.
 *
 * Cross-domain read: queries JournalLines from accounting domain.
 * All amounts in integer cents. Tenant-isolated.
 */

export interface BudgetSuggestion {
  categoryId: string | null;
  glAccountId: string | null;
  categoryName: string;
  averageMonthlySpend: number; // Integer cents
  suggestedAmount: number; // Integer cents (110% of average, rounded up to nearest dollar)
  monthsAnalyzed: number;
  minMonthly: number; // Integer cents
  maxMonthly: number; // Integer cents
}

/** Maximum number of suggestions returned. */
const MAX_SUGGESTIONS = 10;

/** Buffer multiplier applied to the average (10% above average). */
const SUGGESTION_BUFFER = 1.1;

export class BudgetSuggestionService {
  constructor(private readonly tenantId: string) {}

  /**
   * Generate budget suggestions for an entity based on historical expense patterns.
   *
   * Queries POSTED journal lines for EXPENSE-type GL accounts over the lookback
   * period, groups spending by GL account and month, then computes statistical
   * summaries to produce actionable budget recommendations.
   *
   * @param entityId - The entity to analyze
   * @param lookbackMonths - Number of months to look back (3-12, default 6)
   * @returns Up to 10 suggestions sorted by highest average spend
   */
  async getSuggestions(
    entityId: string,
    lookbackMonths: number = 6
  ): Promise<BudgetSuggestion[]> {
    // Clamp lookback to reasonable bounds
    const clampedLookback = Math.max(3, Math.min(12, lookbackMonths));

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - clampedLookback);
    // Start from the 1st of that month for clean month boundaries
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all expense journal lines within the lookback window.
    // Expenses increase via debits in standard accounting, so we query
    // lines with debitAmount > 0 on EXPENSE-type GL accounts.
    const lines = await prisma.journalLine.findMany({
      where: {
        deletedAt: null,
        debitAmount: { gt: 0 },
        glAccount: {
          type: 'EXPENSE',
          entity: { tenantId: this.tenantId },
        },
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          status: 'POSTED',
          deletedAt: null,
          date: { gte: startDate },
        },
      },
      select: {
        debitAmount: true,
        creditAmount: true,
        glAccountId: true,
        glAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        journalEntry: {
          select: { date: true },
        },
      },
    });

    if (lines.length === 0) return [];

    // Group lines by GL account, then by month
    const accountMap = new Map<
      string,
      {
        glAccountId: string;
        glAccountName: string;
        monthlySpends: Map<string, number>;
      }
    >();

    for (const line of lines) {
      const accountId = line.glAccountId;
      let entry = accountMap.get(accountId);

      if (!entry) {
        entry = {
          glAccountId: accountId,
          glAccountName: line.glAccount.name,
          monthlySpends: new Map<string, number>(),
        };
        accountMap.set(accountId, entry);
      }

      // Build month key (YYYY-MM) from journal entry date
      const date = line.journalEntry.date;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Net spend per line = debit - credit (for expense accounts, net debit = spend)
      const netSpend = line.debitAmount - line.creditAmount;
      const current = entry.monthlySpends.get(monthKey) ?? 0;
      entry.monthlySpends.set(monthKey, current + netSpend);
    }

    // Calculate statistics and build suggestions
    const suggestions: BudgetSuggestion[] = [];

    for (const [, account] of accountMap) {
      const monthlyAmounts = Array.from(account.monthlySpends.values());

      // Skip accounts that only appeared in one month (not enough data for a pattern)
      if (monthlyAmounts.length < 1) continue;

      const totalSpend = monthlyAmounts.reduce((sum, amt) => sum + amt, 0);
      const monthsWithSpend = monthlyAmounts.length;

      // Average based on months that had actual spending
      const averageMonthlySpend = Math.round(totalSpend / monthsWithSpend);

      // Skip negligible spending (less than $1 average)
      if (averageMonthlySpend < 100) continue;

      const minMonthly = Math.min(...monthlyAmounts);
      const maxMonthly = Math.max(...monthlyAmounts);

      // Suggested amount = 110% of average, rounded UP to nearest dollar (100 cents)
      const suggestedAmount =
        Math.ceil((averageMonthlySpend * SUGGESTION_BUFFER) / 100) * 100;

      suggestions.push({
        categoryId: null, // Categories are separate from GL accounts; null for now
        glAccountId: account.glAccountId,
        categoryName: account.glAccountName,
        averageMonthlySpend,
        suggestedAmount,
        monthsAnalyzed: monthsWithSpend,
        minMonthly,
        maxMonthly,
      });
    }

    // Sort by highest average spend first (most impactful budgets)
    suggestions.sort((a, b) => b.averageMonthlySpend - a.averageMonthlySpend);

    // Return top N suggestions to keep the list manageable
    return suggestions.slice(0, MAX_SUGGESTIONS);
  }
}
