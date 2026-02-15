# Weekly Health Audit — 2026-02-14

**Auditor:** Claude CTO Persona
**Scope:** Full codebase, context files, security, financial integrity, architecture
**Branch:** main (dirty working tree — uncommitted changes from design overhaul work)

---

## Phase 1: Context Freshness Audit

### 1A. Staleness Report

| File | Last Updated | Accuracy | Verdict |
|------|-------------|----------|---------|
| `CLAUDE.md` (root) | 2026-02-14 | 8/10 | FRESH |
| `apps/api/CLAUDE.md` | 2026-02-14 | 9/10 | FRESH |
| `apps/web/CLAUDE.md` | 2026-02-14 | 6/10 | STALE |
| `packages/db/CLAUDE.md` | 2026-02-09 | 7/10 | STALE |
| `.claude/rules/api-conventions.md` | — | 9/10 | FRESH |
| `.claude/rules/design-aesthetic.md` | — | 10/10 | FRESH |
| `.claude/rules/financial-rules.md` | — | 10/10 | FRESH |
| `.claude/rules/frontend-conventions.md` | — | 9/10 | FRESH |
| `.claude/rules/guardrails.md` | — | 10/10 | FRESH |
| `.claude/rules/plan-enforcement.md` | — | 10/10 | FRESH |
| `.claude/rules/test-conventions.md` | — | 9/10 | FRESH |
| `.claude/rules/workflows.md` | — | 10/10 | FRESH |
| `MEMORY.md` | 2026-02-12 | 7/10 | STALE |
| `STATUS.md` | 2026-02-12 | 4/10 | **WRONG** |
| `TASKS.md` | 2026-02-12 | 8/10 | SLIGHTLY STALE |
| `ROADMAP.md` | 2026-02-09 | 3/10 | **WRONG** |
| `docs/context-map.md` | 2026-02-09 | 7/10 | STALE |

### 1B. Specific Inaccuracies

**STATUS.md (P1 — WRONG):**
- Claims "235 backend tests" — actual is **362** (off by 127)
- Claims "5 functional frontend pages" — actual is at least 8+ functional
- Missing: Phase 3 accounting work (Chart of Accounts, Journal Entries, Posting) — all built
- Missing: OnboardingProgress model addition
- Verdict: Hasn't been updated since Phase 3 backend was built

**ROADMAP.md (P1 — WRONG):**
- Phase 2 shown as "70% (BE done, FE in progress)" — actually **100% COMPLETE**
- Onboarding shown as "REMAINING — ~10-12 hours" — actually **COMPLETE**
- Phase 2 exit criteria shown as unchecked — should be checked
- Phase 3 shown as "Not started" — but backend is **COMPLETE** (accounting domain fully built)
- Timeline says "~30% complete" for MVP — closer to 45-50%
- Verdict: Hasn't been updated since 2026-02-09

**packages/db/CLAUDE.md (P2 — STALE):**
- Claims 38 models — actual is **39** (missing `OnboardingProgress`)
- Last verified 2026-02-09 — 5 days stale

**apps/web/CLAUDE.md (P2 — STALE):**
- Claims "38 pages" in section title — actual count is **45 pages**
- Missing pages: `brand/page.tsx`, `forbidden/page.tsx`, `onboarding/complete/page.tsx`, `onboarding/page.tsx`, root `page.tsx`, auth pages

**docs/context-map.md (P2 — STALE):**
- Design System section says "Primary: Brand color (blue)" — should be "Amber Orange (#F59E0B)"
- Doesn't reflect Phase 3 accounting work being built
- Component radius says "Card: 12px" — design-aesthetic.md says 14px for cards

### 1C. Line Budget Check

| Context Set | Lines | Status |
|-------------|-------|--------|
| Always-loaded (root CLAUDE.md + global rules) | ~350 | OK (under 500) |
| API context (always-loaded + API rules + api/CLAUDE.md) | ~610 | OK (under 1200) |
| Frontend context (always-loaded + FE rules + web/CLAUDE.md) | ~570 | OK (under 1200) |

### 1D. Redundancy Scan

- **SRP explained** in both `api-conventions.md` and `frontend-conventions.md` — acceptable (different examples per domain)
- **Middleware chain** referenced in CLAUDE.md root and api-conventions.md — minor duplication
- **Integer cents rule** appears in root CLAUDE.md, financial-rules.md, and test-conventions.md — acceptable for a zero-tolerance invariant
- No actionable redundancy issues

### Context Freshness Score: **58/100**

STATUS.md and ROADMAP.md are significantly wrong. They describe a state from 5+ days ago and would mislead any new contributor or AI session about what's been built.

---

## Phase 2: Codebase Health

### 2A. Test Coverage

**Test Suite Results:** 362 tests, **350 passing, 12 FAILING**

