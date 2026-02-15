'use client';

import dynamic from 'next/dynamic';

// Client-side only chart loading (avoids SSR chart rendering issues)
const CashFlowChart = dynamic(
    () => import('./CashFlowChart').then((m) => m.CashFlowChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

const ExpenseChart = dynamic(
    () => import('./ExpenseChart').then((m) => m.ExpenseChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

export function DashboardCharts() {
    return (
        <>
            <CashFlowChart />
            <ExpenseChart />
        </>
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
