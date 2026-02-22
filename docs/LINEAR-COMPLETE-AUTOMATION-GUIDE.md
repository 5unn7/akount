# Linear Complete Automation Guide

**Last Updated:** 2026-02-22

Complete guide to setting up Linear automations for Akount PM system.

---

## 🎯 Overview

**Total Setup Time:** 25-30 minutes
**Automations:** 10 workflows
**Custom Fields:** 4 fields
**Impact:** Auto-triage, routing, escalation, cross-team coordination

---

## 📋 Setup Checklist

### Phase 1: Prerequisites (5 min) ✅ COMPLETE
- [x] Linear workspace created
- [x] 12 teams configured
- [x] 34 labels created
- [x] 253 tasks imported
- [x] Old teams archived

### Phase 2: Custom Fields (5 min) ⏳ NEXT
- [ ] Create "Customer Count" field (Number, All teams)
- [ ] Create "Response Time" field (Number, Customer Success)
- [ ] Create "Deployment ID" field (Text, Platform/Infrastructure)
- [ ] Create "Marketing Campaign" field (Select, Growth/Content)

**Guide:** [LINEAR-CUSTOM-FIELDS-SETUP.md](./LINEAR-CUSTOM-FIELDS-SETUP.md)

### Phase 3: Automations (15 min)
- [ ] Critical Priority (3 automations - setup first)
  - [ ] Auto-Triage High-Impact Bugs
  - [ ] Critical Issue Exec Escalation
  - [ ] Security SLA Enforcement
- [ ] High Priority (2 automations)
  - [ ] Auto-Route Feature Requests
  - [ ] Long-Blocked Issue Alert
- [ ] Medium Priority (3 automations)
  - [ ] Auto-Create Docs Tasks
  - [ ] Bug Fixed Notification
  - [ ] Potential Duplicate Detection
- [ ] Low Priority (2 automations - optional)
  - [ ] Stale Issue Cleanup
  - [ ] New Team Member Setup

**Guide:** [LINEAR-AUTOMATION-SETUP.md](./LINEAR-AUTOMATION-SETUP.md)

### Phase 4: Testing & Validation (5 min)
- [ ] Test auto-triage with sample bug (Customer Count >10)
- [ ] Test feature routing with keywords
- [ ] Test critical escalation
- [ ] Verify Slack notifications (if configured)

---

## 🚀 Quick Start (Do This Now)

### Step 1: Create Custom Fields (5 min)

```
1. Go to: https://linear.app/akount/settings/custom-fields
2. Click "New custom field"
3. Create these 4 fields:
   - Customer Count (Number, All teams)
   - Response Time (Number, Customer Success)
   - Deployment ID (Text, Platform/Infrastructure)
   - Marketing Campaign (Select, Growth/Content)
```

**Detailed instructions:** [LINEAR-CUSTOM-FIELDS-SETUP.md](./LINEAR-CUSTOM-FIELDS-SETUP.md)

### Step 2: Set Up Critical Automations (5 min)

```
1. Go to: https://linear.app/akount/settings/automations
2. Click "New automation"
3. Create these 3 critical automations:
   - Auto-Triage High-Impact Bugs
   - Critical Issue Exec Escalation
   - Security SLA Enforcement
```

**Step-by-step configs:** [LINEAR-AUTOMATION-SETUP.md](./LINEAR-AUTOMATION-SETUP.md)

### Step 3: Set Up Remaining Automations (10 min)

Follow the guide to set up high/medium/low priority automations.

### Step 4: Test (5 min)

Create test issues to verify automations work correctly.

---

## 📊 Automation Impact

### Auto-Triage & Prioritization
- **Saves:** ~2 hours/week manual triage
- **Impact:** Critical bugs escalated in <1 min instead of hours

### Auto-Routing
- **Saves:** ~1 hour/week moving issues to correct teams
- **Impact:** Faster response, less CS → Product handoff friction

