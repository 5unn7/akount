---
name: processes:eod
description: Workflow - End of Day (EOD)
---

# Workflow: End of Day (EOD)

Close out your session productively: save work, update docs, set up tomorrow.

**When to Use:** End of work session, end of week, before breaks

---

## Quick Workflow

**1. Assess** (30s) - Git status, identify temp files
**2. Clean** (1m) - Delete temp files, move artifacts to correct locations
**3. Document** (2m) - Update STATUS.md, TASKS.md, MEMORY.md
**4. Commit** (1m) - Save work if not already committed
**5. Plan** (1m) - Set tomorrow's focus

**Total:** ~5 minutes

---

## Phase 1: Assess Current State (30 seconds)

### Git Status

```bash
git status --short
git diff HEAD --stat
```

**Check for:**

- Untracked files (??
)
- Modified uncommitted files (M)
- Staged files ready to commit

### Identify Temp Files

**Common patterns:**

- Session notes: `WEEK_YYYY-MM-DD*.md`
- Review reports: `CODE_REVIEW_*.md`
- Temp notes: `*_TEMP.md`, `*_SCRATCH.md`
- Agent work: `.agent/` directory
- Build output: `*_errors.txt`, `*_output.json`

**Keep (but organize):**

- Implementation plans → `docs/plans/`
- Brainstorms → `docs/brainstorms/`
- Session reports → `docs/archive/sessions/`

---

## Phase 2: Clean Up (1 minute)

### Delete Temp Files

```bash
# Delete session temp files
rm -f *_TEMP.md *_SCRATCH.md *_errors.txt *_output.json

# Clear agent work (if exists)
rm -rf .agent/
```

### Move Artifacts to Correct Locations

```bash
# Move plans
mv *_plan.md docs/plans/ 2>/dev/null || true

# Move brainstorms
mv *_brainstorm.md docs/brainstorms/ 2>/dev/null || true

# Move session reports
mv WEEK_*.md docs/archive/sessions/ 2>/dev/null || true
```

---

## Phase 2.5: Code Quality Checks (1 minute)

**Check for anti-patterns introduced during session:**

```bash
# 1. Count ': any' types (should be 0 new occurrences)
echo "=== Checking for : any types ==="
grep -r ": any[^w]" apps/api/src apps/web/src | grep -v test | grep -v ".test.ts" | wc -l

# 2. Count console.log in production code (should be 0 outside env.ts)
echo "=== Checking for console.log in production ==="
grep -r "console\." apps/api/src/domains apps/api/src/services | grep -v test | wc -l

# 3. Count hardcoded colors (should be 0)
echo "=== Checking for hardcoded colors ==="
grep -r "text-\[#\|bg-\[#\|bg-\[rgba" apps/web/src | wc -l

# 4. Check for missing loading.tsx/error.tsx
echo "=== Checking for missing loading/error files ==="
find apps/web/src/app -name "page.tsx" -type f | while read page; do
  dir=$(dirname "$page")
  [ ! -f "$dir/loading.tsx" ] && echo "Missing loading.tsx: $dir"
  [ ! -f "$dir/error.tsx" ] && echo "Missing error.tsx: $dir"
done
```

**If ANY violations found:**
- List them clearly
- Fix before committing
- Update debugging-log.md if pattern is new

---

## Phase 2.75: Auto-Update Metrics (1 minute)

**Run metrics script to extract current values:**

```bash
# Run update-metrics.sh script
./.claude/scripts/update-metrics.sh

# Output format:
# BACKEND_TESTS=1009
# FRONTEND_TESTS=55
# TSC_ERRORS=0
# NPM_VULNS=14
# NPM_HIGH=5
# LOADING_COVERAGE=48/47
```

**Parse output and update STATUS.md Auto-Updated Metrics table:**

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Backend Tests | `$BACKEND_TESTS` | 1100+ | Auto-calc % |
| Service Coverage | 27/27 | 27/27 | ✅ 100% |
| TypeScript Errors | `$TSC_ERRORS` | 0 | Auto-calc status |
| Frontend Tests | `$FRONTEND_TESTS` | 100+ | Auto-calc % |
| Loading States | `$LOADING_COVERAGE` | 47/47 | Auto-calc status |
| NPM Vulnerabilities | `$NPM_VULNS` (`$NPM_HIGH` high) | 0 | Auto-calc status |

**Status logic:**
- ✅ if value meets target
- ⚠️ if value is 80-99% of target
- ❌ if value is <80% of target

**Error handling:** If script fails, skip metrics update and note "Metrics update skipped (script failed)" in EOD summary.

---

## Phase 3: Aggregate Sessions & Update Artifacts (3 minutes)

### Step 1: Read All Session Captures from Today

```bash
# Find today's session files
ls docs/archive/sessions/$(date +%Y-%m-%d)-*.md 2>/dev/null
```

Read each session file. If no session files exist for today, fall back to `git log --since="today"` and ask user for context about what was done.

Extract from all sessions: work done, bugs fixed, patterns discovered, new systems built, artifact update hints.

### Step 2: Classify What Happened

Categorize each item from the sessions:
- **Operational:** new endpoints, new pages, completed tasks, new models, config changes
- **Experiential:** bugs fixed, gotchas discovered, patterns learned, process friction

### Step 3: Route Operational Knowledge (auto-update)

