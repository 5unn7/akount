import type { FastifyInstance } from 'fastify';
import { TaxSuggestionsService } from '../services/tax-suggestions.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { requireConsent } from '../../../middleware/consent-gate';
import { aiRateLimitConfig } from '../../../middleware/rate-limit';
import { handleAIError } from '../errors';
import {
  TaxSuggestionsQuerySchema,
  type TaxSuggestionsQueryInput,
} from '../schemas/tax-suggestions.schema';
import { prisma } from '@akount/db';

/**
 * Tax Optimization Suggestions Routes
 *
 * **Endpoint:** GET /api/ai/tax-suggestions
 *
 * Analyzes categorized expenses to suggest jurisdiction-specific tax optimizations.
 *
 * **Deduction Categories:**
 * - Home Office (rent, utilities, internet)
 * - Vehicle (mileage, auto expenses)
 * - Equipment Depreciation (computers, furniture)
 * - Professional Development (courses, conferences)
 * - Meals & Entertainment (business meals)
 *
 * **Jurisdictions:**
 * - US (IRS): $0.67/mi mileage, Section 179, strict home office rules
 * - Canada (CRA): Workspace %, different depreciation classes
 * - EU: VAT rules, country-specific deductions
 *
 * **Security:**
 * - Requires authentication (authMiddleware)
 * - Requires tenant membership (tenantMiddleware)
 * - Requires AI consent (requireConsent middleware)
 * - Rate limited (aiRateLimitConfig: 20 requests/minute)
 * - Entity ownership validation (IDOR prevention)
 *
 * **Compliance:**
 * - All decisions logged to AIDecisionLog (GDPR, PIPEDA, SOC 2)
 * - Consent status recorded for audit trail
 * - Disclaimers included in response
 *
 * @module tax-suggestions.routes
 */

export async function taxSuggestionsRoutes(fastify: FastifyInstance) {
  const service = new TaxSuggestionsService();

  /**
   * Get tax optimization suggestions
   *
   * GET /api/ai/tax-suggestions?entityId=xxx&year=2026
   */
  fastify.get<{ Querystring: TaxSuggestionsQueryInput }>(
    '/',
    {
      preHandler: [
        authMiddleware,
        tenantMiddleware,
        requireConsent('autoCategorize'), // Tax suggestions require categorization consent
      ],
      config: {
        rateLimit: aiRateLimitConfig(), // 20 requests/minute
      },
    },
    async (request, reply) => {
      // Validate query params
      const validation = TaxSuggestionsQuerySchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          details: validation.error.errors,
        });
      }

      const { entityId, year } = validation.data;
      const tenantId = request.tenantId!;
      const consentStatus = request.aiConsentGranted ? 'granted' : 'not_granted';

      // Validate entity ownership (IDOR prevention)
      const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true, name: true },
      });

      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found or access denied' });
      }

      try {
        const result = await service.generateSuggestions(
          entityId,
          tenantId,
          year,
          consentStatus
        );

        request.log.info(
          {
            tenantId,
            entityId,
            year,
            jurisdiction: result.jurisdiction,
            suggestions: result.suggestions.length,
            quarterlyEstimate: result.quarterlyEstimate,
          },
          'Tax optimization suggestions generated successfully'
        );

        return reply.status(200).send(result);
      } catch (error: unknown) {
        // Handle entity not found error (404)
        if (error instanceof Error && error.message.includes('not found')) {
          request.log.warn(
            { tenantId, entityId },
            'Tax suggestions failed: Entity not found'
          );

          return reply.status(404).send({
            error: 'Not Found',
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
            'Tax suggestions failed: Mistral API error'
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
