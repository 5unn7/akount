# Akount Project - Agent Context

> **Last Updated:** 2026-02-07
> **Source of Truth:** `docs/` folder

## Quick Reference

| Need | Location |
|------|----------|
| UI/UX specs | `docs/design-system/` |
| Implementation rules | `docs/standards/` |
| Architecture decisions | `docs/architecture/` |
| Setup guide | `docs/guides/setup.md` |
| Current status | `STATUS.md` |

---

## Visual Context

Load these at session start for system understanding:

| Document | Purpose | Load When |
|----------|---------|-----------|
| `docs/architecture.mmd` | 5 Mermaid diagrams (system, flow, states) | Every session |
| `docs/domain-glossary.md` | Canonical definitions + invariants | Every session |
| `docs/repo-map.md` | "Change X, look here" navigation | Every session |

### Key Invariants (Memorize These)

1. **Tenant Isolation:** Every query MUST filter by `tenantId`
2. **Money Precision:** All amounts stored as integer cents (1050 = $10.50)
3. **Double-Entry:** `SUM(debits) === SUM(credits)` always
4. **Soft Delete:** Never hard delete, use `deletedAt`
5. **Source Preservation:** Store `sourceDocument` for journal entries

---

## Session Management

| Command | Purpose |
|---------|---------|
| `/processes:begin` | Start session with full context loading |
| `/processes:eod` | End session with cleanup and documentation |
| `/processes:reset` | Reload context if rules violated |

### CLI Scripts (Alternative)

```bash
./scripts/ai/begin.sh [focus-area]   # Quick session start
./scripts/ai/end.sh                   # Quick session end
./scripts/ai/update-context.sh        # Check for doc updates needed
```

---

## Guardrails

### Automatic Enforcement (Hooks)

The following rules are enforced by hooks and will BLOCK violations:

| Rule | Violation | Hook |
|------|-----------|------|
| Integer cents | `amount: 10.50` | `hard-rules.sh` |
| Hard delete on financial | `prisma.invoice.delete()` | `hard-rules.sh` |
| File location | Brainstorm not in `docs/brainstorms/` | `hard-rules.sh` |
| Float in schema | `amount Float` in Prisma | `context-validate.sh` |

### Reset Triggers

Use `/processes:reset` when:
- AI uses floats for money
- AI forgets tenantId in queries
- AI creates files in wrong locations
- AI proposes destructive actions without warning
- Session feels "off track"

### Trigger Phrases

Say any of these to trigger context reset:
- "Reset context"
- "You're off track"
- "Check the rules"
- "Reload context"

---

## Project Overview

**Akount** is an AI-powered financial command center for globally-operating solopreneurs.

**Key Features:**
- Multi-entity management across countries
- Multi-currency support (CAD, USD, EUR, GBP, INR, etc.)
- Double-entry accounting with audit trails
- AI-powered categorization and insights

**Tech Stack:**
- Frontend: Next.js 16 (App Router)
- Backend: Fastify
- Database: PostgreSQL + Prisma
- Auth: Clerk (passkeys/WebAuthn)
- Monorepo: Turborepo

---

## Critical Rules (ZERO EXCEPTIONS)

### 1. Multi-Tenancy
```typescript
// ALWAYS filter by tenantId - NO EXCEPTIONS
const data = await prisma.entity.findMany({
  where: { tenantId: user.tenantId } // REQUIRED
})
```
See: `docs/standards/multi-tenancy.md`

### 2. Money as Integer Cents
```typescript
// CORRECT: Integer cents
amount: 1050 // $10.50

// WRONG: Never float
amount: 10.50
```
See: `docs/standards/financial-data.md`

### 3. RBAC with 6 Roles
- OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR
- See: `docs/design-system/05-governance/permissions-matrix.md`

### 4. 8 Domain Structure
- Overview, Money Movement, Business, Accounting
- Planning, AI Advisor, Services, System
- See: `docs/design-system/05-governance/information-architecture.md`

---

## File Locations

| Type | Location |
|------|----------|
| Feature specs | `docs/design-system/03-screens/` |
| Component specs | `docs/design-system/01-components/` |
| API routes | `apps/api/src/domains/` |
| Web routes | `apps/web/src/app/(dashboard)/` |
| UI components | `packages/ui/src/` |
| Shared types | `packages/types/src/` |
| Design tokens | `packages/design-tokens/src/` |

---

## Available Skills

**Planning:** `/processes:brainstorm`, `/processes:plan`, `/deepen-plan`
**Implementation:** `/processes:work`
**Review:** `/processes:review`, `/quality:design-system-enforce`
**Utility:** `/changelog`, `/processes:compound`

---

## Review Agents

| Agent | Use For |
|-------|---------|
| `financial-data-validator` | Money handling, double-entry |
| `architecture-strategist` | System design, domains |
| `security-sentinel` | OWASP, tenant isolation |
| `prisma-migration-reviewer` | Schema changes |
| `kieran-typescript-reviewer` | TypeScript patterns |
| `nextjs-app-router-reviewer` | Next.js patterns |

See: `.claude/agents/review/README.md`

---

## Decision Protocol

**ALWAYS ASK when:**
- Requirements are ambiguous
- Multiple valid approaches exist
- Security/compliance implications unknown
- Financial calculations involved
- Destructive actions proposed

**Search first:**
```bash
# Before creating anything new
Grep "feature-name" docs/
Glob "**/*similar*.ts*"
```

---

## File Creation Rules

**Allowed at root:** README.md, CLAUDE.md, STATUS.md, ROADMAP.md, TASKS.md, config files

**Where files belong:**
| Type | Location |
|------|----------|
| Feature brainstorms | `docs/brainstorms/` |
| Implementation plans | `docs/plans/` |
| Session reports | `docs/archive/sessions/` |
| Design system | `docs/design-system/` (ONLY) |

---

## Implementation Standards

**Before editing code:**
1. Read relevant docs (CLAUDE.md, feature specs)
2. Summarize understanding before changes
3. Make small, incremental edits

**Testing:**
- Run tests after changes
- Write tests for new behavior

**Troubleshooting:**
- After 2 failed attempts, stop and propose alternative

---

## Getting Help

| Question | Check |
|----------|-------|
| Architecture? | `docs/architecture/` |
| Schema? | `docs/product/data-model/` |
| Standards? | `docs/standards/` |
| Current work? | `TASKS.md`, `STATUS.md` |
| Agents? | `.claude/agents/review/README.md` |
| Skills? | `.claude/SKILLS-INDEX.md` |

---

**Philosophy:** "Architecture for scale, implement for lean"

Build MVP first, activate advanced features later. Every decision documented. Type safety everywhere.
