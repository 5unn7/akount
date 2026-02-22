'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Check,
    Ban,
    Trash2,
    Loader2,
    FileText,
    Receipt,
    CreditCard,
    ArrowRightLeft,
    Pencil,
    Building,
    ExternalLink,
} from 'lucide-react';
import type { JournalEntry, JournalEntryStatus } from '@/lib/api/accounting';
import { formatAmount, formatDate } from '@/lib/api/transactions.types';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { approveEntryAction, voidEntryAction, deleteEntryAction } from '../actions';

// ============================================================================
// Status Badge (reused pattern from inline detail)
// ============================================================================

const STATUS_CONFIG: Record<JournalEntryStatus, { label: string; className: string }> = {
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

// ============================================================================
// Source type config
// ============================================================================

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof FileText; href?: (id: string) => string }> = {
    INVOICE: { label: 'Invoice', icon: FileText, href: (id) => `/business/invoices/${id}` },
    BILL: { label: 'Bill', icon: Receipt, href: (id) => `/business/bills/${id}` },
    PAYMENT: { label: 'Payment', icon: CreditCard },
    BANK_FEED: { label: 'Bank Feed', icon: Building },
    MANUAL: { label: 'Manual Entry', icon: Pencil },
    TRANSFER: { label: 'Transfer', icon: ArrowRightLeft },
    ADJUSTMENT: { label: 'Adjustment', icon: ArrowRightLeft },
};

// ============================================================================
// Journal Entry Detail Client
// ============================================================================

