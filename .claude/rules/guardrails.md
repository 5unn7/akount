# Guardrails

> **Auto-loaded globally** — enforces critical rules via hooks

## 9 Key Invariants (Zero Exceptions)

These invariants are enforced across the entire codebase. Violations will fail commits or trigger reset.

1. **Tenant Isolation** — Every query MUST filter by `tenantId` (entity-scoped: `entity: { tenantId }`)
2. **Integer Cents** — All amounts are integer cents (1050 = $10.50). Never use floats.
3. **Double-Entry** — `SUM(debitAmount) === SUM(creditAmount)` always. Validate before creating JournalEntry.
4. **Soft Delete** — Financial records use `deletedAt: DateTime?`. Filter: `WHERE deletedAt IS NULL`. Never hard delete.
5. **Source Preservation** — Journal entries store `sourceType`, `sourceId`, `sourceDocument` (JSON snapshot).
6. **Page Loading States** — Every `page.tsx` under `(dashboard)/` MUST have sibling `loading.tsx` and `error.tsx`
7. **Server/Client Separation** — Files MUST NOT mix server-only imports (`prisma`, `fs`, `node:*`) with client-only code (`'use client'`)
8. **Atomic Task IDs** — When creating tasks, ALWAYS reserve IDs atomically via `node .claude/scripts/reserve-task-ids.js <PREFIX> [count]` BEFORE assigning to tasks. Never manually increment IDs from TASKS.md (race-prone).
9. **Task Requirement** — If user request requires code editing, there MUST be a corresponding task in TASKS.md. Check task availability before starting any implementation work (see Step 0 below).

**Why these are zero-tolerance:**
- Invariants 1-5: Financial data integrity, audit compliance, multi-tenancy security
- Invariant 6: Without loading.tsx, users see blank screens during data fetches. Without error.tsx, errors crash the entire layout.
- Invariant 7: Mixing server/client code causes runtime crashes and bundler instability. 5 P0 crashes traced to this in Phase 5 review.
- Invariant 8: Manual ID assignment causes race conditions and ID collisions between concurrent agents/sessions.
- Invariant 9: Untracked work creates technical debt, makes progress invisible, and prevents proper planning/estimation.

---

## Hook Enforcement

The following rules are **BLOCKED** by hooks and will fail commits:

### Financial Data Rules

