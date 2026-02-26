import type { Metadata } from 'next';
import { listGoals } from '@/lib/api/planning';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { GoalsList } from './goals-list';

export const metadata: Metadata = {
    title: 'Goals | Akount',
    description: 'Set and track financial goals',
};

export default async function GoalsPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    if (!entityId) {
        return (
            <div className="flex-1 space-y-4">
                <h1 className="text-2xl font-heading font-normal">Goals</h1>
                <p className="text-sm text-muted-foreground">
                    Select an entity to view and manage financial goals.
                </p>
            </div>
        );
    }

    const result = await listGoals({ entityId, limit: 50 });

    return (
        <div className="flex-1 space-y-6">
            <GoalsList
                initialGoals={result.goals}
                initialNextCursor={result.nextCursor}
                entityId={entityId}
            />
        </div>
    );
}
