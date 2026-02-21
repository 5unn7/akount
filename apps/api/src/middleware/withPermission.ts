import type { RouteShorthandOptions } from 'fastify';
import type { PermissionLevel } from '@akount/types';
import type { TenantUserRole } from '@akount/db';
import { requirePermission, requireRole } from './rbac';

/**
 * Helper to add permission check to route options.
 * Combines with other route options easily.
 *
 * @example
 * ```typescript
 * // Basic usage
 * fastify.get('/journal-entries', {
 *   ...withPermission('accounting', 'journal-entries', 'VIEW'),
 *   handler: async (request, reply) => { ... }
 * });
 *
 * // With other options
 * fastify.post('/journal-entries', {
 *   ...withPermission('accounting', 'journal-entries', 'ACT'),
 *   schema: journalEntrySchema,
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function withPermission(
  domain: string,
  resource: string,
  level: PermissionLevel
): Pick<RouteShorthandOptions, 'preHandler'> {
  return {
    preHandler: requirePermission(domain, resource, level),
  };
}

/**
 * Helper to add role check to route options.
 *
 * @example
 * ```typescript
 * fastify.post('/users/invite', {
 *   ...withRole(['OWNER', 'ADMIN']),
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function withRole(
  allowedRoles: TenantUserRole[]
): Pick<RouteShorthandOptions, 'preHandler'> {
  return {
    preHandler: requireRole(allowedRoles),
  };
}

/**
 * Combine multiple preHandlers.
 * Useful when you need both permission check and other middleware.
 *
 * @example
 * ```typescript
 * fastify.post('/sensitive-operation', {
 *   preHandler: combineHandlers(
 *     requirePermission('system', 'data-management', 'ADMIN'),
 *     validateRequest(schema),
 *   ),
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function combineHandlers(
  ...handlers: RouteShorthandOptions['preHandler'][]
): RouteShorthandOptions['preHandler'] {
  return handlers.flat().filter(Boolean) as RouteShorthandOptions['preHandler'];
}

// ============================================================================
// Common Permission Presets
// ============================================================================

/**
 * Preset for admin-only routes.
 */
export const adminOnly = withRole(['OWNER', 'ADMIN']);

/**
 * Preset for accounting routes.
 */
export const accountingAccess = withRole(['OWNER', 'ADMIN', 'ACCOUNTANT']);

/**
 * Preset for transaction routes (includes bookkeeper).
 */
export const transactingAccess = withRole(['OWNER', 'ADMIN', 'ACCOUNTANT']);

/**
 * Preset for report viewing.
 */
export const reportViewAccess = withRole(['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER']);
