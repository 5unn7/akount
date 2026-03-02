import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { validateEntityOwnership, validateGLAccountOwnership } from '../utils/validate-ownership';
import { createAuditLog } from '../../../lib/audit';
import { generateEntryNumber } from '../utils/entry-number';
import type {
    CreateAssetInput,
    UpdateAssetInput,
    ListAssetsQuery,
    DisposeAssetInput,
    RunDepreciationInput,
} from '../schemas/asset.schema';

const ASSET_SELECT = {
    id: true,
    entityId: true,
    name: true,
    description: true,
    category: true,
    acquiredDate: true,
    cost: true,
    salvageValue: true,
    usefulLifeMonths: true,
    depreciationMethod: true,
    accumulatedDepreciation: true,
    status: true,
    disposedDate: true,
    disposalAmount: true,
    assetGLAccountId: true,
    depreciationExpenseGLAccountId: true,
    accumulatedDepreciationGLAccountId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

const ASSET_WITH_ENTRIES_SELECT = {
    ...ASSET_SELECT,
    depreciationEntries: {
        select: {
            id: true,
            periodDate: true,
            amount: true,
            method: true,
            journalEntryId: true,
            createdAt: true,
        },
        orderBy: { periodDate: 'desc' as const },
    },
} as const;

export class AssetService {
    constructor(
        private tenantId: string,
        private userId: string
    ) {}

    // ========================================================================
    // CRUD Operations (Task 43)
    // ========================================================================

    /**
     * List assets with optional filters.
     */
    async listAssets(params: ListAssetsQuery) {
        const conditions: Prisma.FixedAssetWhereInput[] = [
            // Tenant scoping via entity
            { entityId: params.entityId, entity: { tenantId: this.tenantId } },
            // Exclude soft-deleted
            { deletedAt: null },
        ];

        if (params.status) {
            conditions.push({ status: params.status });
        }
        if (params.category) {
            conditions.push({ category: params.category });
        }
        if (params.search) {
            conditions.push({
                OR: [
                    { name: { contains: params.search, mode: 'insensitive' } },
                    { description: { contains: params.search, mode: 'insensitive' } },
                ],
            });
        }

        const assets = await prisma.fixedAsset.findMany({
            where: { AND: conditions },
            select: ASSET_SELECT,
            orderBy: [{ status: 'asc' }, { acquiredDate: 'desc' }],
        });

        return assets;
    }

    /**
     * Get a single asset by ID (with depreciation entries).
     */
    async getAsset(id: string) {
        const asset = await prisma.fixedAsset.findFirst({
            where: {
                id,
                entity: { tenantId: this.tenantId },
                deletedAt: null,
            },
            select: ASSET_WITH_ENTRIES_SELECT,
        });

        if (!asset) {
            throw new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404);
        }

        return asset;
    }

    /**
     * Capitalize (create) a new fixed asset.
     */
    async capitalizeAsset(data: CreateAssetInput) {
        await validateEntityOwnership(data.entityId, this.tenantId);

        // Validate GL accounts if provided
        if (data.assetGLAccountId) {
            await validateGLAccountOwnership(data.assetGLAccountId, this.tenantId);
        }
        if (data.depreciationExpenseGLAccountId) {
            await validateGLAccountOwnership(data.depreciationExpenseGLAccountId, this.tenantId);
        }
        if (data.accumulatedDepreciationGLAccountId) {
            await validateGLAccountOwnership(data.accumulatedDepreciationGLAccountId, this.tenantId);
        }

        const asset = await prisma.fixedAsset.create({
            data: {
                entityId: data.entityId,
                name: data.name,
                description: data.description,
                category: data.category,
                acquiredDate: new Date(data.acquiredDate),
                cost: data.cost,
                salvageValue: data.salvageValue,
                usefulLifeMonths: data.usefulLifeMonths,
                depreciationMethod: data.depreciationMethod,
                accumulatedDepreciation: 0,
                status: 'ACTIVE',
                assetGLAccountId: data.assetGLAccountId,
                depreciationExpenseGLAccountId: data.depreciationExpenseGLAccountId,
                accumulatedDepreciationGLAccountId: data.accumulatedDepreciationGLAccountId,
            },
            select: ASSET_SELECT,
        });

        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: data.entityId,
            model: 'FixedAsset',
            recordId: asset.id,
            action: 'CREATE',
            after: { name: data.name, cost: data.cost, category: data.category },
        });

        return asset;
    }

    /**
     * Update an asset (only name, description, GL mappings, salvage, useful life, method).
     * Cost and acquiredDate are immutable after capitalization.
     */
    async updateAsset(id: string, data: UpdateAssetInput) {
        const existing = await prisma.fixedAsset.findFirst({
            where: {
                id,
                entity: { tenantId: this.tenantId },
                deletedAt: null,
            },
            select: { id: true, entityId: true, name: true, status: true },
        });

        if (!existing) {
            throw new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404);
        }

        if (existing.status === 'DISPOSED') {
            throw new AccountingError('Cannot update a disposed asset', 'ASSET_DISPOSED', 400);
        }

        // Validate GL accounts if provided
        if (data.assetGLAccountId) {
            await validateGLAccountOwnership(data.assetGLAccountId, this.tenantId);
        }
        if (data.depreciationExpenseGLAccountId) {
            await validateGLAccountOwnership(data.depreciationExpenseGLAccountId, this.tenantId);
        }
        if (data.accumulatedDepreciationGLAccountId) {
            await validateGLAccountOwnership(data.accumulatedDepreciationGLAccountId, this.tenantId);
        }

        const asset = await prisma.fixedAsset.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                salvageValue: data.salvageValue,
                usefulLifeMonths: data.usefulLifeMonths,
                depreciationMethod: data.depreciationMethod,
                assetGLAccountId: data.assetGLAccountId,
                depreciationExpenseGLAccountId: data.depreciationExpenseGLAccountId,
                accumulatedDepreciationGLAccountId: data.accumulatedDepreciationGLAccountId,
            },
            select: ASSET_SELECT,
        });

        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: existing.entityId,
            model: 'FixedAsset',
            recordId: id,
            action: 'UPDATE',
            before: { name: existing.name },
            after: { ...(data.name !== undefined && { name: data.name }) },
        });

        return asset;
    }

    /**
     * Dispose of an asset — records disposal, calculates gain/loss.
     */
    async disposeAsset(id: string, data: DisposeAssetInput) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.fixedAsset.findFirst({
                where: {
                    id,
                    entity: { tenantId: this.tenantId },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    entityId: true,
                    name: true,
                    cost: true,
                    accumulatedDepreciation: true,
                    status: true,
                },
            });

            if (!existing) {
                throw new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404);
            }

            if (existing.status === 'DISPOSED') {
                throw new AccountingError('Asset is already disposed', 'ASSET_ALREADY_DISPOSED', 400);
            }

            const netBookValue = existing.cost - existing.accumulatedDepreciation;
            const gainLoss = data.disposalAmount - netBookValue; // Positive = gain, negative = loss

            const asset = await tx.fixedAsset.update({
                where: { id },
                data: {
                    status: 'DISPOSED',
                    disposedDate: new Date(data.disposedDate),
                    disposalAmount: data.disposalAmount,
                },
                select: ASSET_SELECT,
            });

            await createAuditLog({
                tenantId: this.tenantId,
                userId: this.userId,
                entityId: existing.entityId,
                model: 'FixedAsset',
                recordId: id,
                action: 'UPDATE',
                before: { status: existing.status },
                after: {
                    status: 'DISPOSED',
                    disposalAmount: data.disposalAmount,
                    gainLoss,
                },
            });

            return { ...asset, netBookValue, gainLoss };
        });
    }

    /**
     * Soft delete an asset.
     */
    async deleteAsset(id: string) {
        const existing = await prisma.fixedAsset.findFirst({
            where: {
                id,
                entity: { tenantId: this.tenantId },
                deletedAt: null,
            },
            select: { id: true, entityId: true, name: true },
        });

        if (!existing) {
            throw new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404);
        }

        await prisma.fixedAsset.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: existing.entityId,
            model: 'FixedAsset',
            recordId: id,
            action: 'DELETE',
            before: { name: existing.name },
            after: {},
        });
    }

    // ========================================================================
    // Depreciation Calculation (Task 44a)
    // ========================================================================

    /**
     * Calculate period depreciation for a single asset.
     * Supports Straight-Line, Declining Balance, and Units of Production.
     * Handles partial periods (first/last month).
     */
    calculatePeriodDepreciation(
        cost: number,
        salvageValue: number,
        usefulLifeMonths: number,
        accumulatedDepreciation: number,
        method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION',
        acquiredDate: Date,
        periodDate: Date
    ): number {
        const depreciableBase = cost - salvageValue;
        const remainingValue = cost - accumulatedDepreciation - salvageValue;

        // Already fully depreciated
        if (remainingValue <= 0) return 0;

        let depreciation = 0;

        switch (method) {
            case 'STRAIGHT_LINE': {
                // Monthly depreciation = depreciable base / useful life months
                const monthlyAmount = Math.round(depreciableBase / usefulLifeMonths);

                // Check for partial first period
                const acquiredMonth = acquiredDate.getUTCFullYear() * 12 + acquiredDate.getUTCMonth();
                const periodMonth = periodDate.getUTCFullYear() * 12 + periodDate.getUTCMonth();

                if (acquiredMonth === periodMonth) {
                    // Partial first month: prorate by remaining days
                    const dayInMonth = acquiredDate.getUTCDate();
                    const daysInMonth = new Date(
                        acquiredDate.getUTCFullYear(),
                        acquiredDate.getUTCMonth() + 1,
                        0
                    ).getUTCDate();
                    const remainingDays = daysInMonth - dayInMonth + 1;
                    depreciation = Math.round(monthlyAmount * (remainingDays / daysInMonth));
                } else {
                    depreciation = monthlyAmount;
                }
                break;
            }
            case 'DECLINING_BALANCE': {
                // Double-declining balance: rate = 2 / usefulLifeMonths
                // Applied to net book value (cost - accumulated)
                const monthlyRate = 2 / usefulLifeMonths;
                const netBookValue = cost - accumulatedDepreciation;
                depreciation = Math.round(netBookValue * monthlyRate);
                break;
            }
            case 'UNITS_OF_PRODUCTION': {
                // For UOP, we use straight-line as fallback since we don't track units
                const monthlyAmount = Math.round(depreciableBase / usefulLifeMonths);
                depreciation = monthlyAmount;
                break;
            }
        }

        // Never depreciate below salvage value
        if (depreciation > remainingValue) {
            depreciation = remainingValue;
        }

        return depreciation;
    }

    // ========================================================================
    // Run Depreciation (Tasks 44b + 44c)
    // ========================================================================

    /**
     * Run depreciation for assets in an entity for a given period.
     * Creates DepreciationEntry records and optionally JournalEntries.
     *
     * Idempotency: checks @@unique([fixedAssetId, periodDate]) before creating.
     */
    async runDepreciation(data: RunDepreciationInput) {
        await validateEntityOwnership(data.entityId, this.tenantId);

        const periodDate = new Date(data.periodDate);
        // Normalize to first of month for idempotency key
        const normalizedPeriod = new Date(Date.UTC(
            periodDate.getUTCFullYear(),
            periodDate.getUTCMonth(),
            1
        ));

        // Find eligible assets
        const whereClause: Prisma.FixedAssetWhereInput = {
            entityId: data.entityId,
            entity: { tenantId: this.tenantId },
            status: 'ACTIVE',
            deletedAt: null,
        };
        if (data.assetIds && data.assetIds.length > 0) {
            whereClause.id = { in: data.assetIds };
        }

        const assets = await prisma.fixedAsset.findMany({
            where: whereClause,
            select: {
                id: true,
                entityId: true,
                name: true,
                cost: true,
                salvageValue: true,
                usefulLifeMonths: true,
                depreciationMethod: true,
                accumulatedDepreciation: true,
                acquiredDate: true,
                depreciationExpenseGLAccountId: true,
                accumulatedDepreciationGLAccountId: true,
            },
        });

        if (assets.length === 0) {
            return { processed: 0, skipped: 0, entries: [] };
        }

        // Task 44c: Check existing entries for idempotency
        const existingEntries = await prisma.depreciationEntry.findMany({
            where: {
                fixedAssetId: { in: assets.map(a => a.id) },
                periodDate: normalizedPeriod,
            },
            select: { fixedAssetId: true },
        });
        const alreadyProcessed = new Set(existingEntries.map(e => e.fixedAssetId));

        const results: Array<{
            assetId: string;
            assetName: string;
            amount: number;
            journalEntryId: string | null;
        }> = [];
        let skipped = 0;

        for (const asset of assets) {
            // Idempotency guard (Task 44c)
            if (alreadyProcessed.has(asset.id)) {
                skipped++;
                continue;
            }

            // Skip if acquired after this period
            const assetAcquiredMonth = asset.acquiredDate.getUTCFullYear() * 12 + asset.acquiredDate.getUTCMonth();
            const periodMonth = normalizedPeriod.getUTCFullYear() * 12 + normalizedPeriod.getUTCMonth();
            if (assetAcquiredMonth > periodMonth) {
                skipped++;
                continue;
            }

            // Calculate depreciation (Task 44a)
            const amount = this.calculatePeriodDepreciation(
                asset.cost,
                asset.salvageValue,
                asset.usefulLifeMonths,
                asset.accumulatedDepreciation,
                asset.depreciationMethod,
                asset.acquiredDate,
                normalizedPeriod
            );

            if (amount <= 0) {
                skipped++;
                continue;
            }

            // Create depreciation entry + JE in transaction (Task 44b)
            // NOTE: Sequential per-asset transactions (not one big transaction)
            // Trade-off: Slower but idempotent — partial runs can be safely retried
            // without double-posting. If asset #5 fails, assets #1-4 are already
            // committed and won't be re-processed on retry.
            const result = await prisma.$transaction(async (tx) => {
                let journalEntryId: string | null = null;

                // Create JE if GL accounts are mapped
                if (asset.depreciationExpenseGLAccountId && asset.accumulatedDepreciationGLAccountId) {
                    // Generate entry number
                    const nextNum = await generateEntryNumber(tx, asset.entityId);

                    const je = await tx.journalEntry.create({
                        data: {
                            entityId: asset.entityId,
                            entryNumber: nextNum,
                            date: normalizedPeriod,
                            memo: `Depreciation: ${asset.name} (${normalizedPeriod.toISOString().slice(0, 7)})`,
                            sourceType: 'DEPRECIATION',
                            sourceId: asset.id,
                            sourceDocument: {
                                assetId: asset.id,
                                assetName: asset.name,
                                periodDate: normalizedPeriod.toISOString(),
                                method: asset.depreciationMethod,
                                amount,
                            },
                            status: 'POSTED',
                            createdBy: this.userId,
                            journalLines: {
                                create: [
                                    {
                                        glAccountId: asset.depreciationExpenseGLAccountId,
                                        debitAmount: amount,
                                        creditAmount: 0,
                                        memo: `Depreciation expense: ${asset.name}`,
                                    },
                                    {
                                        glAccountId: asset.accumulatedDepreciationGLAccountId,
                                        debitAmount: 0,
                                        creditAmount: amount,
                                        memo: `Accumulated depreciation: ${asset.name}`,
                                    },
                                ],
                            },
                        },
                        select: { id: true },
                    });
                    journalEntryId = je.id;
                }

                // Create depreciation entry record
                const entry = await tx.depreciationEntry.create({
                    data: {
                        fixedAssetId: asset.id,
                        periodDate: normalizedPeriod,
                        amount,
                        method: asset.depreciationMethod,
                        journalEntryId,
                    },
                    select: { id: true },
                });

                // Update accumulated depreciation on the asset
                const newAccumulated = asset.accumulatedDepreciation + amount;
                const isFullyDepreciated = newAccumulated >= (asset.cost - asset.salvageValue);

                await tx.fixedAsset.update({
                    where: { id: asset.id },
                    data: {
                        accumulatedDepreciation: newAccumulated,
                        ...(isFullyDepreciated ? { status: 'FULLY_DEPRECIATED' } : {}),
                    },
                });

                return { entryId: entry.id, journalEntryId };
            });

            results.push({
                assetId: asset.id,
                assetName: asset.name,
                amount,
                journalEntryId: result.journalEntryId,
            });
        }

        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: data.entityId,
            model: 'FixedAsset',
            recordId: data.entityId,
            action: 'UPDATE',
            after: {
                action: 'RUN_DEPRECIATION',
                periodDate: normalizedPeriod.toISOString(),
                processed: results.length,
                skipped,
            },
        });

        return {
            processed: results.length,
            skipped,
            entries: results,
        };
    }

    // ========================================================================
    // Validation Helpers
    // ========================================================================
    // Moved to shared utils/validate-ownership.ts
}
