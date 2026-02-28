# TypeScript Errors Root Cause Fixes

**Created:** 2026-02-28
**Status:** PENDING APPROVAL
**Effort:** 2.5-3h
**Priority:** Critical (blocks compilation)

---

## Problem Statement

113 TypeScript compilation errors detected across both apps, despite MEMORY.md claiming "TS Errors: 0".

**Root Cause:** Incomplete follow-through on FIN-32 tax rate migration + test drift + type system strictness.

---

## Error Categories & Root Causes

| Category | Count | Root Cause | Files Affected |
|----------|-------|------------|----------------|
| 1. Tax Rate Migration | 25 | Frontend uses `.rate` instead of `.rateBasisPoints` | 5 web files |
| 2. Flow Test Schemas | 9 | Tests pass `entityId` (not in schema), omit `taxAmount` (required) | 2 test files |
| 3. BullMQ Event Types | 17 | Queue event signatures don't match BullMQ v5 QueueListener | 2 API files |
| 4. Test Mock Types | 76 | Mock `.calls` tuple destructuring errors | 1 test file |
| 5. ESM Import Extensions | 6 | Missing `.js` extensions for node16 module resolution | 6 test files |
| 6. Misc Type Issues | 10 | Null handling, type assertions, unknown types | 6 files |
| **TOTAL** | **113** | | **22 files** |

---

## Phase 1: Tax Rate Migration Root Cause Fix

**Root Cause:** FIN-32 migration changed backend to use `rateBasisPoints` (Int) but frontend still references `.rate` (Float, removed from SELECT).

**The Problem:**
- Database has BOTH `rate` (Float, deprecated) and `rateBasisPoints` (Int, active)
- Backend TAX_RATE_SELECT only includes `rateBasisPoints`
- Prisma-generated types only have `rateBasisPoints`
- Frontend components still reference `.rate` → TypeScript error

**Root Cause Fix (NOT Band-Aid):**

### Step 1.1: Create Shared Tax Utility (`apps/web/src/lib/utils/tax.ts`)

```typescript
/**
 * Tax rate utilities for basis points ↔ percentage conversion
 *
 * Following integer-based financial data standard:
 * - Database/API: basis points (500 = 5%)
 * - User display: percentage (5%)
 * - Form input: percentage → converted to BP before API call
 */

/**
 * Format basis points as percentage string for display
 *
 * @param basisPoints - Tax rate in basis points (500 = 5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * formatTaxRate(500) // "5.00%"
 * formatTaxRate(1300) // "13.00%"
 * formatTaxRate(725) // "7.25%"
 */
export function formatTaxRate(basisPoints: number, decimals: number = 2): string {
  const percentage = basisPoints / 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Convert percentage to basis points for API submission
 *
 * @param percentage - Tax rate as percentage (5 = 5%)
 * @returns Basis points (500)
 *
 * @example
 * percentToBasisPoints(5) // 500
 * percentToBasisPoints(13) // 1300
 * percentToBasisPoints(7.25) // 725
 */
export function percentToBasisPoints(percentage: number): number {
  return Math.round(percentage * 100);
}

/**
 * Convert basis points to percentage number (for form inputs)
 *
 * @param basisPoints - Tax rate in basis points (500 = 5%)
 * @returns Percentage as number (5)
 *
 * @example
 * basisPointsToPercent(500) // 5
 * basisPointsToPercent(1300) // 13
 */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
}
```

**Verification:** Utility follows same pattern as `currency.ts` (shared, tested, type-safe)

---

### Step 1.2: Update Tax Rate Display Components

**Files to fix:**

1. **`apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-client.tsx:109`**
   - Error: `Property 'rate' does not exist on type 'TaxRate'`
   - Root cause fix: Use `formatTaxRate(rate.rateBasisPoints)`

2. **`apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-empty.tsx:80,87,94,101`**
   - Error: `'rate' does not exist in type 'PresetRate'`
   - Root cause fix: Change preset objects to use `rateBasisPoints: 500` (not `rate: 0.05`)

3. **`apps/web/src/components/line-item-builder.tsx:214`**
   - Error: `Property 'rateBasisPoints' does not exist on type 'TaxRateOption'`
   - Root cause fix: Update type definition to include `rateBasisPoints`, use `formatTaxRate()` for display

