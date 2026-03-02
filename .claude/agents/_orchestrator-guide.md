# Agent Orchestrator Guide

> **How to coordinate multiple execution agents working in parallel**

---

## Overview

The orchestrator is responsible for:
1. **Spawning** multiple agents in isolated worktrees
2. **Monitoring** agent progress
3. **Detecting conflicts** before merging
4. **Merging** successful agent work back to main
5. **Reporting** status to user

---

## Parallel Execution Flow

### Phase 1: Task Selection & Validation

```typescript
function selectParallelTasks(taskIds: string[]): {
  valid: Task[],
  blocked: Task[],
  conflicts: Conflict[]
} {
  const tasks = taskIds.map(id => getTask(id));

  // Check 1: Are tasks unblocked?
  const blocked = tasks.filter(t =>
    t.status !== 'ready' || hasDependencies(t)
  );

  // Check 2: Are tasks independent (no file conflicts)?
  const conflicts = detectFileConflicts(tasks);

  return {
    valid: tasks.filter(t => !blocked.includes(t)),
    blocked,
    conflicts
  };
}
```

**File conflict detection:**
```typescript
function detectFileConflicts(tasks: Task[]): Conflict[] {
  // Get enrichments (files each task will touch)
  const taskFiles = tasks.map(t => ({
    taskId: t.id,
    files: getEnrichmentFiles(t.id) || []
  }));

  // Find overlapping files
  const conflicts: Conflict[] = [];
  for (let i = 0; i < taskFiles.length; i++) {
    for (let j = i + 1; j < taskFiles.length; j++) {
      const overlap = intersection(taskFiles[i].files, taskFiles[j].files);
      if (overlap.length > 0) {
        conflicts.push({
          task1: taskFiles[i].taskId,
          task2: taskFiles[j].taskId,
          files: overlap
        });
      }
    }
  }

  return conflicts;
}
```

**User prompt if conflicts detected:**
```
⚠️  Potential file conflicts detected:
  - DEV-15 and UX-19 both modify: apps/web/src/app/(dashboard)/banking/accounts/page.tsx

Options:
  1. Run sequentially (DEV-15 first, then UX-19)
  2. Continue anyway (risk merge conflicts)
  3. Cancel
```

### Phase 2: Worktree Creation

```bash
# For each valid task, spawn agent in worktree
for task in valid_tasks:
  agent = selectAgent(task)  # banking-agent, ui-agent, etc.

  # Create worktree
  bash .claude/scripts/worktree-create.sh $agent $task.id

  # Log spawn
  echo "🚀 Spawned $agent for $task.id in worktree"
```

### Phase 3: Agent Execution (Parallel)

**Spawn agents in background:**
```bash
# banking-agent in background
(cd .worktrees/banking-agent-DEV-15 && claude-agent-execute banking-agent DEV-15) &
PID_BANKING=$!

# ui-agent in background
(cd .worktrees/ui-agent-DRY-11 && claude-agent-execute ui-agent DRY-11) &
PID_UI=$!

# accounting-agent in background
(cd .worktrees/accounting-agent-UX-19 && claude-agent-execute accounting-agent UX-19) &
PID_ACCT=$!

# Wait for all to complete (or timeout after 30 min)
wait $PID_BANKING
wait $PID_UI
wait $PID_ACCT
```

**Monitor progress:**
```bash
# Every 30 seconds, check status
while true; do
  bash .claude/scripts/worktree-status.sh
  sleep 30
done
```

### Phase 4: Gate Validation (Security/Compliance)

**After each agent completes:**
```typescript
for (const agent of completedAgents) {
  // Security gate
  const securityResult = await callAgent('security-agent', {
    worktree: agent.worktree,
    taskId: agent.taskId
  });

  if (securityResult.blocked) {
    console.log(`❌ ${agent.taskId} BLOCKED by security-agent:`);
    console.log(securityResult.issues.join('\n'));
    // Don't merge this agent
    continue;
  }

  // Compliance gate (for financial tasks)
  if (isFinancialTask(agent.taskId)) {
    const complianceResult = await callAgent('compliance-agent', {
      worktree: agent.worktree,
      taskId: agent.taskId
    });

    if (complianceResult.blocked) {
      console.log(`❌ ${agent.taskId} BLOCKED by compliance-agent:`);
      console.log(complianceResult.issues.join('\n'));
      continue;
    }
  }

  // Gates passed - ready for merge
  readyForMerge.push(agent);
}
```

### Phase 5: Merge Coordination

**Sequential merge (one at a time, check tests between):**
```bash
for agent in ready_for_merge:
  echo "📥 Merging $agent.taskId..."

  # Merge worktree
  bash .claude/scripts/worktree-cleanup.sh $agent.name $agent.taskId

  # Run tests after merge
  cd apps/api && npm test
  cd apps/web && npm test

  if tests_pass:
    echo "✅ $agent.taskId merged successfully"
  else:
    echo "❌ $agent.taskId broke tests - reverting"
    git reset --hard HEAD~1
    # Notify user
  fi
done
```

