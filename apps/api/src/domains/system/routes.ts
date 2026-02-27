import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { withPermission, adminOnly } from '../../middleware/withPermission';
import { auditQueryService } from './services/audit-query.service';
import { streamDataBackup } from './services/data-export.service';
import { createAuditLog } from '../../lib/audit';
import { getRetentionStats, purgeExpiredLogs } from '../../lib/audit-retention';
import { onboardingRoutes } from './routes/onboarding';
import { onboardingProgressRoutes } from './routes/onboarding-progress';
import { entityRoutes } from './routes/entity';
import { entityManagementRoutes } from './routes/entities';
import { consentRoutes } from './routes/consent';

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
    await tenantScope.register(entityManagementRoutes, { prefix: '/entities' });
    await tenantScope.register(consentRoutes, { prefix: '/consent' });

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

        // FIN-18: Include entityId for entity-level audit traceability
        await createAuditLog({
          tenantId: request.tenantId as string,
          userId: request.userId as string,
          entityId: entityId || undefined,
          model: 'DataExport',
          recordId: 'full-backup',
          action: 'VIEW',
          after: { format: 'zip', entityScope: entityId || 'all' },
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

    // ============================================================================
    // AUDIT LOG RETENTION — SEC-14
    // ============================================================================

    /**
     * GET /api/system/audit-log/retention
     *
     * Get retention policy stats for the current tenant.
     * Shows total entries, expired entries, and retention period.
     */
    tenantScope.get(
      '/audit-log/retention',
      {
        ...adminOnly,
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const stats = await getRetentionStats(request.tenantId as string);
          request.log.info({ tenantId: request.tenantId }, 'Retrieved audit retention stats');
          return stats;
        } catch (error) {
          request.log.error({ error }, 'Error fetching retention stats');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to fetch retention statistics',
          });
        }
      }
    );

    /**
     * POST /api/system/audit-log/retention/purge
     *
     * Purge expired audit log entries. OWNER/ADMIN only.
     * Deletes entries older than the tenant's retention period.
     * Rate limited to 1 request per 10 minutes to prevent abuse.
     */
    tenantScope.post(
      '/audit-log/retention/purge',
      {
        ...adminOnly,
        config: {
          rateLimit: {
            max: 1,
            timeWindow: '10 minutes',
          },
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const result = await purgeExpiredLogs(request.tenantId as string);

          await createAuditLog({
            tenantId: request.tenantId as string,
            userId: request.userId as string,
            model: 'AuditLog',
            recordId: 'retention-purge',
            action: 'DELETE',
            after: {
              purgedCount: result.purgedCount,
              cutoffDate: result.cutoffDate.toISOString(),
              remainingCount: result.remainingCount,
            },
          });

          request.log.info(
            { tenantId: request.tenantId, purgedCount: result.purgedCount },
            'Audit log retention purge completed',
          );

          return result;
        } catch (error) {
          request.log.error({ error }, 'Error purging audit logs');
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to purge expired audit logs',
          });
        }
      }
    );
  });
}
