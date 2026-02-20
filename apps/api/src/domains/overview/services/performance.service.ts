import { prisma } from '@akount/db';
import type { PerformanceMetrics } from '../schemas/performance.schema';
import { getInvoiceStats } from '../../invoicing/services/invoice.service';

/**
 * Performance metrics service - calculates revenue, expenses, profit, and trends
 * from transaction data with tenant isolation.
 *
 * CRITICAL FINANCIAL INVARIANTS:
 * - All amounts in integer cents (never floats)
 * - Tenant isolation enforced (filters by account.entity.tenantId)
 * - Soft delete respected (deletedAt IS NULL)
 * - Category types: INCOME (revenue), EXPENSE (expenses)
 */
export class PerformanceService {
  constructor(private tenantId: string) {}

  /**
   * Calculate performance metrics for the specified period
   *
   * @param entityId - Optional entity filter (defaults to all entities for tenant)
   * @param targetCurrency - Currency for returned values (default: CAD)
   * @param period - Time period (default: 30d)
   */
  async getPerformanceMetrics(
    entityId?: string,
    targetCurrency: string = 'CAD',
    period: string = '30d'
  ): Promise<PerformanceMetrics> {
    const days = parseInt(period.replace('d', ''), 10);

    // Calculate date ranges
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);
    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - (days * 2));
    const previousEnd = new Date(currentStart);

    // Base transaction query with tenant isolation
    const baseWhere = {
      account: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
      },
      deletedAt: null, // Soft delete filter
    };

    // PERF-6: Fetch both periods + invoice stats in parallel (was 3 sequential queries)
    const [currentTransactions, previousTransactions, invoiceStats] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...baseWhere,
          date: {
            gte: currentStart,
            lte: now,
          },
        },
        select: {
          amount: true,
          date: true,
          category: {
            select: {
              type: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.transaction.findMany({
        where: {
          ...baseWhere,
          date: {
            gte: previousStart,
            lt: currentStart, // Exclusive to avoid overlap
          },
        },
        select: {
          amount: true,
          category: {
            select: {
              type: true,
            },
          },
        },
      }),
      getInvoiceStats({ tenantId: this.tenantId, userId: '', role: 'OWNER' }),
    ]);

    // Classify transactions as revenue or expense:
    // 1. If categorized: use category type (INCOME / EXPENSE)
    // 2. If uncategorized: use amount sign (positive = revenue, negative = expense)
    // This ensures imported transactions are visible even before manual categorization.
    const isRevenue = (t: { amount: number; category: { type: string } | null }) =>
      t.category?.type === 'INCOME' || (!t.category && t.amount > 0);

    const isExpense = (t: { amount: number; category: { type: string } | null }) =>
      t.category?.type === 'EXPENSE' || (!t.category && t.amount < 0);

    // Calculate revenue
    const currentRevenue = currentTransactions
      .filter(isRevenue)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousRevenue = previousTransactions
      .filter(isRevenue)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate expenses — absolute value
    const currentExpenses = currentTransactions
      .filter(isExpense)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousExpenses = previousTransactions
      .filter(isExpense)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate profit
    const currentProfit = currentRevenue - currentExpenses;
    const previousProfit = previousRevenue - previousExpenses;

    // Generate sparklines (15 data points for 30d period = every 2 days)
    const sparklinePoints = 15;
    const daysPerPoint = Math.floor(days / sparklinePoints);

    const revenueSparkline = this.generateSparkline(
      currentTransactions.filter(isRevenue),
      days,
      sparklinePoints,
      daysPerPoint
    ).map((v) => Math.abs(v));

    const expensesSparkline = this.generateSparkline(
      currentTransactions.filter(isExpense),
      days,
      sparklinePoints,
      daysPerPoint
    ).map((v) => Math.abs(v)); // Absolute values for expenses

    const profitSparkline = revenueSparkline.map(
      (rev, i) => rev - expensesSparkline[i]
    );

    // Calculate percentage changes
    const revenueChange = this.calculatePercentChange(
      previousRevenue,
      currentRevenue
    );
    const expensesChange = this.calculatePercentChange(
      previousExpenses,
      currentExpenses
    );
    const profitChange = this.calculatePercentChange(
      previousProfit,
      currentProfit
    );

    // Receivables from invoicing domain (already fetched in parallel above)
    const receivables = {
      outstanding: invoiceStats.outstandingAR,
      overdue: invoiceStats.overdue,
      sparkline: [] as number[], // TODO: Generate sparkline from invoice aging data
    };

    // PERF-6: Single query with groupBy replaces 2 separate aggregate calls
    const accountsByActive = await prisma.account.groupBy({
      by: ['isActive'],
      where: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
      },
      _count: {
        id: true,
      },
    });

    const activeCount = accountsByActive.find((g) => g.isActive)?._count.id ?? 0;
    const inactiveCount = accountsByActive.find((g) => !g.isActive)?._count.id ?? 0;
    const totalCount = activeCount + inactiveCount;

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        percentChange: revenueChange,
        sparkline: revenueSparkline,
      },
      expenses: {
        current: currentExpenses,
        previous: previousExpenses,
        percentChange: expensesChange,
        sparkline: expensesSparkline,
      },
      profit: {
        current: currentProfit,
        previous: previousProfit,
        percentChange: profitChange,
        sparkline: profitSparkline,
      },
      receivables,
      accounts: {
        active: activeCount,
        total: totalCount,
      },
      currency: targetCurrency,
    };
  }

  /**
   * Generate sparkline data points from transactions
   *
   * @param transactions - Filtered transactions
   * @param totalDays - Total period in days
   * @param numPoints - Number of sparkline points to generate
   * @param daysPerPoint - Days per data point
   */
  private generateSparkline(
    transactions: Array<{ date: Date; amount: number }>,
    totalDays: number,
    numPoints: number,
    daysPerPoint: number
  ): number[] {
    if (transactions.length === 0) {
      return new Array(numPoints).fill(0);
    }

    const now = new Date();
    const sparkline: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const pointEnd = new Date(now);
      pointEnd.setDate(pointEnd.getDate() - (totalDays - (i + 1) * daysPerPoint));

      const pointStart = new Date(pointEnd);
      pointStart.setDate(pointStart.getDate() - daysPerPoint);

      const pointValue = transactions
        .filter(
          (t) =>
            t.date >= pointStart &&
            t.date <= pointEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

      sparkline.push(pointValue);
    }

    return sparkline;
  }

  /**
   * Calculate percentage change between two values
   *
   * @param previous - Previous period value (integer cents)
   * @param current - Current period value (integer cents)
   * @returns Percentage change (-100 to +∞)
   */
  private calculatePercentChange(previous: number, current: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100; // Avoid division by zero
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  }
}
