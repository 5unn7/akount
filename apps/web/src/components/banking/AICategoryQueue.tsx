'use client';

import { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import type { Transaction } from '@/lib/api/transactions.types';
import { formatCurrency } from '@/lib/utils/currency';

interface AICategoryQueueProps {
    uncategorizedTransactions: Transaction[];
    onCategorized?: () => void;
}

export function AICategoryQueue({
    uncategorizedTransactions,
    onCategorized,
}: AICategoryQueueProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = uncategorizedTransactions.filter(
        (t) => !dismissed.has(t.id)
    );
    const displayItems = visible.slice(0, 3);
    const remaining = visible.length - displayItems.length;

    if (visible.length === 0) {
        return (
            <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-ak-purple" />
                    <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        AI Category Queue
                    </h3>
                </div>
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">All transactions categorized</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-ak-purple" />
                    <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        AI Category Queue
                    </h3>
                </div>
                <span className="text-micro text-ak-purple font-medium">
                    {visible.length} uncategorized
                </span>
            </div>

            <div className="space-y-2">
                {displayItems.map((txn) => (
                    <div
                        key={txn.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg glass-2"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">
                                {txn.description}
                            </p>
                            <p className="text-micro text-muted-foreground">
                                {new Date(txn.date).toLocaleDateString(
                                    'en-CA',
                                    { month: 'short', day: 'numeric' }
                                )}{' '}
                                &bull;{' '}
                                <span className="font-mono">
                                    {formatCurrency(
                                        Math.abs(txn.amount),
                                        txn.currency
                                    )}
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => {
                                    setDismissed(
                                        (prev) =>
                                            new Set(Array.from(prev).concat(txn.id))
                                    );
                                    onCategorized?.();
                                }}
                                className="p-1 rounded hover:bg-ak-green-dim text-ak-green transition-colors"
                                title="Accept suggestion"
                            >
                                <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() =>
                                    setDismissed(
                                        (prev) =>
                                            new Set(Array.from(prev).concat(txn.id))
                                    )
                                }
                                className="p-1 rounded hover:bg-ak-red-dim text-muted-foreground hover:text-ak-red transition-colors"
                                title="Dismiss"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {remaining > 0 && (
                <p className="text-micro text-center text-muted-foreground">
                    +{remaining} more uncategorized
                </p>
            )}
        </div>
    );
}
