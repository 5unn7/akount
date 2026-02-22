'use client';

import Link from 'next/link';
import { Check, Ban, Trash2, Loader2, ExternalLink } from 'lucide-react';
import type { JournalEntry } from '@/lib/api/accounting';
import { formatAmount } from '@/lib/api/transactions.types';
import { Button } from '@/components/ui/button';
import { JournalEntryStatusBadge } from '@akount/ui/business';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Re-export shared badge for backward compatibility
export { JournalEntryStatusBadge as StatusBadge } from '@akount/ui/business';

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
                            <tr className="text-micro uppercase tracking-wider text-muted-foreground">
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
                                        {line.debitAmount > 0 ? (
                                            <span className="text-ak-green">{formatAmount(line.debitAmount)}</span>
                                        ) : (
                                            <span className="text-muted-foreground">{'\u2014'}</span>
                                        )}
                                    </td>
                                    <td className="py-2 text-right font-mono text-sm">
                                        {line.creditAmount > 0 ? (
                                            <span className="text-ak-blue">{formatAmount(line.creditAmount)}</span>
                                        ) : (
                                            <span className="text-muted-foreground">{'\u2014'}</span>
                                        )}
                                    </td>
                                    <td className="py-2 pl-4 text-sm text-muted-foreground">
                                        {line.description || '\u2014'}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t border-ak-border-2 font-semibold">
                                <td className="py-2 text-sm">Totals</td>
                                <td className="py-2 text-right font-mono text-sm text-ak-green">
                                    {formatAmount(totalDebit)}
                                </td>
                                <td className="py-2 text-right font-mono text-sm text-ak-blue">
                                    {formatAmount(totalCredit)}
                                </td>
                                <td className="py-2 pl-4">
                                    {totalDebit === totalCredit ? (
                                        <span className="text-ak-green text-xs">
                                            Balanced
                                        </span>
                                    ) : (
                                        <span className="text-ak-red text-xs">
                                            Out of balance
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex items-center gap-2 pt-2 border-t border-ak-border">
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-8" asChild>
                            <Link href={`/accounting/journal-entries/${entry.id}`}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Full
                            </Link>
                        </Button>
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
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                            disabled={isActing}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete draft journal entry?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete JE-{String(entry.entryNumber).padStart(3, '0')}.
                                                Draft entries that have not been posted can be safely removed.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() => onDelete(entry.id)}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        {entry.status === 'POSTED' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                        disabled={isActing}
                                    >
                                        <Ban className="h-3 w-3 mr-1" />
                                        Void Entry
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Void this journal entry?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will create a reversal entry for JE-{String(entry.entryNumber).padStart(3, '0')}.
                                            The original entry will be marked as voided and a new offsetting entry will be posted.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => onVoid(entry.id)}
                                        >
                                            Void Entry
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
