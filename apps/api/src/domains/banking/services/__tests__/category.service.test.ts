import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService, DEFAULT_CATEGORIES } from '../category.service';

// Mock createAuditLog
const mockCreateAuditLog = vi.fn();
vi.mock('../../../../lib/audit', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

// Mock Prisma client
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockCreateMany = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockCount = vi.fn();
const mockTransaction = vi.fn();

const mockTransactionUpdateMany = vi.fn();
const mockBillLineUpdateMany = vi.fn();
const mockInvoiceLineUpdateMany = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      createMany: (...args: unknown[]) => mockCreateMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    transaction: {
      updateMany: (...args: unknown[]) => mockTransactionUpdateMany(...args),
    },
    billLine: {
      updateMany: (...args: unknown[]) => mockBillLineUpdateMany(...args),
    },
    invoiceLine: {
      updateMany: (...args: unknown[]) => mockInvoiceLineUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';

function mockCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    tenantId: TENANT_ID,
    name: 'Office Supplies',
    type: 'EXPENSE',
    parentCategoryId: null,
    color: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    childCategories: [],
    _count: {
      transactions: 0,
    },
    ...overrides,
  };
}

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoryService(TENANT_ID, USER_ID);
  });

  describe('listCategories', () => {
    it('should list categories filtered by tenantId', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Category A' }),
        mockCategory({ id: 'cat-2', name: 'Category B' }),
      ];

      mockFindMany.mockResolvedValueOnce(categories);

      const result = await service.listCategories();

      expect(result).toEqual(categories);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT_ID,
          deletedAt: null,
          parentCategoryId: null,
        },
        include: {
          childCategories: {
            where: { deletedAt: null },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              transactions: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
    });

    it('should exclude soft-deleted categories', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await service.listCategories();

      const callArgs = mockFindMany.mock.calls[0][0];
      expect(callArgs.where.deletedAt).toBe(null);
    });

    it('should filter by type when provided', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await service.listCategories({ type: 'INCOME' });

      const callArgs = mockFindMany.mock.calls[0][0];
      expect(callArgs.where.type).toBe('INCOME');
    });

    it('should filter by isActive when provided', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await service.listCategories({ isActive: false });

      const callArgs = mockFindMany.mock.calls[0][0];
      expect(callArgs.where.isActive).toBe(false);
    });

    it('should exclude parent categories by default', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await service.listCategories();

      const callArgs = mockFindMany.mock.calls[0][0];
      expect(callArgs.where.parentCategoryId).toBe(null);
    });

    it('should include child categories when includeChildren is true', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await service.listCategories({ includeChildren: true });

      const callArgs = mockFindMany.mock.calls[0][0];
      expect(callArgs.where.parentCategoryId).toBeUndefined();
    });

    it('should order by type then name', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      await service.listCategories();

      const callArgs = mockFindMany.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual([{ type: 'asc' }, { name: 'asc' }]);
    });
  });

  describe('getCategory', () => {
    it('should return category with children and counts', async () => {
      const category = mockCategory({
        id: 'cat-1',
        childCategories: [
          mockCategory({ id: 'cat-child-1', name: 'Subcategory' }),
        ],
        _count: { transactions: 15 },
      });

      mockFindFirst.mockResolvedValueOnce(category);

      const result = await service.getCategory('cat-1');

      expect(result).toEqual(category);
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'cat-1',
          tenantId: TENANT_ID,
          deletedAt: null,
        },
        include: {
          childCategories: {
            where: { deletedAt: null },
            orderBy: { name: 'asc' },
          },
          parentCategory: true,
          _count: {
            select: {
              transactions: { where: { deletedAt: null } },
            },
          },
        },
      });
    });

    it('should return null when category not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await service.getCategory('nonexistent');

      expect(result).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await service.getCategory('cat-other-tenant');

      const callArgs = mockFindFirst.mock.calls[0][0];
      expect(callArgs.where.tenantId).toBe(TENANT_ID);
    });
  });

  describe('createCategory', () => {
    it('should create category with required fields', async () => {
      const newCategory = mockCategory({ id: 'cat-new', name: 'New Category' });

      mockFindFirst.mockResolvedValueOnce(null); // No duplicate
      mockCreate.mockResolvedValueOnce(newCategory);

      const result = await service.createCategory({
        name: 'New Category',
        type: 'EXPENSE',
      });

      expect(result).toEqual(newCategory);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT_ID,
          name: 'New Category',
          type: 'EXPENSE',
          parentCategoryId: undefined,
          color: undefined,
        },
        include: {
          childCategories: {
            where: { deletedAt: null },
          },
          _count: {
            select: {
              transactions: { where: { deletedAt: null } },
            },
          },
        },
      });
    });

    it('should reject duplicate name within tenant+type', async () => {
      const existing = mockCategory({ name: 'Office Supplies', type: 'EXPENSE' });
      mockFindFirst.mockResolvedValueOnce(existing);

      await expect(
        service.createCategory({ name: 'Office Supplies', type: 'EXPENSE' })
      ).rejects.toThrow('Category "Office Supplies" already exists for type EXPENSE');
    });

    it('should allow same name for different type', async () => {
      mockFindFirst.mockResolvedValueOnce(null); // No duplicate check passes
      mockCreate.mockResolvedValueOnce(mockCategory({ name: 'Supplies', type: 'INCOME' }));

      await service.createCategory({ name: 'Supplies', type: 'INCOME' });

      const checkArgs = mockFindFirst.mock.calls[0][0];
      expect(checkArgs.where).toMatchObject({
        tenantId: TENANT_ID,
        name: 'Supplies',
        type: 'INCOME',
      });
    });

    it('should validate parent belongs to tenant', async () => {
      mockFindFirst.mockResolvedValueOnce(null); // Parent not found

      await expect(
        service.createCategory({
          name: 'Subcategory',
          type: 'EXPENSE',
          parentCategoryId: 'cat-other-tenant',
        })
      ).rejects.toThrow('Parent category not found');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'cat-other-tenant',
          tenantId: TENANT_ID,
          deletedAt: null,
        },
      });
    });

    it('should create category with parent when parent exists', async () => {
      const parent = mockCategory({ id: 'cat-parent' });
      mockFindFirst.mockResolvedValueOnce(parent); // Parent exists
      mockFindFirst.mockResolvedValueOnce(null); // No duplicate
      mockCreate.mockResolvedValueOnce(mockCategory({ parentCategoryId: 'cat-parent' }));

      await service.createCategory({
        name: 'Subcategory',
        type: 'EXPENSE',
        parentCategoryId: 'cat-parent',
      });

      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.data.parentCategoryId).toBe('cat-parent');
    });

    it('should create audit log after creation', async () => {
      mockFindFirst.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce(mockCategory({ id: 'cat-new' }));

      await service.createCategory({ name: 'New Category', type: 'EXPENSE' });

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: '',
        model: 'Category',
        recordId: 'cat-new',
        action: 'CREATE',
        after: { name: 'New Category', type: 'EXPENSE' },
      });
    });

    it('should include color when provided', async () => {
      mockFindFirst.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce(mockCategory({ color: '#FF0000' }));

      await service.createCategory({
        name: 'Test',
        type: 'EXPENSE',
        color: '#FF0000',
      });

      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.data.color).toBe('#FF0000');
    });
  });

  describe('updateCategory', () => {
    it('should update category when found', async () => {
      const existing = mockCategory({ id: 'cat-1', name: 'Old Name' });
      const updated = mockCategory({ id: 'cat-1', name: 'New Name' });

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(updated);

      const result = await service.updateCategory('cat-1', { name: 'New Name' });

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'New Name',
          type: undefined,
          parentCategoryId: undefined,
          color: undefined,
          isActive: undefined,
        },
        include: {
          childCategories: {
            where: { deletedAt: null },
          },
          _count: {
            select: {
              transactions: { where: { deletedAt: null } },
            },
          },
        },
      });
    });

    it('should throw when category not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateCategory('nonexistent', { name: 'New Name' })
      ).rejects.toThrow('Category not found');
    });

    it('should enforce tenant isolation', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateCategory('cat-other-tenant', { name: 'Hacked' })
      ).rejects.toThrow('Category not found');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'cat-other-tenant',
          tenantId: TENANT_ID,
          deletedAt: null,
        },
      });
    });

    it('should reject self-parent', async () => {
      const existing = mockCategory({ id: 'cat-1' });
      mockFindFirst.mockResolvedValueOnce(existing);

      await expect(
        service.updateCategory('cat-1', { parentCategoryId: 'cat-1' })
      ).rejects.toThrow('Category cannot be its own parent');
    });

    it('should validate parent exists and belongs to tenant', async () => {
      const existing = mockCategory({ id: 'cat-1' });
      mockFindFirst.mockResolvedValueOnce(existing); // First call: existing category
      mockFindFirst.mockResolvedValueOnce(null); // Second call: parent not found

      await expect(
        service.updateCategory('cat-1', { parentCategoryId: 'cat-parent-bad' })
      ).rejects.toThrow('Parent category not found');
    });

    it('should reject duplicate name when changing name', async () => {
      const existing = mockCategory({ id: 'cat-1', name: 'Old Name', type: 'EXPENSE' });
      const duplicate = mockCategory({ id: 'cat-2', name: 'Duplicate', type: 'EXPENSE' });

      mockFindFirst.mockResolvedValueOnce(existing); // First: existing category
      mockFindFirst.mockResolvedValueOnce(duplicate); // Second: duplicate check

      await expect(
        service.updateCategory('cat-1', { name: 'Duplicate' })
      ).rejects.toThrow('Category "Duplicate" already exists');
    });

    it('should allow updating name to same name', async () => {
      const existing = mockCategory({ id: 'cat-1', name: 'Same Name' });
      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(existing);

      await service.updateCategory('cat-1', { name: 'Same Name' });

      expect(mockFindFirst).toHaveBeenCalledTimes(1); // No duplicate check
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should create audit log after update', async () => {
      const existing = mockCategory({ id: 'cat-1', name: 'Old', type: 'EXPENSE' });
      const updated = mockCategory({ id: 'cat-1', name: 'New', type: 'EXPENSE' });

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(updated);

      await service.updateCategory('cat-1', { name: 'New' });

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: '',
        model: 'Category',
        recordId: 'cat-1',
        action: 'UPDATE',
        before: { name: 'Old', type: 'EXPENSE' },
        after: { name: 'New', type: 'EXPENSE' },
      });
    });
  });

  describe('softDeleteCategory', () => {
    it('should soft delete category and its children', async () => {
      const existing = mockCategory({ id: 'cat-1' });
      mockFindFirst.mockResolvedValueOnce(existing);
      // $transaction executes the array of operations passed to it
      mockTransaction.mockImplementation(async (operations) => {
        return Promise.all(operations);
      });
      mockUpdate.mockResolvedValueOnce({});
      mockUpdateMany.mockResolvedValueOnce({ count: 2 });

      await service.softDeleteCategory('cat-1');

      // Verify the transaction was called
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      // Verify update was called for the category itself
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { deletedAt: expect.any(Date) },
      });
      // Verify updateMany was called for children
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          parentCategoryId: 'cat-1',
          tenantId: TENANT_ID,
          deletedAt: null,
        },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw when category not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.softDeleteCategory('nonexistent')).rejects.toThrow(
        'Category not found'
      );
    });

    it('should enforce tenant isolation', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.softDeleteCategory('cat-other-tenant')).rejects.toThrow(
        'Category not found'
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'cat-other-tenant',
          tenantId: TENANT_ID,
          deletedAt: null,
        },
      });
    });

    it('should create audit log after deletion', async () => {
      const existing = mockCategory({ id: 'cat-1', name: 'To Delete', type: 'EXPENSE' });
      mockFindFirst.mockResolvedValueOnce(existing);
      mockTransaction.mockResolvedValueOnce([{}, {}]);

      await service.softDeleteCategory('cat-1');

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: '',
        model: 'Category',
        recordId: 'cat-1',
        action: 'DELETE',
        before: { name: 'To Delete', type: 'EXPENSE' },
      });
    });

    it('should return deletedAt timestamp', async () => {
      const existing = mockCategory({ id: 'cat-1' });
      mockFindFirst.mockResolvedValueOnce(existing);
      mockTransaction.mockResolvedValueOnce([{}, {}]);

      const result = await service.softDeleteCategory('cat-1');

      expect(result).toHaveProperty('id', 'cat-1');
      expect(result).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('seedDefaults', () => {
    it('should seed default categories when tenant has none', async () => {
      mockCount.mockResolvedValueOnce(0);
      mockFindMany.mockResolvedValueOnce([]); // For deduplication
      mockCreateMany.mockResolvedValueOnce({ count: DEFAULT_CATEGORIES.length });

      const result = await service.seedDefaults();

      expect(result).toEqual({
        created: DEFAULT_CATEGORIES.length,
        existing: 0,
      });
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          tenantId: TENANT_ID,
          name: cat.name,
          type: cat.type,
        })),
        skipDuplicates: true,
      });
    });

    it('should return existing count when categories already exist', async () => {
      mockFindMany.mockResolvedValueOnce([]); // For deduplication
      mockCount.mockResolvedValueOnce(15);

      const result = await service.seedDefaults();

      expect(result).toEqual({
        created: 0,
        existing: 15,
      });
      expect(mockCreateMany).not.toHaveBeenCalled();
    });

    it('should run deduplication before seeding', async () => {
      mockFindMany.mockResolvedValueOnce([]); // For deduplication
      mockCount.mockResolvedValueOnce(0);
      mockCreateMany.mockResolvedValueOnce({ count: DEFAULT_CATEGORIES.length });

      await service.seedDefaults();

      // Deduplication should be called (findMany for categories)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT_ID,
          deletedAt: null,
        },
        include: {
          _count: {
            select: { transactions: { where: { deletedAt: null } } },
          },
        },
        orderBy: [{ name: 'asc' }, { type: 'asc' }],
      });
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      mockFindMany.mockResolvedValueOnce([]); // Dedup
      mockCount.mockResolvedValueOnce(20); // Already seeded

      const result1 = await service.seedDefaults();
      expect(result1.created).toBe(0);

      mockFindMany.mockResolvedValueOnce([]);
      mockCount.mockResolvedValueOnce(20);

      const result2 = await service.seedDefaults();
      expect(result2.created).toBe(0);
    });
  });

  describe('deduplicateCategories', () => {
    it('should keep category with most transactions when duplicates exist', async () => {
      const duplicates = [
        mockCategory({
          id: 'cat-winner',
          name: 'Office Supplies',
          type: 'EXPENSE',
          createdAt: new Date('2024-01-01'),
          _count: { transactions: 10 },
        }),
        mockCategory({
          id: 'cat-loser',
          name: 'Office Supplies',
          type: 'EXPENSE',
          createdAt: new Date('2024-02-01'),
          _count: { transactions: 5 },
        }),
      ];

      mockFindMany.mockResolvedValueOnce(duplicates);
      mockTransactionUpdateMany.mockResolvedValueOnce({ count: 5 }); // Transactions reassigned
      mockBillLineUpdateMany.mockResolvedValueOnce({ count: 0 }); // Bill lines
      mockInvoiceLineUpdateMany.mockResolvedValueOnce({ count: 0 }); // Invoice lines
      mockUpdate.mockResolvedValueOnce({}); // Soft delete loser

      const result = await service.deduplicateCategories();

      expect(result).toEqual({ removed: 1, reassigned: 5 });
      expect(mockTransactionUpdateMany).toHaveBeenCalledWith({
        where: {
          categoryId: 'cat-loser',
          deletedAt: null,
        },
        data: {
          categoryId: 'cat-winner',
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'cat-loser' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should keep oldest category when transaction counts are tied', async () => {
      const duplicates = [
        mockCategory({
          id: 'cat-newer',
          name: 'Supplies',
          createdAt: new Date('2024-02-01'),
          _count: { transactions: 5 },
        }),
        mockCategory({
          id: 'cat-older',
          name: 'Supplies',
          createdAt: new Date('2024-01-01'),
          _count: { transactions: 5 },
        }),
      ];

      mockFindMany.mockResolvedValueOnce(duplicates);
      mockTransactionUpdateMany.mockResolvedValue({ count: 5 });
      mockBillLineUpdateMany.mockResolvedValue({ count: 0 });
      mockInvoiceLineUpdateMany.mockResolvedValue({ count: 0 });
      mockUpdate.mockResolvedValueOnce({});

      await service.deduplicateCategories();

      // Should delete cat-newer, keep cat-older
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'cat-newer' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should reassign transactions, bill lines, and invoice lines', async () => {
      const duplicates = [
        mockCategory({
          id: 'cat-winner',
          name: 'Test',
          _count: { transactions: 10 },
        }),
        mockCategory({
          id: 'cat-loser',
          name: 'Test',
          _count: { transactions: 5 },
        }),
      ];

      mockFindMany.mockResolvedValueOnce(duplicates);
      mockTransactionUpdateMany.mockResolvedValueOnce({ count: 5 }); // Transactions
      mockBillLineUpdateMany.mockResolvedValueOnce({ count: 2 }); // Bill lines
      mockInvoiceLineUpdateMany.mockResolvedValueOnce({ count: 3 }); // Invoice lines
      mockUpdate.mockResolvedValueOnce({});

      const result = await service.deduplicateCategories();

      expect(result.reassigned).toBe(5); // Only counts transactions
      expect(mockTransactionUpdateMany).toHaveBeenCalled();
      expect(mockBillLineUpdateMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-loser' },
        data: { categoryId: 'cat-winner' },
      });
      expect(mockInvoiceLineUpdateMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-loser' },
        data: { categoryId: 'cat-winner' },
      });
    });

    it('should skip categories with no duplicates', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Unique A', type: 'EXPENSE' }),
        mockCategory({ id: 'cat-2', name: 'Unique B', type: 'EXPENSE' }),
      ];

      mockFindMany.mockResolvedValueOnce(categories);

      const result = await service.deduplicateCategories();

      expect(result).toEqual({ removed: 0, reassigned: 0 });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should group duplicates by name AND type', async () => {
      const categories = [
        mockCategory({ id: 'cat-1', name: 'Supplies', type: 'EXPENSE', _count: { transactions: 10 } }),
        mockCategory({ id: 'cat-2', name: 'Supplies', type: 'INCOME', _count: { transactions: 5 } }),
      ];

      mockFindMany.mockResolvedValueOnce(categories);

      const result = await service.deduplicateCategories();

      // Should NOT treat these as duplicates (different types)
      expect(result.removed).toBe(0);
    });

    it('should create audit log when duplicates removed', async () => {
      const duplicates = [
        mockCategory({ id: 'cat-winner', name: 'Test', _count: { transactions: 10 } }),
        mockCategory({ id: 'cat-loser', name: 'Test', _count: { transactions: 5 } }),
      ];

      mockFindMany.mockResolvedValueOnce(duplicates);
      mockTransactionUpdateMany.mockResolvedValueOnce({ count: 5 });
      mockBillLineUpdateMany.mockResolvedValue({ count: 0 });
      mockInvoiceLineUpdateMany.mockResolvedValue({ count: 0 });
      mockUpdate.mockResolvedValueOnce({});

      await service.deduplicateCategories();

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: '',
        model: 'Category',
        recordId: 'batch-dedup',
        action: 'UPDATE',
        after: { removed: 1, reassigned: 5 },
      });
    });

    it('should NOT create audit log when no duplicates found', async () => {
      mockFindMany.mockResolvedValueOnce([
        mockCategory({ id: 'cat-1', name: 'Unique' }),
      ]);

      await service.deduplicateCategories();

      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });
  });
});
