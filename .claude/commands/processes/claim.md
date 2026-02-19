---
name: processes:claim
description: Lightweight task claiming from TASKS.md
argument-hint: "[task-id | --domain <name> | --effort <range> | --priority <level> | --quick-wins | --rebuild-index]"
---

# Workflow: Claim Task

Quick entry point for claiming a task from TASKS.md and updating ACTIVE-WORK.md.

**Purpose:** Streamlined workflow for subsequent sessions within 2 hours of last session.

**New:** Supports filtering and smart recommendations for 93% token reduction.

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
- Proceed to Step 6

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

Based on task details from index, create minimal TodoWrite with 3-4 sub-tasks.

**Example for SEC-9 (CSRF protection):**

```
1. Read existing auth middleware to understand current protection
2. Add CSRF token generation and validation
3. Add test cases for CSRF attack scenarios
4. Verify existing auth flows still work
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
