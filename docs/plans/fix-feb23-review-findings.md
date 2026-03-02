# Fix Feb 23 Review Findings

**Status:** Ready
**Created:** 2026-02-24
**Source:** Code review docs/reviews/revie23feb.md
**Priority:** Critical issues must be fixed before production

---

## Overview

This plan addresses **14 security, financial, frontend, and test coverage issues** identified in the Feb 23 code review. The review found 3 CRITICAL findings that must be fixed immediately, plus 11 MEDIUM findings to fix this sprint.

**Scope:**
- 3 Critical security/frontend fixes (1h 5m)
- 11 Medium findings across security, financial, frontend, TypeScript, test coverage (7h 25m)

**Total estimated effort:** 8h 30m

---

## Phase 1: Critical Fixes (MUST FIX BEFORE PRODUCTION)

### Task 1: SEC-25 - Global Tax Rate Pollution (30m)

**Issue:** Any authenticated user can create tax rates with `entityId: null`, making them visible to ALL tenants on the platform. A malicious user could inject a bogus "HST 0%" rate seen by everyone.

**Files:**
- `apps/api/src/domains/accounting/schemas/tax-rate.schema.ts` (line 17)
- `apps/api/src/domains/accounting/routes/tax-rate.ts` (create endpoint)

**Fix:**
1. Read current schema and route
2. Make `entityId` required in `CreateTaxRateSchema`
3. Remove `.optional()` from entityId field
4. Add validation: reject `null` entityId unless user has ADMIN role (future: gate behind superadmin)
5. Test: attempt to create tax rate with `entityId: null` → should fail with 400

**Acceptance:**
- ✅ CreateTaxRateSchema requires entityId
- ✅ POST /tax-rates with `entityId: null` returns 400
- ✅ Tests verify rejection

---

### Task 2: SEC-26 - Derive tenantId Server-Side (30m)

**Issue:** The `/complete` endpoint trusts `tenantId` from the client request body. Currently mitigated by OWNER role check, but one RBAC regression makes it exploitable.

**Files:**
- `apps/api/src/domains/system/routes/onboarding.ts` (lines 50-57)

**Fix:**
1. Read current endpoint implementation
2. Remove `tenantId` from request body schema
3. Derive `tenantId` from `request.tenant.tenantId` (already set by tenant middleware)
4. Update service call to use derived tenantId
5. Test: verify endpoint no longer accepts tenantId from body

**Acceptance:**
- ✅ CompleteOnboardingSchema does NOT include tenantId field
- ✅ tenantId derived from middleware context
- ✅ Tests verify behavior

---

### Task 3: UX-103 - Fix HeroSection SSR Wrapper (5m)

**Issue:** `page.tsx` imports `HeroSection` directly instead of the `HeroSectionClient` wrapper (which uses `dynamic(..., { ssr: false })`). The wrapper exists but is never used.

**Files:**
- `apps/landing/src/app/page.tsx` (line 1)

**Fix:**
1. Read current import
2. Change: `import { HeroSection }` → `import { HeroSectionClient as HeroSection }`
3. Verify wrapper exists at `@/components/landing/HeroSectionClient`
4. Test: dev server should render without hydration errors

**Acceptance:**
- ✅ page.tsx imports HeroSectionClient
- ✅ No hydration errors in dev server
- ✅ 3D orb renders correctly

---

## Phase 2: Medium Security Fixes (1h 20m)

### Task 4: SEC-27 - Fix listTaxRates Incomplete Data (30m)

**Issue:** `listTaxRates` returns incomplete data when `entityId` is absent — users see only global rates, missing their custom rates.

**Files:**
- `apps/api/src/domains/accounting/services/tax-rate.service.ts` (lines 37-48)

**Fix:**
1. Read current listTaxRates implementation
2. Update query: when `entityId` provided, return `OR: [{ entityId }, { entityId: null }]`
3. When `entityId` absent, return only global rates (current behavior OK)
4. Test: list with entityId returns both custom + global rates

