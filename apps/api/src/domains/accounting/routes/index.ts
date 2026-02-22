import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { withPermission } from '../../../middleware/withPermission';
import { glAccountRoutes } from './gl-account';
import { journalEntryRoutes } from './journal-entry';
import { reportRoutes } from './report';
import { taxRateRoutes } from './tax-rate';

/**
 * Accounting Domain Routes
 *
 * Registers sub-route modules for chart of accounts, journal entries,
 * and fiscal periods. Auth + tenant middleware applied to all routes.
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

  fastify.get(
    '/fiscal-periods',
    {
      ...withPermission('accounting', 'fiscal-periods', 'VIEW'),
    },
    async (_request, reply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Fiscal periods will be implemented in a future phase',
      });
    }
  );

  fastify.post(
    '/fiscal-periods/:id/close',
    {
      ...withPermission('accounting', 'fiscal-periods', 'APPROVE'),
    },
    async (_request, reply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Period closing will be implemented in a future phase',
      });
    }
  );
}
