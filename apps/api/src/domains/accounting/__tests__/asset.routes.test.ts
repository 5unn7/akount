import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { assetRoutes } from '../routes/asset';
import { AccountingError } from '../errors';
import { assertIntegerCents, assertMoneyFields } from '../../../test-utils/financial-assertions';

// Mock middleware
vi.mock('../../../middleware/auth', () => ({
    authMiddleware: vi.fn(async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        request.userId = 'test-user-id';
    }),
}));

vi.mock('../../../middleware/tenant', () => ({
    tenantMiddleware: vi.fn(async (request) => {
        request.tenantId = 'tenant-abc-123';
        request.tenantRole = 'OWNER';
    }),
}));

vi.mock('../../../middleware/rbac', () => ({
    withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/validation', () => ({
    validateQuery: vi.fn(() => async () => {}),
    validateParams: vi.fn(() => async () => {}),
    validateBody: vi.fn(() => {
        const handler = async () => {};
        (handler as Record<string, unknown>).optional = () => async () => {};
        return handler;
    }),
}));

vi.mock('../../../middleware/withPermission', () => ({
    withPermission: vi.fn(() => ({
        preHandler: async (request: Record<string, unknown>) => {
            request.userId = 'test-user-id';
            request.tenantId = 'tenant-abc-123';
            request.tenantRole = 'OWNER';
        },
    })),
}));

// Mock AssetService
const mockListAssets = vi.fn();
const mockGetAsset = vi.fn();
const mockCapitalizeAsset = vi.fn();
const mockUpdateAsset = vi.fn();
const mockDisposeAsset = vi.fn();
const mockDeleteAsset = vi.fn();
const mockRunDepreciation = vi.fn();

vi.mock('../services/asset.service', () => ({
    AssetService: function (this: Record<string, unknown>) {
        this.listAssets = mockListAssets;
        this.getAsset = mockGetAsset;
        this.capitalizeAsset = mockCapitalizeAsset;
        this.updateAsset = mockUpdateAsset;
        this.disposeAsset = mockDisposeAsset;
        this.deleteAsset = mockDeleteAsset;
        this.runDepreciation = mockRunDepreciation;
    },
}));

const MOCK_ASSET = {
    id: 'asset-1',
    entityId: 'entity-1',
    name: 'Office Laptop',
    description: 'MacBook Pro 16"',
    category: 'COMPUTER',
    acquiredDate: '2024-01-15T00:00:00.000Z',
    cost: 250000, // Integer cents
    salvageValue: 25000,
    usefulLifeMonths: 36,
    depreciationMethod: 'STRAIGHT_LINE',
    accumulatedDepreciation: 0,
    status: 'ACTIVE',
    disposedDate: null,
    disposalAmount: null,
    assetGLAccountId: 'gl-1',
    depreciationExpenseGLAccountId: 'gl-2',
    accumulatedDepreciationGLAccountId: 'gl-3',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    deletedAt: null,
};

