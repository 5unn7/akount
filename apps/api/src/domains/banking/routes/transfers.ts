import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import { TransferService } from '../services/transfer.service';
import {
  CreateTransferSchema,
  ListTransfersQuerySchema,
  TransferIdParamSchema,
  type CreateTransferInput,
  type ListTransfersQuery,
  type TransferIdParam,
} from '../schemas/transfer.schema';

/**
 * Transfer routes
 *
 * All routes require authentication and tenant context (inherited from parent).
 * Transfers are entity-scoped — users only see transfers for their entities.
 *
 * Role permissions:
 * - CREATE: OWNER, ADMIN, ACCOUNTANT
 * - VIEW: OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER
 */
export async function transferRoutes(fastify: FastifyInstance) {
  // Auth + tenant middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // POST /api/banking/transfers — Create transfer
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateTransferSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransferService(request.tenantId, request.userId);
      const body = request.body as CreateTransferInput;

      try {
        const result = await service.createTransfer(body);
        return reply.status(201).send(result);
      } catch (error) {
        // Handle known errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }
          if (
            message.includes('insufficient balance') ||
            message.includes('not linked') ||
            message.includes('currency mismatch') ||
            message.includes('exchange rate')
          ) {
            return reply.status(400).send({ error: error.message });
          }
          if (
            message.includes('cross-entity') ||
            message.includes('different entities')
          ) {
            return reply.status(403).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // GET /api/banking/transfers — List transfers
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT', 'BOOKKEEPER']),
      preValidation: [validateQuery(ListTransfersQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransferService(request.tenantId, request.userId);
      const query = request.query as ListTransfersQuery;

      try {
        const result = await service.listTransfers(query);
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/banking/transfers/:id — Get single transfer
  fastify.get(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT', 'BOOKKEEPER']),
      preValidation: [validateParams(TransferIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransferService(request.tenantId, request.userId);
      const params = request.params as TransferIdParam;

      try {
        const transfer = await service.getTransfer(params.id);
        return reply.status(200).send(transfer);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
