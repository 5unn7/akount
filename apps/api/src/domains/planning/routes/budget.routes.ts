import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { BudgetService } from '../services/budget.service';
import { BudgetVarianceService } from '../services/budget-variance.service';
import { BudgetSuggestionService } from '../services/budget-suggestions.service';
import {
  CreateBudgetSchema,
  UpdateBudgetSchema,
  ListBudgetsQuerySchema,
  BudgetIdParamSchema,
  BudgetVarianceQuerySchema,
  BudgetRolloverBodySchema,
  BudgetSuggestionsQuerySchema,
  type CreateBudgetInput,
  type UpdateBudgetInput,
  type ListBudgetsQuery,
  type BudgetIdParam,
  type BudgetVarianceQuery,
  type BudgetRolloverBody,
  type BudgetSuggestionsQuery,
} from '../schemas/budget.schema';

/**
 * Budget routes — /api/planning/budgets
 *
 * Manages financial budgets with spending limits per period.
 * Auth + tenant middleware inherited from parent registration.
 */
export async function budgetRoutes(fastify: FastifyInstance) {
  // GET /budgets — List budgets
  fastify.get(
    '/',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
      preValidation: [validateQuery(ListBudgetsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new BudgetService(request.tenantId);
      const query = request.query as ListBudgetsQuery;

      const result = await service.listBudgets({
        entityId: query.entityId,
        cursor: query.cursor,
        limit: query.limit,
        period: query.period,
        categoryId: query.categoryId,
      });

      request.log.info({ count: result.budgets.length }, 'Listed budgets');
      return reply.status(200).send(result);
    }
  );

  // GET /budgets/:id — Get single budget
  fastify.get(
    '/:id',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
      preValidation: [validateParams(BudgetIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new BudgetService(request.tenantId);
      const params = request.params as BudgetIdParam;

      const budget = await service.getBudget(params.id);
      if (!budget) {
        return reply.status(404).send({ error: 'Budget not found' });
      }

      request.log.info({ budgetId: params.id }, 'Retrieved budget');
      return reply.status(200).send(budget);
    }
  );

  // POST /budgets — Create budget
  fastify.post(
    '/',
    {
      ...withPermission('planning', 'budgets', 'ACT'),
      preValidation: [validateBody(CreateBudgetSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new BudgetService(request.tenantId);
      const body = request.body as CreateBudgetInput;

      try {
        const budget = await service.createBudget(body);
        request.log.info({ budgetId: budget.id, name: body.name }, 'Created budget');
        return reply.status(201).send(budget);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // PATCH /budgets/:id — Update budget
  fastify.patch(
    '/:id',
    {
      ...withPermission('planning', 'budgets', 'ACT'),
      preValidation: [validateParams(BudgetIdParamSchema), validateBody(UpdateBudgetSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new BudgetService(request.tenantId);
      const params = request.params as BudgetIdParam;
      const body = request.body as UpdateBudgetInput;

      try {
        const budget = await service.updateBudget(params.id, body);
        request.log.info({ budgetId: params.id }, 'Updated budget');
        return reply.status(200).send(budget);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found or access denied')) {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('End date must be after start date')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // DELETE /budgets/:id — Soft delete budget
  fastify.delete(
    '/:id',
    {
      ...withPermission('planning', 'budgets', 'ACT'),
      preValidation: [validateParams(BudgetIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new BudgetService(request.tenantId);
      const params = request.params as BudgetIdParam;

      try {
        await service.deleteBudget(params.id);
        request.log.info({ budgetId: params.id }, 'Deleted budget');
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /budgets/:id/rollover — Create a new budget from an expired one
  fastify.post(
    '/:id/rollover',
    {
      ...withPermission('planning', 'budgets', 'ACT'),
      preValidation: [validateParams(BudgetIdParamSchema), validateBody(BudgetRolloverBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new BudgetService(request.tenantId);
      const params = request.params as BudgetIdParam;
      const body = request.body as BudgetRolloverBody;

      try {
        const newBudget = await service.rolloverBudget(params.id, body.carryUnusedAmount);
        request.log.info(
          { originalBudgetId: params.id, newBudgetId: newBudget.id, carryUnused: body.carryUnusedAmount },
          'Rolled over budget'
        );
        return reply.status(201).send(newBudget);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /budgets/suggestions — AI-powered budget suggestions based on spending
  fastify.get(
    '/suggestions',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
      preValidation: [validateQuery(BudgetSuggestionsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const suggestionService = new BudgetSuggestionService(request.tenantId);
      const query = request.query as BudgetSuggestionsQuery;

      const suggestions = await suggestionService.getSuggestions(
        query.entityId,
        query.lookbackMonths
      );

      request.log.info(
        { entityId: query.entityId, count: suggestions.length },
        'Generated budget suggestions'
      );
      return reply.status(200).send({ suggestions });
    }
  );

  // GET /budgets/variance — Budget variance analysis (all budgets)
  fastify.get(
    '/variance',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
      preValidation: [validateQuery(BudgetVarianceQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const varianceService = new BudgetVarianceService(request.tenantId);
      const query = request.query as BudgetVarianceQuery;

      const result = await varianceService.listBudgetVariances(query.entityId);
      request.log.info({ count: result.length }, 'Listed budget variances');
      return reply.status(200).send({ variances: result });
    }
  );

  // GET /budgets/:id/variance — Single budget variance detail with transactions
  fastify.get(
    '/:id/variance',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
      preValidation: [validateParams(BudgetIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const varianceService = new BudgetVarianceService(request.tenantId);
      const params = request.params as BudgetIdParam;

      const result = await varianceService.getBudgetVarianceDetail(params.id);
      if (!result) {
        return reply.status(404).send({ error: 'Budget not found' });
      }

      request.log.info({ budgetId: params.id, alertLevel: result.alertLevel }, 'Retrieved budget variance');
      return reply.status(200).send(result);
    }
  );
}
