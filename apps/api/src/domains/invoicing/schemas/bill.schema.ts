import { z } from 'zod';

/**
 * Zod validation schemas for Bill CRUD operations.
 *
 * Bills are AP (Accounts Payable) equivalents of AR Invoices.
 * Pattern mirrors invoice.schema.ts but uses Vendor instead of Client.
 *
 * CRITICAL RULES:
 * - All monetary fields MUST be integer cents (never floats)
 * - All amounts validated with .int() to enforce this
 * - Tenant isolation enforced at service layer (not schema)
 */

export const BillLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int(), // Integer cents
  taxRateId: z.string().cuid().optional(),
  taxAmount: z.number().int().min(0).max(100_000_000_000), // SECURITY FIX M-1: Max $1B
  amount: z.number().int().max(100_000_000_000), // Integer cents, max $1B
  glAccountId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

const CreateBillBaseSchema = z.object({
  vendorId: z.string().cuid(),
  billNumber: z.string().min(1).max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3), // ISO 4217 (USD, CAD, EUR)
  subtotal: z.number().int().min(0).max(100_000_000_000), // SECURITY FIX M-1: Max $1B
  taxAmount: z.number().int().min(0).max(100_000_000_000),
  total: z.number().int().min(0).max(100_000_000_000),
  status: z.enum(['DRAFT', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']),
  notes: z.string().max(1000).optional(),
  lines: z.array(BillLineSchema).min(1),
});

export const CreateBillSchema = CreateBillBaseSchema.refine(
  (data) => new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: 'Due date must be on or after issue date', // SECURITY FIX M-3
    path: ['dueDate'],
  }
);

export const UpdateBillSchema = CreateBillBaseSchema.partial();

export const ListBillsSchema = z.object({
  entityId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  vendorId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateBillInput = z.infer<typeof CreateBillSchema>;
export type UpdateBillInput = z.infer<typeof UpdateBillSchema>;
export type ListBillsInput = z.infer<typeof ListBillsSchema>;
export type BillLine = z.infer<typeof BillLineSchema>;
