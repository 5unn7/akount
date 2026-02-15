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

## PRE-FLIGHT CHECKLIST (Run First)

**Before launching review agents, manually check for common violations:**

```bash
# 1. Type safety check
echo "=== : any violations ==="
grep -r ": any[^w]" apps/ | grep -v test | grep -v node_modules

# 2. Logging check
echo "=== console.log in production ==="
grep -r "console\." apps/api/src/domains apps/api/src/services | grep -v test

# 3. Design token check
echo "=== Hardcoded colors ==="
grep -r "text-\[#\|bg-\[#" apps/web/src

# 4. TenantId check
echo "=== Queries without tenantId ==="
grep -r "prisma\.\w\+\.find" apps/api/src/domains apps/api/src/services | grep -v tenantId | grep -v test

# 5. Money type check
echo "=== Float types for money ==="
grep -r "amount.*Float\|balance.*Float" packages/db/prisma/schema.prisma
```

**If ANY violations found, STOP and fix before continuing review.**

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

## Phase 2.5: Pattern Compliance Checks

Run these lightweight checks directly (no agent needed) on the changed files:

### Frontend patterns (if any `apps/web/` files changed)

- [ ] Every new/modified `page.tsx` has sibling `loading.tsx` and `error.tsx`
- [ ] Loading states use the `Skeleton` component from `@/components/ui/skeleton`
- [ ] Error boundaries are client components with `reset` button
- [ ] No hardcoded hex/rgba values — use semantic tokens (see `design-aesthetic.md`)

### API patterns (if any `apps/api/` files changed)

- [ ] No `console.log` in production code (use `request.log` or `server.log`)
- [ ] No `: any` type annotations outside `catch` blocks
- [ ] Modified routes have updated tests (check `__tests__/` sibling directory)

### Verification

```bash
# Quick check: any console.log in changed API files?
git diff --name-only | grep "apps/api" | xargs grep -l "console.log" 2>/dev/null

# Quick check: any :any in changed files?
git diff --name-only | grep "\.ts" | xargs grep -l ": any" 2>/dev/null
```

Flag violations as P2 findings.

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
