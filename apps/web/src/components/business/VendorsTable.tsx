'use client';

import { useState } from 'react';
import type { Vendor } from '@/lib/api/vendors';
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
import { VendorStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';
import { VendorDetailPanel } from './VendorDetailPanel';

interface VendorsTableProps {
    vendors: Vendor[];
    currency?: string;
}

export function VendorsTable({ vendors, currency = 'CAD' }: VendorsTableProps) {
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [open, setOpen] = useState(false);

    const handleRowClick = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setOpen(true);
    };

    if (vendors.length === 0) {
        return (
            <EmptyState
                title="No vendors found"
                description="Add your first vendor to get started"
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
                                    Open Bills
                                </TableHead>
                                <TableHead className="text-right text-micro uppercase tracking-wider text-muted-foreground">
                                    Balance Due
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors.map((vendor) => {
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
                                            <VendorStatusBadge status={vendor.status} />
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

            <VendorDetailPanel vendor={selectedVendor} open={open} onOpenChange={setOpen} currency={currency} />
        </>
    );
}
