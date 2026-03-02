/**
 * Reconciliation types and pure utility functions.
 * Safe for both Server and Client components (no server-only imports).
 */

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
