import { apiClient } from './client';

/**
 * Dashboard metrics response from API
 */
export interface DashboardMetrics {
    netWorth: {
        amount: number; // cents
        currency: string;
    };
    cashPosition: {
        cash: number; // cents
        debt: number; // cents
        net: number; // cents
        currency: string;
    };
    accounts: {
        total: number;
        active: number;
        byType: {
            BANK?: number;
            CREDIT_CARD?: number;
            INVESTMENT?: number;
            LOAN?: number;
            MORTGAGE?: number;
            OTHER?: number;
        };
    };
    receivables?: {
        outstanding: number; // cents
        overdue: number; // cents
    };
    payables?: {
        outstanding: number; // cents
        overdue: number; // cents
    };
}

/**
 * Fetch dashboard metrics from the API
 *
 * @param entityId - Optional entity ID filter
 * @param currency - Optional currency (defaults to CAD)
 * @returns Dashboard metrics including net worth, cash position, and account counts
 */
export async function getDashboardMetrics(
    entityId?: string,
    currency: string = 'CAD'
): Promise<DashboardMetrics> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('currency', currency);

    const endpoint = `/api/overview/dashboard?${params.toString()}`;

    return apiClient<DashboardMetrics>(endpoint);
}

/**
 * Fetch the user's onboarding intents for dashboard personalization.
 * Returns empty array if no intents were set.
 */
export async function getIntents(): Promise<string[]> {
    try {
        const result = await apiClient<{ intents: string[] }>('/api/system/onboarding/intents');
        return result.intents;
    } catch {
        return [];
    }
}

/**
 * Net worth response from API
 */
export interface NetWorthData {
    netWorth: {
        amount: number; // cents
        currency: string;
    };
    breakdown: {
        assets: number; // cents
        liabilities: number; // cents
    };
}

/**
 * Fetch net worth data from the API
 *
 * @param entityId - Optional entity ID filter
 * @param currency - Optional currency (defaults to CAD)
 * @returns Net worth with asset/liability breakdown
 */
export async function getNetWorth(
    entityId?: string,
    currency: string = 'CAD'
): Promise<NetWorthData> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('currency', currency);

    const endpoint = `/api/overview/net-worth?${params.toString()}`;

    return apiClient<NetWorthData>(endpoint);
}

/**
 * Cash flow response from API
 */
export interface CashFlowData {
    cashPosition: {
        cash: number; // cents
        debt: number; // cents
        net: number; // cents
        currency: string;
    };
    accounts: {
        total: number;
        active: number;
        byType: {
            BANK?: number;
            CREDIT_CARD?: number;
            INVESTMENT?: number;
            LOAN?: number;
            MORTGAGE?: number;
            OTHER?: number;
        };
    };
}

/**
 * Fetch cash flow data from the API
 *
 * @param entityId - Optional entity ID filter
 * @param currency - Optional currency (defaults to CAD)
 * @returns Cash position and account breakdown
 */
export async function getCashFlow(
    entityId?: string,
    currency: string = 'CAD'
): Promise<CashFlowData> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('currency', currency);

    const endpoint = `/api/overview/cash-flow?${params.toString()}`;

    return apiClient<CashFlowData>(endpoint);
}
