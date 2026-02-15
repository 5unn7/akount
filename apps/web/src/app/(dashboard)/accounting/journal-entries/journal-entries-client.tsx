'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Plus,
    Check,
    Ban,
    Trash2,
    Loader2,
    FileText,
} from 'lucide-react';
import type {
    JournalEntry,
    JournalEntryStatus,
} from '@/lib/api/accounting';
import { formatAmount, formatDate } from '@/lib/api/accounting';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
// Status Badge
// ============================================================================

const STATUS_CONFIG: Record<
    JournalEntryStatus,
    { label: string; className: string }
> = {
    DRAFT: {
        label: 'Draft',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    },
    POSTED: {
        label: 'Posted',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    },
    VOIDED: {
        label: 'Voided',
        className: 'bg-red-500/15 text-red-400 border-red-500/20',
    },
    ARCHIVED: {
        label: 'Archived',
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    },
};

function StatusBadge({ status }: { status: JournalEntryStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
        >
            {config.label}
        </span>
    );
}

// ============================================================================
// Entry Detail (expandable)
// ============================================================================

function EntryDetail({
    entry,
    onApprove,
    onVoid,
    onDelete,
    isActing,
}: {
    entry: JournalEntry;
    onApprove: (id: string) => void;
    onVoid: (id: string) => void;
    onDelete: (id: string) => void;
    isActing: boolean;
}) {
    const totalDebit = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = entry.lines.reduce((s, l) => s + l.creditAmount, 0);

    return (
        <tr>
            <td colSpan={7} className="px-4 py-4 glass">
                <div className="space-y-3">
                    {/* Lines table */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                <th className="text-left pb-2 font-medium">Account</th>
                                <th className="text-right pb-2 font-medium">Debit</th>
                                <th className="text-right pb-2 font-medium">Credit</th>
                                <th className="text-left pb-2 pl-4 font-medium">Memo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entry.lines.map((line) => (
                                <tr
                                    key={line.id}
                                    className="border-t border-ak-border"
                                >
                                    <td className="py-2 text-sm">
                                        <span className="font-mono text-muted-foreground mr-2">
                                            {line.glAccount.code}
                                        </span>
                                        {line.glAccount.name}
                                    </td>
                                    <td className="py-2 text-right font-mono text-sm">
                                        {line.debitAmount > 0
                                            ? formatAmount(line.debitAmount)
                                            : '—'}
                                    </td>
                                    <td className="py-2 text-right font-mono text-sm">
                                        {line.creditAmount > 0
                                            ? formatAmount(line.creditAmount)
                                            : '—'}
                                    </td>
                                    <td className="py-2 pl-4 text-sm text-muted-foreground">
                                        {line.description || '—'}
                                    </td>
                                </tr>
                            ))}
                            {/* Totals */}
                            <tr className="border-t border-ak-border-2 font-semibold">
                                <td className="py-2 text-sm">Totals</td>
                                <td className="py-2 text-right font-mono text-sm">
                                    {formatAmount(totalDebit)}
                                </td>
                                <td className="py-2 text-right font-mono text-sm">
                                    {formatAmount(totalCredit)}
                                </td>
                                <td className="py-2 pl-4">
                                    {totalDebit === totalCredit ? (
                                        <span className="text-emerald-400 text-xs">
                                            Balanced
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs">
                                            Out of balance
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-ak-border">
                        {entry.status === 'DRAFT' && (
                            <>
                                <Button
                                    size="sm"
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                                    onClick={() => onApprove(entry.id)}
                                    disabled={isActing}
                                >
                                    {isActing ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                        <Check className="h-3 w-3 mr-1" />
                                    )}
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                    onClick={() => onDelete(entry.id)}
                                    disabled={isActing}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            </>
                        )}
                        {entry.status === 'POSTED' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                onClick={() => onVoid(entry.id)}
                                disabled={isActing}
                            >
                                <Ban className="h-3 w-3 mr-1" />
                                Void Entry
                            </Button>
                        )}
                        {entry.reversalOfId && (
                            <span className="text-xs text-muted-foreground">
                                Reversal of entry
                            </span>
                        )}
                        {entry.sourceType && (
                            <span className="text-xs text-muted-foreground ml-auto">
                                Source: {entry.sourceType}
                                {entry.sourceId ? ` #${entry.sourceId.slice(0, 8)}` : ''}
                            </span>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
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
    if (entries.length === 0 && !startDate && !endDate && statusFilter === 'all') {
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

