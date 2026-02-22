/**
 * Dashboard Data Transformers
 *
 * Pure functions that transform API metrics into display-ready StatCardData.
 * Extracted from overview/page.tsx (DRY-7) for reusability and testability.
 */

import type { SparkColor, StatCardData, TrendData } from './constants';

/**
 * Convert a percent change to a display-ready trend object.
 */
export function formatTrend(percentChange: number): TrendData {
    if (percentChange === 0) return { direction: 'flat', text: 'No change' };
    const direction = percentChange > 0 ? 'up' : 'down';
    const sign = percentChange > 0 ? '+' : '';
    return { direction, text: `${sign}${percentChange.toFixed(1)}% vs last mo` };
}

/**
 * Format integer cents as a compact currency string (no decimals).
 * Returns em-dash for zero values.
 */
export function formatCurrencyValue(cents: number): string {
    if (cents === 0) return '—';
    const dollars = cents / 100;
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Convert an array of integer cents to dollar values for sparkline display.
 */
export function convertSparkline(centsArray: number[]): number[] {
    return centsArray.map(c => c / 100);
}

interface DashboardMetrics {
    netWorth: { amount: number; currency: string };
    cashPosition: { cash: number; debt: number };
    accounts: { total: number };
    payables?: { outstanding: number; overdue: number };
}

interface PerformanceMetrics {
    revenue: { current: number; percentChange: number; sparkline: number[] };
    expenses: { current: number; percentChange: number; sparkline: number[] };
    profit: { current: number; percentChange: number; sparkline: number[] };
    receivables: { outstanding: number; overdue: number; sparkline: number[] };
}

/**
 * Build the 7 quick-stat cards from API metrics.
 */
export function buildQuickStats(
    metrics: DashboardMetrics | null,
    performance: PerformanceMetrics | null,
): StatCardData[] {
    const cash = metrics?.cashPosition.cash ?? 0;
    const monthlyBurn = performance?.expenses.current ?? 0;
    const runwayMonths = monthlyBurn > 0 ? Math.floor((cash / monthlyBurn) * 100) / 100 : 0;
    const runwayValue = runwayMonths > 0 ? `${runwayMonths.toFixed(1)}mo` : undefined;
    const cashBurnTrend = performance ? formatTrend(-performance.expenses.percentChange) : undefined;

    const runwayColor: SparkColor = runwayMonths >= 6 ? 'teal' : runwayMonths >= 3 ? 'primary' : 'red';

    return [
        {
            label: 'Revenue',
            value: performance ? formatCurrencyValue(performance.revenue.current) : '—',
            trend: performance ? formatTrend(performance.revenue.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.revenue.sparkline) : [],
            color: 'green',
            href: '/accounting/reports/revenue',
        },
        {
            label: 'Expenses',
            value: performance ? formatCurrencyValue(performance.expenses.current) : '—',
            trend: performance ? formatTrend(-performance.expenses.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red',
            href: '/accounting/reports/spending',
        },
        {
            label: 'Profit',
            value: performance ? formatCurrencyValue(performance.profit.current) : '—',
            trend: performance ? formatTrend(performance.profit.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.profit.sparkline) : [],
            color: 'primary',
            href: '/accounting/reports/profit-loss',
        },
        {
            label: 'Receivables',
            value: performance ? formatCurrencyValue(performance.receivables.outstanding) : '—',
            trend: (performance?.receivables.sparkline.length ?? 0) > 0
                ? { direction: 'flat' as const, text: `${formatCurrencyValue(performance!.receivables.overdue)} overdue` }
                : undefined,
            sparkline: performance ? convertSparkline(performance.receivables.sparkline) : [],
            color: 'blue',
            href: '/invoicing/invoices?status=outstanding',
        },
        {
            label: 'Payables',
            value: metrics?.payables ? formatCurrencyValue(metrics.payables.outstanding) : '—',
            trend: metrics?.payables?.overdue ? { direction: 'flat' as const, text: `${formatCurrencyValue(metrics.payables.overdue)} overdue` } : undefined,
            sparkline: [],
            color: 'purple',
            href: '/vendors/bills?status=outstanding',
        },
        {
            label: 'Runway',
            value: runwayValue ?? '—',
            trend: runwayMonths > 0 ? {
                direction: runwayMonths >= 6 ? 'up' as const : runwayMonths >= 3 ? 'flat' as const : 'down' as const,
                text: runwayMonths >= 6 ? 'Healthy' : runwayMonths >= 3 ? 'Monitor' : 'Critical',
            } : undefined,
            sparkline: [],
            color: runwayColor,
            href: '/overview/cash-flow',
        },
        {
            label: 'Cash Burn',
            value: performance ? formatCurrencyValue(performance.expenses.current) : '—',
            trend: cashBurnTrend,
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red',
            href: '/overview/cash-flow',
        },
    ];
}

/**
 * Reorder stats based on user's dashboard config.
 */
export function orderStats(stats: StatCardData[], statOrder: string[]): StatCardData[] {
    if (statOrder.length === 0) return stats;
    return statOrder
        .map(label => stats.find(s => s.label === label))
        .filter((s): s is StatCardData => s !== undefined);
}
