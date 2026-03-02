# Onboarding v3 Deployment Guide

> **Version:** v3 (DB-First with Auto-Save)
> **Target:** Vercel + PostgreSQL (Supabase/Neon/Planetscale)
> **Last Updated:** 2026-02-16

---

## Pre-Deployment Checklist

- [ ] Database migration applied (`OnboardingProgress` table exists)
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Environment variables set (see below)
- [ ] Vercel Cron configured (see below)
- [ ] Clerk metadata schema updated (optional: onboardingCompleted field)

---

## Environment Variables

### Required (Next.js)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API
NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app/api  # Production API URL
NEXT_PUBLIC_WEB_URL=https://your-web-domain.vercel.app      # Production Web URL

# Database (inherited from API)
DATABASE_URL=postgresql://...
```

### Required (Fastify API)

```bash
# Clerk
CLERK_SECRET_KEY=sk_test_...  # Same as Next.js

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public

# Next.js Web URL (for cache invalidation callback)
NEXT_PUBLIC_WEB_URL=https://your-web-domain.vercel.app

# Cron Secret (for job authentication)
CRON_SECRET=<generate-random-secret>  # Use: openssl rand -hex 32
```

---

## Database Migration

### Step 1: Apply Migration

```bash
cd packages/db
npx prisma migrate deploy
```

### Step 2: Verify Schema

```sql
-- Check OnboardingProgress table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'OnboardingProgress';

