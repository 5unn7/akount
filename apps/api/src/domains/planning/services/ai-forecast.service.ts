import { prisma } from '@akount/db';
import { SeasonalPatternsService } from './seasonal-patterns.service';

/**
 * A single month projection in the forecast output.
 */
export interface ForecastProjection {
  /** Month in YYYY-MM format */
  month: string;
  /** Projected amount in integer cents */
  amount: number;
  /** Confidence score from 0-100 (decreases with distance and variance) */
  confidence: number;
  /** Decomposition of the projection into its component signals */
  components: {
    /** Trend component derived from linear regression (cents) */
    trend: number;
    /** Seasonal adjustment based on monthly patterns (cents) */
    seasonal: number;
    /** Weighted base average from recent months (cents) */
    base: number;
  };
}

/**
 * Result returned by the AI forecast generation.
 */
export interface AIForecastResult {
  /** Monthly projections for the forecast horizon */
  projections: ForecastProjection[];
  /** Description of the methodology used */
  methodology: string;
  /** Quality assessment based on available history depth */
  dataQuality: 'high' | 'medium' | 'low';
  /** Number of historical months used for the forecast */
  monthsOfHistory: number;
}

/** Internal type for monthly historical data points */
interface HistoricalDataPoint {
  /** Month in YYYY-MM format */
  month: string;
  /** Aggregated amount in integer cents */
  amount: number;
}

/** Linear regression result */
interface TrendResult {
  /** Slope of the regression line (cents per month) */
  slope: number;
  /** Y-intercept of the regression line (cents) */
  intercept: number;
}

/**
 * AI-Enhanced Forecast Service
 *
 * Uses statistical methods to generate smarter forecast projections than
 * simple linear extrapolation. Combines weighted moving averages, seasonal
 * decomposition from SeasonalPatternsService, and linear trend detection
 * to produce month-by-month projections with confidence intervals.
 *
 * This service does NOT call any external AI API. "AI" refers to the
 * statistical intelligence applied: seasonal pattern recognition, trend
 * extraction, and adaptive confidence scoring.
 *
 * All monetary amounts are integer cents. All queries are tenant-isolated.
 */
export class AIForecastService {
  constructor(private readonly tenantId: string) {}

  /**
   * Generate a forecast for the next N months using weighted moving averages,
   * seasonal adjustment factors, and linear trend detection.
   *
   * @param entityId - The entity to forecast for (must belong to tenant)
   * @param forecastMonths - Number of months to project forward (default: 12)
   * @param type - Forecast type: EXPENSE, REVENUE, or CASH_FLOW (default: EXPENSE)
   * @returns Forecast result with projections, methodology, and data quality assessment
   *
   * @example
   * ```typescript
   * const service = new AIForecastService(tenantId);
   * const result = await service.generateForecast(entityId, 6, 'REVENUE');
   * // result.projections[0].amount is in integer cents
   * // result.dataQuality indicates reliability of projections
   * ```
   */
  async generateForecast(
    entityId: string,
    forecastMonths: number = 12,
    type: 'EXPENSE' | 'REVENUE' | 'CASH_FLOW' = 'EXPENSE'
  ): Promise<AIForecastResult> {
    // 1. Gather up to 24 months of historical monthly data
    const historicalData = await this.getMonthlyHistorical(entityId, 24, type);

    const monthsOfHistory = historicalData.length;

    // Minimum 3 months required for meaningful projections
    if (monthsOfHistory < 3) {
      return {
        projections: [],
        methodology: 'insufficient_data',
        dataQuality: 'low',
        monthsOfHistory,
      };
    }

    // 2. Get seasonal patterns from the dedicated service
    const seasonalService = new SeasonalPatternsService(this.tenantId);
    await seasonalService.analyze(entityId, Math.min(monthsOfHistory, 24));

    // 3. Calculate trend via linear regression on historical data
    const trend = this.calculateTrend(historicalData);

    // 4. Compute seasonal adjustment factors (monthly multipliers)
    const seasonalFactors = this.getSeasonalFactors(historicalData);

    // 5. Generate forward projections
    const projections = this.project(
      historicalData,
      trend,
      seasonalFactors,
      forecastMonths
    );

    // 6. Assess data quality based on history depth
    const dataQuality =
      monthsOfHistory >= 12 ? 'high' : monthsOfHistory >= 6 ? 'medium' : 'low';

    return {
      projections,
      methodology: `weighted_moving_average_with_seasonal_${dataQuality}_confidence`,
      dataQuality,
      monthsOfHistory,
    };
  }

  /**
   * Aggregate monthly totals from posted journal lines.
   *
   * Queries JournalLine records for the given entity, grouped by calendar month.
   * Only POSTED, non-deleted entries are included. The aggregation logic differs
   * by forecast type:
   * - EXPENSE: sums debit amounts
   * - REVENUE: sums credit amounts
   * - CASH_FLOW: credits minus debits (net flow)
   *
   * @param entityId - Entity to query
   * @param months - Number of months to look back
   * @param type - Determines which side of journal lines to aggregate
   * @returns Chronologically sorted monthly data points (amounts in integer cents)
   */
  private async getMonthlyHistorical(
    entityId: string,
    months: number,
    type: 'EXPENSE' | 'REVENUE' | 'CASH_FLOW'
  ): Promise<HistoricalDataPoint[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const lines = await prisma.journalLine.findMany({
      where: {
        deletedAt: null,
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          status: 'POSTED',
          date: { gte: startDate },
          deletedAt: null,
        },
      },
      select: {
        debitAmount: true,
        creditAmount: true,
        journalEntry: { select: { date: true } },
      },
    });

    // Group by YYYY-MM
    const monthlyMap = new Map<string, number>();

