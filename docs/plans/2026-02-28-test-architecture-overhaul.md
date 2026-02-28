# Test Architecture Overhaul - Schema-Driven Testing

**Created:** 2026-02-28
**Status:** PENDING APPROVAL
**Effort:** 4-5h
**Priority:** High (eliminates test fragility permanently)

---

## Problem Statement

**Current Pain Points:**
- Schema/type changes break 76+ test files
- Tests create inline mock objects (bypassing factories)
- Mock factories manually maintained, drift from schemas
- No enforcement preventing inline mocks
- Every schema change requires manual test updates

**Example:**
```typescript
// ❌ CURRENT: Inline mock (breaks when TaxRate schema changes)
const mockAccounts = [
  { id: 'acc-1', name: 'Checking', type: 'BANK', currency: 'USD', /* ...20 more fields */ }
];

// ✅ TARGET: Factory-based (auto-updates when schema changes)
const mockAccounts = [mockAccount({ name: 'Checking' })];
```

---

## Root Cause

1. **No schema-driven generation** - Factories manually coded, not derived from Zod schemas
2. **No factory enforcement** - Nothing prevents inline mocks
3. **Over-specification** - Tests specify all fields even when irrelevant
4. **Outdated factories** - mockTaxRate still uses `rate: 5` instead of `rateBasisPoints: 500`

---

## Solution: Schema-Driven Test Architecture

### Architecture Principles

1. **Single Source of Truth:** Zod schemas generate test data
2. **DRY:** Update schema → factories auto-update → tests auto-fix
3. **Minimal Specification:** Tests only override fields they care about
4. **Enforcement:** Lint rules prevent inline mocks

---

## Phase 1: Install Schema Mock Generator

### Step 1.1: Choose Library

**Option A: @anatine/zod-mock** (Recommended)
- Generates valid data from Zod schemas
- Supports complex schemas (refine, transform, etc.)
- 500K+ downloads/month

**Option B: @faker-js/faker + Custom Generator**
- More control over generated data
- Better for realistic test data
- More setup required

**Decision:** Use @anatine/zod-mock for automatic schema sync.

### Step 1.2: Install Dependencies

```bash
npm install -D @anatine/zod-mock
```

---

## Phase 2: Create Schema-Driven Factory Generator

### Step 2.1: Create Factory Generator Utility

**File:** `apps/api/src/test-utils/schema-factories.ts`

```typescript
import { generateMock } from '@anatine/zod-mock';
import type { z } from 'zod';

/**
 * Schema-Driven Factory Generator
 *
 * Generates type-safe mock data from Zod schemas.
 * When schemas change, factories auto-update.
 *
 * Usage:
 *   const mockData = createSchemaFactory(CreateInvoiceSchema);
 *   const invoice = mockData({ clientId: 'custom-client' });
 */

export function createSchemaFactory<T extends z.ZodTypeAny>(schema: T) {
  return (overrides: Partial<z.infer<T>> = {}): z.infer<T> => {
    const generated = generateMock(schema);
    return { ...generated, ...overrides };
  };
}

/**
 * Generate mock from Zod schema with custom overrides
 */
export function mockFromSchema<T extends z.ZodTypeAny>(
  schema: T,
  overrides: Partial<z.infer<T>> = {}
): z.infer<T> {
  const generated = generateMock(schema);
  return { ...generated, ...overrides };
}
```

---

### Step 2.2: Update Mock Factories to Use Schema Generation

**File:** `apps/api/src/test-utils/mock-factories.ts`

**BEFORE (manual, breaks on schema changes):**
```typescript
export function mockTaxRate(overrides = {}) {
  return {
    id: 'tax-1',
    code: 'GST',
    name: 'GST',
    rate: 5, // ❌ OUTDATED - schema uses rateBasisPoints now
    isActive: true,
    // ... 10 more fields manually maintained
    ...overrides,
  };
}
```

