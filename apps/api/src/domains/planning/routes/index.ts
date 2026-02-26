import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { goalRoutes } from './goal.routes';
import { budgetRoutes } from './budget.routes';
import { forecastRoutes } from './forecast.routes';

/**
 * Planning Domain Routes
 *
 * Registers sub-routes for budgets, goals, forecasts, and reports.
 * Auth + tenant middleware applied at the domain level.
 */
export async function planningRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // Register sub-routes
  fastify.register(goalRoutes, { prefix: '/goals' });
  fastify.register(budgetRoutes, { prefix: '/budgets' });
  fastify.register(forecastRoutes, { prefix: '/forecasts' });
}
