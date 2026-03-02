'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getCashRunwayData } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { CashRunwayResult } from '@/lib/api/planning';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetLoadingSkeleton, WidgetErrorState, WidgetEmptyState } from './WidgetPrimitives';

interface ExpenseForecastWidgetProps {
    entityId?: string;
}

export function ExpenseForecastWidget({ entityId }: ExpenseForecastWidgetProps) {
    const { data, loading, error } = useWidgetData<CashRunwayResult>(
        () => {
            if (!entityId) return Promise.resolve(null as unknown as CashRunwayResult);
            return getCashRunwayData(entityId);
        },
        [entityId]
    );

    if (loading) return <WidgetLoadingSkeleton title="Expense Forecast" items={2} itemHeight="h-6" />;
    if (error) return <WidgetErrorState icon={Wallet} title="Expense Forecast" message="Failed to load forecast data" />;
    if (!data) {
        return <WidgetEmptyState icon={Wallet} title="Expense Forecast" message="No expense data available" />;
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
