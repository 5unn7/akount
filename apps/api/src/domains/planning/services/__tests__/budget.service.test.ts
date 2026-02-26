import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetService } from '../budget.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

const TENANT_ID = TEST_IDS.TENANT_ID;

function mockBudget(overrides: Record<string, unknown> = {}) {
  return {
    id: 'budget-1',
    entityId: TEST_IDS.ENTITY_ID,
    name: 'Marketing Budget Q1',
    categoryId: null,
    glAccountId: null,
    amount: 500000, // $5,000.00
    period: 'quarterly',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    category: null,
    glAccount: null,
    ...overrides,
  };
}

describe('BudgetService', () => {
  let service: BudgetService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new BudgetService(TENANT_ID);
  });

  describe('listBudgets', () => {
    it('should fetch budgets with tenant isolation', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([mockBudget()]);

      const result = await service.listBudgets({ entityId: TEST_IDS.ENTITY_ID });

      const callArgs = mockPrisma.budget.findMany.mock.calls[0][0]!;
      expect(callArgs.where.entity).toEqual({ tenantId: TENANT_ID });
      expect(callArgs.where.deletedAt).toBeNull();
      expect(result.budgets).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should use cursor pagination with take: limit + 1', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([]);

      await service.listBudgets({ entityId: TEST_IDS.ENTITY_ID, limit: 10 });

      const callArgs = mockPrisma.budget.findMany.mock.calls[0][0]!;
      expect(callArgs.take).toBe(11);
    });

    it('should detect hasMore when extra record returned', async () => {
      const budgets = Array.from({ length: 11 }, (_, i) =>
        mockBudget({ id: `budget-${i}` })
      );
      mockPrisma.budget.findMany.mockResolvedValueOnce(budgets);

      const result = await service.listBudgets({ entityId: TEST_IDS.ENTITY_ID, limit: 10 });

      expect(result.budgets).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('budget-9');
    });

    it('should filter by period when provided', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([]);

      await service.listBudgets({ entityId: TEST_IDS.ENTITY_ID, period: 'monthly' });

      const callArgs = mockPrisma.budget.findMany.mock.calls[0][0]!;
      expect(callArgs.where.period).toBe('monthly');
    });

    it('should filter by categoryId when provided', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([]);

      await service.listBudgets({ entityId: TEST_IDS.ENTITY_ID, categoryId: 'cat-1' });

      const callArgs = mockPrisma.budget.findMany.mock.calls[0][0]!;
      expect(callArgs.where.categoryId).toBe('cat-1');
    });

    it('should include category and glAccount in results', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([]);

      await service.listBudgets({ entityId: TEST_IDS.ENTITY_ID });

      const callArgs = mockPrisma.budget.findMany.mock.calls[0][0]!;
      expect(callArgs.include.category).toBeDefined();
      expect(callArgs.include.glAccount).toBeDefined();
    });
  });

  describe('getBudget', () => {
    it('should get budget with tenant isolation', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(mockBudget());

      const result = await service.getBudget('budget-1');

      expect(result).toBeDefined();
      const callArgs = mockPrisma.budget.findFirst.mock.calls[0][0]!;
      expect(callArgs.where.entity).toEqual({ tenantId: TENANT_ID });
      expect(callArgs.where.deletedAt).toBeNull();
    });

    it('should return null for non-existent budget', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(null);

      const result = await service.getBudget('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createBudget', () => {
    it('should create budget with integer cents amount', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      const created = mockBudget();
      mockPrisma.budget.create.mockResolvedValueOnce(created);

      const result = await service.createBudget({
        name: 'Marketing Budget Q1',
        entityId: TEST_IDS.ENTITY_ID,
        amount: 500000,
        period: 'quarterly',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
      });

      expect(result.amount).toBe(500000);
      expect(Number.isInteger(result.amount)).toBe(true);
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createBudget({
          name: 'Test',
          entityId: 'other-entity',
          amount: 100000,
          period: 'monthly',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
        })
      ).rejects.toThrow('Entity not found or access denied');
    });

    it('should validate categoryId ownership', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createBudget({
          name: 'Test',
          entityId: TEST_IDS.ENTITY_ID,
          amount: 100000,
          period: 'monthly',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
          categoryId: 'other-category',
        })
      ).rejects.toThrow('Category not found or access denied');
    });

    it('should validate glAccountId ownership', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.gLAccount.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createBudget({
          name: 'Test',
          entityId: TEST_IDS.ENTITY_ID,
          amount: 100000,
          period: 'monthly',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
          glAccountId: 'other-gl',
        })
      ).rejects.toThrow('GL account not found or access denied');
    });
  });

  describe('updateBudget', () => {
    it('should update budget with partial data', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(mockBudget());
      mockPrisma.budget.update.mockResolvedValueOnce(mockBudget({ name: 'Updated Budget' }));

      const result = await service.updateBudget('budget-1', { name: 'Updated Budget' });

      expect(result.name).toBe('Updated Budget');
    });

    it('should reject update for non-existent budget', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateBudget('non-existent', { name: 'Updated' })
      ).rejects.toThrow('Budget not found or access denied');
    });

    it('should reject if end date is before start date', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(
        mockBudget({ startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31') })
      );

      await expect(
        service.updateBudget('budget-1', { endDate: new Date('2025-12-01') })
      ).rejects.toThrow('End date must be after start date');
    });

    it('should accept valid partial date update', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(
        mockBudget({ startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31') })
      );
      mockPrisma.budget.update.mockResolvedValueOnce(
        mockBudget({ endDate: new Date('2026-06-30') })
      );

      const result = await service.updateBudget('budget-1', { endDate: new Date('2026-06-30') });

      expect(result).toBeDefined();
    });

    it('should only include changed fields in update', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(mockBudget());
      mockPrisma.budget.update.mockResolvedValueOnce(mockBudget({ amount: 750000 }));

      await service.updateBudget('budget-1', { amount: 750000 });

      const updateData = mockPrisma.budget.update.mock.calls[0][0]!.data;
      expect(updateData).toHaveProperty('amount', 750000);
      expect(updateData).not.toHaveProperty('name');
      expect(updateData).not.toHaveProperty('period');
    });
  });

  describe('deleteBudget', () => {
    it('should soft delete by setting deletedAt', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(mockBudget());
      mockPrisma.budget.update.mockResolvedValueOnce(mockBudget({ deletedAt: new Date() }));

      const result = await service.deleteBudget('budget-1');

      expect(result.deletedAt).toBeTruthy();
      const updateData = mockPrisma.budget.update.mock.calls[0][0]!.data;
      expect(updateData.deletedAt).toBeInstanceOf(Date);
    });

    it('should reject delete for non-existent budget', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.deleteBudget('non-existent')
      ).rejects.toThrow('Budget not found or access denied');
    });
  });
});
