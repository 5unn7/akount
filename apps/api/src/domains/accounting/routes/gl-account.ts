import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validation';
import { GLAccountService } from '../services/gl-account.service';
import { seedDefaultCOA } from '../services/coa-template';
import { handleAccountingError } from '../errors';
import {
  CreateGLAccountSchema,
  UpdateGLAccountSchema,
  ListGLAccountsSchema,
  GLAccountParamsSchema,
  SeedCOASchema,
  BalancesQuerySchema,
  type CreateGLAccountInput,
  type UpdateGLAccountInput,
  type ListGLAccountsQuery,
  type GLAccountParams,
  type SeedCOAInput,
  type BalancesQuery,
} from '../schemas/gl-account.schema';

/**
 * Chart of Accounts Routes
 *
 * CRUD operations for GL accounts with hierarchy support.
 * All routes require accounting domain permissions.
 */
export async function glAccountRoutes(fastify: FastifyInstance) {
  // Note: /balances and /seed must be registered BEFORE /:id to avoid route conflicts

  // GET /chart-of-accounts/balances — Account balances summary
  fastify.get(
    '/balances',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'VIEW'),
      preValidation: [validateQuery(BalancesQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as BalancesQuery;
      const service = new GLAccountService(request.tenantId, request.userId);

      try {
        const balances = await service.getAccountBalances(query.entityId);
        return reply.send(balances);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /chart-of-accounts/seed — Seed default COA
  fastify.post(
    '/seed',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'ACT'),
      preValidation: [validateBody(SeedCOASchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as SeedCOAInput;

      try {
        const result = await seedDefaultCOA(body.entityId, request.tenantId, request.userId);
        return reply.status(result.seeded ? 201 : 200).send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // GET /chart-of-accounts — List with filters
  fastify.get(
    '/',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'VIEW'),
      preValidation: [validateQuery(ListGLAccountsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as ListGLAccountsQuery;
      const service = new GLAccountService(request.tenantId, request.userId);

      try {
        const accounts = await service.listAccounts(query);
        return reply.send(accounts);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // GET /chart-of-accounts/:id — Single account with details
  fastify.get(
    '/:id',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'VIEW'),
      preValidation: [validateParams(GLAccountParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as GLAccountParams;
      const service = new GLAccountService(request.tenantId, request.userId);

      try {
        const account = await service.getAccount(params.id);
        return reply.send(account);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /chart-of-accounts — Create account
  fastify.post(
    '/',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'ACT'),
      preValidation: [validateBody(CreateGLAccountSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as CreateGLAccountInput;
      const service = new GLAccountService(request.tenantId, request.userId);

      try {
        const account = await service.createAccount(body);
        return reply.status(201).send(account);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // PATCH /chart-of-accounts/:id — Update account
  fastify.patch(
    '/:id',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'ACT'),
      preValidation: [validateParams(GLAccountParamsSchema), validateBody(UpdateGLAccountSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as GLAccountParams;
      const body = request.body as UpdateGLAccountInput;
      const service = new GLAccountService(request.tenantId, request.userId);

      try {
        const account = await service.updateAccount(params.id, body);
        return reply.send(account);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // DELETE /chart-of-accounts/:id — Deactivate (soft — sets isActive: false)
  fastify.delete(
    '/:id',
    {
      ...withPermission('accounting', 'chart-of-accounts', 'ACT'),
      preValidation: [validateParams(GLAccountParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as GLAccountParams;
      const service = new GLAccountService(request.tenantId, request.userId);

      try {
        const account = await service.deactivateAccount(params.id);
        return reply.send(account);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );
}