import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAccount, listAccountTransactions } from '@/lib/api/accounts';
import { AccountDetailHeader } from '@/components/accounts/AccountDetailHeader';
import { AccountStatsPills } from '@/components/accounts/AccountStatsPills';
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

    // Fetch current month transactions for stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    let stats;
    try {
        const monthTxns = await listAccountTransactions(id, {
            startDate: monthStart,
            limit: 200,
        });
        stats = computeTransactionStats(monthTxns.transactions);
    } catch {
        stats = { incomeMTD: 0, expenseMTD: 0, unreconciledCount: 0, totalCount: 0 };
    }

    return (
        <div className="flex-1 space-y-5">
            <AccountDetailHeader account={account} />

            <AccountStatsPills stats={stats} currency={account.currency} />

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
                                <div key={i} className="h-7 w-24 bg-muted animate-pulse rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
