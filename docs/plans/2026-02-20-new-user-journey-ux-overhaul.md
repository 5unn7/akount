# New User Journey UX Overhaul + Flinks Bank Connection

**Created:** 2026-02-20
**Status:** Draft (Reviewed — 35 findings + 21 design system findings incorporated)
**Source:** Sitemap audit (56 UX issues), competitive analysis
**Review:** [docs/reviews/new-user-journey-plan/SUMMARY.md](../reviews/new-user-journey-plan/SUMMARY.md)

---

## Overview

Complete overhaul of the new-user journey from onboarding completion → account creation → transaction import → dashboard value. Plus Flinks Connect integration (plug-and-play architecture, ready when API key arrives).

**Problem:** Users finish onboarding excited, land on a dashboard of zeros, click "Connect Account" expecting bank sync but get a manual form, create a $0 account, can't find the import wizard, and abandon — never seeing value.

**Goal:** Zero-to-value in under 5 minutes. Every handoff point guides the user to the next step.

## Success Criteria

- [ ] New user sees meaningful dashboard data within 5 minutes of completing onboarding
- [ ] Account creation offers 3 paths: Connect Bank (Flinks) | Import Statement | Add Manually
- [ ] Import wizard has error recovery (no silent resets), step indicators, and post-import guidance
- [ ] Dashboard reflects imported data immediately (no stale cache)
- [ ] Bulk categorize available from transaction list
- [ ] All 10 P0 issues resolved, all 14 P1 issues resolved
- [ ] Flinks service is code-complete with mock mode (ready for API key swap)
- [ ] All schema migrations applied and backward-compatible

---

## Schema Migrations Required

> **Note:** The original draft incorrectly stated "no schema migration needed." Review found 3 required migrations + 1 COA seed update.

