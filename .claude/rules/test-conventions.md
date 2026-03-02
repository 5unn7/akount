# Test Conventions

---
paths:

- "apps/api/src/**/**tests**/**"
- "apps/api/src/**/*.test.ts"
- "apps/web/src/**/**tests**/**"
- "apps/web/tests/**"

---

## Centralized Mock Pattern (REQUIRED for Service Tests)

All service tests MUST use the centralized `mockPrisma` singleton from `test-utils/prisma-mock.ts`. This eliminates `as never` casts, consolidates mock styles, and reduces boilerplate to 4 lines per file.

### Canonical Setup (Copy This)

```typescript
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

// Dynamic import inside factory bypasses vi.mock hoisting constraint
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock(); // Re-wires $transaction after clearAllMocks
  });

  it('works', async () => {
    mockPrisma.account.findMany.mockResolvedValueOnce([mockAccount()]);
    // ... test logic
  });
});
```

### Why Dynamic Import?

Vitest hoists `vi.mock()` above all imports, so static imports aren't available when the factory runs. Using `await import()` inside the async factory loads the module dynamically. ES module caching ensures the static `import { mockPrisma }` in the test body gets the SAME singleton instance.

### Anti-Patterns

```typescript
// ❌ WRONG — vi.hoisted inlines ~25 lines per file, defeats DRY
const { mockPrisma } = vi.hoisted(() => { /* create mock inline */ });

// ❌ WRONG — as never casts hide type errors
vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(data as never);

// ❌ WRONG — bare auto-mock breaks enum re-exports
vi.mock('@akount/db');

// ❌ WRONG — manual mock without importOriginal loses Prisma enums
vi.mock('@akount/db', () => ({ prisma: mockPrisma }));

// ✅ CORRECT — dynamic import + importOriginal preserves enums
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));
```

### Test Utils Available

| Export | From | Purpose |
|--------|------|---------|
| `mockPrisma` | `test-utils/prisma-mock` | Singleton mock Prisma client |
| `rewirePrismaMock()` | `test-utils/prisma-mock` | Re-wire `$transaction` after `clearAllMocks` |
| `TEST_IDS` | `test-utils/mock-factories` | Standard test IDs (TENANT_ID, ENTITY_ID, USER_ID) |
| `mockAccount()`, `mockInvoice()`, etc. | `test-utils/mock-factories` | Prisma model mock data |
| `mockTaxRateInput()`, `mockInvoiceInput()`, etc. | `test-utils/input-factories` | Zod-validated API inputs |
| `createInputFactory()` | `test-utils/zod-input-factories` | Create new input factories |
| `assertIntegerCents()`, etc. | `test-utils/financial-assertions` | Financial invariant assertions |
| `AUTH_HEADERS`, `TEST_AUTH` | `test-utils/middleware-mocks` | Standard auth headers for route tests |

### Route Tests vs Service Tests

- **Service tests** mock Prisma directly via `mockPrisma` (the pattern above)
- **Route tests** mock the SERVICE layer (not Prisma) — they don't need `mockPrisma`
- **Route tests** should use `mockTaxRateInput()` etc. from `input-factories` for Zod-validated API inputs
- Middleware mocks (auth, tenant, validation) must be copy-pasted per route test file because `vi.mock()` inside imported functions is NOT hoisted

## Zod Input Factories (RECOMMENDED for Route Tests)

Use Zod input factories to create validated API input data. These catch schema drift at test-write time because they validate against the Zod schema.

```typescript
import { mockTaxRateInput, mockInvoiceInput } from '../../test-utils';

// Override specific fields — rest gets sensible defaults
const input = mockTaxRateInput({ code: 'HST', rateBasisPoints: 1300 });
// ✅ Validated against CreateTaxRateSchema

const invoice = mockInvoiceInput({ invoiceNumber: 'INV-100' });
// ✅ Validated against CreateInvoiceSchema (includes line items)
```

### Creating New Input Factories

```typescript
// In test-utils/input-factories.ts
import { createInputFactory } from './zod-input-factories';
import { CreateResourceSchema } from '../domains/resource/schemas/resource.schema';
import { TEST_IDS } from './mock-factories';

export const mockResourceInput = createInputFactory(CreateResourceSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  name: 'Default Resource',
  amount: 10000,
});
```

### Available Input Factories