export function JournalEntryDetailClient({ entry: initialEntry }: { entry: JournalEntry }) {
    const router = useRouter();
    const [entry, setEntry] = useState(initialEntry);
    const [isActing, setIsActing] = useState(false);

    const entryLabel = entry.entryNumber
        ? `JE-${String(entry.entryNumber).padStart(3, '0')}`
        : 'Journal Entry';

    const totalDebit = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = entry.lines.reduce((s, l) => s + l.creditAmount, 0);
    const isBalanced = totalDebit === totalCredit;

    const statusConfig = STATUS_CONFIG[entry.status];
    const sourceConfig = entry.sourceType ? SOURCE_CONFIG[entry.sourceType] : null;
    const SourceIcon = sourceConfig?.icon ?? FileText;

    const handleApprove = useCallback(async () => {
        setIsActing(true);
        try {
            const updated = await approveEntryAction(entry.id);
            setEntry(updated);
            toast.success('Entry approved & posted');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to approve entry');
        } finally {
            setIsActing(false);
        }
    }, [entry.id]);

    const handleVoid = useCallback(async () => {
        setIsActing(true);
        try {
            await voidEntryAction(entry.id);
            toast.success('Entry voided — reversal created');
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to void entry');
        } finally {
            setIsActing(false);
        }
    }, [entry.id, router]);

    const handleDelete = useCallback(async () => {
        setIsActing(true);
        try {
            await deleteEntryAction(entry.id);
            toast.success('Draft entry deleted');
            router.push('/accounting/journal-entries');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete entry');
        } finally {
            setIsActing(false);
        }
    }, [entry.id, router]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-heading font-normal">
                            {entryLabel}
                        </h1>
                        <span
                            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusConfig.className}`}
                        >
                            {statusConfig.label}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {entry.memo}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {entry.status === 'DRAFT' && (
                        <>
                            <Button
                                size="sm"
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                onClick={handleApprove}
                                disabled={isActing}
                            >
                                {isActing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Approve &amp; Post
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10"
                                        disabled={isActing}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete draft journal entry?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete {entryLabel}. Draft entries
                                            that have not been posted can be safely removed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleDelete}
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
                                    className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10"
                                    disabled={isActing}
                                >
                                    {isActing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                        <Ban className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Void Entry
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Void this journal entry?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will create a reversal entry for {entryLabel}.
                                        The original entry will be marked as voided and a new
                                        offsetting entry will be posted. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={handleVoid}
                                    >
                                        Void Entry
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Metadata Cards */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                        Date
                    </p>
                    <p className="text-sm font-mono">
                        {formatDate(entry.date)}
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                        Total Amount
                    </p>
                    <p className="text-sm font-mono">
                        {formatAmount(totalDebit)}
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                        Source
                    </p>
                    <div className="flex items-center gap-1.5">
                        <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">
                            {sourceConfig?.label ?? 'Unknown'}
                        </p>
                    </div>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                        Created
                    </p>
                    <p className="text-sm font-mono">
                        {formatDate(entry.createdAt)}
                    </p>
                </div>
            </div>

            {/* Source Document Link */}
            {entry.sourceType && entry.sourceId && sourceConfig?.href && (
                <Link
                    href={sourceConfig.href(entry.sourceId)}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View source {sourceConfig.label.toLowerCase()}
                </Link>
            )}

            {/* Journal Lines Table */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-ak-border">
                    <h2 className="text-sm font-medium">
                        Journal Lines
                        <span className="text-muted-foreground ml-2">
                            ({entry.lines.length} lines)
                        </span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-micro uppercase tracking-wider text-muted-foreground border-b border-ak-border">
                                <th className="text-left px-6 py-3 font-medium">Account</th>
                                <th className="text-left px-4 py-3 font-medium">Type</th>
                                <th className="text-right px-6 py-3 font-medium">Debit</th>
                                <th className="text-right px-6 py-3 font-medium">Credit</th>
                                <th className="text-left px-4 py-3 font-medium">Memo</th>
                                {entry.lines.some(l => l.currency) && (
                                    <th className="text-left px-4 py-3 font-medium">Currency</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {entry.lines.map((line) => (
                                <tr
                                    key={line.id}
                                    className="border-b border-ak-border last:border-b-0 hover:bg-ak-bg-3 transition-colors"
                                >
                                    <td className="px-6 py-3">
                                        <span className="font-mono text-muted-foreground mr-2 text-xs">
                                            {line.glAccount.code}
                                        </span>
                                        <span>{line.glAccount.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {line.glAccount.type.toLowerCase().replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono">
                                        {line.debitAmount > 0 ? (
                                            <span className="text-ak-green">
                                                {formatAmount(line.debitAmount)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">&mdash;</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono">
                                        {line.creditAmount > 0 ? (
                                            <span className="text-ak-red">
                                                {formatAmount(line.creditAmount)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">&mdash;</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                                        {line.description || '\u2014'}
                                    </td>
                                    {entry.lines.some(l => l.currency) && (
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {line.currency && (
                                                <span>
                                                    {line.currency}
                                                    {line.exchangeRate && line.exchangeRate !== 1 && (
                                                        <span className="ml-1 opacity-60">
                                                            @{line.exchangeRate.toFixed(4)}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-ak-border-2 font-semibold">
                                <td className="px-6 py-3" colSpan={2}>
                                    Totals
                                </td>
                                <td className="px-6 py-3 text-right font-mono">
                                    {formatAmount(totalDebit)}
                                </td>
                                <td className="px-6 py-3 text-right font-mono">
                                    {formatAmount(totalCredit)}
                                </td>
                                <td className="px-4 py-3" colSpan={entry.lines.some(l => l.currency) ? 2 : 1}>
                                    {isBalanced ? (
                                        <span className="text-emerald-400 text-xs font-normal">
                                            Balanced
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs font-normal">
                                            Out of balance by {formatAmount(Math.abs(totalDebit - totalCredit))}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Reversal Info */}
            {entry.reversalOfId && (
                <div className="glass rounded-xl px-6 py-4">
                    <p className="text-sm text-muted-foreground">
                        This is a reversal entry.{' '}
                        <Link
                            href={`/accounting/journal-entries/${entry.reversalOfId}`}
                            className="text-primary hover:underline"
                        >
                            View original entry
                        </Link>
                    </p>
                </div>
            )}

            {/* Audit Trail */}
            <div className="glass rounded-xl px-6 py-4">
                <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Audit Trail
                </h3>
                <div className="grid gap-x-8 gap-y-2 grid-cols-1 sm:grid-cols-2 text-sm">
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                        <span className="text-muted-foreground">Created by</span>
                        <span className="font-mono text-xs">{entry.createdBy.slice(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                        <span className="text-muted-foreground">Created at</span>
                        <span className="font-mono text-xs">{new Date(entry.createdAt).toLocaleString('en-CA')}</span>
                    </div>
                    {entry.approvedBy && (
                        <div className="flex justify-between sm:justify-start sm:gap-4">
                            <span className="text-muted-foreground">Approved by</span>
                            <span className="font-mono text-xs">{entry.approvedBy.slice(0, 12)}...</span>
                        </div>
                    )}
                    {entry.approvedAt && (
                        <div className="flex justify-between sm:justify-start sm:gap-4">
                            <span className="text-muted-foreground">Approved at</span>
                            <span className="font-mono text-xs">{new Date(entry.approvedAt).toLocaleString('en-CA')}</span>
                        </div>
                    )}
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                        <span className="text-muted-foreground">Last updated</span>
                        <span className="font-mono text-xs">{new Date(entry.updatedAt).toLocaleString('en-CA')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
