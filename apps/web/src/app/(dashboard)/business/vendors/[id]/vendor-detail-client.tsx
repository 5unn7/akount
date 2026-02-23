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
    Loader2,
    ExternalLink,
} from 'lucide-react';
import type { Vendor } from '@/lib/api/vendors';
import type { Bill } from '@/lib/api/bills';
import { apiFetch } from '@/lib/api/client-browser';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BillStatusBadge, VendorStatusBadge } from '@akount/ui/business';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface VendorDetailClientProps {
    vendor: Vendor;
    bills: Bill[];
}

type Tab = 'overview' | 'bills';


// Edit Vendor Dialog
function EditVendorDialog({
    vendor,
    onUpdate,
}: {
    vendor: Vendor;
    onUpdate: (updated: Vendor) => void;
}) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: vendor.name,
        email: vendor.email ?? '',
        phone: vendor.phone ?? '',
        address: vendor.address ?? '',
        paymentTerms: vendor.paymentTerms ?? '',
        status: vendor.status,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const updated = await apiFetch<Vendor>(`/api/business/vendors/${vendor.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    paymentTerms: formData.paymentTerms || null,
                    status: formData.status,
                }),
            });
            onUpdate(updated);
            toast.success('Vendor updated successfully');
            setOpen(false);
        } catch (err) {
            const error = err as Error;
            toast.error(error.message || 'Failed to update vendor');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Vendor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Vendor</DialogTitle>
                        <DialogDescription>
                            Update vendor information and contact details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Vendor Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="paymentTerms">Payment Terms</Label>
                            <Input
                                id="paymentTerms"
                                placeholder="e.g., Net 30"
                                value={formData.paymentTerms}
                                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: 'active' | 'inactive') =>
                                    setFormData({ ...formData, status: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Main Component
export function VendorDetailClient({ vendor: initialVendor, bills }: VendorDetailClientProps) {
    const router = useRouter();
    const [vendor, setVendor] = useState(initialVendor);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Calculate stats
    const totalBills = bills.length;
    const paidBills = bills.filter((bill) => bill.status === 'PAID').length;
    const totalBilled = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + (bill.total - bill.paidAmount), 0);

    // Get currency from entity
    const currency = vendor.entity?.functionalCurrency ?? 'CAD';

    const handleUpdate = (updated: Vendor) => {
        setVendor(updated);
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
                <EditVendorDialog vendor={vendor} onUpdate={handleUpdate} />
            </div>

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
