/**
 * Server-only report API functions.
 * Import from Server Components and Server Actions only.
 * DO NOT import in client components (use client or types modules instead).
 */

import { apiClient } from './client';
import type {
    ProfitLossQuery,
    ProfitLossReport,
    BalanceSheetQuery,
    BalanceSheetReport,
    CashFlowQuery,
    CashFlowReport,
    TrialBalanceQuery,
    TrialBalanceReport,
    GLLedgerQuery,
    GLLedgerReport,
    SpendingQuery,
    SpendingReport,
    RevenueQuery,
    RevenueReport,
} from './reports-types';

// Re-export types for convenience
export * from './reports-types';

// ============================================================================
// Server-only API Client Functions
// ============================================================================

export async function getProfitLossReport(
    params: ProfitLossQuery
): Promise<ProfitLossReport> {
    const searchParams = new URLSearchParams();
    if (params.entityId) searchParams.append('entityId', params.entityId);
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.comparisonPeriod) searchParams.append('comparisonPeriod', params.comparisonPeriod);

    return apiClient<ProfitLossReport>(
        `/api/accounting/reports/profit-loss?${searchParams.toString()}`
    );
}

export async function getBalanceSheetReport(
    params: BalanceSheetQuery
): Promise<BalanceSheetReport> {
    const searchParams = new URLSearchParams();
    if (params.entityId) searchParams.append('entityId', params.entityId);
    searchParams.append('asOfDate', params.asOfDate);
    if (params.comparisonDate) searchParams.append('comparisonDate', params.comparisonDate);

    return apiClient<BalanceSheetReport>(
        `/api/accounting/reports/balance-sheet?${searchParams.toString()}`
    );
}

export async function getCashFlowReport(
    params: CashFlowQuery
): Promise<CashFlowReport> {
    const searchParams = new URLSearchParams();
    if (params.entityId) searchParams.append('entityId', params.entityId);
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);

    return apiClient<CashFlowReport>(
        `/api/accounting/reports/cash-flow?${searchParams.toString()}`
    );
}

export async function getTrialBalanceReport(
    params: TrialBalanceQuery
): Promise<TrialBalanceReport> {
    const searchParams = new URLSearchParams();
    searchParams.append('entityId', params.entityId);
    if (params.asOfDate) searchParams.append('asOfDate', params.asOfDate);

    return apiClient<TrialBalanceReport>(
        `/api/accounting/reports/trial-balance?${searchParams.toString()}`
    );
}

export async function getGLLedgerReport(
    params: GLLedgerQuery
): Promise<GLLedgerReport> {
    const searchParams = new URLSearchParams();
    searchParams.append('entityId', params.entityId);
    searchParams.append('glAccountId', params.glAccountId);
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));

    return apiClient<GLLedgerReport>(
        `/api/accounting/reports/general-ledger?${searchParams.toString()}`
    );
}

export async function getSpendingReport(
    params: SpendingQuery
): Promise<SpendingReport> {
    const searchParams = new URLSearchParams();
    if (params.entityId) searchParams.append('entityId', params.entityId);
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);

    return apiClient<SpendingReport>(
        `/api/accounting/reports/spending?${searchParams.toString()}`
    );
}

export async function getRevenueReport(
    params: RevenueQuery
): Promise<RevenueReport> {
    const searchParams = new URLSearchParams();
    if (params.entityId) searchParams.append('entityId', params.entityId);
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);

    return apiClient<RevenueReport>(
        `/api/accounting/reports/revenue?${searchParams.toString()}`
    );
}
