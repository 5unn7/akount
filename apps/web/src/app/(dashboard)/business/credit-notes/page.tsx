import type { Metadata } from 'next';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { listCreditNotes } from '@/lib/api/credit-notes';
import { CreditNotesListClient } from './credit-notes-list-client';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Credit Notes | Akount',
    description: 'Manage credit notes for invoices and bills',
};

export default async function CreditNotesPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    const result = await listCreditNotes({ limit: 20, entityId });
    const creditNotes = result.creditNotes;

    const entity = entities.find((e) => e.id === entityId) ?? entities[0];
    const primaryCurrency = entity?.functionalCurrency ?? 'CAD';

    // Calculate stats
    const draftCount = creditNotes.filter((cn) => cn.status === 'DRAFT').length;
    const approvedCount = creditNotes.filter((cn) => cn.status === 'APPROVED').length;
    const totalAmount = creditNotes
        .filter((cn) => cn.status !== 'VOIDED')
        .reduce((sum, cn) => sum + cn.amount, 0);
    const totalApplied = creditNotes.reduce((sum, cn) => sum + cn.appliedAmount, 0);

    const stats = [
        {
            label: 'Total Credit Notes',
            value: `${creditNotes.length}`,
            color: 'primary' as const,
        },
        {
            label: 'Draft',
            value: `${draftCount}`,
            color: 'default' as const,
        },
        {
            label: 'Pending Application',
            value: `${approvedCount}`,
            color: 'blue' as const,
        },
        {
            label: 'Total Value',
            value: formatCurrency(totalAmount, primaryCurrency),
            color: totalApplied > 0 ? ('green' as const) : ('default' as const),
        },
    ];

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="fi fi1">
                <h1 className="text-2xl font-heading font-normal">Credit Notes</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Issue and manage credit notes for invoices and bills
                </p>
            </div>

            {/* Stats Grid */}
            <div className="fi fi2">
                <StatsGrid stats={stats} columns={4} />
            </div>

            {/* Credit Notes List */}
            <div className="space-y-3 fi fi3">
                <CreditNotesListClient
                    initialCreditNotes={result.creditNotes}
                    initialNextCursor={result.nextCursor}
                    entityId={entityId}
                    currency={primaryCurrency}
                />
            </div>
        </div>
    );
}
