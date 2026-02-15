import { z } from 'zod';
import { GLAccountType, NormalBalance } from '@akount/db';

// ============================================================================
// Params
// ============================================================================

export const GLAccountParamsSchema = z.object({
  id: z.string().cuid('Invalid GL account ID'),
});
export type GLAccountParams = z.infer<typeof GLAccountParamsSchema>;

// ============================================================================
// Create
// ============================================================================

export const CreateGLAccountSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  code: z.string().regex(/^\d{4}$/, 'Account code must be exactly 4 digits'),
  name: z.string().min(1, 'Name is required').max(255),
  type: z.nativeEnum(GLAccountType),
  normalBalance: z.nativeEnum(NormalBalance),
  description: z.string().max(500).optional(),
  parentAccountId: z.string().cuid('Invalid parent account ID').optional(),
});
export type CreateGLAccountInput = z.infer<typeof CreateGLAccountSchema>;

// ============================================================================
// Update (code and type are IMMUTABLE after creation)
// ============================================================================

export const UpdateGLAccountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  parentAccountId: z.string().cuid('Invalid parent account ID').nullable().optional(),
});
export type UpdateGLAccountInput = z.infer<typeof UpdateGLAccountSchema>;

// ============================================================================
// List / Query
// ============================================================================

export const ListGLAccountsSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  type: z.nativeEnum(GLAccountType).optional(),
  isActive: z.coerce.boolean().optional(),
  parentAccountId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
});
export type ListGLAccountsQuery = z.infer<typeof ListGLAccountsSchema>;

// ============================================================================
// Seed
// ============================================================================

export const SeedCOASchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
});
export type SeedCOAInput = z.infer<typeof SeedCOASchema>;

// ============================================================================
// Balances
// ============================================================================

export const BalancesQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
});
export type BalancesQuery = z.infer<typeof BalancesQuerySchema>;
