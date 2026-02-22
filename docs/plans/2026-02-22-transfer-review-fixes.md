# Transfer Service Review Fixes

**Created:** 2026-02-22
**Status:** Complete
**Source:** Code review of DEV-46 (Banking Transfers Backend)

## Overview

Fixes 3 issues identified during code review of the transfer service implementation (DEV-46 Tasks 1-4). The most critical is a financial integrity bug where `voidTransfer` marks journal entries as VOIDED but does not reverse account balances, leaving the ledger in an inconsistent state.

## Success Criteria

- [ ] Voiding a transfer reverses both account balances atomically
- [ ] Transfer route error handling uses `AccountingError.statusCode` (consistent with all other routes)
- [ ] Overdraft-allowed account types are defined as a constant with JSDoc
- [ ] All 1133+ tests pass after changes

## Tasks

### Task 1: Fix `voidTransfer` balance reversal (FIN-23)
**File:** `apps/api/src/domains/banking/services/transfer.service.ts`
**What:** Add account balance reversal logic to `voidTransfer`. When voiding a transfer:
1. Parse `sourceDocument` to get `fromAccountId`, `toAccountId`, `amount`, and `exchangeRate`
2. Reverse the balance changes: increment `fromAccount.currentBalance` by original amount, decrement `toAccount.currentBalance` by converted amount
3. Use the same `toAmount` calculation as `createTransfer` for multi-currency consistency

**Implementation approach:**
```typescript
// In voidTransfer, after loading the entry, extract transfer metadata:
const source = entry.sourceDocument as { fromAccountId: string; toAccountId: string; amount: number; exchangeRate?: number };

// Calculate toAmount (same logic as createTransfer)
const toAmount = source.exchangeRate ? Math.round(source.amount * source.exchangeRate) : source.amount;

// Reverse balances (increment from, decrement to)
await Promise.all([
  tx.account.update({
    where: { id: source.fromAccountId },
    data: { currentBalance: { increment: source.amount } },
  }),
  tx.account.update({
    where: { id: source.toAccountId },
    data: { currentBalance: { decrement: toAmount } },
  }),
]);
```

**Also:** Add a `sourceDocument` select to the void query (currently not selecting it).

**Depends on:** none
**Risk:** high (financial data - balance integrity)
**Review:** `financial-data-validator`
**Success:** Voiding a transfer restores both account balances to pre-transfer values. Test verifies balance changes.

### Task 2: Refactor transfer route error handling (DRY-8)
**File:** `apps/api/src/domains/banking/routes/transfers.ts`
**What:** Replace string-matching error handling with `AccountingError.statusCode` pattern used by all other routes.

**Current (fragile):**
```typescript
if (message.includes('not found')) return reply.status(404)...
if (message.includes('insufficient balance')) return reply.status(400)...
```

**Target (established pattern from `gl-account.ts`):**
```typescript
if (error instanceof AccountingError) {
  return reply.status(error.statusCode).send({
    error: error.code,
    message: error.message,
    details: error.details,
  });
}
```

Extract the `handleAccountingError` helper or inline the pattern across all 3 route handlers.

**Depends on:** none
**Risk:** none (error handling only, doesn't change behavior)
**Success:** All 3 transfer routes use `instanceof AccountingError` pattern. Tests pass.

### Task 3: Extract overdraft constant + multi-currency doc comment (FIN-24)
**File:** `apps/api/src/domains/banking/services/transfer.service.ts`
**What:** Two small improvements:

1. Extract hardcoded `['CREDIT_CARD', 'LOAN', 'MORTGAGE']` to a documented constant:
```typescript
/** Account types that allow negative balance (overdraft). These accounts represent liabilities. */
const OVERDRAFT_ALLOWED_TYPES = ['CREDIT_CARD', 'LOAN', 'MORTGAGE'] as const;
```

2. Add a `@todo` comment on the multi-currency base conversion logic (lines 152-162) documenting the limitation:
```typescript
// @todo Multi-currency limitation: exchangeRate is used for both cross-account
// conversion AND entity base currency conversion. This works when one account
// matches the entity's functional currency, but may produce incorrect
// baseCurrencyAmount when NEITHER account matches. A proper fix requires
// separate exchange rates per currency pair or an exchange rate table.
```

**Depends on:** none
**Risk:** none (constant extraction + documentation only)
**Success:** Constant extracted, comment added, tests pass.

## Reference Files

- `apps/api/src/domains/accounting/routes/gl-account.ts` — `handleAccountingError` pattern (line 203)
- `apps/api/src/domains/accounting/errors.ts` — `AccountingError` class definition
- `apps/api/src/domains/banking/services/__tests__/transfer.service.test.ts` — existing tests (503 lines)
- `apps/api/src/test-utils/financial-assertions.ts` — `assertIntegerCents`, `assertMoneyFields`

## Edge Cases

- **Void already-voided transfer:** Already handled (409 `ALREADY_VOIDED`)
- **Void with missing sourceDocument:** Defensive null check needed in Task 1 — throw `AccountingError` if sourceDocument is missing/malformed
- **Multi-currency void:** Must use same `exchangeRate` from original transfer (stored in `sourceDocument`)
- **Account deleted between create and void:** `account.update` will fail — wrap in try/catch with descriptive error

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 1 (FIN-23) | `financial-data-validator`, `security-sentinel` |
| Task 2 (DRY-8) | `fastify-api-reviewer` |
| Task 3 (FIN-24) | none (documentation only) |

## Domain Impact

- **Primary domain:** Banking (transfer service)
- **Adjacent domains:** Accounting (journal entries, GL balances). No schema changes needed.

## Testing Strategy

- **Task 1:** Update existing `voidTransfer` tests in `transfer.service.test.ts` to verify:
  - Account balances are reversed after void
  - Multi-currency void uses stored exchange rate
  - Void with missing sourceDocument throws error
- **Task 2:** No new tests needed (error handling behavior unchanged, just implementation pattern)
- **Task 3:** No tests needed (constant + comments only)

## Effort Estimate

| Task | Effort | Priority |
|------|--------|----------|
| Task 1 (FIN-23) | 30-45 min | Critical (financial bug) |
| Task 2 (DRY-8) | 15-20 min | Medium (code quality) |
| Task 3 (FIN-24) | 10 min | Low (documentation) |
| **Total** | **~1 hour** | |

## Progress

- [x] Task 1: Fix voidTransfer balance reversal (FIN-23)
- [x] Task 2: Refactor transfer route error handling (DRY-8)
- [x] Task 3: Extract overdraft constant + multi-currency doc (FIN-24)
