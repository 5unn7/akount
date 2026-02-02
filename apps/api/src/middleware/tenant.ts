import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';

/**
 * Tenant Middleware
 *
 * Fetches and attaches tenant information to the request object.
 * Must be used after authMiddleware.
 *
 * This middleware:
 * - Queries user's tenant membership once per request
 * - Attaches tenantId to request for use in services
 * - Prevents duplicate tenant lookups in every service method
 * - Enforces tenant isolation at the middleware level
 */
export async function tenantMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    // Ensure user is authenticated (should be guaranteed by authMiddleware)
    if (!request.userId) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    try {
        // Fetch user's tenant membership
        const tenantUser = await prisma.tenantUser.findFirst({
            where: {
                user: {
                    clerkUserId: request.userId
                }
            },
            select: {
                tenantId: true,
                role: true,
            },
        });

        if (!tenantUser) {
            return reply.status(403).send({
                error: 'No tenant access',
                message: 'User is not associated with any tenant'
            });
        }

        // Attach tenant info to request
        request.tenantId = tenantUser.tenantId;
        request.tenantRole = tenantUser.role;

        request.log.debug(
            { userId: request.userId, tenantId: request.tenantId, role: request.tenantRole },
            'Tenant context attached to request'
        );
    } catch (error) {
        request.log.error({ error, userId: request.userId }, 'Error fetching tenant membership');
        return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to fetch tenant information'
        });
    }
}

// Extend FastifyRequest interface to include tenant properties
declare module 'fastify' {
    interface FastifyRequest {
        tenantId?: string;
        tenantRole?: string;
    }
}