**Pattern:**
```typescript
// ❌ BEFORE (band-aid)
<TableCell>{rate.rate}%</TableCell>

// ✅ AFTER (root cause)
import { formatTaxRate } from '@/lib/utils/tax';
<TableCell>{formatTaxRate(rate.rateBasisPoints)}</TableCell>
```

---

### Step 1.3: Update Tax Rate Input Forms

**Files to fix:**

1. **`apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rate-sheet.tsx`** (if exists)
   - Root cause fix: Use `basisPointsToPercent()` for display, `percentToBasisPoints()` for submission

**Pattern:**
```typescript
import { basisPointsToPercent, percentToBasisPoints } from '@/lib/utils/tax';

// Display: BP → %
<Input
  type="number"
  value={basisPointsToPercent(formData.rateBasisPoints)}
  onChange={e => setFormData({
    ...formData,
    rateBasisPoints: percentToBasisPoints(parseFloat(e.target.value) || 0)
  })}
/>
```

---

### Step 1.4: Update Report Components

**Files to fix:**

1. **`apps/web/src/app/(dashboard)/accounting/reports/revenue/revenue-report-view.tsx:164`**
   - Error: `Property 'name' does not exist on type 'RevenueClient'`
   - Root cause: API response type missing `name` field
   - Fix: Check API response shape, update type definition OR add fallback

2. **`apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx:274`**
   - Error: `Property 'name' does not exist on type 'SpendingCategory'`
   - Root cause: API response type missing `name` field
   - Fix: Check API response shape, update type definition OR add fallback

**Action:** Investigate actual API response structure for these report endpoints before fixing.

---

## Phase 2: Flow Test Schema Fixes

**Root Cause:** Tests written before schema validation was strict, pass fields not in Zod schema, omit required fields.

### Step 2.1: Remove `entityId` from Bill/Invoice Creation Tests

**Files to fix:**

1. **`apps/api/src/domains/__tests__/flows/bill-lifecycle.flow.test.ts:144,185,215`**
   - Error: `'entityId' does not exist in type CreateBillInput`
   - Root cause: `CreateBillSchema` derives `entityId` from tenant context, NOT from payload
   - Fix: Remove `entityId` from test mock objects

2. **`apps/api/src/domains/__tests__/flows/invoice-lifecycle.flow.test.ts:271`**
   - Error: `'entityId' does not exist in type CreateInvoiceInput`
   - Root cause: Same as bill - `entityId` derived from context
   - Fix: Remove `entityId` from test mock objects

**Pattern:**
```typescript
// ❌ BEFORE
const billData = {
  entityId: TEST_IDS.ENTITY_ID, // Not in schema!
  vendorId: vendor.id,
  billNumber: 'BILL-001',
  // ...
};

// ✅ AFTER
const billData = {
  // entityId derived from tenant context, not payload
  vendorId: vendor.id,
  billNumber: 'BILL-001',
  // ...
};
```

---

### Step 2.2: Add Required `taxAmount` to Invoice/Bill Lines

**Files to fix:**

1. **`apps/api/src/domains/__tests__/flows/invoice-lifecycle.flow.test.ts:315,339`**
   - Error: `Property 'taxAmount' is missing in type`
   - Root cause: `InvoiceLineSchema` REQUIRES `taxAmount` (line 17 of invoice.schema.ts)
   - Fix: Add `taxAmount: 0` to all line item mocks (or calculate based on taxRateId if present)

**Pattern:**
```typescript
// ❌ BEFORE
lines: [
  {
    description: 'Service',
    quantity: 1,
    unitPrice: 10000,
    amount: 10000,
    // Missing taxAmount!
  }
]

// ✅ AFTER
lines: [
  {
    description: 'Service',
    quantity: 1,
    unitPrice: 10000,
    amount: 10000,
    taxAmount: 0, // Required field
  }
]
```

---

## Phase 3: BullMQ Event Listener Type Fixes

**Root Cause:** BullMQ v5 QueueListener type signature doesn't match our event handler signatures.

### Step 3.1: Investigate BullMQ Queue Event Types

**Files affected:**
- `apps/api/src/domains/ai/routes/jobs.ts:165-167`
- `apps/api/src/domains/ai/routes/__tests__/jobs.routes.test.ts` (multiple errors)

