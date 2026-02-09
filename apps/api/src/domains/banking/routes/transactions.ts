import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { TransactionService } from '../services/transaction.service';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ListTransactionsQuerySchema,
  TransactionIdParamSchema,
} from '../schemas/transaction.schema';

/**
 * Transaction routes
 *
 * All routes require authentication and tenant context
 * Follows pattern: Auth → Tenant → Validation → Service
 */
export async function transactionRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/banking/transactions - List transactions
  server.get(
    '/',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        querystring: ListTransactionsQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              transactions: { type: 'array' },
              nextCursor: { type: 'string' },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const service = new TransactionService(request.tenantId!);

      const result = await service.listTransactions({
        accountId: request.query.accountId,
        startDate: request.query.startDate,
        endDate: request.query.endDate,
        categoryId: request.query.categoryId,
        cursor: request.query.cursor,
        limit: request.query.limit,
      });

      return reply.status(200).send(result);
    }
  );

  // GET /api/banking/transactions/:id - Get single transaction
  server.get(
    '/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: TransactionIdParamSchema,
        response: {
          200: {
            type: 'object',
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const service = new TransactionService(request.tenantId!);

      const transaction = await service.getTransaction(request.params.id);

      if (!transaction) {
        return reply.status(404).send({
          error: 'Transaction not found',
        });
      }

      return reply.status(200).send(transaction);
    }
  );

  // POST /api/banking/transactions - Create transaction
  server.post(
    '/',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        body: CreateTransactionSchema,
        response: {
          201: {
            type: 'object',
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const service = new TransactionService(request.tenantId!);

      try {
        const transaction = await service.createTransaction(request.body);

        return reply.status(201).send(transaction);
      } catch (error) {
        // Account doesn't belong to tenant
        if (error instanceof Error && error.message.includes('does not belong to this tenant')) {
          return reply.status(403).send({
            error: error.message,
          });
        }

        // Re-throw other errors for global error handler
        throw error;
      }
    }
  );

  // PATCH /api/banking/transactions/:id - Update transaction
  server.patch(
    '/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: TransactionIdParamSchema,
        body: UpdateTransactionSchema,
        response: {
          200: {
            type: 'object',
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const service = new TransactionService(request.tenantId!);

      try {
        const transaction = await service.updateTransaction(request.params.id, request.body);

        return reply.status(200).send(transaction);
      } catch (error) {
        // Transaction not found or doesn't belong to tenant
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            error: error.message,
          });
        }

        // Re-throw other errors for global error handler
        throw error;
      }
    }
  );

  // DELETE /api/banking/transactions/:id - Soft delete transaction
  server.delete(
    '/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: TransactionIdParamSchema,
        response: {
          204: {
            type: 'null',
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const service = new TransactionService(request.tenantId!);

      try {
        await service.softDeleteTransaction(request.params.id);

        return reply.status(204).send();
      } catch (error) {
        // Transaction not found or doesn't belong to tenant
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            error: error.message,
          });
        }

        // Re-throw other errors for global error handler
        throw error;
      }
    }
  );
}
