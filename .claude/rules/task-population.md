# Task Population Protocol

---
paths:
  - "**"
---

> Auto-loaded globally — ensures all skills write to TASKS.md with approval

## When a Skill Produces Actionable Items

After completing its core work, every skill MUST:

1. **Identify tasks** — Extract actionable items from its output
2. **Classify by domain** — Dev, Design System, Marketing & Content, Operations
3. **Assign priority** — Critical, High, Medium, Low
4. **Note dependencies** — `[needs: TASK-ID]` if this task requires another first
5. **Reserve IDs atomically** — Call `reserve-task-ids.js` to get unique IDs (see ID Reservation section below)
6. **Assign reserved IDs** — Map reserved IDs to tasks in order
7. **Justify** — Every task must have a `Source` (which skill created it) and a 1-line `Reason` explaining WHY it should exist
8. **Present for approval** — Show the user a formatted table of proposed tasks (with pre-assigned IDs) including source/reason
9. **User approves** — User can approve all, approve some, reject some, or edit before accepting
10. **Write approved tasks** — ONLY append user-approved tasks to TASKS.md (IDs already assigned, no collision risk)

## Approval Gate (MANDATORY)

**No task enters TASKS.md without explicit user approval.** The flow is:

```
Skill identifies tasks → Presents table with Source + Reason → User reviews →
  - "Approve all" → All tasks written to TASKS.md
  - "Approve selected" → Only checked tasks written
  - "Edit" → User modifies priority/effort/description, then approve
  - "Reject" → Tasks discarded, reason noted
```

**Presentation format for approval (use AskUserQuestion):**

| # | ID | Task | Domain | Priority | Source | Reason | Deps |
|---|-----|------|--------|----------|--------|--------|------|
| 1 | SEC-9 | Add rate limiting | Dev | High | review:security-sentinel | OWASP A7, no rate limiting on any endpoint | |
| 2 | DS-3 | Token sync pipeline | Design | High | brainstorm:design-tokens | Figma tokens drift from code | [needs: DS-1] |
| 3 | DEV-3 | Fix onboarding middleware | Dev | Critical | diagnose:middleware-bug | Middleware disabled, blocks resume | |

## Source Field (REQUIRED)

Every task in TASKS.md must have a `Source` that traces WHERE it came from:

| Source Format | Meaning |
|--------------|---------|
| `review:agent-name` | Created by a code review finding |
| `plan:plan-name` | Created as a step in an implementation plan |
| `brainstorm:topic` | Created from a brainstorm action item |
| `diagnose:bug-name` | Created from a bug diagnosis |
| `audit:audit-date` | Created from a health audit finding |
| `braindump:topic` | Created from multi-agent feedback |
| `manual` | Added directly by user or agent (ad-hoc) |

## Dependency Notation

Tasks can declare prerequisites using `[needs: ID]` and blockers using `[blocks: ID]`:

| ID | Task | Status | Deps | Source |
|----|------|--------|------|--------|
| DS-3 | Build token sync pipeline | blocked | [needs: DS-1] | brainstorm:tokens |
| SEC-9 | Add rate limiting | ready | [blocks: INFRA-2] | review:security |

When a task with `[needs: X]` is claimed, check if X is `done`. If not, warn the agent.

## ID Prefixes by Domain

| Domain | Prefixes |
|--------|----------|
| Dev | SEC, PERF, FIN, DRY, UX, TEST, DEV, ARCH |
| Design System | DS |
| Marketing & Content | MKT, CNT |
| Operations | INFRA, OPS |

## ID Reservation (Atomic)

**CRITICAL:** IDs must be reserved atomically to prevent collisions when multiple agents create tasks concurrently.

### Workflow

Before presenting tasks for approval, **reserve IDs** via the atomic ID service:

```bash
# Reserve 1 ID (default)
node .claude/scripts/reserve-task-ids.js SEC

# Reserve multiple IDs (batch - for reviews, plans with multiple tasks)
node .claude/scripts/reserve-task-ids.js UX 5

# Output (JSON):
# {"ids":["UX-61","UX-62","UX-63","UX-64","UX-65"],"reservedAt":"2026-02-19T18:00:00.000Z"}
```

**Steps:**
1. Identify N actionable tasks to create
2. Reserve N IDs for the appropriate prefix(es) via `reserve-task-ids.js`
3. Parse JSON output to get reserved IDs array
4. Assign reserved IDs to tasks
5. Present tasks for user approval (with pre-assigned IDs)
6. On approval: submit to inbox with reserved IDs OR write directly to TASKS.md
7. If using inbox: processor validates IDs and appends to TASKS.md

### Integration Example (from review skill)

