import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalService } from '../goal.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

const TENANT_ID = TEST_IDS.TENANT_ID;

function mockGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'goal-1',
    entityId: TEST_IDS.ENTITY_ID,
    name: 'Save for Emergency Fund',
    type: 'SAVINGS',
    targetAmount: 1000000, // $10,000.00
    currentAmount: 250000, // $2,500.00
    targetDate: new Date('2026-12-31'),
    accountId: null,
    categoryId: null,
    glAccountId: null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('GoalService', () => {
  let service: GoalService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new GoalService(TENANT_ID);
  });

  describe('listGoals', () => {
    it('should fetch goals with tenant isolation', async () => {
      mockPrisma.goal.findMany.mockResolvedValueOnce([mockGoal()]);

      const result = await service.listGoals({ entityId: TEST_IDS.ENTITY_ID });

      const callArgs = mockPrisma.goal.findMany.mock.calls[0][0]!;
      expect(callArgs.where.entity).toEqual({ tenantId: TENANT_ID });
      expect(callArgs.where.deletedAt).toBeNull();
      expect(result.goals).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should use cursor pagination with take: limit + 1', async () => {
      mockPrisma.goal.findMany.mockResolvedValueOnce([]);

      await service.listGoals({ entityId: TEST_IDS.ENTITY_ID, limit: 10 });

      const callArgs = mockPrisma.goal.findMany.mock.calls[0][0]!;
      expect(callArgs.take).toBe(11);
    });

    it('should detect hasMore when extra record returned', async () => {
      const goals = Array.from({ length: 11 }, (_, i) =>
        mockGoal({ id: `goal-${i}` })
      );
      mockPrisma.goal.findMany.mockResolvedValueOnce(goals);

      const result = await service.listGoals({ entityId: TEST_IDS.ENTITY_ID, limit: 10 });

      expect(result.goals).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('goal-9');
    });

    it('should filter by status when provided', async () => {
      mockPrisma.goal.findMany.mockResolvedValueOnce([]);

      await service.listGoals({ entityId: TEST_IDS.ENTITY_ID, status: 'ACTIVE' });

      const callArgs = mockPrisma.goal.findMany.mock.calls[0][0]!;
      expect(callArgs.where.status).toBe('ACTIVE');
    });

    it('should filter by type when provided', async () => {
      mockPrisma.goal.findMany.mockResolvedValueOnce([]);

      await service.listGoals({ entityId: TEST_IDS.ENTITY_ID, type: 'SAVINGS' });

      const callArgs = mockPrisma.goal.findMany.mock.calls[0][0]!;
      expect(callArgs.where.type).toBe('SAVINGS');
    });
  });

  describe('getGoal', () => {
    it('should get goal with tenant isolation', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockGoal());

      const result = await service.getGoal('goal-1');

      expect(result).toBeDefined();
      const callArgs = mockPrisma.goal.findFirst.mock.calls[0][0]!;
      expect(callArgs.where.entity).toEqual({ tenantId: TENANT_ID });
      expect(callArgs.where.deletedAt).toBeNull();
    });

    it('should return null for non-existent goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);

      const result = await service.getGoal('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createGoal', () => {
    it('should create goal with integer cents amounts', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      const created = mockGoal();
      mockPrisma.goal.create.mockResolvedValueOnce(created);

      const result = await service.createGoal({
        name: 'Save for Emergency Fund',
        entityId: TEST_IDS.ENTITY_ID,
        type: 'SAVINGS',
        targetAmount: 1000000,
        targetDate: new Date('2026-12-31'),
      });

      expect(result.targetAmount).toBe(1000000);
      expect(Number.isInteger(result.targetAmount)).toBe(true);
      expect(Number.isInteger(result.currentAmount)).toBe(true);

      const createData = mockPrisma.goal.create.mock.calls[0][0]!.data;
      expect(createData.currentAmount).toBe(0);
      expect(createData.status).toBe('ACTIVE');
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createGoal({
          name: 'Test',
          entityId: 'other-entity',
          type: 'REVENUE',
          targetAmount: 100000,
          targetDate: new Date(),
        })
      ).rejects.toThrow('Entity not found or access denied');
    });

    it('should validate accountId ownership', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createGoal({
          name: 'Test',
          entityId: TEST_IDS.ENTITY_ID,
          type: 'SAVINGS',
          targetAmount: 100000,
          targetDate: new Date(),
          accountId: 'other-account',
        })
      ).rejects.toThrow('Account not found or access denied');
    });

    it('should validate categoryId ownership', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createGoal({
          name: 'Test',
          entityId: TEST_IDS.ENTITY_ID,
          type: 'REVENUE',
          targetAmount: 100000,
          targetDate: new Date(),
          categoryId: 'other-category',
        })
      ).rejects.toThrow('Category not found or access denied');
    });

    it('should validate glAccountId ownership', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: TEST_IDS.ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.gLAccount.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createGoal({
          name: 'Test',
          entityId: TEST_IDS.ENTITY_ID,
          type: 'EXPENSE_REDUCTION',
          targetAmount: 100000,
          targetDate: new Date(),
          glAccountId: 'other-gl',
        })
      ).rejects.toThrow('GL account not found or access denied');
    });
  });

  describe('updateGoal', () => {
    it('should update goal with partial data', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockGoal());
      mockPrisma.goal.update.mockResolvedValueOnce(mockGoal({ name: 'Updated Goal' }));

      const result = await service.updateGoal('goal-1', { name: 'Updated Goal' });

      expect(result.name).toBe('Updated Goal');
      const updateData = mockPrisma.goal.update.mock.calls[0][0]!.data;
      expect(updateData).toHaveProperty('name', 'Updated Goal');
    });

    it('should reject update for non-existent goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateGoal('non-existent', { name: 'Updated' })
      ).rejects.toThrow('Goal not found or access denied');
    });

    it('should only include changed fields in update', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockGoal());
      mockPrisma.goal.update.mockResolvedValueOnce(mockGoal({ currentAmount: 500000 }));

      await service.updateGoal('goal-1', { currentAmount: 500000 });

      const updateData = mockPrisma.goal.update.mock.calls[0][0]!.data;
      expect(updateData).toHaveProperty('currentAmount', 500000);
      expect(updateData).not.toHaveProperty('name');
      expect(updateData).not.toHaveProperty('type');
    });
  });

  describe('deleteGoal', () => {
    it('should soft delete by setting deletedAt', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockGoal());
      mockPrisma.goal.update.mockResolvedValueOnce(mockGoal({ deletedAt: new Date() }));

      const result = await service.deleteGoal('goal-1');

      expect(result.deletedAt).toBeTruthy();
      const updateData = mockPrisma.goal.update.mock.calls[0][0]!.data;
      expect(updateData.deletedAt).toBeInstanceOf(Date);
    });

    it('should reject delete for non-existent goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.deleteGoal('non-existent')
      ).rejects.toThrow('Goal not found or access denied');
    });
  });
});
