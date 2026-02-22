'use client';
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
import { formatCurrency } from '@/lib/utils/currency';
import { InvoiceStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';

interface InvoiceTableProps {
    invoices: Invoice[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
    const router = useRouter();

    const handleRowClick = (invoice: Invoice) => {
        router.push(`/business/invoices/${invoice.id}`);
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
            <Card className="glass rounded-[14px]">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-ak-border hover:bg-transparent">
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
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Total
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => {
                                const balanceDue = invoice.total - invoice.paidAmount;

                                return (
                                    <TableRow
                                        key={invoice.id}
                                        onClick={() => handleRowClick(invoice)}
                                        className="border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer"
                                    >
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
