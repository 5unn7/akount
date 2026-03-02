// AI Auto-Bookkeeper Phase 3: Spending Anomaly Analyzer (Task 7 - DEV-221)
// Pure function: accepts shared data (expense breakdown), returns InsightResult[]
import type { InsightResult, SpendingAnomalyMetadata } from '../../types/insight.types.js';
import type { SharedAnalysisData } from '../insight-generator.service.js';

/** Minimum percentage increase above average to trigger (30%) */
const MIN_PERCENT_INCREASE = 30;

/** Minimum absolute increase in cents to trigger ($100 = 10000 cents) */
const MIN_ABSOLUTE_INCREASE_CENTS = 10000;

/**
 * Analyze spending patterns for anomalies.
 *
 * Compares current month to 3-month rolling average per category.
 * Triggers spending_anomaly if category is >30% above average AND
 * absolute increase > $100 (10000 cents).
 *
 * Note: Expense breakdown amounts are in DOLLARS (dashboard divides by 100).
 * Metadata stored in integer cents per financial invariant.
 *
 * Priority: medium (>30%), high (>50%), critical (>100%).
 */
export function analyzeSpending(data: SharedAnalysisData, entityId: string): InsightResult[] {
  const { expenseBreakdown } = data;

  // Need at least 2 months of data (current + 1 historical for comparison)
  if (expenseBreakdown.length < 2) {
    return [];
  }

  const results: InsightResult[] = [];
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Most recent month is the last entry
  const currentMonth = expenseBreakdown[expenseBreakdown.length - 1];

  // Prior months for rolling average (up to 3 months before current)
  const priorMonths = expenseBreakdown.slice(
    Math.max(0, expenseBreakdown.length - 4),
    expenseBreakdown.length - 1
  );

  if (priorMonths.length === 0) {
    return [];
  }

  // Build category averages from prior months (in dollars)
  const categoryTotals = new Map<string, { total: number; count: number }>();

  for (const month of priorMonths) {
    for (const cat of month.categories) {
      const existing = categoryTotals.get(cat.name) ?? { total: 0, count: 0 };
      existing.total += cat.amount; // dollars
      existing.count += 1;
      categoryTotals.set(cat.name, existing);
    }
  }

  // Compare current month categories to averages
  for (const category of currentMonth.categories) {
    const prior = categoryTotals.get(category.name);

    // Skip if no historical data for this category
    if (!prior || prior.count === 0) {
      continue;
    }

    const averageDollars = prior.total / prior.count;
    const currentDollars = category.amount;

    // Skip if average is zero (avoid division by zero)
    if (averageDollars === 0) {
      continue;
    }

    const percentIncrease = ((currentDollars - averageDollars) / averageDollars) * 100;
    const absoluteIncreaseCents = Math.round((currentDollars - averageDollars) * 100);

    // Check thresholds: >30% AND absolute > $100
    if (percentIncrease < MIN_PERCENT_INCREASE || absoluteIncreaseCents < MIN_ABSOLUTE_INCREASE_CENTS) {
      continue;
    }

    // Determine priority based on percentage increase
    let priority: 'critical' | 'high' | 'medium';
    if (percentIncrease >= 100) {
      priority = 'critical';
    } else if (percentIncrease >= 50) {
      priority = 'high';
    } else {
      priority = 'medium';
    }

    // Use category name as a stable ID component (no categoryId available from breakdown)
    const categoryKey = category.name.toLowerCase().replace(/\s+/g, '-');

    const metadata: SpendingAnomalyMetadata = {
      categoryName: category.name,
      categoryId: categoryKey, // Using normalized name as ID
      currentAmount: Math.round(currentDollars * 100), // Convert to cents
      averageAmount: Math.round(averageDollars * 100), // Convert to cents
      percentIncrease: Math.round(percentIncrease),
    };

    results.push({
      triggerId: `spending_anomaly:${entityId}:${categoryKey}:${yearMonth}`,
      title: `Spending Anomaly: ${category.name}`,
      description: `${category.name} spending is ${Math.round(percentIncrease)}% above the 3-month average ($${currentDollars.toLocaleString()} vs $${Math.round(averageDollars).toLocaleString()} avg)`,
      type: 'spending_anomaly',
      priority,
      impact: Math.min(100, Math.round(percentIncrease / 2)),
      confidence: 0.85,
      actionable: true,
      metadata,
    });
  }

  return results;
}
