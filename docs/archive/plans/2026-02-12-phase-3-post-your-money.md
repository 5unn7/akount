# Phase 3: Post Your Money — Implementation Plan

**Created:** 2026-02-12
**Status:** Approved (v2 — incorporates multi-agent review findings)
**Phase:** 3 of 6 (MVP)
**Depends on:** Phase 2 (Track Your Money) — COMPLETE
**Review:** 4-agent review completed 2026-02-12 (Financial, Architecture, Security, TypeScript)

## Overview

Phase 3 builds the **accounting engine** — the financial heart of Akount. Users can view and manage their Chart of Accounts, create journal entries (manual or auto-generated from transactions), and see their General Ledger postings. This phase enables the core `Transaction → JournalEntry` pipeline that makes bank data into real accounting data.

**Why it matters:** Without this, bank transactions are just data. With this, they become proper double-entry bookkeeping — the foundation for financial reports, tax filing, and business intelligence.

## Success Criteria

- [ ] Chart of Accounts CRUD with hierarchy (parent-child) and default COA seeding
- [ ] Manual journal entry creation with double-entry validation (debits = credits)
- [ ] Journal entry listing with filtering (date range, status, source type)
- [ ] Journal entry approval workflow (DRAFT → POSTED, immutable once posted)
- [ ] Void workflow (POSTED → VOIDED via reversing entry, audit trail preserved)
- [ ] Transaction posting service (bank transaction → journal entry)
- [ ] Multi-currency posting (original + base currency amounts on every journal line)
- [ ] Split transaction posting (one transaction → multiple GL lines)
- [ ] Fiscal period validation (reject posting to LOCKED/CLOSED periods)
- [ ] Cross-entity IDOR prevention (every user-supplied ID validated for same entity + tenant)
- [ ] All services enforce tenant isolation, soft delete, and audit logging
- [ ] 90+ backend tests covering financial logic edge cases
- [ ] Frontend: COA tree view, journal entries list, manual entry form

---

## Sprint Structure

| Sprint | Scope | Tasks | Est. Tests |
|--------|-------|-------|------------|
| 0 | Schema Migration + Infrastructure | T0, T1 | ~5 |
| 1 | Chart of Accounts API | T2–T7 | ~30 |
| 2 | Journal Entries + Posting | T8–T13 | ~45 |
| 3 | Multi-Currency + Splits | T14–T16 | ~20 |
| 4 | Frontend | T17–T20 | — |

---

## Sprint 0: Schema Migration + Infrastructure (Prerequisites)

### Task 0: Prisma Schema Migration

**File:** `packages/db/prisma/schema.prisma` + generated migration
**What:** Add all schema changes required by Phase 3 upfront in a single migration. This prevents mid-phase migrations and keeps the database changes atomic.

**Changes:**

1. **Add `VOIDED` to `JournalEntryStatus` enum:**

```prisma
enum JournalEntryStatus {
  DRAFT
  POSTED
  VOIDED    // ← NEW: void creates reversal, marks original as VOIDED
  ARCHIVED
}
```

2. **Add multi-currency fields to `JournalLine`:**

```prisma
model JournalLine {
  // existing fields...
  currency           String?   // ISO currency code of original amount (null = entity base currency)
  exchangeRate       Float?    // FX rate at posting time (immutable once set)
  baseCurrencyDebit  Int?      // debitAmount converted to entity functionalCurrency
  baseCurrencyCredit Int?      // creditAmount converted to entity functionalCurrency
}
```

3. **Add `glAccountId` to `TransactionSplit`:**

```prisma
model TransactionSplit {
  // existing fields...
  glAccountId   String?
  glAccount     GLAccount?  @relation(fields: [glAccountId], references: [id])
}
```

Also add reverse relation `transactionSplits TransactionSplit[]` to `GLAccount`.

4. **Add `Transaction` → `JournalEntry` relation:**

```prisma
model Transaction {
  // existing fields...
  journalEntry   JournalEntry? @relation(fields: [journalEntryId], references: [id])
}
```

Also add reverse relation `transactions Transaction[]` to `JournalEntry`.

5. **Add `glAccountId` to `Account` (bank-to-GL mapping):**

```prisma
model Account {
  // existing fields...
  glAccountId    String?
  glAccount      GLAccount?  @relation(fields: [glAccountId], references: [id])
}
```

Also add reverse relation `bankAccounts Account[]` to `GLAccount`.

6. **Add `updatedBy` to `JournalEntry`:**

```prisma
model JournalEntry {
  // existing fields...
  updatedBy      String?     // who last modified (approve, void)
}
```

7. **Add `entryNumber` to `JournalEntry`:**

```prisma
model JournalEntry {
  // existing fields...
  entryNumber    String?     // sequential per entity (JE-001, JE-002)
}
```

Add index: `@@index([entityId, entryNumber])`

8. **Add partial unique index on `Transaction.journalEntryId`** (raw SQL in migration):

```sql
CREATE UNIQUE INDEX "Transaction_journalEntryId_unique"
  ON "Transaction" ("journalEntryId")
  WHERE "journalEntryId" IS NOT NULL;
```

This prevents double-posting race conditions at the database level.

**Depends on:** none
**Risk:** medium (schema migration — must be reviewed before running)
**Success:** `npx prisma migrate dev` succeeds; `npx prisma generate` produces updated types; existing tests still pass

---

### Task 1: Accounting Error Types + Type Infrastructure

**Files:**

- `apps/api/src/domains/accounting/errors.ts`
- `apps/api/src/middleware/tenant.ts` (type fix)

**What:** Create typed error classes for the accounting domain and fix a pre-existing type issue.

**1a. Accounting error classes:**

```typescript
export class AccountingError extends Error {
  constructor(
    message: string,
    public readonly code: AccountingErrorCode,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AccountingError';
  }
}

export type AccountingErrorCode =
  | 'UNBALANCED_ENTRY'
  | 'ALREADY_POSTED'
  | 'ALREADY_VOIDED'
  | 'IMMUTABLE_POSTED_ENTRY'
  | 'ENTITY_NOT_FOUND'
  | 'GL_ACCOUNT_NOT_FOUND'
  | 'GL_ACCOUNT_INACTIVE'
  | 'DUPLICATE_ACCOUNT_CODE'
  | 'MISSING_FX_RATE'
  | 'SPLIT_AMOUNT_MISMATCH'
  | 'CROSS_ENTITY_REFERENCE'
  | 'FISCAL_PERIOD_CLOSED'
  | 'SEPARATION_OF_DUTIES';
```

