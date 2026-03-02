import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { listInsights, getInsightCounts } from '@/lib/api/ai';
import { InsightsClient } from './insights-client';

export const metadata: Metadata = {
    title: 'Insights | Akount',
    description: 'AI-powered financial insights and recommendations',
};

export default async function InsightsPage({
    searchParams,
}: {
    searchParams: Promise<{ entityId?: string }>;
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
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Insights</h2>
                </div>
                <div className="glass rounded-[14px] p-12 text-center">
                    <p className="text-muted-foreground">Select an entity to view AI insights.</p>
                </div>
            </div>
        );
    }

    // Force dynamic rendering for cookie-based auth
    await cookies();

    const [insightsResponse, counts] = await Promise.all([
        listInsights({ entityId, limit: 20 }),
        getInsightCounts(entityId),
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <InsightsClient
                initialInsights={insightsResponse.insights}
                initialHasMore={insightsResponse.hasMore}
                initialNextCursor={insightsResponse.nextCursor}
                initialCounts={counts}
                entityId={entityId}
            />
        </div>
    );
}
