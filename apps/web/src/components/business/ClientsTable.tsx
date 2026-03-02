'use client';

import { useRouter } from 'next/navigation';
import type { Client } from '@/lib/api/clients';
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
import { ClientStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';

interface ClientsTableProps {
    clients: Client[];
    currency?: string;
}

export function ClientsTable({ clients, currency = 'CAD' }: ClientsTableProps) {
    const router = useRouter();

    const handleRowClick = (client: Client) => {
        router.push(`/business/clients/${client.id}`);
    };

    if (clients.length === 0) {
        return (
            <EmptyState
                title="No clients found"
                description="Add your first client to get started"
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
                                    Name
                                </TableHead>
                                <TableHead variant="label">
                                    Contact
                                </TableHead>
                                <TableHead variant="label">
                                    Payment Terms
                                </TableHead>
                                <TableHead variant="label">
                                    Status
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                    Open Invoices
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => {
                                const balanceDue = client.balanceDue ?? 0;

                                return (
                                    <TableRow
                                        key={client.id}
                                        onClick={() => handleRowClick(client)}
                                        className="border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {client.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {client.entity.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {client.email && (
                                                    <span className="text-sm">
                                                        {client.email}
                                                    </span>
                                                )}
                                                {client.phone && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {client.phone}
                                                    </span>
                                                )}
                                                {!client.email && !client.phone && (
                                                    <span className="text-sm text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {client.paymentTerms || (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <ClientStatusBadge status={client.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-mono text-sm">
                                                {client.openInvoices ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={`font-mono font-medium ${
                                                    balanceDue > 0 ? 'text-primary' : 'text-ak-green'
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
