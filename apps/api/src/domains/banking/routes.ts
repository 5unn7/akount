import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AccountService } from './services/account.service';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../middleware/validation';
import { withPermission } from '../../middleware/withPermission';
import { importRoutes } from './routes/import';

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

type AccountsQuery = z.infer<typeof accountsQuerySchema>;
type AccountParams = z.infer<typeof accountParamsSchema>;

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
  await fastify.register(importRoutes, { prefix: '/import' });

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
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Account creation will be implemented in a future phase',
      });
    }
  );

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * GET /api/banking/transactions
   *
   * List transactions with filtering and pagination.
   */
  fastify.get(
    '/transactions',
    {
      ...withPermission('banking', 'transactions', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Transaction listing will be implemented in a future phase',
      });
    }
  );

  /**
   * POST /api/banking/transactions
   *
   * Create a new transaction.
   */
  fastify.post(
    '/transactions',
    {
      ...withPermission('banking', 'transactions', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Transaction creation will be implemented in a future phase',
      });
    }
  );

  // ============================================================================
  // RECONCILIATION
  // ============================================================================

  /**
   * GET /api/banking/reconciliation
   *
   * Get reconciliation status and pending items.
   */
  fastify.get(
    '/reconciliation',
    {
      ...withPermission('banking', 'reconciliation', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Reconciliation will be implemented in a future phase',
      });
    }
  );

  /**
   * POST /api/banking/reconciliation/approve
   *
   * Approve reconciliation items.
   */
  fastify.post(
    '/reconciliation/approve',
    {
      ...withPermission('banking', 'reconciliation', 'APPROVE'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Placeholder - implementation to come
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Reconciliation approval will be implemented in a future phase',
      });
    }
  );
}
