'use client';
import { formatDate } from '@/lib/utils/date';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Payment, PaymentAllocation } from '@/lib/api/payments';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { apiFetch } from '@/lib/api/client-browser';
import {
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    BookOpen,
    ExternalLink,
    Loader2,
    Trash2,
} from 'lucide-react';
import { EmptyState } from '@akount/ui';
import { toast } from 'sonner';

interface PaymentTableProps {
    payments: Payment[];
    onPaymentDeleted?: () => void;
}


const METHOD_LABELS: Record<string, string> = {
    CARD: 'Card',
    TRANSFER: 'Transfer',
    CASH: 'Cash',
    CHECK: 'Check',
    WIRE: 'Wire',
    OTHER: 'Other',
};

export function PaymentTable({ payments: initialPayments, onPaymentDeleted }: PaymentTableProps) {
    const [payments, setPayments] = useState(initialPayments);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [open, setOpen] = useState(false);

    const handleRowClick = (payment: Payment) => {
        setSelectedPayment(payment);
        setOpen(true);
    };

    const handleDeleteSuccess = (deletedId: string) => {
        setPayments(prev => prev.filter(p => p.id !== deletedId));
        setSelectedPayment(null);
        setOpen(false);
        onPaymentDeleted?.();
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
                        <PaymentDetail
                            payment={selectedPayment}
                            onDeleteSuccess={handleDeleteSuccess}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

interface GLAccount {
    id: string;
    code: string;
    name: string;
}

function PaymentDetail({
    payment,
    onDeleteSuccess,
}: {
    payment: Payment;
    onDeleteSuccess: (id: string) => void;
}) {
    const isCustomer = !!payment.clientId;
    const partyName = isCustomer
        ? payment.client?.name
        : payment.vendor?.name;

    const totalAllocated = payment.allocations.reduce(
        (sum, a) => sum + a.amount,
        0
    );
    const unallocated = payment.amount - totalAllocated;

    const [deleting, setDeleting] = useState(false);
    const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
    const [postedAllocations, setPostedAllocations] = useState<Record<string, string>>({});
    const [postingAlloc, setPostingAlloc] = useState<string | null>(null);
    const [selectedGLAccount, setSelectedGLAccount] = useState<string>('');

    // Fetch bank GL accounts for Post to GL
    useEffect(() => {
        if (payment.allocations.length === 0) return;
        apiFetch<GLAccount[]>('/api/accounting/chart-of-accounts?accountType=ASSET')
            .then(setGLAccounts)
            .catch(() => {
                // GL accounts not available — posting will still work if user has accounts
            });
    }, [payment.allocations.length]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/api/business/payments/${payment.id}`, {
                method: 'DELETE',
            });
            toast.success('Payment deleted');
            onDeleteSuccess(payment.id);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete payment');
            setDeleting(false);
        }
    };

    const handlePostAllocation = async (alloc: PaymentAllocation) => {
        if (!selectedGLAccount) {
            toast.error('Please select a bank account first');
            return;
        }
        setPostingAlloc(alloc.id);
        try {
            const result = await apiFetch<{ journalEntryId: string; type: string }>(
                `/api/business/payments/${payment.id}/allocations/${alloc.id}/post`,
                {
                    method: 'POST',
                    body: JSON.stringify({ bankGLAccountId: selectedGLAccount }),
                }
            );
            setPostedAllocations(prev => ({
                ...prev,
                [alloc.id]: result.journalEntryId,
            }));
            toast.success('Allocation posted to GL');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to post allocation');
        } finally {
            setPostingAlloc(null);
        }
    };

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
                            {payment.reference && ` · Ref: ${payment.reference}`}
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2">
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
                </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
                {/* Party Info */}
                <Link
                    href={isCustomer
                        ? `/business/clients/${payment.clientId}`
                        : `/business/vendors/${payment.vendorId}`
                    }
                    className="glass-2 rounded-lg p-4 space-y-2 block group hover:border-ak-border-2 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-micro uppercase tracking-wide text-muted-foreground">
                            {isCustomer ? 'Client' : 'Vendor'}
                        </p>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="font-medium">{partyName ?? 'Unknown'}</p>
                </Link>

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

                    {/* Bank account selector for GL posting */}
                    {payment.allocations.length > 0 && glAccounts.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">
                                Bank Account (for GL posting)
                            </label>
                            <Select value={selectedGLAccount} onValueChange={setSelectedGLAccount}>
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Select bank account..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {glAccounts.map(gl => (
                                        <SelectItem key={gl.id} value={gl.id}>
                                            {gl.code} — {gl.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

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
                                const journalEntryId = postedAllocations[alloc.id];

                                return (
                                    <div
                                        key={alloc.id}
                                        className={`p-4 space-y-2 ${
                                            idx !== payment.allocations.length - 1
                                                ? 'border-b border-ak-border'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Link
                                                    href={alloc.invoiceId
                                                        ? `/business/invoices/${alloc.invoiceId}`
                                                        : `/business/bills/${alloc.billId}`
                                                    }
                                                    className="text-sm font-medium hover:text-primary transition-colors inline-flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {docType} {docNumber}
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                </Link>
                                            </div>
                                            <span className="font-mono font-medium text-sm">
                                                {formatCurrency(alloc.amount, payment.currency)}
                                            </span>
                                        </div>

                                        {/* Post to GL / View JE */}
                                        <div className="flex justify-end">
                                            {journalEntryId ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                    className="h-7 gap-1.5 text-xs text-ak-green hover:text-ak-green"
                                                >
                                                    <Link href={`/accounting/journal-entries/${journalEntryId}`}>
                                                        <ExternalLink className="h-3 w-3" />
                                                        View Journal Entry
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 gap-1.5 text-xs"
                                                    disabled={!selectedGLAccount || postingAlloc !== null}
                                                    onClick={() => handlePostAllocation(alloc)}
                                                >
                                                    {postingAlloc === alloc.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <BookOpen className="h-3 w-3" />
                                                    )}
                                                    Post to GL
                                                </Button>
                                            )}
                                        </div>
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

                {/* Delete Action */}
                <Separator className="bg-ak-border" />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-ak-red hover:text-ak-red w-full"
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Delete Payment
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This payment will be permanently removed. All allocations will be
                                reversed, restoring outstanding balances on associated invoices and bills.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Payment</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                Delete Payment
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
