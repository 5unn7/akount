import { z } from 'zod';

/**
 * JE Suggestion validation schemas
 *
 * Endpoints:
 * - POST /api/ai/je-suggest        — Preview JE suggestions (no persistence)
 * - POST /api/ai/je-suggest/create  — Create draft JEs from approved suggestions
 */

// POST /api/ai/je-suggest — Preview suggestions for a batch of transactions
export const JESuggestSchema = z.object({
  transactionIds: z
    .array(z.string().cuid('Invalid transaction ID format'))
    .min(1, 'At least one transaction ID is required')
    .max(100, 'Maximum 100 transactions per batch'),
  entityId: z.string().cuid('Invalid entity ID format'),
});

export type JESuggestInput = z.infer<typeof JESuggestSchema>;

// POST /api/ai/je-suggest/create — Create draft JEs from suggestion indices
export const JECreateFromSuggestionsSchema = z.object({
  transactionIds: z
    .array(z.string().cuid('Invalid transaction ID format'))
    .min(1, 'At least one transaction ID is required')
    .max(100, 'Maximum 100 transactions per batch'),
  entityId: z.string().cuid('Invalid entity ID format'),
  /** Optional: only create JEs for transactions at or above this confidence */
  minConfidence: z.number().int().min(0).max(100).optional(),
});

export type JECreateFromSuggestionsInput = z.infer<typeof JECreateFromSuggestionsSchema>;
