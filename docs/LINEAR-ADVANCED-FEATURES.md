# Linear Advanced Features Setup

Complete guide to configuring Initiatives, Projects, Documents, and Agents in Linear.

**Time:** 30 minutes
**Prerequisites:** Basic workspace setup complete (12 teams, 34 labels)

---

## ✅ What's Already Done (Automated)

- [x] **3 Initiatives created:** Launch MVP, Scale & Optimize, Customer Success Excellence
- [x] **12 teams with hierarchy:** Product (6 teams) + Operations (6 teams)
- [x] **34 labels:** Priorities, types, sources, customer impact, urgency, workflow
- [x] **4 cycles:** Next 8 weeks of 2-week sprints

---

## 📋 Manual Setup Tasks (30 min)

### 1. Link Projects to Initiatives (5 min)

Go to: **Linear → Roadmap View** (or Projects tab)

For each project, set its Initiative:

**Launch MVP Initiative:**
1. **Phase 6: Production Hardening** → Click → Set Initiative: "Launch MVP"
2. **Banking Command Center** → Click → Set Initiative: "Launch MVP"
3. **Business Operations** → Click → Set Initiative: "Launch MVP"
4. **Accounting Foundation** → Click → Set Initiative: "Launch MVP"

**Scale & Optimize Initiative:**
5. **Phase 7: Scale & Optimize** → Click → Set Initiative: "Scale & Optimize"
6. **Planning & Forecasting** → Click → Set Initiative: "Scale & Optimize"
7. **AI Insights** → Click → Set Initiative: "Scale & Optimize"

**Customer Success Excellence Initiative:**
8. Create new project: **Documentation Hub**
   - Description: API docs, guides, tutorials
   - Target Date: 2026-04-15
   - Initiative: Customer Success Excellence

9. Create new project: **Support Infrastructure**
   - Description: Ticketing, knowledge base, chatbot
   - Target Date: 2026-04-30
   - Initiative: Customer Success Excellence

---

### 2. Create Documents (10 min)

Go to: **Linear → Docs → New Doc**

**Doc 1: Linear Workflows**
- **Title:** Linear Workflows
- **Icon:** 📋 (click icon picker → search "clipboard")
- **Content:** Copy from template below
- **Share with:** All teams

**Doc 2: Automation Runbook**
- **Title:** Automation Runbook
- **Icon:** 🤖 (search "robot")
- **Content:** Copy from template below
- **Share with:** All teams

**Doc 3: Integration Guide**
- **Title:** Integration Guide
- **Icon:** 🔗 (search "link")
- **Content:** Copy from template below
- **Share with:** All teams

**Doc 4: Executive Dashboard Guide**
- **Title:** Executive Dashboard Guide
- **Icon:** 📊 (search "chart")
- **Content:** How to read each metric, when to check, what actions to take
- **Share with:** All teams

**Templates at bottom of this doc** ↓

---

### 3. Configure Linear Agents (10 min)

Go to: **Settings → Agents** (Business plan feature)

**Enable these agents:**

#### Triage Agent
- **Purpose:** Auto-categorize and prioritize CS issues
- **Configuration:**
  - Train on existing labels (bug, feature-request, question)
  - Auto-suggest priority based on keywords
  - Detect duplicates using AI similarity (>80% match)
- **Teams:** Customer Success
- **Auto-assign:** Yes

#### Smart Assignment Agent
- **Purpose:** Auto-assign issues to best team member
- **Configuration:**
  - Based on past work (who worked on similar issues)
  - Load balancing (distribute evenly)
  - Expertise tags (if team members have skills tagged)
- **Teams:** All product teams
- **Auto-assign:** No (suggest only, manual confirm)

#### Context Enrichment Agent
- **Purpose:** Auto-add labels and extract metadata
- **Configuration:**
  - Extract customer count from description
  - Add domain labels based on keywords
  - Suggest related issues
- **Teams:** All teams
- **Auto-run:** On issue creation

