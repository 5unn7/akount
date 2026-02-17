# Guardrails

> **Auto-loaded globally** — enforces critical rules via hooks

## 7 Key Invariants (Zero Exceptions)

These invariants are enforced across the entire codebase. Violations will fail commits or trigger reset.

1. **Tenant Isolation** — Every query MUST filter by `tenantId` (entity-scoped: `entity: { tenantId }`)
2. **Integer Cents** — All amounts are integer cents (1050 = $10.50). Never use floats.
3. **Double-Entry** — `SUM(debitAmount) === SUM(creditAmount)` always. Validate before creating JournalEntry.
4. **Soft Delete** — Financial records use `deletedAt: DateTime?`. Filter: `WHERE deletedAt IS NULL`. Never hard delete.
5. **Source Preservation** — Journal entries store `sourceType`, `sourceId`, `sourceDocument` (JSON snapshot).
6. **Page Loading States** — Every `page.tsx` under `(dashboard)/` MUST have sibling `loading.tsx` and `error.tsx`
7. **Server/Client Separation** — Files MUST NOT mix server-only imports (`prisma`, `fs`, `node:*`) with client-only code (`'use client'`)

**Why these are zero-tolerance:**
- Invariants 1-5: Financial data integrity, audit compliance, multi-tenancy security
- Invariant 6: Without loading.tsx, users see blank screens during data fetches. Without error.tsx, errors crash the entire layout.
- Invariant 7: Mixing server/client code causes runtime crashes and bundler instability. 5 P0 crashes traced to this in Phase 5 review.

---

## Hook Enforcement

The following rules are **BLOCKED** by hooks and will fail commits:

### Financial Data Rules

- ❌ Using floats for money (`amount: Float` in Prisma)
- ❌ Hard delete on financial models (Invoice, Bill, Payment, JournalEntry, Account, Transaction)
- ❌ Missing `tenantId` filter in queries

**Hook:** `.claude/hooks/hard-rules.sh`

### File Location Rules

- ❌ Brainstorm files NOT in `docs/brainstorms/`
- ❌ Plan files NOT in `docs/plans/`
- ❌ Session reports NOT in `docs/archive/sessions/`

**Hook:** `.claude/hooks/hard-rules.sh`

### Schema Validation

- ❌ Float types in Prisma schema for monetary fields
- ❌ Missing `deletedAt` on financial models

**Hook:** `.claude/hooks/context-validate.sh`

### Code Quality Rules

