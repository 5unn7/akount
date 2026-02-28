import { z } from 'zod';

/**
 * Invoice Extraction Schemas
 *
 * Zod schemas for validating AI-extracted invoice data (AR - Accounts Receivable).
 * Used by DocumentExtractionService (B1) and InvoiceScanWorker (B5).
 *
 * **Financial Invariant:** All monetary amounts MUST be integer cents (never floats).
 *
 * @module invoice-extraction-schemas
 */

/**
 * Line item from invoice extraction.
 *
 * Represents a single product/service billed to client.
 */
export const InvoiceLineItemSchema = z.object({
  /** Item description (e.g., "Consulting Services - 10 hours") */
  description: z.string().min(1, 'Description required'),

  /** Quantity billed (defaults to 1 if AI omits) */
  quantity: z.number().positive().optional(),

  /** Unit price in integer cents (e.g., 10000 = $100.00/hour) */
  unitPrice: z.number().int().positive(),

  /** Line item total in integer cents (quantity × unitPrice, pre-tax) */
  amount: z.number().int().positive(),

  /** Optional tax amount for this line in integer cents */
  taxAmount: z.number().int().nonnegative().optional(),

  /** Optional GL account hint from AI */
  glAccountCode: z.string().optional(),
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

/**
 * Tax breakdown from invoice.
 *
 * Itemized tax charges (GST, PST, HST, Sales Tax, etc.)
 */
export const InvoiceTaxBreakdownSchema = z.object({
  /** Tax name (e.g., "GST", "Sales Tax") */
  name: z.string(),

  /** Tax rate as decimal (e.g., 0.13 for 13% HST) */
  rate: z.number().min(0).max(1),

  /** Tax amount in integer cents */
  amount: z.number().int().nonnegative(),
});

export type InvoiceTaxBreakdown = z.infer<typeof InvoiceTaxBreakdownSchema>;

/**
 * Payment terms extracted from invoice.
 */
export const InvoicePaymentTermsSchema = z.object({
  /** Payment terms code (e.g., "NET 30", "NET 15", "Due on Receipt") */
  terms: z.string().optional(),

  /** Due date (ISO 8601 format) */
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  /** Discount terms (e.g., "2/10 Net 30") */
  discountTerms: z.string().optional(),

  /** Late fee information */
  lateFee: z.string().optional(),
});

export type InvoicePaymentTerms = z.infer<typeof InvoicePaymentTermsSchema>;

/**
 * Complete invoice extraction result from AI.
 *
 * All amounts MUST be integer cents. Rejects floats via `.int()`.
 */
export const InvoiceExtractionSchema = z.object({
  /** Invoice number */
  invoiceNumber: z.string().optional(),

  /** Client/customer name (will be matched to Client record) */
  clientName: z.string().min(1, 'Client name required'),

  /** Invoice date (ISO 8601 format: YYYY-MM-DD) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),

  /** Currency code (ISO 4217: USD, CAD, EUR, etc.) */
  currency: z.string().length(3, 'Currency must be 3-letter ISO code'),

  /** Subtotal in integer cents (before tax) */
  subtotal: z.number().int().nonnegative(),

  /** Total tax amount in integer cents */
  taxAmount: z.number().int().nonnegative(),

  /** Grand total in integer cents (subtotal + tax) */
  totalAmount: z.number().int().positive(),

  /** Line items array */
  lineItems: z.array(InvoiceLineItemSchema).min(1, 'At least one line item required'),

  /** Tax breakdown (optional) */
  taxBreakdown: z.array(InvoiceTaxBreakdownSchema).optional(),

  /** Payment terms */
  paymentTerms: InvoicePaymentTermsSchema.optional(),

  /** Overall extraction confidence (0-100) */
  confidence: z.number().int().min(0).max(100),

  /** Per-field confidence scores (optional) */
  fieldConfidence: z
    .object({
      clientName: z.number().int().min(0).max(100).optional(),
      invoiceNumber: z.number().int().min(0).max(100).optional(),
      date: z.number().int().min(0).max(100).optional(),
      totalAmount: z.number().int().min(0).max(100).optional(),
      lineItems: z.number().int().min(0).max(100).optional(),
      paymentTerms: z.number().int().min(0).max(100).optional(),
    })
    .optional(),

  /** Model version used for extraction (for audit trail) */
  modelVersion: z.string(),

  /** Raw OCR text (for secondary validation) */
  ocrText: z.string().optional(),

  /** Client contact information (if present) */
  clientContact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

/**
 * Validate invoice extraction totals (business rule).
 *
 * Ensures: subtotal + taxAmount = totalAmount
 */
export function validateInvoiceTotals(invoice: InvoiceExtraction): void {
  const calculatedTotal = invoice.subtotal + invoice.taxAmount;

  if (calculatedTotal !== invoice.totalAmount) {
    throw new Error(
      `Invoice total mismatch: subtotal (${invoice.subtotal}) + tax (${invoice.taxAmount}) = ${calculatedTotal}, but totalAmount is ${invoice.totalAmount}`
    );
  }

  // Validate line items sum to subtotal
  const lineItemsTotal = invoice.lineItems.reduce((sum, line) => sum + line.amount, 0);

  if (lineItemsTotal !== invoice.subtotal) {
    throw new Error(
      `Invoice line items total (${lineItemsTotal}) does not match subtotal (${invoice.subtotal})`
    );
  }
}
