import type { Metadata } from 'next';
import { listRules, getRuleStats, listRuleSuggestions } from '@/lib/api/ai';
import { RulesClient } from './rules-client';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: 'Rules | Akount',
    description: 'Manage AI automation rules for transaction categorization',
};

export default async function RulesPage({
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
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Rules</h2>
                </div>
                <div className="glass rounded-[14px] p-12 text-center">
                    <p className="text-muted-foreground">Select an entity to manage rules.</p>
                </div>
            </div>
        );
    }

    // Force dynamic rendering for cookie-based auth
    await cookies();

    const [rulesResponse, stats, suggestionsResponse] = await Promise.all([
        listRules({ entityId, take: 20 }),
        getRuleStats(entityId),
        listRuleSuggestions({ entityId, status: 'PENDING', limit: 10 }),
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Rules</h2>
            </div>

            <RulesClient
                initialRules={rulesResponse.rules}
                initialNextCursor={rulesResponse.nextCursor}
                initialStats={stats}
                initialSuggestions={suggestionsResponse.suggestions}
                entityId={entityId}
            />
        </div>
    );
}
