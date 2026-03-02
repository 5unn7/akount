# Banking Transfers — Implementation Plan

**Created:** 2026-02-21
**Status:** Draft
**Task:** DEV-46
**Estimated Effort:** 5-7 hours

---

## Overview

Implement inter-account transfer functionality with automatic journal entry creation. Allows users to move money between their own bank accounts (checking → savings, credit card payments from bank, etc.) with proper double-entry bookkeeping and multi-currency support.

**Core Pattern:** Transfer = 2 paired journal entries with `linkedEntryId` connecting them.

---

## Success Criteria

- [ ] POST /api/banking/transfers creates paired journal entries
- [ ] Transfer validates: accounts exist, same entity, sufficient balance
- [ ] Multi-currency transfers calculate FX conversion automatically
- [ ] Transfers page shows list with from/to accounts and amounts
- [ ] Create transfer form validates and shows live FX preview
- [ ] All operations maintain double-entry balance (debits = credits)
- [ ] Tenant isolation enforced (can't transfer to other tenant's accounts)
- [ ] Soft delete supported (transfers can be voided, not hard deleted)
- [ ] Tests cover: happy path, insufficient balance, cross-entity, multi-currency

---

## Architecture Decisions

### Why Paired Journal Entries (Not Dedicated Transfer Model)?

**Decision:** Use existing `JournalEntry` model with `linkedEntryId` + `sourceType: TRANSFER`

**Rationale:**
- ✅ Reuses existing journal entry infrastructure (approval, voiding, audit)
- ✅ Maintains double-entry integrity via established validation
- ✅ Already has `linkedEntryId` field for transfer pairs
- ✅ `TRANSFER` source type already defined in enum
- ✅ Simpler schema (no new model to maintain)

**How it works:**
1. Transfer from Account A → Account B creates 2 journal entries
2. Entry 1: DR Account B's GL, CR Account A's GL, `sourceType: TRANSFER`, `linkedEntryId: entry2.id`
3. Entry 2: reverse of Entry 1, `linkedEntryId: entry1.id`
4. Both entries posted immediately (status: POSTED)

### Multi-Currency Handling

**Decision:** Support same-currency and multi-currency transfers

**Logic:**
- Same currency (CAD → CAD): amount matches on both sides
- Multi-currency (USD → CAD): require FX rate, convert amounts, store exchange rate on journal lines
- Base currency amounts calculated for both entries

---

## Tasks

### Task 1: Create transfer Zod schema
**File:** `apps/api/src/domains/banking/schemas/transfer.schema.ts` (NEW)
**What:** Define CreateTransferSchema with validation:
- `fromAccountId` (cuid, required)
- `toAccountId` (cuid, required, not same as fromAccountId)
- `amount` (int, positive)
- `currency` (string, 3 chars, matches fromAccount currency)
- `date` (ISO date, defaults to today)
- `memo` (string, optional)
- `exchangeRate` (number, optional, for multi-currency)
**Depends on:** none
**Success:** Schema validates sample transfer data, rejects same-account transfers

---

### Task 2: Create transfer service
**File:** `apps/api/src/domains/banking/services/transfer.service.ts` (NEW)
**What:** Implement TransferService with:
- `createTransfer()` — creates paired journal entries
  - Load both accounts (with tenant filter + glAccountId check)
  - Validate: same entity, sufficient balance (if from CREDIT_CARD or LOAN, allow negative), accounts active
  - Get or calculate exchange rate (if multi-currency)
  - Create 2 journal entries with `linkedEntryId` connecting them
  - Set `sourceType: TRANSFER`, `status: POSTED`
  - Create journal lines (2 per entry = 4 total lines)
  - Ensure debits = credits in both original and base currency
  - Create audit log entries for both JEs
- `listTransfers()` — list transfers for entity (filters by `sourceType: TRANSFER`)
- `getTransfer()` — get single transfer with linked entry
**Depends on:** Task 1
**Risk:** high (financial data, double-entry bookkeeping, multi-currency)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** createTransfer() creates 2 balanced JEs, listTransfers() returns transfer pairs

---

