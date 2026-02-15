# Guardrails

> **Auto-loaded globally** — enforces critical rules via hooks

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
- ⚠️ Creating `page.tsx` without sibling `loading.tsx` / `error.tsx`

**Hook:** `.claude/hooks/context-validate.sh`

## Pre-Flight Checklist (MANDATORY)

**Before writing ANY code, Claude MUST:**

1. ✅ **Read existing files first** — never edit blindly
2. ✅ **Search for patterns** — `Grep "similar-feature" apps/`
3. ✅ **Verify schema** — check Prisma models match intent
4. ✅ **Check tokens** — design tokens exist before using
5. ✅ **Scan for anti-patterns** — see "Explicit Anti-Patterns" below
6. ✅ **Verify labels/paths** — search before creating new
7. ✅ **Validate test vs production** — mocks stay in `__tests__/`

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

## Reset Triggers

Use `/processes:reset` when:

- AI uses floats for money
- AI proposes `: any` types
- AI forgets `tenantId` in queries
- AI hardcodes colors/values
- AI creates files in wrong locations
- AI uses `console.log` in production code
- AI mixes mock data into implementation
- AI creates pages without loading/error states
- AI doesn't check existing patterns first
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
