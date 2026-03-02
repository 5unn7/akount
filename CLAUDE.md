# Akount Project - Agent Context

> **Last Updated:** 2026-02-28
> **Context Architecture:** Hierarchical (root + directory-specific + rules)

---

## Project Overview

**Akount** is an AI-powered financial command center for globally-operating solopreneurs.

**Tech Stack:** Next.js 16 (App Router), Fastify API, PostgreSQL + Prisma, Clerk Auth, Turborepo

---

## Architecture Snapshot (verified: 2026-02-28)

**Request Flow:** Browser → Next.js SSR → Fastify API → Middleware chain (Auth → CSRF → Tenant → Consent → Validation) → Domain services → Prisma → PostgreSQL. Auth via Clerk JWT; tenant loaded from TenantUser membership; all queries filtered by tenantId. Frontend: Server Components (data fetch) + Client Components (interactivity). Backend: Route → Schema (Zod) → Service (business logic) → Prisma. Background jobs: BullMQ workers (bill-scan, invoice-scan) for async document processing.

**8 Domains (User-Facing):** Overview (dashboard), Banking (accounts, transactions), Business (invoices, bills, clients, vendors, payments), Accounting (GL, journal entries, reports), Planning (budgets, forecasts, goals), Insights (AI-powered insights, rules), Services (accountant, bookkeeping, documents), System (entities, settings, users, audit).

**Frontend Navigation:** 8 domains in `apps/web/src/lib/navigation.ts` — `overview`, `banking`, `business`, `accounting`, `planning`, `insights`, `services`, `system`.

**Backend API Routes:** 8 registered prefixes in `apps/api/src/index.ts` — `/api/overview`, `/api/banking`, `/api/business`, `/api/accounting`, `/api/planning`, `/api/ai`, `/api/services`, `/api/system`.

**Backend File Structure:** Split folders for modularity — `domains/overview/`, `domains/banking/`, `domains/business/`, `domains/invoicing/`, `domains/clients/`, `domains/vendors/`, `domains/accounting/`, `domains/planning/`, `domains/ai/`, `domains/services/`, `domains/system/`. Note: `invoicing/`, `clients/`, `vendors/` folders route to `/api/business` prefix.

---

## Core Model Hierarchy (verified: 2026-02-28)

```
Tenant (subscription account)
├── AIConsent (user AI preferences)
└── Entity (business unit)
    ├── GLAccount (chart of accounts)
    ├── JournalEntry (debits = credits)
    ├── Invoice/Bill (AR/AP)
    ├── Payment (allocations)
    ├── Account (bank, credit card)
    ├── Transaction (bank feed or manual)
    ├── Client/Vendor
    ├── Category (for AI categorization)
    ├── Budget/Forecast/Goal (planning)
    └── AIAction/AIDecisionLog (AI ops)
```

**47 Prisma models, 40 enums.** Entity-scoped models require `entity: { tenantId }` filter. See `packages/db/CLAUDE.md` for full model table. See `docs/context-map.md` for comprehensive glossary.

---

## Design System Reference (verified: 2026-02-28)

**Base:** shadcn/ui + shadcn-glass-ui@2.11.2 (glass morphism)
**Styling:** Tailwind v4.1.18 (CSS config, NO tailwind.config.ts)
**Tokens:** `packages/design-tokens/` (colors, typography, spacing)
**Fonts:** Newsreader (headings), Manrope (body), JetBrains Mono (code)

**Glass components available:** ButtonGlass, InputGlass, GlassCard, BadgeGlass, TabsGlass, ModalGlass, SwitchGlass, TooltipGlass, SeparatorGlass. **Button radius:** 8px standard.

**Color rule:** NEVER hardcode hex/rgba. Use semantic tokens (`text-ak-green`, `bg-ak-pri-dim`, `glass`, `border-ak-border`). Full mapping in `.claude/rules/design-aesthetic.md`.

