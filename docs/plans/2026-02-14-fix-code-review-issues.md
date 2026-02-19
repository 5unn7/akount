# Fix Code Review Critical Issues

**Created:** 2026-02-14
**Status:** IN PROGRESS (3/5 issues complete)
**Review Source:** Multi-agent code review of 2026-02-14 changes

## Overview

This plan addresses 5 critical issues identified in the comprehensive code review:
1. **Missing loading/error states** across 32 dashboard pages (P0 — UX impact)
2. **Onboarding route unreachable** due to redirect in layout (P0 — architectural bug)
3. **Design system token violations** in badge.tsx and AIBrief.tsx (P0 — breaks dark mode)
4. **ImportUploadForm.tsx complexity** — 415 lines with 8+ responsibilities (P1 — tech debt)
5. **Missing service-level tests** for new domains (P1 — test coverage gap)

Estimated total time: **4-6 hours** across 5 parallel-friendly tasks.

---

## Success Criteria

- [x] All planning/services pages have page-specific loading.tsx and error.tsx files (24 files added)
- [x] Onboarding route decision documented and implemented (deleted - overlay-only)
- [x] Badge and AIBrief components use semantic tokens (no hardcoded colors)
- [x] ImportUploadForm split into focused components (<300 lines each)
- [ ] Service-level tests exist for client, invoice, bill, vendor services
- [ ] All tests pass: `npm run test` (API + Web)
- [x] Design system compliance: 100% (0 hardcoded colors verified)
- [ ] Zero console warnings or TypeScript errors

## Additional Security Fixes (2026-02-14)

- [x] M-2: Invoice/bill amount validation to prevent manipulation
- [x] M-4: Unique constraints on invoice/bill numbers per entity
- [x] M-5: Rate limiting for expensive stats endpoints

---

## Task Breakdown

### Issue 1: Missing Loading/Error States (32 pages)

**Priority:** P0 — Blocks production readiness
**Estimated time:** 2 hours
**Can parallelize:** Yes (split pages across multiple commits)

#### Task 1.1: Create loading/error templates
**File:** `apps/web/src/app/(dashboard)/_templates/loading-template.tsx`
**What:** Create reusable templates for copy-paste (not imported, just reference)
**Depends on:** none
**Success:** Templates exist with clear copy-paste instructions

