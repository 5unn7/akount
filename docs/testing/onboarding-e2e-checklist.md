# Onboarding Flow E2E Test Checklist

> **Version:** v3 (DB-First with Auto-Save)
> **Last Updated:** 2026-02-16
> **Test Environment:** Local + Staging

---

## Pre-Test Setup

- [ ] API server running on `localhost:3001`
- [ ] Web app running on `localhost:3000`
- [ ] Database migrated with `OnboardingProgress` table
- [ ] Clerk dev instance configured
- [ ] Test user accounts created (not previously onboarded)

---

## Test Suite 1: Happy Path (New User)

### Test 1.1: Fresh Onboarding Start
- [ ] Sign in as new user (never onboarded)
- [ ] Redirected to `/onboarding` automatically
- [ ] Step 0 loads with account type selection (Personal, Business, Accountant)
- [ ] Progress bar shows 4 steps: Account → Details → Entity → Ready
- [ ] No save indicator visible (nothing to save yet)

### Test 1.2: Account Type Selection
- [ ] Click "Personal" card
- [ ] Auto-advances to Step 1
- [ ] **Verify:** "Saving..." indicator appears (top-right)
- [ ] **Verify:** Changes to "Saved" with green checkmark
- [ ] **Verify:** Indicator fades after 2s

### Test 1.3: User Details Entry
- [ ] Fill in phone number (e.g., +1 416-555-0123)
- [ ] Select timezone (e.g., America/Toronto)
- [ ] **Verify:** Auto-save triggers 500ms after last keystroke
- [ ] **Verify:** "Saving..." → "Saved" cycle completes
- [ ] Click "Continue" button
- [ ] Advances to Step 2

### Test 1.4: Entity Details Entry
- [ ] Fill in entity name (e.g., "Acme Inc")
- [ ] Select entity type (e.g., "Corporation")
- [ ] Select country (e.g., "CA")
- [ ] Currency auto-fills based on country (e.g., "CAD")
- [ ] Set fiscal year start (e.g., January = 1)
- [ ] **Optional fields:** Tax ID, Address, City, State, Postal Code
- [ ] **Verify:** Auto-save works for each field change
- [ ] Click "Continue" button (if shown)
- [ ] Advances to Step 3 (Completion)

### Test 1.5: Completion
- [ ] Completion step shows success message
- [ ] "Get Started" button visible
- [ ] Click "Get Started"
- [ ] Redirected to `/dashboard` or `/overview`
- [ ] **Verify:** Can access dashboard (not redirected back to onboarding)

---

## Test Suite 2: Resume Capability

### Test 2.1: Close & Resume (Same Browser)
- [ ] Start onboarding (Step 0 → Step 1)
- [ ] Fill phone number, do NOT click Continue
- [ ] **Close the tab** (simulates accidental close)
- [ ] Wait 5 seconds
- [ ] Reopen `/onboarding` in new tab
- [ ] **Verify:** Resumes at Step 1 with phone number pre-filled
- [ ] **Verify:** Progress bar shows Step 1 active

### Test 2.2: Resume from Different Device/Browser
- [ ] Start onboarding in Chrome (Step 0 → Step 1 → Step 2)
- [ ] Fill entity name "Test Corp", select "Corporation"
- [ ] Wait for "Saved" indicator
- [ ] Open Firefox/Edge, sign in as same user
- [ ] Navigate to `/onboarding`
- [ ] **Verify:** Resumes at Step 2 with "Test Corp" pre-filled
- [ ] **Verify:** Account type from Step 0 preserved

### Test 2.3: Resume After Clerk Session Expiry
- [ ] Start onboarding, reach Step 2
- [ ] Clear Clerk session cookies (manually or via DevTools)
- [ ] Refresh page
- [ ] Redirected to `/sign-in`
- [ ] Sign in again
- [ ] Redirected back to `/onboarding`
- [ ] **Verify:** Resumes at Step 2 with data intact

---

## Test Suite 3: Auto-Save Edge Cases

### Test 3.1: Rapid Typing (Debounce Test)
- [ ] Start Step 1 (User Details)
- [ ] Type phone number rapidly without pausing
- [ ] **Verify:** "Saving..." appears only AFTER 500ms idle
- [ ] **Verify:** Only ONE save request fires (check Network tab)

### Test 3.2: Network Failure During Save
- [ ] Start Step 1, fill phone number
- [ ] Open DevTools → Network tab
- [ ] Set "Offline" mode (or throttle to "Offline")
- [ ] Change timezone (triggers auto-save)
- [ ] **Verify:** "Saving..." appears
- [ ] **Verify:** After timeout, shows "Retrying (1/3)..."
- [ ] **Verify:** Retries with exponential backoff (2s, 4s, 8s)
- [ ] **Verify:** After 3 retries, shows "Save failed"
- [ ] Re-enable network
- [ ] Make another change (e.g., phone number)
- [ ] **Verify:** Save succeeds, retries reset

