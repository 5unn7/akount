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
  InsightService: vi.fn().mockImplementation(() => ({
    listInsights: mockListInsights,
    getInsight: mockGetInsight,
    dismissInsight: mockDismissInsight,
    snoozeInsight: mockSnoozeInsight,
    getInsightCounts: mockGetInsightCounts,
  })),
}));

// Mock other services
vi.mock('../services/ai.service');
vi.mock('../services/categorization.service');
vi.mock('../services/je-suggestion.service');
vi.mock('@akount/db');
vi.mock('../../../lib/audit');
vi.mock('../../../middleware/rate-limit', () => ({
  aiRateLimitConfig: () => ({}),
  aiChatRateLimitConfig: () => ({}),
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

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';
const ENTITY_ID = 'entity-123';

function mockInsight(overrides: Record<string, unknown> = {}) {
  return {
    id: 'insight-1',
    entityId: ENTITY_ID,
    triggerId: 'cash_flow_warning:entity-123:2026-02',
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
      const insights = [mockInsight(), mockInsight({ id: 'insight-2' })];
      mockListInsights.mockResolvedValue({ insights, nextCursor: null });

      const response = await app.inject({
        method: 'GET',
        url: '/ai/insights?entityId=entity-123',
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
        url: '/ai/insights?entityId=entity-123&type=cash_flow_warning',
      });

      expect(mockListInsights).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cash_flow_warning' })
      );
    });

    it('should handle cursor pagination', async () => {
      mockListInsights.mockResolvedValue({ insights: [mockInsight()], nextCursor: 'next-id' });

      const response = await app.inject({
        method: 'GET',
        url: '/ai/insights?entityId=entity-123&cursor=prev-id&limit=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockListInsights).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: 'prev-id', limit: 10 })
      );
    });
  });

  describe('GET /insights/:id', () => {
    it('should return 200 with insight', async () => {
      const insight = mockInsight();
      mockGetInsight.mockResolvedValue(insight);

      const response = await app.inject({
        method: 'GET',
        url: '/ai/insights/insight-1',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('insight-1');
    });

    it('should return 404 when insight not found', async () => {
      mockGetInsight.mockRejectedValue(new Error('Insight not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/ai/insights/invalid-id',
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
        url: '/ai/insights/insight-1/dismiss',
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
        url: '/ai/insights/insight-1/snooze',
        payload: { id: 'insight-1', snoozedUntil: tomorrow.toISOString() },
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
        url: '/ai/insights/counts?entityId=entity-123',
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
