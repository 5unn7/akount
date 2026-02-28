# Test Writing Guide — Schema-Driven Factories

**Last Updated:** 2026-02-28
**Factory Adoption:** 43% (55/127 files) → Target: 90%+

---

## Quick Start

### For Service Tests (Mocking Prisma Responses)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, rewirePrismaMock, TEST_IDS, mockAccount, mockInvoice } from '../../../test-utils';

// ✅ Centralized mockPrisma (preserves enum re-exports)
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock(); // Re-wire $transaction after clearAllMocks
  });

  it('should list accounts', async () => {
    const accounts = [mockAccount({ name: 'Checking' })];
    mockPrisma.account.findMany.mockResolvedValue(accounts);

    const result = await service.listAccounts(TEST_IDS.ENTITY_ID);

    expect(result).toEqual(accounts);
  });
});
```

### For Route Tests (Validating API Inputs)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockTaxRateInput, mockInvoiceInput } from '../../../test-utils';

describe('POST /tax-rates', () => {
  it('should create tax rate', async () => {
    // ✅ Validated against CreateTaxRateSchema
    const input = mockTaxRateInput({ code: 'HST', rateBasisPoints: 1300 });

    const response = await app.inject({
      method: 'POST',
      url: '/tax-rates',
      payload: input,
    });

    expect(response.statusCode).toBe(201);
  });
});
```

---

## Two-Layer Factory Pattern

### Layer 1: Type-Safe Model Factories (Unit Test Mocks)

**Use:** When mocking Prisma query responses in service tests

```typescript
import { mockAccount, mockInvoice, mockTaxRate } from '../../../test-utils';

// Returns Account type (flat FK fields like entityId: string)
const account = mockAccount({ name: 'Checking', currentBalance: 500000 });
mockPrisma.account.findFirst.mockResolvedValue(account);
```

**Available factories:**
- `mockEntity()`, `mockTenantUser()`
- `mockAccount()`, `mockTransaction()`
- `mockInvoice()`, `mockBill()`, `mockClient()`, `mockVendor()`, `mockPayment()`
- `mockGLAccount()`, `mockJournalEntry()`, `mockJournalLine()`, `mockCategory()`, `mockTaxRate()`
- `mockInsight()`, `mockAIAction()`

**Key features:**
- ✅ Type-safe with `Partial<T>` overrides
- ✅ All monetary fields use integer cents
- ✅ Soft-deletable records include `deletedAt: null`
- ✅ Schema changes cause compile errors in ONE place (the factory)

### Layer 2: Zod Input Factories (API Input Validation)

**Use:** When testing API routes that validate with Zod schemas

```typescript
import {
  mockTaxRateInput,
  mockGLAccountInput,
  mockJournalEntryInput,
  mockInvoiceInput,
  mockBillInput,
  mockClientInput,
  mockVendorInput,
  mockTransactionInput,
} from '../../../test-utils';

// Validated against CreateTaxRateSchema
const input = mockTaxRateInput({ code: 'HST' });
// ✅ Zod validation runs at factory call time
// ✅ Schema change → validation fails → immediate feedback
```

**Available input factories:**
- Accounting: `mockTaxRateInput()`, `mockGLAccountInput()`, `mockJournalEntryInput()`
- Invoicing: `mockInvoiceInput()`, `mockBillInput()`
- Clients/Vendors: `mockClientInput()`, `mockVendorInput()`
- Banking: `mockTransactionInput()`

---

## Factory Selection Guide

| Test Scenario | Use This | Example |
|---------------|----------|---------|
| Mock Prisma query result | Model factory | `mockPrisma.account.findFirst.mockResolvedValue(mockAccount())` |
| Test API route input | Input factory | `const input = mockInvoiceInput(); await createInvoice(input)` |
| Flow test (create → read) | Both | Input factory for API call, model factory for mock response |
| Nested relations | Model factory | `mockInvoice({ client: mockClient({ name: 'Acme' }) })` |

---

## Anti-Patterns (NEVER DO)

### ❌ NEVER: Inline Mock Objects

```typescript
// ❌ WRONG - Breaks when TaxRate schema changes
const taxRate = {
  id: 'tax-1',
  code: 'GST',
  rate: 5, // ❌ Field renamed to rateBasisPoints in FIN-32!
  jurisdiction: 'Canada',
  isActive: true,
  // ... 10 more fields manually maintained
};
```

**Why bad:** Schema change (e.g., `rate` → `rateBasisPoints`) breaks this inline mock. With 70+ test files having inline mocks, a simple schema change takes 2-3h to fix.

### ✅ CORRECT: Type-Safe Factory

```typescript
// ✅ RIGHT - Auto-updates with schema
const taxRate = mockTaxRate({ code: 'GST' });
// ✅ Compiler enforces rateBasisPoints field
// ✅ Schema change breaks ONE factory, not 70 test files
```

---

### ❌ NEVER: Module-Level Mock Constants

```typescript
// ❌ WRONG - Data becomes stale, causes drift
const MOCK_ACCOUNT = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  // ... rest
};

describe('Tests', () => {
  it('test 1', () => {
    mockPrisma.account.findFirst.mockResolvedValue(MOCK_ACCOUNT);
  });
});
```

