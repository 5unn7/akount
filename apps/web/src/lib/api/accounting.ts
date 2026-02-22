import { apiClient } from './client';

// ============================================================================
// GL Account types
// ============================================================================

export type GLAccountType =
    | 'ASSET'
    | 'LIABILITY'
    | 'EQUITY'
    | 'REVENUE'
    | 'EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface GLAccount {
    id: string;
    entityId: string;
    code: string;
    name: string;
    type: GLAccountType;
    normalBalance: NormalBalance;
    description: string | null;
    parentAccountId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        childAccounts: number;
        journalLines: number;
    };
}

export interface GLAccountBalance {
    accountId: string;
    code: string;
    name: string;
    type: GLAccountType;
    normalBalance: NormalBalance;
    debitTotal: number; // cents
    creditTotal: number; // cents
    balance: number; // cents (net)
}

export interface CreateGLAccountInput {
    entityId: string;
    code: string;
    name: string;
    type: GLAccountType;
    normalBalance: NormalBalance;
    description?: string;
    parentAccountId?: string;
}

export interface UpdateGLAccountInput {
    name?: string;
    description?: string | null;
    isActive?: boolean;
}

export interface ListGLAccountsParams {
    entityId: string;
    type?: GLAccountType;
    isActive?: boolean;
    parentAccountId?: string | null;
}

// ============================================================================
// Journal Entry types
// ============================================================================

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'VOIDED' | 'ARCHIVED';

export interface JournalLine {
    id: string;
    glAccountId: string;
    glAccount: {
        id: string;
        code: string;
        name: string;
        type: GLAccountType;
    };
    debitAmount: number; // cents
    creditAmount: number; // cents
    description: string | null;
    currency?: string;
    exchangeRate?: number;
    baseCurrencyDebit?: number;
    baseCurrencyCredit?: number;
}

export interface JournalEntry {
    id: string;
    entityId: string;
    entryNumber: number;
    date: string;
    memo: string;
    status: JournalEntryStatus;
    sourceType: string | null;
    sourceId: string | null;
    reversalOfId: string | null;
    createdBy: string;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
    lines: JournalLine[];
}

export interface ListJournalEntriesParams {
    entityId: string;
    status?: JournalEntryStatus;
    sourceType?: string;
    startDate?: string;
    endDate?: string;
    cursor?: string;
    limit?: number;
}

export interface ListJournalEntriesResponse {
    entries: JournalEntry[];
    nextCursor?: string;
    hasMore: boolean;
}

export interface CreateJournalEntryInput {
    entityId: string;
    date: string; // ISO date
    memo: string;
    lines: {
        glAccountId: string;
        debitAmount: number;
        creditAmount: number;
        description?: string;
        currency?: string;
        exchangeRate?: number;
        baseCurrencyDebit?: number;
        baseCurrencyCredit?: number;
    }[];
}

export interface PostTransactionInput {
    transactionId: string;
    glAccountId: string;
    exchangeRate?: number;
}

export interface PostBulkTransactionsInput {
    transactionIds: string[];
    glAccountId: string;
    exchangeRate?: number;
}

// ============================================================================
// GL Account API functions
// ============================================================================

export async function listGLAccounts(
    params: ListGLAccountsParams
): Promise<GLAccount[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('entityId', params.entityId);
    if (params.type) searchParams.append('type', params.type);
    if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params.parentAccountId !== undefined) {
        searchParams.append('parentAccountId', params.parentAccountId ?? '');
    }

    return apiClient<GLAccount[]>(
        `/api/accounting/chart-of-accounts?${searchParams.toString()}`
    );
}

export async function getGLAccount(id: string): Promise<GLAccount> {
    return apiClient<GLAccount>(`/api/accounting/chart-of-accounts/${id}`);
}

