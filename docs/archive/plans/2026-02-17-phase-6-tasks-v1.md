# Phase 6: Launch MVP + Hardening — Detailed Task Breakdown

**Created:** 2026-02-17
**Scope:** Infrastructure-first approach for parallel agent coordination
**Reference:** See `C:\Users\Sunny\.claude\plans\smooth-floating-mountain.md` for full context

---

## Phase 0: Infrastructure Implementation (4-6 hours)

**Objective:** Build complete tracking system before starting Phase 1-5 features

---

### Sprint 0.1: Core Coordination Files (1-2 hours)

#### INFRA-0.1a: Create ACTIVE-WORK.md Structure (30 min)

**Status:** ✅ COMPLETE
**Dependencies:** None
**Files:** `ACTIVE-WORK.md` (root)

**Checklist:**
- [x] Create ACTIVE-WORK.md at project root
- [x] Add empty tables: Current Sessions, Completed Today, Task Allocation
- [x] Add auto-timestamp placeholder
- [x] Add usage instructions
- [x] Test: Manually add/remove session entries

---

#### INFRA-0.1b: Update TASKS.md with New Prefixes (30 min)

**Status:** ✅ COMPLETE
**Dependencies:** None
**Files:** `TASKS.md`

**Checklist:**
- [x] Add Phase 6 section with Track A/B/C breakdown
- [x] Convert Phase 0 infrastructure tasks to INFRA-X format
- [x] Convert Phase 5 P0 fixes to SEC-X format
- [x] Add dependency notation: `[dependency: none]`, `[dependency: TASK-ID]`
- [x] Add validation checklist

---

#### INFRA-0.1c: Create Phase 6 Detailed Task Breakdown (30 min)

**Status:** 🔄 IN PROGRESS
**Dependencies:** None
**Files:** `docs/phase-6-tasks.md` (this file)

**Checklist:**
- [x] Create file structure
- [ ] Add all INFRA tasks with dependencies
- [ ] Add all SEC tasks with dependencies
- [ ] Add all PERF tasks with dependencies
- [ ] Add all QUAL tasks with dependencies
- [ ] Add validation test details

---

### Sprint 0.2: Metrics Automation (1-2 hours)

#### INFRA-0.2a: Create update-metrics.sh Script (1 hour)

**Status:** ⏳ NOT STARTED
**Dependencies:** None
**Files:** `.claude/scripts/update-metrics.sh` (new)

**Implementation:**
```bash
#!/bin/bash
# Auto-extract metrics for STATUS.md

# Backend test count
cd apps/api && npm test -- --reporter=json > /tmp/api-test-results.json
BACKEND_TESTS=$(jq '.numPassedTests' /tmp/api-test-results.json)

# Frontend test count
cd ../web && npm test -- --reporter=json > /tmp/web-test-results.json
FRONTEND_TESTS=$(jq '.numPassedTests' /tmp/web-test-results.json)

# TypeScript errors
TSC_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS")

# NPM vulnerabilities
NPM_VULNS=$(npm audit --json | jq '.metadata.vulnerabilities | to_entries | map(.value) | add')

# Loading state coverage
PAGES=$(find apps/web/src/app/\(dashboard\) -name "page.tsx" | wc -l)
LOADING=$(find apps/web/src/app/\(dashboard\) -name "loading.tsx" | wc -l)

echo "BACKEND_TESTS=$BACKEND_TESTS"
echo "FRONTEND_TESTS=$FRONTEND_TESTS"
echo "TSC_ERRORS=$TSC_ERRORS"
echo "NPM_VULNS=$NPM_VULNS"
echo "LOADING_COVERAGE=$LOADING/$PAGES"
```

**Checklist:**
- [ ] Create `.claude/scripts/` directory if doesn't exist
- [ ] Create `update-metrics.sh` with above script
- [ ] Make executable: `chmod +x .claude/scripts/update-metrics.sh`
- [ ] Test: Run script manually, verify output format
- [ ] Verify jq is available (fallback to manual if not)

---

#### INFRA-0.2b: Add Metrics Tables to STATUS.md (30 min)

**Status:** ⏳ NOT STARTED
**Dependencies:** INFRA-0.2a (metrics script)
**Files:** `STATUS.md`

**Changes to make:**
1. Add Track Progress Table (Track A/B/C with percentages)
2. Add P0/P1 Fixes Status Table
3. Add Auto-Updated Metrics Table (test counts, TS errors, vulns, loading states)
4. Add timestamp and "Last Updated via /processes:eod" note

**Sample table structures in plan file Section 6.5 (lines 982-1024)**

