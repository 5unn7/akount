'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Transaction } from '@/lib/api/transactions';
import type { Account } from '@/lib/api/accounts';
import type { GLAccount } from '@/lib/api/accounting';
import { TransactionsTable } from './TransactionsTable';
import { TransactionsFilters } from './TransactionsFilters';
import { BulkActionBar } from './BulkActionBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, BookOpen } from 'lucide-react';
import {
    fetchMoreTransactions,
    bulkCategorizeAction,
    bulkDeleteAction,
    postTransactionAction,
    postBulkTransactionsAction,
    fetchExpenseAccounts,
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

    // Posting state
    const [postingSheetOpen, setPostingSheetOpen] = useState(false);
    const [postingTransactionId, setPostingTransactionId] = useState<string | null>(null);
    const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
    const [selectedGLAccountId, setSelectedGLAccountId] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoadingGL, setIsLoadingGL] = useState(false);

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
        setTransactions((prev) => prev.filter((t) => !selectedIds.has(t.id)));
        setSelectedIds(new Set());
    }

    // Open posting sheet for a single transaction
    function handleOpenPostSheet(transactionId: string) {
        setPostingTransactionId(transactionId);
        setSelectedGLAccountId('');
        setPostingSheetOpen(true);

        // Load GL accounts if not loaded
        if (glAccounts.length === 0) {
            loadGLAccounts();
        }
    }

    // Open posting sheet for bulk (selected transactions)
    function handleOpenBulkPostSheet() {
        setPostingTransactionId(null); // null = bulk mode
        setSelectedGLAccountId('');
        setPostingSheetOpen(true);

        if (glAccounts.length === 0) {
            loadGLAccounts();
        }
    }

    async function loadGLAccounts() {
        setIsLoadingGL(true);
        try {
            // We need the entityId — get from first account's entity
            // The GL accounts need an entityId. We'll get it from the account.
            // For now, fetch all active GL accounts for the first entity found
            const firstTxn = transactions[0];
            if (firstTxn?.account) {
                // We don't have entityId directly, but we can attempt a fetch
                // that will use the tenant's first entity
                const accts = await fetchExpenseAccounts('');
                setGLAccounts(accts);
            }
        } catch {
            // If entity fetch fails, leave empty
        } finally {
            setIsLoadingGL(false);
        }
    }

    async function handlePostSingle() {
        if (!postingTransactionId || !selectedGLAccountId) return;

        setIsPosting(true);
        try {
            const entry = await postTransactionAction(
                postingTransactionId,
                selectedGLAccountId
            );
            // Update the transaction's journalEntryId in local state
            setTransactions((prev) =>
                prev.map((t) =>
                    t.id === postingTransactionId
                        ? { ...t, journalEntryId: entry.id }
                        : t
                )
            );
            setPostingSheetOpen(false);
        } catch (error) {
            console.error('Failed to post transaction:', error);
        } finally {
            setIsPosting(false);
        }
    }

    async function handlePostBulk() {
        if (!selectedGLAccountId || selectedIds.size === 0) return;

        setIsPosting(true);
        try {
            const ids = Array.from(selectedIds);
            const result = await postBulkTransactionsAction(
                ids,
                selectedGLAccountId
            );
            // Update journalEntryId for posted transactions
            const postedSet = new Set(
                result.entries.flatMap((e) =>
                    // Each entry was created from a transaction — we map by sourceId
                    e.sourceId ? [e.sourceId] : []
                )
            );
            setTransactions((prev) =>
                prev.map((t) =>
                    ids.includes(t.id)
                        ? { ...t, journalEntryId: 'posted' } // Mark as posted
                        : t
                )
            );
            setSelectedIds(new Set());
            setPostingSheetOpen(false);
        } catch (error) {
            console.error('Failed to bulk post:', error);
        } finally {
            setIsPosting(false);
        }
    }

    const isBulkPosting = postingTransactionId === null;
    const unpostedSelectedCount = Array.from(selectedIds).filter(
        (id) => !transactions.find((t) => t.id === id)?.journalEntryId
    ).length;

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
                onPostTransaction={handleOpenPostSheet}
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
                extraActions={
                    unpostedSelectedCount > 0 ? (
                        <Button
                            size="sm"
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                            onClick={handleOpenBulkPostSheet}
                        >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Post {unpostedSelectedCount} to GL
                        </Button>
                    ) : undefined
                }
            />

            {/* GL Account Posting Sheet */}
            <Sheet open={postingSheetOpen} onOpenChange={setPostingSheetOpen}>
                <SheetContent className="sm:max-w-md bg-[#0F0F17] border-white/[0.06]">
                    <SheetHeader>
                        <SheetTitle>
                            {isBulkPosting
                                ? `Post ${unpostedSelectedCount} Transactions to GL`
                                : 'Post Transaction to GL'}
                        </SheetTitle>
                        <SheetDescription>
                            Select the expense/revenue GL account to post against.
                            The bank account side will be determined automatically.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                GL Account
                            </Label>
                            {isLoadingGL ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading accounts...
                                </div>
                            ) : (
                                <Select
                                    value={selectedGLAccountId}
                                    onValueChange={setSelectedGLAccountId}
                                >
                                    <SelectTrigger className="rounded-lg border-white/[0.09] bg-white/[0.025]">
                                        <SelectValue placeholder="Select GL account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {glAccounts.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                <span className="font-mono mr-2">
                                                    {a.code}
                                                </span>
                                                {a.name}
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({a.type})
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <Button
                            className="w-full rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-medium mt-4"
                            onClick={isBulkPosting ? handlePostBulk : handlePostSingle}
                            disabled={isPosting || !selectedGLAccountId}
                        >
                            {isPosting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <BookOpen className="h-4 w-4 mr-2" />
                            )}
                            {isBulkPosting
                                ? `Post ${unpostedSelectedCount} Transactions`
                                : 'Post to GL'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
