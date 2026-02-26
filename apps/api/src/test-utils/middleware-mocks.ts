/**
 * Centralized Middleware Mocks
 *
 * Replaces the 4-block middleware mock pattern repeated in every route test.
 * Provides a single function to set up all standard middleware mocks.
 *
 * Usage:
 *   import { setupStandardMiddlewareMocks } from '../../test-utils/middleware-mocks';
 *
 *   setupStandardMiddlewareMocks(); // Uses defaults
 *   setupStandardMiddlewareMocks({ tenantId: 'custom', role: 'ADMIN' }); // Custom
 */

import { vi } from 'vitest';

interface MiddlewareMockOptions {
  /** Tenant ID set on request (default: 'tenant-abc-123') */
  tenantId?: string;
  /** User ID set on request (default: 'test-user-id') */
  userId?: string;
  /** Tenant role set on request (default: 'OWNER') */
  role?: string;
  /** Whether auth middleware checks Bearer header (default: true) */
  requireBearerToken?: boolean;
  /** Path prefix depth — '../../../' for domains, '../../../../' for sub-routes */
  pathPrefix?: string;
}

/**
 * Sets up all standard middleware mocks for route tests.
 *
 * This replaces the 4 separate vi.mock() blocks (auth, tenant, withPermission, validation)
 * that are copy-pasted into every route test file.
 *
 * IMPORTANT: Call at module scope (vi.mock is hoisted by Vitest).
 *
 * @param options - Customize tenant, user, role, or auth behavior
 */
export function setupStandardMiddlewareMocks(options: MiddlewareMockOptions = {}): void {
  const {
    tenantId = 'tenant-abc-123',
    userId = 'test-user-id',
    role = 'OWNER',
    requireBearerToken = true,
    pathPrefix = '../../../',
  } = options;

  // Auth middleware
  vi.mock(`${pathPrefix}middleware/auth`, () => ({
    authMiddleware: vi.fn(async (request: Record<string, unknown>, reply: Record<string, unknown>) => {
      if (requireBearerToken) {
        const authHeader = (request.headers as Record<string, string>)?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          const sendFn = (reply as { status: (code: number) => { send: (body: unknown) => unknown } }).status(401);
          return sendFn.send({ error: 'Unauthorized', message: 'Missing Authorization header' });
        }
      }
      request.userId = userId;
    }),
  }));

  // Tenant middleware
  vi.mock(`${pathPrefix}middleware/tenant`, () => ({
    tenantMiddleware: vi.fn(async (request: Record<string, unknown>) => {
      request.tenantId = tenantId;
      request.tenantRole = role;
    }),
  }));

  // Permission middleware (pass-through)
  vi.mock(`${pathPrefix}middleware/withPermission`, () => ({
    withPermission: vi.fn(() => ({
      preHandler: async () => {},
    })),
  }));

  // Validation middleware (pass-through)
  vi.mock(`${pathPrefix}middleware/validation`, () => ({
    validateBody: vi.fn(() => async () => {}),
    validateParams: vi.fn(() => async () => {}),
    validateQuery: vi.fn(() => async () => {}),
  }));

  // Rate limit (pass-through)
  vi.mock(`${pathPrefix}middleware/rate-limit`, () => ({
    aiChatRateLimitConfig: vi.fn(() => ({})),
    aiRateLimitConfig: vi.fn(() => ({})),
    globalRateLimitConfig: vi.fn(() => ({})),
    strictRateLimitConfig: vi.fn(() => ({})),
    burstRateLimitConfig: vi.fn(() => ({})),
    statsRateLimitConfig: vi.fn(() => ({})),
  }));
}

/**
 * Standard test headers with Bearer token for authenticated requests.
 */
export const AUTH_HEADERS = {
  authorization: 'Bearer test-token',
} as const;

/**
 * Standard test headers without Bearer token (for 401 tests).
 */
export const NO_AUTH_HEADERS = {} as const;
