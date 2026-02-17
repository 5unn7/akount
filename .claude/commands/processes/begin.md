---
name: processes:begin
description: Session startup dashboard - Get up to speed quickly
argument-hint: "[optional focus area]"
---

# Workflow: Begin

Your concise session startup ritual. Context-aware dashboard with industry intel.

**Current Date:** Use today's actual date.

---

## Purpose

Start coding sessions with focused context:

- **Session Context** - Git status, recent changes (auto-injected via hook)
- **Tasks** - What's pending from TASKS.md
- **Blockers** - Issues to watch
- **Memory** - Recent learnings and patterns
- **Recommendations** - What to work on next
- **Pro Tips** - Workflow improvements and better approaches
- **Industry Intel** - Fintech news, competitor moves, relevant tech updates

**Like a morning briefing from your AI co-founder.**

---

## 3-Tier System (Session-Aware)

This workflow adapts based on session recency:

**Tier 1: Full Standup** - First session of day (>2 hours since last session)
- Complete dashboard with all phases
- Full git status, tasks, blockers, memory, industry intel
- 7 Key Invariants display
- Comprehensive recommendations

**Tier 2: Quick Claim** - Subsequent sessions (<2 hours since last session)
- Lightweight context (branch, recent commit)
- Available tasks with `[dependency: none]`
- Active work visibility (other agents from ACTIVE-WORK.md)
- Quick task claiming flow

**Tier 3: No Process** - Direct instruction without `/processes:begin`
- Handled via Direct Instruction protocol (see plan-enforcement.md)
- Ad-hoc work, no ACTIVE-WORK.md updates
- Still follows guardrails

---

## Phase 0: Session Detection (10 seconds)

**Determine which tier to use:**

```bash
# Check ACTIVE-WORK.md for last session timestamp
if [ -f "ACTIVE-WORK.md" ]; then
  LAST_SESSION=$(grep -oP '\d{4}-\d{2}-\d{2} \d{2}:\d{2}' ACTIVE-WORK.md | tail -1)

  if [ -n "$LAST_SESSION" ]; then
    # Calculate time diff (simplified - assume same day)
    CURRENT_TIME=$(date +%s)
    LAST_TIME=$(date -d "$LAST_SESSION" +%s 2>/dev/null || echo "0")
    TIME_DIFF=$(( ($CURRENT_TIME - $LAST_TIME) / 60 ))

    if [ $TIME_DIFF -lt 120 ]; then
      TIER="Quick"
    else
      TIER="Full"
    fi
  else
    TIER="Full"
  fi
else
  TIER="Full"
fi

echo "Session Tier: $TIER"
```

**If Tier = "Quick":**
- Skip to Tier 2 workflow (Phase 11)
- Output lightweight quick claim dashboard

**If Tier = "Full":**
- Proceed with full workflow (Phase 1-10)

---

## Workflow (Tier 1: Full Standup)

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
- `[->]` In progress
- `[x]` Recently completed
- Priority items
- Blocked/waiting

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

- "Blocker: [description]" for each issue found
- "No blockers detected" if clean

---

### Phase 3: Recent Context from Memory (15 seconds)

Read MEMORY.md from auto memory directory for:

- Current phase of work
- Recent gotchas discovered
- Patterns learned
- Known issues

**Output:**

- Current work phase
- Recent wins/lessons (1-2 bullet points)
- Any active known issues from the Known Issues table

---

### Phase 4: Generate Recommendations (30 seconds)

Based on loaded context, provide actionable recommendations:

**Decision tree:**

1. **If uncommitted changes exist** (from SessionStart hook):
   - "Commit current work before starting new tasks"
   - "Review staged changes: [files from git status]"

2. **If TASKS.md has high-priority items**:
   - "Priority task: [top task description]"
   - "Relevant files: [guess based on task]"

3. **If no pending tasks**:
   - "Task list clear! Options:"
   - "  - Check ROADMAP.md for next phase"
   - "  - Run `/processes:review` on recent commits"

4. **If blockers detected**:
   - "Resolve blockers first:"
   - "  - [blocker with suggested fix]"

---

### Phase 5: Pro Tips (20 seconds)

Review the user's recent workflow patterns from MEMORY.md and session history to surface **one actionable tip** per session. Rotate through categories:

**Tip categories (cycle through these):**

1. **Workflow Efficiency**
   - Skills or commands they might not know about
   - Faster ways to accomplish common tasks
   - Agent delegation patterns (e.g., "use /fast for searches to save cost")

2. **Code Quality**
   - Patterns from the codebase they could adopt more consistently
   - TypeScript tricks relevant to their stack
   - Testing strategies they haven't tried

3. **Architecture Insights**
   - Design patterns that would benefit their current phase
   - Scalability considerations for what they're building
   - How similar products solve the same problems

4. **Tool Mastery**
   - Claude Code features they haven't used (hooks, agents, skills)
   - VS Code shortcuts or extensions relevant to their work
   - Git workflows that could help (interactive rebase, bisect, etc.)

**Rules for tips:**