**Action:**
1. Check BullMQ version: `grep "bullmq" apps/api/package.json`
2. Read BullMQ v5 type definitions for `Queue.on()` method
3. Update event handler signatures to match

**Likely fix pattern:**
```typescript
// Current (broken)
queue.on('progress', onProgress); // onProgress signature wrong
queue.on('completed', onCompleted);

// Need to match BullMQ QueueListener<T> signature
// Check: node_modules/bullmq/dist/esm/classes/queue-listener.d.ts
```

**Deferred to implementation:** Exact types depend on BullMQ version installed.

---

### Step 3.2: Fix SSE Test Mock Types

**Files to fix:**
- `apps/api/src/domains/ai/routes/__tests__/jobs.routes.test.ts:85,89,111,114,123,127,134,172,175`

**Errors:**
- `'simulateError' does not exist in type 'InjectOptions'`
- `Property 'statusCode' does not exist on type 'void & Promise<Response> & Chain'`

**Root Cause:** Test is trying to pass custom properties to Fastify inject that don't exist in types.

**Fix:** Remove `simulateError` property, fix response type assertions.

---

## Phase 4: Test Mock Type Fixes

**Root Cause:** Vitest mock `.calls` returns `Array<[args]>` (array of tuples), but code destructures as flat array.

### Step 4.1: Fix Data Export Service Test Mock Calls

**File:** `apps/api/src/domains/system/services/__tests__/data-export.service.test.ts`

**Errors:** 76 errors like:
```
Type 'any[]' is not assignable to type '[unknown, { name: string; }]'.
Target requires 2 element(s) but source may have fewer.
```

**Root Cause:**
```typescript
// Mock call signature: Array<[args1, args2]>
const calls = mockPrisma.account.findMany.mock.calls;

// Code tries to destructure tuples
const accountsCall = calls.find((call: [unknown, { name: string }]) => ...);
// BUT calls is any[][], not [unknown, { name: string }][]
```

**Fix:** Proper type assertion for mock calls:
```typescript
// ✅ Correct tuple destructuring
const calls = mockPrisma.account.findMany.mock.calls as Array<[unknown, { where: { name: string } }]>;
const accountsCall = calls.find(([, args]) => args.where?.name === 'Accounts');
```

OR use indexed access:
```typescript
const accountsCall = mockPrisma.account.findMany.mock.calls.find(
  (call) => call[1]?.where?.name === 'Accounts'
);
```

---

## Phase 5: ESM Import Extension Fixes

**Root Cause:** TypeScript `moduleResolution: "node16"` requires explicit `.js` extensions for relative imports in ESM mode.

### Step 5.1: Add `.js` Extensions to Test Imports

**Files to fix:**

1. `apps/api/src/domains/system/services/__tests__/entity.service.test.ts:16`
2. `apps/api/src/domains/vendors/services/__tests__/vendor.service.test.ts:12`
3. `apps/api/src/lib/__tests__/ai-data-retention.test.ts:17`
4. `apps/api/src/lib/__tests__/audit.test.ts:18`
5. `apps/api/src/middleware/__tests__/tenant.test.ts:8`

**Pattern:**
```typescript
// ❌ BEFORE
import { mockPrisma } from '../../../../test-utils/prisma-mock';

// ✅ AFTER
import { mockPrisma } from '../../../../test-utils/prisma-mock.js';
```

**Note:** Only needed for relative imports in test files with node16 module resolution.

---

## Phase 6: Misc Type Fixes

### Step 6.1: Journal Entry Service Null Handling

**File:** `apps/api/src/domains/accounting/services/journal-entry.service.ts:554`

**Error:** `Type 'string | null' is not assignable to type 'string'`

**Root Cause:** Field can be null but code assigns to non-nullable type.

**Fix:** Add null check or make target type nullable:
```typescript
// Option 1: Null check
if (value !== null) {
  target = value;
}

// Option 2: Nullable type
target: string | null = value;
```

---

### Step 6.2: Prisma Observer Type Assertion

**File:** `apps/api/src/lib/prisma-observer.ts:200`

**Error:** `Argument of type '"query"' is not assignable to parameter of type 'never'`

**Root Cause:** Prisma event type union is resolving to `never` (type system issue).