**AFTER (schema-driven, auto-updates):**
```typescript
import { mockFromSchema } from './schema-factories';
import { CreateTaxRateSchema } from '../domains/accounting/schemas/tax-rate.schema';

export function mockTaxRate(overrides = {}) {
  // Base data from schema generation
  const base = mockFromSchema(CreateTaxRateSchema, {
    code: 'GST',
    name: 'Goods and Services Tax',
    rateBasisPoints: 500, // Auto-validates against schema
    jurisdiction: 'Federal (Canada)',
    isInclusive: false,
    effectiveFrom: new Date().toISOString(),
  });

  // Add fields not in create schema (database fields)
  return {
    ...base,
    id: 'tax-1',
    entityId: TEST_IDS.ENTITY_ID,
    isActive: true,
    effectiveTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  };
}
```

**Benefits:**
- Schema change (rateBasisPoints) → Zod validation fails immediately if factory is wrong
- Type safety: TypeScript errors if override has wrong type
- DRY: Schema is single source of truth

---

### Step 2.3: Create Factory for Every Domain

**Factories to Update:**

| Domain | Factory Function | Schema Source |
|--------|------------------|---------------|
| Accounting | `mockTaxRate()` | `CreateTaxRateSchema` ✅ Priority |
| Accounting | `mockGLAccount()` | `CreateGLAccountSchema` |
| Accounting | `mockJournalEntry()` | `CreateJournalEntrySchema` |
| Banking | `mockAccount()` | `CreateAccountSchema` |
| Banking | `mockTransaction()` | `CreateTransactionSchema` |
| Business | `mockInvoice()` | `CreateInvoiceSchema` ✅ Priority |
| Business | `mockBill()` | `CreateBillSchema` ✅ Priority |
| Business | `mockClient()` | `CreateClientSchema` |
| Business | `mockVendor()` | `CreateVendorSchema` |
| Business | `mockPayment()` | `CreatePaymentSchema` |
| System | `mockEntity()` | `CreateEntitySchema` |

**Priority:** Start with Invoice, Bill, TaxRate (most errors)

---

## Phase 3: Enforce Factory Usage

### Step 3.1: Update Existing Tests to Use Factories

**Target Files (from error analysis):**

1. **`data-export.service.test.ts`** - 76 errors, all inline mocks
2. **`server-components.test.tsx`** - 7 errors, inline account mocks
3. **Flow tests** - Already using factories ✅

**Pattern to Apply:**

```typescript
// ❌ BEFORE: Inline mock with 20 fields
const accounts = [
  {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'USD',
    country: 'US',
    institution: 'Chase',
    currentBalance: 100000,
    isActive: true,
    glAccountId: null,
    glAccount: null,
    entity: { id: 'ent-1', name: 'Corp', type: 'BUSINESS' },
    // ... 10 more fields
  }
];

// ✅ AFTER: Factory with overrides
import { mockAccount, TEST_IDS } from '../../test-utils/mock-factories';

const accounts = [
  mockAccount({ name: 'Checking' }),
  mockAccount({ name: 'Savings', currentBalance: 200000 }),
];
```

**Automation Strategy:**
- Use Task agent to batch-update tests
- Prove pattern in 1-2 files manually
- Delegate bulk refactoring to agent

---

### Step 3.2: Add ESLint Rule to Prevent Inline Mocks

**File:** `apps/api/.eslintrc.json`

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "ObjectExpression[properties.length > 5]:not(:has(CallExpression[callee.name=/^mock/]))",
        "message": "Large object literals in tests suggest inline mocks. Use mock factories from test-utils instead."
      }
    ]
  },
  "overrides": [
    {
      "files": ["**/__tests__/**", "**/*.test.ts"],
      "rules": {
        "no-magic-numbers": "off", // Allow literals in test assertions
        "@typescript-eslint/no-explicit-any": "warn" // Stricter in tests
      }
    }
  ]
}
```

**Effect:** Prevents creating objects with 5+ properties without using `mock*()` functions.

---

## Phase 4: Create Test Conventions Documentation

### Step 4.1: Create `.claude/rules/test-architecture.md`

**Content:**

```markdown
# Test Architecture

