# Review System Enhancement Plan

**Created:** 2026-02-24
**Status:** Planning
**Type:** Infrastructure Improvement
**Effort:** 4-6 hours

---

## Problem Statement

Current review system has several limitations:
1. **No separation** between plan reviews and code reviews (both use same workflow)
2. **Output location confusion** — uses `.reviews/` (gitignored) instead of `docs/reviews/`
3. **Agent selection not intelligent** — runs all agents or uses simple file-path matching
4. **File saving issues** — agents may not persist findings during execution
5. **Limited agent discoverability** — metadata exists but lacks semantic tags for smart selection
6. **Context/rate limit inefficiency** — doesn't optimize agent selection to minimize API usage

---

## Goals

1. ✅ Split into two distinct workflows: `/processes:plan-review` and `/processes:code-review`
2. ✅ Persistent output to `docs/reviews/{feature-name}/` (not gitignored)
3. ✅ Intelligent agent selection based on review scope (frontend-only, backend-only, etc.)
4. ✅ Enhanced agent metadata with semantic tags for discovery
5. ✅ Progressive file writing — agents save findings as they go
6. ✅ Context-efficient prompts — only load relevant context for each agent

---

## Architecture Design

### Two Workflows

#### 1. `/processes:plan-review` — Review Implementation Plans

**Input:** Plan file path (e.g., `docs/plans/feature-name.md`)
**Output:** `docs/reviews/{plan-name}/plan-review/`
**Agents:** Architecture-focused, no code inspection

```
docs/reviews/{plan-name}/
├── plan-review/
│   ├── SYNTHESIS.md              # Overall plan health
│   ├── architecture.md           # architecture-strategist
│   ├── feasibility.md            # Technical feasibility check
│   └── dependencies.md           # Cross-domain impact analysis
└── code-review/                  # (created later after implementation)
```

**Agent selection for plan reviews:**
- `architecture-strategist` (always)
- Domain-specific: detect from plan sections (banking, frontend, database, etc.)
- Security if auth/tenant concerns mentioned
- Performance if scale/optimization mentioned

#### 2. `/processes:code-review` — Review Code Changes

**Input:** Branch name, PR number, or file paths
**Output:** `docs/reviews/{feature-name}/code-review/`
**Agents:** Code-focused, actual implementation inspection

```
docs/reviews/{feature-name}/
├── plan-review/                  # (if plan was reviewed earlier)
└── code-review/
    ├── PRE-FLIGHT.md             # Quick violation scan
    ├── SYNTHESIS.md              # Overall verdict
    ├── changed-files.txt         # Git diff --name-only
    ├── typescript.md             # kieran-typescript-reviewer
    ├── nextjs.md                 # nextjs-app-router-reviewer (if frontend)
    ├── fastify.md                # fastify-api-reviewer (if backend)
    ├── prisma.md                 # prisma-migration-reviewer (if schema)
    ├── security.md               # security-sentinel
    ├── financial.md              # financial-data-validator (if financial)
    └── ...
```

---

## Enhanced Agent Metadata

### New Metadata Fields

Enhance all agent YAML frontmatter with:

```yaml
---
name: kieran-typescript-reviewer
description: "..." # existing
model: inherit      # existing
review_type: code   # NEW: code | plan | both
scope:              # NEW: what this agent reviews
  - typescript
  - type-safety
  - code-quality
layer:              # NEW: which layer
  - frontend
  - backend
  - shared
domain:             # NEW: which domains (empty = all)
  - all
priority: high      # NEW: high | medium | low (for selection)
context_files:      # existing
  - packages/db/prisma/schema.prisma
related_agents:     # existing
  - architecture-strategist
invoke_patterns:    # existing
  - "typescript"
  - "type safety"
---
```

### Agent Classification Matrix

