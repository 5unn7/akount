import { apiClient } from './client';

// Re-export types and utilities (safe for client components)
export type { MatchSuggestion, ReconciliationStatus, TransactionMatch } from './reconciliation.types';
export { getConfidenceLevel, formatConfidence } from './reconciliation.types';

// Import types for use in this file
import type { MatchSuggestion, ReconciliationStatus, TransactionMatch } from './reconciliation.types';

/**
 * Get match suggestions for a bank feed transaction
 */
export async function getSuggestions(
  bankFeedTransactionId: string,
  limit?: number
): Promise<{ suggestions: MatchSuggestion[] }> {
  const qs = limit ? `?limit=${limit}` : '';
  return apiClient<{ suggestions: MatchSuggestion[] }>(
    `/api/banking/reconciliation/${bankFeedTransactionId}/suggestions${qs}`
  );
}

/**
 * Create a match between bank feed and posted transaction
 */
export async function createMatch(
  bankFeedTransactionId: string,
  transactionId: string
): Promise<TransactionMatch> {
  return apiClient<TransactionMatch>('/api/banking/reconciliation/matches', {
    method: 'POST',
    body: JSON.stringify({ bankFeedTransactionId, transactionId }),
  });
}

/**
 * Unmatch a previously matched transaction pair
 */
export async function unmatch(matchId: string): Promise<void> {
  return apiClient<void>(`/api/banking/reconciliation/matches/${matchId}`, {
    method: 'DELETE',
  });
}

/**
 * Get reconciliation status for an account
 */
export async function getReconciliationStatus(
  accountId: string
): Promise<ReconciliationStatus> {
  return apiClient<ReconciliationStatus>(
    `/api/banking/reconciliation/status/${accountId}`
  );
}
