import { z } from 'zod';

/**
 * Zod validation schemas for Payment CRUD + allocation operations.
 *
 * CRITICAL RULES:
 * - All monetary fields MUST be integer cents (never floats)
 * - Payment must target either clientId (AR) or vendorId (AP), not both
 * - Allocations link payments to specific invoices or bills
 */

export const CreatePaymentSchema = z.object({
  date: z.string().datetime(),
  amount: z.number().int().positive().max(100_000_000_000), // Integer cents, max $1B
  currency: z.string().length(3), // ISO 4217
  paymentMethod: z.enum(['CARD', 'TRANSFER', 'CASH', 'CHECK', 'WIRE', 'OTHER']),
  reference: z.string().max(100).optional(),
  clientId: z.string().cuid().optional(),
  vendorId: z.string().cuid().optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => (data.clientId && !data.vendorId) || (!data.clientId && data.vendorId),
  { message: 'Payment must target either a client (AR) or vendor (AP), not both', path: ['clientId'] }
);

export const UpdatePaymentSchema = z.object({
  date: z.string().datetime().optional(),
  paymentMethod: z.enum(['CARD', 'TRANSFER', 'CASH', 'CHECK', 'WIRE', 'OTHER']).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const ListPaymentsSchema = z.object({
  clientId: z.string().cuid().optional(),
  vendorId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const AllocatePaymentSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  billId: z.string().cuid().optional(),
  amount: z.number().int().positive().max(100_000_000_000), // Integer cents
}).refine(
  (data) => (data.invoiceId && !data.billId) || (!data.invoiceId && data.billId),
  { message: 'Allocation must target either an invoice or a bill, not both', path: ['invoiceId'] }
);

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type ListPaymentsInput = z.infer<typeof ListPaymentsSchema>;
export type AllocatePaymentInput = z.infer<typeof AllocatePaymentSchema>;
