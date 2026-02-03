import { apiClient } from './client';

/**
 * Account type enum matching backend
 */
export type AccountType =
    | 'BANK'
    | 'CREDIT_CARD'
    | 'INVESTMENT'
    | 'LOAN'
    | 'MORTGAGE'
    | 'OTHER';

/**
 * Account entity information
 */
export interface AccountEntity {
    id: string;
    name: string;
    type: 'BUSINESS' | 'PERSONAL';
}

/**
 * Account from API
 */
export interface Account {
    id: string;
    name: string;
    type: AccountType;
    currency: string;
    currentBalance: number; // cents
    isActive: boolean;
    entity: AccountEntity;
}

/**
 * Query parameters for listing accounts
 */
export interface ListAccountsParams {
    entityId?: string;
    type?: AccountType;
    isActive?: boolean;
}

/**
 * Fetch list of accounts from the API
 *
 * @param params - Query parameters for filtering
 * @returns Array of accounts
 */
export async function listAccounts(
    params?: ListAccountsParams
): Promise<Account[]> {
    const searchParams = new URLSearchParams();

    if (params?.entityId) {
        searchParams.append('entityId', params.entityId);
    }

    if (params?.type) {
        searchParams.append('type', params.type);
    }

    if (params?.isActive !== undefined) {
        searchParams.append('isActive', String(params.isActive));
    }

    const endpoint = `/api/accounts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const response = await apiClient<{ accounts: Account[] }>(endpoint);
    return response.accounts;
}

/**
 * Fetch a single account by ID
 *
 * @param accountId - Account ID
 * @returns Account details
 */
export async function getAccount(accountId: string): Promise<Account> {
    return apiClient<Account>(`/api/accounts/${accountId}`);
}
