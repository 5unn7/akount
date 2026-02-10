'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ImportBatch } from '@/lib/api/imports';
import { formatImportStatus } from '@/lib/api/imports';
import { fetchImportBatches } from '@/app/(dashboard)/money-movement/imports/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    FileText,
    FileSpreadsheet,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
} from 'lucide-react';

interface ImportHistoryClientProps {
    batches: ImportBatch[];
    hasMore: boolean;
    nextCursor?: string;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
    CSV: FileSpreadsheet,
    PDF: FileText,
    BANK_FEED: FileText,
    API: FileText,
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
    PROCESSED: CheckCircle2,
    PROCESSING: Loader2,
    PENDING: Clock,
    FAILED: AlertCircle,
};

export function ImportHistoryClient({
    batches: initialBatches,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
}: ImportHistoryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [batches, setBatches] = useState(initialBatches);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const statusFilter = searchParams.get('status') || '';
    const sourceTypeFilter = searchParams.get('sourceType') || '';

    function handleFilterChange(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        const query = params.toString();
        router.push(`/money-movement/imports${query ? `?${query}` : ''}`);
    }

    async function handleLoadMore() {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const result = await fetchImportBatches({
                cursor: nextCursor,
                status: statusFilter as ImportBatch['status'] | undefined,
                sourceType: sourceTypeFilter as ImportBatch['sourceType'] | undefined,
            });
            setBatches((prev) => [...prev, ...result.batches]);
            setHasMore(result.hasMore);
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoadingMore(false);
        }
    }

    function formatDateTime(isoDate: string): string {
        return new Date(isoDate).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function formatFileSize(rows: number): string {
        return `${rows} row${rows !== 1 ? 's' : ''}`;
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap">Status</label>
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(v) => handleFilterChange('status', v)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="PROCESSED">Complete</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap">Source</label>
                            <Select
                                value={sourceTypeFilter || 'all'}
                                onValueChange={(v) => handleFilterChange('sourceType', v)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="CSV">CSV</SelectItem>
                                    <SelectItem value="PDF">PDF</SelectItem>
                                    <SelectItem value="BANK_FEED">Bank Feed</SelectItem>
                                    <SelectItem value="API">API</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Batches table */}
            {batches.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Import Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Rows</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => {
                                    const statusInfo = formatImportStatus(batch.status);
                                    const SourceIcon = SOURCE_ICONS[batch.sourceType] || FileText;
                                    const StatusIcon = STATUS_ICONS[batch.status] || Clock;

                                    return (
                                        <TableRow key={batch.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <SourceIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium text-sm truncate max-w-[200px]">
                                                        {batch.sourceFileName}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {batch.sourceType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateTime(batch.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {formatFileSize(batch.totalRows)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusInfo.variant} className="gap-1">
                                                    <StatusIcon
                                                        className={`h-3 w-3 ${batch.status === 'PROCESSING' ? 'animate-spin' : ''}`}
                                                    />
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                    {batch.processedRows > 0 && (
                                                        <span>{batch.processedRows} processed</span>
                                                    )}
                                                    {batch.duplicateRows > 0 && (
                                                        <span className="text-yellow-600">
                                                            {batch.duplicateRows} dupes
                                                        </span>
                                                    )}
                                                    {batch.errorRows > 0 && (
                                                        <span className="text-destructive">
                                                            {batch.errorRows} errors
                                                        </span>
                                                    )}
                                                    {batch.errorDetails && (
                                                        <span
                                                            className="text-destructive truncate max-w-[150px]"
                                                            title={batch.errorDetails}
                                                        >
                                                            {batch.errorDetails}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {hasMore && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-2">No imports found</p>
                        <p className="text-sm text-muted-foreground">
                            {statusFilter || sourceTypeFilter
                                ? 'Try adjusting your filters'
                                : 'Upload a bank statement to get started'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
