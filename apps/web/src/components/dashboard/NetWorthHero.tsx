'use client';

import { useUser } from '@clerk/nextjs';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Clock } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';
import { formatCurrency } from '@/lib/utils/currency';

interface NetWorthHeroProps {
    netWorth: number; // Total net worth in cents
    baseCurrency: string;
    cash: number; // Cash position in cents
    debt: number; // Total debt in cents
    runway?: string; // e.g. "8.2mo"
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
    runway,
    trend,
}: NetWorthHeroProps) {
    const { user } = useUser();
    const firstName = user?.firstName || '';

    const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend?.direction === 'up' ? 'text-ak-green' : 'text-ak-red';

    return (
        <GlowCard
            variant="glass"
            className="p-5 md:p-7 bg-gradient-to-br from-primary/[0.08] to-ak-purple/[0.05] border-primary/15"
        >
            {/* Greeting + Date inside hero */}
            <div className="flex items-end justify-between mb-4">
                <h1 className="text-xl md:text-2xl font-heading font-normal tracking-tight leading-none">
                    {getGreeting()}{firstName && `, ${firstName}`}
                </h1>
                <span className="text-xs md:text-sm font-sans font-normal text-muted-foreground leading-none">
                    {formatToday()}
                </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Net Worth
                    </p>
                    <p className="text-3xl md:text-4xl font-mono font-semibold tracking-tight">
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

            {/* Cash / Debt / Runway breakdown */}
            <div className={`grid gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-ak-border ${runway ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="glass-2 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <DollarSign className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ak-green" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                            Cash
                        </span>
                    </div>
                    <p className="text-sm sm:text-lg font-mono font-semibold text-ak-green">
                        {formatCurrency(cash, baseCurrency)}
                    </p>
                </div>

                <div className="glass-2 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <CreditCard className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ak-red" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                            Debt
                        </span>
                    </div>
                    <p className="text-sm sm:text-lg font-mono font-semibold text-ak-red">
                        {formatCurrency(debt, baseCurrency)}
                    </p>
                </div>

                {runway && (
                    <div className="glass-2 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-ak-teal" />
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                                Runway
                            </span>
                        </div>
                        <p className="text-sm sm:text-lg font-mono font-semibold text-ak-teal">
                            {runway}
                        </p>
                    </div>
                )}
            </div>
        </GlowCard>
    );
}
