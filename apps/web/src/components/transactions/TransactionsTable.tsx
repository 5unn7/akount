'use client';

import Link from 'next/link';
import { type Transaction, formatAmount, formatDate } from '@/lib/api/transactions.types';
import type { Category } from '@/lib/api/categories';
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
import { ArrowUpRight, ArrowDownRight, BookOpen, RefreshCw, AlertTriangle } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { cn } from '@/lib/utils';

interface TransactionsTableProps {
    transactions: Transaction[];
    selectedIds?: Set<string>;
    onSelectionChange?: (selectedIds: Set<string>) => void;
    onPostTransaction?: (transactionId: string) => void;
    categories?: Category[];
    onCategoryChange?: (transactionId: string, categoryId: string | null) => void;
    onCreateCategory?: (name: string, type: 'INCOME' | 'EXPENSE' | 'TRANSFER') => void;
    showRunningBalance?: boolean;
    recurringIds?: Set<string>;
    anomalyIds?: Set<string>;
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
                href={`/accounting/journal-entries/${journalEntryId}`}
                className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-micro font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <BookOpen className="h-3 w-3" />
                Posted
            </Link>
        );
    }

    return (
        <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-micro font-semibold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border-zinc-500/20">
            Unposted
        </span>
    );
}

export function TransactionsTable({
    transactions,
    selectedIds,
    onSelectionChange,
    onPostTransaction,
    categories,
    onCategoryChange,
    onCreateCategory,
    showRunningBalance,
    recurringIds,
    anomalyIds,
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
                                        aria-label="Select all transactions"
                                    />
                                </TableHead>
                            )}
                            <TableHead variant="label">
                                Date
                            </TableHead>
                            <TableHead variant="label">
                                Description
                            </TableHead>
                            <TableHead variant="label">
                                Account
                            </TableHead>
                            <TableHead variant="label">
                                Category
                            </TableHead>
                            <TableHead variant="label">
                                Source
                            </TableHead>
                            <TableHead variant="label">
                                GL Status
                            </TableHead>
                            <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                Amount
                            </TableHead>
                            {showRunningBalance && (
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Balance
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction, idx) => {
                            const isIncome = transaction.amount > 0;
                            const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
                            const sourceStyle = SOURCE_BADGE_STYLES[transaction.sourceType] || SOURCE_BADGE_STYLES.MANUAL;
                            const isSelected = selectedIds?.has(transaction.id);
                            const isUncategorized = !transaction.categoryId;
                            const isRecurring = recurringIds?.has(transaction.id);
                            const isAnomaly = anomalyIds?.has(transaction.id);

                            return (
                                <TableRow
                                    key={transaction.id}
                                    className={cn(
                                        'border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors',
                                        isSelected && 'bg-ak-pri-dim',
                                        isUncategorized && 'border-l-2 border-l-primary/40 bg-primary/[0.02]',
                                        isAnomaly && 'border-l-2 border-l-ak-red/60 bg-ak-red/[0.02]',
                                    )}
                                >
                                    {selectable && (
                                        <TableCell className="pl-4">
                                            <input
                                                type="checkbox"
                                                checked={!!isSelected}
                                                onChange={() => toggleOne(transaction.id)}
                                                className="h-4 w-4 rounded border-ak-border-3 bg-transparent accent-primary cursor-pointer"
                                                aria-label={`Select transaction ${transaction.description}`}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="text-sm">
                                        {formatDate(transaction.date)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                {isRecurring && (
                                                    <RefreshCw className="h-3 w-3 text-ak-teal shrink-0" />
                                                )}
                                                {isAnomaly && (
                                                    <AlertTriangle className="h-3 w-3 text-ak-red shrink-0" />
                                                )}
                                                <span className="text-sm font-medium">
                                                    {transaction.description}
                                                </span>
                                            </div>
                                            <span className="text-micro text-muted-foreground">
                                                {transaction.account?.name ?? ''}{transaction.account?.name && transaction.sourceType ? ' · ' : ''}{transaction.sourceType}
                                            </span>
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
                                        {categories && onCategoryChange ? (
                                            <CategorySelector
                                                currentCategory={transaction.category}
                                                categories={categories}
                                                onSelect={(categoryId) =>
                                                    onCategoryChange(transaction.id, categoryId)
                                                }
                                                onCreateNew={onCreateCategory}
                                            />
                                        ) : transaction.category ? (
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
                                                className="inline-flex items-center rounded-lg border px-2 py-0.5 text-micro font-semibold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border-zinc-500/20 hover:bg-primary/15 hover:text-primary hover:border-primary/20 transition-colors cursor-pointer"
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
                                    {showRunningBalance && (
                                        <TableCell className="text-right">
                                            <span className="font-mono text-sm text-muted-foreground">
                                                &mdash;
                                            </span>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
