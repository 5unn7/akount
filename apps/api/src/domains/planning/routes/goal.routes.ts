import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { GoalService } from '../services/goal.service';
import { GoalTrackingService } from '../services/goal-tracking.service';
import { GoalTemplateService } from '../services/goal-templates';
import {
  CreateGoalSchema,
  UpdateGoalSchema,
  ListGoalsQuerySchema,
  GoalIdParamSchema,
  GoalTrackingQuerySchema,
  type CreateGoalInput,
  type UpdateGoalInput,
  type ListGoalsQuery,
  type GoalIdParam,
  type GoalTrackingQuery,
} from '../schemas/goal.schema';

/**
 * Goal routes — /api/planning/goals
 *
 * Manages financial goals (revenue targets, savings, expense reduction).
 * Auth + tenant middleware inherited from parent registration.
 */
export async function goalRoutes(fastify: FastifyInstance) {
  // GET /goals — List goals
  fastify.get(
    '/',
    {
      ...withPermission('planning', 'goals', 'VIEW'),
      preValidation: [validateQuery(ListGoalsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new GoalService(request.tenantId);
      const query = request.query as ListGoalsQuery;

      const result = await service.listGoals({
        entityId: query.entityId,
        cursor: query.cursor,
        limit: query.limit,
        status: query.status,
        type: query.type,
      });

      request.log.info({ count: result.goals.length }, 'Listed goals');
      return reply.status(200).send(result);
    }
  );

  // GET /goals/:id — Get single goal
  fastify.get(
    '/:id',
    {
      ...withPermission('planning', 'goals', 'VIEW'),
      preValidation: [validateParams(GoalIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new GoalService(request.tenantId);
      const params = request.params as GoalIdParam;

      const goal = await service.getGoal(params.id);
      if (!goal) {
        return reply.status(404).send({ error: 'Goal not found' });
      }

      request.log.info({ goalId: params.id }, 'Retrieved goal');
      return reply.status(200).send(goal);
    }
  );

  // POST /goals — Create goal
  fastify.post(
    '/',
    {
      ...withPermission('planning', 'goals', 'ACT'),
      preValidation: [validateBody(CreateGoalSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new GoalService(request.tenantId);
      const body = request.body as CreateGoalInput;

      try {
        const goal = await service.createGoal(body);
        request.log.info({ goalId: goal.id, name: body.name }, 'Created goal');
        return reply.status(201).send(goal);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // PATCH /goals/:id — Update goal
  fastify.patch(
    '/:id',
    {
      ...withPermission('planning', 'goals', 'ACT'),
      preValidation: [validateParams(GoalIdParamSchema), validateBody(UpdateGoalSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new GoalService(request.tenantId);
      const params = request.params as GoalIdParam;
      const body = request.body as UpdateGoalInput;

      try {
        const goal = await service.updateGoal(params.id, body);
        request.log.info({ goalId: params.id }, 'Updated goal');
        return reply.status(200).send(goal);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /goals/track — Trigger tracking for all active goals of an entity
  fastify.post(
    '/track',
    {
      ...withPermission('planning', 'goals', 'ACT'),
      preValidation: [validateBody(GoalTrackingQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const trackingService = new GoalTrackingService(request.tenantId);
      const body = request.body as GoalTrackingQuery;

      const results = await trackingService.trackGoals(body.entityId);
      const updated = results.filter((r) => r.updated).length;
      const milestoneCount = results.reduce((sum, r) => sum + r.milestones.length, 0);

      request.log.info(
        { entityId: body.entityId, tracked: results.length, updated, milestones: milestoneCount },
        'Tracked goals'
      );
      return reply.status(200).send({ results });
    }
  );

  // POST /goals/:id/track — Trigger tracking for a single goal
  fastify.post(
    '/:id/track',
    {
      ...withPermission('planning', 'goals', 'ACT'),
      preValidation: [validateParams(GoalIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const trackingService = new GoalTrackingService(request.tenantId);
      const params = request.params as GoalIdParam;

      const result = await trackingService.trackGoal(params.id);
      if (!result) {
        return reply.status(404).send({ error: 'Goal not found or not active' });
      }

      request.log.info(
        { goalId: params.id, updated: result.updated, milestones: result.milestones.length },
        'Tracked goal'
      );
      return reply.status(200).send(result);
    }
  );

  // GET /goals/templates — List goal templates with calculated targets
  fastify.get(
    '/templates',
    {
      ...withPermission('planning', 'goals', 'VIEW'),
      preValidation: [validateQuery(GoalTrackingQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const templateService = new GoalTemplateService(request.tenantId);
      const query = request.query as GoalTrackingQuery;

      const templates = await templateService.listTemplates(query.entityId);
      request.log.info({ count: templates.length, entityId: query.entityId }, 'Listed goal templates');
      return reply.status(200).send({ templates });
    }
  );

  // DELETE /goals/:id — Soft delete goal
  fastify.delete(
    '/:id',
    {
      ...withPermission('planning', 'goals', 'ACT'),
      preValidation: [validateParams(GoalIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new GoalService(request.tenantId);
      const params = request.params as GoalIdParam;

      try {
        await service.deleteGoal(params.id);
        request.log.info({ goalId: params.id }, 'Deleted goal');
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
