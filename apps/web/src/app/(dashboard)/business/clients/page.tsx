import type { Metadata } from 'next';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { listClients } from '@/lib/api/clients';
import { ClientsListClient } from './clients-list-client';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Clients | Akount',
    description: 'Manage your clients and customer relationships',
};

export default async function ClientsPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    const clientsResult = await listClients({ limit: 20, entityId });
    const clients = clientsResult.clients;

    // Get functional currency from entity
    const entity = entities.find((e) => e.id === entityId) ?? entities[0];
    const primaryCurrency = entity?.functionalCurrency ?? 'CAD';

    // Calculate stats
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const totalBalanceDue = clients.reduce((sum, c) => sum + (c.balanceDue ?? 0), 0);
    const totalOpenInvoices = clients.reduce((sum, c) => sum + (c.openInvoices ?? 0), 0);

    const stats = [
        {
            label: 'Total Clients',
            value: `${clients.length}`,
            color: 'primary' as const,
        },
        {
            label: 'Active',
            value: `${activeClients}`,
            color: 'green' as const,
        },
        {
            label: 'Outstanding AR',
            value: formatCurrency(totalBalanceDue, primaryCurrency),
            color: totalBalanceDue > 0 ? ('blue' as const) : ('default' as const),
        },
        {
            label: 'Open Invoices',
            value: `${totalOpenInvoices}`,
            color: 'default' as const,
        },
    ];

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="fi fi1">
                <h1 className="text-2xl font-heading font-normal">Clients</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your client database and customer relationships
                </p>
            </div>

            {/* Stats Grid */}
            <div className="fi fi2">
                <StatsGrid stats={stats} columns={4} />
            </div>

            {/* Clients Table */}
            <div className="space-y-3 fi fi3">
                <h2 className="text-lg font-heading font-normal">Client Directory</h2>
                <ClientsListClient
                    initialClients={clientsResult.clients}
                    initialNextCursor={clientsResult.nextCursor}
                    entityId={entityId}
                    currency={primaryCurrency}
                />
            </div>
        </div>
    );
}
