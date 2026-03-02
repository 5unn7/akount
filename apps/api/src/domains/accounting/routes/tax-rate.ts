import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validation';
import { TaxRateService } from '../services/tax-rate.service';
import { handleAccountingError } from '../errors';
import {
    CreateTaxRateSchema,
    UpdateTaxRateSchema,
    ListTaxRatesSchema,
    TaxRateParamsSchema,
    type CreateTaxRateInput,
    type UpdateTaxRateInput,
    type ListTaxRatesQuery,
    type TaxRateParams,
} from '../schemas/tax-rate.schema';

/**
 * Tax Rate Routes
 *
 * CRUD operations for tax rates (GST, HST, PST, QST, etc.).
 * Supports both entity-specific and global (system-wide) rates.
 */
export async function taxRateRoutes(fastify: FastifyInstance) {
    // GET /tax-rates — List with filters
    fastify.get(
        '/',
        {
            ...withPermission('accounting', 'tax-rates', 'VIEW'),
            preValidation: [validateQuery(ListTaxRatesSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const query = request.query as ListTaxRatesQuery;
            const service = new TaxRateService(request.tenantId, request.userId);

            try {
                const taxRates = await service.listTaxRates(query);
                request.log.info({ count: taxRates.length }, 'Listed tax rates');
                return reply.send(taxRates);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // GET /tax-rates/:id — Single tax rate
    fastify.get(
        '/:id',
        {
            ...withPermission('accounting', 'tax-rates', 'VIEW'),
            preValidation: [validateParams(TaxRateParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as TaxRateParams;
            const service = new TaxRateService(request.tenantId, request.userId);

            try {
                const taxRate = await service.getTaxRate(params.id);
                request.log.info({ taxRateId: params.id }, 'Retrieved tax rate');
                return reply.send(taxRate);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /tax-rates — Create tax rate
    fastify.post(
        '/',
        {
            ...withPermission('accounting', 'tax-rates', 'ACT'),
            preValidation: [validateBody(CreateTaxRateSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const body = request.body as CreateTaxRateInput;
            const service = new TaxRateService(request.tenantId, request.userId);

            try {
                const taxRate = await service.createTaxRate(body);
                request.log.info({ taxRateId: taxRate.id, code: body.code }, 'Created tax rate');
                return reply.status(201).send(taxRate);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // PATCH /tax-rates/:id — Update tax rate
    fastify.patch(
        '/:id',
        {
            ...withPermission('accounting', 'tax-rates', 'ACT'),
            preValidation: [
                validateParams(TaxRateParamsSchema),
                validateBody(UpdateTaxRateSchema),
            ],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as TaxRateParams;
            const body = request.body as UpdateTaxRateInput;
            const service = new TaxRateService(request.tenantId, request.userId);

            try {
                const taxRate = await service.updateTaxRate(params.id, body);
                request.log.info({ taxRateId: params.id }, 'Updated tax rate');
                return reply.send(taxRate);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // DELETE /tax-rates/:id — Deactivate (soft delete - sets isActive: false)
    fastify.delete(
        '/:id',
        {
            ...withPermission('accounting', 'tax-rates', 'ACT'),
            preValidation: [
                validateParams(TaxRateParamsSchema),
            ],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as TaxRateParams;
            const service = new TaxRateService(request.tenantId, request.userId);

            try {
                const taxRate = await service.deactivateTaxRate(params.id);
                request.log.info({ taxRateId: params.id }, 'Deactivated tax rate');
                return reply.send(taxRate);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );
}