### ✅ CORRECT: Generate Fresh Per Test

```typescript
// ✅ RIGHT - Fresh data per test
describe('Tests', () => {
  it('test 1', () => {
    const account = mockAccount({ name: 'Checking' });
    mockPrisma.account.findFirst.mockResolvedValue(account);
  });
});
```

---

### ❌ NEVER: Manual Prisma Mocks

```typescript
// ❌ WRONG - Loses enum re-exports (GLAccountType, InvoiceStatus, etc.)
vi.mock('@akount/db', () => ({
  prisma: {
    account: { findMany: vi.fn() },
  },
}));
```

### ✅ CORRECT: Centralized mockPrisma

```typescript
// ✅ RIGHT - Preserves all enums via importOriginal
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../test-utils/prisma-mock')).mockPrisma,
}));
```

---

## Creating New Input Factories

When adding a new Zod schema, create an input factory:

```typescript
// In test-utils/input-factories.ts
import { createInputFactory } from './zod-input-factories';
import { CreateResourceSchema } from '../domains/resource/schemas/resource.schema';
import { TEST_IDS } from './mock-factories';

export const mockResourceInput = createInputFactory(CreateResourceSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  name: 'Default Resource',
  amount: 10000, // Integer cents
});
```

Then export it from `test-utils/index.ts`:

```typescript
export { mockResourceInput } from './input-factories';
```

---

## Schema Change Workflow

### Before (Fragile)

1. Change Prisma schema (e.g., `TaxRate.rate` → `TaxRate.rateBasisPoints`)
2. 76 test files break with type errors
3. Manually update each inline mock
4. Miss some → CI fails
5. **Time: 2-3 hours**

### After (Resilient)

1. Change Prisma schema
2. ONE factory breaks (`mockTaxRate()` has TypeScript error)
3. Fix the factory (add `rateBasisPoints` field)
4. All 76 test files auto-fix
5. **Time: 10 minutes**

---

## Common Scenarios

### Scenario 1: Testing with Minimal Data

```typescript
// Override only fields relevant to the test
const account = mockAccount({ name: 'Savings' });
// All other fields auto-filled with realistic defaults
```

### Scenario 2: Testing Nested Relations

```typescript
// Nested invoice with client and line items
const invoice = mockInvoice({
  invoiceNumber: 'INV-100',
  client: mockClient({ name: 'Acme Corp' }),
});
```

### Scenario 3: Testing Multiple Instances

```typescript
// Create array of mocks with overrides
const accounts = [
  mockAccount({ name: 'Checking', type: 'BANK' }),
  mockAccount({ name: 'Visa', type: 'CREDIT_CARD' }),
];
mockPrisma.account.findMany.mockResolvedValue(accounts);
```

### Scenario 4: Testing Error Conditions

```typescript
// Mock Prisma errors (use Prisma namespace from @akount/db)
import { Prisma } from '@akount/db';

const p2002Error = new Prisma.PrismaClientKnownRequestError(
  'Unique constraint failed',
  { code: 'P2002', clientVersion: '5.0.0' }
);
mockPrisma.account.create.mockRejectedValue(p2002Error);
```

---

## Migration Checklist

When migrating old test files:

- [ ] Import centralized factories (`mockPrisma`, `rewirePrismaMock`, model factories)
- [ ] Replace manual vi.mock('@akount/db') with importOriginal pattern
- [ ] Add `rewirePrismaMock()` to beforeEach
- [ ] Replace inline object literals with factory calls
- [ ] Use mockPrisma.model.method directly (no const aliases)
- [ ] Import `Prisma` from '@akount/db' if testing P2002 errors
- [ ] Run tests to verify migration successful
- [ ] Run ESLint to confirm no inline mock warnings

---

## Resources

- **Template:** [apps/api/src/test-utils/templates/service.test.template.ts](../templates/service.test.template.ts)
- **Examples:**
  - Route test: [domains/accounting/__tests__/tax-rate.routes.test.ts](../../domains/accounting/__tests__/tax-rate.routes.test.ts)
  - Service test: [domains/accounting/__tests__/gl-account.service.test.ts](../../domains/accounting/__tests__/gl-account.service.test.ts)
- **Rule:** [.claude/rules/test-architecture.md](../../../../.claude/rules/test-architecture.md)
- **Audit:** `node .claude/scripts/audit-factory-usage.js`

---

## Troubleshooting

**Issue:** `mockPrisma is not defined`
**Fix:** Import from test-utils: `import { mockPrisma } from '../../../test-utils'`

**Issue:** `GLAccountType is not defined` (enum error)
**Fix:** Use importOriginal pattern in vi.mock (preserves enums)

**Issue:** `rewirePrismaMock is not defined`
**Fix:** Import from test-utils: `import { rewirePrismaMock } from '../../../test-utils'`

**Issue:** Tests fail after migration
**Fix:** Check that mockPrisma methods are used directly (no const aliases at module scope)

---

## Current Adoption: 43%

Run audit to see progress:
```bash
node .claude/scripts/audit-factory-usage.js
```

**Target:** 90%+ adoption (prevents schema change breakage across codebase)
