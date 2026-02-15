'use client';

import Link from 'next/link';
import { type Transaction, formatAmount, formatDate } from '@/lib/api/transactions.types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, BookOpen } from 'lucide-react';

interface TransactionsTableProps {
    transactions: Transaction[];
    selectedIds?: Set<string>;
    onSelectionChange?: (selectedIds: Set<string>) => void;
    onPostTransaction?: (transactionId: string) => void;
}

const SOURCE_BADGE_STYLES: Record<string, string> = {
    MANUAL: 'bg-ak-bg-3 text-muted-foreground border-ak-border',
    CSV: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
    PDF: 'bg-secondary/10 text-secondary border-secondary/20',
    BANK_FEED: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    API: 'bg-primary/10 text-primary border-primary/20',
};

function PostingStatusBadge({
    journalEntryId,
}: {
    journalEntryId?: string | null;
}) {
    if (journalEntryId) {
        return (
            <Link
                href={`/accounting/journal-entries?status=POSTED`}
                className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <BookOpen className="h-3 w-3" />
                Posted
            </Link>
        );
    }

    return (
        <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border-zinc-500/20">
            Unposted
        </span>
    );
}

export function TransactionsTable({
    transactions,
    selectedIds,
    onSelectionChange,
    onPostTransaction,
}: TransactionsTableProps) {
    const selectable = !!onSelectionChange;
    const allSelected = selectable && transactions.length > 0 && transactions.every(t => selectedIds?.has(t.id));
    const someSelected = selectable && transactions.some(t => selectedIds?.has(t.id)) && !allSelected;

    function toggleAll() {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(transactions.map(t => t.id)));
        }
    }

    function toggleOne(id: string) {
        if (!onSelectionChange || !selectedIds) return;
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        onSelectionChange(next);
    }

    return (
        <Card className="glass rounded-[14px]">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-ak-border hover:bg-transparent">
                            {selectable && (
                                <TableHead className="w-10 pl-4">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = !!someSelected; }}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-ak-border-3 bg-transparent accent-primary cursor-pointer"
                                    />
                                </TableHead>
                            )}
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Date
                            </TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Description
                            </TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Account
                            </TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Category
                            </TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Source
                            </TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                GL Status
                            </TableHead>
                            <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                Amount
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {
                            const isIncome = transaction.amount > 0;
                            const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
                            const sourceStyle = SOURCE_BADGE_STYLES[transaction.sourceType] || SOURCE_BADGE_STYLES.MANUAL;
                            const isSelected = selectedIds?.has(transaction.id);

                            return (
                                <TableRow
                                    key={transaction.id}
                                    className={`border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors ${
                                        isSelected ? 'bg-ak-pri-dim' : ''
                                    }`}
                                >
                                    {selectable && (
                                        <TableCell className="pl-4">
                                            <input
                                                type="checkbox"
                                                checked={!!isSelected}
                                                onChange={() => toggleOne(transaction.id)}
                                                className="h-4 w-4 rounded border-ak-border-3 bg-transparent accent-primary cursor-pointer"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="text-sm">
                                        {formatDate(transaction.date)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {transaction.description}
                                            </span>
                                            {transaction.notes && (
                                                <span className="text-xs text-muted-foreground">
                                                    {transaction.notes}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {transaction.account ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm">
                                                    {transaction.account.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {transaction.account.type}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">&mdash;</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.category ? (
                                            <Badge className="text-xs bg-ak-bg-3 text-foreground border-ak-border">
                                                {transaction.category.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Uncategorized
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs ${sourceStyle}`}>
                                            {transaction.sourceType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {transaction.journalEntryId ? (
                                            <PostingStatusBadge
                                                journalEntryId={transaction.journalEntryId}
                                            />
                                        ) : onPostTransaction ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPostTransaction(transaction.id);
                                                }}
                                                className="inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border-zinc-500/20 hover:bg-primary/15 hover:text-primary hover:border-primary/20 transition-colors cursor-pointer"
                                            >
                                                Unposted
                                            </button>
                                        ) : (
                                            <PostingStatusBadge
                                                journalEntryId={null}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Icon
                                                className={`h-4 w-4 ${
                                                    isIncome ? 'text-ak-green' : 'text-ak-red'
                                                }`}
                                            />
                                            <span
                                                className={`font-mono font-medium ${
                                                    isIncome ? 'text-ak-green' : 'text-ak-red'
                                                }`}
                                            >
                                                {formatAmount(
                                                    Math.abs(transaction.amount),
                                                    transaction.currency
                                                )}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
