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
}).refine(
  (line) => (line.debitAmount > 0) !== (line.creditAmount > 0),
  { message: 'Each line must have either a debit or credit amount, not both and not neither' }
);

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
});

export type PostTransactionInput = z.infer<typeof PostTransactionSchema>;

// ============================================================================
// Bulk Post Transactions
// ============================================================================

export const PostBulkTransactionsSchema = z.object({
  transactionIds: z.array(z.string().cuid()).min(1).max(50, 'Maximum 50 transactions per batch'),
  glAccountId: z.string().cuid('Invalid GL account ID'),
});

export type PostBulkTransactionsInput = z.infer<typeof PostBulkTransactionsSchema>;