describe('Asset Routes', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockListAssets.mockResolvedValue([MOCK_ASSET]);
        mockGetAsset.mockResolvedValue({
            ...MOCK_ASSET,
            depreciationEntries: [],
        });
        mockCapitalizeAsset.mockResolvedValue(MOCK_ASSET);
        mockUpdateAsset.mockResolvedValue({ ...MOCK_ASSET, name: 'Updated Laptop' });
        mockDisposeAsset.mockResolvedValue({
            ...MOCK_ASSET,
            status: 'DISPOSED',
            disposedDate: '2025-12-31T00:00:00.000Z',
            disposalAmount: 150000,
            netBookValue: 200000,
            gainLoss: -50000,
        });
        mockDeleteAsset.mockResolvedValue(undefined);
        mockRunDepreciation.mockResolvedValue({
            processed: 1,
            skipped: 0,
            entries: [{
                assetId: 'asset-1',
                assetName: 'Office Laptop',
                amount: 6250,
                journalEntryId: 'je-1',
            }],
        });

        app = Fastify({ logger: false });
        await app.register(assetRoutes, { prefix: '/assets' });
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    // ========================================================================
    // GET /assets
    // ========================================================================

    describe('GET /assets', () => {
        it('should return 200 with assets list', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/assets',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body).toHaveLength(1);
            expect(body[0].name).toBe('Office Laptop');
            assertIntegerCents(body[0].cost);
            assertIntegerCents(body[0].salvageValue);
        });

        it('should call service with query params', async () => {
            await app.inject({
                method: 'GET',
                url: '/assets',
                headers: { authorization: 'Bearer test-token' },
                query: { entityId: 'entity-1', status: 'ACTIVE' },
            });

            expect(mockListAssets).toHaveBeenCalledTimes(1);
        });
    });

    // ========================================================================
    // GET /assets/:id
    // ========================================================================

    describe('GET /assets/:id', () => {
        it('should return 200 with asset detail', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/assets/asset-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.name).toBe('Office Laptop');
            expect(body.depreciationEntries).toEqual([]);
            assertMoneyFields(body, ['cost', 'salvageValue', 'accumulatedDepreciation']);
        });

        it('should return 404 when not found', async () => {
            mockGetAsset.mockRejectedValue(
                new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404)
            );

            const response = await app.inject({
                method: 'GET',
                url: '/assets/nonexistent',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(404);
            expect(response.json().error).toBe('ASSET_NOT_FOUND');
        });
    });

    // ========================================================================
    // POST /assets (capitalize)
    // ========================================================================

    describe('POST /assets', () => {
        it('should return 201 on successful capitalization', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/assets',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    entityId: 'entity-1',
                    name: 'Office Laptop',
                    category: 'COMPUTER',
                    acquiredDate: '2024-01-15T00:00:00.000Z',
                    cost: 250000,
                    salvageValue: 25000,
                    usefulLifeMonths: 36,
                    depreciationMethod: 'STRAIGHT_LINE',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = response.json();
            expect(body.name).toBe('Office Laptop');
            assertIntegerCents(body.cost);
        });

        it('should return 403 when entity ownership fails', async () => {
            mockCapitalizeAsset.mockRejectedValue(
                new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/assets',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    entityId: 'foreign-entity',
                    name: 'Test',
                    category: 'COMPUTER',
                    acquiredDate: '2024-01-15T00:00:00.000Z',
                    cost: 100000,
                    salvageValue: 10000,
                    usefulLifeMonths: 36,
                    depreciationMethod: 'STRAIGHT_LINE',
                },
            });

            expect(response.statusCode).toBe(403);
            expect(response.json().error).toBe('ENTITY_NOT_FOUND');
        });
    });

    // ========================================================================
    // PATCH /assets/:id
    // ========================================================================

    describe('PATCH /assets/:id', () => {
        it('should return 200 on successful update', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/assets/asset-1',
                headers: { authorization: 'Bearer test-token' },
                payload: { name: 'Updated Laptop' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().name).toBe('Updated Laptop');
        });

        it('should return 404 for missing asset', async () => {
            mockUpdateAsset.mockRejectedValue(
                new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404)
            );

            const response = await app.inject({
                method: 'PATCH',
                url: '/assets/nonexistent',
                headers: { authorization: 'Bearer test-token' },
                payload: { name: 'New Name' },
            });

            expect(response.statusCode).toBe(404);
        });

        it('should return 400 for disposed asset', async () => {
            mockUpdateAsset.mockRejectedValue(
                new AccountingError('Cannot update a disposed asset', 'ASSET_DISPOSED', 400)
            );

            const response = await app.inject({
                method: 'PATCH',
                url: '/assets/asset-1',
                headers: { authorization: 'Bearer test-token' },
                payload: { name: 'New Name' },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('ASSET_DISPOSED');
        });
    });

    // ========================================================================
    // POST /assets/:id/dispose
    // ========================================================================

    describe('POST /assets/:id/dispose', () => {
        it('should return 200 with disposal result including gain/loss', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/assets/asset-1/dispose',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    disposedDate: '2025-12-31T00:00:00.000Z',
                    disposalAmount: 150000,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.status).toBe('DISPOSED');
            assertIntegerCents(body.disposalAmount);
            assertIntegerCents(body.netBookValue);
            assertIntegerCents(body.gainLoss);
        });

        it('should return 400 for already disposed asset', async () => {
            mockDisposeAsset.mockRejectedValue(
                new AccountingError('Asset is already disposed', 'ASSET_ALREADY_DISPOSED', 400)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/assets/asset-1/dispose',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    disposedDate: '2025-12-31T00:00:00.000Z',
                    disposalAmount: 0,
                },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('ASSET_ALREADY_DISPOSED');
        });
    });

    // ========================================================================
    // DELETE /assets/:id
    // ========================================================================

    describe('DELETE /assets/:id', () => {
        it('should return 204 on successful soft delete', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/assets/asset-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(204);
            expect(mockDeleteAsset).toHaveBeenCalledTimes(1);
        });

        it('should return 404 for missing asset', async () => {
            mockDeleteAsset.mockRejectedValue(
                new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404)
            );

            const response = await app.inject({
                method: 'DELETE',
                url: '/assets/nonexistent',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    // ========================================================================
    // POST /assets/run-depreciation
    // ========================================================================

    describe('POST /assets/run-depreciation', () => {
        it('should return 200 with depreciation results', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/assets/run-depreciation',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    entityId: 'entity-1',
                    periodDate: '2024-02-01T00:00:00.000Z',
                },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.processed).toBe(1);
            expect(body.skipped).toBe(0);
            expect(body.entries).toHaveLength(1);
            assertIntegerCents(body.entries[0].amount);
        });

        it('should accept specific asset IDs', async () => {
            await app.inject({
                method: 'POST',
                url: '/assets/run-depreciation',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    entityId: 'entity-1',
                    periodDate: '2024-02-01T00:00:00.000Z',
                    assetIds: ['asset-1', 'asset-2'],
                },
            });

            expect(mockRunDepreciation).toHaveBeenCalledTimes(1);
        });

        it('should return 403 for wrong entity', async () => {
            mockRunDepreciation.mockRejectedValue(
                new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/assets/run-depreciation',
                headers: { authorization: 'Bearer test-token' },
                payload: {
                    entityId: 'foreign-entity',
                    periodDate: '2024-02-01T00:00:00.000Z',
                },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    // ========================================================================
    // Tenant Isolation
    // ========================================================================

    describe('tenant isolation', () => {
        it('should reject cross-tenant access on GET', async () => {
            mockGetAsset.mockRejectedValue(
                new AccountingError('Asset not found', 'ASSET_NOT_FOUND', 404)
            );

            const response = await app.inject({
                method: 'GET',
                url: '/assets/other-tenant-asset',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(404);
        });
    });
});
