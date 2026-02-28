# Hybrid Test Factory Architecture - Schema-Driven Testing at Scale

**Created:** 2026-02-28
**Status:** DRAFT
**Effort:** 12-15h (over 2-3 weeks)
**Priority:** Critical (affects 2000+ tests, 154 test files)

---

## Executive Summary

**Problem:** Every schema change breaks 70+ test files. Current test suite has 91% of files using inline mocks instead of factories, causing massive fragility.

**Solution:** Hybrid architecture using `@quramy/prisma-fabbrica` (Prisma model factories) + Zod validation (API input factories). Schema changes auto-generate new factories, tests auto-fix.

**Impact:**
- **Current:** 2-3h per schema change across 76+ test files
- **After:** 10min (regenerate factories, verify tests)
- **ROI:** 30-45h/year savings, payback in 4-5 schema changes (~3-4 months)

---

## Current State Analysis

| Metric | Count | Problem |
|--------|-------|---------|
| Prisma models | 47 | Only 17 have mock factories (36%) |
| Test files | 154 | 143 use inline mocks (93%!) |
| Tests total | 2000+ | Fragile, break on every schema change |
| Factory usage | 11 files | Only 7% adoption |
| TypeScript errors | 142 | From schema drift |

**Example Fragility:**
- FIN-32 (TaxRate.rate → rateBasisPoints): 76 test files broke
- Status field change: 9 test files broke
- Every type change cascades to dozens of tests

---

## Architecture Decision: Hybrid Approach

### Why Hybrid? (Prisma-Fabbrica + Zod Validation)

We have **two sources of truth:**

1. **Prisma Schema** → Database models (what comes FROM database)
2. **Zod Schemas** → API validation (what goes TO API)

**Tests mock BOTH layers:**
- Service tests: Mock Prisma responses (need Prisma types)
- Route tests: Validate Zod inputs (need Zod types)

### Solution: Two-Layer Factory System

**Layer 1: Prisma Model Factories** (prisma-fabbrica)
- Auto-generated from Prisma schema via `npx prisma generate`
- Schema change → Run codegen → Factories auto-update
- Type-safe, supports relations, traits, transient fields

**Layer 2: Zod Input Factories** (Manual + Validated)
- Hand-written but validated against Zod schemas
- Schema validation ensures factories always produce valid inputs
- Lightweight, no code generation needed

| Library | Purpose | Coverage | Auto-Update | Type Safety |
|---------|---------|----------|-------------|-------------|
| **@quramy/prisma-fabbrica** | Prisma model mocks | 80% of tests | ✅ Yes (codegen) | ⭐⭐⭐⭐⭐ |
| **Zod .parse()** | API input validation | 20% of tests | ⚠️ Validated | ⭐⭐⭐⭐⭐ |

---

## Phase 1: Setup & Infrastructure (1-2h)

### Task 1.1: Install Dependencies

**File:** `packages/db/package.json`
**What:** Install `@quramy/prisma-fabbrica` as dev dependency
**Depends on:** none
**Success:** Package installed, no errors

```bash
cd packages/db
npm install -D @quramy/prisma-fabbrica
```

---

### Task 1.2: Configure Prisma Generator

**File:** `packages/db/prisma/schema.prisma`
**What:** Add fabbrica generator to generate factories from models
**Depends on:** Task 1.1
**Success:** Generator configured, ready to run

```prisma
generator fabbrica {
  provider = "prisma-fabbrica"
  output   = "../../apps/api/src/__generated__/fabbrica"
}
```

**Why this output path:**
- Keeps generated files in API app (where tests are)
- Outside `src/` prevents accidental imports in production code
- Co-located with test-utils for easy discovery

---

### Task 1.3: Generate Prisma Factories

**File:** `apps/api/src/__generated__/fabbrica/` (auto-generated)
**What:** Run `npx prisma generate` to create factories for all 47 models
**Depends on:** Task 1.2
**Success:** Factories generated in `__generated__/fabbrica/index.ts`

```bash
cd packages/db
npx prisma generate
```

**Generated Output Example:**
```typescript
// Auto-generated: apps/api/src/__generated__/fabbrica/index.ts
export const TaxRateFactory = defineTaxRateFactory({
  defaultData: {
    code: async () => faker.string.alphanumeric(5),
    name: async () => faker.commerce.productName(),
    rateBasisPoints: async () => faker.number.int({ min: 0, max: 10000 }),
    jurisdiction: async () => faker.location.country(),
    isInclusive: false,
    isActive: true,
    effectiveFrom: async () => faker.date.recent(),
  },
});
```

---

### Task 1.4: Create Zod Input Factory Generator

**File:** `apps/api/src/test-utils/zod-input-factories.ts` (NEW)
**What:** Create utility for Zod-validated input factories
**Depends on:** none
**Success:** Utility created, exports `createInputFactory()` helper

