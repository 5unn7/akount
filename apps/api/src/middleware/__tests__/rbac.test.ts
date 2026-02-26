import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRolePermission, requirePermission, requireRole } from '../rbac';

// Mock @akount/types
vi.mock('@akount/types', () => ({
  getRolesWithAccess: vi.fn(),
}));

// Mock @akount/db (for TenantUserRole type — re-export real enum)
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
}));

import { getRolesWithAccess } from '@akount/types';

const mockGetRolesWithAccess = vi.mocked(getRolesWithAccess);

function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user_123',
    tenantId: 'tenant-abc',
    tenantRole: 'OWNER',
    log: {
      warn: vi.fn(),
      debug: vi.fn(),
    },
    ...overrides,
  };
}

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe('withRolePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when tenantRole is missing', async () => {
    const request = createMockRequest({ tenantRole: undefined });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER']);
    await middleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Tenant role not found',
    });
  });

  it('should return 403 when role is not in allowed list', async () => {
    const request = createMockRequest({ tenantRole: 'VIEWER' });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER', 'ADMIN']);
    await middleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Insufficient permissions for this operation',
    });
  });

  it('should pass when role is OWNER and OWNER is allowed', async () => {
    const request = createMockRequest({ tenantRole: 'OWNER' });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER', 'ADMIN']);
    await middleware(request as never, reply as never);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should pass when role is ADMIN and ADMIN is allowed', async () => {
    const request = createMockRequest({ tenantRole: 'ADMIN' });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']);
    await middleware(request as never, reply as never);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should pass when role is ACCOUNTANT and ACCOUNTANT is allowed', async () => {
    const request = createMockRequest({ tenantRole: 'ACCOUNTANT' });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']);
    await middleware(request as never, reply as never);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should pass when role is VIEWER and VIEWER is allowed', async () => {
    const request = createMockRequest({ tenantRole: 'VIEWER' });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER']);
    await middleware(request as never, reply as never);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should log access denied with context', async () => {
    const request = createMockRequest({
      userId: 'user_denied',
      tenantId: 'tenant-xyz',
      tenantRole: 'VIEWER',
    });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER']);
    await middleware(request as never, reply as never);

    expect(request.log.warn).toHaveBeenCalledWith(
      {
        userId: 'user_denied',
        tenantId: 'tenant-xyz',
        role: 'VIEWER',
        allowedRoles: ['OWNER'],
      },
      'Access denied: insufficient permissions'
    );
  });

  it('should log RBAC check passed at debug level', async () => {
    const request = createMockRequest({ tenantRole: 'OWNER' });
    const reply = createMockReply();

    const middleware = withRolePermission(['OWNER']);
    await middleware(request as never, reply as never);

    expect(request.log.debug).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'OWNER' }),
      'RBAC check passed'
    );
  });
});

describe('requirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use PERMISSION_MATRIX to determine allowed roles', async () => {
    mockGetRolesWithAccess.mockReturnValueOnce(['OWNER', 'ADMIN', 'ACCOUNTANT']);
    const request = createMockRequest({ tenantRole: 'ACCOUNTANT' });
    const reply = createMockReply();

    const middleware = requirePermission('accounting', 'journal-entries', 'ACT');
    await middleware(request as never, reply as never);

    expect(mockGetRolesWithAccess).toHaveBeenCalledWith('accounting:journal-entries', 'ACT');
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should filter to DB-valid roles only (ignore non-DB roles)', async () => {
    // Matrix may return roles not in DB (e.g., 'MANAGER', 'BOOKKEEPER')
    mockGetRolesWithAccess.mockReturnValueOnce(['OWNER', 'ADMIN', 'MANAGER', 'BOOKKEEPER']);
    const request = createMockRequest({ tenantRole: 'ADMIN' });
    const reply = createMockReply();

    const middleware = requirePermission('banking', 'accounts', 'VIEW');
    await middleware(request as never, reply as never);

    // MANAGER and BOOKKEEPER are not in DB_ROLES set, so only OWNER + ADMIN are allowed
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should deny non-DB role users even if matrix includes them', async () => {
    // Only non-DB roles in matrix
    mockGetRolesWithAccess.mockReturnValueOnce(['MANAGER', 'BOOKKEEPER']);
    const request = createMockRequest({ tenantRole: 'VIEWER' });
    const reply = createMockReply();

    const middleware = requirePermission('system', 'settings', 'ADMIN');
    await middleware(request as never, reply as never);

    // Falls back to OWNER only when no DB roles match
    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('should fallback to OWNER-only when matrix returns empty', async () => {
    mockGetRolesWithAccess.mockReturnValueOnce([]);
    const request = createMockRequest({ tenantRole: 'OWNER' });
    const reply = createMockReply();

    const middleware = requirePermission('unknown', 'resource', 'VIEW');
    await middleware(request as never, reply as never);

    // OWNER should pass the fallback
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should deny non-OWNER when matrix returns empty', async () => {
    mockGetRolesWithAccess.mockReturnValueOnce([]);
    const request = createMockRequest({ tenantRole: 'ADMIN' });
    const reply = createMockReply();

    const middleware = requirePermission('unknown', 'resource', 'VIEW');
    await middleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate to withRolePermission', async () => {
    const request = createMockRequest({ tenantRole: 'ADMIN' });
    const reply = createMockReply();

    const middleware = requireRole(['OWNER', 'ADMIN']);
    await middleware(request as never, reply as never);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should deny roles not in the list', async () => {
    const request = createMockRequest({ tenantRole: 'VIEWER' });
    const reply = createMockReply();

    const middleware = requireRole(['OWNER']);
    await middleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(403);
  });
});
