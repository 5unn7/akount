import { z } from 'zod';

/**
 * Transfer validation schemas
 *
 * Transfers move money between accounts with automatic journal entry creation.
 * Validates accounts are different, same entity, and have required GL linkage.
 */

// POST /api/banking/transfers - Create transfer
export const CreateTransferSchema = z
  .object({
    fromAccountId: z.string().cuid('Invalid from account ID format'),
    toAccountId: z.string().cuid('Invalid to account ID format'),
    amount: z
      .number()
      .int('Amount must be an integer (cents)')
      .positive('Amount must be greater than 0'),
    currency: z
      .string()
      .length(3, 'Currency must be a 3-letter ISO 4217 code (e.g., USD, CAD, EUR)')
      .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters only'),
    date: z
      .string()
      .datetime('Date must be in ISO 8601 format (e.g., 2024-01-15T10:30:00Z)')
      .optional(),
    memo: z.string().max(500, 'Memo must be 500 characters or less').optional(),
    exchangeRate: z
      .number()
      .positive('Exchange rate must be positive')
      .optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Cannot transfer to the same account',
    path: ['toAccountId'],
  });

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;

// GET /api/banking/transfers - List transfers (query params)
export const ListTransfersQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID format'),
  startDate: z
    .string()
    .datetime('Start date must be in ISO 8601 format')
    .optional(),
  endDate: z
    .string()
    .datetime('End date must be in ISO 8601 format')
    .optional(),
  cursor: z.string().cuid('Invalid cursor format').optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
});

export type ListTransfersQuery = z.infer<typeof ListTransfersQuerySchema>;

// GET /api/banking/transfers/:id - Params validation
export const TransferIdParamSchema = z.object({
  id: z.string().cuid('Invalid transfer ID format'),
});

export type TransferIdParam = z.infer<typeof TransferIdParamSchema>;
