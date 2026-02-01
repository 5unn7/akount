# Onboarding Wizard - Quick Start

## TL;DR - Get Running in 5 Minutes

### 1. Database Setup (2 min)
```bash
cd packages/db
npx prisma migrate dev --name add_onboarding_tracking
```

### 2. Add Webhook Secret (1 min)
```bash
# Add to .env in project root
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Get the secret from Clerk Dashboard → Webhooks (create if needed)

### 3. Start Servers (2 min)
```bash
# Terminal 1
cd apps/web && npm run dev

# Terminal 2
cd apps/api && npm run dev
```

### 4. Test Signup
1. Go to http://localhost:3000/sign-up
2. Create account
3. Check logs for "User created successfully"
4. Should redirect to /onboarding
5. Complete wizard
6. Dashboard should load

## Key Files

| What | Where |
|------|-------|
| **Webhook Handler** | `apps/web/src/app/api/webhooks/clerk/route.ts` |
| **Wizard UI** | `apps/web/src/app/onboarding/` |
| **API Endpoints** | `apps/api/src/routes/onboarding.ts` |
| **State Store** | `apps/web/src/stores/onboardingStore.ts` |
| **Database** | `packages/db/prisma/schema.prisma` |

## API Endpoints

```
POST /api/onboarding/initialize
├─ Input: accountType, entityName, entityType, country, currency
└─ Output: tenantId, entityId

POST /api/onboarding/complete
├─ Input: tenantId, + entity details + fiscalYearStart
└─ Output: success

GET /api/onboarding/status
└─ Output: status (new/in_progress/completed)
```

## Wizard Flow

```
Step 0: Welcome
├─ Select account type (Personal/Business/Accountant)
└─ Auto-advance

Step 1: Entity Details
├─ Form: name, type, country, currency, fiscal year
├─ POST /api/onboarding/initialize
└─ Creates Tenant + Entity

Step 2: Completion
├─ POST /api/onboarding/complete
├─ Creates GL Accounts + Fiscal Calendar
└─ Redirects to dashboard
```

## Webhook Setup (Local Testing)

```bash
# Terminal 3
ngrok http 3000

# Copy ngrok URL (example: https://xxxxx.ngrok.io)
# Go to Clerk Dashboard → Webhooks → Create Endpoint
# URL: https://xxxxx.ngrok.io/api/webhooks/clerk
# Events: user.created
# Copy Signing Secret → add to .env as CLERK_WEBHOOK_SECRET
```

## Database Check

```bash
# After signup, verify user synced
SELECT * FROM "User" WHERE email = 'your-email@example.com';

# After onboarding, verify tenant
SELECT * FROM "Tenant" ORDER BY "createdAt" DESC LIMIT 1;

# Verify entity
SELECT * FROM "Entity" ORDER BY "createdAt" DESC LIMIT 1;

# Verify GL accounts (should be 6)
SELECT COUNT(*) FROM "GLAccount" WHERE "entityId" = '<entity-id>';
```

## Debugging

### "CLERK_WEBHOOK_SECRET is not set"
→ Add to `.env`, restart server

### Webhook not firing
→ Check ngrok is running, verify endpoint URL in Clerk Dashboard

### "User not found"
→ Webhook delays ~1 second, try again

### Form validation fails
→ Check console for errors, verify required fields filled

### Dashboard shows 404
→ Entity not created, check database

## Files to Review

1. **Start here:** `ONBOARDING_SETUP_GUIDE.md`
2. **Technical:** `docs/features/ONBOARDING_IMPLEMENTATION.md`
3. **Overview:** `IMPLEMENTATION_SUMMARY.md`
4. **Report:** `PHASE_1_COMPLETION_REPORT.md`

## What Was Built

✅ Clerk webhook handler (auto user sync)
✅ 3-step wizard UI (Welcome → Details → Complete)
✅ Zustand state management (persistent)
✅ 3 API endpoints (initialize, complete, status)
✅ Database schema updates
✅ Middleware redirect logic
✅ 6 core GL accounts auto-generated
✅ Fiscal calendar with 12 periods

## Success Looks Like

- ✅ User created in database after signup
- ✅ Webhook fires successfully
- ✅ Redirected to /onboarding
- ✅ Wizard steps work
- ✅ Tenant + entity created
- ✅ GL accounts in database
- ✅ Dashboard loads
- ✅ Entity visible in list

---

**Questions?** See full guides in docs folder or IMPLEMENTATION_SUMMARY.md
