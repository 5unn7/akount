import type { FastifyInstance } from 'fastify';
import { CommunicationDraftsService } from '../services/communication-drafts.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery } from '../../../middleware/validation';
import { requireConsent } from '../../../middleware/consent-gate';
import { aiRateLimitConfig } from '../../../middleware/rate-limit';
import { handleAIError } from '../errors';
import {
  GenerateDraftQuerySchema,
  type GenerateDraftQueryInput,
} from '../schemas/communication-drafts.schema';

/**
 * Communication Drafts Routes
 *
 * **Endpoint:** GET /api/ai/communications/draft
 *
 * Generate AI-powered drafts for client communications.
 *
 * **CRITICAL - User Review Required:**
 * - Drafts are NEVER auto-sent
 * - User must review and manually send
 * - API returns draft text only (no email sending)
 *
 * **Examples:**
 * - GET /api/ai/communications/draft?invoiceId=xxx&type=payment_reminder
 * - GET /api/ai/communications/draft?invoiceId=xxx&type=payment_reminder&tone=urgent
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
 * - No PII stored in logs (only invoice ID)
 *
 * @module communication-drafts.routes
 */

export async function communicationDraftsRoutes(fastify: FastifyInstance) {
  const service = new CommunicationDraftsService();

  /**
   * Generate communication draft
   *
   * GET /api/ai/communications/draft
   *
   * Query params:
   * - invoiceId: string (CUID)
   * - entityId: string (CUID)
   * - type: "payment_reminder"
   * - tone: "formal" | "friendly" | "urgent" (optional)
   */
  fastify.get<{ Querystring: GenerateDraftQueryInput }>(
    '/draft',
    {
      preHandler: [
        authMiddleware,
        tenantMiddleware,
        requireConsent('autoCategorize'), // Use existing AI consent feature (closest match)
        validateQuery(GenerateDraftQuerySchema),
      ],
      config: {
        rateLimit: aiRateLimitConfig(), // 20 requests/minute
      },
    },
    async (request, reply) => {
      const { invoiceId, entityId, tone } = request.query;
      const tenantId = request.tenantId!;

      try {
        const draft = await service.generatePaymentReminder({
          invoiceId,
          tenantId,
          entityId,
          tone,
        });

        request.log.info(
          {
            tenantId,
            entityId,
            invoiceId,
            invoiceNumber: draft.invoiceDetails.invoiceNumber,
            daysOverdue: draft.invoiceDetails.daysOverdue,
            tone: draft.tone,
            confidence: draft.confidence,
          },
          'Generated payment reminder draft'
        );

        return reply.status(200).send(draft);
      } catch (error: unknown) {
        // Handle invoice not found (404)
        if (
          error instanceof Error &&
          (error.message.includes('Invoice not found') ||
            error.message.includes('access denied'))
        ) {
          request.log.warn({ tenantId, invoiceId }, 'Invoice not found or access denied');

          return reply.status(404).send({
            error: 'Not Found',
            message: 'Invoice not found or access denied',
          });
        }

        // Handle business logic errors (422)
        if (
          error instanceof Error &&
          (error.message.includes('not overdue') ||
            error.message.includes('no email address'))
        ) {
          request.log.warn({ tenantId, invoiceId, message: error.message }, 'Invalid request');

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
            { err: error, tenantId, invoiceId },
            'Communication draft generation failed: Mistral API error'
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
