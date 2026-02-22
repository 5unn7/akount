# Linear Manual Setup Checklist

Complete these tasks in Linear UI to finish Sprint 1 setup.

**Time:** 15 minutes total

---

## ✅ Sprint 1 Automated Tasks (COMPLETE)

- [x] 12 teams created
- [x] 34 labels created
- [x] 7 projects created
- [x] 4 cycles created (8 weeks of 2-week sprints)

---

## 📋 Sprint 1 Manual Tasks (DO IN LINEAR UI)

### Task 1.3: Add Custom Fields (5 min)

Go to: **Linear → Settings → Custom Fields → Create Custom Field**

Create these 4 fields:

**1. Response Time**
- **Name:** Response Time
- **Type:** Number
- **Description:** Customer support response time in hours
- **Teams:** Customer Success
- Click **Create**

**2. Customer Count**
- **Name:** Customer Count
- **Type:** Number
- **Description:** Number of customers affected by this issue
- **Teams:** Customer Success
- Click **Create**

**3. Deployment ID**
- **Name:** Deployment ID
- **Type:** Text
- **Description:** GitHub deployment ID or version number
- **Teams:** Infrastructure, Platform
- Click **Create**

**4. Marketing Campaign**
- **Name:** Marketing Campaign
- **Type:** Single Select
- **Description:** Associated marketing campaign
- **Options:** Product Hunt, Social Media, Email Campaign, Partnership, Organic
- **Teams:** Growth
- Click **Create**

---

### Task 1.5: Configure Workflow States (5 min)

For each team, add custom workflow states:

Go to: **Linear → Settings → Teams → [Team Name] → Workflow**

Add these states (if not already present):

**States to Add:**
1. **Ready** (Unstarted) - Green #10B981
2. **Blocked** (Started) - Red #EF4444
3. **Review** (Started) - Purple #8B5CF6
4. **Deferred** (Canceled) - Gray #6B7280

**Do for all 12 teams:**
- Overview, Banking, Business, Accounting, Planning, Insights
- Platform, Customer Success, Infrastructure, Growth, Content, Business Ops

**Quick method:**
- Select one team → Add all 4 states
- Go to next team → Copy workflow from first team
- Repeat for all 12 teams

---

### Task 1.6: Set Team-Specific Settings (5 min)

For each team: **Settings → Teams → [Team Name] → General**

**Configure (same for all 12 teams):**

**Cycles:**
- ✅ Enable cycles
- **Duration:** 2 weeks
- **Start day:** Monday
- **Auto-archive:** After 4 weeks

**Triage:**
- ✅ Enable triage
- **Default priority:** Medium
- **Auto-assign:** Off (manual)

**Estimation:**
- **System:** Story points
- **Scale:** Fibonacci (1, 2, 3, 5, 8)
- ✅ Allow decimal values: Off

**Templates:**
- **Default template:** None (create later as needed)

**Quick method:**
- Configure Platform team first
- For other teams: "Copy settings from Platform"

---

## ✅ Verification

After completing all manual tasks, verify:

- [ ] 4 custom fields exist (Settings → Custom Fields)
- [ ] All 12 teams have 7 workflow states (Todo, Ready, In Progress, Blocked, Review, Done, Deferred)
- [ ] All 12 teams have cycles enabled (2-week duration)
- [ ] All 12 teams use story point estimation (Fibonacci scale)

---

## 🚀 Next: Import Your 256 Tasks

After verification, run:

```bash
npm run linear:import
```

This will migrate all product tasks from TASKS.md to Linear with full metadata preservation.

---

## Sprint 1 Summary

**Automated ✅:**
- 12 teams
- 34 labels
- 7 projects
- 4 cycles

**Manual (15 min) →:**
- 4 custom fields
- Workflow states (12 teams)
- Team settings (12 teams)

**Then:**
- Import 256 tasks
- Configure automations (Sprint 2)
- Create dashboards (Sprint 4)