#### Insights Agent
- **Purpose:** Weekly team health summaries
- **Configuration:**
  - Generate every Friday
  - Include: velocity, bottlenecks, predictions
  - Send to: Exec email
- **Schedule:** Weekly (Friday 5pm)

---

### 4. Add Custom Fields to Teams (5 min)

Go to: **Settings → Custom Fields → [Field Name] → Edit**

Assign fields to relevant teams:

**Response Time:**
- Teams: Customer Success

**Customer Count:**
- Teams: Customer Success, Platform, Infrastructure

**Deployment ID:**
- Teams: Infrastructure, Platform

**Marketing Campaign:**
- Teams: Growth, Content

Click **Save** for each.

---

## ✅ Verification Checklist

After completing manual setup:

- [ ] 9 projects linked to 3 initiatives (Roadmap view shows grouping)
- [ ] 4 documents created in Docs tab
- [ ] 4 Linear Agents enabled and configured
- [ ] 4 custom fields assigned to correct teams
- [ ] Roadmap view shows initiative grouping
- [ ] Documents are searchable and shared with all teams

---

## 🚀 Next: Import Your Tasks

Now that the workspace is fully configured:

```bash
npm run linear:import
```

This will import 256 tasks from TASKS.md with full metadata.

---

## Advanced Feature Benefits

### Initiatives
- **Strategic grouping:** See all projects contributing to "Launch MVP"
- **Progress tracking:** % complete across all initiative projects
- **Timeline view:** Gantt chart of initiative roadmap

### Projects
- **Cross-team coordination:** One project, multiple teams
- **Milestone tracking:** Break projects into milestones
- **Dependency mapping:** Visual project dependencies

### Documents
- **Centralized knowledge:** Specs, runbooks, workflows in one place
- **Linked to issues:** Reference docs in issue descriptions
- **Version history:** Track doc changes over time
- **Search:** Full-text search across all docs

### Agents (AI)
- **Auto-triage:** Save 30% of manual triage time
- **Duplicate detection:** Prevent duplicate CS tickets
- **Smart assignment:** Reduce routing errors
- **Insights:** Proactive bottleneck detection

---

## Document Templates

### Template 1: Linear Workflows

```markdown
# Linear Workflows

## Overview

This document describes how each team uses Linear for their work.

## Product Teams

### Overview Team
- **Owns:** Dashboard, analytics, reporting features
- **Workflow:** Feature request → Design → Implement → Review → Ship
- **Cycle:** 2-week sprints
- **Success metric:** Dashboard load time <2s

### Banking Team
- **Owns:** Accounts, transactions, reconciliation
- **Workflow:** Backend → Frontend → Testing → Ship
- **Success metric:** Zero transaction posting errors

[Continue for all 6 product teams...]

## Operations Teams

### Customer Success Team
- **Owns:** Support tickets, bug reports, feature requests
- **Triage SLA:** <4h for Critical, <24h for High
- **Escalation:** >1000 users affected → Auto-escalate to exec
- **Metrics:** Response time, resolution rate, CSAT

### Infrastructure Team
- **Owns:** DevOps, deployments, monitoring
- **Incident response:** P0 <15min, P1 <4h, P2 <24h
- **Success metric:** 99.9% uptime

[Continue for all 6 operations teams...]

## Cross-Team Workflows

### Feature Request Flow
1. Customer → CS issue (via support widget/Intercom)
2. CS triages → Labels (bug/feature-request)
3. Automation → Routes to product team
4. Product → Implements → Ships
5. Automation → Notifies CS + customer

### Incident Response Flow
1. Monitoring alert → Infrastructure issue (auto-created)
2. Infrastructure → Investigates → Creates Product issue if bug
3. Product → Fixes → Deploys
4. Automation → Closes Infrastructure issue → Notifies CS

### Documentation Pipeline
1. Product ships feature
2. Automation → Creates Content issue with "needs-content" label
3. Content → Writes docs → Links to original feature issue
4. Content → Marks done → Automation notifies Product team
```

### Template 2: Automation Runbook

