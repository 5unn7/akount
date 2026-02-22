# Linear Integrations Setup Guide

Complete configuration for all 5 integrations.

---

## 1. GitHub Integration ✅

**Status:** Already configured (via workspace setup)

**Verify it's working:**
1. Go to: Linear → Settings → Integrations → GitHub
2. Should show: ✅ Connected to `akount/product-plan`
3. Enabled features:
   - ✅ Auto-link commits (mention `PLAT-123` → links)
   - ✅ Auto-link PRs
   - ✅ Auto-close on merge (`Closes PLAT-123`)
   - ✅ Sync PR status

**Test:**
```bash
git commit -m "fix: PLAT-1 — test linear integration"
git push
```

Check Linear → PLAT-1 issue should show linked commit.

**Deploy notifications:** Via GitHub Actions workflow (see `.github/workflows/linear-deploy-notify.yml`)

---

## 2. Support Widget → Linear API

**Purpose:** Capture in-app feedback directly to Customer Success team

**Implementation:** `apps/web/src/lib/linear-feedback.ts` + API route

### Step 1: Create API route

**File:** `apps/web/src/app/api/feedback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, category } = await request.json()

  // Create Linear issue via API
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': process.env.LINEAR_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `mutation {
        issueCreate(input: {
          teamId: "${process.env.LINEAR_CS_TEAM_ID}",
          title: "User feedback: ${category}",
          description: "${message}\\n\\n**From:** ${userId}",
          labelIds: ["${process.env.LINEAR_LABEL_FEEDBACK_ID}"]
        }) {
          issue { id identifier }
        }
      }`
    })
  })

  const data = await response.json()
  return NextResponse.json(data)
}
```

### Step 2: Add feedback widget

**File:** `apps/web/src/components/feedback-widget.tsx`

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function FeedbackWidget() {
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ message, category: 'General' }),
    })
    setSubmitted(true)
  }

  return (
    <div className="fixed bottom-4 right-4">
      {!submitted ? (
        <div className="glass p-4 rounded-xl w-80">
          <Textarea value={message} onChange={e => setMessage(e.target.value)} />
          <Button onClick={submit}>Send Feedback</Button>
        </div>
      ) : (
        <p>✅ Feedback sent!</p>
      )}
    </div>
  )
}
```

**Add to layout:** `apps/web/src/app/(dashboard)/layout.tsx`

---

## 3. Intercom → Linear Webhook

**Purpose:** Support conversations automatically create CS issues

### Setup in Intercom

1. **Intercom → Settings → Developers → Webhooks**
2. Click **"New webhook"**
3. **Endpoint URL:** https://api.linear.app/webhooks/intercom
   - *Note: You'll need to create this webhook endpoint (see Step 2)*
4. **Topics to subscribe:**
   - ✅ `conversation.user.replied`
   - ✅ `conversation.tag.created`
5. **Save**

### Step 2: Create webhook handler

**File:** `apps/api/src/webhooks/intercom-linear.ts` (or use Zapier/Make)

**Using Zapier (easier):**
1. Zapier → New Zap
2. Trigger: Intercom → Conversation Tagged
3. Filter: Tag = "bug" OR "feature-request"
4. Action: Linear → Create Issue
   - Team: Customer Success
   - Title: {conversation_subject}
   - Description: {conversation_first_message} + Link to conversation

---

## 4. Sentry → Linear Integration

**Purpose:** Critical errors automatically create Infrastructure issues

### Setup in Sentry

1. **Sentry → Settings → Integrations → Linear**
2. Click **Install**
3. Authorize Linear
4. **Configure:**
   - Team: **Infrastructure**
   - Minimum occurrences: **10** (don't create for rare errors)
   - Auto-create: ✅ Enabled
   - Auto-resolve: ✅ When error resolved in Sentry

### Test

1. Trigger a test error in your app (throw error in dev)
2. Let it accumulate >10 occurrences in Sentry
3. Check Linear → Infrastructure team for new issue

---

## 5. Monitoring Alerts → Linear

**Purpose:** System monitoring alerts create Infrastructure issues

**Options:**

### Option A: PagerDuty (if using)
1. PagerDuty → Integrations → Linear
2. Configure: Incidents → Create Linear issue

### Option B: Vercel Monitoring (simpler for Next.js)
1. Vercel → Project → Settings → Integrations → Webhooks
2. On deployment error → Webhook → Linear API

### Option C: Custom monitoring webhook

**File:** Create endpoint `apps/api/src/webhooks/monitoring.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'

export async function monitoringWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { alert, severity, metric } = request.body as any

  // Only create issue for critical alerts
  if (severity !== 'critical') {
    return reply.send({ ok: true, skipped: true })
  }

  // Create Linear issue via API
  await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': process.env.LINEAR_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `mutation {
        issueCreate(input: {
          teamId: "${process.env.LINEAR_INFRA_TEAM_ID}",
          title: "Alert: ${alert}",
          description: "**Metric:** ${metric}\\n**Severity:** ${severity}",
          priority: 1,
          labelIds: ["${process.env.LINEAR_LABEL_SEV1_ID}"]
        }) {
          issue { identifier }
        }
      }`
    })
  })

  return reply.send({ ok: true })
}
```

---

## Environment Variables Required

Add to `.env`:

```bash
# Linear Integration
LINEAR_API_KEY=lin_api_...
LINEAR_CS_TEAM_ID=  # Customer Success team ID (get from Linear API)
LINEAR_INFRA_TEAM_ID=  # Infrastructure team ID
LINEAR_LABEL_FEEDBACK_ID=  # "feedback" label ID
LINEAR_LABEL_SEV1_ID=  # "sev-1" label ID
```

**To get IDs:**
```bash
npx dotenv -e .env -- node -e "
const { LinearClient } = require('@linear/sdk');
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

async function getIds() {
  const teams = await linear.teams();
  const labels = await linear.issueLabels();

  console.log('Team IDs:');
  teams.nodes.forEach(t => console.log('  ', t.name, '-', t.id));

  console.log('\nLabel IDs:');
  labels.nodes.forEach(l => console.log('  ', l.name, '-', l.id));
}

getIds();
"
```

---

## Integration Health Monitoring

**Daily check:**
- GitHub: Are commits still auto-linking? (check recent commits)
- Intercom: Are tagged conversations creating issues? (check CS team)
- Sentry: Are errors creating issues? (check Infrastructure team)

**Monthly audit:**
- Review created issues from each integration
- Check for spam/noise (too many low-value issues)
- Tune thresholds (Sentry: 10 occurrences → 25, etc.)

---

**Status:** Integrations documented, workflows created

**Next:** Sprint 6 (Documentation) and Sprint 7 (Monitoring scripts)
