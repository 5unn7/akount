# Workflows & Agents

> **Auto-loaded globally** — quick reference for skills and agents

## Skills (Use `/skill-name`)

| Use Case | Skill |
|----------|-------|
| Start session with context | `/processes:begin` |
| Plan feature implementation | `/processes:plan` |
| Execute implementation plan | `/processes:work` |
| Investigate bugs & unexpected behavior | `/processes:diagnose` |
| **Intelligent review (auto-detects plan/code/last-day)** | `/processes:review` |
| Review implementation plan | `/processes:review {plan-file}` |
| Review last 24 hours of code | "Review last day's work" |
| Review current branch changes | `/processes:review` or "Review my changes" |
| Lightweight session capture (per instance) | `/processes:end-session` |
| End of day (aggregate sessions, update artifacts) | `/processes:eod` |
| Brainstorm feature requirements | `/processes:brainstorm` |
| Generate changelog from commits | `/changelog` |
| Multi-agent feedback | `/braindump` |
| Reset context when off-track | `/processes:reset` |
| Weekly health audit (brutal honest) | `/processes:audit` |

## Agent Execution (Use `/pm:*`)

| Use Case | Skill |
|----------|-------|
| Execute task with domain agent (single) | `/pm:execute <task-id>` |
| Execute multiple tasks in parallel | `/pm:execute-parallel <id1> <id2> [id3...]` |

**Available execution agents:**

*Domain Agents:*
- `banking-agent` — Banking domain (accounts, transactions, transfers)
- `ui-agent` — Frontend/UI (design system, components, pages)
- `security-agent` — Security enforcement (tenant isolation, auth, OWASP)
- `compliance-agent` — Financial compliance (audit trails, double-entry)

*Technical Layer Agents:*
- `api-agent` — Fastify backend (routes, services, schemas, middleware)
- `web-agent` — Next.js 16 frontend (pages, server/client components, layouts)
- `db-agent` — Prisma/PostgreSQL (schema, migrations, indexes, seed data)
- `test-agent` — Vitest testing (route tests, service tests, financial assertions)

**Flow:** Task Lookup → Agent Selection → Worktree → Execute → Security Gate → Compliance Gate → Merge → Tests → Report

## Review Agents (Use Task tool)

| Use Case | Agent |
|----------|-------|
| Financial calculations, double-entry | `financial-data-validator` |
| System design, architecture | `architecture-strategist` |
| Security audit, tenant isolation | `security-sentinel` |
| Prisma schema changes | `prisma-migration-reviewer` |
| TypeScript strict patterns | `kieran-typescript-reviewer` |
| Next.js App Router patterns | `nextjs-app-router-reviewer` |
| Fastify API patterns | `fastify-api-reviewer` |
| Clerk authentication | `clerk-auth-reviewer` |
| Design system compliance | `design-system-enforcer` |
| RBAC validation | `rbac-validator` |
| Performance optimization | `performance-oracle` |
| Code simplicity (YAGNI) | `code-simplicity-reviewer` |
| Monorepo structure | `turborepo-monorepo-reviewer` |

## Quality Checks (Use `/quality:*`)

| Check | Command |
|-------|---------|
| WCAG 2.1 AA accessibility | `/quality:a11y-review` |
| Akount brand voice | `/quality:brand-voice-check` |
| Design system enforcement | `/quality:design-system-enforce` |
| Test coverage gaps | `/quality:test-coverage-analyze` |

## Review Agent Guidelines

### Import Verification (ALL Agents)

Review agents MUST verify that imported components and functions actually exist in the package they're imported from. Common issues:
- `BadgeGlass` doesn't exist in `@akount/ui` — only `Badge` is exported
- Glass variants (`ButtonGlass`, `InputGlass`) are separate from base shadcn components
- Check `packages/ui/src/index.ts` for the actual export list before using any `@akount/ui` import

**When reviewing imports:**
1. Verify the symbol exists: `Grep "export.*ComponentName" packages/ui/src/`
2. Check the barrel file: `Read packages/ui/src/index.ts`
3. Flag any import that references a non-existent export

### Component Reuse Enforcement (ALL Agents)

Review agents MUST flag inline reimplementations of existing components. Before accepting any new component or inline pattern, verify no existing component serves the same purpose.

**Check locations:**
- `packages/ui/src/` — shared UI components
- `packages/ui/src/business/` — domain-specific shared components (StatusBadge, etc.)
- `packages/ui/src/patterns/` — reusable patterns (EmptyState, etc.)
- `apps/web/src/components/` — app-level shared components

## Model Selection (Cost Optimization)

**Use /fast (Haiku) for:**

- File searches (Glob, Grep, Read)
- Simple single-file edits
- Running tests and checking output
- Git operations (status, log, diff)
- Answering factual questions

**Stay on Opus for:**

- Multi-file feature implementation
- Architecture decisions and planning
- Complex debugging
- Financial logic (double-entry, multi-currency)
- Code review with multiple agents
- Writing new services/routes/pages

**Est. savings:** ~30% API cost reduction (if 40% of messages use Haiku)
