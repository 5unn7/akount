import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import { statsRateLimitConfig } from '../../../middleware/rate-limit'; // SECURITY FIX M-5
import * as invoiceService from '../services/invoice.service';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  ListInvoicesSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type ListInvoicesInput,
} from '../schemas/invoice.schema';

/**
 * Invoice routes
 *
 * All routes require authentication, tenant context, and role-based permissions
 * Follows pattern: Auth → Tenant → RBAC → Validation → Service
 *
 * Role permissions:
 * - VIEW: OWNER, ADMIN, ACCOUNTANT
 * - CREATE: OWNER, ADMIN, ACCOUNTANT
 * - UPDATE: OWNER, ADMIN, ACCOUNTANT
 * - DELETE: OWNER, ADMIN (more restricted)
 */
export async function invoiceRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // POST /api/invoices - Create invoice
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateInvoiceSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const body = request.body as CreateInvoiceInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const invoice = await invoiceService.createInvoice(body, tenant);
        return reply.status(201).send(invoice);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/invoices - List invoices
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ListInvoicesSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const query = request.query as ListInvoicesInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      const result = await invoiceService.listInvoices(query, tenant);
      return reply.status(200).send(result);
    }
  );

  // GET /api/invoices/stats - AR metrics + aging
  fastify.get(
    '/stats',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      config: {
        rateLimit: statsRateLimitConfig(), // SECURITY FIX M-5: Limit expensive stats queries
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };
      const stats = await invoiceService.getInvoiceStats(tenant);
      return reply.status(200).send(stats);
    }
  );

  // GET /api/invoices/:id - Get single invoice
  fastify.get(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams({ id: { type: 'string' } })],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const invoice = await invoiceService.getInvoice(params.id, tenant);
        return reply.status(200).send(invoice);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Invoice not found' });
        }
        throw error;
      }
    }
  );

  // PUT /api/invoices/:id - Update invoice
  fastify.put(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams({ id: { type: 'string' } }),
        validateBody(UpdateInvoiceSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const body = request.body as UpdateInvoiceInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const invoice = await invoiceService.updateInvoice(params.id, body, tenant);
        return reply.status(200).send(invoice);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Invoice not found' });
        }
        throw error;
      }
    }
  );

  // POST /api/invoices/:id/send - Send invoice (DRAFT → SENT)
  fastify.post(
    '/:id/send',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams({ id: { type: 'string' } })],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const invoice = await invoiceService.sendInvoice(params.id, tenant);
        return reply.status(200).send(invoice);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Invoice not found' });
          }
          if (error.message.includes('Invalid status') || error.message.includes('Client email')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // POST /api/invoices/:id/cancel - Cancel invoice
  fastify.post(
    '/:id/cancel',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
      preValidation: [validateParams({ id: { type: 'string' } })],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const invoice = await invoiceService.cancelInvoice(params.id, tenant);
        return reply.status(200).send(invoice);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Invoice not found' });
          }
          if (error.message.includes('Invalid status') || error.message.includes('Cannot cancel')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // POST /api/invoices/:id/mark-overdue - Mark invoice overdue
  fastify.post(
    '/:id/mark-overdue',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams({ id: { type: 'string' } })],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const invoice = await invoiceService.markInvoiceOverdue(params.id, tenant);
        return reply.status(200).send(invoice);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Invoice not found' });
          }
          if (error.message.includes('Invalid status')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // DELETE /api/invoices/:id - Soft delete invoice
  fastify.delete(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
      preValidation: [validateParams({ id: { type: 'string' } })],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        await invoiceService.deleteInvoice(params.id, tenant);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Invoice not found' });
        }
        throw error;
      }
    }
  );
}