---

## Agent Communication Protocol

### Status Updates

**Each agent MUST report:**
```json
{
  "agentId": "banking-agent",
  "taskId": "DEV-15",
  "status": "in_progress | completed | failed",
  "progress": 0.65,  // 0-1
  "filesChanged": ["apps/api/...", "apps/web/..."],
  "securityGate": "pass | fail | pending",
  "complianceGate": "pass | fail | pending | n/a",
  "reviewAgents": [
    { "name": "financial-data-validator", "status": "pass", "warnings": 2 }
  ],
  "commit": "abc1234" // After completion
}
```

**Where to report:**
```bash
# Write to .worktrees/<agent>-<task>/agent-status.json
{
  "status": "completed",
  "commit": "abc1234",
  ...
}

# Orchestrator polls every 10 seconds
```

### Inter-Agent Dependencies

**If agent needs another agent's work:**
```typescript
// Example: ui-agent needs db-agent to create model first

if (task requires db-schema-change) {
  // Delegate to db-agent
  await spawnAgent('db-agent', {
    subtaskId: `${taskId}-db`,
    work: 'Create Transfer model in Prisma schema'
  });

  // Wait for db-agent to complete
  await waitForAgent('db-agent', subtaskId);

  // Continue with ui work
}
```

---

## Conflict Resolution Strategies

### Strategy 1: Auto-Merge (No Conflicts)

```bash
if git merge --no-commit --no-ff $BRANCH; then
  # No conflicts - safe to merge
  git merge --continue
else
  # Conflicts detected - use Strategy 2
fi
```

### Strategy 2: Manual Resolution Required

```bash
echo "⚠️  Merge conflict in $agent.taskId"
echo "Files with conflicts:"
git diff --name-only --diff-filter=U

echo "Options:"
echo "  1. Resolve manually (git mergetool)"
echo "  2. Keep agent branch, rebase main later"
echo "  3. Discard agent work"
```

### Strategy 3: Rebase Instead of Merge

```bash
# If main has advanced while agents were working
git rebase main $BRANCH

if rebase_success:
  git checkout main
  git merge --ff-only $BRANCH
else:
  # Conflicts during rebase - manual resolution
fi
```

---

## Error Handling Patterns

### Agent Timeout (30 min)

```bash
timeout 1800 claude-agent-execute banking-agent DEV-15

if [ $? -eq 124 ]; then
  echo "⏱️ Agent timeout after 30 minutes"
  # Save partial work
  cd .worktrees/banking-agent-DEV-15
  git stash save "WIP: timeout at $(date)"
  # Notify user
fi
```

### Agent Failure

```bash
if agent_failed:
  echo "❌ Agent failed: $agent.error"

  # Keep worktree for debugging
  echo "Worktree preserved at: .worktrees/$agent"
  echo "Debug: cd .worktrees/$agent && git log"

  # Mark task as failed in TASKS.md
  update_task_status(taskId, 'failed', agent.error)

  # Don't block other agents - continue with rest
```

### Partial Success (2/3 agents succeed)

```
✅ DEV-15 (banking-agent): Merged successfully
✅ DRY-11 (ui-agent): Merged successfully
❌ UX-19 (accounting-agent): Failed tests

Summary:
  - 2 tasks completed
  - 1 task failed (UX-19 needs manual fix)
  - Total time: 12 minutes (3x faster than sequential)
```

---

## Cost Optimization

**Use Haiku for execution, Opus for complex review:**
```typescript
const agentModelMap = {
  'banking-agent': 'haiku',
  'ui-agent': 'haiku',
  'test-agent': 'haiku',
  'security-agent': 'sonnet',      // Complex validation
  'compliance-agent': 'sonnet',    // Complex validation
  'financial-data-validator': 'opus',  // Critical review
  'architecture-strategist': 'opus'    // Complex analysis
};
```

**Est. cost for 3-agent parallel execution:**
- 3 agents × Haiku × 5K tokens = ~$0.15
- 2 gates × Sonnet × 2K tokens = ~$0.20
- 3 reviews × Opus × 3K tokens = ~$0.90
- **Total: ~$1.25** vs $0.50 sequential (2.5x cost for 3x speed)

---

## Performance Metrics

**Track and report:**
```json
{
  "totalTasks": 3,
  "successful": 2,
  "failed": 1,
  "parallelTime": "12m 34s",
  "estimatedSequentialTime": "38m 15s",
  "speedup": "3.04x",
  "cost": "$1.25",
  "gateBlocks": 0,
  "testFailures": 1
}
```

---

## Next Steps

1. **Test orchestration** with dummy agents (Session 1)
2. **Implement banking + ui agents** (Session 2)
3. **Add security + compliance gates** (Session 2)
4. **Test 3-agent parallel run** (Session 3)
5. **Iterate based on real-world learnings** (Session 3+)

---

_Orchestration is complex. Start simple (2 agents), scale gradually._
