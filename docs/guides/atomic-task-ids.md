# Atomic Task ID Reservation System

> **Quick Start:** Prevents ID collisions when multiple agents create tasks concurrently.

---

## Problem Solved

**Before:** Race condition on ID assignment
```
Agent A: reads TASKS.md → sees SEC-19 → assigns SEC-20
Agent B: reads TASKS.md → sees SEC-19 → assigns SEC-20  ← COLLISION!
Agent A: writes SEC-20 to TASKS.md
Agent B: writes SEC-20 to TASKS.md  ← OVERWRITES Agent A's work
```

**After:** Atomic reservation with file lock
```
Agent A: locks → reads counter (SEC-19) → increments (SEC-20) → unlocks
Agent B: waits for lock → reads counter (SEC-20) → increments (SEC-21) → unlocks
Result: No collisions, both tasks created safely
```

---

## Quick Reference

### 1. One-Time Setup (First Use)

Initialize counters from existing TASKS.md:

```bash
node .claude/scripts/init-task-counters.js
```

**Output:**
```
✅ Initialized counters from 256 tasks:
   SEC      → 19
   PERF     → 12
   UX       → 66
   ...
```

This creates `.claude/.task-id-counters.json` (gitignored).

---

### 2. Reserve IDs (Before Creating Tasks)

**Single ID:**
```bash
node .claude/scripts/reserve-task-ids.js SEC
# → {"ids":["SEC-20"],"reservedAt":"2026-02-19T18:00:00.000Z"}
```

**Batch (for reviews, plans with multiple tasks):**
```bash
node .claude/scripts/reserve-task-ids.js UX 5
# → {"ids":["UX-67","UX-68","UX-69","UX-70","UX-71"],"reservedAt":"..."}
```

**Valid prefixes:**
- Dev: `SEC`, `PERF`, `UX`, `TEST`, `DEV`, `ARCH`, `FIN`, `DRY`, `DOC`
- Design: `DS`
- Marketing: `MKT`, `CNT`
- Operations: `INFRA`, `OPS`

---

### 3. Use Reserved IDs in Your Workflow

**Example (from code review):**

```javascript
// Step 1: Count tasks to create
const findings = reviewResults.antiPatterns.filter(f => f.severity === 'high');
const taskCount = findings.length; // e.g., 3

// Step 2: Reserve IDs
const result = execSync(
  `node .claude/scripts/reserve-task-ids.js SEC ${taskCount}`,
  { encoding: 'utf-8' }
);
const { ids } = JSON.parse(result); // ["SEC-20", "SEC-21", "SEC-22"]

// Step 3: Assign IDs to tasks
const tasks = findings.map((f, i) => ({
  id: ids[i],
  title: f.description,
  priority: 'High',
  source: 'review:security-sentinel',
  files: f.files
}));

// Step 4: Present for approval, then write to TASKS.md
```

---

### 4. Inbox Workflow (Optional)

For external apps or complex workflows, use the inbox:

```javascript
// Submit tasks to inbox (with reserved IDs)
const inbox = JSON.parse(fs.readFileSync('.claude/task-inbox.json'));
inbox.tasks.push(...tasks);
fs.writeFileSync('.claude/task-inbox.json', JSON.stringify(inbox, null, 2));

// Process inbox (validates IDs, appends to TASKS.md)
execSync('node .claude/scripts/regenerate-task-index.js --process-inbox');
```

**Inbox validation:**
- ✅ Accepts IDs ≤ current counter value
- ❌ Rejects IDs > counter value (out-of-range)
- Error message shows how to reserve IDs properly

---

## How It Works

### File-Based Lock (Atomic Guarantee)

1. **Lock acquisition:** Spinlock with 5s timeout
   - Creates `.task-id-counters.json.lock` file atomically
   - If lock exists, waits 10ms and retries
   - Breaks stale locks (>5s old)

2. **Read-Increment-Write:**
   - Read current counter from JSON file
   - Increment by N (number of IDs requested)
   - Write atomically using tmp + rename pattern

3. **Lock release:** Delete lock file (always, even on error)

**Why file-based?**
- Simple (no database needed)
- Works offline (no network dependency)
- Fast (10ms spinlock latency)
- Git-safe (counter file gitignored)

---

## Concurrent Access Example

**Two agents, same time:**

```bash
# Terminal 1:
node .claude/scripts/reserve-task-ids.js PERF 3 &

# Terminal 2 (immediately):
node .claude/scripts/reserve-task-ids.js PERF 2 &

# Wait for both
wait
```

**Result:**
```
{"ids":["PERF-13","PERF-14","PERF-15"],"reservedAt":"..."}  # Agent 1
{"ids":["PERF-16","PERF-17"],"reservedAt":"..."}            # Agent 2
```

No collision! Lock ensures sequential execution.

---

## Error Handling

### Lock Timeout

**Symptom:**
```
❌ Error: Lock acquisition timeout (5000ms) - another agent holding lock
```

**Cause:** Another agent is actively reserving IDs (or lock is stale)

**Fix:**
```bash
# Check for stale lock
ls -la .claude/.task-id-counters.json.lock

# If stale (>5s old), remove manually
rm .claude/.task-id-counters.json.lock

# Retry
node .claude/scripts/reserve-task-ids.js SEC
```

### Counter File Missing

