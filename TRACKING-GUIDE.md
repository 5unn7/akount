# Project Tracking Guide

**Purpose:** How to maintain accurate progress tracking using STATUS.md, ROADMAP.md, and TASKS.md

---

## 📚 The Three Files

### 1. STATUS.md (The "What is Done" File)
**Update Frequency:** After completing each significant task
**Purpose:** Single source of truth for current state

**Update when:**
- ✅ You complete a major task (auth setup, database connected, feature working)
- ❌ Something that was marked done turns out not working
- 🔄 Every Friday (weekly review)

**What to update:**
- Mark checkboxes ✅ when tasks are truly complete
- Update "In Progress" section with current work
- Update progress percentages
- Update "Next 3 Priorities"

---

### 2. ROADMAP.md (The "What's the Plan" File)
**Update Frequency:** Weekly or when priorities change
**Purpose:** Long-term development plan

**Update when:**
- 🎯 Starting a new phase
- ✅ Completing a phase
- 🔄 Priorities or timelines change
- 📝 New phases or tasks are discovered

**What to update:**
- Mark phases as In Progress / Complete
- Update effort estimates if reality differs
- Add newly discovered tasks
- Update timeline table

---

### 3. TASKS.md (The "What's This Week" File)
**Update Frequency:** Daily
**Purpose:** Tactical, actionable current work