| What Happened | Artifact to Update | How |
|---|---|---|
| New API endpoint built | `apps/api/CLAUDE.md` | Update endpoint table |
| New web page built | `apps/web/CLAUDE.md` | Update page list |
| New Prisma model added | `packages/db/CLAUDE.md`, `docs/context-map.md` | Update model table |
| Task completed | `TASKS.md` | Check off items, add commit hashes |
| Phase milestone reached | `STATUS.md`, `ROADMAP.md` | Update progress percentages |
| New feature not in plan | `ROADMAP.md`, `TASKS.md` | Flag as ad-hoc, note for next planning |

Read the current content of each artifact before updating. Make the minimum necessary change.

### Step 4: Route Experiential Knowledge (to MEMORY topic files)

| What Was Learned | Topic File | Template |
|---|---|---|
| Bug fix (non-trivial root cause) | `debugging-log.md` | `### YYYY-MM-DD: [Title]` with Symptom, Root Cause, Fix, Prevention |
| Codebase gotcha | `codebase-quirks.md` | `### [Quirk Name]` with description + workaround |
| New API pattern | `api-patterns.md` | `### [Pattern Name]` with description + example |
| Process friction | `MEMORY.md` Known Issues table | Add row |

**Key rule:** Auto-update documentation and MEMORY topic files. ASK user before modifying rule files (`.claude/rules/`).

### Step 5: Update STATUS.md and TASKS.md

**STATUS.md** — Update with today's progress:
- Current Phase section: update task status
- Metrics: update test counts, endpoint counts if changed
- Move completed items, update `Last Updated` date

**TASKS.md** — Update task list:
- Mark completed items as `[x]` with commit hashes
- Add new tasks discovered during the day
- Reprioritize if needed

### Step 6: Update MEMORY.md

- Current State: Update phase/step progress
- Recent Work Summary: Add today's accomplishments (one entry per day, not per session)
- Known Issues: Add newly discovered issues
- Topic files: Updated in Step 4 above

---

## Phase 3.5: Validate Status Accuracy (30 seconds)

Quick drift check — catches stale STATUS.md/ROADMAP.md before they mislead future sessions.

### Test count validation

```bash
# Count actual backend tests
ACTUAL_TESTS=$(grep -r "it(" apps/api --include="*.test.ts" -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
echo "Actual backend tests: $ACTUAL_TESTS"

# Check what STATUS.md claims (look for test count mention)
grep -i "test" STATUS.md | head -5
```

If mismatch > 10%, update STATUS.md with the actual count.

### Phase status validation

```bash
# Check recent commits for phase-relevant work
git log --oneline -15
```

Compare against ROADMAP.md phase status. If commits show phase work but ROADMAP says "Not started", flag and update.

**Output:** "Status files accurate" OR "Updated STATUS.md (test count: X → Y)"

---

## Phase 4: Commit Work (1 minute)

### If Uncommitted Changes Exist

```bash
# Stage changes
git add [files]

# Commit with clear message
git commit -m "feat: [description of what was done]

[Optional details]"

# Check status
git status
```

**Commit message guidelines:**

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Keep first line under 72 characters
- Reference issue/PR if relevant

### If Already Committed

```bash
# Check log
git log --oneline -3

# Note: Work is already saved ✓
```

---

## Phase 5: Plan Tomorrow (1 minute)

### Set Tomorrow's Focus

Add to top of TASKS.md:

```markdown
## 📅 Tomorrow's Focus (YYYY-MM-DD)

**Primary Goal:** [One clear objective]

**Tasks:**
1. [ ] [Task 1 - should take 1-2 hours]
2. [ ] [Task 2 - should take 1-2 hours]
3. [ ] [Task 3 - backup if time permits]

**Context:** [Any notes to help start quickly]
```

### Quick Recommendations

Based on today's work:

**If you completed a feature:**

- → Tomorrow: Run `/processes:review` for code review
- → Write tests if not already done
- → Update documentation

**If you're mid-implementation:**

- → Tomorrow: Continue from [specific file/function]
- → Remember: [any gotchas discovered today]

**If you hit blockers:**

- → Tomorrow: Resolve [blocker] first
- → Consider: [alternative approach if blocker persists]

---

## Final Checklist

Before ending session:

- [ ] Temp files deleted or moved to correct locations
- [ ] STATUS.md updated with current state
- [ ] TASKS.md updated (completed marked, new tasks added)
- [ ] MEMORY.md updated if new patterns discovered
- [ ] Work committed with clear message (or already committed)
- [ ] Tomorrow's focus added to TASKS.md
- [ ] No uncommitted changes (or intentionally left for tomorrow)

---

## Output Format

```markdown
# 📝 End of Day Summary - YYYY-MM-DD

## ✅ Completed Today
- [x] [Task 1 completed]
- [x] [Task 2 completed]

## 📊 Files Changed
- [count] files modified
- [count] files added
- [count] commits made

## 📚 Documentation Updated
- [x] STATUS.md
- [x] TASKS.md
- [x] MEMORY.md (if applicable)

## 🎯 Tomorrow's Focus
**Primary Goal:** [Tomorrow's main objective]

## 🧹 Cleanup
- [x] Temp files deleted
- [x] Artifacts organized
- [x] Work committed

---

**Session closed. Great work today! 🎉**
```

---

_Lines: ~250 (slimmed from 529). Focuses on essential 5-phase workflow._
