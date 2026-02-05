import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DashboardService } from './services/dashboard.service';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { validateQuery } from '../../middleware/validation';
import { withPermission } from '../../middleware/withPermission';

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
  fastify.get(
    '/dashboard',
    {
      ...withPermission('overview', 'dashboard', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new DashboardService(request.tenantId as string);
        const query = request.query as DashboardQuery;
        const { entityId, currency } = query;

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
  fastify.get(
    '/net-worth',
    {
      ...withPermission('overview', 'net-worth', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new DashboardService(request.tenantId as string);
        const query = request.query as DashboardQuery;
        const { entityId, currency } = query;

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
  fastify.get(
    '/cash-flow',
    {
      ...withPermission('overview', 'cash-flow', 'VIEW'),
      preValidation: [validateQuery(dashboardQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new DashboardService(request.tenantId as string);
        const query = request.query as DashboardQuery;
        const { entityId, currency } = query;

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
}
