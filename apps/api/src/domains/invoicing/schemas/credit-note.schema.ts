import { z } from 'zod';

/**
 * Zod validation schemas for CreditNote CRUD operations.
 *
 * CRITICAL RULES:
 * - All monetary fields MUST be integer cents (never floats)
 * - All amounts validated with .int() to enforce this
 * - Tenant isolation enforced at service layer (not schema)
 */

export const CreateCreditNoteSchema = z.object({
  entityId: z.string().cuid(),
  creditNoteNumber: z.string().min(1).max(50).optional(), // Auto-generated if omitted
  date: z.string().datetime(),
  currency: z.string().length(3), // ISO 4217
  amount: z.number().int().positive().max(100_000_000_000), // Integer cents, max $1B
  reason: z.string().min(1).max(1000),
  notes: z.string().max(2000).optional(),
  linkedInvoiceId: z.string().cuid().optional(),
  linkedBillId: z.string().cuid().optional(),
});

export const UpdateCreditNoteSchema = z.object({
  date: z.string().datetime().optional(),
  currency: z.string().length(3).optional(),
  amount: z.number().int().positive().max(100_000_000_000).optional(),
  reason: z.string().min(1).max(1000).optional(),
  notes: z.string().max(2000).optional().nullable(),
  linkedInvoiceId: z.string().cuid().optional().nullable(),
  linkedBillId: z.string().cuid().optional().nullable(),
});

export const ListCreditNotesSchema = z.object({
  entityId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'APPLIED', 'VOIDED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ApplyCreditNoteSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  billId: z.string().cuid().optional(),
  amount: z.number().int().positive().max(100_000_000_000), // Integer cents
}).refine(
  (data) => (data.invoiceId && !data.billId) || (!data.invoiceId && data.billId),
  { message: 'Must specify exactly one of invoiceId or billId' }
);

export type CreateCreditNoteInput = z.infer<typeof CreateCreditNoteSchema>;
export type UpdateCreditNoteInput = z.infer<typeof UpdateCreditNoteSchema>;
export type ListCreditNotesInput = z.infer<typeof ListCreditNotesSchema>;
export type ApplyCreditNoteInput = z.infer<typeof ApplyCreditNoteSchema>;
