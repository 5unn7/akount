// AI Auto-Bookkeeper Phase 3: Overdue Analyzer (Task 6 - DEV-220)
// Stub: will be fully implemented in Task 6
import type { InsightResult } from '../../types/insight.types.js';
import type { SharedAnalysisData } from '../insight-generator.service.js';

/**
 * Analyze overdue invoices and bills.
 * Pure function: accepts shared data (action items), returns InsightResult[].
 *
 * Groups overdue items by type, triggers overdue_alert.
 * Priority: high if total > $1,000, critical if > $10,000.
 */
export function analyzeOverdue(data: SharedAnalysisData, entityId: string): InsightResult[] {
  // TODO: Implement in Task 6 (DEV-220)
  return [];
}
