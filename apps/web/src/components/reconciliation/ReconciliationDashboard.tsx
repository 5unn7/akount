'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Account } from '@/lib/api/accounts';
import type { Transaction } from '@/lib/api/transactions';
import type { MatchSuggestion, ReconciliationStatus } from '@/lib/api/reconciliation';
import {
    fetchReconciliationStatus,
    fetchSuggestions,
    matchTransactions,
    unmatchTransactions,
    fetchAccountTransactions,
} from '@/app/(dashboard)/banking/reconciliation/actions';
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
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CheckCircle2,
    Loader2,
    RefreshCw,
    LinkIcon,
} from 'lucide-react';
import { StatusCard, TransactionRow } from './reconciliation-parts';

interface ReconciliationDashboardProps {
    accounts: Account[];
    initialAccountId?: string;
}

export function ReconciliationDashboard({
    accounts,
    initialAccountId,
}: ReconciliationDashboardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId || '');
    const [status, setStatus] = useState<ReconciliationStatus | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Record<string, MatchSuggestion[]>>({});
    const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null);
    const [matchingTxn, setMatchingTxn] = useState<string | null>(null);
    const [unmatchingTxn, setUnmatchingTxn] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleAccountChange(accountId: string) {
        setSelectedAccountId(accountId);
        setExpandedTxnId(null);
        setSuggestions({});
        setError(null);

        router.push(`/banking/reconciliation?accountId=${accountId}`);

        startTransition(async () => {
            try {
                const [statusResult, txnResult] = await Promise.all([
                    fetchReconciliationStatus(accountId),
                    fetchAccountTransactions(accountId),
                ]);
                setStatus(statusResult);
                setTransactions(txnResult);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            }
        });
    }

    async function handleGetSuggestions(transactionId: string) {
        if (expandedTxnId === transactionId && suggestions[transactionId]) {
            setExpandedTxnId(null);
            return;
        }

        setExpandedTxnId(transactionId);

        if (suggestions[transactionId]) return;

        setLoadingSuggestions(transactionId);
        try {
            const result = await fetchSuggestions(transactionId, 5);
            setSuggestions((prev) => ({ ...prev, [transactionId]: result }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load suggestions');
        } finally {
            setLoadingSuggestions(null);
        }
    }

    async function handleMatch(bankFeedTransactionId: string, matchTransactionId: string) {
        setMatchingTxn(matchTransactionId);
        try {
            await matchTransactions(bankFeedTransactionId, matchTransactionId);

            // Refresh status and transactions
            if (selectedAccountId) {
                const [statusResult, txnResult] = await Promise.all([
                    fetchReconciliationStatus(selectedAccountId),
                    fetchAccountTransactions(selectedAccountId),
                ]);
                setStatus(statusResult);
                setTransactions(txnResult);
            }

            setExpandedTxnId(null);
            setSuggestions((prev) => {
                const next = { ...prev };
                delete next[bankFeedTransactionId];
                return next;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to match transactions');
        } finally {
            setMatchingTxn(null);
        }
    }

    async function handleUnmatch(transactionId: string, matchId: string) {
        setUnmatchingTxn(transactionId);
        try {
            await unmatchTransactions(matchId);

            // Refresh status and transactions
            if (selectedAccountId) {
                const [statusResult, txnResult] = await Promise.all([
                    fetchReconciliationStatus(selectedAccountId),
                    fetchAccountTransactions(selectedAccountId),
                ]);
                setStatus(statusResult);
                setTransactions(txnResult);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unmatch transaction');
        } finally {
            setUnmatchingTxn(null);
        }
    }

    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

    return (
        <div className="space-y-5">
            {/* Account selector */}
            <div className="glass rounded-[14px] p-5">
                <div className="flex items-center gap-4">
                    <label className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium whitespace-nowrap">
                        Select Account
                    </label>
                    <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                        <SelectTrigger className="w-[300px] rounded-lg border-ak-border-2 glass">
                            <SelectValue placeholder="Choose an account to reconcile" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name} ({account.currency})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedAccountId && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                            onClick={() => handleAccountChange(selectedAccountId)}
                            disabled={isPending}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-ak-red-dim text-ak-red rounded-xl text-sm border border-ak-red/20">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 underline hover:no-underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {isPending && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading reconciliation data...</span>
                </div>
            )}

            {/* Status cards */}
            {status && !isPending && (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <StatusCard
                        title="Total Bank Feed"
                        value={status.totalBankFeed}
                        description="Imported transactions"
                    />
                    <StatusCard
                        title="Matched"
                        value={status.matched}
                        description="Reconciled"
                        variant="success"
                    />
                    <StatusCard
                        title="Unmatched"
                        value={status.unmatched}
                        description="Need attention"
                        variant={status.unmatched > 0 ? 'warning' : 'default'}
                    />
                    <StatusCard
                        title="Reconciliation"
                        value={`${status.reconciliationPercent}%`}
                        description={
                            status.reconciliationPercent >= 100
                                ? 'Fully reconciled'
                                : `${status.suggested} suggestions available`
                        }
                        variant={status.reconciliationPercent >= 100 ? 'success' : 'default'}
                    />
                </div>
            )}

            {/* Transactions table */}
            {transactions.length > 0 && !isPending && (
                <div className="glass rounded-[14px] overflow-hidden">
                    <div className="px-5 py-4 border-b border-ak-border">
                        <h3 className="text-sm font-heading font-normal">
                            Transactions — {selectedAccount?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Click &quot;Find Match&quot; on unmatched transactions to see suggested matches
                        </p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-ak-border hover:bg-transparent">
                                <TableHead className="text-micro uppercase tracking-wider text-muted-foreground w-[100px]">
                                    Date
                                </TableHead>
                                <TableHead variant="label">
                                    Description
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Amount
                                </TableHead>
                                <TableHead className="text-micro uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Status
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((txn) => {
                                const matchId = txn.matches?.[0]?.id;
                                return (
                                    <TransactionRow
                                        key={txn.id}
                                        transaction={txn}
                                        isExpanded={expandedTxnId === txn.id}
                                        suggestions={suggestions[txn.id]}
                                        isLoadingSuggestions={loadingSuggestions === txn.id}
                                        matchingTxn={matchingTxn}
                                        isUnmatching={unmatchingTxn === txn.id}
                                        onGetSuggestions={() => handleGetSuggestions(txn.id)}
                                        onMatch={(id) => handleMatch(txn.id, id)}
                                        onUnmatch={matchId ? () => handleUnmatch(txn.id, matchId) : undefined}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Empty state — no account selected */}
            {!selectedAccountId && !isPending && (
                <div className="glass rounded-[14px] flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-ak-pri-dim mb-4">
                        <LinkIcon className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-heading font-normal mb-2">
                        Select an account to start reconciling
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Choose a bank account above to view its reconciliation status and match transactions
                    </p>
                </div>
            )}

            {/* Empty state — no transactions */}
            {selectedAccountId && transactions.length === 0 && !isPending && (
                <div className="glass rounded-[14px] flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-ak-green-dim mb-4">
                        <CheckCircle2 className="h-8 w-8 text-ak-green" />
                    </div>
                    <p className="text-lg font-heading font-normal mb-2">
                        No transactions found
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Import bank statements first to start reconciling
                    </p>
                </div>
            )}
        </div>
    );
}
