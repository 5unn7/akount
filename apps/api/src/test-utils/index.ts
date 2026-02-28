/**
 * Test Utilities Barrel Export
 *
 * Import from '../../test-utils' (or appropriate relative path) to get
 * all test utilities in one import.
 *
 * Two factory layers:
 *   1. Prisma model factories (mock-factories.ts) — for mocking Prisma responses
 *   2. Zod input factories (input-factories.ts) — for validated API inputs
 */

// Financial assertion helpers
export {
  assertIntegerCents,
  assertMoneyFields,
  assertSoftDeleted,
  assertSoftDeleteResponse,
  assertListMoneyIntegrity,
} from './financial-assertions';

// Prisma mock singleton + rewire helper
export {
  mockPrisma,
  rewirePrismaMock,
  type MockPrismaClient,
  type MockModelDelegate,
} from './prisma-mock';

// Mock data factories (Prisma model shapes for unit tests)
export {
  TEST_IDS,
  mockEntity,
  mockTenantUser,
  mockAccount,
  mockTransaction,
  // mockTransfer removed - Transfer model doesn't exist in schema
  mockInvoice,
  mockBill,
  mockClient,
  mockVendor,
  mockPayment,
  mockGLAccount,
  mockJournalEntry,
  mockJournalLine,
  mockCategory,
  mockTaxRate,
  mockInsight,
  mockAIAction,
} from './mock-factories';

// Zod input factories (validated API inputs for route tests)
export {
  mockTaxRateInput,
  mockGLAccountInput,
  mockJournalEntryInput,
  mockInvoiceInput,
  mockBillInput,
  mockClientInput,
  mockVendorInput,
  mockTransactionInput,
  mockTransferInput,
} from './input-factories';

// Zod input factory generator utility
export { createInputFactory } from './zod-input-factories';

// Middleware mock constants
export {
  AUTH_HEADERS,
  NO_AUTH_HEADERS,
  TEST_AUTH,
} from './middleware-mocks';
