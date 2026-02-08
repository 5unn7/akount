import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Activity, TrendingUp } from "lucide-react";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/utils/currency";

/**
 * Dashboard metrics cards - Server Component
 * Fetches real financial data from the API
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {formatCurrency(metrics.netWorth.amount, metrics.netWorth.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All accounts combined
                        </p>
                    </CardContent>
                </Card>

                {/* Cash Position Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {formatCurrency(metrics.cashPosition.cash, metrics.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Available cash
                        </p>
                    </CardContent>
                </Card>

                {/* Total Debt Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {formatCurrency(metrics.cashPosition.debt, metrics.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Credit cards & loans
                        </p>
                    </CardContent>
                </Card>

                {/* Active Accounts Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{metrics.accounts.active}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.accounts.total} total accounts
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-destructive">
                            Failed to load dashboard metrics. {error instanceof Error ? error.message : 'Unknown error'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
