/**
 * Financial Report Type Definitions
 *
 * Shared across API and Web packages to eliminate duplication.
 * All monetary values are stored as integer cents (e.g., 1050 = $10.50).
 *
 * DRY-1: Centralized report types (previously duplicated in apps/web and apps/api)
 */

// ============================================================================
// Common Report Types
// ============================================================================

/**
 * Report line item (for hierarchical reports like P&L, Balance Sheet)
 */
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
    entityId?: string;
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
    entityId?: string;
    entityName: string;
    currency: string;
    asOfDate: string;
    comparisonDate?: string;
    assets: {
        items: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    liabilities: {
        items: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    equity: {
        items: ReportLineItem[];
        total: number; // cents
        previousTotal?: number;
    };
    retainedEarnings: {
        priorYears: number; // cents
        currentYear: number; // cents
        total: number; // cents
    };
    isBalanced: boolean;
    totalAssets: number; // cents
    totalLiabilitiesAndEquity: number; // cents
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
    entityId?: string;
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
    entityId?: string;
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
    date: Date | string;
    entryNumber: number | string;
    memo: string | null;
    debitAmount: number; // cents
    creditAmount: number; // cents
    runningBalance: number; // cents
}

export interface GLLedgerReport {
    entityId?: string;
    glAccountId?: string;
    accountCode: string;
    accountName: string;
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    entries: GLLedgerEntry[];
    nextCursor?: string | null;
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
    entityId?: string;
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
    entityId?: string;
    entityName: string;
    currency: string;
    startDate: string;
    endDate: string;
    clients: RevenueClient[];
    totalRevenue: number; // cents
}

// ============================================================================
// Formatting Helpers (universal — work in both server and client)
// ============================================================================
// Note: formatCurrency moved to apps/web/src/lib/utils/currency.ts (canonical location)

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
