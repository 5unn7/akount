import { apiClient } from './client';

// ============================================================================
// Report types
// ============================================================================

export interface ReportLineItem {
    accountId: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    balance: number; // cents
    previousBalance?: number; // cents (for period comparison)
    depth: number;
    isSubtotal: boolean;
    children?: ReportLineItem[];
}

// ============================================================================
// Profit & Loss Report
// ============================================================================

export interface ProfitLossQuery {
    entityId?: string;
    startDate: string; // ISO date
    endDate: string; // ISO date
    comparisonPeriod?: string; // ISO date (for previous period comparison)
}

export interface ProfitLossReport {
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    comparisonPeriod?: string;
    revenue: {
        sections: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    expenses: {
        sections: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    netIncome: number; // cents
    previousNetIncome?: number;
}

// ============================================================================
// Balance Sheet Report
// ============================================================================

export interface BalanceSheetQuery {
    entityId?: string;
    asOfDate: string; // ISO date
    comparisonDate?: string; // ISO date (for comparison column)
}

export interface BalanceSheetReport {
    entityName: string;
    currency: string;
    asOfDate: string;
    comparisonDate?: string;
    assets: {
        sections: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    liabilities: {
        sections: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    equity: {
        sections: ReportLineItem[];
        retainedEarnings: {
            priorYears: number; // cents
            currentYear: number; // cents
            total: number; // cents
        };
        total: number; // cents
        previousTotal?: number;
    };
    totalAssets: number; // cents
    totalLiabilitiesAndEquity: number; // cents
    isBalanced: boolean;
}

// ============================================================================
// Cash Flow Report
// ============================================================================

export interface CashFlowQuery {
    entityId?: string;
    startDate: string; // ISO date
    endDate: string; // ISO date
}

export interface CashFlowReport {
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    operating: {
        netIncome: number; // cents
        adjustments: Array<{ name: string; amount: number }>;
        workingCapitalChanges: Array<{ name: string; amount: number }>;
        total: number; // cents
    };
    investing: {
        activities: Array<{ name: string; amount: number }>;
        total: number; // cents
    };
    financing: {
        activities: Array<{ name: string; amount: number }>;
        total: number; // cents
    };
    netCashChange: number; // cents
    openingCash: number; // cents
    closingCash: number; // cents
}

// ============================================================================
// Trial Balance Report
// ============================================================================

export interface TrialBalanceQuery {
    entityId: string; // Required for trial balance
    asOfDate?: string; // ISO date (defaults to today on backend)
}

export interface TrialBalanceAccount {
    id: string;
    code: string;
    name: string;
    debit: number; // cents
    credit: number; // cents
}

export interface TrialBalanceReport {
    entityName: string;
    currency: string;
    asOfDate: string;
    accounts: TrialBalanceAccount[];
    totalDebits: number; // cents
    totalCredits: number; // cents
    isBalanced: boolean;
    severity: 'OK' | 'CRITICAL';
}

// ============================================================================
// General Ledger Report
// ============================================================================

export interface GLLedgerQuery {
    entityId: string; // Required
    glAccountId: string; // Required
    startDate: string; // ISO date
    endDate: string; // ISO date
    cursor?: string;
    limit?: number; // Default 50, max 200
}

export interface GLLedgerEntry {
    id: string;
    date: string;
    entryNumber: number;
    memo: string;
    debitAmount: number; // cents
    creditAmount: number; // cents
    runningBalance: number; // cents
}

export interface GLLedgerReport {
    accountCode: string;
    accountName: string;
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    entries: GLLedgerEntry[];
    nextCursor?: string;
}

// ============================================================================
// Spending by Category Report
// ============================================================================

export interface SpendingQuery {
    entityId?: string;
    startDate: string; // ISO date
    endDate: string; // ISO date
}

export interface SpendingCategory {
    category: string; // GL account name
    amount: number; // cents
    percentage: number; // 0-100
}

export interface SpendingReport {
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    categories: SpendingCategory[];
    totalSpend: number; // cents
}

// ============================================================================
// Revenue by Client Report
// ============================================================================

export interface RevenueQuery {
    entityId?: string;
    startDate: string; // ISO date
    endDate: string; // ISO date
}

export interface RevenueClient {
    clientId: string | null;
    clientName: string;
    invoiceCount: number;
    amount: number; // cents
    percentage: number; // 0-100
}

export interface RevenueReport {
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    clients: RevenueClient[];
    totalRevenue: number; // cents
}

// ============================================================================
// API Client Functions
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

// ============================================================================
// Client-side export (authenticated blob download)
// ============================================================================

/**
 * Download a report as PDF or CSV from a client component.
 * Uses Clerk session token for authenticated blob downloads.
 */
export async function downloadReport(
    reportPath: string,
    params: Record<string, string | undefined>,
    format: 'pdf' | 'csv'
): Promise<void> {
    const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
    const token = await clerk?.session?.getToken();

    if (!token) {
        throw new Error('Not authenticated — please sign in');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.append(key, value);
    }
    searchParams.append('format', format);

    const response = await fetch(
        `${apiUrl}/api/accounting/reports/${reportPath}?${searchParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || err.message || 'Export failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Extract filename from Content-Disposition or use default
    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    a.download = filenameMatch?.[1] || `report.${format}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// Formatting helpers
// ============================================================================

export function formatCurrency(cents: number, currency: string = 'CAD'): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(dollars);
}

export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

export function formatReportDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
