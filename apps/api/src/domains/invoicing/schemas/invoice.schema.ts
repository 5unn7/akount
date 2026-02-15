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
  taxAmount: z.number().int().min(0),
  amount: z.number().int(), // Integer cents (quantity * unitPrice + taxAmount)
  glAccountId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

export const CreateInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3), // ISO 4217 (USD, CAD, EUR)
  subtotal: z.number().int().min(0),
  taxAmount: z.number().int().min(0),
  total: z.number().int().min(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
  notes: z.string().max(1000).optional(),
  lines: z.array(InvoiceLineSchema).min(1),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const ListInvoicesSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type ListInvoicesInput = z.infer<typeof ListInvoicesSchema>;
export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;
