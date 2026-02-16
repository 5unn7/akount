'use server';

import {
    listTransactions,
    bulkCategorizeTransactions,
    bulkDeleteTransactions,
    updateTransaction,
    type ListTransactionsParams,
    type ListTransactionsResponse,
} from '@/lib/api/transactions';
import {
    postTransaction,
    postBulkTransactions,
    listGLAccounts,
    type JournalEntry,
    type GLAccount,
} from '@/lib/api/accounting';
import {
    listCategories,
    createCategory,
    type Category,
} from '@/lib/api/categories';

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

export async function postTransactionAction(
    transactionId: string,
    glAccountId: string,
    exchangeRate?: number
): Promise<JournalEntry> {
    return postTransaction({ transactionId, glAccountId, exchangeRate });
}

export async function postBulkTransactionsAction(
    transactionIds: string[],
    glAccountId: string,
    exchangeRate?: number
): Promise<{ posted: number; entries: JournalEntry[] }> {
    return postBulkTransactions({ transactionIds, glAccountId, exchangeRate });
}

export async function fetchExpenseAccounts(
    entityId: string
): Promise<GLAccount[]> {
    return listGLAccounts({ entityId, isActive: true });
}

export async function fetchCategoriesAction(): Promise<Category[]> {
    const result = await listCategories({ isActive: true, includeChildren: true });
    return result.categories;
}

export async function assignCategoryAction(
    transactionId: string,
    categoryId: string | null
): Promise<void> {
    await updateTransaction(transactionId, { categoryId });
}

export async function createCategoryAction(
    name: string,
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
): Promise<Category> {
    return createCategory({ name, type });
}

