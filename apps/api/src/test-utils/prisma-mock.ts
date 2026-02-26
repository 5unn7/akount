/**
 * Centralized Prisma Mock Factory
 *
 * Provides type-safe Prisma mocking that eliminates `as never` casts
 * and consolidates the two competing mock styles into one pattern.
 *
 * Usage:
 *   import { createMockPrismaClient, setupPrismaMock } from '../../test-utils/prisma-mock';
 *
 *   const mockPrisma = createMockPrismaClient();
 *   setupPrismaMock(mockPrisma);
 *
 *   // In tests:
 *   mockPrisma.account.findMany.mockResolvedValueOnce([mockAccount()]);
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

/**
 * Creates a complete mock PrismaClient with all models.
 * Each model has mocked CRUD methods that return type-safe defaults.
 *
 * The mock includes a working $transaction that passes itself as the tx client.
 */
export function createMockPrismaClient() {
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

  const client = {
    ...models,
    $transaction: vi.fn(
      (fnOrArray: unknown) => {
        if (typeof fnOrArray === 'function') {
          // Interactive transaction: pass the mock client as tx
          return (fnOrArray as (tx: Models) => Promise<unknown>)(models);
        }
        // Sequential transaction: resolve all promises
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

  return client;
}

/**
 * Type for the mock Prisma client.
 */
export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

/**
 * Sets up the @akount/db mock with a pre-configured mock client.
 *
 * This replaces the 15-line vi.mock('@akount/db', ...) block found in every test file.
 * It uses importOriginal to preserve Prisma enum re-exports (prevents the
 * "Invalid enum value" / "No export defined" errors from bare auto-mocks).
 *
 * Usage:
 *   const mockPrisma = createMockPrismaClient();
 *   setupPrismaMock(mockPrisma);
 *
 *   // Then in tests:
 *   mockPrisma.account.findMany.mockResolvedValueOnce([...]);
 *
 * IMPORTANT: Call this at module scope (not inside describe/beforeEach).
 * vi.mock is hoisted by Vitest automatically.
 */
export function setupPrismaMock(mockClient: MockPrismaClient): void {
  vi.mock('@akount/db', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
      ...actual,
      prisma: mockClient,
    };
  });
}
