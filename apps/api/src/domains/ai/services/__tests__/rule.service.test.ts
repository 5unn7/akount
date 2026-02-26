import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleService } from '../rule.service';
import type { RuleSource } from '@akount/db';

// Mock audit logger
vi.mock('../../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockCategoryFindFirst = vi.fn();
const mockGLAccountFindFirst = vi.fn();
const mockEntityFindFirst = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    rule: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    category: {
      findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args),
    },
    gLAccount: {
      findFirst: (...args: unknown[]) => mockGLAccountFindFirst(...args),
    },
    entity: {
      findFirst: (...args: unknown[]) => mockEntityFindFirst(...args),
    },
  },
  RuleSource: {
    USER_MANUAL: 'USER_MANUAL',
    AI_SUGGESTED: 'AI_SUGGESTED',
    SYSTEM_DEFAULT: 'SYSTEM_DEFAULT',
  },
  Prisma: {
    JsonNull: null,
  },
}));

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-xyz-456';
const ENTITY_ID = 'entity-def-789';

function mockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    entityId: ENTITY_ID,
    name: 'Starbucks to Meals',
    conditions: {
      operator: 'AND',
      conditions: [
        { field: 'description', op: 'contains', value: 'starbucks' },
      ],
    },
    action: {
      setCategoryId: 'cat-meals',
    },
    isActive: true,
    source: 'USER_MANUAL' as RuleSource,
    executionCount: 0,
    successRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockEntity() {
  return {
    id: ENTITY_ID,
    tenantId: TENANT_ID,
    name: 'Test Entity',
  };
}

function mockCategory() {
  return {
    id: 'cat-meals',
    tenantId: TENANT_ID,
    name: 'Meals & Entertainment',
    deletedAt: null,
  };
}

function mockGLAccount() {
  return {
    id: 'gl-5800',
    code: '5800',
    name: 'Travel & Meals',
  };
}

