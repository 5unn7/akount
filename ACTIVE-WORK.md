# Active Work Sessions

**Last Updated:** 2026-02-17 (auto-timestamp placeholder — update via /processes:begin, /processes:eod)

---

## Current Sessions

| Agent ID | Started | Working On | Status | Branch |
|----------|---------|------------|--------|--------|
| _No active sessions_ | — | — | — | — |

---

## Completed Today

| Task ID | Agent ID | Completed | Commit | Duration |
|---------|----------|-----------|--------|----------|
| _No completed tasks yet_ | — | — | — | — |

---

## Task Allocation (Prevents Conflicts)

| Task ID | Type | Assigned To | Reserved Until |
|---------|------|-------------|----------------|
| _No reserved tasks_ | — | — | — |

---

## Usage

**How to claim a task:**
1. Run `/processes:begin` or `/processes:claim <task-id>`
2. Agent automatically updates "Current Sessions" table
3. Task marked as reserved in "Task Allocation" table

**How to complete a task:**
1. Finish work, commit changes
2. Run `/processes:end-session`
3. Session moved from "Current Sessions" to "Completed Today"
4. TASKS.md updated with [x] checkbox and commit hash

**End of day:**
1. Run `/processes:eod`
2. ACTIVE-WORK.md archived to `docs/archive/active-work/YYYY-MM-DD.md`
3. File cleared for tomorrow (tables reset to empty state)
4. STATUS.md metrics auto-updated

---

## Notes

- **Session timeout:** Tasks reserved for >2 hours without activity are considered stale
- **Conflict detection:** Agent will warn if you try to claim an already-claimed task
- **Parallel-safe:** Multiple agents can work simultaneously on different tasks
- **Auto-cleanup:** Daily archival prevents file from growing unbounded
