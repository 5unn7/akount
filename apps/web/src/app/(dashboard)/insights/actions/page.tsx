import type { Metadata } from 'next';
import { listAIActions, getAIActionStats } from '@/lib/api/ai';
import { ActionsListClient } from './actions-list-client';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: 'AI Actions | Akount',
    description: 'Review and approve AI-generated suggestions',
};

export default async function ActionsPage({
    searchParams,
}: {
    searchParams: Promise<{ entityId?: string }>;
}) {
    const params = await searchParams;
    const entityId = params.entityId;

    if (!entityId) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">AI Actions</h2>
                </div>
                <div className="glass rounded-[14px] p-12 text-center">
                    <p className="text-muted-foreground">Select an entity to view AI actions.</p>
                </div>
            </div>
        );
    }

    // Force dynamic rendering for cookie-based auth
    await cookies();

    const [actionsResponse, stats] = await Promise.all([
        listAIActions({ entityId, limit: 20 }),
        getAIActionStats(entityId),
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">AI Actions</h2>
            </div>

            <ActionsListClient
                initialActions={actionsResponse.actions}
                initialTotal={actionsResponse.total}
                initialStats={stats}
                entityId={entityId}
            />
        </div>
    );
}
