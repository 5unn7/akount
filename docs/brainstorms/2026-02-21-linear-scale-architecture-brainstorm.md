# Linear Scale Architecture for Akount (100k Users)

**Date:** 2026-02-21
**Status:** Brainstormed → Approved for Implementation

## Problem

Run and manage Akount from all business fronts (Product, Customer Success, Operations, Growth, Content) in a single system with full visibility. At 100k users, need scalable workflows for:
- Product development (current 256 tasks)
- Customer feedback/support (100-500 issues/day expected)
- Infrastructure/operations (deployments, incidents)
- Growth & marketing (campaigns, partnerships)
- Content management (docs, blog, tutorials)

**Primary Bottleneck:** Visibility - can't see what's happening across all fronts

## Chosen Approach

**Single Workspace, 12-Team Architecture**

Linear Business plan with 12 teams total:

**Product Teams (7 - existing):**
1. Overview - Dashboard, analytics, reporting
2. Banking - Accounts, transactions, reconciliation
3. Business - Invoices, clients, vendors, payments
4. Accounting - GL, journal entries, reports
5. Planning - Budgets, goals, forecasts
6. Insights - AI insights, chat, categorization
7. Platform - Security, Performance, Infrastructure, Dev tasks

**Operations Teams (5 - new):**
8. Customer Success - Support tickets, bug reports, feature requests from users
9. Infrastructure - DevOps, deployments, monitoring, scaling
10. Growth - Marketing campaigns, partnerships, user acquisition
11. Content - Docs, blog, help center, tutorials
12. Business Ops - Legal, compliance, finance, HR, admin

### Key Features

- **Single pane of glass:** All fronts visible in one workspace
- **Automated routing:** Customer feedback auto-triages to relevant product team
- **Cross-functional linking:** Support ticket → feature → deployment → docs update
- **Executive dashboard:** Health metrics across all 12 teams at a glance
- **Integration hub:** GitHub, support tools, monitoring, marketing tools

### Constraints

- Linear Business plan: $14/user/month (unlimited teams, automations)
- API rate limit: 2000 req/hour (sufficient for automation)
- At 100k users: expect 100-500 support issues/day
- Need PII redaction for customer data in Linear

### Edge Cases

- **Support volume spike:** User report triggers flood of duplicate issues → Automation deduplicates via similarity check
- **Cross-team dependencies:** Feature requires content + infrastructure + product → Link issues across teams with dependency tracking
- **Emergency incidents:** Production down → Automation creates P0 issue, notifies all relevant teams, bypasses triage

## Domain Impact

**Primary:** All 7 product teams (existing)

**New Teams:** Customer Success, Infrastructure, Growth, Content, Business Ops

**Data Flows:**
- Customer feedback → CS → Product teams (issue transfer)
- Product deploys → Infrastructure (GitHub webhook)
- Feature launches → Growth (for marketing) + Content (for docs)

## Review Concerns

**Security:**
- Role-based access control (not all users see all teams)
- Customer PII in Linear (use redaction features)
- API key management for integrations

**Scalability:**
- 100-500 issues/day from customers
- Automation required to prevent manual triage bottleneck
- Need monitoring on Linear API usage

**Integration:**
- GitHub (done), Support tool (Intercom/Zendesk), Monitoring (PagerDuty/DataDog), Marketing (TBD)

## Automation Workflows (10 Total)

1. **Auto-Triage Bugs:** CS issue + label "bug" + affects >10 users → Add "High" priority + current cycle + notify Platform
2. **Auto-Route Feature Requests:** CS issue + label "feature-request" → Parse keywords → Assign to product team
3. **Deploy Notification:** GitHub deploy completes → Create Infrastructure issue + update linked Product issues
4. **Duplicate Detection:** New CS issue → Check for similar open issues → Auto-link or mark as duplicate
5. **Customer Impact Escalation:** Issue gets label "affects-1000+" → Auto-escalate to Critical + notify exec
6. **Incident Response:** Infrastructure issue + label "production-down" → Create P0 + notify all teams + start incident timeline
7. **Feature Shipped Notification:** Product issue → Done + deployed → Notify CS team + update customers + create Content task for docs
8. **Stale Issue Cleanup:** Issue open >90 days, no activity >30 days → Auto-comment "Still relevant?" → If no response in 7 days, close
9. **Sprint Auto-Assignment:** Issue priority changed to Critical → Add to current cycle (if not already in one)
10. **Cross-Team Handoff:** Product issue → Needs docs → Auto-create linked Content issue with context

## Custom Views (8 Total)

1. **Executive Dashboard:** All teams, group by team, metrics: count, story points, blocked, cycle time
2. **Customer Health:** CS team, last 7 days, group by priority, metrics: response time, resolution rate
3. **Product Velocity:** Product teams, current cycle, group by team, metrics: velocity, burndown
4. **Incident Response:** Infrastructure, status = In Progress/Blocked, sort by priority
5. **Sprint Board:** Current cycle, status != Done, group by priority, board view
6. **Roadmap Timeline:** All projects, roadmap view, show 8 weeks
7. **Blocked Tasks:** All teams, status = Blocked, group by team
8. **High Priority Inbox:** Priority = Critical/High, status != Done, sort by created

## Integration Architecture

**Customer Feedback Sources → CS Team:**
- Intercom (chat) → Webhook → Auto-create issue
- Email (support@) → Zapier → Auto-create issue
- In-app widget → API → Auto-create issue
- User interviews → Manual create

**Product Development → Product Teams:**
- GitHub commits → Auto-link issues
- GitHub PRs → Auto-close on merge
- Claude Code → TASKS.md sync (existing)

**Operations → Infrastructure Team:**
- PagerDuty → Webhook → Auto-create incident
- GitHub Actions → Webhook → Update deployment issues
- DataDog alerts → Webhook → Auto-create monitoring issue

**Growth & Content:**
- Marketing calendar → Sync with Linear cycles
- Content pipeline → Issues for each piece

## Labels (Beyond Existing 25)

**Customer Impact:**
- `affects-100+`, `affects-1000+`, `churn-risk`

**Urgency:**
- `production-down`, `sev-1`, `sev-2`

**Workflow:**
- `needs-product`, `needs-eng`, `needs-content`

## Alternatives Considered

**Multi-Workspace (Enterprise):** Separate workspaces for Product/Ops/Business - Rejected: More expensive ($19/user), harder cross-workspace reporting, doesn't solve visibility bottleneck

**Hybrid (Linear + Specialized Tools):** Linear for product only, Zendesk for support, PagerDuty for incidents - Rejected: Context switching, doesn't solve visibility need, more tool subscriptions

## Open Questions

- [x] Team size? (Solo PM for now, may hire CS/ops later)
- [ ] Support tool preference? (Intercom recommended for in-app support)
- [ ] Monitoring stack? (Recommend: Sentry for errors, Vercel Analytics for performance)
- [ ] Content tool? (Start in Linear, can add Notion later if needed)

## Next Steps

- [x] Create implementation plan: `/processes:plan linear-scale-architecture`
