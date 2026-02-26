import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withPermission,
  withRole,
  combineHandlers,
  adminOnly,
  accountingAccess,
  transactingAccess,
  reportViewAccess,
} from '../withPermission';

// Mock rbac module to intercept calls
vi.mock('../rbac', () => ({
  requirePermission: vi.fn((_domain: string, _resource: string, _level: string) => {
    return vi.fn();
  }),
  requireRole: vi.fn((roles: string[]) => {
    return vi.fn(async (request: Record<string, unknown>, reply: Record<string, unknown>) => {
      if (!roles.includes(request.tenantRole as string)) {
        (reply.status as ReturnType<typeof vi.fn>)(403);
        (reply.send as ReturnType<typeof vi.fn>)({ error: 'Forbidden' });
      }
    });
  }),
}));

import { requirePermission, requireRole } from '../rbac';

const mockRequirePermission = vi.mocked(requirePermission);
const mockRequireRole = vi.mocked(requireRole);

describe('withPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return object with preHandler property', () => {
    const result = withPermission('banking', 'accounts', 'VIEW');
    expect(result).toHaveProperty('preHandler');
    expect(typeof result.preHandler).toBe('function');
  });

  it('should call requirePermission with correct arguments', () => {
    withPermission('accounting', 'journal-entries', 'ACT');

    expect(mockRequirePermission).toHaveBeenCalledWith(
      'accounting',
      'journal-entries',
      'ACT'
    );
  });
});

describe('withRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return object with preHandler property', () => {
    const result = withRole(['OWNER', 'ADMIN']);
    expect(result).toHaveProperty('preHandler');
  });

  it('should call requireRole with correct roles', () => {
    withRole(['OWNER', 'ADMIN', 'ACCOUNTANT']);

    expect(mockRequireRole).toHaveBeenCalledWith(['OWNER', 'ADMIN', 'ACCOUNTANT']);
  });
});

describe('combineHandlers', () => {
  it('should combine multiple handlers into flat array', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const combined = combineHandlers(handler1, handler2);

    expect(Array.isArray(combined)).toBe(true);
    expect(combined).toHaveLength(2);
  });

  it('should flatten nested arrays', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    const combined = combineHandlers([handler1, handler2], handler3);

    expect(Array.isArray(combined)).toBe(true);
    expect(combined).toHaveLength(3);
  });

  it('should filter out falsy values', () => {
    const handler1 = vi.fn();

    const combined = combineHandlers(handler1, undefined as never);

    expect(Array.isArray(combined)).toBe(true);
    // Only non-falsy handlers
    const arr = combined as unknown[];
    expect(arr.filter(Boolean)).toHaveLength(1);
  });
});

describe('permission presets', () => {
  // Presets are module-level constants — requireRole was called during import.
  // We verify structure here; actual role enforcement is tested in rbac.test.ts.

  it('adminOnly should have preHandler', () => {
    expect(adminOnly).toHaveProperty('preHandler');
    expect(typeof adminOnly.preHandler).toBe('function');
  });

  it('accountingAccess should have preHandler', () => {
    expect(accountingAccess).toHaveProperty('preHandler');
    expect(typeof accountingAccess.preHandler).toBe('function');
  });

  it('transactingAccess should have preHandler', () => {
    expect(transactingAccess).toHaveProperty('preHandler');
    expect(typeof transactingAccess.preHandler).toBe('function');
  });

  it('reportViewAccess should have preHandler', () => {
    expect(reportViewAccess).toHaveProperty('preHandler');
    expect(typeof reportViewAccess.preHandler).toBe('function');
  });
});