- ⚠️ Using `console.log` in production code (use pino: `request.log` or `server.log`)
- ⚠️ Using `: any` type annotations (prefer specific types or `unknown`)
- ❌ **Creating `page.tsx` without sibling `loading.tsx` / `error.tsx`** (Invariant #6)
- ❌ **Mixing server-only imports with `'use client'`** (Invariant #7)

**Hook:** `.claude/hooks/context-validate.sh` and `.claude/hooks/hard-rules.sh`

## Pre-Flight Checklist (MANDATORY)

**Before writing ANY code, Claude MUST:**

1. ✅ **Classify the change** — Bug fix, feature, refactor, or config? (see `product-thinking.md`)
2. ✅ **Read existing files first** — never edit blindly
3. ✅ **Search for patterns** — `Grep "similar-feature" apps/`
4. ✅ **Search MEMORY for prior learnings** — `Grep "[concept]" memory/`
5. ✅ **Trace the impact** — what imports/calls this code? What could break?
6. ✅ **Apply review lens** — will this pass security, financial integrity, type safety?
7. ✅ **Verify schema** — check Prisma models match intent
8. ✅ **Check tokens** — design tokens exist before using
9. ✅ **Scan for anti-patterns** — see "Explicit Anti-Patterns" below
10. ✅ **Verify labels/paths** — search before creating new
11. ✅ **Validate test vs production** — mocks stay in `__tests__/`
12. ✅ **For UI changes: minimal first** — change ONE visual thing, verify, then expand (see `frontend-conventions.md`)
13. ✅ **Check loading/error states** — every new page.tsx needs loading.tsx + error.tsx (Invariant #6)
14. ✅ **Check server/client separation** — no mixing `'use client'` with server-only imports (Invariant #7)

**For bug fixes:** Follow Investigation Protocol in `product-thinking.md`, or run `/processes:diagnose` for complex bugs.

## Explicit Anti-Patterns (NEVER DO)

### TypeScript
- ❌ **NEVER use `: any`** — use `unknown` and type guard, or specific type
- ❌ **NEVER suppress errors** — fix root cause, don't `@ts-ignore`
- ❌ **NEVER use `as any`** — this defeats TypeScript purpose

### Design System
- ❌ **NEVER hardcode colors** — use tokens from `globals.css`
  - WRONG: `text-[#34D399]`, `bg-[rgba(255,255,255,0.06)]`
  - RIGHT: `text-ak-green`, `glass`
- ❌ **NEVER create duplicate components** — search existing first
- ❌ **NEVER ignore design spec** — if spec says "glass", use glass variant

### Logging
- ❌ **NEVER use `console.log`** in production code (API/services)
  - Use `request.log.info()` or `server.log.info()`
  - Exception: `apps/api/src/lib/env.ts` (pre-boot validation)
- ❌ **NEVER log sensitive data** — no tokens, passwords, PII

### Database
- ❌ **NEVER use floats for money** — integer cents only
- ❌ **NEVER hard delete financial records** — use soft delete
- ❌ **NEVER skip tenantId filter** — every query needs it
- ❌ **NEVER use wrong DB** — production uses `@akount/db` Prisma client

### Code Quality
- ❌ **NEVER use mock data in implementation** — mocks are for tests
- ❌ **NEVER create files without checking existing** — search first
- ❌ **NEVER ignore SRP** — one file = one responsibility
- ❌ **NEVER batch status updates** — update immediately when task completes

### Page Loading & Error States (Invariant #6)
- ❌ **NEVER create page.tsx without loading.tsx** — blank screens = terrible UX
- ❌ **NEVER create page.tsx without error.tsx** — errors crash entire layout
- ✅ **ALWAYS use templates** — see `frontend-conventions.md` for loading/error templates

### Server/Client Separation (Invariant #7)
- ❌ **NEVER mix `'use client'` with server-only imports** — causes runtime crashes
  - Server-only imports: `prisma`, `fs`, `path`, `node:*`, server utilities
  - Client-only: hooks (`useState`, `useEffect`), browser APIs (`window`, `localStorage`)
- ✅ **Keep Server Components pure** — data fetch only, no event handlers
- ✅ **Mark Client Components explicitly** — add `'use client'` directive when needed

## Reset Triggers

Use `/processes:reset` when:

- AI violates any of the 7 Key Invariants
- AI uses floats for money (Invariant #2)
- AI proposes `: any` types
- AI forgets `tenantId` in queries (Invariant #1)
- AI hardcodes colors/values
- AI creates files in wrong locations
- AI uses `console.log` in production code
- AI mixes mock data into implementation
- AI creates pages without loading/error states (Invariant #6)
- AI mixes server-only imports with `'use client'` (Invariant #7)
- AI doesn't check existing patterns first
- AI rewrites code without understanding why it exists
- AI fixes a symptom without tracing root cause
- AI ignores cross-domain impact of changes
- AI doesn't search MEMORY topic files before implementing
- Session feels "off track" or sloppy

**Trigger phrases:**

- "Reset context"
- "You're off track"
- "Check the rules"
- "Reload context"
- "Follow the guardrails"

## Commit Conventions

Commits MUST:

- Have clear, concise messages
- Pass all tests before committing
- Never commit failing code or TypeScript errors

**When to commit:**

- ✅ Feature slice complete (e.g., API route + tests working)
- ✅ Database migration ready and tested
- ✅ Component fully functional
- ✅ Bug fix verified

**When NOT to commit:**

- ❌ Tests failing
- ❌ Code doesn't compile
- ❌ Only half of a feature
- ❌ Console has errors
