'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    DollarSign,
    Pencil,
    Trash2,
    Loader2,
} from 'lucide-react';
import type { Client } from '@/lib/api/clients';
import type { Invoice } from '@/lib/api/invoices';
import { apiFetch } from '@/lib/api/client-browser';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const ClientForm = dynamic(
    () => import('@/components/business/ClientForm').then(m => m.ClientForm),
    { ssr: false }
);
import { InvoiceStatusBadge, ClientStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';

// ============================================================================
// Types
// ============================================================================

interface ClientDetailClientProps {
    client: Client;
    invoices: Invoice[];
}

type Tab = 'overview' | 'invoices';

// ============================================================================
// Main Component
// ============================================================================

export function ClientDetailClient({ client: initialClient, invoices }: ClientDetailClientProps) {
    const router = useRouter();
    const [client, setClient] = useState(initialClient);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [editOpen, setEditOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/api/business/clients/${client.id}`, { method: 'DELETE' });
            toast.success('Client deleted');
            router.push('/business/clients');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete client');
            setDeleting(false);
        }
    };

    // Calculate stats
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID').length;
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

    // Get currency from entity context (client doesn't have currency field)
    const currency = 'CAD'; // TODO: Get from entity context when available

    const handleEditSuccess = async () => {
        try {
            const updated = await apiFetch<Client>(`/api/business/clients/${client.id}`);
            setClient(updated);
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
                        <h1 className="text-2xl font-heading font-normal">{client.name}</h1>
                        <ClientStatusBadge status={client.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Client since {formatDate(client.createdAt)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Client
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-ak-red hover:text-ak-red" disabled={deleting}>
                                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this client?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {client.name} will be permanently removed along with their data.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Client</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={handleDelete}
                                >
                                    Delete Client
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <ClientForm
                key={client.id}
                open={editOpen}
                onOpenChange={setEditOpen}
                entityId={client.entityId}
                editClient={client}
                onSuccess={handleEditSuccess}
            />

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
                                <EmptyState
                                    variant="inline"
                                    size="sm"
                                    icon={FileText}
                                    title="No invoices yet for this client"
                                />
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
