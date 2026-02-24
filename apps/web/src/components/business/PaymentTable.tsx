'use client';
import { formatDate } from '@/lib/utils/date';

import { useState } from 'react';
import type { Payment } from '@/lib/api/payments';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { EmptyState } from '@akount/ui';

interface PaymentTableProps {
    payments: Payment[];
}


const METHOD_LABELS: Record<string, string> = {
    CARD: 'Card',
    TRANSFER: 'Transfer',
    CASH: 'Cash',
    CHECK: 'Check',
    WIRE: 'Wire',
    OTHER: 'Other',
};

export function PaymentTable({ payments }: PaymentTableProps) {
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [open, setOpen] = useState(false);

    const handleRowClick = (payment: Payment) => {
        setSelectedPayment(payment);
        setOpen(true);
    };

    if (payments.length === 0) {
        return (
            <EmptyState
                title="No payments found"
                description="Record your first payment to get started"
            />
        );
    }

    return (
        <>
            <Card className="glass rounded-[14px]">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-ak-border hover:bg-transparent">
                                <TableHead variant="label">
                                    Date
                                </TableHead>
                                <TableHead variant="label">
                                    Type
                                </TableHead>
                                <TableHead variant="label">
                                    Client / Vendor
                                </TableHead>
                                <TableHead variant="label">
                                    Method
                                </TableHead>
                                <TableHead variant="label">
                                    Reference
                                </TableHead>
                                <TableHead className="text-micro uppercase tracking-wider text-muted-foreground text-center">
                                    Allocations
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                    Amount
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => {
                                const isCustomer = !!payment.clientId;
                                const partyName = isCustomer
                                    ? payment.client?.name
                                    : payment.vendor?.name;

                                return (
                                    <TableRow
                                        key={payment.id}
                                        onClick={() => handleRowClick(payment)}
                                        className="border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer"
                                    >
                                        <TableCell className="text-sm">
                                            {formatDate(payment.date)}
                                        </TableCell>
                                        <TableCell>
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
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {partyName ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-muted-foreground">
                                            {payment.reference ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {payment.allocations.length}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-mono font-medium ${isCustomer ? 'text-ak-green' : ''}`}>
                                                {formatCurrency(payment.amount, payment.currency)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Detail Sheet */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="glass w-full sm:max-w-2xl overflow-y-auto">
                    {selectedPayment && (
                        <PaymentDetail payment={selectedPayment} />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

function PaymentDetail({ payment }: { payment: Payment }) {
    const isCustomer = !!payment.clientId;
    const partyName = isCustomer
        ? payment.client?.name
        : payment.vendor?.name;

    const totalAllocated = payment.allocations.reduce(
        (sum, a) => sum + a.amount,
        0
    );
    const unallocated = payment.amount - totalAllocated;

    return (
        <>
            <SheetHeader className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <SheetTitle className="text-2xl font-heading font-normal flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Payment
                        </SheetTitle>
                        <SheetDescription>
                            {formatDate(payment.date)} &middot;{' '}
                            {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                            {payment.reference && ` &middot; Ref: ${payment.reference}`}
                        </SheetDescription>
                    </div>
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
            </SheetHeader>

            <div className="mt-6 space-y-6">
                {/* Party Info */}
                <div className="glass-2 rounded-lg p-4 space-y-2">
                    <p className="text-micro uppercase tracking-wide text-muted-foreground">
                        {isCustomer ? 'Client' : 'Vendor'}
                    </p>
                    <p className="font-medium">{partyName ?? 'Unknown'}</p>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-wider text-muted-foreground">
                        Amount
                    </span>
                    <span className="font-mono text-lg font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                    </span>
                </div>

                <Separator className="bg-ak-border" />

                {/* Allocations */}
                <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
                        Allocations
                    </h3>
                    {payment.allocations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No allocations — full amount is unallocated
                        </p>
                    ) : (
                        <div className="glass-2 rounded-lg overflow-hidden">
                            {payment.allocations.map((alloc, idx) => {
                                const docNumber = alloc.invoice
                                    ? alloc.invoice.invoiceNumber
                                    : alloc.bill
                                      ? alloc.bill.billNumber
                                      : 'Unknown';
                                const docType = alloc.invoiceId
                                    ? 'Invoice'
                                    : 'Bill';

                                return (
                                    <div
                                        key={alloc.id}
                                        className={`p-4 flex items-center justify-between ${
                                            idx !== payment.allocations.length - 1
                                                ? 'border-b border-ak-border'
                                                : ''
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {docType} {docNumber}
                                            </p>
                                        </div>
                                        <span className="font-mono font-medium text-sm">
                                            {formatCurrency(alloc.amount, payment.currency)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Allocated</span>
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

                {/* Notes */}
                {payment.notes && (
                    <>
                        <Separator className="bg-ak-border" />
                        <div className="glass-2 rounded-lg p-4 space-y-2">
                            <p className="text-micro uppercase tracking-wide text-muted-foreground">
                                Notes
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {payment.notes}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
