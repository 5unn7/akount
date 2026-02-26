import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountService, getDefaultGLAccountForType } from '../account.service';
import {
  mockPrisma,
  rewirePrismaMock,
  mockAccount as createMockAccount,
  TEST_IDS,
} from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TENANT_ID = TEST_IDS.TENANT_ID;

function mockAccount(overrides: Record<string, unknown> = {}) {
  return createMockAccount({
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    country: 'US',
    currentBalance: 100000,
    isActive: true,
    entityId: 'entity-1',
    entity: { id: 'entity-1', name: 'My Company', type: 'LLC' },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new AccountService(TENANT_ID);
  });

  describe('listAccounts', () => {
    it('should fetch limit+1 records to determine hasMore', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ limit: 10 });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.take).toBe(11); // limit + 1
    });

    it('should return hasMore=true when extra record exists', async () => {
      const accounts = Array.from({ length: 11 }, (_, i) =>
        mockAccount({ id: `acc-${i}`, name: `Account ${i}` })
      );
      mockPrisma.account.findMany.mockResolvedValueOnce(accounts);

      const result = await service.listAccounts({ limit: 10 });

      expect(result.hasMore).toBe(true);
      expect(result.accounts).toHaveLength(10);
      expect(result.nextCursor).toBe('acc-9');
    });

    it('should return hasMore=false when fewer results than limit', async () => {
      const accounts = [mockAccount({ id: 'acc-1' }), mockAccount({ id: 'acc-2' })];
      mockPrisma.account.findMany.mockResolvedValueOnce(accounts);

      const result = await service.listAccounts({ limit: 10 });

      expect(result.hasMore).toBe(false);
      expect(result.accounts).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should pass cursor and skip:1 to Prisma', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ cursor: 'cursor-abc', limit: 10 });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.cursor).toEqual({ id: 'cursor-abc' });
      expect(callArgs.skip).toBe(1);
    });

    it('should not include cursor/skip when cursor is not provided', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ limit: 10 });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.cursor).toBeUndefined();
      expect(callArgs.skip).toBeUndefined();
    });

    it('should cap limit at MAX_PAGE_SIZE (100)', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ limit: 500 });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.take).toBe(101); // 100 + 1
    });

    it('should default to DEFAULT_PAGE_SIZE (50) when no limit', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({});

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.take).toBe(51); // 50 + 1
    });

    it('should always include tenantId in where clause', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({});

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.entity).toHaveProperty('tenantId', TENANT_ID);
    });

    it('should always filter soft-deleted records', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({});

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should pass entityId filter when provided', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ entityId: 'entity-xyz' });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual(
        expect.objectContaining({
          tenantId: TENANT_ID,
          id: 'entity-xyz',
        })
      );
    });

    it('should pass type filter when provided', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ type: 'BANK' });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('type', 'BANK');
    });

    it('should pass isActive filter when provided', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await service.listAccounts({ isActive: false });

      const callArgs = mockPrisma.account.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('isActive', false);
    });
  });

  describe('getAccount', () => {
    it('should find account by id with tenant isolation and soft-delete filter', async () => {
      const account = mockAccount({ id: 'acc-xyz' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);

      const result = await service.getAccount('acc-xyz');

      expect(result).toEqual(account);
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'acc-xyz',
          deletedAt: null,
          entity: { tenantId: TENANT_ID },
        },
        include: {
          entity: true,
          glAccount: { select: { id: true, code: true, name: true } },
        },
      });
    });

    it('should return null when account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      const result = await service.getAccount('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createAccount', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      const entity = { id: 'entity-1', tenantId: TENANT_ID, name: 'Corp' };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);
      mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-1' });
      mockPrisma.account.create.mockResolvedValueOnce(mockAccount({ entityId: 'entity-1' }));

      await service.createAccount('user-1', {
        entityId: 'entity-1',
        name: 'New Account',
        type: 'BANK',
        currency: 'USD',
        country: 'US',
      });

      expect(mockPrisma.entity.findFirst).toHaveBeenCalledWith({
        where: { id: 'entity-1', tenantId: TENANT_ID },
      });
    });

    it('should throw if entity does not belong to tenant', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce(null);

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

    it('should set currentBalance to 0 when no opening balance', async () => {
      const entity = { id: 'entity-1', tenantId: TENANT_ID };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);
      mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-1' });
      mockPrisma.account.create.mockResolvedValueOnce(mockAccount());

      await service.createAccount('user-1', {
        entityId: 'entity-1',
        name: 'New Account',
        type: 'BANK',
        currency: 'USD',
        country: 'US',
      });

      const createArgs = mockPrisma.account.create.mock.calls[0][0]!;
      expect(createArgs.data.currentBalance).toBe(0);
    });

    it('should set currentBalance to openingBalance when provided', async () => {
      const entity = { id: 'entity-1', tenantId: TENANT_ID };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);
      mockPrisma.gLAccount.findFirst.mockResolvedValueOnce(null);
      mockPrisma.account.create.mockResolvedValueOnce(mockAccount({ currentBalance: 150000 }));

      await service.createAccount('user-1', {
        entityId: 'entity-1',
        name: 'New Account',
        type: 'BANK',
        currency: 'USD',
        country: 'US',
        openingBalance: 150000,
      });

      const createArgs = mockPrisma.account.create.mock.calls[0][0]!;
      expect(createArgs.data.currentBalance).toBe(150000);
    });

    it('should auto-assign GL account based on account type', async () => {
      const entity = { id: 'entity-1', tenantId: TENANT_ID };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);
      mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-bank-1100' });
      mockPrisma.account.create.mockResolvedValueOnce(mockAccount());

      await service.createAccount('user-1', {
        entityId: 'entity-1',
        name: 'New Account',
        type: 'BANK',
        currency: 'USD',
        country: 'US',
      });

      const createArgs = mockPrisma.account.create.mock.calls[0][0]!;
      expect(createArgs.data.glAccountId).toBe('gl-bank-1100');
    });
  });

  describe('updateAccount', () => {
    it('should return null when account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      const result = await service.updateAccount('nonexistent', { name: 'New Name' });

      expect(result).toBeNull();
      expect(mockPrisma.account.update).not.toHaveBeenCalled();
    });

    it('should update account when found with tenant isolation and deletedAt filter', async () => {
      const existing = mockAccount({ id: 'acc-1' });
      const updated = mockAccount({ id: 'acc-1', name: 'Updated Name' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.update.mockResolvedValueOnce(updated);

      const result = await service.updateAccount('acc-1', { name: 'Updated Name' });

      expect(result).toEqual(updated);
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-1', deletedAt: null, entity: { tenantId: TENANT_ID } },
      });
      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { name: 'Updated Name' },
        include: { entity: true },
      });
    });

    it('should only include provided fields in update', async () => {
      const existing = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.update.mockResolvedValueOnce(existing);

      await service.updateAccount('acc-1', { isActive: false });

      const updateArgs = mockPrisma.account.update.mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({ isActive: false });
    });
  });

  describe('softDeleteAccount', () => {
    it('should return null when account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      const result = await service.softDeleteAccount('nonexistent');

      expect(result).toBeNull();
      expect(mockPrisma.account.update).not.toHaveBeenCalled();
    });

    it('should set deletedAt and isActive=false', async () => {
      const existing = mockAccount({ id: 'acc-1' });
      const deleted = mockAccount({ id: 'acc-1', deletedAt: new Date(), isActive: false });
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.update.mockResolvedValueOnce(deleted);

      const result = await service.softDeleteAccount('acc-1');

      expect(result).toEqual(deleted);
      const updateArgs = mockPrisma.account.update.mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(updateArgs.data).toHaveProperty('isActive', false);
    });

    it('should verify tenant isolation and deletedAt filter before deleting', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      await service.softDeleteAccount('acc-other-tenant');

      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-other-tenant', deletedAt: null, entity: { tenantId: TENANT_ID } },
      });
    });
  });

  describe('getAccountTransactions', () => {
    function mockTransaction(overrides: Record<string, unknown> = {}) {
      return {
        id: 'txn-1',
        accountId: 'acc-1',
        date: new Date('2024-01-01'),
        description: 'Transaction',
        amount: 5000,
        currency: 'USD',
        sourceType: 'MANUAL',
        sourceId: null,
        categoryId: null,
        notes: null,
        journalEntryId: null,
        isStaged: false,
        isSplit: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        importBatchId: null,
        ...overrides,
      };
    }

    it('should return null if account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      const result = await service.getAccountTransactions('nonexistent');

      expect(result).toBeNull();
      expect(mockPrisma.transaction.findMany).not.toHaveBeenCalled();
    });

    it('should calculate running balance correctly', async () => {
      const account = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);

      const transactions = [
        mockTransaction({ id: 'txn-1', amount: 10000, date: new Date('2024-01-01') }),
        mockTransaction({ id: 'txn-2', amount: -2500, date: new Date('2024-01-02') }),
        mockTransaction({ id: 'txn-3', amount: 5000, date: new Date('2024-01-03') }),
      ];
      mockPrisma.transaction.findMany.mockResolvedValueOnce(transactions);

      const result = await service.getAccountTransactions('acc-1');

      expect(result).not.toBeNull();
      expect(result!.transactions).toHaveLength(3);
      expect(result!.transactions[0].runningBalance).toBe(10000);
      expect(result!.transactions[1].runningBalance).toBe(7500);
      expect(result!.transactions[2].runningBalance).toBe(12500);
    });

    it('should order transactions by date ascending', async () => {
      const account = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

      await service.getAccountTransactions('acc-1');

      const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual([{ date: 'asc' }, { createdAt: 'asc' }]);
    });

    it('should filter by date range', async () => {
      const account = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await service.getAccountTransactions('acc-1', { startDate, endDate });

      const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toMatchObject({
        accountId: 'acc-1',
        deletedAt: null,
        date: { gte: startDate, lte: endDate },
      });
    });

    it('should support pagination with cursor', async () => {
      const account = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

      await service.getAccountTransactions('acc-1', { cursor: 'cursor-123', limit: 10 });

      const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0]!;
      expect(callArgs.take).toBe(11);
      expect(callArgs.cursor).toEqual({ id: 'cursor-123' });
      expect(callArgs.skip).toBe(1);
    });

    it('should return hasMore=true when extra record exists', async () => {
      const account = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);

      const transactions = Array.from({ length: 11 }, (_, i) =>
        mockTransaction({ id: `txn-${i}`, amount: 1000 * (i + 1) })
      );
      mockPrisma.transaction.findMany.mockResolvedValueOnce(transactions);

      const result = await service.getAccountTransactions('acc-1', { limit: 10 });

      expect(result!.hasMore).toBe(true);
      expect(result!.transactions).toHaveLength(10);
      expect(result!.nextCursor).toBe('txn-9');
    });

    it('should filter out soft-deleted transactions', async () => {
      const account = mockAccount({ id: 'acc-1' });
      mockPrisma.account.findFirst.mockResolvedValueOnce(account);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

      await service.getAccountTransactions('acc-1');

      const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toMatchObject({
        accountId: 'acc-1',
        deletedAt: null,
      });
    });
  });
});

