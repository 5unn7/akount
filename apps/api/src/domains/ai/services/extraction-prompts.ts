import { createSecureSystemPrompt } from '../../../lib/prompt-defense';

/**
 * Extraction Prompt Builder (P1-21)
 *
 * Centralized prompt templates for document extraction.
 * Extracted from DocumentExtractionService to reduce God Service pattern.
 *
 * @module extraction-prompts
 */

export const buildBillExtractionPrompt = (): string => {
  return createSecureSystemPrompt(`
Extract structured bill/receipt data from this image.

Required fields:
- vendor: Business name (string)
- date: Transaction date in YYYY-MM-DD format
- currency: 3-letter ISO code (USD, CAD, EUR, etc.)
- subtotal: Pre-tax amount in integer cents (e.g., 1550 for $15.50)
- taxAmount: Total tax in integer cents
- totalAmount: Grand total in integer cents (subtotal + tax)
- lineItems: Array of items with description, quantity, unitPrice (cents), amount (cents)
- confidence: Your confidence level 0-100

Optional fields:
- billNumber: Receipt/bill number if visible
- taxBreakdown: Itemized taxes if multiple rates
- paymentTerms: Payment terms if present

Return ONLY valid JSON. All amounts MUST be integer cents, never decimals.
  `.trim());
};

export const buildInvoiceExtractionPrompt = (): string => {
  return createSecureSystemPrompt(`
Extract structured invoice data from this image.

Required fields:
- clientName: Customer/client name (string)
- date: Invoice date in YYYY-MM-DD format
- currency: 3-letter ISO code (USD, CAD, EUR, etc.)
- subtotal: Pre-tax amount in integer cents
- taxAmount: Total tax in integer cents
- totalAmount: Grand total in integer cents (subtotal + tax)
- lineItems: Array of services/products with description, quantity, unitPrice (cents), amount (cents)
- confidence: Your confidence level 0-100

Optional fields:
- invoiceNumber: Invoice number if visible
- paymentTerms: Payment terms (NET 30, due date, discount terms)
- taxBreakdown: Itemized taxes if multiple rates
- clientContact: Client email, phone, address if visible

Return ONLY valid JSON. All amounts MUST be integer cents, never decimals.
  `.trim());
};

export const buildStatementExtractionPrompt = (): string => {
  return createSecureSystemPrompt(`
Extract all transactions from this bank statement PDF.

Required fields per transaction:
- date: ISO 8601 format (YYYY-MM-DD)
- description: Merchant or payee name
- amount: Integer cents (always positive number, regardless of debit/credit)
- type: Either "DEBIT" or "CREDIT"
- balance: Running balance after this transaction (integer cents, optional)

Account metadata:
- institutionName: Bank name (e.g., "TD Canada Trust", "RBC Royal Bank")
- accountNumber: Last 4 digits only (e.g., "****1234")
- accountType: "CHECKING", "SAVINGS", or "CREDIT_CARD"
- currency: ISO currency code (e.g., "CAD", "USD")
- periodStart: Statement start date (YYYY-MM-DD)
- periodEnd: Statement end date (YYYY-MM-DD)
- openingBalance: Balance at start of period (integer cents)
- closingBalance: Balance at end of period (integer cents)

CRITICAL RULES:
1. Amounts MUST be integers (cents). Convert $10.50 → 1050
2. Amounts are ALWAYS positive. Use "type" field to indicate DEBIT or CREDIT.
3. Dates MUST be YYYY-MM-DD format.
4. Extract ALL transactions visible in the statement.

Return JSON matching BankStatementExtractionSchema.
  `.trim());
};