> Auto-loaded for **/__tests__/** and **/*.test.ts files

## Golden Rule: Use Factories, Never Inline Mocks

Every test MUST use mock factories from `test-utils/mock-factories.ts`.

### ❌ NEVER: Inline Mock Objects

```typescript
// ❌ WRONG - Inline mock breaks when schema changes
const invoice = {
  id: 'inv-1',
  clientId: 'client-1',
  invoiceNumber: 'INV-001',
  status: 'DRAFT',
  issueDate: new Date(),
  // ... 15 more fields manually maintained
};
```

### ✅ ALWAYS: Factory Functions

```typescript
// ✅ CORRECT - Factory auto-updates with schema
import { mockInvoice } from '../../test-utils/mock-factories';

const invoice = mockInvoice({ invoiceNumber: 'INV-001' });
```

---

## Factory Usage Patterns

### Pattern 1: Default Mock (No Overrides)

```typescript
const account = mockAccount();
// Uses all defaults from factory
```

### Pattern 2: Minimal Overrides

```typescript
const account = mockAccount({ name: 'Savings', currentBalance: 500000 });
// Override only what matters for this test
```

### Pattern 3: Multiple Instances

```typescript
const accounts = [
  mockAccount({ name: 'Checking' }),
  mockAccount({ name: 'Savings', type: 'SAVINGS' }),
  mockAccount({ name: 'Credit Card', type: 'CREDIT_CARD' }),
];
```

### Pattern 4: Nested Relations

```typescript
const invoice = mockInvoice({
  client: mockClient({ name: 'Acme Corp' }),
  lines: [
    mockInvoiceLine({ description: 'Service A', amount: 10000 }),
    mockInvoiceLine({ description: 'Service B', amount: 20000 }),
  ],
});
```

---

## Schema-Driven Factory Creation

When creating a new factory, derive it from the Zod schema:

```typescript
import { mockFromSchema } from './schema-factories';
import { CreateResourceSchema } from '../domains/resource/schemas/resource.schema';

export function mockResource(overrides = {}) {
  const base = mockFromSchema(CreateResourceSchema, {
    // Provide sensible defaults for required fields
    name: 'Test Resource',
    amount: 10000,
  });

  // Add database fields (id, createdAt, etc.)
  return {
    ...base,
    id: 'res-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

---

## Test File Checklist

Before marking a test file complete:

- [ ] Uses factories from `test-utils/mock-factories`
- [ ] No inline object literals with >3 properties
- [ ] Only overrides fields relevant to the test
- [ ] Mock data uses integer cents (not floats)
- [ ] Passes `npx eslint` (no inline mock warnings)

---

## When Schema Changes

**Old Process (Broken):**
1. Change schema
2. Manually update 76 test files
3. Miss some tests → CI fails
4. Fix remaining tests → 2-3h wasted

**New Process (Automatic):**
1. Change schema
2. Factory uses `mockFromSchema()` → validates against new schema
3. TypeScript errors if factory defaults are invalid
4. Fix ONE factory → all tests auto-fix
5. CI passes → 10min total

---

## Anti-Patterns

### ❌ Never Inline Mock Objects

```typescript
// ❌ WRONG
const invoice = { id: 'inv-1', status: 'DRAFT', total: 1000, /* ...20 fields */ };
```

### ❌ Never Spread Raw Objects

```typescript
// ❌ WRONG - Still inline
mockInvoiceCreate.mockResolvedValue({ ...MOCK_INVOICE_CONSTANT });
```

### ❌ Never Define Constants at Module Level

```typescript
// ❌ WRONG - Constant drifts from schema
const MOCK_ACCOUNT = { id: 'acc-1', /* ... */ };

it('test', () => {
  mockAccountFind.mockResolvedValue(MOCK_ACCOUNT);
});
```

### ✅ Always Call Factories

```typescript
// ✅ CORRECT
mockInvoiceCreate.mockResolvedValue(mockInvoice());
mockAccountFind.mockResolvedValue(mockAccount({ name: 'Test' }));
```

---

_Created: 2026-02-28. Eliminates test fragility via schema-driven factories._
```

