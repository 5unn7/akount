'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import type { Invoice } from '@/lib/api/invoices';
import { sendInvoiceAction, postInvoiceAction, cancelInvoiceAction } from './actions';
import { Send, BookOpen, Download, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceActionsProps {
    invoice: Invoice;
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [journalEntryId, setJournalEntryId] = useState<string | null>(null);

    const ACTION_LABELS: Record<string, string> = {
        send: 'Invoice sent',
        post: 'Invoice posted to GL',
        cancel: 'Invoice cancelled',
    };

    const handleAction = async (
        action: string,
        apiCall: () => Promise<unknown>
    ) => {
        setLoading(action);
        try {
            const result = await apiCall();
            toast.success(ACTION_LABELS[action] ?? 'Action completed');

            // If posting to GL, capture journal entry ID
            if (action === 'post' && result && typeof result === 'object' && 'id' in result) {
                setJournalEntryId(result.id as string);
            }

            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            toast.error(message);
        } finally {
            setLoading(null);
        }
    };

    const handleSend = () =>
        handleAction('send', () => sendInvoiceAction(invoice.id));

    const handlePost = () =>
        handleAction('post', () => postInvoiceAction(invoice.id));

    const handleCancel = () =>
        handleAction('cancel', () => cancelInvoiceAction(invoice.id));

    const handleDownloadPdf = () => {
        window.open(`/api/business/invoices/${invoice.id}/pdf`, '_blank');
    };

    const canSend = invoice.status === 'DRAFT';
    const canPost = !['CANCELLED', 'DRAFT'].includes(invoice.status);
    const canCancel = ['DRAFT', 'SENT'].includes(invoice.status);

    return (
        <div className="flex gap-2">
            {canSend && (
                <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    {loading === 'send' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    Send
                </Button>
            )}
            {canPost && !journalEntryId && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePost}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    {loading === 'post' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <BookOpen className="h-4 w-4" />
                    )}
                    Post to GL
                </Button>
            )}
            {journalEntryId && (
                <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="gap-1.5 text-emerald-400 hover:text-emerald-300"
                >
                    <Link href={`/accounting/journal-entries/${journalEntryId}`}>
                        <ExternalLink className="h-4 w-4" />
                        View Journal Entry
                    </Link>
                </Button>
            )}
            <Button
                size="sm"
                variant="ghost"
                onClick={handleDownloadPdf}
                disabled={loading !== null}
                className="gap-1.5"
            >
                <Download className="h-4 w-4" />
                PDF
            </Button>
            {canCancel && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading !== null}
                            className="gap-1.5 text-ak-red hover:text-ak-red"
                        >
                            {loading === 'cancel' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            Cancel
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Invoice #{invoice.invoiceNumber} will be marked as cancelled.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleCancel}
                            >
                                Cancel Invoice
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
