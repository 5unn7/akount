'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getCashRunwayData } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { CashRunwayResult } from '@/lib/api/planning';

interface ExpenseForecastWidgetProps {
    entityId?: string;
}

export function ExpenseForecastWidget({ entityId }: ExpenseForecastWidgetProps) {
    const [data, setData] = useState<CashRunwayResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!entityId) {
            setLoading(false);
            return;
        }

        getCashRunwayData(entityId)
            .then((result) => {
                setData(result);
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
                        Expense Forecast
                    </p>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="h-2.5 w-20 bg-muted/30 animate-pulse rounded" />
                        <div className="h-6 w-28 bg-muted/20 animate-pulse rounded" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-2.5 w-16 bg-muted/30 animate-pulse rounded" />
                        <div className="h-6 w-24 bg-muted/20 animate-pulse rounded" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Expense Forecast
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Wallet className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">Failed to load forecast data</p>
                </div>
            </div>
        );
    }

    // Empty/no data state
    if (!data) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Expense Forecast
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Wallet className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No expense data available</p>
                </div>
            </div>
        );
    }

    // Net position: positive means revenue > expenses (good)
    const isNetPositive = data.netBurnRate <= 0;
    const TrendIcon = isNetPositive ? TrendingUp : TrendingDown;

    // Runway health
    let runwayColor: string;
    let runwayLabel: string;
    if (data.runwayMonths < 0 || data.runwayMonths > 12) {
        runwayColor = 'text-ak-green';
        runwayLabel = 'Healthy';
    } else if (data.runwayMonths >= 6) {
        runwayColor = 'text-primary';
        runwayLabel = 'Monitor';
    } else {
        runwayColor = 'text-ak-red';
        runwayLabel = 'Critical';
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Expense Forecast
                </p>
                <Link
                    href="/planning/forecasts"
                    className="inline-flex items-center gap-0.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                >
                    View details
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            <div className="space-y-3">
                {/* Monthly Expenses */}
                <div className="space-y-0.5">
                    <span className="text-micro text-muted-foreground">Monthly Expenses</span>
                    <p className="text-lg font-mono tabular-nums text-ak-red">
                        {formatCurrency(data.monthlyBurnRate)}
                    </p>
                </div>

                {/* Monthly Revenue */}
                <div className="space-y-0.5">
                    <span className="text-micro text-muted-foreground">Monthly Revenue</span>
                    <p className="text-lg font-mono tabular-nums text-ak-green">
                        {formatCurrency(data.monthlyRevenue)}
                    </p>
                </div>

                {/* Net + Runway */}
                <div className="pt-2 mt-1 border-t border-ak-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <TrendIcon className={`h-3.5 w-3.5 ${isNetPositive ? 'text-ak-green' : 'text-ak-red'}`} />
                            <span className="text-micro text-muted-foreground">Net Monthly</span>
                        </div>
                        <span className={`text-sm font-mono tabular-nums font-medium ${isNetPositive ? 'text-ak-green' : 'text-ak-red'}`}>
                            {isNetPositive ? '+' : '-'}{formatCurrency(Math.abs(data.netBurnRate))}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-micro text-muted-foreground">Runway</span>
                        <span className={`text-micro font-mono font-medium ${runwayColor}`}>
                            {data.runwayMonths < 0 ? '\u221E' : `${data.runwayMonths.toFixed(1)}mo`}
                            <span className="text-muted-foreground ml-1">({runwayLabel})</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