- ❌ Using floats for money (`amount: Float` in Prisma)
- ❌ Hard delete on financial models (Invoice, Bill, Payment, JournalEntry, Account, Transaction)
- ❌ Missing `tenantId` filter in queries
- ❌ JE from document without `sourceType`/`sourceId`/`sourceDocument` (Invariant #5)

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

0. ✅ **Check task availability** (AUTOMATIC - runs first):

   **When to check:**
   - User message indicates implementation work (keywords: fix, add, create, implement, build, update, refactor)
   - User did NOT invoke explicit command (`/processes:*`, `/quality:*`, etc.)
   - Work is non-trivial (not just answering questions or explaining code)

   **How to check:**
   ```bash
   # Fast path: extract task index from TASKS.md HTML comment
   INDEX=$(grep -Pzo '(?s)<!-- TASK-INDEX:START.*?TASK-INDEX:END -->' TASKS.md)

   # Parse JSON index
   TASKS_JSON=$(echo "$INDEX" | sed 's/.*TASK-INDEX:START//' | sed 's/TASK-INDEX:END.*//')

   # Semantic search for matching task
   # - Extract keywords from user message
   # - Search task titles/descriptions in index
   # - Check domain relevance (banking, invoicing, etc.)
   ```

   **If task FOUND:**
   ```
   ✅ Found existing task: SEC-9 (CSRF protection review)

   Proceeding with SEC-9 implementation...
   [continue to Step 1-14]
   ```

   **If task NOT FOUND:**
   ```
   📋 UNTRACKED WORK DETECTED

   You're about to: [describe the work from user's request]

   Would you like to:
   1. ✅ Add to TASKS.md (auto-filled)
   2. 📋 Use /processes:plan (for complex features)
   3. ⚡ Skip tracking

   [User answers: 1, 2, or 3]

   [If user chooses 1:]
   ✅ Added [TASK-ID] to TASKS.md:
   | [TASK-ID] | [auto-extracted title] | [auto-inferred effort] | [auto-inferred priority] | 🟢 ready | | ad-hoc:session-xyz |

   Auto-filled details:
   - Domain: [auto-detected]
   - Priority: [auto-inferred from work type]
   - Effort: [auto-inferred from complexity]

   [Proceed with implementation]
   ```

   **Auto-fill logic (NO user questions):**
   - **Domain:** Keyword matching + git history fallback
   - **Priority:** Critical (crashes) → High (bugs) → Medium (features) → Low (refactors)
   - **Effort:** <1h (simple bugs) → 1-2h (default) → 2-4h (multi-step) → >4h (complex)
   - **Task ID:** Auto-generated from domain prefix + next number

   **When to SKIP this check:**
   - Exploratory questions ("explain", "show me", "analyze", "research")
   - Explicit command calls (user already specified workflow)
   - Pure documentation work
   - Answering questions without code changes

1. ✅ **Classify the change** — Bug fix, feature, refactor, or config? (see `product-thinking.md`)
2. ✅ **Load the code index (MANDATORY)** — Read the relevant `CODEBASE-*.md` file BEFORE any Grep/Read exploration:
   - Identify domain(s) from the task context, then `Read CODEBASE-<DOMAIN>.md` from project root
   - Extract: exports (`e`), imports (`i`), patterns (`pt`), violations (`v`), test coverage (`t`), callers (`c`)
   - Use this to know WHAT exists, WHERE it lives, and WHO calls it — before touching any source files
   - **Domain → Index file mapping:**

     | Domain | Index File |
     |--------|-----------|
     | Banking (accounts, transactions, transfers) | `CODEBASE-BANKING.md` |
     | Invoicing (invoices, credit notes, bills) | `CODEBASE-INVOICING.md` |
     | Accounting (GL, journal entries, reports) | `CODEBASE-ACCOUNTING.md` |
     | Planning (budgets, forecasts, goals) | `CODEBASE-PLANNING.md` |
     | AI (categorization, insights, rules) | `CODEBASE-AI.md` |
     | Web pages (dashboard route pages) | `CODEBASE-WEB-PAGES.md` |
     | Web business components | `CODEBASE-WEB-BUSINESS.md` |
     | Web shared (components, lib, hooks) | `CODEBASE-WEB-SHARED.md` |
     | Web forms | `CODEBASE-WEB-FORMS.md` |
     | Packages (ui, db, types, tokens) | `CODEBASE-PACKAGES.md` |

   - **Field legend:** See `.claude/code-index-legend.md` for pattern codes (T=tenant, S=soft-delete, L=pino, P=prisma, C=client-component)
   - **Multiple domains:** If task spans domains (e.g., invoice payment touches invoicing + banking + accounting), read up to 3 index files
   - **Fallback:** ONLY use Grep/Read discovery if the index file doesn't exist or is >1 hour stale
3. ✅ **Read existing files first** — ALWAYS Read before Edit (never edit blindly)
   - **For multi-file refactoring:** Read ONE file completely, verify pattern, THEN replicate
   - **Copy exact strings:** Use actual file content for Edit old_string (not grep snippets)
4. ✅ **Verify imports before claiming** — Check the code index `e` (exports) array first
   - Before claiming "I'll import X from Y", verify the export exists in the index
   - Index lookup (fast): Check `f["filename"].e` array in the loaded domain index
   - Grep fallback (if index miss): `Grep "export.*FunctionName" path/to/file`
   - Block edit if import doesn't exist (hallucination prevention)
5. ✅ **Search for patterns** — Check code index `p` (patterns) section, then Grep if needed
6. ✅ **Search for existing utilities** — BEFORE creating helper functions:
   - Currency/money: `Grep "formatCurrency|cents.*100" apps/web/src/lib/utils/`
   - Dates: `Grep "formatDate|toLocaleString.*Date" apps/web/src/lib/utils/`
   - Status badges: `Grep "StatusBadge|STATUS_CONFIG" packages/ui/`
   - Empty states: `Grep "EmptyState|No.*found" packages/ui/`
7. ✅ **Search MEMORY for prior learnings** — `Grep "[concept]" memory/`
8. ✅ **Trace the impact** — use index `c` (callers) to see what imports/calls this code
9. ✅ **Apply review lens** — will this pass security, financial integrity, type safety?
10. ✅ **Verify schema** — check Prisma models match intent
11. ✅ **Check tokens** — design tokens exist before using
12. ✅ **Scan for anti-patterns** — see "Explicit Anti-Patterns" below
13. ✅ **Verify labels/paths** — search before creating new
14. ✅ **Validate test vs production** — mocks stay in `__tests__/`
15. ✅ **For UI changes: minimal first** — change ONE visual thing, verify, then expand (see `frontend-conventions.md`)
16. ✅ **Check loading/error states** — every new page.tsx needs loading.tsx + error.tsx (Invariant #6)
17. ✅ **Check server/client separation** — no mixing `'use client'` with server-only imports (Invariant #7)

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
- ❌ **NEVER use arbitrary font sizes** — `text-[10px]` → `text-micro`, `text-[11px]` → `text-xs`

### Client Data & State Management
- ❌ **NEVER mix `useState(initialData)` with `router.refresh()`** — `router.refresh()` re-runs the Server Component but `useState` ignores new initial values after mount, making refresh a no-op. Choose Strategy 1 (optimistic state, no refresh) or Strategy 2 (no useState, refresh from props). See `frontend-conventions.md`.
- ❌ **NEVER reuse a Sheet/Form for create/edit without a `key` prop** — internal `useState` initializers only run on mount. Without `key={record?.id ?? 'create'}`, form fields show stale data when switching between records.

### Component Reuse (CRITICAL — No Inline Quick Fixes)
- ❌ **NEVER inline-reimplement an existing component** — always search first
  - Search: `Grep "ComponentName" packages/ui/src/ apps/web/src/components/`
  - Check: `packages/ui/src/index.ts` for full export list
- ❌ **NEVER create ad-hoc inline UI patterns** when a shared component exists
  - WRONG: Inline status badge logic (`const STATUS_MAP = { DRAFT: ... }`) in each page
  - RIGHT: `import { InvoiceStatusBadge } from '@akount/ui'`
  - WRONG: Inline empty state markup repeated across pages
  - RIGHT: `import { EmptyState } from '@akount/ui'`
- ✅ **DO create new shared components** when the pattern appears in 2+ screens
  - New components go in `packages/ui/src/` (shared) or `apps/web/src/components/` (app-specific)
  - Extract when: same markup/logic appears in multiple pages (DRY principle)
  - Don't extract when: it's a one-off layout specific to a single page
- ✅ **Reuse hierarchy** (check in order):
  1. `packages/ui/src/` — shared UI primitives and business components
  2. `packages/ui/src/business/` — domain-specific shared (StatusBadge, etc.)
  3. `packages/ui/src/patterns/` — reusable patterns (EmptyState, etc.)
  4. `apps/web/src/components/` — app-level shared components
  5. Create new ONLY if nothing matches above

### Shared Utilities (CRITICAL - Prevents Duplication)
- ❌ **NEVER create inline utility functions** — search for existing first
  - WRONG: `function formatCurrency(cents) { return ... }` inline in component
  - RIGHT: `import { formatCurrency } from '@/lib/utils/currency'`
- ❌ **NEVER duplicate formatting logic** — causes locale drift and inconsistency
  - Check: `Grep "formatCurrency|formatDate" apps/web/src/lib/utils/` BEFORE creating
- ❌ **NEVER use `cents / 100` inline** — use formatCurrency utility
  - WRONG: `const dollars = cents / 100; return ${dollars.toFixed(2)}`
  - RIGHT: `return formatCurrency(cents, currency)`
- ❌ **NEVER hardcode locale in toLocaleString** — use utility defaults
  - WRONG: `.toLocaleString('en-US', ...)` (causes locale drift)
  - RIGHT: `formatCurrency(cents)` (handles locale correctly)
- ❌ **NEVER duplicate status badge logic** — use shared components
  - WRONG: `const STATUS_CONFIG = { DRAFT: { ... }, PAID: { ... } }` inline
  - RIGHT: `<InvoiceStatusBadge status={invoice.status} />` from packages/ui
- ✅ **Canonical utility locations:**
  - Currency: `apps/web/src/lib/utils/currency.ts`
  - Dates: `apps/web/src/lib/utils/date.ts`
  - Status badges: `packages/ui/src/business/` (StatusBadge components)
  - Empty states: `packages/ui/src/patterns/` (EmptyState component)
  - Validation: `apps/api/src/lib/validators/`

### Logging
- ❌ **NEVER use `console.log`** in production code (API/services)
  - Use `request.log.info()` or `server.log.info()`
  - Exception: `apps/api/src/lib/env.ts` (pre-boot validation)
- ❌ **NEVER log sensitive data** — no tokens, passwords, PII

### Database & Query Safety
- ❌ **NEVER use floats for money** — integer cents only
- ❌ **NEVER hard delete financial records** — use soft delete
- ❌ **NEVER skip tenantId filter** — every query needs it
- ❌ **NEVER use wrong DB** — production uses `@akount/db` Prisma client
- ❌ **NEVER overwrite `where.OR` with search filters** — use `AND` to combine tenant scoping with search (see `financial-rules.md`)
- ❌ **NEVER allow tenants to mutate global records** — `entityId: null` records are read-only; mutations must use `entityId: { not: null }`
- ❌ **NEVER accept FK references without ownership check** — validate glAccountId, categoryId etc. belong to tenant (IDOR prevention)
- ❌ **NEVER add P2002 error handler without @@unique constraint** — verify Prisma schema first, dead handlers = false confidence
- ❌ **NEVER chain `.optional()` on validation middleware** — `validateBody()` returns a function, not a Zod schema
- ❌ **NEVER create JEs without validating double-entry balance** — `SUM(debitAmount) === SUM(creditAmount)` MUST be asserted before `prisma.journalEntry.create()`. Unbalanced entries corrupt the GL and violate Invariant #3.
- ❌ **NEVER create JEs from documents without source preservation** — every JE from an Invoice, Bill, Payment, or Transfer MUST set `sourceType`, `sourceId`, and `sourceDocument` (JSON snapshot). Without this, GL rebuilds and audit trails are impossible.
- ❌ **NEVER inline JE entry number generation** — use `generateEntryNumber()` from `domains/accounting/utils/entry-number.ts`. Inline `parseInt(str.replace('JE-', ''))` produces NaN on unexpected formats.
- ❌ **NEVER duplicate private methods across services** — if 3+ services need the same function, extract to `domains/<domain>/utils/`

### Prisma Migrations (CRITICAL — See prisma-workflow.md)
- ❌ **NEVER run `prisma migrate dev` non-interactively** — it requires human to name migration, agents cannot respond to prompts
- ❌ **NEVER use `db push` for permanent changes** — creates invisible drift, no migration files, breaks shadow DB
- ❌ **NEVER manually write migration SQL** — breaks checksums, causes "migration modified" errors
- ❌ **NEVER run `migrate deploy` in development** — this is for production CI/CD only, skips validation
- ❌ **NEVER make schema changes without asking user to run migration** — agents CANNOT handle interactive prompts
- ✅ **DO ask user to run migration after schema edits** — provide exact command with suggested name
- ✅ **DO verify migration applied** — check migration folder exists before continuing
- ✅ **DO suggest descriptive migration names** — `add_ai_consent_model`, not `update_schema`

**See `.claude/rules/prisma-workflow.md` for full agent-friendly workflow and error recovery.**

### Code Quality
- ❌ **NEVER use mock data in implementation** — mocks are for tests
- ❌ **NEVER create files without checking existing** — search first
- ❌ **NEVER ignore SRP** — one file = one responsibility
- ❌ **NEVER batch status updates** — update immediately when task completes
- ❌ **NEVER leave dead exports** — every exported function/type MUST be imported somewhere
  - After removing usage, remove the export. After adding exports, verify callers exist.
  - Check: `Grep "functionName" apps/ packages/` — if zero imports, remove the export
- ❌ **NEVER type async callbacks as `() => void`** — use `() => void | Promise<void>`
  - WRONG: `onSave: (data: Input) => void` (drops the Promise, hides errors)
  - RIGHT: `onSave: (data: Input) => void | Promise<void>` (allows await in caller)

### Refactoring Best Practices (Multi-File Changes)
- ❌ **NEVER use bash sed/awk for file editing on Windows** — shell escaping issues, use Edit tool
- ❌ **NEVER batch-edit files without verifying ONE first** — prove pattern works before scaling
- ❌ **NEVER assume file structure from grep** — Read the full file, copy exact strings
- ✅ **DO delegate bulk refactoring to Task agent** — after pattern proven in 1-2 files
- ✅ **DO verify TypeScript compilation after each file** — catch errors early
- ✅ **Pattern for multi-file refactoring:**
  1. Read & fix ONE file completely
  2. Verify it compiles (`npx tsc --noEmit`)
  3. Document the exact pattern
  4. Use Edit tool (not bash) for remaining files OR delegate to Task agent

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

### Task Tracking
- ❌ **NEVER start implementation without checking TASKS.md** — always run Step 0
- ❌ **NEVER assume task exists** — verify with index lookup
- ❌ **NEVER skip task creation prompt** — let user decide tracking

## Reset Triggers

Use `/processes:reset` when:

- AI violates any of the 9 Key Invariants
- AI uses floats for money (Invariant #2)
- AI proposes `: any` types
- AI forgets `tenantId` in queries (Invariant #1)
- AI hardcodes colors/values
- AI creates files in wrong locations
- AI uses `console.log` in production code
- AI mixes mock data into implementation
- AI creates pages without loading/error states (Invariant #6)
- AI mixes server-only imports with `'use client'` (Invariant #7)
- AI skips task availability check before implementation
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
