import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { listImports } from '@/lib/api/imports';
import { ImportHistoryClient } from '@/components/import/ImportHistoryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Import History
                    </h2>
                    <p className="text-muted-foreground">
                        View past bank statement imports and their status
                    </p>
                </div>
                <Button asChild>
                    <Link href="/money-movement/import">
                        <Upload className="h-4 w-4 mr-2" />
                        New Import
                    </Link>
                </Button>
            </div>

            <Suspense
                key={`${params.status}-${params.sourceType}`}
                fallback={<ImportHistorySkeleton />}
            >
                <ImportHistoryContent filters={params} />
            </Suspense>
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
            <Card>
                <CardContent className="pt-6">
                    <div className="h-10 w-[300px] bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
            <div className="rounded-md border">
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-12 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-12 flex-1 bg-muted animate-pulse rounded" />
                            <div className="h-12 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-12 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-12 w-24 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
