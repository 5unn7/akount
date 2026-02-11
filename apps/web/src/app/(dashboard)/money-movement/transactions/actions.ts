'use server';

import {
    listTransactions,
    bulkCategorizeTransactions,
    bulkDeleteTransactions,
    type ListTransactionsParams,
    type ListTransactionsResponse,
} from '@/lib/api/transactions';

export async function fetchMoreTransactions(
    params?: ListTransactionsParams
): Promise<ListTransactionsResponse> {
    return listTransactions(params);
}

export async function bulkCategorizeAction(
    transactionIds: string[],
    categoryId: string | null
): Promise<{ updated: number }> {
    return bulkCategorizeTransactions(transactionIds, categoryId);
}

export async function bulkDeleteAction(
    transactionIds: string[]
): Promise<{ deleted: number }> {
    return bulkDeleteTransactions(transactionIds);
}
