# Code Review: Accounting Domain UX Overhaul (Phases 1 + 2)

> **Date:** 2026-02-22
> **Commits:** `7d132a0` (Phase 1), `dad9450` + `1391e6e` (Phase 2 Backend), `197027e` (Phase 2 Frontend)
> **Reviewers:** fastify-api-reviewer, nextjs-app-router-reviewer, kieran-typescript-reviewer, security-sentinel
> **Verdict:** **CHANGES REQUIRED** (4 critical, 6 major, 10 minor)

---

## Scope

- **Phase 1:** Accounting Overview hub with tab navigation, balance equation, income summary, COA snapshot, recent entries, empty state
- **Phase 2:** Tax Rate full stack — Zod schemas, service, routes, 35 tests, frontend (list, form sheet, empty state with presets)
- **Files changed:** 37 files, +4,079 lines

---

## Critical Issues (4) -- Must Fix

### C-1. Search parameter destroys tenant isolation (SECURITY)
**File:** `tax-rate.service.ts:55-59` | **Found by:** 3/4 agents

When `search` is provided, `where.OR` is overwritten, removing the tenant filter entirely. `GET /tax-rates?search=GST` returns rates from ALL tenants.

**Fix:** Use `AND` to combine tenant scoping with search:
```typescript
const where: Prisma.TaxRateWhereInput = {
    AND: [
        {
            OR: [
                ...(params.entityId
                    ? [{ entityId: params.entityId, entity: { tenantId: this.tenantId } }]
                    : []),
                { entityId: null },
            ],
        },
        ...(params.search ? [{
            OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { code: { contains: params.search, mode: 'insensitive' } },
            ],
        }] : []),
    ],
};
```

### C-2. Any tenant can modify global tax rates (SECURITY)
**File:** `tax-rate.service.ts:170-174, 238-241` | **Found by:** 2/4 agents

`updateTaxRate` and `deactivateTaxRate` include `{ entityId: null }` in their ownership check. Any tenant can mutate shared global rates, affecting all tenants.

**Fix:** Remove `{ entityId: null }` from mutation queries, or add admin-only guard for global rates.

### C-3. `getAccountBalances` called with wrong signature (RUNTIME BUG)
**File:** `accounting/page.tsx:23-24` | **Found by:** 2/4 agents

Function expects `string` but receives `{ entityId }` object. URL becomes `?entityId=[object Object]`. Also `entityId` can be `undefined`. The entire overview hub (balance equation, COA snapshot, quick stats) is broken.

**Fix:** Update function signature to accept optional params object, or fix call site.

### C-4. `.optional()` called on middleware function (RUNTIME BUG)
**File:** `routes/tax-rate.ts:133` | **Found by:** 3/4 agents

`validateBody(DeactivateTaxRateSchema).optional()` -- `validateBody` returns a function, not a Zod schema. `.optional()` does not exist on functions. Either throws at startup or silently bypasses validation.

**Fix:** Remove `.optional()` and conditionally validate body:
```typescript
preValidation: [validateParams(TaxRateParamsSchema)],
// body is optional for DELETE -- don't validate
```

---

## Major Issues (6) -- Should Fix

### M-1. No ownership validation on `glAccountId` (IDOR)
**File:** `tax-rate.service.ts` create/update | **Found by:** 2/4 agents

A user can link a tax rate to a GL account from another tenant. Add ownership check before accepting `glAccountId`.

### M-2. Missing `@@unique([entityId, code])` on TaxRate model
**File:** `schema.prisma` | **Found by:** 2/4 agents

The `P2002` catch block is dead code — no unique constraint exists. Duplicate codes can be silently created.

### M-3. Incomplete date range validation on partial updates
**File:** `tax-rate.service.ts:189-200` | **Found by:** 1/4 agents

Only validates when BOTH dates are in the update payload. Sending only `effectiveTo` before existing `effectiveFrom` creates an inverted range.

### M-4. Inline `formatAmount` duplicated 4 times
**Files:** `balance-equation.tsx`, `income-summary.tsx`, `coa-snapshot.tsx`, `page.tsx` | **Found by:** 2/4 agents

Canonical `formatCurrency` exists at `@/lib/utils/currency.ts`. Inline copies hardcode `currency: 'CAD'`, lack thousands separators. Violates project guardrails.

### M-5. Tax Collection Flow uses hardcoded mock values
**File:** `tax-rates-client.tsx` | **Found by:** 1/4 agents

Shows "$1,000 revenue" as a static example. Could be mistaken for actual financial data.

### M-6. Missing `error.tsx` for tax-rates directory
**File:** `accounting/tax-rates/` | **Found by:** 1/4 agents

Tax rates has `loading.tsx` but relies on the parent accounting `error.tsx`. Invariant 6 requires a sibling `error.tsx`.

---

## Minor Issues (10)

| # | Issue | File | Agent |
|---|-------|------|-------|
| m-1 | No structured logging in tax rate routes | `routes/tax-rate.ts` | Fastify |
| m-2 | `listTaxRatesAction` exported but never used | `actions.ts` | Next.js |
| m-3 | "Create Custom Rate" button has no `onClick` handler | `tax-rates-empty.tsx` | Next.js, TS |
| m-4 | `onSave` prop typed as sync `void` but handler is `async` | `tax-rate-sheet.tsx:29` | TS |
| m-5 | Audit log `after` field logs undefined values on partial updates | `tax-rate.service.ts:224` | Fastify |
| m-6 | `TAX_RATE_SELECT` omits `createdAt`/`updatedAt` | `tax-rate.service.ts:11` | Fastify |
| m-7 | `handleAccountingError` duplicated between routes | `tax-rate.ts`, `gl-account.ts` | Fastify |
| m-8 | `text-[10px]` arbitrary Tailwind value repeated | Multiple files | Next.js |
| m-9 | Tax rate presets call `new Date().toISOString()` at module load | `tax-rates-empty.tsx` | Next.js |
| m-10 | `BadgeGlass` import may not resolve from `@akount/ui` | `recent-entries.tsx:3` | TS |

---

## What Passed Well

- **No `: any` types** anywhere in new code
- **No hardcoded hex colors** — all colors use semantic tokens (`text-ak-green`, `glass`, `border-ak-border`)
- **Glass morphism design** applied correctly with proper tier usage
- **Server/Client boundaries** are clean — server pages fetch, client components handle interactivity
- **35 backend tests** with good coverage of CRUD, error paths, and tenant isolation
- **Parallel data fetching** via `Promise.all` in overview page
- **Loading skeletons** exist and match actual page layouts
- **Empty states** are thoughtful with selectable preset groups

---

## Remediation Priority

| Priority | Fix | Effort |
|----------|-----|--------|
| 1 (Immediate) | C-1: Fix search tenant isolation | 15 min |
| 2 (Immediate) | C-2: Make global rates immutable | 15 min |
| 3 (Immediate) | C-3: Fix `getAccountBalances` call | 10 min |
| 4 (Immediate) | C-4: Fix `.optional()` middleware bug | 5 min |
| 5 (Before merge) | M-1: Validate `glAccountId` ownership | 20 min |
| 6 (Before merge) | M-2: Add `@@unique` constraint | 15 min |
| 7 (Before merge) | M-4: Replace inline formatAmount | 15 min |
| 8 (Soon) | M-3, M-5, M-6 | 30 min |
| 9 (Backlog) | All minor issues | 1h |

---

_Review complete. 4 agents, 37 files examined, 4,079 lines reviewed._
