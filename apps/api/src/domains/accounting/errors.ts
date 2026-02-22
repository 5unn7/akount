/**
 * Accounting Domain Error Types
 *
 * Typed error classes for the accounting engine.
 * Each error code maps to a specific HTTP status and message pattern.
 */

export type AccountingErrorCode =
  | 'UNBALANCED_ENTRY'
  | 'ALREADY_POSTED'
  | 'ALREADY_VOIDED'
  | 'IMMUTABLE_POSTED_ENTRY'
  | 'ENTITY_NOT_FOUND'
  | 'GL_ACCOUNT_NOT_FOUND'
  | 'GL_ACCOUNT_INACTIVE'
  | 'DUPLICATE_ACCOUNT_CODE'
  | 'MISSING_FX_RATE'
  | 'SPLIT_AMOUNT_MISMATCH'
  | 'CROSS_ENTITY_REFERENCE'
  | 'FISCAL_PERIOD_CLOSED'
  | 'SEPARATION_OF_DUTIES'
  | 'BANK_ACCOUNT_NOT_MAPPED'
  | 'MULTI_CURRENCY_CONSOLIDATION_NOT_SUPPORTED'
  | 'AMOUNT_OVERFLOW'
  | 'NO_ENTITIES_FOUND'
  | 'PDF_TOO_LARGE'
  | 'PDF_TIMEOUT'
  | 'EXPORT_FAILED'
  | 'ACCOUNT_NOT_FOUND'
  | 'GL_ACCOUNT_NOT_LINKED'
  | 'CROSS_ENTITY_TRANSFER'
  | 'CURRENCY_MISMATCH'
  | 'MISSING_EXCHANGE_RATE'
  | 'INSUFFICIENT_BALANCE'
  | 'TRANSFER_NOT_FOUND'
  | 'INVALID_SOURCE_DOCUMENT'
  | 'TAX_RATE_NOT_FOUND'
  | 'DUPLICATE_TAX_CODE'
  | 'INVALID_DATE_RANGE';

export class AccountingError extends Error {
  constructor(
    message: string,
    public readonly code: AccountingErrorCode,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AccountingError';
  }
}
