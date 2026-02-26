import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import { aiRoutes } from '../routes';

// Mock services
const mockListInsights = vi.fn();
const mockGetInsight = vi.fn();
const mockDismissInsight = vi.fn();
const mockSnoozeInsight = vi.fn();
const mockGetInsightCounts = vi.fn();

vi.mock('../services/insight.service', () => ({
  InsightService: function (this: Record<string, unknown>) {
    this.listInsights = mockListInsights;
    this.getInsight = mockGetInsight;
    this.dismissInsight = mockDismissInsight;
    this.snoozeInsight = mockSnoozeInsight;
    this.getInsightCounts = mockGetInsightCounts;
  },
}));

// Mock other services
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

vi.mock('@akount/db', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    prisma: {
      entity: { findFirst: vi.fn() },
      transaction: { findMany: vi.fn().mockResolvedValue([]) },
      aIAction: { findFirst: vi.fn() },
    },
  };
});

vi.mock('../../../lib/audit');
vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../middleware/rate-limit', () => ({
  aiRateLimitConfig: () => ({}),
  aiChatRateLimitConfig: () => ({}),
}));

vi.mock('../../../middleware/validation', () => ({
  validateBody: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateQuery: vi.fn(() => async () => {}),
}));

// Mock middleware
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: async (request: unknown) => {
    // @ts-expect-error - Mock property
    request.userId = 'user-test-001';
    // @ts-expect-error - Mock property
    request.tenantId = 'tenant-abc-123';
  },
}));

vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: async () => {},
}));

vi.mock('../../../middleware/withPermission', () => ({
  withPermission: () => ({}),
}));

// Mock sub-route services
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

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';
const ENTITY_ID = 'cltest00000000000000entity';
const INSIGHT_ID = 'cltest0000000000insight01';
const INSIGHT_ID_2 = 'cltest0000000000insight02';
const CURSOR_ID = 'cltest000000000000cursor1';

function mockInsight(overrides: Record<string, unknown> = {}) {
  return {
    id: INSIGHT_ID,
    entityId: ENTITY_ID,
    triggerId: `cash_flow_warning:${ENTITY_ID}:2026-02`,
    title: 'Cash Flow Warning',
    description: 'Projected balance dropping below threshold',
    type: 'cash_flow_warning',
    priority: 'critical',
    status: 'active',
    ...overrides,
  };
}

describe('Insight Routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    await app.register(aiRoutes, { prefix: '/ai' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /insights', () => {
    it('should return 200 with insights list', async () => {
      const insights = [mockInsight(), mockInsight({ id: INSIGHT_ID_2 })];
      mockListInsights.mockResolvedValue({ insights, nextCursor: null });

      const response = await app.inject({
        method: 'GET',
        url: `/ai/insights?entityId=${ENTITY_ID}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.insights).toHaveLength(2);
      expect(mockListInsights).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: ENTITY_ID })
      );
    });

    it('should return 400 when entityId is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ai/insights',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should filter by type', async () => {
      mockListInsights.mockResolvedValue({ insights: [mockInsight()], nextCursor: null });

      await app.inject({
        method: 'GET',
        url: `/ai/insights?entityId=${ENTITY_ID}&type=cash_flow_warning`,
      });

      expect(mockListInsights).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cash_flow_warning' })
      );
    });

    it('should handle cursor pagination', async () => {
      mockListInsights.mockResolvedValue({ insights: [mockInsight()], nextCursor: CURSOR_ID });

      const response = await app.inject({
        method: 'GET',
        url: `/ai/insights?entityId=${ENTITY_ID}&cursor=${CURSOR_ID}&limit=10`,
      });

      expect(response.statusCode).toBe(200);
      expect(mockListInsights).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: CURSOR_ID, limit: 10 })
      );
    });
  });

  describe('GET /insights/:id', () => {
    it('should return 200 with insight', async () => {
      const insight = mockInsight();
      mockGetInsight.mockResolvedValue(insight);

      const response = await app.inject({
        method: 'GET',
        url: `/ai/insights/${INSIGHT_ID}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(INSIGHT_ID);
    });

    it('should return 404 when insight not found', async () => {
      mockGetInsight.mockRejectedValue(new Error('Insight not found'));

      const response = await app.inject({
        method: 'GET',
        url: `/ai/insights/${INSIGHT_ID}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /insights/:id/dismiss', () => {
    it('should dismiss insight and return 200', async () => {
      const dismissed = mockInsight({ status: 'dismissed', dismissedAt: new Date() });
      mockDismissInsight.mockResolvedValue(dismissed);

      const response = await app.inject({
        method: 'POST',
        url: `/ai/insights/${INSIGHT_ID}/dismiss`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('dismissed');
    });
  });

  describe('POST /insights/:id/snooze', () => {
    it('should snooze insight until future date', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const snoozed = mockInsight({ status: 'snoozed', snoozedUntil: tomorrow });
      mockSnoozeInsight.mockResolvedValue(snoozed);

      const response = await app.inject({
        method: 'POST',
        url: `/ai/insights/${INSIGHT_ID}/snooze`,
        payload: { id: INSIGHT_ID, snoozedUntil: tomorrow.toISOString() },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('snoozed');
    });
  });

  describe('GET /insights/counts', () => {
    it('should return counts grouped by priority and type', async () => {
      const counts = {
        total: 5,
        byPriority: { low: 1, medium: 2, high: 1, critical: 1 },
        byType: {
          cash_flow_warning: 1,
          spending_anomaly: 2,
          duplicate_expense: 0,
          overdue_alert: 1,
          tax_estimate: 0,
          revenue_trend: 1,
          reconciliation_gap: 0,
        },
      };
      mockGetInsightCounts.mockResolvedValue(counts);

      const response = await app.inject({
        method: 'GET',
        url: `/ai/insights/counts?entityId=${ENTITY_ID}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBe(5);
      expect(body.byPriority.critical).toBe(1);
    });

    it('should return 400 when entityId is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ai/insights/counts',
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
