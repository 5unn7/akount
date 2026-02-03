import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DashboardService } from '../services/dashboard.service';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

// Validation schemas
const dashboardQuerySchema = z.object({
    entityId: z.string().cuid().optional(),
    currency: z.string().length(3).toUpperCase().optional(),
});

type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/dashboard/metrics',
        {
            onRequest: [authMiddleware, tenantMiddleware],
            schema: {
                querystring: dashboardQuerySchema,
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const service = new DashboardService(request.tenantId as string);
                const query = request.query as DashboardQuery;
                const { entityId, currency } = query;

                const metrics = await service.getMetrics(entityId, currency);

                request.log.info(
                    { userId: request.userId, tenantId: request.tenantId, entityId, currency },
                    'Retrieved dashboard metrics'
                );

                return metrics;
            } catch (error) {
                request.log.error({ error, userId: request.userId, tenantId: request.tenantId }, 'Error fetching dashboard metrics');
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch dashboard metrics',
                });
            }
        }
    );
}
