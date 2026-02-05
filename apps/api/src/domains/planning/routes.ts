import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { withPermission } from '../../middleware/withPermission';

/**
 * Planning Domain Routes
 *
 * Handles budgets, goals, forecasts, and reports.
 * All routes require authentication and are tenant-scoped.
 */
export async function planningRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // ============================================================================
  // BUDGETS
  // ============================================================================

  fastify.get(
    '/budgets',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Budgets listing will be implemented in Phase 6',
      });
    }
  );

  fastify.post(
    '/budgets',
    {
      ...withPermission('planning', 'budgets', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Budget creation will be implemented in Phase 6',
      });
    }
  );

  // ============================================================================
  // GOALS
  // ============================================================================

  fastify.get(
    '/goals',
    {
      ...withPermission('planning', 'goals', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Goals listing will be implemented in Phase 6',
      });
    }
  );

  fastify.post(
    '/goals',
    {
      ...withPermission('planning', 'goals', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Goal creation will be implemented in Phase 6',
      });
    }
  );

  // ============================================================================
  // REPORTS
  // ============================================================================

  fastify.get(
    '/reports',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Reports listing will be implemented in Phase 5',
      });
    }
  );

  fastify.get(
    '/reports/profit-loss',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Profit & Loss report will be implemented in Phase 5',
      });
    }
  );

  fastify.get(
    '/reports/balance-sheet',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Balance Sheet report will be implemented in Phase 5',
      });
    }
  );

  fastify.get(
    '/reports/cash-flow',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Cash Flow report will be implemented in Phase 5',
      });
    }
  );

  // ============================================================================
  // FORECASTS
  // ============================================================================

  fastify.get(
    '/forecasts',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Forecasts will be implemented in Phase 6',
      });
    }
  );
}