| Agent | review_type | scope | layer | domain | priority |
|-------|-------------|-------|-------|--------|----------|
| `architecture-strategist` | both | architecture, design | all | all | high |
| `kieran-typescript-reviewer` | code | typescript, types | all | all | high |
| `nextjs-app-router-reviewer` | code | nextjs, ssr | frontend | all | high |
| `fastify-api-reviewer` | code | fastify, routes | backend | all | high |
| `prisma-migration-reviewer` | code | schema, migrations | backend | all | high |
| `security-sentinel` | both | security, auth | all | all | high |
| `financial-data-validator` | code | financial-logic | backend | business, accounting | high |
| `performance-oracle` | code | performance, n+1 | all | all | medium |
| `code-simplicity-reviewer` | code | simplicity, yagni | all | all | low |
| `design-system-enforcer` | code | ui, design-tokens | frontend | all | medium |
| `clerk-auth-reviewer` | code | auth, clerk | all | all | medium |
| `rbac-validator` | code | permissions, roles | all | all | medium |
| `data-migration-expert` | code | migrations, data | backend | all | medium |
| `deployment-verification-agent` | code | deployment, checklist | all | all | low |
| `turborepo-monorepo-reviewer` | code | monorepo, config | all | all | low |

---

## Intelligent Agent Selection Algorithm

### For Plan Reviews (`/processes:plan-review`)

```python
def select_plan_review_agents(plan_content: str) -> list[Agent]:
    agents = []

    # Always include
    agents.append("architecture-strategist")

    # Parse plan for domain keywords
    if mentions_auth(plan_content):
        agents.append("security-sentinel")

    if mentions_database(plan_content):
        agents.append("prisma-migration-reviewer")

    if mentions_performance(plan_content):
        agents.append("performance-oracle")

    if mentions_frontend(plan_content):
        agents.append("nextjs-app-router-reviewer")

    if mentions_backend(plan_content):
        agents.append("fastify-api-reviewer")

    if mentions_financial(plan_content):
        agents.append("financial-data-validator")

    return agents  # typically 2-4 agents, not all 15
```

### For Code Reviews (`/processes:code-review`)

```python
def select_code_review_agents(changed_files: list[str]) -> list[Agent]:
    agents = []
    file_types = classify_files(changed_files)

    # Core agents (always run for code)
    agents.append("kieran-typescript-reviewer")  # all TS code
    agents.append("security-sentinel")           # always check security

    # Layer-specific agents
    if "frontend" in file_types:
        agents.append("nextjs-app-router-reviewer")
        agents.append("design-system-enforcer")

    if "backend" in file_types:
        agents.append("fastify-api-reviewer")

    if "schema" in file_types:
        agents.append("prisma-migration-reviewer")
        agents.append("data-migration-expert")

    # Domain-specific agents
    if any("auth" in f or "clerk" in f for f in changed_files):
        agents.append("clerk-auth-reviewer")

    if any("invoice" in f or "bill" in f or "payment" in f or "journal" in f
           for f in changed_files):
        agents.append("financial-data-validator")

    # Cross-cutting agents
    agents.append("architecture-strategist")     # system design
    agents.append("performance-oracle")          # always check perf
    agents.append("code-simplicity-reviewer")    # final pass for YAGNI

    # Conditional low-priority agents
    if "turbo.json" in changed_files or "package.json" in changed_files:
        agents.append("turborepo-monorepo-reviewer")

    return agents  # typically 6-10 agents (not all 15)
```

### File Classification Logic

```python
def classify_files(files: list[str]) -> dict[str, bool]:
    return {
        "frontend": any("apps/web/" in f for f in files),
        "backend": any("apps/api/" in f for f in files),
        "schema": any("packages/db/" in f for f in files),
        "config": any(f in ["turbo.json", "package.json", "tsconfig.json"]
                      for f in files),
        "auth": any("auth" in f or "clerk" in f or "middleware" in f
                    for f in files),
        "financial": any(keyword in f for f in files
                        for keyword in ["invoice", "bill", "payment",
                                       "journal", "accounting"]),
    }
```

---

## Progressive File Writing Mechanism

### Problem

Current agents may write findings to `.reviews/{agent}.md` at the end, but if they hit rate limits or context exhaustion mid-execution, findings are lost.

### Solution: Incremental Writing

**Modify agent prompts to include:**

