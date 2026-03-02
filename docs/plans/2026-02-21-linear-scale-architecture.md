# Linear Scale Architecture Implementation Plan

**Created:** 2026-02-21
**Status:** Ready for Implementation
**Brainstorm:** [docs/brainstorms/2026-02-21-linear-scale-architecture-brainstorm.md](../brainstorms/2026-02-21-linear-scale-architecture-brainstorm.md)

## Overview

Transform Linear into a complete business management system for Akount at 100k user scale. Implement 12-team workspace with automated workflows, integrations, and executive dashboards across Product, Customer Success, Infrastructure, Growth, and Content fronts.

**Current State:** 7 product teams created, 25 labels, 7 projects, 4 cycles
**Target State:** 12 teams, 34 labels, 10 automations, 8 custom dashboards, 5 integrations

## Success Criteria

- [ ] All 12 teams operational with clear ownership
- [ ] 10 automation workflows active and tested
- [ ] 8 custom views created and bookmarked
- [ ] GitHub integration auto-linking commits and closing issues
- [ ] Executive dashboard showing health across all fronts
- [ ] 256 product tasks successfully imported
- [ ] Documentation complete for all workflows
- [ ] API usage monitoring in place (<2000 req/hour)

---

## Sprint 1: Foundation & Team Setup (Week 1)

### Task 1.1: Update workspace setup script for 12 teams
**File:** `.claude/scripts/linear-setup-workspace.ts`
**What:** Add 5 new teams (Customer Success, Infrastructure, Growth, Content, Business Ops) to TEAMS array with keys and descriptions
**Depends on:** none
**Success:** Script creates all 12 teams without errors

### Task 1.2: Add customer impact labels
**File:** `.claude/scripts/linear-setup-workspace.ts`
**What:** Add labels: `affects-100+`, `affects-1000+`, `churn-risk`, `production-down`, `sev-1`, `sev-2`, `needs-product`, `needs-eng`, `needs-content`
**Depends on:** none
**Success:** Script creates 9 new labels (34 total)

### Task 1.3: Add custom fields (Business plan feature)
**File:** New script `.claude/scripts/linear-custom-fields.ts`
**What:** Create custom fields: Response Time (number), Customer Count (number), Deployment ID (text), Marketing Campaign (select)
**Depends on:** Task 1.1
**Success:** Custom fields visible in Linear issue forms

### Task 1.4: Run full workspace setup
**File:** Run `npm run linear:setup`
**What:** Execute updated setup script to create 12 teams, 34 labels, custom fields
**Depends on:** Task 1.1, 1.2, 1.3
**Success:** Linear workspace shows 12 teams, 34 labels, 4 custom fields

### Task 1.5: Configure workflow states
**File:** Manual in Linear UI
**What:** Add custom states per team: Ready, Blocked, Review, Deferred (beyond default Todo, In Progress, Done)
**Depends on:** Task 1.4
**Success:** All teams have 7 workflow states

### Task 1.6: Set up team-specific settings
**File:** Manual in Linear UI
**What:** Configure cycles (2-week), estimation (story points), triage (on), auto-archive (4 weeks) for all teams
**Depends on:** Task 1.4
**Success:** All 12 teams have consistent settings

---

## Sprint 2: Automation Workflows (Week 1-2)

### Task 2.1: Auto-Triage Bugs automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Issue created in CS + label "bug" + custom field "Customer Count" >10 → Actions: Set priority "High", add to current cycle, comment "@platform-lead"
**Depends on:** Task 1.4
**Success:** Test issue with >10 customers auto-escalates

### Task 2.2: Auto-Route Feature Requests automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Issue created in CS + label "feature-request" → Action: Parse title/description for keywords (banking→Banking team, invoice→Business team, etc.), assign to team, add to "Feature Requests" project
**Depends on:** Task 1.4
**Success:** Feature request with "invoice" keyword auto-assigns to Business team

### Task 2.3: Sprint Auto-Assignment automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Issue priority changed to Critical → Actions: If not in cycle, add to current cycle, comment "Auto-added to sprint due to Critical priority"
**Depends on:** Task 1.4
**Success:** Changing priority to Critical auto-adds to active cycle

### Task 2.4: Customer Impact Escalation automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Issue label added "affects-1000+" → Actions: Set priority "Critical", add to current cycle, comment "@exec escalation", create Slack notification
**Depends on:** Task 1.4
**Success:** Adding "affects-1000+" label triggers all escalation actions

