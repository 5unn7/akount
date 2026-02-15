import type { FastifyInstance, FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';

/**
 * Rate Limiting Configuration
 *
 * Protects API from abuse and DDoS attacks.
 * Required for SOC 2 security controls.
 */

/**
 * Global rate limit configuration.
 * Applied to all routes by default.
 */
export const GLOBAL_RATE_LIMIT = {
  max: 100, // requests
  timeWindow: '1 minute',
};

/**
 * Strict rate limit for sensitive operations.
 * Applied to login, password reset, etc.
 */
export const STRICT_RATE_LIMIT = {
  max: 10,
  timeWindow: '1 minute',
};

/**
 * Burst rate limit for high-throughput operations.
 * Applied to data import, bulk operations.
 */
export const BURST_RATE_LIMIT = {
  max: 500,
  timeWindow: '1 minute',
};

/**
 * Stats rate limit for expensive aggregation queries.
 * Applied to stats endpoints (invoice/bill stats, AR/AP aging).
 * SECURITY FIX M-5: Prevent DoS via expensive stats queries.
 */
export const STATS_RATE_LIMIT = {
  max: 50,
  timeWindow: '1 minute',
};

/**
 * Register global rate limiting middleware.
 *
 * @example
 * ```typescript
 * await fastify.register(rateLimitMiddleware);
 * ```
 */
export async function rateLimitMiddleware(
  fastify: FastifyInstance
): Promise<void> {
  await fastify.register(rateLimit, {
    global: true,
    max: GLOBAL_RATE_LIMIT.max,
    timeWindow: GLOBAL_RATE_LIMIT.timeWindow,

    // Rate limit by tenant + user for authenticated requests
    // Falls back to IP for unauthenticated requests
    keyGenerator: (request: FastifyRequest) => {
      if (request.tenantId && request.userId) {
        return `${request.tenantId}:${request.userId}`;
      }
      // Fallback to IP for unauthenticated requests
      return request.ip;
    },

    // Custom error response
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please slow down',
          details: {
            limit: context.max,
            remaining: 0,
            resetTime: context.after,
          },
        },
      };
    },

    // Add rate limit headers to response
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
}

/**
 * Route-specific rate limit configuration.
 * Use this for routes that need different limits than global.
 *
 * @example
 * ```typescript
 * fastify.post('/login', {
 *   config: {
 *     rateLimit: strictRateLimitConfig(),
 *   },
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function strictRateLimitConfig() {
  return {
    max: STRICT_RATE_LIMIT.max,
    timeWindow: STRICT_RATE_LIMIT.timeWindow,
  };
}

/**
 * High-throughput rate limit for bulk operations.
 *
 * @example
 * ```typescript
 * fastify.post('/import/transactions', {
 *   config: {
 *     rateLimit: burstRateLimitConfig(),
 *   },
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function burstRateLimitConfig() {
  return {
    max: BURST_RATE_LIMIT.max,
    timeWindow: BURST_RATE_LIMIT.timeWindow,
  };
}

/**
 * Disable rate limit for specific routes (use with caution).
 * Only for internal health checks, metrics, etc.
 *
 * @example
 * ```typescript
 * fastify.get('/health', {
 *   config: {
 *     rateLimit: noRateLimitConfig(),
 *   },
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function noRateLimitConfig() {
  return {
    max: 1000000, // Effectively unlimited
    timeWindow: '1 minute',
  };
}

/**
 * Stats rate limit for expensive aggregation queries.
 * Use for endpoints that perform complex database aggregations.
 *
 * @example
 * ```typescript
 * fastify.get('/stats', {
 *   config: {
 *     rateLimit: statsRateLimitConfig(),
 *   },
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function statsRateLimitConfig() {
  return {
    max: STATS_RATE_LIMIT.max,
    timeWindow: STATS_RATE_LIMIT.timeWindow,
  };
}