### Task 3: Create transfer routes
**File:** `apps/api/src/domains/banking/routes/transfers.ts` (NEW)
**What:** Define Fastify routes:
- `POST /` — create transfer (OWNER, ADMIN, ACCOUNTANT roles)
- `GET /` — list transfers with pagination (OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER)
- `GET /:id` — get single transfer with linked entry (OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER)
Wire auth + tenant middleware, Zod validation
**Depends on:** Task 2
**Review:** `fastify-api-reviewer`
**Success:** Routes registered, return 201 on create, 200 on list/get

---

### Task 4: Register transfer routes in banking domain
**File:** `apps/api/src/domains/banking/routes/index.ts`
**What:** Import and register `transferRoutes` under `/transfers` prefix
**Depends on:** Task 3
**Success:** `fastify.register(transferRoutes, { prefix: '/transfers' })` added

---

### Task 5: Create transfer service tests
**File:** `apps/api/src/domains/banking/services/__tests__/transfer.service.test.ts` (NEW)
**What:** Test coverage for:
- Happy path: same-currency transfer
- Multi-currency transfer with FX rate
- Validation: insufficient balance, same account, cross-entity, inactive accounts
- Tenant isolation (can't transfer to other tenant's accounts)
- Double-entry balance (debits = credits)
- Soft delete behavior (voiding paired entries)
Use mocks for prisma, test helper utilities from `apps/api/src/test-utils/`
**Depends on:** Task 2
**Success:** All tests pass, 90%+ coverage on transfer.service.ts

---

### Task 6: Create transfer route tests
**File:** `apps/api/src/domains/banking/routes/__tests__/transfers.routes.test.ts` (NEW)
**What:** Test HTTP endpoints:
- POST /api/banking/transfers (201, 400 validation, 403 RBAC, 404 accounts)
- GET /api/banking/transfers (200 with pagination)
- GET /api/banking/transfers/:id (200, 404)
Mock service layer
**Depends on:** Task 3
**Success:** All route tests pass

---

### Task 7: Create frontend transfer API client
**File:** `apps/web/src/lib/api/transfers.ts` (NEW)
**What:** Define types and functions:
- `Transfer` interface (maps to paired JEs)
- `CreateTransferInput` (fromAccountId, toAccountId, amount, currency, date, memo, exchangeRate)
- `createTransfer()` server function
- `listTransfers()` server function
- `getTransfer()` server function
**Depends on:** Task 4
**Success:** API client compiles, follows apiClient pattern from `accounts.ts`

---

### Task 8: Create transfer form component
**File:** `apps/web/src/components/banking/TransferForm.tsx` (NEW)
**What:** Client component with:
- From account selector (dropdown, exclude "to" account)
- To account selector (dropdown, exclude "from" account)
- Amount input (integer cents, min 1)
- Currency display (from fromAccount.currency)
- FX rate field (conditional, only if currencies differ)
- FX preview (shows converted amount if multi-currency)
- Date picker (defaults to today)
- Memo textarea
- Submit button calls server action
- Validation: amount > 0, accounts different, FX rate if needed
- Toast on success/error
**Depends on:** Task 7
**Success:** Form renders, validates, calls createTransfer on submit

---

### Task 9: Create transfers page
**File:** `apps/web/src/app/(dashboard)/banking/transfers/page.tsx`
**What:** Replace "Coming Soon" stub with:
- Server component fetches accounts (for dropdowns) + recent transfers
- Header with "Transfers" title + "Create Transfer" button
- TransferForm in a sheet/dialog
- Transfer list table: date, from account, to account, amount, status
- Empty state if no transfers
- Loading/error states exist (already created, update if needed)
**Depends on:** Task 8
**Review:** `nextjs-app-router-reviewer`
**Success:** Navigate to `/banking/transfers`, shows list, create button opens form

---

### Task 10: Create transfers server actions
**File:** `apps/web/src/app/(dashboard)/banking/transfers/actions.ts` (NEW)
**What:** Wrap API functions:
- `createTransferAction()` — wraps createTransfer from lib/api/transfers
- `listTransfersAction()` — wraps listTransfers (for client-side pagination)
**Depends on:** Task 7
**Success:** Actions callable from client components, follow existing action pattern

---

### Task 11: Update loading.tsx (if needed)
**File:** `apps/web/src/app/(dashboard)/banking/transfers/loading.tsx`
**What:** Check if existing skeleton matches new page structure, update if needed
**Depends on:** Task 9
**Success:** Loading state shows skeleton matching final page layout

