import { z } from 'zod';

/**
 * AI Categorization validation schemas
 *
 * Extracted from routes.ts for reusability and test access.
 */

// POST /api/ai/categorize — single transaction categorization
export const CategorizeSingleSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().int('Amount must be an integer (cents)'),
  entityId: z.string().cuid('Invalid entity ID format').optional(),
});

export type CategorizeSingleInput = z.infer<typeof CategorizeSingleSchema>;

// POST /api/ai/categorize/batch — batch categorization by transaction IDs
export const CategorizeBatchSchema = z.object({
  transactionIds: z
    .array(z.string().cuid('Invalid transaction ID format'))
    .min(1, 'At least one transaction ID is required')
    .max(200, 'Maximum 200 transactions per batch'),
  entityId: z.string().cuid('Invalid entity ID format'),
});

export type CategorizeBatchInput = z.infer<typeof CategorizeBatchSchema>;

// POST /api/ai/chat — AI chat
export const ChatBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  options: z
    .object({
      provider: z.string().optional(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
      systemPrompt: z.string().optional(),
    })
    .optional(),
});

export type ChatBodyInput = z.infer<typeof ChatBodySchema>;
