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
    currency?: string;
}

const STATUS_BADGE_STYLES: Record<Bill['status'], string> = {
    DRAFT: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    PENDING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PARTIALLY_PAID: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    PAID: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    OVERDUE: 'bg-ak-red/10 text-ak-red border-ak-red/20',
    CANCELLED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function BillsTable({ bills, currency = 'CAD' }: BillsTableProps) {
    const router = useRouter();

    const handleRowClick = (bill: Bill) => {
        router.push(`/business/bills/${bill.id}`);
    };

    if (bills.length === 0) {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No bills found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add your first bill to get started
                    </p>
                </CardContent>
            </Card>
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
                            <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                Amount
                            </TableHead>
                            <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                Balance Due
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.map((bill) => {
                            const statusStyle = STATUS_BADGE_STYLES[bill.status];
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
                                        <Badge className={`text-xs ${statusStyle}`}>
                                            {bill.status.replace('_', ' ')}
                                        </Badge>
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
