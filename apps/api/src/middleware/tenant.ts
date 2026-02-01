import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@akount/db';

export async function tenantMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId },
        select: { tenantId: true }
    });

    if (!tenantUser) {
        return reply.status(403).send({ error: 'No tenant access' });
    }

    request.tenantId = tenantUser.tenantId;
}
