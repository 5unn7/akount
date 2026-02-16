'use client';

import { useState } from 'react';
import type { Client } from '@/lib/api/clients';
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
import { ClientDetailPanel } from './ClientDetailPanel';

interface ClientsTableProps {
    clients: Client[];
    currency?: string;
}

const STATUS_BADGE_STYLES: Record<Client['status'], string> = {
    active: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function ClientsTable({ clients, currency = 'CAD' }: ClientsTableProps) {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [open, setOpen] = useState(false);

    const handleRowClick = (client: Client) => {
        setSelectedClient(client);
        setOpen(true);
    };

    if (clients.length === 0) {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No clients found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add your first client to get started
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
                                    Name
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Contact
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Payment Terms
                                </TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Status
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Open Invoices
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => {
                                const statusStyle = STATUS_BADGE_STYLES[client.status];
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
                                            <Badge className={`text-xs ${statusStyle}`}>
                                                {client.status.toUpperCase()}
                                            </Badge>
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

            <ClientDetailPanel client={selectedClient} open={open} onOpenChange={setOpen} currency={currency} />
        </>
    );
}