**Update when:**
- 🌅 Every morning (review day's tasks)
- ✅ After completing each task
- 🌙 Every evening (mark progress)
- 🔄 Monday (plan new week)

**What to update:**
- Mark tasks ✅ as you complete them
- Update "In Progress" status
- Add blockers when stuck
- Update time estimates if needed
- Write notes about challenges

---

## 🔄 Weekly Workflow

### Monday Morning (Week Planning)
1. **Review ROADMAP.md** - Where are we in the overall plan?
2. **Review STATUS.md** - What did we complete last week?
3. **Update TASKS.md** - Create this week's tasks
   - Pull from ROADMAP.md current phase
   - Break down into daily goals
   - Estimate time for each task

### Daily Updates
**Morning:**
- Open TASKS.md
- Review today's goals
- Mark current task as "In Progress"

**During Work:**
- Update task status as you work
- Add notes about blockers
- Create new tasks if you discover work

**Evening:**
- Mark completed tasks ✅
- Update time spent vs estimate
- Write brief notes about tomorrow

### Friday Afternoon (Week Review)
1. **Update TASKS.md**
   - Mark all completed tasks ✅
   - Calculate week progress percentage
   - Write summary of what was achieved

2. **Update STATUS.md**
   - Update "Completed" section with week's wins
   - Update "In Progress" section
   - Update progress percentages
   - Update "Next 3 Priorities" for next week

3. **Review ROADMAP.md**
   - Update phase progress
   - Adjust timeline if needed
   - Note any scope changes

---

## ✅ Task Completion Checklist

Before marking a task as complete, verify:

- [ ] **It actually works** (tested locally)
- [ ] **No console errors** (check browser/terminal)
- [ ] **No TypeScript errors** (run `npm run build`)
- [ ] **Code is committed** (git commit)
- [ ] **Related docs updated** (if applicable)

Don't mark tasks complete if:
- ❌ It only "mostly" works
- ❌ You plan to "fix it later"
- ❌ There are known bugs
- ❌ Tests are failing

---

## 📝 Progress Update Template

### When Completing a Task

**In TASKS.md:**
```markdown
### Task X.Y.Z: Task Name
**Status:** ✅ Complete
**Assignee:** Your Name
**Time Spent:** X hours (estimated Y hours)

**Completed:** 2026-01-27
**Notes:** Brief note about challenges or learnings
```

**In STATUS.md:**
Update the relevant section:
```markdown
## ✅ Completed
- [x] Task name with brief description
```

### When Starting a Phase

**In ROADMAP.md:**
```markdown
| Phase | Status |
|-------|--------|
| Phase X | 🚧 In Progress |
```

**In STATUS.md:**
```markdown
## 🎯 Current Phase: Phase X - Name

**Phase Goal:** Brief description
**Progress:** Y / Z tasks complete
```

### When Completing a Phase

**In ROADMAP.md:**
```markdown
| Phase | Status |
|-------|--------|
| Phase X | ✅ Complete |
```

**In STATUS.md:**
```markdown
## ✅ Completed

### Phase X - Name (Completed: 2026-01-27)
- Task 1
- Task 2
- Task 3
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Mistake 1: Marking Schema Design as Implementation
**Wrong:**
```markdown
- [x] Authentication - Complete ✅
```

**Right:**
```markdown
- [x] Authentication schema defined ✅
- [ ] Authentication implemented ❌
```

### ❌ Mistake 2: Not Updating After Discoveries
**Scenario:** You start Task A, discover you need Task B first

**Do This:**
1. Add Task B to TASKS.md
2. Mark Task A as "Blocked by Task B"
3. Update STATUS.md if it changes priorities

### ❌ Mistake 3: Optimistic Task Completion
**Wrong:** Marking task ✅ when there are console errors "you'll fix later"

**Right:** Leave task incomplete until it's actually working

### ❌ Mistake 4: Forgetting Weekly Review
**Problem:** STATUS.md and TASKS.md get out of sync

**Solution:** Set Friday reminder to do weekly review

---

## 🎯 Sync Points

**These should always match:**

1. **STATUS.md "Current Phase"** = **ROADMAP.md highlighted phase** = **TASKS.md "Current Sprint"**

2. **STATUS.md progress %** should roughly match **completed tasks in current phase**

3. **TASKS.md "Blocked By"** should reflect **actual blockers in STATUS.md**

4. **ROADMAP.md timelines** should update if **STATUS.md shows slower/faster progress**

---

## 📊 Health Check Questions

**Every Friday, ask:**

1. ✅ Does STATUS.md accurately reflect what's working?
2. ✅ Are all completed tasks actually working?
3. ✅ Are progress percentages realistic?
4. ✅ Are "Next Priorities" still valid?
5. ✅ Does ROADMAP.md timeline still make sense?
6. ✅ Are there tasks in TASKS.md that are done but not marked?

**If answer is NO to any:** Update that file immediately

---

## 🔧 Quick Update Commands

**Completed a task:**
```bash
# 1. Mark task in TASKS.md
# 2. Update STATUS.md if significant
# 3. Commit
git add TASKS.md STATUS.md
git commit -m "Complete Task X.Y.Z: Task name"
```

**Weekly review:**
```bash
# 1. Update all three files
# 2. Commit with summary
git add STATUS.md ROADMAP.md TASKS.md
git commit -m "Week ending 2026-01-27: Summary of progress"
```

---

## 📧 When to Ask for Help

**Update tracking files when:**
- ✅ You complete tasks (update immediately)
- ✅ You discover new work (add to TASKS.md)
- ✅ You're blocked (mark blocker)
- ✅ Timelines change (update ROADMAP.md)

**Ask team for help when:**
- ❌ Task estimated 2 hours, taking 8+ hours
- ❌ Can't figure out how to mark progress accurately
- ❌ ROADMAP.md phases need re-prioritizing
- ❌ Not sure if something is "complete" enough

---

## 🎯 Success Metrics

**Good tracking looks like:**

✅ STATUS.md updated at least weekly
✅ TASKS.md updated daily
✅ ROADMAP.md reviewed every 2 weeks
✅ All three files tell the same story
✅ Checkmarks only on fully-working features
✅ Realistic progress percentages
✅ Clear next steps

---

## 🚀 Getting Started

**First time using this system:**

1. **Read all three files** (STATUS.md, ROADMAP.md, TASKS.md)
2. **Verify STATUS.md accuracy** - Does it match reality?
3. **Look at TASKS.md** - What's this week's work?
4. **Pick first task** and start working
5. **Update TASKS.md** when you complete the task
6. **Friday:** Do weekly review

**Remember:** The tracking system only works if you update it!

---

**Last Updated:** 2026-01-27
**Review This Guide:** Every month to ensure process is working
