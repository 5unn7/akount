---
name: processes:claim
description: Claim tasks with intelligent agent delegation and real-time execution
argument-hint: "[task-id] [--domain <name>] [--isolated] [--no-agents] [--quick-wins]"
---

# Workflow: Claim Task (Enhanced)

Claim and execute tasks with **intelligent agent delegation** and **real-time visibility**.

**Modes:** Main branch (default) | Worktree (`--isolated`)
**Features:** Auto-agent selection, progress streaming, user checkpoints

---

## Arguments

```bash
/processes:claim [task-id]                    # Claim specific task
/processes:claim --domain <name>              # Filter by domain
/processes:claim --effort <range>             # Filter by effort (<30m, <1h, <2h)
/processes:claim --priority <level>           # Filter by priority
/processes:claim --quick-wins                 # High priority + <1h tasks
/processes:claim --isolated                   # Use worktree (safe mode)
/processes:claim --no-agents                  # No agent delegation
/processes:claim                              # Smart recommendations
```

**New flags:**
- `--isolated` — Execute in worktree (safe for risky tasks)
- `--no-agents` — Force direct execution (no delegation)

---

## Arguments

```
/processes:claim [task-id]              # Claim specific task (e.g., SEC-8)
/processes:claim --domain <name>        # Filter by domain (security, performance, ux, dashboard)
/processes:claim --effort <range>       # Filter by effort (<30m, <1h, <2h, >2h)
/processes:claim --priority <level>     # Filter by priority (critical, high, medium, low)
/processes:claim --quick-wins           # Show high-priority tasks <1h
/processes:claim --rebuild-index        # Regenerate TASKS.md index and exit
/processes:claim                        # Smart mode: context-aware recommendations
```

---

## Workflow

### Step 0: Parse Arguments & Check for Special Commands (NEW)

**If `--rebuild-index`:**
```bash
node .claude/scripts/regenerate-task-index.js
exit
```

**If filter arguments provided** (`--domain`, `--effort`, `--priority`, `--quick-wins`):
- Extract task index from TASKS.md (fast path, see Step 1)
- Apply filters (see Step 2)
- Show filtered results
- Ask user which task to claim

**If no arguments:**
- Use Smart Defaults (see Step 3)

**If `[task-id]` provided:**
- Continue to Step 4 (existing flow)

---

### Step 1: Extract Task Index (MODIFIED - Fast Path)

**Try fast path first** (read index comment instead of full TASKS.md):

```bash
# Extract JSON index from HTML comment
INDEX=$(grep -Pzo '(?s)<!-- TASK-INDEX:START.*?TASK-INDEX:END -->' TASKS.md)

if [ -n "$INDEX" ]; then
  # Parse JSON (strip comment markers)
  TASKS_JSON=$(echo "$INDEX" | sed 's/<!-- TASK-INDEX:START (auto-generated, do not edit manually)//' | sed 's/TASK-INDEX:END -->//')
  echo "✅ Using task index (fast path)"
else
  echo "⚠️ Index not found, falling back to full TASKS.md read..."
  # Fallback: read full TASKS.md (current behavior)
fi
```

**Why this matters:**
- Index read: ~2K tokens (JSON only)
- Full read: ~15K tokens (all markdown)
- **Savings: 87% per claim**

---

### Step 2: Apply Filters (NEW)

**If `--domain <name>`:**
```javascript
// Parse index JSON
const index = JSON.parse(TASKS_JSON);
// Get tasks for domain
const tasks = index.byDomain[domain] || [];
// Show filtered list
```

**If `--effort <range>`:**
```javascript
const effortMap = {
  '<30m': 'quick',    // <30min
  '<1h': 'short',     // 30min-2h
  '<2h': 'medium',    // 2-4h
  '>2h': 'long'       // >4h
};
const tasks = index.byEffort[effortMap[range]] || [];
```

**If `--priority <level>`:**
```javascript
const tasks = index.byPriority[level.toLowerCase()] || [];  // critical/high/medium/low
```

**If `--quick-wins`:**
```javascript
const tasks = index.quickWins || [];  // Pre-filtered: high priority + <1h + ready
```

**If multiple filters (combine):**
```javascript
// Intersect arrays
const domainTasks = index.byDomain.security;
const quickTasks = index.byEffort.quick;
const filtered = domainTasks.filter(id => quickTasks.includes(id));
```

**Output format:**
```markdown
## {Domain} Tasks ({N} found)

- **SEC-9:** CSRF protection review (1h) 🟠 High
- **SEC-12:** File upload quota enforcement (1h) 🟡 Medium

💡 Use `/processes:claim SEC-9` to claim a task
```

