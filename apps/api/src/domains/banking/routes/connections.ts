import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { FlinksService, FlinksError } from '../services/flinks.service';
import { validateBody, validateParams } from '../../../middleware/validation';
import { adminOnly, transactingAccess } from '../../../middleware/withPermission';
import { strictRateLimitConfig } from '../../../middleware/rate-limit';

// ─── Schemas ─────────────────────────────────────────────────────────

const createConnectionBodySchema = z.object({
  loginId: z.string().uuid('loginId must be a valid UUID'),
  entityId: z.string().cuid('entityId must be a valid CUID'),
});

const connectionParamsSchema = z.object({
  id: z.string().cuid('Connection ID must be a valid CUID'),
});

const listConnectionsQuerySchema = z.object({
  entityId: z.string().cuid('entityId must be a valid CUID'),
});

type CreateConnectionBody = z.infer<typeof createConnectionBodySchema>;
type ConnectionParams = z.infer<typeof connectionParamsSchema>;
type ListConnectionsQuery = z.infer<typeof listConnectionsQuerySchema>;

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * Bank Connection Routes
 *
 * Manages Flinks bank connections — create, list, refresh, disconnect.
 * All routes require auth + tenant (inherited from parent banking routes).
 */
export async function connectionRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/banking/connections
   *
   * Process a new bank connection from Flinks Connect.
   * RBAC: OWNER, ADMIN only (connecting bank accounts is sensitive).
   * Rate limit: strict (10/min) to prevent abuse.
   */
  fastify.post<{ Body: CreateConnectionBody }>('/', {
    ...adminOnly,
    config: { rateLimit: strictRateLimitConfig() },
    preValidation: validateBody(createConnectionBodySchema),
    handler: async (request: FastifyRequest<{ Body: CreateConnectionBody }>, reply: FastifyReply) => {
      const { loginId, entityId } = request.body;
      const service = new FlinksService(request.tenantId!);

      try {
        const result = await service.processConnection(loginId, entityId, {
          tenantId: request.tenantId!,
          userId: request.userId!,
          role: request.tenantRole!,
        });

        request.log.info(
          { connectionId: result.connection.id, accountCount: result.accountCount, isExisting: result.isExisting },
          'Bank connection processed'
        );

        // Never expose providerItemId (loginId) in response
        const { providerItemId: _omit, ...connectionData } = result.connection;

        return reply.status(result.isExisting ? 200 : 201).send({
          ...connectionData,
          accountCount: result.accountCount,
          transactionCount: result.transactionCount,
          isExisting: result.isExisting,
        });
      } catch (error) {
        if (error instanceof FlinksError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        request.log.error({ err: error, loginId, entityId }, 'Failed to process bank connection');
        return reply.status(500).send({ error: 'Failed to process bank connection' });
      }
    },
  });

  /**
   * GET /api/banking/connections?entityId=xxx
   *
   * List bank connections for an entity.
   * RBAC: transacting access (OWNER, ADMIN, ACCOUNTANT).
   */
  fastify.get<{ Querystring: ListConnectionsQuery }>('/', {
    ...transactingAccess,
    handler: async (request: FastifyRequest<{ Querystring: ListConnectionsQuery }>, reply: FastifyReply) => {
      const { entityId } = request.query as ListConnectionsQuery;

      if (!entityId) {
        return reply.status(400).send({ error: 'entityId query parameter is required' });
      }

      const service = new FlinksService(request.tenantId!);
      const connections = await service.listConnections(entityId);

      // Strip providerItemId from all connections
      const safeConnections = connections.map(({ providerItemId: _omit, ...conn }) => conn);

      return reply.send(safeConnections);
    },
  });

  /**
   * POST /api/banking/connections/:id/refresh
   *
   * Trigger a data refresh for a connection.
   * RBAC: OWNER, ADMIN only.
   * Rate limit: strict (enforced in service — max 1/hour per connection).
   */
  fastify.post<{ Params: ConnectionParams }>('/:id/refresh', {
    ...adminOnly,
    config: { rateLimit: strictRateLimitConfig() },
    preValidation: validateParams(connectionParamsSchema),
    handler: async (request: FastifyRequest<{ Params: ConnectionParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const service = new FlinksService(request.tenantId!);

      try {
        const result = await service.refreshConnection(id, {
          tenantId: request.tenantId!,
          userId: request.userId!,
          role: request.tenantRole!,
        });

        if (!result) {
          return reply.status(404).send({ error: 'Connection not found' });
        }

        return reply.send(result);
      } catch (error) {
        if (error instanceof FlinksError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        request.log.error({ err: error, connectionId: id }, 'Failed to refresh connection');
        return reply.status(500).send({ error: 'Failed to refresh connection' });
      }
    },
  });

  /**
   * DELETE /api/banking/connections/:id
   *
   * Disconnect a bank connection (soft delete).
   * RBAC: OWNER, ADMIN only.
   */
  fastify.delete<{ Params: ConnectionParams }>('/:id', {
    ...adminOnly,
    preValidation: validateParams(connectionParamsSchema),
    handler: async (request: FastifyRequest<{ Params: ConnectionParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const service = new FlinksService(request.tenantId!);

      const result = await service.disconnectConnection(id);

      if (!result) {
        return reply.status(404).send({ error: 'Connection not found' });
      }

      request.log.info({ connectionId: id }, 'Bank connection disconnected');
      return reply.status(204).send();
    },
  });
}
