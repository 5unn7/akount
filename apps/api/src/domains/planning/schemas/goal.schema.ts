import { z } from 'zod';

export const GoalTypeEnum = z.enum(['REVENUE', 'SAVINGS', 'EXPENSE_REDUCTION', 'CUSTOM']);
export const GoalStatusEnum = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED']);

export const CreateGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  entityId: z.string().cuid('Invalid entity ID'),
  type: GoalTypeEnum,
  targetAmount: z.number().int('Target must be integer cents').min(1, 'Target must be positive'),
  targetDate: z.coerce.date(),
  accountId: z.string().cuid('Invalid account ID').optional(),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  glAccountId: z.string().cuid('Invalid GL account ID').optional(),
});

export const UpdateGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: GoalTypeEnum.optional(),
  targetAmount: z.number().int('Target must be integer cents').min(1).optional(),
  currentAmount: z.number().int('Amount must be integer cents').min(0).optional(),
  targetDate: z.coerce.date().optional(),
  accountId: z.string().cuid('Invalid account ID').nullable().optional(),
  categoryId: z.string().cuid('Invalid category ID').nullable().optional(),
  glAccountId: z.string().cuid('Invalid GL account ID').nullable().optional(),
  status: GoalStatusEnum.optional(),
});

export const ListGoalsQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: GoalStatusEnum.optional(),
  type: GoalTypeEnum.optional(),
});

export const GoalIdParamSchema = z.object({
  id: z.string().cuid('Invalid goal ID'),
});

export const GoalTrackingQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
});

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type ListGoalsQuery = z.infer<typeof ListGoalsQuerySchema>;
export type GoalIdParam = z.infer<typeof GoalIdParamSchema>;
export type GoalTrackingQuery = z.infer<typeof GoalTrackingQuerySchema>;
