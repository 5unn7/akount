/**
 * Centralized Middleware Mock Helpers
 *
 * NOTE: vi.mock() inside imported functions is NOT hoisted by Vitest.
 * Middleware mocks must be called directly in each test file because
 * the import paths vary by file location (../../../middleware vs ../../../../middleware).
 *
 * This module provides:
 * - AUTH_HEADERS / NO_AUTH_HEADERS constants
 * - Documentation of the standard middleware mock pattern
 *
 * ## Standard Middleware Mock Pattern (copy into route test files)
 *
 * ```typescript
 * // Adjust '../../../' based on file depth relative to middleware/
 * vi.mock('../../../middleware/auth', () => ({
 *   authMiddleware: vi.fn(async (request: Record<string, unknown>) => {
 *     const authHeader = (request.headers as Record<string, string>)?.authorization;
 *     if (!authHeader?.startsWith('Bearer ')) {
 *       throw { statusCode: 401, message: 'Unauthorized' };
 *     }
 *     request.userId = 'test-user-id';
 *   }),
 * }));
 *
 * vi.mock('../../../middleware/tenant', () => ({
 *   tenantMiddleware: vi.fn(async (request: Record<string, unknown>) => {
 *     request.tenantId = 'tenant-abc-123';
 *     request.tenantRole = 'OWNER';
 *   }),
 * }));
 *
 * vi.mock('../../../middleware/withPermission', () => ({
 *   withPermission: vi.fn(() => ({ preHandler: async () => {} })),
 * }));
 *
 * vi.mock('../../../middleware/validation', () => ({
 *   validateBody: vi.fn(() => async () => {}),
 *   validateParams: vi.fn(() => async () => {}),
 *   validateQuery: vi.fn(() => async () => {}),
 * }));
 * ```
 */

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

/**
 * Default test identity constants.
 */
export const TEST_AUTH = {
  tenantId: 'tenant-abc-123',
  userId: 'test-user-id',
  role: 'OWNER',
} as const;
