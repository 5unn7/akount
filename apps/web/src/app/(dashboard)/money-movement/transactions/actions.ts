'use server';

import { listTransactions, type ListTransactionsParams, type ListTransactionsResponse } from '@/lib/api/transactions';

export async function fetchMoreTransactions(
    params?: ListTransactionsParams
): Promise<ListTransactionsResponse> {
    return listTransactions(params);
}
