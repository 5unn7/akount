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

Multi-agent code review with **persistent output**. Findings survive rate limits, context exhaustion, and interruptions.

**Pipeline:** Plan > Work > **Review**
**Output:** `.reviews/` directory (gitignored)
**When to use:** After completing implementation, before merge.

---

## Phase 0: Resume Check

Before starting a fresh review, check for prior results:

```bash
ls .reviews/*.md 2>/dev/null
```

If `.reviews/` exists with agent findings:
- List which agents already have output files
- Ask user: "Resume from previous review? Found findings from: [agent list]"
- If resuming: skip to Phase 2, only run agents that DON'T have `.reviews/<agent>.md` files
- If starting fresh: delete `.reviews/` and proceed normally

---

## Phase 1: Setup

### Create output directory

```bash
mkdir -p .reviews
```

### Auto pre-flight (no manual commands needed)

Run these checks automatically and save results:

```bash
# Changed files
git diff --name-only main...HEAD > .reviews/changed-files.txt 2>/dev/null || git diff --name-only HEAD~5 > .reviews/changed-files.txt

# Quick violation scan
echo "=== Pre-flight violations ===" > .reviews/PRE-FLIGHT.md
echo "" >> .reviews/PRE-FLIGHT.md

echo "### :any types" >> .reviews/PRE-FLIGHT.md
grep -rn ": any[^w]" apps/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v node_modules | head -10 >> .reviews/PRE-FLIGHT.md 2>/dev/null || echo "None found" >> .reviews/PRE-FLIGHT.md

echo "" >> .reviews/PRE-FLIGHT.md
echo "### console.log in production" >> .reviews/PRE-FLIGHT.md
grep -rn "console\." apps/api/src/domains apps/api/src/services --include="*.ts" | grep -v test | head -10 >> .reviews/PRE-FLIGHT.md 2>/dev/null || echo "None found" >> .reviews/PRE-FLIGHT.md

echo "" >> .reviews/PRE-FLIGHT.md
echo "### Hardcoded colors" >> .reviews/PRE-FLIGHT.md
grep -rn "text-\[#\|bg-\[#" apps/web/src --include="*.tsx" --include="*.ts" | head -10 >> .reviews/PRE-FLIGHT.md 2>/dev/null || echo "None found" >> .reviews/PRE-FLIGHT.md

echo "" >> .reviews/PRE-FLIGHT.md
echo "### Float types for money" >> .reviews/PRE-FLIGHT.md
grep -rn "amount.*Float\|balance.*Float" packages/db/prisma/schema.prisma >> .reviews/PRE-FLIGHT.md 2>/dev/null || echo "None found" >> .reviews/PRE-FLIGHT.md
```

**If pre-flight finds P0 violations (`:any`, floats for money), warn before continuing.**

### Categorize changed files

Read `.reviews/changed-files.txt` and categorize:
- API files (`apps/api/**`)
- Frontend files (`apps/web/**`)
- Schema files (`packages/db/**`)
- Auth files (paths containing `auth`, `clerk`, `middleware`)
- Financial files (paths containing `invoice`, `bill`, `payment`, `journal`, `accounting`)
- Config files (`turbo.json`, `package.json`, `tsconfig.json`)

This determines which conditional agents to run.

---

## Phase 2: Run Agents

Launch agents **in parallel** using the Task tool. Each agent MUST write findings to `.reviews/<agent-name>.md`.

**Critical:** Include in every agent prompt:
> "Write your complete findings to the file `.reviews/<agent-name>.md` using the Write tool. Include: file:line references, issue description, severity (P0/P1/P2), and suggested fix."

### Core agents (always run)

Pick **3-4** most relevant based on changed files:

| Agent | Output file | Focus |
|-------|------------|-------|
| `kieran-typescript-reviewer` | `.reviews/typescript.md` | Type safety, modern patterns |
| `architecture-strategist` | `.reviews/architecture.md` | System design, domain boundaries |
| `security-sentinel` | `.reviews/security.md` | OWASP, auth, tenant isolation |
| `performance-oracle` | `.reviews/performance.md` | N+1 queries, complexity, rendering |

