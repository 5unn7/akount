import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectionService } from '../anomaly-detection.service';
import type { InsightResult } from '../../types/insight.types';

// Mock the analyzers
vi.mock('../analyzers/subscription-creep.analyzer', () => ({
  analyzeSubscriptionCreep: vi.fn(),
}));

vi.mock('../analyzers/cash-flow-danger.analyzer', () => ({
  analyzeCashFlowDanger: vi.fn(),
}));

vi.mock('../analyzers/missing-transactions.analyzer', () => ({
  analyzeMissingTransactions: vi.fn(),
}));

// Create mock class instances
const mockUpsertInsight = vi.fn().mockResolvedValue({ id: 'insight-123' });
const mockCreateAction = vi.fn().mockResolvedValue({ id: 'action-123' });

// Mock the services
vi.mock('../insight.service', () => ({
  InsightService: class {
    upsertInsight = mockUpsertInsight;
  },
}));

vi.mock('../ai-action.service', () => ({
  AIActionService: class {
    createAction = mockCreateAction;
  },
}));

import { analyzeSubscriptionCreep } from '../analyzers/subscription-creep.analyzer';
import { analyzeCashFlowDanger } from '../analyzers/cash-flow-danger.analyzer';
import { analyzeMissingTransactions } from '../analyzers/missing-transactions.analyzer';

const TENANT_ID = 'tenant-123';
const USER_ID = 'user-123';
const ENTITY_ID = 'entity-123';

function mockInsight(overrides: Partial<InsightResult> = {}): InsightResult {
  return {
    triggerId: 'test-trigger',
    title: 'Test Insight',
    description: 'Test description',
    type: 'spending_anomaly',
    priority: 'medium',
    impact: 10000,
    confidence: 80,
    actionable: true,
    ...overrides,
  };
}

describe('AnomalyDetectionService', () => {
  let service: AnomalyDetectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to successful state
    mockUpsertInsight.mockReset().mockResolvedValue({ id: 'insight-123' });
    mockCreateAction.mockReset().mockResolvedValue({ id: 'action-123' });
    service = new AnomalyDetectionService(TENANT_ID, USER_ID, ENTITY_ID);
  });

  describe('detectAnomalies', () => {
    it('should run all analyzers when no types filter provided', async () => {
      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies();

      expect(analyzeSubscriptionCreep).toHaveBeenCalledWith(ENTITY_ID, TENANT_ID);
      expect(analyzeCashFlowDanger).toHaveBeenCalledWith(ENTITY_ID, TENANT_ID);
      expect(analyzeMissingTransactions).toHaveBeenCalledWith(ENTITY_ID, TENANT_ID);
    });

    it('should only run specified analyzers when types filter provided', async () => {
      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies(['subscription_creep']);

      expect(analyzeSubscriptionCreep).toHaveBeenCalledWith(ENTITY_ID, TENANT_ID);
      expect(analyzeCashFlowDanger).not.toHaveBeenCalled();
      expect(analyzeMissingTransactions).not.toHaveBeenCalled();
    });

    it('should return correct anomaly counts in summary', async () => {
      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([
        mockInsight({ triggerId: 'sub-1' }),
        mockInsight({ triggerId: 'sub-2' }),
      ]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([
        mockInsight({ triggerId: 'cf-1' }),
      ]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([
        mockInsight({ triggerId: 'miss-1' }),
        mockInsight({ triggerId: 'miss-2' }),
        mockInsight({ triggerId: 'miss-3' }),
      ]);

      const summary = await service.detectAnomalies();

      // Verify all insights were processed
      expect(mockUpsertInsight).toHaveBeenCalledTimes(6); // 2 + 1 + 3
      expect(summary.generated).toBe(6); // All succeeded
      expect(summary.anomalies.subscriptionCreep).toBe(2);
      expect(summary.anomalies.cashFlowDanger).toBe(1);
      expect(summary.anomalies.missingTransactions).toBe(3);
    });

    it('should upsert insights for each anomaly', async () => {
      const insight1 = mockInsight({ triggerId: 'sub-1' });
      const insight2 = mockInsight({ triggerId: 'cf-1' });

      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([insight1]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([insight2]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies();

      // Verify upsertInsight was called correctly
      expect(mockUpsertInsight).toHaveBeenCalledWith(ENTITY_ID, insight1);
      expect(mockUpsertInsight).toHaveBeenCalledWith(ENTITY_ID, insight2);
      expect(mockUpsertInsight).toHaveBeenCalledTimes(2);
    });

    it('should create AIAction for critical + actionable insights', async () => {
      const criticalInsight = mockInsight({
        triggerId: 'critical-1',
        priority: 'critical',
        actionable: true,
        title: 'Critical Anomaly',
        description: 'Critical description',
        type: 'cash_flow_warning',
        confidence: 95,
        impact: 100000,
      });

      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([criticalInsight]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies();

      expect(mockCreateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: ENTITY_ID,
          type: 'ALERT',
          title: 'Critical Anomaly',
          priority: 'CRITICAL',
          payload: expect.objectContaining({
            insightId: 'critical-1',
          }),
        })
      );
    });

    it('should create AIAction for high + actionable insights', async () => {
      const highInsight = mockInsight({
        triggerId: 'high-1',
        priority: 'high',
        actionable: true,
      });

      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([highInsight]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies();

      expect(mockCreateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'HIGH',
        })
      );
    });

    it('should NOT create AIAction for medium priority insights', async () => {
      const mediumInsight = mockInsight({
        priority: 'medium',
        actionable: true,
      });

      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([mediumInsight]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies();

      expect(mockCreateAction).not.toHaveBeenCalled();
    });

    it('should NOT create AIAction for non-actionable insights', async () => {
      const nonActionableInsight = mockInsight({
        priority: 'critical',
        actionable: false,
      });

      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([nonActionableInsight]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      await service.detectAnomalies();

      expect(mockCreateAction).not.toHaveBeenCalled();
    });

    it('should isolate errors between analyzers', async () => {
      vi.mocked(analyzeSubscriptionCreep).mockRejectedValue(
        new Error('Subscription analyzer failed')
      );
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([
        mockInsight({ triggerId: 'cf-1' }),
      ]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      const summary = await service.detectAnomalies();

      // Other analyzers should still run
      expect(summary.generated).toBe(1); // Only cash flow insight
      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0]).toContain('subscription_creep');
    });

    it('should handle upsert failures gracefully', async () => {
      const insight = mockInsight({ triggerId: 'test-1' });
      vi.mocked(analyzeSubscriptionCreep).mockResolvedValue([insight]);
      vi.mocked(analyzeCashFlowDanger).mockResolvedValue([]);
      vi.mocked(analyzeMissingTransactions).mockResolvedValue([]);

      // Make upsertInsight fail
      mockUpsertInsight.mockRejectedValueOnce(new Error('Upsert failed'));

      const summary = await service.detectAnomalies();

      expect(summary.generated).toBe(0); // Upsert failed, not counted
      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0]).toContain('Upsert');
    });
  });
});
