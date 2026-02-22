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
  | 'INVALID_DATE_RANGE'
  | 'CALENDAR_NOT_FOUND'
  | 'DUPLICATE_CALENDAR_YEAR'
  | 'PERIOD_NOT_FOUND'
  | 'PERIOD_ALREADY_LOCKED'
  | 'PERIOD_ALREADY_CLOSED'
  | 'PERIOD_NOT_LOCKED'
  | 'PERIOD_NOT_CLOSED'
  | 'CANNOT_LOCK_CLOSED_PERIOD'
  | 'PREVIOUS_PERIODS_NOT_CLOSED'
  | 'ASSET_NOT_FOUND'
  | 'ASSET_DISPOSED'
  | 'ASSET_ALREADY_DISPOSED';

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

/**
 * Map AccountingError to HTTP response. Re-throw unknown errors.
 * Shared by all accounting route files.
 */
export function handleAccountingError(error: unknown, reply: import('fastify').FastifyReply) {
  if (error instanceof AccountingError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
    });
  }
  throw error;
}
