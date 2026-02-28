---
name: processes:review
description: Intelligent multi-agent review with auto-detection (plans, code, last day's work)
argument-hint: "[plan file | last-day | branch | PR | or auto-detect]"
aliases:
  - review
keywords:
  - review
  - validation
  - quality
  - plan review
  - code review
---

# Workflow: Review (Intelligent)

**One workflow, multiple modes** — automatically detects what you want reviewed and selects appropriate agents.

**Supported prompts:**
- "Review this plan" → Plan review mode
- "Review last day's work" → Recent commits review
- "Review my changes" → Current branch review
- `/processes:review path/to/plan.md` → Explicit plan review
- `/processes:review` → Auto-detect from git activity

**Output:** `docs/reviews/{feature-name}/` (persistent, not gitignored)

---

## Phase 0: Intent Detection & Resume Check

### Step 1: Detect review intent

Parse user prompt and arguments to determine review mode:

```python
def detect_intent(user_prompt: str, args: list[str]) -> ReviewMode:
    # Explicit file argument
    if args and args[0].endswith('.md') and 'docs/plans/' in args[0]:
        return ReviewMode.PLAN

    # Keyword detection from prompt
    keywords_plan = ['plan', 'design doc', 'architecture doc', 'proposal']
    keywords_recent = ['last day', 'yesterday', 'today', 'recent work']

    prompt_lower = user_prompt.lower()

    if any(kw in prompt_lower for kw in keywords_plan):
        return ReviewMode.PLAN

    if any(kw in prompt_lower for kw in keywords_recent):
        return ReviewMode.CODE_RECENT

    # Default: review current branch changes
    return ReviewMode.CODE_BRANCH
```

**Review modes:**
- `PLAN` — Review implementation plan for feasibility, architecture
- `CODE_RECENT` — Review last 24 hours of commits
- `CODE_BRANCH` — Review all changes on current branch vs main

### Step 2: Determine feature name & output directory

```bash
# For CODE mode: use branch name or recent commit subject
FEATURE_NAME=$(git branch --show-current | sed 's/[^a-zA-Z0-9-]/-/g')
if [ "$FEATURE_NAME" == "main" ] || [ -z "$FEATURE_NAME" ]; then
    FEATURE_NAME=$(git log -1 --pretty=%s | head -c 50 | sed 's/[^a-zA-Z0-9-]/-/g')
fi

# For PLAN mode: extract from plan filename
# e.g., docs/plans/banking-transfers.md → banking-transfers
```

### Step 3: Check for prior review results

```bash
ls docs/reviews/$FEATURE_NAME/*.md 2>/dev/null
```

If prior review exists:
- List which agents already have output files
- Ask user: "Resume from previous review? Found findings from: [agent list]"
- If resuming: skip to Phase 2, only run missing agents
- If starting fresh: create new timestamped subdirectory

---

## Phase 1: Setup & Context Gathering

### Create output directory

```bash
mkdir -p docs/reviews/$FEATURE_NAME
```

**Output structure:**
```
docs/reviews/{feature-name}/
├── CONTEXT.md                # What was reviewed, when, by whom
├── PRE-FLIGHT.md             # Quick violation scan (code mode only)
├── changed-files.txt         # Git diff output (code mode only)
├── plan-summary.md           # Plan outline (plan mode only)
├── {agent-name}.md           # Per-agent findings
└── SYNTHESIS.md              # Final verdict
```

### Gather review context

**For CODE mode (branch or recent commits):**

```bash
# Determine commit range
if [ "$MODE" == "CODE_RECENT" ]; then
    SINCE="--since='24 hours ago'"
    git log $SINCE --oneline > docs/reviews/$FEATURE_NAME/recent-commits.txt
    git diff --name-only $(git log $SINCE --format=%H | tail -1)^..HEAD > docs/reviews/$FEATURE_NAME/changed-files.txt
else
    # Branch vs main
    git diff --name-only main...HEAD > docs/reviews/$FEATURE_NAME/changed-files.txt 2>/dev/null || git diff --name-only HEAD~5 > docs/reviews/$FEATURE_NAME/changed-files.txt
fi

# Quick violation scan (code mode only)
echo "# Pre-Flight Violations" > docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
echo "" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md

echo "## :any types" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
grep -rn ": any[^w]" apps/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v node_modules | head -10 >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md 2>/dev/null || echo "✅ None found" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md

echo "" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
echo "## console.log in production" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
grep -rn "console\." apps/api/src/domains apps/api/src/services --include="*.ts" | grep -v test | head -10 >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md 2>/dev/null || echo "✅ None found" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md

echo "" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
echo "## Hardcoded colors" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
grep -rn "text-\[#\|bg-\[#" apps/web/src --include="*.tsx" --include="*.ts" | head -10 >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md 2>/dev/null || echo "✅ None found" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md

echo "" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
echo "## Float types for money" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
grep -rn "amount.*Float\|balance.*Float" packages/db/prisma/schema.prisma >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md 2>/dev/null || echo "✅ None found" >> docs/reviews/$FEATURE_NAME/PRE-FLIGHT.md
```

**For PLAN mode:**

```bash
# Extract plan structure
echo "# Plan Summary" > docs/reviews/$FEATURE_NAME/plan-summary.md
grep "^##" $PLAN_FILE >> docs/reviews/$FEATURE_NAME/plan-summary.md
```

**If pre-flight finds P0 violations (`:any`, floats for money), warn before continuing.**

### Categorize scope

**For CODE mode**, read changed files and categorize:
- Frontend: `apps/web/**`
- Backend: `apps/api/**`
- Schema: `packages/db/**`
- Auth: files containing `auth`, `clerk`, `middleware`
- Financial: files containing `invoice`, `bill`, `payment`, `journal`, `accounting`
- Config: `turbo.json`, `package.json`, `tsconfig.json`
- **AI: files containing `ai/`, `anthropic`, `openai`, `mistral`, `workers/`**
- **Jobs: files containing `workers/`, `queue/`, `bullmq`**
- **Export: files containing `export`, `csv`, `excel`, `pdf`, `stringify`**
- **Infrastructure: `Dockerfile`, `docker-compose`, `.env.example`, `health`**
- **Compliance: files containing `consent`, `audit`, `deletion`, `export`, `privacy`, or models: `AuditLog`, `AIConsent`**

**For PLAN mode**, parse plan headings for keywords:
- Database/schema mentions
- Frontend/UI mentions
- Security/auth mentions
- Performance/scale mentions
- Financial domain mentions

This determines which agents to run.

---

## Phase 2: Intelligent Agent Selection

### Agent Registry (with metadata awareness)

All agents are defined in `.claude/agents/review/*.md` with metadata:

```yaml
review_type: code | plan | both
scope: [typescript, nextjs, security, ...]
layer: [frontend, backend, shared]
domain: [banking, accounting, all, ...]
priority: high | medium | low
```

**Available agents:**

| Agent | Type | Scope | Layer | Priority |
|-------|------|-------|-------|----------|
| `architecture-strategist` | both | architecture, design | all | high |
| `kieran-typescript-reviewer` | code | typescript, types | all | high |
| `nextjs-app-router-reviewer` | code | nextjs, ssr | frontend | high |
| `fastify-api-reviewer` | code | fastify, routes | backend | high |
| `prisma-migration-reviewer` | code | schema, migrations | backend | high |
| `security-sentinel` | both | security, auth | all | high |
| `financial-data-validator` | code | financial-logic | backend | high |
| `performance-oracle` | code | performance, n+1 | all | medium |
| `code-simplicity-reviewer` | code | simplicity, yagni | all | low |
| `design-system-enforcer` | code | ui, design-tokens | frontend | medium |
| `clerk-auth-reviewer` | code | auth, clerk | all | medium |
| `rbac-validator` | code | permissions, roles | all | medium |
| `data-migration-expert` | code | migrations, data | backend | medium |
| `turborepo-monorepo-reviewer` | code | monorepo, config | all | low |
| `ai-integration-reviewer` | code | ai, llm, security | backend | high |
| `bullmq-job-reviewer` | code | bullmq, redis, jobs | backend | high |
| `data-export-reviewer` | code | export, csv, excel, pdf | backend | medium |
| `infrastructure-deployment-reviewer` | code | infrastructure, docker, s3 | infra | high |
| `compliance-reviewer` | both | gdpr, pipeda, soc2, audit | all | high |

### Selection algorithm

```python
def select_agents(mode: ReviewMode, scope_tags: dict) -> list[str]:
    agents = []

    if mode == "PLAN":
        # Plan reviews: architecture + relevant domains
        agents.append("architecture-strategist")  # always

        if scope_tags.get("security"):
            agents.append("security-sentinel")
        if scope_tags.get("database"):
            agents.append("prisma-migration-reviewer")
        if scope_tags.get("performance"):
            agents.append("performance-oracle")
        if scope_tags.get("financial"):
            agents.append("financial-data-validator")

    elif mode in ["CODE_RECENT", "CODE_BRANCH"]:
        # Code reviews: core + layer-specific + domain-specific

        # Core agents (always)
        agents.extend([
            "kieran-typescript-reviewer",  # all TS code
            "security-sentinel",           # always check security
            "architecture-strategist",     # system design
        ])

        # Layer-specific
        if scope_tags.get("frontend"):
            agents.extend([
                "nextjs-app-router-reviewer",
                "design-system-enforcer",
            ])

        if scope_tags.get("backend"):
            agents.append("fastify-api-reviewer")

        if scope_tags.get("schema"):
            agents.extend([
                "prisma-migration-reviewer",
                "data-migration-expert",
            ])

        # Domain-specific
        if scope_tags.get("auth"):
            agents.append("clerk-auth-reviewer")

        if scope_tags.get("financial"):
            agents.append("financial-data-validator")

        if scope_tags.get("permissions"):
            agents.append("rbac-validator")

        # Technology-specific (NEW)
        if scope_tags.get("ai"):
            agents.append("ai-integration-reviewer")

        if scope_tags.get("jobs"):
            agents.append("bullmq-job-reviewer")

        if scope_tags.get("export"):
            agents.append("data-export-reviewer")

        if scope_tags.get("infrastructure"):
            agents.append("infrastructure-deployment-reviewer")

        # Regulatory compliance (HIGH PRIORITY)
        if scope_tags.get("compliance"):
            agents.append("compliance-reviewer")

        # Cross-cutting (always include)
        agents.extend([
            "performance-oracle",
            "code-simplicity-reviewer",  # final pass for YAGNI
        ])

        # Config-specific
        if scope_tags.get("monorepo_config"):
            agents.append("turborepo-monorepo-reviewer")

    # Remove duplicates, preserve order
    return list(dict.fromkeys(agents))
```

**Result:** Typical selections:
- **Frontend-only code:** 6 agents (not all 15)
- **Backend-only code:** 7 agents
- **Full-stack code:** 10-12 agents
- **Plan review:** 2-5 agents

---

## Phase 3: Launch Agents with Progressive Writing

Launch agents **in parallel** using the Task tool.

**Critical instructions for ALL agents:**

```
You are reviewing [SCOPE] as part of a multi-agent code review.

Review mode: [PLAN | CODE_RECENT | CODE_BRANCH]
Output directory: docs/reviews/{feature-name}/

[For CODE mode:]
Changed files (your scope only): [filtered list]
Total changed files: [link to changed-files.txt]

[For PLAN mode:]
Plan file: {plan-path}
Plan summary: [extracted headings]

IMPORTANT - Progressive Writing:
1. Create your output file immediately: docs/reviews/{feature-name}/{agent-name}.md
2. Write findings INCREMENTALLY as you analyze each file/section
3. Use Write tool to create file, then append findings as you go
4. This ensures findings persist even if you hit rate limits mid-review

Format each finding as:
### [P0|P1|P2] Finding Title
**File:** `path/to/file:line` (code mode) or **Section:** `Plan heading` (plan mode)
**Issue:** What's wrong
**Impact:** What could go wrong
**Fix:** Suggested change

---

Available related agents (if you need to reference or defer to them):
[List of other agents in this review, with their focus areas]
Example: "If you find issues outside your scope (e.g., database schema issues), note them but defer detailed analysis to prisma-migration-reviewer."
```

### Agent Context Filtering

**For code reviews**, pre-filter files per agent to avoid context bloat:

```python
def filter_files_for_agent(agent_name: str, all_files: list[str]) -> list[str]:
    """
    Only pass files relevant to agent's scope/layer
    """
    filters = {
        "kieran-typescript-reviewer": lambda f: f.endswith((".ts", ".tsx")),
        "nextjs-app-router-reviewer": lambda f: "apps/web/" in f,
        "fastify-api-reviewer": lambda f: "apps/api/" in f,
        "prisma-migration-reviewer": lambda f: "packages/db/" in f or "prisma" in f,
        "design-system-enforcer": lambda f: "apps/web/" in f and (".tsx" in f or "globals.css" in f),
        "ai-integration-reviewer": lambda f: "ai/" in f or "anthropic" in f or "openai" in f or "mistral" in f,
        "bullmq-job-reviewer": lambda f: "workers/" in f or "queue/" in f or "bullmq" in f,
        "data-export-reviewer": lambda f: "export" in f or "csv" in f or "excel" in f or "pdf" in f,
        "infrastructure-deployment-reviewer": lambda f: f in ["Dockerfile", "docker-compose.yml", ".env.example"] or "health" in f,
        "compliance-reviewer": lambda f: "consent" in f or "audit" in f or "privacy" in f or "AIConsent" in f or "AuditLog" in f or "retention" in f,
        # ... etc
    }

    filter_fn = filters.get(agent_name, lambda f: True)  # default: all files
    return [f for f in all_files if filter_fn(f)]
```

**For large files** (>300 lines), include guidance:

```
For large files, use Read tool with offset/limit:
- First pass: Read lines 1-200
- If issues found, dive deeper
- Don't read entire 1000-line files unless necessary
```

---

## Phase 4: Synthesize

### Check completion

```bash
ls -la docs/reviews/$FEATURE_NAME/*.md
```

Compare existing files against expected agents. Identify:
- **Completed:** agents that wrote their output files
- **Missing:** agents that failed (rate limit, timeout, error)

If any agents are missing:
- Warn user: "These agents failed to complete: [list]"
- Offer to re-run only the failed agents
- If user declines, proceed with available findings

### Create synthesis

Read ALL agent output files in `docs/reviews/$FEATURE_NAME/*.md` (exclude: CONTEXT.md, PRE-FLIGHT.md, SYNTHESIS.md, changed-files.txt, plan-summary.md).

Write `docs/reviews/$FEATURE_NAME/SYNTHESIS.md`:

```markdown
# Review Synthesis

**Review Mode:** [PLAN | CODE_RECENT | CODE_BRANCH]
**Date:** YYYY-MM-DD
**Feature:** {feature-name}
**Branch:** [branch name] (code mode) or **Plan:** [plan file path] (plan mode)
**Scope:** [Frontend | Backend | Full-stack | Schema | Config]
**Agents:** [count completed] / [count total]

---

## Summary

[2-3 sentence summary of overall code/plan health]

---

## P0 Critical Issues (blocks merge/approval) ❌

[Issues that MUST be fixed before proceeding]

**Example:**
### Security: Tenant isolation breach in invoice query
- **Agent:** security-sentinel
- **File:** apps/api/src/domains/invoicing/routes/invoice.ts:42
- **Issue:** Query missing `tenantId` filter, allows cross-tenant data access
- **Fix:** Add `where: { entity: { tenantId: ctx.tenantId } }`

---

## P1 Important (should fix) ⚠️

[Issues that should be addressed but don't block merge]

---

## P2 Nice-to-Have (optional) 💡

[Suggestions for improvement, not critical]

---

## Cross-Agent Patterns 🔁

[Issues flagged by 2+ agents — highest confidence findings]

**Example:**
- **Type safety concerns** flagged by: kieran-typescript-reviewer, nextjs-app-router-reviewer
- **Performance risks** flagged by: performance-oracle, fastify-api-reviewer

---

## Compliance Checklist ✅

**For CODE reviews:**
- [ ] All TS files type-safe (no `:any`)
- [ ] New pages have loading.tsx + error.tsx
- [ ] No hardcoded colors (use tokens)
- [ ] Tests updated for route changes
- [ ] Tenant isolation maintained
- [ ] Financial data uses integer cents
- [ ] Soft delete used (no hard deletes)

**For PLAN reviews:**
- [ ] Architecture aligns with existing patterns
- [ ] Security concerns addressed
- [ ] Performance considerations noted
- [ ] Database schema changes feasible
- [ ] Dependencies identified

---

## Agents That Failed ❌

[List any agents that didn't complete, with suggested re-run command]

**Example:**
- `prisma-migration-reviewer` (rate limit)
- Rerun: `/processes:review` (will resume automatically)

---

## Next Steps

[Based on P0/P1/P2 findings, what should happen next?]

**Example:**
1. Fix P0 tenant isolation issue in invoice.ts
2. Address P1 type safety warnings
3. Review P2 simplification suggestions (optional)
4. Re-run review to verify fixes

---

_Review completed by Akount AI Review System_
_Output: docs/reviews/{feature-name}/_
```

---

## Phase 5: Present & Archive

### Present results

Show the synthesis to the user in a clear format:

```
📊 Review Complete: {feature-name}

Mode: [PLAN | CODE_RECENT | CODE_BRANCH]
Agents: {count} completed
Findings: {P0 count} critical, {P1 count} important, {P2 count} optional

Verdict:
[X] P0 Critical Issues Found → BLOCK until fixed
[X] P1 Important Issues → Recommend fixing before merge
[ ] P2 Suggestions Only → Approved with optional improvements
[ ] No Issues Found → ✅ Approved

Full report: docs/reviews/{feature-name}/SYNTHESIS.md
```

**Verdict logic:**
- **P0 exists** → BLOCK, list required fixes
- **P1 only** → APPROVED (recommend fixes)
- **P2 only** → APPROVED (optional improvements)
- **No findings** → ✅ APPROVED

### Archive review

Review output is **already persisted** in `docs/reviews/{feature-name}/`.

No cleanup needed — these files are:
- ✅ Permanent historical record
- ✅ Referenced in future reviews
- ✅ Used for trend analysis
- ✅ Linked in PR descriptions

**Note:** Output moved from `.reviews/` (gitignored) to `docs/reviews/` (committed). This change ensures review history is preserved.

---

## Phase 6: Auto-Create Tasks from Findings

**Protocol:** See `.claude/rules/task-population.md` for full approval gate rules.

After presenting the synthesis, offer to create tasks from P0 and P1 findings:

1. **Parse findings** from `docs/reviews/$FEATURE_NAME/SYNTHESIS.md`
2. **Reserve IDs atomically:**
   ```bash
   node .claude/scripts/reserve-task-ids.js SEC 3  # if 3 security findings
   node .claude/scripts/reserve-task-ids.js PERF 2  # if 2 performance findings
   ```
3. **Map findings to tasks:**
   - `security-sentinel` → Dev/SEC
   - `performance-oracle` → Dev/PERF
   - `financial-data-validator` → Dev/FIN
   - `kieran-typescript-reviewer` → Dev/DRY
   - `design-system-enforcer` → Design System/DS
4. **Check dependencies** — e.g., "fix X before Y can work"
5. **Present for approval** with Source + Reason columns
6. **Write approved tasks** to TASKS.md with reserved IDs

**Example output:**
```
Created 5 tasks from review findings:
- SEC-24: Fix tenant isolation in invoice query (P0)
- PERF-18: Add index on transactions.accountId (P1)
- DRY-12: Remove :any types in payment form (P1)
- FIN-29: Use integer cents in transfer calculation (P0)
- DS-8: Replace hardcoded color in dashboard (P2)
```

---

## Resuming an Interrupted Review

If a review was interrupted (rate limit, context exhaustion, closed session):

1. Run `/processes:review` again
2. **Phase 0 detects existing output** in `docs/reviews/{feature-name}/`
3. **Lists completed agents** from existing .md files
4. **Asks user:** "Resume from previous review? Found findings from: [agent list]"
5. **If resuming:** Only runs agents that DON'T have output files
6. **Synthesizes all results** (old + new findings)

**No work is lost.** Progressive writing ensures findings persist even if agents hit rate limits mid-review.

---

## Intelligent Prompt Examples

The workflow auto-detects intent from your prompts:

| You Say | Detected Mode | What Happens |
|---------|---------------|--------------|
| "Review this plan" | PLAN | Reviews implementation plan architecture |
| "Review last day's work" | CODE_RECENT | Reviews commits from last 24 hours |
| "Review my changes" | CODE_BRANCH | Reviews current branch vs main |
| `/processes:review docs/plans/feature.md` | PLAN | Explicit plan review |
| `/processes:review` | CODE_BRANCH | Default: current branch changes |

---

## Agent Awareness & Collaboration

Agents know about each other and can reference related agents:

**Example agent prompt includes:**
```
Available related agents in this review:
- architecture-strategist: System design, domain boundaries
- security-sentinel: OWASP, auth, tenant isolation
- fastify-api-reviewer: Fastify routes, middleware, schemas
- prisma-migration-reviewer: Database schema changes

If you find issues outside your scope:
- Note them briefly
- Reference the appropriate agent: "See security-sentinel for tenant isolation analysis"
- Don't duplicate work
```

This prevents:
- ❌ Multiple agents flagging the same issue
- ❌ Agents analyzing code outside their expertise
- ✅ Clear division of responsibility
- ✅ Cross-references for related findings

---

## Standards & Rules Enforcement

All agents are instructed to enforce:

1. **9 Key Invariants** (from CLAUDE.md)
   - Tenant isolation
   - Integer cents for money
   - Double-entry bookkeeping
   - Soft delete
   - Source preservation
   - Page loading states
   - Server/client separation
   - Atomic task IDs
   - Task requirement

2. **Domain-specific rules** (from .claude/rules/)
   - `financial-rules.md` — Money, double-entry, multi-currency
   - `api-conventions.md` — Route → Schema → Service pattern
   - `frontend-conventions.md` — Server/client split, state management
   - `design-aesthetic.md` — Color tokens, glass morphism
   - `test-conventions.md` — Financial assertions, soft delete verification

3. **Agent-specific expertise**
   - Each agent has deep knowledge of their domain
   - Cross-references project rules during review
   - Flags deviations with severity and fix suggestions

---

_Enhanced review system. Auto-detects intent. Intelligent agent selection. Progressive writing. Permanent archives._