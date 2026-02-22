import { Suspense } from 'react';
import type { Metadata } from 'next';
import { listGLAccounts, getAccountBalances } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { ChartOfAccountsClient } from './chart-of-accounts-client';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@akount/ui';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';

export const metadata: Metadata = {
    title: 'Chart of Accounts | Akount',
    description: 'Manage your chart of accounts',
};

export default async function ChartOfAccountsPage() {
    // Accounting pages force entity selection — "All Entities" falls back to first entity
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Chart of Accounts
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your general ledger account structure
                    </p>
                </div>
            </div>

            <Suspense
                key={entityId}
                fallback={<COASkeleton />}
            >
                <COAData entityId={entityId} entities={entities} />
            </Suspense>
        </div>
    );
}

async function COAData({ entityId, entities }: { entityId: string | null; entities: Awaited<ReturnType<typeof listEntities>> }) {
    try {
        if (entities.length === 0) {
            return (
                <EmptyState title="No entities found. Create a business entity first." />
            );
        }

        // Force entity selection for accounting pages
        const selectedEntityId = entityId || entities[0].id;

        const [accounts, balances] = await Promise.all([
            listGLAccounts({ entityId: selectedEntityId }),
            getAccountBalances(selectedEntityId).catch(() => []),
        ]);

        return (
            <ChartOfAccountsClient
                accounts={accounts}
                balances={balances}
                entities={entities}
                selectedEntityId={selectedEntityId}
            />
        );
    } catch (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-2">Failed to load chart of accounts</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}

function COASkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
                <div className="flex-1" />
                <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="rounded-[14px] border border-ak-border overflow-hidden">
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-28 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
