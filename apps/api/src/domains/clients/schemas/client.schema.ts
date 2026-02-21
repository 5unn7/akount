import { z } from 'zod';

/**
 * Zod validation schemas for Client CRUD operations.
 *
 * Clients are AR (Accounts Receivable) counterparties.
 *
 * CRITICAL RULES:
 * - Tenant isolation enforced at service layer (not schema)
 * - Soft delete pattern used (deletedAt field)
 */

export const CreateClientSchema = z.object({
  entityId: z.string().cuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  paymentTerms: z.string().max(100).optional(), // e.g., "Net 30"
  status: z.enum(['active', 'inactive']).default('active'),
});

export const UpdateClientSchema = CreateClientSchema.partial().omit({ entityId: true });

export const ListClientsSchema = z.object({
  entityId: z.string().cuid().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().max(100).optional(), // Search name or email
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ListClientsInput = z.infer<typeof ListClientsSchema>;
