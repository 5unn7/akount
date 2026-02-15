import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import { ReconciliationService } from '../services/reconciliation.service';
import {
  SuggestMatchesParamsSchema,
  SuggestMatchesQuerySchema,
  CreateMatchSchema,
  MatchIdParamSchema,
  ReconciliationStatusParamsSchema,
  type SuggestMatchesParams,
  type SuggestMatchesQuery,
  type CreateMatchInput,
  type MatchIdParam,
  type ReconciliationStatusParams,
} from '../schemas/reconciliation.schema';

/**
 * Reconciliation routes
 *
 * All routes require authentication, tenant context, and role-based permissions.
 * Follows pattern: Auth → Tenant → RBAC → Validation → Service
 *
 * Role permissions:
 * - VIEW: OWNER, ADMIN, ACCOUNTANT (suggestions, status)
 * - CREATE/DELETE: OWNER, ADMIN, ACCOUNTANT (match/unmatch)
 */
export async function reconciliationRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // GET /api/banking/reconciliation/:bankFeedTransactionId/suggestions
  // Returns suggested matches for a bank feed transaction
  fastify.get(
    '/:bankFeedTransactionId/suggestions',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams(SuggestMatchesParamsSchema),
        validateQuery(SuggestMatchesQuerySchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ReconciliationService(request.tenantId, request.userId);
      const params = request.params as SuggestMatchesParams;
      const query = request.query as SuggestMatchesQuery;

      try {
        const suggestions = await service.suggestMatches(
          params.bankFeedTransactionId,
          query.limit
        );

        return reply.status(200).send({ suggestions });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        if (error instanceof Error && error.message.includes('already matched')) {
          return reply.status(409).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/banking/reconciliation/matches
  // Create a manual match between bank feed and posted transaction
  fastify.post(
    '/matches',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateMatchSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ReconciliationService(request.tenantId, request.userId);
      const body = request.body as CreateMatchInput;

      try {
        const match = await service.createMatch(body);

        return reply.status(201).send(match);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        if (error instanceof Error && error.message.includes('already matched')) {
          return reply.status(409).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/banking/reconciliation/matches/:matchId
  // Unmatch a previously matched transaction
  fastify.delete(
    '/matches/:matchId',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(MatchIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ReconciliationService(request.tenantId, request.userId);
      const params = request.params as MatchIdParam;

      try {
        await service.unmatch(params.matchId);

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/banking/reconciliation/status/:accountId
  // Get reconciliation status for an account
  fastify.get(
    '/status/:accountId',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(ReconciliationStatusParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ReconciliationService(request.tenantId, request.userId);
      const params = request.params as ReconciliationStatusParams;

      try {
        const status = await service.getReconciliationStatus(params.accountId);

        return reply.status(200).send(status);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
