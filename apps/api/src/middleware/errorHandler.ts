import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { collectError } from './error-collector'

/**
 * Global error handler for the API
 * Handles Zod validation errors, Fastify errors, and generic errors
 */
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Collect error to runtime log (dev-only)
  collectError(error, request, reply)

  // Log the error
  request.log.error({
    error,
    url: request.url,
    method: request.method,
    params: request.params,
    query: request.query,
  }, 'Error occurred')

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      }),
    })
  }

  // Handle Fastify errors
  if ('statusCode' in error && error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
    })
  }

  // Handle generic errors (500)
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
      ? error.message
      : 'An unexpected error occurred',
  })
}