**Acceptance:**
- ✅ listTaxRates(entityId) returns custom + global rates
- ✅ listTaxRates(no entityId) returns only global rates
- ✅ Tests verify both scenarios

---

### Task 5: DRY-18 - Sanitize Content-Disposition Header (20m)

**Issue:** Content-Disposition header uses unsanitized invoice number, creating HTTP response splitting risk.

**Files:**
- `apps/api/src/domains/business/routes/invoices.ts` (line 221)

**Fix:**
1. Read current PDF export endpoint
2. Sanitize invoice number: remove newlines, carriage returns, control characters
3. Use: `invoiceNumber.replace(/[\r\n\x00-\x1f\x7f]/g, '')`
4. Add comment explaining security concern

**Acceptance:**
- ✅ Invoice number sanitized before header
- ✅ Tests with malicious input (\r\n) verify sanitization

---

### Task 6: DRY-19 - Replace z.record(z.unknown()) (30m)

**Issue:** Onboarding schema uses `z.record(z.unknown())` to store arbitrary JSON, creating potential for stored XSS or prototype pollution.

**Files:**
- `apps/api/src/domains/system/routes/onboarding.ts` (lines 62-63)

**Fix:**
1. Read current schema
2. Replace `businessInfo: z.record(z.unknown())` with explicit Zod object schema
3. Define allowed fields: `{ companyName: z.string(), industry: z.string().optional(), ... }`
4. Update service to use typed object
5. Test: reject unknown fields

**Acceptance:**
- ✅ businessInfo uses explicit Zod schema
- ✅ Unknown fields rejected with 400
- ✅ Type safety in service layer

---

## Phase 3: Medium Financial Fixes (2h)

### Task 7: FIN-29 - Re-Validate PATCH Totals (1h)

**Issue:** `updateInvoice`/`updateBill` accepts PATCH totals without re-validating against line items. Corrupted totals can exist in DRAFT state.

**Files:**
- `apps/api/src/domains/business/services/invoice.service.ts` (lines 180-203)
- `apps/api/src/domains/business/services/bill.service.ts` (similar logic)

**Fix:**
1. Read current updateInvoice/updateBill implementations
2. After PATCH, recalculate totals from line items
3. If provided totals differ from calculated, return 400 validation error
4. Add option to skip validation if `skipValidation: true` (for admin fixes)
5. Test: PATCH with incorrect totals → 400 error

**Acceptance:**
- ✅ PATCH with incorrect totals rejected
- ✅ Validation runs on all DRAFT updates
- ✅ Tests verify rejection

---

### Task 8: FIN-30 - GL Report Deduplication (1h)

**Issue:** Transfers create dual JEs via `linkedEntryId` — GL reports may double-count unless filtered.

**Files:**
- `apps/api/src/domains/accounting/services/report.service.ts` (all report methods)
- `apps/api/src/domains/accounting/routes/report.ts`

**Fix:**
1. Read current report service implementations
2. Add `excludeLinkedEntries: true` option to report queries
3. Filter: `WHERE linkedEntryId IS NULL OR id < linkedEntryId` (keep only primary side)
4. Apply to: General Ledger, Trial Balance reports
5. Test: transfer appears once in GL report

**Acceptance:**
- ✅ GL report shows transfers once (not twice)
- ✅ Trial Balance report deduplicates
- ✅ Tests verify single appearance

---

## Phase 4: Medium Frontend Fixes (1h 20m)

### Task 9: UX-104 - Fix Static key="create" Bug (20m)

**Issue:** ClientForm/VendorForm uses static `key="create"`, causing stale data when switching between create/edit modes.

**Files:**
- `apps/web/src/app/(dashboard)/business/clients/clients-list-client.tsx` (line 226)
- `apps/web/src/app/(dashboard)/business/vendors/vendors-list-client.tsx` (similar)

**Fix:**
1. Read current Sheet implementations
2. Change: `key="create"` → `key={editingClient?.id ?? 'create'}`
3. Apply to both ClientForm and VendorForm
4. Test: switch between create and edit → form resets correctly

