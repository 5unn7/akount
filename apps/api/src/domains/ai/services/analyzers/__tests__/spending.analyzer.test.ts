import { describe, it, expect } from 'vitest';
import { analyzeSpending } from '../spending.analyzer';
import type { SharedAnalysisData } from '../../insight-generator.service';
import type { SpendingAnomalyMetadata } from '../../../types/insight.types';

function mockSharedData(overrides: Partial<SharedAnalysisData> = {}): SharedAnalysisData {
  return {
    metrics: {
      netWorth: { amount: 100000, currency: 'USD' },
      cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
      accounts: { total: 3, active: 3, byType: {} },
    },
    cashFlowProjection: [],
    expenseBreakdown: [],
    actionItems: [],
    ...overrides,
  };
}

const ENTITY_ID = 'entity-123';

describe('analyzeSpending', () => {
  it('should return empty when less than 2 months of data', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Feb 26', categories: [{ name: 'Office', amount: 500, color: '#3B82F6' }] },
      ],
    });

    const results = analyzeSpending(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should return empty when current spending is within normal range', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office', amount: 500, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office', amount: 550, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office', amount: 520, color: '#3B82F6' }] },
        { label: 'Feb 26', categories: [{ name: 'Office', amount: 600, color: '#3B82F6' }] },
      ],
    });

    // Average = (500+550+520)/3 = ~523. Current 600 = ~14.7% increase (below 30%)
    const results = analyzeSpending(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should trigger when category is >30% above average and >$100 increase', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Marketing', amount: 1000, color: '#EF4444' }] },
        { label: 'Dec 25', categories: [{ name: 'Marketing', amount: 1000, color: '#EF4444' }] },
        { label: 'Jan 26', categories: [{ name: 'Marketing', amount: 1000, color: '#EF4444' }] },
        { label: 'Feb 26', categories: [{ name: 'Marketing', amount: 1500, color: '#EF4444' }] },
      ],
    });

    // Average = 1000. Current = 1500. 50% increase, $500 increase
    const results = analyzeSpending(data, ENTITY_ID);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('spending_anomaly');
    expect(results[0].actionable).toBe(true);
  });

  it('should NOT trigger when below $100 absolute increase', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Snacks', amount: 50, color: '#71717A' }] },
        { label: 'Dec 25', categories: [{ name: 'Snacks', amount: 50, color: '#71717A' }] },
        { label: 'Jan 26', categories: [{ name: 'Snacks', amount: 50, color: '#71717A' }] },
        { label: 'Feb 26', categories: [{ name: 'Snacks', amount: 80, color: '#71717A' }] },
      ],
    });

    // Average = 50. Current = 80. 60% increase BUT only $30 increase (< $100)
    const results = analyzeSpending(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should set medium priority for 30-50% increase', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Feb 26', categories: [{ name: 'Office', amount: 1350, color: '#3B82F6' }] },
      ],
    });

    // 35% increase
    const results = analyzeSpending(data, ENTITY_ID);
    expect(results[0].priority).toBe('medium');
  });

  it('should set high priority for 50-100% increase', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Feb 26', categories: [{ name: 'Office', amount: 1700, color: '#3B82F6' }] },
      ],
    });

    // 70% increase
    const results = analyzeSpending(data, ENTITY_ID);
    expect(results[0].priority).toBe('high');
  });

  it('should set critical priority for >100% increase', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Feb 26', categories: [{ name: 'Office', amount: 2500, color: '#3B82F6' }] },
      ],
    });

    // 150% increase
    const results = analyzeSpending(data, ENTITY_ID);
    expect(results[0].priority).toBe('critical');
  });

  it('should detect multiple category anomalies', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        {
          label: 'Nov 25',
          categories: [
            { name: 'Marketing', amount: 1000, color: '#EF4444' },
            { name: 'Software', amount: 500, color: '#3B82F6' },
          ],
        },
        {
          label: 'Dec 25',
          categories: [
            { name: 'Marketing', amount: 1000, color: '#EF4444' },
            { name: 'Software', amount: 500, color: '#3B82F6' },
          ],
        },
        {
          label: 'Jan 26',
          categories: [
            { name: 'Marketing', amount: 1000, color: '#EF4444' },
            { name: 'Software', amount: 500, color: '#3B82F6' },
          ],
        },
        {
          label: 'Feb 26',
          categories: [
            { name: 'Marketing', amount: 2000, color: '#EF4444' },  // 100% increase
            { name: 'Software', amount: 1000, color: '#3B82F6' },   // 100% increase
          ],
        },
      ],
    });

    const results = analyzeSpending(data, ENTITY_ID);
    expect(results).toHaveLength(2);
    expect(results.map((r) => (r.metadata as SpendingAnomalyMetadata).categoryName).sort()).toEqual(
      ['Marketing', 'Software']
    );
  });

  it('should store metadata in integer cents', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Feb 26', categories: [{ name: 'Office', amount: 1500, color: '#3B82F6' }] },
      ],
    });

    const results = analyzeSpending(data, ENTITY_ID);
    const metadata = results[0].metadata as SpendingAnomalyMetadata;

    // Amounts converted from dollars to cents
    expect(metadata.currentAmount).toBe(150000); // $1,500 in cents
    expect(metadata.averageAmount).toBe(100000); // $1,000 in cents
    expect(Number.isInteger(metadata.currentAmount)).toBe(true);
    expect(Number.isInteger(metadata.averageAmount)).toBe(true);
    expect(metadata.percentIncrease).toBe(50);
  });

  it('should generate deterministic triggerId with category key', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office Supplies', amount: 1000, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office Supplies', amount: 1000, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office Supplies', amount: 1000, color: '#3B82F6' }] },
        { label: 'Feb 26', categories: [{ name: 'Office Supplies', amount: 1500, color: '#3B82F6' }] },
      ],
    });

    const results = analyzeSpending(data, ENTITY_ID);
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(results[0].triggerId).toBe(`spending_anomaly:${ENTITY_ID}:office-supplies:${expectedMonth}`);
  });

  it('should skip categories with no historical data', () => {
    const data = mockSharedData({
      expenseBreakdown: [
        { label: 'Nov 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Dec 25', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        { label: 'Jan 26', categories: [{ name: 'Office', amount: 1000, color: '#3B82F6' }] },
        {
          label: 'Feb 26',
          categories: [
            { name: 'Office', amount: 1000, color: '#3B82F6' },
            { name: 'New Category', amount: 5000, color: '#A78BFA' }, // No history
          ],
        },
      ],
    });

    const results = analyzeSpending(data, ENTITY_ID);
    // Only Office should be checked (not anomalous), New Category skipped
    expect(results).toHaveLength(0);
  });
});
