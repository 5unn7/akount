import { describe, it, expect } from 'vitest';
import { analyzeCashFlow } from '../cash-flow.analyzer';
import type { SharedAnalysisData } from '../../insight-generator.service';
import type { CashFlowMetadata } from '../../../types/insight.types';

function mockSharedData(overrides: Partial<SharedAnalysisData> = {}): SharedAnalysisData {
  return {
    metrics: {
      netWorth: { amount: 100000, currency: 'USD' },
      cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
      accounts: { total: 3, active: 3, byType: {} },
      receivables: { outstanding: 50000, overdue: 0 },
      payables: { outstanding: 30000, overdue: 0 },
    },
    cashFlowProjection: [],
    expenseBreakdown: [],
    actionItems: [],
    ...overrides,
  };
}

/** Build projection: 30 historical + 30 projected entries */
function buildProjection(projectedValues: number[]): Array<{ date: string; value: number }> {
  const entries: Array<{ date: string; value: number }> = [];

  // 30 historical entries (all above threshold)
  for (let i = 0; i < 30; i++) {
    entries.push({ date: `Jan ${i + 1}`, value: 10000 });
  }

  // Projected entries
  for (let i = 0; i < projectedValues.length; i++) {
    entries.push({ date: `Feb ${i + 1}`, value: projectedValues[i] });
  }

  return entries;
}

describe('analyzeCashFlow', () => {
  const ENTITY_ID = 'entity-123';

  it('should return empty when no projection data', () => {
    const data = mockSharedData({ cashFlowProjection: [] });
    const results = analyzeCashFlow(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should return empty when projected balance stays above threshold', () => {
    const data = mockSharedData({
      cashFlowProjection: buildProjection([8000, 7500, 7000, 6500, 6000]),
    });

    // Default threshold = $5,000, all projected > $5,000
    const results = analyzeCashFlow(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should trigger warning when projected balance drops below threshold', () => {
    const data = mockSharedData({
      cashFlowProjection: buildProjection([
        8000, 7000, 6000, 4500, 4000, 3500, 3000, 2500, 2000, 1500,
      ]),
    });

    const results = analyzeCashFlow(data, ENTITY_ID);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('cash_flow_warning');
    expect(results[0].actionable).toBe(true);
  });

  it('should set critical priority when low point is within 2 weeks', () => {
    // 30 projected values with lowest at day 5 (index 4)
    const projected = Array.from({ length: 30 }, (_, i) => {
      if (i === 4) return 2000; // Lowest at day 5 (within 14 days)
      return 8000;
    });
    const data = mockSharedData({
      cashFlowProjection: buildProjection(projected),
    });

    const results = analyzeCashFlow(data, ENTITY_ID);
    expect(results[0].priority).toBe('critical');
  });

  it('should set high priority when low point is 2-4 weeks out', () => {
    // 30 projected values, lowest at index 20 (day 21)
    const projected = Array.from({ length: 30 }, (_, i) => {
      if (i === 20) return 2000; // Lowest at day 21
      return 8000;
    });

    const data = mockSharedData({
      cashFlowProjection: buildProjection(projected),
    });

    const results = analyzeCashFlow(data, ENTITY_ID);
    expect(results[0].priority).toBe('high');
  });

  it('should store metadata in integer cents', () => {
    const data = mockSharedData({
      cashFlowProjection: buildProjection([
        6000, 5500, 4000, 3000, 2000,
      ]),
    });

    const results = analyzeCashFlow(data, ENTITY_ID);
    const metadata = results[0].metadata as CashFlowMetadata;

    // currentBalance from metrics (already cents)
    expect(metadata.currentBalance).toBe(80000);
    // projectedLow: $2,000 * 100 = 200000 cents
    expect(metadata.projectedLow).toBe(200000);
    // threshold default = 500000 cents
    expect(metadata.threshold).toBe(500000);
    expect(metadata.daysUntilLow).toBeGreaterThan(0);
  });

  it('should use custom threshold when provided', () => {
    const data = mockSharedData({
      cashFlowProjection: buildProjection([8000, 7500, 7000]),
    });

    // All above $5,000 default, but below $10,000 custom threshold
    const results = analyzeCashFlow(data, ENTITY_ID, 1000000); // $10,000
    expect(results).toHaveLength(1);
    expect((results[0].metadata as CashFlowMetadata).threshold).toBe(1000000);
  });

  it('should generate deterministic triggerId', () => {
    const data = mockSharedData({
      cashFlowProjection: buildProjection([4000, 3000, 2000]),
    });

    const results = analyzeCashFlow(data, ENTITY_ID);
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(results[0].triggerId).toBe(`cash_flow_warning:${ENTITY_ID}:${expectedMonth}`);
  });

  it('should have confidence < 1 (projections are estimates)', () => {
    const data = mockSharedData({
      cashFlowProjection: buildProjection([4000, 3000]),
    });

    const results = analyzeCashFlow(data, ENTITY_ID);
    expect(results[0].confidence).toBeLessThan(1);
  });
});
