'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EntitySelector } from '@akount/ui/business';
import {
    formatReportDate,
    downloadReport,
    type GLLedgerReport,
    type GLLedgerEntry,
} from '@/lib/api/reports-client';
import { formatCurrency } from '@/lib/utils/currency';
import { loadMoreGLEntries } from './actions';

interface GLReportViewProps {
    initialData: GLLedgerReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
    entities?: Array<{ id: string; name: string }>;
}

export function GLReportView({ initialData, initialParams, error, entities = [] }: GLReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [glAccountId, setGlAccountId] = useState(initialParams.glAccountId || '');
    const [startDate, setStartDate] = useState(initialParams.startDate || '');
    const [endDate, setEndDate] = useState(initialParams.endDate || '');

    // Pagination state for "Load More"
    const [entries, setEntries] = useState<GLLedgerEntry[]>(initialData?.entries || []);
    const [nextCursor, setNextCursor] = useState(initialData?.nextCursor);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (glAccountId) params.append('glAccountId', glAccountId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        router.push(`/accounting/reports/general-ledger?${params.toString()}`);
    };

    const handleLoadMore = async () => {
        if (!nextCursor || !initialData || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const more = await loadMoreGLEntries({
                entityId: entityId,
                glAccountId: glAccountId,
                startDate: startDate,
                endDate: endDate,
                cursor: nextCursor,
                limit: 50,
            });

            setEntries((prev) => [...prev, ...more.entries]);
            setNextCursor(more.nextCursor);
        } catch {
            // Silently fail — user can retry
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-heading">General Ledger</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Detailed transaction history for any GL account with running balance
                </p>
            </div>

            {/* Controls */}
            <div className="glass rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2">
                        <Label htmlFor="entityId">Entity (required)</Label>
                        <EntitySelector
                            value={entityId}
                            onChange={setEntityId}
                            entities={entities}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="glAccountId">GL Account (required)</Label>
                        <Input
                            id="glAccountId"
                            placeholder="Account ID"
                            value={glAccountId}
                            onChange={(e) => setGlAccountId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button
                            onClick={handleGenerate}
                            className="w-full"
                            disabled={!entityId || !glAccountId || !startDate || !endDate}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </div>
                </div>
            </div>

            {/* Report Display */}
            {error && (
                <div className="glass rounded-xl p-6 border-destructive">
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            {!initialData && !error && (
                <div className="glass rounded-xl p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select an entity, GL account, and date range to view the general ledger
                    </p>
                </div>
            )}

            {initialData && (
                <div className="space-y-6">
                    {/* Report Header */}
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-heading font-medium">
                                    {initialData.accountCode} — {initialData.accountName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {initialData.entityName} &middot; {formatReportDate(initialData.startDate)} to {formatReportDate(initialData.endDate)}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => downloadReport('general-ledger', initialParams, 'csv')}
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Entries Table */}
                    <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-ak-border bg-ak-bg-3">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Entry #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Memo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Debit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Credit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ak-border">
                                {entries.map((entry: GLLedgerEntry) => (
                                    <tr key={entry.id} className="hover:bg-ak-bg-3 transition-colors">
                                        <td className="px-6 py-3 text-sm font-mono">
                                            {new Date(entry.date).toLocaleDateString('en-CA')}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-mono">{entry.entryNumber}</td>
                                        <td className="px-6 py-3 text-sm truncate max-w-[300px]">{entry.memo}</td>
                                        <td className="px-6 py-3 text-sm font-mono text-right">
                                            {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount, initialData.currency) : ''}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-mono text-right">
                                            {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount, initialData.currency) : ''}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-mono text-right font-medium">
                                            {formatCurrency(entry.runningBalance, initialData.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More */}
                    {nextCursor && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="gap-2"
                            >
                                {isLoadingMore ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                {isLoadingMore ? 'Loading...' : 'Load More Entries'}
                            </Button>
                        </div>
                    )}

                    {/* Entry Count */}
                    <p className="text-xs text-muted-foreground text-center">
                        Showing {entries.length} entries{nextCursor ? ' (more available)' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
