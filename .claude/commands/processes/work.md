---
name: processes:work
description: Execute implementation plans with intelligent agent delegation and real-time visibility
argument-hint: "[plan-file] [--isolated] [--no-agents]"
---

# Workflow: Work (Enhanced)

Execute implementation plans with **intelligent agent delegation** and **real-time file visibility**.

**Pipeline:** Plan → **Work** → Review
**Modes:** Main branch (default, visible) | Worktree (--isolated, safe)
**When to use:** After creating a plan with `/processes:plan`.

---

## Arguments & Modes

```bash
/processes:work                      # Main branch, auto-detect plan, use agents intelligently
/processes:work --isolated           # Worktree mode (safe experimentation)
/processes:work --no-agents          # Force single-agent mode (no delegation)
/processes:work docs/plans/feature.md  # Explicit plan file
```

**Execution modes:**
- **Main branch** (default) — Changes visible in IDE, fast feedback loop
- **Worktree** (`--isolated`) — Isolated environment, safe for risky refactors
- **Auto-detect plan** — Finds most recent plan file if not specified
- **Agent delegation** — Uses specialized agents intelligently (can disable with `--no-agents`)

---

## Phase 0: Mode Selection & Setup

### Step 1: Parse arguments

```python
def parse_args(args: list[str]) -> Config:
    config = {
        'mode': 'main',        # main | worktree
        'use_agents': True,    # intelligent delegation
        'plan_file': None      # auto-detect if None
    }

    for arg in args:
        if arg == '--isolated':
            config['mode'] = 'worktree'
        elif arg == '--no-agents':
            config['use_agents'] = False
        elif arg.endswith('.md'):
            config['plan_file'] = arg

    return config
```

### Step 2: Find plan file

If not specified, auto-detect:
```bash
# Find most recent plan file
ls -t docs/plans/*.md | head -1
```

Or search by keyword from user message.

### Step 3: Setup environment

```bash
git status  # Verify clean working directory
```

**If mode == 'main':**
- Work directly on current branch
- Create feature branch if on main

**If mode == 'worktree':**
- Create isolated worktree:
  ```bash
  mkdir -p .worktrees
  git worktree add .worktrees/work-$(date +%s) -b feature/work-session
  cd .worktrees/work-$(date +%s)
  ```

---

## Phase 1: Plan Analysis & Agent Assignment

### Step 1: Load plan

```
Read docs/plans/[plan-name].md
```

Extract:
- Task list with file locations
- Success criteria
- Dependencies between tasks
- High-risk tasks (financial, security, schema)

### Step 2: Classify tasks & assign agents

**For each task in plan:**

```python
def classify_and_assign(task: PlanTask) -> TaskAssignment:
    # Classify complexity
    complexity = 'simple' if task.files <= 2 and task.effort < '1h' else 'complex'

    # Determine scope
    scope = infer_scope(task.files)  # frontend, backend, schema, full-stack

    # Decide delegation
    should_delegate = (
        config.use_agents and
        complexity == 'complex' or
        scope == 'full-stack' or
        task.risk == 'high'
    )

    # Select agent if delegating
    agent = select_agent(scope) if should_delegate else 'main'

    return {
        'task': task,
        'complexity': complexity,
        'scope': scope,
        'delegate_to': agent,
        'files': task.files
    }
```

**Agent selection mapping:**

| Scope | Complexity | Delegate to |
|-------|-----------|-------------|
| Frontend | Simple | main (direct) |
| Frontend | Complex | `web-agent` |
| Backend | Simple | main (direct) |
| Backend | Complex | `api-agent` |
| Schema | Any | `db-agent` |
| Full-stack | Any | Multiple agents sequentially |
| Financial | Any | `api-agent` + `compliance-agent` review |
| Security | Any | `security-agent` review after |

### Step 3: Show execution plan

```markdown
📋 Execution Plan

**Plan:** docs/plans/banking-transfers.md
**Mode:** [Main branch | Worktree isolated]
**Agent delegation:** [Enabled | Disabled]

Tasks:
1. ✅ Schema changes (db-agent) - 30 min
2. ✅ API routes + service (api-agent) - 1 hour
3. ✅ Frontend form (web-agent) - 45 min
4. ⚡ Tests (main agent - simple) - 30 min

Total: 2h 45m estimated
Delegation: 3 agents + main

Continue? [Y/n]
```

---

## Phase 2: Execute Tasks (Enhanced with Agent Delegation)

Use TodoWrite to track each task from the plan. Mark tasks `in_progress` one at a time.

### Per-Task Loop

For each task in the plan:

#### Decision: Direct execution or delegate?

```python
if task.delegate_to == 'main':
    # Execute directly (current behavior)
    execute_task_directly(task)
else:
    # Delegate to specialized agent (NEW)
    execute_with_agent(task.delegate_to, task)
```

