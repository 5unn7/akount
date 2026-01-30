import { z } from 'zod';

/**
 * Import validation schemas for bank statement import feature
 */

// Supported file formats
export const sourceTypeSchema = z.enum(['CSV', 'PDF', 'OFX', 'XLSX']);

// External account identifiers (for future bank connection matching)
export const externalAccountDataSchema = z.object({
  externalAccountId: z.string().optional(), // Last 4 digits or masked account number
  institutionName: z.string().optional(),
  accountType: z.enum(['checking', 'savings', 'credit', 'investment', 'loan', 'other']).optional(),
  currency: z.string().length(3).optional(), // ISO 4217 currency code
  iban: z.string().optional(),
  routingNumber: z.string().optional(),
});

export type ExternalAccountData = z.infer<typeof externalAccountDataSchema>;

// Parsed transaction structure
export const parsedTransactionSchema = z.object({
  tempId: z.string(), // Temporary ID for client-side tracking
  date: z.string(), // ISO date string
  description: z.string(),
  amount: z.number().int(), // In cents
  balance: z.number().int().optional(), // In cents (if available)
  category: z.object({
    id: z.string(),
    name: z.string(),
    confidence: z.number().min(0).max(100),
  }).optional(),
  isDuplicate: z.boolean(),
  duplicateConfidence: z.number().min(0).max(100).optional(),
});

export type ParsedTransaction = z.infer<typeof parsedTransactionSchema>;

// Column mappings for CSV/XLSX
export const columnMappingsSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.string(), // Can be single column or "debit|credit" for two columns
  balance: z.string().optional(),
});

export type ColumnMappings = z.infer<typeof columnMappingsSchema>;

// Upload request body
export const uploadRequestSchema = z.object({
  accountId: z.string().uuid(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
});

// Upload response
export const uploadResponseSchema = z.object({
  parseId: z.string(),
  accountId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  sourceType: sourceTypeSchema,

  // For CSV/XLSX only
  columns: z.array(z.string()).optional(),
  columnMappings: columnMappingsSchema.optional(),
  preview: z.object({
    rows: z.array(z.record(z.string())),
  }).optional(),

  // For all formats
  transactions: z.array(parsedTransactionSchema),

  summary: z.object({
    total: z.number(),
    duplicates: z.number(),
    categorized: z.number(),
    needsReview: z.number(),
  }),
});

// Update column mappings request
export const updateMappingRequestSchema = z.object({
  parseId: z.string(),
  columnMappings: columnMappingsSchema,
});

// Update transactions request
export const updateTransactionsRequestSchema = z.object({
  parseId: z.string(),
  updates: z.array(z.object({
    tempId: z.string(),
    categoryId: z.string().uuid().nullable().optional(),
    description: z.string().optional(),
    exclude: z.boolean().optional(),
  })),
});

// Confirm import request
export const confirmImportRequestSchema = z.object({
  parseId: z.string(),
  skipDuplicates: z.boolean().default(true),
});

// Import batch metadata structure
export const importBatchMetadataSchema = z.object({
  columnMappings: columnMappingsSchema.optional(),
  externalAccountData: externalAccountDataSchema.optional(),
  sourceFileName: z.string(),
});

export type ImportBatchMetadata = z.infer<typeof importBatchMetadataSchema>;
