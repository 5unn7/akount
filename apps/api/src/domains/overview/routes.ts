import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DashboardService } from './services/dashboard.service';
import { PerformanceService } from './services/performance.service';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware, requireTenantId } from '../../middleware/tenant';
import { validateQuery } from '../../middleware/validation';
import { withPermission } from '../../middleware/withPermission';
import { PerformanceQuerySchema } from './schemas/performance.schema';

// Validation schemas
const dashboardQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
});

type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

/**
 * Overview Domain Routes
 *
 * Provides dashboard metrics, net worth calculations, and cash flow overview.
 * All routes require authentication and are tenant-scoped.
 */
export async function overviewRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  /**
   * GET /api/overview/dashboard
   *
   * Returns dashboard metrics including net worth, cash position, and account summary.
   * Aggregates data across all entities or filtered by entityId.
   */
  fastify.get<{ Querystring: DashboardQuery }>(
    '/dashboard',
    {
      ...withPermission('overview', 'dashboard', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, currency } = request.query;

        const metrics = await service.getMetrics(entityId, currency);

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, entityId, currency },
          'Retrieved dashboard metrics'
        );

        return metrics;
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching dashboard metrics'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch dashboard metrics',
        });
      }
    }
  );

  /**
   * GET /api/overview/net-worth
   *
   * Returns detailed net worth breakdown.
   */
  fastify.get<{ Querystring: DashboardQuery }>(
    '/net-worth',
    {
      ...withPermission('overview', 'net-worth', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, currency } = request.query;

        const metrics = await service.getMetrics(entityId, currency);

        return {
          netWorth: metrics.netWorth,
          breakdown: {
            assets: metrics.cashPosition.cash,
            liabilities: metrics.cashPosition.debt,
          },
        };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching net worth'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch net worth',
        });
      }
    }
  );

  /**
   * GET /api/overview/cash-flow
   *
   * Returns cash flow summary.
   */
  fastify.get<{ Querystring: DashboardQuery }>(
    '/cash-flow',
    {
      ...withPermission('overview', 'cash-flow', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, currency } = request.query;

        const metrics = await service.getMetrics(entityId, currency);

        return {
          cashPosition: metrics.cashPosition,
          accounts: metrics.accounts,
        };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching cash flow'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch cash flow',
        });
      }
    }
  );

  /**
   * GET /api/overview/performance
   *
   * Returns performance metrics (revenue, expenses, profit) with sparkline trends.
   * Calculates from transaction data with category-based filtering.
   */
  fastify.get<{ Querystring: z.infer<typeof PerformanceQuerySchema> }>(
    '/performance',
    {
      ...withPermission('overview', 'performance', 'VIEW'),
      preValidation: [validateQuery(PerformanceQuerySchema)],
    },
    async (request, reply) => {
      try {
        const service = new PerformanceService(requireTenantId(request));
        const { entityId, currency, period } = request.query;

        const metrics = await service.getPerformanceMetrics(
          entityId,
          currency || 'CAD',
          period || '30d'
        );

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, entityId, currency, period },
          'Retrieved performance metrics'
        );

        return metrics;
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching performance metrics'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch performance metrics',
        });
      }
    }
  );

  /**
   * GET /api/overview/cash-flow-projection
   *
   * Returns 60-day cash flow projection based on historical transaction patterns.
   * Used by the dashboard CashFlowChart component.
   */
  fastify.get<{ Querystring: DashboardQuery }>(
    '/cash-flow-projection',
    {
      ...withPermission('overview', 'cash-flow-projection', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, currency } = request.query;

        const projection = await service.getCashFlowProjection(entityId, currency);

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, entityId, currency },
          'Retrieved cash flow projection'
        );

        return { data: projection };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching cash flow projection'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch cash flow projection',
        });
      }
    }
  );

  /**
   * GET /api/overview/upcoming-payments
   *
   * Returns upcoming bills due and expected invoice payments.
   * Used by the dashboard UpcomingPayments component.
   */
  fastify.get<{ Querystring: DashboardQuery & { limit?: string } }>(
    '/upcoming-payments',
    {
      ...withPermission('overview', 'upcoming-payments', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema.extend({ limit: z.string().optional() }))],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, limit } = request.query;

        const payments = await service.getUpcomingPayments(
          entityId,
          limit ? parseInt(limit, 10) : 10
        );

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, entityId, limit },
          'Retrieved upcoming payments'
        );

        return { data: payments };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching upcoming payments'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch upcoming payments',
        });
      }
    }
  );

  /**
   * GET /api/overview/expense-breakdown
   *
   * Returns monthly expense totals grouped by category.
   * Used by the dashboard ExpenseChart component.
   */
  fastify.get<{ Querystring: DashboardQuery & { months?: string } }>(
    '/expense-breakdown',
    {
      ...withPermission('overview', 'expense-breakdown', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema.extend({ months: z.string().optional() }))],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, currency, months } = request.query;

        const breakdown = await service.getExpenseBreakdown(
          entityId,
          months ? parseInt(months, 10) : 6,
          currency || 'CAD'
        );

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, entityId, currency, months },
          'Retrieved expense breakdown'
        );

        return { data: breakdown };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching expense breakdown'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch expense breakdown',
        });
      }
    }
  );

  /**
   * GET /api/overview/action-items
   *
   * Returns actionable items requiring user attention (unreconciled transactions,
   * overdue invoices, overdue bills).
   * Used by the dashboard ActionItems component.
   */
  fastify.get<{ Querystring: DashboardQuery & { limit?: string } }>(
    '/action-items',
    {
      ...withPermission('overview', 'action-items', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema.extend({ limit: z.string().optional() }))],
    },
    async (request, reply) => {
      try {
        const service = new DashboardService(requireTenantId(request));
        const { entityId, limit } = request.query;

        const items = await service.getActionItems(
          entityId,
          limit ? parseInt(limit, 10) : 10
        );

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, entityId, limit },
          'Retrieved action items'
        );

        return { data: items };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error fetching action items'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch action items',
        });
      }
    }
  );
}
