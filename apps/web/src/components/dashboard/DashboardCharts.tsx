'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCashFlowProjection, type CashFlowProjectionPoint } from '@/lib/api/dashboard-client';

// Client-side only chart loading (avoids SSR chart rendering issues)
const CashFlowChartInner = dynamic(
    () => import('./CashFlowChart').then((m) => m.CashFlowChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

const ExpenseChartInner = dynamic(
    () => import('./ExpenseChart').then((m) => m.ExpenseChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

/** Cash Flow chart with data fetching */
export function DashboardCashFlowChart() {
    const [cashFlowData, setCashFlowData] = useState<CashFlowProjectionPoint[] | undefined>();

    useEffect(() => {
        getCashFlowProjection()
            .then((response) => setCashFlowData(response.data))
            .catch(() => setCashFlowData(undefined));
    }, []);

    return <CashFlowChartInner data={cashFlowData} />;
}

/** Expense breakdown chart */
export function DashboardExpenseChart() {
    return <ExpenseChartInner />;
}

/** Combined charts — kept for backward compatibility */
export function DashboardCharts() {
    return (
        <div className="space-y-4">
            <DashboardCashFlowChart />
            <DashboardExpenseChart />
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="glass rounded-xl p-5">
            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-3" />
            <div className="h-[170px] bg-muted/30 animate-pulse rounded" />
        </div>
    );
}
