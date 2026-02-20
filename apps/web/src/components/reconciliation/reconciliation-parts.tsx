'use client';

import type { Transaction } from '@/lib/api/transactions.types';
import type { MatchSuggestion } from '@/lib/api/reconciliation.types';
import { formatAmount, formatDate } from '@/lib/api/transactions.types';
import { getConfidenceLevel, formatConfidence } from '@/lib/api/reconciliation.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TableCell,
    TableRow,
} from '@/components/ui/table';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowRight,
    LinkIcon,
    Unlink,
} from 'lucide-react';

// ============================================================================
// Status Card
// ============================================================================

export function StatusCard({
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

// ============================================================================
// Transaction Row
// ============================================================================

export function TransactionRow({
    transaction,
    isExpanded,
    suggestions,
    isLoadingSuggestions,
    matchingTxn,
    isUnmatching,
    onGetSuggestions,
    onMatch,
    onUnmatch,
}: {
    transaction: Transaction;
    isExpanded: boolean;
    suggestions?: MatchSuggestion[];
    isLoadingSuggestions: boolean;
    matchingTxn: string | null;
    isUnmatching?: boolean;
    onGetSuggestions: () => void;
    onMatch: (transactionId: string) => void;
    onUnmatch?: () => void;
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
                    {isMatched && onUnmatch ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                            onClick={onUnmatch}
                            disabled={isUnmatching}
                        >
                            {isUnmatching ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <Unlink className="h-3 w-3 mr-1" />
                            )}
                            Unmatch
                        </Button>
                    ) : !isMatched ? (
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
                    ) : null}
                </TableCell>
            </TableRow>

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
