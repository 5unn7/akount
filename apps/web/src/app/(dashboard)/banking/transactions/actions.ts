'use server';

import { revalidatePath } from 'next/cache';
import {
    listTransactions,
    createTransaction,
    bulkCategorizeTransactions,
    bulkDeleteTransactions,
    updateTransaction,
    type ListTransactionsParams,
    type ListTransactionsResponse,
    type CreateTransactionInput,
    type Transaction,
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

/**
 * Revalidate all dashboard/banking paths after data changes.
 * Called after imports, bulk operations, and transaction mutations.
 */
function revalidateDashboardPaths() {
    revalidatePath('/overview');
    revalidatePath('/overview/cash-flow');
    revalidatePath('/overview/net-worth');
    revalidatePath('/banking/accounts');
    revalidatePath('/banking/transactions');
}

/** Standalone action for import results to call */
export async function revalidateAfterImport() {
    revalidateDashboardPaths();
}

export async function fetchMoreTransactions(
    params?: ListTransactionsParams
): Promise<ListTransactionsResponse> {
    return listTransactions(params);
}

export async function createTransactionAction(
    input: CreateTransactionInput
): Promise<Transaction> {
    const result = await createTransaction(input);
    revalidateDashboardPaths();
    return result;
}

export async function bulkCategorizeAction(
    transactionIds: string[],
    categoryId: string | null
): Promise<{ updated: number }> {
    const result = await bulkCategorizeTransactions(transactionIds, categoryId);
    revalidateDashboardPaths();
    return result;
}

export async function bulkDeleteAction(
    transactionIds: string[]
): Promise<{ deleted: number }> {
    const result = await bulkDeleteTransactions(transactionIds);
    revalidateDashboardPaths();
    return result;
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
    revalidateDashboardPaths();
}

export async function createCategoryAction(
    name: string,
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
): Promise<Category> {
    return createCategory({ name, type });
}

