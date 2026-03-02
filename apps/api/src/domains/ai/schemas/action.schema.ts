import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared Enums
// ---------------------------------------------------------------------------

const AIActionStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'EXPIRED']);
const AIActionTypeEnum = z.enum(['CATEGORIZATION', 'JE_DRAFT', 'RULE_SUGGESTION', 'ALERT']);

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const ActionIdParamsSchema = z.object({
  actionId: z.string().cuid(),
});

export type ActionIdParams = z.infer<typeof ActionIdParamsSchema>;

// ---------------------------------------------------------------------------
// Query — List Actions
// ---------------------------------------------------------------------------

export const ListActionsQuerySchema = z.object({
  entityId: z.string().cuid(),
  status: AIActionStatusEnum.optional(),
  type: AIActionTypeEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListActionsQuery = z.infer<typeof ListActionsQuerySchema>;

// ---------------------------------------------------------------------------
// Body — Approve / Reject (single)
// ---------------------------------------------------------------------------

export const ReviewActionBodySchema = z.object({
  entityId: z.string().cuid(),
});

export type ReviewActionBody = z.infer<typeof ReviewActionBodySchema>;

// ---------------------------------------------------------------------------
// Body — Batch Approve / Reject
// ---------------------------------------------------------------------------

export const BatchReviewBodySchema = z.object({
  entityId: z.string().cuid(),
  actionIds: z.array(z.string().cuid()).min(1).max(100),
});

export type BatchReviewBody = z.infer<typeof BatchReviewBodySchema>;

// ---------------------------------------------------------------------------
// Query — Stats
// ---------------------------------------------------------------------------

export const StatsQuerySchema = z.object({
  entityId: z.string().cuid(),
});

export type StatsQuery = z.infer<typeof StatsQuerySchema>;