### Conditional agents (based on changed files)

| Condition | Agent | Output file |
|-----------|-------|------------|
| `apps/api/**` changed | `fastify-api-reviewer` | `.reviews/fastify.md` |
| `apps/web/**` changed | `nextjs-app-router-reviewer` | `.reviews/nextjs.md` |
| `packages/db/**` changed | `prisma-migration-reviewer` | `.reviews/prisma.md` |
| Auth/clerk files changed | `clerk-auth-reviewer` | `.reviews/clerk.md` |
| Financial logic changed | `financial-data-validator` | `.reviews/financial.md` |
| Monorepo config changed | `turborepo-monorepo-reviewer` | `.reviews/turborepo.md` |

### Agent prompt template

```
Review the following code changes for [AGENT FOCUS AREA].

Changed files: [list from .reviews/changed-files.txt]

[Include git diff or file contents]

Write your complete findings to `.reviews/[agent-name].md` using the Write tool.

Format each finding as:
## [P0|P1|P2] Finding Title
**File:** `path/to/file:line`
**Issue:** What's wrong
**Impact:** What could go wrong
**Fix:** Suggested code change
```

---

## Phase 2.5: Compliance Checks (if UI changes)

Only run if `apps/web/` files are in the changed set:

| Agent | Output file |
|-------|------------|
| `design-system-enforcer` | `.reviews/design-system.md` |
| `code-simplicity-reviewer` | `.reviews/simplicity.md` |

Also check directly (no agent needed):
- [ ] Every new `page.tsx` has sibling `loading.tsx` and `error.tsx`
- [ ] No hardcoded hex/rgba values
- [ ] Modified routes have updated tests

---

## Phase 3: Synthesize

### Check completion

```bash
ls -la .reviews/*.md
```

Compare existing `.reviews/*.md` files against expected agents. Identify:
- **Completed:** agents that wrote their output files
- **Missing:** agents that failed (rate limit, timeout, error)

If any agents are missing:
- Warn user: "These agents failed to complete: [list]"
- Offer to re-run only the failed agents
- If user declines, proceed with available findings

### Create synthesis

Read ALL `.reviews/*.md` files (except PRE-FLIGHT.md and SYNTHESIS.md).

Write `.reviews/SYNTHESIS.md` with:

```markdown
# Review Synthesis

**Date:** YYYY-MM-DD
**Branch:** [branch name]
**Files reviewed:** [count]
**Agents completed:** [count]/[total]

## P0 Critical (blocks merge)
[Security vulnerabilities, tenant isolation breaches, financial errors, data corruption risks]

## P1 Important (should fix)
[Performance issues, type safety, missing error handling, missing tests]

## P2 Nice-to-Have (optional)
[Code simplification, minor optimizations, consistency improvements]

## Cross-Agent Patterns
[Issues flagged by multiple agents — these are highest confidence]

## Agents That Failed
[List any agents that didn't complete, with suggested re-run command]
```

---

## Phase 4: Present & Cleanup

### Present results

Show the synthesis to the user. End with a verdict:

- **P0 findings exist** > BLOCK merge, list required fixes
- **P1 only** > recommend fixes, safe to merge after
- **P2 only** > approve, note optional improvements
- **No findings** > approve

### Cleanup

Ask: "Clean up `.reviews/` directory?"

- **Yes (default):** `rm -rf .reviews/`
- **No:** Keep for PR description, follow-up session, or documentation

---

## Resuming an Interrupted Review

If a review was interrupted (rate limit, context exhaustion, closed session):

1. Run `/processes:review`
2. Phase 0 detects existing `.reviews/` files
3. Only re-runs agents that don't have output files
4. Synthesizes all results (completed + newly completed)

This means no work is lost. Even if only 2 of 6 agents completed before interruption, those 2 findings are preserved on disk.

---

_~180 lines. Persistent output to `.reviews/`. Resume-capable. Rate-limit resilient._