import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateBody } from '../../../middleware/validation';
import { getConsent, updateConsent, type UpdateConsentInput } from '../services/ai-consent.service';

/**
 * AI Consent Routes (DEV-260)
 *
 * API endpoints for managing user AI consent preferences.
 */

const UpdateConsentSchema = z.object({
  autoCreateBills: z.boolean().optional(),
  autoCreateInvoices: z.boolean().optional(),
  autoMatchTransactions: z.boolean().optional(),
  autoCategorize: z.boolean().optional(),
  useCorrectionsForLearning: z.boolean().optional(),
});

export async function consentRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  /**
   * GET /api/system/consent
   *
   * Get current user's AI consent settings.
   */
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId!;
      const tenantId = request.tenantId!;

      try {
        const consent = await getConsent(userId, tenantId);
        return consent;
      } catch (error: unknown) {
        request.log.error({ error, userId, tenantId }, 'Get consent error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );

  /**
   * PATCH /api/system/consent
   *
   * Update user's AI consent settings (partial update).
   */
  fastify.patch(
    '/',
    {
      preValidation: [validateBody(UpdateConsentSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId!;
      const tenantId = request.tenantId!;
      const updates = request.body as UpdateConsentInput;

      try {
        const consent = await updateConsent(userId, tenantId, updates);

        request.log.info(
          { userId, tenantId, updates },
          'Consent settings updated'
        );

        return consent;
      } catch (error: unknown) {
        request.log.error({ error, userId, tenantId }, 'Update consent error');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({ error: message });
      }
    }
  );
}