```typescript
/**
 * Zod Input Factory Generator
 *
 * Creates factories for API inputs that are validated against Zod schemas.
 * Ensures factories always produce valid input data.
 */

import type { z } from 'zod';

export function createInputFactory<T extends z.ZodTypeAny>(
  schema: T,
  defaults: Partial<z.infer<T>>
) {
  return (overrides: Partial<z.infer<T>> = {}): z.infer<T> => {
    const data = { ...defaults, ...overrides };
    // Validate against schema - throws if invalid
    return schema.parse(data);
  };
}
```

---

### Task 1.5: Create Input Factories for API Schemas

**File:** `apps/api/src/test-utils/input-factories.ts` (NEW)
**What:** Create validated input factories for common API operations
**Depends on:** Task 1.4
**Success:** Factories for Invoice, Bill, TaxRate, Account inputs created

```typescript
import { createInputFactory } from './zod-input-factories';
import { CreateTaxRateSchema } from '../domains/accounting/schemas/tax-rate.schema';
import { CreateInvoiceSchema } from '../domains/invoicing/schemas/invoice.schema';
import { CreateBillSchema } from '../domains/invoicing/schemas/bill.schema';
import { TEST_IDS } from './mock-factories';

export const mockTaxRateInput = createInputFactory(CreateTaxRateSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  code: 'GST',
  name: 'Goods and Services Tax',
  rateBasisPoints: 500,
  jurisdiction: 'Federal (Canada)',
  isInclusive: false,
  effectiveFrom: new Date().toISOString(),
});

export const mockInvoiceInput = createInputFactory(CreateInvoiceSchema, {
  clientId: 'client-1',
  invoiceNumber: 'INV-001',
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  currency: 'CAD',
  subtotal: 10000,
  taxAmount: 500,
  total: 10500,
  lines: [{
    description: 'Service',
    quantity: 1,
    unitPrice: 10000,
    amount: 10000,
    taxAmount: 500,
  }],
});

// ... more input factories
```

---

## Phase 2: Update Mock Factories (2-3h)

### Task 2.1: Deprecate Manual Factories

**File:** `apps/api/src/test-utils/mock-factories.ts`
**What:** Mark manual factories as deprecated, add migration guide
**Depends on:** Task 1.3
**Success:** File has deprecation notices

```typescript
/**
 * @deprecated Use prisma-fabbrica generated factories instead
 * @see apps/api/src/__generated__/fabbrica
 *
 * Migration guide:
 * - mockAccount() → AccountFactory.build()
 * - mockInvoice() → InvoiceFactory.build()
 */
export function mockAccount(overrides = {}) {
  // ... existing implementation
}
```

---

### Task 2.2: Create Factory Re-exports for Backward Compat

**File:** `apps/api/src/test-utils/index.ts`
**What:** Re-export fabbrica factories with consistent naming
**Depends on:** Task 1.3
**Success:** Tests can import from single location

```typescript
// Prisma model factories (auto-generated)
export {
  AccountFactory,
  InvoiceFactory,
  BillFactory,
  TaxRateFactory,
  GLAccountFactory,
  JournalEntryFactory,
  ClientFactory,
  VendorFactory,
  // ... all 47 models
} from '../__generated__/fabbrica';

// Zod input factories (manual + validated)
export {
  mockTaxRateInput,
  mockInvoiceInput,
  mockBillInput,
  // ... API inputs
} from './input-factories';

// Shared constants
export { TEST_IDS } from './mock-factories';

// Utilities
export { mockPrisma, rewirePrismaMock } from './prisma-mock';
export { createInputFactory } from './zod-input-factories';
```

---

### Task 2.3: Create Migration Examples

**File:** `apps/api/src/test-utils/MIGRATION.md` (NEW)
**What:** Document how to migrate from old to new factories
**Depends on:** Task 2.2
**Success:** Clear migration guide with before/after examples

```markdown
# Migrating to Schema-Driven Factories

## Service Tests (Prisma Mocks)

### Before
```typescript
const account = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  // ... 15 more fields
};
mockPrisma.account.findFirst.mockResolvedValue(account);
```

### After
```typescript
import { AccountFactory } from '../__generated__/fabbrica';

const account = await AccountFactory.build({ name: 'Checking' });
mockPrisma.account.findFirst.mockResolvedValue(account);
```

## Route Tests (API Inputs)

### Before
```typescript
const input = {
  code: 'GST',
  name: 'GST',
  rate: 0.05, // ❌ Wrong field!
  // ... manual fields
};
```

### After
```typescript
import { mockTaxRateInput } from '../../test-utils';

const input = mockTaxRateInput({ code: 'HST' });
// ✅ Validated against CreateTaxRateSchema
```
```

---

## Phase 3: High-Impact File Migration (3-4h)

### Task 3.1: Fix data-export.service.test.ts (76 errors)

**File:** `apps/api/src/domains/system/services/__tests__/data-export.service.test.ts`
**What:** Replace all inline mocks with AccountFactory, InvoiceFactory, etc.
**Depends on:** Task 2.2
**Risk:** medium (complex file with many mocks)
**Success:** 0 TypeScript errors, all tests passing

**Pattern:**
```typescript
// ❌ BEFORE (lines 77-150): Inline helpers
function makeMockEntity() { return { id, name, tenantId }; }

// ✅ AFTER: Use generated factory
import { EntityFactory } from '../__generated__/fabbrica';
const entity = await EntityFactory.build();
```

