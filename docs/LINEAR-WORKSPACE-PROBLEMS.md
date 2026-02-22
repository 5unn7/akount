# Linear Workspace - Critical Issues Report

> **Generated:** 2026-02-21
> **Workspace:** akount (Chirag Marakana)
> **Organization Health:** 🔴 CRITICAL

---

## Executive Summary

The Linear workspace is **severely disorganized** and effectively **non-functional**. While the infrastructure exists (16 teams, 37 labels, 50 workflow states), there are **ZERO issues** in the entire workspace.

**Critical Finding:** This is not a "clean slate" — it's a sign that either:
1. Issues were never migrated from TASKS.md to Linear
2. Issues were created and then deleted/archived
3. API permissions are restricting visibility
4. The workspace was recently reset

---

## 🚨 Critical Problems

### 1. **ZERO Issues in Workspace**

**Status:** 🔴 CRITICAL - Blocks all Linear functionality

**Evidence:**
- Total issues: 0
- Backlog issues: 0
- In Progress: 0
- Completed: 0
- Projects: 0
- Cycles: 0

**Impact:**
- No work tracking possible
- No sprint planning
- No progress visibility
- No dependency management
- Renders Linear completely useless

**Root Cause:**
- Migration from TASKS.md never executed successfully
- OR issues were created and then mass-deleted
- `.claude/linear-sync-state.json` exists but sync likely failed

---

### 2. **Duplicate Workflow States (50 States, Most Duplicates)**

**Status:** 🔴 CRITICAL - Violates workflow consistency

**Evidence:**
```
NO_TEAM:
  - Triage (triage) × 11 duplicates
  - In Progress (started) × 6 duplicates
  - Done (completed) × 6 duplicates
  - Backlog (backlog) × 5 duplicates
  - Canceled (canceled) × 6 duplicates
  - Duplicate (canceled) × 5 duplicates
  - Todo (unstarted) × 6 duplicates
```

**Impact:**
- Users won't know which state to use
- Reporting breaks (same state name, different IDs)
- Filters and automation fail
- Team-specific workflows impossible

**Why This Happened:**
- Automated setup scripts created states per-team
- States weren't linked to teams (all show `NO_TEAM`)
- Linear API likely rejected team association, created orphans

**Fix Required:**
1. Delete all duplicate states
2. Create ONE canonical set per team:
   - Backlog
   - Todo
   - In Progress
   - Done
   - Canceled
3. Associate states with teams explicitly

---

### 3. **No Projects Created**

**Status:** 🟠 HIGH - Prevents work organization

**Evidence:**
- Projects: 0
- No way to group related issues
- No milestone tracking

**Impact:**
- Can't track Phase 6 work separately from Phase 7
- Can't create roadmap views
- Can't measure project completion

**Expected Projects (Based on TASKS.md):**
- Phase 6 (Frontend + Polish)
- Phase 7 (Advanced Features)
- Security Hardening
- Performance Optimization
- Design System Evolution
- Infrastructure Upgrades

---

### 4. **No Active Cycles**

**Status:** 🟠 HIGH - No sprint planning

**Evidence:**
- Active Cycles: 0
- No sprint boundaries
- No velocity tracking

**Impact:**
- Can't plan sprints
- Can't measure team velocity
- No time-boxing for work
- No burn-down charts

**Standard Cycle Setup:**
- 2-week sprints
- Auto-advance on completion
- Cooldown period for planning

---

### 5. **Teams Exist But No Work Assigned**

**Status:** 🟡 MEDIUM - Structural only

**Evidence:**
- 16 teams created
- 0 issues across all teams
- Teams are mirrors of TASKS.md domains

**Teams:**
```
PROD   - Product (general)
BOPS   - Business Ops
CONT   - Content
GROW   - Growth
INFRA  - Infrastructure
CS     - Customer Success
OPERA  - Operations
MARKE  - Marketing
DESIG  - Design System
PLAT   - Platform
AI     - Insights
PLAN   - Planning
ACCT   - Accounting
BIZ    - Business
BANK   - Banking
OVER   - Overview
```

**Assessment:**
- Team structure is **good** (mirrors TASKS.md domains)
- BUT: No work assigned to any team
- **16 teams might be too many** for a small team (recommended: 4-6)

**Recommended Consolidation:**
```
CORE   - Product + Platform + Infrastructure
DOMAIN - Banking + Business + Accounting + Planning + AI + Overview
OPS    - Operations + Customer Success + Business Ops
GTM    - Marketing + Growth + Content
DESIGN - Design System (standalone)
```

