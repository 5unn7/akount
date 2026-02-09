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
