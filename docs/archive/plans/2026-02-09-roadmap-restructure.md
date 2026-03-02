# Roadmap Restructure - Implementation Plan

**Created:** 2026-02-09
**Status:** Complete
**Related:** Current `ROADMAP.md` (v1.4, stale), `TASKS.md`, `STATUS.md`

## Overview

Rewrite ROADMAP.md from scratch with a cleaner phase structure that reflects reality (what's built, what's next) and separates strategic direction (ROADMAP) from tactical execution (TASKS). Kill the checkbox rot by keeping task-level tracking only in TASKS.md.

## Success Criteria

- [ ] ROADMAP.md reflects actual project state (no stale text)
- [ ] Phases are logically grouped by user value, not technical layers
- [ ] No task-level checkboxes in ROADMAP.md (those live in TASKS.md)
- [ ] Onboarding redesign is tracked
- [ ] MVP scope is clearly defined (which phases are required vs. post-launch)
- [ ] TASKS.md aligned with new phase numbering
- [ ] STATUS.md updated to match

## Design Decisions

### New Phase Structure

The old 9-phase (0-8) structure was too granular and didn't map to user value. The new structure groups work by **what the user can do**, not by technical concerns:

| New Phase | Old Mapping | Status | What Users Get |
|-----------|------------|--------|----------------|
| Foundation | Phase 0 | COMPLETE | Auth, DB, API, design system |
| 1: See Your Money | Phase 1 | COMPLETE | Dashboard, accounts, multi-currency |
| 2: Track Your Money | Phase 2 | 70% (BE done) | Import, transactions, reconciliation |
| 3: Post Your Money | Phase 3 | Not started | Chart of accounts, journal entries, double-entry |
| 4: Bill & Get Paid | Phase 4 | Not started | Invoicing, bills, payments, clients/vendors |
| 5: Understand Your Money | Phase 5 | Not started | P&L, balance sheet, cash flow reports |
| 6: Launch MVP | Phase 8 (subset) | Not started | Security audit, performance, deployment |
| Post-Launch: Plan | Phase 6 | Post-launch | Budgets, goals, recurring, forecasting |
| Post-Launch: Automate | Phase 7 | Post-launch | AI categorization, rules, insights |

**Key changes:**

- Foundation is no longer a numbered phase (it's done, it's infrastructure)
- "Polish & Launch" moves UP to Phase 6 — ship after core features, not after everything
- Budgets/Goals and AI Advisor move to "Post-Launch" — not needed for MVP
- Each phase name starts with a verb describing user value
- Onboarding is a cross-cutting concern tracked separately
- Cash flow forecasting moves to Post-Launch: Plan (not needed for MVP)
- Data export moves to Phase 6: Launch MVP (trust signal before launch)
- Keyboard shortcuts move to Phase 6: Launch MVP (quality of life)

### What Goes Where

| Document | Contains | Doesn't Contain |
|----------|----------|-----------------|
| ROADMAP.md | Phase goals, success criteria, scope, timeline, strategic decisions | Task checkboxes, implementation details, code snippets |
| TASKS.md | Actionable task lists with checkboxes, sprint planning, daily focus | Strategic rationale, architecture decisions |
| STATUS.md | Current snapshot (what's done, what's active, metrics) | Historical detail, future plans |

## Tasks

### Task 1: Write new ROADMAP.md

**File:** `ROADMAP.md`
**What:** Complete rewrite. New phase structure, updated metrics, no task-level checkboxes. Include: overview, each phase (goal, scope, success criteria, estimated effort, dependencies), MVP vs post-launch distinction, timeline summary, risk mitigation.
**Depends on:** none
**Success:** ROADMAP accurately reflects project state, clear MVP scope defined

### Task 2: Rewrite TASKS.md

**File:** `TASKS.md`
**What:** Restructure to match new phase numbering. Mark all completed work properly. Add onboarding redesign as tracked work. Update "Tomorrow's Focus" and sprint sections. Clean up PM tasks (retroactively mark done or remove).
**Depends on:** Task 1 (needs new phase numbers)
**Success:** All completed work is checked off, active work is tracked, phase numbers match ROADMAP

### Task 3: Update STATUS.md

**File:** `STATUS.md`
**What:** Update to reference new phase structure. Refresh metrics (test counts, endpoint counts). Add frontend progress section.
**Depends on:** Task 1 (needs new phase names)
**Success:** STATUS.md is a quick-reference snapshot that matches reality

## Reference Files

- `ROADMAP.md` — current (stale) roadmap
- `TASKS.md` — current task list
- `STATUS.md` — current status
- `docs/plans/2026-02-09-onboarding-flow-redesign.md` — onboarding plan (untracked)
- `docs/design-system/03-screens/` — feature specs for future phases

## Edge Cases

- **In-progress onboarding work:** Has active code changes in git but no roadmap home. Solution: Add as cross-cutting "Onboarding Redesign" tracked under Phase 2 (it's part of getting users into the app to track money).
- **Old plans referencing old phase numbers:** The plan docs in `docs/plans/` reference "Phase 2 Sprint 1" etc. Solution: Don't rename old docs — they're historical. New work uses new numbering.
- **LunchMoney features scattered across phases:** Running balance (done), cash flow forecasting (not done), recurring transactions (not done), keyboard shortcuts (not done), data export (not done). Solution: Redistribute to appropriate new phases.

## Progress

- [x] Task 1: Write new ROADMAP.md
- [x] Task 2: Rewrite TASKS.md
- [x] Task 3: Update STATUS.md