### Task 2.5: Incident Response automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Issue created in Infrastructure + label "production-down" → Actions: Set priority "Critical", create incident timeline, comment "@all-teams P0 incident", add to current cycle
**Depends on:** Task 1.4
**Success:** Production incident auto-creates P0 with timeline

### Task 2.6: Feature Shipped Notification automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Product issue status → Done + label "deployed" → Actions: Comment in linked CS issues "Feature shipped", create linked Content issue "Update docs for [feature]", add label "needs-content"
**Depends on:** Task 1.4
**Success:** Marking feature "deployed" triggers CS notification + docs task

### Task 2.7: Stale Issue Cleanup automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Issue open >90 days + no activity >30 days → Actions: Comment "Is this still relevant?", set label "stale"; Then: If no response in 7 days → Close with comment "Auto-closed due to inactivity"
**Depends on:** Task 1.4
**Success:** Stale issue gets comment, closes if no response

### Task 2.8: Cross-Team Handoff automation
**File:** Linear UI → Settings → Automations
**What:** Trigger: Product issue label added "needs-content" → Action: Create linked Content issue with title "Docs: [original title]", copy description, assign to Content team
**Depends on:** Task 1.4
**Success:** Adding "needs-content" auto-creates linked Content task

### Task 2.9: Duplicate Detection script
**File:** New `.claude/scripts/linear-duplicate-check.ts`
**What:** Cron job (runs hourly): Fetch new CS issues, check for similar titles/descriptions using string similarity, auto-link duplicates, comment "Possible duplicate of #123"
**Depends on:** Task 1.4
**Success:** Duplicate issue detected and linked within 1 hour

### Task 2.10: Deploy Notification webhook (implemented in Sprint 3)
**What:** Placeholder - will be implemented with GitHub Actions integration
**Depends on:** Sprint 3 Task 3.1
**Success:** GitHub deploy triggers Linear update

---

## Sprint 3: Integrations (Week 2)

### Task 3.1: GitHub Actions → Linear webhook
**File:** New `.github/workflows/linear-notify-deploy.yml`
**What:** On deploy success: POST to Linear API, create Infrastructure issue "Deploy v{version} completed", update all linked Product issues with comment "Deployed ✅", add label "deployed"
**Depends on:** Task 1.4
**Risk:** high (affects prod deploy pipeline)
**Success:** Successful deploy creates Infrastructure issue + updates linked tasks

### Task 3.2: GitHub commit auto-linking (already configured)
**File:** Linear → Settings → Integrations → GitHub
**What:** Verify auto-link commits (mention AKO-123 → link), auto-close on merge (PR with "Closes AKO-123")
**Depends on:** none (already done in setup)
**Success:** Commit with AKO-123 shows in Linear, PR merge closes issue

### Task 3.3: Support widget → Linear API integration
**File:** New `apps/web/src/lib/linear-feedback.ts` (client-side)
**What:** In-app feedback form → POST to API route → Creates Linear issue in CS team with user metadata (email, plan, usage)
**Depends on:** Task 1.4
**Success:** Submitting feedback creates CS issue with user context

### Task 3.4: Intercom → Linear webhook (if using Intercom)
**File:** Intercom → Settings → Webhooks
**What:** On conversation tagged "bug" or "feature-request" → POST to Linear API → Create CS issue with conversation link, customer email, conversation summary
**Depends on:** Task 1.4
**Success:** Intercom conversation tagged "bug" creates Linear CS issue

### Task 3.5: Monitoring → Linear (Sentry integration)
**File:** Sentry → Settings → Integrations → Linear
**What:** Configure Sentry Linear integration: On error with >10 occurrences → Create Infrastructure issue with stack trace, error count, affected users
**Depends on:** Task 1.4
**Success:** Sentry error spike creates Linear Infrastructure issue

---

## Sprint 4: Custom Views & Dashboards (Week 2-3)

### Task 4.1: Executive Dashboard view
**File:** Linear → Views → New View
**What:** Name: "Executive Dashboard", Filter: All teams + Status != Done, Group by: Team, Display: Table, Columns: Count, Story Points (sum), Blocked count, Avg Cycle Time (custom), Save & Star
**Depends on:** Task 1.4
**Success:** View shows health of all 12 teams in one table

### Task 4.2: Customer Health Dashboard view
**File:** Linear → Views → New View
**What:** Name: "Customer Health", Filter: Team = Customer Success + Created in last 7 days, Group by: Priority, Display: Table, Columns: Count, Avg Response Time (custom field), Resolution Rate
**Depends on:** Task 1.3
**Success:** View shows CS performance metrics for last week

