import { z } from 'zod';

/**
 * Transaction validation schemas
 *
 * Ensures data integrity before reaching the service layer
 */

// POST /api/banking/transactions - Create new transaction
export const CreateTransactionSchema = z.object({
  accountId: z.string().cuid('Invalid account ID format'),
  date: z.string().datetime('Date must be in ISO 8601 format (e.g., 2024-01-15T10:30:00Z)'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  amount: z.number().int('Amount must be an integer (cents)'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter ISO 4217 code (e.g., USD, CAD, EUR)')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters only'),
  categoryId: z.string().cuid('Invalid category ID format').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  sourceType: z.enum(['MANUAL', 'BANK_FEED', 'INVOICE', 'BILL'], {
    errorMap: () => ({
      message: 'Source type must be one of: MANUAL, BANK_FEED, INVOICE, BILL',
    }),
  }),
  sourceId: z.string().cuid('Invalid source ID format').optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// PATCH /api/banking/transactions/:id - Update transaction
export const UpdateTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Description cannot be empty')
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  categoryId: z
    .string()
    .cuid('Invalid category ID format')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .nullable()
    .optional(),
});

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

// GET /api/banking/transactions - List transactions (query params)
export const ListTransactionsQuerySchema = z.object({
  accountId: z.string().cuid('Invalid account ID format').optional(),
  startDate: z
    .string()
    .datetime('Start date must be in ISO 8601 format')
    .optional(),
  endDate: z
    .string()
    .datetime('End date must be in ISO 8601 format')
    .optional(),
  categoryId: z.string().cuid('Invalid category ID format').optional(),
  cursor: z.string().cuid('Invalid cursor format').optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
});

export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;

// DELETE /api/banking/transactions/:id - Params validation
export const TransactionIdParamSchema = z.object({
  id: z.string().cuid('Invalid transaction ID format'),
});

export type TransactionIdParam = z.infer<typeof TransactionIdParamSchema>;

// PATCH /api/banking/transactions/bulk/categorize - Bulk categorize
export const BulkCategorizeSchema = z.object({
  transactionIds: z
    .array(z.string().cuid('Invalid transaction ID format'))
    .min(1, 'At least one transaction ID is required')
    .max(100, 'Cannot process more than 100 transactions at once'),
  categoryId: z
    .string()
    .cuid('Invalid category ID format')
    .nullable(),
});

export type BulkCategorizeInput = z.infer<typeof BulkCategorizeSchema>;

// GET /api/banking/transactions/spending-by-category
export const SpendingByCategoryQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID format').optional(),
  accountId: z.string().cuid('Invalid account ID format').optional(),
  startDate: z
    .string()
    .datetime('Start date must be in ISO 8601 format')
    .optional(),
  endDate: z
    .string()
    .datetime('End date must be in ISO 8601 format')
    .optional(),
});

export type SpendingByCategoryQuery = z.infer<typeof SpendingByCategoryQuerySchema>;

// DELETE /api/banking/transactions/bulk - Bulk soft delete
export const BulkDeleteSchema = z.object({
  transactionIds: z
    .array(z.string().cuid('Invalid transaction ID format'))
    .min(1, 'At least one transaction ID is required')
    .max(100, 'Cannot process more than 100 transactions at once'),
});

export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
