import { apiClient } from './client';

/**
 * Match suggestion from the reconciliation API
 */
export interface MatchSuggestion {
  transactionId: string;
  confidence: number;
  reasons: string[];
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number; // cents
    currency: string;
    account: {
      id: string;
      name: string;
    };
  };
}

/**
 * Reconciliation status for an account
 */
export interface ReconciliationStatus {
  accountId: string;
  totalBankFeed: number;
  matched: number;
  unmatched: number;
  suggested: number;
  reconciliationPercent: number;
}

/**
 * A matched pair of bank feed + posted transaction
 */
export interface TransactionMatch {
  id: string;
  bankFeedTransactionId: string;
  transactionId: string;
  status: string;
  confidence: number;
  matchedAt: string;
  matchedBy: string;
  bankFeedTransaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
  };
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    account: {
      id: string;
      name: string;
    };
  };
}

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

/**
 * Get confidence level label and color
 */
export function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 0.8) return { label: 'High', color: 'text-green-600' };
  if (confidence >= 0.6) return { label: 'Medium', color: 'text-yellow-600' };
  return { label: 'Low', color: 'text-red-600' };
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
