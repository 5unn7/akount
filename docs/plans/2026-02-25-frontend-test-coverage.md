# Frontend Test Coverage Implementation Plan

**Created:** 2026-02-25
**Status:** Draft
**Related:** TEST-2 (E2E tests), TEST-3 (80%+ coverage target)

## Overview

The frontend has 7 test files with 67 tests (60 passing, 7 failing). Zero coverage exists for utility functions, dashboard components, business forms/tables, and shared UI components. This plan builds a comprehensive frontend test suite from the ground up — utilities first (highest ROI), then components by complexity.

**Current:** 60/67 passing (7 WelcomeStep failures), 0% utility coverage, 0% component coverage
**Target:** 200+ tests, all utilities covered, critical components covered, WelcomeStep fixed

## Success Criteria

- [ ] All existing tests pass (67/67, fix WelcomeStep)
- [ ] Test utilities directory created (`apps/web/src/test-utils/`)
- [ ] 100% coverage on `currency.ts` (4 functions, ~20 tests)
- [ ] 100% coverage on `date.ts` (4 functions, ~15 tests)
- [ ] 100% coverage on `account-helpers.ts` (2 functions + static maps, ~15 tests)
- [ ] Dashboard presentational components tested (StatCard, QuickActionPills, etc.)
- [ ] Business form components tested (InvoiceForm validation, ClientForm CRUD)
- [ ] 200+ total frontend tests passing
- [ ] `npm run test` in apps/web exits cleanly

---

## Sprint 1: Foundation (3-4h)

### Task 1: Fix WelcomeStep failing tests
**File:** `apps/web/src/app/onboarding/__tests__/WelcomeStep.test.tsx`
**What:** Update 7 failing test assertions to match actual component text. Tests expect "Personal"/"Business" but component uses "Just me"/"Business" with different feature lists.
**Depends on:** none
**Success:** `npx vitest run` → 67/67 passing

### Task 2: Create test utilities directory + render helper
**Files:**
- `apps/web/src/test-utils/render-utils.tsx` — Custom render with providers
- `apps/web/src/test-utils/index.ts` — Barrel export
**What:** Create a `renderWithProviders()` wrapper that includes any global providers. Re-export all testing-library functions for convenience. Pattern mirrors backend's `apps/api/src/test-utils/`.
**Depends on:** none
**Success:** Import `{ renderWithProviders }` from test-utils works in tests

### Task 3: Create mock data factories
**File:** `apps/web/src/test-utils/mock-data.ts`
**What:** Create factory functions for common domain types: `mockAccount()`, `mockTransaction()`, `mockInvoice()`, `mockBill()`, `mockClient()`, `mockVendor()`, `mockJournalEntry()`. All amounts use integer cents. Each factory accepts `Partial<T>` overrides.
**Depends on:** none
**Success:** Factories produce valid typed objects with sensible defaults

### Task 4: Create API mock helpers
**File:** `apps/web/src/test-utils/api-mocks.ts`
**What:** Create typed helpers to mock `apiFetch` responses: `mockApiSuccess<T>(response)`, `mockApiError(status, message)`, `mockApiLoading()`. Wraps `vi.mocked(apiFetch).mockResolvedValueOnce()` for cleaner test code.
**Depends on:** none
**Success:** Helpers produce correctly typed mock responses

---

## Sprint 2: Utility Tests (2-3h)

### Task 5: Test currency utilities
**File:** `apps/web/src/lib/utils/__tests__/currency.test.ts`
**What:** Test all 4 exported functions:
- `formatCurrency`: positive/negative/zero cents, CAD/USD/EUR, large amounts, rounding
- `formatCompactNumber`: K/M/B thresholds, negative, zero, decimals
- `formatCents`: standard, zero, negative, large
- `parseCentsInput`: valid decimals, invalid strings, empty, negative, edge cases (0.005 rounding)
**Depends on:** none
**Success:** ~20 tests, all assertions on integer cents invariant

### Task 6: Test date utilities
**File:** `apps/web/src/lib/utils/__tests__/date.test.ts`
**What:** Test all 4 exported functions:
- `formatDate`: standard ISO, different months, year boundary
- `formatDateTime`: time formatting, AM/PM, midnight/noon edge
- `formatDateSplit`: day extraction, month uppercasing
- `formatMonthYear`: month abbreviation, year
- Edge cases: invalid date string behavior
**Depends on:** none
**Success:** ~15 tests, consistent en-CA locale assertions

