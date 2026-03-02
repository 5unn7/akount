import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validation';
import { RuleSuggestionService } from '../services/rule-suggestion.service';
import { PatternDetectionService } from '../services/pattern-detection.service';
import { handleAIError } from '../errors';
import {
  ListSuggestionsSchema,
  SuggestionIdSchema,
  RejectSuggestionSchema,
  DetectPatternsSchema,
  ExpireSuggestionsSchema,
  type ListSuggestionsQuery,
  type SuggestionIdParams,
  type RejectSuggestionInput,
  type DetectPatternsQuery,
  type ExpireSuggestionsInput,
} from '../schemas/rule-suggestion.schema';

/**
 * Rule Suggestion Routes
 *
 * Manages AI-generated rule suggestions from pattern detection.
 * Users can list, approve, reject, and expire stale suggestions.
 * Pattern detection can be triggered on-demand.
 *
 * Routes:
 * - GET  /api/ai/suggestions         — List suggestions with filters
 * - GET  /api/ai/suggestions/:id      — Get single suggestion
 * - POST /api/ai/suggestions/:id/approve — Approve (creates active Rule)
 * - POST /api/ai/suggestions/:id/reject  — Reject with optional reason
 * - POST /api/ai/suggestions/expire   — Expire stale suggestions
 * - GET  /api/ai/suggestions/patterns — Detect patterns (on-demand scan)
 */
export async function ruleSuggestionRoutes(fastify: FastifyInstance) {
  // -----------------------------------------------------------------------
  // GET /api/ai/suggestions — List suggestions with filters
  // -----------------------------------------------------------------------
  fastify.get(
    '/',
    {
      ...withPermission('ai', 'rules', 'VIEW'),
      preValidation: [validateQuery(ListSuggestionsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as ListSuggestionsQuery;
      const service = new RuleSuggestionService(request.tenantId, request.userId);

      try {
        const result = await service.listSuggestions({
          entityId: query.entityId,
          status: query.status,
          cursor: query.cursor,
          limit: query.limit,
        });

        request.log.info(
          { count: result.suggestions.length, entityId: query.entityId, status: query.status },
          'Listed rule suggestions'
        );
        return reply.send(result);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // GET /api/ai/suggestions/patterns — Detect patterns (on-demand scan)
  // Must be before /:id to avoid route conflict
  // -----------------------------------------------------------------------
  fastify.get(
    '/patterns',
    {
      ...withPermission('ai', 'rules', 'VIEW'),
      preValidation: [validateQuery(DetectPatternsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as DetectPatternsQuery;
      const service = new PatternDetectionService(request.tenantId, request.userId);

      try {
        const patterns = await service.detectPatterns(query.entityId);

        request.log.info(
          { entityId: query.entityId, patternCount: patterns.length },
          'Detected patterns'
        );
        return reply.send({ patterns, count: patterns.length });
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // POST /api/ai/suggestions/expire — Expire stale suggestions
  // Must be before /:id to avoid route conflict
  // -----------------------------------------------------------------------
  fastify.post(
    '/expire',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateBody(ExpireSuggestionsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as ExpireSuggestionsInput;
      const service = new RuleSuggestionService(request.tenantId, request.userId);

      try {
        const expiredCount = await service.expireStaleSuggestions(body.entityId);

        request.log.info(
          { entityId: body.entityId, expiredCount },
          'Expired stale suggestions'
        );
        return reply.send({ expiredCount });
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // GET /api/ai/suggestions/:id — Get single suggestion
  // -----------------------------------------------------------------------
  fastify.get(
    '/:id',
    {
      ...withPermission('ai', 'rules', 'VIEW'),
      preValidation: [validateParams(SuggestionIdSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as SuggestionIdParams;
      const service = new RuleSuggestionService(request.tenantId, request.userId);

      try {
        const suggestion = await service.getSuggestion(params.id);

        if (!suggestion) {
          return reply.status(404).send({ error: 'Suggestion not found' });
        }

        request.log.info({ suggestionId: params.id }, 'Retrieved rule suggestion');
        return reply.send(suggestion);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // POST /api/ai/suggestions/:id/approve — Approve suggestion (creates Rule)
  // -----------------------------------------------------------------------
  fastify.post(
    '/:id/approve',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateParams(SuggestionIdSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as SuggestionIdParams;
      const service = new RuleSuggestionService(request.tenantId, request.userId);

      try {
        const result = await service.approveSuggestion(params.id);

        request.log.info(
          { suggestionId: params.id, ruleId: result.ruleId },
          'Approved rule suggestion'
        );
        return reply.send(result);
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );

  // -----------------------------------------------------------------------
  // POST /api/ai/suggestions/:id/reject — Reject suggestion
  // -----------------------------------------------------------------------
  fastify.post(
    '/:id/reject',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      preValidation: [validateParams(SuggestionIdSchema), validateBody(RejectSuggestionSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as SuggestionIdParams;
      const body = (request.body ?? {}) as RejectSuggestionInput;
      const service = new RuleSuggestionService(request.tenantId, request.userId);

      try {
        await service.rejectSuggestion(params.id, body.reason);

        request.log.info(
          { suggestionId: params.id, reason: body.reason },
          'Rejected rule suggestion'
        );
        return reply.status(204).send();
      } catch (error) {
        return handleAIError(error, reply);
      }
    }
  );
}
