import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import * as vendorService from '../services/vendor.service';
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  ListVendorsSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
  type ListVendorsInput,
} from '../schemas/vendor.schema';

/**
 * Vendor routes (AP side)
 *
 * All routes require authentication, tenant context, and role-based permissions
 * Follows pattern: Auth → Tenant → RBAC → Validation → Service
 *
 * Role permissions:
 * - VIEW: OWNER, ADMIN, ACCOUNTANT
 * - CREATE: OWNER, ADMIN, ACCOUNTANT
 * - UPDATE: OWNER, ADMIN, ACCOUNTANT
 * - DELETE: OWNER, ADMIN (more restricted)
 */
export async function vendorRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // POST /api/vendors - Create vendor
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateVendorSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const body = request.body as CreateVendorInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const vendor = await vendorService.createVendor(body, tenant);
        return reply.status(201).send(vendor);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/vendors - List vendors
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ListVendorsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const query = request.query as ListVendorsInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      const result = await vendorService.listVendors(query, tenant);
      return reply.status(200).send(result);
    }
  );

  // GET /api/vendors/:id - Get single vendor (includes stats)
  fastify.get(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(z.object({ id: z.string().cuid() }))],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const vendor = await vendorService.getVendor(params.id, tenant);
        return reply.status(200).send(vendor);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Vendor not found' });
        }
        throw error;
      }
    }
  );

  // PUT /api/vendors/:id - Update vendor
  fastify.put(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams(z.object({ id: z.string().cuid() })),
        validateBody(UpdateVendorSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const body = request.body as UpdateVendorInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const vendor = await vendorService.updateVendor(params.id, body, tenant);
        return reply.status(200).send(vendor);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Vendor not found' });
        }
        throw error;
      }
    }
  );

  // DELETE /api/vendors/:id - Soft delete vendor
  fastify.delete(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
      preValidation: [validateParams(z.object({ id: z.string().cuid() }))],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        await vendorService.deleteVendor(params.id, tenant);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Vendor not found' });
        }
        throw error;
      }
    }
  );
}
