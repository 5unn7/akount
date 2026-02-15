import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { listImports } from '@/lib/api/imports';
import { ImportHistoryClient } from '@/components/import/ImportHistoryClient';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

export const metadata: Metadata = {
    title: 'Import History | Akount',
    description: 'View past bank statement imports and their status',
};

interface ImportsPageProps {
    searchParams: Promise<{
        status?: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
        sourceType?: 'CSV' | 'PDF' | 'BANK_FEED' | 'API';
    }>;
}

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
    const params = await searchParams;

    return (
        <div className="flex-1 space-y-5">
            <div className="fi fi1">
                <PageHeader
                    title="Import History"
                    subtitle="View past bank statement imports and their status"
                    actions={
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            asChild
                        >
                            <Link href="/banking/import">
                                <Upload className="h-3.5 w-3.5" />
                                New Import
                            </Link>
                        </Button>
                    }
                />
            </div>

            <div className="fi fi2">
                <Suspense
                    key={`${params.status}-${params.sourceType}`}
                    fallback={<ImportHistorySkeleton />}
                >
                    <ImportHistoryContent filters={params} />
                </Suspense>
            </div>
        </div>
    );
}

async function ImportHistoryContent({
    filters,
}: {
    filters: { status?: string; sourceType?: string };
}) {
    try {
        const result = await listImports({
            status: filters.status as 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | undefined,
            sourceType: filters.sourceType as 'CSV' | 'PDF' | 'BANK_FEED' | 'API' | undefined,
        });

        return (
            <ImportHistoryClient
                batches={result.batches}
                hasMore={result.hasMore}
                nextCursor={result.nextCursor}
            />
        );
    } catch (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-2">Failed to load import history</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}

function ImportHistorySkeleton() {
    return (
        <div className="space-y-4">
            <div className="glass rounded-[14px] p-4">
                <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="glass rounded-[14px] overflow-hidden">
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
