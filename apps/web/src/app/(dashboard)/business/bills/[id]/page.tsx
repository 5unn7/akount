import type { Metadata } from 'next';
import { formatDate } from '@/lib/utils/date';
import { notFound } from 'next/navigation';
import { getBill } from '@/lib/api/bills';
import { listVendors } from '@/lib/api/vendors';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { BillStatusBadge } from '@akount/ui/business';
import { FileText, Building2, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BillActions } from './bill-actions';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    try {
        const bill = await getBill(id);
        return {
            title: `Bill ${bill.billNumber} | Akount`,
            description: `Bill ${bill.billNumber} from ${bill.vendor.name}`,
        };
    } catch {
        return { title: 'Bill | Akount' };
    }
}

export default async function BillDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let bill;
    try {
        bill = await getBill(id);
    } catch {
        notFound();
    }

    const vendorsResult = await listVendors({ limit: 100 });
    const vendors = vendorsResult.vendors.map(v => ({
        id: v.id,
        name: v.name,
        paymentTerms: v.paymentTerms ?? null,
    }));

    const balanceDue = bill.total - bill.paidAmount;

    return (
        <div className="flex-1 space-y-6">
            {/* Back Link */}
            <Link
                href="/business/bills"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Bills
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-ak-red" />
                        <h1 className="text-2xl font-heading font-normal">
                            Bill {bill.billNumber}
                        </h1>
                        <BillStatusBadge status={bill.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Issued on {formatDate(bill.issueDate)} &middot;{' '}
                        Due {formatDate(bill.dueDate)}
                    </p>
                </div>
                <BillActions bill={bill} vendors={vendors} />
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Vendor */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        Vendor
                    </div>
                    <div>
                        <p className="font-medium">{bill.vendor.name}</p>
                        {bill.vendor.email && (
                            <p className="text-sm text-muted-foreground">
                                {bill.vendor.email}
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
                        {formatDate(bill.issueDate)}
                    </p>
                </div>

                {/* Due Date */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due Date
                    </div>
                    <p className="text-sm font-medium">
                        {formatDate(bill.dueDate)}
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
                    {bill.billLines.map((line, idx) => (
                        <div
                            key={line.id}
                            className={`grid grid-cols-12 gap-4 px-5 py-3.5 ${
                                idx !== bill.billLines.length - 1
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
                                {formatCurrency(line.unitPrice, bill.currency)}
                            </div>
                            <div className="col-span-2 text-right text-sm font-mono text-muted-foreground">
                                {formatCurrency(line.taxAmount, bill.currency)}
                            </div>
                            <div className="col-span-2 text-right text-sm font-mono font-medium">
                                {formatCurrency(line.amount, bill.currency)}
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
                            {formatCurrency(bill.subtotal, bill.currency)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-mono">
                            {formatCurrency(bill.taxAmount, bill.currency)}
                        </span>
                    </div>
                    <Separator className="bg-ak-border" />
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wider text-muted-foreground">
                            Total
                        </span>
                        <span className="font-mono text-lg font-semibold">
                            {formatCurrency(bill.total, bill.currency)}
                        </span>
                    </div>
                    {bill.paidAmount > 0 && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ak-green">Paid</span>
                                <span className="font-mono text-ak-green">
                                    {formatCurrency(bill.paidAmount, bill.currency)}
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
                                            ? bill.status === 'OVERDUE'
                                                ? 'text-ak-red'
                                                : 'text-primary'
                                            : 'text-ak-green'
                                    }`}
                                >
                                    {formatCurrency(balanceDue, bill.currency)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Notes */}
            {bill.notes && (
                <div className="glass rounded-xl p-5 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Notes
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {bill.notes}
                    </p>
                </div>
            )}
        </div>
    );
}
