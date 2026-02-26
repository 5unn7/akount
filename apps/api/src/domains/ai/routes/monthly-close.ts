import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery, validateBody } from '../../../middleware/validation';
import { MonthlyCloseService } from '../services/monthly-close.service';
import { handleAIError } from '../errors';
import {
  CloseReadinessSchema,
  ExecuteCloseSchema,
  CloseHistorySchema,
  type CloseReadinessQuery,
  type ExecuteCloseInput,
  type CloseHistoryQuery,
} from '../schemas/monthly-close.schema';

/**
 * Monthly Close Routes
 *
 * Provides endpoints for checking close readiness, executing monthly close,
 * and viewing close history. Orchestrates the fiscal period close workflow
 * with readiness scoring and checklist validation.
 *
 * Security:
 * - All routes require 'ai:monthly-close:ACT' permission (close is a financial action)
 * - Tenant isolation via entity membership
 * - Period ownership validated via fiscal calendar → entity → tenant chain
 */
export async function monthlyCloseRoutes(fastify: FastifyInstance) {
  // -----------------------------------------------------------------------
  // GET /api/ai/monthly-close/readiness - Get close readiness report
  // -----------------------------------------------------------------------
  fastify.get(
    '/readiness',
    {
      ...withPermission('ai', 'monthly-close', 'VIEW'),
      preValidation: [validateQuery(CloseReadinessSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as CloseReadinessQuery;
      const service = new MonthlyCloseService(request.tenantId, request.userId);

      try {
        const report = await service.getCloseReadiness(query.entityId, query.periodId);

        request.log.info(
          { entityId: query.entityId, periodId: query.periodId, score: report.score },
          'Generated close readiness report',
        );
        return reply.send(report);
      } catch (error) {
        return handleAIError(error, reply);
      }
    },
  );

  // -----------------------------------------------------------------------
  // POST /api/ai/monthly-close/execute - Execute monthly close
  // -----------------------------------------------------------------------
  fastify.post(
    '/execute',
    {
      ...withPermission('ai', 'monthly-close', 'ACT'),
      preValidation: [validateBody(ExecuteCloseSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as ExecuteCloseInput;
      const service = new MonthlyCloseService(request.tenantId, request.userId);

      try {
        const result = await service.executeClose(body.entityId, body.periodId);

        request.log.info(
          { entityId: body.entityId, periodId: body.periodId },
          'Executed monthly close',
        );
        return reply.send(result);
      } catch (error) {
        return handleAIError(error, reply);
      }
    },
  );

  // -----------------------------------------------------------------------
  // GET /api/ai/monthly-close/history - List past close events
  // -----------------------------------------------------------------------
  fastify.get(
    '/history',
    {
      ...withPermission('ai', 'monthly-close', 'VIEW'),
      preValidation: [validateQuery(CloseHistorySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as CloseHistoryQuery;

      try {
        // Query audit log for MONTHLY_CLOSE actions
        const where = {
          tenantId: request.tenantId,
          entityId: query.entityId,
          model: 'FiscalPeriod',
          after: {
            path: ['action'],
            equals: 'MONTHLY_CLOSE',
          },
          ...(query.cursor && { id: { lt: query.cursor } }),
        };

        const entries = await prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.take + 1, // fetch one extra for cursor
          select: {
            id: true,
            recordId: true,
            action: true,
            before: true,
            after: true,
            userId: true,
            createdAt: true,
          },
        });

        const hasMore = entries.length > query.take;
        const items = hasMore ? entries.slice(0, query.take) : entries;
        const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

        request.log.info(
          { entityId: query.entityId, count: items.length },
          'Listed close history',
        );

        return reply.send({
          items,
          nextCursor,
          hasMore,
        });
      } catch (error) {
        return handleAIError(error, reply);
      }
    },
  );
}
