import { z } from 'zod';

/**
 * Bill Extraction Schemas
 *
 * Zod schemas for validating AI-extracted bill data from receipts, invoices, and PDFs.
 * Used by DocumentExtractionService (B1) and BillScanWorker (B4).
 *
 * **Financial Invariant:** All monetary amounts MUST be integer cents (never floats).
 *
 * @module bill-extraction-schemas
 */

/**
 * Line item from bill extraction.
 *
 * Represents a single product/service on the bill.
 */
export const LineItemSchema = z.object({
  /** Item description (e.g., "Large Latte", "Office Supplies") */
  description: z.string().min(1, 'Description required'),

  /** Quantity purchased (defaults to 1 if AI omits) */
  quantity: z.number().positive().optional(),

  /** Unit price in integer cents (e.g., 550 = $5.50) */
  unitPrice: z.number().int().positive(),

  /** Line item total in integer cents (quantity × unitPrice, pre-tax) */
  amount: z.number().int().positive(),

  /** Optional tax amount for this line in integer cents */
  taxAmount: z.number().int().nonnegative().optional(),

  /** Optional category hint from AI */
  category: z.string().optional(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

/**
 * Tax breakdown from bill.
 *
 * Itemized tax charges (GST, PST, HST, etc.)
 */
export const TaxBreakdownSchema = z.object({
  /** Tax name (e.g., "GST", "PST", "Sales Tax") */
  name: z.string(),

  /** Tax rate as decimal (e.g., 0.05 for 5%) */
  rate: z.number().min(0).max(1),

  /** Tax amount in integer cents */
  amount: z.number().int().nonnegative(),
});

export type TaxBreakdown = z.infer<typeof TaxBreakdownSchema>;

/**
 * Payment terms extracted from bill.
 */
export const PaymentTermsSchema = z.object({
  /** Payment terms code (e.g., "NET 30", "Due on Receipt") */
  terms: z.string().optional(),

  /** Due date (ISO 8601 format) */
  dueDate: z.string().optional(),

  /** Discount terms (e.g., "2/10 Net 30" = 2% discount if paid within 10 days) */
  discountTerms: z.string().optional(),
});

export type PaymentTerms = z.infer<typeof PaymentTermsSchema>;

/**
 * Complete bill extraction result from AI.
 *
 * All amounts MUST be integer cents. Rejects floats via `.int()`.
 */
export const BillExtractionSchema = z.object({
  /** Vendor/supplier name */
  vendor: z.string().min(1, 'Vendor name required'),

  /** Bill date (ISO 8601 format: YYYY-MM-DD) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),

  /** Bill number (if present on document) */
  billNumber: z.string().optional(),

  /** Currency code (ISO 4217: USD, CAD, EUR, etc.) */
  currency: z.string().length(3, 'Currency must be 3-letter ISO code'),

  /** Subtotal in integer cents (before tax) */
  subtotal: z.number().int().nonnegative(),

  /** Total tax amount in integer cents */
  taxAmount: z.number().int().nonnegative(),

  /** Grand total in integer cents (subtotal + tax) */
  totalAmount: z.number().int().positive(),

  /** Line items array */
  lineItems: z.array(LineItemSchema).min(1, 'At least one line item required'),

  /** Tax breakdown (optional, for multi-tax jurisdictions) */
  taxBreakdown: z.array(TaxBreakdownSchema).optional(),

  /** Payment terms (optional) */
  paymentTerms: PaymentTermsSchema.optional(),

  /** Overall extraction confidence (0-100) */
  confidence: z.number().int().min(0).max(100),

  /** Per-field confidence scores (optional) */
  fieldConfidence: z
    .object({
      vendor: z.number().int().min(0).max(100).optional(),
      date: z.number().int().min(0).max(100).optional(),
      totalAmount: z.number().int().min(0).max(100).optional(),
      lineItems: z.number().int().min(0).max(100).optional(),
    })
    .optional(),

  /** Model version used for extraction (for audit trail) */
  modelVersion: z.string(),

  /** Raw OCR text (for secondary validation) */
  ocrText: z.string().optional(),
});

export type BillExtraction = z.infer<typeof BillExtractionSchema>;

/**
 * Validate bill extraction totals (business rule).
 *
 * Ensures: subtotal + taxAmount = totalAmount
 */
export function validateBillTotals(bill: BillExtraction): void {
  const calculatedTotal = bill.subtotal + bill.taxAmount;

  if (calculatedTotal !== bill.totalAmount) {
    throw new Error(
      `Bill total mismatch: subtotal (${bill.subtotal}) + tax (${bill.taxAmount}) = ${calculatedTotal}, but totalAmount is ${bill.totalAmount}`
    );
  }

  // Validate line items sum to subtotal
  const lineItemsTotal = bill.lineItems.reduce((sum, line) => sum + line.amount, 0);

  if (lineItemsTotal !== bill.subtotal) {
    throw new Error(
      `Bill line items total (${lineItemsTotal}) does not match subtotal (${bill.subtotal})`
    );
  }
}
