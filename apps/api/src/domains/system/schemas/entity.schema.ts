import { z } from 'zod';

/**
 * Entity Route Schemas
 *
 * Zod validation schemas for all entity management endpoints.
 */

export const EntityStatusValues = ['ACTIVE', 'ARCHIVED'] as const;

export const EntityTypeValues = [
  'PERSONAL',
  'CORPORATION',
  'SOLE_PROPRIETORSHIP',
  'PARTNERSHIP',
  'LLC',
] as const;

/** Query params for GET /entities */
export const ListEntitiesQuerySchema = z.object({
  status: z.enum(EntityStatusValues).optional(),
});
export type ListEntitiesQuery = z.infer<typeof ListEntitiesQuerySchema>;

/** Path param for /entities/:id */
export const EntityIdParamSchema = z.object({
  id: z.string().cuid(),
});
export type EntityIdParam = z.infer<typeof EntityIdParamSchema>;

/** Body for POST /entities */
export const CreateEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(EntityTypeValues),
  country: z.string().min(2).max(3),
  currency: z.string().min(3).max(3),
  fiscalYearStart: z.number().int().min(1).max(12).optional(),
  entitySubType: z.string().max(50).optional(),
  taxId: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});
export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;

/** Body for PATCH /entities/:id */
export const UpdateEntitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  fiscalYearStart: z.number().int().min(1).max(12).optional(),
  entitySubType: z.string().max(50).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  registrationDate: z.string().datetime().nullable().optional(),
});
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;
