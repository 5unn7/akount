import { z } from 'zod';

/**
 * Query parameters for performance metrics endpoint
 */
export const PerformanceQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  currency: z.string().length(3).default('CAD').optional(),
  period: z.enum(['30d', '60d', '90d']).default('30d').optional(),
});

export type PerformanceQuery = z.infer<typeof PerformanceQuerySchema>;

/**
 * Metric detail structure for revenue/expenses/profit
 */
const MetricDetailSchema = z.object({
  current: z.number().int(), // Integer cents
  previous: z.number().int(), // Integer cents (prior period)
  percentChange: z.number(), // -100 to +∞
  sparkline: z.array(z.number().int()), // 10-15 data points (integer cents)
});

/**
 * Receivables metrics
 */
const ReceivablesSchema = z.object({
  outstanding: z.number().int(), // Total outstanding in cents
  overdue: z.number().int(), // Overdue amount in cents
  sparkline: z.array(z.number().int()), // Historical receivables trend
});

/**
 * Accounts summary
 */
const AccountsSummarySchema = z.object({
  active: z.number().int(),
  total: z.number().int(),
});

/**
 * Performance metrics response schema
 */
export const PerformanceMetricsSchema = z.object({
  revenue: MetricDetailSchema,
  expenses: MetricDetailSchema,
  profit: MetricDetailSchema,
  receivables: ReceivablesSchema,
  accounts: AccountsSummarySchema,
  currency: z.string().length(3),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