```
You MUST write findings incrementally to `docs/reviews/{feature}/code-review/{agent}.md`.

After analyzing each file:
1. Append findings to the output file immediately using Write tool
2. Use append mode if the file exists
3. Include file header: ## {file-path}

This ensures findings persist even if you hit rate limits mid-review.

Format each finding as:
### [P0|P1|P2] Finding Title
**File:** `path/to/file:line`
**Issue:** What's wrong
**Impact:** What could go wrong
**Fix:** Suggested code change
```

**Implementation pattern:**

```typescript
// Agent writes after each file analysis
Write({
  file_path: "docs/reviews/{feature}/code-review/typescript.md",
  content: `
## apps/web/src/components/InvoiceForm.tsx

### P1 Type Safety: Using 'any' for form data
**File:** \`apps/web/src/components/InvoiceForm.tsx:42\`
**Issue:** Form data typed as \`any\` instead of explicit interface
**Impact:** Loss of type safety, runtime errors possible
**Fix:**
\`\`\`typescript
interface InvoiceFormData {
  amount: number;
  dueDate: string;
  // ...
}
const [formData, setFormData] = useState<InvoiceFormData>({ ... });
\`\`\`

---
`,
  // Note: agents should track if file exists and append instead of overwrite
})
```

---

## Context-Efficient Prompts

### Problem

Agents currently receive full git diffs or file contents, which can exhaust context quickly.

### Solution: Scope-Limited Context

**1. Pre-filter relevant files per agent**

```python
def get_relevant_files_for_agent(agent: Agent, all_changed_files: list[str]) -> list[str]:
    """
    Only pass files that match agent's scope/layer/domain
    """
    if agent.scope == "typescript":
        return [f for f in all_changed_files if f.endswith((".ts", ".tsx"))]

    if agent.layer == "frontend":
        return [f for f in all_changed_files if "apps/web/" in f]

    if agent.layer == "backend":
        return [f for f in all_changed_files if "apps/api/" in f]

    # ... etc
    return all_changed_files  # fallback for "all" scope
```

**2. Provide file-by-file context**

Instead of:
```
Review these 50 files: [massive dump]
```

Do:
```
Review these 5 files relevant to your scope:
- apps/api/src/domains/invoicing/routes/invoice.ts (342 lines)
- apps/api/src/domains/invoicing/services/invoice.service.ts (567 lines)
...

