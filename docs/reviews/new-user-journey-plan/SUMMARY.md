# Review: New User Journey UX Overhaul Plan

**Date:** 2026-02-20
**Plan:** `docs/plans/2026-02-20-new-user-journey-ux-overhaul.md`
**Reviewers:** architecture-strategist, financial-data-validator, security-sentinel, nextjs-app-router-reviewer
**Verdict:** CHANGES REQUIRED (35 findings: 4 critical, 10 high, 12 medium, 9 low/info)

---

## Executive Summary

The plan is **architecturally sound** — sprint structure, dependency chains, and domain assignments are well-designed. However, 4 agents found **significant gaps** that must be addressed before implementation:

1. **The plan claims "no schema migration needed" — this is incorrect** (3 migrations required)
2. **Flinks iframe security has 3 critical gaps** (postMessage origin validation, CSP frame-src, loginId validation)
3. **Opening balance journal entry is under-specified** (missing GL account, missing source type enum, no atomicity)
4. **Cache revalidation strategy is incomplete** (only covers `/overview`, needs 5 paths)

---

## Critical Findings (4) — Must Fix Before Implementation

### C1: postMessage Origin Validation Missing [Security]
**Task:** 2.3 (FlinksConnect frontend)
**Risk:** Any script/page can inject fake loginIds via `window.postMessage`, potentially linking attacker-controlled bank data to victim's tenant.
**Fix:** Validate `event.origin` against `FLINKS_CONNECT_URL` domain. Derive allowed origin server-side, pass as prop. Never hardcode.

### C2: X-Frame-Options DENY Blocks Flinks Iframe + No CSP [Security]
**Task:** 2.3
**Risk:** Current `X-Frame-Options: DENY` in `next.config.js`, `middleware.ts`, and `security-headers.ts` will block the iframe entirely. A developer may globally weaken this, enabling clickjacking.
**Fix:** Keep DENY. Add `Content-Security-Policy: frame-src 'self' https://*.private.fin.ag;` to allowlist only Flinks domains. Add `sandbox` attribute to iframe (`allow-scripts allow-same-origin allow-forms allow-popups`).

### C3: loginId Stored Before Flinks API Validation [Security + Financial]
**Task:** 2.1, 2.2
**Risk:** Backend stores BankConnection immediately on receiving loginId from frontend, before verifying it with Flinks API. Invalid/fabricated loginIds create orphaned records.
**Fix:** Validate loginId with Flinks API FIRST (call GetAccountsDetail). Create BankConnection only after successful response. Use `$transaction` with PENDING→ACTIVE state transition.

### C4: No "Opening Balance Equity" GL Account Exists [Financial]
**Task:** 1.3
**Risk:** Opening balance JE credits "Opening Balance Equity" but this account doesn't exist in COA template. Runtime failure on first account creation with opening balance.
**Fix:** Add `3300 Opening Balance Equity` (type: EQUITY, normalBalance: CREDIT) to `coa-template.ts`. Add to COA seed.

---

## High Findings (10) — Must Address in Plan Update

### H1: `JournalEntrySourceType` Needs `OPENING_BALANCE` Value [Financial]
**Task:** 1.3 | **Migration required**
No way to trace opening balance JEs or prevent duplicate posting. Add `OPENING_BALANCE` to enum.

### H2: Opening Balance JE Not Atomic with Account Creation [Financial]
**Task:** 1.3
Current `createAccount` has no `$transaction`. Account + JE + balance update must be wrapped in single Prisma transaction.

### H3: GL Account Assignment for New Accounts Undefined [Financial]
**Task:** 1.3
`Account.glAccountId` is nullable and not set during creation. Opening balance JE has no debit target. Auto-assign based on AccountType (BANK→1100, CREDIT_CARD→2100, etc.).

### H4: Flinks Float-to-Cents Conversion Not Specified [Financial]
**Task:** 2.1
Must use `Math.round(amount * 100)` explicitly. Test edge cases: `19.99`, `0.1 + 0.2`, `100.005`.

### H5: No RBAC on Connection Endpoints [Security]
**Task:** 2.2
Plan doesn't specify roles. Create/delete should be OWNER/ADMIN only. List should require transacting access.

### H6: Demo Mode Fallback in Production [Security]
**Task:** 2.1
If env vars accidentally unset in production, service silently serves fake data. Require env vars in production; demo mode only in dev/staging.

### H7: Nightly Refresh Endpoint Authentication Undefined [Security]
**Task:** 2.2
Cron/webhook endpoint needs auth strategy (shared secret, internal-only prefix, or Flinks webhook signature validation).

### H8: `revalidatePath` Only Covers `/overview` — Needs 5 Paths [Next.js]
**Task:** 4.1
Must also revalidate: `/overview/cash-flow`, `/overview/net-worth`, `/banking/accounts`, `/banking/transactions`.