---

### Step 4.2: Update `test-conventions.md` Rule

Add to existing `.claude/rules/test-conventions.md`:

```markdown
## Schema-Driven Mock Factories (MANDATORY)

All tests MUST use centralized mock factories from `test-utils/mock-factories.ts`.

### Why This Matters

Schema changes (adding fields, changing types) should require updating ONE factory, not 76 test files.

**Example: FIN-32 Tax Rate Migration**
- Changed `rate: Float` → `rateBasisPoints: Int`
- With inline mocks: 76 test files broke
- With factories: Update `mockTaxRate()` once, all tests auto-fix

### Enforcement

ESLint rule prevents objects with >5 properties in tests unless using `mock*()` functions.

```

---

## Phase 5: Implementation Plan

### Step 5.1: Install Dependencies (2min)

```bash
npm install -D @anatine/zod-mock
```

---

### Step 5.2: Create Schema Factory Generator (15min)

**File:** `apps/api/src/test-utils/schema-factories.ts` (already outlined above)

---

### Step 5.3: Update Mock Factories to Schema-Driven (45min)

**Priority Order:**
1. `mockTaxRate()` - Fix `rate` → `rateBasisPoints` ✅ Immediate
2. `mockInvoice()` - Used in 20+ test files
3. `mockBill()` - Used in 15+ test files
4. `mockAccount()` - Fix entity.type enum issue
5. Others as needed

**Pattern for each factory:**

```typescript
export function mockTaxRate(overrides = {}) {
  const base = mockFromSchema(CreateTaxRateSchema, {
    code: 'GST',
    name: 'Goods and Services Tax',
    rateBasisPoints: 500, // ✅ Schema-validated
    jurisdiction: 'Federal (Canada)',
    isInclusive: false,
    effectiveFrom: new Date().toISOString(),
  });

  return {
    ...base,
    id: 'tax-1',
    entityId: TEST_IDS.ENTITY_ID,
    glAccountId: null,
    isActive: true,
    effectiveTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  };
}
```

---

### Step 5.4: Fix Immediate High-Impact Files (1.5h)

**File 1: `data-export.service.test.ts`** (76 errors)
- Replace all inline account/transaction/invoice mocks
- Use `mockAccount()`, `mockTransaction()`, `mockInvoice()`
- Fix entity.type to use enum ('BUSINESS' not string)

**File 2: `server-components.test.tsx`** (7 errors)
- Replace inline account mocks
- Fix entity.type enum
- Add missing `hasMore` property to list responses

**File 3: Mock Factories** (immediate fix)
- Fix `mockTaxRate()` to use `rateBasisPoints`
- Fix `mockAccount()` to use `entity.type: 'BUSINESS' as const`

---

### Step 5.5: Add ESLint Rule (20min)

**File:** `apps/api/.eslintrc.json`

Add rule to prevent large inline objects in tests.

---

### Step 5.6: Batch Update Remaining Tests (1.5h)

**Remaining test files to update (~50 files):**
- Banking tests
- Accounting tests
- AI tests
- Middleware tests

**Strategy:**
1. Prove pattern in 2-3 files manually
2. Document exact transformation
3. Use Task agent to batch-update remaining files

---

## Phase 6: Create Test File Templates

### Step 6.1: Service Test Template

**File:** `apps/api/src/test-utils/templates/service.test.template.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, rewirePrismaMock, TEST_IDS, mockResource } from '../../../../test-utils';

// Dynamic import bypasses vi.mock hoisting
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('ResourceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('createResource', () => {
    it('should create resource with valid data', async () => {
      const input = mockResource({ name: 'Test Resource' });
      mockPrisma.resource.create.mockResolvedValueOnce(input);

      const result = await resourceService.createResource(input, CTX);

      expect(result.name).toBe('Test Resource');
      expect(mockPrisma.resource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TEST_IDS.TENANT_ID,
          }),
        })
      );
    });
  });
});
```

