import { z } from 'zod';

// ============================================================================
// Query schemas
// ============================================================================

/**
 * List rule suggestions — query params
 */
export const ListSuggestionsSchema = z.object({
  entityId: z.string().min(1),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListSuggestionsQuery = z.infer<typeof ListSuggestionsSchema>;

/**
 * Get/Approve/Reject — :id param
 */
export const SuggestionIdSchema = z.object({
  id: z.string().min(1),
});
export type SuggestionIdParams = z.infer<typeof SuggestionIdSchema>;

/**
 * Reject — optional reason body
 */
export const RejectSuggestionSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type RejectSuggestionInput = z.infer<typeof RejectSuggestionSchema>;

/**
 * Detect patterns — entityId query param
 */
export const DetectPatternsSchema = z.object({
  entityId: z.string().min(1),
});
export type DetectPatternsQuery = z.infer<typeof DetectPatternsSchema>;

/**
 * Expire stale suggestions — entityId body
 */
export const ExpireSuggestionsSchema = z.object({
  entityId: z.string().min(1),
});
export type ExpireSuggestionsInput = z.infer<typeof ExpireSuggestionsSchema>;
