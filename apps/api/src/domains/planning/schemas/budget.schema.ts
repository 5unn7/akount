import { z } from 'zod';

export const CreateBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  entityId: z.string().cuid('Invalid entity ID'),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  glAccountId: z.string().cuid('Invalid GL account ID').optional(),
  amount: z.number().int('Amount must be integer cents').min(1, 'Amount must be positive'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const UpdateBudgetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  categoryId: z.string().cuid('Invalid category ID').nullable().optional(),
  glAccountId: z.string().cuid('Invalid GL account ID').nullable().optional(),
  amount: z.number().int('Amount must be integer cents').min(1).optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const ListBudgetsQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  categoryId: z.string().cuid().optional(),
});

export const BudgetIdParamSchema = z.object({
  id: z.string().cuid('Invalid budget ID'),
});

export const BudgetVarianceQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
});

export const BudgetRolloverBodySchema = z.object({
  carryUnusedAmount: z.boolean().optional().default(true),
});

export const BudgetSuggestionsQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  lookbackMonths: z.coerce.number().int().min(3).max(12).optional(),
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;
export type ListBudgetsQuery = z.infer<typeof ListBudgetsQuerySchema>;
export type BudgetIdParam = z.infer<typeof BudgetIdParamSchema>;
export type BudgetVarianceQuery = z.infer<typeof BudgetVarianceQuerySchema>;
export type BudgetRolloverBody = z.infer<typeof BudgetRolloverBodySchema>;
export type BudgetSuggestionsQuery = z.infer<typeof BudgetSuggestionsQuerySchema>;
