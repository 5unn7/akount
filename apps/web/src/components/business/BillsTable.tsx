'use client';

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
import { formatCurrency } from '@/lib/utils/currency';
import { BillStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';

interface BillsTableProps {
    bills: Bill[];
    currency?: string;
}

export function BillsTable({ bills, currency = 'CAD' }: BillsTableProps) {
    const router = useRouter();

    const handleRowClick = (bill: Bill) => {
        router.push(`/business/bills/${bill.id}`);
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
        <Card className="glass rounded-[14px]">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-ak-border hover:bg-transparent">
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
                                    className="border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer"
                                >
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
                                        {new Date(bill.issueDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(bill.dueDate).toLocaleDateString()}
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
    );
}
