# Agent Architecture — Execution + Review Model

**Created:** 2026-02-22
**Status:** PLANNING
**Goal:** Implement CCPM-inspired execution agents alongside our existing review agents

---

## Current State Analysis

### What We Have (Review Agents - Post-Implementation QA)

**13 Review Agents** — Used AFTER code is written via `/processes:review`:

| Agent | Purpose | When Used |
|-------|---------|-----------|
| `financial-data-validator` | Double-entry, integer cents, soft delete | Financial features |
| `architecture-strategist` | System design, boundaries | Architecture changes |
| `security-sentinel` | Tenant isolation, auth, OWASP | Security-sensitive features |
| `prisma-migration-reviewer` | Schema changes, data safety | Database migrations |
| `kieran-typescript-reviewer` | Strict TypeScript patterns | TS code quality |
| `nextjs-app-router-reviewer` | App Router, Server/Client separation | Next.js pages/components |
| `fastify-api-reviewer` | Route patterns, middleware | API endpoints |
| `clerk-auth-reviewer` | Authentication patterns | Auth flows |
| `design-system-enforcer` | UI compliance, tokens | Frontend UI |
| `rbac-validator` | Role-based access | Permission logic |
| `performance-oracle` | Query optimization, N+1 detection | Performance-critical code |
| `code-simplicity-reviewer` | YAGNI, over-engineering detection | Final cleanup pass |
| `turborepo-monorepo-reviewer` | Workspace structure | Monorepo changes |

**Workflow Skills** — Orchestration:
- `/processes:begin`, `/processes:plan`, `/processes:work`, `/processes:diagnose`, `/processes:review`, `/processes:end-session`, `/processes:eod`

### What We DON'T Have (Execution Agents - Build Features)

**Zero execution agents.** Currently, main conversation thread does ALL implementation work:
- All 8 domains (banking, accounting, invoicing, etc.)
- All tech layers (API, web, DB, tests, UI)
- All tasks (from 5-min fixes to 6-hour features)

**Problem:** Single-threaded, no parallelization, no specialization during execution.

---

## Proposed Agent Architecture

### Category 1: Domain Execution Agents (8 agents)

**Mapped to our 8 user-facing domains:**

| Agent | Domain | Responsibilities |
|-------|--------|------------------|
| `banking-agent` | Banking | Accounts, transactions, transfers, reconciliation |
| `accounting-agent` | Accounting | GL accounts, journal entries, reports (P&L, BS, CF, TB) |
| `invoicing-agent` | Invoicing | Invoices, AR, invoice posting to GL |
| `clients-agent` | Clients | Client CRUD, client-invoice linking |
| `vendors-agent` | Vendors | Vendor CRUD, AP, bill-vendor linking |
| `planning-agent` | Planning | Budgets, forecasts, goals, variances |
| `insights-agent` | Insights | AI chat, rule engine, categorization, insights |
| `services-agent` | Services | Accountant requests, bookkeeping, documents |

**How they work:**
- Each agent is an **expert in its domain** (knows models, business rules, existing patterns)
- Receives tasks via `/pm:execute <domain> <task-id>`
- Works in isolated context (loads domain-specific rules + patterns)
- Posts updates to task tracking (TASKS.md or GitHub Issues)
- Calls review agents when done (e.g., `banking-agent` calls `financial-data-validator`)

**Example workflow:**
```
User: /pm:execute banking DEV-46

→ Spawns banking-agent
→ Agent reads:
  - TASKS.md entry for DEV-46 (banking transfers feature)
  - .claude/context/banking.md (domain rules)
  - apps/api/src/domains/banking/ (existing code)
  - packages/db/prisma/schema.prisma (Account, Transaction models)

→ Agent executes:
  1. Create transfer service in domains/banking/services/transfer.service.ts
  2. Add transfer routes in domains/banking/routes/transfer.ts
  3. Write 24 tests in domains/banking/routes/__tests__/transfer.test.ts
  4. Create frontend page at apps/web/src/app/(dashboard)/banking/transfers/

→ Agent self-reviews:
  - Calls financial-data-validator (double-entry check)
  - Calls fastify-api-reviewer (route patterns)
  - Calls kieran-typescript-reviewer (type safety)

→ Agent reports:
  - Updates TASKS.md: DEV-46 status = done
  - Commits code with message linking to task
  - Notifies user: "DEV-46 complete, 3/3 reviews passed"
```

