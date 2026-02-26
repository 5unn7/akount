/**
 * AI Domain Error Types
 *
 * Typed error classes for AI services (categorization, JE suggestions, action feed).
 * Each error code maps to a specific HTTP status and message pattern.
 */

export type AIErrorCode =
  | 'ACTION_NOT_FOUND'
  | 'ACTION_NOT_PENDING'
  | 'ACTION_EXPIRED'
  | 'ENTITY_NOT_FOUND'
  | 'INVALID_ACTION_TYPE'
  | 'BATCH_PARTIAL_FAILURE'
  | 'PERIOD_NOT_FOUND'
  | 'PERIOD_NOT_READY'
  | 'PERIOD_INVALID_STATUS';

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Map AIError to HTTP response. Re-throw unknown errors.
 * Shared by all AI route files.
 */
export function handleAIError(error: unknown, reply: import('fastify').FastifyReply) {
  if (error instanceof AIError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
    });
  }
  throw error;
}