---

### Task 3.2: Fix server-components.test.tsx (7 errors)

**File:** `apps/web/src/components/dashboard/__tests__/server-components.test.tsx`
**What:** Replace inline account mocks, fix entity.type enum
**Depends on:** Task 2.2
**Success:** 0 TypeScript errors, tests passing

**Pattern:**
```typescript
// ❌ BEFORE: entity.type as string
const account = { entity: { type: 'BUSINESS' } }; // string, not enum

// ✅ AFTER: Use factory with correct enum
const account = await AccountFactory.build({
  entity: await EntityFactory.build({ type: 'BUSINESS' })
});
```

---

### Task 3.3: Update Mock Factories (Legacy Compatibility)

**File:** `apps/api/src/test-utils/mock-factories.ts`
**What:** Update existing mockTaxRate, mockAccount to wrap fabbrica factories
**Depends on:** Task 1.3
**Success:** Old imports still work, use new factories under the hood

```typescript
import { TaxRateFactory } from '../__generated__/fabbrica';

/**
 * @deprecated Prefer TaxRateFactory.build() from fabbrica
 * This wrapper exists for backward compatibility
 */
export async function mockTaxRate(overrides = {}) {
  return TaxRateFactory.build(overrides);
}
```

---

## Phase 4: Enforcement & Guardrails (1-2h)

### Task 4.1: Create Test Architecture Rule

**File:** `.claude/rules/test-architecture.md` (NEW)
**What:** Document factory-first testing pattern and anti-patterns
**Depends on:** Task 2.3
**Success:** Rule auto-loads for test files, prevents inline mocks

```markdown
# Test Architecture

---
paths:
  - "**/__tests__/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

## Golden Rule: Factories First, Never Inline

EVERY test MUST use generated factories from `__generated__/fabbrica/` or validated input factories from `test-utils/input-factories`.

### ❌ NEVER: Inline Mock Objects

```typescript
// ❌ WRONG - Breaks when schema changes
const account = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  currency: 'USD',
  currentBalance: 10000,
  // ... 15 more fields
};
```

### ✅ ALWAYS: Generated Factories

```typescript
// ✅ CORRECT - Auto-updates with schema
import { AccountFactory } from '../__generated__/fabbrica';

const account = await AccountFactory.build({ name: 'Checking' });
```

---

## Two-Layer Pattern

### Layer 1: Prisma Model Factories (Database Responses)

**Use:** When mocking Prisma queries (service tests)

```typescript
import { InvoiceFactory, ClientFactory } from '../__generated__/fabbrica';

const invoice = await InvoiceFactory.build({
  invoiceNumber: 'INV-001',
  client: await ClientFactory.build({ name: 'Acme Corp' }),
});

mockPrisma.invoice.findFirst.mockResolvedValue(invoice);
```

### Layer 2: Zod Input Factories (API Inputs)

**Use:** When testing API routes with Zod validation

```typescript
import { mockInvoiceInput } from '../../test-utils/input-factories';

const input = mockInvoiceInput({ invoiceNumber: 'INV-002' });
// ✅ Validated against CreateInvoiceSchema
await service.createInvoice(input, CTX);
```

---

## Factory Selection Guide

| Test Type | Use | Example |
|-----------|-----|---------|
| Service test (Prisma response) | Prisma factory | `AccountFactory.build()` |
| Route test (Zod input) | Input factory | `mockTaxRateInput()` |
| Flow test (both) | Both factories | Prisma for response, Input for creation |

---

## Anti-Patterns (BLOCKED by this rule)

❌ **NEVER create inline object literals with >3 properties**
❌ **NEVER define mock constants at module level**
❌ **NEVER bypass factories "just this once"**
❌ **NEVER copy-paste mock data between test files**

---

## Schema Change Workflow

**Old (Broken):**
1. Change Prisma schema
2. Manually update 76 test files
3. Miss some → CI fails
4. Fix remaining → 2-3h wasted

**New (Automatic):**
1. Change Prisma schema
2. Run `npx prisma generate` → factories regenerate
3. TypeScript errors if factory defaults invalid
4. Fix ONE factory default → all tests auto-fix
5. CI passes → 10min total

---

_Auto-loaded for all test files. Enforces factory-first pattern._
```

---

### Task 4.2: Add ESLint Rule for Inline Mock Prevention

**File:** `apps/api/.eslintrc.json`
**What:** Add rule to prevent large object literals in test files
**Depends on:** none
**Success:** ESLint warns on inline mocks

```json
{
  "overrides": [
    {
      "files": ["**/__tests__/**", "**/*.test.ts"],
      "rules": {
        "no-restricted-syntax": [
          "warn",
          {
            "selector": "VariableDeclarator[init.type='ObjectExpression'][init.properties.length > 3]:not(:has(CallExpression[callee.name=/Factory|mock/]))",
            "message": "Large object literals suggest inline mocks. Use factories from __generated__/fabbrica/ or test-utils/input-factories instead."
          }
        ]
      }
    }
  ]
}
```

