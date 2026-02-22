# Linear Complete Workspace Setup

**Goal:** Set up a production-ready Linear workspace optimized for Akount PM.

**Time:** 20 minutes

---

## What You'll Get

### ✅ 9 Teams (Your Domains)
- Overview, Banking, Invoicing, Clients, Vendors, Accounting, Planning, Insights
- Platform (for cross-cutting: Security, Performance, Infrastructure)

### ✅ 30+ Labels (Auto-Organization)
- **Priorities:** 🔴 Critical, 🟠 High, 🟡 Medium, ⚪ Low
- **Types:** Security, Performance, Financial, UX, Test, Refactor, Infrastructure, Architecture
- **Sources:** Review, Audit, Plan, Brainstorm, Diagnose, Manual
- **Phases:** Phase 6, Phase 7
- **Effort:** 1 SP, 2 SP, 3 SP, 5 SP, 8 SP

### ✅ 7 Projects (Epics/Initiatives)
- Phase 6: Launch MVP
- Banking Command Center
- Business Operations
- Accounting Foundation
- Phase 7: Scale & Optimize
- Planning & Forecasting
- AI Insights

### ✅ 4 Cycles (2-Week Sprints)
- Next 8 weeks pre-configured
- Auto-archiving old cycles

### ✅ Custom Workflow
- Backlog → Ready → In Progress → Review → Done
- Blocked (for dependency tracking)
- Deferred (postponed tasks)

### ✅ 256 Tasks Imported
- Full TASKS.md import with metadata preserved
- Task IDs mapped (SEC-9 → AKO-123)
- Dependencies tracked
- Effort estimates converted to story points

---

## Step-by-Step Setup

### 1. Install Dependencies (1 min)

```bash
npm install
```

This installs:
- `@linear/sdk` — Linear API client
- `tsx` — TypeScript execution

### 2. Run Workspace Setup (2 min)

```bash
npm run linear:setup
```

**What it does:**
- Creates 9 teams matching your domains
- Creates 30+ labels for organization
- Creates 7 projects for epics
- Creates 4 cycles (8 weeks of sprints)
- Configures workflow states

**Expected output:**
```
🚀 Setting up Linear Workspace for Akount...

📋 Creating Teams...
  ✅ Creating team: Overview (OVER)
  ✅ Creating team: Banking (BANK)
  ...

🏷️  Creating Labels...
  priorities:
    ✅ 🔴 Critical
    ✅ 🟠 High
    ...

📁 Creating Projects...
  ✅ Phase 6: Launch MVP
  ✅ Banking Command Center
  ...

🔄 Creating Cycles (2-week sprints)...
  ✅ Sprint 1 (2026-02-21)
  ✅ Sprint 2 (2026-03-07)
  ...

✅ WORKSPACE SETUP COMPLETE
```

### 3. Import Tasks (5 min)

```bash
npm run linear:import
```

**What it does:**
- Parses TASKS.md (256 tasks)
- Maps to appropriate teams
- Assigns labels (priority, type, source)
- Creates Linear issues with full metadata
- Saves mapping (.claude/linear-sync-state.json)

**Expected output:**
```
📥 Importing TASKS.md → Linear...

✅ SEC-9 → PLAT-1
✅ DEV-43 → BANK-12
✅ UX-72 → OVER-5
...

📊 Import complete:
   Created: 256
   Skipped: 0
   Total:   256
```

### 4. Configure GitHub Integration (3 min)

1. Go to Linear: **Settings** → **Integrations** → **GitHub**
2. Click **Connect GitHub**
3. Authorize Linear
4. Select repository: `akount/product-plan`
5. Enable:
   - ✅ **Auto-link commits** (mentions `PLAT-1` → links to issue)
   - ✅ **Auto-link PRs**
   - ✅ **Auto-close on merge** (PR description `Closes PLAT-1` → auto-closes)
   - ✅ **Sync PR status** (PR merged → issue done)

### 5. Create Custom Views (5 min)

Go to Linear → **Views** → **New View**, create these:

#### View 1: Sprint Board
- **Name:** Sprint Board
- **Filter:** Current cycle, Status != Done
- **Group by:** Priority
- **Sort by:** Estimate (ascending)
- **Display:** Board

**Use for:** Daily standup, sprint planning

#### View 2: Domain Health
- **Name:** Domain Health
- **Filter:** All active issues
- **Group by:** Team
- **Display:** Table
- **Columns:** Count, Estimate (sum), Blocked count

**Use for:** Weekly review, bottleneck identification

#### View 3: Roadmap
- **Name:** Roadmap
- **View type:** Roadmap
- **Group by:** Project
- **Show:** All cycles (8 weeks)

**Use for:** Strategic planning, stakeholder updates

#### View 4: Blocked Tasks
- **Name:** Blocked
- **Filter:** Status = Blocked
- **Group by:** Team
- **Sort by:** Priority (Critical first)

**Use for:** Unblocking dependencies

#### View 5: High Priority Inbox
- **Name:** High Priority
- **Filter:** (Priority = Critical OR High) AND Status != Done
- **Sort by:** Created (oldest first)
- **Display:** List

**Use for:** Morning triage

