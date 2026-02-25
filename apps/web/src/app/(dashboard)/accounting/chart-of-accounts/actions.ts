'use server';

import {
    listGLAccounts,
    createGLAccount,
    updateGLAccount,
    deactivateGLAccount,
    getAccountBalances,
    seedDefaultCOA,
    type ListGLAccountsParams,
    type CreateGLAccountInput,
    type UpdateGLAccountInput,
    type GLAccount,
    type GLAccountBalance,
} from '@/lib/api/accounting';

export async function fetchGLAccounts(
    params: ListGLAccountsParams
): Promise<GLAccount[]> {
    return listGLAccounts(params);
}

export async function fetchAccountBalances(
    entityId: string
): Promise<GLAccountBalance[]> {
    return getAccountBalances(entityId);
}

export async function createGLAccountAction(
    input: CreateGLAccountInput
): Promise<GLAccount> {
    return createGLAccount(input);
}

export async function updateGLAccountAction(
    id: string,
    input: UpdateGLAccountInput
): Promise<GLAccount> {
    return updateGLAccount(id, input);
}

export async function deactivateGLAccountAction(
    id: string
): Promise<GLAccount> {
    return deactivateGLAccount(id);
}

export async function reactivateGLAccountAction(
    id: string
): Promise<GLAccount> {
    return updateGLAccount(id, { isActive: true });
}

export async function seedDefaultCOAAction(
    entityId: string
): Promise<{ created: number; skipped?: boolean }> {
    return seedDefaultCOA(entityId);
}
