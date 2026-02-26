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

  /**
   * GET /api/ai/insights
   *
   * Get AI-generated financial insights and recommendations.
   */
  fastify.get(
    '/insights',
    {
      ...withPermission('ai', 'insights', 'VIEW'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'AI insights will be implemented in a future phase',
      });
    }
  );

  /**
   * GET /api/ai/recommendations
   *
   * Get AI-generated action recommendations.
   */
  fastify.get(
    '/recommendations',
    {
      ...withPermission('ai', 'recommendations', 'VIEW'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'AI recommendations will be implemented in a future phase',
      });
    }
  );

  /**
   * POST /api/ai/rules/suggest
   *
   * Get AI-suggested categorization rules based on transaction patterns.
   */
  fastify.post(
    '/rules/suggest',
    {
      ...withPermission('ai', 'rules', 'ACT'),
      config: { rateLimit: aiRateLimitConfig() },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'AI rule suggestions will be implemented in a future phase',
      });
    }
  );
}
