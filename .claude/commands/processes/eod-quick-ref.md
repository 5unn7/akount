---
name: eod-quick-ref
description: Quick reference for end-of-day workflow
---

# End-of-Day Workflow - Quick Reference

**Time:** 15-20 minutes
**Frequency:** Daily or at session end

---

## TL;DR - 5 Steps

### 1. Delete temporary files
```bash
rm -f *_tsc_errors.txt *_errors.txt api_tsc_errors.txt
rm -rf .agent/
```

### 2. Move valuable artifacts
- `*_brainstorm.md` → `docs/brainstorms/`
- `*_plan.md` → `docs/plans/`
- `WEEK_*.md` → `docs/archive/sessions/`

### 3. Update documentation
- **STATUS.md** - Today's progress
- **TASKS.md** - Tomorrow's tasks
- **ROADMAP.md** - Phase status

### 4. Commit and push
```bash
git add STATUS.md TASKS.md ROADMAP.md [other files]
git commit -m "docs: End-of-day update - [brief summary]"
git push origin main
```

### 5. Create handoff (optional)
File: `docs/archive/sessions/TOMORROW-SESSION-PREP.md`
- What's complete
- What's ready to start
- Any blockers
- Next actions

---

## Checklist

- [ ] Delete temporary files (`*_errors.txt`, build artifacts)
- [ ] Move brainstorms to `docs/brainstorms/`
- [ ] Move plans to `docs/plans/`
- [ ] Update `STATUS.md` with today's progress
- [ ] Update `TASKS.md` with tomorrow's priorities
- [ ] Update `ROADMAP.md` with phase status
- [ ] `git add` relevant files
- [ ] `git commit` with meaningful message
- [ ] `git push` to remote
- [ ] Review `TASKS.md` for tomorrow's clarity

---

## What to Update in Docs

### STATUS.md
```markdown
**Last Updated:** 2026-02-01
**Overall Progress:** Phase 0 Complete (100%)
**Current Focus:** [What you're working on]

## ✅ Completed Today
- [x] Item 1
- [x] Item 2

## 🚧 In Progress
- [ ] Item 3 (70% done, remaining: X)

## 📋 Blockers
- None / [List any blockers]
```

### TASKS.md
```markdown
## ✅ Completed Today (2026-02-01)
- [x] Task A
- [x] Task B

## 🚧 In Progress
- [ ] Task C (75% done)

## 📋 Tomorrow's Tasks (2026-02-02)
1. Finish Task C
2. Start Task D
3. Code review Task B
```

### ROADMAP.md
- Update phase percentages
- Update status (✅, 🚧, ⏸️)
- Note any timeline changes
- Update next phase readiness

---

## Commit Message Template

```
docs: End-of-day update for [YYYY-MM-DD]

- Updated STATUS.md with today's progress
- Organized session artifacts to docs/
- Updated TASKS.md for tomorrow's sprint
- [Any other relevant changes]

Topics: documentation, project-maintenance
```

---

## File Organization

**Keep in repo root:**
- STATUS.md
- TASKS.md
- ROADMAP.md
- CHANGELOG.md

**Move to docs/brainstorms/:**
- Feature brainstorms
- Discussion notes
- Exploration documents

**Move to docs/plans/:**
- Implementation plans
- Architecture designs
- Technical specifications

**Move to docs/archive/sessions/:**
- Session reports (WEEK_*.md)
- Code review reports
- Performance analysis
- Engineering compounds

**Delete:**
- `*_errors.txt` (build errors)
- `*_tsc_errors.txt` (TypeScript errors)
- `.agent/` (temporary agent work)
- Build artifacts (dist/, *.tsbuildinfo)

---

## Git Quick Reference

```bash
# See what changed
git status

# Review changes before committing
git diff HEAD

# Stage specific files
git add STATUS.md TASKS.md ROADMAP.md

# Stage all changes (careful!)
git add -A

# Commit with message
git commit -m "message"

# Push to remote
git push origin main
```

---

## Tips

✅ **Do this daily** - Takes 15-20 min if done daily, hours if done weekly

✅ **Update while fresh** - Write TASKS.md while work is in mind

✅ **Be specific** - "Fixed tenant isolation bug" vs "bug fix"

✅ **Link context** - Reference ROADMAP phase or feature names

✅ **Document blockers** - Note what's stopping progress

❌ **Don't commit** temporary build artifacts or secrets

❌ **Don't delay** - Push daily, don't accumulate unpushed commits

❌ **Don't skip** STATUS/TASKS updates - future-you will thank you

---

## When Tomorrow Starts

1. Open `docs/archive/sessions/TOMORROW-SESSION-PREP.md` (if you created it)
2. Read updated TASKS.md
3. Check ROADMAP for phase status
4. `git pull` to get latest changes
5. Start work where you left off

---

**Goal:** Make it a 15-min habit that saves hours of context-switching later.
