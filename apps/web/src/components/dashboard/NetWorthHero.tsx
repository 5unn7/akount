'use client';

import { useUser } from '@clerk/nextjs';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';
import { formatCurrency } from '@/lib/utils/currency';

interface NetWorthHeroProps {
    netWorth: number; // Total net worth in cents
    baseCurrency: string;
    cash: number; // Cash position in cents
    debt: number; // Total debt in cents
    trend?: {
        direction: 'up' | 'down';
        percentage: string;
        netChange: string;
    };
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function formatToday(): string {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date());
}

export function NetWorthHero({
    netWorth,
    baseCurrency,
    cash,
    debt,
    trend,
}: NetWorthHeroProps) {
    const { user } = useUser();
    const firstName = user?.firstName || 'there';

    const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend?.direction === 'up' ? 'text-ak-green' : 'text-ak-red';

    return (
        <div className="space-y-1.5">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-heading font-normal tracking-tight">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="text-sm text-muted-foreground">{formatToday()}</p>
            </div>

            {/* Net Worth Card */}
            <GlowCard variant="glass" className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                            Net Worth
                        </p>
                        <p className="text-4xl font-mono font-semibold tracking-tight">
                            {formatCurrency(netWorth, baseCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                            {baseCurrency} equivalent
                        </p>
                    </div>

                    {trend && (
                        <div className="flex items-center gap-2">
                            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                            <span className={`text-sm font-mono font-medium ${trendColor}`}>
                                {trend.percentage}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                                {trend.netChange}
                            </span>
                        </div>
                    )}
                </div>

                {/* Cash vs Debt breakdown */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-ak-border">
                    <div className="glass-2 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-3.5 w-3.5 text-ak-green" />
                            <span className="text-[9px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                                Cash
                            </span>
                        </div>
                        <p className="text-lg font-mono font-semibold text-ak-green">
                            {formatCurrency(cash, baseCurrency)}
                        </p>
                    </div>

                    <div className="glass-2 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-3.5 w-3.5 text-ak-red" />
                            <span className="text-[9px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                                Debt
                            </span>
                        </div>
                        <p className="text-lg font-mono font-semibold text-ak-red">
                            {formatCurrency(debt, baseCurrency)}
                        </p>
                    </div>
                </div>
            </GlowCard>
        </div>
    );
}
