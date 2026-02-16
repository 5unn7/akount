# Phase 3 Completion — Revised Plan

**Created:** 2026-02-15
**Status:** Draft
**Original Plan:** [docs/plans/2026-02-12-phase-3-post-your-money.md](../plans/2026-02-12-phase-3-post-your-money.md)

## Overview

Phase 3 is **~90% complete**, not "not started" as TASKS.md claims. The backend accounting engine is fully built (117 tests) and the frontend has complete implementations for Chart of Accounts, Journal Entries list, and Manual JE form. This plan covers the **remaining 10%** to close out Phase 3.

## Current State Assessment

### Backend (95% complete)
- **Chart of Accounts API:** 7 endpoints, 30 tests — DONE
- **Journal Entry API:** 12 endpoints, 31 tests — DONE
- **Posting Service:** Single/bulk/unpost, 14 tests — DONE
- **Multi-currency posting:** Logic implemented, tests incomplete (~10 tests needed)
- **Split transaction posting:** Logic implemented, tests incomplete (~10 tests needed)

### Frontend (85% complete)
- **Chart of Accounts page:** 621-line client component, tree view, CRUD sheet, seed button — DONE
- **Journal Entries list:** 498-line client, expandable rows, approve/void/delete — DONE
- **Journal Entry form:** 358-line form, dynamic lines, live balance indicator — DONE
- **API client:** 323 lines, full types + 12 functions — DONE
- **Server actions:** Both COA and JE actions wired — DONE
- **Transaction posting UI:** "Post to GL" button on banking transaction pages — NOT DONE

### Code Quality Issues Found
- 3x `console.error` in `chart-of-accounts-client.tsx` (lines 322, 335, 352) — violates guardrails
- `deactivateGLAccount` API function hits `/deactivate` endpoint — verify backend route match
- Missing `React` import at top of `journal-entries-client.tsx` (imported at bottom, line 497)

## Success Criteria

- [ ] Multi-currency posting tests passing (10 tests)
- [ ] Split transaction posting tests passing (10 tests)
- [ ] Transaction "Post to GL" button on banking pages
- [ ] `console.error` replaced with proper error handling (no console.* in production)
- [ ] Deactivate endpoint verified working end-to-end
- [ ] TASKS.md and STATUS.md updated to reflect actual Phase 3 completion

---

## Tasks

### Task 1: Backend Sprint 3 Tests — Multi-Currency
**File:** `apps/api/src/domains/accounting/__tests__/posting-multicurrency.test.ts`
**What:** Write tests for multi-currency posting logic already implemented in `posting.service.ts`. Test FX rate lookup, base currency balance validation, rounding behavior, and missing FX rate error handling.
**Depends on:** none
**Risk:** high (financial calculations)
**Success:** 10 tests passing covering: same-currency posting (no FX), cross-currency posting with FX conversion, missing FX rate error (MISSING_FX_RATE), weekend date nearest-date lookup, base currency balance validation, rounding precision

### Task 2: Backend Sprint 3 Tests — Split Transactions
**File:** `apps/api/src/domains/accounting/__tests__/posting-splits.test.ts`
**What:** Write tests for split transaction posting logic. Test multi-line GL postings, amount mismatch validation, largest-remainder rounding, and cross-entity split prevention.
**Depends on:** none
**Risk:** high (financial calculations)
**Success:** 10 tests passing covering: basic 2-way split, 3+ way split, amount mismatch error (SPLIT_AMOUNT_MISMATCH), cross-entity split rejection, multi-currency split with rounding, split with inactive GL account

### Task 3: Fix Console.error in COA Client
**File:** `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx`
**What:** Replace 3 `console.error` calls (lines 322, 335, 352) with proper error state handling. Show user-visible error messages instead of logging to console.
**Depends on:** none
**Success:** Zero `console.error` or `console.log` in file. Errors shown to user via state or toast.

### Task 4: Fix React Import in Journal Entries Client
**File:** `apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entries-client.tsx`
**What:** Move `import React from 'react'` from line 497 to top of file with other imports. This is a code quality issue (import at bottom of file).
**Depends on:** none
**Success:** React imported at top, file works correctly

