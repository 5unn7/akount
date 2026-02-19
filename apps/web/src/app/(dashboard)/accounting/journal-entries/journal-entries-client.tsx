'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Plus,
    Loader2,
    FileText,
} from 'lucide-react';
import type {
    JournalEntry,
    JournalEntryStatus,
} from '@/lib/api/accounting';
import { formatAmount, formatDate } from '@/lib/api/transactions.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    fetchJournalEntries,
    approveEntryAction,
    voidEntryAction,
    deleteEntryAction,
} from './actions';
import { StatusBadge, EntryDetail } from './journal-entry-detail';

// ============================================================================
// Types
// ============================================================================

interface JournalEntriesClientProps {
    entries: JournalEntry[];
    hasMore: boolean;
    nextCursor?: string;
    entityId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function JournalEntriesClient({
    entries: initialEntries,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    entityId,
}: JournalEntriesClientProps) {
    const [entries, setEntries] = useState(initialEntries);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isActing, setIsActing] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    async function loadMore() {
        if (!nextCursor || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const result = await fetchJournalEntries({
                entityId,
                cursor: nextCursor,
                status: statusFilter !== 'all' ? (statusFilter as JournalEntryStatus) : undefined,
                sourceType: sourceTypeFilter !== 'all' ? sourceTypeFilter : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            setEntries((prev) => [...prev, ...result.entries]);
            setHasMore(result.hasMore);
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoadingMore(false);
        }
    }

    async function handleApprove(id: string) {
        setIsActing(true);
        try {
            const updated = await approveEntryAction(id);
            setEntries((prev) =>
                prev.map((e) => (e.id === updated.id ? updated : e))
            );
        } finally {
            setIsActing(false);
        }
    }

    async function handleVoid(id: string) {
        setIsActing(true);
        try {
            const result = await voidEntryAction(id);
            setEntries((prev) =>
                prev.map((e) => (e.id === result.original.id ? result.original : e))
            );
            // Add reversal to the list
            setEntries((prev) => [result.reversal, ...prev]);
        } finally {
            setIsActing(false);
        }
    }

    async function handleDelete(id: string) {
        setIsActing(true);
        try {
            await deleteEntryAction(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
            setExpandedId(null);
        } finally {
            setIsActing(false);
        }
    }

    // Empty state
    if (entries.length === 0 && !startDate && !endDate && statusFilter === 'all' && sourceTypeFilter === 'all') {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                        <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-heading font-normal mb-2">
                        No journal entries yet
                    </p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        Create your first manual journal entry or post transactions from the banking module.
                    </p>
                    <Button
                        className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        asChild
                    >
                        <Link href="/accounting/journal-entries/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Journal Entry
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 rounded-lg border-ak-border-2 glass">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="POSTED">Posted</SelectItem>
                        <SelectItem value="VOIDED">Voided</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                    <SelectTrigger className="w-40 rounded-lg border-ak-border-2 glass">
                        <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                        <SelectItem value="BILL">Bill</SelectItem>
                        <SelectItem value="PAYMENT">Payment</SelectItem>
                        <SelectItem value="BANK_FEED">Bank Feed</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                    className="w-40 rounded-lg border-ak-border-2 glass"
                />
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                    className="w-40 rounded-lg border-ak-border-2 glass"
                />

                <div className="flex-1" />

                <Button
                    className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                    asChild
                >
                    <Link href="/accounting/journal-entries/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Entry
                    </Link>
                </Button>
            </div>

            {/* Table */}
            <Card className="glass rounded-[14px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-ak-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-4 py-3 font-medium w-8" />
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Entry #</th>
                                <th className="px-4 py-3 font-medium">Memo</th>
                                <th className="px-4 py-3 font-medium">Source</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => {
                                const isExpanded = expandedId === entry.id;
                                const totalDebit = entry.lines.reduce(
                                    (s, l) => s + l.debitAmount,
                                    0
                                );

                                return (
                                    <React.Fragment key={entry.id}>
                                        <tr
                                            className={`border-b border-ak-border hover:bg-ak-bg-3 cursor-pointer transition-colors ${
                                                entry.status === 'VOIDED'
                                                    ? 'opacity-50 line-through decoration-red-400/40'
                                                    : ''
                                            }`}
                                            onClick={() =>
                                                setExpandedId(
                                                    isExpanded ? null : entry.id
                                                )
                                            }
                                        >
                                            <td className="px-4 py-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm">
                                                JE-{String(entry.entryNumber).padStart(3, '0')}
                                            </td>
                                            <td className="px-4 py-3 text-sm max-w-[240px] truncate">
                                                {entry.memo}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.sourceType ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <FileText className="h-3 w-3" />
                                                        {entry.sourceType}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Manual
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={entry.status} />
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-sm">
                                                {formatAmount(totalDebit)}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <EntryDetail
                                                entry={entry}
                                                onApprove={handleApprove}
                                                onVoid={handleVoid}
                                                onDelete={handleDelete}
                                                isActing={isActing}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Load more */}
            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            `Load More (${entries.length} shown)`
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
