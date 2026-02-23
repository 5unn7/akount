import type { Metadata } from "next";
import { Wallet, TrendingUp, CreditCard, Landmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@akount/ui";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCashFlow } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/utils/currency";

export const metadata: Metadata = {
    title: "Cash Flow | Akount",
    description: "Monitor your cash flow across all accounts",
};

export default async function CashFlowPage() {
    const data = await getCashFlow();

    // Show empty state if no accounts exist
    if (data.accounts.total === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Cash Flow</h2>
                </div>
                <EmptyState
                    icon={Wallet}
                    title="No accounts connected"
                    description="Connect your bank accounts, credit cards, and other financial accounts to track your cash flow."
                >
                    <Button asChild>
                        <Link href="/banking/accounts">Add Account</Link>
                    </Button>
                </EmptyState>
            </div>
        );
    }

    const netCash = data.cashPosition.net;
    const isPositive = netCash >= 0;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Cash Flow</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Cash Position Card */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Position</CardTitle>
                        <Wallet className={`h-4 w-4 ${isPositive ? 'text-ak-green' : 'text-ak-red'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-mono ${isPositive ? 'text-ak-green' : 'text-ak-red'}`}>
                            {formatCurrency(netCash, data.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cash minus debt
                        </p>
                    </CardContent>
                </Card>

                {/* Cash Available Card */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
                        <TrendingUp className="h-4 w-4 text-ak-green" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-ak-green">
                            {formatCurrency(data.cashPosition.cash, data.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current liquid assets
                        </p>
                    </CardContent>
                </Card>

                {/* Debt Card */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle>
                        <CreditCard className="h-4 w-4 text-ak-red" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-ak-red">
                            {formatCurrency(data.cashPosition.debt, data.cashPosition.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Credit cards and loans
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Account Breakdown */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5" />
                        Account Summary
                    </CardTitle>
                    <CardDescription>
                        Breakdown of your {data.accounts.total} accounts by type
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Accounts</span>
                            <span className="text-sm font-mono">{data.accounts.total}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Active</span>
                            <span className="text-sm font-mono text-ak-green">{data.accounts.active}</span>
                        </div>

                        {data.accounts.byType.BANK && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Bank Accounts</span>
                                <span className="text-sm font-mono">{data.accounts.byType.BANK}</span>
                            </div>
                        )}
                        {data.accounts.byType.CREDIT_CARD && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Credit Cards</span>
                                <span className="text-sm font-mono">{data.accounts.byType.CREDIT_CARD}</span>
                            </div>
                        )}
                        {data.accounts.byType.INVESTMENT && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Investments</span>
                                <span className="text-sm font-mono">{data.accounts.byType.INVESTMENT}</span>
                            </div>
                        )}
                        {data.accounts.byType.LOAN && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Loans</span>
                                <span className="text-sm font-mono">{data.accounts.byType.LOAN}</span>
                            </div>
                        )}
                        {data.accounts.byType.MORTGAGE && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Mortgages</span>
                                <span className="text-sm font-mono">{data.accounts.byType.MORTGAGE}</span>
                            </div>
                        )}
                        {data.accounts.byType.OTHER && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Other</span>
                                <span className="text-sm font-mono">{data.accounts.byType.OTHER}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cash Flow Breakdown */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Cash Position Breakdown</CardTitle>
                    <CardDescription>
                        Detailed view of your current cash position
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Cash Available</span>
                            <span className="text-sm font-mono text-ak-green">
                                {formatCurrency(data.cashPosition.cash, data.cashPosition.currency)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Outstanding Debt</span>
                            <span className="text-sm font-mono text-ak-red">
                                -{formatCurrency(data.cashPosition.debt, data.cashPosition.currency)}
                            </span>
                        </div>
                        <div className="border-t border-ak-border pt-4">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Net Cash Position</span>
                                <span className={`font-semibold font-mono ${isPositive ? 'text-ak-green' : 'text-ak-red'}`}>
                                    {formatCurrency(netCash, data.cashPosition.currency)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
