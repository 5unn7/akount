import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAccount, listAccountTransactions } from '@/lib/api/accounts';
import { AccountDetailHeader } from '@/components/accounts/AccountDetailHeader';
import { TransactionsList } from '@/components/accounts/TransactionsList';
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

    // Fetch account details
    let account;
    try {
        account = await getAccount(id);
    } catch (error) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Account Header */}
            <AccountDetailHeader account={account} />

            {/* Transactions List */}
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

/**
 * Loading skeleton for transactions list
 */
function TransactionsListSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="text-right space-y-2">
                                <div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