---

### Task 12: Update navigation badge
**File:** `apps/web/src/lib/navigation.ts`
**What:** Remove "Coming Soon" comment/flag from Transfers nav item (if exists)
**Depends on:** Task 9
**Success:** Navigation shows Transfers without any "stub" indicator

---

## Reference Files

- `apps/api/src/domains/accounting/services/journal-entry.service.ts:150-250` — createEntry pattern
- `apps/api/src/domains/accounting/services/posting.service.ts:23-120` — how to create JEs from transactions
- `apps/api/src/domains/banking/services/account.service.ts` — account CRUD pattern
- `apps/web/src/components/accounts/AccountFormSheet.tsx` — account selector UX
- `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` — page structure pattern

---

## Edge Cases

| Case | Handling |
|------|----------|
| **Same account selected** | Validate `fromAccountId !== toAccountId`, return 400 |
| **Insufficient balance** | Check `fromAccount.currentBalance >= amount` (skip for CREDIT_CARD/LOAN) |
| **Cross-entity transfer** | Validate both accounts belong to same `entityId`, return 403 |
| **Inactive account** | Validate both accounts `isActive: true`, return 400 |
| **Multi-currency without FX rate** | If `fromAccount.currency !== toAccount.currency` and no `exchangeRate`, return 400 |
| **Missing GL accounts** | If account.glAccountId is null, return 400 "Link GL account first" |
| **Concurrent transfers** | Use Serializable isolation in transaction to prevent race conditions |
| **Voiding transfer** | Void both linked journal entries atomically |

---

## Domain Impact

**Primary domain:** Banking
**Adjacent domains:**
- **Accounting** — creates journal entries (writes to JournalEntry, JournalLine)
- **System** — uses Entity for tenant filtering

**Cross-domain data:**
- Reads: `Account`, `Entity`, `GLAccount`
- Writes: `JournalEntry`, `JournalLine`, `AuditLog`

---

## Testing Strategy

### Backend Tests

**Service tests** (`transfer.service.test.ts`):
- ✅ Create same-currency transfer (CAD → CAD)
- ✅ Create multi-currency transfer (USD → CAD) with FX rate
- ❌ Reject same account (fromAccountId === toAccountId)
- ❌ Reject insufficient balance (amount > fromAccount.balance)
- ❌ Reject cross-entity (accounts from different entities)
- ❌ Reject inactive accounts
- ❌ Reject missing GL accounts (glAccountId null)
- ❌ Reject cross-tenant (accounts from different tenants)
- ✅ Verify double-entry balance (debits = credits)
- ✅ Verify linked entry IDs match
- ✅ Verify both entries have sourceType: TRANSFER

**Route tests** (`transfers.routes.test.ts`):
- ✅ POST /api/banking/transfers returns 201
- ❌ POST with invalid schema returns 400
- ❌ POST without auth returns 401
- ❌ POST with insufficient role returns 403
- ✅ GET /api/banking/transfers returns 200 with pagination
- ✅ GET /api/banking/transfers/:id returns 200 with linked entry

### Frontend Tests

- Manual testing (no automated frontend tests yet per Phase 6 plan)
- Verify form validation
- Verify FX preview calculation
- Verify toast notifications

---

## Review Agent Coverage

| Task | Agents |
|------|--------|
| Task 2 (service) | `financial-data-validator`, `security-sentinel` |
| Task 3 (routes) | `fastify-api-reviewer` |
| Task 5, 6 (tests) | `kieran-typescript-reviewer` |
| Task 9 (page) | `nextjs-app-router-reviewer`, `design-system-enforcer` |

---

## Implementation Checklist

### Backend (Tasks 1-6)
- [ ] Task 1: Create transfer schema (30m)
- [ ] Task 2: Create transfer service (3-4h) ⚠️ HIGH RISK
- [ ] Task 3: Create transfer routes (1h)
- [ ] Task 4: Register routes in domain index (15m)
- [ ] Task 5: Service tests (2h)
- [ ] Task 6: Route tests (1h)

