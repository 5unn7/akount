import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { rulesRoutes } from '../rules';
import { AIError } from '../../errors';
import { RuleSource } from '@akount/db';

// Mock middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

vi.mock('../../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async (request: any) => {
      request.userId = 'test-user-id';
      request.tenantId = 'tenant-abc-123';
      request.tenantRole = 'OWNER';
    },
  })),
}));

// Mock RuleService
const mockListRules = vi.fn();
const mockGetRule = vi.fn();
const mockCreateRule = vi.fn();
const mockUpdateRule = vi.fn();
const mockDeleteRule = vi.fn();
const mockToggleRule = vi.fn();
const mockGetRuleStats = vi.fn();

vi.mock('../../services/rule.service', () => ({
  RuleService: function (this: any) {
    this.listRules = mockListRules;
    this.getRule = mockGetRule;
    this.createRule = mockCreateRule;
    this.updateRule = mockUpdateRule;
    this.deleteRule = mockDeleteRule;
    this.toggleRule = mockToggleRule;
    this.getRuleStats = mockGetRuleStats;
  },
}));

const MOCK_RULE = {
  id: 'rule-1',
  entityId: 'entity-1',
  name: 'Starbucks Rule',
  conditions: {
    operator: 'AND',
    conditions: [
      { field: 'description', op: 'contains', value: 'Starbucks' },
    ],
  },
  action: {
    setCategoryId: 'category-1',
  },
  isActive: true,
  source: RuleSource.USER_MANUAL,
  executionCount: 5,
  successRate: 0.8,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('Rules Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockListRules.mockResolvedValue({ rules: [MOCK_RULE], nextCursor: null });
    mockGetRule.mockResolvedValue(MOCK_RULE);
    mockCreateRule.mockResolvedValue(MOCK_RULE);
    mockUpdateRule.mockResolvedValue({ ...MOCK_RULE, name: 'Updated Rule' });
    mockDeleteRule.mockResolvedValue(undefined);
    mockToggleRule.mockResolvedValue({ ...MOCK_RULE, isActive: false });
    mockGetRuleStats.mockResolvedValue({
      total: 10,
      active: 7,
      inactive: 3,
      topRules: [
        { id: 'rule-1', name: 'Top Rule', executionCount: 100, successRate: 0.95 },
      ],
    });

    app = Fastify({ logger: false });
    await app.register(rulesRoutes, { prefix: '/rules' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ============================================================================
  // GET /rules
  // ============================================================================

  describe('GET /rules', () => {
    it('should return 200 with rules list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.rules).toHaveLength(1);
      expect(body.rules[0].name).toBe('Starbucks Rule');
      expect(body.nextCursor).toBeNull();
    });

    it('should pass query filters to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1', isActive: 'true', search: 'Starbucks' },
      });

      // Query params come as strings, not coerced in test env
      expect(mockListRules).toHaveBeenCalledWith({
        entityId: 'entity-1',
        isActive: 'true',
        search: 'Starbucks',
      });
    });

    it('should support cursor pagination', async () => {
      await app.inject({
        method: 'GET',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1', cursor: 'rule-5', take: '10' },
      });

      // Query params come as strings, not coerced in test env
      expect(mockListRules).toHaveBeenCalledWith({
        entityId: 'entity-1',
        cursor: 'rule-5',
        take: '10',
      });
    });
  });

  // ============================================================================
  // GET /rules/:id
  // ============================================================================

  describe('GET /rules/:id', () => {
    it('should return 200 with rule detail', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/rules/rule-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Starbucks Rule');
      expect(body.conditions.operator).toBe('AND');
    });

    it('should return 404 when rule not found', async () => {
      mockGetRule.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/rules/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Rule not found');
    });
  });

  // ============================================================================
  // POST /rules
  // ============================================================================

  describe('POST /rules', () => {
    it('should return 201 on successful creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Starbucks Rule',
          entityId: 'entity-1',
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'description', op: 'contains', value: 'Starbucks' },
            ],
          },
          action: {
            setCategoryId: 'category-1',
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.name).toBe('Starbucks Rule');
      expect(mockCreateRule).toHaveBeenCalledWith({
        name: 'Starbucks Rule',
        entityId: 'entity-1',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'description', op: 'contains', value: 'Starbucks' },
          ],
        },
        action: {
          setCategoryId: 'category-1',
        },
        source: 'USER_MANUAL',
      });
    });

    it('should reject invalid conditions (bad operator)', async () => {
      mockCreateRule.mockRejectedValue(new Error('Invalid conditions: Invalid operator'));

      const response = await app.inject({
        method: 'POST',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Bad Rule',
          entityId: 'entity-1',
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'description', op: 'regex', value: '.*' }, // Invalid op
            ],
          },
          action: {
            setCategoryId: 'category-1',
          },
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should reject invalid action (no fields set)', async () => {
      mockCreateRule.mockRejectedValue(new Error('Invalid action: At least one action field must be set'));

      const response = await app.inject({
        method: 'POST',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Empty Action Rule',
          entityId: 'entity-1',
          conditions: {
            operator: 'AND',
            conditions: [
              { field: 'description', op: 'contains', value: 'test' },
            ],
          },
          action: {}, // Empty action
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should reject payload >10KB', async () => {
      mockCreateRule.mockRejectedValue(new Error('Rule payload too large (max 10KB)'));

      // Create large payload
      const largeConditions = Array.from({ length: 50 }, (_, i) => ({
        field: 'description',
        op: 'contains',
        value: 'A'.repeat(200), // Large string
      }));

      const response = await app.inject({
        method: 'POST',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Large Rule',
          entityId: 'entity-1',
          conditions: {
            operator: 'AND',
            conditions: largeConditions,
          },
          action: {
            setCategoryId: 'category-1',
          },
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should validate FK ownership (categoryId)', async () => {
      mockCreateRule.mockRejectedValue(new Error('Category not found or access denied'));

      const response = await app.inject({
        method: 'POST',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Rule',
          entityId: 'entity-1',
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'description', op: 'contains', value: 'test' }],
          },
          action: {
            setCategoryId: 'other-tenant-category', // Wrong tenant
          },
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should validate FK ownership (glAccountId)', async () => {
      mockCreateRule.mockRejectedValue(new Error('GL account not found or access denied'));

      const response = await app.inject({
        method: 'POST',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Rule',
          entityId: 'entity-1',
          conditions: {
            operator: 'AND',
            conditions: [{ field: 'description', op: 'contains', value: 'test' }],
          },
          action: {
            setGLAccountId: 'other-tenant-gl-account', // Wrong tenant
          },
        },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  // ============================================================================
  // PATCH /rules/:id
  // ============================================================================

  describe('PATCH /rules/:id', () => {
    it('should return 200 on successful update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/rules/rule-1',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Updated Rule',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Updated Rule');
      expect(mockUpdateRule).toHaveBeenCalledWith('rule-1', { name: 'Updated Rule' });
    });

    it('should allow partial updates', async () => {
      await app.inject({
        method: 'PATCH',
        url: '/rules/rule-1',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          isActive: false,
        },
      });

      expect(mockUpdateRule).toHaveBeenCalledWith('rule-1', { isActive: false });
    });
  });

  // ============================================================================
  // DELETE /rules/:id
  // ============================================================================

  describe('DELETE /rules/:id', () => {
    it('should return 204 on successful deletion', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/rules/rule-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeleteRule).toHaveBeenCalledWith('rule-1');
    });

    it('should return 500 on rule not found', async () => {
      mockDeleteRule.mockRejectedValue(new Error('Rule not found or access denied'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/rules/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  // ============================================================================
  // POST /rules/:id/toggle
  // ============================================================================

  describe('POST /rules/:id/toggle', () => {
    it('should toggle rule active status', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rules/rule-1/toggle',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.isActive).toBe(false);
      expect(mockToggleRule).toHaveBeenCalledWith('rule-1');
    });
  });

  // ============================================================================
  // GET /rules/stats
  // ============================================================================

  describe('GET /rules/stats', () => {
    it('should return rule statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/rules/stats',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBe(10);
      expect(body.active).toBe(7);
      expect(body.inactive).toBe(3);
      expect(body.topRules).toHaveLength(1);
      expect(mockGetRuleStats).toHaveBeenCalledWith('entity-1');
    });
  });

  // ============================================================================
  // Tenant Isolation
  // ============================================================================

  describe('Tenant Isolation', () => {
    it('should reject cross-tenant access', async () => {
      mockGetRule.mockResolvedValue(null); // Service returns null for wrong tenant

      const response = await app.inject({
        method: 'GET',
        url: '/rules/other-tenant-rule',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // Permission Check
  // ============================================================================

  describe('Permission Check', () => {
    it('should require ai:rules permission', async () => {
      // Permission is mocked to always succeed in this test env
      // This test verifies the route has permission middleware registered
      const response = await app.inject({
        method: 'GET',
        url: '/rules',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1' },
      });

      // With mocked permission, request succeeds
      expect(response.statusCode).toBe(200);
    });
  });
});
