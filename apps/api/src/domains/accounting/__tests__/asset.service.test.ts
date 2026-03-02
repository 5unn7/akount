import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetService } from '../services/asset.service';
import { AccountingError } from '../errors';
import { TENANT_ID, USER_ID, ENTITY_ID, mockEntity } from './helpers';
import { assertIntegerCents } from '../../../test-utils/financial-assertions';

// ============================================================================
// Mock Prisma
// ============================================================================

const mockTransaction = vi.fn();

vi.mock('@akount/db', () => ({
    prisma: {
        entity: { findFirst: vi.fn() },
        gLAccount: { findFirst: vi.fn() },
        fixedAsset: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        depreciationEntry: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
        journalEntry: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        $transaction: (...args: unknown[]) => {
            const fn = args[0] as (tx: unknown) => Promise<unknown>;
            return mockTransaction(fn);
        },
    },
    Prisma: {},
}));

vi.mock('../../../lib/audit', () => ({
    createAuditLog: vi.fn(),
}));

import { prisma } from '@akount/db';

const mockEntityFind = prisma.entity.findFirst as ReturnType<typeof vi.fn>;
const mockGLFind = prisma.gLAccount.findFirst as ReturnType<typeof vi.fn>;
const mockAssetFindMany = prisma.fixedAsset.findMany as ReturnType<typeof vi.fn>;
const mockAssetFindFirst = prisma.fixedAsset.findFirst as ReturnType<typeof vi.fn>;
const mockAssetCreate = prisma.fixedAsset.create as ReturnType<typeof vi.fn>;
const mockAssetUpdate = prisma.fixedAsset.update as ReturnType<typeof vi.fn>;
const mockDeprFindMany = prisma.depreciationEntry.findMany as ReturnType<typeof vi.fn>;

// ============================================================================
// Mock Data
// ============================================================================

function mockAsset(overrides: Record<string, unknown> = {}) {
    return {
        id: 'asset-1',
        entityId: ENTITY_ID,
        name: 'Office Laptop',
        description: 'MacBook Pro 16"',
        category: 'COMPUTER',
        acquiredDate: new Date('2024-01-15'),
        cost: 250000, // $2,500.00 in cents
        salvageValue: 25000, // $250.00 in cents
        usefulLifeMonths: 36,
        depreciationMethod: 'STRAIGHT_LINE',
        accumulatedDepreciation: 0,
        status: 'ACTIVE',
        disposedDate: null,
        disposalAmount: null,
        assetGLAccountId: 'gl-asset-1',
        depreciationExpenseGLAccountId: 'gl-depr-expense-1',
        accumulatedDepreciationGLAccountId: 'gl-accum-depr-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        deletedAt: null,
        ...overrides,
    };
}

const VALID_CREATE_INPUT = {
    entityId: ENTITY_ID,
    name: 'Office Laptop',
    description: 'MacBook Pro 16"',
    category: 'COMPUTER' as const,
    acquiredDate: '2024-01-15T00:00:00.000Z',
    cost: 250000,
    salvageValue: 25000,
    usefulLifeMonths: 36,
    depreciationMethod: 'STRAIGHT_LINE' as const,
    assetGLAccountId: 'gl-asset-1',
    depreciationExpenseGLAccountId: 'gl-depr-expense-1',
    accumulatedDepreciationGLAccountId: 'gl-accum-depr-1',
};

