import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInvoice } from '@/lib/api/invoices';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { FileText, User, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { InvoiceActions } from './invoice-actions';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    try {
        const invoice = await getInvoice(id);
        return {
            title: `Invoice ${invoice.invoiceNumber} | Akount`,
            description: `Invoice ${invoice.invoiceNumber} for ${invoice.client.name}`,
        };
    } catch {
        return { title: 'Invoice | Akount' };
    }
}

const STATUS_BADGE_STYLES: Record<string, string> = {
    DRAFT: 'bg-ak-bg-3 text-muted-foreground border-ak-border',
    SENT: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
    PAID: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    OVERDUE: 'bg-ak-red/10 text-ak-red border-ak-red/20',
    CANCELLED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    PARTIALLY_PAID: 'bg-primary/10 text-primary border-primary/20',
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default async function InvoiceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let invoice;
    try {
        invoice = await getInvoice(id);
    } catch {
        notFound();
    }

    const balanceDue = invoice.total - invoice.paidAmount;
    const statusStyle = STATUS_BADGE_STYLES[invoice.status] ?? '';

    return (
        <div className="flex-1 space-y-6">
            {/* Back Link */}
            <Link
                href="/business/invoices"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Invoicing
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-heading font-normal">
                            Invoice {invoice.invoiceNumber}
                        </h1>
                        <Badge className={`text-xs ${statusStyle}`}>
                            {invoice.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Issued on {formatDate(invoice.issueDate)} &middot;{' '}
                        Due {formatDate(invoice.dueDate)}
                    </p>
                </div>
                <InvoiceActions invoice={invoice} />
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Client */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <User className="h-3 w-3" />
                        Client
                    </div>
                    <div>
                        <p className="font-medium">{invoice.client.name}</p>
                        {invoice.client.email && (
                            <p className="text-sm text-muted-foreground">
                                {invoice.client.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* Issue Date */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Issue Date
                    </div>
                    <p className="text-sm font-medium">
                        {formatDate(invoice.issueDate)}
                    </p>
                </div>

                {/* Due Date */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due Date
                    </div>
                    <p className="text-sm font-medium">
                        {formatDate(invoice.dueDate)}
                    </p>
                </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
                <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
                    Line Items
                </h2>
                <div className="glass rounded-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-ak-bg-3/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <div className="col-span-5">Description</div>
                        <div className="col-span-1 text-right">Qty</div>
                        <div className="col-span-2 text-right">Unit Price</div>
                        <div className="col-span-2 text-right">Tax</div>
                        <div className="col-span-2 text-right">Amount</div>
                    </div>

                    {/* Table Rows */}
                    {invoice.invoiceLines.map((line, idx) => (
                        <div
                            key={line.id}
                            className={`grid grid-cols-12 gap-4 px-5 py-3.5 ${
                                idx !== invoice.invoiceLines.length - 1
                                    ? 'border-b border-ak-border'
                                    : ''
                            }`}
                        >
                            <div className="col-span-5 text-sm">
                                {line.description}
                            </div>
                            <div className="col-span-1 text-right text-sm font-mono">
                                {line.quantity}
                            </div>
                            <div className="col-span-2 text-right text-sm font-mono">
                                {formatCurrency(line.unitPrice, invoice.currency)}
                            </div>
                            <div className="col-span-2 text-right text-sm font-mono text-muted-foreground">
                                {formatCurrency(line.taxAmount, invoice.currency)}
                            </div>
                            <div className="col-span-2 text-right text-sm font-mono font-medium">
                                {formatCurrency(line.amount, invoice.currency)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Separator className="bg-ak-border" />

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-mono">
                            {formatCurrency(invoice.subtotal, invoice.currency)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-mono">
                            {formatCurrency(invoice.taxAmount, invoice.currency)}
                        </span>
                    </div>
                    <Separator className="bg-ak-border" />
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wider text-muted-foreground">
                            Total
                        </span>
                        <span className="font-mono text-lg font-semibold">
                            {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                    </div>
                    {invoice.paidAmount > 0 && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ak-green">Paid</span>
                                <span className="font-mono text-ak-green">
                                    {formatCurrency(invoice.paidAmount, invoice.currency)}
                                </span>
                            </div>
                            <Separator className="bg-ak-border" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </span>
                                <span
                                    className={`font-mono text-lg font-semibold ${
                                        balanceDue > 0
                                            ? invoice.status === 'OVERDUE'
                                                ? 'text-ak-red'
                                                : 'text-primary'
                                            : 'text-ak-green'
                                    }`}
                                >
                                    {formatCurrency(balanceDue, invoice.currency)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
                <div className="glass rounded-xl p-5 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Notes
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {invoice.notes}
                    </p>
                </div>
            )}
        </div>
    );
}
