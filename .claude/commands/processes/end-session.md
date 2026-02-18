---
name: processes:end-session
description: Lightweight per-instance session capture before closing
argument-hint: "[optional: brief description of what was worked on]"
aliases:
  - end-session
  - wrap
  - done
keywords:
  - end
  - session
  - wrap
  - done
  - close
---

# Workflow: End Session

Lightweight capture of what happened in this Claude instance. Does NOT update artifacts — that's `/processes:eod`'s job.

**Time:** ~2 minutes
**When to use:** Before closing any Claude Code instance for the day. Run this in EVERY instance, then run `/processes:eod` once at end of day.
**Output:** `docs/archive/sessions/YYYY-MM-DD-HHMM-session.md`

---

## Process

### Step 1: Update TASKS.md "Active Now" Table (30 seconds)

**If task was claimed via /processes:claim or /processes:begin:**

1. Read TASKS.md "Active Now" table at the top
2. Remove this agent's row from the "Active Now" table
3. Update the task's Status column:
   - If work completed: move task row to "Done (Recent)" section with date + commit hash
   - If work in progress: set Status back to `ready` for another agent to pick up
4. Update "Last Updated" timestamp at top of TASKS.md

**Example:**

Before (Active Now):
```markdown
| agent-ab5c | Dev | SEC-8: Security audit | 2026-02-17 14:30 |
```

After: Row removed from Active Now. Task moved to Done (Recent):
```markdown
| SEC-8 | Complete security audit | 2026-02-17 | abc1234 |
```

**If ad-hoc work (no task claimed):**
- Skip TASKS.md Active Now updates
- Just create session file below

---

### Step 2: Auto-Gather from Git (30 seconds)
```bash
# Recent commits (last 2 hours or since session started)
git log --oneline --since="2 hours ago"

# Files changed
git diff --name-only HEAD~5

# Current status
git status --short
```

### Step 3: Build Session Summary (1 minute)

Save to `docs/archive/sessions/YYYY-MM-DD-HHMM-session.md`:

```markdown
# Session Summary — YYYY-MM-DD HH:MM

## What Was Done
- [Bullet list of work completed — from commits + user context]

## Files Changed
- [From git diff --name-only]

## Commits Made
- [From git log --oneline]

## Bugs Fixed / Issues Hit
- [Description, root cause, fix applied — ONLY if bugs were encountered]
- [Skip this section entirely if no bugs]

## Patterns Discovered
- [New gotchas, non-obvious behaviors — ONLY if something was learned]
- [Skip this section entirely if nothing new]

## New Systems / Features Built
- [Anything not in the original plan — new endpoints, pages, utilities]
- [Skip if all work was planned]

## Unfinished Work
- [What was started but not completed, with context for next instance]
- [Include: file paths, what's left to do, any blockers]

## Artifact Update Hints
- [Suggest which files might need updating based on what was done]
- [Examples: "New /api/vendors/bills endpoint → apps/api/CLAUDE.md needs update"]
- [Examples: "Completed BE-3.1 task → TASKS.md needs checkoff"]
- [Examples: "Discovered Fastify quirk → MEMORY debugging-log.md"]
```

### Step 4: Commit the Session File (30 seconds)

```bash
git add docs/archive/sessions/YYYY-MM-DD-HHMM-session.md
git add TASKS.md  # If Active Now table updated
git commit -m "docs: End session capture YYYY-MM-DD HH:MM"
```

---

## Design Principles

- **Fast** — mostly auto-populated from git, user fills in non-obvious items
- **Raw** — capture facts, don't analyze or update other files
- **Stackable** — multiple sessions per day create separate timestamped files
- **Bridge to EOD** — "Artifact Update Hints" tells EOD what MIGHT need updating

---

## Skip Sections

If a section doesn't apply (no bugs fixed, nothing new learned), either skip it entirely or write "None". Don't pad with filler content.

---

_~80 lines. Fast capture. Git-powered. Feeds into /processes:eod._
