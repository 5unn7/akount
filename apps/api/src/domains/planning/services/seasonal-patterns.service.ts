import { prisma } from '@akount/db';

export interface MonthlyDataPoint {
  month: string;     // YYYY-MM
  revenue: number;   // Integer cents
  expenses: number;  // Integer cents
  net: number;       // revenue - expenses
}

export interface SeasonalAnalysis {
  monthlyData: MonthlyDataPoint[];
  averageRevenue: number;      // Monthly average (cents)
  averageExpenses: number;     // Monthly average (cents)
  highRevenueMonths: string[]; // Months >1 std dev above mean
  lowRevenueMonths: string[];  // Months >1 std dev below mean
  highExpenseMonths: string[]; // Months >1 std dev above mean
  lowExpenseMonths: string[];  // Months >1 std dev below mean
  seasonalityScore: number;    // 0-100 (0 = flat, 100 = highly seasonal)
  monthsAnalyzed: number;
}

export class SeasonalPatternsService {
  constructor(private readonly tenantId: string) {}

  async analyze(entityId: string, lookbackMonths: number = 12): Promise<SeasonalAnalysis> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - lookbackMonths);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get all posted journal lines grouped by month
    const lines = await prisma.journalLine.findMany({
      where: {
        deletedAt: null,
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          date: { gte: startDate },
          deletedAt: null,
          status: 'POSTED',
        },
      },
      select: {
        debitAmount: true,
        creditAmount: true,
        journalEntry: {
          select: { date: true },
        },
      },
    });

    // Group by month
    const monthMap = new Map<string, { revenue: number; expenses: number }>();

    for (const line of lines) {
      const date = line.journalEntry.date;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { revenue: 0, expenses: 0 });
      }

      const entry = monthMap.get(monthKey)!;
      entry.expenses += line.debitAmount;
      entry.revenue += line.creditAmount;
    }

    // Convert to sorted array
    const monthlyData: MonthlyDataPoint[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        net: data.revenue - data.expenses,
      }));

    if (monthlyData.length === 0) {
      return {
        monthlyData: [],
        averageRevenue: 0,
        averageExpenses: 0,
        highRevenueMonths: [],
        lowRevenueMonths: [],
        highExpenseMonths: [],
        lowExpenseMonths: [],
        seasonalityScore: 0,
        monthsAnalyzed: 0,
      };
    }

    // Calculate statistics
    const n = monthlyData.length;
    const avgRevenue = Math.round(monthlyData.reduce((s, d) => s + d.revenue, 0) / n);
    const avgExpenses = Math.round(monthlyData.reduce((s, d) => s + d.expenses, 0) / n);

    const stdRevenue = this.stdDev(monthlyData.map(d => d.revenue));
    const stdExpenses = this.stdDev(monthlyData.map(d => d.expenses));

    // Identify high/low months (>1 std dev from mean)
    const highRevenueMonths = monthlyData
      .filter(d => d.revenue > avgRevenue + stdRevenue)
      .map(d => d.month);
    const lowRevenueMonths = monthlyData
      .filter(d => d.revenue < avgRevenue - stdRevenue)
      .map(d => d.month);
    const highExpenseMonths = monthlyData
      .filter(d => d.expenses > avgExpenses + stdExpenses)
      .map(d => d.month);
    const lowExpenseMonths = monthlyData
      .filter(d => d.expenses < avgExpenses - stdExpenses)
      .map(d => d.month);

    // Seasonality score: coefficient of variation (0-100)
    const cvRevenue = avgRevenue > 0 ? (stdRevenue / avgRevenue) * 100 : 0;
    const cvExpenses = avgExpenses > 0 ? (stdExpenses / avgExpenses) * 100 : 0;
    const seasonalityScore = Math.min(100, Math.round((cvRevenue + cvExpenses) / 2));

    return {
      monthlyData,
      averageRevenue: avgRevenue,
      averageExpenses: avgExpenses,
      highRevenueMonths,
      lowRevenueMonths,
      highExpenseMonths,
      lowExpenseMonths,
      seasonalityScore,
      monthsAnalyzed: n,
    };
  }

  private stdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squareDiffs.reduce((s, v) => s + v, 0) / values.length);
  }
}
