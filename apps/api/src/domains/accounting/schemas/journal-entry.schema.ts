import { z } from 'zod';
import { JournalEntrySourceType, JournalEntryStatus } from '@akount/db';

// ============================================================================
// Params
// ============================================================================

export const JournalEntryParamsSchema = z.object({
  id: z.string().cuid('Invalid journal entry ID'),
});

export type JournalEntryParams = z.infer<typeof JournalEntryParamsSchema>;

// ============================================================================
// Journal Line Input (shared by Create)
// ============================================================================

export const JournalLineInputSchema = z.object({
  glAccountId: z.string().cuid('Invalid GL account ID'),
  debitAmount: z.number().int('Must be integer cents').nonnegative('Cannot be negative'),
  creditAmount: z.number().int('Must be integer cents').nonnegative('Cannot be negative'),
  memo: z.string().max(500).optional(),
  // Multi-currency fields (optional — only set when line currency differs from entity base)
  currency: z.string().length(3).regex(/^[A-Z]{3}$/, 'Must be 3-letter ISO currency code').optional(),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
  baseCurrencyDebit: z.number().int('Must be integer cents').nonnegative().optional(),
  baseCurrencyCredit: z.number().int('Must be integer cents').nonnegative().optional(),
}).refine(
  (line) => (line.debitAmount > 0) !== (line.creditAmount > 0),
  { message: 'Each line must have either a debit or credit amount, not both and not neither' }
).superRefine((line, ctx) => {
  // If currency is provided, exchangeRate and baseCurrency amounts are required
  if (line.currency) {
    if (!line.exchangeRate) {
      ctx.addIssue({ code: 'custom', message: 'Exchange rate required when currency is set', path: ['exchangeRate'] });
    }
    if (line.baseCurrencyDebit === undefined && line.debitAmount > 0) {
      ctx.addIssue({ code: 'custom', message: 'Base currency debit required for foreign currency line', path: ['baseCurrencyDebit'] });
    }
    if (line.baseCurrencyCredit === undefined && line.creditAmount > 0) {
      ctx.addIssue({ code: 'custom', message: 'Base currency credit required for foreign currency line', path: ['baseCurrencyCredit'] });
    }
  }
});

export type JournalLineInput = z.infer<typeof JournalLineInputSchema>;

// ============================================================================
// Create Journal Entry
// ============================================================================

export const CreateJournalEntrySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  date: z.string().datetime('Date must be ISO 8601'),
  memo: z.string().min(1, 'Memo is required').max(1000),
  lines: z.array(JournalLineInputSchema).min(2, 'Must have at least 2 lines'),
  sourceType: z.nativeEnum(JournalEntrySourceType).optional(),
  sourceId: z.string().cuid().optional(),
  sourceDocument: z.record(z.unknown())
    .refine(val => JSON.stringify(val).length < 10_000, 'Source document too large')
    .optional(),
}).refine(
  (entry) => {
    const totalDebits = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredits = entry.lines.reduce((s, l) => s + l.creditAmount, 0);
    return totalDebits === totalCredits;
  },
  { message: 'Journal entry must balance: total debits must equal total credits', path: ['lines'] }
).refine(
  (entry) => {
    // If any line has multi-currency, validate base currency balance too
    const hasMultiCurrency = entry.lines.some(l => l.currency);
    if (!hasMultiCurrency) return true;

    const baseTotalDebits = entry.lines.reduce((s, l) => s + (l.baseCurrencyDebit ?? l.debitAmount), 0);
    const baseTotalCredits = entry.lines.reduce((s, l) => s + (l.baseCurrencyCredit ?? l.creditAmount), 0);
    return baseTotalDebits === baseTotalCredits;
  },
  { message: 'Journal entry must balance in base currency: total base debits must equal total base credits', path: ['lines'] }
);

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;

// ============================================================================
// List Journal Entries (query params)
// ============================================================================

export const ListJournalEntriesSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.nativeEnum(JournalEntryStatus).optional(),
  sourceType: z.nativeEnum(JournalEntrySourceType).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListJournalEntriesQuery = z.infer<typeof ListJournalEntriesSchema>;

// ============================================================================
// Post Transaction (bank transaction → journal entry)
// ============================================================================

export const PostTransactionSchema = z.object({
  transactionId: z.string().cuid('Invalid transaction ID'),
  glAccountId: z.string().cuid('Invalid GL account ID'),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
});

export type PostTransactionInput = z.infer<typeof PostTransactionSchema>;

// ============================================================================
// Bulk Post Transactions
// ============================================================================

export const PostBulkTransactionsSchema = z.object({
  transactionIds: z.array(z.string().cuid()).min(1).max(50, 'Maximum 50 transactions per batch'),
  glAccountId: z.string().cuid('Invalid GL account ID'),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
});

export type PostBulkTransactionsInput = z.infer<typeof PostBulkTransactionsSchema>;

// ============================================================================
// Split Transaction Posting (one transaction → multiple GL lines)
// ============================================================================

export const SplitLineSchema = z.object({
  glAccountId: z.string().cuid('Invalid GL account ID'),
  amount: z.number().int('Must be integer cents').positive('Must be positive'),
  memo: z.string().max(500).optional(),
});

export const PostSplitTransactionSchema = z.object({
  transactionId: z.string().cuid('Invalid transaction ID'),
  splits: z.array(SplitLineSchema).min(2, 'Must have at least 2 splits'),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
});

export type SplitLine = z.infer<typeof SplitLineSchema>;
export type PostSplitTransactionInput = z.infer<typeof PostSplitTransactionSchema>;

// ============================================================================
// Batch Approve Journal Entries
// ============================================================================

export const BatchApproveEntriesSchema = z.object({
  entryIds: z.array(z.string().cuid('Invalid journal entry ID')).min(1).max(100, 'Maximum 100 entries per batch'),
});

export type BatchApproveEntriesInput = z.infer<typeof BatchApproveEntriesSchema>;