### Task 4.3: Product Velocity Dashboard view
**File:** Linear → Views → New View
**What:** Name: "Product Velocity", Filter: Product teams (7) + Current cycle, Group by: Team, Display: Table, Columns: Velocity (story points/week), Burndown, Completed %, Save & Star
**Depends on:** Task 1.4
**Success:** View shows sprint progress across all product domains

### Task 4.4: Incident Response Dashboard view
**File:** Linear → Views → New View
**What:** Name: "Incident Response", Filter: Team = Infrastructure + (Status = In Progress OR Blocked), Sort by: Priority (Critical first), Display: List, Save & Star
**Depends on:** Task 1.4
**Success:** View shows active incidents needing attention

### Task 4.5: Sprint Board view
**File:** Linear → Views → New View
**What:** Name: "Sprint Board", Filter: Current cycle + Status != Done, Group by: Priority, Sort by: Story Points (asc), Display: Board, Save & Star
**Depends on:** Task 1.4
**Success:** Kanban board view of current sprint across all teams

### Task 4.6: Roadmap Timeline view
**File:** Linear → Views → New View
**What:** Name: "Roadmap", View type: Roadmap, Group by: Project, Show: All cycles (next 8 weeks), Save & Star
**Depends on:** Task 1.4
**Success:** Timeline view of all projects across 8 weeks

### Task 4.7: Blocked Tasks view
**File:** Linear → Views → New View
**What:** Name: "Blocked", Filter: All teams + Status = Blocked, Group by: Team, Sort by: Priority, Display: Table, Save & Star
**Depends on:** Task 1.5
**Success:** View shows all blocked tasks grouped by team

### Task 4.8: High Priority Inbox view
**File:** Linear → Views → New View
**What:** Name: "High Priority Inbox", Filter: (Priority = Critical OR High) + Status != Done, Sort by: Created (oldest first), Display: List, Save & Star
**Depends on:** Task 1.4
**Success:** Triage view of all critical/high tasks

---

## Sprint 5: Task Import & Migration (Week 3)

### Task 5.1: Fix task import script domain mapping
**File:** `.claude/scripts/linear-import-simple.ts`
**What:** Update TASK_PREFIX_TO_TEAM mapping: UX tasks → check description for domain keywords (banking→Banking, invoice→Business, etc.), fallback to Platform
**Depends on:** Task 1.4
**Success:** Script maps task IDs to correct teams

### Task 5.2: Add metadata preservation to import
**File:** `.claude/scripts/linear-import-simple.ts`
**What:** Parse TASKS.md for priority (emoji), effort (hours→story points), status (emoji→Linear state), dependencies ([needs: X]), source, preserve in Linear description + labels
**Depends on:** Task 5.1
**Success:** Imported task retains priority, effort, status, deps from TASKS.md

### Task 5.3: Run task import
**File:** Run `npm run linear:import`
**What:** Execute import script to migrate 256 product tasks from TASKS.md to Linear with full metadata
**Depends on:** Task 5.2
**Success:** Linear shows 256 tasks distributed across product teams with correct priorities/estimates

### Task 5.4: Verify import accuracy
**File:** Manual verification in Linear
**What:** Spot-check 20 random tasks: verify team assignment, priority, estimate, dependencies, description match TASKS.md
**Depends on:** Task 5.3
**Success:** All checked tasks match source data

### Task 5.5: Create sync state file
**File:** `.claude/linear-sync-state.json`
**What:** Save mapping of TASKS.md IDs → Linear issue IDs for bidirectional sync
**Depends on:** Task 5.3
**Success:** File contains 256 ID mappings in JSON format

---

## Sprint 6: Documentation & Training (Week 3-4)

### Task 6.1: Write team workflow docs
**File:** New `docs/linear-workflows.md`
**What:** Document workflows for each team: Customer Success (triage bugs/features), Infrastructure (incident response), Growth (campaign tracking), Content (docs pipeline), Business Ops (admin tasks)
**Depends on:** All sprints 1-5
**Success:** Each team has clear workflow documented

### Task 6.2: Create automation runbook
**File:** New `docs/linear-automations.md`
**What:** Document all 10 automations: trigger conditions, actions taken, how to test, how to disable if needed
**Depends on:** Sprint 2
**Success:** Each automation has troubleshooting guide

