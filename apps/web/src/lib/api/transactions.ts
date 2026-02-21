import { apiClient } from './client';

// Re-export types and utilities (safe for client components)
export type {
    Transaction,
    ListTransactionsParams,
    ListTransactionsResponse,
    CreateTransactionInput,
    UpdateTransactionInput,
    SpendingByCategoryResponse,
    SpendingByCategoryParams,
} from './transactions.types';

export { formatAmount, formatDate } from './transactions.types';

// Import types for use in this file
import type {
    Transaction,
    ListTransactionsParams,
    ListTransactionsResponse,
    CreateTransactionInput,
    UpdateTransactionInput,
    SpendingByCategoryResponse,
    SpendingByCategoryParams,
} from './transactions.types';

/**
 * SERVER-ONLY API Functions
 *
 * These functions use the server-only apiClient and must only be called from:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 */

/**
 * Fetch list of transactions from the API with pagination
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated transactions response
 */
export async function listTransactions(
    params?: ListTransactionsParams
): Promise<ListTransactionsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.accountId) {
        searchParams.append('accountId', params.accountId);
    }

    if (params?.categoryId) {
        searchParams.append('categoryId', params.categoryId);
    }

    if (params?.startDate) {
        searchParams.append('startDate', params.startDate);
    }

    if (params?.endDate) {
        searchParams.append('endDate', params.endDate);
    }

    if (params?.cursor) {
        searchParams.append('cursor', params.cursor);
    }

    if (params?.limit !== undefined) {
        searchParams.append('limit', String(params.limit));
    }

    const endpoint = `/api/banking/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    return apiClient<ListTransactionsResponse>(endpoint);
}

/**
 * Fetch a single transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
    return apiClient<Transaction>(`/api/banking/transactions/${transactionId}`);
}

/**
 * Create a new transaction
 */
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    return apiClient<Transaction>('/api/banking/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
    id: string,
    input: UpdateTransactionInput
): Promise<Transaction> {
    return apiClient<Transaction>(`/api/banking/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

/**
 * Soft-delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
    return apiClient<void>(`/api/banking/transactions/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Bulk categorize transactions
 */
export async function bulkCategorizeTransactions(
    transactionIds: string[],
    categoryId: string | null
): Promise<{ updated: number }> {
    return apiClient<{ updated: number }>('/api/banking/transactions/bulk/categorize', {
        method: 'PATCH',
        body: JSON.stringify({ transactionIds, categoryId }),
    });
}

/**
 * Bulk soft-delete transactions
 */
export async function bulkDeleteTransactions(
    transactionIds: string[]
): Promise<{ deleted: number }> {
    return apiClient<{ deleted: number }>('/api/banking/transactions/bulk/delete', {
        method: 'POST',
        body: JSON.stringify({ transactionIds }),
    });
}

export async function deduplicateTransactions(
    accountId: string
): Promise<{ removed: number; groups: number }> {
    return apiClient<{ removed: number; groups: number }>('/api/banking/transactions/dedup', {
        method: 'POST',
        body: JSON.stringify({ accountId }),
    });
}

/**
 * Get spending breakdown by category
 */
export async function getSpendingByCategory(
    params?: SpendingByCategoryParams
): Promise<SpendingByCategoryResponse> {
    const searchParams = new URLSearchParams();

    if (params?.entityId) searchParams.append('entityId', params.entityId);
    if (params?.accountId) searchParams.append('accountId', params.accountId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const qs = searchParams.toString();
    return apiClient<SpendingByCategoryResponse>(
        `/api/banking/transactions/spending-by-category${qs ? `?${qs}` : ''}`
    );
}