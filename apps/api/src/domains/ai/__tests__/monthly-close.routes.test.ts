import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { aiRoutes } from '../routes';

// ---------------------------------------------------------------------------
// Hoisted mocks (must be before vi.mock calls)
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  getCloseReadiness: vi.fn(),
  executeClose: vi.fn(),
  auditLogFindMany: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mocks — middleware
// ---------------------------------------------------------------------------

vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw { statusCode: 401, message: 'Unauthorized' };
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-mc-test';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async () => {},
  })),
}));

vi.mock('../../../middleware/validation', () => ({
  validateBody: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateQuery: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/rate-limit', () => ({
  aiChatRateLimitConfig: vi.fn(() => ({})),
  aiRateLimitConfig: vi.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// Mocks — parent route services (needed for aiRoutes registration)
// ---------------------------------------------------------------------------

vi.mock('../services/ai.service', () => ({
  aiService: { chat: vi.fn() },
}));

vi.mock('../services/categorization.service', () => ({
  CategorizationService: function (this: Record<string, unknown>) {
    this.categorize = vi.fn();
    this.categorizeBatch = vi.fn();
  },
}));

vi.mock('../services/je-suggestion.service', () => ({
  JESuggestionService: function (this: Record<string, unknown>) {
    this.suggestBatch = vi.fn();
    this.createDraftJEs = vi.fn();
  },
}));

vi.mock('../services/ai-action.service', () => ({
  AIActionService: function (this: Record<string, unknown>) {
    this.listActions = vi.fn();
    this.getStats = vi.fn();
    this.approveAction = vi.fn();
    this.rejectAction = vi.fn();
    this.batchApprove = vi.fn();
    this.batchReject = vi.fn();
  },
}));

// ---------------------------------------------------------------------------
// Mocks — MonthlyCloseService (the actual subject)
// ---------------------------------------------------------------------------

vi.mock('../services/monthly-close.service', () => ({
  MonthlyCloseService: function (this: Record<string, unknown>) {
    this.getCloseReadiness = mocks.getCloseReadiness;
    this.executeClose = mocks.executeClose;
  },
}));

// Mock InsightService and RuleService (imported by sibling routes)
vi.mock('../services/insight.service', () => ({
  InsightService: function (this: Record<string, unknown>) {
    this.listInsights = vi.fn();
    this.dismissInsight = vi.fn();
    this.snoozeInsight = vi.fn();
    this.generateInsights = vi.fn();
    this.getInsightCounts = vi.fn();
  },
}));

vi.mock('../services/rule.service', () => ({
  RuleService: function (this: Record<string, unknown>) {
    this.listRules = vi.fn();
    this.getRule = vi.fn();
    this.createRule = vi.fn();
    this.updateRule = vi.fn();
    this.deleteRule = vi.fn();
    this.toggleRule = vi.fn();
    this.getRuleStats = vi.fn();
  },
}));

// Mock Prisma (needed for audit log query in history endpoint)
vi.mock('@akount/db', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    prisma: {
      entity: { findFirst: vi.fn() },
      transaction: { findMany: vi.fn().mockResolvedValue([]) },
      aIAction: { findFirst: vi.fn() },
      auditLog: { findMany: mocks.auditLogFindMany },
    },
  };
});

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ENTITY_ID = 'cltest00000000000000entity';
const PERIOD_ID = 'cltest0000000000000period';

const MOCK_READINESS_REPORT = {
  periodId: PERIOD_ID,
  periodName: 'January 2026',
  score: 85,
  canClose: false,
  items: [
    { label: 'Unreconciled transactions', status: 'pass', count: 0, details: 'All clear', weight: 20 },
    { label: 'Overdue invoices', status: 'warn', count: 2, details: '2 invoices', weight: 15 },
  ],
  generatedAt: new Date().toISOString(),
};

const MOCK_CLOSE_RESULT = {
  success: true,
  periodId: PERIOD_ID,
  periodName: 'January 2026',
};

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Monthly Close Routes', () => {
  // -------------------------------------------------------------------------
  // GET /api/ai/monthly-close/readiness
  // -------------------------------------------------------------------------

  describe('GET /api/ai/monthly-close/readiness', () => {
    it('should return readiness report', async () => {
      mocks.getCloseReadiness.mockResolvedValue(MOCK_READINESS_REPORT);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/monthly-close/readiness?entityId=${ENTITY_ID}&periodId=${PERIOD_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.periodId).toBe(PERIOD_ID);
      expect(body.score).toBe(85);
      expect(body.canClose).toBe(false);
      expect(body.items).toHaveLength(2);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/monthly-close/readiness?entityId=${ENTITY_ID}&periodId=${PERIOD_ID}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle service errors', async () => {
      const { AIError } = await import('../errors');
      mocks.getCloseReadiness.mockRejectedValue(
        new AIError('Period not found', 'PERIOD_NOT_FOUND', 404),
      );

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/monthly-close/readiness?entityId=${ENTITY_ID}&periodId=${PERIOD_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('PERIOD_NOT_FOUND');
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/ai/monthly-close/execute
  // -------------------------------------------------------------------------

  describe('POST /api/ai/monthly-close/execute', () => {
    it('should execute close when ready', async () => {
      mocks.executeClose.mockResolvedValue(MOCK_CLOSE_RESULT);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/monthly-close/execute',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID, periodId: PERIOD_ID },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.periodId).toBe(PERIOD_ID);
      expect(mocks.executeClose).toHaveBeenCalledWith(ENTITY_ID, PERIOD_ID);
    });

    it('should return error when not ready', async () => {
      const { AIError } = await import('../errors');
      mocks.executeClose.mockRejectedValue(
        new AIError('Cannot close — score is 85%', 'PERIOD_NOT_READY', 400, {
          score: 85,
          failingItems: ['Overdue invoices: 2 outstanding'],
        }),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/monthly-close/execute',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID, periodId: PERIOD_ID },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('PERIOD_NOT_READY');
      expect(body.details).toHaveProperty('score', 85);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/monthly-close/execute',
        payload: { entityId: ENTITY_ID, periodId: PERIOD_ID },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/ai/monthly-close/history
  // -------------------------------------------------------------------------

  describe('GET /api/ai/monthly-close/history', () => {
    it('should return close history', async () => {
      const mockEntries = [
        {
          id: 'audit-1',
          recordId: PERIOD_ID,
          action: 'UPDATE',
          before: { readinessScore: 100 },
          after: { action: 'MONTHLY_CLOSE', status: 'CLOSED' },
          userId: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ];
      mocks.auditLogFindMany.mockResolvedValue(mockEntries);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/monthly-close/history?entityId=${ENTITY_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.items).toHaveLength(1);
      expect(body.hasMore).toBe(false);
    });

    it('should support cursor pagination', async () => {
      // Return 6 items (take=5 + 1 extra → hasMore=true)
      const entries = Array.from({ length: 6 }, (_, i) => ({
        id: `audit-${i}`,
        recordId: PERIOD_ID,
        action: 'UPDATE',
        before: {},
        after: { action: 'MONTHLY_CLOSE' },
        userId: 'user-1',
        createdAt: new Date().toISOString(),
      }));
      mocks.auditLogFindMany.mockResolvedValue(entries);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/monthly-close/history?entityId=${ENTITY_ID}&take=5`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.items).toHaveLength(5);
      expect(body.hasMore).toBe(true);
      expect(body.nextCursor).toBe('audit-4');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/monthly-close/history?entityId=${ENTITY_ID}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