---

### Step 3: Smart Defaults (NEW)

**When user runs `/processes:claim` with no arguments:**

1. **Analyze git history** (detect domain from recent work):
```bash
git log -3 --oneline --name-only | grep -E "apps/(web|api)" | head -10
```

2. **Extract domain from file paths:**
   - `apps/web/src/components/dashboard/` → domain: `dashboard`
   - `apps/api/src/domains/banking/` → domain: `security` or `performance` (banking-related)
   - `apps/api/src/domains/accounting/` → domain: `financial`
   - Pattern: `apps/{web|api}/.*/domains/{domain}/` or `components/{domain}/`

3. **Build recommendation**:
```markdown
**Recommended Tasks:**

📂 **{Detected Domain} Tasks** (from recent commits in `apps/web/components/dashboard/`):
- UX-9: Fix SVG gradient ID collision (15m) 🟠 High
- DS-3: Replace hover:glass-3 (10m) 🟡 Medium
- DEV-4: Type entity maps (15m) 🟡 Medium
- DRY-7: Extract data transformers (30m) 🟡 Medium

⚡ **Quick Wins** (<1h, high priority, any domain):
- FIN-13: Fix UpcomingPayments.amount type (15m) 🟠 High
- SEC-9: CSRF protection review (1h) 🟠 High
- UX-2: GL Account dropdown (1h) 🟠 High

---
💡 **Filters:** `/processes:claim --domain dashboard` · `/processes:claim --quick-wins`
```

4. **Fallback** (if no git context):
   - Show top 10 ready tasks sorted by priority + effort
   - Same format as above but without "Detected Domain" section

5. **No recommendations at all?**
   - Show usage examples with filters
   - Suggest running `/processes:begin` for full standup

---

### Step 4: Read ACTIVE-WORK.md (5 seconds)

```bash
cat ACTIVE-WORK.md
```

