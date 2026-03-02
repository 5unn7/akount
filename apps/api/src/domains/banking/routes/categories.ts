import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import { CategoryService } from '../services/category.service';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ListCategoriesQuerySchema,
  CategoryIdParamSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ListCategoriesQuery,
  type CategoryIdParam,
} from '../schemas/category.schema';

/**
 * Category routes
 *
 * All routes require authentication and tenant context (inherited from parent).
 * Categories are tenant-scoped — users only see their own categories.
 *
 * Role permissions:
 * - VIEW: OWNER, ADMIN, ACCOUNTANT
 * - CREATE/UPDATE/DELETE: OWNER, ADMIN, ACCOUNTANT
 */
export async function categoryRoutes(fastify: FastifyInstance) {
  // Auth + tenant middleware
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // GET /api/banking/categories — List categories
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ListCategoriesQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const query = request.query as ListCategoriesQuery;

      const categories = await service.listCategories({
        type: query.type,
        isActive: query.isActive,
        includeChildren: query.includeChildren,
      });

      return reply.status(200).send({ categories });
    }
  );

  // GET /api/banking/categories/:id — Get single category
  fastify.get(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(CategoryIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const params = request.params as CategoryIdParam;

      const category = await service.getCategory(params.id);

      if (!category) {
        return reply.status(404).send({ error: 'Category not found' });
      }

      return reply.status(200).send(category);
    }
  );

  // POST /api/banking/categories — Create category
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateCategorySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const body = request.body as CreateCategoryInput;

      try {
        const category = await service.createCategory(body);
        return reply.status(201).send(category);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            return reply.status(409).send({ error: error.message });
          }
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // PATCH /api/banking/categories/:id — Update category
  fastify.patch(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams(CategoryIdParamSchema),
        validateBody(UpdateCategorySchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const params = request.params as CategoryIdParam;
      const body = request.body as UpdateCategoryInput;

      try {
        const category = await service.updateCategory(params.id, body);
        return reply.status(200).send(category);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('already exists') || error.message.includes('own parent')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // DELETE /api/banking/categories/:id — Soft delete category
  fastify.delete(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
      preValidation: [validateParams(CategoryIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const params = request.params as CategoryIdParam;

      try {
        await service.softDeleteCategory(params.id);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/banking/categories/seed — Seed default categories (idempotent)
  fastify.post(
    '/seed',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const result = await service.seedDefaults();

      return reply.status(200).send(result);
    }
  );

  // POST /api/banking/categories/dedup — Merge duplicate categories
  fastify.post(
    '/dedup',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new CategoryService(request.tenantId, request.userId);
      const result = await service.deduplicateCategories();

      return reply.status(200).send(result);
    }
  );
}
