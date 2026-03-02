'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { getProfitLossSummary } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { ProfitLossReport } from '@akount/types/financial';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetTitle, WidgetLoadingSkeleton, WidgetErrorState, WidgetEmptyState } from './WidgetPrimitives';

interface ProfitLossSummaryWidgetProps {
    entityId?: string;
}

export function ProfitLossSummaryWidget({ entityId }: ProfitLossSummaryWidgetProps) {
    const { data, loading, error } = useWidgetData<ProfitLossReport>(
        () => {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            const endDate = now.toISOString();
            return getProfitLossSummary(entityId, startDate, endDate);
        },
        [entityId]
    );

    if (loading) return <WidgetLoadingSkeleton title="P&L Summary" />;
    if (error) return <WidgetErrorState icon={BarChart3} title="P&L Summary" message="Failed to load P&L data" />;
    if (!data || (data.revenue.total === 0 && data.expenses.total === 0)) {
        return <WidgetEmptyState icon={BarChart3} title="P&L Summary" message="No P&L data for this period" />;
    }

    const { revenue, expenses, netIncome } = data;
    const maxAmount = Math.max(revenue.total, expenses.total, 1);
    const revenueWidth = (revenue.total / maxAmount) * 100;
    const expenseWidth = (expenses.total / maxAmount) * 100;
    const isPositive = netIncome >= 0;
    const NetIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    P&L Summary
                </p>
                <Link
                    href="/accounting/reports"
                    className="inline-flex items-center gap-0.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                >
                    View report
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            <div className="space-y-3">
                {/* Revenue bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-micro text-muted-foreground">Revenue</span>
                        <span className="text-xs font-mono tabular-nums text-ak-green">
                            {formatCurrency(revenue.total, data.currency)}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ak-green-dim overflow-hidden">
                        <div
                            className="h-full rounded-full bg-ak-green/60 transition-all duration-500"
                            style={{ width: `${revenueWidth}%` }}
                        />
                    </div>
                </div>

                {/* Expense bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-micro text-muted-foreground">Expenses</span>
                        <span className="text-xs font-mono tabular-nums text-ak-red">
                            {formatCurrency(expenses.total, data.currency)}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ak-red-dim overflow-hidden">
                        <div
                            className="h-full rounded-full bg-ak-red/60 transition-all duration-500"
                            style={{ width: `${expenseWidth}%` }}
                        />
                    </div>
                </div>

                {/* Net Income */}
                <div className="pt-2 mt-1 border-t border-ak-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <NetIcon className={`h-3.5 w-3.5 ${isPositive ? 'text-ak-green' : 'text-ak-red'}`} />
                            <span className="text-micro text-muted-foreground">Net Income</span>
                        </div>
                        <span className={`text-sm font-mono tabular-nums font-medium ${isPositive ? 'text-ak-green' : 'text-ak-red'}`}>
                            {formatCurrency(Math.abs(netIncome), data.currency)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
