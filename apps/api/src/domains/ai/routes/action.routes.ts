import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';
import { AIActionService } from '../services/ai-action.service';
import { handleAIError } from '../errors';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validation';
import { withPermission } from '../../../middleware/withPermission';
import {
  ActionIdParamsSchema,
  ListActionsQuerySchema,
  ReviewActionBodySchema,
  BatchReviewBodySchema,
  StatsQuerySchema,
  type ActionIdParams,
  type ListActionsQuery,
  type ReviewActionBody,
  type BatchReviewBody,
  type StatsQuery,
} from '../schemas/action.schema';

/**
 * AI Action Feed Routes
 *
 * CRUD operations for AI-generated action suggestions.
 * All routes require `ai:actions` RBAC permission.
 * entityId is required for all operations (entity-scoped actions).
 */
export async function actionRoutes(fastify: FastifyInstance) {
  // -------------------------------------------------------------------------
  // GET /api/ai/actions — List actions with filters
  // -------------------------------------------------------------------------
  fastify.get(
    '/',
    {
      ...withPermission('ai', 'actions', 'VIEW'),
      preValidation: [validateQuery(ListActionsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as ListActionsQuery;
      const tenantId = request.tenantId!;

      // Validate entity ownership (IDOR prevention)
      const entity = await prisma.entity.findFirst({
        where: { id: query.entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      const service = new AIActionService(tenantId, query.entityId);
      const result = await service.listActions({
        entityId: query.entityId,
        tenantId,
        status: query.status,
        type: query.type,
        limit: query.limit,
        offset: query.offset,
      });

      request.log.info(
        { entityId: query.entityId, count: result.actions.length, total: result.total },
        'Listed AI actions'
      );

      return result;
    }
  );

  // -------------------------------------------------------------------------
  // GET /api/ai/actions/stats — Dashboard stats
  // -------------------------------------------------------------------------
  fastify.get(
    '/stats',
    {
      ...withPermission('ai', 'actions', 'VIEW'),
      preValidation: [validateQuery(StatsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as StatsQuery;
      const tenantId = request.tenantId!;

      const entity = await prisma.entity.findFirst({
        where: { id: query.entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      const service = new AIActionService(tenantId, query.entityId);
      const stats = await service.getStats();

      request.log.info({ entityId: query.entityId }, 'Retrieved AI action stats');

      return stats;
    }
  );

  // -------------------------------------------------------------------------
  // GET /api/ai/actions/:actionId — Get single action
  // -------------------------------------------------------------------------
  fastify.get(
    '/:actionId',
    {
      ...withPermission('ai', 'actions', 'VIEW'),
      preValidation: [validateParams(ActionIdParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { actionId } = request.params as ActionIdParams;
      const tenantId = request.tenantId!;

      // We need entityId from query for tenant-scoped lookup
      // For single action, we look it up directly with tenant isolation
      try {
        // Find action with tenant isolation via entity relation
        const action = await prisma.aIAction.findFirst({
          where: {
            id: actionId,
            entity: { tenantId },
          },
        });

        if (!action) {
          return reply.status(404).send({ error: 'Action not found' });
        }

        request.log.info({ actionId }, 'Retrieved AI action');

        return action;
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/:actionId/approve — Approve single action
  // -------------------------------------------------------------------------
  fastify.post(
    '/:actionId/approve',
    {
      ...withPermission('ai', 'actions', 'ACT'),
      preValidation: [
        validateParams(ActionIdParamsSchema),
        validateBody(ReviewActionBodySchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { actionId } = request.params as ActionIdParams;
      const { entityId } = request.body as ReviewActionBody;
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      // Validate entity ownership
      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      try {
        const service = new AIActionService(tenantId, entityId);
        const action = await service.approveAction(actionId, userId);

        request.log.info({ actionId, entityId, userId }, 'Approved AI action');

        return action;
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/:actionId/reject — Reject single action
  // -------------------------------------------------------------------------
  fastify.post(
    '/:actionId/reject',
    {
      ...withPermission('ai', 'actions', 'ACT'),
      preValidation: [
        validateParams(ActionIdParamsSchema),
        validateBody(ReviewActionBodySchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { actionId } = request.params as ActionIdParams;
      const { entityId } = request.body as ReviewActionBody;
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      try {
        const service = new AIActionService(tenantId, entityId);
        const action = await service.rejectAction(actionId, userId);

        request.log.info({ actionId, entityId, userId }, 'Rejected AI action');

        return action;
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/batch/approve — Batch approve
  // -------------------------------------------------------------------------
  fastify.post(
    '/batch/approve',
    {
      ...withPermission('ai', 'actions', 'ACT'),
      preValidation: [validateBody(BatchReviewBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { entityId, actionIds } = request.body as BatchReviewBody;
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      const service = new AIActionService(tenantId, entityId);
      const result = await service.batchApprove(actionIds, userId);

      request.log.info(
        {
          entityId,
          requested: actionIds.length,
          succeeded: result.succeeded.length,
          failed: result.failed.length,
        },
        'Batch approved AI actions'
      );

      return result;
    }
  );

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/batch/reject — Batch reject
  // -------------------------------------------------------------------------
  fastify.post(
    '/batch/reject',
    {
      ...withPermission('ai', 'actions', 'ACT'),
      preValidation: [validateBody(BatchReviewBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { entityId, actionIds } = request.body as BatchReviewBody;
      const tenantId = request.tenantId!;
      const userId = request.userId!;

      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      const service = new AIActionService(tenantId, entityId);
      const result = await service.batchReject(actionIds, userId);

      request.log.info(
        {
          entityId,
          requested: actionIds.length,
          succeeded: result.succeeded.length,
          failed: result.failed.length,
        },
        'Batch rejected AI actions'
      );

      return result;
    }
  );
}
