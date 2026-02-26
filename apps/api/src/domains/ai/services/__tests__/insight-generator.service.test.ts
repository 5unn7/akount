import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InsightResult } from '../../types/insight.types';

// Hoist mocks so they're available in vi.mock() factories
const {
  mockUpsertInsight,
  mockCreateAction,
  mockGetMetrics,
  mockGetCashFlowProjection,
  mockGetExpenseBreakdown,
  mockGetActionItems,
  mockAnalyzeCashFlow,
  mockAnalyzeOverdue,
  mockAnalyzeSpending,
  mockAnalyzeDuplicates,
  mockAnalyzeRevenue,
  mockAnalyzeReconciliation,
} = vi.hoisted(() => ({
  mockUpsertInsight: vi.fn(),
  mockCreateAction: vi.fn(),
  mockGetMetrics: vi.fn(),
  mockGetCashFlowProjection: vi.fn(),
  mockGetExpenseBreakdown: vi.fn(),
  mockGetActionItems: vi.fn(),
  mockAnalyzeCashFlow: vi.fn().mockReturnValue([]),
  mockAnalyzeOverdue: vi.fn().mockReturnValue([]),
  mockAnalyzeSpending: vi.fn().mockReturnValue([]),
  mockAnalyzeDuplicates: vi.fn().mockReturnValue([]),
  mockAnalyzeRevenue: vi.fn().mockResolvedValue([]),
  mockAnalyzeReconciliation: vi.fn().mockResolvedValue([]),
}));

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock services as classes
vi.mock('../insight.service', () => ({
  InsightService: class { upsertInsight = mockUpsertInsight; },
}));

vi.mock('../ai-action.service', () => ({
  AIActionService: class { createAction = mockCreateAction; },
}));

vi.mock('../../../overview/services/dashboard.service', () => ({
  DashboardService: class {
    getMetrics = mockGetMetrics;
    getCashFlowProjection = mockGetCashFlowProjection;
    getExpenseBreakdown = mockGetExpenseBreakdown;
    getActionItems = mockGetActionItems;
  },
}));

// Mock analyzers
vi.mock('../analyzers/cash-flow.analyzer', () => ({
  analyzeCashFlow: (...args: unknown[]) => mockAnalyzeCashFlow(...args),
}));
vi.mock('../analyzers/overdue.analyzer', () => ({
  analyzeOverdue: (...args: unknown[]) => mockAnalyzeOverdue(...args),
}));
vi.mock('../analyzers/spending.analyzer', () => ({
  analyzeSpending: (...args: unknown[]) => mockAnalyzeSpending(...args),
}));
vi.mock('../analyzers/duplicate.analyzer', () => ({
  analyzeDuplicates: (...args: unknown[]) => mockAnalyzeDuplicates(...args),
}));
vi.mock('../analyzers/revenue.analyzer', () => ({
  analyzeRevenue: (...args: unknown[]) => mockAnalyzeRevenue(...args),
}));
vi.mock('../analyzers/reconciliation.analyzer', () => ({
  analyzeReconciliation: (...args: unknown[]) => mockAnalyzeReconciliation(...args),
}));

vi.mock('@akount/db');

// Import after mocks are set up
import { InsightGeneratorService } from '../insight-generator.service';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';
const ENTITY_ID = 'entity-123';

function mockSharedData() {
  return {
    metrics: {
      netWorth: { amount: 100000, currency: 'USD' },
      cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
      accounts: { total: 3, active: 3, byType: { BANK: 2, CREDIT_CARD: 1 } },
      receivables: { outstanding: 50000, overdue: 10000 },
      payables: { outstanding: 30000, overdue: 5000 },
    },
    cashFlowProjection: [
      { date: 'Jan 26', value: 800 },
      { date: 'Feb 26', value: 750 },
    ],
    expenseBreakdown: [
      {
        label: 'Feb 2026',
        categories: [
          { name: 'Office Supplies', amount: 5000, color: '#3B82F6' },
          { name: 'Marketing', amount: 15000, color: '#EF4444' },
        ],
      },
    ],
    actionItems: [
      {
        id: 'inv-1',
        type: 'OVERDUE_INVOICE' as const,
        title: 'Invoice #001',
        meta: '30d overdue',
        urgencyScore: 30,
        href: '/invoicing/inv-1',
      },
    ],
  };
}

