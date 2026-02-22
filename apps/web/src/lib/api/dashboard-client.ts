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

/**
 * Upcoming payment event
 */
export interface UpcomingPayment {
    id: string;
    type: 'BILL' | 'INVOICE';
    name: string;
    dueDate: string;
    amount: number;
    currency: string;
    status: string;
}

/**
 * Upcoming payments response from API
 */
export interface UpcomingPaymentsData {
    data: UpcomingPayment[];
}

/**
 * Fetch upcoming payments (bills due + expected invoice payments)
 *
 * NOTE: This is a CLIENT-ONLY function using apiFetch (browser client).
 * Called from client component (UpcomingPayments).
 *
 * @param entityId - Optional entity ID filter
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of upcoming payment events
 */
export async function getUpcomingPayments(
    entityId?: string,
    limit: number = 10
): Promise<UpcomingPaymentsData> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('limit', limit.toString());

    const endpoint = `/api/overview/upcoming-payments?${params.toString()}`;

    return apiFetch<UpcomingPaymentsData>(endpoint);
}

/**
 * Expense category in a month
 */
export interface ExpenseCategory {
    name: string;
    amount: number;
    color: string;
}

/**
 * Monthly expense breakdown
 */
export interface ExpenseMonth {
    label: string;
    categories: ExpenseCategory[];
}

/**
 * Expense breakdown response from API
 */
export interface ExpenseBreakdownData {
    data: ExpenseMonth[];
}

/**
 * Fetch expense breakdown by category
 *
 * NOTE: This is a CLIENT-ONLY function using apiFetch (browser client).
 * Called from client component (ExpenseChart).
 *
 * @param entityId - Optional entity ID filter
 * @param months - Number of months to include (default: 6)
 * @param currency - Optional currency (defaults to CAD)
 * @returns Array of monthly category breakdowns
 */
export async function getExpenseBreakdown(
    entityId?: string,
    months: number = 6,
    currency: string = 'CAD'
): Promise<ExpenseBreakdownData> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('months', months.toString());
    params.append('currency', currency);

    const endpoint = `/api/overview/expense-breakdown?${params.toString()}`;

    return apiFetch<ExpenseBreakdownData>(endpoint);
}

/**
 * Action item requiring user attention
 */
export interface ActionItem {
    id: string;
    type: 'UNRECONCILED_TXN' | 'OVERDUE_INVOICE' | 'OVERDUE_BILL';
    title: string;
    meta: string;
    urgencyScore: number;
    href: string;
}

/**
 * Action items response from API
 */
export interface ActionItemsData {
    data: ActionItem[];
}

/**
 * Fetch action items (unreconciled transactions, overdue invoices/bills)
 *
 * NOTE: This is a CLIENT-ONLY function using apiFetch (browser client).
 * Called from client component (ActionItems).
 *
 * @param entityId - Optional entity ID filter
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of actionable items sorted by urgency
 */
export async function getActionItems(
    entityId?: string,
    limit: number = 10
): Promise<ActionItemsData> {
    const params = new URLSearchParams();

    if (entityId) {
        params.append('entityId', entityId);
    }

    params.append('limit', limit.toString());

    const endpoint = `/api/overview/action-items?${params.toString()}`;

    return apiFetch<ActionItemsData>(endpoint);
}
