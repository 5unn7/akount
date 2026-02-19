import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from '../transaction.service';

vi.mock('@akount/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-123';
const ACCOUNT_ID = 'acc-xyz-789';
const ENTITY_ID = 'entity-123';

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    accountId: ACCOUNT_ID,
    date: new Date('2024-01-15'),
    description: 'Coffee shop purchase',
    amount: 550, // $5.50 in cents
    currency: 'CAD',
    sourceType: 'MANUAL',
    sourceId: null,
    categoryId: null,
    notes: null,
    journalEntryId: null,
    isStaged: false,
    isSplit: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    deletedAt: null,
    importBatchId: null,
    account: {
      id: ACCOUNT_ID,
      entityId: ENTITY_ID,
      entity: {
        id: ENTITY_ID,
        tenantId: TENANT_ID,
      },
    },
    ...overrides,
  };
}

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: ACCOUNT_ID,
    name: 'Business Checking',
    type: 'BANK',
    currency: 'CAD',
    entityId: ENTITY_ID,
    entity: {
      id: ENTITY_ID,
      tenantId: TENANT_ID,
    },
    deletedAt: null,
    ...overrides,
  };
}

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransactionService(TENANT_ID, USER_ID);
  });

  describe('listTransactions', () => {
    it('should fetch limit+1 records to determine hasMore', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({ limit: 10 });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.take).toBe(11); // limit + 1
    });

    it('should return hasMore=true when extra record exists', async () => {
      // Return 11 records for limit of 10
      const transactions = Array.from({ length: 11 }, (_, i) =>
        mockTransaction({ id: `txn-${i}`, description: `Transaction ${i}` })
      );

      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce(transactions as never);

      const result = await service.listTransactions({ limit: 10 });

      expect(result.hasMore).toBe(true);
      expect(result.transactions).toHaveLength(10); // Trimmed to limit
      expect(result.nextCursor).toBe('txn-9'); // Last returned record
    });

    it('should return hasMore=false when fewer results than limit', async () => {
      const transactions = [
        mockTransaction({ id: 'txn-1' }),
        mockTransaction({ id: 'txn-2' }),
      ];

      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce(transactions as never);

      const result = await service.listTransactions({ limit: 10 });

      expect(result.hasMore).toBe(false);
      expect(result.transactions).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should filter by cursor using id lt (before cursor)', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({ cursor: 'cursor-abc', limit: 10 });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ lt: 'cursor-abc' });
    });

    it('should not include id filter when cursor is not provided', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({ limit: 10 });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.id).toBeUndefined();
    });

    it('should cap limit at MAX_PAGE_SIZE (100)', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({ limit: 500 });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.take).toBe(101); // 100 + 1
    });

    it('should default to DEFAULT_PAGE_SIZE (50) when no limit', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({});

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.take).toBe(51); // 50 + 1
    });

    it('should always filter by tenant via account.entity.tenantId', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({});

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.account!.entity).toHaveProperty('tenantId', TENANT_ID);
    });

    it('should always filter soft-deleted records', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({});

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should filter by accountId when provided', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({ accountId: 'acc-specific' });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.account).toEqual({
        id: 'acc-specific',
        entity: { tenantId: TENANT_ID },
      });
    });

    it('should filter by categoryId when provided', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({ categoryId: 'cat-food' });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('categoryId', 'cat-food');
    });

    it('should filter by date range when startDate and endDate provided', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';

      await service.listTransactions({ startDate, endDate });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.date).toEqual({
        gte: new Date(startDate),
        lte: new Date(endDate),
      });
    });

    it('should filter by startDate only when endDate not provided', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      const startDate = '2024-01-01T00:00:00.000Z';

      await service.listTransactions({ startDate });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.date).toEqual({
        gte: new Date(startDate),
      });
    });

    it('should filter by endDate only when startDate not provided', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      const endDate = '2024-01-31T23:59:59.999Z';

      await service.listTransactions({ endDate });

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.date).toEqual({
        lte: new Date(endDate),
      });
    });

    it('should order transactions by date descending (newest first)', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({});

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ date: 'desc' });
    });

    it('should include account and category with select fields', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([] as never);

      await service.listTransactions({});

      const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0]!;
      expect(callArgs.include).toEqual({
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        matches: {
          select: {
            id: true,
            status: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      });
    });
  });

  describe('getTransaction', () => {
    it('should find transaction by id with tenant isolation and soft-delete filter', async () => {
      const transaction = mockTransaction({ id: 'txn-xyz' });
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(transaction as never);

      const result = await service.getTransaction('txn-xyz');

      expect(result).toEqual(transaction);
      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'txn-xyz',
          deletedAt: null,
          account: {
            entity: {
              tenantId: TENANT_ID,
            },
          },
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              entity: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });
    });

    it('should return null when transaction not found', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getTransaction('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when transaction belongs to different tenant', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getTransaction('txn-other-tenant');

      expect(result).toBeNull();
      expect(prisma.transaction.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: { entity: { tenantId: TENANT_ID } },
          }),
        })
      );
    });

    it('should return null when transaction is soft-deleted', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      await service.getTransaction('txn-deleted');

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe('createTransaction', () => {
    const validInput = {
      accountId: ACCOUNT_ID,
      date: '2024-01-15T10:30:00.000Z',
      description: 'Office supplies',
      amount: 2499, // $24.99
      currency: 'CAD',
      sourceType: 'MANUAL' as const,
    };

    it('should verify account belongs to tenant before creating', async () => {
      const account = mockAccount({ id: ACCOUNT_ID });
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(account as never);
      vi.mocked(prisma.transaction.create).mockResolvedValueOnce(mockTransaction() as never);

      await service.createTransaction(validInput);

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          id: ACCOUNT_ID,
          deletedAt: null,
          entity: {
            tenantId: TENANT_ID,
          },
        },
        select: {
          id: true,
          entityId: true,
        },
      });
    });

    it('should throw if account does not belong to tenant', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        service.createTransaction({
          ...validInput,
          accountId: 'acc-other-tenant',
        })
      ).rejects.toThrow('Account not found');
    });

    it('should throw if account is soft-deleted', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.createTransaction(validInput)).rejects.toThrow(
        'not found'
      );
    });

    it('should create transaction with all provided fields', async () => {
      const account = mockAccount({ id: ACCOUNT_ID });
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(account as never);
      vi.mocked(prisma.transaction.create).mockResolvedValueOnce(mockTransaction() as never);

      const fullInput = {
        ...validInput,
        categoryId: 'cat-office',
        notes: 'Monthly office supplies purchase',
        sourceId: 'inv-123',
      };

      await service.createTransaction(fullInput);

      const createArgs = vi.mocked(prisma.transaction.create).mock.calls[0][0]!;
      expect(createArgs.data).toMatchObject({
        accountId: ACCOUNT_ID,
        date: new Date('2024-01-15T10:30:00.000Z'),
        description: 'Office supplies',
        amount: 2499,
        currency: 'CAD',
        sourceType: 'MANUAL',
        categoryId: 'cat-office',
        notes: 'Monthly office supplies purchase',
        sourceId: 'inv-123',
      });
    });

    it('should pass through optional fields as undefined when not provided', async () => {
      const account = mockAccount({ id: ACCOUNT_ID });
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(account as never);
      vi.mocked(prisma.transaction.create).mockResolvedValueOnce(mockTransaction() as never);

      await service.createTransaction(validInput);

      const createArgs = vi.mocked(prisma.transaction.create).mock.calls[0][0]!;
      expect(createArgs.data).toMatchObject({
        categoryId: undefined,
        notes: undefined,
        sourceId: undefined,
      });
    });

    it('should return created transaction with account and category select', async () => {
      const account = mockAccount({ id: ACCOUNT_ID });
      const created = mockTransaction({ id: 'txn-new', description: 'New transaction' });
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(account as never);
      vi.mocked(prisma.transaction.create).mockResolvedValueOnce(created as never);

      const result = await service.createTransaction(validInput);

      expect(result).toEqual(created);
      const createArgs = vi.mocked(prisma.transaction.create).mock.calls[0][0]!;
      expect(createArgs.include).toEqual({
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        matches: {
          select: {
            id: true,
            status: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      });
    });
  });

  describe('updateTransaction', () => {
    const updateData = {
      description: 'Updated description',
      categoryId: 'cat-new',
      notes: 'Updated notes',
    };

    it('should throw when transaction not found', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.updateTransaction('nonexistent', updateData)).rejects.toThrow(
        'Transaction not found'
      );

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('should update transaction when found', async () => {
      const existing = mockTransaction({ id: 'txn-1' });
      const updated = mockTransaction({ id: 'txn-1', description: 'Updated description' });

      // First call for getTransaction check
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(existing as never);
      // Second call returns updated transaction
      vi.mocked(prisma.transaction.update).mockResolvedValueOnce(updated as never);

      const result = await service.updateTransaction('txn-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-1' },
        data: {
          description: 'Updated description',
          categoryId: 'cat-new',
          notes: 'Updated notes',
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          matches: {
            select: {
              id: true,
              status: true,
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    it('should only include provided fields in update', async () => {
      const existing = mockTransaction({ id: 'txn-1' });
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.transaction.update).mockResolvedValueOnce(existing as never);

      await service.updateTransaction('txn-1', { description: 'Only description' });

      const updateArgs = vi.mocked(prisma.transaction.update).mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        description: 'Only description',
        categoryId: undefined,
        notes: undefined,
      });
    });

    it('should allow setting categoryId to null', async () => {
      const existing = mockTransaction({ id: 'txn-1' });
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.transaction.update).mockResolvedValueOnce(existing as never);

      await service.updateTransaction('txn-1', { categoryId: null });

      const updateArgs = vi.mocked(prisma.transaction.update).mock.calls[0][0]!;
      expect(updateArgs.data.categoryId).toBeNull();
    });

    it('should allow setting notes to null', async () => {
      const existing = mockTransaction({ id: 'txn-1' });
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.transaction.update).mockResolvedValueOnce(existing as never);

      await service.updateTransaction('txn-1', { notes: null });

      const updateArgs = vi.mocked(prisma.transaction.update).mock.calls[0][0]!;
      expect(updateArgs.data.notes).toBeNull();
    });
  });

  describe('softDeleteTransaction', () => {
    it('should throw when transaction not found', async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.softDeleteTransaction('nonexistent')).rejects.toThrow(
        'Transaction not found'
      );

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('should set deletedAt timestamp', async () => {
      const existing = mockTransaction({ id: 'txn-1' });
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.transaction.update).mockResolvedValueOnce({} as never);

      await service.softDeleteTransaction('txn-1');

      const updateArgs = vi.mocked(prisma.transaction.update).mock.calls[0][0]!;
      expect(updateArgs.where).toEqual({ id: 'txn-1' });
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw when transaction belongs to different tenant', async () => {
      // getTransaction returns null for other tenant's transaction
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.softDeleteTransaction('txn-other-tenant')).rejects.toThrow(
        'Transaction not found'
      );

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('should throw when transaction already deleted', async () => {
      // Transaction with deletedAt will not be found due to filter in getTransaction
      vi.mocked(prisma.transaction.findFirst).mockResolvedValueOnce(null as never);

      await expect(service.softDeleteTransaction('txn-deleted')).rejects.toThrow(
        'Transaction not found'
      );

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });
  });
});