### Task 5: Transaction Posting UI on Banking Pages
**File:** `apps/web/src/app/(dashboard)/banking/transactions/` (multiple files)
**What:** Add "Post to GL" functionality to the banking transaction list/detail views. This includes:
- A "Post to GL" button per transaction (when unposted)
- A GL account picker dropdown (from active accounts)
- "Posted" badge showing posting status
- "View Journal Entry" link for posted transactions
- Bulk "Post Selected" action (max 50)
**Depends on:** Task 3, Task 4 (minor, parallel OK)
**Risk:** high (connects banking → accounting domains)
**Success:** Can select unposted transactions, pick GL account, post them, see "Posted" badge, click to view the generated journal entry

### Task 6: Verify Deactivate Endpoint Alignment
**File:** `apps/web/src/lib/api/accounting.ts` + `apps/api/src/domains/accounting/routes/gl-account.ts`
**What:** Verify the frontend `deactivateGLAccount` function (POST `/deactivate`) matches the backend route. If mismatched, fix the frontend to call the correct endpoint (likely DELETE `/:id` which soft-deactivates).
**Depends on:** none
**Success:** Deactivating a GL account works end-to-end through the UI

### Task 7: Update Status Files
**File:** `TASKS.md`, `STATUS.md`, `ROADMAP.md`
**What:** Update all status tracking files to reflect Phase 3's actual completion state (~90%). Move Phase 3 backend tasks to completed. Add remaining frontend tasks to active work. Update metrics.
**Depends on:** Tasks 1-6 (update after work is done)
**Success:** TASKS.md accurately reflects remaining work, STATUS.md shows Phase 3 progress, ROADMAP.md shows Phase 3 as "IN PROGRESS (90%)"

---

## Reference Files

- `apps/api/src/domains/accounting/services/posting.service.ts` — posting logic to test
- `apps/api/src/domains/accounting/__tests__/posting.service.test.ts` — existing test patterns
- `apps/api/src/domains/accounting/__tests__/helpers.ts` — shared test utilities
- `apps/web/src/app/(dashboard)/banking/transactions/` — where to add posting UI
- `apps/web/src/lib/api/accounting.ts` — API client (already has `postTransaction`, `postBulkTransactions`)
- `packages/types/src/financial/money.ts` — branded Cents type + helpers

## Edge Cases

- **Post already-posted txn:** 409 ALREADY_POSTED (backend handles, UI should disable button)
- **Post to inactive GL:** 400 GL_ACCOUNT_INACTIVE (backend handles, UI should filter inactive)
- **Bank account not mapped to GL:** 400 BANK_ACCOUNT_NOT_MAPPED (UI should show helpful message)
- **Multi-currency rounding:** Largest-remainder algorithm (backend handles, test precision)
- **Split sum != transaction amount:** 400 SPLIT_AMOUNT_MISMATCH (backend validates)

## Testing Strategy

- **Backend:** 20 new tests in 2 test files (multi-currency + splits)
- **Frontend:** Manual verification through UI for posting flow
- **Run:** `cd apps/api && npx vitest run --reporter=verbose` after backend tests
- **Run:** `cd apps/web && npx next build` to verify no TypeScript errors

## Effort Estimate

| Task | Effort |
|------|--------|
| T1: Multi-currency tests | 1-2 hours |
| T2: Split transaction tests | 1-2 hours |
| T3: Fix console.error | 15 min |
| T4: Fix React import | 5 min |
| T5: Transaction posting UI | 3-4 hours |
| T6: Verify deactivate | 15 min |
| T7: Update status files | 15 min |
| **Total** | **~6-8 hours** |

## Progress

- [ ] Task 1: Multi-currency posting tests
- [ ] Task 2: Split transaction posting tests
- [ ] Task 3: Fix console.error in COA client
- [ ] Task 4: Fix React import in JE client
- [ ] Task 5: Transaction posting UI
- [ ] Task 6: Verify deactivate endpoint
- [ ] Task 7: Update status files
