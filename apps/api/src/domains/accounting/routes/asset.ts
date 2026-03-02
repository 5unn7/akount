import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validation';
import { AssetService } from '../services/asset.service';
import { handleAccountingError } from '../errors';
import {
    CreateAssetSchema,
    UpdateAssetSchema,
    ListAssetsSchema,
    AssetParamsSchema,
    DisposeAssetSchema,
    RunDepreciationSchema,
    type CreateAssetInput,
    type UpdateAssetInput,
    type ListAssetsQuery,
    type AssetParams,
    type DisposeAssetInput,
    type RunDepreciationInput,
} from '../schemas/asset.schema';

/**
 * Asset Routes
 *
 * CRUD operations for fixed assets and depreciation.
 * Supports capitalization, disposal, and automated depreciation runs.
 */
export async function assetRoutes(fastify: FastifyInstance) {
    // GET /assets — List with filters
    fastify.get(
        '/',
        {
            ...withPermission('accounting', 'assets', 'VIEW'),
            preValidation: [validateQuery(ListAssetsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const query = request.query as ListAssetsQuery;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                const assets = await service.listAssets(query);
                request.log.info({ count: assets.length }, 'Listed assets');
                return reply.send(assets);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // GET /assets/:id — Single asset with depreciation entries
    fastify.get(
        '/:id',
        {
            ...withPermission('accounting', 'assets', 'VIEW'),
            preValidation: [validateParams(AssetParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as AssetParams;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                const asset = await service.getAsset(params.id);
                request.log.info({ assetId: params.id }, 'Retrieved asset');
                return reply.send(asset);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /assets — Capitalize (create) a new asset
    fastify.post(
        '/',
        {
            ...withPermission('accounting', 'assets', 'ACT'),
            preValidation: [validateBody(CreateAssetSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const body = request.body as CreateAssetInput;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                const asset = await service.capitalizeAsset(body);
                request.log.info({ assetId: asset.id, name: body.name }, 'Capitalized asset');
                return reply.status(201).send(asset);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // PATCH /assets/:id — Update asset
    fastify.patch(
        '/:id',
        {
            ...withPermission('accounting', 'assets', 'ACT'),
            preValidation: [
                validateParams(AssetParamsSchema),
                validateBody(UpdateAssetSchema),
            ],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as AssetParams;
            const body = request.body as UpdateAssetInput;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                const asset = await service.updateAsset(params.id, body);
                request.log.info({ assetId: params.id }, 'Updated asset');
                return reply.send(asset);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /assets/:id/dispose — Dispose of an asset
    fastify.post(
        '/:id/dispose',
        {
            ...withPermission('accounting', 'assets', 'ACT'),
            preValidation: [
                validateParams(AssetParamsSchema),
                validateBody(DisposeAssetSchema),
            ],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as AssetParams;
            const body = request.body as DisposeAssetInput;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                const result = await service.disposeAsset(params.id, body);
                request.log.info({ assetId: params.id, gainLoss: result.gainLoss }, 'Disposed asset');
                return reply.send(result);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // DELETE /assets/:id — Soft delete
    fastify.delete(
        '/:id',
        {
            ...withPermission('accounting', 'assets', 'ACT'),
            preValidation: [validateParams(AssetParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as AssetParams;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                await service.deleteAsset(params.id);
                request.log.info({ assetId: params.id }, 'Soft-deleted asset');
                return reply.status(204).send();
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /assets/run-depreciation — Run depreciation for a period
    fastify.post(
        '/run-depreciation',
        {
            ...withPermission('accounting', 'assets', 'ACT'),
            preValidation: [validateBody(RunDepreciationSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const body = request.body as RunDepreciationInput;
            const service = new AssetService(request.tenantId, request.userId);

            try {
                const result = await service.runDepreciation(body);
                request.log.info(
                    { processed: result.processed, skipped: result.skipped },
                    'Ran depreciation'
                );
                return reply.send(result);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );
}