```typescript
// After extracting tasks from review findings
const taskCount = findings.filter(f => f.actionable).length;

// Reserve IDs atomically
const reservation = await callTool('Bash', {
  command: `node .claude/scripts/reserve-task-ids.js SEC ${taskCount}`
});
const { ids } = JSON.parse(reservation.output);

// Assign reserved IDs to tasks
const tasks = findings.map((f, i) => ({
  id: ids[i],
  title: f.title,
  priority: f.severity,
  source: 'review:security-sentinel',
  // ... other fields
}));

// Present for approval (IDs already assigned)
await askUserApproval(tasks);

// On approval: submit to inbox
const inbox = JSON.parse(fs.readFileSync('.claude/task-inbox.json'));
inbox.tasks.push(...tasks);
fs.writeFileSync('.claude/task-inbox.json', JSON.stringify(inbox, null, 2));

// Process inbox (validates IDs, appends to TASKS.md)
await callTool('Bash', {
  command: 'node .claude/scripts/regenerate-task-index.js --process-inbox'
});
```

### Fallback (if service unavailable)

If ID reservation fails (timeout, counter file missing):
1. Run initialization: `node .claude/scripts/init-task-counters.js`
2. Retry reservation
3. If still failing: fall back to manual ID assignment (read TASKS.md, find max, increment)

### Why Atomic Reservation?

**Problem:** Old protocol (read TASKS.md → find max → increment) causes race conditions:
```
Agent A: reads TASKS.md → sees SEC-19 → assigns SEC-20
Agent B: reads TASKS.md → sees SEC-19 → assigns SEC-20  ← COLLISION
```

**Solution:** Atomic file-based counter with lock prevents concurrent access:
- Lock acquired before read/write
- Counter incremented atomically
- Lock released after write
- No collisions possible

## Auto-Archive (Completed Task Cleanup)

Completed tasks are automatically moved from TASKS.md to TASKS-ARCHIVE.md to prevent bloat.

**Standalone script:**
```bash
node .claude/scripts/archive-done-tasks.js              # execute
node .claude/scripts/archive-done-tasks.js --dry-run     # preview changes
node .claude/scripts/archive-done-tasks.js --keep-recent=5  # custom rolling window
```

**Detection rules** (a task is "done" if ANY match):
1. Strikethrough ID in active table: `~~SEC-24~~`
2. Status column contains `✅` or `done`
3. Listed in "Recently Completed" section (overflow beyond keep-recent limit)
4. ID already exists in TASKS-ARCHIVE.md but still in active table

**When it runs automatically:**
- `/processes:end-session` — Step 1b runs archive + index refresh
- `task-complete-sync.sh` hook — triggers when Recently Completed exceeds 10 entries
- `regenerate-task-index.js --archive` — combined archive + index refresh

**What it does:**
1. Removes done tasks from active tables in TASKS.md
2. Trims "Recently Completed" to rolling window (default: 10)
3. Prepends archived tasks to TASKS-ARCHIVE.md
4. Recounts header stats (active tasks, priority, status distribution)

## Enrichment Guidelines (Reduce Hallucination Risk)

When creating tasks, include metadata that helps agents execute safely:

1. **From reviews** — Include `files` from the review's `anti_patterns[].files` in the task description or enrichments sidecar (`.claude/task-enrichments.json`)
2. **From plans** — Include affected file paths in the task description (e.g., "Add rate limiting to `apps/api/src/middleware/`")
3. **Manual tasks** — Include at least one affected file path in the description OR add an entry to `.claude/task-enrichments.json` with `files`, `verification`, and `acceptanceCriteria`
4. **External tasks** — External apps should include `files` array in inbox submissions (`.claude/task-inbox.json`)

**Why:** Tasks without `files` or `acceptanceCriteria` score higher on hallucination risk. Agents picking up high-risk tasks must re-investigate before coding, wasting time. Including files upfront makes tasks safer to execute.

**Enrichment sidecar** (`.claude/task-enrichments.json`):
```json
{
  "SEC-9": {
    "files": ["apps/api/src/middleware/auth.ts"],
    "verification": "Grep 'csrf' apps/api/src/",
    "acceptanceCriteria": ["CSRF tokens validated on POST/PUT/DELETE"],
    "tags": ["security"]
  }
}
```

## Validation Rules

Before presenting tasks for approval, validate:

- Task is **actionable** (not vague — "improve performance" is bad, "add index on transactions.accountId" is good)
- Task **doesn't duplicate** an existing TASKS.md item (Grep for similar descriptions)
- Task has a **concrete reason** (not "would be nice" — must solve a real problem)
- **Priority is justified** (Critical = blocks users, High = blocks launch, Medium = should do, Low = nice to have)

## Skills That MUST Follow This Protocol

- `/processes:review` — Phase 4.5: Auto-create tasks from findings
- `/processes:plan` — Phase 2.5: Register plan tasks with dependency chains
- `/processes:brainstorm` — Phase 3.5: Capture action items
- `/processes:diagnose` — Phase 5.5: Register fix tasks
- `/processes:audit` — Auto-create tasks from audit findings
- `/braindump` — Step 4.5: Capture agreed improvements