---

### Path A: Direct Execution (Simple Tasks)

**Used for:** Single-file changes, quick fixes, simple additions

**1. Investigate** — Understand before changing:
- Read the files you plan to change AND their callers
- Search MEMORY topic files for prior art
- Ask: WHY does the current code exist this way?

**2. Review Lens** — Quick pre-check (same as before)

**3. Implement** — Follow existing patterns

**3a. Capture Decisions** (if applicable) — If making non-trivial implementation choice:
- Multiple ways to solve the problem → document why you chose one
- Trade-offs between approaches → capture alternatives considered
- Use `.claude/decisions/TEMPLATE.md` to create decision file
- Only for significant choices, not routine coding

**4. Test** — Run tests after implementation

**5. Verify** — Check success criteria

**6. Commit** — If slice is complete and tests pass

---

### Path B: Agent Delegation (Complex Tasks) ✨ NEW

**Used for:** Multi-file changes, cross-domain work, high-risk tasks

#### Step 1: Announce delegation

```markdown
📋 Task 2/8: API routes + service

Delegating to: api-agent
Scope: Backend
Files: 3 files in apps/api/src/domains/banking/
Estimated: 1 hour

Agent will:
1. Read existing route patterns
2. Create transfer.schema.ts
3. Implement route handler
4. Create service methods
5. Write route tests

You'll see each file change in real-time below. ⏸️ You can pause/give feedback anytime.
```

#### Step 2: Launch agent with progress tracking