**Checklist:**
- [ ] Read current STATUS.md
- [ ] Add "## Phase 6 Progress (Track A/B/C)" section
- [ ] Add track progress table with % done columns
- [ ] Add "### P0/P1 Fixes Status" table
- [ ] Add "### Test Coverage (Auto-Updated)" table with 6 metrics
- [ ] Add reference to ACTIVE-WORK.md for real-time work visibility

---

#### INFRA-0.2c: Wire Metrics into /processes:eod (30 min)

**Status:** ⏳ NOT STARTED
**Dependencies:** INFRA-0.2a (metrics script)
**Files:** `.claude/commands/processes/eod.md`

**Changes to make:**
1. Add step: "Run update-metrics.sh → parse output → update STATUS.md"
2. Add error handling (graceful fallback to manual if script fails)
3. Test: Run /processes:eod, verify STATUS.md updated

**Checklist:**
- [ ] Read `.claude/commands/processes/eod.md`
- [ ] Add metrics extraction step (after session summary, before commit)
- [ ] Add parsing logic (extract BACKEND_TESTS, FRONTEND_TESTS, etc.)
- [ ] Add STATUS.md update step (replace metrics table values)
- [ ] Add error handling with graceful fallback message
- [ ] Test: Run /processes:eod manually

---

### Sprint 0.3: Workflow Integration (1-2 hours)

#### INFRA-0.3a: Implement 3-Tier /processes:begin (1 hour)

**Status:** ⏳ NOT STARTED
**Dependencies:** INFRA-0.1a (ACTIVE-WORK.md must exist)
**Files:** `.claude/commands/processes/begin.md`

**Changes to make:**
1. Add session detection logic (read ACTIVE-WORK.md, check last timestamp)
2. Implement Tier 1 (Full Standup): >2 hours since last session
3. Implement Tier 2 (Quick Claim): <2 hours since last session
4. Implement Tier 3 (No Process): Direct instruction without "begin"
5. Add ACTIVE-WORK.md display to dashboard
6. Add 7 Key Invariants to dashboard

**Tier 1 output:** Full git status, all tasks, 7 invariants, recommendations
**Tier 2 output:** Available tasks + active work only
**Tier 3 output:** (Handled in agent logic, not in skill file)

**Checklist:**
- [ ] Read `.claude/commands/processes/begin.md`
- [ ] Add logic to read ACTIVE-WORK.md and parse last timestamp
- [ ] Add conditional output based on time since last session
- [ ] Add 7 Key Invariants section to Tier 1 output
- [ ] Add "Active Work (Other Agents)" section showing current sessions
- [ ] Test: Run /processes:begin multiple times (should show Tier 1 first, then Tier 2)

---

#### INFRA-0.3b: Add /processes:claim Skill (30 min)

**Status:** ⏳ NOT STARTED
**Dependencies:** INFRA-0.1a (ACTIVE-WORK.md must exist)
**Files:** `.claude/commands/processes/claim.md` (new)

**Implementation:**
Lightweight entry point that:
1. Shows available tasks (dependency: none)
2. Shows active work (other agents)
3. Claims task (updates ACTIVE-WORK.md)
4. Creates minimal TodoWrite (3-4 items)

**Checklist:**
- [ ] Create `.claude/commands/processes/claim.md`
- [ ] Add task listing logic (read TASKS.md, filter `[dependency: none]`)
- [ ] Add active work display (read ACTIVE-WORK.md)
- [ ] Add task claiming flow (update ACTIVE-WORK.md with agent ID, timestamp)
- [ ] Add TodoWrite creation step
- [ ] Test: Run /processes:claim SEC-6.1b

---

#### INFRA-0.3c: Update /processes:end-session for ACTIVE-WORK.md (30 min)

**Status:** ⏳ NOT STARTED
**Dependencies:** INFRA-0.1a (ACTIVE-WORK.md must exist)
**Files:** `.claude/commands/processes/end-session.md`

**Changes to make:**
1. Add step: Move session from "Current Sessions" to "Completed Today"
2. Add step: Archive ACTIVE-WORK.md to `docs/archive/active-work/YYYY-MM-DD.md`
3. Add step: Update TASKS.md checkbox for completed task (if applicable)

**Checklist:**
- [ ] Read `.claude/commands/processes/end-session.md`
- [ ] Add ACTIVE-WORK.md session cleanup step
- [ ] Add logic to extract task ID from session (if present)
- [ ] Add TASKS.md checkbox update logic
- [ ] Test: Complete a task, run /processes:end-session

---

### Sprint 0.4: Invariants & Enforcement (1 hour)

#### INFRA-0.4a: Add 2 New Invariants to guardrails.md (30 min)

**Status:** ⏳ NOT STARTED
**Dependencies:** None
**Files:** `.claude/rules/guardrails.md`

**Changes to make:**
1. Add Invariant #6: Page Loading States (every page.tsx has loading.tsx + error.tsx)
2. Add Invariant #7: No Server/Client Module Mixing (no mixed imports)
3. Update pre-flight checklist to include both new invariants
4. Update "Common Mistakes to Avoid" section

