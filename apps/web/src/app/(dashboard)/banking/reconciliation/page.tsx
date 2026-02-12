import { Suspense } from 'react';
import type { Metadata } from 'next';
import { listAccounts } from '@/lib/api/accounts';
import { ReconciliationDashboard } from '@/components/reconciliation/ReconciliationDashboard';
import { Card, CardContent } from '@/components/ui/card';

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Reconciliation
                    </h2>
                    <p className="text-muted-foreground">
                        Match bank transactions with your records for accurate bookkeeping
                    </p>
                </div>
            </div>

            <Suspense
                key={params.accountId}
                fallback={<ReconciliationSkeleton />}
            >
                <ReconciliationContent initialAccountId={params.accountId} />
            </Suspense>
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
        <div className="space-y-6">
            {/* Account selector skeleton */}
            <Card>
                <CardContent className="pt-6">
                    <div className="h-10 w-[400px] bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>

            {/* Status cards skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table skeleton */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
                                <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