### Cross-Team Coordination
- **Saves:** ~3 hours/week creating follow-up tasks
- **Impact:** Docs tasks auto-created, customers auto-notified

### Escalation & Alerts
- **Saves:** ~30 min/week manual escalation
- **Impact:** Execs notified instantly for critical issues

**Total time saved:** ~6.5 hours/week

---

## 🔧 Detailed Automation Configurations

### 1. Auto-Triage High-Impact Bugs (Critical)

**What it does:** Automatically escalates bugs affecting >10 customers to High priority

**Trigger:**
- Issue created or updated
- Labels include "bug"
- Customer Count > 10
- Priority is not Critical or High

**Actions:**
1. Set priority to High
2. Add label "affects-100+"
3. Add comment: "🚨 Auto-escalated: High customer impact (>10 affected)"

**Setup:**
1. Linear → Settings → Automations → New automation
2. Name: "Auto-Triage High-Impact Bugs"
3. Trigger: "When an issue is created or updated"
4. Conditions: Add 3 conditions above (AND logic)
5. Actions: Add 3 actions above
6. Save

**Test:** Create issue with label "bug" + Customer Count = 15 → Should auto-set to High

---

### 2. Auto-Route Feature Requests (High)

**What it does:** Routes feature requests to correct product team based on keywords

**Trigger:**
- Issue created
- Labels include "feature-request"
- Team is Customer Success

**Actions:**
1. If title/description contains "invoice|bill|payment|client|vendor" → Move to Business team
2. If title/description contains "account|transaction|bank|import" → Move to Banking team
3. If title/description contains "report|journal|gl|accounting" → Move to Accounting team
4. If title/description contains "budget|forecast|plan" → Move to Planning team
5. If title/description contains "ai|chat|insight|categorization" → Move to Insights team
6. If title/description contains "dashboard|overview" → Move to Overview team
7. Else → Add comment: "Please assign to correct product team"

**Setup:**
1. Linear → Settings → Automations → New automation
2. Name: "Auto-Route Feature Requests"
3. Trigger: "When an issue is created"
4. Conditions: Labels include "feature-request" AND Team is "Customer Success"
5. Actions: Add conditional routing rules (see above)
6. Save

**Test:** Create CS issue with label "feature-request" + title "invoice export" → Should move to Business team

---

### 3. Critical Issue Exec Escalation (Critical)

**What it does:** Notifies executives immediately for critical issues affecting >1000 users

**Trigger:**
- Issue created or updated
- Priority is Critical
- Customer Count > 1000

**Actions:**
1. Add label "affects-1000+"
2. Add label "production-down"
3. Send Slack notification to #incidents channel
4. Add comment: "🔴 CRITICAL: >1000 customers affected. Executive team notified."
5. Set cycle to Current cycle

**Setup:**
1. Linear → Settings → Automations → New automation
2. Name: "Critical Issue Exec Escalation"
3. Trigger: "When an issue is created or updated"
4. Conditions: Priority is Critical AND Customer Count > 1000
5. Actions: Add 5 actions above
6. **Note:** Requires Slack integration for notification action
7. Save

**Test:** Create Critical issue with Customer Count = 1500 → Should add labels + notify Slack

---

### 4-10. Additional Automations

See [LINEAR-AUTOMATION-SETUP.md](./LINEAR-AUTOMATION-SETUP.md) for detailed configs of:

4. Stale Issue Cleanup
5. Auto-Create Docs Tasks (when features ship)
6. Bug Fixed Notification (notify customers)
7. Long-Blocked Issue Alert
8. New Team Member Setup
9. Security SLA Enforcement
10. Potential Duplicate Detection

---

## 🔗 Integrations (Optional but Recommended)

### Slack Integration (for notifications)

**Setup time:** 5 min

1. Go to: https://linear.app/akount/settings/integrations
2. Find "Slack" → Click "Connect"
3. Authorize Linear to access your Slack workspace
4. Select channels:
   - #incidents (for critical escalations)
   - #security (for security SLA breaches)
   - #product (for feature ships)
