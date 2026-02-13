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

## Reset Triggers

Use `/processes:reset` when:

- AI uses floats for money
- AI forgets `tenantId` in queries
- AI creates files in wrong locations
- AI proposes destructive actions without warning
- Session feels "off track"

**Trigger phrases:**

- "Reset context"
- "You're off track"
- "Check the rules"
- "Reload context"

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