**Sample text in plan file Section 6.3 (lines 867-877)**

**Checklist:**
- [ ] Read `.claude/rules/guardrails.md`
- [ ] Add Invariant #6 with rationale and enforcement method
- [ ] Add Invariant #7 with rationale and enforcement method
- [ ] Update pre-flight checklist (should now have 12 items)
- [ ] Update "Explicit Anti-Patterns" section

---

#### INFRA-0.4b: Add Hook Enforcement (30 min)

**Status:** ⏳ NOT STARTED
**Dependencies:** INFRA-0.4a (invariants defined)
**Files:** `.claude/hooks/hard-rules.sh`

**Changes to make:**
1. Add check: Grep for page.tsx without sibling loading.tsx/error.tsx
2. Add check: Grep for files with both 'use client' and server-only imports (prisma, fs, node:*)
3. Add error messages with file locations
4. Test: Create violating file, verify hook blocks commit

**Sample checks:**
```bash
# Check for page.tsx without loading.tsx
PAGES=$(find apps/web/src/app/\(dashboard\) -name "page.tsx")
for page in $PAGES; do
  dir=$(dirname "$page")
  if [ ! -f "$dir/loading.tsx" ] || [ ! -f "$dir/error.tsx" ]; then
    echo "ERROR: $page is missing loading.tsx or error.tsx"
    exit 1
  fi
done

# Check for mixed server/client modules
USE_CLIENT_FILES=$(grep -rl "^'use client'" apps/web/src)
for file in $USE_CLIENT_FILES; do
  if grep -q "import.*prisma\|import.*'fs'\|import.*'node:" "$file"; then
    echo "ERROR: $file mixes 'use client' with server-only imports"
    exit 1
  fi
done
```

**Checklist:**
- [ ] Read `.claude/hooks/hard-rules.sh`
- [ ] Add page loading state check
- [ ] Add mixed module check
- [ ] Add descriptive error messages
- [ ] Test: Create page.tsx without loading.tsx, try to commit (should fail)
- [ ] Test: Create file with 'use client' + prisma import, try to commit (should fail)

---

## Phase 0 Validation (30 min)

**Before starting Phase 1-5 features or Phase 6 feature work, verify infrastructure:**

### Validation Test 1: ACTIVE-WORK.md Tracked

```bash
git status | grep "ACTIVE-WORK.md"
# Should show: new file: ACTIVE-WORK.md (or modified if already committed)
```

**Pass criteria:** File exists and is tracked by git

---

### Validation Test 2: TASKS.md Uses New Format

```bash
grep "SEC-6.1a\|PERF-6.1a\|QUAL-6.1a\|INFRA-0.1a" TASKS.md
# Should return 4+ matches
```

**Pass criteria:** Phase 6 tasks use SEC/PERF/QUAL/INF prefixes

---

### Validation Test 3: /processes:begin 3-Tier System

```bash
# First run (should show Tier 1 Full Standup)
/processes:begin
# Should output: "## Session Dashboard (Full Context)" with 7 invariants

# Immediately run again (should show Tier 2 Quick Claim)
/processes:begin
# Should output: "## Quick Claim (Lightweight)" with just available tasks
```

**Pass criteria:** Different output based on session recency

---

### Validation Test 4: /processes:claim Works

```bash
/processes:claim SEC-6.1a
# Should update ACTIVE-WORK.md with new session entry
cat ACTIVE-WORK.md | grep "SEC-6.1a"
# Should show task in Current Sessions table
```

**Pass criteria:** Task claimed successfully, ACTIVE-WORK.md updated

---

### Validation Test 5: /processes:eod Auto-Updates Metrics

```bash
/processes:eod
# Should run update-metrics.sh and update STATUS.md
cat STATUS.md | grep "Backend Tests | 1009"
# Should show current test count
```

**Pass criteria:** STATUS.md metrics table updated with current values

---

### Validation Test 6: Hooks Block Violations

**Test 6a: Page without loading/error**
```bash
mkdir -p apps/web/src/app/\(dashboard\)/test-page
echo "export default function Page() { return <div>Test</div> }" > apps/web/src/app/\(dashboard\)/test-page/page.tsx
git add apps/web/src/app/\(dashboard\)/test-page/page.tsx
git commit -m "test: page without loading/error"
# Should FAIL with error message about missing loading.tsx
```

**Test 6b: Mixed server/client module**
```bash
echo "'use client'\nimport { prisma } from '@akount/db'" > apps/web/src/test-mixed.tsx
git add apps/web/src/test-mixed.tsx
git commit -m "test: mixed module"
# Should FAIL with error message about mixed imports
```

**Pass criteria:** Both commits blocked by hook with clear error messages

