import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AccountService } from './services/account.service';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../middleware/validation';
import { withPermission } from '../../middleware/withPermission';
import { importRoutes } from './routes/import';
import { importsRoutes } from './routes/imports';
import { transactionRoutes } from './routes/transactions';
import { reconciliationRoutes } from './routes/reconciliation';

// Validation schemas
const accountsQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  type: z.enum(['BANK', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'MORTGAGE', 'OTHER']).optional(),
  isActive: z.coerce.boolean().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const accountParamsSchema = z.object({
  id: z.string().cuid(),
});

const createAccountBodySchema = z.object({
  entityId: z.string().cuid(),
  name: z.string().min(1).max(255),
  type: z.enum(['BANK', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'MORTGAGE', 'OTHER']),
  currency: z.string().length(3),
  country: z.string().min(2).max(3),
  institution: z.string().max(255).optional(),
});

const updateAccountBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  institution: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  type: z.enum(['BANK', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'MORTGAGE', 'OTHER']).optional(),
});

const accountTransactionsQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

type AccountsQuery = z.infer<typeof accountsQuerySchema>;
type AccountParams = z.infer<typeof accountParamsSchema>;
type CreateAccountBody = z.infer<typeof createAccountBodySchema>;
type UpdateAccountBody = z.infer<typeof updateAccountBodySchema>;
type AccountTransactionsQuery = z.infer<typeof accountTransactionsQuerySchema>;

/**
 * Banking Domain Routes
 *
 * Handles accounts, transactions, bank imports, and reconciliation.
 * All routes require authentication and are tenant-scoped.
 */
export async function bankingRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // Register sub-routes
  await fastify.register(importRoutes, { prefix: '/import' }); // Legacy route (will be deprecated)
  await fastify.register(importsRoutes, { prefix: '/imports' }); // New simplified import routes
  await fastify.register(transactionRoutes, { prefix: '/transactions' });
  await fastify.register(reconciliationRoutes, { prefix: '/reconciliation' });

  // ============================================================================
  // ACCOUNTS
  // ============================================================================

  /**
   * GET /api/banking/accounts
   *
   * List all accounts for the tenant with optional filtering and pagination.
   */
  fastify.get(
    '/accounts',
    {
      ...withPermission('banking', 'accounts', 'VIEW'),
      preValidation: [validateQuery(accountsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new AccountService(request.tenantId as string);
        const query = request.query as AccountsQuery;
        const { entityId, type, isActive, cursor, limit } = query;

        const result = await service.listAccounts({
          entityId,
          type,
          isActive,
          cursor,
          limit,
        });

        request.log.info(
          {
            userId: request.userId,
            tenantId: request.tenantId,
            count: result.accounts.length,
            hasMore: result.hasMore,
            filters: { entityId, type, isActive },
            pagination: { cursor, limit },
          },
          'Listed accounts'
        );

        return {
          accounts: result.accounts,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        };
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error listing accounts'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch accounts',
        });
      }
    }
  );

  /**
   * GET /api/banking/accounts/:id
   *
   * Get a specific account by ID.
   */
  fastify.get(
    '/accounts/:id',
    {
      ...withPermission('banking', 'accounts', 'VIEW'),
      preValidation: [validateParams(accountParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new AccountService(request.tenantId as string);
        const params = request.params as AccountParams;
        const account = await service.getAccount(params.id);

        if (!account) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Account not found',
          });
        }

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, accountId: params.id },
          'Retrieved account'
        );

        return account;
      } catch (error) {
        request.log.error(
          {
            error,
            userId: request.userId,
            tenantId: request.tenantId,
            accountId: (request.params as AccountParams).id,
          },
          'Error fetching account'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch account',
        });
      }
    }
  );

  /**
   * POST /api/banking/accounts
   *
   * Create a new account.
   */
  fastify.post(
    '/accounts',
    {
      ...withPermission('banking', 'accounts', 'ACT'),
      preValidation: [validateBody(createAccountBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new AccountService(request.tenantId as string);
        const body = request.body as CreateAccountBody;

        const account = await service.createAccount(request.userId as string, {
          entityId: body.entityId,
          name: body.name,
          type: body.type,
          currency: body.currency,
          country: body.country,
          institution: body.institution,
        });

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, accountId: account.id },
          'Created account'
        );

        return reply.status(201).send(account);
      } catch (error) {
        if (error instanceof Error && error.message === 'Entity not found or access denied') {
          return reply.status(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error creating account'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create account',
        });
      }
    }
  );

  /**
   * PATCH /api/banking/accounts/:id
   *
   * Update an existing account.
   */
  fastify.patch(
    '/accounts/:id',
    {
      ...withPermission('banking', 'accounts', 'ACT'),
      preValidation: [validateParams(accountParamsSchema), validateBody(updateAccountBodySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new AccountService(request.tenantId as string);
        const params = request.params as AccountParams;
        const body = request.body as UpdateAccountBody;

        const account = await service.updateAccount(params.id, body);

        if (!account) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Account not found',
          });
        }

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, accountId: params.id },
          'Updated account'
        );

        return account;
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error updating account'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update account',
        });
      }
    }
  );

  /**
   * DELETE /api/banking/accounts/:id
   *
   * Soft-delete an account.
   */
  fastify.delete(
    '/accounts/:id',
    {
      ...withPermission('banking', 'accounts', 'ACT'),
      preValidation: [validateParams(accountParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new AccountService(request.tenantId as string);
        const params = request.params as AccountParams;

        const result = await service.softDeleteAccount(params.id);

        if (!result) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Account not found',
          });
        }

        request.log.info(
          { userId: request.userId, tenantId: request.tenantId, accountId: params.id },
          'Soft-deleted account'
        );

        return reply.status(204).send();
      } catch (error) {
        request.log.error(
          { error, userId: request.userId, tenantId: request.tenantId },
          'Error deleting account'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete account',
        });
      }
    }
  );

  /**
   * GET /api/banking/accounts/:id/transactions
   *
   * Get transactions for a specific account with running balance calculation.
   * Transactions are ordered by date ascending (oldest first).
   * Running balance is calculated incrementally for each transaction.
   */
  fastify.get(
    '/accounts/:id/transactions',
    {
      ...withPermission('banking', 'accounts', 'VIEW'),
      preValidation: [validateParams(accountParamsSchema), validateQuery(accountTransactionsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const service = new AccountService(request.tenantId as string);
        const params = request.params as AccountParams;
        const query = request.query as AccountTransactionsQuery;

        const result = await service.getAccountTransactions(params.id, {
          cursor: query.cursor,
          limit: query.limit,
          startDate: query.startDate,
          endDate: query.endDate,
        });

        if (!result) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Account not found',
          });
        }

        request.log.info(
          {
            userId: request.userId,
            tenantId: request.tenantId,
            accountId: params.id,
            count: result.transactions.length,
            hasMore: result.hasMore,
            filters: { startDate: query.startDate, endDate: query.endDate },
            pagination: { cursor: query.cursor, limit: query.limit },
          },
          'Listed account transactions with running balance'
        );

        return {
          transactions: result.transactions,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        };
      } catch (error) {
        request.log.error(
          {
            error,
            userId: request.userId,
            tenantId: request.tenantId,
            accountId: (request.params as AccountParams).id,
          },
          'Error fetching account transactions'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch account transactions',
        });
      }
    }
  );

}
