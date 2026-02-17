import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { validateBody } from '../../middleware/validation';
import { withPermission, adminOnly } from '../../middleware/withPermission';
import { auditQueryService } from './services/audit-query.service';
import { EntityService } from './services/entity.service';
import { streamDataBackup } from './services/data-export.service';
import { createAuditLog } from '../../lib/audit';
import { onboardingRoutes } from './routes/onboarding';
import { onboardingProgressRoutes } from './routes/onboarding-progress';
import { entityRoutes } from './routes/entity';

// Validation schemas
const auditLogQuerySchema = z.object({
  model: z.string().optional(),
  recordId: z.string().optional(),
  userId: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

// Response types
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

/**
 * System Domain Routes
 *
 * Handles system-level operations: entities, users, settings, and audit logs.
 * All routes require authentication and are tenant-scoped.
 */
export async function systemRoutes(fastify: FastifyInstance) {
  // Register onboarding routes WITHOUT tenant middleware (users don't have tenants yet)
  // These routes only require authentication, not tenant context
  await fastify.register(async (onboardingScope) => {
    onboardingScope.addHook('onRequest', authMiddleware);
    await onboardingScope.register(onboardingRoutes, { prefix: '/onboarding' });
  });

  // Register onboarding-progress routes WITH tenant middleware
  // These routes track progress for existing tenants, so they need tenant context
  await fastify.register(async (progressScope) => {
    progressScope.addHook('onRequest', authMiddleware);
    progressScope.addHook('preHandler', tenantMiddleware);
    await progressScope.register(onboardingProgressRoutes, { prefix: '/onboarding' });
  });

  // All other routes require both auth AND tenant context
  await fastify.register(async (tenantScope) => {
    tenantScope.addHook('onRequest', authMiddleware);
    tenantScope.addHook('preHandler', tenantMiddleware);

    await tenantScope.register(entityRoutes, { prefix: '/entity' });

    // ============================================================================
    // ENTITIES
    // ============================================================================

    /**
     * GET /api/system/entities
     *
     * Returns all entities for the authenticated user's tenant.
     * Entities are filtered by tenant to ensure data isolation.
     */
    tenantScope.get<{ Reply: EntityListResponse | ErrorResponse }>(
    '/entities',
    async (request: FastifyRequest, reply: FastifyReply): Promise<EntityListResponse | ErrorResponse> => {
      try {
        const service = new EntityService(request.tenantId as string);
        const entities = await service.listEntities();

        return {
          entities: entities.map((e) => ({
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

    /**
     * GET /api/system/entities/:id
     *
     * Returns a specific entity by ID.
     */
    tenantScope.get(
      '/entities/:id',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { id } = request.params as { id: string };
          const service = new EntityService(request.tenantId as string);
          const entity = await service.getEntity(id);

          if (!entity) {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Entity not found',
            });
          }

          return entity;
        } catch (error) {
          request.log.error({ error }, 'Error fetching entity');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to fetch entity',
          });
        }
      }
    );

    /**
     * POST /api/system/entities
     *
     * Create a new entity for the tenant.
     * RBAC: OWNER, ADMIN only.
     */
    tenantScope.post(
      '/entities',
      {
        ...withPermission('system', 'entities', 'ADMIN'),
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const CreateEntitySchema = z.object({
            name: z.string().min(1).max(200),
            type: z.enum([
              'PERSONAL',
              'CORPORATION',
              'SOLE_PROPRIETORSHIP',
              'PARTNERSHIP',
              'LLC',
            ]),
            country: z.string().min(2).max(3),
            currency: z.string().min(3).max(3),
            fiscalYearStart: z.number().int().min(1).max(12).optional(),
            taxId: z.string().max(50).optional(),
            address: z.string().max(500).optional(),
            city: z.string().max(100).optional(),
            state: z.string().max(100).optional(),
            postalCode: z.string().max(20).optional(),
          });

          const parsed = CreateEntitySchema.safeParse(request.body);
          if (!parsed.success) {
            return reply.status(400).send({
              error: 'Validation Error',
              message: 'Invalid entity data',
              details: parsed.error.errors,
            });
          }

          const service = new EntityService(request.tenantId as string);
          const entity = await service.createEntity(request.userId as string, {
            name: parsed.data.name,
            type: parsed.data.type,
            country: parsed.data.country,
            functionalCurrency: parsed.data.currency,
            fiscalYearStart: parsed.data.fiscalYearStart,
            taxId: parsed.data.taxId,
            address: parsed.data.address,
            city: parsed.data.city,
            state: parsed.data.state,
            postalCode: parsed.data.postalCode,
          });

          return reply.status(201).send({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            currency: entity.functionalCurrency,
            country: entity.country,
          });
        } catch (error) {
          request.log.error({ error }, 'Error creating entity');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to create entity',
          });
        }
      }
    );

    // ============================================================================
    // USERS
    // ============================================================================

    /**
     * GET /api/system/users
     *
     * List all users in the tenant.
     */
    tenantScope.get(
      '/users',
      {
        ...withPermission('system', 'users', 'VIEW'),
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const users = await prisma.tenantUser.findMany({
            where: { tenantId: request.tenantId },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          return {
            users: users.map((tu) => ({
              id: tu.user.id,
              name: tu.user.name,
              email: tu.user.email,
              role: tu.role,
              joinedAt: tu.createdAt,
            })),
          };
        } catch (error) {
          request.log.error({ error }, 'Error listing users');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to list users',
          });
        }
      }
    );

    /**
     * POST /api/system/users/invite
     *
     * Invite a new user to the tenant.
     */
    tenantScope.post(
      '/users/invite',
      {
        ...withPermission('system', 'users', 'ADMIN'),
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Placeholder - implementation to come
        return reply.status(501).send({
          error: 'Not Implemented',
          message: 'User invitation will be implemented in a future phase',
        });
      }
    );

    // ============================================================================
    // SETTINGS
    // ============================================================================

    /**
     * GET /api/system/settings
     *
     * Get tenant settings.
     */
    tenantScope.get(
      '/settings',
      {
        ...withPermission('system', 'settings', 'VIEW'),
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const tenant = await prisma.tenant.findUnique({
            where: { id: request.tenantId },
            select: {
              id: true,
              name: true,
              region: true,
              plan: true,
              status: true,
            },
          });

          if (!tenant) {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Tenant not found',
            });
          }

          return tenant;
        } catch (error) {
          request.log.error({ error }, 'Error fetching settings');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to fetch settings',
          });
        }
      }
    );

    /**
     * PUT /api/system/settings
     *
     * Update tenant settings.
     */
    tenantScope.put(
      '/settings',
      {
        ...withPermission('system', 'settings', 'ADMIN'),
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Placeholder - implementation to come
        return reply.status(501).send({
          error: 'Not Implemented',
          message: 'Settings update will be implemented in a future phase',
        });
      }
    );

    // ============================================================================
    // DATA EXPORT (Full Backup)
    // ============================================================================

    /**
     * GET /api/system/data-export
     *
     * Download a full data backup as a streaming ZIP archive.
     * OWNER/ADMIN only. Rate limited to 3 requests per minute.
     * Contains all tenant data as CSV files + metadata.json.
     */
    tenantScope.get(
      '/data-export',
      {
        ...adminOnly,
        config: {
          rateLimit: {
            max: 3,
            timeWindow: '1 minute',
          },
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { entityId } = request.query as { entityId?: string };

        await createAuditLog({
          tenantId: request.tenantId as string,
          userId: request.userId as string,
          model: 'DataExport',
          recordId: 'full-backup',
          action: 'EXPORT',
          after: { format: 'zip', entityId: entityId || 'all' },
        });

        try {
          await streamDataBackup(reply, request.tenantId as string, entityId);
        } catch (error) {
          request.log.error({ error }, 'Data export failed');
          return reply.status(500).send({
            error: 'Export Failed',
            message: 'Failed to generate data export',
          });
        }
      }
    );

    // ============================================================================
    // AUDIT LOG
    // ============================================================================

    /**
     * GET /api/system/audit-log
     *
     * Query audit log entries with filtering.
     */
    tenantScope.get(
      '/audit-log',
      {
        ...withPermission('system', 'audit-log', 'VIEW'),
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const query = request.query as AuditLogQuery;

          const { logs, total } = await auditQueryService.query({
            tenantId: request.tenantId as string,
            model: query.model,
            recordId: query.recordId,
            userId: query.userId,
            entityId: query.entityId,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            limit: query.limit,
            offset: query.offset,
          });

          return { logs, total };
        } catch (error) {
          request.log.error({ error }, 'Error querying audit log');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to query audit log',
          });
        }
      }
    );
  });
}