### Task 6.3: Write integration guide
**File:** New `docs/linear-integrations.md`
**What:** Document all 5 integrations: setup steps, webhook URLs, API keys, testing procedures, troubleshooting
**Depends on:** Sprint 3
**Success:** Each integration has setup + troubleshooting docs

### Task 6.4: Create dashboard usage guide
**File:** New `docs/linear-dashboards.md`
**What:** Document all 8 custom views: purpose, filters, how to interpret metrics, when to use, bookmark links
**Depends on:** Sprint 4
**Success:** Each view has usage guide with screenshots

### Task 6.5: Write Linear best practices
**File:** New `docs/linear-best-practices.md`
**What:** Guidelines: titling conventions, labeling rules, when to create vs comment, issue lifecycle, dependency linking, team handoffs
**Depends on:** All sprints
**Success:** Best practices doc covers common scenarios

### Task 6.6: Update CLAUDE.md context
**File:** `CLAUDE.md` and `docs/LINEAR-COMPLETE-SETUP.md`
**What:** Add Linear as primary PM tool, reference workflow docs, note that TASKS.md is now synced to Linear (not authoritative source)
**Depends on:** Task 6.1-6.5
**Success:** Context files reference Linear as source of truth

---

## Sprint 7: Monitoring & Optimization (Week 4)

### Task 7.1: Set up Linear API usage monitoring
**File:** New `.claude/scripts/linear-api-monitor.ts`
**What:** Cron job (runs daily): Fetch Linear API usage stats via GraphQL, log to file, alert if >1500 req/hour (75% of limit), send summary email
**Depends on:** Sprint 3
**Success:** Daily email with API usage stats, alert triggers at 75% threshold

### Task 7.2: Create automation health dashboard
**File:** New Notion page or Google Sheet
**What:** Track automation metrics: trigger count per automation, success rate, avg execution time, errors
**Depends on:** Sprint 2
**Success:** Dashboard shows health of all 10 automations

### Task 7.3: Tune automation thresholds
**File:** Linear automations (manual tuning)
**What:** Based on 1 week of real usage: adjust customer count thresholds (affects-100+ vs affects-1000+), stale issue timeframes (90 days vs 60 days), keyword matching accuracy
**Depends on:** Sprint 2, one week of usage
**Success:** Automation false-positive rate <5%

### Task 7.4: Optimize custom views for performance
**File:** Linear views (manual optimization)
**What:** Reduce query load: add date filters to unbounded views (Customer Health: last 30 days vs all time), limit results to 500, use indexes (Linear auto-optimizes)
**Depends on:** Sprint 4, one week of usage
**Success:** All views load in <2 seconds

### Task 7.5: Create weekly report automation
**File:** New `.claude/scripts/linear-weekly-report.ts`
**What:** Cron job (runs Friday): Generate report from Executive Dashboard metrics, email to founder: tasks completed this week per team, velocity trends, blocked count, top priorities for next week
**Depends on:** Task 4.1
**Success:** Weekly email with executive summary

---

## Reference Files

- `.claude/scripts/linear-setup-workspace.ts` — Existing workspace setup script
- `.claude/scripts/linear-import-simple.ts` — Existing task import script
- `docs/brainstorms/2026-02-21-linear-scale-architecture-brainstorm.md` — Architecture decisions

---

## Edge Cases

**Support volume spike (>500 issues/day):**
- Automation: Duplicate detection prevents issue flood
- Fallback: Pause auto-routing, manual triage batch, re-enable after spike

**API rate limit exceeded (>2000 req/hour):**
- Monitoring: Alert triggers at 75% (Task 7.1)
- Mitigation: Pause non-critical automations (stale cleanup, duplicate check), batch operations

**Cross-team dependency deadlock:**
- Example: Product waits for Content, Content waits for Infrastructure, Infrastructure waits for Product
- Detection: Blocked Tasks view (Task 4.7) shows circular dependencies
- Resolution: Manual intervention, break dependency chain, escalate to exec

**Emergency incident during off-hours:**
- Automation: Incident Response (Task 2.5) creates P0, notifies all teams
- Escalation: If no response in 15 min, send SMS to on-call (requires external integration)

**Customer data PII in issue descriptions:**
- Prevention: Linear redaction features auto-redact emails, phone numbers
- Audit: Monthly review of CS issues for PII leaks

---

## Domain Impact

**Primary Domains:** All 12 teams (Product: 7, Operations: 5)

