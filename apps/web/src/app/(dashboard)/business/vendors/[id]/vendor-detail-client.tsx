'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    DollarSign,
    Pencil,
    ExternalLink,
} from 'lucide-react';
import type { Vendor } from '@/lib/api/vendors';
import type { Bill } from '@/lib/api/bills';
import { apiFetch } from '@/lib/api/client-browser';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VendorForm } from '@/components/business/VendorForm';
import { BillStatusBadge, VendorStatusBadge } from '@akount/ui/business';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface VendorDetailClientProps {
    vendor: Vendor;
    bills: Bill[];
}

type Tab = 'overview' | 'bills';

// Main Component
export function VendorDetailClient({ vendor: initialVendor, bills }: VendorDetailClientProps) {
    const router = useRouter();
    const [vendor, setVendor] = useState(initialVendor);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [editOpen, setEditOpen] = useState(false);

    // Calculate stats
    const totalBills = bills.length;
    const paidBills = bills.filter((bill) => bill.status === 'PAID').length;
    const totalBilled = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + (bill.total - bill.paidAmount), 0);

    // Get currency from entity
    const currency = vendor.entity?.functionalCurrency ?? 'CAD';

    const handleEditSuccess = async () => {
        try {
            const updated = await apiFetch<Vendor>(`/api/business/vendors/${vendor.id}`);
            setVendor(updated);
        } catch {
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-heading font-normal">{vendor.name}</h1>
                        <VendorStatusBadge status={vendor.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Vendor since {formatDate(vendor.createdAt)}
                    </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Vendor
                </Button>
            </div>

            <VendorForm
                key={vendor.id}
                open={editOpen}
                onOpenChange={setEditOpen}
                entityId={vendor.entityId}
                editVendor={vendor}
                onSuccess={handleEditSuccess}
            />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Total Bills
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono">{totalBills}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {paidBills} paid
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Total Spent
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono">{formatCurrency(totalBilled, currency)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime spend</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Outstanding
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-ak-red/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono text-ak-red">
                            {formatCurrency(totalOutstanding, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Accounts payable</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Payment Terms
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono">
                            {vendor.paymentTerms || 'Not set'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Default terms</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-ak-border">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === 'overview'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('bills')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === 'bills'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Bill History ({totalBills})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex gap-3">
                                    <Building2 className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Vendor Name
                                        </p>
                                        <p className="text-sm">{vendor.name}</p>
                                    </div>
                                </div>

                                {vendor.email && (
                                    <div className="flex gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Email
                                            </p>
                                            <p className="text-sm">{vendor.email}</p>
                                        </div>
                                    </div>
                                )}

                                {vendor.phone && (
                                    <div className="flex gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Phone
                                            </p>
                                            <p className="text-sm">{vendor.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {vendor.address && (
                                    <div className="flex gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Address
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{vendor.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!vendor.email && !vendor.phone && !vendor.address && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No contact information available
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'bills' && (
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Bill History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {bills.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No bills yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-ak-border hover:bg-transparent">
                                            <TableHead className="text-xs uppercase tracking-wider">
                                                Bill #
                                            </TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider">
                                                Date
                                            </TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider">
                                                Due
                                            </TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider">
                                                Status
                                            </TableHead>
                                            <TableHead className="text-right text-xs uppercase tracking-wider">
                                                Amount
                                            </TableHead>
                                            <TableHead className="text-right text-xs uppercase tracking-wider">
                                                Outstanding
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bills.map((bill) => {
                                            const outstanding = bill.total - bill.paidAmount;
                                            return (
                                                <TableRow
                                                    key={bill.id}
                                                    className="border-ak-border hover:bg-ak-bg-3/50"
                                                >
                                                    <TableCell className="font-mono text-sm">
                                                        <Link
                                                            href={`/business/bills/${bill.id}`}
                                                            className="text-primary hover:text-ak-pri-hover flex items-center gap-1"
                                                        >
                                                            {bill.billNumber}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
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
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(bill.total, currency)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-ak-red">
                                                        {outstanding > 0 ? formatCurrency(outstanding, currency) : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
