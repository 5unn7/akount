// AI Auto-Bookkeeper Phase 3: Revenue Trend Analyzer (Task 8 - DEV-222)
// DB-access analyzer: calls ReportService to compare month-over-month revenue
import type { InsightResult, RevenueTrendMetadata } from '../../types/insight.types.js';
import { ReportService } from '../../../accounting/services/report.service.js';

/** Minimum percentage change to trigger insight (15%) */
const MIN_PERCENT_CHANGE = 15;

/**
 * Analyze revenue trends (month-over-month comparison).
 *
 * Calls ReportService.generateProfitLoss() for current and prior month.
 * Triggers revenue_trend if revenue changes >15% MoM.
 * Positive trend = low priority (informational), negative = high priority.
 *
 * Note: Report service returns amounts in integer cents.
 */
export async function analyzeRevenue(entityId: string, tenantId: string): Promise<InsightResult[]> {
  const reportService = new ReportService(tenantId, 'system');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Current month date range
  const currentStart = new Date(currentYear, currentMonth, 1);
  const currentEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  // Prior month date range
  const priorStart = new Date(currentYear, currentMonth - 1, 1);
  const priorEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  let currentReport;
  let priorReport;

  try {
    [currentReport, priorReport] = await Promise.all([
      reportService.generateProfitLoss({
        entityId,
        startDate: currentStart,
        endDate: currentEnd,
      }),
      reportService.generateProfitLoss({
        entityId,
        startDate: priorStart,
        endDate: priorEnd,
      }),
    ]);
  } catch {
    // If report generation fails (e.g., no GL accounts), skip silently
    return [];
  }

  const currentRevenue = currentReport.revenue.total; // Integer cents
  const priorRevenue = priorReport.revenue.total; // Integer cents

  // Skip if no prior revenue (avoid division by zero, and new entities have no baseline)
  if (priorRevenue === 0) {
    return [];
  }

  const percentChange = ((currentRevenue - priorRevenue) / Math.abs(priorRevenue)) * 100;
  const absPercentChange = Math.abs(percentChange);

  // Only trigger if change exceeds threshold
  if (absPercentChange < MIN_PERCENT_CHANGE) {
    return [];
  }

  const direction: 'up' | 'down' = percentChange >= 0 ? 'up' : 'down';

  // Positive = low (informational), negative = high (concerning)
  let priority: 'low' | 'medium' | 'high' | 'critical';
  if (direction === 'down') {
    if (absPercentChange >= 50) {
      priority = 'critical';
    } else if (absPercentChange >= 30) {
      priority = 'high';
    } else {
      priority = 'medium';
    }
  } else {
    // Positive trend is informational
    priority = 'low';
  }

  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const metadata: RevenueTrendMetadata = {
    currentRevenue, // Already integer cents from report service
    priorRevenue,
    percentChange: Math.round(percentChange),
    direction,
  };

  return [
    {
      triggerId: `revenue_trend:${entityId}:${yearMonth}`,
      title: `Revenue ${direction === 'up' ? 'Increase' : 'Decrease'}: ${Math.round(absPercentChange)}%`,
      description: `Revenue ${direction === 'up' ? 'increased' : 'decreased'} ${Math.round(absPercentChange)}% compared to last month`,
      type: 'revenue_trend',
      priority,
      impact: Math.min(100, Math.round(absPercentChange)),
      confidence: 0.95, // Based on actual financial data
      actionable: direction === 'down', // Only actionable if declining
      metadata,
    },
  ];
}
