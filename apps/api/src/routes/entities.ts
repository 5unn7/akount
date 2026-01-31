import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';
import { authMiddleware } from '../middleware/auth';

/**
 * Entity Routes
 *
 * Provides CRUD operations for entities (companies, personal accounts, etc.)
 * All routes require authentication and are tenant-scoped.
 */

type EntityListResponse = {
    entities: Array<{
        id: string;
        name: string;
        type: string;
        currency: string;
    }>;
};

type ErrorResponse = {
    error: string;
    message: string;
};

export async function entitiesRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/entities
     *
     * Returns all entities for the authenticated user's tenant.
     * Entities are filtered by tenant to ensure data isolation.
     */
    fastify.get<{ Reply: EntityListResponse | ErrorResponse }>(
        '/entities',
        {
            onRequest: [authMiddleware]
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<EntityListResponse | ErrorResponse> => {
            try {
                // Get user's tenant membership
                const tenantUser = await prisma.tenantUser.findFirst({
                    where: {
                        user: {
                            clerkUserId: request.userId as string
                        }
                    },
                    include: { tenant: true },
                });

                if (!tenantUser) {
                    return reply.status(404).send({
                        error: 'Tenant not found',
                        message: 'User is not associated with any tenant. Please contact support.',
                    });
                }

                // Get entities for this tenant
                const entities = await prisma.entity.findMany({
                    where: { tenantId: tenantUser.tenantId },
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        functionalCurrency: true,
                    },
                    orderBy: {
                        name: 'asc',
                    },
                });

                return {
                    entities: entities.map(e => ({
                        id: e.id,
                        name: e.name,
                        type: e.type,
                        currency: e.functionalCurrency,
                    })),
                };
            } catch (error) {
                request.log.error({ error }, 'Error fetching entities');
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch entities',
                });
            }
        }
    );
}
