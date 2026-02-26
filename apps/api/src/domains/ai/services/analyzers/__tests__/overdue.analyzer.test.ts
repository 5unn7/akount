import { describe, it, expect } from 'vitest';
import { analyzeOverdue } from '../overdue.analyzer';
import type { SharedAnalysisData } from '../../insight-generator.service';
import type { OverdueAlertMetadata } from '../../../types/insight.types';

type ActionItem = SharedAnalysisData['actionItems'][number];

function mockActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'item-1',
    type: 'OVERDUE_INVOICE',
    title: 'Overdue: INV-001',
    meta: 'Client A • 15d overdue',
    urgencyScore: 15,
    href: '/invoicing/inv-1',
    ...overrides,
  };
}

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

const ENTITY_ID = 'entity-123';

describe('analyzeOverdue', () => {
  it('should return empty when no overdue items', () => {
    const data = mockSharedData({ actionItems: [] });
    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should return empty when only unreconciled transactions (not overdue)', () => {
    const data = mockSharedData({
      actionItems: [
        mockActionItem({ type: 'UNRECONCILED_TXN', title: 'Reconcile: Payment' }),
      ],
    });
    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results).toHaveLength(0);
  });

  it('should trigger overdue_alert when invoices are overdue', () => {
    const data = mockSharedData({
      actionItems: [
        mockActionItem({ id: 'inv-1', type: 'OVERDUE_INVOICE', title: 'Overdue: INV-001' }),
        mockActionItem({ id: 'inv-2', type: 'OVERDUE_INVOICE', title: 'Overdue: INV-002' }),
      ],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 420000 }, // $4,200
        payables: { outstanding: 30000, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('overdue_alert');
    expect(results[0].actionable).toBe(true);
  });

  it('should set critical priority for overdue > $10,000', () => {
    const data = mockSharedData({
      actionItems: [mockActionItem()],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 1200000 }, // $12,000
        payables: { outstanding: 30000, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results[0].priority).toBe('critical');
  });

  it('should set high priority for overdue > $1,000', () => {
    const data = mockSharedData({
      actionItems: [mockActionItem()],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 250000 }, // $2,500
        payables: { outstanding: 30000, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results[0].priority).toBe('high');
  });

  it('should set medium priority for overdue < $1,000', () => {
    const data = mockSharedData({
      actionItems: [mockActionItem()],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 50000 }, // $500
        payables: { outstanding: 30000, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results[0].priority).toBe('medium');
  });

  it('should combine invoice and bill overdue amounts', () => {
    const data = mockSharedData({
      actionItems: [
        mockActionItem({ id: 'inv-1', type: 'OVERDUE_INVOICE' }),
        mockActionItem({ id: 'bill-1', type: 'OVERDUE_BILL', title: 'Overdue: BILL-001' }),
      ],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 420000 }, // $4,200
        payables: { outstanding: 30000, overdue: 50000 }, // $500
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    const metadata = results[0].metadata as OverdueAlertMetadata;

    expect(metadata.overdueInvoices).toBe(1);
    expect(metadata.overdueBills).toBe(1);
    expect(metadata.totalAmount).toBe(470000); // $4,200 + $500 = $4,700 in cents
  });

  it('should store totalAmount in integer cents', () => {
    const data = mockSharedData({
      actionItems: [mockActionItem()],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 150000 }, // Integer cents
        payables: { outstanding: 30000, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    const metadata = results[0].metadata as OverdueAlertMetadata;
    expect(Number.isInteger(metadata.totalAmount)).toBe(true);
    expect(metadata.totalAmount).toBe(150000);
  });

  it('should have confidence of 1.0 (overdue is factual)', () => {
    const data = mockSharedData({
      actionItems: [mockActionItem()],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 100000 },
        payables: { outstanding: 0, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    expect(results[0].confidence).toBe(1.0);
  });

  it('should generate deterministic triggerId', () => {
    const data = mockSharedData({
      actionItems: [mockActionItem()],
      metrics: {
        netWorth: { amount: 100000, currency: 'USD' },
        cashPosition: { cash: 80000, debt: 20000, net: 60000, currency: 'USD' },
        accounts: { total: 3, active: 3, byType: {} },
        receivables: { outstanding: 50000, overdue: 100000 },
        payables: { outstanding: 0, overdue: 0 },
      },
    });

    const results = analyzeOverdue(data, ENTITY_ID);
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(results[0].triggerId).toBe(`overdue_alert:${ENTITY_ID}:${expectedMonth}`);
  });
});