**Adjacent Systems:**
- GitHub Actions (deployment pipeline) → Linear (Task 3.1)
- Intercom (support tool) → Linear (Task 3.4)
- Sentry (error monitoring) → Linear (Task 3.5)
- TASKS.md (current source) → Linear (Task 5.3, becomes secondary after migration)

**Data Migration:**
- 256 tasks from TASKS.md → Linear (one-time, Sprint 5)
- Ongoing: TASKS.md ↔ Linear bidirectional sync (for Claude Code agents)

---

## Testing Strategy

**Automation Testing (Sprint 2):**
- Create test issue in each team
- Apply trigger conditions (labels, priority changes, status transitions)
- Verify expected actions (notifications, issue creation, field updates)
- Test edge cases (duplicate triggers, conflicting automations)

**Integration Testing (Sprint 3):**
- GitHub: Deploy to staging, verify Linear issue creation
- Support widget: Submit test feedback, verify CS issue creation
- Sentry: Trigger test error, verify Infrastructure issue creation

**Load Testing (Sprint 7):**
- Simulate 500 issues/day via API (10x current volume)
- Monitor API usage, automation latency, view performance
- Verify no rate limit errors, all automations execute <5 seconds

**User Acceptance (Sprint 6):**
- Founder reviews all 8 dashboards
- Founder tests common workflows (triage bug, mark feature deployed, create incident)
- Founder verifies visibility across all fronts

---

## Progress

### Sprint 1: Foundation (Week 1)
- [ ] Task 1.1: Update workspace setup script for 12 teams
- [ ] Task 1.2: Add customer impact labels
- [ ] Task 1.3: Add custom fields
- [ ] Task 1.4: Run full workspace setup
- [ ] Task 1.5: Configure workflow states
- [ ] Task 1.6: Set up team-specific settings

### Sprint 2: Automation (Week 1-2)
- [ ] Task 2.1: Auto-Triage Bugs automation
- [ ] Task 2.2: Auto-Route Feature Requests automation
- [ ] Task 2.3: Sprint Auto-Assignment automation
- [ ] Task 2.4: Customer Impact Escalation automation
- [ ] Task 2.5: Incident Response automation
- [ ] Task 2.6: Feature Shipped Notification automation
- [ ] Task 2.7: Stale Issue Cleanup automation
- [ ] Task 2.8: Cross-Team Handoff automation
- [ ] Task 2.9: Duplicate Detection script
- [ ] Task 2.10: Deploy Notification (placeholder)

### Sprint 3: Integrations (Week 2)
- [ ] Task 3.1: GitHub Actions → Linear webhook
- [ ] Task 3.2: GitHub commit auto-linking verification
- [ ] Task 3.3: Support widget → Linear API
- [ ] Task 3.4: Intercom → Linear webhook
- [ ] Task 3.5: Sentry → Linear integration

### Sprint 4: Dashboards (Week 2-3)
- [ ] Task 4.1: Executive Dashboard view
- [ ] Task 4.2: Customer Health Dashboard view
- [ ] Task 4.3: Product Velocity Dashboard view
- [ ] Task 4.4: Incident Response Dashboard view
- [ ] Task 4.5: Sprint Board view
- [ ] Task 4.6: Roadmap Timeline view
- [ ] Task 4.7: Blocked Tasks view
- [ ] Task 4.8: High Priority Inbox view

### Sprint 5: Migration (Week 3)
- [ ] Task 5.1: Fix task import domain mapping
- [ ] Task 5.2: Add metadata preservation
- [ ] Task 5.3: Run task import (256 tasks)
- [ ] Task 5.4: Verify import accuracy
- [ ] Task 5.5: Create sync state file

### Sprint 6: Documentation (Week 3-4)
- [ ] Task 6.1: Team workflow docs
- [ ] Task 6.2: Automation runbook
- [ ] Task 6.3: Integration guide
- [ ] Task 6.4: Dashboard usage guide
- [ ] Task 6.5: Best practices doc
- [ ] Task 6.6: Update CLAUDE.md context

### Sprint 7: Optimization (Week 4)
- [ ] Task 7.1: API usage monitoring
- [ ] Task 7.2: Automation health dashboard
- [ ] Task 7.3: Tune automation thresholds
- [ ] Task 7.4: Optimize view performance
- [ ] Task 7.5: Weekly report automation

---

**Total Tasks:** 45 across 7 sprints
**Timeline:** 4 weeks (28 days)
**High-Risk Tasks:** 1 (Task 3.1 - GitHub Actions integration)
