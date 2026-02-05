import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  type Role,
  type PermissionLevel,
  type PermissionKey,
  canAccess,
  ROLES,
} from '@akount/types';
import { prisma } from '@akount/db';

/**
 * Extend FastifyRequest with typed tenant context.
 */
declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
    userId: string;
    tenantRole: Role;
  }
}

/**
 * Validate that the tenantRole is a valid Role type.
 * Falls back to INVESTOR (most restrictive) if invalid.
 */
function validateRole(role: string | undefined): Role {
  if (role && ROLES.includes(role as Role)) {
    return role as Role;
  }
  return 'INVESTOR'; // Default to most restrictive
}

/**
 * Middleware factory for permission-based access control.
 *
 * @example
 * ```typescript
 * fastify.get('/journal-entries', {
 *   preHandler: requirePermission('accounting', 'journal-entries', 'VIEW'),
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function requirePermission(
  domain: string,
  resource: string,
  level: PermissionLevel
) {
  const key: PermissionKey = `${domain}:${resource}`;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId, userId } = request;
    const tenantRole = validateRole(request.tenantRole as string);

    // Update request with validated role
    request.tenantRole = tenantRole;

    if (!canAccess(key, tenantRole, level)) {
      // Log security event
      await logSecurityEvent({
        tenantId,
        userId,
        action: 'RBAC_DENIED',
        resourceType: key,
        metadata: {
          requiredLevel: level,
          userRole: tenantRole,
          path: request.url,
          method: request.method,
        },
      });

      request.log.warn(
        {
          userId,
          tenantId,
          role: tenantRole,
          permission: key,
          requiredLevel: level,
        },
        'RBAC access denied'
      );

      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions for ${key}`,
          details: {
            requiredPermission: key,
            requiredLevel: level,
            userRole: tenantRole,
          },
        },
      });
    }

    request.log.debug(
      {
        userId,
        tenantId,
        role: tenantRole,
        permission: key,
        level,
      },
      'RBAC access granted'
    );
  };
}

/**
 * Middleware factory for role-based access control.
 * Simpler than permission-based when you just need to check role.
 *
 * @example
 * ```typescript
 * fastify.post('/users', {
 *   preHandler: requireRole(['OWNER', 'ADMIN']),
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function requireRole(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId, userId } = request;
    const tenantRole = validateRole(request.tenantRole as string);

    // Update request with validated role
    request.tenantRole = tenantRole;

    if (!allowedRoles.includes(tenantRole)) {
      // Log security event
      await logSecurityEvent({
        tenantId,
        userId,
        action: 'ROLE_DENIED',
        resourceType: 'role_check',
        metadata: {
          allowedRoles,
          userRole: tenantRole,
          path: request.url,
          method: request.method,
        },
      });

      request.log.warn(
        {
          userId,
          tenantId,
          role: tenantRole,
          allowedRoles,
        },
        'Role access denied'
      );

      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role for this operation',
          details: {
            allowedRoles,
            userRole: tenantRole,
          },
        },
      });
    }

    request.log.debug(
      {
        userId,
        tenantId,
        role: tenantRole,
        allowedRoles,
      },
      'Role access granted'
    );
  };
}

/**
 * Log security event to audit log.
 * Non-blocking - errors are logged but don't fail the request.
 */
async function logSecurityEvent(params: {
  tenantId: string;
  userId: string;
  action: string;
  resourceType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        metadata: params.metadata,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('[Audit] Failed to log security event:', error);
  }
}

// ============================================================================
// Predefined Role Groups (convenience exports)
// ============================================================================

/** Roles that can manage users and system settings */
export const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];

/** Roles that can perform accounting operations */
export const ACCOUNTING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT'];

/** Roles that can create transactions and AR/AP entries */
export const TRANSACTING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'BOOKKEEPER'];

/** Roles that can view reports and dashboards */
export const REPORTING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'];

/** View-only roles */
export const VIEWER_ROLES: Role[] = ['INVESTOR', 'ADVISOR'];
