# Linear Team Workflows

How each team uses Linear for their work at 100k user scale.

---

## Product Teams

### Overview Team
- **Owns:** Dashboard, analytics, reporting, metrics
- **Workflow:** Feature request → Design → Backend → Frontend → Review → Ship
- **Cycle:** 2-week sprints
- **Success metrics:** Dashboard load time <2s, data accuracy 100%
- **Handoffs:** Content team (for dashboard docs)

### Banking Team
- **Owns:** Accounts, transactions, reconciliation, imports
- **Workflow:** API → Service → Tests → Frontend → Review → Ship
- **Success metrics:** Zero transaction posting errors, reconciliation accuracy 100%
- **Handoffs:** Accounting (for GL integration), Content (for banking docs)

### Business Team
- **Owns:** Invoices, bills, clients, vendors, payments (AR/AP)
- **Workflow:** Backend → Frontend → Financial validation → Ship
- **Success metrics:** Payment accuracy 100%, invoice generation <500ms
- **Handoffs:** Accounting (for journal entries), Customer Success (for payment issues)

### Accounting Team
- **Owns:** GL, journal entries, reports, chart of accounts
- **Workflow:** Financial logic → Double-entry validation → Tests → Frontend → Review → Ship
- **Success metrics:** Double-entry balance 100%, report accuracy 100%
- **Handoffs:** All product teams (GL integration), Content (for accounting docs)

### Planning Team
- **Owns:** Budgets, goals, forecasts, cash flow projections
- **Workflow:** Model → Backend → Frontend → Validation → Ship
- **Success metrics:** Forecast accuracy within 10%, budget tracking real-time
- **Handoffs:** Accounting (for actuals data), Insights (for AI forecasting)

### Insights Team
- **Owns:** AI chat, categorization, anomaly detection, insights
- **Workflow:** AI model → API → Frontend → Testing → Ship
- **Success metrics:** Categorization accuracy >90%, response time <3s
- **Handoffs:** All teams (AI features), Content (for AI docs)

---

## Operations Teams

### Platform Team
- **Owns:** Security, performance, infrastructure, dev tooling
- **Workflow:** Design → Implement → Test → Review → Ship
- **Success metrics:** Zero security vulnerabilities, p95 load time <2s
- **Priority:** Critical bugs <4h response, High <24h
- **Handoffs:** All product teams (platform features), Infrastructure (for deploys)

### Customer Success Team
- **Owns:** Support tickets, bug reports, feature requests from 100k users
- **Workflow:**
  1. **Intake:** Customer submits via widget/Intercom/email
  2. **Triage:** Automation categorizes (bug vs feature vs question)
  3. **Route:** Automation assigns to product team OR CS handles directly
  4. **Escalate:** >1000 users affected → Exec notification
  5. **Close:** Feature shipped or bug fixed → Notify customer
- **SLA:** <4h for Critical, <24h for High, <48h for Medium
- **Success metrics:** Response time <4h avg, resolution rate >80%, CSAT >4.5/5
- **Handoffs:** All product teams (for bugs/features), Content (for docs requests)

### Infrastructure Team
- **Owns:** DevOps, deployments, monitoring, scaling to 100k users
- **Workflow:**
  1. **Monitor:** Sentry, Vercel, uptime checks
  2. **Detect:** Automation creates incident from alerts
  3. **Respond:** P0 <15min, P1 <4h, P2 <24h
  4. **Resolve:** Fix → Deploy → Verify → Close
  5. **Post-mortem:** Document incident, update runbooks
- **Success metrics:** 99.9% uptime, incident MTTR <2h, zero data loss
- **Handoffs:** Platform (for bugs), Product teams (for feature-related incidents)

### Growth Team
- **Owns:** Marketing campaigns, partnerships, user acquisition
- **Workflow:**
  1. **Plan:** Campaign brief → Timeline → Resources
  2. **Execute:** Launch → Monitor metrics
  3. **Optimize:** A/B test → Iterate
  4. **Report:** Results → Learnings → Next campaign
- **Success metrics:** CAC <$50, conversion rate >5%, MRR growth >10%/month
- **Handoffs:** Content (for campaign assets), Product (for feature launches)

### Content Team
- **Owns:** Docs, blog, help center, tutorials, onboarding materials
- **Workflow:**
  1. **Intake:** Auto-created from product issues with "needs-content" label
  2. **Draft:** Write docs/blog post
  3. **Review:** Product team reviews for accuracy
  4. **Publish:** Deploy to docs site
  5. **Close:** Link published doc, mark done