### Test 3.3: Server Error (500) During Save
- [ ] Temporarily break API (kill server or return 500)
- [ ] Fill phone number in Step 1
- [ ] **Verify:** "Saving..." → "Retrying (1/3)..." → ... → "Retrying (3/3)..."
- [ ] **Verify:** After 3 retries, shows "Save failed"
- [ ] Restore API server
- [ ] Make another change
- [ ] **Verify:** Save succeeds

---

## Test Suite 4: Concurrent Edit Conflict

### Test 4.1: Two Tabs, Version Mismatch
- [ ] Open `/onboarding` in Tab A
- [ ] Reach Step 1, fill phone number "+1-416-555-0001"
- [ ] Wait for "Saved" (version increments to 1)
- [ ] Open `/onboarding` in Tab B (same browser)
- [ ] **Tab B:** Should show same data (phone: "+1-416-555-0001")
- [ ] **Tab A:** Change phone to "+1-416-555-0002", wait for "Saved" (version 2)
- [ ] **Tab B:** Change phone to "+1-416-555-0003", wait for save
- [ ] **Verify Tab B:** Shows "Conflict detected" (amber warning)
- [ ] **Verify Tab B:** Conflict dialog appears: "Changes Detected"
- [ ] **Verify Tab B:** Dialog shows "Reload Now" and "Dismiss" buttons
- [ ] Click "Reload Now"
- [ ] **Verify Tab B:** Reloads with phone "+1-416-555-0002" (Tab A's data)

### Test 4.2: Auto-Reload After 5s
- [ ] Repeat Test 4.1 setup (create conflict)
- [ ] **Tab B:** Shows conflict dialog
- [ ] **Do NOT click** any buttons
- [ ] Wait 5 seconds
- [ ] **Verify:** Page auto-reloads with latest data

---

## Test Suite 5: Middleware Caching

### Test 5.1: Cache Hit (30s TTL)
- [ ] Complete onboarding flow fully
- [ ] Redirected to `/dashboard`
- [ ] Open DevTools → Network tab
- [ ] Navigate to `/overview` (or any dashboard page)
- [ ] **Verify:** NO request to `/system/onboarding/status` (cache hit)
- [ ] Repeat navigation 5 times within 30s
- [ ] **Verify:** Still no API calls (cache still valid)

### Test 5.2: Cache Miss After 30s
- [ ] Complete onboarding
- [ ] Wait 31 seconds
- [ ] Navigate to `/dashboard` or refresh page
- [ ] **Verify:** Request to `/system/onboarding/status` fires (cache expired)
- [ ] **Verify:** Response returns `{ status: 'COMPLETED' }`
- [ ] **Verify:** Cache repopulated (next navigation within 30s is cached)

### Test 5.3: Cache Invalidation After /complete
- [ ] Start onboarding, reach final step
- [ ] Click "Get Started" (calls `/complete`)
- [ ] **Verify:** `/complete` returns 200 OK
- [ ] **Verify:** `/revalidate-onboarding` endpoint called (check Network)
- [ ] Immediately navigate to `/dashboard`
- [ ] **Verify:** NOT redirected back to `/onboarding`
- [ ] **Verify:** Middleware cache invalidated

---

## Test Suite 6: Database Integrity

### Test 6.1: OnboardingProgress Record Created
- [ ] Start onboarding as new user
- [ ] Complete Step 0 (account type selection)
- [ ] Wait for "Saved" indicator
- [ ] **Database Check:** Query `SELECT * FROM OnboardingProgress WHERE userId = '<clerk-user-id>'`
- [ ] **Verify:** Record exists with:
  - `currentStep = 0`
  - `version = 1`
  - `stepData` contains `{ accountType: 'personal' }` (or selected type)

### Test 6.2: Version Increments on Each Save
- [ ] Continue from Test 6.1
- [ ] Fill phone number → wait for "Saved"
- [ ] **Database Check:** `version = 2`
- [ ] Change timezone → wait for "Saved"
- [ ] **Database Check:** `version = 3`

### Test 6.3: Tenant Created on /initialize
- [ ] Start onboarding, reach Step 2
- [ ] Fill entity details, click Continue
- [ ] `/initialize` endpoint called
- [ ] **Database Check:** `Tenant` record created with:
  - `onboardingStatus = 'IN_PROGRESS'`
  - `name` matches entity name
- [ ] **Database Check:** `Entity` record created with:
  - `name` matches entity name
  - `country`, `functionalCurrency` match form data

### Test 6.4: Tenant Marked COMPLETED After /complete
- [ ] Complete onboarding fully
- [ ] **Database Check:** `Tenant.onboardingStatus = 'COMPLETED'`
- [ ] **Database Check:** `Tenant.onboardingCompletedAt` is NOT NULL

---

## Test Suite 7: Cleanup Job

### Test 7.1: Abandoned Tenants (Manual Trigger)
- [ ] Create test user, start onboarding, abandon at Step 1
- [ ] **Database:** Manually set `Tenant.createdAt` to 8 days ago
- [ ] Trigger cleanup job: `curl -X POST http://localhost:3001/api/system/jobs/cleanup-abandoned-tenants`
- [ ] **Verify:** Response shows `closedCount: 1`
- [ ] **Database Check:** `Tenant.status = 'CLOSED'` (was 'ACTIVE')
- [ ] **Verify:** `OnboardingProgress` record still exists (not deleted)

### Test 7.2: Recent Tenants Not Affected
- [ ] Create test user, start onboarding, abandon at Step 1
- [ ] Tenant is only 2 days old
- [ ] Trigger cleanup job
- [ ] **Verify:** Response shows `closedCount: 0`
- [ ] **Database Check:** Tenant status unchanged

---

## Test Suite 8: Security & Permissions

### Test 8.1: Unauthenticated Access Blocked
- [ ] Sign out (or open incognito)
- [ ] Navigate to `/onboarding`
- [ ] **Verify:** Redirected to `/sign-in`

### Test 8.2: Already-Completed Users Bypass Onboarding
- [ ] Complete onboarding fully
- [ ] Sign out, sign back in
- [ ] **Verify:** Redirected to `/dashboard`, NOT `/onboarding`
- [ ] Manually navigate to `/onboarding`
- [ ] **Verify:** Middleware redirects to `/dashboard` (or allows access but shows "Already completed" message)

### Test 8.3: /save-step Rate Limiting
- [ ] Open DevTools → Console
- [ ] Paste script to fire 20 `/save-step` requests rapidly:
  ```js
  for (let i = 0; i < 20; i++) {
    fetch('/api/system/onboarding/save-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 0, data: { accountType: 'personal' }, version: 1 })
    })
  }
  ```
- [ ] **Verify:** After 10 requests within 60s, returns `429 Too Many Requests`

---

## Test Suite 9: UI/UX Polish

### Test 9.1: Glass Morphism Styling
- [ ] Onboarding card uses `glass` utility (semi-transparent background)
- [ ] Border is subtle (`border-ak-border`)
- [ ] Save indicator uses correct colors:
  - "Saving..." → muted gray (`text-muted-foreground`)
  - "Saved" → green (`text-ak-green`)
  - "Conflict detected" → amber (`text-amber-500`)
  - "Save failed" → red (`text-destructive`)

### Test 9.2: Progress Bar Animations
- [ ] Progress segments transition smoothly (500ms duration)
- [ ] Completed segments glow with primary color
- [ ] Current segment is brighter than future segments
- [ ] Step labels uppercase with letter-spacing

### Test 9.3: Conflict Dialog Styling
- [ ] Dialog has glass background (`glass-2`)
- [ ] Amber border (`border-amber-500/40`)
- [ ] AlertTriangle icon in amber circle
- [ ] Fade-in animation on appearance
- [ ] Buttons: "Reload Now" (primary), "Dismiss" (outline)

---

## Test Suite 10: Regression Checks

### Test 10.1: Existing Functionality Unaffected
- [ ] Dashboard pages load normally (no onboarding redirect loop)
- [ ] RBAC still works (non-admin can't access `/system/users`)
- [ ] Banking, Invoicing, other domains unaffected
- [ ] Clerk auth still works (sign in/out)

### Test 10.2: No localStorage Pollution
- [ ] Complete onboarding
- [ ] Open DevTools → Application → Local Storage
- [ ] **Verify:** NO `onboarding-storage` key (removed in v3)

---

## Pass Criteria

- [ ] **All 10 test suites pass** (100% coverage of critical paths)
- [ ] **Zero console errors** during normal flow
- [ ] **Auto-save latency <1s** (P95)
- [ ] **Conflict resolution UX clear** (user understands what happened)
- [ ] **No data loss** across resume/reload scenarios
- [ ] **Cache invalidation works** (no stale redirects)

---

## Known Issues / Acceptable Behavior

1. **Step numbering mismatch:** Frontend uses combined steps (e.g., Step 1 = user+entity), backend saves step number per schema. Auto-save still works because it saves all available data regardless of step number.

2. **Cache delay on completion:** Up to 30s delay before cache invalidates if `/revalidate-onboarding` fails silently. User can still proceed to dashboard, will be re-cached on next navigation.

3. **Retry exhaustion:** After 3 failed retries, user must manually edit form to re-trigger save. No persistent retry queue (acceptable for MVP).

---

**Next:** Run this checklist manually, then automate with Playwright/Cypress for CI/CD.
