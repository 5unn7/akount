/**
 * The 6 canonical roles from design-system.
 * See: docs/design-system/05-governance/permissions-matrix.md
 */
export const ROLES = [
  'OWNER',
  'ADMIN',
  'ACCOUNTANT',
  'BOOKKEEPER',
  'INVESTOR',
  'ADVISOR',
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Role metadata for display and UI.
 */
export interface RoleInfo {
  label: string;
  description: string;
  canInvite: boolean;
  isExternal: boolean;
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  OWNER: {
    label: 'Owner',
    description: 'Full access to all features and settings',
    canInvite: true,
    isExternal: false,
  },
  ADMIN: {
    label: 'Administrator',
    description: 'Full access except ownership transfer',
    canInvite: true,
    isExternal: false,
  },
  ACCOUNTANT: {
    label: 'Accountant',
    description: 'Full accounting access, can approve entries',
    canInvite: false,
    isExternal: true,
  },
  BOOKKEEPER: {
    label: 'Bookkeeper',
    description: 'Day-to-day transaction entry',
    canInvite: false,
    isExternal: false,
  },
  INVESTOR: {
    label: 'Investor',
    description: 'View-only access to reports and dashboards',
    canInvite: false,
    isExternal: true,
  },
  ADVISOR: {
    label: 'Advisor',
    description: 'View-only access with consultation notes',
    canInvite: false,
    isExternal: true,
  },
};

/**
 * Check if a string is a valid role.
 */
export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

/**
 * Get role info with fallback.
 */
export function getRoleInfo(role: Role): RoleInfo {
  return ROLE_INFO[role];
}

/**
 * Roles that can manage other users.
 */
export const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];

/**
 * Roles that can perform accounting actions.
 */
export const ACCOUNTING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT'];

/**
 * Roles that can create transactions.
 */
export const TRANSACTING_ROLES: Role[] = [
  'OWNER',
  'ADMIN',
  'ACCOUNTANT',
  'BOOKKEEPER',
];

/**
 * View-only roles.
 */
export const VIEWER_ROLES: Role[] = ['INVESTOR', 'ADVISOR'];

/**
 * Check if role has admin capabilities.
 */
export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Check if role is view-only.
 */
export function isViewerRole(role: Role): boolean {
  return VIEWER_ROLES.includes(role);
}
