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
 * GL Account reference
 */
export interface GLAccountRef {
    id: string;
    code: string;
    name: string;
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
    glAccountId?: string | null;
    glAccount?: GLAccountRef | null;
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
    openingBalance?: number;       // Integer cents
    openingBalanceDate?: string;   // ISO date string
}

/**
 * Input for updating an account
 */
export interface UpdateAccountInput {
    name?: string;
    institution?: string | null;
    isActive?: boolean;
    type?: AccountType;
    glAccountId?: string | null;
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

/**
 * Transaction with running balance
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
    runningBalance: number; // cents - calculated running balance
}

/**
 * Query parameters for listing account transactions
 */
export interface ListAccountTransactionsParams {
    cursor?: string;
    limit?: number;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
}

/**
 * Paginated response from the account transactions API
 */
export interface ListAccountTransactionsResponse {
    transactions: Transaction[];
    nextCursor?: string;
    hasMore: boolean;
}

/**
 * Fetch transactions for a specific account with running balance
 *
 * @param accountId - The account ID
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated transactions with running balance
 */
export async function listAccountTransactions(
    accountId: string,
    params?: ListAccountTransactionsParams
): Promise<ListAccountTransactionsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.cursor) {
        searchParams.append('cursor', params.cursor);
    }

    if (params?.limit !== undefined) {
        searchParams.append('limit', String(params.limit));
    }

    if (params?.startDate) {
        searchParams.append('startDate', params.startDate);
    }

    if (params?.endDate) {
        searchParams.append('endDate', params.endDate);
    }

    const endpoint = `/api/banking/accounts/${accountId}/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    return apiClient<ListAccountTransactionsResponse>(endpoint);
}

// ─── Bank Connections ────────────────────────────────────────────────

export interface ConnectionAccount {
    id: string;
    name: string;
    currentBalance: number; // cents
    currency: string;
}

export interface BankConnectionResult {
    id: string;
    entityId: string;
    provider: string;
    institutionName: string;
    status: string;
    accounts: ConnectionAccount[];
    accountCount: number;
    transactionCount: number;
    isExisting: boolean;
}

/**
 * Create a bank connection from Flinks Connect loginId.
 */
export async function createBankConnection(
    loginId: string,
    entityId: string,
): Promise<BankConnectionResult> {
    return apiClient<BankConnectionResult>('/api/banking/connections', {
        method: 'POST',
        body: JSON.stringify({ loginId, entityId }),
    });
}
