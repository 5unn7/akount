# Linear Quick Start — 15 Min Setup

Get up and running with Linear PM in 15 minutes.

---

## 1. Create Linear Account (2 min)

1. Go to https://linear.app/
2. Sign up with GitHub
3. Create workspace: **Akount**
4. Skip wizard

---

## 2. Get API Key (1 min)

1. https://linear.app/settings/api
2. Create Personal API Key
3. Copy key (starts with `lin_api_...`)

---

## 3. Configure Local Env (1 min)

Add to `.env.local` (root of repo):

```bash
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_ID=  # Leave blank
```

---

## 4. Install & Import (5 min)

```bash
# Install dependencies
npm install

# Import all 256 tasks to Linear
npm run linear:import
```

**What you'll see:**
```
📥 Importing TASKS.md → Linear...
🔧 Setting up Linear workspace...
✅ SEC-9 → AKO-123
✅ DEV-43 → AKO-124
...
📊 Import complete: Created: 256
```

---

## 5. Configure GitHub Integration (3 min)

1. Linear → Settings → Integrations → GitHub
2. Connect account
3. Select `akount/product-plan` repo
4. Enable:
   - ✅ Auto-link commits
   - ✅ Auto-link PRs
   - ✅ Auto-close on merge

---

## 6. Create Recommended Views (3 min)

**Sprint Board:**
1. Linear → Views → New View
2. Name: "Sprint Board"
3. Filter: Current cycle
4. Group by: Priority
5. Save

**Domain Health:**
1. New View → Name: "Domain Health"
2. Group by: Team
3. Show: Count, Estimates, Blocked
4. Save

---

## 7. First Sync Test (1 min)

```bash
# Pull any changes from Linear
npm run linear:pull

# Push any local changes to Linear
npm run linear:push

# Or run both
npm run linear:sync
```

---

## ✅ You're Done!

**Next Steps:**
1. Open Linear: https://linear.app/akount
2. Browse your 256 tasks organized by domain
3. Start using Sprint Board for daily work
4. Run `npm run linear:sync` daily (or set up CI)

**Full docs:** [docs/linear-pm-setup.md](./linear-pm-setup.md)

---

## Daily Workflow

**Morning:**
1. Open Linear → Sprint Board
2. See today's tasks
3. Drag to In Progress

**During Day:**
- Agents work in TASKS.md (auto-synced)
- Commits auto-link to Linear issues
- Status updates flow to Linear

**Evening:**
```bash
npm run linear:sync  # Sync both ways
```

---

## Troubleshooting

**Import failed?**
- Check API key is correct
- Ensure `npm install` ran successfully
- Check `.claude/linear-sync-state.json` exists

**Sync not working?**
- Run `npm run linear:sync` manually
- Check Linear API status: https://status.linear.app/
- Verify TASKS.md format hasn't changed

**Missing tasks in Linear?**
- Re-run import: `npm run linear:import`
- Check sync state: `cat .claude/linear-sync-state.json`

---

## Environment Variables

Add to `.env.local`:

```bash
# Required
LINEAR_API_KEY=lin_api_...

# Optional (auto-detected)
LINEAR_TEAM_ID=
```

Get API key: https://linear.app/settings/api

---

**Questions?** Read full setup guide: [docs/linear-pm-setup.md](./linear-pm-setup.md)
