import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getCloseReadiness, getCloseHistory } from '@/lib/api/ai';
import { MonthlyCloseClient } from './monthly-close-client';

export const metadata: Metadata = {
    title: 'Monthly Close | Akount',
    description: 'AI-assisted monthly close checklist and readiness score',
};

export default async function MonthlyClosePage({
    searchParams,
}: {
    searchParams: Promise<{ entityId?: string; periodId?: string }>;
}) {
    const params = await searchParams;

    // Get entityId from searchParams or cookie
    let entityId = params.entityId;
    if (!entityId) {
        const cookieStore = await cookies();
        entityId = cookieStore.get('ak-entity-id')?.value || undefined;
    }

    if (!entityId) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Monthly Close</h2>
                </div>
                <div className="glass rounded-[14px] p-12 text-center">
                    <p className="text-muted-foreground">Select an entity to view monthly close status.</p>
                </div>
            </div>
        );
    }

    // Force dynamic rendering for cookie-based auth
    await cookies();

    // Fetch readiness and history in parallel
    // periodId is optional — if not provided, backend uses current open period
    const [readiness, history] = await Promise.allSettled([
        params.periodId
            ? getCloseReadiness(entityId, params.periodId)
            : Promise.resolve(null),
        getCloseHistory({ entityId, take: 10 }),
    ]);

    const readinessData = readiness.status === 'fulfilled' ? readiness.value : null;
    const historyData = history.status === 'fulfilled' ? history.value : { items: [], hasMore: false };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <MonthlyCloseClient
                initialReadiness={readinessData}
                initialHistory={historyData.items}
                initialHistoryHasMore={historyData.hasMore}
                entityId={entityId}
            />
        </div>
    );
}
