// AI Auto-Bookkeeper Phase 3: Overdue Analyzer (Task 6 - DEV-220)
// Pure function: accepts shared data, returns InsightResult[]
import type { InsightResult, OverdueAlertMetadata } from '../../types/insight.types.js';
import type { SharedAnalysisData } from '../insight-generator.service.js';

/**
 * Analyze overdue invoices and bills.
 *
 * Uses getActionItems() for overdue item counts and details,
 * and metrics.receivables/payables.overdue for total amounts (in cents).
 *
 * Groups by type: "N invoices overdue totaling $X; M bills overdue totaling $Y"
 * Priority: high if total > $1,000, critical if > $10,000.
 */
export function analyzeOverdue(data: SharedAnalysisData, entityId: string): InsightResult[] {
  const { actionItems, metrics } = data;

  // Filter for overdue items
  const overdueInvoices = actionItems.filter((item) => item.type === 'OVERDUE_INVOICE');
  const overdueBills = actionItems.filter((item) => item.type === 'OVERDUE_BILL');

  // No overdue items = no insight
  if (overdueInvoices.length === 0 && overdueBills.length === 0) {
    return [];
  }

  // Total overdue amounts from metrics (integer cents)
  const overdueAR = metrics.receivables?.overdue ?? 0;
  const overdueAP = metrics.payables?.overdue ?? 0;
  const totalOverdueCents = overdueAR + overdueAP;

  // Determine priority based on total overdue amount
  let priority: 'critical' | 'high' | 'medium';
  if (totalOverdueCents >= 1000000) {
    // > $10,000
    priority = 'critical';
  } else if (totalOverdueCents >= 100000) {
    // > $1,000
    priority = 'high';
  } else {
    priority = 'medium';
  }

  // Build description
  const parts: string[] = [];
  if (overdueInvoices.length > 0) {
    parts.push(
      `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue ($${(overdueAR / 100).toLocaleString()})`
    );
  }
  if (overdueBills.length > 0) {
    parts.push(
      `${overdueBills.length} bill${overdueBills.length > 1 ? 's' : ''} overdue ($${(overdueAP / 100).toLocaleString()})`
    );
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Build item details from action items
  const items: OverdueAlertMetadata['items'] = [
    ...overdueInvoices.map((inv) => ({
      type: 'invoice' as const,
      id: inv.id,
      number: inv.title.replace('Overdue: ', ''),
      dueDate: '', // Not available from action items
      amount: 0, // Individual amounts not available from action items
    })),
    ...overdueBills.map((bill) => ({
      type: 'bill' as const,
      id: bill.id,
      number: bill.title.replace('Overdue: ', ''),
      dueDate: '',
      amount: 0,
    })),
  ];

  const metadata: OverdueAlertMetadata = {
    overdueInvoices: overdueInvoices.length,
    overdueBills: overdueBills.length,
    totalAmount: totalOverdueCents,
    items,
  };

  return [
    {
      triggerId: `overdue_alert:${entityId}:${yearMonth}`,
      title: 'Overdue Alert',
      description: parts.join('; '),
      type: 'overdue_alert',
      priority,
      impact: Math.min(100, Math.round((totalOverdueCents / 1000000) * 100)),
      confidence: 1.0, // Overdue status is factual
      actionable: true,
      metadata,
    },
  ];
}
