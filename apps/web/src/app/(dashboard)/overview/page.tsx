import type { Metadata } from "next";
import Link from "next/link";
import { EntitiesSection } from "@/components/dashboard/EntitiesSection";
import { DashboardCashFlowChart, DashboardExpenseChart } from "@/components/dashboard/DashboardCharts";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { CommandCenterRightPanel } from "@/components/dashboard/CommandCenterRightPanel";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { EmptyState } from "@akount/ui";
import { Button } from "@/components/ui/button";
import { OnboardingHeroCard } from "@/components/onboarding/OnboardingHeroCard";
import { GlowCard } from "@/components/ui/glow-card";
import { CardContent } from "@/components/ui/card";
import { listEntities } from "@/lib/api/entities";
import { getDashboardMetrics, getIntents, getUpcomingPayments } from "@/lib/api/dashboard";
import { getPerformanceMetrics } from "@/lib/api/performance";
import { listTransactions } from "@/lib/api/transactions";
import { getInsightCounts, listInsights } from "@/lib/api/ai";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { getDashboardConfig } from "@/lib/dashboard-personalization";
import { buildQuickStats, orderStats } from "@/lib/dashboard/transformers";
import { ProfitLossSummaryWidget } from "@/components/dashboard/ProfitLossSummaryWidget";
import { TrialBalanceStatusWidget } from "@/components/dashboard/TrialBalanceStatusWidget";
import { TopRevenueClientsWidget } from "@/components/dashboard/TopRevenueClientsWidget";
import { AIActionWidget } from "@/components/dashboard/AIActionWidget";
import { GoalProgressWidget } from "@/components/dashboard/GoalProgressWidget";
import { BudgetVsActualWidget } from "@/components/dashboard/BudgetVsActualWidget";
import { ExpenseForecastWidget } from "@/components/dashboard/ExpenseForecastWidget";
import { Building2, Landmark, Upload, PenLine } from "lucide-react";
import { NLBookkeepingBar } from "./nl-bookkeeping-bar";

export const metadata: Metadata = {
    title: "Overview | Akount",
    description: "View your financial overview, net worth, and account summaries",
};

