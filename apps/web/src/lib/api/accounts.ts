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
    country: string;
    institution?: string;
    currentBalance: number; // cents
    isActive: boolean;
    entity: AccountEntity;
}

/**
 * Input for creating an account
 */
export interface CreateAccountInput {
    entityId: string;
    name: string;
    type: AccountType;
    currency: string;
    country: string;
    institution?: string;
}

/**
 * Input for updating an account
 */
export interface UpdateAccountInput {
    name?: string;
    institution?: string | null;
    isActive?: boolean;
    type?: AccountType;
}

/**
 * Query parameters for listing accounts
 */
export interface ListAccountsParams {
    entityId?: string;
    type?: AccountType;
    isActive?: boolean;
    cursor?: string;
    limit?: number;
}

/**
 * Paginated response from the accounts API
 */
export interface ListAccountsResponse {
    accounts: Account[];
    nextCursor?: string;
    hasMore: boolean;
}

/**
 * Fetch list of accounts from the API with pagination
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated accounts response
 */
export async function listAccounts(
    params?: ListAccountsParams
): Promise<ListAccountsResponse> {
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

    if (params?.cursor) {
        searchParams.append('cursor', params.cursor);
    }

    if (params?.limit !== undefined) {
        searchParams.append('limit', String(params.limit));
    }

    const endpoint = `/api/banking/accounts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    return apiClient<ListAccountsResponse>(endpoint);
}

/**
 * Fetch a single account by ID
 */
export async function getAccount(accountId: string): Promise<Account> {
    return apiClient<Account>(`/api/banking/accounts/${accountId}`);
}

/**
 * Create a new account
 */
export async function createAccount(input: CreateAccountInput): Promise<Account> {
    return apiClient<Account>('/api/banking/accounts', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Update an existing account
 */
export async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    return apiClient<Account>(`/api/banking/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

/**
 * Soft-delete an account
 */
export async function deleteAccount(id: string): Promise<void> {
    return apiClient<void>(`/api/banking/accounts/${id}`, {
        method: 'DELETE',
    });
}
