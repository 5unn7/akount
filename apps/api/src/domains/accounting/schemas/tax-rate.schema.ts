import { z } from 'zod';

// ============================================================================
// Params
// ============================================================================

export const TaxRateParamsSchema = z.object({
    id: z.string().cuid('Invalid tax rate ID'),
});
export type TaxRateParams = z.infer<typeof TaxRateParamsSchema>;

// ============================================================================
// Create
// ============================================================================

export const CreateTaxRateSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID'), // REQUIRED - prevents global rate pollution (SEC-25)
    code: z
        .string()
        .min(1, 'Code is required')
        .max(20, 'Code must be 20 characters or less')
        .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
    name: z.string().min(1, 'Name is required').max(255),
    rate: z
        .number()
        .min(0, 'Rate must be non-negative')
        .max(1, 'Rate must be 1 (100%) or less'),
    jurisdiction: z.string().min(1, 'Jurisdiction is required').max(100),
    isInclusive: z.boolean().default(false),
    glAccountId: z.string().cuid('Invalid GL account ID').optional(),
    effectiveFrom: z.string().datetime('Invalid datetime format'),
    effectiveTo: z.string().datetime('Invalid datetime format').optional(),
});
export type CreateTaxRateInput = z.infer<typeof CreateTaxRateSchema>;

// ============================================================================
// Update
// ============================================================================

export const UpdateTaxRateSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    rate: z.number().min(0).max(1).optional(),
    jurisdiction: z.string().min(1).max(100).optional(),
    isInclusive: z.boolean().optional(),
    glAccountId: z.string().cuid('Invalid GL account ID').nullable().optional(),
    isActive: z.boolean().optional(),
    effectiveFrom: z.string().datetime().optional(),
    effectiveTo: z.string().datetime().nullable().optional(),
});
export type UpdateTaxRateInput = z.infer<typeof UpdateTaxRateSchema>;

// ============================================================================
// List / Query
// ============================================================================

export const ListTaxRatesSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID').optional(),
    jurisdiction: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().max(100).optional(),
});
export type ListTaxRatesQuery = z.infer<typeof ListTaxRatesSchema>;

// ============================================================================
// Deactivate (soft delete equivalent for tax rates)
// ============================================================================

export const DeactivateTaxRateSchema = z.object({
    effectiveTo: z.string().datetime('Invalid datetime format').optional(),
});
export type DeactivateTaxRateInput = z.infer<typeof DeactivateTaxRateSchema>;
