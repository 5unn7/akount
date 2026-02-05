import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { withPermission } from '../../middleware/withPermission';

/**
 * Accounting Domain Routes
 *
 * Handles journal entries, chart of accounts, and GL operations.
 * All routes require authentication and are tenant-scoped.
 */
export async function accountingRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // ============================================================================
  // JOURNAL ENTRIES
  // ============================================================================

  fastify.get(
    '/journal-entries',
    {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entries listing will be implemented in Phase 3',
      });
    }
  );

  fastify.get(
    '/journal-entries/:id',
    {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry details will be implemented in Phase 3',
      });
    }
  );

  fastify.post(
    '/journal-entries',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry creation will be implemented in Phase 3',
      });
    }
  );

  fastify.post(
    '/journal-entries/:id/approve',
    {
      ...withPermission('accounting', 'journal-entries', 'APPROVE'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry approval will be implemented in Phase 3',
      });
    }
  );

  // ============================================================================
  // CHART OF ACCOUNTS
  // ============================================================================

  fastify.get(
    '/chart-of-accounts',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Chart of accounts will be implemented in Phase 3',
      });
    }
  );

  fastify.post(
    '/chart-of-accounts',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'GL account creation will be implemented in Phase 3',
      });
    }
  );

  // ============================================================================
  // FISCAL PERIODS
  // ============================================================================

  fastify.get(
    '/fiscal-periods',
    {
      ...withPermission('accounting', 'fiscal-periods', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Fiscal periods will be implemented in Phase 3',
      });
    }
  );

  fastify.post(
    '/fiscal-periods/:id/close',
    {
      ...withPermission('accounting', 'fiscal-periods', 'APPROVE'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Period closing will be implemented in Phase 3',
      });
    }
  );
}
