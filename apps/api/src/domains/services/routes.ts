import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { withPermission } from '../../middleware/withPermission';

/**
 * Services Domain Routes
 *
 * Handles professional services: accountant collaboration, tax filing, etc.
 * All routes require authentication and are tenant-scoped.
 */
export async function servicesRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // ============================================================================
  // ACCOUNTANT PORTAL
  // ============================================================================

  fastify.get(
    '/accountant/invitations',
    {
      ...withPermission('services', 'accountant', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Accountant invitations will be implemented in a future phase',
      });
    }
  );

  fastify.post(
    '/accountant/invite',
    {
      ...withPermission('services', 'accountant', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Accountant invitation will be implemented in a future phase',
      });
    }
  );

  // ============================================================================
  // TAX FILING
  // ============================================================================

  fastify.get(
    '/tax/filings',
    {
      ...withPermission('services', 'tax', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Tax filings will be implemented in a future phase',
      });
    }
  );

  fastify.get(
    '/tax/deadlines',
    {
      ...withPermission('services', 'tax', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Tax deadlines will be implemented in a future phase',
      });
    }
  );

  // ============================================================================
  // DOCUMENT REQUESTS
  // ============================================================================

  fastify.get(
    '/documents/requests',
    {
      ...withPermission('services', 'documents', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Document requests will be implemented in a future phase',
      });
    }
  );

  fastify.post(
    '/documents/upload',
    {
      ...withPermission('services', 'documents', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Document upload will be implemented in a future phase',
      });
    }
  );
}
