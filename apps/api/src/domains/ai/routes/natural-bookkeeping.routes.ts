import type { FastifyInstance } from 'fastify';
import { NaturalBookkeepingService } from '../services/natural-bookkeeping.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateBody } from '../../../middleware/validation';
import { requireConsent } from '../../../middleware/consent-gate';
import { aiRateLimitConfig } from '../../../middleware/rate-limit';
import { handleAIError } from '../errors';
import {
  ParseNaturalLanguageSchema,
  type ParseNaturalLanguageInput,
} from '../schemas/natural-bookkeeping.schema';

/**
 * Natural Language Bookkeeping Routes
 *
 * **Endpoint:** POST /api/ai/bookkeeping/natural
 *
 * Parse natural language input into structured transaction data.
 *
 * **Examples:**
 * - "Paid $47 for Uber to airport"
 * - "Bought lunch at Starbucks yesterday, $15.50"
 * - "Received payment from ACME Corp, $2500"
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
 * @module natural-bookkeeping.routes
 */

export async function naturalBookkeepingRoutes(fastify: FastifyInstance) {
  const service = new NaturalBookkeepingService();

  /**
   * Parse natural language into transaction data
   *
   * POST /api/ai/bookkeeping/natural
   */
  fastify.post<{ Body: ParseNaturalLanguageInput }>(
    '/natural',
    {
      preHandler: [
        authMiddleware,
        tenantMiddleware,
        requireConsent('autoCategorize'), // Use autoCategorize consent (most relevant)
        validateBody(ParseNaturalLanguageSchema),
      ],
      config: {
        rateLimit: aiRateLimitConfig(), // 20 requests/minute
      },
    },
    async (request, reply) => {
      const { text, entityId } = request.body;
      const tenantId = request.tenantId!;
      const consentStatus = request.aiConsentGranted ? 'granted' : 'not_granted';

      try {
        const result = await service.parseNaturalLanguage(
          text,
          tenantId,
          entityId,
          consentStatus
        );

        request.log.info(
          {
            tenantId,
            entityId,
            vendor: result.parsed.vendor,
            amount: result.parsed.amount,
            confidence: result.confidence,
            requiresReview: result.requiresReview,
          },
          'Natural language transaction parsed successfully'
        );

        return reply.status(200).send(result);
      } catch (error: unknown) {
        // Handle low confidence error (422)
        if (error instanceof Error && error.message.includes('Confidence too low')) {
          request.log.warn(
            { tenantId, entityId, text: text.substring(0, 50) },
            'Natural language parsing failed: Low confidence'
          );

          return reply.status(422).send({
            error: 'Unprocessable Entity',
            message: error.message,
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
            'Natural language parsing failed: Mistral API error'
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