### Task 7: Test account-helpers utilities
**File:** `apps/web/src/lib/utils/__tests__/account-helpers.test.ts`
**What:** Test:
- `groupAccountsByCurrency`: empty array, single currency, multi-currency, sorting by total balance (absolute), negative balances
- `computeTransactionStats`: income/expense separation, unreconciled count, empty array, all income, all expense, mixed
- Static maps: `accountTypeIcons`, `accountTypeLabels`, `accountTypeColors` have entries for all AccountType values
**Depends on:** none
**Success:** ~15 tests, integer cents assertions on all monetary outputs

---

## Sprint 3: Dashboard Component Tests (4-5h)

### Task 8: Test StatCard / QuickStats / QuickActionPills
**File:** `apps/web/src/components/dashboard/__tests__/presentational.test.tsx`
**What:** Test presentational dashboard components that receive props and render UI:
- `StatCard`: renders label, value, trend indicator, icon
- `QuickStats`: renders multiple stat cards with correct formatting
- `QuickActionPills`: renders action buttons, onClick handlers fire
**Depends on:** Task 2 (render utils)
**Review:** `nextjs-app-router-reviewer`
**Success:** ~15 tests, all rendering with mock data

### Task 9: Test DashboardMetrics + EntityAccountCards
**File:** `apps/web/src/components/dashboard/__tests__/metrics.test.tsx`
**What:** Test data-display dashboard components:
- `DashboardMetrics`: renders financial metrics, uses formatCurrency
- `EntityAccountCards`: renders account cards grouped by entity
- Mock apiFetch for data dependencies
**Depends on:** Task 2, Task 3, Task 4
**Success:** ~12 tests, currency formatting verified

### Task 10: Test overview widgets (P&L, Trial Balance, Top Revenue)
**File:** `apps/web/src/components/dashboard/__tests__/widgets.test.tsx`
**What:** Test the 3 recently-built overview widgets:
- `ProfitLossSummaryWidget`: income/expense/net display, formatted amounts
- `TrialBalanceStatusWidget`: balanced/unbalanced indicator, amounts
- `TopRevenueClientsWidget`: client list rendering, sorted by revenue
- All use apiFetch — mock API responses
**Depends on:** Task 2, Task 3, Task 4
**Review:** `financial-data-validator` (displays financial amounts)
**Success:** ~15 tests, integer cents display verified

---

## Sprint 4: Business Component Tests (6-8h)

### Task 11: Test InvoiceTable + BillsTable + PaymentTable
**File:** `apps/web/src/components/business/__tests__/tables.test.tsx`
**What:** Test list/table components:
- Renders rows from mock data
- Status badges display correctly
- Sort/filter interactions
- Empty state rendering
- Pagination controls
**Depends on:** Task 2, Task 3
**Success:** ~20 tests per table component

### Task 12: Test ClientForm + VendorForm
**File:** `apps/web/src/components/business/__tests__/entity-forms.test.tsx`
**What:** Test simpler CRUD forms:
- Form renders with empty state (create mode)
- Form populates from existing data (edit mode)
- Required field validation
- Submit handler called with correct data
- Cancel/close handler works
**Depends on:** Task 2, Task 3, Task 4
**Success:** ~15 tests, form state management verified

### Task 13: Test InvoiceForm line items + totals
**File:** `apps/web/src/components/business/__tests__/invoice-form.test.tsx`
**What:** Test the most complex form:
- Add/remove line items
- Quantity * unit price calculation (integer cents)
- Tax calculation
- Subtotal / total computation
- Client selector interaction
- Due date validation
- Draft vs send flow
**Depends on:** Task 2, Task 3, Task 4
**Risk:** high (financial calculations in form)
**Review:** `financial-data-validator`
**Success:** ~25 tests, all monetary calculations use integer cents

---

## Sprint 5: Integration & Coverage Push (3-4h)

