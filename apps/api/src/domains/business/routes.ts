import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { withPermission } from '../../middleware/withPermission';

/**
 * Business Domain Routes
 *
 * Handles clients, invoices, bills, and payments.
 * All routes require authentication and are tenant-scoped.
 */
export async function businessRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // ============================================================================
  // CLIENTS
  // ============================================================================

  fastify.get(
    '/clients',
    {
      ...withPermission('business', 'clients', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Clients listing will be implemented in Phase 4',
      });
    }
  );

  fastify.get(
    '/clients/:id',
    {
      ...withPermission('business', 'clients', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Client details will be implemented in Phase 4',
      });
    }
  );

  fastify.post(
    '/clients',
    {
      ...withPermission('business', 'clients', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Client creation will be implemented in Phase 4',
      });
    }
  );

  // ============================================================================
  // INVOICES
  // ============================================================================

  fastify.get(
    '/invoices',
    {
      ...withPermission('business', 'invoices', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Invoices listing will be implemented in Phase 4',
      });
    }
  );

  fastify.get(
    '/invoices/:id',
    {
      ...withPermission('business', 'invoices', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Invoice details will be implemented in Phase 4',
      });
    }
  );

  fastify.post(
    '/invoices',
    {
      ...withPermission('business', 'invoices', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Invoice creation will be implemented in Phase 4',
      });
    }
  );

  // ============================================================================
  // BILLS
  // ============================================================================

  fastify.get(
    '/bills',
    {
      ...withPermission('business', 'bills', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Bills listing will be implemented in Phase 4',
      });
    }
  );

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  fastify.get(
    '/payments',
    {
      ...withPermission('business', 'payments', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Payments listing will be implemented in Phase 4',
      });
    }
  );

  fastify.post(
    '/payments',
    {
      ...withPermission('business', 'payments', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Payment recording will be implemented in Phase 4',
      });
    }
  );
}
