'use server';

import {
    getSuggestions,
    createMatch,
    unmatch,
    getReconciliationStatus,
    type MatchSuggestion,
    type ReconciliationStatus,
    type TransactionMatch,
} from '@/lib/api/reconciliation';
import { listTransactions } from '@/lib/api/transactions';
import type { Transaction } from '@/lib/api/transactions';

export async function fetchReconciliationStatus(
    accountId: string
): Promise<ReconciliationStatus> {
    return getReconciliationStatus(accountId);
}

export async function fetchSuggestions(
    bankFeedTransactionId: string,
    limit?: number
): Promise<MatchSuggestion[]> {
    const result = await getSuggestions(bankFeedTransactionId, limit);
    return result.suggestions;
}

export async function matchTransactions(
    bankFeedTransactionId: string,
    transactionId: string
): Promise<TransactionMatch> {
    return createMatch(bankFeedTransactionId, transactionId);
}

export async function unmatchTransactions(matchId: string): Promise<void> {
    return unmatch(matchId);
}

export async function fetchAccountTransactions(
    accountId: string
): Promise<Transaction[]> {
    const result = await listTransactions({ accountId, limit: 50 });
    return result.transactions;
}
