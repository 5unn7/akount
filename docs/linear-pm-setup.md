# Linear PM Setup Guide

Complete guide to migrating from TASKS.md to Linear for product management.

---

## Why Linear?

**Current Problem:**
- TASKS.md is a flat file — 256 tasks, hard to prioritize/filter/track
- No velocity metrics, burndown charts, or sprint planning
- Can't see domain health at a glance
- No timeline views or roadmap visualization

**Linear Solves:**
- ✅ Multi-view (board, table, timeline, roadmap)
- ✅ Built-in velocity tracking, cycle metrics, burndown charts
- ✅ Git-native (auto-links commits, PRs, branches)
- ✅ Teams = domains (Banking, Invoicing, Accounting, etc.)
- ✅ Projects = epics (NUJ UX Overhaul, Banking Command Center)
- ✅ Cycles = 2-week sprints
- ✅ Beautiful, fast UI (actually enjoyable to use)

---

## Architecture: Hybrid System

**Linear** (PM work):
- Strategic planning (roadmap, initiatives)
- Sprint planning (cycles, velocity)
- Visual dashboards (burndown, domain health)

**TASKS.md** (Agent work):
- Source of truth for task metadata
- Agents read/write natively (no API calls)
- Git history of changes
- Offline-capable

**Sync Bridge**:
- Bidirectional sync: TASKS.md ↔ Linear
- Linear wins on conflicts (PM is source of truth)
- Agent updates push to Linear
- PM updates pull to TASKS.md

---

## Setup (30 Minutes)

### Step 1: Create Linear Workspace

