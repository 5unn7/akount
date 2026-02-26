import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';
import { aiService } from './services/ai.service';
import { CategorizationService } from './services/categorization.service';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { validateBody } from '../../middleware/validation';
import { withPermission } from '../../middleware/withPermission';
import { aiChatRateLimitConfig, aiRateLimitConfig } from '../../middleware/rate-limit';
import {
  ChatBodySchema,
  CategorizeSingleSchema,
  CategorizeBatchSchema,
  type ChatBodyInput,
  type CategorizeSingleInput,
  type CategorizeBatchInput,
} from './schemas/categorization.schema';
import {
  JESuggestSchema,
  JECreateFromSuggestionsSchema,
  type JESuggestInput,
  type JECreateFromSuggestionsInput,
} from './schemas/je-suggestion.schema';
import { JESuggestionService, type JESuggestionInput } from './services/je-suggestion.service';
import { actionRoutes } from './routes/action.routes';
import {
  ListInsightsSchema,
  DismissInsightSchema,
  SnoozeInsightSchema,
  GenerateInsightsSchema,
  GetInsightCountsSchema,
  type ListInsightsInput,
  type DismissInsightInput,
  type SnoozeInsightInput,
  type GenerateInsightsInput,
  type GetInsightCountsInput,
} from './schemas/insight.schema.js';
import { InsightService } from './services/insight.service.js';
import { handleAIError } from './errors.js';

/**
 * AI Domain Routes
 *
 * Provides AI-powered features: chat, categorization, insights, and recommendations.
 * All routes require authentication and are tenant-scoped.
 */
