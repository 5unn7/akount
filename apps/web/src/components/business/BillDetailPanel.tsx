'use client';
import { formatDate } from '@/lib/utils/date';

import type { Bill } from '@/lib/api/bills';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { BillStatusBadge } from '@akount/ui/business';
import { FileText, Building2, Calendar } from 'lucide-react';

interface BillDetailPanelProps {
    bill: Bill | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BillDetailPanel({ bill, open, onOpenChange }: BillDetailPanelProps) {
    if (!bill) return null;

    const balanceDue = bill.total - bill.paidAmount;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-heading font-normal flex items-center gap-2">
                                <FileText className="h-5 w-5 text-ak-red" />
                                Bill {bill.billNumber}
                            </SheetTitle>
                            <SheetDescription>
                                Issued on {formatDate(bill.issueDate)}
                            </SheetDescription>
                        </div>
                        <BillStatusBadge status={bill.status} />
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Vendor Info */}
                    <div className="glass-2 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
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

                    {/* Key Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-micro uppercase tracking-wide text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Issue Date
                            </div>
                            <p className="text-sm font-medium">
                                {formatDate(bill.issueDate)}
                            </p>
                        </div>
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-micro uppercase tracking-wide text-muted-foreground">
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
                        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                            Line Items
                        </h3>
                        <div className="glass-2 rounded-lg overflow-hidden">
                            {bill.billLines.map((line, idx) => (
                                <div
                                    key={line.id}
                                    className={`p-4 ${
                                        idx !== bill.billLines.length - 1
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
                                                Qty: {line.quantity} × {formatCurrency(line.unitPrice, bill.currency)}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="font-mono font-medium text-sm">
                                                {formatCurrency(line.amount, bill.currency)}
                                            </p>
                                            {line.taxAmount > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    +{formatCurrency(line.taxAmount, bill.currency)} tax
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
                            <span className="text-sm uppercase tracking-wide text-muted-foreground">
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
                                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
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

                    {/* Notes */}
                    {bill.notes && (
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <p className="text-micro uppercase tracking-wide text-muted-foreground">
                                Notes
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {bill.notes}
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