### Migration 1: Add `OPENING_BALANCE` to `JournalEntrySourceType` enum
**Why:** Opening balance JEs need their own source type for traceability and idempotency (prevent duplicate posting). Using `MANUAL` or `ADJUSTMENT` breaks source preservation semantics (Invariant #5).
```prisma
enum JournalEntrySourceType {
  INVOICE
  BILL
  PAYMENT
  BANK_FEED
  MANUAL
  TRANSFER
  ADJUSTMENT
  OPENING_BALANCE  // NEW
}
```

### Migration 2: Add `deletedAt` to `BankConnection`
**Why:** BankConnection links to BankFeedTransactions (financial records). Invariant #4 requires soft delete. The DELETE endpoint must set `deletedAt` + `status: DISCONNECTED` together.
```prisma
model BankConnection {
  // ... existing fields ...
  deletedAt    DateTime?  // NEW — soft delete support
  @@index([entityId, deletedAt])  // NEW — composite index for filtered queries
}
```

### Migration 3: Add `bankConnectionId` to `Account`
**Why:** During Flinks refresh, need to know which accounts came from which connection. Without this relation, nightly sync can't target the right accounts.
```prisma
model Account {
  // ... existing fields ...
  bankConnectionId  String?          // NEW — nullable (manual accounts have no connection)
  bankConnection    BankConnection?  @relation(fields: [bankConnectionId], references: [id])
}
```

### COA Seed Update: Add Opening Balance Equity account
**File:** `apps/api/src/domains/accounting/services/coa-template.ts`
**Why:** Standard accounting practice. QuickBooks, Xero, and Sage all use a dedicated Opening Balance Equity account.
```typescript
{ code: '3300', name: 'Opening Balance Equity', type: 'EQUITY', normalBalance: 'CREDIT' }
```

---

## Architecture Decisions

### Flinks Integration — Already Scaffolded

The Prisma schema **already has** the core models:
- `BankConnection` (provider: FLINKS|PLAID|MANUAL, status, institutionName, lastSyncAt)
- `BankFeedTransaction` (bankConnectionId, accountId, amount in integer cents, rawData JSON)
- `BankConnectionProvider` enum includes `FLINKS`
- `BankConnectionStatus` enum: ACTIVE, ERROR, DISCONNECTED, REAUTH_REQUIRED
- `BankFeedStatus` enum: PENDING (for reconciliation)

**Existing `BankConnectionModal.tsx`** has the shell UI with "Coming Soon" — we replace its internals.

### Flinks Connect Flow (Validate-First Architecture)

> **Review finding C3:** Original flow stored BankConnection before validating with Flinks API. Revised flow validates first, stores only on success.

```
Frontend (iframe)              Backend                      Flinks API
─────────────────              ───────                      ──────────
1. Open modal with
   Flinks Connect iframe
   (demo=true until key)

2. User selects bank,
   enters credentials

3. iframe emits REDIRECT
   event with loginId
   (VALIDATED against        ───►  4. POST /api/banking/
    FLINKS_CONNECT_URL              connections (server action)
    origin)                        5. Call GetAccountsDetail ──► 6. Returns accounts
                                      (validate loginId)           + transactions
                                   7. IF valid: create
                                      BankConnection (ACTIVE)
                                      + Account records
                                      + BankFeedTransaction records
                                      + Transaction records (auto-posted)
                                      + Audit log entries
                                      (all in $transaction)
                                   8. IF invalid: return error
                                      (no orphan records)
                                   9. Return summary to FE

10. Show success modal
    "3 accounts connected,
     450 transactions synced"
11. Server action calls
    revalidatePath for all
    5 affected routes
12. Redirect to dashboard
```

### Flinks Security Requirements

- **postMessage origin validation:** Check `event.origin` against `FLINKS_CONNECT_URL` domain (derived server-side, passed as prop)
- **CSP frame-src:** Add `Content-Security-Policy: frame-src 'self' https://*.private.fin.ag;` — do NOT weaken `X-Frame-Options: DENY`
- **iframe sandbox:** `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`
- **loginId as PII:** Never log, never return in API responses, treat as credential-equivalent
- **Production enforcement:** Require all Flinks env vars when `NODE_ENV=production`. Demo mode only in dev/staging
- **RBAC:** Create/delete connections = OWNER/ADMIN only. List = transacting access. Refresh = OWNER/ADMIN

### Opening Balance — Journal Entry Pattern

> **Review findings C4, H1-H3, H5:** Opening balance JE requires careful GL resolution, atomicity, and credit-normal account handling.

```typescript
// All wrapped in prisma.$transaction():
// 1. Create Account with currentBalance = openingBalance
// 2. Auto-assign GL account based on AccountType:
//    BANK → 1100 (Bank Account), CREDIT_CARD → 2100, LOAN → 2500, etc.
// 3. Resolve Opening Balance Equity GL (code 3300)
// 4. Create JournalEntry:
//    sourceType: OPENING_BALANCE, sourceId: account.id
//    sourceDocument: JSON.stringify({ account, openingBalance })
// 5. Create JournalLines:
//    - Debit-normal accounts (BANK, INVESTMENT):
//      DR Account GL, CR Opening Balance Equity
//    - Credit-normal accounts (CREDIT_CARD, LOAN, MORTGAGE):
//      DR Opening Balance Equity, CR Account GL
// 6. Validate SUM(debits) === SUM(credits)
// 7. Create audit log entry
```

**Cross-domain routing:** Banking service calls `DocumentPostingService.postOpeningBalance()` in the Accounting domain — does NOT create JEs directly. This follows the established pattern for Invoice/Bill/Payment JE posting.

### Float-to-Cents Conversion (Flinks Data)

> **Review finding H4:** Flinks returns floats. Must use `Math.round()` to avoid precision errors.

```typescript
// CORRECT — always use Math.round
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// MANDATORY test cases:
// toCents(19.99) === 1999 (not 1998)
// toCents(0.1 + 0.2) === 30 (not 30.000000000000004)
// toCents(100.005) === 10001
// toCents(-5000.00) === -500000 (negative for credit cards)
```

### BankFeedTransaction → Transaction Auto-Posting

> **Review finding M3:** Without creating Transaction records from BankFeedTransactions, Flinks-imported data is invisible in dashboard/reports (which query Transaction, not BankFeedTransaction).

During initial Flinks sync, auto-create `Transaction` records from `BankFeedTransaction` records:
```typescript
for (const feedTxn of bankFeedTransactions) {
  await tx.transaction.create({
    data: {
      accountId: feedTxn.accountId,
      date: feedTxn.date,
      description: feedTxn.description,
      amount: feedTxn.amount,
      currency: feedTxn.currency,
      sourceType: 'BANK_FEED',
      sourceId: feedTxn.id,
    }
  });
  await tx.bankFeedTransaction.update({
    where: { id: feedTxn.id },
    data: { status: 'POSTED' }
  });
}
```

### Flinks Account Type Mapping

| Flinks Type | AccountType Enum | Default GL Code |
|-------------|-----------------|----------------|
| chequing, savings | BANK | 1100 |
| credit_card, line_of_credit | CREDIT_CARD | 2100 |
| loan | LOAN | 2500 |
| mortgage | MORTGAGE | 2500 |
| investment, tfsa, rrsp | INVESTMENT | 1500 |
| unknown / other | OTHER | 1100 |

### Nightly Refresh (Background — Out of Scope)

```
Cron/webhook ──► POST /api/internal/banking/connections/:id/refresh
             ──► Authenticate via CRON_SECRET header (internal-only)
             ──► Flinks GetAccountsDetail (with loginId)
             ──► Upsert new BankFeedTransactions + auto-post Transactions
             ──► Update Account.currentBalance to Flinks-reported balance (integer cents)
             ──► Rate limit: max 1 refresh per connection per hour
```

> This needs its own implementation plan. Flagged concern: updating `currentBalance` from Flinks without JEs could drift from GL balance over time.

---

## Design System Requirements

> All UI tasks MUST use these tokens and components. Never hardcode hex, rgba, or color names.

### Mandatory Components
| Need | Component | Import |
|------|-----------|--------|
| Money display (balances, amounts) | `<MoneyAmount>` | `@akount/ui/financial` |
| Money input (opening balance, etc.) | `<MoneyInput>` | `@akount/ui/financial` |
| Card containers | `GlassCard` or `glass` utility | `shadcn-glass-ui` / `globals.css` |
| Interactive cards (hover glow) | `<GlowCard variant="glass">` | `components/ui/glow-card.tsx` |
| Modals | `ModalGlass` | `shadcn-glass-ui` |
| Buttons — primary CTA | `ButtonGlass variant="solid"` or `bg-primary text-primary-foreground` | shadcn/glass |
| Buttons — secondary | `ButtonGlass variant="dim"` or `bg-ak-pri-dim` | shadcn/glass |
| Buttons — tertiary | `ButtonGlass variant="ghost"` or ghost with `border-ak-border` | shadcn/glass |
| Badges | `BadgeGlass` with appropriate variant | `shadcn-glass-ui` |

### Token Cheat Sheet
| Semantic Use | Token | NEVER Use |
|-------------|-------|-----------|
| Success / income | `text-ak-green` | `text-green-500`, `text-[#34D399]` |
| Error / expense / destructive | `text-destructive`, `border-destructive` | `text-red-500`, "red border" |
| Warning / attention / uncategorized | `bg-ak-pri-dim text-ak-pri-text` | `bg-amber-500`, "amber", "bright" |
| Urgent badge | `BadgeGlass variant="destructive"` or `bg-ak-red-dim text-ak-red` | "bright badge" |
| Validation error border | `border-destructive` or `ring-destructive` | "red border" |
| Attention left-border | `border-l-2 border-l-primary` | "amber left border" |
| Step indicator — active | `text-primary` / `bg-primary` | raw color names |
| Step indicator — completed | `text-ak-green` + checkmark icon | |
| Step indicator — upcoming | `text-muted-foreground` | |
| Connector line | `border-ak-border` (inactive), `bg-primary` (active) | |

### Typography Rules (All UI Tasks)
| Context | Font | Token |
|---------|------|-------|
| Card/section headings | Newsreader | `font-heading` |
| Body text, labels | Manrope | `font-sans` / `font-body` |
| All monetary amounts | JetBrains Mono | `font-mono` (auto via `<MoneyAmount>`) |
| Badges, tiny labels | Manrope uppercase | `font-sans uppercase tracking-wider text-[10px]` |

### Animation Tokens
| Effect | Implementation |
|--------|---------------|
| Click feedback on cards | `active:scale-[0.98] transition-transform` |
| Hover border brighten | `hover:border-ak-border-2` |
| Hover lift | `hover:-translate-y-px transition-all` |
| Interactive glow | `<GlowCard>` component (mouse-tracking radial) |
| Easing curve | `var(--ak-ease)` or Tailwind `ease-out` |

---

## Sprint Breakdown

### Sprint 0: Schema Migrations (1h)

Pre-requisite for Sprints 1 and 2.

#### Task 0.1: Prisma Migration — Opening Balance + BankConnection Updates
**File:** `packages/db/prisma/schema.prisma`, new migration file
**What:** Apply all 3 schema changes:
1. Add `OPENING_BALANCE` to `JournalEntrySourceType` enum
2. Add `deletedAt DateTime?` + composite index to `BankConnection`
3. Add `bankConnectionId String?` + relation to `Account`
All changes are additive/backward-compatible. No data backfill needed.
**Depends on:** none
**Risk:** high (schema migration)
**Review:** `prisma-migration-reviewer`
**Success:** Migration applies cleanly, existing tests still pass

#### Task 0.2: COA Template — Add Opening Balance Equity Account
**File:** `apps/api/src/domains/accounting/services/coa-template.ts`
**What:** Add `{ code: '3300', name: 'Opening Balance Equity', type: 'EQUITY', normalBalance: 'CREDIT' }` to the COA template. Add to `WELL_KNOWN_CODES` constant. New entities get this account seeded automatically.
**Depends on:** none
**Success:** New entity creation includes 3300 Opening Balance Equity in COA

#### Task 0.3: GL Account Auto-Assignment Helper
**File:** `apps/api/src/domains/banking/services/account.service.ts`
**What:** Add `getDefaultGLAccountForType(entityId, accountType)` helper that maps AccountType to well-known COA codes (BANK→1100, CREDIT_CARD→2100, etc.). Used by opening balance and Flinks sync. If GL account doesn't exist for entity, skip JE and log warning.
**Depends on:** Task 0.2
**Review:** `financial-data-validator`
**Success:** Helper returns correct GL account for each AccountType

---

### Sprint 1: Account Creation Fix (P0 — 5h)

Fix the biggest UX blocker: "Connect Account" opens a manual form.

#### Task 1.1: Three-Path Account Creation Modal
**File:** `apps/web/src/components/accounts/AddAccountModal.tsx` (NEW)
**Directive:** `'use client'` (modal state, onClick handlers, router.push)
**What:** Replace direct AccountFormSheet trigger with a 3-option modal using `ModalGlass`:
- Each option is a `<GlowCard variant="glass">` with icon + label + description
- **Connect Bank** (Flinks icon, `ButtonGlass variant="solid"` / `bg-primary`) → opens Flinks Connect iframe
- **Import Statement** (Upload icon, `ButtonGlass variant="dim"` / `bg-ak-pri-dim`) → navigates to `/banking/imports`
- **Add Manually** (Pencil icon, `ButtonGlass variant="ghost"`) → opens existing AccountFormSheet
- Headings use `font-heading`, descriptions use `text-muted-foreground font-sans`
**Parent:** accounts/page.tsx remains Server Component — passes data as props
**Depends on:** none
**Success:** Clicking "Add Account" shows modal with 3 GlowCard options, each works

#### Task 1.2: Add Opening Balance Field to AccountFormSheet
**File:** `apps/web/src/components/accounts/AccountFormSheet.tsx`
**What:** Add `openingBalance` field using `<MoneyInput>` component (enforces `font-mono`, integer cents storage, currency formatting). Add `openingBalanceDate` (date picker, default: today). Server action creates account + opening balance journal entry. Zod validation: amount min `-999_999_999_99` max `999_999_999_99`, date not future and not before 1900-01-01.
**Depends on:** Task 0.1
**Risk:** high (financial — creates journal entry for opening balance)
**Review:** `financial-data-validator`
**Success:** New account shows correct balance, JE created with balanced debits/credits

#### Task 1.3: Backend — Opening Balance Support
**Files:** `apps/api/src/domains/banking/services/account.service.ts`, `apps/api/src/domains/accounting/services/document-posting.service.ts`
**What:** Add optional `openingBalance` (int) and `openingBalanceDate` (date) to createAccount. When provided:
1. Wrap entire operation in `prisma.$transaction()`
2. Create Account with `currentBalance = openingBalance`
3. Auto-assign GL account via `getDefaultGLAccountForType()` (Task 0.3)
4. Call `DocumentPostingService.postOpeningBalance()` (Accounting domain) — NOT direct JE creation in Banking
5. JE uses `sourceType: OPENING_BALANCE`, `sourceId: account.id`, `sourceDocument: JSON.stringify({...})`
6. Handle credit-normal accounts: CREDIT_CARD/LOAN/MORTGAGE reverse debit/credit direction
7. Validate `SUM(debits) === SUM(credits)` before commit
8. Create audit log entry
**Depends on:** Task 0.1, Task 0.2, Task 0.3
**Risk:** high (financial — journal entry creation, cross-domain)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** `POST /api/banking/accounts` with openingBalance creates balanced JE + account atomically

#### Task 1.4: Post-Creation Success Flow
**File:** `apps/web/src/components/accounts/AccountFormSheet.tsx`
**What:** After account creation, show success state inside sheet: checkmark icon in `text-ak-green`, heading "Account created!" in `font-heading`, balance displayed via `<MoneyAmount>` component (`font-mono` auto-applied). 3 CTAs: [Import Transactions] (`ButtonGlass variant="solid"`), [View Account] (`variant="dim"`), [Add Another] (`variant="ghost"`). Import navigates to `/banking/imports` with `?accountId=X` pre-selected.
**Depends on:** Task 1.2
**Success:** User sees success state with actionable next steps after creating account

#### Task 1.5: Rename Button Labels
**Files:** `apps/web/src/components/accounts/AccountsPageHeader.tsx`, accounts/page.tsx
**What:** Rename "Connect Account" → "Add Account". Rename "Import" → "Import Statements".
**Depends on:** none
**Success:** Button labels match their actual behavior

---

### Sprint 2: Flinks Connect Integration (10h)

Plug-and-play bank connection — works in demo mode now, live with API key later.

#### Task 2.1: Flinks Service (Backend)
**File:** `apps/api/src/domains/banking/services/flinks.service.ts` (NEW)
**What:** Create FlinksService with:
- `getConnectUrl(entityId)` — returns iframe URL with config params (demo mode by default). **NEVER include FLINKS_SECRET or FLINKS_CUSTOMER_ID in URL** — these are backend-only
- `processConnection(loginId, entityId, ctx)` — **validate-first**: call GetAccountsDetail with loginId BEFORE creating BankConnection. Only store on success. Use `prisma.$transaction()` for atomicity. Check idempotency (existing connection with same loginId for entity → return existing)
- `syncAccounts(connectionId)` — fetches accounts + transactions, upserts into DB
- `mapFlinksAccount(flinksAccount)` → Account fields using type mapping table (see Architecture Decisions)
- `mapFlinksTransaction(flinksTxn)` → BankFeedTransaction fields. **Use `Math.round(amount * 100)` for all amounts**
- `autoPostTransactions(bankFeedTxns)` → Create Transaction records from BankFeedTransactions during initial sync (sets status to POSTED)
- **PII scrubbing:** Before storing in `rawData`, strip full account numbers (keep last 4), remove routing numbers, remove holder PII
- **Audit logging:** Create audit log entries for BankConnection CREATE, Account CREATE (from Flinks), BankFeedTransaction CREATE (batch count)
- Config: `FLINKS_INSTANCE`, `FLINKS_CUSTOMER_ID`, `FLINKS_SECRET` env vars. **Required in production** (`NODE_ENV=production` → throw on startup if missing). Demo mode only in dev/staging
- **Currency handling:** Set `Account.currency` and `BankFeedTransaction.currency` to Flinks-reported currency (source of truth). If currency !== entity's functional currency, log warning and skip auto-JE posting (FX conversion needed — future enhancement)
- Set `Account.currentBalance` to Flinks-reported balance (integer cents, authoritative source)
**Depends on:** Task 0.1
**Risk:** high (financial data mapping, integer cents, PII handling)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** Service creates BankConnection + Accounts + BankFeedTransactions + Transactions from mock Flinks data, all in integer cents, with audit trail

#### Task 2.2: Flinks Routes (Backend)
**File:** `apps/api/src/domains/banking/routes/connections.ts` (NEW)
**What:** Create connection routes:
- `POST /api/banking/connections` — process new connection (loginId + entityId). **RBAC: `withRole(['OWNER', 'ADMIN'])`**. **Rate limit: `strictRateLimitConfig()` (10/min)**. Zod: `loginId: z.string().uuid()`, `entityId: z.string().cuid()`
- `GET /api/banking/connections` — list connections for entity. **RBAC: `transactingAccess`**. Filter by `entity: { tenantId: ctx.tenantId }` AND `deletedAt: null`
- `POST /api/banking/connections/:id/refresh` — trigger data refresh. **RBAC: `withRole(['OWNER', 'ADMIN'])`**. Rate limit: max 1 per connection per hour
- `DELETE /api/banking/connections/:id` — disconnect. **RBAC: `adminOnly`**. Sets both `status: DISCONNECTED` AND `deletedAt: new Date()`
- All queries use `entity: { tenantId: ctx.tenantId }` tenant isolation pattern
- **API response:** Never expose `providerItemId` (loginId) in responses — internal field only
**Depends on:** Task 2.1
**Review:** `fastify-api-reviewer`, `security-sentinel`
**Success:** Routes pass Zod validation, return correct status codes, RBAC enforced, tenant-isolated

#### Task 2.3: Flinks Connect Frontend Component
**File:** `apps/web/src/components/banking/FlinksConnect.tsx` (NEW)
**Directive:** `'use client'` — loaded via `next/dynamic` with `ssr: false` (heavy iframe, no SSR benefit)
**What:** React component wrapping Flinks Connect iframe:
- Renders iframe with configurable URL (demo mode by default)
- **iframe attributes:** `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` + `title="Connect your bank account"`
- **postMessage origin validation (CRITICAL):** Validate `event.origin` against allowed origin derived from `FLINKS_CONNECT_URL` (passed as prop from server component). Silently reject events from unexpected origins
- On REDIRECT: extracts loginId, calls **server action** `createBankConnectionAction()` (NOT direct client API call)
- States: loading (`Skeleton` component), success (`text-ak-green` indicator, account balances via `<MoneyAmount>`), error (`text-destructive` message, `border-destructive` container)
- Error handling: connection failure, timeout, user cancel — all show `text-destructive` error with `GlassCard` container
- On CANCEL event from iframe: close gracefully, no orphan records (validate-first architecture ensures this)
**Depends on:** Task 2.2
**Review:** `security-sentinel`, `nextjs-app-router-reviewer`
**Success:** Iframe loads, origin validated, user can select demo bank, loginId captured via server action, accounts created

#### Task 2.4: Wire FlinksConnect into AddAccountModal
**File:** `apps/web/src/components/accounts/AddAccountModal.tsx`
**What:** When user clicks "Connect Bank" in the 3-option modal, render FlinksConnect component inline (replaces modal content). **Use `next/dynamic` with `ssr: false`** and `Skeleton` loader. On success, show summary in `GlassCard`: heading in `font-heading`, "3 accounts connected, 450 transactions synced" with account balances via `<MoneyAmount>`. [Go to Dashboard] as `ButtonGlass variant="solid"` with `glow-primary`.
**Depends on:** Task 1.1, Task 2.3
**Success:** Full flow: Add Account → Connect Bank → Flinks iframe → accounts created → success screen

#### Task 2.5: CSP + Security Headers for Flinks Iframe
**Files:** `apps/web/next.config.js`, `apps/web/src/middleware.ts`
**What:** Add Content-Security-Policy `frame-src` directive to allowlist Flinks Connect domain:
```
Content-Security-Policy: frame-src 'self' https://toolbox-iframe.private.fin.ag https://*.private.fin.ag;
```
**Keep `X-Frame-Options: DENY` unchanged** — this prevents Akount from being embedded, not from embedding others. The CSP `frame-src` controls which external pages Akount can embed.
**Depends on:** none
**Review:** `security-sentinel`
**Success:** Flinks iframe loads. Akount remains un-embeddable. Other iframes blocked by CSP

#### Task 2.6: Server Action for Bank Connection
**File:** `apps/web/src/app/(dashboard)/banking/accounts/actions.ts`
**What:** Add `createBankConnectionAction(loginId, entityId)` server action that:
1. Calls API `POST /banking/connections` with auth token
2. On success, calls `revalidatePath` for all 5 affected routes
3. Returns connection summary to client
This keeps auth token handling server-side, consistent with existing account/transaction action patterns.
**Depends on:** Task 2.2
**Review:** `nextjs-app-router-reviewer`
**Success:** Server action creates connection and revalidates cache in one call

#### Task 2.7: Flinks Env Var Validation
**File:** `apps/api/src/lib/env.ts`
**What:** Add Flinks env vars to startup validation. In production: require all 5 vars, throw if missing. In dev/staging: all optional (demo mode). Add to `.env.example`.
**Depends on:** none
**Success:** Production server refuses to start without Flinks credentials. Dev works without them.

#### Task 2.8: Flinks Service Tests
**File:** `apps/api/src/domains/banking/services/__tests__/flinks.service.test.ts` (NEW)
**What:** Test FlinksService with mock Flinks API responses:
- Connection creation validates with Flinks API BEFORE storing (validate-first)
- Idempotency: duplicate loginId returns existing connection
- Account mapping produces correct AccountType + integer cents balance
- **Float-to-cents edge cases:** `toCents(19.99) === 1999`, `toCents(0.1 + 0.2) === 30`, `toCents(-5000.00) === -500000`
- Transaction mapping produces integer cents amounts + correct dates
- Auto-posting: BankFeedTransactions create matching Transaction records
- PII scrubbing: rawData does not contain full account numbers
- Tenant isolation (can't access other tenant's connections) — uses `entity: { tenantId }` pattern
- Demo mode works without env vars
- Currency mismatch logged (Flinks USD, entity CAD)
**Depends on:** Task 2.1
**Review:** `financial-data-validator`
**Success:** All tests pass, integer cents verified, tenant isolation verified, PII scrubbed

#### Task 2.9: Connection Routes Tests
**File:** `apps/api/src/domains/banking/routes/__tests__/connections.routes.test.ts` (NEW)
**What:** Route-level tests for all 4 connection endpoints:
- Auth: reject unauthenticated requests
- RBAC: verify OWNER/ADMIN can create/delete, non-admins rejected
- Validation: invalid loginId (not UUID), missing entityId
- Tenant isolation: cross-tenant access returns 404
- Rate limiting: verify strictRateLimitConfig on create/refresh
- Soft delete: DELETE sets both `status: DISCONNECTED` and `deletedAt`
- Response shape: verify `providerItemId` (loginId) is NOT in response body
**Depends on:** Task 2.2
**Success:** All routes tested with proper status codes, RBAC, and error handling

---

### Sprint 3: Import Wizard Fix (P0 — 6h)

Fix catastrophic error handling and add guidance.

#### Task 3.1: Error Recovery — No Silent Reset
**File:** `apps/web/src/components/import/ImportUploadForm.tsx`
**What:** Replace `handleError` (which silently resets to Step 1) with error state that shows per-file status: success files get `text-ak-green` checkmark, failed files get `text-destructive` error icon + message. Action buttons: [Retry Failed] (`ButtonGlass variant="solid"`), [Continue with Successful] (`variant="dim"`), [Start Over] (`variant="ghost"`). Track per-file status in state.
**Depends on:** none
**Success:** Network failure on file 6/8 shows clear error with retry option, doesn't lose successful uploads

#### Task 3.2: Step Indicator + Cancel Button
**Files:** `apps/web/src/components/import/ImportUploadForm.tsx`, `UploadProgressStep.tsx`
**What:** Add step indicator bar (1. Select → 2. Upload → 3. Results) at top of wizard. Active step: `bg-primary text-primary-foreground`, completed: `text-ak-green` with checkmark, upcoming: `text-muted-foreground`. Connector lines: `border-ak-border` (inactive), `bg-primary` (active). Step labels in `font-sans`. Add "Cancel" button (`variant="ghost"`) to UploadProgressStep that confirms via dialog then returns to Step 1 without losing file selections.
**Depends on:** none
**Success:** User sees "Step 2 of 3" during upload, can cancel safely

#### Task 3.3: Guidance Text + File Limits Upfront
**File:** `apps/web/src/components/import/steps/FileSelectionStep.tsx`
**What:** Add contextual guidance:
- Header: "Upload your bank statements to import transactions" (`font-heading`)
- Help text: "Supports CSV, PDF, Excel, and OFX files. Up to 10 files, 10MB each." (`text-muted-foreground font-sans`)
- If 0 accounts: show "You need a bank account first" with [Create Account] (`ButtonGlass variant="dim"` inline)
- Tooltip using `TooltipGlass` on "Select account" dropdown: "Which bank account do these transactions belong to?"
**Depends on:** none
**Success:** First-time user understands what to do without guessing

#### Task 3.4: Duplicate Explanation + Results Enhancement
**File:** `apps/web/src/components/import/BatchImportResults.tsx`
**What:** Add:
- Duplicate explanation: "15 duplicates skipped — these transactions were already in your account"
- "View Imported Transactions" button that links to `/banking/transactions?importBatchId=X`
- "Categorize Now" nudge: "127 transactions need categories. Categorize them to see them in reports."
- "What's Next" `GlassCard` with heading in `font-heading`: contextual guidance based on user state
**Depends on:** none
**Success:** Results screen explains duplicates and guides user to next action

#### Task 3.5: Bulk Account Assignment
**File:** `apps/web/src/components/import/FileListEditor.tsx`
**What:** Add "Assign all to:" dropdown above file list. When selected, sets all unassigned files to that account. Keep per-file override available.
**Depends on:** none
**Success:** User uploads 10 files for same account, clicks one dropdown instead of 10

#### Task 3.6: Add Missing error.tsx for imports/[id]
**File:** `apps/web/src/app/(dashboard)/banking/imports/[id]/error.tsx` (NEW)
**What:** Add standard error boundary using the error.tsx template from frontend-conventions.md. Invariant #6 requires every page.tsx to have sibling loading.tsx + error.tsx.
**Depends on:** none
**Success:** Import detail page has proper error boundary

---

### Sprint 4: Transaction List + Dashboard Freshness (P0 — 7h)

Fix the "imported data doesn't show up" problem.

#### Task 4.1: Dashboard Cache Revalidation
**Files:** `apps/web/src/app/(dashboard)/banking/imports/page.tsx`, `apps/web/src/components/import/steps/ResultsStep.tsx`, `apps/web/src/app/(dashboard)/banking/transactions/actions.ts`
**What:** Create a `revalidateAfterImport()` server action that revalidates ALL 5 affected paths:
```typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function revalidateAfterImport() {
  revalidatePath('/overview');
  revalidatePath('/overview/cash-flow');
  revalidatePath('/overview/net-worth');
  revalidatePath('/banking/accounts');
  revalidatePath('/banking/transactions');
}
```
Call from import results component. Also add `revalidatePath` calls to existing transaction server actions that are currently missing them (pre-existing gap: `bulkCategorizeAction`, `createTransactionAction`, `assignCategoryAction` have no revalidation). Add `revalidatePath` to account creation action too.
**Depends on:** none
**Review:** `nextjs-app-router-reviewer`
**Success:** Dashboard shows updated numbers immediately after import (no manual refresh needed). Bulk categorize also refreshes dashboard.

#### Task 4.2: Bulk Categorize Action
**File:** `apps/web/src/components/transactions/TransactionsListClient.tsx`
**What:** Add "Categorize" to BulkActionBar. Opens sheet/dropdown with category list. Assigns selected category to all selected transactions via `PATCH /transactions/bulk/categorize` endpoint (already exists).
**Depends on:** none
**Success:** User selects 50 transactions → clicks Categorize → picks category → done in 3 clicks

#### Task 4.3: "Recently Imported" Filter + Uncategorized Badge
**Files:** `apps/web/src/app/(dashboard)/banking/transactions/page.tsx`, `TransactionsListClient.tsx`, `TransactionsFilters.tsx`
**What:** Add:
- "Recently Imported" quick filter tab (transactions from last 24h, sorted by createdAt desc)
- "Uncategorized (127)" `BadgeGlass variant="destructive"` (`bg-ak-red-dim text-ak-red`) in filter bar
- Support `?importBatchId=X` URL param — extend existing server-side `searchParams` interface (NOT `useSearchParams` client-side):
```typescript
interface TransactionsPageProps {
  searchParams: Promise<{
    accountId?: string;
    startDate?: string;
    endDate?: string;
    importBatchId?: string;  // NEW
    filter?: string;          // NEW: 'uncategorized', 'recent-import'
  }>;
}
```
Pass these params down to client component as props for initial state.
**Depends on:** none
**Review:** `nextjs-app-router-reviewer`
**Success:** User navigates from import results → sees only their imported transactions, with uncategorized count

#### Task 4.4: Clickable Stat Cards with Drill-Down
**File:** `apps/web/src/components/dashboard/DashboardLeftRail.tsx`
**What:** Add `onClick` handlers to stat cards:
- Revenue → `/accounting/reports/revenue`
- Expenses → `/accounting/reports/spending`
- Profit → `/accounting/reports/profit-loss`
- Receivables → `/business/invoices?status=outstanding`
- Payables → `/business/bills?status=outstanding`
- Runway → `/overview/cash-flow`
- Cash Burn → `/overview/cash-flow`
Add `href` field to `StatCardData` interface. Use `router.push()` with `active:scale-[0.98] transition-transform` click feedback. Stat cards already use `GlowCard` pattern — ensure `cursor-pointer` pairs with actual navigation.
**Depends on:** none
**Success:** Every stat card navigates to relevant detail page on click

#### Task 4.5: Fix Cash Flow Chart Data
**Files:** `apps/api/src/domains/overview/services/dashboard.service.ts`, `apps/web/src/components/dashboard/CashFlowChart.tsx`
**What:** Fix in **API service layer** (not frontend): ensure `getCashFlowProjection()` queries actual transactions grouped by month when no projection data exists. Frontend component only calls the API and renders the result. Show "Add transactions to see your cash flow" empty state only when truly empty.
**Depends on:** none
**Success:** After importing 200 transactions, cash flow chart shows actual income/expense bars

---

### Sprint 5: Onboarding Handoff + Empty States (P1 — 4h)

Fix the "just finished onboarding, now what?" dead zone.

#### Task 5.1: Smart OnboardingHeroCard
**File:** `apps/web/src/components/onboarding/OnboardingHeroCard.tsx`
**What:** Make "Enable" CTA context-aware:
- If 0 accounts: link to Add Account modal trigger
- If accounts but 0 transactions: link to `/banking/imports`
- If transactions but 0 categorized: link to `/banking/transactions?filter=uncategorized`
- If all done: show "You're all set!" with dismiss
Update nudge text to match each state.
**Depends on:** Task 1.1
**Success:** CTA always points to the most useful next action

#### Task 5.2: Accounts Page Empty State Upgrade
**File:** `apps/web/src/app/(dashboard)/banking/accounts/page.tsx`
**What:** Replace passive "No accounts found" with rich empty state:
- Illustration: `GlassCard` with bank icon (`text-primary`), centered
- Heading "Add your first account to start tracking" in `font-heading`
- Three CTA buttons as `GlowCard variant="glass"` option cards (matching Task 1.1 modal pattern): [Connect Bank] (`ButtonGlass variant="solid"`), [Import Statement] (`variant="dim"`), [Add Manually] (`variant="ghost"`)
- These trigger the same flows as the modal
**Depends on:** Task 1.1
**Success:** Empty accounts page has 3 prominent, actionable CTAs

#### Task 5.3: First-Run Dashboard Experience
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** When user has 0 accounts AND 0 transactions (server-side check, matching existing pattern in `cash-flow/page.tsx`), replace the full dashboard grid with a single-focus `GlowCard` with `glow-primary`:
- Heading "Welcome to Akount!" in `font-heading`, description in `text-muted-foreground font-sans`
- Three paths as `GlowCard variant="glass"` option cards (same pattern as Task 1.1): [Connect Bank] [Import Statement] [Add Manually]
- Below: static screenshot/illustration showing what the dashboard looks like with data (NOT mock API data — just a pre-rendered image to avoid guardrail violation)
- Once user has 1+ accounts, show normal dashboard with OnboardingHeroCard
**Depends on:** Task 1.1
**Success:** Brand new user sees focused onboarding, not a wall of zeros

#### Task 5.4: Fix OnboardingHeroCard "Enable" Link
**File:** `apps/web/src/components/onboarding/OnboardingHeroCard.tsx`
**What:** Quick fix — if current CTA links to `/overview` (self-link), replace with dynamic link from Task 5.1. This is a subset of 5.1 but called out as a standalone fix if 5.1 is deferred.
**Depends on:** none
**Success:** "Enable" button navigates to a useful page, not self

---

### Sprint 6: Import Polish + P2 Fixes (4h)

#### Task 6.1: Upload Progress Time Estimate
**File:** `apps/web/src/components/import/steps/UploadProgressStep.tsx`
**What:** Track upload start time + bytes uploaded. Show estimated time remaining: "About 30 seconds remaining..." based on average upload speed per file.
**Depends on:** none
**Success:** User sees time estimate during upload, reduces anxiety

#### Task 6.2: Account Dropdown Redesign in Import
**File:** `apps/web/src/components/import/FileListEditor.tsx`
**What:** Make account assignment more prominent:
- Larger dropdown (full-width below filename, not inline)
- Visual separator between files ("File 1 of 5")
- Validation highlight: `border-destructive ring-destructive` when unassigned and user clicks Import
- "Assign all to:" bulk option at top (from Task 3.5)
**Depends on:** Task 3.5
**Success:** Account assignment is impossible to miss

#### Task 6.3: Country/Currency Dropdowns in Account Form
**File:** `apps/web/src/components/accounts/AccountFormSheet.tsx`
**What:** Replace freeform text inputs for currency and country with:
- Country: Use existing `CountrySelect` component (195 countries)
- Currency: Auto-derive from country (with manual override dropdown, ISO 4217)
**Depends on:** none
**Success:** No more "CDN" typos — user selects from validated list

#### Task 6.4: Truncated Description Tooltips
**File:** `apps/web/src/components/dashboard/RecentTransactions.tsx`
**What:** Add `title` attribute or Tooltip component to truncated transaction descriptions. Show full text on hover.
**Depends on:** none
**Success:** "AMZN MKTP CA*AB12..." shows full description on hover

#### Task 6.5: Uncategorized Transactions Visual Urgency
**File:** `apps/web/src/components/transactions/TransactionsListClient.tsx`
**What:** Add banner at top of transaction list when uncategorized > 0:
- Banner: `bg-ak-pri-dim border border-ak-border rounded-lg` with `text-foreground` (not muted — this is important)
- "127 uncategorized transactions — these won't appear in financial reports"
- [Categorize All] `ButtonGlass variant="solid"` → enters bulk categorize mode
- `border-l-2 border-l-primary` on uncategorized rows (replaces gray dot)
**Depends on:** Task 4.2
**Success:** User immediately sees how many transactions need attention

---

### Sprint 7: P2/P3 Polish (3h)

#### Task 7.1: Import Results — Preserve on "Import More"
**File:** `apps/web/src/components/import/ImportUploadForm.tsx`
**What:** Instead of resetting state when user clicks "Import More Files", push current results to a `completedBatches` array. Show previous batch results in a collapsed section while new import proceeds.
**Depends on:** none
**Success:** User can reference results from batch 1 while uploading batch 2

#### Task 7.2: Duplicate Detection Warning on Re-Import
**File:** `apps/web/src/components/import/steps/FileSelectionStep.tsx`
**What:** Check filename against recent import batches (last 30 days). If match found, show warning: "A file named 'RBC_Feb.csv' was imported 2 hours ago. Import anyway?" with [Yes, Import] [Cancel].
**Depends on:** none
**Success:** User warned before accidentally double-importing

#### Task 7.3: Post-Import Categorization Nudge
**File:** `apps/web/src/components/import/BatchImportResults.tsx`
**What:** After import results, show: "Akount can auto-categorize your transactions using AI. [Auto-Categorize] [I'll do it manually]". Auto-categorize calls existing `POST /api/ai/categorize` endpoint.
**Depends on:** none
**Success:** User can trigger AI categorization directly from import results

#### Task 7.4: Sidebar Report Shortcuts (from sitemap audit)
**File:** `apps/web/src/lib/navigation.ts`
**What:** Add 3 sub-items under Accounting > Reports: Balance Sheet, P&L, Trial Balance. These link directly to `/accounting/reports/balance-sheet`, etc.
**Depends on:** none (already tracked as UX-80)
**Success:** Power users access top 3 reports in 1 click from sidebar

---

## Reference Files

- `packages/db/prisma/schema.prisma` — BankConnection, BankFeedTransaction, Account models (already exist)
- `apps/web/src/app/onboarding/complete/components/BankConnectionModal.tsx` — existing shell (replace internals)
- `apps/web/src/components/accounts/AccountFormSheet.tsx` — current account form (modify)
- `apps/web/src/components/import/ImportUploadForm.tsx` — wizard orchestrator (modify)
- `apps/web/src/components/dashboard/DashboardLeftRail.tsx` — stat cards (add click handlers)
- `apps/web/src/components/onboarding/OnboardingHeroCard.tsx` — post-onboarding card (make dynamic)
- `apps/api/src/domains/banking/services/account.service.ts` — account CRUD (add opening balance)
- `apps/api/src/domains/accounting/services/document-posting.service.ts` — JE posting pattern (extend for opening balance)
- `apps/api/src/domains/accounting/services/coa-template.ts` — COA seed (add Opening Balance Equity)
- `apps/web/src/app/(dashboard)/banking/accounts/actions.ts` — server action pattern reference
- `apps/web/src/app/(dashboard)/banking/transactions/actions.ts` — needs revalidatePath additions
- `apps/web/next.config.js` — security headers (add CSP frame-src)
- `apps/web/src/middleware.ts` — security headers (coordinate CSP)

## Edge Cases

- **Flinks unavailable:** FlinksConnect component shows "Bank connection temporarily unavailable. Import a statement instead." with fallback CTA
- **Flinks returns 0 accounts:** Show "We connected to your bank but found no accounts. Try a different bank or add manually."
- **Flinks returns invalid loginId:** Backend validates with Flinks API first. Invalid loginId → error returned, no orphan BankConnection records created
- **Duplicate connection attempt:** Idempotency check — if BankConnection with same loginId exists for entity, return existing connection
- **Opening balance creates unbalanced JE:** Validate `SUM(debits) === SUM(credits)` inside `$transaction`, rollback if unbalanced
- **Credit-normal opening balance:** Credit cards/loans with negative balance use reversed debit/credit direction
- **GL account not found:** If entity's COA doesn't have the expected GL code, skip JE creation, log warning, set `Account.glAccountId = null`
- **Import fails mid-batch:** Per-file status tracking, successful files are kept, failed ones can be retried
- **User cancels Flinks mid-flow:** iframe emits CANCEL event, close modal gracefully. Validate-first architecture means no orphan records
- **Currency mismatch:** If Flinks returns USD account but entity is CAD, store in original currency. Skip auto-JE posting, log warning. User can manually reconcile via FX conversion later
- **Demo mode without API key:** Service returns mock accounts/transactions so full flow is testable. **Only available when `NODE_ENV !== 'production'`**
- **postMessage from unauthorized origin:** Silently rejected. Only events from `FLINKS_CONNECT_URL` domain processed
- **Flinks raw data PII:** Account numbers masked to last 4 digits before storing in `rawData`. Routing numbers and holder PII stripped

## Review Agent Coverage

| Sprint | Tasks | Relevant Agents |
|--------|-------|----------------|
| Sprint 0 | 0.1 | `prisma-migration-reviewer` |
| Sprint 0 | 0.2, 0.3 | `financial-data-validator` |
| Sprint 1 | 1.1, 1.4 | `design-system-enforcer` |
| Sprint 1 | 1.2, 1.3 | `financial-data-validator`, `security-sentinel` |
| Sprint 2 | 2.1, 2.8 | `financial-data-validator`, `security-sentinel` |
| Sprint 2 | 2.2, 2.9 | `fastify-api-reviewer`, `security-sentinel` |
| Sprint 2 | 2.3, 2.4, 2.5 | `security-sentinel`, `nextjs-app-router-reviewer`, `design-system-enforcer` |
| Sprint 2 | 2.6 | `nextjs-app-router-reviewer` |
| Sprint 3 | 3.1, 3.2, 3.3, 3.4 | `design-system-enforcer` |
| Sprint 4 | 4.1, 4.3 | `nextjs-app-router-reviewer` |
| Sprint 4 | 4.3, 4.4 | `design-system-enforcer` |
| Sprint 5 | 5.2, 5.3 | `design-system-enforcer` |
| Sprint 6 | 6.2, 6.5 | `design-system-enforcer` |

## Domain Impact

- **Primary domains:** Banking (accounts, connections, transactions), Overview (dashboard)
- **Adjacent domains:** Accounting (opening balance JE via DocumentPostingService, COA template update), System (onboarding progress)
- **Schema migrations:** 3 additive migrations (see Schema Migrations section) — all backward-compatible, no data backfill

## Flinks Environment Variables

```env
# REQUIRED in production (NODE_ENV=production), optional in dev (falls back to demo mode)
FLINKS_INSTANCE=toolbox          # Flinks sandbox instance name
FLINKS_CUSTOMER_ID=              # Your Flinks customer ID (BACKEND ONLY — never send to frontend)
FLINKS_SECRET=                   # API secret for backend calls (BACKEND ONLY — never send to frontend)
FLINKS_CONNECT_URL=https://toolbox-iframe.private.fin.ag  # Connect widget URL (safe for frontend)
FLINKS_API_URL=https://toolbox-api.private.fin.ag/v3      # REST API base URL (BACKEND ONLY)
```

## Testing Strategy

- **Unit tests:** FlinksService (mock HTTP, validate-first flow, integer cents edge cases, PII scrubbing, currency handling), account creation with opening balance (integer cents, balanced JE, credit-normal accounts, atomic transaction)
- **Route tests:** Connection CRUD endpoints (auth, RBAC, validation, tenant isolation, rate limiting, soft delete, response shape)
- **Security tests:** postMessage origin validation, loginId never in responses, CSP header present
- **Frontend:** Manual testing of 3-path modal, Flinks iframe in demo mode, import wizard error recovery, cache revalidation after import
- **Integration:** Full flow test (connect → accounts appear → transactions in list → dashboard updates immediately)

## Progress

- [ ] Sprint 0: Schema Migrations (pre-req)
- [ ] Sprint 1: Account Creation Fix (P0)
- [ ] Sprint 2: Flinks Connect Integration
- [ ] Sprint 3: Import Wizard Fix (P0) — can run parallel with Sprint 4
- [ ] Sprint 4: Transaction List + Dashboard Freshness (P0) — can run parallel with Sprint 3
- [ ] Sprint 5: Onboarding Handoff + Empty States (P1)
- [ ] Sprint 6: Import Polish + P2 Fixes
- [ ] Sprint 7: P2/P3 Polish

**Estimated total:** ~40 hours across 8 sprints (Sprint 0 added), 34 tasks
**High-risk tasks:** 7 (financial: opening balance JE, Flinks amount mapping, schema migration; security: postMessage, CSP, RBAC)
**Parallelizable:** Sprints 3+4 can run concurrently (no dependencies between them)
