# Workflows & Agents

> **Auto-loaded globally** — quick reference for skills and agents

## Skills (Use `/skill-name`)

| Use Case | Skill |
|----------|-------|
| Start session with context | `/processes:begin` |
| Plan feature implementation | `/processes:plan` |
| Execute implementation plan | `/processes:work` |
| Code review before merge | `/processes:review` |
| End session with documentation | `/processes:eod` |
| Brainstorm feature requirements | `/processes:brainstorm` |
| Document solved problems | `/processes:compound` |
| Generate changelog from commits | `/changelog` |
| Multi-agent feedback | `/braindump` |
| Reset context when off-track | `/processes:reset` |
| Weekly health audit (brutal honest) | `/processes:audit` |

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
