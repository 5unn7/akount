'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PieChart } from 'lucide-react';
import { getBudgetVariances } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { BudgetVariance } from '@/lib/api/planning';

interface BudgetVsActualWidgetProps {
    entityId?: string;
}

export function BudgetVsActualWidget({ entityId }: BudgetVsActualWidgetProps) {
    const [variances, setVariances] = useState<BudgetVariance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!entityId) {
            setLoading(false);
            return;
        }

        getBudgetVariances(entityId)
            .then((result) => {
                // Sort by utilization (highest first), take top 5
                const sorted = result.variances
                    .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
                    .slice(0, 5);
                setVariances(sorted);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [entityId]);

    // Loading state
    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Budget vs Actual
                    </p>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-3 w-28 bg-muted/30 animate-pulse rounded" />
                            <div className="h-2 w-full bg-muted/20 animate-pulse rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Budget vs Actual
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <PieChart className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">Failed to load budget data</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (variances.length === 0) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Budget vs Actual
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <PieChart className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No budgets set up</p>
                </div>
            </div>
        );
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

                    let barColor: string;
                    let barBg: string;
                    let textColor: string;
                    if (isOver || isOverBudget) {
                        barColor = 'bg-ak-red/60';
                        barBg = 'bg-ak-red-dim';
                        textColor = 'text-ak-red';
                    } else if (isWarning) {
                        barColor = 'bg-primary/60';
                        barBg = 'bg-ak-pri-dim';
                        textColor = 'text-primary';
                    } else {
                        barColor = 'bg-ak-green/60';
                        barBg = 'bg-ak-green-dim';
                        textColor = 'text-ak-green';
                    }

                    // Cap visual bar at 100%
                    const barWidth = Math.min(v.utilizationPercent, 100);

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
                            <div className={`h-1.5 w-full rounded-full ${barBg} overflow-hidden`}>
                                <div
                                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