**1b. Fix `tenantRole` type** in `apps/api/src/middleware/tenant.ts`:

```typescript
// Change: tenantRole?: string
// To:     tenantRole?: TenantUserRole
import { TenantUserRole } from '@akount/db';
```

**Depends on:** none
**Success:** Error classes import correctly; tenantRole is type-safe

---

## Sprint 1: Chart of Accounts API (T2–T7)

### Task 2: Route Structure Refactor

**File:** `apps/api/src/domains/accounting/routes.ts` → split into:

- `apps/api/src/domains/accounting/routes/index.ts`
- `apps/api/src/domains/accounting/routes/gl-account.ts`
- `apps/api/src/domains/accounting/routes/journal-entry.ts` (empty shell for Sprint 2)

**What:** Split monolithic routes.ts into sub-route files (matching banking domain pattern). Do this FIRST so all subsequent code is written in the correct file from the start. The existing stub file becomes `routes/index.ts` that registers sub-routes. Move chart-of-accounts stubs to `gl-account.ts`, journal-entry stubs to `journal-entry.ts`.

**Middleware pattern (use `withPermission` matching existing stubs):**

```typescript
fastify.addHook('onRequest', authMiddleware);
fastify.addHook('preHandler', tenantMiddleware);
// Per-route:
{ ...withPermission('accounting', 'chart-of-accounts', 'ACT') }
```

**Depends on:** none
**Success:** Server starts without errors; existing route paths unchanged; all stubs still return 501

---

### Task 3: GLAccount Zod Schemas

**File:** `apps/api/src/domains/accounting/schemas/gl-account.schema.ts`
**What:** Define Zod validation schemas for GLAccount CRUD operations.

**Use `z.nativeEnum()` from Prisma** — prevents enum drift:

```typescript
import { GLAccountType, NormalBalance } from '@akount/db';

export const CreateGLAccountSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  code: z.string().regex(/^\d{4}$/, 'Account code must be exactly 4 digits'),
  name: z.string().min(1).max(255),
  type: z.nativeEnum(GLAccountType),
  normalBalance: z.nativeEnum(NormalBalance),
  description: z.string().max(500).optional(),
  parentAccountId: z.string().cuid('Invalid parent account ID').optional(),
});

export const UpdateGLAccountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  parentAccountId: z.string().cuid().nullable().optional(),
});
// Note: code and type are IMMUTABLE after creation

export const ListGLAccountsSchema = z.object({
  entityId: z.string().cuid(),
  type: z.nativeEnum(GLAccountType).optional(),
  isActive: z.boolean().optional(),
  parentAccountId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
});

export const GLAccountParamsSchema = z.object({
  id: z.string().cuid(),
});
```

**Depends on:** Task 0 (Prisma types)
**Success:** Schemas export and validate sample data; reject invalid types, missing entityId, non-4-digit codes

---

### Task 4: GLAccount Service

**File:** `apps/api/src/domains/accounting/services/gl-account.service.ts`
**What:** Implement GLAccountService class following TransactionService pattern.

**Constructor:** `constructor(private tenantId: string, private userId: string)`

**Methods:**

- `listAccounts(params)` — Filter by entity + tenant (`entity: { tenantId }`), support hierarchy (flat list with depth), pagination
- `getAccount(id)` — Single account with children count and journal line count
- `createAccount(data)` — **CRITICAL validations:**
  - Validate entity belongs to tenant: `prisma.entity.findFirst({ where: { id: entityId, tenantId } })`
  - Validate unique code per entity (Prisma `@@unique` enforces, catch P2002 error → 409)
  - If `parentAccountId` provided: **validate parent belongs to SAME entity** (prevents cross-entity hierarchy IDOR)
  - Create with audit log
- `updateAccount(id, data)` — Cannot change code/type on accounts with journal lines (immutability guard)
- `deactivateAccount(id)` — Soft deactivate (`isActive: false`), block if account has unposted (DRAFT) journal lines
- `getAccountTree(entityId)` — Validate entity ownership, return hierarchical tree structure
- `getAccountBalances(entityId)` — Sum debit/credit amounts from journal lines per account, **use `Cents` branded type** from `@akount/types/financial` for arithmetic

**Error handling:** Throw `AccountingError` with appropriate codes:

