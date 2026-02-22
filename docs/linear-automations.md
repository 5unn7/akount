# Linear Automation Configurations

Complete setup guide for all 10 automation workflows.

**Configure in:** Linear → Settings → Automations → New Automation

**Time:** 2 hours total (~10-15 min per automation)

---

## 1. Auto-Triage Bugs

**Purpose:** Automatically prioritize and schedule high-impact bugs

**Trigger:**
- Issue created in **Customer Success** team
- Has label **"bug"**
- Custom field **"Customer Count"** > 10

**Actions:**
1. Set priority to **High**
2. Add to **current cycle**
3. Add comment: `@platform High-impact bug: affects {Customer Count} users`

**Test:**
1. Create CS issue
2. Add label "bug"
3. Set Customer Count = 15
4. Verify: Priority = High, added to cycle

---

## 2. Auto-Route Feature Requests

**Purpose:** Automatically assign feature requests to the correct product team

**Trigger:**
- Issue created in **Customer Success** team
- Has label **"feature-request"**

**Conditions (use multiple automations, one per keyword):**

**Banking team:**
- Title or description contains: "account", "transaction", "bank", "reconcile"
- Action: Change team to **Banking**, add to project "Banking Domain Complete"

**Business team:**
- Contains: "invoice", "bill", "client", "vendor", "payment"
- Action: Change team to **Business**, add to project "Business Domain Complete"

**Accounting team:**
- Contains: "journal", "GL", "report", "balance sheet", "chart of accounts"
- Action: Change team to **Accounting**, add to project "Accounting Domain Complete"

**Planning team:**
- Contains: "budget", "goal", "forecast"
- Action: Change team to **Planning**, add to project "Planning & Forecasting"

**Insights team:**
- Contains: "AI", "insight", "chat", "categorize"
- Action: Change team to **Insights**, add to project "AI & Insights"

**Fallback:**
- If no keywords match → Keep in CS team, add label "needs-triage"

---

## 3. Sprint Auto-Assignment

**Purpose:** Critical tasks automatically added to current sprint

**Trigger:**
- Issue priority changed to **Critical**

**Condition:**
- Issue is NOT already in a cycle

**Actions:**
1. Add to **current cycle**
2. Add comment: `Auto-added to sprint due to Critical priority`

---

## 4. Customer Impact Escalation

**Purpose:** Escalate issues affecting large numbers of users

**Trigger:**
- Label **"affects-1000+"** added to any issue

**Actions:**
1. Set priority to **Critical**
2. Add to **current cycle** (if not already)
3. Add comment: `@exec ESCALATION: Issue affects 1000+ users`
4. Send Slack notification (if Slack integrated)

---

## 5. Incident Response

**Purpose:** Fast P0 response to production outages

**Trigger:**
- Issue created in **Infrastructure** team
- Has label **"production-down"**

**Actions:**
1. Set priority to **Critical** (Urgent in Linear)
2. Create incident timeline (add comment: "Incident started at {timestamp}")
3. Add comment: `@all-teams P0 INCIDENT - Production outage`
4. Add to **current cycle**
5. Send Slack/email notification

---

## 6. Feature Shipped Notification

**Purpose:** Close feedback loop when features ship

**Trigger:**
- Issue in **Product teams** (Overview, Banking, Business, Accounting, Planning, Insights)
- Status changed to **Done**
- Label **"deployed"** exists

**Actions:**
1. Find all linked issues in **Customer Success** team
2. Add comment to each: `Feature shipped! This has been deployed to production.`
3. Create new issue in **Content** team:
   - Title: `Docs: Update for {original issue title}`
   - Description: Link to original issue + "Update documentation"
   - Label: "needs-content"

---

## 7. Stale Issue Cleanup

**Purpose:** Prevent issue bloat, close inactive issues

**Trigger (First pass):**
- Issue open for > **90 days**
- No activity (comments, status changes) for > **30 days**
- Status != Done, Canceled

**Actions:**
1. Add comment: `This issue has been inactive for 30 days. Is it still relevant? Please comment within 7 days or it will be auto-closed.`
2. Add label **"stale"**

**Trigger (Second pass - 7 days later):**
- Issue has label **"stale"**
- No new comments in last **7 days**

**Actions:**
1. Close issue (status → Canceled)
2. Add comment: `Auto-closed due to inactivity. Reopen if still needed.`

---

## 8. Cross-Team Handoff (Docs)

**Purpose:** Auto-create documentation tasks when features ship

**Trigger:**
- Label **"needs-content"** added to any issue

**Actions:**
1. Create new issue in **Content** team:
   - Title: `Docs: {original issue title}`
   - Description: Link to original issue + "Update documentation for this feature"
   - Assign to: Content team lead (if set)
   - Add to project: "Documentation Hub"
2. Link the two issues (relates to)
3. Add comment in original: `Documentation task created: {new issue identifier}`

---

## 9. Duplicate Detection (Script)

**Runs via cron (not Linear UI automation)**

Script: `.claude/scripts/linear-duplicate-check.ts`

**Schedule:** Hourly

**What it does:**
- Fetches CS issues from last 7 days
- Calculates title similarity using Levenshtein distance
- If >80% similar → Links as duplicate, adds comment

**Setup:**
```bash
# Add to crontab or GitHub Actions
0 * * * * cd /path/to/repo && npm run linear:duplicate-check
```

**Package.json script:**
```json
"linear:duplicate-check": "dotenv -e .env -- tsx .claude/scripts/linear-duplicate-check.ts"
```

---

## 10. Deploy Notification (Implemented in Sprint 3)

**Purpose:** Track deployments and update related issues

Implemented as GitHub Actions workflow (Sprint 3, Task 3.1)

See: `.github/workflows/linear-notify-deploy.yml`

---

## Testing Checklist

After creating each automation:

- [ ] Create test issue matching trigger conditions
- [ ] Verify all actions execute correctly
- [ ] Check comment mentions work (@exec, @platform-lead)
- [ ] Verify no duplicate triggers (multiple automations firing)
- [ ] Test edge cases (issue already in cycle, etc.)

---

## Monitoring

**Check automation health:**
- Linear → Settings → Automations → View activity log
- Monitor false positives (actions that shouldn't have fired)
- Tune thresholds (customer count, similarity %, timeframes)

**Expected volume at 100k users:**
- Auto-Triage: ~50 triggers/day
- Auto-Route: ~30 triggers/day
- Customer Impact: ~5 triggers/day
- Incident Response: ~1-2 triggers/week
- Feature Shipped: ~10 triggers/week
- Stale Cleanup: ~20 triggers/week
- Cross-Team Handoff: ~15 triggers/week

**Total:** ~150 automation triggers/day (well within Linear limits)

---

## Next: Sprint 3 Integrations

After automations are configured, set up:
- GitHub Actions webhooks
- Intercom CS integration
- Sentry error monitoring
