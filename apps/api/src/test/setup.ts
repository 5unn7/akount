/**
 * Vitest Global Test Setup
 *
 * This file is loaded before all tests run.
 * Use it for global setup/teardown and common test utilities.
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';

  // Mock Clerk authentication for tests that don't need real auth
  vi.mock('@clerk/backend', () => ({
    verifyToken: vi.fn().mockResolvedValue({
      sub: 'test-user-id',
    }),
  }));
});

afterAll(() => {
  // Cleanup after all tests
  vi.clearAllMocks();
});

// Add custom matchers or global test utilities here
