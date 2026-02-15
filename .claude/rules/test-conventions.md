# Test Conventions

---
paths:

- "apps/api/src/**/**tests**/**"
- "apps/api/src/**/*.test.ts"
- "apps/web/src/**/**tests**/**"
- "apps/web/tests/**"

---

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