- **Success metrics:** Docs coverage >80%, user findability >90%, freshness <30 days
- **Handoffs:** All product teams (for feature docs), Growth (for marketing content)

### Business Ops Team
- **Owns:** Legal, compliance, finance, HR, admin
- **Workflow:**
  1. **Plan:** Quarterly planning
  2. **Execute:** Monthly tasks (accounting close, compliance reports)
  3. **Track:** Financial metrics, compliance status
  4. **Report:** Board updates, regulatory filings
- **Success metrics:** Compliance 100%, financial close <5 days
- **Handoffs:** Platform (for compliance tooling), Customer Success (for legal inquiries)

---

## Cross-Team Workflows

### Feature Request Flow (Customer → Product → Customer)

1. **Customer submits** → CS issue via widget/Intercom
2. **Automation triages** → Adds label (bug/feature-request)
3. **Automation routes** → Assigns to product team (Banking, Business, etc.)
4. **Product implements** → Creates issue in their team
5. **Product ships** → Marks done, adds label "deployed"
6. **Automation notifies** → Comments in original CS issue "Feature shipped!"
7. **CS closes** → Notifies customer

### Incident Response Flow (Alert → Fix → Verify)

1. **Monitoring alert** → Sentry/Vercel detects error
2. **Automation creates** → Infrastructure issue with label "sev-1"
3. **Infrastructure triages** → If bug, creates linked Product issue
4. **Product fixes** → Implements fix, links to Infrastructure issue
5. **Infrastructure deploys** → Verifies fix in prod
6. **Automation closes** → Updates all linked issues
7. **Post-mortem** → Infrastructure documents learnings

### Documentation Pipeline (Ship → Docs → Publish)

1. **Product ships feature** → Marks issue done
2. **Automation creates** → Content issue with label "needs-content"
3. **Content writes** → Docs/blog post
4. **Product reviews** → Approves for accuracy
5. **Content publishes** → Deploys to docs site
6. **Automation links** → Adds doc URL to original product issue

---

## Issue Lifecycle

**Typical issue journey:**

```
Backlog → Ready → In Progress → Review → Done
   ↓         ↓          ↓
Deferred  Blocked  (back to Ready if changes needed)
```

**States:**
- **Backlog:** Not yet prioritized
- **Ready:** Prioritized, ready to start
- **In Progress:** Actively working
- **Blocked:** Waiting on dependency
- **Review:** In code review
- **Done:** Completed
- **Deferred:** Postponed, not doing now
- **Canceled:** Won't do

---

## Labeling Conventions

**Always add:**
- Priority (auto-added by automation or manual)
- Type (Security, UX, Financial, etc.)
- Source (Review, Audit, Plan, etc.)

**Add when relevant:**
- Customer impact (affects-100+, affects-1000+)
- Urgency (sev-1, sev-2, production-down)
- Workflow (needs-product, needs-eng, needs-content)
- Phase (Phase 6, Phase 7)

---

## Dependency Management

**Linking issues:**
- Blocked by: Issue A blocks Issue B → Link with "blocks" relation
- Needs: Issue A needs Issue B → Link with "related to"

**In TASKS.md:**
- `[needs: TASK-ID]` → Create Linear link manually or automation handles

**Viewing dependencies:**
- Issue detail → Relations tab
- Blocked Tasks view → Shows all blocked issues

---

## Team Communication

**In-issue:**
- @mention team members for notifications
- @mention teams for group notifications
- Use comments for discussions, not description edits

**Cross-team:**
- Link issues instead of duplicating
- Use "relates to" for cross-team coordination
- Tag with "needs-X" labels for handoffs

---

## Best Practices

**Titling:**
- Format: `{TASK-ID}: {Brief description}`
- Good: `BANK-12: Add CSV import column mapping UI`
- Bad: `Fix import`, `Update banking`

**Descriptions:**
- Include: What, Why, Acceptance Criteria
- Link: Related issues, PRs, docs
- Update: Keep description current (single source of truth)

**Comments:**
- Use for: Progress updates, questions, decisions
- Don't use for: Changing requirements (edit description instead)

**Estimates:**
- Use Fibonacci scale: 1, 2, 3, 5, 8 story points
- 1 SP = ~1 hour, 8 SP = full day
- Re-estimate if task takes 2x original estimate

---

**Next:** Create these workflows as Linear Docs for easy reference!