---

### Task 4.3: Create Test File Template with Factory Usage

**File:** `apps/api/src/test-utils/templates/service.test.template.ts` (NEW)
**What:** Provide template showing correct factory usage
**Depends on:** Task 2.2
**Success:** Template shows both Prisma and input factory patterns

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

// Import generated Prisma factories
import { ResourceFactory } from '../../../../__generated__/fabbrica';

// Import Zod input factories
import { mockResourceInput } from '../../../../test-utils/input-factories';

// Dynamic import for prisma mock
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
    it('should create resource with valid input', async () => {
      const input = mockResourceInput({ name: 'Test' });
      const created = await ResourceFactory.build({ name: input.name });

      mockPrisma.resource.create.mockResolvedValueOnce(created);

      const result = await service.createResource(input, CTX);

      expect(result.name).toBe('Test');
      expect(mockPrisma.resource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: TEST_IDS.TENANT_ID }),
        })
      );
    });
  });
});
```

---

### Task 4.4: Create New Test File Generator Hook

**File:** `.claude/hooks/test-file-create.sh` (NEW)
**What:** Hook that validates new test files use factories
**Depends on:** Task 4.1
**Success:** Blocks commits with inline mocks

```bash
#!/bin/bash
# Validates new test files follow factory-first pattern

NEW_TESTS=$(git diff --cached --name-only --diff-filter=A | grep -E "\.test\.ts$|\.test\.tsx$")

if [ -z "$NEW_TESTS" ]; then
  exit 0
fi

for file in $NEW_TESTS; do
  # Check if file imports factories
  if ! grep -q "Factory\|mockInput\|test-utils" "$file"; then
    echo "❌ Test file missing factory imports: $file"
    echo "New test files MUST use:"
    echo "  - Prisma factories: import { ModelFactory } from '../__generated__/fabbrica'"
    echo "  - Input factories: import { mockInput } from '../../test-utils/input-factories'"
    echo ""
    echo "See: apps/api/src/test-utils/templates/service.test.template.ts"
    exit 1
  fi

  # Check for inline object literals (5+ properties)
  if grep -E "const.*=.*\{[^}]*id:.*name:.*type:.*currency:" "$file"; then
    echo "⚠️  Possible inline mock in: $file"
    echo "Use factories instead of inline objects"
  fi
done
```

---

### Task 4.5: Update Test Conventions Documentation

**File:** `.claude/rules/test-conventions.md`
**What:** Add schema-driven factory section, update anti-patterns
**Depends on:** Task 4.1
**Success:** Rule documents factory-first pattern

Add section:
```markdown
## Schema-Driven Factories (MANDATORY)

All tests MUST use generated factories or validated input factories.

### Prisma Model Factories (Auto-Generated)

```typescript
import { TaxRateFactory, AccountFactory } from '../__generated__/fabbrica';

const taxRate = await TaxRateFactory.build({ rateBasisPoints: 500 });
const account = await AccountFactory.build({ name: 'Checking' });
```

### Zod Input Factories (Validated)

```typescript
import { mockTaxRateInput, mockInvoiceInput } from '../../test-utils/input-factories';

const input = mockTaxRateInput({ code: 'HST' });
// Validated against CreateTaxRateSchema automatically
```

### Why This Matters

FIN-32 changed `TaxRate.rate` → `rateBasisPoints`:
- **With inline mocks:** 76 test files broke
- **With factories:** Run `npx prisma generate`, 0 test files broke
```

---

## Phase 5: Test Migration - Prove Pattern (1h)

### Task 5.1: Migrate One Service Test (Proof of Concept)

**File:** `apps/api/src/domains/accounting/__tests__/tax-rate.service.test.ts`
**What:** Migrate from manual mocks to TaxRateFactory
**Depends on:** Task 2.2
**Success:** Test uses factory, 0 TS errors, all assertions pass

**Before/After:**
```typescript
// ❌ BEFORE
const mockTaxRate = {
  id: 'tax-1',
  code: 'GST',
  rate: 5, // Wrong field!
  // ... 12 fields
};

// ✅ AFTER
import { TaxRateFactory } from '../__generated__/fabbrica';
const taxRate = await TaxRateFactory.build({ code: 'GST', rateBasisPoints: 500 });
```

---

### Task 5.2: Migrate One Route Test (Proof of Concept)

**File:** `apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts`
**What:** Migrate to use mockTaxRateInput for Zod validation
**Depends on:** Task 1.5
**Success:** Test uses input factory, validates against schema

---

### Task 5.3: Document Proven Pattern

**File:** `docs/plans/2026-02-28-hybrid-test-factory-architecture.md` (this file)
**What:** Update plan with actual migration patterns from Tasks 5.1-5.2
**Depends on:** Tasks 5.1, 5.2
**Success:** Plan shows real before/after from codebase

---

## Phase 6: Batch Migration (4-6h via Task Agent)

### Task 6.1: Create Migration Script

**File:** `.claude/scripts/migrate-test-to-factories.js` (NEW)
**What:** Automated migration script to replace common inline patterns
**Depends on:** Task 5.3
**Success:** Script can migrate simple cases automatically

```javascript
/**
 * Migrate test files from inline mocks to factories
 *
 * Usage: node .claude/scripts/migrate-test-to-factories.js <test-file>
 */
