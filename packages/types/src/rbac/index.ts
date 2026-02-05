/**
 * RBAC (Role-Based Access Control) types for Akount.
 *
 * @example
 * ```typescript
 * import {
 *   type Role,
 *   type PermissionLevel,
 *   canAccess,
 *   ROLE_INFO,
 * } from '@akount/types/rbac';
 *
 * const userRole: Role = 'ACCOUNTANT';
 *
 * if (canAccess('accounting:journal-entries', userRole, 'ACT')) {
 *   // User can create journal entries
 * }
 *
 * console.log(ROLE_INFO[userRole].description);
 * // "Full accounting access, can approve entries"
 * ```
 */

export * from './roles';
export * from './permissions';
