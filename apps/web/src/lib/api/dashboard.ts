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

    const endpoint = `/api/dashboard/metrics?${params.toString()}`;

    return apiClient<DashboardMetrics>(endpoint);
}
