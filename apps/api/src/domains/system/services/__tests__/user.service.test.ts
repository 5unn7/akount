import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService, UserNotFoundError, type UserDTO } from '../user.service';

// Mock Prisma
const mockFindUnique = vi.fn();
const mockCount = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

const CLERK_USER_ID = 'user_2abc123xyz';

function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'usr-1',
    clerkUserId: CLERK_USER_ID,
    email: 'test@example.com',
    name: 'John Doe',
    memberships: [
      {
        tenant: {
          id: 'tenant-1',
          name: 'Acme Corp',
        },
        role: 'OWNER',
      },
    ],
    ...overrides,
  };
}

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe('getUserByClerkId', () => {
    it('should return user with tenant memberships', async () => {
      const user = mockUser();
      mockFindUnique.mockResolvedValueOnce(user);

      const result = await service.getUserByClerkId(CLERK_USER_ID);

      expect(result).toMatchObject({
        id: 'usr-1',
        clerkUserId: CLERK_USER_ID,
        email: 'test@example.com',
        name: 'John Doe',
      });

      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0]).toEqual({
        id: 'tenant-1',
        name: 'Acme Corp',
        role: 'OWNER',
      });
    });

    it('should throw UserNotFoundError when user not found', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(service.getUserByClerkId(CLERK_USER_ID)).rejects.toThrow(UserNotFoundError);

      await expect(service.getUserByClerkId(CLERK_USER_ID)).rejects.toThrow(
        `User with Clerk ID ${CLERK_USER_ID} not found in database`
      );
    });

    it('should handle user with multiple tenant memberships', async () => {
      const user = mockUser({
        memberships: [
          {
            tenant: { id: 'tenant-1', name: 'Acme Corp' },
            role: 'OWNER',
          },
          {
            tenant: { id: 'tenant-2', name: 'Beta Inc' },
            role: 'ADMIN',
          },
          {
            tenant: { id: 'tenant-3', name: 'Gamma LLC' },
            role: 'MEMBER',
          },
        ],
      });

      mockFindUnique.mockResolvedValueOnce(user);

      const result = await service.getUserByClerkId(CLERK_USER_ID);

      expect(result.tenants).toHaveLength(3);
      expect(result.tenants[0].role).toBe('OWNER');
      expect(result.tenants[1].role).toBe('ADMIN');
      expect(result.tenants[2].role).toBe('MEMBER');
    });

    it('should handle user with no tenant memberships', async () => {
      const user = mockUser({
        memberships: [],
      });

      mockFindUnique.mockResolvedValueOnce(user);

      const result = await service.getUserByClerkId(CLERK_USER_ID);

      expect(result.tenants).toEqual([]);
      expect(result.id).toBe('usr-1');
    });

    it('should handle user with null name', async () => {
      const user = mockUser({
        name: null,
      });

      mockFindUnique.mockResolvedValueOnce(user);

      const result = await service.getUserByClerkId(CLERK_USER_ID);

      expect(result.name).toBe(null);
      expect(result.email).toBe('test@example.com');
    });

    it('should query by clerkUserId with correct includes', async () => {
      const user = mockUser();
      mockFindUnique.mockResolvedValueOnce(user);

      await service.getUserByClerkId(CLERK_USER_ID);

      // Verify query structure
      const queryArgs = mockFindUnique.mock.calls[0][0];
      expect(queryArgs.where.clerkUserId).toBe(CLERK_USER_ID);
      expect(queryArgs.include).toEqual({
        memberships: {
          include: {
            tenant: true,
          },
        },
      });
    });

    it('should map all tenant fields correctly', async () => {
      const user = mockUser({
        memberships: [
          {
            tenant: { id: 'tenant-abc', name: 'Test Tenant' },
            role: 'VIEWER',
          },
        ],
      });

      mockFindUnique.mockResolvedValueOnce(user);

      const result = await service.getUserByClerkId(CLERK_USER_ID);

      expect(result.tenants[0]).toEqual({
        id: 'tenant-abc',
        name: 'Test Tenant',
        role: 'VIEWER',
      });
    });

    it('should preserve tenant role values from database', async () => {
      const user = mockUser({
        memberships: [
          { tenant: { id: 't1', name: 'T1' }, role: 'OWNER' },
          { tenant: { id: 't2', name: 'T2' }, role: 'ADMIN' },
          { tenant: { id: 't3', name: 'T3' }, role: 'MEMBER' },
          { tenant: { id: 't4', name: 'T4' }, role: 'VIEWER' },
        ],
      });

      mockFindUnique.mockResolvedValueOnce(user);

      const result = await service.getUserByClerkId(CLERK_USER_ID);

      expect(result.tenants.map((t) => t.role)).toEqual(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      mockCount.mockResolvedValueOnce(1);

      const result = await service.userExists(CLERK_USER_ID);

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockCount.mockResolvedValueOnce(0);

      const result = await service.userExists(CLERK_USER_ID);

      expect(result).toBe(false);
    });

    it('should query by clerkUserId', async () => {
      mockCount.mockResolvedValueOnce(1);

      await service.userExists(CLERK_USER_ID);

      const queryArgs = mockCount.mock.calls[0][0];
      expect(queryArgs.where.clerkUserId).toBe(CLERK_USER_ID);
    });

    it('should return false for empty result (defensive)', async () => {
      mockCount.mockResolvedValueOnce(0);

      const result = await service.userExists('user_nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('UserNotFoundError', () => {
    it('should have correct error message and name', () => {
      const error = new UserNotFoundError('user_123');

      expect(error.message).toBe('User with Clerk ID user_123 not found in database');
      expect(error.name).toBe('UserNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
