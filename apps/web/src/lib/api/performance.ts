import { apiClient } from './client';

/**
 * Performance metrics types (matches backend schema)
 */
export interface MetricDetail {
  current: number; // Integer cents
  previous: number; // Integer cents
  percentChange: number; // -100 to +∞
  sparkline: number[]; // 10-15 data points (integer cents)
}

export interface Receivables {
  outstanding: number; // Integer cents
  overdue: number; // Integer cents
  sparkline: number[];
}

export interface AccountsSummary {
  active: number;
  total: number;
}

export interface PerformanceMetrics {
  revenue: MetricDetail;
  expenses: MetricDetail;
  profit: MetricDetail;
  receivables: Receivables;
  accounts: AccountsSummary;
  currency: string;
}

/**
 * Fetch performance metrics from the API
 *
 * @param entityId - Optional entity filter
 * @param currency - Target currency (default: CAD)
 * @param period - Time period (default: 30d)
 */
export async function getPerformanceMetrics(
  entityId?: string,
  currency?: string,
  period?: '30d' | '60d' | '90d'
): Promise<PerformanceMetrics> {
  const params = new URLSearchParams();
  if (entityId) params.set('entityId', entityId);
  if (currency) params.set('currency', currency);
  if (period) params.set('period', period);

  const queryString = params.toString();
  const path = `/api/overview/performance${queryString ? `?${queryString}` : ''}`;

  return apiClient<PerformanceMetrics>(path);
}
