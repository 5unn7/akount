'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import type { Client } from '@/lib/api/clients';
import type { Invoice } from '@/lib/api/invoices';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/api/transactions.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { InvoiceStatusBadge, AccountStatusBadge } from '@akount/ui/business';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateClient } from '@/lib/api/clients';

// ============================================================================
// Types
// ============================================================================

interface ClientDetailClientProps {
    client: Client;
    invoices: Invoice[];
}

type Tab = 'overview' | 'invoices';

// ============================================================================
// Status Badge
// ============================================================================


// ============================================================================
// Invoice Status Badge
// ============================================================================



// ============================================================================
// Edit Client Dialog
// ============================================================================

function EditClientDialog({
    client,
    onUpdate,
}: {
    client: Client;
    onUpdate: (updated: Client) => void;
}) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        paymentTerms: client.paymentTerms ?? '',
        status: client.status,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const updated = await updateClient(client.id, {
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                address: formData.address || null,
                paymentTerms: formData.paymentTerms || null,
                status: formData.status,
            });
            onUpdate(updated);
            toast.success('Client updated successfully');
            setOpen(false);
        } catch (err) {
            const error = err as Error;
            toast.error(error.message || 'Failed to update client');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                        <DialogDescription>
                            Update client information and contact details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Client Name *</Label>
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

// ============================================================================
// Main Component
// ============================================================================

export function ClientDetailClient({ client: initialClient, invoices }: ClientDetailClientProps) {
    const router = useRouter();
    const [client, setClient] = useState(initialClient);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Calculate stats
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID').length;
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

    // Get currency from entity context (client doesn't have currency field)
    const currency = 'CAD'; // TODO: Get from entity context when available

    const handleUpdate = (updated: Client) => {
        setClient(updated);
        router.refresh();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-heading font-normal">{client.name}</h1>
                        <StatusBadge status={client.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Client since {formatDate(client.createdAt)}
                    </p>
                </div>
                <EditClientDialog client={client} onUpdate={handleUpdate} />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Total Invoices
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono">{totalInvoices}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {paidInvoices} paid
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-normal text-muted-foreground">
                            Total Billed
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground/40" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono">{formatCurrency(totalBilled, currency)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime revenue</p>
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
                        <p className="text-xs text-muted-foreground mt-1">Accounts receivable</p>
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
                            {client.paymentTerms || 'Not set'}
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
                        onClick={() => setActiveTab('invoices')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === 'invoices'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Invoice History ({totalInvoices})
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
                                            Client Name
                                        </p>
                                        <p className="text-sm">{client.name}</p>
                                    </div>
                                </div>

                                {client.email && (
                                    <div className="flex gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Email
                                            </p>
                                            <p className="text-sm">{client.email}</p>
                                        </div>
                                    </div>
                                )}

                                {client.phone && (
                                    <div className="flex gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Phone
                                            </p>
                                            <p className="text-sm">{client.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {client.address && (
                                    <div className="flex gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground/60 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Address
                                            </p>
                                            <p className="text-sm whitespace-pre-line">{client.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'invoices' && (
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Invoice History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {invoices.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        No invoices yet for this client
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {invoices.map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-ak-border hover:border-ak-border-2 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/business/invoices/${invoice.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {invoice.invoiceNumber}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Due {formatDate(invoice.dueDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-mono">
                                                        {formatCurrency(invoice.total, invoice.currency)}
                                                    </p>
                                                    {invoice.paidAmount > 0 && invoice.paidAmount < invoice.total && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatCurrency(invoice.paidAmount, invoice.currency)} paid
                                                        </p>
                                                    )}
                                                </div>
                                                <InvoiceStatusBadge status={invoice.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
