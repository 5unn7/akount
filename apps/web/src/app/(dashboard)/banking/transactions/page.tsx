import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { CreateTransactionDialog } from '@/components/transactions/CreateTransactionForm';
import { TransactionsStatsRow } from '@/components/banking/TransactionsStatsRow';
import { SpendingBreakdown } from '@/components/banking/SpendingBreakdown';
import { AICategoryQueue } from '@/components/banking/AICategoryQueue';
import { TopMerchants } from '@/components/banking/TopMerchants';
import { RecurringDetected } from '@/components/banking/RecurringDetected';
import { DailyCashFlowTimeline } from '@/components/banking/DailyCashFlowTimeline';
import { listAccounts } from '@/lib/api/accounts';
import { listCategories } from '@/lib/api/categories';
import { listTransactions, getSpendingByCategory } from '@/lib/api/transactions';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import type { Transaction } from '@/lib/api/transactions.types';
import { computeTransactionStats } from '@/lib/utils/account-helpers';

export const metadata: Metadata = {
    title: 'Transactions | Akount',
    description: 'Transaction intelligence command center',
};

interface TransactionsPageProps {
    searchParams: Promise<{
        accountId?: string;
        startDate?: string;
        endDate?: string;
        importBatchId?: string;
        filter?: string; // 'uncategorized' | 'recent-import'
    }>;
}

export default async function TransactionsPage({
    searchParams,
}: TransactionsPageProps) {
    const params = await searchParams;

    // Read entity selection from cookie
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;

    // Current month date range for stats/charts
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
    );

    // Fetch all data in parallel
    let accounts: Array<{
        id: string;
        name: string;
        type: string;
        currency: string;
    }> = [];
    let categories: Array<{ id: string; name: string; type: string }> = [];
    let monthTransactions: Transaction[] = [];
    let spendingData: {
        categories: Array<{
            categoryId: string | null;
            categoryName: string;
            categoryColor: string | null;
            totalAmount: number;
            transactionCount: number;
            percentOfTotal: number;
        }>;
        totalExpenses: number;
        currency: string;
    } = { categories: [], totalExpenses: 0, currency: 'CAD' };

    try {
        const [accountsResult, categoriesResult, txnResult, spendingResult] =
            await Promise.all([
                listAccounts({ isActive: true, entityId }),
                listCategories({ isActive: true }),
                listTransactions({
                    startDate: monthStart.toISOString(),
                    endDate: monthEnd.toISOString(),
                    limit: 100,
                    entityId,
                }),
                getSpendingByCategory({
                    startDate: monthStart.toISOString(),
                    endDate: monthEnd.toISOString(),
                    entityId,
                }),
            ]);

        accounts = accountsResult.accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            currency: a.currency,
        }));
        categories = categoriesResult.categories.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
        }));
        monthTransactions = txnResult.transactions;
        spendingData = spendingResult;
    } catch {
        // Non-blocking — components will show empty states
    }

    // Compute stats from month transactions
    const txnStats = computeTransactionStats(monthTransactions);
    const currency = spendingData.currency || 'CAD';

    // Compute categorized + posted counts
    const categorizedCount = monthTransactions.filter(
        (t) => t.categoryId
    ).length;
    const postedCount = monthTransactions.filter(
        (t) => t.journalEntryId
    ).length;

    // Uncategorized transactions for AI queue
    const uncategorized = monthTransactions.filter((t) => !t.categoryId);

    return (
        <div className="flex-1 space-y-5">
            {/* Row 1: Header + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 fi fi1">
                <div>
                    <h1 className="text-2xl font-heading font-medium">
                        Transaction Intelligence
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-muted-foreground">
                            {monthTransactions.length} transactions this month
                        </p>
                        {uncategorized.length > 0 && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-ak-red-dim text-ak-red border-ak-red/20">
                                {uncategorized.length} uncategorized
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CreateTransactionDialog
                        accounts={accounts}
                        categories={categories}
                    />
                    <Button
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        asChild
                    >
                        <Link href="/banking/imports">
                            <Upload className="h-3.5 w-3.5" />
                            Import
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Row 2: Stats Row */}
            <div className="fi fi2">
                <TransactionsStatsRow
                    stats={txnStats}
                    currency={currency}
                    totalTransactions={monthTransactions.length}
                    categorizedCount={categorizedCount}
                    postedCount={postedCount}
                />
            </div>

            {/* Row 3: Spending + Intelligence Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fi fi3">
                <SpendingBreakdown
                    data={spendingData.categories}
                    totalExpenses={spendingData.totalExpenses}
                    currency={currency}
                />
                <div className="space-y-4">
                    <AICategoryQueue
                        uncategorizedTransactions={uncategorized}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TopMerchants
                            transactions={monthTransactions}
                            currency={currency}
                        />
                        <RecurringDetected
                            transactions={monthTransactions}
                            currency={currency}
                        />
                    </div>
                </div>
            </div>

            {/* Row 4: Daily Cash Flow */}
            <div className="fi fi4">
                <DailyCashFlowTimeline
                    transactions={monthTransactions}
                    currency={currency}
                />
            </div>

            {/* Row 5+6: Transaction Table (Suspense for streaming) */}
            <div className="fi fi5">
                <Suspense
                    key={`${params.accountId}-${params.startDate}-${params.endDate}`}
                    fallback={<TransactionsListSkeleton />}
                >
                    <TransactionsList filters={params} />
                </Suspense>
            </div>
        </div>
    );
}

function TransactionsListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Filters skeleton */}
            <div className="glass rounded-[14px] p-4">
                <div className="h-8 w-full max-w-xs bg-muted animate-pulse rounded-lg" />
            </div>

            {/* Table skeleton */}
            <div className="glass rounded-[14px] overflow-hidden">
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            </div>
        </div>
    );
}
