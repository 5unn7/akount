import { z } from 'zod';

/**
 * Zod validation schemas for Vendor CRUD operations.
 *
 * Vendors are AP (Accounts Payable) counterparties.
 * Pattern mirrors client.schema.ts.
 *
 * CRITICAL RULES:
 * - Tenant isolation enforced at service layer (not schema)
 * - Soft delete pattern used (deletedAt field)
 */

export const CreateVendorSchema = z.object({
  entityId: z.string().cuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  paymentTerms: z.string().max(100).optional(), // e.g., "Net 30"
  status: z.enum(['active', 'inactive']).default('active'),
});

export const UpdateVendorSchema = CreateVendorSchema.partial().omit({ entityId: true });

export const ListVendorsSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().max(100).optional(), // Search name or email
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
export type ListVendorsInput = z.infer<typeof ListVendorsSchema>;
