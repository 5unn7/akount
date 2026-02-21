import { Suspense } from 'react';
import type { Metadata } from 'next';
import { listJournalEntries } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { JournalEntriesClient } from './journal-entries-client';
import { Card, CardContent } from '@/components/ui/card';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';

export const metadata: Metadata = {
    title: 'Journal Entries | Akount',
    description: 'Create and manage journal entries',
};

interface JournalEntriesPageProps {
    searchParams: Promise<{
        status?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function JournalEntriesPage({
    searchParams,
}: JournalEntriesPageProps) {
    const params = await searchParams;

    // Accounting pages force entity selection
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
                        Journal Entries
                    </h2>
                    <p className="text-muted-foreground">
                        View, approve, and manage double-entry journal entries
                    </p>
                </div>
            </div>

            <Suspense
                key={`${entityId}-${params.status}-${params.startDate}-${params.endDate}`}
                fallback={<JournalEntriesSkeleton />}
            >
                <JournalEntriesData
                    entityId={entityId}
                    entities={entities}
                    status={params.status}
                    startDate={params.startDate}
                    endDate={params.endDate}
                />
            </Suspense>
        </div>
    );
}

async function JournalEntriesData({
    entityId,
    entities,
    status,
    startDate,
    endDate,
}: {
    entityId: string | null;
    entities: Awaited<ReturnType<typeof listEntities>>;
    status?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        if (entities.length === 0) {
            return (
                <Card className="glass rounded-[14px]">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No entities found. Create a business entity first.
                        </p>
                    </CardContent>
                </Card>
            );
        }

        // Force entity selection for accounting pages
        const selectedEntityId = entityId || entities[0].id;
        const validStatuses = ['DRAFT', 'POSTED', 'VOIDED', 'ARCHIVED'];
        const statusParam = status && validStatuses.includes(status)
            ? (status as 'DRAFT' | 'POSTED' | 'VOIDED' | 'ARCHIVED')
            : undefined;

        const result = await listJournalEntries({
            entityId: selectedEntityId,
            status: statusParam,
            startDate,
            endDate,
        });

        return (
            <JournalEntriesClient
                entries={result.entries}
                hasMore={result.hasMore}
                nextCursor={result.nextCursor}
                entityId={selectedEntityId}
            />
        );
    } catch (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-2">Failed to load journal entries</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}

function JournalEntriesSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
                <div className="flex-1" />
                <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="rounded-[14px] border border-ak-border overflow-hidden">
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 w-6 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-28 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
