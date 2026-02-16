import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import * as paymentService from '../services/payment.service';
import {
  CreatePaymentSchema,
  UpdatePaymentSchema,
  ListPaymentsSchema,
  AllocatePaymentSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type ListPaymentsInput,
  type AllocatePaymentInput,
} from '../schemas/payment.schema';

/**
 * Payment routes
 *
 * All routes require authentication, tenant context, and role-based permissions.
 * Follows pattern: Auth → Tenant → RBAC → Validation → Service
 *
 * Role permissions:
 * - VIEW: OWNER, ADMIN, ACCOUNTANT
 * - CREATE: OWNER, ADMIN, ACCOUNTANT
 * - UPDATE: OWNER, ADMIN, ACCOUNTANT
 * - DELETE: OWNER, ADMIN (more restricted)
 */
export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // POST /api/payments - Create payment
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreatePaymentSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const body = request.body as CreatePaymentInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const payment = await paymentService.createPayment(body, tenant);
        return reply.status(201).send(payment);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/payments - List payments
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ListPaymentsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const query = request.query as ListPaymentsInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      const result = await paymentService.listPayments(query, tenant);
      return reply.status(200).send(result);
    }
  );

  // GET /api/payments/:id - Get single payment
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
        const payment = await paymentService.getPayment(params.id, tenant);
        return reply.status(200).send(payment);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Payment not found' });
        }
        throw error;
      }
    }
  );

  // PUT /api/payments/:id - Update payment
  fastify.put(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams({ id: { type: 'string' } }),
        validateBody(UpdatePaymentSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const body = request.body as UpdatePaymentInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const payment = await paymentService.updatePayment(params.id, body, tenant);
        return reply.status(200).send(payment);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Payment not found' });
        }
        throw error;
      }
    }
  );

  // POST /api/payments/:id/allocate - Allocate payment to invoice/bill
  fastify.post(
    '/:id/allocate',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams({ id: { type: 'string' } }),
        validateBody(AllocatePaymentSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const body = request.body as AllocatePaymentInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const allocation = await paymentService.allocatePayment(params.id, body, tenant);
        return reply.status(201).send(allocation);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }
          if (
            error.message.includes('exceeds') ||
            error.message.includes('cannot be allocated')
          ) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // DELETE /api/payments/:id/allocations/:allocationId - Deallocate
  fastify.delete(
    '/:id/allocations/:allocationId',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams({ id: { type: 'string' }, allocationId: { type: 'string' } }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string; allocationId: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        await paymentService.deallocatePayment(params.id, params.allocationId, tenant);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/payments/:id - Soft delete payment
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
        await paymentService.deletePayment(params.id, tenant);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Payment not found' });
        }
        throw error;
      }
    }
  );
}
