import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAccount, listAccountTransactions } from '@/lib/api/accounts';
import { AccountDetailHero } from '@/components/banking/AccountDetailHero';
import { AccountInsightCard } from '@/components/banking/AccountInsightCard';
import { AccountDetailsPanel } from '@/components/banking/AccountDetailsPanel';
import { AccountStatsRow } from '@/components/banking/AccountStatsRow';
import { BalanceHistoryChart } from '@/components/banking/BalanceHistoryChart';
import { TransactionsList } from '@/components/accounts/TransactionsList';
import { computeTransactionStats } from '@/lib/utils/account-helpers';
import { Card, CardContent } from '@/components/ui/card';

interface AccountDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export async function generateMetadata(
    { params }: AccountDetailPageProps
): Promise<Metadata> {
    const { id } = await params;
    try {
        const account = await getAccount(id);
        return {
            title: `${account.name} | Akount`,
            description: `View transactions and details for ${account.name}`,
        };
    } catch {
        return {
            title: 'Account Not Found | Akount',
        };
    }
}

export default async function AccountDetailPage({
    params,
    searchParams,
}: AccountDetailPageProps) {
    const { id } = await params;
    const search = await searchParams;

    let account;
    try {
        account = await getAccount(id);
    } catch {
        notFound();
    }

    // Fetch transactions for stats, chart, and spending breakdown
    const now = new Date();
    const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    )
        .toISOString()
        .split('T')[0];

    // Fetch month transactions for stats + all recent for chart
    let monthTxns;
    let allTxns;
    try {
        [monthTxns, allTxns] = await Promise.all([
            listAccountTransactions(id, {
                startDate: monthStart,
                limit: 200,
            }),
            listAccountTransactions(id, { limit: 500 }),
        ]);
    } catch {
        monthTxns = { transactions: [], hasMore: false };
        allTxns = { transactions: [], hasMore: false };
    }

    const stats = computeTransactionStats(monthTxns.transactions);

    // Compute monthly change
    const monthlyChange =
        stats.incomeMTD - stats.expenseMTD;

    // Compute running balance data for sparkline (last 30 daily balances)
    const runningBalanceData = computeRunningBalanceSparkline(
        allTxns.transactions,
        account.currentBalance
    );

    // Compute average daily flow
    const daysInMonth = now.getDate();
    const avgDailyFlow =
        daysInMonth > 0
            ? Math.round(monthlyChange / daysInMonth)
            : 0;

    // Compute balance history chart data
    const balanceHistoryData = computeBalanceHistory(
        allTxns.transactions,
        account.currentBalance
    );

    return (
        <div className="flex-1 space-y-5">
            {/* Row 1: Hero (3 cols) + Insight + Details (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-3">
                    <AccountDetailHero
                        account={account}
                        monthlyChange={monthlyChange}
                        runningBalanceData={runningBalanceData}
                    />
                </div>
                <div className="lg:col-span-1 space-y-4">
                    <AccountInsightCard
                        account={account}
                        stats={stats}
                    />
                    <AccountDetailsPanel
                        account={account}
                        transactionCount={stats.totalCount}
                    />
                </div>
            </div>

            {/* Row 2: Stats Row (full width, 5 cards) */}
            <AccountStatsRow
                stats={stats}
                currency={account.currency}
                avgDailyFlow={avgDailyFlow}
            />

            {/* Row 3: Balance History Chart (2 cols) + Spending Mini (2 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <BalanceHistoryChart
                    data={balanceHistoryData}
                    currency={account.currency}
                />
                <AccountSpendingMini
                    transactions={monthTxns.transactions}
                    currency={account.currency}
                />
            </div>

            {/* Row 4: Transactions Table (full width) */}
            <Suspense
                key={`${search.startDate}-${search.endDate}`}
                fallback={<TransactionsListSkeleton />}
            >
                <TransactionsList
                    accountId={id}
                    startDate={search.startDate}
                    endDate={search.endDate}
                />
            </Suspense>
        </div>
    );
}

// --- Helper functions ---

/**
 * Compute 30 daily balance data points for sparkline
 */
function computeRunningBalanceSparkline(
    transactions: Array<{ date: string; amount: number }>,
    currentBalance: number
): number[] {
    if (transactions.length === 0) return [];

    // Build daily net change map from recent transactions
    const dailyNet = new Map<string, number>();
    for (const txn of transactions) {
        const date = txn.date.split('T')[0];
        dailyNet.set(date, (dailyNet.get(date) ?? 0) + txn.amount);
    }

    // Generate last 30 days
    const result: number[] = [];
    const today = new Date();
    let balance = currentBalance;

    // Work backwards from today
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    // Reverse to go oldest→newest, subtract daily changes to get historical balance
    dates.reverse();
    const dailyBalances: number[] = [];
    let runBal = balance;

    // First reverse-walk to find balance 30 days ago
    for (let i = dates.length - 1; i >= 0; i--) {
        dailyBalances[i] = runBal;
        runBal -= dailyNet.get(dates[i]) ?? 0;
    }
    // Fix: first entry is the oldest
    dailyBalances[0] = runBal + (dailyNet.get(dates[0]) ?? 0);

    return dailyBalances;
}

