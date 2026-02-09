---
name: processes:begin
description: Session startup dashboard - Get up to speed quickly
argument-hint: "[optional focus area]"
---

# Workflow: Begin

Your concise session startup ritual. Context-aware dashboard in under 2 minutes.

**Current Date:** 2026-02-09

---

## Purpose

Start coding sessions with focused context:
- 📋 **Session Context** - Git status, recent changes (auto-injected)
- 🎯 **Tasks** - What's pending from TASKS.md
- ⚠️ **Blockers** - Issues to watch
- 🧠 **Memory** - Recent learnings and patterns
- 💡 **Recommendations** - What to work on next

**Like a 2-minute standup with your AI pair.**

**What's New (v2.2):**
- Phase 0 (Visual Context) → Now auto-loaded via `CLAUDE.md` hierarchy
- Phase 1 (Git Status) → Now auto-injected via SessionStart hook
- Repo map, architecture → Now in `docs/context-map.md`

---

## Workflow

### Phase 1: Load Task List (20 seconds)

Read pending tasks from TASKS.md:

```bash
# Read task file if it exists
if [ -f "TASKS.md" ]; then
  cat TASKS.md
else
  echo "No TASKS.md found - create one if needed"
fi
```

**Extract and categorize:**
- `[ ]` Pending tasks
- `[→]` In progress
- `[x]` Recently completed
- 🔥 Priority items
- ⏳ Blocked/waiting

**Output:**
- Total pending count
- Top 3 priority tasks
- Any blocked items

---

### Phase 2: Check for Blockers (15 seconds)

Scan for potential blockers:

```bash
# Check for TODOs in recent commits
git log --oneline -5 --grep="TODO\|FIXME\|BLOCKED"

# Check for failing tests (if test files exist)
if [ -f "vitest.config.ts" ]; then
  echo "Test suite available - run 'npm test' if needed"
fi

# Check for merge conflicts
git diff --check
```

**Look for:**
- Merge conflicts
- Broken tests mentioned in commits
- Dependencies issues (package-lock changes)
- Environment mismatches

**Output:**
- "🚫 Blocker: [description]" for each issue found
- "✅ No blockers detected" if clean

---

### Phase 3: Recent Context from Memory (15 seconds)

Point to recent learnings:

```bash
# Check MEMORY.md current state
if [ -f "$HOME/.claude/projects/$(basename $PWD)/memory/MEMORY.md" ]; then
  echo "📚 Memory files available:"
  echo "  - MEMORY.md: Current state, recent work"
  echo "  - codebase-quirks.md: Path issues, gotchas"
  echo "  - api-patterns.md: Service/route patterns"
  echo "  - debugging-log.md: Past bugs, solutions"
fi
```

**Quick pointers:**
- Current phase of work (from MEMORY.md)
- Recent gotchas discovered
- Patterns learned
- Known issues

**Output:**
- Current work phase (e.g., "Context Optimization v2.2 - Phase A Step 8")
- "⚠️ Check memory/codebase-quirks.md" if relevant path issues exist
- Recent wins/lessons (1-2 bullet points from MEMORY.md)

---

### Phase 4: Generate Recommendations (30 seconds)

Based on loaded context, provide actionable recommendations:

**Decision tree:**

1. **If uncommitted changes exist** (from SessionStart hook):
   - → "Commit current work before starting new tasks"
   - → "Review staged changes: [files from git status]"

2. **If TASKS.md has high-priority items**:
   - → "Priority task: [top task description]"
   - → "Estimated complexity: [guess based on description]"
   - → "Relevant files: [guess based on task]"

3. **If no pending tasks**:
   - → "✅ Task list clear! Options:"
   - → "  - Check ROADMAP.md for next phase"
   - → "  - Run `/processes:review` on recent commits"
   - → "  - Update documentation if needed"

4. **If blockers detected**:
   - → "🚫 Resolve blockers first:"
   - → "  - [blocker 1 with suggested fix]"
   - → "  - [blocker 2 with suggested fix]"

5. **If recent compaction occurred**:
   - → "📝 Context was compacted. Critical invariants preserved:"
   - → "  - tenantId required in all queries"
   - → "  - Money as integer cents"
   - → "  - SUM(debits)===SUM(credits)"

**Output format:**
```
## 🎯 Recommendations

**Next Action:** [Primary recommendation]

**Context:**
- [Relevant file paths]
- [Related commands]
- [Estimated time]

**Alternative Actions:**
1. [Option 2]
2. [Option 3]
```

---

### Phase 5: Session Dashboard Output

Consolidate everything into a concise dashboard:

```markdown
# 🚀 Session Start Dashboard
**Date:** 2026-02-09
**Project:** Akount (Next.js 16 + Fastify API + Prisma)

---

## 📊 Session Context (Auto-injected)
[SessionStart hook output will appear above this workflow]
- Branch: main
- Uncommitted files: [count]
- Recent commits: [last 3]

---

## 🎯 Pending Tasks ([count] total)
- [ ] [Task 1 - Priority]
- [ ] [Task 2]
- [→] [Task 3 - In Progress]

---

## ⚠️ Blockers
[None detected / List of blockers]

---

## 🧠 Recent Context
**Current Phase:** [From MEMORY.md]
**Last Session:** [Summary from MEMORY.md]
**Gotchas to Remember:**
- [Top 2-3 from codebase-quirks.md]

---

## 💡 Recommendations

**Next Action:** [Primary recommendation with file paths]

**Quick Commands:**
- `/processes:plan` - Plan next feature
- `/processes:work` - Execute implementation
- `/processes:review` - Code review before merge

---

**Ready to start! 🎉**
```

---

## Notes

**Replaced by hierarchical context:**
- Phase 0 (Visual Context): Now auto-loaded via `CLAUDE.md` + `docs/context-map.md`
- Git status/recent changes: Now auto-injected via SessionStart hook

**Memory system:**
- `MEMORY.md`: Index + high-level work state
- `memory/codebase-quirks.md`: Path issues, gotchas
- `memory/api-patterns.md`: Service patterns learned
- `memory/debugging-log.md`: Past bugs, solutions

**References:**
- Architecture: `CLAUDE.md` (auto-loaded)
- Deep reference: `docs/context-map.md` (explicit read)
- Rules: `.claude/rules/*.md` (path-scoped auto-load)

---

_Lines: ~150 (slimmed from 856). SessionStart hook handles context injection._