### Task 14: Test navigation components (DomainTabs, Sidebar elements)
**File:** `apps/web/src/components/shared/__tests__/navigation.test.tsx`
**What:** Test shared layout components:
- `DomainTabs`: renders tabs from navigation config, active state
- `ContentPanel`: renders children, title, actions
- `PageHeader`: renders title, breadcrumbs, action buttons
**Depends on:** Task 2
**Success:** ~10 tests

### Task 15: Test onboarding store + dashboard personalization
**File:** Extend existing `stores/__tests__/onboardingStore.test.ts`
**What:** Add edge case coverage:
- Reset state between wizard steps
- Intent persistence
- Account type switching
- State hydration from API
**Depends on:** none
**Success:** ~10 additional tests on existing test file

### Task 16: Fix E2E onboarding test + verify E2E suite runs
**File:** `apps/web/e2e/onboarding.spec.ts`
**What:** Investigate skipped onboarding E2E test (test user already onboarded). Either create a test user fixture that resets onboarding state, or add conditional skip with documentation.
**Depends on:** none
**Success:** E2E suite runs without unexplained skips

---

## Reference Files

- `apps/web/vitest.config.ts` — Test runner config
- `apps/web/src/test/setup.ts` — Global mocks (Clerk, router, apiFetch, recharts)
- `apps/api/src/test-utils/financial-assertions.ts` — Backend pattern to mirror
- `apps/web/src/lib/utils/currency.ts` — 4 functions, 0 tests
- `apps/web/src/lib/utils/date.ts` — 4 functions, 0 tests
- `apps/web/src/lib/utils/account-helpers.ts` — 2 functions + maps, 0 tests
- `apps/web/src/components/dashboard/` — 29 components, 1 test file
- `apps/web/src/components/business/` — 15 components, 0 test files

## Edge Cases

- **Locale consistency:** All date/currency tests must assert en-CA locale output (not en-US)
- **Recharts mocking:** Charts are globally mocked in setup.ts — chart interaction tests need custom mock
- **apiFetch global mock:** Returns `{}` by default — every test needing data must override with `mockApiSuccess()`
- **Server components:** Cannot be tested with React Testing Library — only test client components and utilities
- **Integer cents invariant:** All mock data and assertions must use integer cents, never floats

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 10 (widgets) | `financial-data-validator` |
| Task 13 (invoice form) | `financial-data-validator` |
| Tasks 8-10 (dashboard) | `nextjs-app-router-reviewer` |

## Domain Impact

- **Primary domains:** All (testing touches every domain's frontend)
- **Adjacent domains:** None (tests don't modify production code)
- **Migration impact:** None

## Testing Strategy

**Unit tests (Sprint 1-2):** Pure function tests with no rendering. Highest ROI — covers currency formatting, date formatting, account grouping.

**Component tests (Sprint 3-4):** React Testing Library render + assert. Mock API responses. Test user interactions with `userEvent`.

**Integration patterns (Sprint 5):** Navigation flows, store hydration, E2E verification.

**Not in scope:** Server Component testing (requires different tooling), visual regression testing, performance testing.

---

## Progress

- [ ] Task 1: Fix WelcomeStep failing tests
- [ ] Task 2: Create test utilities directory + render helper
- [ ] Task 3: Create mock data factories
- [ ] Task 4: Create API mock helpers
- [ ] Task 5: Test currency utilities
- [ ] Task 6: Test date utilities
- [ ] Task 7: Test account-helpers utilities
- [ ] Task 8: Test StatCard / QuickStats / QuickActionPills
- [ ] Task 9: Test DashboardMetrics + EntityAccountCards
- [ ] Task 10: Test overview widgets (P&L, Trial Balance, Top Revenue)
- [ ] Task 11: Test InvoiceTable + BillsTable + PaymentTable
- [ ] Task 12: Test ClientForm + VendorForm
- [ ] Task 13: Test InvoiceForm line items + totals
- [ ] Task 14: Test navigation components
- [ ] Task 15: Test onboarding store edge cases
- [ ] Task 16: Fix E2E onboarding test

---

## Estimated Totals

| Metric | Value |
|--------|-------|
| **Sprints** | 5 |
| **Tasks** | 16 |
| **Estimated new tests** | ~200+ |
| **Estimated effort** | 18-24h |
| **High-risk tasks** | 2 (Task 10, Task 13 — financial display) |
