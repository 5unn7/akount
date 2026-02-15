import { FastifyRequest, FastifyReply } from 'fastify';
import { TenantUserRole } from '@akount/db';

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

/**
 * Check if user has required permission level for a domain resource.
 *
 * TODO: Phase 3 - Implement granular permission checking
 * Currently delegates to role-based permissions as a stub.
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
  // TODO: Phase 3 - Query PermissionMatrix and check against user's role
  // For now, use role-based permissions as fallback

  // Map permission levels to roles (conservative approach)
  const rolesByLevel: Record<string, TenantUserRole[]> = {
    VIEW: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'],
    ACT: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
    APPROVE: ['OWNER', 'ADMIN'],
    ADMIN: ['OWNER', 'ADMIN'],
  };

  const allowedRoles = rolesByLevel[level] || ['OWNER'];
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