---

### 6. **Labels Exist But Not Used**

**Status:** 🟢 LOW - Labels are ready

**Evidence:**
- 37 labels created
- Good coverage: priority, effort, phase, type, severity
- BUT: 0 issues to label

**Label Categories:**
- **Priority:** 🔴 Critical, 🟠 High, 🟡 Medium, ⚪ Low
- **Effort:** 1 SP (1h), 2 SP (2h), 3 SP (3h), 5 SP (4h), 8 SP (8h)
- **Phase:** Phase 6, Phase 7
- **Type:** Feature, Bug, Improvement
- **Severity:** sev-1, sev-2, production-down, churn-risk
- **Impact:** affects-100+, affects-1000+
- **Source:** Review, Audit, Plan, Diagnose, Brainstorm, Manual
- **Category:** Security, Performance, Financial, UX, Test, Refactor, Architecture, Infrastructure

**Assessment:** ✅ Well-structured label system, ready to use once issues exist

---

## 📊 Dependency & Workflow Problems

### 7. **No Dependency Tracking Infrastructure**

**Status:** 🟡 MEDIUM

**Missing:**
- Parent-child issue relationships
- Blocked/blocking status
- Dependency graphs
- Critical path identification

**TASKS.md Has Dependencies:**
```
DS-3: Build token sync pipeline [needs: DS-1]
SEC-9: Add rate limiting [blocks: INFRA-2]
```

**Linear Can't Track:** No issues = no relationships

---

### 8. **No Custom Fields for TASKS.md Metadata**

**Status:** 🟡 MEDIUM

**Missing Custom Fields:**
- `Source` (review, plan, diagnose, audit, manual)
- `Phase` (should be project, not label)
- `Effort` (1-2h, 2-4h, >4h)
- `Domain` (banking, invoicing, accounting, etc.)

**Why This Matters:**
- TASKS.md has rich metadata
- Linear loses this context in basic issue format
- Filtering and reporting becomes harder

---

## 🔧 Root Cause Analysis

### Why Is The Workspace Empty?

**Hypothesis 1: Migration Never Ran Successfully**

Evidence:
- `.claude/linear-sync-state.json` exists (likely empty or failed state)
- No import logs showing successful task creation
- TASKS.md has 256 tasks, Linear has 0

**Hypothesis 2: API Permissions Issue**

Evidence:
- Viewer can see teams, labels, states
- BUT can't see issues (even though 0 exist)
- Possible: Issues exist but are hidden from API viewer

**Hypothesis 3: Mass Deletion or Archive**

Evidence:
- 50 workflow states suggest many issues were created
- Duplicate states indicate per-issue state creation (anti-pattern)
- Someone may have archived/deleted all issues

**Most Likely:** Combination of #1 and #2 — migration was attempted, partially failed, and issues were deleted in frustration.

---

## 💡 Recommendations (Prioritized)

### Phase 1: Reset & Clean (IMMEDIATE)

**Priority:** 🔴 CRITICAL

1. **Delete duplicate workflow states**
   - Keep 1 canonical state per team per type
   - Associate states with teams explicitly
   - Verify in Linear UI after deletion

2. **Create 5-6 projects** (not 16)
   - Phase 6 - Frontend & Polish
   - Phase 7 - Advanced Features
   - Security & Performance
   - Design System
   - Infrastructure
   - Content & Marketing

3. **Set up 1 active cycle** (2-week sprint)
   - Start date: Monday of current week
   - Auto-advance enabled
   - Cooldown: 2 days for planning

---

### Phase 2: Data Migration (HIGH)

**Priority:** 🟠 HIGH

1. **Migrate TASKS.md to Linear** (256 tasks)
   - Use `linear-import-all-tasks.ts` (fix path issue)
   - Batch import: 50 tasks at a time (API rate limits)
   - Verify: Total issues === 256 after import

2. **Map TASKS.md metadata to Linear fields**
   - Priority → Linear priority (1-4)
   - Status → Workflow state (Backlog/Todo/In Progress/Done)
   - Domain → Team assignment
   - Source → Label
   - Dependencies → Parent-child relationships

3. **Create custom fields**
   - `Original ID` (text) — stores TASKS.md ID (e.g., SEC-9)
   - `Effort` (dropdown) — <1h, 1-2h, 2-4h, >4h
   - `Phase` (number) — 6, 7, 8, etc.

---

### Phase 3: Workflow Automation (MEDIUM)

**Priority:** 🟡 MEDIUM