See `apps/web/CLAUDE.md` for full design system context (loaded when working in apps/web/).

---

## 9 Key Invariants (Zero Exceptions)

1. **Tenant Isolation:** Every query MUST filter by `tenantId` (entity-scoped: `entity: { tenantId }`).
2. **Money Precision:** All amounts are **integer cents** (1050 = $10.50). Never use floats.
3. **Double-Entry:** `SUM(debitAmount) === SUM(creditAmount)` always. Validate before creating JournalEntry.
4. **Soft Delete:** Financial records use `deletedAt: DateTime?`. Filter: `WHERE deletedAt IS NULL`. Never hard delete.
5. **Source Preservation:** Journal entries store `sourceType`, `sourceId`, `sourceDocument` (JSON snapshot).
6. **Page Loading States:** Every `page.tsx` under `(dashboard)/` MUST have sibling `loading.tsx` and `error.tsx`.
7. **Server/Client Separation:** Files MUST NOT mix server-only imports (`prisma`, `fs`, `node:*`) with client-only code (`'use client'`).
8. **Atomic Task IDs:** When creating tasks, ALWAYS reserve IDs atomically via `node .claude/scripts/reserve-task-ids.js <PREFIX> [count]` BEFORE assigning to tasks. Never manually increment IDs from TASKS.md (race-prone). See `.claude/rules/task-population.md` for full workflow.
9. **Task Requirement:** If user request requires code editing, there MUST be a corresponding task in TASKS.md. Check task availability before starting any implementation work (see `.claude/rules/guardrails.md` Step 0).

---

## Financial Standards (Layer 3 — Read On Demand)

Detailed financial standards with code examples and pitfalls (read when working on financial logic):

- `docs/standards/financial-data.md` — Integer cents, double-entry, soft delete, source preservation
- `docs/standards/multi-tenancy.md` — Tenant isolation patterns, middleware, testing

Distilled rules are already in `.claude/rules/financial-rules.md` (loaded when working in API/DB paths).

---

## File Locations

| Type | Location |
|------|----------|
| API routes | `apps/api/src/domains/<domain>/routes/` |
| API services | `apps/api/src/domains/<domain>/services/` |
| Web pages | `apps/web/src/app/(dashboard)/<domain>/` |
| UI components | `packages/ui/src/components/` |
| Shared types | `packages/types/src/` |
| Design tokens | `packages/design-tokens/src/` |
| Prisma schema | `packages/db/prisma/schema.prisma` |
| Feature specs | `docs/design-system/03-screens/` |
| Component specs | `docs/design-system/01-components/` |
| Implementation plans | `docs/plans/` |
| Brainstorms | `docs/brainstorms/` |
| Session captures | `docs/archive/sessions/` |
| Code reviews | `docs/reviews/<feature-name>/` (SUMMARY.md + agents/) |
| MEMORY topic files | Auto memory dir (`debugging-log.md`, `codebase-quirks.md`, `api-patterns.md`) |

---

## Context Hierarchy

**Layer 1 (Always loaded):**

- This file (CLAUDE.md) — core invariants, tech stack, structure
- `MEMORY.md` — work state, learned patterns, gotchas
- `.claude/rules/*.md` — modular rules (path-scoped)
- `.claude/rules/product-thinking.md` — investigation protocol, domain awareness, review lens
- `.claude/rules/plan-enforcement.md` — task validation, status updates, unplanned work detection
- `.claude/rules/task-population.md` — atomic ID reservation (mandatory), approval gate, source tracking

**Layer 2 (Loaded when working in directory):**

- `apps/api/CLAUDE.md` — API patterns, middleware, built endpoints
- `apps/web/CLAUDE.md` — Next.js patterns, design system, components
- `packages/db/CLAUDE.md` — Prisma models table, enums, schema conventions

**Layer 3 (Explicit read for deep-dive):**

