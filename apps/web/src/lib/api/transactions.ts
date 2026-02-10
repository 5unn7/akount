import { apiClient } from './client';

/**
 * Transaction from API
 */
export interface Transaction {
    id: string;
    accountId: string;
    date: string;
    description: string;
    amount: number; // cents
    currency: string;
    categoryId?: string;
    notes?: string;
    sourceType: string;
    sourceId?: string;
    journalEntryId?: string;
    isStaged: boolean;
    isSplit: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    account?: {
        id: string;
        name: string;
        type: string;
    };
    category?: {
        id: string;
        name: string;
    };
}

/**
 * Query parameters for listing transactions
 */
export interface ListTransactionsParams {
    accountId?: string;
    categoryId?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    cursor?: string;
    limit?: number;
}

/**
 * Paginated response from the transactions API
 */
export interface ListTransactionsResponse {
    transactions: Transaction[];
    nextCursor?: string;
    hasMore: boolean;
}

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
 * Input for creating a transaction
 */
export interface CreateTransactionInput {
    accountId: string;
    date: string; // ISO date string
    description: string;
    amount: number; // cents
    categoryId?: string;
    notes?: string;
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
 * Input for updating a transaction
 */
export interface UpdateTransactionInput {
    date?: string; // ISO date string
    description?: string;
    amount?: number; // cents
    categoryId?: string | null;
    notes?: string | null;
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
 * Format amount from cents to currency string
 */
export function formatAmount(cents: number, currency: string = 'CAD'): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency,
    }).format(dollars);
}

/**
 * Format date for display
 */
export function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
