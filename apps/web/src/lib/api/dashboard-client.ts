import { apiFetch } from './client-browser';

/**
 * Cash flow projection data point
 */
export interface CashFlowProjectionPoint {
    date: string;
    value: number;
}

/**
 * Cash flow projection response from API
 */
export interface CashFlowProjectionData {
    data: CashFlowProjectionPoint[];
}

/**
 * Fetch 60-day cash flow projection from the API
 *
 * NOTE: This is a CLIENT-ONLY function using apiFetch (browser client).
 * Called from client component (DashboardCharts).
 *
 * @param entityId - Optional entity ID filter
 * @param currency - Optional currency (defaults to CAD)
 * @returns Array of data points for cash flow chart
 */
export async function getCashFlowProjection(
    entityId?: string,
    currency: string = 'CAD'
): Promise<CashFlowProjectionData> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('currency', currency);

    const endpoint = `/api/overview/cash-flow-projection?${params.toString()}`;

    return apiFetch<CashFlowProjectionData>(endpoint);
}
