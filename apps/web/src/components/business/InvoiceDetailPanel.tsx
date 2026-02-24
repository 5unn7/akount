'use client';
import { formatDate } from '@/lib/utils/date';

import type { Invoice } from '@/lib/api/invoices';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { InvoiceStatusBadge } from '@akount/ui/business';
import { FileText, User, Calendar, DollarSign } from 'lucide-react';

interface InvoiceDetailPanelProps {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailPanel({
    invoice,
    open,
    onOpenChange,
}: InvoiceDetailPanelProps) {
    if (!invoice) return null;

    const balanceDue = invoice.total - invoice.paidAmount;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-heading font-normal flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Invoice {invoice.invoiceNumber}
                            </SheetTitle>
                            <SheetDescription>
                                Issued on {formatDate(invoice.issueDate)}
                            </SheetDescription>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Client Info */}
                    <div className="glass-2 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
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

                    {/* Key Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-micro uppercase tracking-wide text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Issue Date
                            </div>
                            <p className="text-sm font-medium">
                                {formatDate(invoice.issueDate)}
                            </p>
                        </div>
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-micro uppercase tracking-wide text-muted-foreground">
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
                        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                            Line Items
                        </h3>
                        <div className="glass-2 rounded-lg overflow-hidden">
                            {invoice.invoiceLines.map((line, idx) => (
                                <div
                                    key={line.id}
                                    className={`p-4 ${
                                        idx !== invoice.invoiceLines.length - 1
                                            ? 'border-b border-ak-border'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm">
                                                {line.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Qty: {line.quantity} × {formatCurrency(line.unitPrice, invoice.currency)}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="font-mono font-medium text-sm">
                                                {formatCurrency(line.amount, invoice.currency)}
                                            </p>
                                            {line.taxAmount > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    +{formatCurrency(line.taxAmount, invoice.currency)} tax
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-ak-border" />

                    {/* Totals */}
                    <div className="space-y-3">
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
                            <span className="text-sm uppercase tracking-wide text-muted-foreground">
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
                                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
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

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <p className="text-micro uppercase tracking-wide text-muted-foreground">
                                Notes
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
