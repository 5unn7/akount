# Linear PM Infrastructure — Task Board

**Last Updated:** 2026-02-22
**Source Plan:** `docs/plans/2026-02-21-linear-scale-architecture.md`

> **43 tasks** · 🔴 3 critical · 🟠 16 high · 🟡 23 medium · ⚪ 2 low · ✅ 0 done
> 43 active · 0% progress

---

## Overview

This file tracks all tasks related to setting up Linear as Akount's primary PM tool. These tasks were separated from the main TASKS.md to keep product development tasks focused and Linear infrastructure work isolated.

**Domains covered:**
- **Workspace Setup** (12 teams, 34 labels, custom fields)
- **Automations** (10 automations for triage, routing, escalation, handoffs)
- **Integrations** (5 integrations: GitHub, Sentry, support widget, Intercom)
- **Dashboards** (8 views for exec, CS, product, incidents)
- **Task Migration** (256 product tasks from TASKS.md to Linear)
- **Documentation** (team workflows, automation runbooks, best practices)

**Reference:** See [LINEAR-SCALE-ARCHITECTURE.md](docs/plans/2026-02-21-linear-scale-architecture.md) for full implementation plan.

---

## Critical / High Priority

| ID | Task | Effort | Priority | Status | Deps | Sprint |
|----|------|--------|----------|--------|------|--------|
| INFRA-37 | Incident Response automation (production-down → P0 + timeline + notify all) | 30m | 🔴 Critical | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-48 | Run task import (migrate 256 product tasks from TASKS.md to Linear) | 30m | 🔴 Critical | 🟢 | [needs: INFRA-47] | Sprint 3 |
| OPS-4 | Executive Dashboard view (all teams, health metrics, primary visibility tool) | 15m | 🔴 Critical | 🟢 | [needs: INFRA-32] | Sprint 4 |
| INFRA-29 | Update workspace setup script for 12 teams (add CS, Infrastructure, Growth, Content, Business Ops) | 1h | 🟠 High | 🟢 | | Sprint 1 |
| INFRA-30 | Add customer impact labels (affects-100+, affects-1000+, churn-risk, production-down, sev-1/2, needs-*) | 30m | 🟠 High | 🟢 | | Sprint 1 |
| INFRA-31 | Add custom fields (Response Time, Customer Count, Deployment ID, Marketing Campaign) | 1h | 🟠 High | 🟢 | | Sprint 1 |
| INFRA-32 | Run full workspace setup (12 teams, 34 labels, custom fields) | 15m | 🟠 High | 🟢 | [needs: INFRA-29, INFRA-30, INFRA-31] | Sprint 1 |
| INFRA-33 | Auto-Triage Bugs automation (CS + bug + >10 users → High + cycle + notify) | 30m | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-34 | Auto-Route Feature Requests (CS + feature-request → parse keywords → assign team) | 1h | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-36 | Customer Impact Escalation (affects-1000+ → Critical + cycle + notify exec) | 30m | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-41 | GitHub Actions → Linear webhook (deploy → Infrastructure issue + update Product tasks) | 2h | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 3 |
| INFRA-43 | Support widget → Linear API (in-app feedback → CS issue with user context) | 3h | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 3 |
| INFRA-45 | Sentry → Linear integration (error >10 occurrences → Infrastructure issue) | 1h | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 3 |
| INFRA-46 | Fix task import domain mapping (UX tasks → parse description keywords for correct team) | 1h | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 3 |
| INFRA-47 | Add metadata preservation to import (priority, effort, status, deps, source) | 2h | 🟠 High | 🟢 | [needs: INFRA-46] | Sprint 3 |
| INFRA-53 | API usage monitoring (daily cron, alert at 75% threshold) | 2h | 🟠 High | 🟢 | [needs: INFRA-41] | Sprint 6 |
| OPS-5 | Customer Health Dashboard (CS team, 7d, response time metrics) | 15m | 🟠 High | 🟢 | [needs: INFRA-31] | Sprint 4 |
| OPS-6 | Product Velocity Dashboard (product teams, cycle, velocity + burndown) | 15m | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 4 |
| OPS-7 | Incident Response Dashboard (Infrastructure, active incidents, priority sort) | 15m | 🟠 High | 🟢 | [needs: INFRA-32] | Sprint 4 |

---

## Medium / Low Priority

