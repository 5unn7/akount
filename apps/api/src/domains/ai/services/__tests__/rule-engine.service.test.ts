import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuleEngineService, TransactionData } from '../rule-engine.service';
import { RuleService } from '../rule.service';
import { prisma, RuleSource } from '@akount/db';

// Mock Prisma
vi.mock('@akount/db', () => ({
  prisma: {
    rule: {
      findMany: vi.fn(),
    },
  },
  RuleSource: {
    USER_MANUAL: 'USER_MANUAL',
    AI_SUGGESTED: 'AI_SUGGESTED',
    SYSTEM_DEFAULT: 'SYSTEM_DEFAULT',
  },
}));

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let mockRuleService: RuleService;
  const tenantId = 'tenant-123';
  const entityId = 'entity-456';
  const userId = 'user-789';

  const mockTransaction: TransactionData = {
    id: 'txn-1',
    description: 'Starbucks Coffee',
    amount: 550, // $5.50
    accountId: 'acc-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock RuleService
    mockRuleService = new RuleService(tenantId, userId);
    mockRuleService.incrementExecution = vi.fn().mockResolvedValue(undefined);

    service = new RuleEngineService(tenantId, mockRuleService);
  });

  describe('evaluateRules', () => {
    it('should return match for matching rule', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Coffee Shops',
        entityId,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'description', op: 'contains', value: 'starbucks' },
            { field: 'amount', op: 'lt', value: 1000 },
          ],
        },
        action: {
          setCategoryId: 'cat-meals',
          flagForReview: false,
        },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 5,
        successRate: 0.8,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result).toEqual({
        ruleId: 'rule-1',
        ruleName: 'Coffee Shops',
        categoryId: 'cat-meals',
        glAccountId: null,
        confidence: 95, // USER_MANUAL
        matchReason: "description contains 'starbucks' AND amount < $10.00",
        flagForReview: false,
      });

      expect(mockRuleService.incrementExecution).toHaveBeenCalledWith('rule-1', true);
    });

    it('should return null when no rules match', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Coffee Shops',
        entityId,
        conditions: {
          operator: 'AND',
          conditions: [{ field: 'description', op: 'contains', value: 'mcdonalds' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result).toBeNull();
      expect(mockRuleService.incrementExecution).not.toHaveBeenCalled();
    });

    it('should use first-match-wins strategy', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: 'Coffee Generic',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'rule-2',
          name: 'Starbucks Specific',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
          },
          action: { setCategoryId: 'cat-coffee' },
          source: RuleSource.AI_SUGGESTED,
          isActive: true,
          userApprovedAt: new Date('2026-01-15'),
          aiConfidence: 0.95,
          aiModelVersion: 'v1',
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-02'),
          updatedAt: new Date('2026-01-02'),
        },
      ];

      vi.mocked(prisma.rule.findMany).mockResolvedValue(mockRules);

      const result = await service.evaluateRules(mockTransaction, entityId);

      // First rule matched (USER_MANUAL has priority)
      expect(result?.ruleId).toBe('rule-1');
      expect(result?.categoryId).toBe('cat-meals');
      expect(mockRuleService.incrementExecution).toHaveBeenCalledWith('rule-1', true);
      expect(mockRuleService.incrementExecution).toHaveBeenCalledTimes(1);
    });

    it('should filter by tenant and entity', async () => {
      vi.mocked(prisma.rule.findMany).mockResolvedValue([]);

      await service.evaluateRules(mockTransaction, entityId);

      expect(prisma.rule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityId,
            entity: { tenantId },
            isActive: true,
          }),
        })
      );
    });
  });

  describe('evaluateRulesBatch', () => {
    it('should evaluate multiple transactions', async () => {
      const transactions: TransactionData[] = [
        {
          id: 'txn-1',
          description: 'Starbucks Coffee',
          amount: 550,
          accountId: 'acc-1',
        },
        {
          id: 'txn-2',
          description: 'Shell Gas',
          amount: 4500,
          accountId: 'acc-1',
        },
        {
          id: 'txn-3',
          description: 'Random Store',
          amount: 2000,
          accountId: 'acc-1',
        },
      ];

      const mockRules = [
        {
          id: 'rule-1',
          name: 'Coffee Shops',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'rule-2',
          name: 'Gas Stations',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'gas' }],
          },
          action: { setCategoryId: 'cat-auto' },
          source: RuleSource.SYSTEM_DEFAULT,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-02'),
          updatedAt: new Date('2026-01-02'),
        },
      ];

      vi.mocked(prisma.rule.findMany).mockResolvedValue(mockRules);

      const result = await service.evaluateRulesBatch(transactions, entityId);

      expect(result.size).toBe(2);
      expect(result.get('txn-1')?.categoryId).toBe('cat-meals');
      expect(result.get('txn-2')?.categoryId).toBe('cat-auto');
      expect(result.has('txn-3')).toBe(false);

      // Should batch increment both matched rules
      expect(mockRuleService.incrementExecution).toHaveBeenCalledWith('rule-1', true);
      expect(mockRuleService.incrementExecution).toHaveBeenCalledWith('rule-2', true);
    });

    it('should load rules only once (optimization)', async () => {
      const transactions: TransactionData[] = [
        { id: 'txn-1', description: 'Test 1', amount: 100, accountId: 'acc-1' },
        { id: 'txn-2', description: 'Test 2', amount: 200, accountId: 'acc-1' },
        { id: 'txn-3', description: 'Test 3', amount: 300, accountId: 'acc-1' },
      ];

      vi.mocked(prisma.rule.findMany).mockResolvedValue([]);

      await service.evaluateRulesBatch(transactions, entityId);

      expect(prisma.rule.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('condition evaluation', () => {
    describe('AND operator', () => {
      it('should match when all conditions pass', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Small Coffee',
          entityId,
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'description', op: 'contains', value: 'coffee' },
              { field: 'amount', op: 'lt', value: 1000 },
            ],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });

      it('should not match when any condition fails', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Expensive Coffee',
          entityId,
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'description', op: 'contains', value: 'coffee' },
              { field: 'amount', op: 'gt', value: 1000 }, // Fails: 550 is not > 1000
            ],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).toBeNull();
      });
    });

    describe('OR operator', () => {
      it('should match when at least one condition passes', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Coffee or Tea',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [
              { field: 'description', op: 'contains', value: 'coffee' }, // Passes
              { field: 'description', op: 'contains', value: 'tea' }, // Fails
            ],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });

      it('should not match when all conditions fail', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Fast Food',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [
              { field: 'description', op: 'contains', value: 'mcdonalds' },
              { field: 'description', op: 'contains', value: 'burger' },
            ],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).toBeNull();
      });
    });

    describe('operators', () => {
      it('should support contains operator (case-insensitive)', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Starbucks',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'STARBUCKS' }],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(
          { ...mockTransaction, description: 'starbucks coffee' },
          entityId
        );

        expect(result).not.toBeNull();
      });

      it('should support eq operator', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Exact Amount',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'amount', op: 'eq', value: 550 }],
          },
          action: { setCategoryId: 'cat-meals' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });

      it('should support gt operator', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Large Transactions',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'amount', op: 'gt', value: 500 }],
          },
          action: { setCategoryId: 'cat-large' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });

      it('should support gte operator', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'At Least $5.50',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'amount', op: 'gte', value: 550 }],
          },
          action: { setCategoryId: 'cat-large' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });

      it('should support lt operator', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'Small Transactions',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'amount', op: 'lt', value: 600 }],
          },
          action: { setCategoryId: 'cat-small' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });

      it('should support lte operator', async () => {
        const mockRule = {
          id: 'rule-1',
          name: 'At Most $5.50',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'amount', op: 'lte', value: 550 }],
          },
          action: { setCategoryId: 'cat-small' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        };

        vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

        const result = await service.evaluateRules(mockTransaction, entityId);

        expect(result).not.toBeNull();
      });
    });

    it('should handle empty description gracefully', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Empty Description',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'test' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(
        { ...mockTransaction, description: '' },
        entityId
      );

      expect(result).toBeNull();
    });
  });

  describe('priority ordering', () => {
    it('should prioritize USER_MANUAL over AI_SUGGESTED', async () => {
      const mockRules = [
        {
          id: 'rule-ai',
          name: 'AI Rule',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
          },
          action: { setCategoryId: 'cat-ai' },
          source: RuleSource.AI_SUGGESTED,
          isActive: true,
          userApprovedAt: new Date('2026-01-15'),
          aiConfidence: 0.9,
          aiModelVersion: 'v1',
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'rule-user',
          name: 'User Rule',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
          },
          action: { setCategoryId: 'cat-user' },
          source: RuleSource.USER_MANUAL,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-02'), // Created later
          updatedAt: new Date('2026-01-02'),
        },
      ];

      vi.mocked(prisma.rule.findMany).mockResolvedValue(mockRules);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.ruleId).toBe('rule-user');
      expect(result?.categoryId).toBe('cat-user');
    });

    it('should prioritize AI_SUGGESTED over SYSTEM_DEFAULT', async () => {
      const mockRules = [
        {
          id: 'rule-system',
          name: 'System Rule',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
          },
          action: { setCategoryId: 'cat-system' },
          source: RuleSource.SYSTEM_DEFAULT,
          isActive: true,
          userApprovedAt: null,
          aiConfidence: null,
          aiModelVersion: null,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'rule-ai',
          name: 'AI Rule',
          entityId,
          conditions: {
            operator: 'OR',
            conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
          },
          action: { setCategoryId: 'cat-ai' },
          source: RuleSource.AI_SUGGESTED,
          isActive: true,
          userApprovedAt: new Date('2026-01-15'),
          aiConfidence: 0.9,
          aiModelVersion: 'v1',
          executionCount: 0,
          successRate: 0,
          createdAt: new Date('2026-01-02'), // Created later
          updatedAt: new Date('2026-01-02'),
        },
      ];

      vi.mocked(prisma.rule.findMany).mockResolvedValue(mockRules);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.ruleId).toBe('rule-ai');
      expect(result?.categoryId).toBe('cat-ai');
    });
  });

  describe('confidence scores', () => {
    it('should return 95 for USER_MANUAL rules', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'User Rule',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.confidence).toBe(95);
    });

    it('should return 90 for approved AI_SUGGESTED rules', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'AI Rule',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.AI_SUGGESTED,
        isActive: true,
        userApprovedAt: new Date('2026-01-15'),
        aiConfidence: 0.95,
        aiModelVersion: 'v1',
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.confidence).toBe(90);
    });

    it('should return 85 for unapproved AI_SUGGESTED rules', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'AI Rule',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.AI_SUGGESTED,
        isActive: true,
        userApprovedAt: null, // Not approved
        aiConfidence: 0.95,
        aiModelVersion: 'v1',
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.confidence).toBe(85);
    });

    it('should return 85 for SYSTEM_DEFAULT rules', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'System Rule',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.SYSTEM_DEFAULT,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.confidence).toBe(85);
    });
  });

  describe('match reason generation', () => {
    it('should generate human-readable match reason for single condition', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Coffee Shops',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.matchReason).toBe("description contains 'coffee'");
    });

    it('should generate match reason for multiple AND conditions', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Small Coffee',
        entityId,
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'description', op: 'contains', value: 'coffee' },
            { field: 'amount', op: 'lt', value: 1000 },
          ],
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.matchReason).toBe("description contains 'coffee' AND amount < $10.00");
    });

    it('should format amount values correctly', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Exact Amount',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'amount', op: 'eq', value: 12345 }], // $123.45
        },
        action: { setCategoryId: 'cat-meals' },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      // Use a transaction with the matching amount
      const result = await service.evaluateRules(
        { ...mockTransaction, amount: 12345 },
        entityId
      );

      expect(result).not.toBeNull();
      expect(result?.matchReason).toBe('amount equals $123.45');
    });
  });

  describe('action handling', () => {
    it('should return both categoryId and glAccountId from action', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Full Action',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: {
          setCategoryId: 'cat-meals',
          setGLAccountId: 'gl-5001',
          flagForReview: true,
        },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.categoryId).toBe('cat-meals');
      expect(result?.glAccountId).toBe('gl-5001');
      expect(result?.flagForReview).toBe(true);
    });

    it('should handle missing optional action fields', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Category Only',
        entityId,
        conditions: {
          operator: 'OR',
          conditions: [{ field: 'description', op: 'contains', value: 'coffee' }],
        },
        action: {
          setCategoryId: 'cat-meals',
        },
        source: RuleSource.USER_MANUAL,
        isActive: true,
        userApprovedAt: null,
        aiConfidence: null,
        aiModelVersion: null,
        executionCount: 0,
        successRate: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(prisma.rule.findMany).mockResolvedValue([mockRule]);

      const result = await service.evaluateRules(mockTransaction, entityId);

      expect(result?.categoryId).toBe('cat-meals');
      expect(result?.glAccountId).toBeNull();
      expect(result?.flagForReview).toBe(false);
    });
  });
});
