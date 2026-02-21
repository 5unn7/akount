import type { Metadata } from "next";
import Link from "next/link";
import { EntitiesSection } from "@/components/dashboard/EntitiesSection";
import { DashboardCashFlowChart, DashboardExpenseChart } from "@/components/dashboard/DashboardCharts";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { CommandCenterRightPanel } from "@/components/dashboard/CommandCenterRightPanel";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { EmptyState } from "@/components/shared/EmptyState";
import { OnboardingHeroCard } from "@/components/onboarding/OnboardingHeroCard";
import { GlowCard } from "@/components/ui/glow-card";
import { CardContent } from "@/components/ui/card";
import { listEntities } from "@/lib/api/entities";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { getPerformanceMetrics } from "@/lib/api/performance";
import { listTransactions } from "@/lib/api/transactions";
import { Building2, Landmark, Upload, PenLine } from "lucide-react";

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
            listTransactions({ limit: 10 }),
        ]);

        if (entitiesResult.status === 'fulfilled') entities = entitiesResult.value;
        if (metricsResult.status === 'fulfilled') metrics = metricsResult.value;
        if (performanceResult.status === 'fulfilled') performance = performanceResult.value;
        if (transactionsResult.status === 'fulfilled') recentTransactions = transactionsResult.value;
    } catch {
        // Continue with defaults
    }

    // First-run experience: no accounts and no transactions
    const totalAccounts = metrics?.accounts.total ?? 0;
    const hasTransactions = recentTransactions.transactions.length > 0;

    if (totalAccounts === 0 && !hasTransactions) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col items-center py-16 max-w-lg mx-auto text-center">
                    <div className="p-5 rounded-full bg-primary/10 mb-5">
                        <Landmark className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-heading font-normal mb-2">
                        Welcome to Akount
                    </h1>
                    <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                        Your financial command center starts here. Add an account to see your dashboard come alive.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                        <Link href="/banking/accounts?addAccount=connect">
                            <GlowCard variant="glass" className="cursor-pointer transition-all hover:border-primary/40 hover:-translate-y-px h-full">
                                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                                        <Landmark className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium">Connect Bank</p>
                                    <p className="text-[10px] text-muted-foreground">Securely link for automatic sync</p>
                                </CardContent>
                            </GlowCard>
                        </Link>
                        <Link href="/banking/imports">
                            <GlowCard variant="glass" className="cursor-pointer transition-all hover:border-primary/20 hover:-translate-y-px h-full">
                                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-ak-pri-dim text-ak-pri-text">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium">Import Statement</p>
                                    <p className="text-[10px] text-muted-foreground">Upload CSV or PDF</p>
                                </CardContent>
                            </GlowCard>
                        </Link>
                        <Link href="/banking/accounts?addAccount=manual">
                            <GlowCard variant="glass" className="cursor-pointer transition-all hover:border-ak-border-2 hover:-translate-y-px h-full">
                                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center glass-2 text-muted-foreground">
                                        <PenLine className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium">Add Manually</p>
                                    <p className="text-[10px] text-muted-foreground">Enter account details</p>
                                </CardContent>
                            </GlowCard>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Derive net worth data from API metrics
    const netWorthAmount = metrics?.netWorth.amount ?? 0;
    const baseCurrency = metrics?.netWorth.currency ?? currency;

    const formatTrend = (percentChange: number): { direction: 'up' | 'down' | 'flat'; text: string } => {
        if (percentChange === 0) return { direction: 'flat', text: 'No change' };
        const direction = percentChange > 0 ? 'up' : 'down';
        const sign = percentChange > 0 ? '+' : '';
        return { direction, text: `${sign}${percentChange.toFixed(1)}% vs last mo` };
    };

    const formatCurrencyValue = (cents: number) => {
        if (cents === 0) return '—';
        const dollars = cents / 100;
        return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const convertSparkline = (centsArray: number[]) => centsArray.map(c => c / 100);

    // Cash, debt, runway
    const cash = metrics?.cashPosition.cash ?? 0;
    const debt = metrics?.cashPosition.debt ?? 0;
    const monthlyBurn = performance?.expenses.current ?? 0;
    const runwayMonths = monthlyBurn > 0 ? Math.floor((cash / monthlyBurn) * 100) / 100 : 0;
    const runwayValue = runwayMonths > 0 ? `${runwayMonths.toFixed(1)}mo` : undefined;

    // Cash burn trend
    const cashBurnTrend = performance ? formatTrend(-performance.expenses.percentChange) : undefined;

    // Quick Stats (7 cards for the stat row)
    const quickStats = [
        {
            label: 'Revenue',
            value: performance ? formatCurrencyValue(performance.revenue.current) : '—',
            trend: performance ? formatTrend(performance.revenue.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.revenue.sparkline) : [],
            color: 'green' as const,
            href: '/accounting/reports/revenue',
        },
        {
            label: 'Expenses',
            value: performance ? formatCurrencyValue(performance.expenses.current) : '—',
            trend: performance ? formatTrend(-performance.expenses.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red' as const,
            href: '/accounting/reports/spending',
        },
        {
            label: 'Profit',
            value: performance ? formatCurrencyValue(performance.profit.current) : '—',
            trend: performance ? formatTrend(performance.profit.percentChange) : undefined,
            sparkline: performance ? convertSparkline(performance.profit.sparkline) : [],
            color: 'primary' as const,
            href: '/accounting/reports/profit-loss',
        },
        {
            label: 'Receivables',
            value: performance ? formatCurrencyValue(performance.receivables.outstanding) : '—',
            trend: (performance?.receivables.sparkline.length ?? 0) > 0 ? { direction: 'flat' as const, text: `${formatCurrencyValue(performance!.receivables.overdue)} overdue` } : undefined,
            sparkline: performance ? convertSparkline(performance.receivables.sparkline) : [],
            color: 'blue' as const,
            href: '/invoicing/invoices?status=outstanding',
        },
        {
            label: 'Payables',
            value: metrics?.payables ? formatCurrencyValue(metrics.payables.outstanding) : '—',
            trend: metrics?.payables?.overdue ? { direction: 'flat' as const, text: `${formatCurrencyValue(metrics.payables.overdue)} overdue` } : undefined,
            sparkline: [],
            color: 'purple' as const,
            href: '/vendors/bills?status=outstanding',
        },
        {
            label: 'Runway',
            value: runwayValue ?? '—',
            trend: runwayMonths > 0 ? {
                direction: runwayMonths >= 6 ? ('up' as const) : runwayMonths >= 3 ? ('flat' as const) : ('down' as const),
                text: runwayMonths >= 6 ? 'Healthy' : runwayMonths >= 3 ? 'Monitor' : 'Critical'
            } : undefined,
            sparkline: [],
            color: runwayMonths >= 6 ? ('teal' as const) : runwayMonths >= 3 ? ('primary' as const) : ('red' as const),
            href: '/overview/cash-flow',
        },
        {
            label: 'Cash Burn',
            value: performance ? formatCurrencyValue(performance.expenses.current) : '—',
            trend: cashBurnTrend,
            sparkline: performance ? convertSparkline(performance.expenses.sparkline) : [],
            color: 'red' as const,
            href: '/overview/cash-flow',
        },
    ];

    return (
        <div className="space-y-4">
            {/* Onboarding hero — conditional, above grid */}
            <OnboardingHeroCard />

            {/* Command Center Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {/* Row 1: Hero + Right Panel */}
                <div className="xl:col-span-2">
                    <NetWorthHero
                        netWorth={netWorthAmount}
                        baseCurrency={baseCurrency}
                        cash={cash}
                        debt={debt}
                        runway={runwayValue}
                        trend={undefined}
                    />
                </div>
                <div className="xl:col-span-2">
                    <CommandCenterRightPanel />
                </div>

                {/* Row 2: AI Insights (full width) */}
                <div className="xl:col-span-4">
                    <InsightCards />
                </div>

                {/* Row 3: Quick Stats (full width, responsive grid) */}
                <div className="xl:col-span-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                        {quickStats.map((stat, index) => (
                            <div key={stat.label} className={index === quickStats.length - 1 ? 'col-span-2 md:col-span-1' : undefined}>
                                <StatCard stat={stat} index={index} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 4: Cash Flow + Recent Activity */}
                <div className="xl:col-span-2">
                    <DashboardCashFlowChart />
                </div>
                <div className="xl:col-span-2">
                    <RecentTransactions transactions={recentTransactions.transactions} />
                </div>

                {/* Row 5: Expense Breakdown + Entity Matrix */}
                <div className="xl:col-span-2">
                    <DashboardExpenseChart />
                </div>
                <div className="xl:col-span-2">
                    {entities.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="Set up your first entity"
                            description="Create a business entity to track finances, manage accounts, and separate operations across countries and currencies."
                            action={{
                                label: "Create Entity",
                                href: "/system/entities",
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
            </div>
        </div>
    );
}
