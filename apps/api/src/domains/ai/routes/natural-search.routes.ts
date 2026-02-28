import type { FastifyInstance } from 'fastify';
import { NaturalSearchService } from '../services/natural-search.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateBody } from '../../../middleware/validation';
import { requireConsent } from '../../../middleware/consent-gate';
import { aiRateLimitConfig } from '../../../middleware/rate-limit';
import { handleAIError } from '../errors';
import {
  NaturalSearchQuerySchema,
  type NaturalSearchQueryInput,
} from '../schemas/natural-search.schema';

/**
 * Natural Language Search Routes
 *
 * **Endpoint:** POST /api/ai/search/natural
 *
 * Parse natural language search queries into structured filter parameters.
 *
 * **Examples:**
 * - "Show me all restaurant expenses over $100 in Q4"
 * - "Find Uber rides last month"
 * - "Transactions above $500 this year"
 *
 * **Security:**
 * - Requires authentication (authMiddleware)
 * - Requires tenant membership (tenantMiddleware)
 * - Requires AI consent (requireConsent middleware)
 * - Rate limited (aiRateLimitConfig: 20 requests/minute)
 *
 * **Compliance:**
 * - All decisions logged to AIDecisionLog (GDPR, PIPEDA, SOC 2)
 * - Consent status recorded for audit trail
 *
 * @module natural-search.routes
 */

export async function naturalSearchRoutes(fastify: FastifyInstance) {
  const service = new NaturalSearchService();

  /**
   * Parse natural language search query
   *
   * POST /api/ai/search/natural
   */
  fastify.post<{ Body: NaturalSearchQueryInput }>(
    '/natural',
    {
      preHandler: [
        authMiddleware,
        tenantMiddleware,
        requireConsent('autoCategorize'), // Use autoCategorize consent (most relevant for search)
        validateBody(NaturalSearchQuerySchema),
      ],
      config: {
        rateLimit: aiRateLimitConfig(), // 20 requests/minute
      },
    },
    async (request, reply) => {
      const { query, entityId } = request.body;
      const tenantId = request.tenantId!;
      const consentStatus = request.aiConsentGranted ? 'granted' : 'not_granted';

      try {
        const result = await service.parseSearchQuery(
          query,
          tenantId,
          entityId,
          consentStatus
        );

        request.log.info(
          {
            tenantId,
            entityId,
            query: query.substring(0, 100),
            confidence: result.confidence,
            filterCount: result.filterChips.length,
          },
          'Natural language search query parsed successfully'
        );

        return reply.status(200).send(result);
      } catch (error: unknown) {
        // Handle low confidence error (422)
        if (error instanceof Error && error.message.includes('Unable to understand')) {
          request.log.warn(
            { tenantId, entityId, query: query.substring(0, 100) },
            'Natural language search parsing failed: Low confidence'
          );

          return reply.status(422).send({
            error: 'Unprocessable Entity',
            message: error.message,
            suggestion:
              'Try a more specific query like "expenses over $100 last quarter" or "Uber rides in January"',
          });
        }

        // Handle Mistral API errors (503)
        if (
          error instanceof Error &&
          (error.message.includes('Mistral API Error') ||
            error.message.includes('Circuit breaker'))
        ) {
          request.log.error(
            { err: error, tenantId, entityId },
            'Natural language search parsing failed: Mistral API error'
          );

          return reply.status(503).send({
            error: 'Service Unavailable',
            message:
              'AI service is temporarily unavailable. Please try again in a few moments.',
          });
        }

        // Handle all other errors via shared error handler
        return handleAIError(error, reply);
      }
    }
  );
}
