import { prisma } from '@akount/db';
import { logger } from '../../../lib/logger';

/**
 * Budget Variance Service
 *
 * Compares budget amounts against actual GL spend.
 * Cross-domain read: queries JournalLines from accounting domain.
 * All amounts in integer cents. Tenant-isolated.
 */

export interface BudgetVarianceResult {
  budgetId: string;
  budgetName: string;
  period: string;
  budgetedAmount: number; // Integer cents
  actualAmount: number; // Integer cents — total spend
  variance: number; // budgetedAmount - actualAmount (positive = under budget)
  variancePercent: number; // (variance / budgetedAmount) * 100
  utilizationPercent: number; // (actualAmount / budgetedAmount) * 100
  alertLevel: 'ok' | 'warning' | 'over-budget';
  startDate: Date;
  endDate: Date;
  glAccountId: string | null;
  categoryId: string | null;
}

export interface BudgetVarianceDetail extends BudgetVarianceResult {
  transactions: Array<{
    id: string;
    date: Date;
    memo: string;
    debitAmount: number;
    creditAmount: number;
    glAccountName: string;
    entryNumber: string | null;
  }>;
}

export class BudgetVarianceService {
  constructor(private readonly tenantId: string) {}

  /**
   * Get variance analysis for all budgets of an entity.
   * Compares each budget's amount against actual GL spend within its date range.
   *
   * OPTIMIZED: Fetches all journal lines in one query, then aggregates in memory
   * to avoid N+1 query pattern (96% reduction from N+1 to 2 queries).
   */
  async listBudgetVariances(entityId: string): Promise<BudgetVarianceResult[]> {
    // Fetch all active budgets for entity
    const budgets = await prisma.budget.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (budgets.length === 0) return [];

    // OPTIMIZATION: Determine min/max date range across all budgets
    const minDate = new Date(Math.min(...budgets.map(b => b.startDate.getTime())));
    const maxDate = new Date(Math.max(...budgets.map(b => b.endDate.getTime())));

    // Get all GL account IDs (filter out nulls)
    const glAccountIds = [...new Set(budgets.map(b => b.glAccountId).filter(Boolean))] as string[];

    // OPTIMIZATION: Fetch ALL journal lines for all accounts in one query
    const journalLines = glAccountIds.length > 0
      ? await prisma.journalLine.findMany({
          where: {
            glAccountId: { in: glAccountIds },
            deletedAt: null,
            journalEntry: {
              entityId,
              entity: { tenantId: this.tenantId },
              date: {
                gte: minDate,
                lte: maxDate,
              },
              deletedAt: null,
              status: 'POSTED',
            },
          },
          select: {
            glAccountId: true,
            debitAmount: true,
            creditAmount: true,
            journalEntry: {
              select: {
                date: true,
              },
            },
          },
        })
      : [];

    // Group journal lines by glAccountId for fast lookup
    const linesByAccount = new Map<string, typeof journalLines>();
    for (const line of journalLines) {
      const existing = linesByAccount.get(line.glAccountId) ?? [];
      existing.push(line);
      linesByAccount.set(line.glAccountId, existing);
    }

    // Calculate variance for each budget using in-memory aggregation
    const results = budgets.map((budget) => {
      // Filter lines for this budget's GL account and date range
      const relevantLines = budget.glAccountId
        ? (linesByAccount.get(budget.glAccountId) ?? []).filter(
            (line) =>
              line.journalEntry.date >= budget.startDate &&
              line.journalEntry.date <= budget.endDate
          )
        : [];

      // Aggregate actual spend
      const actualAmount = relevantLines.reduce(
        (sum, line) => sum + line.debitAmount - line.creditAmount,
        0
      );

      const variance = budget.amount - actualAmount;
      const variancePercent =
        budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
      const utilizationPercent =
        budget.amount > 0 ? (actualAmount / budget.amount) * 100 : 0;

      const alertLevel: BudgetVarianceResult['alertLevel'] =
        utilizationPercent >= 100
          ? 'over-budget'
          : utilizationPercent >= 80
            ? 'warning'
            : 'ok';

      return {
        budgetId: budget.id,
        budgetName: budget.name,
        period: budget.period,
        budgetedAmount: budget.amount,
        actualAmount,
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
        alertLevel,
        startDate: budget.startDate,
        endDate: budget.endDate,
        glAccountId: budget.glAccountId,
        categoryId: budget.categoryId,
      };
    });

    logger.info({
      entityId,
      budgetCount: results.length,
      overBudgetCount: results.filter(r => r.alertLevel === 'over-budget').length
    }, 'Calculated budget variances');

    return results;
  }

