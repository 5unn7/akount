import type { Metadata } from 'next';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { BillsTable } from '@/components/business/BillsTable';
import { listBills } from '@/lib/api/bills';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Bills | Akount',
    description: 'Manage your bills and accounts payable',
};

export default async function BillsPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    const billsResult = await listBills({ limit: 50, entityId });
    const bills = billsResult.bills;

    // Get functional currency from entity
    const entity = entities.find((e) => e.id === entityId) ?? entities[0];
    const primaryCurrency = entity?.functionalCurrency ?? 'CAD';

    // Calculate stats
    const pendingBills = bills.filter((b) => b.status === 'PENDING').length;
    const overdueBills = bills.filter((b) => b.status === 'OVERDUE').length;
    const totalOutstanding = bills.reduce((sum, b) => sum + (b.total - b.paidAmount), 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.paidAmount, 0);

    const stats = [
        {
            label: 'Total Bills',
            value: `${bills.length}`,
            color: 'primary' as const,
        },
        {
            label: 'Pending',
            value: `${pendingBills}`,
            color: 'blue' as const,
        },
        {
            label: 'Overdue',
            value: `${overdueBills}`,
            color: overdueBills > 0 ? ('red' as const) : ('default' as const),
        },
        {
            label: 'Outstanding AP',
            value: formatCurrency(totalOutstanding, primaryCurrency),
            color: totalOutstanding > 0 ? ('red' as const) : ('default' as const),
        },
    ];

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="fi fi1">
                <h1 className="text-2xl font-heading font-normal">Bills</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Track and pay your vendor bills
                </p>
            </div>

            {/* Stats Grid */}
            <div className="fi fi2">
                <StatsGrid stats={stats} columns={4} />
            </div>

            {/* Bills Table */}
            <div className="space-y-3 fi fi3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-heading font-normal">Bill List</h2>
                    <p className="text-xs text-muted-foreground">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <BillsTable bills={bills} currency={primaryCurrency} />
            </div>
        </div>
    );
}