---

## Post-Validation: Feature Implementation Order

**After all 6 validation tests pass:**

### Week 1-2: Documentation Fixes (~3 hours)

- [ ] DOC-6.1a: Add plan-enforcement.md to CLAUDE.md Tier 1 (30 min)
- [ ] DOC-6.1b: Consolidate logging rules (30 min)
- [ ] DOC-6.1c: Elevate source preservation to explicit 5th invariant (30 min)
- [ ] DOC-6.1d: Archive .reviews/ contents to docs/reviews/ (30 min)

### Week 3-4: Phase 6 Track A (Security & Data Integrity) (~9 hours)

**SEC-6.1: Fix Phase 5 P0 Security Issues**
- [ ] SEC-6.1a: Client/Vendor tenant isolation in data export (15 min)
- [ ] SEC-6.1b: CSV injection fix in report-export service (15 min)
- [ ] SEC-6.1c: GL opening balance calculation (1-2 hr)
- [ ] SEC-6.1d: Split reports.ts server/client (30 min)
- [ ] SEC-6.1e: GL "Load More" Server Action (15 min)

**SEC-6.2: Security Audit**
- [ ] SEC-6.2a: OWASP top 10 check (1 hr)
- [ ] SEC-6.2b: SQL injection testing (1 hr)
- [ ] SEC-6.2c: CSRF protection review (1 hr)

### Week 5-6: Phase 6 Track B (Performance & Observability) (~8 hours)

**PERF-6.1: Fix Phase 5 P1 Performance Issues**
- [ ] PERF-6.1a: Cache all 7 reports (1 hr)
- [ ] PERF-6.1b: Cash Flow sign convention (2-3 hr)
- [ ] PERF-6.1c: Multi-entity currency validation (30 min)

**PERF-6.2: Replace console.log with Pino**
- [ ] PERF-6.2a: Wire up pino in Fastify (30 min)
- [ ] PERF-6.2b: Replace 7 production console.log calls (1 hr)
- [ ] PERF-6.2c: Add request-scoped logging (30 min)

**PERF-6.3: Database Indexes**
- [ ] PERF-6.3a: Add indexes for hot paths (1 hr)

### Week 7-8: Phase 6 Track C (Quality & Documentation) (~3.5 hours)

**QUAL-6.1: Add Loading/Error States**
- [ ] QUAL-6.1a: Create templates (15 min)
- [ ] QUAL-6.1b: Accounting pages (6 pages, 30 min)
- [ ] QUAL-6.1c: Banking pages (5 pages, 30 min)
- [ ] QUAL-6.1d: Remaining domains (19 pages, 45 min)

**QUAL-6.2: Fix NPM Vulnerabilities**
- [ ] QUAL-6.2a: Run npm audit fix (15 min)
- [ ] QUAL-6.2b: Review breaking changes (15 min)

**QUAL-6.3: Update Stale Documentation**
- [ ] QUAL-6.3a: STATUS.md (test counts, pages, Phase 5 status) (15 min)
- [ ] QUAL-6.3b: ROADMAP.md (Phase 5 complete, Phase 6 breakdown) (15 min)
- [ ] QUAL-6.3c: packages/db/CLAUDE.md (39 models, OnboardingProgress) (15 min)
- [ ] QUAL-6.3d: apps/web/CLAUDE.md (45 pages, new components) (15 min)

---

## Success Criteria

**Infrastructure is complete when:**
- [x] ACTIVE-WORK.md exists and tracks sessions
- [ ] TASKS.md uses SEC/PERF/QUAL/INF format
- [ ] /processes:begin has 3-tier output
- [ ] /processes:claim works
- [ ] /processes:eod auto-updates metrics
- [ ] guardrails.md has 7 invariants
- [ ] Hooks enforce new invariants

**Phase 6 is complete when:**
- [ ] All P0 security issues fixed (Track A)
- [ ] All P1 performance issues fixed (Track B)
- [ ] All 45 pages have loading/error states (Track C)
- [ ] npm vulnerabilities resolved
- [ ] Documentation up to date
- [ ] All tests passing (1100+ tests)

---

## Timeline Estimate

**Phase 0 (Infrastructure):** 4-6 hours (1-2 days)
- Sprint 0.1: 1-2 hours ✅ (COMPLETE)
- Sprint 0.2: 1-2 hours (⏳ NEXT)
- Sprint 0.3: 1-2 hours
- Sprint 0.4: 1 hour
- Validation: 30 min

**Phase 6 Feature Work:** 19-26 hours effort, ~2 weeks wall time (with 3 parallel agents)

**Total to MVP Launch:** ~3 weeks from infrastructure start

---

**Last Updated:** 2026-02-17
**Status:** Sprint 0.1 complete, Sprint 0.2 next
