import { z } from 'zod';

/**
 * Zod validation schemas for Invoice CRUD operations.
 *
 * CRITICAL RULES:
 * - All monetary fields MUST be integer cents (never floats)
 * - All amounts validated with .int() to enforce this
 * - Tenant isolation enforced at service layer (not schema)
 */

export const InvoiceLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int(), // Integer cents
  taxRateId: z.string().cuid().optional(),
  taxAmount: z.number().int().min(0).max(100_000_000_000), // SECURITY FIX M-1: Max $1B
  amount: z.number().int().max(100_000_000_000), // Integer cents, max $1B
  glAccountId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

const CreateInvoiceBaseSchema = z.object({
  clientId: z.string().cuid(),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3), // ISO 4217 (USD, CAD, EUR)
  subtotal: z.number().int().min(0).max(100_000_000_000), // SECURITY FIX M-1: Max $1B
  taxAmount: z.number().int().min(0).max(100_000_000_000),
  total: z.number().int().min(0).max(100_000_000_000),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
  notes: z.string().max(1000).optional(),
  lines: z.array(InvoiceLineSchema).min(1),
});

export const CreateInvoiceSchema = CreateInvoiceBaseSchema.refine(
  (data) => new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: 'Due date must be on or after issue date', // SECURITY FIX M-3
    path: ['dueDate'],
  }
);

export const UpdateInvoiceSchema = CreateInvoiceBaseSchema.partial();

export const ListInvoicesSchema = z.object({
  entityId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type ListInvoicesInput = z.infer<typeof ListInvoicesSchema>;
export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;
