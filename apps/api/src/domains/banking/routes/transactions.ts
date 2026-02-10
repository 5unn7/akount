import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import { TransactionService } from '../services/transaction.service';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ListTransactionsQuerySchema,
  TransactionIdParamSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type ListTransactionsQuery,
  type TransactionIdParam,
} from '../schemas/transaction.schema';

/**
 * Transaction routes
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
export async function transactionRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // GET /api/banking/transactions - List transactions
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ListTransactionsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Type-safe guards (no non-null assertions)
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransactionService(request.tenantId, request.userId);
      const query = request.query as ListTransactionsQuery;

      const result = await service.listTransactions({
        accountId: query.accountId,
        startDate: query.startDate,
        endDate: query.endDate,
        categoryId: query.categoryId,
        cursor: query.cursor,
        limit: query.limit,
      });

      return reply.status(200).send(result);
    }
  );

  // GET /api/banking/transactions/:id - Get single transaction
  fastify.get(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(TransactionIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransactionService(request.tenantId, request.userId);
      const params = request.params as TransactionIdParam;

      const transaction = await service.getTransaction(params.id);

      if (!transaction) {
        return reply.status(404).send({
          error: 'Transaction not found',
        });
      }

      return reply.status(200).send(transaction);
    }
  );

  // POST /api/banking/transactions - Create transaction
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateTransactionSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransactionService(request.tenantId, request.userId);
      const body = request.body as CreateTransactionInput;

      try {
        const transaction = await service.createTransaction(body);

        return reply.status(201).send(transaction);
      } catch (error) {
        // Tenant ownership violation
        if (error instanceof Error && error.message.includes('does not belong to this tenant')) {
          return reply.status(403).send({
            error: error.message,
          });
        }

        // Account not found
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            error: 'Account not found',
          });
        }

        // Re-throw other errors for global error handler
        throw error;
      }
    }
  );

  // PATCH /api/banking/transactions/:id - Update transaction
  fastify.patch(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams(TransactionIdParamSchema),
        validateBody(UpdateTransactionSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransactionService(request.tenantId, request.userId);
      const params = request.params as TransactionIdParam;
      const body = request.body as UpdateTransactionInput;

      try {
        const transaction = await service.updateTransaction(params.id, body);

        return reply.status(200).send(transaction);
      } catch (error) {
        // Transaction not found
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            error: 'Transaction not found',
          });
        }

        // Re-throw other errors for global error handler
        throw error;
      }
    }
  );

  // DELETE /api/banking/transactions/:id - Soft delete transaction
  fastify.delete(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']), // More restricted
      preValidation: [validateParams(TransactionIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new TransactionService(request.tenantId, request.userId);
      const params = request.params as TransactionIdParam;

      try {
        await service.softDeleteTransaction(params.id);

        return reply.status(204).send();
      } catch (error) {
        // Transaction not found
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            error: 'Transaction not found',
          });
        }

        // Re-throw other errors for global error handler
        throw error;
      }
    }
  );
}
