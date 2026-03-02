import { z } from 'zod';

/**
 * Natural Language Bookkeeping Schemas
 *
 * Parse natural language input ("Paid $47 for Uber to airport") into structured transaction data.
 *
 * @module natural-bookkeeping.schema
 */

/**
 * Request schema: Parse natural language text
 */
export const ParseNaturalLanguageSchema = z.object({
  text: z.string().min(1, 'Text input is required'),
  entityId: z.string().cuid('Invalid entity ID'),
});

export type ParseNaturalLanguageInput = z.infer<typeof ParseNaturalLanguageSchema>;

/**
 * Response schema: Parsed transaction data
 */
export const ParsedTransactionSchema = z.object({
  parsed: z.object({
    vendor: z.string(),
    amount: z.number().int().positive('Amount must be positive integer cents'),
    category: z.string().optional(),
    glAccountId: z.string().cuid().optional(),
    date: z.string().datetime('Date must be ISO 8601 format'),
    description: z.string().optional(),
  }),
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
  requiresReview: z.boolean(),
});

export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;

/**
 * Mistral function calling schema for parsing transactions
 */
export const mistralTransactionFunctionSchema = {
  name: 'parse_transaction',
  description: 'Parse natural language text into structured transaction data',
  parameters: {
    type: 'object',
    properties: {
      vendor: {
        type: 'string',
        description: 'Merchant or payee name',
      },
      amountDollars: {
        type: 'number',
        description: 'Amount in dollars (will be converted to cents)',
      },
      category: {
        type: 'string',
        description: 'Expense category (Travel, Food, Office, etc.)',
      },
      date: {
        type: 'string',
        description: 'ISO 8601 date (YYYY-MM-DD), use today if not specified',
      },
      description: {
        type: 'string',
        description: 'Cleaned description of the transaction',
      },
    },
    required: ['vendor', 'amountDollars'],
  },
} as const;