- `ENTITY_NOT_FOUND` (403 behavior — don't reveal existence)
- `DUPLICATE_ACCOUNT_CODE` → 409
- `GL_ACCOUNT_NOT_FOUND` → 404
- `CROSS_ENTITY_REFERENCE` → 403 (parentAccountId in wrong entity)

**Depends on:** Tasks 0, 1, 3
**Risk:** high (financial data — account deactivation must not orphan journal entries)
**Success:** Service CRUD works with tenant isolation; tree query returns proper hierarchy; balance calculation is accurate; cross-entity parent reference is rejected

---

### Task 5: Default COA Template

**File:** `apps/api/src/domains/accounting/services/coa-template.ts`
**What:** Define a standard Chart of Accounts template (~25 accounts).

**Use `as const satisfies` for type safety:**

```typescript
import type { GLAccountType, NormalBalance } from '@akount/db';

interface COATemplateAccount {
  code: string;
  name: string;
  type: GLAccountType;
  normalBalance: NormalBalance;
  parentCode?: string;
}

const DEFAULT_COA_TEMPLATE = [
  { code: '1000', name: 'Cash', type: 'ASSET', normalBalance: 'DEBIT' },
  // ... ~25 accounts
] as const satisfies readonly COATemplateAccount[];
```

**Template accounts:**

```
Assets (1000-1999):
  1000 Cash
  1010 Petty Cash
  1100 Bank Account
  1200 Accounts Receivable
  1300 Inventory
  1400 Prepaid Expenses

Liabilities (2000-2999):
  2000 Accounts Payable
  2100 Credit Card Payable
  2200 Accrued Liabilities
  2300 Sales Tax Payable (HST/GST)
  2400 Income Tax Payable
  2500 Loans Payable

Equity (3000-3999):
  3000 Owner's Equity
  3100 Retained Earnings
  3200 Owner's Draws

Income (4000-4999):
  4000 Service Revenue
  4100 Product Sales
  4200 Interest Income
  4300 Other Income

Expenses (5000-6999):
  5000 Cost of Goods Sold
  5100 Advertising & Marketing
  5200 Bank Fees & Interest
  5300 Insurance
  5400 Office Supplies
  5500 Professional Fees
  5600 Rent & Utilities
  5700 Salaries & Wages
  5800 Travel & Meals
  5900 Depreciation
  5990 Other Expenses
```

**Export `seedDefaultCOA(entityId, tenantId, userId, prisma)` function:**

- **Atomic idempotency** — wrap in `prisma.$transaction()`:
  1. Load entity, verify `entity.tenantId === tenantId`
  2. Check if entity already has GL accounts → skip if so (return `{ skipped: true }`)
  3. Create all ~25 accounts
  4. Set parent-child relationships (1010.parentAccountId = 1000's id, etc.)
  5. Audit log the seeding action

**Depends on:** Task 4
**Success:** Calling seedDefaultCOA creates ~25 accounts for entity; idempotent; concurrent calls don't create duplicates

---

### Task 6: GLAccount Route Handlers

**File:** `apps/api/src/domains/accounting/routes/gl-account.ts`
**What:** Replace stub routes with real handlers:

| Route | Permission | Handler |
|-------|-----------|---------|
| `GET /chart-of-accounts` | VIEW | List/tree with filters (`entityId` required query param) |
| `GET /chart-of-accounts/:id` | VIEW | Single account with balances |
| `POST /chart-of-accounts` | ACT | Create account |
| `PATCH /chart-of-accounts/:id` | ACT | Update account |
| `DELETE /chart-of-accounts/:id` | ACT | Deactivate (soft — sets `isActive: false`) |
| `POST /chart-of-accounts/seed` | ACT | Seed default COA (one-time, **strict rate limit: 10 req/min**) |
| `GET /chart-of-accounts/balances` | VIEW | Account balances summary (`entityId` required) |

**Error mapping in route handlers** — use `AccountingError.statusCode`:

```typescript
try {
  const result = await service.createAccount(body);
  return reply.status(201).send(result);
} catch (error) {
  if (error instanceof AccountingError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
    });
  }
  throw error;
}
```

**Depends on:** Tasks 2, 3, 4, 5
**Success:** All routes work end-to-end with auth + tenant middleware; validation errors return 400; seed uses strict rate limit

---

### Task 7: GLAccount Tests

**Files:**

- `apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts`
- `apps/api/src/domains/accounting/__tests__/gl-account.routes.test.ts`
- `apps/api/src/domains/accounting/__tests__/helpers.ts` (shared test factory)

**What:** Comprehensive tests + shared test helpers.

**Shared helpers (`helpers.ts`):**

```typescript
export function createTestGLAccounts(entityId: string): GLAccountCreateInput[] { /* ... */ }
export function createTestJournalEntry(entityId: string, lines: JournalLineInput[]): JournalEntryCreateInput { /* ... */ }
export const TENANT_ID = 'test-tenant-abc';
export const OTHER_TENANT_ID = 'test-tenant-other';
export const USER_ID = 'test-user-123';
export const ENTITY_ID = 'test-entity-xyz';
export const OTHER_ENTITY_ID = 'test-entity-other';
```

**Service tests (~18):**

- CRUD: create, read, update, deactivate
- Hierarchy: create with parent, tree query, depth calculation
- Balance: aggregate journal line amounts, verify Cents arithmetic
- Tenant isolation: cross-tenant access blocked (returns null / throws)
- **Cross-entity IDOR: parentAccountId from different entity rejected**
- Unique code: duplicate code within same entity → 409
- Immutability: code/type change blocked when journal lines exist
- Deactivation: blocked when DRAFT journal lines reference account
- COA seeding: creates ~25 accounts, idempotent, concurrent safety

**Route tests (~12):**

- Auth required (401 without token)
- Tenant middleware (403 for missing tenant)
- Validation errors (bad types, missing fields → 400)
- Successful CRUD flow
- Seed endpoint (strict rate limit configured)
- Permission checks (VIEWER cannot create)

**Depends on:** Tasks 2–6
**Risk:** high (must validate tenant isolation and financial integrity)
**Success:** All tests pass; coverage includes cross-entity IDOR, duplicate codes, invalid hierarchy

---

## Sprint 2: Journal Entries + Transaction Posting (T8–T13)

### Task 8: JournalEntry Zod Schemas

**File:** `apps/api/src/domains/accounting/schemas/journal-entry.schema.ts`
**What:** Define schemas with **defense-in-depth validation**.

**Critical: Use `.refine()` for cross-field balance validation and `.nonnegative()` for amounts:**

```typescript
import { JournalEntrySourceType, JournalEntryStatus } from '@akount/db';

const JournalLineInputSchema = z.object({
  glAccountId: z.string().cuid('Invalid GL account ID'),
  debitAmount: z.number().int('Must be integer cents').nonnegative('Cannot be negative'),
  creditAmount: z.number().int('Must be integer cents').nonnegative('Cannot be negative'),
  memo: z.string().max(500).optional(),
}).refine(
  (line) => (line.debitAmount > 0) !== (line.creditAmount > 0),
  { message: 'Each line must have either a debit or credit amount, not both and not neither' }
);

export const CreateJournalEntrySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  date: z.string().datetime('Date must be ISO 8601'),
  memo: z.string().min(1, 'Memo is required').max(1000),
  lines: z.array(JournalLineInputSchema).min(2, 'Must have at least 2 lines'),
  sourceType: z.nativeEnum(JournalEntrySourceType).optional(),
  sourceId: z.string().cuid().optional(),
  sourceDocument: z.record(z.unknown())
    .refine(val => JSON.stringify(val).length < 10_000, 'Source document too large')
    .optional(),
}).refine(
  (entry) => {
    const totalDebits = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredits = entry.lines.reduce((s, l) => s + l.creditAmount, 0);
    return totalDebits === totalCredits;
  },
  { message: 'Journal entry must balance: total debits must equal total credits', path: ['lines'] }
);

export const ListJournalEntriesSchema = z.object({
  entityId: z.string().cuid(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.nativeEnum(JournalEntryStatus).optional(),
  sourceType: z.nativeEnum(JournalEntrySourceType).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const JournalEntryParamsSchema = z.object({
  id: z.string().cuid(),
});

export const PostTransactionSchema = z.object({
  transactionId: z.string().cuid('Invalid transaction ID'),
  glAccountId: z.string().cuid('Invalid GL account ID'),
});

export const PostBulkTransactionsSchema = z.object({
  transactionIds: z.array(z.string().cuid()).min(1).max(50, 'Maximum 50 transactions per batch'),
  glAccountId: z.string().cuid('Invalid GL account ID'),
});
```

**Depends on:** Task 0 (Prisma enums)
**Success:** Schema rejects: unbalanced entries, single-line entries, lines with both debit AND credit > 0, negative amounts, oversized sourceDocument, bulk arrays > 50

---

### Task 9: JournalEntry Service

**File:** `apps/api/src/domains/accounting/services/journal-entry.service.ts`
**What:** Implement JournalEntryService with full financial controls.

**Constructor:** `constructor(private tenantId: string, private userId: string)`

**Methods:**

**`listEntries(params)`** — Filter by entity + tenant, date range, status, source type; cursor pagination; include line count and total amounts.

**`getEntry(id)`** — Full entry with all lines, GL account names, source document. Add lightweight audit log (action: `VIEW`) for SOC 2 compliance.

**`createEntry(data)`** — **CRITICAL validations (all inside `prisma.$transaction()`):**

1. Validate entity belongs to tenant
2. **Fiscal period check:** If a FiscalPeriod exists for the entry date and its status is `LOCKED` or `CLOSED`, reject with `FISCAL_PERIOD_CLOSED` error. If no fiscal period exists for that date, allow (graceful degradation for MVP).
3. **Validate ALL glAccountIds** in one query: `WHERE id IN (...) AND entityId = X AND entity.tenantId = Y`. Compare `found.length === uniqueRequestedIds.length`. If mismatch → `CROSS_ENTITY_REFERENCE` error (prevents IDOR).
4. **Double-entry balance check** (service layer, defense-in-depth — Zod already checked): `SUM(debits) === SUM(credits)` using `sumCents()` from `@akount/types/financial`
5. Generate sequential `entryNumber` per entity (e.g., `JE-001`)
6. Create as `DRAFT` status with `createdBy: this.userId`
7. Store `sourceDocument` if provided (allowlisted fields only for auto-generated entries)
8. Audit log: `CREATE`

**`approveEntry(id)`** — Transition DRAFT → POSTED:

1. Load entry, verify tenant ownership
2. **Fiscal period check** (same as createEntry)
3. Reject if not `DRAFT` → `ALREADY_POSTED` error
4. **Separation of duties:** If `entry.createdBy === this.userId` AND role is not `OWNER`, reject with `SEPARATION_OF_DUTIES` error
5. Update status to `POSTED`, set `updatedBy`
6. Audit log: `UPDATE` with before/after status

**`voidEntry(id)`** — POSTED → VOIDED via reversing entry. **All inside `prisma.$transaction()` with `Serializable` isolation:**

1. Load entry, verify tenant + status is `POSTED` + no existing reversal (check `linkedFrom` relation is empty)
2. If any check fails → `ALREADY_VOIDED` error
3. Create reversing entry: swap debit/credit on each line, set `sourceType: 'ADJUSTMENT'`, `sourceId: original.id`, memo: `REVERSAL: ${original.memo}`
4. Set reversing entry status to `POSTED` immediately
5. Update original: `status: 'VOIDED'`, `linkedEntryId: reversal.id`, `updatedBy`
6. Audit log: `UPDATE` for original, `CREATE` for reversal

**`deleteEntry(id)`** — Only DRAFT entries can be soft-deleted:

1. Load entry, verify tenant + status is `DRAFT`
2. If `POSTED` or `VOIDED` → `IMMUTABLE_POSTED_ENTRY` error ("must void instead")
3. Soft delete: set `deletedAt`
4. Audit log: `DELETE`

**Depends on:** Task 8, Task 4 (GLAccount validation)
**Risk:** CRITICAL (double-entry validation is THE core financial invariant)
**Success:** Cannot create unbalanced entry; POSTED entries are immutable; void creates correct reversal with Serializable isolation; fiscal period respected; cross-entity GL references rejected; separation of duties enforced on approve

---

### Task 10: Transaction Posting Service

**File:** `apps/api/src/domains/accounting/services/posting.service.ts`
**What:** Transforms bank transactions into journal entries. Also absorbs bank-to-GL mapping logic (no separate AccountMappingService — folded into this service to keep it simple for MVP).

**Constructor:** `constructor(private tenantId: string, private userId: string)`

**Methods:**

**`postTransaction(transactionId, glAccountId)`** — **All inside `prisma.$transaction()` with `Serializable` isolation:**

1. Load Transaction with `account: { entity: { tenantId } }` filter + `deletedAt: null` + `journalEntryId: null` (not already posted)
2. If not found → `NOT_FOUND`. If already posted → `ALREADY_POSTED` (409)
3. Load GLAccount with `entity: { tenantId }` filter + `isActive: true`
4. If not found → `GL_ACCOUNT_NOT_FOUND`. If inactive → `GL_ACCOUNT_INACTIVE`
5. **Cross-entity check:** `transaction.account.entityId === glAccount.entityId` — if mismatch → `CROSS_ENTITY_REFERENCE` (403)
6. **Fiscal period check** on transaction date
7. Resolve bank account's GL account: `transaction.account.glAccountId` (the bank-to-GL mapping set via Account PATCH). If null → error "Bank account not mapped to GL account"
8. Create journal entry:
   - Outflow (negative amount): DR target GL account (expense), CR bank GL account
   - Inflow (positive amount): DR bank GL account, CR target GL account (income)
   - Use `absCents()` from `@akount/types/financial` for line amounts
9. Set `sourceType: 'BANK_FEED'`, `sourceId: transaction.id`
10. **Source document with allowlist:**

    ```typescript
    const snapshot = {
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      accountId: transaction.accountId,
      accountName: transaction.account.name,
      capturedAt: new Date().toISOString(),
    };
    // EXCLUDE: notes, tags, importBatchId, raw bank data, PII
    ```

11. Set entry status to `POSTED` immediately (auto-approved, not DRAFT)
12. Update `Transaction.journalEntryId` to the created entry
13. Audit log: `CREATE` for journal entry

**`postBulkTransactions(transactionIds[], glAccountId)`** — All-or-nothing batch:

1. **All inside single `prisma.$transaction()`**
2. Load ALL transactions: `WHERE id IN (...) AND account.entity.tenantId = X AND journalEntryId IS NULL AND deletedAt IS NULL`
3. **Count check:** `found.length === requested.length` — if mismatch, reject entire batch (some IDs invalid, wrong tenant, or already posted)
4. **Same-entity check:** All transactions must belong to the same entity as the GL account
5. Create one journal entry per transaction (individual entries for clear audit trail)
6. Update all `Transaction.journalEntryId` values

**`unpostTransaction(transactionId)`** — **All inside single `prisma.$transaction()`:**

1. Load Transaction, verify tenant, verify `journalEntryId` is not null
2. Call `JournalEntryService.voidEntry(journalEntryId)` (creates reversal, marks original as VOIDED)
3. Clear `Transaction.journalEntryId` (set to null)
4. Audit log: `UPDATE` for transaction

Note: The void logic lives in JournalEntryService. The PostingService orchestrates by calling voidEntry() then clearing the Transaction link. This keeps domain boundaries clean.

**Bank-to-GL mapping helper (private):**

- `resolveGLAccountForBank(accountId)` — reads `Account.glAccountId`, returns the GL account for posting
- If `Account.glAccountId` is null → error "Bank account not mapped to GL account"
- Mapping is SET via `PATCH /api/banking/accounts/:id` with `{ glAccountId }` body (uses existing Account route, updated in Task 12)

**Depends on:** Task 9
**Risk:** CRITICAL (creates financial records from bank data — must be correct and atomic)
**Success:** Posted transaction creates balanced journal entry; unpost creates reversal; bulk posting works atomically; cross-entity references rejected; race conditions prevented by Serializable isolation + unique partial index

---

### Task 11: Journal Entry Route Handlers

**File:** `apps/api/src/domains/accounting/routes/journal-entry.ts`
**What:** Replace stub routes:

| Route | Permission | Handler |
|-------|-----------|---------|
| `GET /journal-entries` | VIEW | List with filters + cursor pagination |
| `GET /journal-entries/:id` | VIEW | Full detail with lines |
| `POST /journal-entries` | ACT | Create manual entry (DRAFT) |
| `POST /journal-entries/:id/approve` | APPROVE | Approve (DRAFT → POSTED) |
| `POST /journal-entries/:id/void` | APPROVE | Void a POSTED entry (creates reversal) |
| `DELETE /journal-entries/:id` | ACT | Soft delete DRAFT only |
| `POST /journal-entries/post-transaction` | ACT | Post a bank transaction to GL |
| `POST /journal-entries/post-transactions` | ACT | Bulk post transactions (**burst rate limit**) |

**Error mapping:** Use `AccountingError.statusCode` directly (same pattern as Task 6).

**Depends on:** Tasks 8, 9, 10
**Success:** All routes work with auth/tenant; double-entry validation returns 400 for unbalanced entries; typed errors map to correct HTTP status codes

---

### Task 12: Update Banking Account Route

**File:** `apps/api/src/domains/banking/routes/accounts.ts` (or equivalent)
**What:** Add/update `PATCH /api/banking/accounts/:id` to accept `glAccountId` in the update body.

**Validation:**

- `glAccountId` must be a valid CUID
- GL account must exist, be active, and belong to **same entity** as the bank account
- GL account type should be `ASSET` (bank accounts are assets)

This is a small change to an existing route — no new service needed.

**Depends on:** Task 0 (Account.glAccountId field)
**Success:** Bank account can be mapped to a GL account; cross-entity mapping rejected

---

### Task 13: Journal Entry + Posting Tests

**Files:**

- `apps/api/src/domains/accounting/__tests__/journal-entry.service.test.ts`
- `apps/api/src/domains/accounting/__tests__/posting.service.test.ts`
- `apps/api/src/domains/accounting/__tests__/journal-entry.routes.test.ts`

**JournalEntry service tests (~18):**

- Create balanced entry, reject unbalanced (defense-in-depth with Zod)
- Reject single-line entry
- Reject negative debit/credit amounts
- **Reject lines referencing GL accounts from different entity (IDOR)**
- CRUD with tenant isolation (cross-tenant access blocked)
- Approve workflow: DRAFT → POSTED
- **Approve separation of duties: creator cannot approve own entry (non-OWNER)**
- Approve: OWNER can approve own entry (solo business exception)
- Void with reversal: creates correctly balanced reversing entry, original marked VOIDED
- **Void: concurrent double-void prevented (Serializable isolation)**
- Delete only DRAFT; POSTED returns error
- Date range filtering, cursor pagination
- **Fiscal period: reject posting to CLOSED/LOCKED period**
- Audit logging on create, approve, void, delete

**Posting service tests (~14):**

- Post inflow transaction (DR Bank, CR Income) — verify amounts use Cents type
- Post outflow transaction (DR Expense, CR Bank)
- **Cross-entity IDOR: transaction from entity A + GL from entity B → rejected**
- **Cross-tenant IDOR: transaction from tenant B → rejected**
- Unpost (void): creates reversal, clears journalEntryId
- Bulk posting: all succeed atomically
- Bulk posting: one bad ID → entire batch rolls back
- **Bulk: mixed entities → rejected**
- Duplicate posting: already-posted transaction → 409
- **Race condition: concurrent post for same transaction → only one succeeds** (unique partial index)
- Source document: only allowlisted fields captured (no notes, no PII)
- Bank account without GL mapping → error
- GL account inactive → error

**Route tests (~13):**

- Auth + tenant middleware
- Validation: unbalanced entry → 400, negative amounts → 400
- Successful CRUD flow (create → list → approve → void)
- Post-transaction endpoint: success + error cases
- Bulk post: array > 50 → 400
- Permission: VIEWER cannot create/approve

**Depends on:** Tasks 8–12
**Risk:** CRITICAL (financial integrity tests — this is the test suite that prevents accounting bugs)
**Success:** All tests pass; double-entry invariant tested from every angle; IDOR prevented; race conditions handled

---

## Sprint 3: Multi-Currency + Splits (T14–T16)

### Task 14: Multi-Currency Posting Enhancement

**Files:** Update `posting.service.ts` + `journal-entry.service.ts` + schemas
**What:** Enhance posting to handle multi-currency transactions.

**Logic:** When `transaction.currency !== entity.functionalCurrency`:

1. Look up FX rate from FXRate table using **nearest-date fallback** (not exact date only):

   ```typescript
   const rate = await prisma.fXRate.findFirst({
     where: { base: txnCurrency, quote: entityCurrency, date: { lte: transactionDate } },
     orderBy: { date: 'desc' },
   });
   if (!rate) throw new AccountingError('No FX rate found', 'MISSING_FX_RATE', 400);
   ```

2. Also accept optional `exchangeRate` override in the posting request (user can set rate manually)
3. Convert amounts using `multiplyCents(amount, rate)` from `@akount/types/financial`
4. Store on each JournalLine: `currency`, `exchangeRate` (immutable), `baseCurrencyDebit`, `baseCurrencyCredit`
5. **Balance validation now checks BOTH:**
   - Original: `SUM(debitAmount) === SUM(creditAmount)` (in transaction currency)
   - Base: `SUM(baseCurrencyDebit) === SUM(baseCurrencyCredit)` (in entity functional currency)

**Schema enhancement — add multi-currency fields to JournalLineInputSchema:**

```typescript
const JournalLineInputSchema = z.object({
  glAccountId: z.string().cuid(),
  debitAmount: z.number().int().nonnegative(),
  creditAmount: z.number().int().nonnegative(),
  memo: z.string().max(500).optional(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
  exchangeRate: z.number().positive().optional(),
  baseCurrencyDebit: z.number().int().nonnegative().optional(),
  baseCurrencyCredit: z.number().int().nonnegative().optional(),
}).refine(/* debit xor credit */)
  .superRefine((line, ctx) => {
    // If currency provided, exchangeRate and baseCurrency amounts are required
    if (line.currency) {
      if (!line.exchangeRate)
        ctx.addIssue({ code: 'custom', message: 'Exchange rate required', path: ['exchangeRate'] });
      if (line.baseCurrencyDebit === undefined && line.debitAmount > 0)
        ctx.addIssue({ code: 'custom', message: 'Base currency debit required', path: ['baseCurrencyDebit'] });
      if (line.baseCurrencyCredit === undefined && line.creditAmount > 0)
        ctx.addIssue({ code: 'custom', message: 'Base currency credit required', path: ['baseCurrencyCredit'] });
    }
  });
```

**Depends on:** Task 0 (JournalLine schema fields), Tasks 9, 10
**Risk:** high (currency conversion errors compound across all reports)
**Success:** USD transaction in CAD entity creates correct journal entry with FX conversion; balances in both original and base currency; nearest-date FX lookup works for weekends

---

### Task 15: Split Transaction Posting

**File:** Update `posting.service.ts`
**What:** Handle split transactions (one bank transaction → multiple GL lines).

**`postSplitTransaction(transactionId, splits[])`** where splits = `[{ glAccountId, amount }]`:

1. Load Transaction with `isSplit: true`, verify tenant, verify not already posted
2. Load ALL split glAccountIds — same cross-entity validation as Task 10
3. **Validate:** `SUM(split.amount) === ABS(transaction.amount)` using `sumCents()`. If mismatch → `SPLIT_AMOUNT_MISMATCH` (400)
4. **Rounding remainder strategy (for multi-currency splits):** Use largest-remainder allocation:
   - Convert each split amount to base currency
   - Calculate expected total (convert transaction total to base currency)
   - If 1-cent difference due to rounding, add/subtract remainder to the largest split
5. Create journal entry with N+1 lines: N category lines + 1 bank account line
6. Persist `glAccountId` on each `TransactionSplit` record (for audit trail)
7. Set `Transaction.journalEntryId`

**Depends on:** Task 10, Task 0 (TransactionSplit.glAccountId)
**Success:** Split transaction creates multi-line journal entry; split amounts sum to transaction total; rounding remainders handled; glAccountId persisted on splits

---

### Task 16: Multi-Currency + Split Tests

**Files:** Update existing test files + add new
**What:**

**Multi-currency tests (~10):**

- USD transaction in CAD entity → correct FX conversion
- FX rate nearest-date lookup (transaction on Saturday uses Friday's rate)
- Missing FX rate → 400 with clear message
- Manual exchange rate override
- Base currency balance validation (debits = credits in base currency)
- FX rate stored as immutable on journal line
- `multiplyCents()` used correctly (no float contamination)

**Split tests (~10):**

- Split posting: 2-way split → 3-line journal entry
- Split posting: 3-way split → 4-line journal entry
- Split amount validation: mismatch → 400
- **Cross-entity: split glAccountIds from different entity → rejected**
- Split with multi-currency: rounding remainder allocated correctly
- glAccountId persisted on TransactionSplit records
- Split transaction unpost (void) → reversal entry + journalEntryId cleared

**Depends on:** Tasks 14, 15
**Success:** All tests pass; multi-currency and split edge cases covered; rounding is deterministic

---

## Sprint 4: Frontend (T17–T20)

### Task 17: Chart of Accounts Page

**Files:**

- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/page.tsx` (Server Component — replace placeholder)
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx` (Client Component)
- `apps/web/src/lib/api/accounting.ts` (API client functions)

**What:** Replace placeholder with functional COA page:

- Tree view showing account hierarchy (collapsible parent-child)
- Columns: Code, Name, Type, Normal Balance, Balance (mono font for amounts), Status
- Add Account button → slide-out form (Sheet panel, matching existing patterns)
- Edit/deactivate actions per row
- "Seed Default COA" button if entity has no accounts (disabled after seeding)
- Balances column showing running total from journal lines
- Filter by type (Asset, Liability, etc.)

**Design:** Follow Financial Clarity aesthetic — glass cards, amber accents, dark surfaces

**Depends on:** Tasks 2–7 (API must be working)
**Success:** COA tree renders with hierarchy; add/edit/deactivate works; balances display correctly in mono font

---

### Task 18: Journal Entries List Page

**Files:**

- `apps/web/src/app/(dashboard)/accounting/journal-entries/page.tsx` (Server Component)
- `apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entries-client.tsx` (Client Component)

**What:** New page for viewing journal entries:

- Table: Date, Entry # (JE-001), Memo, Source Type, Status (badge), Total Amount (mono), Line Count
- **Status badges:** DRAFT (amber), POSTED (green), VOIDED (red/strikethrough), ARCHIVED (gray)
- Filters: Date range, status, source type
- Click row → detail view (expand or separate page)
- Detail: Full line-by-line breakdown (GL Account Code + Name, Debit, Credit, Memo) with totals row
- Approve button on DRAFT entries (APPROVE permission required)
- Void button on POSTED entries (with confirmation dialog)
- Cursor pagination

**Depends on:** Tasks 8–13 (API must be working)
**Success:** Lists journal entries; detail shows balanced lines; approve/void works; status badges accurate

---

### Task 19: Manual Journal Entry Form

**Files:**

- `apps/web/src/app/(dashboard)/accounting/journal-entries/new/page.tsx` (Server Component)
- `apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entry-form.tsx` (Client Component)

**What:** Form for creating manual journal entries:

- Date picker, memo field
- Dynamic lines table: Add/remove rows, each row = GL Account dropdown + Debit + Credit + Memo
- **Live balance indicator:** Running total of debits vs credits
  - Balanced: green badge "Balanced"
  - Imbalanced: red badge "Out of balance by $X.XX"
- All amounts in mono font, formatted as currency
- Submit creates DRAFT entry
- No "Save & Approve" button for MVP (enforces review step — separation of duties)

**Depends on:** Tasks 17, 18 (COA data for dropdowns)
**Success:** User can create balanced journal entry; imbalance prevented at UI level; entry appears in list as DRAFT

---

### Task 20: Transaction Detail — Posting Status

**Files:** Update `apps/web/src/app/(dashboard)/banking/transactions/` components
**What:** Enhance transaction detail/list to show posting status:

- Badge: "Unposted" (gray), "Posted" (green), "Voided" (red)
- "Post to GL" button on unposted transactions → opens GL account picker → calls posting API
- "View Journal Entry" link on posted transactions → navigates to journal entry detail
- Bulk "Post Selected" action in transaction list (max 50)

**Depends on:** Tasks 10, 11
**Success:** Transactions show posting status; post action creates journal entry; link to journal entry works

---

## Reference Files

| Purpose | Path |
|---------|------|
| Prisma schema | `packages/db/prisma/schema.prisma` |
| Cents branded type | `packages/types/src/financial/money.ts` |
| Transaction service (pattern) | `apps/api/src/domains/banking/services/transaction.service.ts` |
| Transaction routes (pattern) | `apps/api/src/domains/banking/routes/transactions.ts` |
| Transaction schema (pattern) | `apps/api/src/domains/banking/schemas/transaction.schema.ts` |
| Existing accounting stubs | `apps/api/src/domains/accounting/routes.ts` |
| Auth middleware | `apps/api/src/middleware/auth.ts` |
| Tenant middleware | `apps/api/src/middleware/tenant.ts` |
| RBAC middleware | `apps/api/src/middleware/rbac.ts` |
| Validation middleware | `apps/api/src/middleware/validation.ts` |
| Audit logging | `apps/api/src/lib/audit.ts` |
| Context map (journal patterns) | `docs/context-map.md` |
| Seed data | `packages/db/prisma/seed.ts` |
| Financial data standard | `docs/standards/financial-data.md` |
| Multi-tenancy standard | `docs/standards/multi-tenancy.md` |

---

## Critical Invariants (Every Task Must Respect)

These are non-negotiable. Every service method, every test, every route must enforce:

1. **Tenant Isolation:** Every query filters by `tenantId` (entity-scoped: `entity: { tenantId }`)
2. **Integer Cents:** All amounts use `Cents` branded type. Use `cents()`, `sumCents()`, `multiplyCents()` from `@akount/types/financial`. Never raw arithmetic on money.
3. **Double-Entry:** `SUM(debitAmount) === SUM(creditAmount)` at Zod level AND service level. For multi-currency: also validate `SUM(baseCurrencyDebit) === SUM(baseCurrencyCredit)`.
4. **Soft Delete:** Financial records use `deletedAt`. Filter `deletedAt: null` in all queries. Never `prisma.*.delete()`.
5. **Source Preservation:** `sourceType`, `sourceId`, `sourceDocument` (allowlisted JSON) on every auto-generated journal entry.
6. **Audit Trail:** Every write operation (CREATE, UPDATE, DELETE, VOID, APPROVE) gets a `createAuditLog()` call.
7. **Cross-Entity IDOR Prevention:** Every user-supplied ID validated for same entity + same tenant before use.
8. **Fiscal Period Respect:** Reject journal entries targeting LOCKED/CLOSED fiscal periods.
9. **Atomicity:** All multi-write financial operations inside `prisma.$transaction()`. Void and posting use `Serializable` isolation.

---

## Edge Cases

| Scenario | Response | Implemented In |
|----------|----------|---------------|
| Duplicate GL account code per entity | 409 Conflict (Prisma `@@unique` + P2002 catch) | Task 4 |
| Deactivate account with DRAFT journal lines | 400 "Account has unposted entries" | Task 4 |
| Post to inactive GL account | 400 `GL_ACCOUNT_INACTIVE` | Task 10 |
| Unbalanced journal entry | 400 at Zod `.refine()` + service `sumCents()` check | Tasks 8, 9 |
| Negative debit/credit amounts | 400 at Zod `.nonnegative()` | Task 8 |
| Post already-posted transaction | 409 `ALREADY_POSTED` + unique partial index prevents race | Task 10 |
| Void already-voided entry | 409 `ALREADY_VOIDED` (Serializable isolation) | Task 9 |
| Delete POSTED entry | 400 `IMMUTABLE_POSTED_ENTRY` "must void instead" | Task 9 |
| Cross-entity GL reference in journal lines | 403 `CROSS_ENTITY_REFERENCE` | Task 9 |
| Cross-entity parent account | 403 `CROSS_ENTITY_REFERENCE` | Task 4 |
| Cross-entity posting (txn entity A, GL entity B) | 403 `CROSS_ENTITY_REFERENCE` | Task 10 |
| Multi-currency missing FX rate | 400 `MISSING_FX_RATE` (nearest-date tried first) | Task 14 |
| FX rate on weekend/holiday | Nearest prior date lookup | Task 14 |
| Split amounts don't sum to transaction | 400 `SPLIT_AMOUNT_MISMATCH` | Task 15 |
| Split rounding remainder (multi-currency) | Largest-remainder allocation (1-cent to largest split) | Task 15 |
| Post to CLOSED fiscal period | 400 `FISCAL_PERIOD_CLOSED` | Tasks 9, 10 |
| Concurrent posting same transaction | Unique partial index → second request fails | Task 0, 10 |
| Concurrent void same entry | `Serializable` isolation → second fails | Task 9 |
| Creator approves own entry | 403 `SEPARATION_OF_DUTIES` (OWNER exception) | Task 9 |
| Seed COA already seeded | 200 `{ skipped: true }` (atomic idempotency) | Task 5 |
| Entity with no COA | Prompt to seed; block posting until COA exists | Task 10, 17 |
| Bank account without GL mapping | 400 "Bank account not mapped to GL account" | Task 10 |

---

## Testing Strategy

**Unit tests** for each service (mock Prisma where appropriate).
**Integration tests** for routes (full middleware chain with Fastify test server).

**Financial invariant tests (run in every test file that creates journal entries):**

- Double-entry balance assertion on EVERY entry
- Tenant isolation: Create in tenant A, verify tenant B cannot access
- Immutability: POSTED entries cannot be modified
- Soft delete: Verify `deletedAt` set, not hard deleted

**Shared test helpers** at `apps/api/src/domains/accounting/__tests__/helpers.ts`:

- `createTestGLAccounts(entityId)` — Seeds standard test accounts
- `createTestJournalEntry(entityId, lines[])` — Creates balanced entry for test setup
- Test constants: `TENANT_ID`, `OTHER_TENANT_ID`, `USER_ID`, `ENTITY_ID`, `OTHER_ENTITY_ID`

**Test count target:** 90+ (30 Sprint 1 + 45 Sprint 2 + 20 Sprint 3)

---

## Review Findings Incorporated

This plan (v2) incorporates findings from 4 specialized review agents:

| Finding | Resolution | Task |
|---------|-----------|------|
| JournalLine missing currency fields | Added to schema migration | T0 |
| TransactionSplit missing glAccountId | Added to schema migration | T0 |
| Transaction→JournalEntry no relation | Added to schema migration | T0 |
| Account missing glAccountId | Added to schema migration | T0 |
| No VOIDED status in enum | Added to schema migration | T0 |
| No fiscal period validation | Guard in createEntry + approveEntry | T9, T10 |
| Cross-entity IDOR at every ID boundary | Explicit validation per method | T4, T9, T10 |
| Atomicity boundaries undefined | `$transaction()` boundaries documented | T9, T10 |
| Zod can't do cross-field SUM | `.refine()` approach specified | T8 |
| Amounts must be nonnegative | `.nonnegative()` in schemas | T8 |
| COA seed race condition | Atomic idempotency + strict rate limit | T5, T6 |
| Missing audit logging | Required for all write ops | T9, T10 |
| Separation of duties on approve | createdBy !== userId (OWNER exception) | T9 |
| Double-post race condition | Unique partial index on journalEntryId | T0 |
| Double-void race condition | Serializable isolation | T9 |
| Missing typed errors | AccountingError class with codes | T1 |
| tenantRole typed as string | Fixed to TenantUserRole | T1 |
| Not using Cents branded type | Mandated for all financial arithmetic | Invariants |
| Use z.nativeEnum() for Prisma enums | Specified in all schemas | T3, T8 |
| AccountMappingService over-engineered | Folded into PostingService | T10 |
| Route refactor should be first | Reordered to T2 (before handlers) | T2 |
| sourceDocument unbounded/PII risk | Allowlist + 10KB size limit | T8, T10 |
| FX rate exact-date-only | Nearest-date fallback | T14 |
| No entryNumber for audit | Sequential entryNumber per entity | T0, T9 |
| No Save & Approve button | Removed from MVP (enforces review) | T19 |
| Void doesn't update original status | Original → VOIDED status | T9 |

---

## Progress

- [ ] Task 0: Prisma Schema Migration
- [ ] Task 1: Accounting Error Types + Type Infrastructure
- [ ] Task 2: Route Structure Refactor
- [ ] Task 3: GLAccount Zod Schemas
- [ ] Task 4: GLAccount Service
- [ ] Task 5: Default COA Template
- [ ] Task 6: GLAccount Route Handlers
- [ ] Task 7: GLAccount Tests
- [ ] Task 8: JournalEntry Zod Schemas
- [ ] Task 9: JournalEntry Service
- [ ] Task 10: Transaction Posting Service
- [ ] Task 11: Journal Entry Route Handlers
- [ ] Task 12: Update Banking Account Route (GL mapping)
- [ ] Task 13: Journal Entry + Posting Tests
- [ ] Task 14: Multi-Currency Posting Enhancement
- [ ] Task 15: Split Transaction Posting
- [ ] Task 16: Multi-Currency + Split Tests
- [ ] Task 17: Chart of Accounts Page (Frontend)
- [ ] Task 18: Journal Entries List Page (Frontend)
- [ ] Task 19: Manual Journal Entry Form (Frontend)
- [ ] Task 20: Transaction Detail — Posting Status (Frontend)
