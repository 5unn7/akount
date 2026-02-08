# Workflow: End of Day (EOD)

**Purpose:** Close out your day productively by ensuring all work is saved, documentation is updated, and the next day is set up for success.

**When to Use:** Run at end of work session (end of day, end of week, before major break)

---

## Phase 1: Assess Current State

Before making any changes, understand what needs attention:

### Step 1: Review Git Status
```bash
git status --short
git diff HEAD --stat
```

**What to Look For:**
- Untracked files (??)?
- Modified files (M)?
- Staged files (already added)?
- Uncommitted changes?

### Step 2: Identify Temporary Files

Check for files that are only useful during the session:
- Session notes and brainstorm files
- Review reports
- Debug output files
- Temporary exploration code
- Code review session exports

**Pattern to identify:**
- `WEEK_YYYY-MM-DD*.md` (session archives)
- `CODE_REVIEW_*.md` (review reports)
- `*_TEMP.md` (temporary notes)
- `.agent/` directory (temporary agent work)
- `*_errors.txt` (build errors)
- `*_output.json` (temporary exports)

### Step 3: Identify Valuable Files

Check for files that SHOULD be kept in appropriate locations:
- Implementation plans (→ `docs/plans/`)
- Feature brainstorms (→ `docs/brainstorms/`)
- Architecture decisions (→ `docs/architecture/`)
- Performance analyses (→ `docs/archive/sessions/`)
- Engineering compounds (→ `docs/archive/sessions/`)

---

## Phase 2: Clean Up Temporary Files

### Step 2a: Review Files in Root

Files that should NOT be in project root:
- `*_tsc_errors.txt` - TypeScript build errors (temporary)
- `*_errors.txt` - Temporary error logs
- `.agent/` directory - Temporary agent scratch space

**Action:** Delete these files

```bash
rm -f *_tsc_errors.txt *_errors.txt api_tsc_errors.txt
rm -rf .agent/
```

### Step 2b: Review Files in app directories

Check `apps/api/` and `apps/web/`:
- `tsconfig.tsbuildinfo` - Build artifacts
- `dist/` - Compiled output
- Any temporary test files

**Note:** These may be needed for rebuilds. Only delete if they're:
- Clearly build artifacts
- Updated by build process (can be regenerated)
- Not needed for next day

**Action:** Let build tools regenerate these on next run

### Step 2c: Review Temporary Session Files

In `docs/` or root:
- `WEEK_*.md` files → move to `docs/archive/sessions/`
- `CODE_REVIEW_*.md` → move to `docs/archive/sessions/`
- `PERFORMANCE_*.md` → move to `docs/archive/sessions/`
- `COMPOUND_*.md` → move to `docs/archive/sessions/`