export default async function OverviewPage() {
    // Read entity selection from cookie (not URL params)
    const [{ entityId: rawEntityId, currency: cookieCurrency }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;
    const currency = cookieCurrency || 'CAD';

    // Parallel data fetch (includes intents for personalization)
    const entities = allEntities;
    let metrics: Awaited<ReturnType<typeof getDashboardMetrics>> | null = null;
    let performance: Awaited<ReturnType<typeof getPerformanceMetrics>> | null = null;
    let recentTransactions: Awaited<ReturnType<typeof listTransactions>> = { transactions: [], hasMore: false };
    let intents: string[] = [];
    let upcomingPayments: Awaited<ReturnType<typeof getUpcomingPayments>> = { data: [] };
    let insightCounts: Awaited<ReturnType<typeof getInsightCounts>> | null = null;
    let topInsight: { title: string; type: string; priority: 'low' | 'medium' | 'high' | 'critical' } | null = null;

    try {
        const [metricsResult, performanceResult, transactionsResult, intentsResult, upcomingResult, insightCountsResult, topInsightResult] = await Promise.allSettled([
            getDashboardMetrics(entityId, currency),
            getPerformanceMetrics(entityId, currency),
            listTransactions({ limit: 10, entityId }),
            getIntents(),
            getUpcomingPayments(entityId, 20), // UX-105: Fetch server-side
            entityId ? getInsightCounts(entityId) : Promise.resolve(null),
            entityId ? listInsights({ entityId, limit: 1, status: 'active' }) : Promise.resolve(null),
        ]);

        if (metricsResult.status === 'fulfilled') metrics = metricsResult.value;
        if (performanceResult.status === 'fulfilled') performance = performanceResult.value;
        if (transactionsResult.status === 'fulfilled') recentTransactions = transactionsResult.value;
        if (intentsResult.status === 'fulfilled') intents = intentsResult.value;
        if (upcomingResult.status === 'fulfilled') upcomingPayments = upcomingResult.value;
        if (insightCountsResult.status === 'fulfilled') insightCounts = insightCountsResult.value;
        if (topInsightResult.status === 'fulfilled' && topInsightResult.value) {
            const insights = (topInsightResult.value as Awaited<ReturnType<typeof listInsights>>).insights;
            if (insights.length > 0) {
                topInsight = { title: insights[0].title, type: insights[0].type, priority: insights[0].priority };
            }
        }
    } catch {
        // Continue with defaults
    }

    // Personalize dashboard based on onboarding intents
    const dashboardConfig = getDashboardConfig(intents);

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
                                    <p className="text-micro text-muted-foreground">Securely link for automatic sync</p>
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
                                    <p className="text-micro text-muted-foreground">Upload CSV or PDF</p>
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
                                    <p className="text-micro text-muted-foreground">Enter account details</p>
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
    const cash = metrics?.cashPosition.cash ?? 0;
    const debt = metrics?.cashPosition.debt ?? 0;
    const monthlyBurn = performance?.expenses.current ?? 0;
    const runwayMonths = monthlyBurn > 0 ? Math.floor((cash / monthlyBurn) * 100) / 100 : 0;
    const runwayValue = runwayMonths > 0 ? `${runwayMonths.toFixed(1)}mo` : undefined;

    // Build and order stat cards (transformation logic in lib/dashboard/transformers.ts)
    const quickStats = buildQuickStats(metrics, performance);
    const orderedStats = orderStats(quickStats, dashboardConfig.statOrder);

    return (
        <div className="space-y-4">
            {/* Personalized greeting from onboarding intents */}
            {dashboardConfig.greeting && (
                <p className="text-sm font-heading italic text-muted-foreground">
                    {dashboardConfig.greeting}
                </p>
            )}

            {/* Onboarding hero — conditional, above grid */}
            <OnboardingHeroCard />

            {/* Natural Language Bookkeeping Input */}
            {entityId && <NLBookkeepingBar entityId={entityId} />}

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
                    <CommandCenterRightPanel upcomingPayments={upcomingPayments.data} />
                </div>

                {/* Row 2: AI Insights + AI Actions */}
                <div className="xl:col-span-3">
                    <InsightCards counts={insightCounts} topInsight={topInsight} />
                </div>
                <div className="xl:col-span-1">
                    <AIActionWidget entityId={entityId} />
                </div>

                {/* Row 3: Quick Stats (full width, responsive grid, intent-ordered) */}
                <div className="xl:col-span-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                        {orderedStats.map((stat, index) => (
                            <div key={stat.label} className={index === orderedStats.length - 1 ? 'col-span-2 md:col-span-1' : undefined}>
                                <StatCard
                                    stat={stat}
                                    index={index}
                                    highlighted={dashboardConfig.highlightWidgets.includes(stat.label)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 4: Report Widgets */}
                <div className="xl:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <GlowCard variant="glass" className="p-4">
                            <ProfitLossSummaryWidget entityId={entityId} />
                        </GlowCard>
                        <GlowCard variant="glass" className="p-4">
                            <TrialBalanceStatusWidget entityId={entityId} />
                        </GlowCard>
                        <GlowCard variant="glass" className="p-4">
                            <TopRevenueClientsWidget entityId={entityId} />
                        </GlowCard>
                    </div>
                </div>

                {/* Row 5: Planning Widgets */}
                <div className="xl:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <GlowCard variant="glass" className="p-4">
                            <GoalProgressWidget entityId={entityId} />
                        </GlowCard>
                        <GlowCard variant="glass" className="p-4">
                            <BudgetVsActualWidget entityId={entityId} />
                        </GlowCard>
                        <GlowCard variant="glass" className="p-4">
                            <ExpenseForecastWidget entityId={entityId} />
                        </GlowCard>
                    </div>
                </div>

                {/* Row 6: Cash Flow + Recent Activity (height-capped) */}
                <div className="xl:col-span-2 h-[300px]">
                    <DashboardCashFlowChart />
                </div>
                <div className="xl:col-span-2 h-[300px]">
                    <RecentTransactions transactions={recentTransactions.transactions} />
                </div>

                {/* Row 7: Expense Breakdown + Entity Matrix */}
                <div className="xl:col-span-2">
                    <DashboardExpenseChart />
                </div>
                <div className="xl:col-span-2">
                    {entities.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="Set up your first entity"
                            description="Create a business entity to track finances, manage accounts, and separate operations across countries and currencies."
                        >
                            <Button asChild>
                                <Link href="/system/entities">Create Entity</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/docs/entities">Learn more</Link>
                            </Button>
                        </EmptyState>
                    ) : (
                        <EntitiesSection entities={entities} />
                    )}
                </div>
            </div>
        </div>
    );
}