```markdown
# Linear Automation Runbook

## Auto-Triage Bugs

**Trigger:** CS issue + label "bug" + custom field "Customer Count" >10

**Actions:**
1. Set priority to "High"
2. Add to current cycle
3. Comment "@platform-lead High-impact bug detected"

**How to test:**
1. Create issue in Customer Success team
2. Add label "bug"
3. Set Customer Count = 15
4. Verify: Priority changed to High, added to cycle, comment posted

**How to disable:**
Settings → Automations → "Auto-Triage Bugs" → Disable

**Troubleshooting:**
- Automation didn't trigger → Check custom field is set (not just description)
- Wrong priority → Adjust threshold in automation settings

---

## Auto-Route Feature Requests

**Trigger:** CS issue + label "feature-request"

**Actions:**
1. Parse title/description for keywords
2. Assign to relevant product team:
   - "invoice", "bill", "client", "vendor" → Business team
   - "account", "transaction", "reconcile" → Banking team
   - "journal", "GL", "report" → Accounting team
   [etc...]
3. Add to "Feature Requests" project

**How to test:**
1. Create CS issue with title "Add multi-currency support to invoices"
2. Add label "feature-request"
3. Verify: Assigned to Business team, added to Feature Requests project

[Continue for all 10 automations...]
```

### Template 3: Integration Guide

```markdown
# Linear Integration Guide

## GitHub Integration

**Setup:**
1. Linear → Settings → Integrations → GitHub
2. Connect account → Authorize
3. Select repository: `akount/product-plan`
4. Enable features:
   - ✅ Auto-link commits
   - ✅ Auto-link PRs
   - ✅ Auto-close on merge
   - ✅ Sync PR status

**Usage:**
- Mention `PLAT-123` in commit → Auto-links to issue
- PR description: `Closes PLAT-123` → Auto-closes on merge
- Branch name: `plat-123-rate-limiting` → Auto-links

**Webhook (Deploy Notifications):**
- URL: https://api.linear.app/webhooks/[your-webhook-id]
- Trigger: GitHub Actions deploy success
- Payload: `{ "deploymentId": "v1.2.3", "issueIds": ["PLAT-123"] }`
- Action: Creates Infrastructure issue, updates linked Product issues

---

## Intercom Integration

**Setup:**
1. Intercom → Settings → Webhooks → Add Webhook
2. URL: https://api.linear.app/webhooks/[webhook-id]
3. Events: conversation.user.replied, conversation.admin.replied, conversation.tag.created
4. Test webhook

**Workflow:**
- Customer sends message → Intercom conversation
- Agent tags conversation: "bug" or "feature-request"
- Webhook → Linear API → Creates CS issue
- CS issue includes: customer email, conversation link, full transcript

[Continue for all 5 integrations...]
```

---

## Cost Summary

**Linear Business Plan:** $14/user/month

**What You Get:**
- ✅ Unlimited teams (you have 12 + hierarchy)
- ✅ Unlimited issues
- ✅ Unlimited custom fields (you have 4)
- ✅ Unlimited automations (you'll create 10)
- ✅ Initiatives & roadmaps
- ✅ Linear Docs (unlimited docs)
- ✅ Linear Agents (AI-powered triage)
- ✅ Advanced integrations
- ✅ Priority support

**ROI at 100k users:**
- Triage Agent: Saves ~10 hours/week (80% auto-triage)
- Duplicate Detection: Prevents ~50 duplicate tickets/week
- Executive Dashboard: 5 min daily vs 30 min manual check
- **Total time savings:** ~15 hours/week = $1500+/week in founder time

---

## Next Steps

1. **Complete manual tasks** (this doc - 30 min)
2. **Import tasks:** `npm run linear:import`
3. **Create custom dashboards** (Sprint 4 - 15 min)
4. **Set up automations** (Sprint 2 - 2 hours)
5. **Configure integrations** (Sprint 3 - 3 hours)

**Full plan:** [docs/plans/2026-02-21-linear-scale-architecture.md](../plans/2026-02-21-linear-scale-architecture.md)
