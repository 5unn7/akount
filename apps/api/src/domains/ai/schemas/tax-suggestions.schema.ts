import { z } from 'zod';

/**
 * Tax Suggestions Schemas
 *
 * Request validation for tax optimization suggestions endpoint.
 */

/**
 * GET /api/ai/tax-suggestions
 *
 * Query parameters for tax optimization suggestions.
 */
export const TaxSuggestionsQuerySchema = z.object({
  entityId: z.string().cuid(),
  year: z.coerce.number().int().min(2020).max(2030).optional().default(new Date().getFullYear()),
});

export type TaxSuggestionsQueryInput = z.infer<typeof TaxSuggestionsQuerySchema>;
