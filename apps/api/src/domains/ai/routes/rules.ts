import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validation';
import { RuleService } from '../services/rule.service';
import { handleAIError } from '../errors';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  ListRulesSchema,
  RuleIdSchema,
  RuleStatsSchema,
  type CreateRuleInput,
  type UpdateRuleInput,
  type ListRulesQuery,
  type RuleIdParams,
  type RuleStatsQuery,
} from '../schemas/rule.schema';

/**
 * AI Rules Routes
 *
 * CRUD operations for user-defined automation rules.
 * Rules define conditions (e.g., "description contains Starbucks") and actions
 * (e.g., "set category to Meals & Entertainment").
 *
 * Security features:
 * - Field allowlist (description, amount, accountId only)
 * - Operator allowlist (no regex support)
 * - JSON payload size limit (10KB)
 * - FK ownership validation (categoryId, glAccountId)
 * - Tenant isolation via entity membership
 */
export async function rulesRoutes(fastify: FastifyInstance) {
  // -----------------------------------------------------------------------
  // GET /api/ai/rules - List rules with filters and cursor pagination
  // -----------------------------------------------------------------------
  fastify.get(
    '/',
    {
      ...withPermission('ai', 'rules', 'VIEW'),
      preValidation: [validateQuery(ListRulesSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as ListRulesQuery;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        const result = await service.listRules(query);
        request.log.info({ count: result.rules.length, entityId: query.entityId }, 'Listed rules');
        return reply.send(result);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // GET /api/ai/rules/:id - Get single rule
  // -----------------------------------------------------------------------
  fastify.get(
    '/:id',
    {
      ...withPermission('ai', 'rules', 'VIEW'),
      preValidation: [validateParams(RuleIdSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as RuleIdParams;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        const rule = await service.getRule(params.id);

        if (!rule) {
          return reply.status(404).send({ error: 'Rule not found' });
        }

        request.log.info({ ruleId: params.id }, 'Retrieved rule');
        return reply.send(rule);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // POST /api/ai/rules - Create rule
  // -----------------------------------------------------------------------
  fastify.post(
    '/',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateBody(CreateRuleSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as CreateRuleInput;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        const rule = await service.createRule({
          ...body,
          source: body.source ?? 'USER_MANUAL',
        });

        request.log.info(
          { ruleId: rule.id, name: body.name, entityId: body.entityId },
          'Created rule'
        );
        return reply.status(201).send(rule);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // PATCH /api/ai/rules/:id - Update rule
  // -----------------------------------------------------------------------
  fastify.patch(
    '/:id',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateParams(RuleIdSchema), validateBody(UpdateRuleSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as RuleIdParams;
      const body = request.body as UpdateRuleInput;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        const rule = await service.updateRule(params.id, body);

        request.log.info({ ruleId: params.id }, 'Updated rule');
        return reply.send(rule);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // DELETE /api/ai/rules/:id - Delete rule (hard delete)
  // -----------------------------------------------------------------------
  fastify.delete(
    '/:id',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateParams(RuleIdSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as RuleIdParams;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        await service.deleteRule(params.id);

        request.log.info({ ruleId: params.id }, 'Deleted rule');
        return reply.status(204).send();
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // POST /api/ai/rules/:id/toggle - Toggle active state
  // -----------------------------------------------------------------------
  fastify.post(
    '/:id/toggle',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateParams(RuleIdSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as RuleIdParams;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        const rule = await service.toggleRule(params.id);

        request.log.info({ ruleId: params.id, isActive: rule.isActive }, 'Toggled rule');
        return reply.send(rule);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // GET /api/ai/rules/stats - Get rule statistics
  // -----------------------------------------------------------------------
  fastify.get(
    '/stats',
    {
      ...withPermission('ai', 'rules', 'VIEW'),
      preValidation: [validateQuery(RuleStatsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as RuleStatsQuery;
      const service = new RuleService(request.tenantId, request.userId);

      try {
        const stats = await service.getRuleStats(query.entityId);

        request.log.info({ entityId: query.entityId, total: stats.total }, 'Retrieved rule stats');
        return reply.send(stats);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );
}