#### Task 1.2: Add loading/error to accounting pages (6 pages)
**Files:**
- `apps/web/src/app/(dashboard)/accounting/assets/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/assets/error.tsx`
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/error.tsx`
- `apps/web/src/app/(dashboard)/accounting/fiscal-periods/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/fiscal-periods/error.tsx`
- `apps/web/src/app/(dashboard)/accounting/journal-entries/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/journal-entries/error.tsx`
- `apps/web/src/app/(dashboard)/accounting/journal-entries/new/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/journal-entries/new/error.tsx`
- `apps/web/src/app/(dashboard)/accounting/tax-rates/loading.tsx`
- `apps/web/src/app/(dashboard)/accounting/tax-rates/error.tsx`

**What:** Copy template and customize skeleton to match page structure
**Depends on:** Task 1.1
**Success:** All accounting pages have loading/error states

#### Task 1.3: Add loading/error to banking pages (5 pages)
**Files:**
- `apps/web/src/app/(dashboard)/banking/import/loading.tsx`
- `apps/web/src/app/(dashboard)/banking/import/error.tsx`
- `apps/web/src/app/(dashboard)/banking/imports/loading.tsx`
- `apps/web/src/app/(dashboard)/banking/imports/error.tsx`
- `apps/web/src/app/(dashboard)/banking/reconciliation/loading.tsx`
- `apps/web/src/app/(dashboard)/banking/reconciliation/error.tsx`
- `apps/web/src/app/(dashboard)/banking/transactions/loading.tsx`
- `apps/web/src/app/(dashboard)/banking/transactions/error.tsx`
- `apps/web/src/app/(dashboard)/banking/transfers/loading.tsx`
- `apps/web/src/app/(dashboard)/banking/transfers/error.tsx`

**What:** Copy template and customize skeleton to match page structure
**Depends on:** Task 1.1
**Success:** All banking pages have loading/error states

#### Task 1.4: Add loading/error to business pages (2 pages)
**Files:**
- `apps/web/src/app/(dashboard)/business/bills/loading.tsx`
- `apps/web/src/app/(dashboard)/business/bills/error.tsx`
- `apps/web/src/app/(dashboard)/business/payments/loading.tsx`
- `apps/web/src/app/(dashboard)/business/payments/error.tsx`

**What:** Copy template and customize skeleton to match page structure
**Depends on:** Task 1.1
**Success:** All business pages have loading/error states

#### Task 1.5: Add loading/error to remaining domains (19 pages)
**Files:** insights (3), overview (2), planning (4), services (3), system (6), business/clients (1)
**What:** Copy template and customize skeleton to match page structure
**Depends on:** Task 1.1
**Success:** All remaining pages have loading/error states

---

### Issue 2: Onboarding Route Unreachable

**Priority:** P0 — Architectural bug
**Estimated time:** 15 minutes
**Can parallelize:** Yes

#### Task 2.1: Delete onboarding route (recommended approach)
**Files:**
- `apps/web/src/app/onboarding/layout.tsx` (DELETE)
- `apps/web/src/app/onboarding/page.tsx` (DELETE)
- `apps/web/src/app/onboarding/components/*` (MOVE to dashboard components)

**What:** Remove /onboarding route since onboarding is overlay-only (OnboardingOverlay in dashboard layout)
**Depends on:** none
**Success:** No /onboarding route, OnboardingWizard accessible via overlay only

**Alternative (if route should be accessible):**
**File:** `apps/web/src/app/onboarding/layout.tsx`
**What:** Remove `redirect('/overview')` and render children with minimal layout
**Success:** /onboarding route renders wizard, not redirect

**Decision Required:** Confirm with user which approach to take.

---

### Issue 3: Design System Token Violations

**Priority:** P0 — Breaks light/dark mode
**Estimated time:** 30 minutes
**Can parallelize:** Yes

#### Task 3.1: Fix badge.tsx color variants
**File:** `apps/web/src/components/ui/badge.tsx`
**What:** Replace hardcoded Tailwind colors with semantic tokens
**Depends on:** none
**Success:** Badge renders correctly in both light and dark mode

**Current (lines 17, 19):**
```typescript
success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100/80',
warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80',
```

**Expected:**
```typescript
success: 'border-transparent bg-ak-green-dim text-ak-green hover:bg-ak-green-dim/80',
warning: 'border-transparent bg-primary/[0.14] text-primary hover:bg-primary/[0.18]',
```

#### Task 3.2: Fix AIBrief.tsx inline styles
**File:** `apps/web/src/components/dashboard/AIBrief.tsx`
**What:** Replace inline `style` prop with Tailwind utility classes
**Depends on:** none
**Success:** AIBrief renders correctly in both modes, no inline rgba

**Current (lines 18-21):**
```typescript
style={{
  background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(167,139,250,0.06))',
  borderColor: 'rgba(245,158,11,0.08)',
}}
```

**Expected:**
```typescript
className="rounded-xl p-5 border border-l-2 border-ak-purple bg-gradient-to-br from-ak-pri-dim to-ak-purple-dim"
```

#### Task 3.3: Verify design system compliance
**What:** Test badge and AIBrief in both light/dark mode, check for console warnings
**Depends on:** Task 3.1, Task 3.2
**Success:** No hardcoded colors, components adapt to theme, zero warnings

---

### Issue 4: Split ImportUploadForm.tsx Complexity

**Priority:** P1 — Tech debt, not blocking
**Estimated time:** 1.5 hours
**Can parallelize:** Partially (steps must be created before main file updated)
**Status:** ✅ COMPLETE

#### Task 4.1: Create FileSelectionStep component ✅
**File:** `apps/web/src/components/import/steps/FileSelectionStep.tsx`
**What:** Extract file selection logic (drag-drop, validation, account assignment)
**Depends on:** none
**Success:** Component renders file list, handles file operations, exports clear props interface
**Result:** 261 lines (slightly over 200 target, but acceptable for single responsibility)

**Responsibilities:**
- Drag-and-drop zone
- File validation (VALID_EXTENSIONS, MAX_FILE_SIZE)
- FileListEditor integration
- Account assignment per file
- "Next" button to start upload

**Props:**
```typescript
interface FileSelectionStepProps {
  accounts: ImportAccount[];
  files: UploadFileItem[];
  onFilesChange: (files: UploadFileItem[]) => void;
  onNext: () => void;
}
```

#### Task 4.2: Create UploadProgressStep component ✅
**File:** `apps/web/src/components/import/steps/UploadProgressStep.tsx`
**What:** Extract upload orchestration logic (sequential file uploads, progress tracking)
**Depends on:** none
**Success:** Component handles sequential uploads, shows progress, triggers onComplete
**Result:** 150 lines (under target)

**Responsibilities:**
- Sequential upload loop
- Per-file progress tracking
- CSV column mapping detection
- Error handling per file
- UploadProgressList integration

**Props:**
```typescript
interface UploadProgressStepProps {
  files: UploadFileItem[];
  onComplete: (results: ImportResult[]) => void;
  onError: (error: string) => void;
}
```

#### Task 4.3: Create ResultsStep component ✅
**File:** `apps/web/src/components/import/steps/ResultsStep.tsx`
**What:** Extract results display logic (BatchImportResults wrapper, reset action)
**Depends on:** none
**Success:** Component displays results summary with "Import More" button
**Result:** 51 lines (well under target)

**Responsibilities:**
- BatchImportResults integration
- Success/failure summary
- Reset wizard action

**Props:**
```typescript
interface ResultsStepProps {
  results: ImportResult[];
  onReset: () => void;
}
```

#### Task 4.4: Refactor ImportUploadForm to use steps ✅
**File:** `apps/web/src/components/import/ImportUploadForm.tsx`
**What:** Simplify to wizard state machine, delegate to step components
**Depends on:** Task 4.1, Task 4.2, Task 4.3
**Success:** Main file <200 lines, clear step transitions, all tests pass
**Result:** 77 lines (81% reduction from 415 lines)

**Simplified structure:**
```typescript
export function ImportUploadForm({ accounts }: ImportUploadFormProps) {
  const [step, setStep] = useState<WizardStep>('select');
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);

  return (
    <Card>
      {step === 'select' && <FileSelectionStep ... />}
      {step === 'uploading' && <UploadProgressStep ... />}
      {step === 'results' && <ResultsStep ... />}
    </Card>
  );
}
```

#### Task 4.5: Create steps directory and barrel export ✅
**File:** `apps/web/src/components/import/steps/index.ts`
**What:** Create steps/ directory, add barrel export
**Depends on:** Task 4.1, Task 4.2, Task 4.3
**Success:** Clean imports: `import { FileSelectionStep } from './steps'`
**Result:** Directory created, barrel export in place, all step components exported

---

### Issue 5: Add Service-Level Tests for New Domains

**Priority:** P1 — Test coverage gap
**Estimated time:** 2 hours
**Can parallelize:** Yes (each service independent)

#### Task 5.1: Add client.service.test.ts
**File:** `apps/api/src/domains/clients/services/__tests__/client.service.test.ts`
**What:** Unit tests for ClientService (listClients, getClient, createClient, updateClient, deleteClient)
**Depends on:** none
**Risk:** high (tenant isolation, soft delete)
**Success:** 15+ tests covering CRUD + tenant isolation + soft delete

**Test coverage:**
- listClients with filters
- listClients with cursor pagination
- getClient returns correct client
- getClient rejects cross-tenant access
- createClient validates entity ownership
- updateClient respects tenant boundaries
- deleteClient soft deletes (sets deletedAt)
- Integer cents assertion for balanceDue

#### Task 5.2: Add invoice.service.test.ts
**File:** `apps/api/src/domains/invoicing/services/__tests__/invoice.service.test.ts`
**What:** Unit tests for InvoiceService (CRUD + stats + aging)
**Depends on:** none
**Risk:** high (financial data, AR aging calculations)
**Success:** 20+ tests covering CRUD + stats + aging + tenant isolation

**Test coverage:**
- listInvoices with filters (status, client, date range)
- listInvoices with cursor pagination
- getInvoice returns correct invoice
- getInvoice rejects cross-tenant access
- createInvoice validates entity ownership
- updateInvoice respects tenant boundaries
- deleteInvoice soft deletes
- getInvoiceStats aggregates correctly
- getARAgingBuckets calculates correctly
- Integer cents assertions for all amounts

#### Task 5.3: Add bill.service.test.ts
**File:** `apps/api/src/domains/invoicing/services/__tests__/bill.service.test.ts`
**What:** Unit tests for BillService (CRUD + stats + aging)
**Depends on:** none
**Risk:** high (financial data, AP aging calculations)
**Success:** 20+ tests covering CRUD + stats + aging + tenant isolation

**Test coverage:**
- listBills with filters (status, vendor, date range)
- listBills with cursor pagination
- getBill returns correct bill
- getBill rejects cross-tenant access
- createBill validates entity ownership
- updateBill respects tenant boundaries
- deleteBill soft deletes
- getBillStats aggregates correctly
- getAPAgingBuckets calculates correctly
- Integer cents assertions for all amounts

#### Task 5.4: Add vendor.service.test.ts
**File:** `apps/api/src/domains/vendors/services/__tests__/vendor.service.test.ts`
**What:** Unit tests for VendorService (CRUD operations)
**Depends on:** none
**Risk:** high (tenant isolation, soft delete)
**Success:** 15+ tests covering CRUD + tenant isolation + soft delete

**Test coverage:**
- listVendors with filters
- listVendors with cursor pagination
- getVendor returns correct vendor
- getVendor rejects cross-tenant access
- createVendor validates entity ownership
- updateVendor respects tenant boundaries
- deleteVendor soft deletes
- Integer cents assertion for balanceDue

#### Task 5.5: Run all tests and verify coverage
**What:** Run full test suite, verify new tests pass, check coverage report
**Depends on:** Task 5.1, Task 5.2, Task 5.3, Task 5.4
**Success:** All tests pass, coverage increased, no regressions

```bash
cd apps/api && npx vitest run --reporter=verbose
cd apps/web && npm run test
```

---

## Reference Files

**Loading/Error patterns:**
- `apps/web/src/app/(dashboard)/banking/accounts/loading.tsx` — skeleton template
- `apps/web/src/app/(dashboard)/banking/accounts/error.tsx` — error boundary template

**Design system tokens:**
- `.claude/rules/design-aesthetic.md` — semantic token mapping
- `apps/web/src/app/globals.css` — token definitions

**Component splitting:**
- `apps/web/src/components/import/ImportUploadForm.tsx` — current implementation
- `apps/web/src/components/import/FileListEditor.tsx` — existing sub-component
- `apps/web/src/components/import/UploadProgressList.tsx` — existing sub-component

**Service test patterns:**
- `apps/api/src/domains/banking/services/__tests__/account.service.test.ts` — mocking pattern
- `apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts` — financial assertions

---

## Edge Cases

### Loading/Error States
- **Pages with dynamic params**: Use `params.id` in error message ("Failed to load account {id}")
- **Pages with search params**: Key Suspense by params to trigger re-render on filter change
- **Nested routes**: Only leaf pages need loading/error, intermediate layouts don't

### Onboarding Route
- **If deleted**: Update any direct links to `/onboarding` (unlikely to exist)
- **If kept**: Ensure middleware doesn't interfere with route access

### Design System
- **Badge variants**: Ensure all existing uses still work (check usage with Grep)
- **AIBrief gradient**: Verify gradient direction matches in both modes (135deg)

### ImportUploadForm Split
- **State hoisting**: Files state managed in parent, passed to steps
- **Upload cancelation**: Not implemented in v1 (document as future enhancement)
- **Column mapping**: Auto-detection happens during upload, not in separate step

### Service Tests
- **Mock isolation**: Each test file has its own mock setup (no shared state)
- **Transaction mocks**: Use `$transaction` mock pattern from account.service.test.ts
- **Date handling**: Use fixed dates in mocks to avoid timezone issues

---

## Testing Strategy

### Unit Tests
- Service-level tests (Task 5.1-5.4): Vitest with Prisma mocks
- Component tests (optional): Vitest + React Testing Library

### Integration Tests
- Existing route tests already cover new services
- No new integration tests needed

### Manual Testing
1. **Loading states**: Navigate between pages, verify skeletons match actual layout
2. **Error states**: Trigger errors (disconnect network), verify error boundary shows
3. **Design system**: Toggle light/dark mode, verify badge/AIBrief adapt
4. **Import wizard**: Test file selection → upload → results flow
5. **Service logic**: Run unit tests, verify tenant isolation

---

## Execution Order

### Parallel Track A (Frontend - 2 hours)
1. Task 1.1 → Task 1.2, 1.3, 1.4, 1.5 (can parallelize page creation)
2. Task 2.1 (decision + implementation)
3. Task 3.1, 3.2 → Task 3.3

### Parallel Track B (Component Refactor - 1.5 hours)
1. Task 4.1, 4.2, 4.3 (can parallelize step creation)
2. Task 4.4 → Task 4.5

### Parallel Track C (Backend Tests - 2 hours)
1. Task 5.1, 5.2, 5.3, 5.4 (can parallelize test creation)
2. Task 5.5

**Total estimated time if done sequentially:** 5.5 hours
**Total estimated time if parallelized:** 2.5 hours (longest track)

---

## Progress Tracking

### Issue 1: Loading/Error States
- [ ] Task 1.1: Templates created
- [ ] Task 1.2: Accounting pages (12 files)
- [ ] Task 1.3: Banking pages (10 files)
- [ ] Task 1.4: Business pages (4 files)
- [ ] Task 1.5: Remaining domains (38 files)

### Issue 2: Onboarding Route
- [ ] Task 2.1: Decision made and implemented

### Issue 3: Design Tokens
- [ ] Task 3.1: badge.tsx fixed
- [ ] Task 3.2: AIBrief.tsx fixed
- [ ] Task 3.3: Compliance verified

### Issue 4: ImportUploadForm Split
- [ ] Task 4.1: FileSelectionStep created
- [ ] Task 4.2: UploadProgressStep created
- [ ] Task 4.3: ResultsStep created
- [ ] Task 4.4: Main form refactored
- [ ] Task 4.5: Directory structured

### Issue 5: Service Tests
- [ ] Task 5.1: client.service.test.ts (15+ tests)
- [ ] Task 5.2: invoice.service.test.ts (20+ tests)
- [ ] Task 5.3: bill.service.test.ts (20+ tests)
- [ ] Task 5.4: vendor.service.test.ts (15+ tests)
- [ ] Task 5.5: All tests passing

---

## Commit Strategy

**Recommended commits:**
1. `feat(frontend): Add loading/error states to all dashboard pages`
2. `fix(onboarding): Remove unreachable onboarding route (overlay-only)`
3. `fix(design): Replace hardcoded colors with semantic tokens`
4. `refactor(import): Split ImportUploadForm into focused step components`
5. `test(api): Add service-level tests for clients/invoicing/vendors`

Each commit should be independently deployable and pass all tests.

---

## Definition of Done

- [ ] All 32 pages have loading.tsx and error.tsx
- [ ] Onboarding route decision implemented (deleted or fixed)
- [ ] Badge and AIBrief use semantic tokens (0 hardcoded colors)
- [ ] ImportUploadForm main file <200 lines
- [ ] 70+ new service tests added (4 test files)
- [ ] All tests pass: `npm run test` in both apps/api and apps/web
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No console warnings in browser DevTools
- [ ] Design system compliance: 100% (verified via manual toggle)
- [ ] Code review findings marked as resolved
- [ ] TASKS.md updated (if applicable)

---

**Estimated total effort:** 4-6 hours (2.5 hours if fully parallelized)
**Risk level:** LOW — All changes are isolated, well-defined, and non-breaking
**Dependencies:** None — can start immediately
