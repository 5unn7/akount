// AI Auto-Bookkeeper Phase 3: Spending Anomaly Analyzer (Task 7 - DEV-221)
// Stub: will be fully implemented in Task 7
import type { InsightResult } from '../../types/insight.types.js';
import type { SharedAnalysisData } from '../insight-generator.service.js';

/**
 * Analyze spending patterns for anomalies.
 * Pure function: accepts shared data (expense breakdown), returns InsightResult[].
 *
 * Compares current month to 3-month rolling average.
 * Triggers spending_anomaly if category >30% above average AND absolute increase >$100.
 */
export function analyzeSpending(data: SharedAnalysisData, entityId: string): InsightResult[] {
  // TODO: Implement in Task 7 (DEV-221)
  return [];
}
