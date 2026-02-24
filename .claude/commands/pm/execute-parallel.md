---
name: pm:execute-parallel
description: Execute multiple tasks in parallel using domain agents in isolated worktrees
argument-hint: "<task-id1> <task-id2> [task-id3 ...]"
---

# Workflow: Parallel Agent Execution

Spawn multiple specialized agents simultaneously, each in an isolated Git worktree. After all agents complete, validate through gates and merge sequentially.

**Pipeline:** Claim > **Execute Parallel** > Review
**Prerequisites:** All tasks must exist in TASKS.md. Agent definitions in `.claude/agents/`.
**When to use:** For 2-4 independent tasks that can run concurrently. For single tasks, use `/pm:execute`.
**Max concurrent agents:** 4 (context and resource limits)

---

## Phase 0: Parse Arguments

**If fewer than 2 arguments:**
```
Usage: /pm:execute-parallel <task-id1> <task-id2> [task-id3 ...]

Examples:
  /pm:execute-parallel DEV-15 UX-19          # 2 tasks in parallel
  /pm:execute-parallel DEV-15 UX-19 DRY-11   # 3 tasks in parallel

Limit: 4 concurrent tasks maximum.
```

**Parse the argument string:**
- Split on whitespace
- Each token is a TASK_ID (pattern: `[A-Z]+-\d+`)
- Reject if >4 tasks (too many concurrent agents)
- Reject if <2 tasks (use `/pm:execute` instead)

---

## Phase 1: Batch Task Lookup

### Read TASKS.md Index (fast-path)

```bash
grep -Pzo '(?s)<!-- TASK-INDEX:START.*?TASK-INDEX:END -->' TASKS.md
```

For each TASK_ID:
- Find in index, extract: title, status, priority, domain
- Verify status is `ready` (reject `done`, `blocked`, `in_progress`)

**If any task not found or not ready:**
```
Cannot execute in parallel — some tasks are not ready:

  DEV-15: ready
  UX-19: blocked (needs DEV-14)
  DRY-11: ready

Remove blocked tasks and retry, or unblock them first.
```

### Load Enrichments

```
Read .claude/task-enrichments.json
```

For each task, extract: `files`, `verification`, `acceptanceCriteria`, `tags`.

---

## Phase 2: Conflict Detection

Compare file lists between all task pairs to detect potential merge conflicts.

**Algorithm:**
For each pair of tasks (i, j):
- Get `files[i]` and `files[j]` from enrichments
- Find intersection (files both tasks will modify)
- If intersection is non-empty: record conflict

**If conflicts detected:**

Use AskUserQuestion:
```
File conflicts detected between parallel tasks:

  DEV-15 and UX-19 both modify:
    - apps/web/src/app/(dashboard)/banking/accounts/page.tsx

Options:
  1. Run conflicting tasks sequentially (DEV-15 first, then UX-19)
  2. Continue anyway (risk merge conflicts)
  3. Cancel and reassign tasks
```

**If no conflicts:** Proceed to Phase 3.

**If tasks have no enrichment files:** Warn that conflict detection is unavailable (tasks lack file hints). Ask user to confirm parallel execution.

---

## Phase 3: Agent Assignment

For each task, determine the agent using the same logic as `/pm:execute` Phase 2:

1. Enrichment tags → agent
2. Task ID prefix → agent
3. File path heuristic → agent

**Display assignment table:**

```
Parallel Execution Plan
━━━━━━━━━━━━━━━━━━━━━━
Task     | Agent           | Priority | Files
---------|-----------------|----------|------
DEV-15   | banking-agent   | High     | apps/api/src/domains/banking/...
UX-19    | ui-agent        | Medium   | apps/web/src/app/(dashboard)/...
DRY-11   | ui-agent        | Low      | packages/ui/src/...

Estimated time: ~10-15 minutes (vs ~30-40 sequential)
```

**If any agent is ambiguous:** Use AskUserQuestion for that specific task.

**Proceed when all agents are assigned.**

---

## Phase 4: Worktree Creation

Create a worktree for each task:

```bash
bash .claude/scripts/worktree-create.sh banking-agent DEV-15
bash .claude/scripts/worktree-create.sh ui-agent UX-19
bash .claude/scripts/worktree-create.sh ui-agent DRY-11
```

