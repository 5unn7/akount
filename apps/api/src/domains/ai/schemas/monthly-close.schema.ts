import { z } from 'zod';

// ============================================================================
// Close Readiness
// ============================================================================

export const CloseReadinessSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  periodId: z.string().cuid('Invalid period ID'),
});
export type CloseReadinessQuery = z.infer<typeof CloseReadinessSchema>;

// ============================================================================
// Execute Close
// ============================================================================

export const ExecuteCloseSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  periodId: z.string().cuid('Invalid period ID'),
});
export type ExecuteCloseInput = z.infer<typeof ExecuteCloseSchema>;

// ============================================================================
// Close History
// ============================================================================

export const CloseHistorySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  take: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().cuid('Invalid cursor').optional(),
});
export type CloseHistoryQuery = z.infer<typeof CloseHistorySchema>;