**Action:** Move (don't delete) to proper location

---

## Phase 3: Organize Valuable Artifacts

### Step 3a: Move Architecture Decisions
Any files discussing architecture, schema design, or system decisions:
- Source: Root or session directory
- Destination: `docs/architecture/`
- Pattern: Move and rename with date if needed

### Step 3b: Move Feature Brainstorms
Brainstorm documents from today's session:
- Source: Root or `.claude/` directory
- Destination: `docs/brainstorms/`
- Naming: `YYYY-MM-DD-<topic>-brainstorm.md`

### Step 3c: Move Implementation Plans
Plans created during planning sessions:
- Source: Anywhere in project
- Destination: `docs/plans/`
- Naming: `YYYY-MM-DD-<feature>-plan.md`

---

## Phase 4: Update Core Documentation

### Step 4a: Update STATUS.md

Review and update your current progress:

1. **Update Progress Section**
   - Check off completed tasks
   - Note any blockers
   - Update timestamp: `Last Updated: YYYY-MM-DD`

2. **Update Phase Status**
   - Move tasks from "In Progress" to "Completed"
   - Update percentage complete
   - Note any phase changes

3. **Update Current Work Section**
   - What were you working on?
   - What's partially complete?
   - What's ready for tomorrow?

**Example:**
```markdown
# Akount - Current Status

**Last Updated:** 2026-02-01
**Overall Progress:** Phase 0 Complete (100%) → Moving to Phase 1
**Current Focus:** Dashboard real data integration

## Current Work
- [x] Feature X implemented
- [x] Tests written for feature X
- [ ] Feature Y in progress (70% complete)
  - Remaining: API endpoint for Y
  - Blocker: Need schema change (approved)
```

### Step 4b: Update TASKS.md

Reflect what actually happened vs. what was planned:

1. **Mark Completed Tasks**
   - Update any ✅ checkboxes
   - Add completion date if tracking
   - Move to "COMPLETED" section if organizing

2. **Update In-Progress Tasks**
   - Note current state (80% complete, waiting on X, etc.)
   - Update estimated remaining work
   - Note any blockers or dependencies

3. **Create Tomorrow's Tasks**
   - Based on what didn't finish today
   - Based on next phase requirements
   - Based on roadmap priorities

**Example:**
```markdown
## ✅ Completed Today (2026-02-01)
- [x] Task A - Completed in 2 hours
- [x] Task B - Completed with refactoring

## 🚧 In Progress
- [ ] Task C (75% done)
  - Completed: API route
  - Remaining: Frontend component
  - ETA: Tomorrow AM

## 📋 Tomorrow's Tasks (2026-02-02)
1. Finish Task C frontend
2. Start Task D
3. Code review of Task B changes
```

### Step 4c: Update ROADMAP.md

Check if any phase status changed:

1. **Update Phase Status**
   - Mark completed phases ✅
   - Move phase markers (→ 🚧 In Progress, etc.)
   - Update percentages

2. **Update Effort Estimates** (if applicable)
   - Did tasks take longer/shorter than estimated?
   - Adjust Phase X estimates based on learnings
   - Note any major blockers

3. **Check Next Phase**
   - Is Phase X ready to start?
   - Any dependencies blocking it?
   - Update "Next Phase" section

**Example:**
```markdown
## Phase 0: Foundation (90% COMPLETE ✅)
- [x] 0.1 Authentication
- [x] 0.2 Database Setup
- [x] 0.3 API Foundation
- [x] 0.4 First Vertical Slice
- [ ] 0.5 Testing (Ready after API complete)

## Phase 1: Accounts Overview (READY TO START)
Goal: Build financial dashboard

### Status: Not Started
Prerequisites: ✅ All complete
Estimated Start: 2026-02-02
```

---

## Phase 5: Git Operations

### Step 5a: Review and Stage Changes

```bash
# See what changed
git status --short

# Review changes
git diff HEAD

# Stage what you want to keep
git add <specific-files>
```

**What to Stage:**
- ✅ Updated STATUS.md, TASKS.md, ROADMAP.md
- ✅ New documentation files (moved to proper locations)
- ✅ New implementation plans/brainstorms
- ✅ Code changes (features, fixes)
- ✅ Test changes

**What NOT to Stage:**
- ❌ `*_errors.txt` (deleted already)
- ❌ `node_modules/` changes (shouldn't appear)
- ❌ `.env` or secrets
- ❌ Build artifacts (`dist/`, `*.tsbuildinfo`)

### Step 5b: Create Meaningful Commit

Use a clear commit message that describes what changed:

```bash
git commit -m "$(cat <<'EOF'
docs: Update end-of-day status and organize session artifacts

- Update STATUS.md with today's progress
- Reorganize TASKS.md for tomorrow's sprint
- Move session artifacts to docs/archive/
- Clean up temporary build files

Topics: documentation, project-maintenance
EOF
)"
```

**Good Commit Messages:**
- `docs: Update STATUS.md after Phase 0 completion`
- `feat: Implement dashboard with real data`
- `fix: Correct tenant isolation in entities endpoint`
- `chore: Clean up temporary session files`

**Format:** `<type>: <description>`
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `chore:` - Maintenance, cleanup, tooling
- `refactor:` - Code restructuring

### Step 5c: Push to Remote

```bash
git push origin main
```

**Note:** Only do this if you're confident in your changes. If you're still iterating, you can push to a feature branch instead.

---

## Phase 6: Next Session Preparation

### Step 6a: Create Session Notes for Tomorrow

Create a brief handoff document:

**File:** `docs/archive/sessions/TOMORROW-SESSION-PREP.md`

```markdown
# Session Prep for Tomorrow (2026-02-02)

## What's Complete
- [x] Phase 0 foundation
- [x] Bank import feature
- [x] AI categorization setup

## What's Ready to Start
- [ ] Dashboard with real data (Phase 1.1)
  - API ready: GET /api/accounts
  - Frontend: Partial (needs real data binding)
  - Effort: ~4 hours remaining

## Blocked By
- None currently

## Next Actions
1. Complete dashboard component (where you left off)
2. Test with real database query
3. Add entity filter dropdown

## Quick Links
- Implementation Plan: docs/plans/2026-02-01-phase1-accounts-plan.md
- Current Roadmap: ROADMAP.md (updated end-of-day)
- Task List: TASKS.md (updated end-of-day)
```

### Step 6b: Review Tomorrow's Tasks

Verify TASKS.md clearly shows:
- [ ] What needs to be done
- [ ] Priority order
- [ ] Any blocking dependencies
- [ ] Estimated effort

---

## Phase 7: Final Checklist

Before closing your session, verify:

- [ ] All meaningful code changes are committed
- [ ] STATUS.md updated with today's progress
- [ ] TASKS.md updated with tomorrow's priorities
- [ ] ROADMAP.md updated with phase status
- [ ] Temporary files deleted (errors, build artifacts)
- [ ] Session artifacts moved to docs/archive/
- [ ] Valuable brainstorms/plans moved to appropriate folders
- [ ] Git pushed to remote
- [ ] Next session has clear starting point

---

## Phase 8: Context Documentation Update

Check if session changes require updates to context documentation.

### Step 8a: Review Session Changes

```bash
# Check what files were modified this session
if [ -f .claude/session-changes.log ]; then
  echo "Files modified this session:"
  cat .claude/session-changes.log
fi

# Check context update flags
if [ -f .claude/context-update-flags.txt ]; then
  echo ""
  echo "Context updates needed:"
  cat .claude/context-update-flags.txt
fi
```

### Step 8b: Schema Changes → Update domain-glossary.md

**If schema.prisma was modified:**

```bash
# Check for schema changes
git diff HEAD~5 -- packages/database/prisma/schema.prisma | head -50
```

**Update checklist:**
- [ ] New models added → Add to domain glossary
- [ ] Fields renamed → Update references
- [ ] Relationships changed → Update cross-references
- [ ] Invariants affected → Update invariant documentation

```bash
# Open glossary for update
cat docs/domain-glossary.md
```

### Step 8c: Route/Service Changes → Update repo-map.md

**If API routes or services were added/modified:**

```bash
# Check for route changes
git diff HEAD~5 -- apps/api/src/domains/ --stat
```

**Update checklist:**
- [ ] New domain created → Add to domain list
- [ ] New routes added → Update quick navigation table
- [ ] Patterns changed → Update "Common Patterns" section

```bash
# Open repo map for update
cat docs/repo-map.md | head -80
```

### Step 8d: Architecture Changes → Update architecture.mmd

**If middleware, plugins, or system structure changed:**

```bash
# Check for architectural changes
git diff HEAD~5 -- apps/api/src/middleware/ apps/api/src/plugins/ --stat
```

**Update checklist:**
- [ ] New service added → Update System Overview diagram
- [ ] Request flow changed → Update Request Flow sequence
- [ ] State machine modified → Update relevant state diagram
- [ ] Permissions changed → Update Permission Model diagram

```bash
# Open architecture diagrams for update
cat docs/architecture.mmd | head -100
```

### Step 8e: Clear Context Flags

```bash
# Archive today's context flags
if [ -f .claude/context-update-flags.txt ]; then
  mv .claude/context-update-flags.txt \
     docs/archive/sessions/context-flags-$(date +%Y-%m-%d).txt
fi

# Clear session state for next session
rm -f .claude/session-state.json
rm -f .claude/session-changes.log
```

### Step 8f: Context Update Summary

Generate summary of context documentation updates:

```markdown
## Context Documentation Updates - [Date]

### Updated Files
- [ ] docs/domain-glossary.md - [Reason if updated]
- [ ] docs/repo-map.md - [Reason if updated]
- [ ] docs/architecture.mmd - [Reason if updated]
- [ ] CLAUDE.md - [Reason if updated]

### Deferred Updates
- [Any updates deferred to next session]

### Notes for Next Session
- [Any context notes for continuity]
```

---

## Quick Reference

**Files to Update:**
- `STATUS.md` - Overall progress and current work
- `TASKS.md` - What's complete, what's next
- `ROADMAP.md` - Phase status and effort estimates

**Files to Delete:**
- `*_errors.txt`
- `*_tsc_errors.txt`
- `.agent/` directory
- Build artifacts (unless needed)

**Files to Move:**
- `*_brainstorm.md` → `docs/brainstorms/`
- `*_plan.md` → `docs/plans/`
- `WEEK_*.md` → `docs/archive/sessions/`
- `CODE_REVIEW_*.md` → `docs/archive/sessions/`

**Git Workflow:**
```bash
git status                    # See what changed
git add <specific-files>      # Stage important files
git commit -m "message"       # Commit with clear message
git push origin main          # Push to remote
```

---

## Tips for Success

**Make it Routine:**
- Run this workflow at the same time each day (e.g., 5:00 PM)
- Takes 15-20 minutes if you do it daily
- Prevents end-of-week scramble

**Keep Context Fresh:**
- Update TASKS.md while work is fresh in mind
- Document blockers and decisions
- Note time spent on each task

**Make Tomorrow Easy:**
- Write TODOs in TASKS.md as you discover them
- Leave next session with clear next steps
- Link to relevant documentation

**Version Control Discipline:**
- Commit daily (even if incomplete)
- Push at least weekly
- Use meaningful commit messages for git history navigation

---

**This workflow ensures nothing falls through the cracks and tomorrow you pick up exactly where you left off with full context.**