describe('RuleService', () => {
  let service: RuleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RuleService(TENANT_ID, USER_ID);
  });

  describe('listRules', () => {
    it('should list rules with tenant isolation', async () => {
      const rules = [mockRule(), mockRule({ id: 'rule-2', name: 'Uber to Transport' })];
      mockFindMany.mockResolvedValueOnce(rules);

      const result = await service.listRules({ entityId: ENTITY_ID });

      expect(result.rules).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          entityId: ENTITY_ID,
          entity: { tenantId: TENANT_ID },
        },
        take: 51,
        cursor: undefined,
        orderBy: [
          { isActive: 'desc' },
          { executionCount: 'desc' },
          { createdAt: 'desc' },
        ],
        select: expect.any(Object),
      });
    });

    it('should filter by isActive', async () => {
      mockFindMany.mockResolvedValueOnce([mockRule()]);

      await service.listRules({ entityId: ENTITY_ID, isActive: true });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should filter by source', async () => {
      mockFindMany.mockResolvedValueOnce([mockRule()]);

      await service.listRules({ entityId: ENTITY_ID, source: 'AI_SUGGESTED' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ source: 'AI_SUGGESTED' }),
        })
      );
    });

    it('should filter by search (name)', async () => {
      mockFindMany.mockResolvedValueOnce([mockRule()]);

      await service.listRules({ entityId: ENTITY_ID, search: 'starbucks' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'starbucks', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should paginate with cursor', async () => {
      const rules = Array(51).fill(null).map((_, i) =>
        mockRule({ id: `rule-${i}`, name: `Rule ${i}` })
      );
      mockFindMany.mockResolvedValueOnce(rules);

      const result = await service.listRules({ entityId: ENTITY_ID, take: 50 });

      expect(result.rules).toHaveLength(50);
      expect(result.nextCursor).toBe('rule-49');
    });

    it('should handle empty results', async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const result = await service.listRules({ entityId: ENTITY_ID });

      expect(result.rules).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getRule', () => {
    it('should get a single rule with tenant isolation', async () => {
      const rule = mockRule();
      mockFindFirst.mockResolvedValueOnce(rule);

      const result = await service.getRule('rule-1');

      expect(result).toEqual(rule);
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'rule-1',
          entity: { tenantId: TENANT_ID },
        },
        select: expect.any(Object),
      });
    });

    it('should return null for non-existent rule', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await service.getRule('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for cross-tenant access', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await service.getRule('other-tenant-rule');

      expect(result).toBeNull();
    });
  });

  describe('createRule', () => {
    it('should create a rule with valid conditions and action', async () => {
      const entity = mockEntity();
      const category = mockCategory();
      const rule = mockRule();

      mockEntityFindFirst.mockResolvedValueOnce(entity);
      mockCategoryFindFirst.mockResolvedValueOnce(category);
      mockCreate.mockResolvedValueOnce(rule);

      const input = {
        entityId: ENTITY_ID,
        name: 'Starbucks to Meals',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'description', op: 'contains', value: 'starbucks' },
          ],
        },
        action: {
          setCategoryId: 'cat-meals',
        },
        source: 'USER_MANUAL' as RuleSource,
      };

      const result = await service.createRule(input);

      expect(result).toEqual(rule);
      expect(mockEntityFindFirst).toHaveBeenCalled();
      expect(mockCategoryFindFirst).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: input.name,
          isActive: true,
          executionCount: 0,
          successRate: 0,
        }),
      });
    });

    it('should validate entity ownership', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(null);

      const input = {
        entityId: 'wrong-entity',
        name: 'Test',
        conditions: { operator: 'AND', conditions: [] },
        action: { flagForReview: true },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).rejects.toThrow(
        'Entity not found or access denied'
      );
    });

    it('should validate category FK ownership', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());
      mockCategoryFindFirst.mockResolvedValueOnce(null);

      const input = {
        entityId: ENTITY_ID,
        name: 'Test',
        conditions: { operator: 'AND', conditions: [{ field: 'amount', op: 'gt', value: 100 }] },
        action: { setCategoryId: 'wrong-category' },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).rejects.toThrow(
        'Category not found or access denied'
      );
    });

    it('should validate GL account FK ownership', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());
      mockGLAccountFindFirst.mockResolvedValueOnce(null);

      const input = {
        entityId: ENTITY_ID,
        name: 'Test',
        conditions: { operator: 'AND', conditions: [{ field: 'amount', op: 'lt', value: 50 }] },
        action: { setGLAccountId: 'wrong-gl' },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).rejects.toThrow(
        'GL account not found or access denied'
      );
    });

    it('should reject invalid conditions (bad field)', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      const input = {
        entityId: ENTITY_ID,
        name: 'Test',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'invalid_field', op: 'eq', value: 'test' },
          ],
        },
        action: { flagForReview: true },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).rejects.toThrow('Invalid conditions');
    });

    it('should reject invalid conditions (bad operator)', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      const input = {
        entityId: ENTITY_ID,
        name: 'Test',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'description', op: 'matches', value: '/regex/' },
          ],
        },
        action: { flagForReview: true },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).rejects.toThrow('Invalid conditions');
    });

    it('should reject invalid action (no fields set)', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      const input = {
        entityId: ENTITY_ID,
        name: 'Test',
        conditions: { operator: 'AND', conditions: [{ field: 'amount', op: 'gte', value: 0 }] },
        action: {},
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).rejects.toThrow('Invalid action');
    });

    it('should accept action with only flagForReview', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());
      mockCreate.mockResolvedValueOnce(mockRule());

      const input = {
        entityId: ENTITY_ID,
        name: 'Flag suspicious',
        conditions: { operator: 'AND', conditions: [{ field: 'amount', op: 'gt', value: 100000 }] },
        action: { flagForReview: true },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).resolves.toBeDefined();
    });

    it('should accept OR operator', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());
      mockCreate.mockResolvedValueOnce(mockRule());

      const input = {
        entityId: ENTITY_ID,
        name: 'Coffee shops',
        conditions: {
          operator: 'OR',
          conditions: [
            { field: 'description', op: 'contains', value: 'starbucks' },
            { field: 'description', op: 'contains', value: 'tim hortons' },
          ],
        },
        action: { flagForReview: true },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).resolves.toBeDefined();
    });

    it('should accept numeric conditions', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());
      mockCreate.mockResolvedValueOnce(mockRule());

      const input = {
        entityId: ENTITY_ID,
        name: 'Large transactions',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'amount', op: 'gt', value: 50000 },
            { field: 'amount', op: 'lte', value: 100000 },
          ],
        },
        action: { flagForReview: true },
        source: 'USER_MANUAL' as RuleSource,
      };

      await expect(service.createRule(input)).resolves.toBeDefined();
    });
  });

  describe('updateRule', () => {
    it('should update rule with tenant isolation', async () => {
      const existing = mockRule();
      const updated = { ...existing, name: 'Updated name' };

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(updated);

      const result = await service.updateRule('rule-1', { name: 'Updated name' });

      expect(result.name).toBe('Updated name');
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'rule-1',
          entity: { tenantId: TENANT_ID },
        },
        select: expect.any(Object),
      });
    });

    it('should reject update for non-existent rule', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateRule('non-existent', { name: 'New name' })
      ).rejects.toThrow('Rule not found or access denied');
    });

    it('should validate conditions on update', async () => {
      mockFindFirst.mockResolvedValueOnce(mockRule());

      const update = {
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'invalid_field', op: 'eq', value: 'test' }],
        },
      };

      await expect(service.updateRule('rule-1', update)).rejects.toThrow('Invalid conditions');
    });

    it('should validate action on update', async () => {
      mockFindFirst.mockResolvedValueOnce(mockRule());

      const update = {
        action: {},
      };

      await expect(service.updateRule('rule-1', update)).rejects.toThrow('Invalid action');
    });

    it('should validate category FK on update', async () => {
      mockFindFirst.mockResolvedValueOnce(mockRule());
      mockCategoryFindFirst.mockResolvedValueOnce(null);

      const update = {
        action: { setCategoryId: 'wrong-category' },
      };

      await expect(service.updateRule('rule-1', update)).rejects.toThrow(
        'Category not found or access denied'
      );
    });

    it('should validate GL account FK on update', async () => {
      mockFindFirst.mockResolvedValueOnce(mockRule());
      mockGLAccountFindFirst.mockResolvedValueOnce(null);

      const update = {
        action: { setGLAccountId: 'wrong-gl' },
      };

      await expect(service.updateRule('rule-1', update)).rejects.toThrow(
        'GL account not found or access denied'
      );
    });

    it('should allow partial updates', async () => {
      const existing = mockRule();
      const updated = { ...existing, isActive: false };

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(updated);

      const result = await service.updateRule('rule-1', { isActive: false });

      expect(result.isActive).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: {
          name: undefined,
          conditions: undefined,
          action: undefined,
          isActive: false,
        },
      });
    });
  });

  describe('deleteRule', () => {
    it('should delete rule with tenant isolation', async () => {
      const existing = mockRule();
      mockFindFirst.mockResolvedValueOnce(existing);
      mockDelete.mockResolvedValueOnce(existing);

      await service.deleteRule('rule-1');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'rule-1',
          entity: { tenantId: TENANT_ID },
        },
        select: expect.any(Object),
      });
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'rule-1' } });
    });

    it('should reject delete for non-existent rule', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.deleteRule('non-existent')).rejects.toThrow(
        'Rule not found or access denied'
      );
    });

    it('should reject cross-tenant delete', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.deleteRule('other-tenant-rule')).rejects.toThrow(
        'Rule not found or access denied'
      );
    });
  });

  describe('toggleRule', () => {
    it('should toggle isActive from true to false', async () => {
      const existing = mockRule({ isActive: true });
      const toggled = { ...existing, isActive: false };

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(toggled);

      const result = await service.toggleRule('rule-1');

      expect(result.isActive).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { isActive: false },
      });
    });

    it('should toggle isActive from false to true', async () => {
      const existing = mockRule({ isActive: false });
      const toggled = { ...existing, isActive: true };

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce(toggled);

      const result = await service.toggleRule('rule-1');

      expect(result.isActive).toBe(true);
    });

    it('should reject toggle for non-existent rule', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.toggleRule('non-existent')).rejects.toThrow(
        'Rule not found or access denied'
      );
    });
  });

  describe('incrementExecution', () => {
    it('should increment count and update success rate (success)', async () => {
      const existing = { executionCount: 10, successRate: 0.8 };
      mockFindUnique.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce({
        ...existing,
        executionCount: 11,
        successRate: 0.818,
      });

      await service.incrementExecution('rule-1', true);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: {
          executionCount: 11,
          successRate: expect.closeTo(0.818, 2),
        },
      });
    });

    it('should increment count and update success rate (failure)', async () => {
      const existing = { executionCount: 10, successRate: 0.8 };
      mockFindUnique.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce({
        ...existing,
        executionCount: 11,
        successRate: 0.727,
      });

      await service.incrementExecution('rule-1', false);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: {
          executionCount: 11,
          successRate: expect.closeTo(0.727, 2),
        },
      });
    });

    it('should handle first execution', async () => {
      const existing = { executionCount: 0, successRate: 0 };
      mockFindUnique.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValueOnce({
        ...existing,
        executionCount: 1,
        successRate: 1.0,
      });

      await service.incrementExecution('rule-1', true);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: {
          executionCount: 1,
          successRate: 1.0,
        },
      });
    });

    it('should not throw if rule does not exist (deleted)', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(service.incrementExecution('deleted-rule', true)).resolves.not.toThrow();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('tenant isolation', () => {
    it('should enforce tenant isolation on all operations', async () => {
      const operations = [
        () => service.listRules({ entityId: ENTITY_ID }),
        () => service.getRule('rule-1'),
      ];

      mockFindMany.mockResolvedValue([]);
      mockFindFirst.mockResolvedValue(null);

      for (const op of operations) {
        await op();
      }

      // All should check entity.tenantId or tenantId
      const calls = [
        ...mockFindMany.mock.calls,
        ...mockFindFirst.mock.calls,
      ];

      for (const call of calls) {
        const where = call[0]?.where;
        const hasTenantCheck =
          where?.entity?.tenantId === TENANT_ID ||
          where?.tenantId === TENANT_ID;
        expect(hasTenantCheck).toBe(true);
      }
    });
  });
});
