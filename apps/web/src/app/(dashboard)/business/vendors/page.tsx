import type { Metadata } from 'next';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { VendorsTable } from '@/components/business/VendorsTable';
import { listVendors } from '@/lib/api/vendors';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Vendors | Akount',
    description: 'Manage your vendors and suppliers',
};

export default async function VendorsPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    const vendorsResult = await listVendors({ limit: 50, entityId });
    const vendors = vendorsResult.vendors;

    // Get functional currency from entity
    const entity = entities.find((e) => e.id === entityId) ?? entities[0];
    const primaryCurrency = entity?.functionalCurrency ?? 'CAD';

    // Calculate stats
    const activeVendors = vendors.filter((v) => v.status === 'active').length;
    const totalBalanceDue = vendors.reduce((sum, v) => sum + (v.balanceDue ?? 0), 0);
    const totalOpenBills = vendors.reduce((sum, v) => sum + (v.openBills ?? 0), 0);

    const stats = [
        {
            label: 'Total Vendors',
            value: `${vendors.length}`,
            color: 'primary' as const,
        },
        {
            label: 'Active',
            value: `${activeVendors}`,
            color: 'green' as const,
        },
        {
            label: 'Outstanding AP',
            value: formatCurrency(totalBalanceDue, primaryCurrency),
            color: totalBalanceDue > 0 ? ('red' as const) : ('default' as const),
        },
        {
            label: 'Open Bills',
            value: `${totalOpenBills}`,
            color: 'default' as const,
        },
    ];

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="fi fi1">
                <h1 className="text-2xl font-heading font-normal">Vendors</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your vendor database and supplier relationships
                </p>
            </div>

            {/* Stats Grid */}
            <div className="fi fi2">
                <StatsGrid stats={stats} columns={4} />
            </div>

            {/* Vendors Table */}
            <div className="space-y-3 fi fi3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-heading font-normal">Vendor Directory</h2>
                    <p className="text-xs text-muted-foreground">
                        {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <VendorsTable vendors={vendors} currency={primaryCurrency} />
            </div>
        </div>
    );
}
