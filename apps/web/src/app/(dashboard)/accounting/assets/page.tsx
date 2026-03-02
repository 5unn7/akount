import type { Metadata } from 'next';
import { listAssets } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { AssetsClient } from './assets-client';
import { AssetsEmpty } from './assets-empty';

export const metadata: Metadata = {
    title: 'Assets | Akount',
    description: 'Track and depreciate your fixed assets',
};

export default async function AssetsPage() {
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;

    // entityId is required for asset listing
    if (!entityId) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Assets</h2>
                </div>
                <AssetsEmpty />
            </div>
        );
    }

    const assets = await listAssets(entityId);

    if (assets.length === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Assets</h2>
                </div>
                <AssetsEmpty entityId={entityId} />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Assets</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track fixed assets and calculate depreciation
                    </p>
                </div>
            </div>
            <AssetsClient initialAssets={assets} entityId={entityId} />
        </div>
    );
}