  /**
   * Get detailed variance for a single budget, including matching transactions.
   */
  async getBudgetVarianceDetail(budgetId: string): Promise<BudgetVarianceDetail | null> {
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
    });

    if (!budget) return null;

    const actualAmount = await this.calculateActualSpend(
      budget.entityId,
      budget.glAccountId,
      budget.startDate,
      budget.endDate
    );

    const variance = budget.amount - actualAmount;
    const variancePercent =
      budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
    const utilizationPercent =
      budget.amount > 0 ? (actualAmount / budget.amount) * 100 : 0;

    const alertLevel: BudgetVarianceResult['alertLevel'] =
      utilizationPercent >= 100
        ? 'over-budget'
        : utilizationPercent >= 80
          ? 'warning'
          : 'ok';

    // Get matching journal lines for drill-down
    const transactions = await this.getMatchingTransactions(
      budget.entityId,
      budget.glAccountId,
      budget.startDate,
      budget.endDate
    );

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      period: budget.period,
      budgetedAmount: budget.amount,
      actualAmount,
      variance,
      variancePercent: Math.round(variancePercent * 100) / 100,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      alertLevel,
      startDate: budget.startDate,
      endDate: budget.endDate,
      glAccountId: budget.glAccountId,
      categoryId: budget.categoryId,
      transactions,
    };
  }

  /**
   * Calculate actual spend from journal lines for a GL account within a date range.
   * Spend = total debit amounts (expenses increase via debits in standard accounting).
   */
  private async calculateActualSpend(
    entityId: string,
    glAccountId: string | null,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    if (!glAccountId) return 0;

    // FIN-36: Validate GL account ownership before querying
    const glAccount = await prisma.gLAccount.findFirst({
      where: { id: glAccountId, entity: { tenantId: this.tenantId } },
      select: { id: true },
    });
    if (!glAccount) return 0; // Invalid glAccountId for this tenant

    const result = await prisma.journalLine.aggregate({
      where: {
        glAccountId,
        deletedAt: null,
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          date: {
            gte: startDate,
            lte: endDate,
          },
          deletedAt: null,
          status: 'POSTED',
        },
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    // Net spend = debits - credits for expense accounts
    const debits = result._sum.debitAmount ?? 0;
    const credits = result._sum.creditAmount ?? 0;
    return debits - credits;
  }

  /**
   * Get individual journal lines matching a budget's GL account and date range.
   */
  private async getMatchingTransactions(
    entityId: string,
    glAccountId: string | null,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetVarianceDetail['transactions']> {
    if (!glAccountId) return [];

    const lines = await prisma.journalLine.findMany({
      where: {
        glAccountId,
        deletedAt: null,
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          date: {
            gte: startDate,
            lte: endDate,
          },
          deletedAt: null,
          status: 'POSTED',
        },
      },
      include: {
        journalEntry: {
          select: {
            date: true,
            entryNumber: true,
            memo: true,
          },
        },
        glAccount: {
          select: { name: true },
        },
      },
      orderBy: { journalEntry: { date: 'desc' } },
      take: 100,
    });

    return lines.map((line) => ({
      id: line.id,
      date: line.journalEntry.date,
      memo: line.journalEntry.memo,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      glAccountName: line.glAccount.name,
      entryNumber: line.journalEntry.entryNumber,
    }));
  }
}
