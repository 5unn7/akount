# Agent Directory

**Organized:** 2026-02-28
**Total agents:** 34

---

## Domain Agents (8) — For `/pm:execute`

Task execution agents with domain expertise and worktree isolation:

- **`domain/banking-agent.md`** — Banking domain (accounts, transactions, transfers, reconciliation)
- **`domain/api-agent.md`** — Fastify backend (routes, services, schemas, middleware)
- **`domain/web-agent.md`** — Next.js 16 frontend (App Router, pages, layouts, Server/Client components)
- **`domain/db-agent.md`** — Prisma/PostgreSQL (schema, migrations, indexes, seed data)
- **`domain/ui-agent.md`** — Frontend/UI (design system, components, shadcn/glass-ui)
- **`domain/security-agent.md`** — Security enforcement (tenant isolation, auth, OWASP, input validation)
- **`domain/compliance-agent.md`** — Financial compliance (audit trails, double-entry, GDPR, SOC2)
- **`domain/test-agent.md`** — Vitest testing (route tests, service tests, financial assertions)

**Usage:** `/pm:execute <task-id>` or `/pm:execute-parallel <id1> <id2> <id3>`

---

## Review Agents (20) — For Code Reviews

Specialized reviewers invoked via Task tool during `/processes:review`:

### Financial & Compliance
- **`review/financial-data-validator.md`** — Double-entry, multi-currency, fiscal periods, journal entry integrity
- **`review/compliance-reviewer.md`** — GDPR, PIPEDA, CCPA, SOC2, audit trail validation
- **`review/data-export-reviewer.md`** — CSV/Excel/PDF export validation, formula injection prevention

### Architecture & Code Quality
- **`review/architecture-strategist.md`** — System design, component boundaries, architectural compliance
- **`review/code-simplicity-reviewer.md`** — YAGNI enforcement, simplification opportunities
- **`review/kieran-typescript-reviewer.md`** — Strict TypeScript patterns, type safety, modern TS conventions

### Framework-Specific
- **`review/nextjs-app-router-reviewer.md`** — Next.js 16 App Router, Server/Client boundaries, async patterns
- **`review/fastify-api-reviewer.md`** — Fastify routes, Zod schemas, middleware patterns
- **`review/prisma-migration-reviewer.md`** — Schema safety, migration validation, financial table protection
- **`review/turborepo-monorepo-reviewer.md`** — Workspace integrity, dependency management

### Security & Infrastructure
- **`review/security-sentinel.md`** — Authentication, authorization, input validation, OWASP Top 10
- **`review/clerk-auth-reviewer.md`** — Clerk JWT verification, session handling, protected routes
- **`review/ai-integration-reviewer.md`** — AI security, PII protection, prompt injection, cost controls
- **`review/infrastructure-deployment-reviewer.md`** — Docker, S3, deployment configs, production readiness

### Specialized Domains
- **`review/bullmq-job-reviewer.md`** — BullMQ workers, job idempotency, retry safety, queue configs
- **`review/data-migration-expert.md`** — Database migrations, data transformations, rollback safety
- **`review/deployment-verification-agent.md`** — Go/No-Go checklists for risky deployments
- **`review/design-system-enforcer.md`** — Akount Design System compliance, color tokens, component patterns
- **`review/rbac-validator.md`** — Role-based access control, permission matrix validation
- **`review/performance-oracle.md`** — Performance analysis, N+1 queries, caching strategies

---

## Research Agents (4) — For Exploration

External research and documentation analysis:

- **`research/best-practices-researcher.md`** — External best practices, industry standards, documentation
- **`research/framework-docs-researcher.md`** — Framework/library docs, version compatibility, deprecations
- **`research/git-history-analyzer.md`** — Git history analysis, code evolution, origin tracing
- **`research/repo-research-analyst.md`** — Repository structure, conventions, pattern discovery

---

## Automation Agents (2) — For CI/CD Integration

Workflow automation:

- **`automation/bug-reproduction-validator.md`** — Validate bug reports, test reproduction steps
- **`automation/pr-comment-resolver.md`** — Address code review feedback, implement requested changes

---

## Meta Files

- **`_orchestrator-guide.md`** — Agent coordination patterns, execution flow
- **`_template.md`** — Template for creating new agents

---

## Quick Reference

| Task | Command |
|------|---------|
| Execute task with domain agent | `/pm:execute DEV-121` |
| Parallel execution | `/pm:execute-parallel SEC-9 UX-10 PERF-3` |
| Review code changes | `/processes:review` (auto-selects agents) |
| Review specific aspect | Use Task tool with agent (e.g., `security-sentinel`) |

---

**Structure standardized:** 2026-02-28 (Phase 2.3 complete)
