import pino from 'pino';

/**
 * Shared structured logger for services that don't have access to Fastify's request logger.
 * Uses pino (same as Fastify) for consistent log format across the API.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});
