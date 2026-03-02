import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RevenueTrendMetadata } from '../../../types/insight.types';

// Hoist mock for ReportService
const { mockGenerateProfitLoss } = vi.hoisted(() => ({
  mockGenerateProfitLoss: vi.fn(),
}));

vi.mock('../../../../accounting/services/report.service', () => ({
  ReportService: class {
    generateProfitLoss = mockGenerateProfitLoss;
  },
}));

// Import after mocks
import { analyzeRevenue } from '../revenue.analyzer';

const ENTITY_ID = 'entity-123';
const TENANT_ID = 'tenant-abc-123';

function mockProfitLossReport(revenueTotal: number) {
  return {
    entityName: 'Test Entity',
    currency: 'USD',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    revenue: {
      sections: [],
      total: revenueTotal, // Integer cents
    },
    expenses: {
      sections: [],
      total: 0,
    },
    netIncome: revenueTotal,
  };
}

describe('analyzeRevenue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty when prior revenue is zero', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(500000)) // Current: $5,000
      .mockResolvedValueOnce(mockProfitLossReport(0)); // Prior: $0

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should return empty when change is below 15% threshold', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(1100000)) // Current: $11,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // Prior: $10,000 (10% increase)

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should trigger revenue_trend for >15% positive change', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(1200000)) // Current: $12,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // Prior: $10,000 (20% increase)

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('revenue_trend');
    expect(results[0].priority).toBe('low'); // Positive = informational
    expect(results[0].actionable).toBe(false); // Not actionable when increasing
  });

  it('should set medium priority for 15-30% revenue decrease', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(800000)) // Current: $8,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // Prior: $10,000 (20% decrease)

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results[0].priority).toBe('medium');
    expect(results[0].actionable).toBe(true); // Declining = actionable
  });

  it('should set high priority for 30-50% revenue decrease', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(600000)) // Current: $6,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // Prior: $10,000 (40% decrease)

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results[0].priority).toBe('high');
  });

  it('should set critical priority for >50% revenue decrease', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(400000)) // Current: $4,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // Prior: $10,000 (60% decrease)

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results[0].priority).toBe('critical');
  });

  it('should store metadata in integer cents', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(1500000)) // $15,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // $10,000

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    const metadata = results[0].metadata as RevenueTrendMetadata;

    expect(metadata.currentRevenue).toBe(1500000); // Integer cents
    expect(metadata.priorRevenue).toBe(1000000);
    expect(Number.isInteger(metadata.currentRevenue)).toBe(true);
    expect(Number.isInteger(metadata.priorRevenue)).toBe(true);
    expect(metadata.percentChange).toBe(50);
    expect(metadata.direction).toBe('up');
  });

  it('should generate deterministic triggerId', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(1500000))
      .mockResolvedValueOnce(mockProfitLossReport(1000000));

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(results[0].triggerId).toBe(`revenue_trend:${ENTITY_ID}:${expectedMonth}`);
  });

  it('should return empty when report generation fails', async () => {
    mockGenerateProfitLoss.mockRejectedValue(new Error('Entity not found'));

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should have confidence < 1.0 (high but not absolute)', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(1500000))
      .mockResolvedValueOnce(mockProfitLossReport(1000000));

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    expect(results[0].confidence).toBe(0.95);
  });

  it('should correctly identify direction for negative change', async () => {
    mockGenerateProfitLoss
      .mockResolvedValueOnce(mockProfitLossReport(700000)) // $7,000
      .mockResolvedValueOnce(mockProfitLossReport(1000000)); // $10,000

    const results = await analyzeRevenue(ENTITY_ID, TENANT_ID);
    const metadata = results[0].metadata as RevenueTrendMetadata;
    expect(metadata.direction).toBe('down');
    expect(metadata.percentChange).toBe(-30);
  });
});