---

### Step 6.2: Route Test Template

**File:** `apps/api/src/test-utils/templates/route.test.template.ts`

(Standard route test pattern with factory usage)

---

## Phase 7: Documentation Updates

### Step 7.1: Update Test Conventions

Add to `.claude/rules/test-conventions.md`:
- Schema-driven factory section
- Anti-patterns (inline mocks)
- Enforcement rules

### Step 7.2: Create Quick Reference

**File:** `apps/api/src/test-utils/README.md`

```markdown
# Test Utilities

## Quick Start

```typescript
import { mockInvoice, mockAccount, TEST_IDS } from './test-utils';

const invoice = mockInvoice({ total: 100000 }); // Override one field
const account = mockAccount(); // Use all defaults
```

## Available Factories

- Banking: `mockAccount()`, `mockTransaction()`, `mockTransfer()`
- Business: `mockInvoice()`, `mockBill()`, `mockClient()`, `mockVendor()`, `mockPayment()`
- Accounting: `mockGLAccount()`, `mockJournalEntry()`, `mockJournalLine()`, `mockTaxRate()`
- AI: `mockInsight()`, `mockAIAction()`

## Creating New Factories

Use schema-driven generation:

```typescript
import { mockFromSchema } from './schema-factories';
import { CreateResourceSchema } from '../domains/resource/schemas/resource.schema';

export function mockResource(overrides = {}) {
  const base = mockFromSchema(CreateResourceSchema, { /* defaults */ });
  return { ...base, id: 'res-1', createdAt: new Date(), ...overrides };
}
```
```

---

## Success Criteria

- [ ] All factories use schema-driven generation
- [ ] 0 inline mocks in test files (ESLint enforced)
- [ ] `data-export.service.test.ts` uses factories (76 errors fixed)
- [ ] `server-components.test.tsx` uses factories (7 errors fixed)
- [ ] ESLint rule prevents future inline mocks
- [ ] Documentation complete (test-architecture.md, test-conventions.md, README.md)
- [ ] All tests passing
- [ ] 0 TypeScript errors

---

## Verification Steps

After each step:

1. **Factory validation:** Schema change → Factory updates → TypeScript validates
2. **Test validation:** `npx vitest run [test-file]`
3. **Type validation:** `npx tsc --noEmit`
4. **Lint validation:** `npx eslint apps/api/src/**/*.test.ts`

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| Schema factory generator | LOW | Well-tested library (@anatine/zod-mock) |
| Factory updates | LOW | One factory at a time, verify compile after each |
| Test file updates | MEDIUM | Prove pattern in 2 files, then batch with agent |
| ESLint rule | LOW | Rule only warns, doesn't block |

**Overall Risk:** LOW - Incremental changes, verify at each step

---

## Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Install deps | 2min | npm install |
| Schema factories | 15min | Create generator utility |
| Update factories | 45min | Update 11 key factories to schema-driven |
| Fix data-export test | 30min | Replace 76 inline mocks with factories |
| Fix server-components test | 15min | Replace inline account mocks |
| Add ESLint rule | 20min | Prevent future inline mocks |
| Documentation | 30min | test-architecture.md + updates |
| Batch update tests | 1.5h | Task agent updates remaining files |
| **Total** | **4-5h** | Permanent solution |

---

## Long-Term Benefits

| Benefit | Impact |
|---------|--------|
| **Schema changes don't break tests** | 76 test files → 1 factory update |
| **Type safety in tests** | TypeScript catches invalid mocks at compile time |
| **DRY principle** | Single source of truth (Zod schema) |
| **Faster test writing** | `mockAccount()` vs 20 lines of inline object |
| **Consistent test data** | All tests use same realistic defaults |
| **Self-documenting** | Factory shows what fields are required/optional |

**ROI:** 4-5h investment saves 2-3h every schema change (10+ times in Phase 6 alone).

---

_Plan created: 2026-02-28. Eliminates test fragility permanently via schema-driven factories._
