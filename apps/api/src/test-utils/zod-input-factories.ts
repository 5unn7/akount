/**
 * Zod Input Factory Generator
 *
 * Creates factories for API inputs that are validated against Zod schemas.
 * Ensures factories always produce valid input data.
 *
 * Usage:
 *   const mockTaxRateInput = createInputFactory(CreateTaxRateSchema, { ... });
 *   const input = mockTaxRateInput({ code: 'HST' }); // override specific fields
 */

import type { z } from 'zod';

/**
 * Creates a factory function for producing validated Zod input data.
 *
 * @param schema - Zod schema to validate against
 * @param defaults - Default values that satisfy the schema
 * @returns Factory function that merges overrides with defaults and validates
 */
export function createInputFactory<T extends z.ZodTypeAny>(
  schema: T,
  defaults: z.input<T>,
) {
  return (overrides: Partial<z.input<T>> = {}): z.output<T> => {
    const data = { ...defaults, ...overrides };
    return schema.parse(data);
  };
}