| Domain | Tests | Status |
|--------|-------|--------|
| Banking | 174 | 12 FAILING (all in imports.routes.test.ts) |
| Accounting | 117 | All passing |
| System | 26 | All passing |
| Planning | 17 | All passing |
| Overview | 16 | All passing |
| AI | 0 | NO TESTS |
| Shared (FX) | 12 | All passing |

**Failing Tests (P0):** All 12 failures in `imports.routes.test.ts`:
- CSV upload, XLSX upload, PDF upload, list batches, get batch detail tests
- Root cause: Route/schema changes that broke test expectations (returning 400 instead of expected status codes)
- This means the import routes have been modified but tests weren't updated

**Coverage Grade: C+** (96.7% passing but 12 failures and AI domain has zero tests)

**Financial invariant assertions:** Used in 5 test files — Banking routes (transactions, reconciliation, imports) and legacy tests. Accounting tests should also use them explicitly.

### 2B. TypeScript Strictness

| Metric | Count | Target | Grade |
|--------|-------|--------|-------|
| `: any` types (API) | 40 | 0 | D |
| `: any` types (Web) | 3 | 0 | B |
| `@ts-expect-error` | 1 | 0 | A |
| Total type violations | 44 | 0 | D |

Most `: any` in API are in test files (mock data) and AI providers. Still bad — mock data should be properly typed.

### 2C. Dead Code & File Bloat

**Files exceeding 400 lines (production code):**

| File | Lines | Concern |
|------|-------|---------|
| `parser.service.ts` | 1,066 | Split by format (CSV/PDF/XLSX parsers) |
| `brand/page.tsx` | 1,039 | Marketing page — acceptable |
| `posting.service.ts` | 851 | Complex but cohesive (all posting logic) |
| `import.service.ts` | 685 | Three import flows — could split |
| `chart-of-accounts-client.tsx` | 620 | Component too large — split |
| `journal-entry.service.ts` | 618 | Complex but cohesive |
| `import.ts` (routes) | 617 | Route file too large |
| `reconciliation.service.ts` | 541 | Acceptable |
| `transaction.service.ts` | 501 | Acceptable |
| `journal-entries-client.tsx` | 497 | Component too large |

**Legacy duplicate:** `apps/api/src/services/parserService.ts` (482 lines) exists alongside `domains/banking/services/parser.service.ts` (1,066 lines). The legacy one should be deleted.

### 2D. Dependency Health

**npm audit: 14 vulnerabilities (1 low, 8 moderate, 5 high)**

This needs attention. High vulnerabilities in a fintech app are unacceptable for production.

### 2E. Console.log in Production

| File | Concern |
|------|---------|
| `api/src/services/categorizationService.ts` | Legacy file — should be deleted |
| `api/src/domains/ai/services/categorization.service.ts` | Production logging — use logger |
| `api/src/lib/env.ts` | Env validation logging — borderline OK |
| `web/src/app/api/import/upload/route.ts` | Debug logging left in |
| `web/src/app/onboarding/components/steps/EssentialInfoStep.tsx` | Debug logging |
| `web/src/app/api/webhooks/clerk/route.ts` | Error logging — borderline OK |

### Codebase Health Score: **55/100**

12 failing tests is a P0. That's broken code in the main branch. The large file counts and `: any` usage are P2 tech debt.

---

## Phase 3: Security Posture

### 3A. Tenant Isolation

All service files were audited for Prisma queries missing tenant filters.

**Findings:**
- Core services (account, transaction, journal-entry, gl-account, entity, reconciliation, import, dashboard) all properly filter by `tenantId` or `entityId` with entity-tenant chain. **PASS**
- `account-matcher.service.ts` filters by entityId. **PASS**
- `duplication.service.ts` receives accountId parameter (account already tenant-verified upstream). **PASS**
- `categorization.service.ts` filters by tenantId. **PASS**
- `posting.service.ts` uses transaction-scoped queries that verify entity ownership. **PASS**

**Verdict: No tenant isolation gaps found.** The middleware chain enforces tenant context before routes execute.

### 3B. Authentication

- Auth middleware (`middleware/auth.ts`) verifies Clerk JWT on all protected routes. **PASS**
- Onboarding routes use Clerk directly for unauthenticated flows. **PASS**
- No unprotected route handlers found in domain routes. **PASS**

### 3C. Input Validation

- All POST/PATCH routes use Zod schema validation. **PASS**
- Import routes validate file types and sizes. **PASS**
- One concern: Some stub routes (business, services, AI) return 501 without input validation — acceptable for stubs.

### 3D. Rate Limiting

- Global rate limiting: 100 req/min per tenant+user. **PASS**
- Strict rate limiting config exists for sensitive routes. **PASS**
- Burst config for imports. **PASS**
- Well-implemented with proper key generation (tenant:user fallback to IP). **PASS**

