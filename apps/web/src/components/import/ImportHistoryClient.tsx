'use client';
import { formatDate, formatDateTime } from '@/lib/utils/date';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ImportBatch } from '@/lib/api/imports';
import { fetchImportBatches } from '@/app/(dashboard)/banking/imports/actions';
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
    Upload,
    ChevronRight,
} from 'lucide-react';

interface ImportHistoryClientProps {
    batches: ImportBatch[];
    hasMore: boolean;
    nextCursor?: string;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
    CSV: FileSpreadsheet,
    XLSX: FileSpreadsheet,
    PDF: FileText,
    BANK_FEED: FileText,
    API: FileText,
};

const STATUS_CONFIG: Record<string, {
    icon: typeof CheckCircle2;
    style: string;
    label: string;
}> = {
    PROCESSED: {
        icon: CheckCircle2,
        style: 'bg-ak-green/10 text-ak-green border-ak-green/20',
        label: 'Complete',
    },
    PROCESSING: {
        icon: Loader2,
        style: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
        label: 'Processing',
    },
    PENDING: {
        icon: Clock,
        style: 'bg-primary/10 text-primary border-primary/20',
        label: 'Pending',
    },
    FAILED: {
        icon: AlertCircle,
        style: 'bg-ak-red/10 text-ak-red border-ak-red/20',
        label: 'Failed',
    },
};

const SOURCE_BADGE_STYLES: Record<string, string> = {
    CSV: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
    XLSX: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    PDF: 'bg-ak-purple/10 text-ak-purple border-ak-purple/20',
    BANK_FEED: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    API: 'bg-primary/10 text-primary border-primary/20',
};

export function ImportHistoryClient({
    batches: initialBatches,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
}: ImportHistoryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

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
        router.push(`/banking/imports${query ? `?${query}` : ''}`);
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


    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap">
                                Status
                            </label>
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(v) => handleFilterChange('status', v)}
                            >
                                <SelectTrigger className="w-[150px] glass-2 rounded-lg border-ak-border focus:ring-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="PROCESSED">Complete</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap">
                                Source
                            </label>
                            <Select
                                value={sourceTypeFilter || 'all'}
                                onValueChange={(v) => handleFilterChange('sourceType', v)}
                            >
                                <SelectTrigger className="w-[150px] glass-2 rounded-lg border-ak-border focus:ring-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="CSV">CSV</SelectItem>
                                    <SelectItem value="XLSX">Excel</SelectItem>
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
                <Card className="glass rounded-[14px]">
                    <CardHeader>
                        <CardTitle className="font-heading font-normal text-base">Import Batches</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-ak-border hover:bg-transparent">
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">File</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Source</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Rows</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => {
                                    const statusConfig = STATUS_CONFIG[batch.status] || STATUS_CONFIG.PENDING;
                                    const StatusIcon = statusConfig.icon;
                                    const SourceIcon = SOURCE_ICONS[batch.sourceType] || FileText;
                                    const sourceStyle = SOURCE_BADGE_STYLES[batch.sourceType] || SOURCE_BADGE_STYLES.CSV;

                                    return (
                                        <TableRow
                                            key={batch.id}
                                            className="border-b border-ak-border hover:bg-ak-bg-3 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/banking/imports/${batch.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <SourceIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium text-sm truncate max-w-[200px]">
                                                        {batch.sourceFileName}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-xs ${sourceStyle}`}>
                                                    {batch.sourceType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateTime(batch.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {batch.totalRows}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`gap-1 text-xs ${statusConfig.style}`}>
                                                    <StatusIcon
                                                        className={`h-3 w-3 ${batch.status === 'PROCESSING' ? 'animate-spin' : ''}`}
                                                    />
                                                    {statusConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                    {batch.processedRows > 0 && (
                                                        <span className="text-ak-green">{batch.processedRows} ok</span>
                                                    )}
                                                    {batch.duplicateRows > 0 && (
                                                        <span className="text-primary">{batch.duplicateRows} dup</span>
                                                    )}
                                                    {batch.errorRows > 0 && (
                                                        <span className="text-ak-red">{batch.errorRows} err</span>
                                                    )}
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {hasMore && (
                        <div className="flex justify-center p-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
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
                </Card>
            ) : (
                <Card className="glass rounded-[14px]">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-primary/10 mb-4">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-lg font-heading font-normal mb-2">
                            No imports yet
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            {statusFilter || sourceTypeFilter
                                ? 'Try adjusting your filters'
                                : 'Upload a bank statement to get started'}
                        </p>
                        <Button
                            className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            asChild
                        >
                            <Link href="/banking/import">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Statement
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
