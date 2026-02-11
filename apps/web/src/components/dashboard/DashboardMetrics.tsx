import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowCard } from "@/components/ui/glow-card";
import { DollarSign, CreditCard, Activity, TrendingUp } from "lucide-react";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/utils/currency";

/**
 * Dashboard metrics cards - Server Component
 * Fetches real financial data from the API
 *
 * Financial Clarity: GlowCard glass, amber glow hover,
 * font-mono values, uppercase tiny labels, green/red trends
 */
export async function DashboardMetrics({
    entityId,
    currency = 'CAD'
}: {
    entityId?: string;
    currency?: string;
}): Promise<React.ReactElement> {
    try {
        const metrics = await getDashboardMetrics(entityId, currency);

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Net Worth Card */}
                <GlowCard variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            Net Worth
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {formatCurrency(metrics.netWorth.amount, metrics.netWorth.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All accounts combined
                        </p>
                    </CardContent>
                </GlowCard>

                {/* Cash Position Card */}
                <GlowCard variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            Cash Position
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-[#34D399]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-[#34D399]">
                            {formatCurrency(metrics.cashPosition.cash, metrics.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Available cash
                        </p>
                    </CardContent>
                </GlowCard>

                {/* Total Debt Card */}
                <GlowCard variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            Total Debt
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-[#F87171]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-[#F87171]">
                            {formatCurrency(metrics.cashPosition.debt, metrics.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Credit cards &amp; loans
                        </p>
                    </CardContent>
                </GlowCard>

                {/* Active Accounts Card */}
                <GlowCard variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            Active Accounts
                        </CardTitle>
                        <Activity className="h-4 w-4 text-[#60A5FA]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{metrics.accounts.active}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics.accounts.total} total accounts
                        </p>
                    </CardContent>
                </GlowCard>
            </div>
        );
    } catch (error) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <GlowCard variant="glass">
                    <CardContent className="pt-6">
                        <p className="text-sm text-destructive">
                            Failed to load dashboard metrics. {error instanceof Error ? error.message : 'Unknown error'}
                        </p>
                    </CardContent>
                </GlowCard>
            </div>
        );
    }
}
