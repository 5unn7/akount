import type { FastifyReply } from 'fastify';

/**
 * Business Domain Error Handler (DRY-22)
 *
 * Centralized error handling for business domain routes.
 * Eliminates duplication across bill-scan, invoice-scan, and other business routes.
 */

/**
 * Handle business domain errors with consistent format.
 *
 * @param error - Error object
 * @param reply - Fastify reply
 * @returns Formatted error response
 */
export function handleBusinessError(error: unknown, reply: FastifyReply) {
  if (error instanceof Error) {
    // Known error with message
    return reply.status(500).send({
      error: error.message,
    });
  }

  // Unknown error
  return reply.status(500).send({
    error: 'Unknown error occurred',
  });
}
