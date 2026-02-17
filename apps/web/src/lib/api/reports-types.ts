/**
 * Shared type definitions for reports.
 * Used by both server and client code.
 */

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
    netIncome: number; // cents (from P&L, top-level field)
    operating: {
        items: ReportLineItem[];
        total: number; // cents
    };
    investing: {
        items: ReportLineItem[];
        total: number; // cents
    };
    financing: {
        items: ReportLineItem[];
        total: number; // cents
    };
    netCashChange: number; // cents
    openingCash: number; // cents
    closingCash: number; // cents
    isReconciled: boolean; // openingCash + netCashChange === closingCash
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
// Formatting helpers (universal — work in both server and client)
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
