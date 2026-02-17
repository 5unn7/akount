import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery } from '../../../middleware/validation';
import { statsRateLimitConfig } from '../../../middleware/rate-limit';
import { ReportService } from '../services/report.service';
import { AccountingError } from '../errors';
import {
  ProfitLossQuerySchema,
  BalanceSheetQuerySchema,
  CashFlowQuerySchema,
  type ProfitLossQuery,
  type BalanceSheetQuery,
  type CashFlowQuery,
} from '../schemas/report.schema';

/**
 * Accounting Reports Routes
 *
 * Financial statements and management reports.
 * All routes use statsRateLimit (50 req/min) for expensive aggregation queries.
 * All routes require accounting:reports permission (VIEW level).
 */
export async function reportRoutes(fastify: FastifyInstance) {
  /**
   * GET /reports/profit-loss
   * Generate Profit & Loss Statement (Income Statement)
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   * - comparisonPeriod?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR'
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/profit-loss',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(ProfitLossQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as ProfitLossQuery;
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateProfitLoss(query);
        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/balance-sheet
   * Generate Balance Sheet (Statement of Financial Position)
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - asOfDate: string (ISO date)
   * - comparisonDate?: string (ISO date)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/balance-sheet',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(BalanceSheetQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as BalanceSheetQuery;
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateBalanceSheet(query);
        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/cash-flow
   * Generate Cash Flow Statement
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/cash-flow',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(CashFlowQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as CashFlowQuery;
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateCashFlow(query);
        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );
}

/**
 * Handle AccountingError instances with proper status codes
 */
function handleAccountingError(error: unknown, reply: FastifyReply) {
  if (error instanceof AccountingError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  // Generic server error
  reply.request.log.error({ err: error }, 'Report generation error');
  return reply.status(500).send({
    error: 'Internal server error',
  });
}