### 3E. Secrets

- No hardcoded secrets found. All use `process.env`. **PASS**
- `.gitignore` covers `.env`, `.env.local`, `.env.*.local`. **PASS**
- Note: `.env` was previously committed (commit 7516746 removed it). Secrets may exist in git history.

### Security Score: **82/100**

Strong security posture. Deducted for: npm vulnerabilities (14, 5 high), secrets potentially in git history.

---

## Phase 4: Financial Integrity

### 4A. Float Contamination

**Schema Float usage (Prisma):**

| Field | Model | Type | Verdict |
|-------|-------|------|---------|
| `exchangeRate` | JournalLine | Float? | OK — rate, not money |
| `rate` | TaxRate | Float | OK — percentage rate |
| `confidence` | BankFeedTransaction | Float? | OK — not money |
| `confidence` | TransactionMatch | Float? | OK — not money |
| `aiConfidence` | RuleSuggestion | Float? | OK — not money |
| `successRate` | Rule | Float | OK — not money |
| `rate` | FXRate | Float | OK — exchange rate |
| `aiConfidence` | Category | Float | OK — not money |

**PASS — No Float types on monetary fields.** All amounts stored as Int (cents).

### 4B. Soft Delete Enforcement

**Hard delete search results:**
- Only `transactionMatch.delete()` in reconciliation.service.ts — TransactionMatch is NOT a financial record. **PASS**
- All financial models (Account, Transaction, Invoice, Bill, Payment, JournalEntry, JournalLine, CreditNote) have `deletedAt` field. **PASS**

### 4C. Journal Entry Balance Validation

- `journal-entry.service.ts` validates `totalDebits === totalCredits` before creation. **PASS**
- `posting.service.ts` constructs balanced entries with matching debit/credit amounts. **PASS**
- 49 journal entry tests + 33 posting tests validate balance invariant. **PASS**

### 4D. Source Preservation

- `posting.service.ts` stores `sourceType`, `sourceId`, `sourceDocument` on every journal entry created from transactions. **PASS**
- Tests verify source fields are populated. **PASS**

### Financial Integrity Score: **95/100**

Exemplary. The 5-point deduction is for: not all test files use the centralized `assertIntegerCents` helper (some manually check), and the AI categorization service has no tests validating money handling.

---

## Phase 5: Architecture & Scale Readiness

### 5A. N+1 Query Detection

**Potential N+1 in `posting.service.ts`:**
- `postTransactions` (bulk post) iterates through transactions in a `for..of` loop and creates individual journal entries. Each iteration does multiple queries (find GL account, find FX rate, create journal entry). This is O(n) queries for n transactions.
- **Mitigation:** Uses Prisma transactions, so at least it's within a single connection. But for 1000+ transactions, this will be slow.

**Potential N+1 in `categorization.service.ts`:**
- `categorizeMultiple` loops through transactions and makes individual category lookups.

**Grade: C** — Not blocking today, but will need batch optimization before scale.

### 5B. Pagination Coverage

All list endpoints use cursor pagination (banking, accounting, system, imports). **PASS**
- `take: limit + 1` pattern used consistently for "has next page" detection. **GOOD**
- Import batch listing paginated. **PASS**
- GL account listing includes pagination. **PASS**

### 5C. Error Handling

- Services generally let Prisma errors bubble to route-level error handling. **ACCEPTABLE**
- External API calls (AI providers) have try/catch. **PASS**
- No unhandled promise rejections detected in service code.

### 5D. Loading States & Error Boundaries

**Only 3 loading.tsx and 3 error.tsx files for 45 pages:**

| Location | loading.tsx | error.tsx |
|----------|------------|----------|
| `(dashboard)/overview/` | YES | YES |
| `(dashboard)/banking/accounts/` | YES | YES |
| `(dashboard)/banking/accounts/[id]/` | YES | YES |
| All other 35+ pages | **NO** | **NO** |

This is bad. Accounting, system, planning, AI, business, services — none have loading or error states. Users will see blank screens during data fetches and unhandled errors.

### 5E. Logging & Observability

- Health check endpoint exists (`services/health.service.ts`). **PASS**
- `console.log` used instead of structured logger in 7 production files. **FAIL**
- No structured logging framework (pino, winston) integrated despite Fastify having built-in pino support.

### Architecture Score: **52/100**

Loading/error state coverage is terrible (6/45 pages). Console.log instead of structured logging. N+1 patterns will bite at scale.

---

## Phase 6: Production Readiness Checklist