-- Should return: OnboardingProgress
```

### Step 3: Backfill Existing Users (Optional)

If you have existing users who completed onboarding before v3:

```sql
-- Backfill OnboardingProgress for completed users
INSERT INTO "OnboardingProgress" (id, "userId", "tenantId", "currentStep", "stepData", version, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  tu."userId",
  tu."tenantId",
  4,  -- Completion step
  '{}',
  1,
  NOW(),
  NOW()
FROM "TenantUser" tu
INNER JOIN "Tenant" t ON tu."tenantId" = t.id
WHERE t."onboardingStatus" = 'COMPLETED'
  AND NOT EXISTS (
    SELECT 1 FROM "OnboardingProgress" op WHERE op."userId" = tu."userId"
  );
```

---

## Vercel Cron Setup

### Option 1: Vercel Cron (Recommended)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/system/jobs/cleanup-abandoned-tenants",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** Daily at 2:00 AM UTC

### Option 2: External Cron (e.g., GitHub Actions)

If not using Vercel Cron, create `.github/workflows/cleanup-abandoned-tenants.yml`:

```yaml
name: Cleanup Abandoned Tenants

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup Job
        run: |
          curl -X POST https://your-api-domain.vercel.app/api/system/jobs/cleanup-abandoned-tenants \
            -H "x-vercel-cron-secret: ${{ secrets.CRON_SECRET }}"
```

### Step 3: Secure the Endpoint (Production)

Uncomment authentication in `apps/api/src/domains/system/routes/jobs.ts`:

```typescript
fastify.post('/cleanup-abandoned-tenants', async (request, reply) => {
  // Verify Vercel Cron secret
  const cronSecret = request.headers['x-vercel-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  return cleanupAbandonedTenants(request, reply);
});
```

---

## Deployment Steps

### 1. Deploy Database Migration

```bash
# From packages/db
npx prisma migrate deploy
```

### 2. Deploy API (Fastify)

```bash
# Ensure CRON_SECRET is set in Vercel
vercel env add CRON_SECRET production

# Deploy
cd apps/api
vercel --prod
```

### 3. Deploy Web (Next.js)

```bash
# Deploy
cd apps/web
vercel --prod
```

### 4. Verify Deployment

**Test Onboarding Flow:**
1. Sign in as new user
2. Navigate to `/onboarding`
3. Complete Step 0 (account type)
4. **Verify:** "Saving..." → "Saved" indicator appears
5. Close tab, reopen
6. **Verify:** Resumes at same step with data intact

**Test Middleware:**
1. Complete onboarding
2. Navigate to `/dashboard`
3. **Verify:** NOT redirected back to `/onboarding`

**Test Cleanup Job (Manual Trigger):**
```bash
curl -X POST https://your-api-domain.vercel.app/api/system/jobs/cleanup-abandoned-tenants \
  -H "x-vercel-cron-secret: YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "closedCount": 0,
  "tenants": []
}
```

---

## Rollback Plan

### If Migration Fails

1. **Revert migration:**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

2. **Restore previous schema:**
   ```bash
   git checkout HEAD~1 packages/db/prisma/schema.prisma
   npx prisma db push --force-reset  # DANGER: Only in dev!
   ```

### If Auto-Save Breaks Frontend

1. **Disable auto-save temporarily:**
   - Comment out auto-save useEffect in `OnboardingWizard.tsx`
   - User can still complete onboarding manually (calls /initialize and /complete)

2. **Revert to localStorage (v2):**
   - Restore Zustand `persist` middleware
   - Remove server-side resume fetch
   - Redeploy web app

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Onboarding Completion Rate:**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE "onboardingStatus" = 'COMPLETED') * 100.0 / COUNT(*) AS completion_rate
   FROM "Tenant";
   ```

2. **Average Time to Complete:**
   ```sql
   SELECT
     AVG(EXTRACT(EPOCH FROM ("onboardingCompletedAt" - "createdAt")) / 60) AS avg_minutes
   FROM "Tenant"
   WHERE "onboardingStatus" = 'COMPLETED';
   ```

3. **Abandoned Tenants (7+ days):**
   ```sql
   SELECT COUNT(*)
   FROM "Tenant"
   WHERE "onboardingStatus" = 'IN_PROGRESS'
     AND "createdAt" < NOW() - INTERVAL '7 days'
     AND status != 'CLOSED';
   ```

4. **Auto-Save Error Rate:**
   - Monitor `/api/system/onboarding/save-step` response codes
   - Alert if 5xx rate > 1%

### Logging

Enable structured logging in production:

```typescript
// apps/web/src/app/onboarding/page.tsx
console.error('[onboarding] Failed to fetch progress:', response.status);

// Replace with:
logger.error({ status: response.status, userId }, 'Failed to fetch progress');
```

Use Vercel Analytics or DataDog for aggregation.

---

## Post-Deployment Validation

### Smoke Tests

- [ ] New user onboarding works end-to-end
- [ ] Resume after browser close works
- [ ] Completed users can access dashboard
- [ ] Middleware cache reduces API calls (check logs)
- [ ] Cleanup job runs daily (check Vercel Cron logs)

### Performance Tests

- [ ] `/save-step` p95 latency < 200ms
- [ ] Middleware redirect latency < 50ms
- [ ] No N+1 queries (check Prisma logs)

---

## Troubleshooting

### Issue: "Saving..." stuck indefinitely

**Cause:** API unreachable or CORS issue

**Fix:**
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Verify CORS headers in Fastify
3. Check browser Network tab for failed requests

### Issue: User redirected to /onboarding after completing

**Cause:** Middleware cache not invalidated

**Fix:**
1. Verify `/revalidate-onboarding` endpoint reachable
2. Check `NEXT_PUBLIC_WEB_URL` environment variable
3. Manually clear cache: restart Next.js server

### Issue: Version conflict on every save

**Cause:** Multiple tabs with stale version

**Fix:**
1. Conflict resolution UI should handle this automatically
2. User should reload page to get latest version

---

## Security Considerations

1. **Rate Limiting:** `/save-step` limited to 10 req/min per user
2. **Cron Authentication:** Jobs endpoint requires `CRON_SECRET` header
3. **Tenant Isolation:** All queries filtered by `tenantId`
4. **No Sensitive Data in stepData:** Only store non-sensitive form fields

---

**Deployed by:** [Your Team]
**Support:** [Support Email/Slack Channel]
