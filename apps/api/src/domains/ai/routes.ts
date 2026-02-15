import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiService } from './services/ai.service';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { validateBody } from '../../middleware/validation';
import { withPermission } from '../../middleware/withPermission';
import { categorizeTransaction } from './services/categorization.service';

// Validation schemas
const chatBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  options: z
    .object({
      provider: z.string().optional(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
      systemPrompt: z.string().optional(),
    })
    .optional(),
});

const categorizationBodySchema = z.object({
  description: z.string(),
  amount: z.number().int(), // Cents must be an integer
});

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
      preValidation: [validateBody(chatBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { messages, options } = request.body as z.infer<typeof chatBodySchema>;

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
   * AI-powered transaction categorization.
   */
  fastify.post(
    '/categorize',
    {
      ...withPermission('ai', 'categorize', 'ACT'),
      preValidation: [validateBody(categorizationBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { description, amount } = request.body as z.infer<typeof categorizationBodySchema>;
      const tenantId = request.tenantId!;

      try {
        const suggestion = await categorizeTransaction(description, amount, tenantId);
        return suggestion;
      } catch (error: unknown) {
        request.log.error({ error }, 'Categorization error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
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