**Acceptance:**
- ✅ Sheet key changes with record ID
- ✅ Form fields reset when switching
- ✅ No stale data shown

---

### Task 10: UX-105 - Server-Side UpcomingPayments (30m)

**Issue:** UpcomingPayments fetches client-side via `useEffect`, causing visible loading flash (waterfall request).

**Files:**
- `apps/web/src/components/dashboard/UpcomingPayments.tsx` (lines 23-33)
- `apps/web/src/app/(dashboard)/page.tsx` (parent Server Component)

**Fix:**
1. Read current UpcomingPayments component
2. Move fetch to parent page.tsx (Server Component)
3. Pass data as prop: `<UpcomingPayments data={upcomingPayments} />`
4. Remove `useEffect` from component
5. Add loading.tsx skeleton for SSR

**Acceptance:**
- ✅ Data fetched server-side
- ✅ No client-side loading flash
- ✅ SSR renders full content

---

### Task 11: FE-9 - Replace text-[10px] with text-micro (30m)

**Issue:** 15 instances of `text-[10px]` across dashboard files violate design token rules.

**Files:**
- Multiple dashboard files (identified via grep)

**Fix:**
1. Search: `Grep "text-\[10px\]" apps/web/src/app/\(dashboard\)`
2. For each file: replace `text-[10px]` with `text-micro`
3. Verify `text-micro` utility exists in `globals.css`
4. Check visual consistency

**Acceptance:**
- ✅ Zero instances of `text-[10px]` remain
- ✅ All uses replaced with `text-micro`
- ✅ Visual appearance unchanged

---

## Phase 5: Medium TypeScript Fixes (1h 40m)

### Task 12: DRY-20 - StatusBadge Type Strengthening (30m)

**Issue:** StatusBadge components use `status: string` instead of enum union, losing compile-time validation.

**Files:**
- `packages/ui/src/business/InvoiceStatusBadge.tsx` (line 14)
- `packages/ui/src/business/BillStatusBadge.tsx` (line 14)

**Fix:**
1. Read StatusBadge implementations
2. Change: `status: string` → `status: InvoiceStatus | BillStatus`
3. Import enum types from `@akount/db`
4. Update all callers to use enum values
5. Test: TypeScript compilation catches invalid status

**Acceptance:**
- ✅ StatusBadge props use enum types
- ✅ Invalid status values fail TypeScript
- ✅ All callers type-safe

---

### Task 13: DRY-21 - Extract formatCents Utility (20m)

**Issue:** `line-item-builder.tsx` has inline `formatCents`/`parseCentsInput`, violating shared utility convention.

**Files:**
- `apps/web/src/components/business/line-item-builder.tsx` (lines 50-58)
- `apps/web/src/lib/utils/currency.ts` (canonical location)

**Fix:**
1. Read inline implementations
2. Check if `formatCents` already exists in `currency.ts`
3. If missing, add to `currency.ts`
4. Replace inline usage with import
5. Remove inline functions

**Acceptance:**
- ✅ No inline currency formatting in line-item-builder
- ✅ Uses shared utility from `@/lib/utils/currency`
- ✅ Behavior unchanged

---

### Task 14: TS-7 - Add Timestamps to Constants (30m)

**Issue:** `CALENDAR_SELECT`/`PERIOD_SELECT` constants missing timestamps, violating mandatory convention.

**Files:**
- `apps/api/src/domains/accounting/services/fiscal-period.service.ts` (lines 9-36)

**Fix:**
1. Read current constant definitions
2. Add `createdAt: new Date().toISOString()` to each constant
3. Add `updatedAt: new Date().toISOString()` to each constant
4. Update TypeScript types to include timestamp fields
5. Verify no runtime errors

**Acceptance:**
- ✅ All constants have createdAt/updatedAt
- ✅ TypeScript types include timestamps
- ✅ No runtime errors

---

