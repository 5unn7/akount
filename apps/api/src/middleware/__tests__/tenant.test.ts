import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantMiddleware, requireTenantId } from '../tenant';
import { mockPrisma } from '../../test-utils';

// Mock @akount/db with dynamic import pattern
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../test-utils/prisma-mock')).mockPrisma,
}));

function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user_clerk123',
    tenantId: undefined as string | undefined,
    tenantRole: undefined as string | undefined,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
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

describe('tenantMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when userId is missing', async () => {
    const request = createMockRequest({ userId: undefined });
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  });

  it('should return 403 when user has no tenant membership', async () => {
    mockPrisma.tenantUser.findFirst.mockResolvedValueOnce(null);
    const request = createMockRequest();
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'No tenant access',
      message: 'User is not associated with any tenant',
    });
  });

  it('should set tenantId and tenantRole on success', async () => {
    mockPrisma.tenantUser.findFirst.mockResolvedValueOnce({
      tenantId: 'tenant-abc',
      role: 'OWNER',
    });
    const request = createMockRequest();
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(request.tenantId).toBe('tenant-abc');
    expect(request.tenantRole).toBe('OWNER');
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should query by clerkUserId from request.userId', async () => {
    mockPrisma.tenantUser.findFirst.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      role: 'ADMIN',
    });
    const request = createMockRequest({ userId: 'user_specific' });
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(mockPrisma.tenantUser.findFirst).toHaveBeenCalledWith({
      where: {
        user: { clerkUserId: 'user_specific' },
      },
      select: {
        tenantId: true,
        role: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  });

  it('should select oldest tenant (orderBy createdAt asc)', async () => {
    mockPrisma.tenantUser.findFirst.mockResolvedValueOnce({
      tenantId: 'oldest-tenant',
      role: 'VIEWER',
    });
    const request = createMockRequest();
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    const callArgs = mockPrisma.tenantUser.findFirst.mock.calls[0][0];
    expect(callArgs?.orderBy).toEqual({ createdAt: 'asc' });
  });

  it('should return 500 when Prisma query fails', async () => {
    mockPrisma.tenantUser.findFirst.mockRejectedValueOnce(new Error('DB connection failed'));
    const request = createMockRequest();
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant information',
    });
  });

  it('should log error with userId on Prisma failure', async () => {
    mockPrisma.tenantUser.findFirst.mockRejectedValueOnce(new Error('timeout'));
    const request = createMockRequest({ userId: 'user_fail' });
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(request.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_fail' }),
      'Error fetching tenant membership'
    );
  });

  it('should log tenant context at debug level on success', async () => {
    mockPrisma.tenantUser.findFirst.mockResolvedValueOnce({
      tenantId: 'tenant-debug',
      role: 'ACCOUNTANT',
    });
    const request = createMockRequest({ userId: 'user_debug' });
    const reply = createMockReply();

    await tenantMiddleware(request as never, reply as never);

    expect(request.log.debug).toHaveBeenCalledWith(
      { userId: 'user_debug', tenantId: 'tenant-debug', role: 'ACCOUNTANT' },
      'Tenant context attached to request'
    );
  });

  it('should handle all 4 DB roles', async () => {
    const roles = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'] as const;

    for (const role of roles) {
      vi.clearAllMocks();
      mockPrisma.tenantUser.findFirst.mockResolvedValueOnce({
        tenantId: 'tenant-1',
        role,
      });
      const request = createMockRequest();
      const reply = createMockReply();

      await tenantMiddleware(request as never, reply as never);

      expect(request.tenantRole).toBe(role);
    }
  });
});

describe('requireTenantId', () => {
  it('should return tenantId when present', () => {
    const request = createMockRequest({ tenantId: 'tenant-xyz' });
    const result = requireTenantId(request as never);
    expect(result).toBe('tenant-xyz');
  });

  it('should throw when tenantId is missing', () => {
    const request = createMockRequest({ tenantId: undefined });
    expect(() => requireTenantId(request as never)).toThrow('Tenant context missing from request');
  });

  it('should log critical error when tenantId is missing', () => {
    const request = createMockRequest({ tenantId: undefined, userId: 'user_bad' });

    try {
      requireTenantId(request as never);
    } catch {
      // Expected
    }

    expect(request.log.error).toHaveBeenCalledWith(
      { userId: 'user_bad' },
      expect.stringContaining('CRITICAL')
    );
  });
});
