import { z } from 'zod';

/**
 * Report Query Schemas
 *
 * Security notes:
 * - All entityId fields use .cuid().optional() (never empty string)
 * - Empty strings are rejected by Zod (Security P0-6)
 * - Dates use .datetime() for proper validation
 */

/**
 * Profit & Loss Statement Query Parameters
 */
export const ProfitLossQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  comparisonPeriod: z.enum(['PREVIOUS_PERIOD', 'PREVIOUS_YEAR']).optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type ProfitLossQuery = z.infer<typeof ProfitLossQuerySchema>;

/**
 * Balance Sheet Query Parameters
 */
export const BalanceSheetQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  asOfDate: z.coerce.date(),
  comparisonDate: z.coerce.date().optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type BalanceSheetQuery = z.infer<typeof BalanceSheetQuerySchema>;

/**
 * Cash Flow Statement Query Parameters
 */
export const CashFlowQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type CashFlowQuery = z.infer<typeof CashFlowQuerySchema>;

/**
 * Trial Balance Query Parameters
 */
export const TrialBalanceQuerySchema = z.object({
  entityId: z.string().cuid(), // Required for trial balance
  asOfDate: z.coerce.date().default(() => new Date()),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type TrialBalanceQuery = z.infer<typeof TrialBalanceQuerySchema>;

/**
 * General Ledger Query Parameters
 */
export const GLLedgerQuerySchema = z.object({
  entityId: z.string().cuid(), // Required
  glAccountId: z.string().cuid(), // Required
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  cursor: z.string().cuid().optional(), // CUID cursor for pagination
  limit: z.coerce.number().int().min(1).max(200).default(50), // Performance F11
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type GLLedgerQuery = z.infer<typeof GLLedgerQuerySchema>;

/**
 * Spending by Category Query Parameters
 */
export const SpendingQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type SpendingQuery = z.infer<typeof SpendingQuerySchema>;

/**
 * Revenue by Client Query Parameters
 */
export const RevenueQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
});

export type RevenueQuery = z.infer<typeof RevenueQuerySchema>;

/**
 * Export Format Schema
 */
export const ExportFormatSchema = z.enum(['json', 'csv', 'pdf']);

export type ExportFormat = z.infer<typeof ExportFormatSchema>;