### H9: Missing `error.tsx` for `banking/imports/[id]` Route [Next.js]
**Task:** Sprint 3 (Invariant #6 violation)
Existing uncommitted `[id]/page.tsx` has `loading.tsx` but no `error.tsx`.

### H10: No `BankConnection` → `Account` Relationship [Architecture]
**Task:** 2.1
No foreign key between BankConnection and Account. Can't know which accounts came from which connection during refresh. Add `bankConnectionId String?` to Account model.

---

## Medium Findings (12)

| # | Finding | Agent | Task |
|---|---------|-------|------|
| M1 | Banking service creates JEs directly — should route through Accounting domain (DocumentPostingService) | Architecture | 1.3 |
| M2 | BankConnection missing `deletedAt` field (soft delete violation) | Financial + Security | 2.2 |
| M3 | BankFeedTransaction → Transaction reconciliation flow not planned (Flinks data invisible in dashboard) | Financial | 2.1 |
| M4 | Flinks currency mismatch handling vague (need FX rate for cross-currency JEs) | Financial | 2.1 |
| M5 | Account `currentBalance` update strategy unspecified (Flinks-reported vs calculated) | Financial | 1.3, 2.1 |
| M6 | Missing audit trail for Flinks operations (BankConnection CRUD) | Financial | 2.1 |
| M7 | No rate limiting on connection creation endpoint | Security | 2.2 |
| M8 | No iframe `sandbox` attributes specified | Security | 2.3 |
| M9 | Raw Flinks response stored unscrubbed in `rawData` (potential PII exposure) | Security | 2.1 |
| M10 | FlinksConnect should use `next/dynamic` with `ssr: false` | Next.js | 2.3 |
| M11 | Flinks connection should use server action, not direct client API call | Next.js | 2.3/2.4 |
| M12 | Existing transaction server actions missing `revalidatePath` calls (pre-existing gap) | Next.js | 4.1 |

---

## Low/Info Findings (9)

| # | Finding | Agent | Task |
|---|---------|-------|------|
| L1 | Sprint 3+4 can run in parallel — note this explicitly | Architecture | Planning |
| L2 | Nightly refresh architecture under-specified (acceptable as out-of-scope) | Architecture | Future |
| L3 | Task 4.5 (Cash Flow Chart) scope creep — fix should be in API service, not frontend | Architecture | 4.5 |
| L4 | "Explore with sample data" toggle (Task 5.3) conflicts with "no mock data in production" guardrail | Architecture | 5.3 |
| L5 | Missing Flinks account-type → AccountType mapping table | Architecture | 2.1 |
| L6 | Negative opening balance for credit-normal accounts (credit cards, loans) needs reversed JE direction | Financial | 1.2/1.3 |
| L7 | No max value on opening balance amount — needs Zod constraints | Security | 1.3 |
| L8 | Tenant isolation query pattern should be explicitly specified (entity: { tenantId }) | Security | 2.2 |
| L9 | Explicit `'use client'` annotation missing in plan for modal components | Next.js | 1.1, 2.4 |

---

## Required Plan Amendments (Grouped)

### 1. Schema Migrations (New Section)
The plan must acknowledge these migrations and remove "no schema migration needed":
- Add `OPENING_BALANCE` to `JournalEntrySourceType` enum
- Add `deletedAt DateTime?` to `BankConnection` model
- Add `bankConnectionId String?` to `Account` model (with relation)
- Add `3300 Opening Balance Equity` to COA template seed

### 2. Sprint 1 Amendments (Opening Balance)
- Task 1.3: Route JE creation through DocumentPostingService (Accounting domain), not Banking
- Task 1.3: Wrap account + JE + balance update in `prisma.$transaction()`
- Task 1.3: Add GL account auto-assignment based on AccountType
- Task 1.3: Handle credit-normal accounts (reversed debit/credit for credit cards, loans)
- Task 1.3: Add Zod constraints on amount (max $9.99B) and date (not future, not pre-1900)

### 3. Sprint 2 Amendments (Flinks Security)
- Task 2.1: Validate loginId with Flinks API BEFORE creating BankConnection (validate-first, not store-first)
- Task 2.1: Specify `Math.round(amount * 100)` for float-to-cents conversion
- Task 2.1: Scrub PII from `rawData` before storage (mask account numbers, remove routing numbers)
- Task 2.1: Add audit log entries for all BankConnection operations
- Task 2.1: Add auto-creation of Transaction records from BankFeedTransactions during initial sync
- Task 2.2: Add RBAC (OWNER/ADMIN for create/delete, transacting for list)
- Task 2.2: Add `strictRateLimitConfig()` on create and refresh endpoints
- Task 2.2: Add idempotency guard (check existing connection by loginId before creating)
- Task 2.3: Add postMessage origin validation (derive from server-side env var)
- Task 2.3: Add CSP `frame-src` directive for Flinks domain
- Task 2.3: Add iframe `sandbox` attribute
- Task 2.3: Use `next/dynamic` with `ssr: false`
- Task 2.3/2.4: Use server action for connection creation, not direct client API call
- Task 2.6: Add tenant isolation query pattern test (entity: { tenantId })
- New task: Separate cron/webhook refresh from user-facing refresh (auth strategy)

### 4. Sprint 3 Amendment
- Add `error.tsx` for `banking/imports/[id]` route

### 5. Sprint 4 Amendments (Cache + Dashboard)
- Task 4.1: Revalidate all 5 affected paths, not just `/overview`
- Task 4.1: Add `revalidatePath` to existing transaction server actions (pre-existing gap fix)
- Task 4.3: Use server-side `searchParams` (extend existing interface), not `useSearchParams`
- Task 4.5: Fix should be in API service layer, not frontend component

### 6. Sprint 5 Amendment
- Task 5.3: Replace "explore with sample data" toggle with static screenshot/illustration (guardrail compliance)

### 7. Environment & Config
- Task 2.1: Require Flinks env vars in production (`NODE_ENV=production`), demo mode only in dev/staging
- Never pass `FLINKS_SECRET` or `FLINKS_CUSTOMER_ID` to frontend

---

## Agent Details

Individual agent reports are in the [agents/](./agents/) directory:
- [architecture-strategist.md](./agents/architecture-strategist.md)
- [financial-data-validator.md](./agents/financial-data-validator.md)
- [security-sentinel.md](./agents/security-sentinel.md)
- [nextjs-app-router-reviewer.md](./agents/nextjs-app-router-reviewer.md)
