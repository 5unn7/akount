'use server';

import {
    capitalizeAsset,
    updateAsset,
    disposeAsset,
    deleteAsset,
    runDepreciation,
    type AssetCategory,
    type DepreciationMethod,
} from '@/lib/api/accounting';

export async function capitalizeAssetAction(data: {
    entityId: string;
    name: string;
    description?: string;
    category: AssetCategory;
    acquiredDate: string;
    cost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    depreciationMethod: DepreciationMethod;
    assetGLAccountId?: string;
    depreciationExpenseGLAccountId?: string;
    accumulatedDepreciationGLAccountId?: string;
}) {
    return capitalizeAsset(data);
}

export async function updateAssetAction(
    id: string,
    data: {
        name?: string;
        description?: string | null;
        category?: AssetCategory;
        salvageValue?: number;
        usefulLifeMonths?: number;
        depreciationMethod?: DepreciationMethod;
    }
) {
    return updateAsset(id, data);
}

export async function disposeAssetAction(
    id: string,
    data: { disposedDate: string; disposalAmount: number }
) {
    return disposeAsset(id, data);
}

export async function deleteAssetAction(id: string) {
    return deleteAsset(id);
}

export async function runDepreciationAction(data: {
    entityId: string;
    periodDate: string;
    assetIds?: string[];
}) {
    return runDepreciation(data);
}