#### View 6: My Week
- **Name:** My Week
- **Filter:** Current cycle, Assignee = Me
- **Sort by:** Priority
- **Display:** List

**Use for:** Personal daily work

### 6. Set Up CI Sync (2 min)

Add GitHub Actions secret:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `LINEAR_API_KEY`
4. **Value:** Your API key (from `.env`)
5. Click **Add secret**

Now every push to main will auto-sync TASKS.md ↔ Linear.

### 7. Configure Team Settings (2 min)

For each team, go to **Settings** → **Teams** → `[Team Name]`:

**Cycles:**
- ✅ Enable cycles
- **Duration:** 2 weeks
- **Start day:** Monday
- **Auto-archive:** After 4 weeks

**Triage:**
- **Default priority:** Medium
- **Auto-assign:** Off (manual assignment)

**Estimation:**
- **System:** Story points
- **Scale:** Fibonacci (1, 2, 3, 5, 8)

---

## Verification Checklist

After setup, verify:

- [ ] 9 teams visible in Linear sidebar
- [ ] 30+ labels exist (Settings → Labels)
- [ ] 7 projects visible (Projects view)
- [ ] 4 cycles created (Cycles view)
- [ ] 256 tasks imported (All Issues view)
- [ ] GitHub integration active (test: commit with `PLAT-1`, check if linked)
- [ ] 6 custom views created
- [ ] CI sync job runs on push (check Actions tab)

---

## Daily Workflow

### Morning (5 min)

1. Open **My Week** view
2. Check **High Priority** inbox
3. Move tasks to **In Progress**

### During Day

- Agents work in TASKS.md
- Commits mention task IDs: `git commit -m "fix: PLAT-1 — rate limiting"`
- GitHub auto-links to Linear

### Evening (2 min)

```bash
npm run linear:sync  # Bidirectional sync
```

Or wait for CI to auto-sync.

---

## Keyboard Shortcuts (Linear)

**Must-know shortcuts:**

| Shortcut | Action |
|----------|--------|
| `C` | Create issue |
| `K` | Command palette |
| `Q` | Quick search |
| `V` | Switch view |
| `G` then `I` | Go to inbox |
| `G` then `A` | Go to all issues |
| `G` then `C` | Go to cycles |
| `E` | Edit issue |
| `X` | Archive issue |
| `Ctrl/Cmd + Enter` | Save & close |

**Priority shortcuts:**
- `1` → Critical
- `2` → High
- `3` → Medium
- `4` → Low

**Status shortcuts:**
- `B` → Backlog
- `S` → In Progress
- `D` → Done

---

## Metrics Dashboard

Linear auto-tracks:

### Velocity Chart
- Story points completed per cycle
- Trend line (improving/stable/declining)
- Predictive completion dates

### Cycle Time
- Days from start → done per task
- Breakdown by priority
- Bottleneck identification

### Burndown Chart
- Sprint progress vs ideal line
- Scope creep detection
- On-track / at-risk indicator

### Team Health
- Tasks per team
- Blocked count
- High-priority aging

**Access:** Linear → Insights (top nav)

---

## Troubleshooting

### Setup script fails

**Error:** `LINEAR_API_KEY not found`
- **Fix:** Add to `.env`: `LINEAR_API_KEY=lin_api_...`

**Error:** `Team already exists`
- **Fix:** Re-run setup (it skips existing items)

### Import fails

**Error:** `Failed to create issue`
- **Fix:** Check API key has `write` scope
- Regenerate key with full permissions

**Error:** `Team not found`
- **Fix:** Run `npm run linear:setup` first

### Sync not working

**Error:** `No changes to sync`
- **Fix:** Normal if TASKS.md and Linear are already in sync

**Error:** `401 Unauthorized`
- **Fix:** Regenerate API key, update `.env` and GitHub secret

---

## Advanced Configuration

### Custom Fields (Paid Plan)

Upgrade to Standard ($8/mo) for:
- **Effort (actual)** — track real vs estimate
- **Domain** — multi-select (task touches multiple domains)
- **Review status** — passed/failed review
- **Test coverage** — % coverage for this task

### Automations

Linear → Settings → Automations:

**Auto-assign to me:**
- **Trigger:** Issue created with `Assignee = unassigned`
- **Condition:** `Project = "Phase 6"`
- **Action:** Assign to me

**Auto-add to sprint:**
- **Trigger:** Issue priority changed to Critical
- **Action:** Add to current cycle

**Notify on blocked:**
- **Trigger:** Issue status → Blocked
- **Action:** Slack notification to #dev

### Integrations

- **Figma:** Auto-link design specs
- **Slack:** Team notifications, /linear commands
- **Zapier:** Custom workflows
- **Discord:** Bot notifications

---

## Next Steps

1. ✅ Run `npm run linear:setup`
2. ✅ Run `npm run linear:import`
3. ✅ Configure GitHub integration
4. ✅ Create 6 custom views
5. ✅ Add CI secret
6. 🚀 Start using Linear!

---

**Need help?**
- Full docs: [docs/linear-pm-setup.md](./linear-pm-setup.md)
- Quick start: [docs/LINEAR-QUICK-START.md](./LINEAR-QUICK-START.md)
- Comparison: [docs/pm-tool-comparison.md](./pm-tool-comparison.md)