- ONE tip per session (don't overwhelm)
- Must be actionable and specific to their project, not generic advice
- Reference their actual code/files when possible
- Track which tips have been given in memory to avoid repeats

**Output format:**

```
## Pro Tip

**[Category]:** [Concise tip with specific example from their codebase]
```

---

### Phase 6: Industry Intelligence (30 seconds)

Use **WebSearch** to fetch fresh, relevant intelligence. Run 2-3 targeted searches:

**Search queries (pick 2-3 most relevant):**

1. **Competitor moves:**
   - `"QuickBooks OR Xero OR FreshBooks OR Wave" new features 2026`
   - `AI accounting software startup funding 2026`

2. **Fintech/accounting trends:**
   - `fintech accounting SaaS trends 2026`
   - `AI bookkeeping automation news`

3. **Tech stack updates:**
   - `Next.js release updates 2026` (or Prisma, Clerk, Tailwind — whichever is most relevant)
   - `PostgreSQL new features` if database work is in progress

4. **Regulatory/compliance:**
   - `accounting software compliance changes` (only if relevant to current work)

**Selection logic:**

- If building new features: search competitors for inspiration
- If doing infrastructure work: search tech stack updates
- If planning phase: search market trends
- Default: rotate through categories session to session

**Output rules:**

- Max 3-4 bullet points, each 1-2 sentences
- Include source links
- Flag anything that directly impacts Akount's roadmap
- Skip if search returns nothing relevant (don't force it)

**Output format:**

```
## Industry Intel

- **[Competitor/Trend]:** [What happened] — [Why it matters for Akount] [source link]
- **[Tech Update]:** [What changed] — [Action item if any] [source link]
- **[Market Signal]:** [Insight] — [Opportunity or threat] [source link]
```

---

### Phase 7: Session Dashboard Output (Tier 1: Full Standup)

Consolidate everything into a concise dashboard:

```markdown
# Session Start Dashboard
**Date:** [today]
**Project:** Akount (Next.js 16 + Fastify API + Prisma)

---

## Session Context
- Branch: [branch]
- Uncommitted files: [count]
- Recent commits: [last 3]

---

## 7 Key Invariants

1. **Tenant Isolation** — every query filters by tenantId
2. **Integer Cents** — no floats for money
3. **Double-Entry** — SUM(debits) === SUM(credits)
4. **Soft Delete** — financial records use deletedAt
5. **Source Preservation** — journal entries store sourceDocument
6. **Page Loading States** — every page.tsx has loading.tsx + error.tsx
7. **Server/Client Separation** — no mixed server/client modules

---

## Pending Tasks ([count] total)
- [ ] [Task 1 - Priority]
- [ ] [Task 2]
- [->] [Task 3 - In Progress]

---

## Blockers
[None detected / List of blockers]

---

## Recent Context
**Current Phase:** [From MEMORY.md]
**Last Session:** [Summary]
**Known Issues:** [Any active from Known Issues table]

---

## Recommendations

**Next Action:** [Primary recommendation with file paths]

**Alternative Actions:**
1. [Option 2]
2. [Option 3]

---

## Pro Tip

**[Category]:** [Specific actionable tip]

---

## Industry Intel

- **[Item 1]:** [Summary] [link]
- **[Item 2]:** [Summary] [link]
- **[Item 3]:** [Summary] [link]

---

**Quick Commands:**
- `/processes:plan` - Plan next feature
- `/processes:work` - Execute implementation
- `/processes:review` - Code review before merge
- `/processes:claim [task-id]` - Claim task from TASKS.md

**Ready to start!**
```

---

## Phase 11: Quick Claim Dashboard (Tier 2: Lightweight)

**When to use:** Subsequent session within 2 hours of last session.

**Workflow:**

1. Read ACTIVE-WORK.md to get current state
2. Extract available tasks from TASKS.md (filter for `[dependency: none]`)
3. Show other active work (other agents)
4. Output lightweight dashboard

**Output format:**

```markdown
# Quick Claim (Lightweight)

**Current Branch:** [branch from git]
**Last Session:** [time ago] ([agent-id] on [task-id])

---

## Available Tasks (dependency: none)

**Security & Integrity (Track A):**
- [ ] **SEC-6.1c:** GL opening balance calculation (1-2 hr, P0)
- [ ] **SEC-6.1d:** Split reports.ts server/client (30 min, P0)

**Performance (Track B):**
- [ ] **PERF-6.2a:** Wire up pino in Fastify (30 min, P1)

**Quality (Track C):**
- [ ] **QUAL-6.1a:** Create loading/error templates (15 min, P0)

---

## Active Work (Other Agents)

| Agent ID | Task | Started | Status |
|----------|------|---------|--------|
| agent-ab5c159 | SEC-6.1b (CSV injection) | 45 min ago | in_progress |
| agent-cd7e284 | PERF-6.1a (Cache reports) | 15 min ago | in_progress |

---

**Pick a task or type your own goal.**

Commands:
- `/processes:claim SEC-6.1c` - Claim specific task
- `/processes:begin` - Full dashboard (if needed)
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

_v3.0 — Added Pro Tips + Industry Intelligence. ~200 lines._
