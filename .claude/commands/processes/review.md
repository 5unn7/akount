---
name: processes:review
description: Perform comprehensive code reviews using multi-agent analysis
argument-hint: "[PR number, GitHub URL, file path, or current branch]"
aliases:
  - review
  - code-review
keywords:
  - review
  - validation
  - quality
---

# Workflow: Review

Multi-agent code review. Catches issues across type safety, architecture, performance, security, and financial integrity.

**Pipeline:** Plan → Work → **Review**
**When to use:** After completing implementation, before merge.

---

## Phase 1: Identify Changes

Determine the review target:

- **PR number/URL** — fetch metadata with `gh pr view`
- **Current branch** — `git diff main...HEAD`
- **Specific files** — review only those files

Get the list of changed files and categorize them (API, frontend, schema, config).

---

## Phase 2: Run Agents

### Core agents (always run)

Pick **3-4** from this list based on the changes. Don't run all of them — pick the most relevant:

- `kieran-typescript-reviewer` — type safety, modern patterns
- `architecture-strategist` — system design, tenant isolation, domain boundaries
- `security-sentinel` — OWASP, auth, input validation, tenant isolation
- `performance-oracle` — N+1 queries, complexity, rendering

### Conditional agents (based on changed files)

- API routes changed → `fastify-api-reviewer`
- Auth code changed → `clerk-auth-reviewer`
- Schema changed → `prisma-migration-reviewer`
- Financial logic → `financial-data-validator`
- App Router files → `nextjs-app-router-reviewer`
- Package/turbo config → `turborepo-monorepo-reviewer`

Run agents **in parallel** using the Task tool. Provide each agent with the diff and changed file contents.

---

## Phase 3: Synthesize Findings

Consolidate all agent reports. Categorize by severity:

**P1 Critical (blocks merge):**

- Security vulnerabilities, tenant isolation breaches
- Financial calculation errors, data corruption risks
- Breaking changes without migration path

**P2 Important (should fix):**

- Performance bottlenecks, type safety issues
- Missing error handling, missing tests for critical paths

**P3 Nice-to-Have (optional):**

- Code simplification, minor optimizations, consistency

---

## Phase 4: Present Results

For each finding, include:

- **Location:** `file:line`
- **Issue:** what's wrong
- **Impact:** what could go wrong
- **Fix:** suggested code change

End with a verdict:

- **P1 findings exist** → BLOCK merge, list required fixes
- **P2 only** → recommend fixes, safe to merge after
- **P3 only** → approve, note optional improvements

Offer to run `npx vitest run` if tests haven't been verified.

---

_~130 lines. Identify → Agents → Synthesize → Present._
