# Active Work Tracker

**Last Updated:** 2026-02-21 21:25

---

## Current Sessions

| Agent ID | Started | Task | Status | Branch |
|----------|---------|------|--------|--------|
| agent-client-detail | 2026-02-21 18:52 | DEV-122: Business client detail page with invoice history | in_progress | main |
| agent-banking-ui | 2026-02-20 20:15 | DEV-43, DEV-44, DEV-45: Banking transaction form, XLSX import, batch detail | completed | main |
| agent-infra-perf | 2026-02-20 12:54 | INFRA-14, PERF-8: Auth timeout + load testing | completed | main |
| agent-sec23-logging | 2026-02-20 11:47 | SEC-23: Replace console.log with structured logging in webhook | completed | main |
| opus-sec-batch | 2026-02-19 18:45 | SEC-8, SEC-11, SEC-13, INFRA-9, INFRA-10 | expired | main |
| agent-audit-arch | 2026-02-20 17:05 | ARCH-2, ARCH-6: Audit logging improvements | completed | main |
| agent-perf-indexes | 2026-02-20 17:30 | PERF-18, PERF-19, PERF-20: Critical DB indexes (launch blockers) | completed | main |

---

## Task Allocation

| Task ID | Type | Reserved By | Reserved Until |
|---------|------|-------------|----------------|
| DEV-122 | feature | agent-client-detail | 2026-02-21 20:52 |

---

## Agent Context (for smart defaults)

| Agent ID | Last Claimed Tasks | Last Domain | Last Session |
|----------|-------------------|-------------|--------------|
| agent-ux-atomic | UX-27, UX-10, UX-80 | ux | 2026-02-21 18:57 |
| agent-client-detail | DEV-122 | business | 2026-02-21 18:52 |
| agent-infra-perf | INFRA-14, PERF-8 | infrastructure/performance | 2026-02-20 12:54 |
| agent-sec23-logging | SEC-23 | security | 2026-02-20 11:47 |
| opus-sec-batch | SEC-8, SEC-11, SEC-13, INFRA-9, INFRA-10 | security/infra | 2026-02-19 18:45 |
| agent-audit-arch | ARCH-2, ARCH-6 | architecture | 2026-02-20 17:05 |
| agent-perf-indexes | PERF-18, PERF-19, PERF-20 | performance | 2026-02-20 17:30 |

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
