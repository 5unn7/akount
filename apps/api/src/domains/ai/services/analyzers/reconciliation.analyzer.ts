// AI Auto-Bookkeeper Phase 3: Reconciliation Gap Analyzer (Task 8 - DEV-222)
// Stub: will be fully implemented in Task 8
import type { InsightResult } from '../../types/insight.types.js';

/**
 * Analyze reconciliation gaps across bank accounts.
 * DB-access analyzer: fetches accounts and reconciliation status.
 *
 * Triggers reconciliation_gap per account where reconciliation < 80%.
 * Priority: medium (60-80%), high (<60%), critical (<40%).
 */
export async function analyzeReconciliation(entityId: string, tenantId: string): Promise<InsightResult[]> {
  // TODO: Implement in Task 8 (DEV-222)
  return [];
}