### Frontend (Tasks 7-12)
- [ ] Task 7: Create API client (30m)
- [ ] Task 8: Create transfer form component (2-3h)
- [ ] Task 9: Update transfers page (1-2h)
- [ ] Task 10: Create server actions (30m)
- [ ] Task 11: Update loading skeleton (15m)
- [ ] Task 12: Remove "Coming Soon" badge (5m)

---

## Technical Notes

### Journal Entry Structure for Transfer

**Transfer: $500 from Checking (GL 1010) → Savings (GL 1020)**

Entry 1 (from Checking perspective):
```
DR 1020 Savings        $500  // Money goes TO savings
CR 1010 Checking       $500  // Money leaves checking
sourceType: TRANSFER
linkedEntryId: entry2.id
```

Entry 2 (from Savings perspective):
```
DR 1020 Savings        $500  // Money arrives at savings
CR 1010 Checking       $500  // Money came FROM checking
sourceType: TRANSFER
linkedEntryId: entry1.id
```

**Both entries are identical** — they represent the same economic event from different perspectives. The `linkedEntryId` connects them for audit trail.

### Multi-Currency Transfer

**Transfer: $100 USD from USD Checking → CAD Savings, FX rate 1.35**

Entry 1:
```
DR Savings (CAD)       $135  // (100 * 1.35)
CR Checking (USD)      $100
exchangeRate: 1.35
baseCurrencyDebit: $135 CAD
baseCurrencyCredit: $135 CAD  // converted
```

Entry 2: (identical)

---

## Risk Assessment

**High-risk areas:**
- ✅ Task 2 (service) — financial logic, double-entry, multi-currency, balance checks
- ✅ Task 5 (tests) — must cover all validation paths

**Medium-risk:**
- Task 8 (form) — FX calculation must match backend
- Task 9 (page) — Server/client separation (no Prisma in client components)

**Low-risk:**
- Tasks 1, 3, 4, 7, 10, 11, 12 — standard CRUD wiring

---

## Dependencies

**Sequential chain (must follow order):**
```
Task 1 (schema)
  ↓
Task 2 (service)
  ↓
Task 3 (routes)
  ↓
Task 4 (register routes)
  ↓
Task 5, 6 (tests - parallel)
  ↓
Task 7 (API client)
  ↓
Task 8 (form), Task 10 (actions) - parallel
  ↓
Task 9 (page)
  ↓
Task 11, 12 (polish - parallel)
```

**External dependencies:**
- Accounts must have `glAccountId` set (link to GL account)
- Entity must have `functionalCurrency` set
- Chart of Accounts must exist (seeded)

---

## Testing Strategy Details

### Critical Test Cases

**Happy Path:**
1. Same-currency transfer (both accounts CAD)
2. Multi-currency transfer (USD → CAD)
3. Transfer between different account types (BANK → CREDIT_CARD)

**Validation:**
1. Reject if `fromAccountId === toAccountId`
2. Reject if accounts belong to different entities
3. Reject if accounts belong to different tenants
4. Reject if either account inactive
5. Reject if either account missing glAccountId
6. Reject if amount <= 0
7. Reject if multi-currency without exchangeRate

**Financial Integrity:**
1. Verify debits = credits in original currency
2. Verify debits = credits in base currency (if multi-currency)
3. Verify both JEs have matching amounts
4. Verify linkedEntryId connects the pair
5. Verify sourceType = TRANSFER on both

**Tenant Isolation:**
1. Verify can't transfer to other tenant's account
2. Verify can't see other tenant's transfers in list

---

## Progress

- [x] Task 1: Transfer schema
- [x] Task 2: Transfer service ⚠️
- [x] Task 3: Transfer routes
- [x] Task 4: Register routes
- [x] Task 5: Service tests (13 tests, all passing)
- [x] Task 6: Route tests (11 tests, all passing)
- [x] Task 7: API client
- [x] Task 8: Transfer form
- [x] Task 9: Transfers page
- [x] Task 10: Server actions
- [x] Task 11: Update loading
- [x] Task 12: Remove stub badge (completed via page replacement)

**Status:** ✅ COMPLETE (12/12 tasks done)
**Tests:** 24 new tests, all passing (1,157 total suite)
**Commits:** 3 (backend, frontend, tests)

---

_Plan executed and complete — 2026-02-21_
