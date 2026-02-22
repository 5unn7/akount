# Active Work Tracker

**Last Updated:** 2026-02-22 10:25

---

## Current Sessions

| Agent ID | Started | Task | Status | Branch |
|----------|---------|------|--------|--------|
| agent-ai-chat | 2026-02-22 10:15 | DEV-113: Build AI Chat interface on Insights page | completed | main |
| agent-routing-fix | 2026-02-22 10:05 | UX-78: Fix /insights/insights → /insights routing | completed | main |
| agent-ux-693 | 2026-02-22 09:54 | UX-8: Add loading/error states to remaining dashboard pages | completed | main |
| agent-ai-client | 2026-02-22 09:47 | DEV-112: Create AI API client for 5 endpoints | completed | main |
| agent-client-detail | 2026-02-21 18:52 | DEV-122, DEV-75: Client detail + Bills page | completed | main |
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

---

## Agent Context (for smart defaults)

| Agent ID | Last Claimed Tasks | Last Domain | Last Session |
|----------|-------------------|-------------|--------------|
| agent-ai-chat | DEV-113 | insights | 2026-02-22 10:15 |
| agent-routing-fix | UX-78 | insights | 2026-02-22 10:05 |
| agent-ux-693 | UX-8 | ux | 2026-02-22 09:54 |
| agent-ai-client | DEV-112 | insights | 2026-02-22 09:47 |
| agent-ux-atomic | UX-27, UX-10, UX-80 | ux | 2026-02-21 18:57 |
| agent-client-detail | DEV-122, DEV-75 | business | 2026-02-21 18:52 |
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
