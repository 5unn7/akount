import { z } from 'zod';

/**
 * Reconciliation validation schemas
 *
 * Ensures data integrity for matching and reconciliation operations
 */

// GET /api/banking/reconciliation/:bankFeedTransactionId/suggestions
export const SuggestMatchesParamsSchema = z.object({
  bankFeedTransactionId: z.string().cuid('Invalid bank feed transaction ID format'),
});

export type SuggestMatchesParams = z.infer<typeof SuggestMatchesParamsSchema>;

export const SuggestMatchesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(20, 'Limit cannot exceed 20')
    .optional()
    .default(5),
});

export type SuggestMatchesQuery = z.infer<typeof SuggestMatchesQuerySchema>;

// POST /api/banking/reconciliation/matches
export const CreateMatchSchema = z.object({
  bankFeedTransactionId: z.string().cuid('Invalid bank feed transaction ID format'),
  transactionId: z.string().cuid('Invalid transaction ID format'),
});

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;

// DELETE /api/banking/reconciliation/matches/:matchId
export const MatchIdParamSchema = z.object({
  matchId: z.string().cuid('Invalid match ID format'),
});

export type MatchIdParam = z.infer<typeof MatchIdParamSchema>;

// GET /api/banking/reconciliation/status/:accountId
export const ReconciliationStatusParamsSchema = z.object({
  accountId: z.string().cuid('Invalid account ID format'),
});

export type ReconciliationStatusParams = z.infer<typeof ReconciliationStatusParamsSchema>;
