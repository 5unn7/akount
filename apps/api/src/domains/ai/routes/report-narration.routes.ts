import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { ReportNarrationService, type ReportType } from '../services/report-narration.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { requireConsent } from '../../../middleware/consent-gate';
import { aiRateLimitConfig } from '../../../middleware/rate-limit';
import { handleAIError } from '../errors';

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour (matches service cache)

/**
 * Financial Report Narration Routes (DEV-250)
 *
 * **Endpoint:** POST /api/ai/reports/narration
 *
 * Generate plain-English summaries of financial reports (P&L, BS, CF).
 * Uses Mistral to explain financial data in non-technical language.
 *
 * **Security:**
 * - Requires authentication (authMiddleware)
 * - Requires tenant membership (tenantMiddleware)
 * - Requires AI consent (requireConsent middleware)
 * - Rate limited (aiRateLimitConfig: 20 requests/minute)
 *
 * **Compliance:**
 * - All narrations logged to AIDecisionLog
 * - Disclaimer included in every response
 * - Consent status recorded
 *
 * @module report-narration.routes
 */

export async function reportNarrationRoutes(fastify: FastifyInstance) {
  const service = new ReportNarrationService();

  /**
   * Generate narration for a financial report
   *
   * POST /api/ai/reports/narration
   *
   * **Request Body:**
   * ```json
   * {
   *   "reportType": "PROFIT_LOSS",
   *   "reportData": { ... }, // Actual report data
   *   "entityId": "entity_123"
   * }
   * ```
   *
   * **Response:**
   * ```json
   * {
   *   "narration": "Revenue grew 12% MoM, driven by 3 new clients...",
   *   "disclaimer": "AI-generated summary...",
   *   "confidence": 85,
   *   "cached": false
   * }
   * ```
   */
  fastify.post<{
    Body: {
      reportType: ReportType;
      reportData: unknown;
      entityId: string;
    };
  }>(
    '/narration',
    {
      preHandler: [
        authMiddleware,
        tenantMiddleware,
        requireConsent('autoCategorize'), // Use autoCategorize as proxy (closest to report analysis)
      ],
      config: {
        rateLimit: aiRateLimitConfig(), // 20 requests/minute
      },
    },
    async (request, reply) => {
      const { reportType, reportData, entityId } = request.body;
      const tenantId = request.tenantId!;
      const consentStatus = request.aiConsentGranted ? 'granted' : 'not_granted';

      try {
        // Validate report type
        const validTypes: ReportType[] = ['PROFIT_LOSS', 'BALANCE_SHEET', 'CASH_FLOW', 'MONTH_END'];
        if (!validTypes.includes(reportType)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Invalid report type. Must be one of: ${validTypes.join(', ')}`,
          });
        }

        // Generate hash of report data for caching
        const reportHash = crypto
          .createHash('sha256')
          .update(JSON.stringify({ reportType, reportData, entityId }))
          .digest('hex');

        // Generate narration (uses cache if available)
        const narration = await service.generateNarration({
          reportType,
          reportData,
          reportHash,
          entityId,
          tenantId,
          consentStatus,
        });

        request.log.info(
          {
            tenantId,
            entityId,
            reportType,
            reportHash: reportHash.substring(0, 8),
            confidence: narration.confidence,
            cached: narration.cached,
          },
          'Report narration generated successfully'
        );

        return reply.status(200).send(narration);
      } catch (error: unknown) {
        // Handle Mistral API errors (503)
        if (
          error instanceof Error &&
          (error.message.includes('Mistral API Error') ||
            error.message.includes('Circuit breaker'))
        ) {
          request.log.error(
            { err: error, tenantId, entityId, reportType },
            'Report narration failed: Mistral API error'
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

  /**
   * Clear narration cache
   *
   * DELETE /api/ai/reports/narration/cache
   *
   * Admin endpoint to manually clear cache (for testing or troubleshooting).
   */
  fastify.delete(
    '/narration/cache',
    {
      preHandler: [authMiddleware, tenantMiddleware],
    },
    async (request, reply) => {
      service.clearCache();

      request.log.info({ tenantId: request.tenantId }, 'Report narration cache cleared');

      return reply.status(200).send({
        message: 'Cache cleared successfully',
        clearedAt: new Date().toISOString(),
      });
    }
  );

  /**
   * Get cache statistics
   *
   * GET /api/ai/reports/narration/cache/stats
   *
   * Admin endpoint to view cache performance.
   */
  fastify.get(
    '/narration/cache/stats',
    {
      preHandler: [authMiddleware, tenantMiddleware],
    },
    async (request, reply) => {
      const stats = service.getCacheStats();

      request.log.info({ tenantId: request.tenantId, cacheSize: stats.size }, 'Cache stats retrieved');

      return reply.status(200).send({
        ...stats,
        ttlMs: CACHE_TTL_MS,
        ttlMinutes: CACHE_TTL_MS / (1000 * 60),
      });
    }
  );
}
