'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ImportBatch } from '@/lib/api/imports';
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
        style: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
        label: 'Complete',
    },
    PROCESSING: {
        icon: Loader2,
        style: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
        label: 'Processing',
    },
    PENDING: {
        icon: Clock,
        style: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
        label: 'Pending',
    },
    FAILED: {
        icon: AlertCircle,
        style: 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20',
        label: 'Failed',
    },
};

const SOURCE_BADGE_STYLES: Record<string, string> = {
    CSV: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
    PDF: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20',
    BANK_FEED: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
    API: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
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
                                <SelectTrigger className="w-[150px] glass-2 rounded-lg border-white/[0.06] focus:ring-[#F59E0B]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-white/[0.09]">
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
                                <SelectTrigger className="w-[150px] glass-2 rounded-lg border-white/[0.06] focus:ring-[#F59E0B]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-white/[0.09]">
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
                <Card className="glass rounded-[14px]">
                    <CardHeader>
                        <CardTitle className="font-heading font-normal text-base">Import Batches</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
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
                                            className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            onClick={() => router.push(`/money-movement/imports/${batch.id}`)}
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
                                                        <span className="text-[#34D399]">{batch.processedRows} ok</span>
                                                    )}
                                                    {batch.duplicateRows > 0 && (
                                                        <span className="text-[#F59E0B]">{batch.duplicateRows} dup</span>
                                                    )}
                                                    {batch.errorRows > 0 && (
                                                        <span className="text-[#F87171]">{batch.errorRows} err</span>
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
                                className="rounded-lg border-white/[0.09] hover:bg-white/[0.04]"
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
                        <div className="p-4 rounded-full bg-[#F59E0B]/10 mb-4">
                            <FileText className="h-8 w-8 text-[#F59E0B]" />
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
                            className="rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-medium"
                            asChild
                        >
                            <Link href="/money-movement/import">
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
