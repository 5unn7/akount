'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Bill } from '@/lib/api/bills';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { BillStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';
import { apiFetch } from '@/lib/api/client-browser';
import { XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { BulkActionToolbar } from '@/components/shared/BulkActionToolbar';

interface BillsTableProps {
    bills: Bill[];
    currency?: string;
    onCancelSuccess?: () => void;
}

export function BillsTable({ bills, currency = 'CAD', onCancelSuccess }: BillsTableProps) {
    const router = useRouter();
    const [bulkCancelling, setBulkCancelling] = useState(false);

    const cancellableBills = bills.filter((b) =>
        ['DRAFT', 'PENDING'].includes(b.status)
    );
    const bulk = useBulkSelection(cancellableBills);

    const handleRowClick = (bill: Bill) => {
        router.push(`/business/bills/${bill.id}`);
    };

    const handleBulkCancel = async () => {
        setBulkCancelling(true);
        let succeeded = 0;
        let failed = 0;
        for (const id of Array.from(bulk.selectedIds)) {
            try {
                await apiFetch(`/api/business/bills/${id}/cancel`, {
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
            toast.success(`${succeeded} bill${succeeded > 1 ? 's' : ''} cancelled`);
        } else {
            toast.warning(`${succeeded} cancelled, ${failed} failed`);
        }
        onCancelSuccess?.();
    };

    if (bills.length === 0) {
        return (
            <EmptyState
                title="No bills found"
                description="Add your first bill to get started"
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
                    label: bulkCancelling ? 'Cancelling...' : `Cancel ${bulk.count} Bill${bulk.count > 1 ? 's' : ''}`,
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
                                    aria-label="Select all cancellable bills"
                                />
                            </TableHead>
                            <TableHead variant="label">
                                Bill #
                            </TableHead>
                            <TableHead variant="label">
                                Vendor
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
                                Amount
                            </TableHead>
                            <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                Balance Due
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.map((bill) => {
                            const balanceDue = bill.total - bill.paidAmount;

                            return (
                                <TableRow
                                    key={bill.id}
                                    onClick={() => handleRowClick(bill)}
                                    className={`border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer ${
                                        bulk.selectedIds.has(bill.id) ? 'bg-ak-pri-dim/30' : ''
                                    }`}
                                >
                                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                                        {['DRAFT', 'PENDING'].includes(bill.status) ? (
                                            <Checkbox
                                                checked={bulk.selectedIds.has(bill.id)}
                                                onCheckedChange={() => bulk.toggle(bill.id)}
                                                aria-label={`Select bill ${bill.billNumber}`}
                                            />
                                        ) : (
                                            <div className="h-4 w-4" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium font-mono">
                                            {bill.billNumber}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {bill.vendor.name}
                                            </span>
                                            {bill.vendor.email && (
                                                <span className="text-xs text-muted-foreground">
                                                    {bill.vendor.email}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(bill.issueDate)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(bill.dueDate)}
                                    </TableCell>
                                    <TableCell>
                                        <BillStatusBadge status={bill.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-mono text-sm">
                                            {formatCurrency(bill.total, currency)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span
                                            className={`font-mono font-medium ${
                                                balanceDue > 0 ? 'text-ak-red' : 'text-ak-green'
                                            }`}
                                        >
                                            {formatCurrency(balanceDue, currency)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </>
    );
}
