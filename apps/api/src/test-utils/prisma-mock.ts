/**
 * Centralized Prisma Mock Factory
 *
 * Provides type-safe Prisma mocking that eliminates `as never` casts
 * and consolidates the two competing mock styles into one pattern.
 *
 * ## Usage Pattern (per test file — 4 lines of setup)
 *
 * ```typescript
 * import { mockPrisma, rewirePrismaMock } from '../../test-utils/prisma-mock';
 * import { mockAccount, TEST_IDS } from '../../test-utils/mock-factories';
 *
 * // Dynamic import inside factory bypasses vi.mock hoisting constraint
 * vi.mock('@akount/db', async (importOriginal) => ({
 *   ...(await importOriginal<Record<string, unknown>>()),
 *   prisma: (await import('../../test-utils/prisma-mock')).mockPrisma,
 * }));
 *
 * describe('MyService', () => {
 *   beforeEach(() => {
 *     vi.clearAllMocks();
 *     rewirePrismaMock(); // Re-wires $transaction after clearAllMocks
 *   });
 *
 *   it('works', async () => {
 *     mockPrisma.account.findMany.mockResolvedValueOnce([mockAccount()]);
 *     // ... test logic
 *   });
 * });
 * ```
 *
 * ## Why dynamic import?
 *
 * Vitest hoists `vi.mock()` above all imports, so static imports are
 * not yet available when the factory runs. Using `await import()` inside
 * the async factory loads this module dynamically. ES module caching
 * ensures the static `import { mockPrisma }` in the test body gets the
 * SAME singleton instance.
 *
 * ## Why not vi.hoisted()?
 *
 * `vi.hoisted()` forces inlining the mock creation in every file (~25 lines),
 * defeating the purpose of centralization. The dynamic import pattern keeps
 * the factory in ONE place while each test file needs only 4 lines of setup.
 */

import { vi } from 'vitest';

/**
 * Creates a deeply-mocked Prisma model delegate.
 * Every method is a vi.fn() that returns appropriate defaults.
 */
function createMockModelDelegate() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  };
}

/**
 * Type for a mock model delegate — every Prisma method is a vi.fn().
 */
export type MockModelDelegate = ReturnType<typeof createMockModelDelegate>;

// --- Model delegates (shared across the singleton) ---
const models = {
  // System
  tenant: createMockModelDelegate(),
  tenantUser: createMockModelDelegate(),
  entity: createMockModelDelegate(),
  auditLog: createMockModelDelegate(),
  onboarding: createMockModelDelegate(),

  // Banking
  account: createMockModelDelegate(),
  transaction: createMockModelDelegate(),
  importBatch: createMockModelDelegate(),
  transfer: createMockModelDelegate(),
  fXRate: createMockModelDelegate(),
  bankConnection: createMockModelDelegate(),
  transactionMatch: createMockModelDelegate(),
  bankFeedTransaction: createMockModelDelegate(),

  // Business
  invoice: createMockModelDelegate(),
  invoiceLine: createMockModelDelegate(),
  bill: createMockModelDelegate(),
  billLine: createMockModelDelegate(),
  client: createMockModelDelegate(),
  vendor: createMockModelDelegate(),
  payment: createMockModelDelegate(),
  paymentAllocation: createMockModelDelegate(),
  creditNote: createMockModelDelegate(),

  // Accounting
  gLAccount: createMockModelDelegate(),
  journalEntry: createMockModelDelegate(),
  journalLine: createMockModelDelegate(),
  fiscalCalendar: createMockModelDelegate(),
  fiscalPeriod: createMockModelDelegate(),
  taxRate: createMockModelDelegate(),
  category: createMockModelDelegate(),

  // AI
  aIAction: createMockModelDelegate(),
  insight: createMockModelDelegate(),
  rule: createMockModelDelegate(),
  ruleSuggestion: createMockModelDelegate(),
  monthlyClose: createMockModelDelegate(),

  // Planning
  budget: createMockModelDelegate(),
  budgetLine: createMockModelDelegate(),
  forecast: createMockModelDelegate(),
  forecastLine: createMockModelDelegate(),
  goal: createMockModelDelegate(),

  // Documents
  document: createMockModelDelegate(),
  asset: createMockModelDelegate(),
} as const;

type Models = typeof models;

/**
 * Singleton mock PrismaClient — shared within each test file (one per worker).
 *
 * Use in tests via:
 *   mockPrisma.account.findMany.mockResolvedValueOnce([...])
 */
export const mockPrisma = {
  ...models,
  $transaction: vi.fn(
    (fnOrArray: unknown) => {
      if (typeof fnOrArray === 'function') {
        return (fnOrArray as (tx: Models) => Promise<unknown>)(models);
      }
      if (Array.isArray(fnOrArray)) {
        return Promise.all(fnOrArray);
      }
      return Promise.resolve();
    }
  ),
  $queryRaw: vi.fn().mockResolvedValue([]),
  $executeRaw: vi.fn().mockResolvedValue(0),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

/**
 * Type for the mock Prisma client.
 */
export type MockPrismaClient = typeof mockPrisma;

/**
 * Re-wires $transaction mock after vi.clearAllMocks().
 *
 * Call this in beforeEach() after vi.clearAllMocks() — clearing mocks
 * removes the $transaction implementation, breaking interactive transactions.
 */
export function rewirePrismaMock(): void {
  mockPrisma.$transaction.mockImplementation(
    (fnOrArray: unknown) => {
      if (typeof fnOrArray === 'function') {
        return (fnOrArray as (tx: Models) => Promise<unknown>)(models);
      }
      if (Array.isArray(fnOrArray)) {
        return Promise.all(fnOrArray);
      }
      return Promise.resolve();
    }
  );
}