function mockInsightResult(overrides: Partial<InsightResult> = {}): InsightResult {
  return {
    triggerId: 'cash_flow_warning:entity-123:2026-02',
    title: 'Cash Flow Warning',
    description: 'Projected balance dropping below threshold',
    type: 'cash_flow_warning',
    priority: 'critical',
    impact: 85,
    confidence: 0.9,
    actionable: true,
    metadata: { currentBalance: 50000, projectedLow: 3000, daysUntilLow: 14, threshold: 500000 },
    ...overrides,
  };
}

describe('InsightGeneratorService', () => {
  let service: InsightGeneratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InsightGeneratorService(TENANT_ID, USER_ID, ENTITY_ID);

    // Default: shared data fetches succeed
    const shared = mockSharedData();
    mockGetMetrics.mockResolvedValue(shared.metrics);
    mockGetCashFlowProjection.mockResolvedValue(shared.cashFlowProjection);
    mockGetExpenseBreakdown.mockResolvedValue(shared.expenseBreakdown);
    mockGetActionItems.mockResolvedValue(shared.actionItems);

    // Default: upsert succeeds
    mockUpsertInsight.mockResolvedValue({ id: 'insight-1' });
    mockCreateAction.mockResolvedValue({ id: 'action-1' });
  });

  describe('generateAll', () => {
    it('should fetch shared data once and run all analyzers', async () => {
      const result = await service.generateAll();

      // Shared data fetched once
      expect(mockGetMetrics).toHaveBeenCalledTimes(1);
      expect(mockGetCashFlowProjection).toHaveBeenCalledTimes(1);
      expect(mockGetExpenseBreakdown).toHaveBeenCalledTimes(1);
      expect(mockGetActionItems).toHaveBeenCalledTimes(1);

      // All 6 analyzers called
      expect(mockAnalyzeCashFlow).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeOverdue).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeSpending).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeDuplicates).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeRevenue).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeReconciliation).toHaveBeenCalledTimes(1);

      expect(result.errors).toHaveLength(0);
    });

    it('should filter analyzers by type when types provided', async () => {
      await service.generateAll(['cash_flow_warning', 'overdue_alert']);

      expect(mockAnalyzeCashFlow).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeOverdue).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeSpending).not.toHaveBeenCalled();
      expect(mockAnalyzeDuplicates).not.toHaveBeenCalled();
      expect(mockAnalyzeRevenue).not.toHaveBeenCalled();
      expect(mockAnalyzeReconciliation).not.toHaveBeenCalled();
    });

    it('should upsert insights returned by analyzers', async () => {
      const insight = mockInsightResult();
      mockAnalyzeCashFlow.mockReturnValue([insight]);

      const result = await service.generateAll(['cash_flow_warning']);

      expect(mockUpsertInsight).toHaveBeenCalledWith(ENTITY_ID, insight);
      expect(result.generated).toBe(1);
    });

    it('should create AIAction for critical actionable insights', async () => {
      const criticalInsight = mockInsightResult({
        priority: 'critical',
        actionable: true,
      });
      mockAnalyzeCashFlow.mockReturnValue([criticalInsight]);

      await service.generateAll(['cash_flow_warning']);

      expect(mockCreateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: ENTITY_ID,
          type: 'ALERT',
          title: criticalInsight.title,
          priority: 'CRITICAL',
        })
      );
    });

    it('should create AIAction for high actionable insights', async () => {
      const highInsight = mockInsightResult({
        priority: 'high',
        actionable: true,
      });
      mockAnalyzeCashFlow.mockReturnValue([highInsight]);

      await service.generateAll(['cash_flow_warning']);

      expect(mockCreateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'HIGH',
        })
      );
    });

    it('should NOT create AIAction for medium/low priority insights', async () => {
      const mediumInsight = mockInsightResult({
        priority: 'medium',
        actionable: true,
      });
      mockAnalyzeCashFlow.mockReturnValue([mediumInsight]);

      await service.generateAll(['cash_flow_warning']);

      expect(mockCreateAction).not.toHaveBeenCalled();
    });

    it('should NOT create AIAction for non-actionable insights', async () => {
      const nonActionable = mockInsightResult({
        priority: 'critical',
        actionable: false,
      });
      mockAnalyzeCashFlow.mockReturnValue([nonActionable]);

      await service.generateAll(['cash_flow_warning']);

      expect(mockCreateAction).not.toHaveBeenCalled();
    });

    it('should isolate errors per analyzer', async () => {
      mockAnalyzeCashFlow.mockImplementation(() => {
        throw new Error('Cash flow analysis failed');
      });
      const overdueInsight = mockInsightResult({
        type: 'overdue_alert',
        triggerId: 'overdue_alert:entity-123:2026-02',
      });
      mockAnalyzeOverdue.mockReturnValue([overdueInsight]);

      const result = await service.generateAll(['cash_flow_warning', 'overdue_alert']);

      // Overdue still ran despite cash flow failure
      expect(mockUpsertInsight).toHaveBeenCalledWith(ENTITY_ID, overdueInsight);
      expect(result.generated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('cash_flow_warning');
    });

    it('should handle shared data fetch failure gracefully', async () => {
      mockGetMetrics.mockRejectedValue(new Error('Database unavailable'));

      const result = await service.generateAll();

      expect(result.generated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Shared data fetch failed');
      // No analyzers should have been called
      expect(mockAnalyzeCashFlow).not.toHaveBeenCalled();
    });

    it('should handle upsert failure without stopping', async () => {
      const insight1 = mockInsightResult({ triggerId: 'trigger-1' });
      const insight2 = mockInsightResult({ triggerId: 'trigger-2' });
      mockAnalyzeCashFlow.mockReturnValue([insight1, insight2]);

      mockUpsertInsight.mockRejectedValueOnce(new Error('Upsert failed'));
      mockUpsertInsight.mockResolvedValueOnce({ id: 'insight-2' });

      const result = await service.generateAll(['cash_flow_warning']);

      expect(mockUpsertInsight).toHaveBeenCalledTimes(2);
      expect(result.generated).toBe(1); // Only second succeeded
      expect(result.errors).toHaveLength(1);
    });

    it('should handle AIAction creation failure without stopping', async () => {
      const insight = mockInsightResult({ priority: 'critical', actionable: true });
      mockAnalyzeCashFlow.mockReturnValue([insight]);
      mockCreateAction.mockRejectedValue(new Error('Action creation failed'));

      const result = await service.generateAll(['cash_flow_warning']);

      // Insight still upserted despite action failure
      expect(result.generated).toBe(1);
      expect(result.errors).toHaveLength(0); // Action failure is non-blocking
    });

    it('should pass shared data to pure analyzers', async () => {
      await service.generateAll(['cash_flow_warning']);

      expect(mockAnalyzeCashFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.any(Object),
          cashFlowProjection: expect.any(Array),
          expenseBreakdown: expect.any(Array),
          actionItems: expect.any(Array),
        }),
        ENTITY_ID
      );
    });

    it('should pass entityId and tenantId to DB analyzers', async () => {
      await service.generateAll(['revenue_trend']);

      expect(mockAnalyzeRevenue).toHaveBeenCalledWith(ENTITY_ID, TENANT_ID);
    });
  });

  describe('generateForImport', () => {
    it('should only run spending and duplicate analyzers', async () => {
      const transactionIds = ['txn-1', 'txn-2', 'txn-3'];

      await service.generateForImport(transactionIds);

      expect(mockAnalyzeSpending).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeDuplicates).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeCashFlow).not.toHaveBeenCalled();
      expect(mockAnalyzeOverdue).not.toHaveBeenCalled();
      expect(mockAnalyzeRevenue).not.toHaveBeenCalled();
      expect(mockAnalyzeReconciliation).not.toHaveBeenCalled();
    });
  });
});