/**
 * Compute daily balance data points for the chart
 */
function computeBalanceHistory(
    transactions: Array<{ date: string; amount: number }>,
    currentBalance: number
): Array<{ date: string; balance: number }> {
    if (transactions.length === 0) return [];

    // Build daily net change map
    const dailyNet = new Map<string, number>();
    for (const txn of transactions) {
        const date = txn.date.split('T')[0];
        dailyNet.set(date, (dailyNet.get(date) ?? 0) + txn.amount);
    }

    // Get all unique dates sorted
    const allDates = Array.from(dailyNet.keys()).sort();
    if (allDates.length === 0) return [];

    // Fill in missing dates between first and last
    const filledDates: string[] = [];
    const start = new Date(allDates[0] + 'T00:00:00');
    const end = new Date(allDates[allDates.length - 1] + 'T00:00:00');
    const cursor = new Date(start);
    while (cursor <= end) {
        filledDates.push(cursor.toISOString().split('T')[0]);
        cursor.setDate(cursor.getDate() + 1);
    }

    // Walk backwards from current balance to compute historical daily balances
    const result: Array<{ date: string; balance: number }> = [];
    let bal = currentBalance;

    // Subtract forward from today back to end date
    const today = new Date().toISOString().split('T')[0];
    // Approximate: subtract net changes for dates between end and today
    const postDates = Array.from(dailyNet.keys())
        .filter((d) => d > filledDates[filledDates.length - 1])
        .sort();
    for (const d of postDates.reverse()) {
        bal -= dailyNet.get(d) ?? 0;
    }

    // Now walk backwards through filled dates
    for (let i = filledDates.length - 1; i >= 0; i--) {
        result[i] = { date: filledDates[i], balance: bal };
        bal -= dailyNet.get(filledDates[i]) ?? 0;
    }

    return result;
}

// --- Inline lightweight components ---

/**
 * Lightweight spending breakdown grouped by category (client-side from already-fetched transactions).
 * Will be replaced by full SpendingBreakdown component in Sprint 2.
 */
function AccountSpendingMini({
    transactions,
    currency,
}: {
    transactions: Array<{
        amount: number;
        categoryId?: string;
        description: string;
    }>;
    currency: string;
}) {
    // Group expenses by description (as proxy for category when categoryId is null)
    const expenses = transactions.filter((t) => t.amount < 0);

    const groups = new Map<string, number>();
    for (const txn of expenses) {
        const key = txn.categoryId ?? normalizeDescription(txn.description);
        groups.set(key, (groups.get(key) ?? 0) + Math.abs(txn.amount));
    }

    const sorted = Array.from(groups.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    const maxAmount = sorted[0]?.[1] ?? 1;
    const totalExpenses = expenses.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
    );

    const barColors = [
        'bg-ak-red',
        'bg-ak-purple',
        'bg-ak-blue',
        'bg-ak-teal',
        'bg-primary',
        'bg-muted-foreground',
    ];

    return (
        <div className="glass rounded-xl p-6">
            <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">
                Spending Breakdown
            </h3>
            {sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No expense data this month
                </p>
            ) : (
                <div className="space-y-3">
                    {sorted.map(([key, amount], i) => {
                        const pct = (amount / maxAmount) * 100;
                        return (
                            <div key={key} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs truncate max-w-[140px]">
                                        {key}
                                    </span>
                                    <span className="text-xs font-mono text-ak-red">
                                        {new Intl.NumberFormat('en-CA', {
                                            style: 'currency',
                                            currency,
                                        }).format(amount / 100)}
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-ak-border overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    <div className="pt-2 border-t border-ak-border flex justify-between">
                        <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                            Total Expenses
                        </span>
                        <span className="text-xs font-mono font-semibold text-ak-red">
                            {new Intl.NumberFormat('en-CA', {
                                style: 'currency',
                                currency,
                            }).format(totalExpenses / 100)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function normalizeDescription(desc: string): string {
    return desc
        .trim()
        .toLowerCase()
        .replace(/\s*[-#]\s*\d+.*$/, '')
        .replace(/\s+/g, ' ')
        .slice(0, 30);
}

function TransactionsListSkeleton() {
    return (
        <Card className="glass rounded-[14px]">
            <CardContent className="p-0">
                <div className="p-4 border-b border-ak-border">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
                        <div className="flex-1" />
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-7 w-24 bg-muted animate-pulse rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-3"
                        >
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
