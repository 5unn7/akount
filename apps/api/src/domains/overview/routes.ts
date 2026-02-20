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
}