Extract:
- Current sessions (who's working on what)
- Task allocation (reserved tasks)
- Last update timestamp

### Step 5: Check Task Availability (10 seconds)

If `[task-id]` argument provided:

```bash
# Fast lookup using index
TASK_EXISTS=$(echo "$TASKS_JSON" | jq -r ".tasks[\"$TASK_ID\"] // empty")

if [ -z "$TASK_EXISTS" ]; then
  echo "❌ Task $TASK_ID not found in TASKS.md"
  exit 1
fi

# Check if task is already claimed in ACTIVE-WORK.md
grep "$TASK_ID" ACTIVE-WORK.md
```

**If task claimed by another agent:**
- Output conflict warning (see Scenario 2)
- Use index to suggest next available tasks:
  ```bash
  # Get ready tasks from same domain
  DOMAIN=$(echo "$TASK_EXISTS" | jq -r '.domain')
  ALT_TASKS=$(echo "$TASKS_JSON" | jq -r ".byDomain[$DOMAIN][] | select(. != \"$TASK_ID\")" | head -3)
  ```
- Ask user which task to claim instead

**If task available:**
- Proceed to Step 5b

---

### Step 5b: Load Rich Context (NEW — Plan-Driven Protocol)

After confirming task availability, check for rich context before starting work:

**1. Check Source column for `plan:` tag:**
```bash
# Extract source field from TASKS.md for this task
SOURCE=$(grep "| $TASK_ID |" TASKS.md | awk -F'|' '{print $NF}')
```

**If Source contains `plan:<filename>`:**
```bash
# Load the referenced plan file
Read docs/plans/<filename>
# Agent now has full sprint context: file paths, acceptance criteria, patterns
echo "📋 Plan loaded: docs/plans/<filename>"
```
The agent reads the relevant sections of the plan file and extracts:
- Affected file paths
- Pattern to follow
- Acceptance criteria
- Dependencies within the plan

**2. Check Source column for `[atomic]` tag:**
```
echo "⚡ Atomic task — no plan needed, proceed directly"
```
Skip context loading. Task is self-contained.

**3. Check cluster map for mini-plan context:**
```bash
# Read cluster map from task-enrichments.json
CLUSTER=$(jq -r '._clusterMap | to_entries[] | select(.value[] == "'$TASK_ID'") | .key' .claude/task-enrichments.json)

if [ -n "$CLUSTER" ]; then
  # Load mini-plan section
  Read docs/plans/mini-plans.md  # Agent searches for matching cluster heading
  echo "📋 Mini-plan loaded: $CLUSTER"
fi
```

**4. Check task-enrichments.json for direct enrichment:**
```bash
ENRICHMENT=$(jq -r ".\"$TASK_ID\" // empty" .claude/task-enrichments.json)
if [ -n "$ENRICHMENT" ]; then
  echo "📋 Enrichment loaded: files, verification, acceptance criteria"
fi
```

**5. No context found (fallback):**
```
⚠️ No plan, mini-plan, or enrichment found for this task.
Agent will investigate before coding (read files, grep patterns).
Consider running /processes:plan first for complex tasks.
```

**Context loading priority (first match wins):**
1. `plan:<filename>` → Full plan file (richest context)
2. `_clusterMap` match → Mini-plan section (medium context)
3. `task-enrichments.json` entry → Files + acceptance criteria (lightweight context)
4. `[atomic]` tag → No extra context needed (self-contained)
5. None of the above → Warn and investigate

**Output after context load:**
```markdown
## Context Loaded

**Type:** Plan / Mini-Plan / Enrichment / Atomic / None
**Files:** [list of affected files from context]
**Pattern:** [pattern to follow]
**Acceptance:** [criteria from context]
```

---

### Step 6: Update ACTIVE-WORK.md (10 seconds)

Add new session to "Current Sessions" table:

```markdown
| agent-[random-id] | [current-time] | [task-id]: [task-description] | in_progress | [current-branch] |
```

Add task to "Task Allocation" table:

```markdown
| [task-id] | [task-type] | agent-[random-id] | [current-time + 2 hours] |
```

Update "Last Updated" timestamp.

### Step 7: Update Agent Context in ACTIVE-WORK.md (NEW)

Add to "Agent Context" section (for smart defaults in future sessions):

```markdown
| agent-[id] | [last 5 task IDs] | [domain] | [timestamp] |
```

**Purpose:** Track agent's work patterns for personalized recommendations.

---

### Step 8: Create TodoWrite (15 seconds)

Based on task details **AND loaded context** (from Step 5b), create TodoWrite sub-tasks.

**If plan/mini-plan context was loaded:**
- Use the plan's file paths and acceptance criteria to generate specific sub-tasks
- Each sub-task should reference a specific file from the plan
- Include verification step from acceptance criteria

**If atomic task:**
- Generate 2-3 simple sub-tasks based on task description

**Example for DEV-122 (with mini-plan context):**

```
1. Create apps/web/src/app/(dashboard)/business/clients/[id]/page.tsx (server component)
2. Create client-detail-client.tsx with tabs: Overview, Invoice History, Payments
3. Add loading.tsx + error.tsx for loading/error states
4. Wire edit capability via existing ClientDetailPanel pattern
5. Verify: navigate to /business/clients/[id] shows full detail with all tabs
```

**Example for UX-41 (atomic — no plan needed):**

```
1. Find hardcoded 'CAD' in vendor/client pages
2. Replace with entity.functionalCurrency from context
3. Verify currency displays correctly
```

---

### Step 9: Output Dashboard (10 seconds)

```markdown
# Task Claimed: [task-id]

**Task:** [full description from TASKS.md]
**Priority:** [P0/P1/P2]
**Estimated Time:** [time from TASKS.md]
**Dependencies:** [none / list]

---

## Your Session

- **Agent ID:** agent-[id]
- **Started:** [timestamp]
- **Branch:** [current-branch]
- **Reserved Until:** [timestamp + 2 hours]

---

## Other Active Work

[Table from ACTIVE-WORK.md showing other agents' work]

---

## Next Steps

[TodoWrite items created above]

**Ready to start work on [task-id]!**
```

---

## Example Usage

**Scenario 1: User claims specific task**

```
User: /processes:claim SEC-6.1b

Agent:
1. Reads ACTIVE-WORK.md → no conflict
2. Reads TASKS.md → finds SEC-6.1b description
3. Updates ACTIVE-WORK.md with new session
4. Creates TodoWrite (4 items)
5. Outputs dashboard with task details
```

**Scenario 2: Task already claimed**

```
User: /processes:claim SEC-6.1b

Agent detects conflict:

⚠️ **Task Conflict: SEC-6.1b**

This task is currently claimed by agent-ab5c159:
- **Started:** 10:30 (45 min ago)
- **Expected completion:** ~15 min (likely finishing soon)

**Options:**
1. 🔄 Wait for completion (check back in 10 min)
2. 🆕 Pick different task:
   - SEC-6.1c: GL opening balance (1-2 hr)
   - QUAL-6.1a: Create loading templates (15 min)
3. 🤝 Coordinate (I can check recent commits to see if it's actually done)

Which would you like?
```

**Scenario 3: No task-id provided (Smart Mode - NEW)**

```
User: /processes:claim

Agent:
1. Extracts task index from TASKS.md (~2K tokens)
2. Checks git log -3 for recent file changes
3. Detects: apps/web/src/components/dashboard/MiniSparkline.tsx
4. Infers domain: "dashboard"

Output:

**Recommended Tasks:**

📂 **Dashboard Tasks** (from recent work in `apps/web/components/dashboard/`):
- UX-9: Fix SVG gradient ID collision (15m) 🟠 High
- DS-3: Replace hover:glass-3 (10m) 🟡 Medium
- DEV-4: Type entity maps (15m) 🟡 Medium
- DRY-7: Extract data transformers (30m) 🟡 Medium

⚡ **Quick Wins** (<1h, high priority):
- FIN-13: Fix UpcomingPayments.amount type (15m) 🟠 High
- SEC-9: CSRF protection review (1h) 🟠 High
- UX-2: GL Account dropdown (1h) 🟠 High

---
💡 **Filters:** `/processes:claim --domain dashboard` · `/processes:claim --quick-wins`

Which task would you like to claim?
```

**Token usage:** 4.5K (93% reduction from 66K)

---

**Scenario 4: Filtered search (NEW)**

```
User: /processes:claim --domain security --effort <1h

Agent:
1. Extracts index from TASKS.md
2. Intersects index.byDomain.security + index.byEffort.quick
3. Returns filtered results

Output:

## Security Tasks (<1h)

- **SEC-9:** CSRF protection review (1h) 🟠 High
- **SEC-12:** File upload quota enforcement (1h) 🟡 Medium

💡 Use `/processes:claim SEC-9` to claim

```

**Token usage:** 1.5K (98% reduction)

---

**Scenario 5: Quick wins (NEW)**

```
User: /processes:claim --quick-wins

Agent uses pre-filtered index.quickWins array

Output:

## Quick Wins (<1h, high priority)

- **FIN-13:** Fix UpcomingPayments.amount type (15m) 🟠 High
- **SEC-9:** CSRF protection review (1h) 🟠 High
- **UX-2:** GL Account dropdown (1h) 🟠 High
- **PERF-9:** Replace console.log with pino (2h) 🟠 High
- **DS-1:** Figma-to-code token sync (2h) 🟠 High

💡 Use `/processes:claim FIN-13` to claim
```

**Token usage:** 1.5K (98% reduction)

---

**Scenario 6: Rebuild index (NEW)**

```
User: /processes:claim --rebuild-index

Agent:
📊 Regenerating TASKS.md index...
✅ Updated existing index

📈 Index Stats:
   Total tasks: 84
   Ready: 50
   Quick wins: 18
   Domains: 13

✨ Index regenerated successfully!
```

---

## Phase 2: Task Execution (NEW - Intelligent Delegation)

### Step 1: Classify task & decide execution strategy

```python
def classify_task(task: Task, config: Config) -> Execution:
    # Parse from task description and enrichments
    complexity = 'simple' if task.files <= 2 and task.effort < '1h' else 'complex'
    scope = infer_scope(task.files or task.description)  # frontend, backend, schema
    risk = 'high' if any(kw in task.description.lower()
                         for kw in ['financial', 'auth', 'migration']) else 'normal'

    # Decide delegation
    should_delegate = (
        config.use_agents and  # --no-agents flag check
        (complexity == 'complex' or risk == 'high')
    )

    agent = select_agent(scope, risk) if should_delegate else 'main'

    return {
        'mode': config.mode,  # main | worktree
        'delegate_to': agent,
        'complexity': complexity,
        'scope': scope
    }
```

### Step 2: Setup execution environment

**If mode == 'main' (default):**
```bash
# Work on current branch
echo "🔧 Executing on main branch (changes visible in IDE)"
```

**If mode == 'worktree' (--isolated):**
```bash
# Create isolated worktree
mkdir -p .worktrees
git worktree add .worktrees/claim-${TASK_ID} -b task/${TASK_ID}
cd .worktrees/claim-${TASK_ID}
echo "🔒 Executing in worktree (isolated, safe)"
```

### Step 3: Execute with appropriate strategy

**Path A: Direct execution (simple tasks)**

```markdown
⚡ Executing directly (simple task)

Task: SEC-24 - Fix tenant isolation
Complexity: Simple (1 file)
Estimated: 15 min

Steps:
1. Read apps/api/src/domains/invoicing/routes/invoice.ts
2. Add tenantId filter
3. Test
4. Commit
```

**Path B: Agent delegation (complex tasks)**

```markdown
🤖 Delegating to api-agent (complex task)

Task: DEV-46 - Banking transfers backend
Complexity: Complex (8 files, 2 hours)
Scope: Backend + Schema
Risk: High (financial logic)

Agent will:
1. Create Prisma model (db-agent first)
2. Implement service layer
3. Create API routes
4. Write tests (24 tests)
5. Compliance review

You'll see real-time progress below ⬇️
```

### Step 4: Stream agent progress (same as work flow)

```
api-agent executing DEV-46...

📝 Reading existing transfer patterns
📝 Creating apps/api/src/domains/banking/schemas/transfer.schema.ts
   └─ Zod validation schemas
✅ transfer.schema.ts complete (67 lines)

📝 Editing apps/api/src/domains/banking/routes/transfer.ts
   └─ Line 24: POST /transfers endpoint
   └─ Line 58: GET /transfers list
✅ transfer.ts complete (189 lines)

📝 Running tests
   └─ 24/24 passing ✅

✅ Task complete (1h 52m)

Files modified:
  + apps/api/src/domains/banking/schemas/transfer.schema.ts
  + apps/api/src/domains/banking/routes/transfer.ts
  + apps/api/src/domains/banking/services/transfer.service.ts
  + ... (5 more files)

🔍 Auto-triggering compliance review (financial task detected)...
   ✅ Compliance passed

Ready to commit? [Y/n/review]:
```

### Step 5: Commit & update tracking

```bash
git add [modified files]
git commit -m "${task-type}(${domain}): ${task.title}

Task: ${TASK_ID}
Co-Authored-By: ${agent-name if delegated}
Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

**If in worktree mode:**
```bash
# Merge back to main
git checkout main
git merge --no-ff task/${TASK_ID}
git worktree remove .worktrees/claim-${TASK_ID}
```

Update TASKS.md status to done with commit hash.

---

## Agent Selection for Claims

**Auto-selected based on task:**

| Task Scope | Complexity | Agent Used |
|-----------|-----------|------------|
| Frontend (UX-, DS-) | Simple | main (direct) |
| Frontend | Complex | `web-agent` |
| Backend (DEV-, SEC-) | Simple | main (direct) |
| Backend | Complex | `api-agent` |
| Schema (any) | Any | `db-agent` |
| Financial (FIN-) | Any | `api-agent` + `compliance-agent` review |
| Security (SEC-) | High risk | `security-agent` |
| Performance (PERF-) | Multi-file | Scope-specific agent |

**User can override:**
- Use `--no-agents` to force direct execution
- Agent will still classify task and show what would have been delegated

---

## Real-Time Execution Example

```
User: /processes:claim DEV-46

📋 Task Claimed: DEV-46

**Task:** Banking transfers - backend implementation
**Priority:** 🟠 High
**Effort:** 2 hours
**Scope:** Backend + Schema
**Complexity:** Complex (8 files affected)

---

🤖 Auto-selected agent: api-agent
Reason: Complex backend task with financial logic

Execution mode: Main branch (use --isolated for worktree)
Agent delegation: Enabled (use --no-agents to disable)

Files that will be modified (from enrichments):
- packages/db/prisma/schema.prisma
- apps/api/src/domains/banking/schemas/transfer.schema.ts
- apps/api/src/domains/banking/routes/transfer.ts
- apps/api/src/domains/banking/services/transfer.service.ts
- ... (4 more)

Continue with api-agent? [Y/n/execute-directly]:

[User: Y]

🚀 Launching api-agent...

📝 Reading existing patterns in apps/api/src/domains/banking/
📝 Creating transfer.schema.ts
   └─ CreateTransferSchema, UpdateTransferSchema
✅ transfer.schema.ts complete (78 lines)

📝 Editing transfer.ts route handler
   └─ Line 15: POST /transfers
   └─ Line 42: GET /transfers
   └─ Line 89: GET /transfers/:id
✅ transfer.ts complete (167 lines)

[... continues with real-time updates ...]

⏸️  Task complete. Mark as done in TASKS.md? [Y/n]:
```

---

## Notes

**Difference from /processes:begin:**
- `claim` is lightweight (no git status, no industry intel, no pro tips)
- NOW includes intelligent execution (agent delegation)
- Focused on single-task completion
- Used for subsequent sessions within 2 hours

**Difference from /pm:execute:**
- `claim` shows real-time progress (not fire-and-forget)
- User can give feedback during execution
- Works on main branch by default (IDE visibility)
- Checkpoints after each major step

**When to use:**
- Quick task switching during active work day
- Want visibility into agent work
- Need to give feedback during execution

**When to use /pm:execute instead:**
- Running multiple tasks in parallel
- Don't need to watch (fire-and-forget)
- Trust agents completely

---

_Enhanced claim workflow. Intelligent agent delegation. Real-time visibility. Hybrid main/worktree modes._
