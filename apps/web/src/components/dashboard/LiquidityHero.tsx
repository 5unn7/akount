'use client';

import { useUser } from '@clerk/nextjs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';
import { formatCurrency } from '@/lib/utils/currency';

interface CurrencyBreakdown {
    currency: string;
    percentage: number;
}

interface LiquidityHeroProps {
    totalBalance: number;
    baseCurrency: string;
    trend?: {
        direction: 'up' | 'down';
        percentage: string;
        netChange: string;
    };
    currencyBreakdown?: CurrencyBreakdown[];
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

export function LiquidityHero({
    totalBalance,
    baseCurrency,
    trend,
    currencyBreakdown,
}: LiquidityHeroProps) {
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

            {/* Liquidity Card */}
            <GlowCard variant="glass" className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                            Total Liquidity
                        </p>
                        <p className="text-4xl font-mono font-semibold tracking-tight">
                            {formatCurrency(totalBalance, baseCurrency)}
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

                {/* Currency breakdown pills */}
                {currencyBreakdown && currencyBreakdown.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-ak-border">
                        {currencyBreakdown.map((cb) => (
                            <span
                                key={cb.currency}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-2 text-xs"
                            >
                                <span className="font-mono font-medium">{cb.currency}</span>
                                <span className="text-muted-foreground">{cb.percentage}%</span>
                            </span>
                        ))}
                    </div>
                )}
            </GlowCard>
        </div>
    );
}
