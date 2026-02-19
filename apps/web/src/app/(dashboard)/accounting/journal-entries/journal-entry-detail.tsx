'use client';

import { Check, Ban, Trash2, Loader2 } from 'lucide-react';
import type { JournalEntry, JournalEntryStatus } from '@/lib/api/accounting';
import { formatAmount } from '@/lib/api/transactions.types';
import { Button } from '@/components/ui/button';

// ============================================================================
// Status Badge
// ============================================================================

const STATUS_CONFIG: Record<
    JournalEntryStatus,
    { label: string; className: string }
> = {
    DRAFT: {
        label: 'Draft',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    },
    POSTED: {
        label: 'Posted',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    },
    VOIDED: {
        label: 'Voided',
        className: 'bg-red-500/15 text-red-400 border-red-500/20',
    },
    ARCHIVED: {
        label: 'Archived',
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    },
};

export function StatusBadge({ status }: { status: JournalEntryStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
        >
            {config.label}
        </span>
    );
}

// ============================================================================
// Entry Detail (expandable row)
// ============================================================================

export function EntryDetail({
    entry,
    onApprove,
    onVoid,
    onDelete,
    isActing,
}: {
    entry: JournalEntry;
    onApprove: (id: string) => void;
    onVoid: (id: string) => void;
    onDelete: (id: string) => void;
    isActing: boolean;
}) {
    const totalDebit = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = entry.lines.reduce((s, l) => s + l.creditAmount, 0);

    return (
        <tr>
            <td colSpan={7} className="px-4 py-4 glass">
                <div className="space-y-3">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                <th className="text-left pb-2 font-medium">Account</th>
                                <th className="text-right pb-2 font-medium">Debit</th>
                                <th className="text-right pb-2 font-medium">Credit</th>
                                <th className="text-left pb-2 pl-4 font-medium">Memo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entry.lines.map((line) => (
                                <tr
                                    key={line.id}
                                    className="border-t border-ak-border"
                                >
                                    <td className="py-2 text-sm">
                                        <span className="font-mono text-muted-foreground mr-2">
                                            {line.glAccount.code}
                                        </span>
                                        {line.glAccount.name}
                                    </td>
                                    <td className="py-2 text-right font-mono text-sm">
                                        {line.debitAmount > 0
                                            ? formatAmount(line.debitAmount)
                                            : '\u2014'}
                                    </td>
                                    <td className="py-2 text-right font-mono text-sm">
                                        {line.creditAmount > 0
                                            ? formatAmount(line.creditAmount)
                                            : '\u2014'}
                                    </td>
                                    <td className="py-2 pl-4 text-sm text-muted-foreground">
                                        {line.description || '\u2014'}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t border-ak-border-2 font-semibold">
                                <td className="py-2 text-sm">Totals</td>
                                <td className="py-2 text-right font-mono text-sm">
                                    {formatAmount(totalDebit)}
                                </td>
                                <td className="py-2 text-right font-mono text-sm">
                                    {formatAmount(totalCredit)}
                                </td>
                                <td className="py-2 pl-4">
                                    {totalDebit === totalCredit ? (
                                        <span className="text-emerald-400 text-xs">
                                            Balanced
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs">
                                            Out of balance
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex items-center gap-2 pt-2 border-t border-ak-border">
                        {entry.status === 'DRAFT' && (
                            <>
                                <Button
                                    size="sm"
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                                    onClick={() => onApprove(entry.id)}
                                    disabled={isActing}
                                >
                                    {isActing ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                        <Check className="h-3 w-3 mr-1" />
                                    )}
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                    onClick={() => onDelete(entry.id)}
                                    disabled={isActing}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            </>
                        )}
                        {entry.status === 'POSTED' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                onClick={() => onVoid(entry.id)}
                                disabled={isActing}
                            >
                                <Ban className="h-3 w-3 mr-1" />
                                Void Entry
                            </Button>
                        )}
                        {entry.reversalOfId && (
                            <span className="text-xs text-muted-foreground">
                                Reversal of entry
                            </span>
                        )}
                        {entry.sourceType && (
                            <span className="text-xs text-muted-foreground ml-auto">
                                Source: {entry.sourceType}
                                {entry.sourceId ? ` #${entry.sourceId.slice(0, 8)}` : ''}
                            </span>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}
