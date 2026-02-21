/**
 * Transaction Types and Utilities
 *
 * Safe for both Client and Server Components
 * Contains only types and pure utility functions
 */

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
    matches?: {
        id: string;
        status: string;
    }[];
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
 * Spending by category response from the API
 */
export interface SpendingByCategoryResponse {
    categories: Array<{
        categoryId: string | null;
        categoryName: string;
        categoryColor: string | null;
        totalAmount: number; // integer cents (positive)
        transactionCount: number;
        percentOfTotal: number;
    }>;
    totalExpenses: number; // integer cents (positive)
    currency: string;
}

/**
 * Query parameters for spending-by-category
 */
export interface SpendingByCategoryParams {
    entityId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
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
