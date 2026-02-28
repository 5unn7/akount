'use client';

import { useRouter } from 'next/navigation';
import type { CreditNote } from '@/lib/api/credit-notes';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { CreditNoteStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { FileText } from 'lucide-react';

interface CreditNoteTableProps {
    creditNotes: CreditNote[];
    currency?: string;
    onStatusChange?: () => void;
}

export function CreditNoteTable({ creditNotes, currency = 'CAD' }: CreditNoteTableProps) {
    const router = useRouter();

    const handleRowClick = (creditNote: CreditNote) => {
        router.push(`/business/credit-notes/${creditNote.id}`);
    };

    if (creditNotes.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="No credit notes"
                description="Credit notes will appear here once created"
            />
        );
    }

    return (
        <Card className="glass rounded-[14px] overflow-hidden">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-ak-border hover:bg-transparent">
                            <TableHead className="text-xs text-muted-foreground">CN Number</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Linked To</TableHead>
                            <TableHead className="text-xs text-muted-foreground text-right">Amount</TableHead>
                            <TableHead className="text-xs text-muted-foreground text-right">Applied</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Reason</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {creditNotes.map((cn) => {
                            const linkedDoc = cn.linkedInvoice
                                ? `INV ${cn.linkedInvoice.invoiceNumber}`
                                : cn.linkedBill
                                    ? `BILL ${cn.linkedBill.billNumber}`
                                    : '—';

                            return (
                                <TableRow
                                    key={cn.id}
                                    className="border-ak-border cursor-pointer hover:bg-ak-bg-3 transition-colors"
                                    onClick={() => handleRowClick(cn)}
                                >
                                    <TableCell className="font-mono text-sm">
                                        {cn.creditNoteNumber}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(cn.date)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {linkedDoc}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatCurrency(cn.amount, cn.currency || currency)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                        {cn.appliedAmount > 0
                                            ? formatCurrency(cn.appliedAmount, cn.currency || currency)
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <CreditNoteStatusBadge status={cn.status} />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                        {cn.reason}
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
