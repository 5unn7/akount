'use client';
import { useState } from 'react';
import { formatDate } from '@/lib/utils/date';

import { useRouter } from 'next/navigation';
import type { Invoice } from '@/lib/api/invoices';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/utils/currency';
import { InvoiceStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';
import { apiFetch } from '@/lib/api/client-browser';
import { XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { BulkActionToolbar } from '@/components/shared/BulkActionToolbar';

interface InvoiceTableProps {
    invoices: Invoice[];
    onCancelSuccess?: () => void;
}

export function InvoiceTable({ invoices, onCancelSuccess }: InvoiceTableProps) {
    const router = useRouter();
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
    const [bulkCancelling, setBulkCancelling] = useState(false);

    const cancellableInvoices = invoices.filter((inv) =>
        ['DRAFT', 'SENT'].includes(inv.status)
    );
    const bulk = useBulkSelection(cancellableInvoices);

    const handleRowClick = (invoice: Invoice) => {
        router.push(`/business/invoices/${invoice.id}`);
    };

    const handleCancel = async (invoice: Invoice) => {
        setCancellingId(invoice.id);
        try {
            await apiFetch(`/api/business/invoices/${invoice.id}/cancel`, {
                method: 'POST',
            });
            toast.success(`Invoice ${invoice.invoiceNumber} cancelled`);
            onCancelSuccess?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to cancel invoice');
        } finally {
            setCancellingId(null);
            setConfirmInvoice(null);
        }
    };

    const handleBulkCancel = async () => {
        setBulkCancelling(true);
        let succeeded = 0;
        let failed = 0;
        for (const id of Array.from(bulk.selectedIds)) {
            try {
                await apiFetch(`/api/business/invoices/${id}/cancel`, {
                    method: 'POST',
                });
                succeeded++;
            } catch {
                failed++;
            }
        }
        setBulkCancelling(false);
        bulk.clear();
        if (failed === 0) {
            toast.success(`${succeeded} invoice${succeeded > 1 ? 's' : ''} cancelled`);
        } else {
            toast.warning(`${succeeded} cancelled, ${failed} failed`);
        }
        onCancelSuccess?.();
    };

    if (invoices.length === 0) {
        return (
            <EmptyState
                title="No invoices found"
                description="Create your first invoice to get started"
            />
        );
    }

    return (
        <>
            <BulkActionToolbar
                count={bulk.count}
                onClear={bulk.clear}
                actions={[
                    {
                        label: bulkCancelling ? 'Cancelling...' : `Cancel ${bulk.count} Invoice${bulk.count > 1 ? 's' : ''}`,
                        icon: bulkCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />,
                        onClick: handleBulkCancel,
                        variant: 'destructive',
                        disabled: bulkCancelling,
                    },
                ]}
            />
            <Card className="glass rounded-[14px]">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-ak-border hover:bg-transparent">
                                <TableHead className="w-[40px] pl-4">
                                    <Checkbox
                                        checked={bulk.isAllSelected ? true : bulk.isIndeterminate ? 'indeterminate' : false}
                                        onCheckedChange={bulk.toggleAll}
                                        aria-label="Select all cancellable invoices"
                                    />
                                </TableHead>
                                <TableHead variant="label">
                                    Invoice #
                                </TableHead>
                                <TableHead variant="label">
                                    Client
                                </TableHead>
                                <TableHead variant="label">
                                    Issue Date
                                </TableHead>
                                <TableHead variant="label">
                                    Due Date
                                </TableHead>
                                <TableHead variant="label">
                                    Status
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                    Total
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => {
                                const balanceDue = invoice.total - invoice.paidAmount;

                                return (
                                    <TableRow
                                        key={invoice.id}
                                        onClick={() => handleRowClick(invoice)}
                                        className={`group border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer ${
                                            bulk.selectedIds.has(invoice.id) ? 'bg-ak-pri-dim/30' : ''
                                        }`}
                                    >
                                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                                            {['DRAFT', 'SENT'].includes(invoice.status) ? (
                                                <Checkbox
                                                    checked={bulk.selectedIds.has(invoice.id)}
                                                    onCheckedChange={() => bulk.toggle(invoice.id)}
                                                    aria-label={`Select invoice ${invoice.invoiceNumber}`}
                                                />
                                            ) : (
                                                <div className="h-4 w-4" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm font-medium">
                                            {invoice.invoiceNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {invoice.client.name}
                                                </span>
                                                {invoice.client.email && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {invoice.client.email}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(invoice.issueDate)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(invoice.dueDate)}
                                        </TableCell>
                                        <TableCell>
                                            <InvoiceStatusBadge status={invoice.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-mono font-medium">
                                                {formatCurrency(invoice.total, invoice.currency)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={`font-mono font-medium ${
                                                    balanceDue > 0
                                                        ? invoice.status === 'OVERDUE'
                                                            ? 'text-ak-red'
                                                            : 'text-primary'
                                                        : 'text-ak-green'
                                                }`}
                                            >
                                                {formatCurrency(balanceDue, invoice.currency)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {['DRAFT', 'SENT'].includes(invoice.status) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={cancellingId === invoice.id}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-ak-red hover:text-ak-red h-7 px-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmInvoice(invoice);
                                                    }}
                                                >
                                                    {cancellingId === invoice.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <XCircle className="h-3.5 w-3.5" />
                                                    )}
                                                    Cancel
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!confirmInvoice} onOpenChange={(open) => !open && setConfirmInvoice(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Invoice #{confirmInvoice?.invoiceNumber} will be marked as cancelled.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => confirmInvoice && handleCancel(confirmInvoice)}
                        >
                            Cancel Invoice
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
