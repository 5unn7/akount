import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  parentCategoryId: z.string().cuid('Invalid parent category ID').optional(),
  color: z.string().max(20).optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  parentCategoryId: z.string().cuid('Invalid parent category ID').nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const ListCategoriesQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  isActive: z.coerce.boolean().optional(),
  includeChildren: z.coerce.boolean().optional(),
});

export const CategoryIdParamSchema = z.object({
  id: z.string().cuid('Invalid category ID'),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof ListCategoriesQuerySchema>;
export type CategoryIdParam = z.infer<typeof CategoryIdParamSchema>;