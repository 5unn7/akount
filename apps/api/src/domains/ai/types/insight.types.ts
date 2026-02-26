// AI Auto-Bookkeeper Phase 3: Insight Types
// String literal unions for Insight model (avoids Prisma enum migration)

export const INSIGHT_TYPES = [
  'cash_flow_warning',
  'spending_anomaly',
  'duplicate_expense',
  'overdue_alert',
  'tax_estimate',
  'revenue_trend',
  'reconciliation_gap',
] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

export const INSIGHT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export type InsightPriority = (typeof INSIGHT_PRIORITIES)[number];

export const INSIGHT_STATUSES = [
  'active',
  'dismissed',
  'snoozed',
  'resolved',
  'expired',
] as const;

export type InsightStatus = (typeof INSIGHT_STATUSES)[number];

// Type config for each insight type (UI labels, icons, defaults)
export const INSIGHT_TYPE_CONFIG: Record<
  InsightType,
  {
    label: string;
    icon: string;
    defaultPriority: InsightPriority;
    description: string;
  }
> = {
  cash_flow_warning: {
    label: 'Cash Flow Warning',
    icon: 'TrendingDown',
    defaultPriority: 'critical',
    description: 'Projected cash balance dropping below safe threshold',
  },
  spending_anomaly: {
    label: 'Spending Anomaly',
    icon: 'AlertTriangle',
    defaultPriority: 'medium',
    description: 'Category spending significantly above recent average',
  },
  duplicate_expense: {
    label: 'Duplicate Expense',
    icon: 'Copy',
    defaultPriority: 'medium',
    description: 'Similar transactions that may be duplicates',
  },
  overdue_alert: {
    label: 'Overdue Alert',
    icon: 'Clock',
    defaultPriority: 'high',
    description: 'Overdue invoices or bills requiring attention',
  },
  tax_estimate: {
    label: 'Tax Estimate',
    icon: 'Calculator',
    defaultPriority: 'low',
    description: 'Estimated tax liability for current period',
  },
  revenue_trend: {
    label: 'Revenue Trend',
    icon: 'TrendingUp',
    defaultPriority: 'low',
    description: 'Significant revenue change from prior month',
  },
  reconciliation_gap: {
    label: 'Reconciliation Gap',
    icon: 'AlertCircle',
    defaultPriority: 'medium',
    description: 'Account with low reconciliation percentage',
  },
};

// Metadata payloads per analyzer (analyzer-specific data)
export interface CashFlowMetadata {
  currentBalance: number; // Integer cents
  projectedLow: number; // Integer cents
  daysUntilLow: number;
  threshold: number; // Integer cents
}

export interface SpendingAnomalyMetadata {
  categoryName: string;
  categoryId: string;
  currentAmount: number; // Integer cents
  averageAmount: number; // Integer cents
  percentIncrease: number;
}

export interface DuplicateExpenseMetadata {
  transaction1: {
    id: string;
    description: string;
    amount: number; // Integer cents
    date: string; // ISO date
  };
  transaction2: {
    id: string;
    description: string;
    amount: number; // Integer cents
    date: string;
  };
}

export interface OverdueAlertMetadata {
  overdueInvoices: number;
  overdueBills: number;
  totalAmount: number; // Integer cents
  items: Array<{
    type: 'invoice' | 'bill';
    id: string;
    number: string;
    dueDate: string;
    amount: number; // Integer cents
  }>;
}

export interface TaxEstimateMetadata {
  estimatedLiability: number; // Integer cents
  periodStart: string; // ISO date
  periodEnd: string;
  basis: string; // e.g., "Accrual", "Cash"
}

export interface RevenueTrendMetadata {
  currentRevenue: number; // Integer cents
  priorRevenue: number; // Integer cents
  percentChange: number;
  direction: 'up' | 'down';
}

export interface ReconciliationGapMetadata {
  accountId: string;
  accountName: string;
  totalBankFeed: number;
  matched: number;
  unmatched: number;
  reconciliationPercent: number;
}

// Union type for all metadata shapes
export type InsightMetadata =
  | CashFlowMetadata
  | SpendingAnomalyMetadata
  | DuplicateExpenseMetadata
  | OverdueAlertMetadata
  | TaxEstimateMetadata
  | RevenueTrendMetadata
  | ReconciliationGapMetadata;

// Result type returned by analyzers
export interface InsightResult {
  triggerId: string; // Deterministic ID for deduplication
  title: string;
  description: string;
  type: InsightType;
  priority: InsightPriority;
  impact?: number;
  confidence?: number;
  actionable: boolean;
  deadline?: Date;
  metadata?: InsightMetadata;
}
