'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCashFlowProjection, type CashFlowProjectionPoint } from '@/lib/api/dashboard';

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
    const [cashFlowData, setCashFlowData] = useState<CashFlowProjectionPoint[] | undefined>();

    useEffect(() => {
        // Fetch cash flow projection data
        getCashFlowProjection()
            .then((response) => setCashFlowData(response.data))
            .catch((error) => {
                console.error('Failed to fetch cash flow projection:', error);
                setCashFlowData(undefined);
            });
    }, []);

    return (
        <>
            <CashFlowChart data={cashFlowData} />
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