1. **Auto-assign to current cycle** when moved to "In Progress"
2. **Auto-label "needs-triage"** for new issues without priority
3. **Block transitions** if dependencies not met
4. **Slack notifications** for:
   - Issues stalled >3 days in "In Progress"
   - Issues moved to "Done" (team wins!)
   - Critical/sev-1 issues created

---

### Phase 4: Bi-Directional Sync (LOW)

**Priority:** 🟢 LOW

1. **Linear → TASKS.md sync** (weekly)
   - Export completed issues
   - Update TASKS.md checkboxes
   - Preserve TASKS.md as canonical source

2. **TASKS.md → Linear sync** (on demand)
   - Add new tasks from brainstorms/reviews
   - Update priorities/estimates
   - Maintain both systems in lockstep

**Note:** Don't attempt this until Phase 2 migration is stable.

---

## 🎯 Success Metrics

| Metric | Current | Target (1 week) | Target (1 month) |
|--------|---------|-----------------|------------------|
| Total Issues | 0 | 256 | 300+ |
| Issues in Active Cycle | 0 | 20-30 | 40-50 |
| Projects Created | 0 | 6 | 8-10 |
| Duplicate States | 50 | 5 teams × 5 states = 25 | 25 |
| Issues with Priority | 0% | 90%+ | 95%+ |
| Issues with Estimate | 0% | 80%+ | 90%+ |
| Issues with Assignee | 0% | 60%+ | 75%+ |
| Stalled Issues (>7d) | N/A | <5 | <3 |
| Workspace Health Score | 0/100 | 70/100 | 85/100 |

---

## 🚀 Quick Wins (Do These First)

### 1. Fix Workflow States (15 min)

```bash
# Script to delete duplicate states (TBD)
node .claude/scripts/linear-cleanup-duplicate-states.ts
```

### 2. Create Projects (10 min)

Manually in Linear UI:
- Phase 6 - Frontend & Polish
- Phase 7 - Advanced Features
- Security & Performance
- Design System
- Infrastructure

### 3. Start First Cycle (5 min)

Linear UI → Settings → Cycles → Enable
- Duration: 2 weeks
- Start: Next Monday
- Auto-advance: Yes

### 4. Import First Batch (30 min)

```bash
# Import Critical tasks only (test run)
export LINEAR_API_KEY=...
node .claude/scripts/linear-import-tasks.ts --filter=priority:Critical --limit=20
```

**Verify:** Check Linear UI shows 20 issues with correct metadata

---

## 📋 Action Plan (Week 1)

### Monday (Setup Day)
- [ ] Delete duplicate workflow states
- [ ] Create 5 projects
- [ ] Enable cycles, start first sprint
- [ ] Test import with 10 tasks

### Tuesday (Migration Day)
- [ ] Import all Critical tasks (est. 40)
- [ ] Import all High tasks (est. 80)
- [ ] Verify metadata mapping
- [ ] Fix any import errors

### Wednesday (Medium/Low Tasks)
- [ ] Import Medium tasks (est. 100)
- [ ] Import Low tasks (est. 36)
- [ ] Total check: 256 tasks in Linear

### Thursday (Validation)
- [ ] Verify dependencies (parent-child)
- [ ] Assign tasks to teams
- [ ] Set priorities
- [ ] Add estimates

### Friday (Workflow Test)
- [ ] Move 5 tasks to "In Progress"
- [ ] Assign to current cycle
- [ ] Complete 2-3 tasks
- [ ] Verify state transitions work

---

## ⚠️ What NOT To Do

1. ❌ **Don't create more teams** — 16 is already too many
2. ❌ **Don't create custom workflows per team** — keep it simple
3. ❌ **Don't manually create all 256 tasks** — use batch import
4. ❌ **Don't set up automations before data migration** — breaks on empty workspace
5. ❌ **Don't delete TASKS.md** — it's still the canonical source until sync is stable

---

## 🏁 Definition of Done

The Linear workspace is "fixed" when:

- ✅ 0 duplicate workflow states
- ✅ 5-6 projects exist and categorize all work
- ✅ 1 active cycle is running
- ✅ 256 tasks from TASKS.md are imported
- ✅ 90%+ tasks have priority set
- ✅ 80%+ tasks have estimate
- ✅ 70%+ tasks assigned to team
- ✅ Dependencies are represented as parent-child
- ✅ Team can complete 1 sprint cycle end-to-end
- ✅ Workspace Health Score ≥ 70/100

---

**Next Step:** Run Phase 1 cleanup scripts and manually create projects/cycles in Linear UI.
