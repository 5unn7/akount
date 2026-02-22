import { z } from 'zod';

// ============================================================================
// Enums (matching Prisma enums)
// ============================================================================

export const AssetCategoryEnum = z.enum([
    'BUILDING',
    'VEHICLE',
    'EQUIPMENT',
    'FURNITURE',
    'COMPUTER',
    'SOFTWARE',
    'LEASEHOLD',
    'OTHER',
]);

export const DepreciationMethodEnum = z.enum([
    'STRAIGHT_LINE',
    'DECLINING_BALANCE',
    'UNITS_OF_PRODUCTION',
]);

export const AssetStatusEnum = z.enum([
    'ACTIVE',
    'FULLY_DEPRECIATED',
    'DISPOSED',
]);

// ============================================================================
// Params
// ============================================================================

export const AssetParamsSchema = z.object({
    id: z.string().cuid('Invalid asset ID'),
});
export type AssetParams = z.infer<typeof AssetParamsSchema>;

// ============================================================================
// Create (Capitalize Asset)
// ============================================================================

export const CreateAssetSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID'),
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    category: AssetCategoryEnum,
    acquiredDate: z.string().datetime('Invalid datetime format'),
    cost: z.number().int('Cost must be integer cents').min(1, 'Cost must be positive'),
    salvageValue: z.number().int('Salvage value must be integer cents').min(0, 'Salvage value must be non-negative'),
    usefulLifeMonths: z.number().int().min(1, 'Useful life must be at least 1 month').max(1200, 'Useful life cannot exceed 100 years'),
    depreciationMethod: DepreciationMethodEnum,
    assetGLAccountId: z.string().cuid('Invalid GL account ID').optional(),
    depreciationExpenseGLAccountId: z.string().cuid('Invalid GL account ID').optional(),
    accumulatedDepreciationGLAccountId: z.string().cuid('Invalid GL account ID').optional(),
}).refine(
    (data) => data.salvageValue < data.cost,
    { message: 'Salvage value must be less than cost', path: ['salvageValue'] }
);
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;

// ============================================================================
// Update
// ============================================================================

export const UpdateAssetSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullable().optional(),
    category: AssetCategoryEnum.optional(),
    salvageValue: z.number().int('Salvage value must be integer cents').min(0).optional(),
    usefulLifeMonths: z.number().int().min(1).max(1200).optional(),
    depreciationMethod: DepreciationMethodEnum.optional(),
    assetGLAccountId: z.string().cuid('Invalid GL account ID').nullable().optional(),
    depreciationExpenseGLAccountId: z.string().cuid('Invalid GL account ID').nullable().optional(),
    accumulatedDepreciationGLAccountId: z.string().cuid('Invalid GL account ID').nullable().optional(),
});
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;

// ============================================================================
// List / Query
// ============================================================================

export const ListAssetsSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID'),
    status: AssetStatusEnum.optional(),
    category: AssetCategoryEnum.optional(),
    search: z.string().max(100).optional(),
});
export type ListAssetsQuery = z.infer<typeof ListAssetsSchema>;

// ============================================================================
// Dispose
// ============================================================================

export const DisposeAssetSchema = z.object({
    disposedDate: z.string().datetime('Invalid datetime format'),
    disposalAmount: z.number().int('Disposal amount must be integer cents').min(0, 'Disposal amount must be non-negative'),
});
export type DisposeAssetInput = z.infer<typeof DisposeAssetSchema>;

// ============================================================================
// Run Depreciation
// ============================================================================

export const RunDepreciationSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID'),
    periodDate: z.string().datetime('Invalid datetime format'),
    assetIds: z.array(z.string().cuid()).optional(), // If empty, run for all active assets
});
export type RunDepreciationInput = z.infer<typeof RunDepreciationSchema>;
