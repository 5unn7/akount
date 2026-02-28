import { z } from 'zod';

/**
 * Natural Search Schemas
 *
 * Zod validation schemas for natural language search query parsing.
 *
 * @module natural-search.schema
 */

/**
 * Natural search query schema
 */
export const NaturalSearchQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  entityId: z.string().cuid(),
  scope: z
    .enum(['transactions', 'invoices', 'bills', 'all'])
    .optional()
    .default('transactions'),
});

export type NaturalSearchQueryInput = z.infer<typeof NaturalSearchQuerySchema>;

/**
 * Mistral function calling schema for search query parsing
 */
export const mistralSearchFunctionSchema = {
  name: 'parse_search_query',
  description: 'Parse natural language search query into filter parameters',
  parameters: {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Category names (e.g., ["Food & Dining", "Travel"])',
      },
      amountMinDollars: {
        type: 'number',
        description: 'Minimum amount in dollars',
      },
      amountMaxDollars: {
        type: 'number',
        description: 'Maximum amount in dollars',
      },
      dateFrom: {
        type: 'string',
        description: 'Start date (ISO 8601)',
      },
      dateTo: {
        type: 'string',
        description: 'End date (ISO 8601)',
      },
      vendor: {
        type: 'string',
        description: 'Vendor/merchant name',
      },
      keywords: {
        type: 'string',
        description: 'Keywords to search in description',
      },
      transactionType: {
        type: 'string',
        enum: ['expense', 'income', 'all'],
        description: 'Type of transaction',
      },
    },
  },
};
