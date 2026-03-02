import type { Metadata } from 'next';
import { listBudgets, listBudgetVariances } from '@/lib/api/planning';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { BudgetsList } from './budgets-list';

export const metadata: Metadata = {
    title: 'Budgets | Akount',
    description: 'Create and track budgets',
};

export default async function BudgetsPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    if (!entityId) {
        return (
            <div className="flex-1 space-y-4">
                <h1 className="text-2xl font-heading font-normal">Budgets</h1>
                <p className="text-sm text-muted-foreground">
                    Select an entity to view and manage budgets.
                </p>
            </div>
        );
    }

    const [result, varianceResult] = await Promise.all([
        listBudgets({ entityId, limit: 50 }),
        listBudgetVariances(entityId).catch(() => ({ variances: [] })),
    ]);

    return (
        <div className="flex-1 space-y-6">
            <BudgetsList
                initialBudgets={result.budgets}
                initialNextCursor={result.nextCursor}
                initialVariances={varianceResult.variances}
                entityId={entityId}
            />
        </div>
    );
}
