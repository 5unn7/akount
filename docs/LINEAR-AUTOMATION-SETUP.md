# Linear Automation Setup Guide

**Generated:** 2026-02-22T00:20:03.320Z

This guide provides step-by-step instructions to set up 10 automations in Linear.

---

## Quick Start

1. Go to [Linear Automations Settings](https://linear.app/akount/settings/automations)
2. Click **"New automation"**
3. Follow the configurations below for each automation
4. Test with sample issues

**Estimated time:** 15-20 minutes (all automations)

---

## Priority Setup Order

Set up in this order for maximum impact:

### 1. Critical Priority (Setup First)
1. Auto-Triage High-Impact Bugs
2. Critical Issue Exec Escalation
3. Security SLA Enforcement

### 2. High Priority
1. Auto-Route Feature Requests
2. Long-Blocked Issue Alert

### 3. Medium Priority
1. Auto-Create Docs Tasks
2. Bug Fixed Notification
3. Potential Duplicate Detection

### 4. Low Priority (Optional)
1. Stale Issue Cleanup
2. New Team Member Setup

---

## Detailed Configurations


### 1. Auto-Triage High-Impact Bugs

**Description:** Bugs affecting >10 customers auto-escalate to High priority
**Category:** triage
**Priority:** critical
**Teams:** Customer Success, Platform

#### Trigger
- Type: Issue created or updated
- Conditions:
  - Labels include "bug"
  - Custom field "Customer Count" > 10
  - Priority is not Critical or High

#### Actions
1. Set priority: High
2. Add label: affects-100+
3. Add comment: 🚨 Auto-escalated: High customer impact (>10 affected)

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Auto-Triage High-Impact Bugs"
3. Trigger: Issue created or updated
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 2. Auto-Route Feature Requests

**Description:** Route feature requests to correct team based on keywords
**Category:** routing
**Priority:** high
**Teams:** Customer Success

#### Trigger
- Type: Issue created
- Conditions:
  - Labels include "feature-request"
  - Team is Customer Success

#### Actions
1. If title/description contains "invoice|bill|payment|client|vendor": Move to Business team
2. If title/description contains "account|transaction|bank|import": Move to Banking team
3. If title/description contains "report|journal|gl|accounting": Move to Accounting team
4. If title/description contains "budget|forecast|plan": Move to Planning team
5. If title/description contains "ai|chat|insight|categorization": Move to Insights team
6. If title/description contains "dashboard|overview": Move to Overview team
7. Else: Add comment: "Please assign to correct product team"

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Auto-Route Feature Requests"
3. Trigger: Issue created
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 3. Critical Issue Exec Escalation

**Description:** Critical issues affecting >1000 users notify executives immediately
**Category:** escalation
**Priority:** critical
**Teams:** All

#### Trigger
- Type: Issue created or updated
- Conditions:
  - Priority is Critical
  - Custom field "Customer Count" > 1000

#### Actions
1. Add label: affects-1000+
2. Add label: production-down
3. Send Slack notification: #incidents channel
4. Add comment: 🔴 CRITICAL: >1000 customers affected. Executive team notified.
5. Set cycle: Current cycle

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Critical Issue Exec Escalation"
3. Trigger: Issue created or updated
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 4. Stale Issue Cleanup

**Description:** Close issues with no activity for 90+ days
**Category:** maintenance
**Priority:** low
**Teams:** All

#### Trigger
- Type: Scheduled (weekly)
- Conditions:
  - Last updated > 90 days ago
  - Status is not Done or Canceled
  - Priority is Low or None

#### Actions
1. Add comment: ⏰ No activity for 90 days. Closing as stale. Comment to reopen.
2. Wait 7 days: 
3. If still no activity: Move to Canceled

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Stale Issue Cleanup"
3. Trigger: Scheduled (weekly)
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 5. Auto-Create Docs Tasks

**Description:** When feature ships, create Content team task to document
**Category:** cross-team
**Priority:** medium
**Teams:** All product teams

#### Trigger
- Type: Issue moved to Done
- Conditions:
  - Labels include "feature"
  - Team is product team (Overview, Banking, Business, etc.)

#### Actions
1. Create issue in Content team: Document: {issue.title}
2. Link as "Blocks": New docs task blocks original issue
3. Set priority: Same as original
4. Add label: documentation

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Auto-Create Docs Tasks"
3. Trigger: Issue moved to Done
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 6. Bug Fixed Notification

**Description:** When bug is fixed, notify Customer Success to update affected users
**Category:** cross-team
**Priority:** medium
**Teams:** All product teams

#### Trigger
- Type: Issue moved to Done
- Conditions:
  - Labels include "bug"
  - Custom field "Customer Count" > 0

#### Actions
1. Create issue in Customer Success team: Notify customers: {issue.title} fixed
2. Copy customer count: From original issue
3. Add label: customer-communication
4. Link as "Related": Link to original bug

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Bug Fixed Notification"
3. Trigger: Issue moved to Done
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 7. Long-Blocked Issue Alert

**Description:** Alert team when issue blocked for >7 days
**Category:** escalation
**Priority:** high
**Teams:** All

#### Trigger
- Type: Scheduled (daily)
- Conditions:
  - Status is Blocked
  - Time in Blocked state > 7 days
  - Priority is High or Critical

#### Actions
1. Add comment: ⚠️ Blocked for 7+ days. Please unblock or deprioritize.
2. Send Slack notification: To issue assignee + team channel

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Long-Blocked Issue Alert"
3. Trigger: Scheduled (daily)
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 8. New Team Member Setup

**Description:** When user joins team, create onboarding checklist
**Category:** maintenance
**Priority:** low
**Teams:** All

#### Trigger
- Type: User added to team
- Conditions:


#### Actions
1. Create issue: Onboarding: {user.name}
2. Add description template: Onboarding checklist (Linear access, repo access, docs, etc.)
3. Assign to team lead: 
4. Add label: onboarding

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "New Team Member Setup"
3. Trigger: User added to team
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 9. Security SLA Enforcement

**Description:** Security issues must be acknowledged within 4 hours
**Category:** escalation
**Priority:** critical
**Teams:** Platform, Infrastructure

#### Trigger
- Type: Scheduled (hourly)
- Conditions:
  - Labels include "security"
  - Status is Backlog or Triage
  - Created > 4 hours ago
  - No assignee

#### Actions
1. Add comment: ⏰ Security SLA breach: Not acknowledged in 4 hours
2. Send Slack notification: #security channel + @security-lead
3. Set priority: High (if not already higher)

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Security SLA Enforcement"
3. Trigger: Scheduled (hourly)
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


### 10. Potential Duplicate Detection

**Description:** Flag issues with similar titles for duplicate review
**Category:** triage
**Priority:** medium
**Teams:** All

#### Trigger
- Type: Issue created
- Conditions:
  - Title similarity > 80% to existing open issue

#### Actions
1. Add label: potential-duplicate
2. Add comment: Potential duplicate of #{similar_issue}. Please review.
3. Link as "Related": Link to similar issue

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "Potential Duplicate Detection"
3. Trigger: Issue created
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---


## Testing Your Automations

After setup, test each automation:

1. **Auto-Triage Bugs:** Create test issue with label "bug" + Customer Count >10 → Should auto-set to High priority
2. **Feature Request Routing:** Create issue with label "feature-request" + title "invoice export" → Should move to Business team
3. **Critical Escalation:** Create Critical issue with Customer Count >1000 → Should add labels + notify Slack
4. **Stale Cleanup:** Check existing old issues → Should have cleanup comment (if enabled)
5. **Feature Shipped Docs:** Mark feature as Done → Should create Content team task

## Custom Fields Required

Before setting up automations, ensure these custom fields exist:

- **Customer Count** (Number) - How many customers affected
- **Related Teams** (Multi-select) - For cross-team issues

Create at: [Custom Fields Settings](https://linear.app/akount/settings/custom-fields)

## Slack Integration (for notifications)

To enable Slack notifications in automations:

1. Go to [Integrations](https://linear.app/akount/settings/integrations)
2. Find "Slack" → Connect
3. Authorize Linear to access your Slack workspace
4. Select channels for notifications (#incidents, #security, etc.)

## Troubleshooting

**Automation not triggering:**
- Check that all conditions are met
- Verify custom fields have values
- Check automation is enabled (not draft)

**Actions not working:**
- Ensure team exists (for routing actions)
- Check labels exist (for label actions)
- Verify Slack integration (for notifications)

**Too many false positives:**
- Adjust thresholds (e.g., Customer Count >10 → >20)
- Add more specific conditions
- Use "AND" logic instead of "OR"

## Monitoring & Tuning

After 1 week of use:

1. Check automation trigger counts (Settings → Automations → View stats)
2. Review false positives/negatives
3. Adjust thresholds if needed
4. Add/remove conditions based on usage

**Target:** <5% false positive rate for each automation

---

**Need help?** Check [Linear Docs](https://linear.app/docs/automations) or reach out in #linear-help