Run these sequentially (they're fast — just git operations). Capture each worktree path.

**If any worktree creation fails:** Report the error, skip that task, continue with others.

---

## Phase 5: Parallel Agent Spawn

### Compose Prompts

For each task, compose the agent prompt using the same pattern as `/pm:execute` Phase 4:
1. Read agent definition: `Read .claude/agents/$AGENT_NAME.md`
2. Inline core invariants (9 key rules)
3. Add task context (title, acceptance criteria, files, verification)
4. Add working directory and commit instructions

### Spawn All Agents

Launch all agents simultaneously using Task tool with `run_in_background: true`:

```
For each task:
  Task tool:
    description: "Execute $TASK_ID with $AGENT_NAME"
    subagent_type: general-purpose
    prompt: $COMPOSED_PROMPT
    run_in_background: true
```

**CRITICAL:** Send ALL Task tool calls in a SINGLE message to maximize parallelism. Do NOT spawn them one at a time.

Collect the `output_file` path from each Task tool response. Store:
```
AGENTS = [
  { taskId: "DEV-15", agent: "banking-agent", outputFile: "/path/to/output1" },
  { taskId: "UX-19", agent: "ui-agent", outputFile: "/path/to/output2" },
  { taskId: "DRY-11", agent: "ui-agent", outputFile: "/path/to/output3" },
]
```

---

## Phase 6: Monitor Progress

Poll agent output files to track completion:

```
For each agent in AGENTS:
  Read $agent.outputFile (using Read tool or Bash tail)
```

**Check every 30 seconds** (use TaskOutput with `block: false`):
- If output contains completion indicators: mark as done
- If output contains error indicators: mark as failed
- If still running: note progress

**Display progress:**
```
Agent Progress
━━━━━━━━━━━━━
DEV-15 (banking-agent):   Completed
UX-19 (ui-agent):         Running...
DRY-11 (ui-agent):        Running...
```

**Wait for ALL agents to complete** (or timeout after 30 minutes per agent).

Use `TaskOutput` with `block: true` for each agent to wait for completion.

---

## Phase 7: Sequential Gate + Merge

Process completed agents ONE AT A TIME. Order by: priority (critical first), then by task ID.

### For each completed agent:

**7a. Check Agent Status**

Read the agent's output. Did it succeed?
- Success: proceed to gates
- Failure: log error, skip to next agent, keep worktree for debugging

**7b. Security Gate**

```
Task tool:
  description: "Security gate for $TASK_ID"
  subagent_type: security-sentinel
  prompt: [security review prompt — same as /pm:execute Phase 6a]
```

**7c. Compliance Gate (if financial task)**

Same detection logic as `/pm:execute` Phase 6b. Only run for financial tasks.

**7d. Merge (if gates pass)**

```bash
bash .claude/scripts/worktree-cleanup.sh $AGENT_NAME $TASK_ID
```

**7e. Test After Merge**

```bash
# Run relevant tests based on changed files
cd apps/api && npx vitest run --reporter=verbose  # if backend changed
cd apps/web && npx tsc --noEmit                    # if frontend changed
```

**If tests fail:** Warn user (do NOT auto-revert). Use AskUserQuestion with options:
1. Revert this merge, continue with remaining agents
2. Keep merge, skip remaining agents, fix manually
3. Keep merge, continue with remaining agents anyway

**7f. Update TASKS.md**

Check off the completed task: `[ ]` → `[x]` with commit hash.

---

## Phase 8: Summary Report

After all agents are processed:

```
Parallel Execution Summary
━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks: $TOTAL total
  Succeeded: $SUCCESS_COUNT
  Failed: $FAIL_COUNT
  Blocked by gates: $BLOCKED_COUNT

Results:
  $STATUS_ICON $TASK_ID ($AGENT_NAME) — $RESULT_DESCRIPTION
  $STATUS_ICON $TASK_ID ($AGENT_NAME) — $RESULT_DESCRIPTION
  $STATUS_ICON $TASK_ID ($AGENT_NAME) — $RESULT_DESCRIPTION

Time: $ELAPSED (estimated sequential: $ESTIMATED_SEQUENTIAL)
Speedup: ${SPEEDUP}x
```

**Status icons:**
- Merged successfully
- Gate blocked (issues listed)
- Agent failed (error listed)
- Tests failed after merge

**If any worktrees remain** (failed/blocked agents):
```
Preserved worktrees for debugging:
  .worktrees/ui-agent-DRY-11  (security gate blocked)

Clean up with: bash .claude/scripts/worktree-cleanup.sh <agent-name> <task-id>
Or investigate: cd .worktrees/<agent-name>-<task-id> && git log
```

---

## Error Handling

### Partial Success
If some agents succeed and others fail, merge the successful ones and report the failures. Never roll back successful merges because of unrelated failures.

### Agent Timeout
If an agent hasn't completed after 30 minutes:
```
Agent $AGENT_NAME timed out on $TASK_ID.
Worktree preserved at: $WORKTREE_PATH
Partial work may be committed — check with: cd $WORKTREE_PATH && git log
```
Continue processing other agents.

### All Agents Fail
```
All agents failed. No changes merged.
Worktrees preserved for investigation:
  $WORKTREE_PATHS
```

### Merge Conflict During Sequential Merge
If worktree-cleanup.sh reports a merge conflict:
```
Merge conflict when merging $TASK_ID.
This can happen when agents modified overlapping code.

Options:
1. Resolve conflict manually (then run: git merge --continue)
2. Skip this task (keep worktree branch for later)
3. Cancel remaining merges
```
