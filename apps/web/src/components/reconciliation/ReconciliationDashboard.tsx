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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="space-y-6">
            {/* Account selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium whitespace-nowrap">
                            Select Account
                        </label>
                        <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                            <SelectTrigger className="w-[300px]">
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
                                onClick={() => handleAccountChange(selectedAccountId)}
                                disabled={isPending}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 underline"
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
                <div className="grid gap-4 md:grid-cols-4">
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
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Transactions — {selectedAccount?.name}
                        </CardTitle>
                        <CardDescription>
                            Click &quot;Find Match&quot; on unmatched transactions to see suggested matches
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right w-[120px]">Amount</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!selectedAccountId && !isPending && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-2">Select an account to start reconciling</p>
                        <p className="text-sm text-muted-foreground">
                            Choose a bank account above to view its reconciliation status and match transactions
                        </p>
                    </CardContent>
                </Card>
            )}

            {selectedAccountId && transactions.length === 0 && !isPending && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-2">No transactions found</p>
                        <p className="text-sm text-muted-foreground">
                            Import bank statements first to start reconciling
                        </p>
                    </CardContent>
                </Card>
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
            ? 'text-green-600'
            : variant === 'warning'
              ? 'text-yellow-600'
              : '';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
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
            <TableRow className={isExpanded ? 'border-b-0' : ''}>
                <TableCell className="text-sm">
                    {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="font-medium">
                    {transaction.description}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                    {formatAmount(transaction.amount, transaction.currency)}
                </TableCell>
                <TableCell>
                    {isMatched ? (
                        <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Matched
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300">
                            <XCircle className="h-3 w-3" />
                            Unmatched
                        </Badge>
                    )}
                </TableCell>
                <TableCell className="text-right">
                    {!isMatched && (
                        <Button
                            variant="outline"
                            size="sm"
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
                    <TableCell colSpan={5} className="bg-muted/30 p-4">
                        {isLoadingSuggestions ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Finding matches...
                            </div>
                        ) : suggestions && suggestions.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium mb-3">
                                    Suggested Matches ({suggestions.length})
                                </p>
                                {suggestions.map((suggestion) => {
                                    const confidence = getConfidenceLevel(suggestion.confidence);
                                    return (
                                        <div
                                            key={suggestion.transactionId}
                                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm truncate">
                                                        {suggestion.transaction.description}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${confidence.color}`}
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
                                                    <div className="flex gap-1 mt-1">
                                                        {suggestion.reasons.map((reason, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                                                            >
                                                                {reason}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => onMatch(suggestion.transactionId)}
                                                disabled={matchingTxn === suggestion.transactionId}
                                                className="ml-4"
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
                            <div className="flex flex-col items-center py-4 text-center">
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
