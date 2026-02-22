import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { glAccountRoutes } from './gl-account';
import { journalEntryRoutes } from './journal-entry';
import { reportRoutes } from './report';
import { taxRateRoutes } from './tax-rate';
import { fiscalPeriodRoutes } from './fiscal-period';

/**
 * Accounting Domain Routes
 *
 * Registers sub-route modules for chart of accounts, journal entries,
 * reports, tax rates, and fiscal periods. Auth + tenant middleware applied to all routes.
 */
export async function accountingRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // Sub-route registration
  await fastify.register(glAccountRoutes, { prefix: '/chart-of-accounts' });
  await fastify.register(journalEntryRoutes, { prefix: '/journal-entries' });
  await fastify.register(reportRoutes, { prefix: '/reports' });
  await fastify.register(taxRateRoutes, { prefix: '/tax-rates' });
  await fastify.register(fiscalPeriodRoutes, { prefix: '/fiscal-periods' });
}
