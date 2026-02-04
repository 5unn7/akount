import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AccountService } from '../services/account.service';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateQuery, validateParams } from '../middleware/validation';

// Validation schemas
const accountsQuerySchema = z.object({
    entityId: z.string().cuid().optional(),
    type: z.enum(['BANK', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'MORTGAGE', 'OTHER']).optional(),
    isActive: z.coerce.boolean().optional(),
    // Pagination params
    cursor: z.string().cuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

const accountParamsSchema = z.object({
    id: z.string().cuid(),
});

type AccountsQuery = z.infer<typeof accountsQuerySchema>;
type AccountParams = z.infer<typeof accountParamsSchema>;

export async function accountsRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/accounts',
        {
            onRequest: [authMiddleware, tenantMiddleware, validateQuery(accountsQuerySchema)],
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
                request.log.error({ error, userId: request.userId, tenantId: request.tenantId }, 'Error listing accounts');
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch accounts',
                });
            }
        }
    );

    fastify.get(
        '/accounts/:id',
        {
            onRequest: [authMiddleware, tenantMiddleware, validateParams(accountParamsSchema)],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const service = new AccountService(request.tenantId as string);
                const params = request.params as AccountParams;
                const account = await service.getAccount(params.id);

                if (!account) {
                    return reply.status(404).send({
                        error: 'Not Found',
                        message: 'Account not found'
                    });
                }

                request.log.info(
                    { userId: request.userId, tenantId: request.tenantId, accountId: params.id },
                    'Retrieved account'
                );

                return account;
            } catch (error) {
                request.log.error({ error, userId: request.userId, tenantId: request.tenantId, accountId: (request.params as AccountParams).id }, 'Error fetching account');
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch account',
                });
            }
        }
    );
}