```typescript
// Launch agent (foreground, not background)
const agent = await Task({
    subagent_type: task.delegate_to,  // e.g., 'api-agent'
    prompt: `
        Execute this task: ${task.description}

        Plan context: ${task.context_from_plan}
        Files to modify: ${task.files.join(', ')}
        Success criteria: ${task.acceptance_criteria}

        CRITICAL - Real-time Progress Reporting:
        Before touching each file, announce:
        📝 PROGRESS: Reading {filename}
        📝 PROGRESS: Editing {filename}:line - {what you're changing}
        📝 PROGRESS: Testing {test-file}

        After each file completes:
        ✅ COMPLETE: {filename} - {summary}

        If you encounter issues or need user input:
        ⏸️ PAUSE: {question or issue}

        Available related agents (for context awareness):
        ${list_other_agents_in_plan()}

        Execute following all project rules and invariants.
    `,
    model: 'sonnet',  // Use sonnet for execution (haiku too limited)
});
```

#### Step 3: Stream progress to user

Parse agent output for progress markers and update display:

```
api-agent working on Task 2/8...

📝 Reading apps/api/src/domains/banking/routes/account.ts (patterns)
📝 Creating apps/api/src/domains/banking/schemas/transfer.schema.ts
   └─ Adding: FromAccountSchema, ToAccountSchema, AmountSchema
✅ transfer.schema.ts complete

📝 Editing apps/api/src/domains/banking/routes/transfer.ts
   └─ Line 15: Adding POST /transfers endpoint
   └─ Line 42: Zod validation middleware
   └─ Line 68: Error handling for insufficient funds
✅ transfer.ts complete (124 lines)

📝 Creating apps/api/src/domains/banking/services/transfer.service.ts
   └─ validateTransfer() - double-entry check
   └─ createTransfer() - transaction-safe creation
✅ transfer.service.ts complete (287 lines)

📝 Testing apps/api/src/domains/banking/routes/__tests__/transfer.test.ts
   └─ Running test suite...
   └─ 12/12 tests passing ✅

Files modified:
  + apps/api/src/domains/banking/schemas/transfer.schema.ts (new)
  + apps/api/src/domains/banking/routes/transfer.ts (modified)
  + apps/api/src/domains/banking/services/transfer.service.ts (new)
  + apps/api/src/domains/banking/routes/__tests__/transfer.test.ts (new)

⏸️  Task complete. Continue to next task? [Y/n/review]:
```

#### Step 4: User checkpoint

After each delegated task completes, **pause and ask**:

```
Options:
  Y - Continue to next task
  n - Stop here, let me review manually
  review - Show me git diff of changes
  feedback: <msg> - Give agent direction for next task
```

This gives you control without losing momentum.

#### Step 5: Commit task slice

```bash
git add [files from this task]
git commit -m "feat(${domain}): ${task.description}

Co-Authored-By: ${agent-name}
Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

---

### Agent Awareness & Coordination (NEW)

When delegating to agents, they know about each other:

```
Agents in this plan execution:
- db-agent: Schema changes (Task 1)
- api-agent: Routes + service (Task 2)
- web-agent: Frontend form (Task 3)
- test-agent: Test suite (Task 4)

Current: api-agent (Task 2)
Dependencies: Requires db-agent Task 1 complete ✅
Next: web-agent will use your API endpoints

If you encounter cross-domain issues, note them for the next agent.
```

This prevents:
- ❌ Agents duplicating work
- ❌ Agents unaware of dependencies
- ✅ Smooth handoffs between agents
- ✅ Integration point awareness

---

### When the Plan is Wrong

If a task takes 2x expected effort or reveals a design flaw:

1. **STOP** — don't power through a broken plan
2. Update the plan file with what you learned
3. Inform the user of the deviation
4. Get alignment before continuing

This is normal — ~30% of plans need adjustment during implementation.

### High-Risk Task Review (Auto-triggered)

For tasks involving financial logic, auth, or schema:

```
✅ api-agent completed Task 2: Transfer service

🔍 Auto-triggering compliance review...

Running: financial-data-validator (5 min)
├─ Checking double-entry balance
├─ Verifying integer cents
├─ Checking soft delete
└─ ✅ Compliance passed

Continue to Task 3? [Y/n]
```

**Auto-review triggers:**
- Financial logic → `financial-data-validator`
- Auth changes → `security-sentinel`
- Schema migrations → `prisma-migration-reviewer`

---

## Phase 3: Integration & Wrap Up

### Update Plan

Mark completed tasks in the plan file:

```markdown
- [x] Task 1: Create schema
- [x] Task 2: Create service
- [ ] Task 3: Write tests (in progress)
```

### Update TASKS.md

If the plan completes a task from TASKS.md, mark it done.

### Capture Session Knowledge

Suggest running `/processes:end-session` to capture:

- What was built/fixed during this work session
- Any patterns discovered or gotchas encountered
- Unfinished work context for next instance

This feeds into `/processes:eod` for daily artifact updates.

### Final Validation

After all tasks complete:

- Run full test suite: `npx vitest run`
- Suggest: "Run `/processes:review` for final multi-agent validation"

---

## Progress Tracking

Use TodoWrite throughout. Update immediately when tasks complete — don't batch.

```
TodoWrite: [
  { content: "Create schema", status: "completed", activeForm: "Creating schema" },
  { content: "Create service", status: "in_progress", activeForm: "Creating service" },
  { content: "Write tests", status: "pending", activeForm: "Writing tests" }
]
```

---

---

## Real-Time Visibility Example

**What you see during agent delegation:**

```
📋 Task 2/4: API implementation (api-agent)

├─ 📝 Reading apps/api/src/domains/banking/routes/account.ts (patterns)
├─ 📝 Creating apps/api/src/domains/banking/schemas/transfer.schema.ts
│   └─ Zod schemas: CreateTransferSchema, ListTransfersSchema
✅ transfer.schema.ts complete (45 lines)

├─ 📝 Editing apps/api/src/domains/banking/routes/transfer.ts
│   └─ Line 18: POST /transfers endpoint
│   └─ Line 42: Validation middleware
│   └─ Line 76: Error handling
✅ transfer.ts complete (156 lines)

├─ 📝 Creating apps/api/src/domains/banking/services/transfer.service.ts
│   └─ createTransfer() - transaction-safe
│   └─ Double-entry JE creation
⏸️  PAUSE: Should transfers create journal entries immediately or batch at EOD?

[User responds: "Immediately"]

├─ 📝 Continuing transfer.service.ts:145
│   └─ Adding immediate JE creation
✅ transfer.service.ts complete (287 lines)

├─ 📝 Running tests
│   └─ 12/12 passing ✅

✅ Task 2 complete (58 min)

Files modified:
  + apps/api/src/domains/banking/schemas/transfer.schema.ts
  + apps/api/src/domains/banking/routes/transfer.ts
  + apps/api/src/domains/banking/services/transfer.service.ts
  + apps/api/src/domains/banking/routes/__tests__/transfer.test.ts

⏸️  Continue to Task 3 (web-agent)? [Y/n/review]:
```

**You have full visibility and can intervene anytime!**

---

## Mode Comparison

| Aspect | Main Branch (Default) | Worktree (`--isolated`) |
|--------|----------------------|-------------------------|
| **IDE visibility** | ✅✅ Changes show live | ⚠️ Must open worktree folder |
| **Testing** | ✅ Works immediately | ⚠️ cd to worktree |
| **Feedback speed** | ✅✅ Instant | ⚠️ Slower |
| **Safety** | ⚠️ Main dirty if fails | ✅ Main untouched |
| **Cleanup** | ⚠️ git reset needed | ✅ Delete worktree |
| **Merge overhead** | ✅ None | ⚠️ Merge step |
| **Use when** | Normal work | Risky experiments |

---

_Enhanced work flow. Intelligent agent delegation. Real-time progress. Hybrid main/worktree. User checkpoints throughout._
