import { z } from 'zod';

/**
 * Bank Statement Extraction Schema (DEV-242)
 *
 * Defines the structure for bank statement data extracted via Mistral vision.
 * Used by DocumentExtractionService for PDF statement parsing.
 *
 * @module bank-statement-extraction
 */

/**
 * Transaction type enum
 */
export const TransactionTypeSchema = z.enum(['DEBIT', 'CREDIT']);

/**
 * Individual transaction extracted from bank statement
 */
export const BankStatementTransactionSchema = z.object({
  /** Transaction date in YYYY-MM-DD format */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  /** Transaction description/merchant name */
  description: z.string().min(1),

  /** Transaction amount in integer cents (always positive) */
  amount: z.number().int().positive(),

  /** Transaction type (DEBIT = money out, CREDIT = money in) */
  type: z.enum(['DEBIT', 'CREDIT']),

  /** Running balance after transaction (integer cents, optional) */
  balance: z.number().int().optional(),

  /** Transaction reference/check number (optional) */
  reference: z.string().optional(),

  /** Transaction category/type from statement (optional) */
  category: z.string().optional(),
});

export type BankStatementTransaction = z.infer<typeof BankStatementTransactionSchema>;

/**
 * Account metadata extracted from statement
 */
export const StatementAccountInfoSchema = z.object({
  /** Institution name (e.g., "TD Bank", "RBC", "CIBC") */
  institutionName: z.string().optional(),

  /** Account number (masked, last 4 digits) */
  accountNumber: z.string().optional(),

  /** Account type (checking, savings, credit) */
  accountType: z.enum(['checking', 'savings', 'credit', 'investment', 'loan', 'other']).optional(),

  /** Account holder name */
  accountHolderName: z.string().optional(),

  /** Statement period start date (YYYY-MM-DD) */
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  /** Statement period end date (YYYY-MM-DD) */
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  /** Currency code (ISO 4217) */
  currency: z.string().length(3).optional(),

  /** Opening balance (integer cents) */
  openingBalance: z.number().int().optional(),

  /** Closing balance (integer cents) */
  closingBalance: z.number().int().optional(),
});

export type StatementAccountInfo = z.infer<typeof StatementAccountInfoSchema>;

/**
 * Complete bank statement extraction result
 */
export const BankStatementExtractionSchema = z.object({
  /** Array of extracted transactions */
  transactions: z.array(BankStatementTransactionSchema).min(1),

  /** Account metadata from statement */
  accountInfo: StatementAccountInfoSchema,

  /** Confidence score 0-100 */
  confidence: z.number().int().min(0).max(100),

  /** Model version used for extraction */
  modelVersion: z.string().default('pixtral-large-latest'),

  /** Raw OCR text (for debugging and fallback validation) */
  ocrText: z.string().optional(),
});

export type BankStatementExtraction = z.infer<typeof BankStatementExtractionSchema>;

/**
 * Validate bank statement totals (business rule validation)
 *
 * Ensures:
 * - Opening balance + net change = closing balance (if both present)
 * - All amounts are integer cents (no decimals)
 * - At least one transaction exists
 *
 * @throws Error if validation fails
 */
export function validateStatementBalances(statement: BankStatementExtraction): void {
  const { transactions, accountInfo } = statement;

  // Ensure all amounts are integers (should be enforced by schema, but double-check)
  for (const txn of transactions) {
    if (!Number.isInteger(txn.amount)) {
      throw new Error(
        `Transaction amount must be integer cents, got ${txn.amount} for "${txn.description}"`
      );
    }
    if (txn.balance !== undefined && !Number.isInteger(txn.balance)) {
      throw new Error(
        `Transaction balance must be integer cents, got ${txn.balance} for "${txn.description}"`
      );
    }
  }

  // Validate balance reconciliation (if opening/closing balances present)
  if (accountInfo.openingBalance !== undefined && accountInfo.closingBalance !== undefined) {
    // Calculate net change from transactions
    let netChange = 0;
    for (const txn of transactions) {
      if (txn.type === 'CREDIT') {
        netChange += txn.amount;
      } else {
        netChange -= txn.amount;
      }
    }

    const expectedClosing = accountInfo.openingBalance + netChange;
    const actualClosing = accountInfo.closingBalance;

    // Allow 1 cent rounding difference (banks sometimes round differently)
    const difference = Math.abs(expectedClosing - actualClosing);
    if (difference > 1) {
      throw new Error(
        `Statement balance mismatch: Opening (${accountInfo.openingBalance}) + Net Change (${netChange}) = ${expectedClosing}, but Closing Balance is ${actualClosing} (diff: ${difference} cents)`
      );
    }
  }

  // Ensure at least one transaction
  if (transactions.length === 0) {
    throw new Error('Bank statement must contain at least one transaction');
  }
}
