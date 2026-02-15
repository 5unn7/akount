'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Account } from '@/lib/api/accounts';
import type { Transaction } from '@/lib/api/transactions';
import type { MatchSuggestion, ReconciliationStatus } from '@/lib/api/reconciliation';
import { formatAmount, formatDate } from '@/lib/api/transactions';
import { getConfidenceLevel, formatConfidence } from '@/lib/api/reconciliation';
import {
    fetchReconciliationStatus,
    fetchSuggestions,
    matchTransactions,
    fetchAccountTransactions,
} from '@/app/(dashboard)/banking/reconciliation/actions';
import { Badge } from '@/components/ui/badge';
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
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowRight,
    RefreshCw,
    LinkIcon,
    Unlink,
} from 'lucide-react';

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

    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

    return (
        <div className="space-y-5">
            {/* Account selector */}
            <div className="glass rounded-[14px] p-5">
                <div className="flex items-center gap-4">
                    <label className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium whitespace-nowrap">
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
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground w-[100px]">
                                    Date
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Description
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Amount
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Status
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground w-[120px]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((txn) => (
                                <TransactionRow
                                    key={txn.id}
                                    transaction={txn}
                                    isExpanded={expandedTxnId === txn.id}
                                    suggestions={suggestions[txn.id]}
                                    isLoadingSuggestions={loadingSuggestions === txn.id}
                                    matchingTxn={matchingTxn}
                                    onGetSuggestions={() => handleGetSuggestions(txn.id)}
                                    onMatch={(matchId) => handleMatch(txn.id, matchId)}
                                />
                            ))}
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

function StatusCard({
    title,
    value,
    description,
    variant = 'default',
}: {
    title: string;
    value: number | string;
    description: string;
    variant?: 'default' | 'success' | 'warning';
}) {
    const valueColor =
        variant === 'success'
            ? 'text-ak-green'
            : variant === 'warning'
              ? 'text-primary'
              : '';

    return (
        <div className="glass rounded-xl px-4 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1.5">
                {title}
            </p>
            <p className={`text-lg font-mono font-semibold leading-none ${valueColor}`}>
                {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

function TransactionRow({
    transaction,
    isExpanded,
    suggestions,
    isLoadingSuggestions,
    matchingTxn,
    onGetSuggestions,
    onMatch,
}: {
    transaction: Transaction;
    isExpanded: boolean;
    suggestions?: MatchSuggestion[];
    isLoadingSuggestions: boolean;
    matchingTxn: string | null;
    onGetSuggestions: () => void;
    onMatch: (transactionId: string) => void;
}) {
    const isMatched = !!transaction.journalEntryId;

    return (
        <>
            <TableRow className={`border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors ${isExpanded ? 'border-b-0' : ''}`}>
                <TableCell className="text-sm font-mono text-muted-foreground">
                    {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="font-medium text-sm">
                    {transaction.description}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                    {formatAmount(transaction.amount, transaction.currency)}
                </TableCell>
                <TableCell>
                    {isMatched ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-ak-green-dim text-ak-green border-ak-green/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Matched
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-ak-pri-dim text-primary border-primary/20">
                            <XCircle className="h-3 w-3" />
                            Unmatched
                        </span>
                    )}
                </TableCell>
                <TableCell className="text-right">
                    {!isMatched && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3 h-7 text-xs"
                            onClick={onGetSuggestions}
                            disabled={isLoadingSuggestions}
                        >
                            {isLoadingSuggestions ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <ArrowRight className="h-3 w-3 mr-1" />
                            )}
                            {isExpanded ? 'Hide' : 'Find Match'}
                        </Button>
                    )}
                </TableCell>
            </TableRow>

            {/* Suggestions panel */}
            {isExpanded && (
                <TableRow>
                    <TableCell colSpan={5} className="bg-ak-bg-3/30 p-4">
                        {isLoadingSuggestions ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Finding matches...
                            </div>
                        ) : suggestions && suggestions.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                                    Suggested Matches ({suggestions.length})
                                </p>
                                {suggestions.map((suggestion) => {
                                    const confidence = getConfidenceLevel(suggestion.confidence);
                                    return (
                                        <div
                                            key={suggestion.transactionId}
                                            className="flex items-center justify-between p-3 glass rounded-xl"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm truncate">
                                                        {suggestion.transaction.description}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] ${confidence.color}`}
                                                    >
                                                        {confidence.label} ({formatConfidence(suggestion.confidence)})
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span>{formatDate(suggestion.transaction.date)}</span>
                                                    <span className="font-mono">
                                                        {formatAmount(
                                                            suggestion.transaction.amount,
                                                            suggestion.transaction.currency
                                                        )}
                                                    </span>
                                                    <span>{suggestion.transaction.account.name}</span>
                                                </div>
                                                {suggestion.reasons.length > 0 && (
                                                    <div className="flex gap-1 mt-1.5">
                                                        {suggestion.reasons.map((reason, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] text-muted-foreground bg-ak-bg-3 border border-ak-border px-1.5 py-0.5 rounded"
                                                            >
                                                                {reason}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                className="ml-4 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium h-7 text-xs"
                                                onClick={() => onMatch(suggestion.transactionId)}
                                                disabled={matchingTxn === suggestion.transactionId}
                                            >
                                                {matchingTxn === suggestion.transactionId ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <LinkIcon className="h-3 w-3 mr-1" />
                                                )}
                                                Match
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-6 text-center">
                                <Unlink className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No matching transactions found
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Try posting a manual transaction first, then reconcile
                                </p>
                            </div>
                        )}
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}