1. Go to https://linear.app/
2. Sign up with GitHub
3. Create workspace: **Akount**
4. Skip onboarding wizard (we'll import tasks)

### Step 2: Get API Key

1. Go to https://linear.app/settings/api
2. Create Personal API Key
3. Copy key (starts with `lin_api_...`)
4. Save to `.env.local`:

```bash
# Add to root .env.local
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_ID=  # Leave blank for now, sync script will auto-detect
```

### Step 3: Install Dependencies

```bash
npm install
# Installs @linear/sdk, tsx
```

### Step 4: Import TASKS.md → Linear

```bash
npm run linear:import
```

**What it does:**
- Creates 9 teams (Dev, Banking, Invoicing, etc.)
- Creates priority labels (Critical, High, Medium, Low)
- Imports all 256 tasks as Linear issues
- Maps task IDs → Linear IDs (saved to `.claude/linear-sync-state.json`)
- Preserves metadata (source, deps, effort)

**Output:**
```
📥 Importing TASKS.md → Linear...

🔧 Setting up Linear workspace...
  Creating team: Banking
  Creating team: Invoicing
  Creating team: Accounting
  ...
  Creating label: Critical
  Creating label: High
  ...
✅ Workspace setup complete

✅ SEC-9 → AKO-123
✅ DEV-43 → AKO-124
✅ UX-72 → AKO-125
...

📊 Import complete:
   Created: 256
   Skipped: 0
   Total:   256
```

### Step 5: Configure GitHub Integration

1. In Linear: Settings → Integrations → GitHub
2. Connect your GitHub account
3. Select `akount/product-plan` repository
4. Enable:
   - ✅ Auto-link commits (mentions `AKO-123` → links to issue)
   - ✅ Auto-link PRs
   - ✅ Auto-close on merge (if PR description has `Closes AKO-123`)

### Step 6: Set Up Teams & Views

**Teams (Auto-Created):**
- Dev (SEC, PERF, FIN, DRY, UX, TEST, DEV, ARCH tasks)
- Banking
- Invoicing
- Accounting
- Planning
- Insights
- Design System
- Marketing & Content
- Operations

**Recommended Views:**

**1. Sprint Board (Active Cycle)**
- Filter: Current cycle, status != Done
- Group by: Priority
- Sort by: Estimate (ascending)

**2. Domain Health Dashboard**
- Filter: All active issues
- Group by: Team
- Show: Count, estimate sum, blocked issues

**3. Roadmap Timeline**
- View: Roadmap
- Group by: Project
- Show: All cycles (next 6 weeks)

---

## Daily Workflow

### Morning (PM Work in Linear)

1. **Open Linear → Active Cycle**
   - See today's tasks
   - Drag tasks to In Progress
   - Assign to yourself or agents

2. **Check Domain Health**
   - Banking: 15 tasks, 3 blocked
   - Accounting: 8 tasks, 1 high-priority
   - Invoicing: 12 tasks, backlog growing

3. **Plan Next Sprint**
   - Review backlog
   - Create next cycle (2 weeks)
   - Assign tasks to cycle based on velocity

### During Day (Agent Updates)

When agents complete tasks:

1. Agent marks task done in TASKS.md
2. Git commit includes task ID: `fix: SEC-9 — add rate limiting`
3. GitHub auto-links commit → Linear issue
4. Sync script runs (CI or manual): `npm run linear:sync`
5. Linear issue auto-closes (status → Done)

### Evening (Sync & Review)

```bash
# Pull PM updates from Linear → TASKS.md
npm run linear:pull

# Push agent updates from TASKS.md → Linear
npm run linear:push

# Or run both at once
npm run linear:sync
```

Review metrics:
- Velocity: 18 story points completed this sprint
- Cycle time: avg 1.2 days per task
- Burndown: on track for sprint goal

---

## Sync Behavior

### Linear → TASKS.md (PM Updates)

**What syncs:**
- Status changes (Todo → In Progress → Done)
- Title/description edits
- Priority changes
- Estimate updates
- Team/domain reassignments

**Conflict resolution:** Linear wins (PM is source of truth)

### TASKS.md → Linear (Agent Updates)

**What syncs:**
- Task completion (✅ done)
- New tasks (agents create via `/processes:plan`)
- Dependency updates (`[needs: X]`)
- Source tracking (`Source: review:security-sentinel`)

**Conflict resolution:** If task changed in both places since last sync, Linear wins

### Sync Frequency

**Recommended:**
- **CI/GitHub Actions:** Run `npm run linear:sync` on every push to main
- **Manual:** Run `npm run linear:sync` 2x/day (morning, evening)
- **Agents:** Can trigger via hook after completing tasks

---

## Migration Checklist

Before going live with Linear:

- [ ] Linear workspace created
- [ ] API key saved to `.env.local`
- [ ] Dependencies installed (`npm install`)
- [ ] Initial import completed (`npm run linear:import`)
- [ ] GitHub integration configured
- [ ] Teams & views customized
- [ ] First manual sync tested (`npm run linear:sync`)
- [ ] CI sync job added (GitHub Actions)

---

## Metrics Dashboard (Available in Linear)

**Velocity Chart:**
- Story points completed per cycle
- Trend line (improving, stable, declining)
- Predictive completion dates

**Cycle Time:**
- Days from start → done per task
- Breakdown by priority
- Identify bottlenecks

**Burndown Chart:**
- Sprint progress vs. ideal line
- Scope creep detection
- On-track / at-risk indicator

**Domain Health:**
- Tasks per team
- Blocked count
- High-priority aging

---

## Cost

**Linear Pricing (as of 2026-02):**
- **Free:** Up to 250 issues (PERFECT for you — 256 tasks)
- **Standard:** $8/user/month (unlimited issues, advanced features)
- **Plus:** $14/user/month (advanced analytics, custom fields)

**Recommendation:** Start on Free tier, upgrade to Standard when you add team members.

---

## FAQ

**Q: Do I have to stop using TASKS.md?**
No! TASKS.md stays as the source of truth. Sync keeps them in sync.

**Q: What if sync breaks?**
TASKS.md is always authoritative. You can re-import from scratch: `npm run linear:import --force`

**Q: Can agents use Linear directly?**
Yes, but not recommended. Agents are optimized for markdown. Let the sync handle it.

**Q: What about offline work?**
Edit TASKS.md offline. Sync will push changes to Linear when you're back online.

**Q: Can I customize Linear workflows?**
Yes! Linear is highly customizable (custom statuses, labels, templates, automations).

---

## Next Steps

1. **Complete setup** (30 min)
2. **Import tasks** (`npm run linear:import`)
3. **Use Linear for 1 week** (test workflows)
4. **Set up CI sync** (automate daily syncs)
5. **Customize views** (team-specific dashboards)
6. **Add team members** (when ready to scale)

---

**Need help?** See `.claude/scripts/linear-sync.ts` source code or Linear docs: https://linear.app/docs