| ID | Task | Effort | Priority | Status | Deps | Sprint |
|----|------|--------|----------|--------|------|--------|
| OPS-1 | Configure workflow states (Ready, Blocked, Review, Deferred) for all 12 teams | 30m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 1 |
| OPS-2 | Set team-specific settings (cycles, estimation, triage, auto-archive) for consistency | 30m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 1 |
| INFRA-35 | Sprint Auto-Assignment (priority→Critical → add to current cycle) | 15m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-38 | Feature Shipped Notification (Done + deployed → CS + Content task) | 45m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-39 | Cross-Team Handoff automation (needs-content → create Content issue) | 30m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-40 | Duplicate Detection script (hourly cron, check similar CS issues, auto-link) | 2h | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 2 |
| INFRA-42 | GitHub commit auto-linking verification (ensure working) | 15m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 3 |
| INFRA-44 | Intercom → Linear webhook (conversation tagged → CS issue) | 2h | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 3 |
| OPS-8 | Sprint Board view (current cycle, board, group by priority) | 15m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 4 |
| OPS-9 | Roadmap Timeline view (projects, roadmap, 8 weeks) | 15m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 4 |
| OPS-10 | Blocked Tasks view (all blocked, group by team) | 15m | 🟡 Medium | 🟢 | [needs: OPS-1] | Sprint 4 |
| OPS-11 | High Priority Inbox (Critical/High, oldest first, triage view) | 15m | 🟡 Medium | 🟢 | [needs: INFRA-32] | Sprint 4 |
| OPS-12 | Verify import accuracy (spot-check 20 tasks match TASKS.md) | 30m | 🟡 Medium | 🟢 | [needs: INFRA-48] | Sprint 4 |
| INFRA-49 | Create sync state file (TASKS.md ↔ Linear ID mapping for bidirectional sync) | 15m | 🟡 Medium | 🟢 | [needs: INFRA-48] | Sprint 4 |
| OPS-13 | Team workflow docs (12 teams: triage, handoffs, lifecycle) | 2h | 🟡 Medium | 🟢 | [needs: all linear sprints 1-5] | Sprint 5 |
| INFRA-50 | Automation runbook (10 automations: triggers, actions, troubleshooting) | 2h | 🟡 Medium | 🟢 | [needs: INFRA-33 to INFRA-40] | Sprint 5 |
| INFRA-51 | Integration guide (5 integrations: setup, webhooks, testing) | 2h | 🟡 Medium | 🟢 | [needs: INFRA-41 to INFRA-45] | Sprint 5 |
| OPS-14 | Dashboard usage guide (8 views: purpose, metrics, when to use) | 1h | 🟡 Medium | 🟢 | [needs: OPS-4 to OPS-11] | Sprint 5 |
| INFRA-52 | Best practices (titling, labeling, lifecycle, handoffs) | 1h | 🟡 Medium | 🟢 | [needs: all linear sprints] | Sprint 5 |
| INFRA-54 | Automation health dashboard (track trigger count, success rate, errors) | 2h | 🟡 Medium | 🟢 | [needs: INFRA-33 to INFRA-40] | Sprint 6 |
| INFRA-55 | Tune automation thresholds (adjust based on 1 week usage, <5% false positives) | 1h | 🟡 Medium | 🟢 | [needs: INFRA-33 to INFRA-40, 1 week usage] | Sprint 6 |
| INFRA-56 | Optimize view performance (date filters, limit results, <2s load) | 1h | 🟡 Medium | 🟢 | [needs: OPS-4 to OPS-11, 1 week usage] | Sprint 6 |
| INFRA-57 | Weekly report automation (Friday cron, exec summary email) | 2h | 🟡 Medium | 🟢 | [needs: OPS-4] | Sprint 6 |
| OPS-3 | Stale Issue Cleanup (>90d + no activity → comment → close if no response) | 30m | ⚪ Low | 🟢 | [needs: INFRA-32] | Sprint 2 |
| OPS-15 | Update CLAUDE.md context (Linear as PM tool, workflow references) | 30m | ⚪ Low | 🟢 | [needs: INFRA-52] | Sprint 5 |

---

## Sprint Breakdown

| Sprint | Focus | Task Count | Effort |
|--------|-------|------------|--------|
| **Sprint 1** | Workspace Foundation | 5 tasks | 3h 15m |
| **Sprint 2** | Core Automations | 7 tasks | 3h 15m |
| **Sprint 3** | Integrations + Migration | 7 tasks | 11h |
| **Sprint 4** | Dashboards + Views | 10 tasks | 3h |
| **Sprint 5** | Documentation | 5 tasks | 8h |
| **Sprint 6** | Monitoring + Optimization | 4 tasks | 7h |

**Total Estimated Effort:** ~35.5 hours across 6 sprints

---

## Key Dependencies

**INFRA-32** (workspace setup) is the foundation task that blocks:
- All automations (INFRA-33 to INFRA-40)
- All dashboards (OPS-4 to OPS-11)
- Task migration (INFRA-46 → INFRA-47 → INFRA-48)

**INFRA-48** (task import) must complete before:
- Sync state creation (INFRA-49)
- Import verification (OPS-12)

---

## Notes

- **Migration Strategy:** These tasks will eventually live in Linear itself after INFRA-48 completes
- **Sync State:** INFRA-49 creates bidirectional mapping between TASKS.md IDs and Linear issue IDs
- **Context Update:** OPS-15 updates CLAUDE.md to reference Linear as primary PM tool
- **Automation Philosophy:** All automations are configurable with tunable thresholds (Sprint 6)

---

_Separated from TASKS.md on 2026-02-22 for cleaner product task focus_
