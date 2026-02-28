# Active Work Tracker

**Last Updated:** 2026-02-28 09:52

---

## Current Sessions

| Agent ID | Started | Task | Status | Branch |
|----------|---------|------|--------|--------|
| agent-ux44-export-937 | 2026-02-28 09:52 | UX-44: Add invoice/client list CSV/PDF export buttons | in_progress | main |

---

## Task Allocation

| Task ID | Type | Reserved By | Reserved Until |
|---------|------|-------------|----------------|
| UX-44 | ux | agent-ux44-export-937 | 2026-02-28 12:52 |

---

## Agent Context (for smart defaults)

| Agent ID | Last Claimed Tasks | Last Domain | Last Session |
|----------|-------------------|-------------|--------------|
| agent-ux44-export-937 | UX-44 | business/ux | 2026-02-28 09:52 |
| agent-fin32-migration | FIN-32 | financial | 2026-02-27 00:10 |
| agent-sec40-csrf | SEC-40 | security | 2026-02-26 22:45 |
| agent-widgets-c24 | DEV-179 | overview/dashboard | 2026-02-24 15:51 |
| agent-flinks-244 | INFRA-59 | infrastructure | 2026-02-24 15:48 |

**Purpose:**
- Tracks agent's task history (rolling 5-task window)
- Identifies preferred domains
- Enables "continue where you left off" feature in `/processes:claim`

**Auto-cleanup:**
- Prune entries older than 7 days
- Keep only last 5 tasks per agent

---

## Notes

- Sessions expire after 2 hours of inactivity
- This file is auto-updated by `/processes:claim` and `/processes:end-session`
- Task conflicts are detected automatically
- Agent context powers smart task recommendations
