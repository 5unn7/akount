'use client';

import Link from 'next/link';
import { ArrowRight, PieChart } from 'lucide-react';
import { getBudgetVariances } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { BudgetVariance } from '@/lib/api/planning';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetLoadingSkeleton, WidgetErrorState, WidgetEmptyState, ProgressBar } from './WidgetPrimitives';

interface BudgetVsActualWidgetProps {
    entityId?: string;
}

export function BudgetVsActualWidget({ entityId }: BudgetVsActualWidgetProps) {
    const { data, loading, error } = useWidgetData<{ variances: BudgetVariance[] }>(
        () => {
            if (!entityId) return Promise.resolve({ variances: [] });
            return getBudgetVariances(entityId);
        },
        [entityId]
    );

    const variances = data?.variances
        .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
        .slice(0, 5) || [];

    if (loading) return <WidgetLoadingSkeleton title="Budget vs Actual" />;
    if (error) return <WidgetErrorState icon={PieChart} title="Budget vs Actual" message="Failed to load budget data" />;
    if (variances.length === 0) {
        return <WidgetEmptyState icon={PieChart} title="Budget vs Actual" message="No budgets set up" />;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Budget vs Actual
                </p>
                <Link
                    href="/planning/budgets"
                    className="inline-flex items-center gap-0.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            <div className="space-y-3">
                {variances.map((v) => {
                    const isOverBudget = v.utilizationPercent > 100;
                    const isWarning = v.alertLevel === 'warning';
                    const isOver = v.alertLevel === 'over-budget';

                    const variant = (isOver || isOverBudget) ? 'danger' : isWarning ? 'warning' : 'success';
                    const textColor = (isOver || isOverBudget) ? 'text-ak-red' : isWarning ? 'text-primary' : 'text-ak-green';

                    return (
                        <div key={v.budgetId} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs truncate max-w-[55%]">{v.budgetName}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-micro font-mono text-muted-foreground">
                                        {formatCurrency(v.actualAmount)} / {formatCurrency(v.budgetedAmount)}
                                    </span>
                                    <span className={`text-micro font-mono font-medium ${textColor}`}>
                                        {v.utilizationPercent.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <ProgressBar percent={v.utilizationPercent} variant={variant} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
