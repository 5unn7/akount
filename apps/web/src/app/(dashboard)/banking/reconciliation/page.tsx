import { Suspense } from 'react';
import type { Metadata } from 'next';
import { listAccounts } from '@/lib/api/accounts';
import { ReconciliationDashboard } from '@/components/reconciliation/ReconciliationDashboard';
import { PageHeader } from '@/components/shared/PageHeader';

export const metadata: Metadata = {
    title: 'Reconciliation | Akount',
    description: 'Match bank transactions with your records',
};

interface ReconciliationPageProps {
    searchParams: Promise<{
        accountId?: string;
    }>;
}

export default async function ReconciliationPage({ searchParams }: ReconciliationPageProps) {
    const params = await searchParams;

    return (
        <div className="flex-1 space-y-5">
            <div className="fi fi1">
                <PageHeader
                    title="Reconciliation"
                    subtitle="Match bank transactions with your records for accurate bookkeeping"
                />
            </div>

            <div className="fi fi2">
                <Suspense
                    key={params.accountId}
                    fallback={<ReconciliationSkeleton />}
                >
                    <ReconciliationContent initialAccountId={params.accountId} />
                </Suspense>
            </div>
        </div>
    );
}

async function ReconciliationContent({ initialAccountId }: { initialAccountId?: string }) {
    try {
        const { accounts } = await listAccounts({ isActive: true });

        return (
            <ReconciliationDashboard
                accounts={accounts}
                initialAccountId={initialAccountId}
            />
        );
    } catch (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-2">Failed to load accounts</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}

function ReconciliationSkeleton() {
    return (
        <div className="space-y-5">
            {/* Account selector skeleton */}
            <div className="glass rounded-[14px] p-5">
                <div className="flex items-center gap-4">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-[300px] bg-muted animate-pulse rounded-lg" />
                </div>
            </div>

            {/* Status cards skeleton */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl px-4 py-3.5">
                        <div className="h-3 w-20 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-7 w-12 bg-muted animate-pulse rounded mb-1" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="glass rounded-[14px] overflow-hidden">
                <div className="px-5 py-4 border-b border-ak-border">
                    <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                            <div className="h-7 w-24 bg-muted animate-pulse rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
