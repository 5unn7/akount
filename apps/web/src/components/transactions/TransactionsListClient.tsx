'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Transaction } from '@/lib/api/transactions';
import type { Account } from '@/lib/api/accounts';
import type { GLAccount } from '@/lib/api/accounting';
import type { Category } from '@/lib/api/categories';
import { TransactionsTable } from './TransactionsTable';
import { TransactionsFilters } from './TransactionsFilters';
import { BulkActionBar } from './BulkActionBar';
import { Button } from '@/components/ui/button';
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
import { Loader2, FileText, BookOpen, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchMoreTransactions,
    bulkCategorizeAction,
    bulkDeleteAction,
    postTransactionAction,
    postBulkTransactionsAction,
    fetchExpenseAccounts,
    fetchCategoriesAction,
    assignCategoryAction,
    createCategoryAction,
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

    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false);

    // Posting state
    const [postingSheetOpen, setPostingSheetOpen] = useState(false);
    const [postingTransactionId, setPostingTransactionId] = useState<string | null>(null);
    const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
    const [selectedGLAccountId, setSelectedGLAccountId] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoadingGL, setIsLoadingGL] = useState(false);
    const [postingError, setPostingError] = useState<string | null>(null);

    // Load categories on mount
    useEffect(() => {
        if (!categoriesLoaded) {
            fetchCategoriesAction().then((cats) => {
                setCategories(cats);
                setCategoriesLoaded(true);
            }).catch(() => {
                setCategoriesLoaded(true);
            });
        }
    }, [categoriesLoaded]);

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

    async function handleBulkCategorize(categoryId: string) {
        const ids = Array.from(selectedIds);
        try {
            await bulkCategorizeAction(ids, categoryId);
            const cat = categories.find((c) => c.id === categoryId);
            setTransactions((prev) =>
                prev.map((t) =>
                    selectedIds.has(t.id)
                        ? { ...t, categoryId, category: cat ? { id: cat.id, name: cat.name } : undefined }
                        : t
                )
            );
            setSelectedIds(new Set());
            toast.success(`${ids.length} transactions categorized`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to categorize');
        }
    }

    async function handleBulkUncategorize() {
        const ids = Array.from(selectedIds);
        try {
            await bulkCategorizeAction(ids, null);
            setTransactions((prev) =>
                prev.map((t) =>
                    selectedIds.has(t.id) ? { ...t, categoryId: undefined, category: undefined } : t
                )
            );
            setSelectedIds(new Set());
            toast.success(`${ids.length} transactions uncategorized`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to uncategorize');
        }
    }

    async function handleBulkDelete() {
        const ids = Array.from(selectedIds);
        try {
            await bulkDeleteAction(ids);
            setTransactions((prev) => prev.filter((t) => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
            toast.success(`${ids.length} transactions deleted`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete');
        }
    }

    async function handleCategoryChange(transactionId: string, categoryId: string | null) {
        try {
            await assignCategoryAction(transactionId, categoryId);
            const cat = categoryId ? categories.find((c) => c.id === categoryId) : null;
            setTransactions((prev) =>
                prev.map((t) =>
                    t.id === transactionId
                        ? {
                              ...t,
                              categoryId: categoryId ?? undefined,
                              category: cat ? { id: cat.id, name: cat.name } : undefined,
                          }
                        : t
                )
            );
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update category');
        }
    }

    async function handleCreateCategory(name: string, type: 'INCOME' | 'EXPENSE' | 'TRANSFER') {
        try {
            const newCat = await createCategoryAction(name, type);
            setCategories((prev) => [...prev, newCat]);
            toast.success(`Category "${name}" created`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create category');
        }
    }

    // Open posting sheet for a single transaction
    function handleOpenPostSheet(transactionId: string) {
        setPostingTransactionId(transactionId);
        setSelectedGLAccountId('');
        setPostingError(null);
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
        setPostingError(null);
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
            toast.success('Transaction posted to GL');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to post transaction';
            toast.error(msg);
            setPostingError(msg);
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
            toast.success(`${ids.length} transactions posted to GL`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to bulk post transactions';
            toast.error(msg);
            setPostingError(msg);
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
                <div className="glass rounded-xl p-5">
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground/20" />
                        <p className="text-xs text-muted-foreground">
                            {accountId || startDate || endDate
                                ? 'No transactions match your filters'
                                : 'No transactions yet'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const uncategorizedCount = transactions.filter((t) => !t.categoryId).length;

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

            {/* Uncategorized urgency banner */}
            {uncategorizedCount > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-ak-pri-dim border border-ak-border rounded-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm text-foreground">
                            <span className="font-mono font-semibold">{uncategorizedCount}</span>
                            {' '}uncategorized transaction{uncategorizedCount !== 1 ? 's' : ''}
                            <span className="text-muted-foreground"> — these won&apos;t appear in financial reports</span>
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="shrink-0 rounded-lg bg-primary hover:bg-ak-pri-hover text-black text-xs font-medium h-7 px-3"
                        onClick={() => {
                            const uncatIds = transactions.filter((t) => !t.categoryId).map((t) => t.id);
                            setSelectedIds(new Set(uncatIds));
                        }}
                    >
                        Select All Uncategorized
                    </Button>
                </div>
            )}

            <TransactionsTable
                transactions={transactions}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onPostTransaction={handleOpenPostSheet}
                categories={categoriesLoaded ? categories : undefined}
                onCategoryChange={handleCategoryChange}
                onCreateCategory={handleCreateCategory}
            />

            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
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
                onBulkCategorize={handleBulkCategorize}
                categories={categories}
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
                <SheetContent className="sm:max-w-md bg-card border-ak-border">
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
                                    <SelectTrigger className="rounded-lg border-ak-border-2 glass">
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
                            className="w-full rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium mt-4"
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

                        {postingError && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {postingError}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
