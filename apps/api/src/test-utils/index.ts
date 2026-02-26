/**
 * Test Utilities Barrel Export
 *
 * Import from '../../test-utils' (or appropriate relative path) to get
 * all test utilities in one import.
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

// Mock data factories
export {
  TEST_IDS,
  mockEntity,
  mockTenantUser,
  mockAccount,
  mockTransaction,
  mockTransfer,
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

// Middleware mock constants
export {
  AUTH_HEADERS,
  NO_AUTH_HEADERS,
  TEST_AUTH,
} from './middleware-mocks';