### Category 2: Technical Layer Agents (5 agents)

**Cross-domain specialists by tech stack:**

| Agent | Layer | Responsibilities |
|-------|-------|------------------|
| `api-agent` | Backend | Fastify routes, services, schemas (Zod), middleware |
| `web-agent` | Frontend | Next.js pages, server components, layouts, navigation |
| `ui-agent` | Components | Design system components, shadcn/glass-ui integration |
| `db-agent` | Database | Prisma schema, migrations, seed data, indexes |
| `test-agent` | Testing | Vitest tests (unit, integration), test utilities |

### Category 3: Security & Compliance Agents (2 agents)

**Proactive security and compliance enforcement DURING development:**

| Agent | Focus | Responsibilities |
|-------|-------|------------------|
| `security-agent` | Security | Proactive security checks during build - tenant isolation in queries, auth middleware, input validation, OWASP patterns. **Different from security-sentinel** (review agent) - this agent PREVENTS issues during build, sentinel FINDS issues after. |
| `compliance-agent` | Financial Compliance | Audit trail verification, SOX compliance, financial data integrity, regulatory requirements. Ensures every financial change has proper audit logging, approval chains, source preservation. |

**How they work:**
- **security-agent:** Works ALONGSIDE execution agents (e.g., banking-agent building transfer feature → security-agent validates tenant isolation in real-time)
- **compliance-agent:** Validates financial changes BEFORE commit (e.g., accounting-agent creates journal entry → compliance-agent ensures audit log + source document exist)
- Both can BLOCK commits if critical issues found (unlike review agents which only warn)

**How they work:**
- Each agent is a **technical specialist** (API agent knows Fastify patterns, DB agent knows Prisma)
- Can be called by domain agents (e.g., `banking-agent` delegates DB schema to `db-agent`)
- Can work independently on tech-debt tasks (e.g., `test-agent` handles TEST-1, TEST-2, TEST-3)

**Example coordination (multi-agent task):**
```
Task: DEV-46 (Banking transfers feature)

→ banking-agent (coordinator) spawns:
  ├─ db-agent: Add Transfer model to schema (if needed)
  ├─ api-agent: Create transfer routes + service
  ├─ web-agent: Create /banking/transfers page
  ├─ ui-agent: Create TransferForm component
  └─ test-agent: Write 24 tests for transfer service

→ All agents work in parallel (separate worktrees if using CCPM model)
→ banking-agent merges results, calls review agents
→ Reports completion
```

### Category 4: Review Agents (13 agents - NO CHANGE)

**Keep all existing review agents.** They are called AFTER execution agents finish:

```
Execution Agent → Security/Compliance Agents → Review Agents → Approval → Commit
                 (proactive blocking)      (retrospective QA)
```

---

## Agent Coordination Model

### Option A: Parallel (CCPM Model — SELECTED ✓)

Multiple execution agents work simultaneously via worktrees:

```
User: /pm:execute-parallel banking accounting invoicing

  ├─ banking-agent (worktree: banking-task-branch)
  │    └─ Works on DEV-46 (transfers)
  │
  ├─ accounting-agent (worktree: accounting-task-branch)
  │    └─ Works on UX-18 (accounting landing page)
  │
  └─ invoicing-agent (worktree: invoicing-task-branch)
       └─ Works on DEV-71 (invoice edit)

After all agents finish:
  → Each calls its review agents
  → Each commits to its worktree branch
  → Coordinator merges all branches
  → Updates TASKS.md for all 3 tasks
```

