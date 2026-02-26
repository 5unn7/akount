import { z } from 'zod';
import { RuleSource } from '@akount/db';

// ============================================================================
// Condition schemas
// ============================================================================

/**
 * Rule condition schema (field allowlist)
 */
export const RuleConditionSchema = z.object({
  field: z.enum(['description', 'amount', 'accountId'], {
    errorMap: () => ({ message: 'Field must be one of: description, amount, accountId' }),
  }),
  op: z.enum(['contains', 'eq', 'gt', 'gte', 'lt', 'lte'], {
    errorMap: () => ({ message: 'Operator must be one of: contains, eq, gt, gte, lt, lte' }),
  }),
  value: z.union([z.string(), z.number()]),
});
export type RuleCondition = z.infer<typeof RuleConditionSchema>;

/**
 * Rule conditions structure (AND/OR logic with 1-10 conditions)
 */
export const RuleConditionsSchema = z.object({
  operator: z.enum(['AND', 'OR']),
  conditions: z
    .array(RuleConditionSchema)
    .min(1, 'At least one condition is required')
    .max(10, 'Maximum 10 conditions allowed per rule'),
});
export type RuleConditions = z.infer<typeof RuleConditionsSchema>;

// ============================================================================
// Action schema
// ============================================================================

/**
 * Rule action schema (at least one action required)
 */
export const RuleActionSchema = z
  .object({
    setCategoryId: z.string().cuid('Invalid category ID').optional(),
    setGLAccountId: z.string().cuid('Invalid GL account ID').optional(),
    flagForReview: z.boolean().optional(),
  })
  .refine((data) => data.setCategoryId || data.setGLAccountId || data.flagForReview, {
    message: 'At least one action field must be set',
  });
export type RuleAction = z.infer<typeof RuleActionSchema>;

// ============================================================================
// Create
// ============================================================================

/**
 * Create rule schema with JSON payload size limit (10KB)
 */
export const CreateRuleSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    entityId: z.string().cuid('Invalid entity ID'),
    source: z.nativeEnum(RuleSource).optional().default('USER_MANUAL'),
    conditions: RuleConditionsSchema,
    action: RuleActionSchema,
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      const size = JSON.stringify(data).length;
      return size <= 10000; // 10KB limit
    },
    { message: 'Rule payload too large (max 10KB)' }
  );
export type CreateRuleInput = z.infer<typeof CreateRuleSchema>;

// ============================================================================
// Update
// ============================================================================

/**
 * Update rule schema with JSON payload size limit (10KB)
 */
export const UpdateRuleSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    conditions: RuleConditionsSchema.optional(),
    action: RuleActionSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const size = JSON.stringify(data).length;
      return size <= 10000; // 10KB limit
    },
    { message: 'Rule payload too large (max 10KB)' }
  );
export type UpdateRuleInput = z.infer<typeof UpdateRuleSchema>;

// ============================================================================
// List / Query
// ============================================================================

/**
 * List rules query parameters
 */
export const ListRulesSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  isActive: z.coerce.boolean().optional(),
  source: z.nativeEnum(RuleSource).optional(),
  search: z.string().max(100).optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().cuid('Invalid cursor').optional(),
});
export type ListRulesQuery = z.infer<typeof ListRulesSchema>;

// ============================================================================
// Params
// ============================================================================

/**
 * Rule ID parameter schema
 */
export const RuleIdSchema = z.object({
  id: z.string().cuid('Invalid rule ID'),
});
export type RuleIdParams = z.infer<typeof RuleIdSchema>;

// ============================================================================
// Stats Query
// ============================================================================

/**
 * Rule stats query parameters
 */
export const RuleStatsSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
});
export type RuleStatsQuery = z.infer<typeof RuleStatsSchema>;
