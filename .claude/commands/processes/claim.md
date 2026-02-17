---
name: processes:claim
description: Lightweight task claiming from TASKS.md
argument-hint: "[task-id]"
---

# Workflow: Claim Task

Quick entry point for claiming a task from TASKS.md and updating ACTIVE-WORK.md.

**Purpose:** Streamlined workflow for subsequent sessions within 2 hours of last session.

---

## Workflow

### Step 1: Read ACTIVE-WORK.md (5 seconds)

```bash
cat ACTIVE-WORK.md
```

Extract:
- Current sessions (who's working on what)
- Task allocation (reserved tasks)
- Last update timestamp

### Step 2: Check Task Availability (10 seconds)

If `[task-id]` argument provided:

```bash
# Check if task exists in TASKS.md
grep "$TASK_ID" TASKS.md

# Check if task is already claimed in ACTIVE-WORK.md
grep "$TASK_ID" ACTIVE-WORK.md
```

**If task claimed by another agent:**
- Output conflict warning (see Scenario 2 in plan)
- Suggest next available tasks with `[dependency: none]`
- Ask user which task to claim instead

**If task available:**
- Proceed to Step 3

If no `[task-id]` argument:
- Show available tasks from TASKS.md (filter for `[dependency: none]`)
- Ask user which task to claim

### Step 3: Update ACTIVE-WORK.md (10 seconds)

Add new session to "Current Sessions" table:

```markdown
| agent-[random-id] | [current-time] | [task-id]: [task-description] | in_progress | [current-branch] |
```

Add task to "Task Allocation" table:

```markdown
| [task-id] | [task-type] | agent-[random-id] | [current-time + 2 hours] |
```

Update "Last Updated" timestamp.

### Step 4: Create TodoWrite (15 seconds)

Based on task from TASKS.md, create minimal TodoWrite with 3-4 sub-tasks.

**Example for SEC-6.1b (CSV injection fix):**

```
1. Read report-export.service.ts to understand current CSV generation
2. Add CSV injection prevention (escape formulas starting with =, +, -, @)
3. Add test case for malicious CSV input
4. Verify export still works correctly
```

### Step 5: Output Dashboard (10 seconds)

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

**Scenario 3: No task-id provided**

```
User: /processes:claim

Agent shows available tasks:

## Available Tasks (dependency: none)

**Security & Integrity (Track A):**
- [ ] **SEC-6.1c:** GL opening balance (1-2 hr, P0)
- [ ] **SEC-6.1d:** Split reports.ts server/client (30 min, P0)

**Performance (Track B):**
- [ ] **PERF-6.2a:** Wire up pino in Fastify (30 min, P1)

**Quality (Track C):**
- [ ] **QUAL-6.1a:** Create loading/error templates (15 min, P0)

Which task would you like to claim?
```

---

## Notes

**Difference from /processes:begin:**
- `claim` is lightweight (no git status, no industry intel, no pro tips)
- Focused on task claiming and ACTIVE-WORK.md updates
- Used for subsequent sessions within 2 hours

**When to use:**
- Quick task switching during active work day
- Multi-agent parallel sessions
- When you already know what task to work on

**When NOT to use:**
- First session of day → use `/processes:begin` instead
- Need full context → use `/processes:begin` instead
- Ad-hoc work not in TASKS.md → just start coding (Tier 3)

---

_Lines: ~140. Lightweight alternative to /processes:begin for quick task claiming._