**Pros:**
- True parallelization (3x speed on independent tasks)
- Scales to large backlogs (337 tasks → can run 5-8 agents concurrently)

**Cons:**
- Complex coordination (merge conflicts, dependency resolution)
- Worktree overhead for small tasks
- Need orchestrator agent to coordinate

**DECISION:** Go straight to parallel model (Option A). We regularly work on 3+ tasks simultaneously, solo dev benefits from parallelization too (context switching reduction). Accept the complexity upfront.

---

## Implementation Phases

### Phase 1: Foundation + Parallel Execution (Week 1-2 — 12-16h)

**Goal:** Create agent infrastructure + worktree orchestration + 4 pilot agents

**Tasks:**

**Part A: Infrastructure (4-6h) — COMPLETE**
1. ~~Create `.claude/agents/` directory structure~~ ✅
2. ~~Define agent template~~ ✅ `_template.md` (meta-guide, ~200 lines)
3. ~~Create worktree management scripts~~ ✅
   - `scripts/worktree-create.sh` ✅
   - `scripts/worktree-cleanup.sh` ✅
   - `scripts/worktree-status.sh` ✅
4. ~~Create orchestrator utilities~~ ✅ (implemented as skill commands, not TS script — skills are more natural for Claude Code)
5. ~~Create `/pm:execute`~~ ✅ `.claude/commands/pm/execute.md` (~280 lines, 7 phases)
6. ~~Create `/pm:execute-parallel`~~ ✅ `.claude/commands/pm/execute-parallel.md` (~230 lines, 8 phases)
7. ~~Create `/pm:README`~~ ✅ `.claude/commands/pm/README.md`
8. ~~Update `workflows.md`~~ ✅ Added Agent Execution section

