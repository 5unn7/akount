// AI Auto-Bookkeeper Phase 3: Revenue Trend Analyzer (Task 8 - DEV-222)
// Stub: will be fully implemented in Task 8
import type { InsightResult } from '../../types/insight.types.js';

/**
 * Analyze revenue trends (month-over-month comparison).
 * DB-access analyzer: calls report service directly.
 *
 * Triggers revenue_trend if revenue changes >15% MoM.
 * Positive = low priority (informational), negative = high priority.
 */
export async function analyzeRevenue(entityId: string, tenantId: string): Promise<InsightResult[]> {
  // TODO: Implement in Task 8 (DEV-222)
  return [];
}
