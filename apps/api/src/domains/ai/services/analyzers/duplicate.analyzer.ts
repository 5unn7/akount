// AI Auto-Bookkeeper Phase 3: Duplicate Expense Analyzer (Task 7 - DEV-221)
// Stub: will be fully implemented in Task 7
import type { InsightResult } from '../../types/insight.types.js';
import type { SharedAnalysisData } from '../insight-generator.service.js';

/**
 * Detect duplicate expenses from recent transactions.
 * Pure function: accepts shared data, returns InsightResult[].
 *
 * Groups by similar description + same amount + within 48 hours.
 * Priority: medium (always — user must decide).
 */
export function analyzeDuplicates(data: SharedAnalysisData, entityId: string): InsightResult[] {
  // TODO: Implement in Task 7 (DEV-221)
  return [];
}
