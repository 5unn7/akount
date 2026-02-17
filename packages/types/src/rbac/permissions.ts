/**
 * Permission system from design-system.
 * See: docs/design-system/05-governance/permissions-matrix.md
 */

import type { Role } from './roles';

/**
 * Permission levels from design-system.
 */
export const PERMISSION_LEVELS = [
  'HIDDEN', // Cannot see
  'VIEW', // Read-only
  'ACT', // Create/update
  'APPROVE', // Approve/lock
  'ADMIN', // Configure
] as const;

export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

/**
 * Permission level hierarchy (for comparison).
 * Higher number = more permissions.
 */
export const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  HIDDEN: 0,
  VIEW: 1,
  ACT: 2,
  APPROVE: 3,
  ADMIN: 4,
};

/**
 * Check if user level meets required level.
 */
export function hasPermission(
  userLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): boolean {
  return PERMISSION_HIERARCHY[userLevel] >= PERMISSION_HIERARCHY[requiredLevel];
}

/**
 * Domain:Resource permission key.
 */
export type PermissionKey = `${string}:${string}`;

/**
 * Permission matrix entry.
 */
export type PermissionEntry = Record<Role, PermissionLevel>;

/**
 * Full permission matrix from design-system.
 * See: docs/design-system/05-governance/permissions-matrix.md
 */
export const PERMISSION_MATRIX: Record<PermissionKey, PermissionEntry> = {
  // Overview Domain
  'overview:dashboard': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'VIEW',
    INVESTOR: 'VIEW',
    ADVISOR: 'VIEW',
  },
  'overview:net-worth': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'VIEW',
    ADVISOR: 'VIEW',
  },
  'overview:cash-overview': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'VIEW',
    ADVISOR: 'VIEW',
  },

  // Banking Domain
  'banking:accounts': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'VIEW',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'banking:transactions': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'banking:reconciliation': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'APPROVE',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'banking:transfers': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'banking:import': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },

  // Business Operations Domain (AR/AP)
  'business:clients': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'business:vendors': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'business:invoices': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'business:bills': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'business:payments': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'ACT',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },

  // Accounting Domain
  'accounting:journal-entries': {
    OWNER: 'VIEW',
    ADMIN: 'ACT',
    ACCOUNTANT: 'ACT',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'accounting:chart-of-accounts': {
    OWNER: 'VIEW',
    ADMIN: 'ACT',
    ACCOUNTANT: 'ACT',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'accounting:assets': {
    OWNER: 'VIEW',
    ADMIN: 'ACT',
    ACCOUNTANT: 'ACT',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'accounting:tax-rates': {
    OWNER: 'VIEW',
    ADMIN: 'ACT',
    ACCOUNTANT: 'ACT',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'accounting:fiscal-periods': {
    OWNER: 'VIEW',
    ADMIN: 'APPROVE',
    ACCOUNTANT: 'APPROVE',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'accounting:reports': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'VIEW',
    ADVISOR: 'VIEW',
  },

  // Planning & Analytics Domain
  'planning:reports': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'VIEW',
    ADVISOR: 'VIEW',
  },
  'planning:budgets': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'planning:goals': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'HIDDEN',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'planning:forecasts': {
    OWNER: 'ACT',
    ADMIN: 'ACT',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'VIEW',
    ADVISOR: 'VIEW',
  },

  // AI Advisor Domain
  'ai:insight-feed': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'ai:policy-alerts': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'ai:history': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },

  // System Administration Domain
  'system:entities': {
    OWNER: 'ADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:integrations': {
    OWNER: 'ADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'HIDDEN',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:rules': {
    OWNER: 'ADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:users': {
    OWNER: 'ADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'HIDDEN',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:audit-log': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:security': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'VIEW',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:filing-readiness': {
    OWNER: 'VIEW',
    ADMIN: 'VIEW',
    ACCOUNTANT: 'APPROVE',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
  'system:data-management': {
    OWNER: 'ADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'HIDDEN',
    BOOKKEEPER: 'HIDDEN',
    INVESTOR: 'HIDDEN',
    ADVISOR: 'HIDDEN',
  },
};

/**
 * Get permission level for a role on a resource.
 */
export function getPermission(key: PermissionKey, role: Role): PermissionLevel {
  return PERMISSION_MATRIX[key]?.[role] ?? 'HIDDEN';
}

/**
 * Check if role can access resource at required level.
 */
export function canAccess(
  key: PermissionKey,
  role: Role,
  requiredLevel: PermissionLevel
): boolean {
  const userLevel = getPermission(key, role);
  return hasPermission(userLevel, requiredLevel);
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(
  role: Role
): Record<PermissionKey, PermissionLevel> {
  const permissions: Record<PermissionKey, PermissionLevel> = {};
  for (const [key, entry] of Object.entries(PERMISSION_MATRIX)) {
    permissions[key as PermissionKey] = entry[role];
  }
  return permissions;
}

/**
 * Get all roles that can access a resource at a given level.
 */
export function getRolesWithAccess(
  key: PermissionKey,
  requiredLevel: PermissionLevel
): Role[] {
  const entry = PERMISSION_MATRIX[key];
  if (!entry) return [];

  return (Object.entries(entry) as [Role, PermissionLevel][])
    .filter(([, level]) => hasPermission(level, requiredLevel))
    .map(([role]) => role);
}
