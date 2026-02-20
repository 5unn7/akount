/**
 * Vitest Global Test Setup
 *
 * This file is loaded before all tests run.
 * Use it for global setup/teardown and common test utilities.
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables BEFORE any module imports env.ts
// These must be set at the top level (not in beforeAll) because
// env.ts validates at import time, not at runtime
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/akount_test';
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Mock environment variables for tests
beforeAll(() => {
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
