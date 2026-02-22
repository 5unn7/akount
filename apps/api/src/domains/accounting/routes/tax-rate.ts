import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validation';
import { TaxRateService } from '../services/tax-rate.service';
import { AccountingError } from '../errors';
import {
    CreateTaxRateSchema,
    UpdateTaxRateSchema,
    ListTaxRatesSchema,
    TaxRateParamsSchema,
    DeactivateTaxRateSchema,
    type CreateTaxRateInput,
    type UpdateTaxRateInput,
    type ListTaxRatesQuery,
    type TaxRateParams,
    type DeactivateTaxRateInput,
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
                validateBody(DeactivateTaxRateSchema).optional(),
            ],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as TaxRateParams;
            const body = request.body as DeactivateTaxRateInput | undefined;
            const service = new TaxRateService(request.tenantId, request.userId);

            try {
                const taxRate = await service.deactivateTaxRate(params.id, body);
                return reply.send(taxRate);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );
}

/**
 * Map AccountingError to HTTP response. Re-throw unknown errors.
 */
function handleAccountingError(error: unknown, reply: FastifyReply) {
    if (error instanceof AccountingError) {
        return reply.status(error.statusCode).send({
            error: error.code,
            message: error.message,
            details: error.details,
        });
    }
    throw error;
}