**Fix:** Explicit type assertion or check Prisma event types:
```typescript
// Likely fix
prisma.$on('query' as any, handler);

// OR investigate why event type is 'never'
```

---

### Step 6.3: CSRF Middleware Query Type

**File:** `apps/api/src/middleware/csrf.ts:55`

**Error:** `'request.query' is of type 'unknown'`

**Root Cause:** Fastify request.query is `unknown` by default, needs type assertion.

**Fix:**
```typescript
const query = request.query as { _csrf?: string };
const csrfToken = query._csrf;
```

---

### Step 6.4: Consent Gate Test Fixes

**File:** `apps/api/src/middleware/__tests__/consent-gate.test.ts`

**Errors:**
- Line 17: `Argument of type '""' is not assignable to parameter of type 'GetterSetter<...>'`
- Line 34: `Cannot find name 'afterEach'`
- Lines 109, 152, 204: `Cannot find name 'FastifyRequest'`, `Cannot find name 'ConsentFeature'`

**Root Cause:** Missing imports and type definitions.

**Fix:**
```typescript
// Add missing imports
import { afterEach } from 'vitest';
import type { FastifyRequest } from 'fastify';
import type { ConsentFeature } from '../path/to/types';
```

---

### Step 6.5: RBAC Test Invalid Enum

**File:** `apps/api/src/middleware/__tests__/rbac.test.ts:166,179`

**Error:** `Type '"MANAGER"' is not assignable to type TenantUserRole`

**Root Cause:** Test uses `"MANAGER"` role which doesn't exist in `TenantUserRole` enum.

**Fix:** Use valid role from enum:
```typescript
// Check valid roles in packages/db/prisma/schema.prisma
enum TenantUserRole {
  OWNER
  ADMIN
  ACCOUNTANT
  BOOKKEEPER
  INVESTOR
  ADVISOR
}

// Fix test to use ADMIN instead of MANAGER
role: 'ADMIN' as TenantUserRole
```

---

### Step 6.6: Web App Test Fixes

**Files:**
- `apps/web/src/app/(dashboard)/__tests__/loading-states.test.tsx:101` - Set iterator needs `--downlevelIteration`
- `apps/web/src/components/dashboard/__tests__/server-components.test.tsx` - entity.type string vs enum mismatch
- `apps/web/src/lib/api/__tests__/client-browser.test.ts` - top-level await, window type issues
- `apps/web/src/lib/api/__tests__/transactions.test.ts:44` - null not assignable to string | undefined

**Action:** Fix each individually after understanding context.

---

## Verification Steps

After each phase:

1. **Compile check:** `cd apps/api && npx tsc --noEmit`
2. **Compile check:** `cd apps/web && npx tsc --noEmit`
3. **Run affected tests:** `npx vitest run [test-file]`
4. **Commit:** Clean commit per phase with passing tests

---

## Success Criteria

- [ ] 0 TypeScript errors in `apps/api`
- [ ] 0 TypeScript errors in `apps/web`
- [ ] All existing tests passing
- [ ] Shared `tax.ts` utility created and documented
- [ ] No inline conversion logic (all use utilities)
- [ ] MEMORY.md updated with learnings (if new patterns discovered)

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| Tax utilities | LOW | Following existing currency.ts pattern |
| Flow tests | LOW | Isolated to test files, no prod code |
| BullMQ types | MEDIUM | Need to verify BullMQ version compatibility |
| Mock types | LOW | Test-only changes |
| Import extensions | LOW | Mechanical find/replace |
| Misc fixes | MEDIUM | Each fix needs individual analysis |

**Overall Risk:** LOW-MEDIUM (mostly isolated changes, TypeScript will catch regressions)

---

## Timeline

| Phase | Estimated Time |
|-------|----------------|
| 1. Tax utilities + frontend | 45min |
| 2. Flow test schemas | 20min |
| 3. BullMQ types | 30min |
| 4. Mock types | 20min |
| 5. Import extensions | 10min |
| 6. Misc fixes | 45min |
| **Total** | **2.5-3h** |

---

## Follow-Up Actions

After all fixes complete:

1. Run full test suite: `npm run test`
2. Update MEMORY.md with any new patterns discovered
3. Consider adding pre-commit hook to block TS errors
4. Document tax utility in `apps/web/CLAUDE.md`

---

_Plan created: 2026-02-28 by diagnostic workflow_
