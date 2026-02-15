import { Suspense } from "react";
import type { Metadata } from "next";
import { EntitiesList } from "@/components/dashboard/EntitiesList";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { LiquidityHero } from "@/components/dashboard/LiquidityHero";
import { SparkCards } from "@/components/dashboard/SparkCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActionItems } from "@/components/dashboard/ActionItems";
import { AIBrief } from "@/components/dashboard/AIBrief";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TwoColumnLayout } from "@/components/shared/TwoColumnLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { OnboardingHeroCard } from "@/components/onboarding/OnboardingHeroCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { listEntities } from "@/lib/api/entities";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { getPerformanceMetrics } from "@/lib/api/performance";

export const metadata: Metadata = {
    title: "Overview | Akount",
    description: "View your financial overview, net worth, and account summaries",
};

interface OverviewPageProps {
    searchParams: Promise<{ entityId?: string; currency?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
    const params = await searchParams;
    const entityId = params.entityId;
    const currency = params.currency || 'CAD';

    // Parallel data fetch
    let entities: Awaited<ReturnType<typeof listEntities>> = [];
    let metrics: Awaited<ReturnType<typeof getDashboardMetrics>> | null = null;
    let performance: Awaited<ReturnType<typeof getPerformanceMetrics>> | null = null;

    try {
        const [entitiesResult, metricsResult, performanceResult] = await Promise.allSettled([
            listEntities(),
            getDashboardMetrics(entityId, currency),
            getPerformanceMetrics(entityId, currency),
        ]);

        if (entitiesResult.status === 'fulfilled') entities = entitiesResult.value;
        if (metricsResult.status === 'fulfilled') metrics = metricsResult.value;
        if (performanceResult.status === 'fulfilled') performance = performanceResult.value;
    } catch {
        // Continue with defaults
    }

    // Derive liquidity data from API metrics
    const totalBalance = metrics?.netWorth.amount ?? 0;
    const baseCurrency = metrics?.netWorth.currency ?? currency;

    // Spark KPI data from performance API (real transaction aggregates)
    const formatTrend = (percentChange: number): { direction: 'up' | 'down' | 'flat'; text: string } => {
        if (percentChange === 0) return { direction: 'flat', text: 'No change' };
        const direction = percentChange > 0 ? 'up' : 'down';
        const sign = percentChange > 0 ? '+' : '';
        return { direction, text: `${sign}${percentChange.toFixed(1)}% vs last mo` };
    };

    const formatCurrency = (cents: number) => {
        if (cents === 0) return '—';
        const dollars = cents / 100;
        return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Convert sparkline cents to dollars (for chart rendering)
    const convertSparkline = (centsArray: number[]) => centsArray.map(c => c / 100);

    const sparkCards = [
        {
            label: 'Revenue',
            value: performance ? formatCurrency(performance.revenue.current) : '—',
            trend: performance ? formatTrend(performance.revenue.percentChange) : { direction: 'flat' as const, text: 'No data' },
            sparkline: performance ? convertSparkline(performance.revenue.sparkline) : [],
            color: 'green' as const,
        },
        {
            label: 'Expenses',
            value: performance ? formatCurrency(performance.expenses.current) : '—',
            trend: performance ? formatTrend(-performance.expenses.percentChange) : { direction: 'flat' as const, text: 'No data' }, // Invert for expenses (lower is better)
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red' as const,
        },
        {
            label: 'Profit',
            value: performance ? formatCurrency(performance.profit.current) : '—',
            trend: performance ? formatTrend(performance.profit.percentChange) : { direction: 'flat' as const, text: 'No data' },
            sparkline: performance ? convertSparkline(performance.profit.sparkline) : [],
            color: 'primary' as const,
        },
        {
            label: 'Receivables',
            value: performance ? formatCurrency(performance.receivables.outstanding) : '—',
            trend: { direction: 'flat' as const, text: 'Coming soon' },
            sparkline: [],
            color: 'blue' as const,
        },
        {
            label: 'Accounts',
            value: performance ? String(performance.accounts.active) : '—',
            trend: { direction: 'flat' as const, text: `${performance?.accounts.total ?? 0} total` },
            sparkline: [],
            color: 'purple' as const,
        },
    ];

    return (
        <div className="flex-1 space-y-8">
            {/* Row 1: Greeting + Filters */}
            <div className="fi fi1 flex items-start justify-between gap-4">
                <LiquidityHero
                    totalBalance={totalBalance}
                    baseCurrency={baseCurrency}
                    trend={undefined}
                />
                <div className="hidden md:block shrink-0 pt-2">
                    <DashboardFilters entities={entities} />
                </div>
            </div>

            {/* Onboarding hero — conditional */}
            <OnboardingHeroCard />

            {/* Entity Matrix */}
            <div className="fi fi2 space-y-3">
                <SectionHeader
                    title="Liquidity Matrix"
                    meta={`${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`}
                />
                <EntitiesList entities={entities} />
            </div>

            {/* Spark KPIs */}
            <div className="fi fi3 space-y-3">
                <SectionHeader title="Performance" />
                <SparkCards cards={sparkCards} />
            </div>

            {/* Two Column: Charts + Right Sidebar */}
            <div className="fi fi4">
                <TwoColumnLayout>
                    {/* Left — Charts */}
                    <>
                        <DashboardCharts />

                        {/* Dashboard metrics cards — real data */}
                        <Suspense fallback={<DashboardMetricsSkeleton />}>
                            <DashboardMetrics entityId={entityId} currency={currency} />
                        </Suspense>
                    </>

                    {/* Right — Sidebar widgets */}
                    <>
                        <QuickActions />
                        <AIBrief />
                        <ActionItems />
                        <UpcomingPayments />
                        <QuickStats />
                    </>
                </TwoColumnLayout>
            </div>
        </div>
    );
}

function DashboardMetricsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-lg px-4 py-3.5">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-5 w-28 bg-muted animate-pulse rounded" />
                </div>
            ))}
        </div>
    );
}

function SparkCardsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass rounded-lg px-4 py-3.5">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-5 w-20 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
            ))}
        </div>
    );
}