export async function createGLAccount(
    input: CreateGLAccountInput
): Promise<GLAccount> {
    return apiClient<GLAccount>('/api/accounting/chart-of-accounts', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function updateGLAccount(
    id: string,
    input: UpdateGLAccountInput
): Promise<GLAccount> {
    return apiClient<GLAccount>(`/api/accounting/chart-of-accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

export async function deactivateGLAccount(id: string): Promise<GLAccount> {
    return apiClient<GLAccount>(
        `/api/accounting/chart-of-accounts/${id}`,
        { method: 'DELETE' }
    );
}

export async function getAccountBalances(
    entityId: string
): Promise<GLAccountBalance[]> {
    return apiClient<GLAccountBalance[]>(
        `/api/accounting/chart-of-accounts/balances?entityId=${entityId}`
    );
}

export async function seedDefaultCOA(
    entityId: string
): Promise<{ created: number; skipped?: boolean }> {
    return apiClient<{ created: number; skipped?: boolean }>(
        '/api/accounting/chart-of-accounts/seed',
        {
            method: 'POST',
            body: JSON.stringify({ entityId }),
        }
    );
}

// ============================================================================
// Journal Entry API functions
// ============================================================================

export async function listJournalEntries(
    params: ListJournalEntriesParams
): Promise<ListJournalEntriesResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('entityId', params.entityId);
    if (params.status) searchParams.append('status', params.status);
    if (params.sourceType) searchParams.append('sourceType', params.sourceType);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));

    return apiClient<ListJournalEntriesResponse>(
        `/api/accounting/journal-entries?${searchParams.toString()}`
    );
}

export async function getJournalEntry(id: string): Promise<JournalEntry> {
    return apiClient<JournalEntry>(`/api/accounting/journal-entries/${id}`);
}

export async function createJournalEntry(
    input: CreateJournalEntryInput
): Promise<JournalEntry> {
    return apiClient<JournalEntry>('/api/accounting/journal-entries', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function approveJournalEntry(id: string): Promise<JournalEntry> {
    return apiClient<JournalEntry>(
        `/api/accounting/journal-entries/${id}/approve`,
        { method: 'POST' }
    );
}

export async function voidJournalEntry(
    id: string
): Promise<{ original: JournalEntry; reversal: JournalEntry }> {
    return apiClient<{ original: JournalEntry; reversal: JournalEntry }>(
        `/api/accounting/journal-entries/${id}/void`,
        { method: 'POST' }
    );
}

export async function deleteJournalEntry(id: string): Promise<void> {
    return apiClient<void>(`/api/accounting/journal-entries/${id}`, {
        method: 'DELETE',
    });
}

export async function postTransaction(
    input: PostTransactionInput
): Promise<JournalEntry> {
    return apiClient<JournalEntry>(
        '/api/accounting/journal-entries/post-transaction',
        {
            method: 'POST',
            body: JSON.stringify(input),
        }
    );
}

export async function postBulkTransactions(
    input: PostBulkTransactionsInput
): Promise<{ posted: number; entries: JournalEntry[] }> {
    return apiClient<{ posted: number; entries: JournalEntry[] }>(
        '/api/accounting/journal-entries/post-transactions',
        {
            method: 'POST',
            body: JSON.stringify(input),
        }
    );
}

// ============================================================================
// Tax Rate types
// ============================================================================

export interface TaxRate {
    id: string;
    entityId: string | null;
    code: string;
    name: string;
    rate: number; // 0-1 decimal (0.13 = 13%)
    jurisdiction: string;
    isInclusive: boolean;
    glAccountId: string | null;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo: string | null;
}

export interface ListTaxRatesParams {
    entityId?: string;
    jurisdiction?: string;
    isActive?: boolean;
    search?: string;
}

export interface CreateTaxRateInput {
    entityId?: string;
    code: string;
    name: string;
    rate: number;
    jurisdiction: string;
    isInclusive?: boolean;
    glAccountId?: string;
    effectiveFrom: string;
    effectiveTo?: string;
}

export interface UpdateTaxRateInput {
    name?: string;
    rate?: number;
    jurisdiction?: string;
    isInclusive?: boolean;
    glAccountId?: string | null;
    isActive?: boolean;
    effectiveFrom?: string;
    effectiveTo?: string | null;
}

// ============================================================================
// Tax Rate API functions
// ============================================================================

export async function listTaxRates(
    params: ListTaxRatesParams = {}
): Promise<TaxRate[]> {
    const searchParams = new URLSearchParams();
    if (params.entityId) searchParams.append('entityId', params.entityId);
    if (params.jurisdiction) searchParams.append('jurisdiction', params.jurisdiction);
    if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return apiClient<TaxRate[]>(
        `/api/accounting/tax-rates${query ? `?${query}` : ''}`
    );
}

export async function getTaxRate(id: string): Promise<TaxRate> {
    return apiClient<TaxRate>(`/api/accounting/tax-rates/${id}`);
}

export async function createTaxRate(
    input: CreateTaxRateInput
): Promise<TaxRate> {
    return apiClient<TaxRate>('/api/accounting/tax-rates', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function updateTaxRate(
    id: string,
    input: UpdateTaxRateInput
): Promise<TaxRate> {
    return apiClient<TaxRate>(`/api/accounting/tax-rates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

export async function deactivateTaxRate(id: string): Promise<TaxRate> {
    return apiClient<TaxRate>(`/api/accounting/tax-rates/${id}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// Formatting helpers
// ============================================================================

export function formatAmount(cents: number, currency: string = 'CAD'): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency,
    }).format(dollars);
}

export function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
