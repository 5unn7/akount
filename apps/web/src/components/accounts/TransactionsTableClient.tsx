'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/lib/api/accounts';
import { formatCurrency } from '@/lib/utils/currency';
import { TransactionsToolbar, type TabFilter } from './TransactionsToolbar';

const PAGE_SIZE = 25;

const SOURCE_LABELS: Record<string, string> = {
    MANUAL: 'Manual Entry',
    CSV: 'CSV Import',
    PDF: 'PDF Import',
    BANK_FEED: 'Bank Feed',
    API: 'API',
    INVOICE: 'Invoice',
    BILL: 'Bill',
    TRANSFER: 'Transfer',
};

interface TransactionsTableClientProps {
    transactions: Transaction[];
    currency: string;
    hasMore: boolean;
    totalCount: number;
}

export function TransactionsTableClient({
    transactions,
    currency,
    hasMore,
    totalCount,
}: TransactionsTableClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        let result = transactions;

        // Tab filter
        if (activeTab === 'unreconciled') {
            result = result.filter((t) => !t.journalEntryId);
        } else if (activeTab === 'income') {
            result = result.filter((t) => t.amount > 0);
        } else if (activeTab === 'expense') {
            result = result.filter((t) => t.amount < 0);
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((t) =>
                t.description.toLowerCase().includes(q) ||
                (t.notes && t.notes.toLowerCase().includes(q))
            );
        }

        return result;
    }, [transactions, activeTab, searchQuery]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageTransactions = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const showingStart = filtered.length > 0 ? page * PAGE_SIZE + 1 : 0;
    const showingEnd = Math.min((page + 1) * PAGE_SIZE, filtered.length);

    return (
        <Card className="glass rounded-[14px] overflow-hidden">
            <CardContent className="p-0">
                <TransactionsToolbar
                    searchQuery={searchQuery}
                    onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
                    activeTab={activeTab}
                    onTabChange={(tab) => { setActiveTab(tab); setPage(0); }}
                />

                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-ak-border hover:bg-transparent">
                            <TableHead className="text-micro uppercase tracking-wider text-muted-foreground w-[100px]">
                                Date
                            </TableHead>
                            <TableHead variant="label">
                                Description
                            </TableHead>
                            <TableHead variant="label">
                                Category
                            </TableHead>
                            <TableHead className="text-micro uppercase tracking-wider text-muted-foreground text-right">
                                Amount
                            </TableHead>
                            <TableHead className="text-micro uppercase tracking-wider text-muted-foreground text-right w-[120px]">
                                Balance
                            </TableHead>
                            <TableHead className="text-micro uppercase tracking-wider text-muted-foreground text-center w-[60px]">
                                Status
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageTransactions.map((txn) => (
                            <TransactionRow
                                key={txn.id}
                                transaction={txn}
                                currency={currency}
                            />
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-ak-border">
                    <p className="text-xs text-muted-foreground">
                        Showing {showingStart}-{showingEnd} of {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                        {hasMore && ' (more available)'}
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-ak-bg-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-ak-bg-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface TransactionRowProps {
    transaction: Transaction;
    currency: string;
}

function TransactionRow({ transaction, currency }: TransactionRowProps) {
    const isIncome = transaction.amount > 0;
    const isReconciled = !!transaction.journalEntryId;
    const sourceLabel = SOURCE_LABELS[transaction.sourceType] || transaction.sourceType;

    return (
        <TableRow
            className={`border-b border-ak-border hover:bg-ak-bg-3 transition-colors ${
                !isReconciled ? 'border-l-2 border-l-primary/40' : ''
            }`}
        >
            <TableCell className="text-sm text-muted-foreground">
                {format(new Date(transaction.date), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{transaction.description}</span>
                    <span className="text-micro text-muted-foreground">{sourceLabel}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5">
                    <div
                        className={`h-2 w-2 rounded-full ${
                            transaction.categoryId ? 'bg-ak-blue' : 'bg-zinc-600'
                        }`}
                    />
                    <span className="text-xs text-muted-foreground">
                        {transaction.categoryId ? 'Categorized' : 'Uncategorized'}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <span
                    className={`font-mono font-medium text-sm ${
                        isIncome ? 'text-ak-green' : 'text-destructive'
                    }`}
                >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount), currency)}
                </span>
            </TableCell>
            <TableCell className="text-right">
                <span className="font-mono text-sm text-muted-foreground">
                    {formatCurrency(transaction.runningBalance, currency)}
                </span>
            </TableCell>
            <TableCell className="text-center">
                {isReconciled ? (
                    <CheckCircle2 className="h-4 w-4 text-ak-green mx-auto" />
                ) : (
                    <Circle className="h-4 w-4 text-primary/50 mx-auto" />
                )}
            </TableCell>
        </TableRow>
    );
}
