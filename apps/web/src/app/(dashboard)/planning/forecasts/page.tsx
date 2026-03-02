import type { Metadata } from 'next';
import { listForecasts, getCashRunway, getSeasonalPatterns } from '@/lib/api/planning';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { ForecastsList } from './forecasts-list';

export const metadata: Metadata = {
    title: 'Forecasts | Akount',
    description: 'Financial forecasting and projections',
};

export default async function ForecastsPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    if (!entityId) {
        return (
            <div className="flex-1 space-y-4">
                <h1 className="text-2xl font-heading font-normal">Forecasts</h1>
                <p className="text-sm text-muted-foreground">
                    Select an entity to view financial forecasts.
                </p>
            </div>
        );
    }

    const [forecastResult, runwayResult, seasonalResult] = await Promise.all([
        listForecasts({ entityId, limit: 50 }),
        getCashRunway(entityId).catch(() => null),
        getSeasonalPatterns(entityId).catch(() => null),
    ]);

    return (
        <div className="flex-1 space-y-6">
            <ForecastsList
                initialForecasts={forecastResult.forecasts}
                initialNextCursor={forecastResult.nextCursor}
                cashRunway={runwayResult}
                seasonalAnalysis={seasonalResult}
                entityId={entityId}
            />
        </div>
    );
}