| Factory | Schema | Domain |
|---------|--------|--------|
| `mockTaxRateInput()` | `CreateTaxRateSchema` | Accounting |
| `mockGLAccountInput()` | `CreateGLAccountSchema` | Accounting |
| `mockJournalEntryInput()` | `CreateJournalEntrySchema` | Accounting |
| `mockInvoiceInput()` | `CreateInvoiceSchema` | Invoicing |
| `mockBillInput()` | `CreateBillSchema` | Invoicing |
| `mockClientInput()` | `CreateClientSchema` | Clients |
| `mockVendorInput()` | `CreateVendorSchema` | Vendors |
| `mockTransactionInput()` | `CreateTransactionSchema` | Banking |
| `mockTransferInput()` | `CreateTransferSchema` | Banking |

## Financial Invariant Assertions (REQUIRED)

Every test file that touches financial data MUST include assertions for the 5 key invariants.
Use helpers from `apps/api/src/test-utils/financial-assertions.ts`.

### 1. Integer Cents

Any test that returns monetary fields (amount, currentBalance, debitAmount, creditAmount) MUST assert they are integers:

```typescript
import { assertIntegerCents, assertMoneyFields } from '../../test-utils/financial-assertions';

// Single field
assertIntegerCents(body.amount);

// Multiple fields on an object
assertMoneyFields(body.accounts[0], ['currentBalance', 'amount']);
```

### 2. Soft Delete Verification

DELETE endpoint tests MUST verify the record still exists with `deletedAt` set:

```typescript
// Mock should return record WITH deletedAt
mockSoftDeleteAccount.mockResolvedValue({
  ...MOCK_ACCOUNT,
  deletedAt: new Date(),
});

// After delete call, verify soft delete behavior
expect(response.statusCode).toBe(204);
expect(mockSoftDeleteAccount).toHaveBeenCalled();

// Verify the mock was configured to return deletedAt
const mockResult = await mockSoftDeleteAccount.mock.results[0].value;
expect(mockResult.deletedAt).toBeTruthy();
```

### 3. Tenant Isolation

Tests MUST include at least one test that verifies cross-tenant access is rejected:

```typescript
it('should reject cross-tenant access', async () => {
  // Override tenant middleware for this test
  mockGetAccount.mockResolvedValueOnce(null); // Service returns null for wrong tenant

  const response = await app.inject({
    method: 'GET',
    url: '/api/banking/accounts/other-tenant-id',
    headers: { authorization: 'Bearer test-token' },
  });

  // Service should return null/404 for records belonging to other tenants
  expect(response.statusCode).toBe(404);
});
```

### 4. Balanced Journal Entries

Tests involving journal entries MUST verify debits equal credits:

```typescript
const debits = lines.reduce((sum, l) => sum + l.debitAmount, 0);
const credits = lines.reduce((sum, l) => sum + l.creditAmount, 0);
expect(debits).toBe(credits);
```

### 5. Source Preservation

Tests creating journal entries from documents MUST verify sourceType, sourceId, sourceDocument are set.

## Test File Checklist

Before marking a test file complete, verify:

- [ ] Monetary fields asserted as integers (use `assertIntegerCents`)
- [ ] DELETE tests verify soft delete (`deletedAt` set, record exists)
- [ ] At least one tenant isolation test per resource
- [ ] Mock data uses integer cents (not floats)
- [ ] Descriptive test names explain the business rule

## Mock Data Standards

Mock data MUST use integer cents:

```typescript
// ✅ CORRECT
const MOCK_TRANSACTION = { amount: 550 }; // $5.50

// ❌ WRONG
const MOCK_TRANSACTION = { amount: 5.50 }; // Float!
```

Mock soft-delete responses MUST include `deletedAt`:

```typescript
// ✅ CORRECT
mockSoftDelete.mockResolvedValue({ ...MOCK_RECORD, deletedAt: new Date() });

// ❌ WRONG — doesn't prove soft delete happened
mockSoftDelete.mockResolvedValue(undefined);
```

## Test Maintenance (REQUIRED)

When modifying route handlers or service function signatures, **update related tests in the SAME session**. Never commit route/service changes with failing tests.

**Update triggers:**

- Route schema changes (Zod schema modified)
- Service function signature changes (params added/removed)
- Response format changes (new fields, status code changes)
- Error handling changes (new error paths)

**Before committing route/service changes:**

```bash
cd apps/api && npx vitest run --reporter=verbose
```

If tests fail, fix them before committing. Broken tests on main = P0 issue.
