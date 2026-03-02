import { FastifyRequest, FastifyReply } from 'fastify';
import { TenantUserRole } from '@akount/db';
import type { PermissionKey, PermissionLevel } from '@akount/types';
import { getRolesWithAccess } from '@akount/types';

/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Enforces role-based permissions for routes.
 * Must be used after authMiddleware and tenantMiddleware.
 *
 * Usage:
 *   preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT'])
 */
export function withRolePermission(allowedRoles: TenantUserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenantRole) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Tenant role not found',
      });
    }

    if (!allowedRoles.includes(request.tenantRole as TenantUserRole)) {
      request.log.warn(
        {
          userId: request.userId,
          tenantId: request.tenantId,
          role: request.tenantRole,
          allowedRoles,
        },
        'Access denied: insufficient permissions'
      );

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions for this operation',
      });
    }

    request.log.debug(
      {
        userId: request.userId,
        tenantId: request.tenantId,
        role: request.tenantRole,
      },
      'RBAC check passed'
    );
  };
}

/** DB enum values for filtering roles from the canonical matrix */
const DB_ROLES = new Set<string>(['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER']);

/**
 * Check if user has required permission level for a domain resource.
 *
 * Queries the canonical PERMISSION_MATRIX from @akount/types.
 * Filters to roles that exist in the current DB schema (4 of 6).
 *
 * @param domain - Domain name (e.g., 'banking', 'accounting')
 * @param resource - Resource name (e.g., 'accounts', 'transactions')
 * @param level - Permission level ('VIEW', 'ACT', 'APPROVE', 'ADMIN')
 */
export function requirePermission(
  domain: string,
  resource: string,
  level: string
) {
  const key = `${domain}:${resource}` as PermissionKey;
  const rolesFromMatrix = getRolesWithAccess(key, level as PermissionLevel);

  // Filter to roles present in DB enum (schema has 4, design has 6)
  const allowedRoles = rolesFromMatrix.filter(r => DB_ROLES.has(r)) as TenantUserRole[];

  // Fallback: if matrix has no entry for this key, restrict to OWNER only
  if (allowedRoles.length === 0) {
    return withRolePermission(['OWNER']);
  }

  return withRolePermission(allowedRoles);
}

/**
 * Check if user has one of the allowed roles.
 *
 * @param allowedRoles - Array of roles that can access this route
 */
export function requireRole(allowedRoles: TenantUserRole[]) {
  return withRolePermission(allowedRoles);
}
