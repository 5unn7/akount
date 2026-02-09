import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountService } from '../account.service';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    account: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    entity: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-abc-123';

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    country: 'US',
    currentBalance: 100000,
    isActive: true,
    deletedAt: null,
    entityId: 'entity-1',
    entity: { id: 'entity-1', name: 'My Company', type: 'LLC' },
    ...overrides,
  };
}

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccountService(TENANT_ID);
  });

  describe('listAccounts', () => {
    it('should fetch limit+1 records to determine hasMore', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ limit: 10 });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.take).toBe(11); // limit + 1
    });

    it('should return hasMore=true when extra record exists', async () => {
      // Return 11 records for limit of 10
      const accounts = Array.from({ length: 11 }, (_, i) =>
        mockAccount({ id: `acc-${i}`, name: `Account ${i}` })
      );

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);

      const result = await service.listAccounts({ limit: 10 });

      expect(result.hasMore).toBe(true);
      expect(result.accounts).toHaveLength(10); // Trimmed to limit
      expect(result.nextCursor).toBe('acc-9'); // Last returned record
    });

    it('should return hasMore=false when fewer results than limit', async () => {
      const accounts = [mockAccount({ id: 'acc-1' }), mockAccount({ id: 'acc-2' })];

      vi.mocked(prisma.account.findMany).mockResolvedValueOnce(accounts as never);

      const result = await service.listAccounts({ limit: 10 });

      expect(result.hasMore).toBe(false);
      expect(result.accounts).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should pass cursor and skip:1 to Prisma', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ cursor: 'cursor-abc', limit: 10 });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.cursor).toEqual({ id: 'cursor-abc' });
      expect(callArgs.skip).toBe(1);
    });

    it('should not include cursor/skip when cursor is not provided', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ limit: 10 });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.cursor).toBeUndefined();
      expect(callArgs.skip).toBeUndefined();
    });

    it('should cap limit at MAX_PAGE_SIZE (100)', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ limit: 500 });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.take).toBe(101); // 100 + 1
    });

    it('should default to DEFAULT_PAGE_SIZE (50) when no limit', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({});

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.take).toBe(51); // 50 + 1
    });

    it('should always include tenantId in where clause', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({});

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.entity).toHaveProperty('tenantId', TENANT_ID);
    });

    it('should always filter soft-deleted records', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({});

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should pass entityId filter when provided', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ entityId: 'entity-xyz' });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual(
        expect.objectContaining({
          tenantId: TENANT_ID,
          id: 'entity-xyz',
        })
      );
    });

    it('should pass type filter when provided', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ type: 'BANK' });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('type', 'BANK');
    });

    it('should pass isActive filter when provided', async () => {
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([] as never);

      await service.listAccounts({ isActive: false });

      const callArgs = vi.mocked(prisma.account.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('isActive', false);
    });
  });

  describe('getAccount', () => {
    it('should find account by id with tenant isolation', async () => {
      const account = mockAccount({ id: 'acc-xyz' });
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(account as never);

      const result = await service.getAccount('acc-xyz');

      expect(result).toEqual(account);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'acc-xyz',
          entity: {
            tenantId: TENANT_ID,
          },
        },
        include: {
          entity: true,
        },
      });
    });

    it('should return null when account not found', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getAccount('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createAccount', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      const entity = { id: 'entity-1', tenantId: TENANT_ID, name: 'Corp' };
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.account.create).mockResolvedValueOnce(
        mockAccount({ entityId: 'entity-1' }) as never
      );

      await service.createAccount('user-1', {
        entityId: 'entity-1',
        name: 'New Account',
        type: 'BANK',
        currency: 'USD',
        country: 'US',
      });

      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entity-1',
          tenantId: TENANT_ID,
        },
      });
    });

    it('should throw if entity does not belong to tenant', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        service.createAccount('user-1', {
          entityId: 'entity-other',
          name: 'Sneaky Account',
          type: 'BANK',
          currency: 'USD',
          country: 'US',
        })
      ).rejects.toThrow('Entity not found or access denied');
    });

    it('should set currentBalance to 0 on new account', async () => {
      const entity = { id: 'entity-1', tenantId: TENANT_ID };
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.account.create).mockResolvedValueOnce(mockAccount() as never);

      await service.createAccount('user-1', {
        entityId: 'entity-1',
        name: 'New Account',
        type: 'BANK',
        currency: 'USD',
        country: 'US',
      });

      const createArgs = vi.mocked(prisma.account.create).mock.calls[0][0]!;
      expect(createArgs.data.currentBalance).toBe(0);
    });
  });
});
