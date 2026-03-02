/**
 * Shared Test Helpers for Accounting Domain
 */
export const TENANT_ID = 'test-tenant-abc';
export const OTHER_TENANT_ID = 'test-tenant-other';
export const USER_ID = 'test-user-123';
export const OTHER_USER_ID = 'test-user-456';
export const ENTITY_ID = 'test-entity-xyz';
export const OTHER_ENTITY_ID = 'test-entity-other';

export function mockGLAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'gl-acct-1',
    entityId: ENTITY_ID,
    code: '1000',
    name: 'Cash',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: null,
    parentAccountId: null,
    isActive: true,
    isCTAAccount: false,
    isEliminationAccount: false,
    consolidationCode: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    entity: {
      id: ENTITY_ID,
      tenantId: TENANT_ID,
    },
    _count: {
      childAccounts: 0,
      journalLines: 0,
    },
    ...overrides,
  };
}

export function mockEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: ENTITY_ID,
    tenantId: TENANT_ID,
    name: 'Test Corp',
    type: 'CORPORATION',
    functionalCurrency: 'CAD',
    ...overrides,
  };
}
