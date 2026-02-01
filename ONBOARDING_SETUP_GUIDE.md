# Onboarding Wizard - Quick Setup Guide

**Status:** Phase 1 Implementation Complete
**Date:** 2026-02-01

## 📋 Checklist: Get Onboarding Running Locally

### Step 1: Database Migration (5 min)
```bash
cd packages/db
npx prisma migrate dev --name add_onboarding_tracking
```

This creates the onboarding fields in Tenant and Entity tables.

### Step 2: Environment Setup (2 min)

Add to `.env` in the project root:
```bash
# Get this from Clerk Dashboard → Webhooks → (create webhook)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 3: Install Dependencies (2 min)

Svix was already installed, but verify:
```bash
cd apps/web
npm list svix
```

Should show: `svix@X.X.X`

### Step 4: Configure Clerk Webhook (5 min)

For **local development**:

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start ngrok tunnel: `ngrok http 3000`
3. Copy the ngrok URL (looks like: `https://xxxxx.ngrok.io`)
4. Go to Clerk Dashboard → Webhooks → Create New Endpoint
5. Set URL to: `https://xxxxx.ngrok.io/api/webhooks/clerk`
6. Select Events: `user.created`
7. Copy the "Signing Secret" and add to `.env` as `CLERK_WEBHOOK_SECRET`

For **production** (after deployment):
1. Set URL to: `https://yourdomain.com/api/webhooks/clerk`
2. Same process for signing secret

### Step 5: Start Development Servers (2 min)

**Terminal 1 - Web App:**
```bash
cd apps/web
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - API Server:**
```bash
cd apps/api
npm run dev
# Runs on http://localhost:4000
```

### Step 6: Test the Flow (10 min)

1. **Sign up new user:**
   - Go to http://localhost:3000/sign-up
   - Fill in email/password (or use passkey)
   - Submit

2. **Check webhook delivery:**
   - Look at Clerk Dashboard → Webhooks → View your endpoint
   - Should see a successful delivery (green checkmark)
   - Check web app logs for: "User created successfully"

3. **Verify database:**
   ```bash
   # In Prisma Studio or your database client
   SELECT * FROM "User" WHERE email = 'your-test-email@example.com';
   ```
   Should show the new user record

4. **Complete onboarding:**
   - You should be auto-redirected to `/onboarding`
   - Select "Personal" or "Business"
   - Fill in entity details
   - Submit form (watch for "Setting up your workspace...")
   - Should redirect to dashboard

5. **Verify creation:**
   ```bash
   # Check tenant was created
   SELECT * FROM "Tenant" ORDER BY "createdAt" DESC LIMIT 1;

   # Check entity was created
   SELECT * FROM "Entity" ORDER BY "createdAt" DESC LIMIT 1;

   # Check GL Accounts exist
   SELECT COUNT(*) FROM "GLAccount" WHERE "entityId" = '<entity-id>';
   # Should return: 6
   ```

## 🧪 What to Test

### Happy Path ✅
- [ ] New user signs up
- [ ] Webhook fires and syncs user to database
- [ ] User redirected to /onboarding
- [ ] Account type selection works (Progress bar updates)
- [ ] Form fields validate
- [ ] Submission creates tenant + entity
- [ ] GL Accounts created (6 core accounts)
- [ ] FiscalCalendar created with 12 periods
- [ ] Redirect to dashboard works
- [ ] Dashboard displays entity without 404

### Error Cases ⚠️
- [ ] Missing CLERK_WEBHOOK_SECRET → webhook fails gracefully
- [ ] Invalid webhook signature → returns 400
- [ ] Empty form field → shows validation error
- [ ] Browser back button → returns to previous step
- [ ] Page refresh during wizard → state restored from localStorage
- [ ] Failed API call → error message displayed with retry
- [ ] Unauthenticated access → redirects to sign-in

### Browser Compatibility 🌐
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### "CLERK_WEBHOOK_SECRET is not set"
- [ ] Verify `.env` has the secret
- [ ] Restart API server after adding `.env`
- [ ] Check you copied the full secret (starts with `whsec_`)

### Webhook not firing
- [ ] Check ngrok tunnel is still running
- [ ] Verify ngrok URL matches Clerk webhook endpoint
- [ ] Watch ngrok terminal for HTTP requests
- [ ] Check Clerk Dashboard webhook logs for errors

### "User not found" error
- [ ] User might not be synced yet (webhook delay ~1 second)
- [ ] Try signing up again
- [ ] Check database directly: `SELECT * FROM "User"`

### Migration fails
- [ ] Make sure `.env` has `DATABASE_URL`
- [ ] Verify PostgreSQL is running
- [ ] Try: `npx prisma db push` instead of migrate
- [ ] Check `/migrations` folder was created

### "Not authenticated" on form submit
- [ ] Check Clerk session is loaded (check Clerk devtools)
- [ ] Verify API endpoint CORS allows localhost:3000
- [ ] Check Authorization header in Network tab (Dev Tools)

## 📁 Key Files

| File | Purpose | Changes |
|------|---------|---------|
| `packages/db/prisma/schema.prisma` | Database schema | ✏️ Added onboarding fields |
| `apps/web/src/app/api/webhooks/clerk/route.ts` | Webhook handler | ✨ New |
| `apps/web/src/middleware.ts` | Auth redirect logic | ✏️ Added onboarding check |
| `apps/web/src/stores/onboardingStore.ts` | State management | ✨ New |
| `apps/web/src/app/onboarding/**` | Wizard UI | ✨ New |
| `apps/api/src/routes/onboarding.ts` | API endpoints | ✨ New |

## 🎯 Success Indicators

After setup, you should see:

1. ✅ New user created in database after signup
2. ✅ Tenant created after form submission
3. ✅ Entity created with correct details
4. ✅ 6 GL Accounts in database
5. ✅ FiscalCalendar with 12 periods
6. ✅ Dashboard loads without errors
7. ✅ EntitiesList shows created entity

## 📚 Documentation

For detailed architecture and API documentation, see:
- `docs/features/ONBOARDING_IMPLEMENTATION.md` - Complete implementation details
- `docs/brainstorms/2026-02-01-onboarding-wizard-brainstorm.md` - Original planning

## 🚀 Next Steps

After Phase 1 is working:
1. **Phase 2:** Implement COA templates and enhanced generation
2. **Phase 3:** Add branching flows for different account types
3. **Phase 4:** Optional bank connection during onboarding
4. **Phase 5:** Advanced features (QuickBooks import, team invites, etc.)

## 💬 Support

If you run into issues:
1. Check this guide's troubleshooting section
2. Review console/terminal logs for error messages
3. Verify all `.env` variables are set
4. Check Clerk Dashboard webhook logs
5. Inspect Network tab in browser Dev Tools for API responses

---

**Ready to test? Start with Step 1 above!**