**Part B: Pilot Agents (8-10h) — IN PROGRESS (agents created, validation pending)**
1. ~~Implement 4 pilot agents~~ ✅
   - `banking-agent` ✅ v3 (IETF idempotency, Serializable+P2034, banker's rounding, PSD3)
   - `ui-agent` ✅ v3 (WCAG 2.2, Next.js 16 "use cache", React Compiler, CVE-2025-29927)
   - `security-agent` ✅ v3 (OWASP 2025, RLS, IDOR prevention, Redis rate limiting)
   - `compliance-agent` ✅ v3 (GAAP continuous auditing, SOX hash chains, IFRS 18, PCI DSS v4.0.1)
2. **Validate each agent prompt with review agents before finalization:** (PENDING)
   - Call `financial-data-validator` (verify financial patterns accuracy - journal entries, double-entry, etc.)
   - Call `architecture-strategist` (verify architectural patterns match codebase)
   - Call `fastify-api-reviewer` (verify API patterns - route → schema → service)
   - Call `nextjs-app-router-reviewer` (verify frontend patterns - Server Components, async params)
   - Fix any critical issues found before creating next agent
   - **Prevents code drift:** Ensures agent prompts match actual codebase implementation
3. Create domain/technical context files
4. Test single-agent execution with 2 real tasks
5. Test parallel execution with 3 independent tasks

**Part C: Documentation (2h)**
1. Update workflows.md with execution agent docs
2. Create agent coordination guide
3. Document worktree workflow for future agents

**Acceptance criteria:**
- [ ] All 4 pilot agent prompts validated by review agents and fixed before finalization
- [ ] `/pm:execute banking DEV-15` spawns banking-agent in worktree, builds feature, calls security + compliance + review agents, merges cleanly
- [ ] `/pm:execute ui DRY-11` spawns ui-agent, extracts StatusBadge components to packages/ui, commits
- [ ] `/pm:execute-parallel DEV-15 UX-19 DRY-11` spawns 3 agents simultaneously, all complete without conflicts
- [ ] security-agent BLOCKS commit if tenant isolation missing (test with intentionally broken code)
- [ ] compliance-agent BLOCKS commit if audit log missing on financial change

**Validation lessons learned (banking-agent):**
- ✅ **Journal entry pattern:** Review caught reversed DR/CR sides (bank accounts increase with debits, not credits)
- ✅ **Server Component pattern:** Review caught HTTP waterfall (should fetch directly from service, not via apiClient)
- ✅ **Next.js 16 pattern:** Review caught missing async params pattern (must `await params` before destructuring)
- ✅ **Critical pitfalls:** Review identified missing anti-patterns (atomic operations, balance updates)
- **Takeaway:** Validating agent prompts with review agents before creating more prevents code drift and ensures accuracy

**Files to create:**
```
.claude/
├── agents/
│   ├── banking-agent.md
│   ├── ui-agent.md
│   ├── security-agent.md
│   ├── compliance-agent.md
│   ├── _template.md
│   └── _orchestrator-guide.md
├── commands/pm/
│   ├── execute.md
│   └── execute-parallel.md
├── context/
│   ├── banking.md          # Domain context
│   ├── ui-patterns.md      # Design system patterns
│   ├── security-rules.md   # Security enforcement rules
│   └── compliance-rules.md # Financial compliance checklist
└── scripts/
    ├── worktree-create.sh
    ├── worktree-cleanup.sh
    ├── worktree-status.sh
    └── agent-orchestrator.ts
```

### Phase 2: Domain Coverage (Week 3 — 6-8h)

**Goal:** Add remaining 6 domain agents

**Tasks:**
1. Implement `accounting-agent`, `invoicing-agent`, `clients-agent`, `vendors-agent`, `planning-agent`, `insights-agent`, `services-agent`
2. Create domain context files (`.claude/context/{domain}.md`)
3. Test each agent with 1-2 real tasks from TASKS.md
4. Document agent responsibilities in workflows.md

**Acceptance criteria:**
- [ ] All 8 domain agents implemented and tested
- [ ] Each agent successfully completes at least 1 real task
- [ ] Context files prevent hallucination (agents know existing patterns)

### Phase 3: Technical Layer Agents (Week 4 — 4-6h)

**Goal:** Add 4 technical specialists

**Tasks:**
1. Implement `api-agent`, `web-agent`, `ui-agent`, `db-agent`
2. Test delegation pattern (domain agent → technical agent)
3. Create technical context files (API patterns, Next.js patterns, etc.)

**Acceptance criteria:**
- [ ] `banking-agent` successfully delegates DB schema change to `db-agent`
- [ ] `ui-agent` can extract shared component to packages/ui independently

### Phase 4: Smart Task Picker (Week 5 — 2-3h)

**Goal:** Implement `/pm:next` — AI selects optimal task

**Tasks:**
1. Create task analysis logic (parse TASKS.md, check dependencies, filter by status)
2. Implement priority scoring (critical > high, unblocked > blocked, etc.)
3. Add domain awareness (suggest banking tasks if banking-agent is available)
4. Create `/pm:next` command

**Acceptance criteria:**
- [ ] `/pm:next` suggests task with reasoning (priority, unblocked, agent available)
- [ ] Respects dependencies ([needs: X] tasks are skipped if X not done)
- [ ] Explains why each task was chosen

**Algorithm:**
```typescript
function selectNextTask(tasks: Task[], agents: Agent[]): TaskSuggestion {
  const candidates = tasks
    .filter(t => t.status === 'ready')               // Only unblocked
    .filter(t => !hasDependencies(t) || depsComplete(t)) // Dependencies met
    .filter(t => agentAvailable(t.domain, agents))    // Agent not busy
    .sort((a, b) => {
      if (a.priority !== b.priority) return priorityScore(a) - priorityScore(b);
      if (a.effort !== b.effort) return a.effort - b.effort; // Prefer smaller tasks
      return 0;
    });

  return {
    taskId: candidates[0].id,
    reasoning: `Selected ${candidates[0].id} because: ${getPriorityReason(candidates[0])}, unblocked, ${candidates[0].domain}-agent available`
  };
}
```

### Phase 5: Advanced Features (Week 6+ — As Needed)

**Goal:** Refinements based on real-world usage

**Potential tasks:**
1. Auto-dependency detection (agent analyzes code, suggests related tasks)
2. Smart conflict resolution (orchestrator detects conflicts, suggests resolution)
3. Agent learning (capture patterns from completed tasks, improve future runs)
4. Cost optimization (agent decides when to use Haiku vs Opus)
5. Progress streaming (real-time updates from parallel agents)

---

## Agent Context Architecture

Each execution agent loads layered context:

### Layer 1: Global (Always Loaded)
- `CLAUDE.md` — Core invariants, tech stack
- `.claude/rules/*.md` — Financial rules, API conventions, etc.
- `MEMORY.md` — Current state, known issues

### Layer 2: Domain-Specific (Loaded by Domain Agents)
- `.claude/context/banking.md` — Banking domain rules, models, existing endpoints
- `.claude/context/accounting.md` — Accounting rules, GL logic, report patterns
- etc.

### Layer 3: Task-Specific (Loaded on Execution)
- `TASKS.md` entry for current task
- Enrichments from `.claude/task-enrichments.json` (files, acceptance criteria)
- Related files (auto-detected from git history or explicitly in enrichment)

**Example (banking-agent executing DEV-46):**
```markdown
# Banking Agent Context for DEV-46

## Global Context (Layer 1)
- Tech: Next.js 16, Fastify, Prisma, PostgreSQL
- Invariants: Integer cents, tenant isolation, double-entry, soft delete
- Patterns: Route → Schema → Service → Prisma

## Domain Context (Layer 2 - .claude/context/banking.md)
### Banking Domain Rules
- All monetary amounts in integer cents
- Transfers create journal entries (DR from account, CR to account)
- Only accounts with overdraft-allowed can go negative
- Multi-currency transfers require exchange rate

### Existing Models
- Account (id, entityId, name, type, currency, currentBalance)
- Transaction (id, accountId, amount, type, categoryId)
- Transfer (NEW - not yet implemented)

### Existing Endpoints
- GET /api/banking/accounts
- POST /api/banking/accounts
- GET /api/banking/transactions
- POST /api/banking/transactions/import

## Task Context (Layer 3 - TASKS.md + enrichments)
**Task:** DEV-46 — Banking transfers backend API + wire transfers page

**Acceptance Criteria:**
- [ ] POST /api/banking/transfers creates transfer + journal entry
- [ ] Validates sufficient balance (unless overdraft-allowed)
- [ ] Creates 2 journal lines (DR from, CR to)
- [ ] Frontend page at /banking/transfers with transfer form
- [ ] 24 tests covering happy path + edge cases

**Files (from enrichment):**
- apps/api/src/domains/banking/services/ (add transfer.service.ts)
- apps/api/src/domains/banking/routes/ (add transfer.ts)
- apps/web/src/app/(dashboard)/banking/transfers/ (create page)

**Dependencies:** None (unblocked)
```

---

## Success Metrics

### Phase 1 (Pilot)
- ✅ 2 execution agents functional (banking, test)
- ✅ 5 tasks completed via agents (vs 0 currently)
- ✅ 0 hallucinations (agents load correct context)

### Phase 2 (Domain Coverage)
- ✅ 8 execution agents covering all domains
- ✅ 30 tasks completed via agents
- ✅ Agent completion rate >90% (agent finishes without human intervention)

### Phase 3 (Technical Specialists)
- ✅ 4 technical agents functional
- ✅ 1 complex multi-agent task completed (domain agent delegates to 3+ technical agents)

### Phase 4 (Smart Picker)
- ✅ `/pm:next` selects correct task 95%+ of time
- ✅ Dependency detection 100% accurate
- ✅ Saves 5+ min per task (no manual task selection)

### Phase 5 (Parallel Execution)
- ✅ 3+ tasks completed in parallel
- ✅ Zero merge conflicts on independent tasks
- ✅ 2-3x speedup on parallelizable work

---

## Comparison: Our Approach vs CCPM

| Aspect | CCPM | Our Plan (Phase 1-4) | Our Plan (Phase 5) |
|--------|------|----------------------|--------------------|
| **Execution agents** | UI/API/DB specialists | Domain specialists (banking/accounting/etc.) | Both domain + tech specialists |
| **Parallelization** | Yes (worktrees) | No (sequential) | Yes (worktrees) |
| **Review agents** | None | 13 specialized QA agents | 13 specialized QA agents |
| **Task picker** | `/pm:next` | `/pm:next` | `/pm:next` |
| **Context isolation** | `.claude/epics/` (gitignored) | `.claude/agents/` + `.claude/context/` | Worktrees (git branches) |
| **Coordination** | GitHub Issues | TASKS.md (+ Linear sync) | TASKS.md + worktree orchestrator |

**Key difference:** CCPM focuses on **parallel execution** (worktrees). We focus on **domain specialization + quality gates** (execution agents + review agents).

---

## Decisions Made

1. **✓ Parallel from day 1:** Worktrees included in Phase 1 (not deferred)
2. **✓ Security + Compliance agents:** Proactive enforcement during build, not just review after
3. **✓ Phase 1 pilot:** banking-agent + ui-agent + security-agent + compliance-agent (4 agents)
4. **✓ TASKS.md over GitHub Issues:** Keep current system, no migration needed
5. **✓ Agent ownership:** 1 coordinator per task, can delegate to technical/security/compliance agents
6. **✓ Cost mitigation:** Haiku for execution, Opus for complex review. Est. 40-60% cost increase (acceptable for 3x speed)
7. **✓ Context isolation:** Worktrees = fresh git state, agents load layered context per run

## Open Questions (To Resolve During Implementation)

1. **Merge conflict strategy:** Auto-merge if tests pass, or always require human approval?
   - **Proposal:** Auto-merge if (a) no conflicts detected, (b) all tests pass, (c) security/compliance pass

2. **Agent failure handling:** If 1 of 3 agents fails, do we rollback all or keep successful ones?
   - **Proposal:** Keep successful, mark failed task for retry, notify user

3. **Worktree cleanup timing:** Delete immediately after merge, or keep for 24h for debugging?
   - **Proposal:** Keep for 1 hour, auto-cleanup if no errors

4. **Security/compliance override:** Can user override agent block, or is it absolute?
   - **Proposal:** Critical issues = absolute block. Medium/Low = warning + user can proceed

---

## Next Steps

**Immediate (This Session):**
1. ✅ Create this plan
2. ✅ User approved: parallel model + security/compliance agents + banking/ui pilot
3. ⏭️ Begin Phase 1 implementation (12-16h over next 2-3 sessions)

**Phase 1 Sprint (Week 1-2):**

**Session 1 (4-5h): Infrastructure**
1. Create directory structure (`.claude/agents/`, `.claude/context/`, `.claude/scripts/`)
2. Implement worktree management scripts (create, cleanup, status)
3. Create agent template with security/compliance gate pattern
4. Test worktree creation/merge with dummy agents

**Session 2 (4-5h): Pilot Agents**
1. Implement banking-agent (loads banking context, builds features, calls gates)
2. Implement ui-agent (design system specialist, component extraction)
3. Implement security-agent (tenant isolation check, auth middleware validation)
4. Implement compliance-agent (audit log verification, financial data integrity)

**Session 3 (4-5h): Commands + Testing**
1. Create `/pm:execute` command (single agent workflow)
2. Create `/pm:execute-parallel` command (multi-agent orchestration)
3. Test single agent with DEV-15 (banking)
4. Test parallel with 3 tasks (banking + ui + accounting)
5. Verify security/compliance agents can block bad commits

**After Phase 1:**
- Document lessons learned
- Measure: time saved, quality improvement, cost increase
- Decide if Phase 2 (domain coverage) worth the investment

---

_End of plan. Ready for implementation pending user approval._
