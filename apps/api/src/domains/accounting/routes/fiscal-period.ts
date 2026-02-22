import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validation';
import { FiscalPeriodService } from '../services/fiscal-period.service';
import { AccountingError } from '../errors';
import {
    CalendarParamsSchema,
    PeriodParamsSchema,
    CreateCalendarSchema,
    ListCalendarsSchema,
    type CalendarParams,
    type PeriodParams,
    type CreateCalendarInput,
    type ListCalendarsQuery,
} from '../schemas/fiscal-period.schema';

/**
 * Fiscal Period Routes
 *
 * Calendar management (create, list, get) and period lifecycle
 * (lock, close, reopen). Registered under /api/accounting/fiscal-periods.
 */
export async function fiscalPeriodRoutes(fastify: FastifyInstance) {
    // GET /fiscal-periods — List calendars for an entity
    fastify.get(
        '/',
        {
            ...withPermission('accounting', 'fiscal-periods', 'VIEW'),
            preValidation: [validateQuery(ListCalendarsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const query = request.query as ListCalendarsQuery;
            const service = new FiscalPeriodService(request.tenantId, request.userId);

            try {
                const calendars = await service.listCalendars(query);
                return reply.send(calendars);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // GET /fiscal-periods/:id — Get single calendar with periods
    fastify.get(
        '/:id',
        {
            ...withPermission('accounting', 'fiscal-periods', 'VIEW'),
            preValidation: [validateParams(CalendarParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as CalendarParams;
            const service = new FiscalPeriodService(request.tenantId, request.userId);

            try {
                const calendar = await service.getCalendar(params.id);
                return reply.send(calendar);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /fiscal-periods — Create fiscal calendar (auto-generates 12 periods)
    fastify.post(
        '/',
        {
            ...withPermission('accounting', 'fiscal-periods', 'ACT'),
            preValidation: [validateBody(CreateCalendarSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const body = request.body as CreateCalendarInput;
            const service = new FiscalPeriodService(request.tenantId, request.userId);

            try {
                const calendar = await service.createCalendar(body);
                return reply.status(201).send(calendar);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /fiscal-periods/periods/:id/lock — Lock a period
    fastify.post(
        '/periods/:id/lock',
        {
            ...withPermission('accounting', 'fiscal-periods', 'APPROVE'),
            preValidation: [validateParams(PeriodParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as PeriodParams;
            const service = new FiscalPeriodService(request.tenantId, request.userId);

            try {
                const period = await service.lockPeriod(params.id);
                return reply.send(period);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /fiscal-periods/periods/:id/close — Close a period
    fastify.post(
        '/periods/:id/close',
        {
            ...withPermission('accounting', 'fiscal-periods', 'APPROVE'),
            preValidation: [validateParams(PeriodParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as PeriodParams;
            const service = new FiscalPeriodService(request.tenantId, request.userId);

            try {
                const period = await service.closePeriod(params.id);
                return reply.send(period);
            } catch (error) {
                return handleAccountingError(error, reply);
            }
        }
    );

    // POST /fiscal-periods/periods/:id/reopen — Reopen a period
    fastify.post(
        '/periods/:id/reopen',
        {
            ...withPermission('accounting', 'fiscal-periods', 'APPROVE'),
            preValidation: [validateParams(PeriodParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            if (!request.tenantId || !request.userId) {
                return reply.status(500).send({ error: 'Missing tenant context' });
            }

            const params = request.params as PeriodParams;
            const service = new FiscalPeriodService(request.tenantId, request.userId);

            try {
                const period = await service.reopenPeriod(params.id);
                return reply.send(period);
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