## Phase 6: Test Coverage Improvements (2h 15m)

### Task 15: TEST-5 - Add assertIntegerCents to Transfers (15m)

**Issue:** `transfer.service.test.ts` lacks `assertIntegerCents` on monetary values. FIN-28 was a calc bug in this exact service.

**Files:**
- `apps/api/src/domains/banking/services/__tests__/transfer.service.test.ts`

**Fix:**
1. Read current test file
2. Import `assertIntegerCents` from test utils
3. Add assertions to all tests that return monetary values
4. Assert: `amount`, `baseCurrencyAmount`, account balances
5. Run tests: `npx vitest run transfer.service.test.ts`

**Acceptance:**
- ✅ All monetary fields asserted as integer cents
- ✅ Tests pass
- ✅ Regression protection for FIN-28

---

### Task 16: TEST-6 - Test Export Services (2h)

**Issue:** `data-export.service.ts` and `report-export.service.ts` have zero tests, creating risk of tenant data leakage.

**Files:**
- `apps/api/src/domains/system/services/__tests__/data-export.service.test.ts` (create)
- `apps/api/src/domains/accounting/services/__tests__/report-export.service.test.ts` (create)

**Fix:**
1. Read service implementations
2. Create test files following existing patterns
3. Test tenant isolation: verify exports filter by tenantId
4. Test data sanitization: verify sensitive fields masked
5. Test CSV format: verify headers, escaping, encoding
6. Run: `npx vitest run data-export.service.test.ts report-export.service.test.ts`

**Acceptance:**
- ✅ Both services have test coverage
- ✅ Tenant isolation verified
- ✅ At least 5 tests per service
- ✅ All tests pass

---

## Progress Tracking

- [ ] **Phase 1: Critical Fixes** (3 tasks, 1h 5m)
  - [ ] SEC-25: Global tax rate pollution
  - [ ] SEC-26: Derive tenantId server-side
  - [ ] UX-103: Fix HeroSection SSR wrapper
- [ ] **Phase 2: Medium Security** (3 tasks, 1h 20m)
  - [ ] SEC-27: Fix listTaxRates incomplete data
  - [ ] DRY-18: Sanitize Content-Disposition
  - [ ] DRY-19: Replace z.record(z.unknown())
- [ ] **Phase 3: Medium Financial** (2 tasks, 2h)
  - [ ] FIN-29: Re-validate PATCH totals
  - [ ] FIN-30: GL report deduplication
- [ ] **Phase 4: Medium Frontend** (3 tasks, 1h 20m)
  - [ ] UX-104: Fix static key bug
  - [ ] UX-105: Server-side UpcomingPayments
  - [ ] FE-9: Replace text-[10px] with text-micro
- [ ] **Phase 5: Medium TypeScript** (3 tasks, 1h 40m)
  - [ ] DRY-20: StatusBadge type strengthening
  - [ ] DRY-21: Extract formatCents utility
  - [ ] TS-7: Add timestamps to constants
- [ ] **Phase 6: Test Coverage** (2 tasks, 2h 15m)
  - [ ] TEST-5: Add assertIntegerCents to transfers
  - [ ] TEST-6: Test export services

---

## Testing Strategy

After each phase:
1. Run TypeScript compilation: `cd apps/api && npx tsc --noEmit`
2. Run affected tests: `npx vitest run [test-pattern]`
3. Manual verification for frontend changes

Final validation:
- Full test suite: `cd apps/api && npx vitest run`
- Frontend build: `cd apps/web && npm run build`
- Manual smoke test of critical flows

---

## Success Criteria

- ✅ All 3 Critical findings fixed and tested
- ✅ All 11 Medium findings fixed and tested
- ✅ Zero TypeScript errors
- ✅ All tests passing (1300+ backend tests)
- ✅ No production blockers remaining
- ✅ Manual verification of critical security fixes

---

**Estimated completion:** 8.5 hours (can be split across multiple sessions)
**Priority:** Phase 1 (Critical) must be done before production deployment
