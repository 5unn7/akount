'use client';

import { useState } from 'react';
import { type Vendor } from '@/lib/api/vendors';
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
import { VendorDetailPanel } from './VendorDetailPanel';

interface VendorsTableProps {
    vendors: Vendor[];
}

const STATUS_BADGE_STYLES: Record<Vendor['status'], string> = {
    active: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function VendorsTable({ vendors }: VendorsTableProps) {
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [open, setOpen] = useState(false);

    const handleRowClick = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setOpen(true);
    };

    if (vendors.length === 0) {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No vendors found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add your first vendor to get started
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
                                    Open Bills
                                </TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors.map((vendor) => {
                                const statusStyle = STATUS_BADGE_STYLES[vendor.status];
                                const balanceDue = vendor.balanceDue ?? 0;

                                return (
                                    <TableRow
                                        key={vendor.id}
                                        onClick={() => handleRowClick(vendor)}
                                        className="border-b border-ak-border hover:bg-ak-bg-3/50 transition-colors cursor-pointer"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {vendor.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {vendor.entity.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {vendor.email && (
                                                    <span className="text-sm">
                                                        {vendor.email}
                                                    </span>
                                                )}
                                                {vendor.phone && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {vendor.phone}
                                                    </span>
                                                )}
                                                {!vendor.email && !vendor.phone && (
                                                    <span className="text-sm text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {vendor.paymentTerms || (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${statusStyle}`}>
                                                {vendor.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-mono text-sm">
                                                {vendor.openBills ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={`font-mono font-medium ${
                                                    balanceDue > 0 ? 'text-ak-red' : 'text-ak-green'
                                                }`}
                                            >
                                                {formatCurrency(balanceDue, 'CAD')}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <VendorDetailPanel vendor={selectedVendor} open={open} onOpenChange={setOpen} />
        </>
    );
}
