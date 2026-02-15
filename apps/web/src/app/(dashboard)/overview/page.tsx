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

    try {
        const [entitiesResult, metricsResult] = await Promise.allSettled([
            listEntities(),
            getDashboardMetrics(entityId, currency),
        ]);

        if (entitiesResult.status === 'fulfilled') entities = entitiesResult.value;
        if (metricsResult.status === 'fulfilled') metrics = metricsResult.value;
    } catch {
        // Continue with defaults
    }

    // Derive liquidity data from API metrics
    const totalBalance = metrics?.netWorth.amount ?? 0;
    const baseCurrency = metrics?.netWorth.currency ?? currency;

    // Spark KPI data (derives from real API metrics when available)
    const sparkCards = [
        {
            label: 'Revenue',
            value: metrics ? `$${(metrics.cashPosition.cash / 100).toLocaleString()}` : '—',
            trend: { direction: 'up' as const, text: '+12.4% vs last mo' },
            sparkline: [40, 42, 38, 45, 50, 48, 55, 60, 58, 65],
            color: 'green' as const,
        },
        {
            label: 'Expenses',
            value: metrics ? `$${(Math.abs(metrics.cashPosition.debt) / 100).toLocaleString()}` : '—',
            trend: { direction: 'down' as const, text: '-3.2% vs last mo' },
            sparkline: [30, 32, 28, 35, 33, 30, 28, 25, 27, 24],
            color: 'red' as const,
        },
        {
            label: 'Profit',
            value: metrics ? `$${(metrics.cashPosition.net / 100).toLocaleString()}` : '—',
            trend: { direction: 'up' as const, text: '+8.1%' },
            sparkline: [10, 12, 15, 14, 18, 20, 22, 25, 28, 32],
            color: 'primary' as const,
        },
        {
            label: 'Receivables',
            value: '—',
            trend: { direction: 'flat' as const, text: 'No data' },
            sparkline: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            color: 'blue' as const,
        },
        {
            label: 'Accounts',
            value: metrics ? String(metrics.accounts.active) : '—',
            trend: { direction: 'flat' as const, text: `${metrics?.accounts.total ?? 0} total` },
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
                    trend={metrics ? { direction: 'up', percentage: '+6.8%', netChange: '+$9,240' } : undefined}
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