[Read files one by one as needed using Read tool]
```

**3. Use offset/limit for large files**

```
Read({
  file_path: "apps/api/src/domains/invoicing/services/invoice.service.ts",
  offset: 0,
  limit: 100  // First 100 lines only
})
```

---

## Implementation Plan

### Phase 1: Infrastructure (1-2 hours)

**Tasks:**

1. ✅ Create `/processes:plan-review` command file
   - File: `.claude/commands/processes/plan-review.md`
   - Copy structure from `review.md`, adapt for plan analysis

2. ✅ Rename current `/processes:review` to `/processes:code-review`
   - File: `.claude/commands/processes/code-review.md`
   - Update description, aliases
   - Change output from `.reviews/` to `docs/reviews/{feature}/code-review/`

3. ✅ Update all agent metadata files
   - Add `review_type`, `scope`, `layer`, `domain`, `priority` fields
   - Files: All 15 agents in `.claude/agents/review/*.md`

4. ✅ Update `.claude/rules/workflows.md`
   - Replace `/processes:review` with `/processes:plan-review` and `/processes:code-review`
   - Document when to use each

### Phase 2: Agent Selection Logic (1 hour)

**Tasks:**

5. ✅ Create agent selector utility
   - File: `.claude/scripts/select-review-agents.js`
   - Input: review type (plan | code), changed files or plan content
   - Output: JSON array of agent names
   - Use metadata to filter intelligently

6. ✅ Integrate selector into commands
   - Plan review: parse plan headings/keywords
   - Code review: use git diff --name-only

### Phase 3: Progressive Writing (1 hour)

**Tasks:**

7. ✅ Update agent prompt templates
   - Add incremental writing instructions
   - Specify output file path per agent
   - Include append-mode guidance

8. ✅ Add file existence checks
   - Commands check if `docs/reviews/{feature}/` exists
   - Create directory structure before launching agents

### Phase 4: Context Optimization (1-2 hours)

**Tasks:**

9. ✅ Implement file filtering per agent
   - Pre-filter changed files by agent scope
   - Pass only relevant files to each agent

10. ✅ Add offset/limit guidance
    - Document when agents should use Read with offset/limit
    - Recommend limits (e.g., 200 lines for initial scan)

11. ✅ Update synthesis phase
    - Read all `docs/reviews/{feature}/{review-type}/*.md`
    - Create SYNTHESIS.md in same directory
    - Include link to plan review if both exist

### Phase 5: Documentation & Rollout (30 min)

**Tasks:**

12. ✅ Update CLAUDE.md
    - Document new workflow split
    - Update quick reference table

13. ✅ Create migration guide
    - File: `docs/reviews/MIGRATION.md`
    - Explain change from `.reviews/` to `docs/reviews/`
    - Show before/after examples

14. ✅ Test both workflows end-to-end
    - Run `/processes:plan-review` on existing plan
    - Run `/processes:code-review` on small PR
    - Verify output structure

---

## File Structure After Implementation

```
docs/reviews/
├── MIGRATION.md                           # How to use new system
├── banking-transfers/                     # Example feature
│   ├── plan-review/                       # Plan was reviewed first
│   │   ├── SYNTHESIS.md
│   │   ├── architecture.md
│   │   └── feasibility.md
│   └── code-review/                       # Code reviewed after implementation
│       ├── PRE-FLIGHT.md
│       ├── SYNTHESIS.md
│       ├── changed-files.txt
│       ├── typescript.md
│       ├── fastify.md
│       ├── prisma.md
│       └── security.md
├── dashboard-redesign/                    # Frontend-only feature
│   └── code-review/
│       ├── PRE-FLIGHT.md
│       ├── SYNTHESIS.md
│       ├── typescript.md
│       ├── nextjs.md
│       └── design-system.md               # Only 4 agents, not all 15
└── tax-rate-service/                      # Backend-only feature
    └── code-review/
        ├── PRE-FLIGHT.md
        ├── SYNTHESIS.md
        ├── typescript.md
        ├── fastify.md
        ├── prisma.md
        └── financial.md                   # Only 5 agents, not all 15
```

---

## Benefits

### Before (Current System)

- ❌ One review workflow for both plans and code
- ❌ Output to `.reviews/` (gitignored, lost on cleanup)
- ❌ Runs all agents or simple file matching
- ❌ Agents write findings at end (rate limit risk)
- ❌ No semantic agent discoverability

**Example:** Frontend-only PR runs all 15 agents (wasted context/cost)

### After (Enhanced System)

- ✅ Two specialized workflows: plan review vs code review
- ✅ Persistent output to `docs/reviews/{feature}/`
- ✅ Intelligent agent selection (frontend PR → 4-6 agents, not 15)
- ✅ Progressive writing (findings persist even if interrupted)
- ✅ Rich metadata for agent discovery
- ✅ Context-efficient prompts (only relevant files per agent)

**Example:** Frontend-only PR runs 4-6 agents (60% cost reduction)

---

## Success Metrics

1. **Agent selection accuracy** — Frontend PRs should not run backend agents
2. **Context usage** — 30-50% reduction in tokens per review
3. **Resilience** — Reviews survive rate limits without losing findings
4. **Discoverability** — Agents selected based on metadata tags, not hardcoded lists
5. **Persistence** — All review outputs saved to `docs/reviews/` for historical reference

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Agent selector might miss relevant agents | Fallback to "high priority" agents if uncertain |
| Progressive writing might create partial files | Add "Review Status: In Progress" header |
| File path conflicts if feature name has slashes | Sanitize feature name: replace `/` with `-` |
| Old `.reviews/` output still referenced | Update all docs to point to `docs/reviews/` |

---

## Future Enhancements (Out of Scope)

- [ ] Web UI dashboard for review results
- [ ] Automated PR comment posting with findings
- [ ] Review history comparison (track improvement over time)
- [ ] Custom agent configuration per repo
- [ ] Review templates for common feature types

---

_Plan created: 2026-02-24. Ready for implementation._