import type { Metadata } from 'next';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { AgingBar } from '@/components/shared/AgingBar';
import { InvoiceTable } from '@/components/business/InvoiceTable';
import { BillsTable } from '@/components/business/BillsTable';
import { InvoicingActions } from '@/components/business/InvoicingActions';
import { getInvoiceStats, listInvoices } from '@/lib/api/invoices';
import { getBillStats, listBills } from '@/lib/api/bills';
import { listClients } from '@/lib/api/clients';
import { listVendors } from '@/lib/api/vendors';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Invoicing | Akount',
    description: 'Manage invoices, bills, and accounts payable/receivable',
};

export default async function InvoicingPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    // Fetch all data in parallel
    const [invoiceStats, billStats, invoicesResult, billsResult, clientsResult, vendorsResult] = await Promise.all([
        getInvoiceStats(),
        getBillStats(),
        listInvoices({ limit: 20, entityId }),
        listBills({ limit: 20, entityId }),
        listClients({ limit: 100, entityId }),
        listVendors({ limit: 100, entityId }),
    ]);

    const primaryCurrency = invoicesResult.invoices[0]?.currency || billsResult.bills[0]?.currency || 'CAD';

    // Net position = AR - AP (positive = owed to you)
    const netPosition = invoiceStats.outstandingAR - billStats.outstandingAP;

    // Stats for grid
    const stats = [
        {
            label: 'Outstanding AR',
            value: formatCurrency(invoiceStats.outstandingAR, primaryCurrency),
            color: 'green' as const,
        },
        {
            label: 'Outstanding AP',
            value: formatCurrency(billStats.outstandingAP, primaryCurrency),
            color: 'red' as const,
        },
        {
            label: 'Net Position',
            value: formatCurrency(Math.abs(netPosition), primaryCurrency),
            color: netPosition >= 0 ? ('green' as const) : ('red' as const),
        },
        {
            label: 'Overdue',
            value: formatCurrency(invoiceStats.overdue + billStats.overdue, primaryCurrency),
            color: (invoiceStats.overdue + billStats.overdue) > 0 ? ('red' as const) : ('green' as const),
        },
    ];

    // AR Aging buckets
    const arBuckets = [
        {
            label: 'Current',
            amount: invoiceStats.aging.current.amount,
            percentage: invoiceStats.aging.current.percentage,
            color: 'green' as const,
        },
        {
            label: '1-30 days',
            amount: invoiceStats.aging['1-30'].amount,
            percentage: invoiceStats.aging['1-30'].percentage,
            color: 'amber' as const,
        },
        {
            label: '31-60 days',
            amount: invoiceStats.aging['31-60'].amount,
            percentage: invoiceStats.aging['31-60'].percentage,
            color: 'red' as const,
        },
        {
            label: '60+ days',
            amount: invoiceStats.aging['60+'].amount,
            percentage: invoiceStats.aging['60+'].percentage,
            color: 'darkred' as const,
        },
    ];

    // AP Aging buckets
    const apBuckets = [
        {
            label: 'Current',
            amount: billStats.aging.current.amount,
            percentage: billStats.aging.current.percentage,
            color: 'green' as const,
        },
        {
            label: '1-30 days',
            amount: billStats.aging['1-30'].amount,
            percentage: billStats.aging['1-30'].percentage,
            color: 'amber' as const,
        },
        {
            label: '31-60 days',
            amount: billStats.aging['31-60'].amount,
            percentage: billStats.aging['31-60'].percentage,
            color: 'red' as const,
        },
        {
            label: '60+ days',
            amount: billStats.aging['60+'].amount,
            percentage: billStats.aging['60+'].percentage,
            color: 'darkred' as const,
        },
    ];

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="fi fi1 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-normal">Invoicing</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track accounts receivable and payable with aging analysis
                    </p>
                </div>
                <InvoicingActions
                    clients={clientsResult.clients.map(c => ({ id: c.id, name: c.name, paymentTerms: c.paymentTerms }))}
                    vendors={vendorsResult.vendors.map(v => ({ id: v.id, name: v.name, paymentTerms: v.paymentTerms }))}
                />
            </div>

            {/* Stats Grid */}
            <div className="fi fi2">
                <StatsGrid stats={stats} columns={4} />
            </div>

            {/* AR Aging */}
            <div className="fi fi3">
                <AgingBar
                    buckets={arBuckets}
                    totalAmount={invoiceStats.outstandingAR}
                    totalLabel="Accounts Receivable"
                    currency={primaryCurrency}
                />
            </div>

            {/* AP Aging */}
            <div className="fi fi4">
                <AgingBar
                    buckets={apBuckets}
                    totalAmount={billStats.outstandingAP}
                    totalLabel="Accounts Payable"
                    currency={primaryCurrency}
                />
            </div>

            {/* Invoices Section */}
            <div className="space-y-3 fi fi5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-heading font-normal">Recent Invoices</h2>
                    <p className="text-xs text-muted-foreground">
                        {invoicesResult.invoices.length} of {invoicesResult.invoices.length} shown
                    </p>
                </div>
                <InvoiceTable invoices={invoicesResult.invoices} />
            </div>

            {/* Bills Section */}
            <div className="space-y-3 fi fi6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-heading font-normal">Recent Bills</h2>
                    <p className="text-xs text-muted-foreground">
                        {billsResult.bills.length} of {billsResult.bills.length} shown
                    </p>
                </div>
                <BillsTable bills={billsResult.bills} />
            </div>
        </div>
    );
}
