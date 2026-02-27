import type { FastifyRequest, FastifyReply } from 'fastify';
import { checkConsent, type ConsentFeature } from '../domains/system/services/ai-consent.service';
import { logger } from '../lib/logger';

/**
 * Consent Gate Middleware (SEC-33)
 *
 * Fastify preHandler that enforces AI consent requirements before processing.
 *
 * **Compliance:**
 * - GDPR Article 22 (automated decision-making requires explicit consent)
 * - PIPEDA 4.3 (knowledge and consent for collection, use, disclosure)
 * - CCPA ADMT (pre-use notice for Automated Decision-Making Technology)
 *
 * **Usage:**
 * ```typescript
 * fastify.post('/api/business/bills/scan', {
 *   preHandler: [requireConsent('autoCreateBills')],
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 *
 * **Behavior:**
 * - If consent granted: Request proceeds normally
 * - If consent not granted: 403 with instructions to enable in settings
 * - Consent status is added to request object for logging in AIDecisionLog
 *
 * @module consent-gate
 */

/**
 * Create a consent gate preHandler for a specific AI feature.
 *
 * @param feature - AI feature that requires consent
 * @returns Fastify preHandler function
 *
 * @example
 * ```typescript
 * fastify.post('/scan-bill', {
 *   preHandler: [requireConsent('autoCreateBills')],
 *   handler: async (req, res) => { ... }
 * });
 * ```
 */
export function requireConsent(feature: ConsentFeature) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.userId;
    const tenantId = request.tenantId;

    // Consent gate requires auth (should be enforced by authMiddleware earlier in chain)
    if (!userId || !tenantId) {
      logger.error(
        { feature, hasUserId: !!userId, hasTenantId: !!tenantId },
        'Consent gate called without auth context'
      );
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Auth context not initialized',
      });
      return;
    }

    try {
      // Check if user has granted consent for this feature
      const hasConsent = await checkConsent(userId, tenantId, feature);

      if (!hasConsent) {
        logger.warn(
          { userId, tenantId, feature },
          'AI request blocked: User has not granted consent'
        );

        reply.status(403).send({
          error: 'Consent Required',
          message: `AI feature "${feature}" is not enabled. Enable it in Settings > AI Preferences.`,
          feature,
          consentRequired: true,
          settingsUrl: '/system/settings', // Frontend can redirect here
        });
        return;
      }

      // Consent granted — attach consent status to request for AIDecisionLog
      request.aiConsentGranted = true;
      request.aiConsentFeature = feature;

      logger.info(
        { userId, tenantId, feature },
        'Consent gate: Access granted'
      );

      // No done() call needed for async handlers
    } catch (error: unknown) {
      logger.error(
        { err: error, userId, tenantId, feature },
        'Consent gate error'
      );

      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to check consent status',
      });
    }
  };
}

/**
 * Optional consent gate — allows request even without consent, but logs status.
 *
 * Use for features where consent affects BEHAVIOR but doesn't block access.
 * Example: Categorization can run without consent, but won't use learning if disabled.
 *
 * @param feature - AI feature to check
 * @returns Fastify preHandler that logs consent but doesn't block
 */
export function checkConsentOptional(feature: ConsentFeature) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.userId;
    const tenantId = request.tenantId;

    if (!userId || !tenantId) {
      // No auth context — skip consent check (will fail at auth layer anyway)
      return;
    }

    try {
      const hasConsent = await checkConsent(userId, tenantId, feature);

      // Attach consent status to request (doesn't block)
      request.aiConsentGranted = hasConsent;
      request.aiConsentFeature = feature;

      logger.info(
        { userId, tenantId, feature, hasConsent },
        'Optional consent check complete'
      );
    } catch (error: unknown) {
      logger.error(
        { err: error, userId, tenantId, feature },
        'Optional consent check error'
      );

      // Don't block request on error — log and continue
    }
  };
}

// Extend FastifyRequest type to include consent fields
declare module 'fastify' {
  interface FastifyRequest {
    /** Whether AI consent was granted for this request */
    aiConsentGranted?: boolean;
    /** Which AI feature consent was checked for */
    aiConsentFeature?: ConsentFeature;
  }
}
