import type { Metadata } from "next";
import { EntitiesSection } from "@/components/dashboard/EntitiesSection";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { SparkCards } from "@/components/dashboard/SparkCards";
import { DashboardLeftRail } from "@/components/dashboard/DashboardLeftRail";
import { DashboardRightRail } from "@/components/dashboard/DashboardRightRail";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { OnboardingHeroCard } from "@/components/onboarding/OnboardingHeroCard";
import { listEntities } from "@/lib/api/entities";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { getPerformanceMetrics } from "@/lib/api/performance";
import { listTransactions } from "@/lib/api/transactions";
import { Building2 } from "lucide-react";

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
    let recentTransactions: Awaited<ReturnType<typeof listTransactions>> = { transactions: [], hasMore: false };

    try {
        const [entitiesResult, metricsResult, performanceResult, transactionsResult] = await Promise.allSettled([
            listEntities(),
            getDashboardMetrics(entityId, currency),
            getPerformanceMetrics(entityId, currency),
            listTransactions({ limit: 10 }), // Fetch 10 most recent transactions
        ]);

        if (entitiesResult.status === 'fulfilled') entities = entitiesResult.value;
        if (metricsResult.status === 'fulfilled') metrics = metricsResult.value;
        if (performanceResult.status === 'fulfilled') performance = performanceResult.value;
        if (transactionsResult.status === 'fulfilled') recentTransactions = transactionsResult.value;
    } catch {
        // Continue with defaults
    }

    // Derive net worth data from API metrics
    const netWorthAmount = metrics?.netWorth.amount ?? 0;
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

    // Calculate derived metrics for left rail
    const cash = metrics?.cashPosition.cash ?? 0;
    const debt = metrics?.cashPosition.debt ?? 0;
    const workingCapital = cash - debt;

    // Monthly burn rate from expenses (convert to monthly if needed)
    const monthlyBurn = performance?.expenses.current ?? 0;

    // Runway in months (cash / monthly burn)
    const runwayMonths = monthlyBurn > 0 ? Math.floor((cash / monthlyBurn) * 100) / 100 : 0;
    const runwayValue = runwayMonths > 0 ? `${runwayMonths.toFixed(1)}mo` : '—';

    // Cash burn uses expenses data inverted (higher burn = worse)
    const cashBurnTrend = performance ? formatTrend(-performance.expenses.percentChange) : undefined;

    // Prepare left rail stats from performance + metrics data (10 stats total)
    const leftRailStats = [
        {
            label: 'Revenue',
            value: performance ? formatCurrency(performance.revenue.current) : '—',
            trend: performance ? formatTrend(performance.revenue.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.revenue.sparkline) : [],
            color: 'green' as const,
        },
        {
            label: 'Expenses',
            value: performance ? formatCurrency(performance.expenses.current) : '—',
            trend: performance ? formatTrend(-performance.expenses.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red' as const,
        },
        {
            label: 'Profit',
            value: performance ? formatCurrency(performance.profit.current) : '—',
            trend: performance ? formatTrend(performance.profit.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.profit.sparkline) : [],
            color: 'primary' as const,
        },
        {
            label: 'Accounts Receivable',
            value: performance ? formatCurrency(performance.receivables.outstanding) : '—',
            trend: performance?.receivables.sparkline.length > 0 ? { direction: 'flat' as const, text: `${formatCurrency(performance.receivables.overdue)} overdue` } : undefined,
            sparkline: performance ? convertSparkline(performance.receivables.sparkline) : [],
            color: 'blue' as const,
        },
        {
            label: 'Accounts Payable',
            value: '—',
            trend: { direction: 'flat' as const, text: 'Coming soon' },
            sparkline: [],
            color: 'purple' as const,
        },
        {
            label: 'Runway',
            value: runwayValue,
            trend: runwayMonths > 0 ? {
                direction: runwayMonths >= 6 ? ('up' as const) : runwayMonths >= 3 ? ('flat' as const) : ('down' as const),
                text: runwayMonths >= 6 ? 'Healthy' : runwayMonths >= 3 ? 'Monitor' : 'Critical'
            } : undefined,
            sparkline: [],
            color: runwayMonths >= 6 ? ('green' as const) : runwayMonths >= 3 ? ('primary' as const) : ('red' as const),
        },
        {
            label: 'Cash Burn',
            value: performance ? formatCurrency(performance.expenses.current) : '—',
            trend: cashBurnTrend,
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red' as const,
        },
    ];

    return (
        <div className="flex gap-6">
            {/* Left Rail - Quick Stats */}
            <DashboardLeftRail stats={leftRailStats} />

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* Net Worth Hero */}
                <div className="fi fi1">
                    <NetWorthHero
                        netWorth={netWorthAmount}
                        baseCurrency={baseCurrency}
                        cash={cash}
                        debt={debt}
                        trend={undefined}
                    />
                </div>

                {/* Onboarding hero — conditional */}
                <OnboardingHeroCard />

                {/* Performance Sparklines (show on mobile/tablet when left rail is hidden) */}
                <div className="fi fi2 space-y-3 lg:hidden">
                    <SectionHeader title="Performance" />
                    <SparkCards cards={sparkCards} />
                </div>

                {/* Entity Matrix */}
                <div className="fi fi3">
                    {entities.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="Set up your first entity"
                            description="Create a business entity to track finances, manage accounts, and separate operations across countries and currencies."
                            action={{
                                label: "Create Entity",
                                href: "/settings/entities",
                                variant: "default"
                            }}
                            secondaryAction={{
                                label: "Learn more",
                                href: "/docs/entities"
                            }}
                            variant="compact"
                        />
                    ) : (
                        <EntitiesSection entities={entities} />
                    )}
                </div>

                {/* Charts */}
                <div className="fi fi4">
                    <DashboardCharts />
                </div>

                {/* Recent Transactions */}
                <div className="fi fi5">
                    <RecentTransactions transactions={recentTransactions.transactions} />
                </div>

                {/* Mobile: Show right rail widgets below main content */}
                <div className="xl:hidden fi fi6">
                    <DashboardRightRail className="block w-full" />
                </div>
            </div>

            {/* Right Rail - AI Brief & Actions */}
            <DashboardRightRail />
        </div>
    );
}