- `docs/context-map.md` — Full model glossary, enum reference, journal patterns, how-tos
- `docs/standards/financial-data.md` — Detailed financial patterns with code examples
- `docs/standards/multi-tenancy.md` — Detailed tenant isolation patterns with code examples

---

## File Creation Rules

**Allowed at root:** README.md, CLAUDE.md, STATUS.md, ROADMAP.md, TASKS.md, config files

**Strict locations:**

- Brainstorms: `docs/brainstorms/`
- Implementation plans: `docs/plans/`
- Session reports: `docs/archive/sessions/`
- Code reviews: `docs/reviews/<feature-name>/`
- Design system: `docs/design-system/` ONLY

**Note:** `.reviews/` is a temporary workspace for review agents (gitignored). Final reviews go to `docs/reviews/`.

**Hooks enforce these rules.** Violations will block commits.

---

## Workflows & Review

**Skills & Agents:** See `.claude/rules/workflows.md` for comprehensive trigger table.

**Common commands:**

- `/processes:begin` — Start session (loads git status, tasks, recommendations)
- `/processes:plan` — Create implementation plan
- `/processes:work` — Execute plan systematically
- `/processes:diagnose` — Investigate bugs (trace > root cause > fix)
- `/processes:review` — Multi-agent code review
- `/processes:end-session` — Lightweight session capture (per instance)
- `/processes:eod` — End of day (regenerates STATUS.md from TASKS.md + metrics)

**Review agents:** `financial-data-validator`, `architecture-strategist`, `security-sentinel`, `prisma-migration-reviewer`, `kieran-typescript-reviewer`, `nextjs-app-router-reviewer`. See `.claude/rules/workflows.md` for full list.

---

## Decision Protocol

**ALWAYS ASK when:**

- Requirements are ambiguous or multiple valid approaches exist
- Security/compliance implications are unknown
- Financial calculations or audit trails are involved
- Destructive actions are proposed (delete, hard reset, force push)

**Search first** before creating:

```bash
Grep "feature-name" docs/
Glob "**/*similar*.ts*"
```

---

## Quick Reference

| Need | Check |
|------|-------|
| All tasks (all domains) | `TASKS.md` — single source of truth, multi-domain board |
| Auto-generated metrics | `STATUS.md` — regenerated by `/processes:eod` |
| Roadmap | `ROADMAP.md` |
| Task population rules | `.claude/rules/task-population.md` — approval gate, **atomic ID reservation (mandatory)** |
| Task ID reservation | `node .claude/scripts/reserve-task-ids.js <PREFIX> [count]` — atomic counter, prevents ID collisions |
| Task auto-archive | `node .claude/scripts/archive-done-tasks.js` — moves done tasks to TASKS-ARCHIVE.md (also runs via hook + end-session) |
| API patterns | `apps/api/CLAUDE.md` |
| Frontend patterns | `apps/web/CLAUDE.md` |
| Database schema | `packages/db/CLAUDE.md` |
| Deep reference | `docs/context-map.md` |
| Financial rules | `.claude/rules/financial-rules.md` |
| API conventions | `.claude/rules/api-conventions.md` |
| Frontend conventions | `.claude/rules/frontend-conventions.md` |
| Investigation protocol | `.claude/rules/product-thinking.md` |
| Debugging learnings | MEMORY.md > `debugging-log.md` topic file |
| Code indexes (domain discovery) | `CODEBASE-*.md` (project root) — **read BEFORE any Grep/Read exploration** |
| Code index field legend | `.claude/code-index-legend.md` — pattern codes, field abbreviations |

**Multi-agent coordination:** "Active Now" table at top of TASKS.md tracks which agent is working on what. Updated by `/processes:begin` (claim) and `/processes:end-session` (release).

---

## Compaction Preservation

When compacting context in long sessions, ALWAYS preserve: tenantId requirement, integer cents rule, modified files list, current task context, and test commands used this session.

---

**Philosophy:** "Architecture for scale, implement for lean"

Build MVP first, activate advanced features later. Every decision documented. Type safety everywhere.
