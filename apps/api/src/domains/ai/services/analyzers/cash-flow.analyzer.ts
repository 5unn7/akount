// AI Auto-Bookkeeper Phase 3: Cash Flow Analyzer (Task 6 - DEV-220)
// Pure function: accepts shared data, returns InsightResult[]
import type { InsightResult, CashFlowMetadata } from '../../types/insight.types.js';
import type { SharedAnalysisData } from '../insight-generator.service.js';

/** Default threshold: $5,000 = 500000 cents */
const DEFAULT_THRESHOLD_CENTS = 500000;

/**
 * Analyze cash flow projections for potential warnings.
 *
 * Uses getCashFlowProjection() data (30 historical + 30 projected days).
 * Triggers cash_flow_warning if any projected balance drops below threshold.
 * Priority: critical if <2 weeks, high if <4 weeks.
 *
 * Note: Projection values are in DOLLARS (dashboard divides by 100).
 * All metadata stored in integer cents per financial invariant.
 */
export function analyzeCashFlow(
  data: SharedAnalysisData,
  entityId: string,
  thresholdCents: number = DEFAULT_THRESHOLD_CENTS
): InsightResult[] {
  const { cashFlowProjection, metrics } = data;

  // Need projection data to analyze
  if (!cashFlowProjection || cashFlowProjection.length === 0) {
    return [];
  }

  const thresholdDollars = thresholdCents / 100;
  const currentBalanceCents = metrics.cashPosition.cash;

  // The projection has 30 historical + 30 projected data points
  // We only care about the projected portion (last 30 entries)
  const projectedStart = Math.max(0, cashFlowProjection.length - 30);
  const projectedEntries = cashFlowProjection.slice(projectedStart);

  // Find the lowest projected balance and when it occurs
  let lowestValue = Infinity;
  let lowestIndex = -1;

  for (let i = 0; i < projectedEntries.length; i++) {
    const value = projectedEntries[i].value;
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = i;
    }
  }

  // No projection data or lowest is above threshold
  if (lowestIndex === -1 || lowestValue >= thresholdDollars) {
    return [];
  }

  // Calculate days until the low point (index = days from today)
  const daysUntilLow = lowestIndex + 1;
  const projectedLowCents = Math.round(lowestValue * 100);

  // Determine priority based on timeline
  let priority: 'critical' | 'high' | 'medium';
  if (daysUntilLow <= 14) {
    priority = 'critical';
  } else if (daysUntilLow <= 28) {
    priority = 'high';
  } else {
    priority = 'medium';
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const metadata: CashFlowMetadata = {
    currentBalance: currentBalanceCents,
    projectedLow: projectedLowCents,
    daysUntilLow,
    threshold: thresholdCents,
  };

  return [
    {
      triggerId: `cash_flow_warning:${entityId}:${yearMonth}`,
      title: 'Cash Flow Warning',
      description: `Projected cash balance dropping to $${lowestValue.toLocaleString()} in ${daysUntilLow} days, below $${(thresholdCents / 100).toLocaleString()} threshold`,
      type: 'cash_flow_warning',
      priority,
      impact: Math.min(100, Math.round(((thresholdCents - projectedLowCents) / thresholdCents) * 100)),
      confidence: 0.75, // Projections are estimates
      actionable: true,
      metadata,
    },
  ];
}
