import type { Metadata } from "next";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { getNetWorth } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/utils/currency";

export const metadata: Metadata = {
    title: "Net Worth | Akount",
    description: "Track your net worth across all entities and accounts",
};

export default async function NetWorthPage() {
    const data = await getNetWorth();

    // Show empty state if no accounts with balances exist
    const hasData = data.breakdown.assets > 0 || data.breakdown.liabilities > 0;

    if (!hasData) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Net Worth</h2>
                </div>
                <EmptyState
                    icon={Wallet}
                    title="No financial data yet"
                    description="Add accounts with balances or import transactions to start tracking your net worth."
                    action={{
                        label: "Add Account",
                        href: "/banking/accounts",
                        variant: "default"
                    }}
                    secondaryAction={{
                        label: "Import Transactions",
                        href: "/banking/import"
                    }}
                    variant="compact"
                />
            </div>
        );
    }

    const netWorthAmount = data.netWorth.amount;
    const isPositive = netWorthAmount >= 0;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Net Worth</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Net Worth Card */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-ak-green" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-ak-red" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-mono ${isPositive ? 'text-ak-green' : 'text-ak-red'}`}>
                            {formatCurrency(netWorthAmount, data.netWorth.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Assets - Liabilities
                        </p>
                    </CardContent>
                </Card>

                {/* Assets Card */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                        <DollarSign className="h-4 w-4 text-ak-green" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-ak-green">
                            {formatCurrency(data.breakdown.assets, data.netWorth.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cash and equivalents
                        </p>
                    </CardContent>
                </Card>

                {/* Liabilities Card */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                        <DollarSign className="h-4 w-4 text-ak-red" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-ak-red">
                            {formatCurrency(data.breakdown.liabilities, data.netWorth.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Outstanding debt
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass">
                <CardHeader>
                    <CardTitle>Net Worth Breakdown</CardTitle>
                    <CardDescription>
                        Your current financial position across all accounts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Assets</span>
                            <span className="text-sm font-mono text-ak-green">
                                {formatCurrency(data.breakdown.assets, data.netWorth.currency)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Liabilities</span>
                            <span className="text-sm font-mono text-ak-red">
                                -{formatCurrency(data.breakdown.liabilities, data.netWorth.currency)}
                            </span>
                        </div>
                        <div className="border-t border-ak-border pt-4">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Net Worth</span>
                                <span className={`font-semibold font-mono ${isPositive ? 'text-ak-green' : 'text-ak-red'}`}>
                                    {formatCurrency(netWorthAmount, data.netWorth.currency)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
