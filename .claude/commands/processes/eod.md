---
name: processes:eod
description: Fast end-of-day status update — metrics + STATUS.md regeneration
aliases:
  - eod
keywords:
  - eod
  - end-of-day
  - status
  - metrics
---

# Workflow: End of Day (EOD)

Fast 4-phase process. Regenerates STATUS.md from TASKS.md + metrics + session quality insights.

**Time:** ~2 minutes
**When to use:** Once at end of day (after all instances run `/processes:end-session`).
**Prereq:** Each instance should have already run `/processes:end-session` to capture session files.

---

## Phase 1: Gather Metrics (30 seconds)

### Run metrics script

```bash
# Run update-metrics.sh if it exists
if [ -f ".claude/scripts/update-metrics.sh" ]; then
  ./.claude/scripts/update-metrics.sh
fi
```

### Count tasks from TASKS.md

Read TASKS.md and count tasks by domain and status:

```
For each domain (Dev, Design System, Marketing & Content, Operations):
  - Count Critical/High tasks
  - Count Medium/Low tasks
  - Count in-progress tasks
  - Count done tasks
```

### Git summary

```bash
# Today's commits
git log --oneline --since="today"

# Current status
git status --short
```

---

## Phase 2: Aggregate Session Self-Reflections (30 seconds)

Read all session files from today (`docs/archive/sessions/$(date +%Y-%m-%d)-*.md`) and extract self-reflection data:

**Aggregate metrics:**
- Count of invariant violations (group by type)
- Count of loops/repeated mistakes
- Most common "what would I do differently" themes
- Average context efficiency grade (A/B/C/D)
- Pre-flight checklist compliance rate

**Output:** Add a "Session Quality Insights" section to STATUS.md (see Phase 3)

**If patterns detected:**
- Multiple sessions forgot tenantId → Update MEMORY.md with reminder
- Multiple sessions didn't use offset/limit → Flag in debugging-log.md
- Same mistake across 3+ sessions → Update guardrails.md with specific rule

---

## Phase 3: Regenerate STATUS.md (30 seconds)

Overwrite STATUS.md with fresh auto-generated content:

```markdown
# Akount — Status Dashboard

**Auto-generated via `/processes:eod`** | **Last Updated:** YYYY-MM-DD

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Backend Tests | [from script] | 1100+ | [auto] |
| Service Coverage | 27/27 | 27/27 | [auto] |
| TypeScript Errors | [from script] | 0 | [auto] |
| Frontend Tests | [from script] | 100+ | [auto] |
| Loading States | [from script] | 47/47 | [auto] |

## Task Summary (from TASKS.md)

| Domain | Critical | High | Medium | Low | In Progress | Done |
|--------|----------|------|--------|-----|-------------|------|
| Dev | X | X | X | X | X | X |
| Design System | X | X | X | X | X | X |
| Marketing & Content | X | X | X | X | X | X |
| Operations | X | X | X | X | X | X |

## Phase 6 Progress

| Track | Total | Done | % |
|-------|-------|------|---|
| Security | X | X | X% |
| Performance | X | X | X% |
| Financial | X | X | X% |
| DRY/Quality | X | X | X% |
| UX | X | X | X% |
| Test | X | X | X% |
| Infra | X | X | X% |

## Session Quality Insights (Today)

| Metric | Value | Status |
|--------|-------|--------|
| Sessions completed | X | - |
| Invariant violations | X | [✅/⚠️/❌] |
| Pre-flight compliance | X% | [✅/⚠️/❌] |
| Context efficiency avg | [A/B/C/D] | [✅/⚠️/❌] |
| Loops detected | X | [✅/⚠️/❌] |

### Common Patterns (Today's Sessions)
- [Most frequent "what would I do differently" themes]
- [Recurring mistakes across multiple sessions]
- [Skip if no patterns detected]

### Actions Taken
- [MEMORY updates made based on reflections]
- [Guardrails updates made based on violations]
- [Skip if no actions needed]

_For full roadmap see ROADMAP.md. For task details see TASKS.md._
```

**Status logic:**
- Pass if value meets target
- Warn if value is 80-99% of target
- Fail if value is <80% of target

---

## Phase 4: Commit (30 seconds)

```bash
git add STATUS.md TASKS.md
git commit -m "docs: EOD status update YYYY-MM-DD"
```

If MEMORY.md topic files were updated during sessions, include them:

```bash
git add STATUS.md TASKS.md
# Include any session files from today
git add docs/archive/sessions/$(date +%Y-%m-%d)-*.md 2>/dev/null || true
git commit -m "docs: EOD status update YYYY-MM-DD"
```

---

## What This Does NOT Do (by design)

- **Session aggregation** — session files stay as-is (each `/processes:end-session` captured independently)
- **MEMORY routing** — update topic files ad-hoc when patterns are discovered, not ceremonially
- **Code quality checks** — handled by hooks on every commit, not just EOD
- **Tomorrow's focus planning** — user decides this at session start via `/processes:begin`
- **Artifact updates** — CLAUDE.md, context-map.md updated when changes happen, not at EOD

---

_~150 lines. 4 phases, ~2 minutes. Regenerates STATUS.md from source of truth + session quality insights._
