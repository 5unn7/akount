'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Transaction } from '@/lib/api/transactions';
import type { Account } from '@/lib/api/accounts';
import { TransactionsTable } from './TransactionsTable';
import { TransactionsFilters } from './TransactionsFilters';
import { BulkActionBar } from './BulkActionBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, FileText } from 'lucide-react';
import {
    fetchMoreTransactions,
    bulkCategorizeAction,
    bulkDeleteAction,
} from '@/app/(dashboard)/banking/transactions/actions';

interface TransactionsListClientProps {
    transactions: Transaction[];
    hasMore: boolean;
    nextCursor?: string;
    accounts: Account[];
}

export function TransactionsListClient({
    transactions: initialTransactions,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    accounts,
}: TransactionsListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [transactions, setTransactions] = useState(initialTransactions);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const accountId = searchParams.get('accountId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    function handleFilterChange(filters: {
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const params = new URLSearchParams();
        if (filters.accountId) params.set('accountId', filters.accountId);
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        const query = params.toString();
        router.push(`/banking/transactions${query ? `?${query}` : ''}`);
    }

    function handleClearFilters() {
        router.push('/banking/transactions');
    }

    async function handleLoadMore() {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const result = await fetchMoreTransactions({
                accountId,
                startDate,
                endDate,
                cursor: nextCursor,
            });
            setTransactions((prev) => [...prev, ...result.transactions]);
            setHasMore(result.hasMore);
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoadingMore(false);
        }
    }

    async function handleBulkUncategorize() {
        const ids = Array.from(selectedIds);
        await bulkCategorizeAction(ids, null);
        // Update local state: clear category on affected transactions
        setTransactions((prev) =>
            prev.map((t) =>
                selectedIds.has(t.id) ? { ...t, categoryId: undefined, category: undefined } : t
            )
        );
        setSelectedIds(new Set());
    }

    async function handleBulkDelete() {
        const ids = Array.from(selectedIds);
        await bulkDeleteAction(ids);
        // Remove deleted transactions from local state
        setTransactions((prev) => prev.filter((t) => !selectedIds.has(t.id)));
        setSelectedIds(new Set());
    }

    if (transactions.length === 0) {
        return (
            <div className="space-y-4">
                <TransactionsFilters
                    accounts={accounts}
                    selectedAccountId={accountId}
                    startDate={startDate}
                    endDate={endDate}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
                <Card className="glass rounded-[14px]">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-[#F59E0B]/10 mb-4">
                            <FileText className="h-8 w-8 text-[#F59E0B]" />
                        </div>
                        <p className="text-lg font-heading font-normal mb-2">
                            No transactions yet
                        </p>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                            {accountId || startDate || endDate
                                ? 'No transactions match your filters. Try adjusting them or import a bank statement.'
                                : 'Upload your first bank statement to start tracking transactions.'}
                        </p>
                        <Button
                            className="rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-medium"
                            asChild
                        >
                            <Link href="/banking/import">
                                <Upload className="h-4 w-4 mr-2" />
                                Import Statement
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TransactionsFilters
                accounts={accounts}
                selectedAccountId={accountId}
                startDate={startDate}
                endDate={endDate}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            <TransactionsTable
                transactions={transactions}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />

            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        className="rounded-lg border-white/[0.09] hover:bg-white/[0.04]"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            `Load More (${transactions.length} shown)`
                        )}
                    </Button>
                </div>
            )}

            <BulkActionBar
                selectedCount={selectedIds.size}
                onClearSelection={() => setSelectedIds(new Set())}
                onBulkUncategorize={handleBulkUncategorize}
                onBulkDelete={handleBulkDelete}
            />
        </div>
    );
}