const fs = require('fs');
const path = require('path');

const INLINE_PATTERNS = {
  // Match: const account = { id: 'acc-1', name: 'Test', ... }
  account: /const\s+(\w+)\s*=\s*\{\s*id:.*name:.*type:.*currency:/g,
  invoice: /const\s+(\w+)\s*=\s*\{\s*id:.*clientId:.*invoiceNumber:/g,
  // ... more patterns
};

const REPLACEMENTS = {
  account: (varName) => `const ${varName} = await AccountFactory.build();`,
  invoice: (varName) => `const ${varName} = await InvoiceFactory.build();`,
};

// Script implementation...
```

---

### Task 6.2: Migrate High-Priority Test Files

**Files:** 20 most-used test files (banking, invoicing, accounting core)
**What:** Apply migration pattern from Task 5.1-5.2 to critical tests
**Depends on:** Task 5.3
**Review:** `kieran-typescript-reviewer` (verify type safety)
**Success:** 20 files use factories, tests passing

**Strategy:**
1. Run migration script on each file
2. Manual review of generated changes
3. Fix edge cases script couldn't handle
4. Verify tests pass

**Test files to prioritize:**
```
apps/api/src/domains/invoicing/services/__tests__/invoice.service.test.ts
apps/api/src/domains/invoicing/services/__tests__/bill.service.test.ts
apps/api/src/domains/accounting/services/__tests__/journal-entry.service.test.ts
apps/api/src/domains/banking/services/__tests__/account.service.test.ts
apps/api/src/domains/banking/services/__tests__/transaction.service.test.ts
... (15 more core files)
```

---

### Task 6.3: Batch Migrate Remaining Test Files

**Files:** Remaining ~104 test files (lower priority, simpler)
**What:** Use Task agent to systematically migrate all remaining tests
**Depends on:** Task 6.2
**Success:** All 154 test files use factories

**Delegation to Task Agent:**
```
Task: Migrate test files to use prisma-fabbrica factories

Pattern proven in tasks 5.1-5.2 and applied to 20 files in task 6.2.

Apply to remaining 104 test files:
1. Replace inline object literals with Factory.build() calls
2. Import factories from __generated__/fabbrica/
3. Use input factories from test-utils/input-factories for Zod inputs
4. Verify tests pass after migration

Files: [list remaining 104 test files]
```

---

## Phase 7: Documentation & Onboarding (1-2h)

### Task 7.1: Create Test Writing Guide

**File:** `apps/api/src/test-utils/README.md` (NEW)
**What:** Comprehensive guide for writing new tests
**Depends on:** Task 4.3
**Success:** Clear guide with examples

```markdown
# Test Writing Guide

## Quick Start

```typescript
// 1. Import factories
import { AccountFactory, InvoiceFactory } from '../__generated__/fabbrica';
import { mockInvoiceInput, TEST_IDS } from '../../test-utils';

// 2. Build Prisma mocks (service test)
const account = await AccountFactory.build({ name: 'Checking' });
mockPrisma.account.findFirst.mockResolvedValue(account);

// 3. Build API inputs (route test)
const input = mockInvoiceInput({ invoiceNumber: 'INV-100' });
await service.createInvoice(input, CTX);
```

## Available Factories

### Prisma Model Factories (47 models)
- AccountFactory, TransactionFactory, TransferFactory
- InvoiceFactory, BillFactory, ClientFactory, VendorFactory
- GLAccountFactory, JournalEntryFactory, TaxRateFactory
- ... [all 47 models]

### Input Factories
- mockAccountInput(), mockTransactionInput()
- mockInvoiceInput(), mockBillInput()
- mockTaxRateInput(), mockGLAccountInput()

## Creating New Factories

Prisma factories are auto-generated. For new input factories:

```typescript
// In test-utils/input-factories.ts
import { createInputFactory } from './zod-input-factories';
import { CreateResourceSchema } from '../domains/resource/schemas/resource.schema';

export const mockResourceInput = createInputFactory(CreateResourceSchema, {
  name: 'Default Resource',
  amount: 10000,
});
```

## Traits & Variants

prisma-fabbrica supports traits for common variations:

```typescript
// Define trait in schema.prisma
/// @factory-trait canadian { jurisdiction: 'Canada' }
model TaxRate { ... }

// Use in test
const gst = await TaxRateFactory.use('canadian').build({ code: 'GST' });
```
```

---

### Task 7.2: Create Pre-Commit Hook for Test Validation

**File:** `.claude/hooks/test-factory-enforce.sh` (NEW)
**What:** Validate test files on commit use factories
**Depends on:** Task 4.4
**Success:** Blocks commits with inline mocks

```bash
#!/bin/bash
# Enforces factory usage in test files

STAGED_TESTS=$(git diff --cached --name-only | grep -E "\.test\.ts$|\.test\.tsx$")

if [ -z "$STAGED_TESTS" ]; then
  exit 0
fi

VIOLATIONS=0

for file in $STAGED_TESTS; do
  # Check for inline object patterns (heuristic)
  if grep -qE "const.*=.*\{.*id:.*name:.*type:.*amount:" "$file"; then
    echo "⚠️  Possible inline mock in: $file"
    echo "   Use Factory.build() from __generated__/fabbrica/"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  # Check if file imports factories
  if git diff --cached "$file" | grep -q "^+.*describe\|^+.*it(" && \
     ! git diff --cached "$file" | grep -q "Factory\|mockInput\|test-utils"; then
    echo "❌ Test file missing factory imports: $file"
    echo "   Import from: __generated__/fabbrica/ or test-utils/"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo "Fix violations or run 'git commit --no-verify' to bypass (not recommended)"
  exit 1
fi
```

---

### Task 7.3: Add Test Architecture Review Agent

**File:** `.claude/agents/test-architecture-reviewer.md` (NEW)
**What:** Specialized agent to review test files for factory usage
**Depends on:** Task 4.1
**Success:** Agent available in /processes:review

```markdown
# Test Architecture Reviewer

Reviews test files to ensure compliance with schema-driven factory pattern.

## What This Agent Checks

1. **Factory Usage**
   - All Prisma mocks use factories from `__generated__/fabbrica/`
   - All API inputs use factories from `test-utils/input-factories`
   - No inline object literals with >3 properties

2. **Import Hygiene**
   - Factories imported from correct locations
   - No deprecated mock functions (mockAccount → AccountFactory)

3. **Type Safety**
   - Mock data matches current Prisma/Zod types
   - No `as any` casts to bypass type errors

4. **Minimal Specification**
   - Tests only override fields relevant to test case
   - No unnecessary field specifications

## Violations Flagged

- ❌ Inline mock objects
- ❌ Module-level mock constants
- ❌ Deprecated factory usage
- ❌ Over-specification (setting all fields when only 2 matter)

## Auto-Fix Suggestions

Agent provides migration patterns:
```typescript
// Found inline mock → Suggests factory
// Before: const account = { id, name, type, /* 15 fields */ }
// After: const account = await AccountFactory.build({ name })
```
```

---

## Phase 8: Continuous Maintenance (Ongoing)

### Task 8.1: Add Factory Generation to CI

**File:** `.github/workflows/test.yml` or equivalent
**What:** Auto-generate factories in CI to catch schema drift
**Depends on:** Task 1.3
**Success:** CI fails if factories out of sync

```yaml
- name: Generate Prisma Factories
  run: |
    cd packages/db
    npx prisma generate

- name: Check for Factory Drift
  run: |
    git diff --exit-code apps/api/src/__generated__/fabbrica/
    if [ $? -ne 0 ]; then
      echo "❌ Factories out of sync. Run 'npx prisma generate' locally."
      exit 1
    fi
```

---

### Task 8.2: Monthly Factory Audit

**File:** `.claude/scripts/audit-factory-usage.sh` (NEW)
**What:** Script to find test files not using factories
**Depends on:** none
**Success:** Reports factory adoption metrics

```bash
#!/bin/bash
# Audits test files for factory usage

TOTAL_TESTS=$(find apps/api/src -name "*.test.ts" | wc -l)
USING_FACTORIES=$(grep -r "Factory\|mockInput" apps/api/src --include="*.test.ts" | cut -d: -f1 | sort -u | wc -l)

ADOPTION=$((USING_FACTORIES * 100 / TOTAL_TESTS))

echo "Factory Adoption: $USING_FACTORIES/$TOTAL_TESTS files ($ADOPTION%)"

if [ $ADOPTION -lt 90 ]; then
  echo "⚠️  Target: 90%+ adoption. Current: $ADOPTION%"
  find apps/api/src -name "*.test.ts" -exec sh -c '
    if ! grep -q "Factory\|mockInput" "$1"; then
      echo "  - $1"
    fi
  ' sh {} \; | head -20
fi
```

---

## Edge Cases

### Case 1: Tests Need Partial Data

**Problem:** Some tests intentionally test with missing fields

**Solution:** Use `.buildWithDefaults()` and `Partial<T>` type
```typescript
const partialAccount = await AccountFactory.buildWithDefaults({
  name: 'Test', // Only this field
  // All other fields: faker-generated defaults
}) as Partial<Account>;
```

---

### Case 2: Complex Nested Relations

**Problem:** Invoice with client, lines, tax rates all nested

**Solution:** Use fabbrica's association pattern
```typescript
const invoice = await InvoiceFactory.build({
  client: await ClientFactory.build({ name: 'Acme' }),
  invoiceLines: await InvoiceLineFactory.buildList(3, {
    taxRate: await TaxRateFactory.build({ rateBasisPoints: 500 }),
  }),
});
```

---

### Case 3: Tests Asserting Specific Field Values

**Problem:** Test needs `createdAt: specificDate` for assertions

**Solution:** Override in factory call
```typescript
const specificDate = new Date('2026-01-15');
const account = await AccountFactory.build({ createdAt: specificDate });

expect(account.createdAt).toEqual(specificDate); // Works!
```

---

### Case 4: Legacy Tests During Migration

**Problem:** Can't migrate all 154 files at once

**Solution:** Backward-compatible wrappers in mock-factories.ts
```typescript
export async function mockAccount(overrides = {}) {
  return AccountFactory.build(overrides); // Wraps new factory
}
// Old imports still work during migration
```

---

## Domain Impact

**Primary Domains:**
- Testing infrastructure (cross-cutting)
- All domains (banking, invoicing, accounting, AI, etc.)

**Adjacent Systems:**
- CI/CD (factory generation step)
- Developer onboarding (test writing guide)
- Code review (test-architecture-reviewer agent)

---

## Testing Strategy

### Validate Factory Generation

```bash
cd packages/db
npx prisma generate
ls -la ../../apps/api/src/__generated__/fabbrica/
# Should have index.ts with 47 factory exports
```

### Validate Zod Input Factories

```typescript
// Test that factory output validates
it('should produce valid input', () => {
  const input = mockTaxRateInput();
  const result = CreateTaxRateSchema.safeParse(input);
  expect(result.success).toBe(true);
});
```

### Regression Testing

After migration:
```bash
npm run test # All 2000+ tests should pass
npx tsc --noEmit # 0 TypeScript errors
```

---

## Review Agent Coverage

| Task | Agents | Why |
|------|--------|-----|
| 5.1-5.2 | `kieran-typescript-reviewer` | Verify type safety in migrated tests |
| 6.2 | `test-architecture-reviewer` | Verify factory usage compliance |
| 6.3 | `architecture-strategist` | Validate pattern consistency |

---

## Success Criteria

- [ ] `@quramy/prisma-fabbrica` installed and configured
- [ ] 47 Prisma model factories auto-generated
- [ ] Zod input factories created for 20+ common API operations
- [ ] `data-export.service.test.ts` migrated (76 errors fixed)
- [ ] `server-components.test.tsx` migrated (7 errors fixed)
- [ ] 20 high-priority test files migrated (Phase 6.2)
- [ ] All 154 test files migrated to factories (Phase 6.3)
- [ ] ESLint rule prevents new inline mocks
- [ ] Pre-commit hook validates factory usage
- [ ] Test-architecture-reviewer agent created
- [ ] Test writing guide complete
- [ ] 0 TypeScript errors across apps
- [ ] All 2000+ tests passing
- [ ] Factory adoption rate >95%

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| Setup (1-2) | LOW | Well-established library, official Prisma docs |
| Enforcement (4) | LOW | Warnings only, doesn't break existing code |
| High-impact migration (3) | MEDIUM | Migrate 1 file at a time, verify tests |
| Batch migration (6) | HIGH | Prove pattern first, use agent for bulk |

**Overall Risk:** MEDIUM - Large-scale change but incremental approach with validation at each step

---

## Timeline (Phased Rollout)

### Week 1: Foundation (6-8h)
- **Day 1:** Tasks 1.1-1.5 (Setup + infrastructure)
- **Day 2:** Tasks 2.1-2.3 (Factory structure)
- **Day 3:** Tasks 3.1-3.3 (Fix critical errors)
- **Day 4:** Tasks 4.1-4.5 (Enforcement + docs)

### Week 2: Migration (4-6h)
- **Day 5:** Tasks 5.1-5.3 (Prove pattern)
- **Day 6-7:** Task 6.1-6.2 (High-priority 20 files)
- **Day 8:** Task 6.3 (Batch remaining files via agent)

### Week 3: Validation & Rollout (2h)
- **Day 9:** Task 7.1-7.3 (Documentation)
- **Day 10:** Task 8.1-8.2 (CI + audit)
- **Day 11:** Final validation, team training

**Total: 12-16h over 2-3 weeks** (can parallelize some tasks)

---

## Rollback Plan

If critical issues discovered mid-migration:

1. **Before Phase 6:** Revert generator config, remove fabbrica
2. **During Phase 6:** Keep both patterns (legacy + new) until validation complete
3. **After Phase 6:** Point of no return - migrate forward only

**Safety Net:** Backward-compatible wrappers allow gradual migration without breaking working tests.

---

## Long-Term Benefits

| Benefit | Current | After | Savings |
|---------|---------|-------|---------|
| Schema change test updates | 76 files, 2-3h | 1 factory, 10min | 2-3h per change |
| New test file creation | 30min (manual mocks) | 5min (import factory) | 25min per test |
| Test maintenance | Manual field updates | Auto-sync with schema | 10-15h/year |
| Type safety in tests | Partial (many `as any`) | Complete (factory types) | Fewer bugs |
| Developer onboarding | "Copy existing test" (wrong pattern) | Follow template | Cleaner codebase |

**Annual ROI:** 30-45h/year saved in test maintenance

---

## Reference Files

**Existing Patterns:**
- `apps/api/src/test-utils/mock-factories.ts` - Current manual factories
- `apps/api/src/test-utils/prisma-mock.ts` - Centralized Prisma mock
- `apps/api/src/domains/accounting/__tests__/tax-rate.service.test.ts` - Well-structured service test

**Schema Sources:**
- `packages/db/prisma/schema.prisma` - 47 models to generate factories for
- `apps/api/src/domains/*/schemas/*.schema.ts` - Zod schemas for input validation

**Community Examples:**
- [prisma-fabbrica documentation](https://github.com/Quramy/prisma-fabbrica)
- [Prisma testing guide](https://www.prisma.io/docs/guides/testing/unit-testing)
- [Factory pattern tutorial](https://quramy.medium.com/test-your-prisma-app-part-2-prisma-fabbrica-test-data-factory-utility-89f8f4c36302)

---

## Key Decisions

### Decision 1: Why Hybrid (Prisma + Zod)?

**Alternatives Considered:**
1. **Only @anatine/zod-mock** - Runtime generation, doesn't cover Prisma types
2. **Only prisma-fabbrica** - Auto-generates Prisma, manual Zod
3. **Manual factories** - Full control, high maintenance
4. **Hybrid (CHOSEN)** - Best of both worlds

**Rationale:**
- Prisma responses need Prisma types (fabbrica provides)
- API inputs need Zod validation (input-factories provide)
- Neither library alone covers both use cases
- Hybrid approach: 80% auto-generated, 20% validated

**Trade-offs:**
- ✅ Automatic Prisma factory sync
- ✅ Zod validation on inputs
- ⚠️ Two systems to maintain (but both are lightweight)
- ⚠️ Learning curve for new developers (mitigated by templates)

---

### Decision 2: Output Path for Generated Factories

**Chosen:** `apps/api/src/__generated__/fabbrica/`

**Alternatives:**
- `packages/db/src/__generated__/` - Would need exporting from db package
- `apps/api/src/test-utils/__generated__/` - Nested too deep

**Rationale:**
- Tests are in API app, factories should be close
- `__generated__` prefix makes it clear it's auto-generated (don't edit)
- Outside test-utils prevents accidental production imports

---

### Decision 3: Migration Strategy (Incremental vs Big Bang)

**Chosen:** Incremental (Week 1: Setup, Week 2: Migrate, Week 3: Validate)

**Alternative:** Big bang (migrate all 154 files in one PR)

**Rationale:**
- 154 test files too risky for single PR
- Incremental allows validation at each step
- Backward-compatible wrappers keep old tests working
- Can pause migration if issues discovered

---

## Progress Tracking

### Phase 1: Setup ✅ Ready
- [ ] Task 1.1: Install prisma-fabbrica
- [ ] Task 1.2: Configure generator
- [ ] Task 1.3: Generate factories
- [ ] Task 1.4: Create Zod utility
- [ ] Task 1.5: Create input factories

### Phase 2: Factories
- [ ] Task 2.1: Deprecate manual factories
- [ ] Task 2.2: Create re-exports
- [ ] Task 2.3: Migration guide

### Phase 3: High-Impact
- [ ] Task 3.1: Fix data-export.service.test.ts (76 errors)
- [ ] Task 3.2: Fix server-components.test.tsx (7 errors)
- [ ] Task 3.3: Update legacy factories

### Phase 4: Enforcement
- [ ] Task 4.1: Test architecture rule
- [ ] Task 4.2: ESLint rule
- [ ] Task 4.3: Test template
- [ ] Task 4.4: Hook for new files
- [ ] Task 4.5: Update test-conventions.md

### Phase 5: Prove Pattern
- [ ] Task 5.1: Migrate service test
- [ ] Task 5.2: Migrate route test
- [ ] Task 5.3: Document pattern

### Phase 6: Batch Migration
- [ ] Task 6.1: Create migration script
- [ ] Task 6.2: Migrate 20 high-priority files
- [ ] Task 6.3: Batch remaining 104 files (agent)

### Phase 7: Documentation
- [ ] Task 7.1: Test writing guide
- [ ] Task 7.2: Pre-commit hook
- [ ] Task 7.3: Test architecture reviewer agent

### Phase 8: CI & Monitoring
- [ ] Task 8.1: CI factory generation
- [ ] Task 8.2: Monthly audit script

---

## Post-Migration Validation

After completing all tasks:

```bash
# Verify factory coverage
node .claude/scripts/audit-factory-usage.sh
# Expected: >95% adoption

# Verify test health
npm run test
# Expected: All passing

# Verify type safety
npx tsc --noEmit
# Expected: 0 errors

# Verify lint compliance
npx eslint apps/api/src/**/*.test.ts
# Expected: 0 inline mock warnings
```

---

## Future Enhancements

1. **Snapshot Testing:** Use factories to generate snapshots
2. **Performance Benchmarks:** Compare factory generation speed
3. **Trait Library:** Common traits for canadian/us tax rates, etc.
4. **Visual Regression:** Extend pattern to frontend component tests

---

_Created: 2026-02-28. Comprehensive plan for schema-driven test architecture._
_Estimated effort: 12-16h over 2-3 weeks._
_ROI: 30-45h/year savings in test maintenance._