5. Save

**Used by:** Critical Escalation, Security SLA, Blocked Issue Alert automations

### GitHub Integration (for deployment tracking)

**Setup time:** 3 min

1. Go to: https://linear.app/akount/settings/integrations
2. Find "GitHub" → Click "Connect"
3. Authorize Linear to access your GitHub repos
4. Select repositories
5. Configure:
   - Auto-link commits to issues (via commit message)
   - Auto-close issues on PR merge
   - Deployment notifications
6. Save

**Used by:** Deployment ID field auto-population

### Sentry Integration (for error tracking)

**Setup time:** 3 min

1. Go to: https://linear.app/akount/settings/integrations
2. Find "Sentry" → Click "Connect"
3. Authorize Linear
4. Configure:
   - Auto-create issues for new errors
   - Map to Infrastructure team
   - Auto-populate Customer Count from Sentry users
5. Save

**Used by:** Automatic bug creation from production errors

---

## 📈 Monitoring & Tuning

### Week 1: Monitor closely

- Check automation trigger counts daily
- Review false positives/negatives
- Adjust thresholds if needed (e.g., Customer Count >10 → >20)

### Week 2-4: Fine-tune

- Analyze automation stats: Settings → Automations → [Automation] → Stats
- Target: <5% false positive rate
- Adjust conditions based on actual usage

### Monthly: Optimize

- Review time saved
- Add new automations based on repetitive tasks
- Archive unused automations

---

## 🎓 Training Your Team

### For Everyone (5 min)

1. **Custom Fields:** When creating issues, fill in Customer Count if known
2. **Labels:** Use consistent labels (bug, feature-request, etc.) for automations to work
3. **Titles:** Use clear, keyword-rich titles for auto-routing to work

### For Customer Success (10 min)

1. **Triage:** Use "bug" label + Customer Count to trigger auto-escalation
2. **Feature Requests:** Add "feature-request" label to trigger auto-routing
3. **Response Time:** Fill in Response Time field for SLA tracking

### For Product Teams (5 min)

1. **Docs Tasks:** When shipping features, expect auto-created Content team task
2. **Bug Fixes:** When marking bugs Done, expect auto-created CS notification task
3. **Blocked Issues:** Unblock or update issues to avoid alert spam

---

## 🐛 Troubleshooting

### Automation not triggering

**Check:**
- Automation is enabled (not draft)
- All conditions are met (check issue fields)
- Custom fields have values
- Labels are spelled correctly

### False positives (triggering too often)

**Fix:**
- Increase thresholds (Customer Count >10 → >20)
- Add more specific conditions
- Use AND logic instead of OR

### False negatives (not triggering when it should)

**Fix:**
- Lower thresholds
- Check for typos in conditions
- Verify custom field has value

### Slack notifications not working

**Check:**
- Slack integration is connected
- Channel exists and bot is invited
- Automation has Slack action configured

---

## 📚 Additional Resources

- **Linear Docs:** https://linear.app/docs/automations
- **Automation Configs:** `.claude/linear-automation-configs.json`
- **Custom Fields Setup:** [LINEAR-CUSTOM-FIELDS-SETUP.md](./LINEAR-CUSTOM-FIELDS-SETUP.md)
- **Detailed Automation Steps:** [LINEAR-AUTOMATION-SETUP.md](./LINEAR-AUTOMATION-SETUP.md)
- **Linear Status:** [LINEAR-STATUS.md](./LINEAR-STATUS.md)

---

## ✅ Success Criteria

After setup, you should have:

- [x] 4 custom fields created
- [x] 10 automations active (or at least 3 critical ones)
- [x] Tested with sample issues
- [x] Team trained on using custom fields
- [x] Slack integration configured (optional)

**Time to value:** Immediate - automations start working as soon as they're created!

---

**Questions?** Check Linear Docs or reach out in #linear-help
