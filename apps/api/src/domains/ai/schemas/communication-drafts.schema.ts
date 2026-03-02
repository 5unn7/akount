import { z } from 'zod';

/**
 * Communication Drafts validation schemas
 *
 * Validates input for AI-generated client communication drafts.
 */

// GET /api/ai/communications/draft (query params)
export const GenerateDraftQuerySchema = z.object({
  invoiceId: z.string().cuid('Invalid invoice ID format'),
  entityId: z.string().cuid('Invalid entity ID format'),
  type: z.enum(['payment_reminder'], {
    errorMap: () => ({ message: 'Currently only payment_reminder is supported' }),
  }),
  tone: z.enum(['formal', 'friendly', 'urgent']).optional(),
});

export type GenerateDraftQueryInput = z.infer<typeof GenerateDraftQuerySchema>;
