import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Security Headers Middleware
 *
 * Applies essential security headers to all API responses.
 * Required for SOC 2 compliance and OWASP best practices.
 *
 * @example
 * ```typescript
 * await fastify.register(securityHeaders);
 * ```
 */
export async function securityHeaders(fastify: FastifyInstance): Promise<void> {
  fastify.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Prevent clickjacking - API should never be embedded
      reply.header('X-Frame-Options', 'DENY');

      // Prevent MIME-type sniffing attacks
      reply.header('X-Content-Type-Options', 'nosniff');

      // XSS protection for legacy browsers
      reply.header('X-XSS-Protection', '1; mode=block');

      // Control referrer information leakage
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Disable unnecessary browser features
      reply.header(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()'
      );

      // Prevent caching of sensitive API responses
      // Individual routes can override if caching is safe
      if (!reply.getHeader('Cache-Control')) {
        reply.header(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, private'
        );
      }

      // CORS headers are handled separately by @fastify/cors
    }
  );
}

/**
 * Additional strict headers for sensitive routes.
 * Apply to routes handling financial data or PII.
 *
 * @example
 * ```typescript
 * fastify.get('/sensitive-data', {
 *   preHandler: strictSecurityHeaders,
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export async function strictSecurityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Force no caching
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');

  // Prevent download of response as file
  reply.header('X-Download-Options', 'noopen');

  // Mark response as containing sensitive data
  reply.header('X-Sensitive-Data', 'true');
}

/**
 * HSTS header for production environments.
 * Only apply in production with valid TLS.
 */
export function getHSTSHeader(): string {
  // Max-age of 1 year, include subdomains, preload ready
  return 'max-age=31536000; includeSubDomains; preload';
}