| Category | Check | Status |
|----------|-------|--------|
| **Auth** | Clerk JWT verified on all protected routes | YES |
| **Auth** | RBAC enforcement matches design (roles) | PARTIAL (4 roles vs 6 designed) |
| **Data** | All money is integer cents | YES |
| **Data** | All journal entries validate balance | YES |
| **Data** | All queries filter by tenantId | YES |
| **Data** | All financial deletes are soft | YES |
| **API** | All inputs validated with Zod | YES |
| **API** | All list endpoints paginated | YES |
| **API** | Rate limiting configured | YES |
| **API** | Error responses are consistent format | MOSTLY (stubs return inconsistent shapes) |
| **Frontend** | Loading states for all async pages | **NO** (3/45 pages) |
| **Frontend** | Error boundaries for all routes | **NO** (3/45 pages) |
| **Frontend** | Forms validate before submit | PARTIAL |
| **Infra** | Environment variables documented | NO |
| **Infra** | Database migrations reversible | UNTESTED |
| **Infra** | Health check endpoint exists | YES |
| **Infra** | Structured logging (not console.log) | **NO** |
| **Testing** | >80% endpoint coverage | YES (for built endpoints) |
| **Testing** | Financial invariants tested | YES |
| **Testing** | Tenant isolation tested | YES |

**Production Readiness: 13/20 checks passing**

---

## Phase 7: Brutal Verdict

### Overall Scores

```
CONTEXT FRESHNESS:      58/100
CODEBASE HEALTH:        55/100
SECURITY POSTURE:       82/100
FINANCIAL INTEGRITY:    95/100
ARCHITECTURE:           52/100
PRODUCTION READINESS:   13/20 checks

OVERALL GRADE:          C+ (63/100)
MILLION-USER READY:     NOT YET
```

### Grading Scale Applied

**C+ (63):** Functional but gaps. The core financial logic is rock-solid (95/100) and security is strong (82/100). But the operational fundamentals — context accuracy, test green-ness, error handling, and observability — are dragging the score down hard.

### The Hard Truth

The financial engine is impressive — integer cents everywhere, balanced journal entries, tenant isolation without gaps, and proper soft deletes. That's the hardest part to get right and you nailed it. But you're shipping on a broken test suite (12 failures on main), your status documents lie about what's been built, and 42 of 45 pages will show users a blank white screen while loading. The single biggest risk is that **ROADMAP.md and STATUS.md are so stale they'll cause wrong decisions about what to build next** — someone reading them would think Phase 3 hasn't started when it's actually backend-complete. Fix the context first; everything downstream depends on accurate situational awareness.

### Top 5 Action Items

1. **[P0] Fix 12 failing tests in `imports.routes.test.ts`** — ~1 hour, AI. The import routes were modified but tests weren't updated. This is broken code on main. File: `apps/api/src/domains/banking/routes/__tests__/imports.routes.test.ts`

2. **[P0] Update STATUS.md, ROADMAP.md, packages/db/CLAUDE.md** — ~30 min, AI. STATUS.md says 235 tests (actual: 362), ROADMAP.md says Phase 2 is 70% (actual: 100%), db/CLAUDE.md says 38 models (actual: 39). These files are actively misleading.

3. **[P1] Add loading.tsx and error.tsx to all dashboard pages** — ~2 hours, AI. Only 3 of 45 pages have them. Every page under `(dashboard)/` needs at minimum a skeleton loader and an error boundary. Can use a shared template.

4. **[P1] Fix npm vulnerabilities** — ~30 min, Human. 14 vulnerabilities (5 high). Run `npm audit fix` and review breaking changes. Unacceptable for a fintech app.

5. **[P2] Replace console.log with structured logging** — ~2 hours, AI. Fastify ships with pino. Wire it up, replace all `console.log` in production code (7 files), and add request-scoped logging. Files: `categorization.service.ts`, `env.ts`, `EssentialInfoStep.tsx`, `import/upload/route.ts`, `clerk/route.ts`

### What's Working Well

1. **Financial integrity is near-perfect.** Integer cents everywhere, balanced journal entry validation, soft deletes on all financial models, source preservation on GL postings. This is the foundation of a fintech app and it's solid.

2. **Tenant isolation is comprehensive.** Every Prisma query filters by tenantId or entityId. The middleware chain enforces context before any route handler executes. No gaps found.

3. **Rate limiting is production-grade.** Three tiers (global/strict/burst), tenant+user key generation with IP fallback, proper response headers. Better than most apps at this stage.

4. **Cursor pagination is consistent.** All list endpoints use the `take: limit + 1` pattern for efficient "has next page" detection. No unbounded queries found.

5. **Test volume is strong for a pre-launch product.** 362 tests across 19 files covering banking, accounting, system, and planning domains. Financial invariant assertions are used in test helpers. The *quantity* is good — just need to keep them green.

---

_Audit completed: 2026-02-14 | Next scheduled: 2026-02-21_