export async function aiRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  /**
   * POST /api/ai/chat
   *
   * General AI chat endpoint for financial questions and guidance.
   */
  fastify.post(
    '/chat',
    {
      ...withPermission('ai', 'chat', 'ACT'),
      preValidation: [validateBody(ChatBodySchema)],
      config: { rateLimit: aiChatRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { messages, options } = request.body as ChatBodyInput;

      try {
        const response = await aiService.chat(messages, options);
        return response;
      } catch (error: unknown) {
        request.log.error({ error }, 'AI chat error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );

  /**
   * POST /api/ai/categorize
   *
   * AI-powered single transaction categorization.
   * Now supports optional entityId for GL account resolution.
   */
  fastify.post(
    '/categorize',
    {
      ...withPermission('ai', 'categorize', 'ACT'),
      preValidation: [validateBody(CategorizeSingleSchema)],
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { description, amount, entityId } = request.body as CategorizeSingleInput;
      const tenantId = request.tenantId!;

      // Validate entityId belongs to this tenant (IDOR prevention)
      if (entityId) {
        const entity = await prisma.entity.findFirst({
          where: { id: entityId, tenantId },
          select: { id: true },
        });
        if (!entity) {
          return reply.status(404).send({ error: 'Entity not found or access denied' });
        }
      }

      try {
        const service = new CategorizationService(tenantId, entityId);
        const suggestion = await service.categorize(description, amount);
        request.log.info(
          { categoryId: suggestion.categoryId, confidence: suggestion.confidence },
          'Categorized transaction'
        );
        return suggestion;
      } catch (error: unknown) {
        request.log.error({ error }, 'Categorization error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );

  /**
   * POST /api/ai/categorize/batch
   *
   * Batch categorization: accepts transaction IDs, fetches them,
   * runs categorization with GL resolution, and returns per-transaction suggestions.
   */
  fastify.post(
    '/categorize/batch',
    {
      ...withPermission('ai', 'categorize', 'ACT'),
      preValidation: [validateBody(CategorizeBatchSchema)],
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { transactionIds, entityId } = request.body as CategorizeBatchInput;
      const tenantId = request.tenantId!;

      // Validate entityId belongs to this tenant (IDOR prevention)
      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      // Fetch transactions with tenant isolation via Account → Entity chain
      const transactions = await prisma.transaction.findMany({
        where: {
          id: { in: transactionIds },
          deletedAt: null,
          account: { entity: { tenantId } },
        },
        select: {
          id: true,
          description: true,
          amount: true,
          categoryId: true,
        },
      });

      if (transactions.length === 0) {
        return reply.status(404).send({ error: 'No matching transactions found' });
      }

      // Run batch categorization with GL resolution
      const service = new CategorizationService(tenantId, entityId);
      const suggestions = await service.categorizeBatch(
        transactions.map((t) => ({ description: t.description, amount: t.amount }))
      );

      // Pair transaction IDs with their suggestions
      const results = transactions.map((t, i) => ({
        transactionId: t.id,
        existingCategoryId: t.categoryId,
        suggestion: suggestions[i],
      }));

      request.log.info(
        { count: results.length, entityId },
        'Batch categorized transactions'
      );

      return {
        results,
        summary: {
          total: transactionIds.length,
          matched: transactions.length,
          missing: transactionIds.length - transactions.length,
          highConfidence: suggestions.filter((s) => s.confidenceTier === 'high').length,
          mediumConfidence: suggestions.filter((s) => s.confidenceTier === 'medium').length,
          lowConfidence: suggestions.filter((s) => s.confidenceTier === 'low').length,
        },
      };
    }
  );

  // -----------------------------------------------------------------------
  // JE Suggestion Endpoints
  // -----------------------------------------------------------------------

  /**
   * POST /api/ai/je-suggest
   *
   * Preview AI-generated journal entry suggestions for a batch of transactions.
   * Does NOT persist anything — returns suggestions for user review.
   */
  fastify.post(
    '/je-suggest',
    {
      ...withPermission('ai', 'categorize', 'ACT'),
      preValidation: [validateBody(JESuggestSchema)],
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { transactionIds, entityId } = request.body as JESuggestInput;
      const tenantId = request.tenantId!;

      // Validate entity ownership (IDOR prevention)
      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      // Fetch transactions with tenant isolation
      const transactions = await prisma.transaction.findMany({
        where: {
          id: { in: transactionIds },
          deletedAt: null,
          journalEntryId: null, // Only suggest for un-booked transactions
          account: { entity: { tenantId } },
        },
        select: {
          id: true,
          description: true,
          amount: true,
          currency: true,
          date: true,
          sourceType: true,
          accountId: true,
        },
      });

      if (transactions.length === 0) {
        return reply.status(404).send({ error: 'No eligible transactions found' });
      }

      const service = new JESuggestionService(tenantId, entityId, request.userId!);
      const inputs: JESuggestionInput[] = transactions.map((t) => ({
        transactionId: t.id,
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        date: t.date,
        sourceType: t.sourceType,
        accountId: t.accountId,
      }));

      try {
        const result = await service.suggestBatch(inputs);

        request.log.info(
          {
            entityId,
            total: result.summary.total,
            suggested: result.summary.suggested,
            skipped: result.summary.skipped,
          },
          'Generated JE suggestions'
        );

        return result;
      } catch (error: unknown) {
        request.log.error({ error }, 'JE suggestion error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );

  /**
   * POST /api/ai/je-suggest/create
   *
   * Create actual DRAFT journal entries from AI suggestions.
   * Re-runs suggestion pipeline, then persists approved suggestions.
   * Optional minConfidence filter to only create high-confidence JEs.
   */
  fastify.post(
    '/je-suggest/create',
    {
      ...withPermission('ai', 'categorize', 'ACT'),
      preValidation: [validateBody(JECreateFromSuggestionsSchema)],
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { transactionIds, entityId, minConfidence } =
        request.body as JECreateFromSuggestionsInput;
      const tenantId = request.tenantId!;

      // Validate entity ownership (IDOR prevention)
      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      // Fetch transactions with tenant isolation (only un-booked)
      const transactions = await prisma.transaction.findMany({
        where: {
          id: { in: transactionIds },
          deletedAt: null,
          journalEntryId: null,
          account: { entity: { tenantId } },
        },
        select: {
          id: true,
          description: true,
          amount: true,
          currency: true,
          date: true,
          sourceType: true,
          accountId: true,
        },
      });

      if (transactions.length === 0) {
        return reply.status(404).send({ error: 'No eligible transactions found' });
      }

      const service = new JESuggestionService(tenantId, entityId, request.userId!);
      const inputs: JESuggestionInput[] = transactions.map((t) => ({
        transactionId: t.id,
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        date: t.date,
        sourceType: t.sourceType,
        accountId: t.accountId,
      }));

      try {
        // Re-run suggestion pipeline
        const suggestResult = await service.suggestBatch(inputs);

        // Apply confidence filter if provided
        const eligible = minConfidence
          ? suggestResult.suggestions.filter((s) => s.confidence >= minConfidence)
          : suggestResult.suggestions;

        if (eligible.length === 0) {
          return {
            created: [],
            suggestResult,
            message: minConfidence
              ? `No suggestions met the minimum confidence of ${minConfidence}`
              : 'No eligible suggestions to create',
          };
        }

        // Create draft JEs
        const created = await service.createDraftJEs(eligible);

        request.log.info(
          {
            entityId,
            created: created.length,
            suggested: suggestResult.summary.suggested,
            minConfidence,
          },
          'Created draft JEs from AI suggestions'
        );

        return {
          created,
          suggestResult,
        };
      } catch (error: unknown) {
        request.log.error({ error }, 'JE creation error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );

  // -----------------------------------------------------------------------
  // Insight Endpoints
  // -----------------------------------------------------------------------

  /**
   * GET /api/ai/insights
   *
   * List AI-generated financial insights with optional filters and cursor pagination.
   */
  fastify.get(
    '/insights',
    {
      ...withPermission('ai', 'insights', 'VIEW'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Partial<ListInsightsInput>;

      // Validate query params
      const validation = ListInsightsSchema.safeParse(query);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          details: validation.error.errors,
        });
      }

      // entityId is required per schema but TS doesn't know that
      if (!validation.data.entityId) {
        return reply.status(400).send({ error: 'entityId is required' });
      }

      const params = validation.data as ListInsightsInput & { entityId: string };
      const tenantId = request.tenantId!;

      try {
        const service = new InsightService(tenantId, request.userId!);
        const result = await service.listInsights(params);

        request.log.info(
          {
            entityId: params.entityId,
            count: result.insights.length,
            type: params.type,
            priority: params.priority,
          },
          'Listed insights'
        );

        return result;
      } catch (error: unknown) {
        request.log.error({ error }, 'List insights error');
        return handleAIError(error, reply);
      }
    }
  );

  /**
   * GET /api/ai/insights/:id
   *
   * Get a single insight by ID.
   */
  fastify.get(
    '/insights/:id',
    {
      ...withPermission('ai', 'insights', 'VIEW'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.tenantId!;

      try {
        const service = new InsightService(tenantId, request.userId!);
        const insight = await service.getInsight(id);

        request.log.info({ insightId: id }, 'Retrieved insight');
        return insight;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Insight not found') {
          return reply.status(404).send({ error: 'Not Found', message: error.message });
        }
        request.log.error({ error }, 'Get insight error');
        return handleAIError(error, reply);
      }
    }
  );

  /**
   * POST /api/ai/insights/:id/dismiss
   *
   * Dismiss an insight (sets dismissedAt, status = dismissed).
   */
  fastify.post(
    '/insights/:id/dismiss',
    {
      ...withPermission('ai', 'insights', 'ACT'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.tenantId!;

      try {
        const service = new InsightService(tenantId, request.userId!);
        const insight = await service.dismissInsight(id);

        request.log.info({ insightId: id }, 'Dismissed insight');
        return insight;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Insight not found') {
          return reply.status(404).send({ error: 'Not Found', message: error.message });
        }
        request.log.error({ error }, 'Dismiss insight error');
        return handleAIError(error, reply);
      }
    }
  );

  /**
   * POST /api/ai/insights/:id/snooze
   *
   * Snooze an insight until a future date.
   */
  fastify.post(
    '/insights/:id/snooze',
    {
      ...withPermission('ai', 'insights', 'ACT'),
      preValidation: [validateBody(SnoozeInsightSchema)],
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { snoozedUntil } = request.body as SnoozeInsightInput;
      const tenantId = request.tenantId!;

      try {
        const service = new InsightService(tenantId, request.userId!);
        const insight = await service.snoozeInsight(id, snoozedUntil);

        request.log.info({ insightId: id, snoozedUntil }, 'Snoozed insight');
        return insight;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Insight not found') {
          return reply.status(404).send({ error: 'Not Found', message: error.message });
        }
        if (error instanceof Error && error.message.includes('future')) {
          return reply.status(400).send({ error: 'Bad Request', message: error.message });
        }
        request.log.error({ error }, 'Snooze insight error');
        return handleAIError(error, reply);
      }
    }
  );

  /**
   * POST /api/ai/insights/generate
   *
   * Trigger insight generation for an entity (runs all analyzers).
   */
  fastify.post(
    '/insights/generate',
    {
      ...withPermission('ai', 'insights', 'ACT'),
      preValidation: [validateBody(GenerateInsightsSchema)],
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { entityId, types } = request.body as GenerateInsightsInput;
      const tenantId = request.tenantId!;

      // Validate entity ownership (IDOR prevention)
      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      // Placeholder: Generator service will be implemented in Sprint 3b
      // For now, return a pending response
      request.log.info({ entityId, types }, 'Insight generation requested');

      return reply.status(202).send({
        message: 'Insight generation scheduled',
        entityId,
        types: types || 'all',
      });
    }
  );

  /**
   * GET /api/ai/insights/counts
   *
   * Get insight counts grouped by priority and type (for dashboard widget).
   */
  fastify.get(
    '/insights/counts',
    {
      ...withPermission('ai', 'insights', 'VIEW'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Partial<GetInsightCountsInput>;

      // Validate query params
      const validation = GetInsightCountsSchema.safeParse(query);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          details: validation.error.errors,
        });
      }

      const { entityId } = validation.data;
      const tenantId = request.tenantId!;

      try {
        const service = new InsightService(tenantId, request.userId!);
        const counts = await service.getInsightCounts(entityId);

        request.log.info({ entityId, total: counts.total }, 'Retrieved insight counts');
        return counts;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Not Found', message: error.message });
        }
        request.log.error({ error }, 'Get insight counts error');
        return handleAIError(error, reply);
      }
    }
  );

  /**
   * POST /api/ai/rules/suggest
   *
   * Get AI-suggested categorization rules based on transaction patterns.
   * Phase 2 placeholder - will be implemented in AI Auto-Bookkeeper Phase 2.
   */
  fastify.post(
    '/rules/suggest',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come in Phase 2
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'AI rule suggestions will be implemented in Phase 2',
      });
    }
  );

  // -----------------------------------------------------------------------
  // Action Feed Routes (sub-plugin)
  // -----------------------------------------------------------------------
  fastify.register(actionRoutes, { prefix: '/actions' });
}
