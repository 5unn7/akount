'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/lib/api/invoices';
import { sendInvoiceAction, postInvoiceAction, cancelInvoiceAction } from './actions';
import { Send, BookOpen, Download, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceActionsProps {
    invoice: Invoice;
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

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
            await apiCall();
            toast.success(ACTION_LABELS[action] ?? 'Action completed');
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
            {canPost && (
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
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
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
            )}
        </div>
    );
}
