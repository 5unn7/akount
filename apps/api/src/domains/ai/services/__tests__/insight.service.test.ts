import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsightService } from '../insight.service';
import type { InsightResult } from '../../types/insight.types';

// Mock createAuditLog
const mockCreateAuditLog = vi.fn();
vi.mock('../../../../lib/audit', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

// Mock Prisma client
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    insight: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
    entity: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
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
    impact: 85,
    confidence: 0.9,
    actionable: true,
    status: 'active',
    deadline: null,
    dismissedAt: null,
    dismissedBy: null,
    snoozedUntil: null,
    metadata: { currentBalance: 50000, projectedLow: 3000, daysUntilLow: 14, threshold: 5000 },
    createdAt: new Date('2026-02-26'),
    updatedAt: new Date('2026-02-26'),
    ...overrides,
  };
}

function mockEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: ENTITY_ID,
    tenantId: TENANT_ID,
    name: 'Test Entity',
    ...overrides,
  };
}

describe('InsightService', () => {
  let service: InsightService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InsightService(TENANT_ID, USER_ID);
    // Default entity validation to pass
    mockFindFirst.mockResolvedValue(mockEntity());
  });

  describe('listInsights', () => {
    it('should list insights with tenant isolation', async () => {
      const insights = [mockInsight(), mockInsight({ id: 'insight-2', type: 'overdue_alert' })];
      mockFindMany.mockResolvedValue(insights);

      const result = await service.listInsights({ entityId: ENTITY_ID });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          entity: { tenantId: TENANT_ID },
          entityId: ENTITY_ID,
        }),
        cursor: undefined,
        skip: 0,
        take: 20,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
      expect(result.insights).toEqual(insights);
      expect(result.nextCursor).toBeNull();
    });

    it('should filter by type', async () => {
      mockFindMany.mockResolvedValue([mockInsight()]);

      await service.listInsights({ entityId: ENTITY_ID, type: 'cash_flow_warning' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'cash_flow_warning',
          }),
        })
      );
    });

    it('should filter by priority', async () => {
      mockFindMany.mockResolvedValue([mockInsight()]);

      await service.listInsights({ entityId: ENTITY_ID, priority: 'critical' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'critical',
          }),
        })
      );
    });

    it('should handle cursor pagination', async () => {
      mockFindMany.mockResolvedValue([mockInsight({ id: 'insight-2' })]);

      await service.listInsights({ entityId: ENTITY_ID, cursor: 'insight-1', limit: 10 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'insight-1' },
          skip: 1,
          take: 10,
        })
      );
    });
  });

  describe('getInsight', () => {
    it('should return insight with tenant isolation', async () => {
      const insight = mockInsight();
      mockFindFirst.mockResolvedValueOnce(insight);

      const result = await service.getInsight('insight-1');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'insight-1',
          entity: { tenantId: TENANT_ID },
        },
      });
      expect(result).toEqual(insight);
    });

    it('should throw when insight not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.getInsight('invalid-id')).rejects.toThrow('Insight not found');
    });
  });

  describe('upsertInsight', () => {
    const insightResult: InsightResult = {
      triggerId: 'cash_flow_warning:entity-123:2026-02',
      title: 'Cash Flow Warning',
      description: 'Balance dropping below $5,000',
      type: 'cash_flow_warning',
      priority: 'critical',
      impact: 85,
      confidence: 0.9,
      actionable: true,
      metadata: { currentBalance: 50000, projectedLow: 3000, daysUntilLow: 14, threshold: 5000 },
    };

    it('should create new insight when triggerId does not exist', async () => {
      mockUpsert.mockResolvedValue(mockInsight());

      const result = await service.upsertInsight(ENTITY_ID, insightResult);

      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          entityId_triggerId: {
            entityId: ENTITY_ID,
            triggerId: insightResult.triggerId,
          },
        },
        create: expect.objectContaining({
          entityId: ENTITY_ID,
          triggerId: insightResult.triggerId,
          title: insightResult.title,
          status: 'active',
        }),
        update: expect.any(Object),
      });
      expect(result).toEqual(mockInsight());
    });

    it('should update existing insight when triggerId exists', async () => {
      mockUpsert.mockResolvedValue(mockInsight({ updatedAt: new Date('2026-02-27') }));

      const result = await service.upsertInsight(ENTITY_ID, insightResult);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            title: insightResult.title,
            status: 'active', // Reactivate if dismissed/snoozed
          }),
        })
      );
      expect(result.updatedAt).toBeTruthy();
    });

    it('should throw when entity not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.upsertInsight(ENTITY_ID, insightResult)).rejects.toThrow(
        'Entity not found or access denied'
      );
    });
  });

  describe('dismissInsight', () => {
    it('should dismiss insight and create audit log', async () => {
      const existing = mockInsight({ status: 'active' });
      const dismissed = mockInsight({ status: 'dismissed', dismissedAt: new Date(), dismissedBy: USER_ID });

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValue(dismissed);

      const result = await service.dismissInsight('insight-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'insight-1' },
        data: {
          status: 'dismissed',
          dismissedAt: expect.any(Date),
          dismissedBy: USER_ID,
        },
      });
      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Insight',
        recordId: 'insight-1',
        action: 'UPDATE',
        before: { status: 'active' },
        after: expect.objectContaining({ status: 'dismissed' }),
      });
      expect(result.status).toBe('dismissed');
    });

    it('should throw when insight not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.dismissInsight('invalid-id')).rejects.toThrow('Insight not found');
    });
  });

  describe('snoozeInsight', () => {
    it('should snooze insight until future date', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const existing = mockInsight({ status: 'active' });
      const snoozed = mockInsight({ status: 'snoozed', snoozedUntil: tomorrow });

      mockFindFirst.mockResolvedValueOnce(existing);
      mockUpdate.mockResolvedValue(snoozed);

      const result = await service.snoozeInsight('insight-1', tomorrow);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'insight-1' },
        data: {
          status: 'snoozed',
          snoozedUntil: tomorrow,
        },
      });
      expect(result.status).toBe('snoozed');
    });

    it('should throw when snooze date is in the past', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockFindFirst.mockResolvedValueOnce(mockInsight());

      await expect(service.snoozeInsight('insight-1', yesterday)).rejects.toThrow(
        'Snooze date must be in the future'
      );
    });
  });

  describe('expireStaleInsights', () => {
    it('should reactivate expired snoozes and expire old active insights', async () => {
      mockUpdateMany.mockResolvedValueOnce({ count: 2 }); // Reactivated
      mockUpdateMany.mockResolvedValueOnce({ count: 3 }); // Expired

      const result = await service.expireStaleInsights(ENTITY_ID);

      expect(result).toEqual({ reactivated: 2, expired: 3 });
      expect(mockUpdateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('getInsightCounts', () => {
    it('should return counts grouped by priority and type', async () => {
      const insights = [
        { priority: 'critical', type: 'cash_flow_warning' },
        { priority: 'high', type: 'overdue_alert' },
        { priority: 'critical', type: 'spending_anomaly' },
      ];
      mockFindMany.mockResolvedValue(insights);

      const result = await service.getInsightCounts(ENTITY_ID);

      expect(result.total).toBe(3);
      expect(result.byPriority.critical).toBe(2);
      expect(result.byPriority.high).toBe(1);
      expect(result.byType.cash_flow_warning).toBe(1);
      expect(result.byType.overdue_alert).toBe(1);
      expect(result.byType.spending_anomaly).toBe(1);
    });
  });
});