describe('AssetService', () => {
    let service: AssetService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AssetService(TENANT_ID, USER_ID);
        mockEntityFind.mockResolvedValue(mockEntity());
        mockGLFind.mockResolvedValue({ id: 'gl-1' }); // Default GL validation passes
    });

    // ========================================================================
    // listAssets
    // ========================================================================

    describe('listAssets', () => {
        it('should list assets with tenant scoping', async () => {
            const assets = [mockAsset()];
            mockAssetFindMany.mockResolvedValue(assets);

            const result = await service.listAssets({ entityId: ENTITY_ID });

            expect(result).toEqual(assets);
            expect(mockAssetFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            { entityId: ENTITY_ID, entity: { tenantId: TENANT_ID } },
                            { deletedAt: null },
                        ]),
                    },
                })
            );
        });

        it('should filter by status', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            await service.listAssets({ entityId: ENTITY_ID, status: 'ACTIVE' });

            expect(mockAssetFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            { status: 'ACTIVE' },
                        ]),
                    },
                })
            );
        });

        it('should filter by category', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            await service.listAssets({ entityId: ENTITY_ID, category: 'COMPUTER' });

            expect(mockAssetFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            { category: 'COMPUTER' },
                        ]),
                    },
                })
            );
        });

        it('should search by name and description', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            await service.listAssets({ entityId: ENTITY_ID, search: 'laptop' });

            expect(mockAssetFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            {
                                OR: [
                                    { name: { contains: 'laptop', mode: 'insensitive' } },
                                    { description: { contains: 'laptop', mode: 'insensitive' } },
                                ],
                            },
                        ]),
                    },
                })
            );
        });

        it('should return empty array when no assets exist', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            const result = await service.listAssets({ entityId: ENTITY_ID });

            expect(result).toEqual([]);
        });

        it('should exclude soft-deleted assets', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            await service.listAssets({ entityId: ENTITY_ID });

            expect(mockAssetFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            { deletedAt: null },
                        ]),
                    },
                })
            );
        });
    });

    // ========================================================================
    // getAsset
    // ========================================================================

    describe('getAsset', () => {
        it('should return asset by ID with tenant filter', async () => {
            const asset = mockAsset();
            mockAssetFindFirst.mockResolvedValue(asset);

            const result = await service.getAsset('asset-1');

            expect(result).toEqual(asset);
            expect(mockAssetFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: 'asset-1',
                        entity: { tenantId: TENANT_ID },
                        deletedAt: null,
                    }),
                })
            );
        });

        it('should throw ASSET_NOT_FOUND for missing asset', async () => {
            mockAssetFindFirst.mockResolvedValue(null);

            await expect(service.getAsset('nonexistent')).rejects.toThrow(AccountingError);
            await expect(service.getAsset('nonexistent')).rejects.toMatchObject({
                code: 'ASSET_NOT_FOUND',
                statusCode: 404,
            });
        });

        it('should reject cross-tenant access', async () => {
            mockAssetFindFirst.mockResolvedValue(null);

            await expect(service.getAsset('other-tenant-asset')).rejects.toThrow(AccountingError);
        });
    });

    // ========================================================================
    // capitalizeAsset
    // ========================================================================

    describe('capitalizeAsset', () => {
        it('should create asset with integer cents for all monetary fields', async () => {
            const created = mockAsset();
            mockAssetCreate.mockResolvedValue(created);

            const result = await service.capitalizeAsset(VALID_CREATE_INPUT);

            expect(result).toEqual(created);
            // Verify integer cents
            assertIntegerCents(result.cost);
            assertIntegerCents(result.salvageValue);
            assertIntegerCents(result.accumulatedDepreciation);
            expect(mockAssetCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        entityId: ENTITY_ID,
                        name: 'Office Laptop',
                        cost: 250000,
                        salvageValue: 25000,
                        accumulatedDepreciation: 0,
                        status: 'ACTIVE',
                    }),
                })
            );
        });

        it('should validate entity ownership', async () => {
            mockEntityFind.mockResolvedValue(null);

            await expect(service.capitalizeAsset(VALID_CREATE_INPUT)).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });

        it('should validate GL account ownership', async () => {
            mockGLFind.mockResolvedValue(null); // GL account not found

            await expect(service.capitalizeAsset(VALID_CREATE_INPUT)).rejects.toMatchObject({
                code: 'GL_ACCOUNT_NOT_FOUND',
                statusCode: 403,
            });
        });

        it('should create asset without GL accounts', async () => {
            const input = {
                ...VALID_CREATE_INPUT,
                assetGLAccountId: undefined,
                depreciationExpenseGLAccountId: undefined,
                accumulatedDepreciationGLAccountId: undefined,
            };
            const created = mockAsset({
                assetGLAccountId: null,
                depreciationExpenseGLAccountId: null,
                accumulatedDepreciationGLAccountId: null,
            });
            mockAssetCreate.mockResolvedValue(created);

            const result = await service.capitalizeAsset(input);

            expect(result).toEqual(created);
        });
    });

    // ========================================================================
    // updateAsset
    // ========================================================================

    describe('updateAsset', () => {
        it('should update asset with tenant filter', async () => {
            const existing = mockAsset();
            mockAssetFindFirst.mockResolvedValue(existing);

            const updated = mockAsset({ name: 'Updated Laptop' });
            mockAssetUpdate.mockResolvedValue(updated);

            const result = await service.updateAsset('asset-1', { name: 'Updated Laptop' });

            expect(result.name).toBe('Updated Laptop');
        });

        it('should throw ASSET_NOT_FOUND for missing asset', async () => {
            mockAssetFindFirst.mockResolvedValue(null);

            await expect(
                service.updateAsset('nonexistent', { name: 'New Name' })
            ).rejects.toMatchObject({
                code: 'ASSET_NOT_FOUND',
                statusCode: 404,
            });
        });

        it('should reject updating a disposed asset', async () => {
            const disposed = mockAsset({ status: 'DISPOSED' });
            mockAssetFindFirst.mockResolvedValue(disposed);

            await expect(
                service.updateAsset('asset-1', { name: 'New Name' })
            ).rejects.toMatchObject({
                code: 'ASSET_DISPOSED',
                statusCode: 400,
            });
        });
    });

    // ========================================================================
    // disposeAsset
    // ========================================================================

    describe('disposeAsset', () => {
        it('should dispose asset and calculate gain/loss', async () => {
            const existing = mockAsset({ accumulatedDepreciation: 100000 });
            const disposed = mockAsset({
                status: 'DISPOSED',
                disposedDate: new Date('2025-12-31'),
                disposalAmount: 180000,
            });

            mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                return fn({
                    fixedAsset: {
                        findFirst: vi.fn().mockResolvedValue(existing),
                        update: vi.fn().mockResolvedValue(disposed),
                    },
                });
            });

            const result = await service.disposeAsset('asset-1', {
                disposedDate: '2025-12-31T00:00:00.000Z',
                disposalAmount: 180000,
            }) as Record<string, unknown>;

            // Net book value = 250000 - 100000 = 150000
            // Gain = 180000 - 150000 = 30000
            expect(result.gainLoss).toBe(30000);
            expect(result.netBookValue).toBe(150000);
            assertIntegerCents(result.disposalAmount as number);
            assertIntegerCents(result.gainLoss as number);
        });

        it('should throw for already disposed asset', async () => {
            const existing = mockAsset({ status: 'DISPOSED' });

            mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                return fn({
                    fixedAsset: {
                        findFirst: vi.fn().mockResolvedValue(existing),
                    },
                });
            });

            await expect(
                service.disposeAsset('asset-1', {
                    disposedDate: '2025-12-31T00:00:00.000Z',
                    disposalAmount: 0,
                })
            ).rejects.toMatchObject({
                code: 'ASSET_ALREADY_DISPOSED',
                statusCode: 400,
            });
        });

        it('should throw ASSET_NOT_FOUND for missing asset', async () => {
            mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                return fn({
                    fixedAsset: {
                        findFirst: vi.fn().mockResolvedValue(null),
                    },
                });
            });

            await expect(
                service.disposeAsset('nonexistent', {
                    disposedDate: '2025-12-31T00:00:00.000Z',
                    disposalAmount: 0,
                })
            ).rejects.toMatchObject({
                code: 'ASSET_NOT_FOUND',
                statusCode: 404,
            });
        });
    });

    // ========================================================================
    // deleteAsset (soft delete)
    // ========================================================================

    describe('deleteAsset', () => {
        it('should soft delete by setting deletedAt', async () => {
            const existing = mockAsset();
            mockAssetFindFirst.mockResolvedValue(existing);
            mockAssetUpdate.mockResolvedValue({ ...existing, deletedAt: new Date() });

            await service.deleteAsset('asset-1');

            expect(mockAssetUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'asset-1' },
                    data: { deletedAt: expect.any(Date) },
                })
            );
        });

        it('should throw ASSET_NOT_FOUND for missing asset', async () => {
            mockAssetFindFirst.mockResolvedValue(null);

            await expect(service.deleteAsset('nonexistent')).rejects.toMatchObject({
                code: 'ASSET_NOT_FOUND',
                statusCode: 404,
            });
        });
    });

    // ========================================================================
    // calculatePeriodDepreciation (Task 44a)
    // ========================================================================

    describe('calculatePeriodDepreciation', () => {
        it('should calculate straight-line monthly depreciation', () => {
            // Cost: $2500, Salvage: $250, Life: 36 months
            // Monthly = (250000 - 25000) / 36 = 6250 cents
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 0,
                'STRAIGHT_LINE',
                new Date('2024-01-01'),
                new Date('2024-02-01')
            );

            expect(amount).toBe(6250);
            assertIntegerCents(amount);
        });

        it('should handle partial first month (straight-line)', () => {
            // Acquired on Jan 15, period is January
            // Days remaining: 31 - 15 + 1 = 17 out of 31
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 0,
                'STRAIGHT_LINE',
                new Date('2024-01-15'),
                new Date('2024-01-01') // Same month as acquisition
            );

            const monthlyAmount = Math.round((250000 - 25000) / 36); // 6250
            const expected = Math.round(monthlyAmount * (17 / 31)); // ~3427
            expect(amount).toBe(expected);
            assertIntegerCents(amount);
        });

        it('should calculate declining balance depreciation', () => {
            // Rate = 2/36, NBV = 250000 (no prior depreciation)
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 0,
                'DECLINING_BALANCE',
                new Date('2024-01-01'),
                new Date('2024-02-01')
            );

            const expected = Math.round(250000 * (2 / 36)); // ~13889
            expect(amount).toBe(expected);
            assertIntegerCents(amount);
        });

        it('should cap depreciation at remaining depreciable value', () => {
            // Almost fully depreciated: accumulated = 224000
            // Remaining = 250000 - 224000 - 25000 = 1000
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 224000,
                'STRAIGHT_LINE',
                new Date('2024-01-01'),
                new Date('2027-01-01')
            );

            expect(amount).toBe(1000); // Capped at remaining
            assertIntegerCents(amount);
        });

        it('should return 0 when fully depreciated', () => {
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 225000, // Exactly at depreciable base
                'STRAIGHT_LINE',
                new Date('2024-01-01'),
                new Date('2027-02-01')
            );

            expect(amount).toBe(0);
        });

        it('should handle units of production as straight-line fallback', () => {
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 0,
                'UNITS_OF_PRODUCTION',
                new Date('2024-01-01'),
                new Date('2024-02-01')
            );

            expect(amount).toBe(6250); // Same as straight-line
            assertIntegerCents(amount);
        });
    });

    // ========================================================================
    // runDepreciation (Tasks 44b + 44c)
    // ========================================================================

    describe('runDepreciation', () => {
        it('should return empty results when no assets exist', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            const result = await service.runDepreciation({
                entityId: ENTITY_ID,
                periodDate: '2024-02-01T00:00:00.000Z',
            });

            expect(result).toEqual({ processed: 0, skipped: 0, entries: [] });
        });

        it('should skip already-processed assets (idempotency guard)', async () => {
            mockAssetFindMany.mockResolvedValue([mockAsset()]);
            mockDeprFindMany.mockResolvedValue([{ fixedAssetId: 'asset-1' }]); // Already processed

            const result = await service.runDepreciation({
                entityId: ENTITY_ID,
                periodDate: '2024-02-01T00:00:00.000Z',
            });

            expect(result.skipped).toBe(1);
            expect(result.processed).toBe(0);
        });

        it('should skip assets acquired after the period', async () => {
            // Asset acquired in March, but period is January
            mockAssetFindMany.mockResolvedValue([
                mockAsset({ acquiredDate: new Date('2024-03-01') }),
            ]);
            mockDeprFindMany.mockResolvedValue([]);

            const result = await service.runDepreciation({
                entityId: ENTITY_ID,
                periodDate: '2024-01-01T00:00:00.000Z',
            });

            expect(result.skipped).toBe(1);
            expect(result.processed).toBe(0);
        });

        it('should validate entity ownership', async () => {
            mockEntityFind.mockResolvedValue(null);

            await expect(
                service.runDepreciation({
                    entityId: 'foreign-entity',
                    periodDate: '2024-02-01T00:00:00.000Z',
                })
            ).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });

        it('should process assets and create depreciation entries with JEs', async () => {
            const asset = mockAsset();
            mockAssetFindMany.mockResolvedValue([asset]);
            mockDeprFindMany.mockResolvedValue([]); // No existing entries

            const mockJE = { id: 'je-1' };
            const mockDeprEntry = { id: 'depr-1' };

            mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                return fn({
                    journalEntry: {
                        findFirst: vi.fn().mockResolvedValue({ entryNumber: 'JE-010' }),
                        create: vi.fn().mockResolvedValue(mockJE),
                    },
                    depreciationEntry: {
                        create: vi.fn().mockResolvedValue(mockDeprEntry),
                    },
                    fixedAsset: {
                        update: vi.fn().mockResolvedValue({}),
                    },
                });
            });

            const result = await service.runDepreciation({
                entityId: ENTITY_ID,
                periodDate: '2024-02-01T00:00:00.000Z',
            });

            expect(result.processed).toBe(1);
            expect(result.entries).toHaveLength(1);
            expect(result.entries[0].assetId).toBe('asset-1');
            expect(result.entries[0].journalEntryId).toBe('je-1');
            assertIntegerCents(result.entries[0].amount);
        });

        it('should filter by specific asset IDs when provided', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            await service.runDepreciation({
                entityId: ENTITY_ID,
                periodDate: '2024-02-01T00:00:00.000Z',
                assetIds: ['asset-1', 'asset-2'],
            });

            expect(mockAssetFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: { in: ['asset-1', 'asset-2'] },
                    }),
                })
            );
        });
    });

    // ========================================================================
    // Tenant Isolation
    // ========================================================================

    describe('tenant isolation', () => {
        it('should always include tenant filter in list queries', async () => {
            mockAssetFindMany.mockResolvedValue([]);

            await service.listAssets({ entityId: ENTITY_ID });

            const call = mockAssetFindMany.mock.calls[0][0];
            const andConditions = call.where.AND;
            expect(andConditions).toContainEqual(
                expect.objectContaining({
                    entity: { tenantId: TENANT_ID },
                })
            );
        });

        it('should always include tenant filter in get queries', async () => {
            mockAssetFindFirst.mockResolvedValue(mockAsset());

            await service.getAsset('asset-1');

            expect(mockAssetFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        entity: { tenantId: TENANT_ID },
                    }),
                })
            );
        });

        it('should validate entity ownership before creating', async () => {
            mockEntityFind.mockResolvedValue(null);

            await expect(service.capitalizeAsset(VALID_CREATE_INPUT)).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });
    });

    // ========================================================================
    // Financial Invariants
    // ========================================================================

    describe('financial invariants', () => {
        it('should use integer cents for all monetary fields', () => {
            const asset = mockAsset();
            assertIntegerCents(asset.cost);
            assertIntegerCents(asset.salvageValue);
            assertIntegerCents(asset.accumulatedDepreciation);
        });

        it('should return integer cents from depreciation calculation', () => {
            const amount = service.calculatePeriodDepreciation(
                250000, 25000, 36, 0,
                'STRAIGHT_LINE',
                new Date('2024-01-01'),
                new Date('2024-02-01')
            );
            assertIntegerCents(amount);
        });

        it('should soft delete (set deletedAt) instead of hard delete', async () => {
            const existing = mockAsset();
            mockAssetFindFirst.mockResolvedValue(existing);
            mockAssetUpdate.mockResolvedValue({ ...existing, deletedAt: new Date() });

            await service.deleteAsset('asset-1');

            expect(mockAssetUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { deletedAt: expect.any(Date) },
                })
            );

            // Verify the soft delete returned a record with deletedAt
            const updateResult = await mockAssetUpdate.mock.results[0].value;
            expect(updateResult.deletedAt).toBeTruthy();
        });
    });
});
