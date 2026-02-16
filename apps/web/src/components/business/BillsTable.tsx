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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';

interface BillsTableProps {
    bills: Bill[];
}

const STATUS_BADGE_STYLES: Record<Bill['status'], string> = {
    DRAFT: 'bg-ak-bg-3 text-muted-foreground border-ak-border',
    PENDING: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
    PAID: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    OVERDUE: 'bg-ak-red/10 text-ak-red border-ak-red/20',
    CANCELLED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    PARTIALLY_PAID: 'bg-primary/10 text-primary border-primary/20',
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function BillsTable({ bills }: BillsTableProps) {
    const router = useRouter();

    const handleRowClick = (bill: Bill) => {
        router.push(`/business/invoices/bills/${bill.id}`);
    };

    if (bills.length === 0) {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No bills found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Record your first bill to get started
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="glass rounded-[14px]">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-ak-border hover:bg-transparent">
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Bill #
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Vendor
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Issue Date
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Due Date
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Status
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Total
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.map((bill) => {
                                const balanceDue = bill.total - bill.paidAmount;
                                const statusStyle = STATUS_BADGE_STYLES[bill.status];

                                return (
                                    <TableRow
                                        key={bill.id}
                                        onClick={() => handleRowClick(bill)}
                                        className="border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer"
                                    >
                                        <TableCell className="font-mono text-sm font-medium">
                                            {bill.billNumber}
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
                                            <Badge className={`text-xs ${statusStyle}`}>
                                                {bill.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-mono font-medium">
                                                {formatCurrency(bill.total, bill.currency)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={`font-mono font-medium ${
                                                    balanceDue > 0
                                                        ? bill.status === 'OVERDUE'
                                                            ? 'text-ak-red'
                                                            : 'text-primary'
                                                        : 'text-ak-green'
                                                }`}
                                            >
                                                {formatCurrency(balanceDue, bill.currency)}
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