**Symptom:**
```
❌ Error: Counter file not found
Run: node .claude/scripts/init-task-counters.js
```

**Fix:**
```bash
node .claude/scripts/init-task-counters.js
```

### Invalid Prefix

**Symptom:**
```
❌ Error: Invalid prefix "FOO". Valid: SEC, PERF, UX, ...
```

**Fix:** Use a valid prefix from the list in section 2.

### Out-of-Range ID (Inbox)

**Symptom:**
```
❌ Invalid task ID SEC-25: counter at SEC-22.
Run: node .claude/scripts/reserve-task-ids.js SEC to reserve IDs first.
```

**Fix:**
```bash
# Reserve the IDs properly first
node .claude/scripts/reserve-task-ids.js SEC 3

# Then submit to inbox
```

---

## Integration with Skills

### `/processes:review`

Reserve IDs **before** presenting findings for approval:

```javascript
// After extracting actionable findings
const taskCount = findings.filter(f => f.actionable).length;

// Reserve IDs
const { ids } = reserveTaskIds('SEC', taskCount);

// Assign to tasks, present for approval
```

### `/processes:plan`

Reserve IDs for all plan tasks **before** user approval:

```javascript
// After creating implementation plan
const tasks = plan.steps.filter(s => s.createTask);
const { ids } = reserveTaskIds('DEV', tasks.length);

// Assign IDs, include in plan approval
```

### Manual Ad-Hoc Tasks

Reserve 1 ID, write directly to TASKS.md:

```bash
# Reserve ID
ID=$(node .claude/scripts/reserve-task-ids.js SEC | jq -r '.ids[0]')

# Write to TASKS.md (manual edit or script)
echo "| $ID | Fix auth bug | 1h | High | ready | | manual |" >> TASKS.md
```

---

## Troubleshooting

### Counter Drift

**Symptom:** Counter file shows SEC-20, but TASKS.md highest is SEC-19

**Cause:** IDs reserved but tasks not created (reservation abandoned)

**Impact:** No problem - gaps in ID sequence are safe (SECreserved → SEC-21 is fine)

**Fix (optional):** Manually adjust counter if needed:
```javascript
// In .claude/.task-id-counters.json
{
  "counters": {
    "SEC": 19  // ← Reset to actual highest in TASKS.md
  }
}
```

### Lock Stuck

**Symptom:** Lock file exists for >1 minute

**Check lock holder:**
```bash
cat .claude/.task-id-counters.json.lock
# {"pid":12345,"lockedAt":"2026-02-19T..."}

# Check if PID still alive (Unix)
ps -p 12345

# (Windows)
tasklist /FI "PID eq 12345"
```

**Force remove (safe if PID dead):**
```bash
rm .claude/.task-id-counters.json.lock
```

---

## Performance

**Benchmarks (Windows, SSD):**
- Single reservation: ~15ms (lock + read + write + unlock)
- Batch 10 IDs: ~18ms (same overhead, more IDs per lock)
- Concurrent 2 agents: ~25ms total (sequential via lock)

**Scalability:**
- ✅ Handles ~50 concurrent agents (5s timeout allows queue)
- ✅ Batch preferred for multi-task operations (1 lock vs N locks)
- ✅ No database required (offline-friendly)

---

## Migration from Old System

**Old workflow:**
```javascript
// ❌ Race-prone
const tasksMd = fs.readFileSync('TASKS.md');
const maxId = findMaxId(tasksMd, 'SEC'); // SEC-19
const nextId = `SEC-${maxId + 1}`;       // SEC-20 (collision risk!)
```

**New workflow:**
```javascript
// ✅ Atomic
const { ids } = JSON.parse(
  execSync('node .claude/scripts/reserve-task-ids.js SEC').toString()
);
const nextId = ids[0]; // SEC-20 (guaranteed unique)
```

**Backward compatibility:** Both work, but prefer atomic reservation.

---

## Files

| File | Purpose | Git |
|------|---------|-----|
| `.claude/scripts/init-task-counters.js` | Initialization script | ✅ Tracked |
| `.claude/scripts/reserve-task-ids.js` | ID reservation service | ✅ Tracked |
| `.claude/.task-id-counters.json` | Counter state | ❌ Gitignored |
| `.claude/.task-id-counters.json.lock` | Lock file | ❌ Gitignored |
| `.claude/.task-id-counters.json.tmp` | Atomic write temp | ❌ Gitignored |
| `.claude/task-inbox.json` | Task submission queue | ✅ Tracked (empty) |

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| ID collision risk | ❌ High (race condition) | ✅ Zero (atomic lock) |
| Concurrent agents | ❌ Overwrites possible | ✅ Safe (sequential) |
| Batch efficiency | ❌ N reads per N tasks | ✅ 1 lock per N tasks |
| Offline support | ✅ Yes | ✅ Yes |
| Database required | ✅ No | ✅ No |
| Setup complexity | ✅ None | ⚠️ One-time init |

**When to use:**
- ✅ Any task creation workflow (review, plan, diagnose, manual)
- ✅ Multiple concurrent agents/sessions
- ✅ Batch task creation (10+ tasks at once)

**When to skip:**
- ⚠️ Single agent, low frequency (<1 task/hour) — race risk low but use anyway for safety
- ❌ Never skip if multiple agents active

---

**Questions?** See `.claude/rules/task-population.md` for integration examples.