describe('getDefaultGLAccountForType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  // Note: `mockPrisma as never` is needed here because getDefaultGLAccountForType
  // expects Prisma.TransactionClient, not our mock type. This is a legitimate
  // type narrowing (not a mock data cast) and will be addressed in Phase 5
  // with a typed transaction client mock.

  it('should return GL account ID for BANK type (code 1100)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-bank' });

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'BANK');

    expect(result).toBe('gl-bank');
    expect(mockPrisma.gLAccount.findFirst).toHaveBeenCalledWith({
      where: { entityId: 'entity-1', code: '1100', isActive: true },
      select: { id: true },
    });
  });

  it('should return GL account ID for CREDIT_CARD type (code 2100)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-cc' });

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'CREDIT_CARD');

    expect(result).toBe('gl-cc');
    expect(mockPrisma.gLAccount.findFirst).toHaveBeenCalledWith({
      where: { entityId: 'entity-1', code: '2100', isActive: true },
      select: { id: true },
    });
  });

  it('should return GL account ID for LOAN type (code 2500)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-loan' });

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'LOAN');

    expect(result).toBe('gl-loan');
    expect(mockPrisma.gLAccount.findFirst).toHaveBeenCalledWith({
      where: { entityId: 'entity-1', code: '2500', isActive: true },
      select: { id: true },
    });
  });

  it('should return GL account ID for MORTGAGE type (code 2500, same as LOAN)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-mortgage' });

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'MORTGAGE');

    expect(result).toBe('gl-mortgage');
    expect(mockPrisma.gLAccount.findFirst).toHaveBeenCalledWith({
      where: { entityId: 'entity-1', code: '2500', isActive: true },
      select: { id: true },
    });
  });

  it('should return GL account ID for INVESTMENT type (fallback to 1100)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-invest' });

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'INVESTMENT');

    expect(result).toBe('gl-invest');
    expect(mockPrisma.gLAccount.findFirst).toHaveBeenCalledWith({
      where: { entityId: 'entity-1', code: '1100', isActive: true },
      select: { id: true },
    });
  });

  it('should return GL account ID for OTHER type (fallback to 1100)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce({ id: 'gl-other' });

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'OTHER');

    expect(result).toBe('gl-other');
    expect(mockPrisma.gLAccount.findFirst).toHaveBeenCalledWith({
      where: { entityId: 'entity-1', code: '1100', isActive: true },
      select: { id: true },
    });
  });

  it('should return null when GL account not found (COA not seeded)', async () => {
    mockPrisma.gLAccount.findFirst.mockResolvedValueOnce(null);

    const result = await getDefaultGLAccountForType(mockPrisma as never, 'entity-1', 'BANK');

    expect(result).toBeNull();
  });
});
