import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import { env } from '../lib/env';

/**
 * CSRF Protection Middleware (SEC-40)
 *
 * Protects all state-changing endpoints (POST, PUT, PATCH, DELETE) from
 * Cross-Site Request Forgery attacks using the Double Submit Cookie pattern.
 *
 * ## How it works:
 * 1. Server sets _csrf cookie on first request or via /api/csrf-token endpoint
 * 2. Client reads cookie value and sends it in X-CSRF-Token header
 * 3. Server validates that cookie value matches header value
 * 4. If mismatch or missing, request is rejected with 403
 *
 * ## Integration:
 * - Cookie-based: Uses @fastify/cookie (httpOnly: false so client can read)
 * - Stateless: No server-side session storage required
 * - SameSite: 'strict' prevents cross-site sends
 *
 * ## Excluded endpoints:
 * - GET requests (safe methods)
 * - Health check endpoints
 * - /api/csrf-token (token generation endpoint)
 *
 * @see https://owasp.org/www-community/attacks/csrf
 * @see https://github.com/fastify/csrf-protection
 */
export async function csrfProtection(fastify: FastifyInstance): Promise<void> {
  // Register cookie support (required for CSRF protection)
  await fastify.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || env.CLERK_SECRET_KEY, // Fallback to Clerk secret
  });

  // Register CSRF protection
  await fastify.register(fastifyCsrf, {
    // Use double submit cookie pattern (stateless)
    sessionPlugin: '@fastify/cookie',
    cookieOpts: {
      httpOnly: false, // Client needs to read cookie for header
      secure: env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // Prevent cross-site sends
      signed: true, // Sign cookie to prevent tampering
    },
    // Custom getter for CSRF token from header
    getToken: (request) => {
      // Check X-CSRF-Token header (standard)
      const headerToken = request.headers['x-csrf-token'];
      if (headerToken && typeof headerToken === 'string') {
        return headerToken;
      }
      // Fallback to query param for GET requests (legacy support)
      return request.query._csrf as string | undefined;
    },
  });

  // Add hook to enforce CSRF on state-changing methods
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return;
    }

    // Skip CSRF check for excluded paths
    const excludedPaths = [
      '/', // Root health check
      '/health', // Health check
      '/api/csrf-token', // Token generation endpoint
    ];

    if (excludedPaths.some((path) => request.url.startsWith(path))) {
      return;
    }

    // Enforce CSRF token validation for POST/PUT/PATCH/DELETE
    // Manually call the CSRF validation method added by @fastify/csrf-protection
    try {
      await (request as any).csrfProtection();
    } catch (error) {
      // CSRF validation failed - return 403 Forbidden
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'CSRF token validation failed',
        statusCode: 403,
      });
    }
  });
}

/**
 * Get CSRF token for a request.
 * Use this in the /api/csrf-token endpoint to generate tokens for clients.
 *
 * @example
 * ```typescript
 * fastify.get('/api/csrf-token', async (request, reply) => {
 *   const token = getCsrfToken(request);
 *   return { token };
 * });
 * ```
 */
export function getCsrfToken(request: FastifyRequest & { generateCsrf: () => string }): string {
  // @fastify/csrf-protection adds generateCsrf method to request
  return request.generateCsrf();
}
