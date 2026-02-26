import { prisma } from '@akount/db';

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

    // Calculate variance for each budget
    const results = await Promise.all(
      budgets.map(async (budget) => {
        const actualAmount = await this.calculateActualSpend(
          entityId,
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
      })
    );

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
