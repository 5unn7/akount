# Test Architecture Reviewer Agent

**Purpose:** Ensure test files follow schema-driven factory pattern and prevent test fragility.

**Invoke when:** Reviewing test file changes, new test files, or after test architecture updates.

---

## Review Checklist

### 1. Factory Usage (CRITICAL)

#### ✅ Required Patterns

- [ ] **Prisma mocks use fabbrica factories**
  ```typescript
  // ✅ CORRECT
  import { AccountFactory } from '../__generated__/fabbrica';
  const account = await AccountFactory.build();
  mockPrisma.account.findFirst.mockResolvedValue(account);
  ```

- [ ] **API inputs use validated factories**
  ```typescript
  // ✅ CORRECT
  import { mockTaxRateInput } from '../../test-utils/input-factories';
  const input = mockTaxRateInput({ code: 'HST' });
  ```

#### ❌ Violations to Flag

- [ ] **Inline object literals (>3 properties)**
  ```typescript
  // ❌ WRONG - Will break on schema changes
  const account = {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    currentBalance: 10000,
    // ... 10 more fields
  };
  ```

- [ ] **Module-level mock constants**
  ```typescript
  // ❌ WRONG - Static data drifts from schema
  const MOCK_INVOICE = { id: 'inv-1', total: 1000, /* ... */ };

  it('test', () => {
    mockPrisma.invoice.findFirst.mockResolvedValue(MOCK_INVOICE);
  });
  ```

- [ ] **Deprecated factory usage**
  ```typescript
  // ❌ DEPRECATED
  import { mockAccount } from '../../test-utils/mock-factories';

  // ✅ CORRECT
  import { AccountFactory } from '../__generated__/fabbrica';
  ```

---

### 2. Import Hygiene

- [ ] **Correct import paths**
  - Prisma factories: `from '../__generated__/fabbrica'`
  - Input factories: `from '../../test-utils/input-factories'`
  - Not from: `test-utils/mock-factories` (deprecated)

- [ ] **No direct fabbrica imports in production code**
  - Factories only in `__tests__/` or `*.test.ts` files
  - Production code never imports from `__generated__/`

---

### 3. Type Safety

- [ ] **No `as any` to bypass type errors**
  ```typescript
  // ❌ WRONG
  mockPrisma.account.findFirst.mockResolvedValue(data as any);

  // ✅ CORRECT
  const account = await AccountFactory.build(data);
  mockPrisma.account.findFirst.mockResolvedValue(account);
  ```

- [ ] **Mock data matches current types**
  - Check factory output against Prisma-generated types
  - Verify input factories validate against Zod schemas

---

### 4. Minimal Specification

- [ ] **Tests only override relevant fields**
  ```typescript
  // ❌ OVER-SPECIFIED
  const account = await AccountFactory.build({
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    currentBalance: 10000,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // ... test only cares about 'name'!
  });

  // ✅ MINIMAL
  const account = await AccountFactory.build({ name: 'Checking' });
  ```

---

### 5. Relation Handling

- [ ] **Nested relations use factories**
  ```typescript
  // ✅ CORRECT
  const invoice = await InvoiceFactory.build({
    client: await ClientFactory.build({ name: 'Acme' }),
    invoiceLines: await InvoiceLineFactory.buildList(2),
  });
  ```

- [ ] **No manual relation construction**
  ```typescript
  // ❌ WRONG
  const invoice = { client: { id: 'c1', name: 'Acme', /* manual */ } };
  ```

---

## Auto-Fix Suggestions

When violations found, provide specific migration patterns:

### Pattern 1: Inline Mock → Factory

**Found:**
```typescript
const account = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  currency: 'USD',
  currentBalance: 100000,
  // ... 10 more fields
};
```

**Suggest:**
```typescript
import { AccountFactory } from '../__generated__/fabbrica';

const account = await AccountFactory.build({
  name: 'Checking',
  currentBalance: 100000,
});
```

---

### Pattern 2: Module Constant → Factory Call

**Found:**
```typescript
const MOCK_TAX_RATE = { code: 'GST', rate: 5, /* ... */ };

it('test', () => {
  mockPrisma.taxRate.findFirst.mockResolvedValue(MOCK_TAX_RATE);
});
```

**Suggest:**
```typescript
import { TaxRateFactory } from '../__generated__/fabbrica';

it('test', async () => {
  const taxRate = await TaxRateFactory.build({ code: 'GST' });
  mockPrisma.taxRate.findFirst.mockResolvedValue(taxRate);
});
```

---

### Pattern 3: Deprecated Factory → Generated Factory

**Found:**
```typescript
import { mockAccount } from '../../test-utils/mock-factories';
const account = mockAccount();
```

**Suggest:**
```typescript
import { AccountFactory } from '../__generated__/fabbrica';
const account = await AccountFactory.build();
```

---

## Common Violations & Fixes

| Violation | Severity | Fix |
|-----------|----------|-----|
| Inline mock object | 🔴 CRITICAL | Replace with Factory.build() |
| Module-level constant | 🔴 CRITICAL | Move to beforeEach, use factory |
| Deprecated factory | 🟡 WARNING | Use generated factory |
| Over-specification | 🟡 WARNING | Remove unnecessary field overrides |
| Missing imports | 🔴 CRITICAL | Add factory imports |
| `as any` cast | 🟡 WARNING | Use proper factory types |

---

## Review Output Format

```markdown
## Test Architecture Review: [filename]

### ✅ Compliant Patterns
- Uses TaxRateFactory for Prisma mocks
- Uses mockTaxRateInput for API inputs
- Minimal field overrides (only 2 fields specified)

### ❌ Violations Found

**1. Inline mock object (Line 45)**
```typescript
const account = { id: 'acc-1', name: 'Test', /* 15 fields */ };
```

**Fix:**
```typescript
import { AccountFactory } from '../__generated__/fabbrica';
const account = await AccountFactory.build({ name: 'Test' });
```

**2. Deprecated factory usage (Line 12)**
```typescript
import { mockAccount } from '../../test-utils/mock-factories';
```

**Fix:**
```typescript
import { AccountFactory } from '../__generated__/fabbrica';
```

### 📊 Metrics
- Factory adoption: 60% (3/5 mocks use factories)
- Target: 100%
- Inline mocks found: 2
- Type safety: ⚠️ 1 `as any` cast found
```

---

## Integration with Other Agents

- **Works with:** `kieran-typescript-reviewer` (validates factory types)
- **Works with:** `security-sentinel` (checks test data doesn't leak patterns)
- **Complements:** `code-simplicity-reviewer` (minimal specification)

---

## Exclusions (Don't Flag)

- ✅ Small objects ≤3 properties (e.g., `{ id: 'x', name: 'y' }`)
- ✅ Test assertion objects (e.g., `expect.objectContaining({ name: 'Test' })`)
- ✅ Configuration objects (e.g., vitest config, mock function config)
- ✅ Helper functions that return builders (e.g., `makeMockReply()` for Fastify)

---

_Created: 2026-02-28. Enforces schema-driven factory pattern in all tests._