    for (const line of lines) {
      const date = line.journalEntry.date;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(key) ?? 0;

      if (type === 'EXPENSE') {
        monthlyMap.set(key, existing + line.debitAmount);
      } else if (type === 'REVENUE') {
        monthlyMap.set(key, existing + line.creditAmount);
      } else {
        // CASH_FLOW: net = credits - debits
        monthlyMap.set(key, existing + line.creditAmount - line.debitAmount);
      }
    }

    // Sort chronologically and return
    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));
  }

  /**
   * Calculate a linear trend line using ordinary least squares regression.
   *
   * Maps each data point to an index (0, 1, 2, ...) and fits y = slope*x + intercept.
   * Both slope and intercept are rounded to integer cents.
   *
   * @param data - Chronologically sorted monthly data
   * @returns Slope (cents/month) and intercept (cents)
   */
  private calculateTrend(data: HistoricalDataPoint[]): TrendResult {
    const n = data.length;

    if (n < 2) {
      return { slope: 0, intercept: data[0]?.amount ?? 0 };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i].amount;
      sumXY += i * data[i].amount;
      sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;

    // Guard against zero denominator (all x values identical — only possible if n=1, handled above)
    if (denominator === 0) {
      return { slope: 0, intercept: Math.round(sumY / n) };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope: Math.round(slope),
      intercept: Math.round(intercept),
    };
  }

  /**
   * Calculate seasonal factors as monthly multipliers.
   *
   * Groups historical data by calendar month (1-12) and computes
   * each month's average relative to the overall average. A factor
   * of 1.0 means "average month", >1.0 means above-average, <1.0 below.
   *
   * Months with no data default to factor 1.0 (neutral).
   *
   * @param data - Chronologically sorted monthly data
   * @returns Map from month number (1-12) to seasonal multiplier
   */
  private getSeasonalFactors(
    data: HistoricalDataPoint[]
  ): Map<number, number> {
    const monthTotals = new Map<number, number[]>();

    for (const d of data) {
      const monthNum = parseInt(d.month.split('-')[1], 10);
      const existing = monthTotals.get(monthNum) ?? [];
      existing.push(d.amount);
      monthTotals.set(monthNum, existing);
    }

    const overallAvg =
      data.length > 0
        ? data.reduce((sum, d) => sum + d.amount, 0) / data.length
        : 0;

    const factors = new Map<number, number>();

    for (const [month, values] of monthTotals) {
      const monthAvg =
        values.reduce((sum, v) => sum + v, 0) / values.length;
      factors.set(month, overallAvg > 0 ? monthAvg / overallAvg : 1);
    }

    return factors;
  }

  /**
   * Project future months by blending weighted base, trend, and seasonal components.
   *
   * Blending formula:
   * - 50% weighted moving average (recent 3 months, weights: 0.5/0.3/0.2)
   * - 30% linear trend extrapolation
   * - 20% seasonal adjustment on the base
   *
   * Confidence scoring:
   * - Starts at 90 for the first month
   * - Loses up to 3 points per month of distance (max 40 point penalty)
   * - Loses up to 30 points based on coefficient of variation (historical volatility)
   * - Minimum confidence: 10
   *
   * All output amounts are non-negative integer cents.
   *
   * @param historical - Chronologically sorted historical data
   * @param trend - Linear regression result
   * @param seasonalFactors - Monthly multipliers (1-12)
   * @param months - Number of months to project forward
   * @returns Array of monthly projections with confidence scores
   */
  private project(
    historical: HistoricalDataPoint[],
    trend: TrendResult,
    seasonalFactors: Map<number, number>,
    months: number
  ): ForecastProjection[] {
    const projections: ForecastProjection[] = [];
    const n = historical.length;

    // Weighted moving average from the most recent 3 months
    // Most recent month gets the highest weight
    const recentMonths = historical.slice(-3);
    const weights = [0.5, 0.3, 0.2];
    let weightedBase = 0;
    for (let i = 0; i < recentMonths.length; i++) {
      const dataPoint = recentMonths[recentMonths.length - 1 - i];
      const weight = weights[i] ?? 0.1;
      weightedBase += dataPoint.amount * weight;
    }

    // Calculate variance and coefficient of variation for confidence scoring
    const avg =
      n > 0 ? historical.reduce((s, d) => s + d.amount, 0) / n : 0;
    const variance =
      n > 0
        ? historical.reduce((s, d) => s + Math.pow(d.amount - avg, 2), 0) / n
        : 0;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 1; // Coefficient of variation

    const now = new Date();

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
      const monthNum = futureDate.getMonth() + 1;

      // Trend component: extrapolate the linear regression
      const trendValue = trend.intercept + trend.slope * (n + i);

      // Seasonal factor for this calendar month (1.0 = neutral)
      const factor = seasonalFactors.get(monthNum) ?? 1;

      // Component breakdown (all integer cents)
      const base = Math.round(weightedBase);
      const trendComponent = Math.round(trendValue * 0.3);
      const seasonalComponent = Math.round(base * (factor - 1));

      // Blended projection: 50% base + 30% trend + 20% seasonal-adjusted base
      const amount = Math.max(
        0,
        Math.round(base * 0.5 + trendComponent + base * 0.2 * factor)
      );

      // Confidence decreases with forecast distance and historical volatility
      const distancePenalty = Math.min(i * 3, 40);
      const variancePenalty = Math.min(cv * 30, 30);
      const confidence = Math.max(
        10,
        Math.round(90 - distancePenalty - variancePenalty)
      );

      projections.push({
        month: monthStr,
        amount,
        confidence,
        components: {
          trend: trendComponent,
          seasonal: seasonalComponent,
          base,
        },
      });
    }

    return projections;
  }
}
