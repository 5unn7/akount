import type { Metadata } from 'next';
import { formatDate } from '@/lib/utils/date';
import { notFound } from 'next/navigation';
import { getCreditNote } from '@/lib/api/credit-notes';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { CreditNoteStatusBadge } from '@akount/ui/business';
import { FileText, Calendar, ArrowLeft, Link2 } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    try {
        const cn = await getCreditNote(id);
        return {
            title: `Credit Note ${cn.creditNoteNumber} | Akount`,
            description: `Credit note ${cn.creditNoteNumber} — ${cn.reason}`,
        };
    } catch {
        return { title: 'Credit Note | Akount' };
    }
}

export default async function CreditNoteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let creditNote;
    try {
        creditNote = await getCreditNote(id);
    } catch {
        notFound();
    }

    const remainingCredit = creditNote.amount - creditNote.appliedAmount;

    return (
        <div className="flex-1 space-y-6">
            {/* Back Link */}
            <Link
                href="/business/credit-notes"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Credit Notes
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-heading font-normal">
                            Credit Note {creditNote.creditNoteNumber}
                        </h1>
                        <CreditNoteStatusBadge status={creditNote.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Issued on {formatDate(creditNote.date)} &middot;{' '}
                        {creditNote.entity.name}
                    </p>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Date
                    </div>
                    <p className="text-sm font-medium">
                        {formatDate(creditNote.date)}
                    </p>
                </div>

                {/* Linked Document */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        Linked Document
                    </div>
                    {creditNote.linkedInvoice ? (
                        <Link
                            href={`/business/invoices/${creditNote.linkedInvoice.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Invoice {creditNote.linkedInvoice.invoiceNumber}
                            <span className="text-muted-foreground ml-1">
                                ({creditNote.linkedInvoice.client.name})
                            </span>
                        </Link>
                    ) : creditNote.linkedBill ? (
                        <p className="text-sm font-medium">
                            Bill {creditNote.linkedBill.billNumber}
                            <span className="text-muted-foreground ml-1">
                                ({creditNote.linkedBill.vendor.name})
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Not linked</p>
                    )}
                </div>

                {/* Currency */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-muted-foreground">
                        Currency
                    </div>
                    <p className="text-sm font-medium font-mono">
                        {creditNote.currency}
                    </p>
                </div>
            </div>

            <Separator className="bg-ak-border" />

            {/* Amounts */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wider text-muted-foreground">
                            Credit Amount
                        </span>
                        <span className="font-mono text-lg font-semibold">
                            {formatCurrency(creditNote.amount, creditNote.currency)}
                        </span>
                    </div>
                    {creditNote.appliedAmount > 0 && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ak-green">Applied</span>
                                <span className="font-mono text-ak-green">
                                    {formatCurrency(creditNote.appliedAmount, creditNote.currency)}
                                </span>
                            </div>
                            <Separator className="bg-ak-border" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm uppercase tracking-wider text-muted-foreground">
                                    Remaining
                                </span>
                                <span className={`font-mono text-lg font-semibold ${
                                    remainingCredit > 0 ? 'text-primary' : 'text-ak-green'
                                }`}>
                                    {formatCurrency(remainingCredit, creditNote.currency)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Reason */}
            <div className="glass rounded-xl p-5 space-y-2">
                <p className="text-micro uppercase tracking-wider text-muted-foreground">
                    Reason
                </p>
                <p className="text-sm whitespace-pre-wrap">
                    {creditNote.reason}
                </p>
            </div>

            {/* Notes */}
            {creditNote.notes && (
                <div className="glass rounded-xl p-5 space-y-2">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground">
                        Notes
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {creditNote.notes}
                    </p>
                </div>
            )}
        </div>
    );
}
