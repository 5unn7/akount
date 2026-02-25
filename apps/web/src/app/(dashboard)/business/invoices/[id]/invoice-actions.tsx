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
import { sendInvoiceAction, postInvoiceAction, cancelInvoiceAction, voidInvoiceAction, deleteInvoiceAction } from './actions';
import { Send, BookOpen, Download, XCircle, Ban, Loader2, ExternalLink, Pencil, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceForm } from '@/components/business/InvoiceForm';
import { PaymentForm } from '@/components/business/PaymentForm';

interface InvoiceActionsProps {
    invoice: Invoice;
    clients: Array<{ id: string; name: string; paymentTerms?: string | null }>;
}

export function InvoiceActions({ invoice, clients }: InvoiceActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [journalEntryId, setJournalEntryId] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const balanceDue = invoice.total - (invoice.paidAmount ?? 0);
    const canRecordPayment = balanceDue > 0 && !['CANCELLED', 'DRAFT'].includes(invoice.status);

    const ACTION_LABELS: Record<string, string> = {
        send: 'Invoice sent',
        post: 'Invoice posted to GL',
        cancel: 'Invoice cancelled',
        void: 'Invoice voided',
        delete: 'Invoice deleted',
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

    const handleVoid = () =>
        handleAction('void', () => voidInvoiceAction(invoice.id));

    const handleDownloadPdf = () => {
        window.open(`/api/business/invoices/${invoice.id}/pdf`, '_blank');
    };

    const handleDelete = async () => {
        setLoading('delete');
        try {
            await deleteInvoiceAction(invoice.id);
            toast.success('Invoice deleted');
            router.push('/business/invoices');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete invoice';
            toast.error(message);
            setLoading(null);
        }
    };

    const canEdit = invoice.status === 'DRAFT';
    const canSend = invoice.status === 'DRAFT';
    const canPost = !['CANCELLED', 'DRAFT'].includes(invoice.status);
    const canCancel = ['DRAFT', 'SENT'].includes(invoice.status);
    const canVoid = ['SENT', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'].includes(invoice.status);
    const canDelete = ['DRAFT', 'CANCELLED'].includes(invoice.status);

    return (
        <div className="flex gap-2">
            {canEdit && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditOpen(true)}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    <Pencil className="h-4 w-4" />
                    Edit
                </Button>
            )}
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
            {canRecordPayment && (
                <Button
                    size="sm"
                    onClick={() => setPaymentOpen(true)}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    <DollarSign className="h-4 w-4" />
                    Record Payment
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

            {canVoid && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading !== null}
                            className="gap-1.5 text-ak-red hover:text-ak-red"
                        >
                            {loading === 'void' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Ban className="h-4 w-4" />
                            )}
                            Void
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Invoice #{invoice.invoiceNumber} will be voided and all associated
                                journal entries will be reversed. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleVoid}
                            >
                                Void Invoice
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading !== null}
                            className="gap-1.5 text-ak-red hover:text-ak-red"
                        >
                            {loading === 'delete' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Invoice #{invoice.invoiceNumber} will be permanently removed.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                Delete Invoice
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {canEdit && (
                <InvoiceForm
                    key={invoice.id}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    clients={clients}
                    editInvoice={invoice}
                    onSuccess={() => router.refresh()}
                />
            )}

            {canRecordPayment && (
                <PaymentForm
                    key={`payment-${invoice.id}`}
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    clients={clients}
                    vendors={[]}
                    onSuccess={() => router.refresh()}
                    defaults={{
                        direction: 'AR',
                        clientId: invoice.clientId,
                        amount: balanceDue,
                        currency: invoice.currency,
                    }}
                />
            )}
        </div>
    );
}
