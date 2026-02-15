import { z } from 'zod'

/**
 * Common validation schemas used across the API
 */

// UUID validation
export const uuidSchema = z.string().uuid()

// Pagination schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

// Date range schemas
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Entity type enum
export const entityTypeSchema = z.enum(['INDIVIDUAL', 'BUSINESS', 'TRUST', 'OTHER'])

// Currency code (ISO 4217)
export const currencySchema = z.string().length(3).toUpperCase()

// Example: Test validation schema
export const createTestDataSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  tags: z.array(z.string()).optional(),
})

export type CreateTestData = z.infer<typeof createTestDataSchema>

// Query filter example
export const testQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  ...paginationQuerySchema.shape,
})

export type TestQuery = z.infer<typeof testQuerySchema>
