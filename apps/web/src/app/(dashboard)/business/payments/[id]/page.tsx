import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { getPayment } from '@/lib/api/payments';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard,
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    Building2,
    Calendar,
    Hash,
    ExternalLink,
} from 'lucide-react';
import { PaymentDetailActions } from './payment-detail-actions';

const METHOD_LABELS: Record<string, string> = {
    CARD: 'Card',
    TRANSFER: 'Transfer',
    CASH: 'Cash',
    CHECK: 'Check',
    WIRE: 'Wire',
    OTHER: 'Other',
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    try {
        const payment = await getPayment(id);
        const party = payment.client?.name ?? payment.vendor?.name ?? 'Payment';
        return {
            title: `Payment — ${party} | Akount`,
            description: `Payment of ${formatCurrency(payment.amount, payment.currency)} to/from ${party}`,
        };
    } catch {
        return { title: 'Payment | Akount' };
    }
}

export default async function PaymentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let payment;
    try {
        payment = await getPayment(id);
    } catch {
        notFound();
    }

    const isCustomer = !!payment.clientId;
    const partyName = isCustomer ? payment.client?.name : payment.vendor?.name;
    const partyLink = isCustomer
        ? `/business/clients/${payment.clientId}`
        : `/business/vendors/${payment.vendorId}`;

    const totalAllocated = payment.allocations.reduce((sum, a) => sum + a.amount, 0);
    const unallocated = payment.amount - totalAllocated;

    return (
        <div className="flex-1 space-y-6">
            {/* Back Link */}
            <Link
                href="/business/payments"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Payments
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-heading font-normal">
                            Payment
                        </h1>
                        {isCustomer ? (
                            <Badge className="bg-ak-green-dim text-ak-green border-ak-green/20 text-xs gap-1">
                                <ArrowDownLeft className="h-3 w-3" />
                                Received
                            </Badge>
                        ) : (
                            <Badge className="bg-ak-red-dim text-ak-red border-ak-red/20 text-xs gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                Paid
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {formatDate(payment.date)} &middot;{' '}
                        {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                        {payment.reference && ` \u00B7 Ref: ${payment.reference}`}
                    </p>
                </div>
                <PaymentDetailActions paymentId={payment.id} />
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Party */}
                {partyName && (
                    <Link
                        href={partyLink}
                        className="glass rounded-xl p-5 space-y-3 group hover:border-ak-border-2 transition-all hover:-translate-y-px block"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {isCustomer ? 'Client' : 'Vendor'}
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="font-medium">{partyName}</p>
                    </Link>
                )}

                {/* Date */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Payment Date
                    </div>
                    <p className="text-sm font-medium">
                        {formatDate(payment.date)}
                    </p>
                </div>

                {/* Method & Reference */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        Method
                    </div>
                    <p className="text-sm font-medium">
                        {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                    </p>
                    {payment.reference && (
                        <p className="text-xs text-muted-foreground">
                            Ref: {payment.reference}
                        </p>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-wider text-muted-foreground">
                        Total Amount
                    </span>
                    <span className="font-mono text-2xl font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                    </span>
                </div>
            </div>

            {/* Allocations */}
            <div className="space-y-3">
                <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
                    Allocations
                </h2>

                {payment.allocations.length === 0 ? (
                    <div className="glass rounded-xl p-5">
                        <p className="text-sm text-muted-foreground">
                            No allocations — full amount is unallocated
                        </p>
                    </div>
                ) : (
                    <div className="glass rounded-xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-ak-bg-3/50 text-micro uppercase tracking-wider text-muted-foreground">
                            <div className="col-span-4">Document</div>
                            <div className="col-span-2 text-right">Doc Total</div>
                            <div className="col-span-2 text-right">Paid</div>
                            <div className="col-span-2 text-right">Status</div>
                            <div className="col-span-2 text-right">Allocated</div>
                        </div>

                        {/* Allocation Rows */}
                        {payment.allocations.map((alloc, idx) => {
                            const isInvoice = !!alloc.invoiceId;
                            const doc = isInvoice ? alloc.invoice : alloc.bill;
                            const docNumber = doc
                                ? (isInvoice ? alloc.invoice?.invoiceNumber : alloc.bill?.billNumber)
                                : 'Unknown';
                            const docType = isInvoice ? 'Invoice' : 'Bill';
                            const docLink = isInvoice
                                ? `/business/invoices/${alloc.invoiceId}`
                                : `/business/bills/${alloc.billId}`;

                            return (
                                <div
                                    key={alloc.id}
                                    className={`grid grid-cols-12 gap-4 px-5 py-3.5 ${
                                        idx !== payment.allocations.length - 1
                                            ? 'border-b border-ak-border'
                                            : ''
                                    }`}
                                >
                                    <div className="col-span-4 text-sm">
                                        <Link
                                            href={docLink}
                                            className="hover:text-primary transition-colors inline-flex items-center gap-1"
                                        >
                                            {docType} {docNumber}
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        </Link>
                                    </div>
                                    <div className="col-span-2 text-right text-sm font-mono">
                                        {doc ? formatCurrency(doc.total, payment.currency) : '—'}
                                    </div>
                                    <div className="col-span-2 text-right text-sm font-mono">
                                        {doc ? formatCurrency(doc.paidAmount, payment.currency) : '—'}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        {doc && (
                                            <Badge variant="outline" className="text-xs">
                                                {doc.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-right text-sm font-mono font-medium">
                                        {formatCurrency(alloc.amount, payment.currency)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Separator className="bg-ak-border" />

            {/* Summary */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Allocated</span>
                        <span className="font-mono">
                            {formatCurrency(totalAllocated, payment.currency)}
                        </span>
                    </div>
                    {unallocated > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-primary">Unallocated</span>
                            <span className="font-mono text-primary">
                                {formatCurrency(unallocated, payment.currency)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes */}
            {payment.notes && (
                <div className="glass rounded-xl p-5 space-y-2">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground">
                        Notes
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {payment.notes}
                    </p>
                </div>
            )}
        </div>
    );
}
