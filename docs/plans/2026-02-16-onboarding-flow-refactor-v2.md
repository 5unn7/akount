# Onboarding Flow Refactor v2 - Single-Page Unified Experience

**Created:** 2026-02-16
**Status:** Draft
**Brainstorm:** [2026-02-09 Onboarding Flow Redesign](../brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md)
**Diagnosis:** See [/processes:diagnose] output from 2026-02-16 session

---

## Overview

Refactor the onboarding flow from split wizard + optional steps into a **single unified 4-step experience**. Fix triple state management (Zustand, Database, Clerk metadata), move tenant creation to final step, enable database-driven middleware redirect, and target 90-120 second completion time.

**Current Problems:**
1. ❌ **Triple state drift** — Zustand localStorage, Database (OnboardingProgress), Clerk metadata all independent
2. ❌ **Tenant created mid-wizard** — Step 2 creates tenant, causing orphaned tenants on abandonment
3. ❌ **Split flow confusion** — Wizard (feels required) + `/complete` page (feels optional) = cognitive burden
4. ❌ **Middleware redirect disabled** — No enforcement, users can skip entire flow
5. ❌ **No error recovery** — API failures leave inconsistent state
6. ❌ **Re-entry breaks** — Can't resume from middle of flow

**Target State:**
- ✅ **Single database-driven flow** — OnboardingProgress is source of truth
- ✅ **Tenant created at end** — No orphaned tenants
- ✅ **4-step unified wizard** — Welcome → Intent → Essential Info → Bank Connection → Dashboard
- ✅ **Middleware enforces redirect** — Database check, not metadata
- ✅ **Error recovery** — Rollback on failure
- ✅ **Resume capability** — `GET /resume` endpoint returns current step + data

---

## Success Criteria

**Functional:**
- [ ] User completes onboarding in 90-120 seconds (target: 90s)
- [ ] Middleware redirects unauthenticated users to `/onboarding` (database check)
- [ ] Tenant created ONLY after all required data collected
- [ ] API failures rollback cleanly (no partial state)
- [ ] User can resume from any step (refresh, browser close)
- [ ] Bank connection encouraged but skippable
- [ ] Test users can be force-reset via admin script

**Technical:**
- [ ] Single source of truth (Database OnboardingProgress)
- [ ] Zustand persistence removed (ephemeral state only)
- [ ] All endpoints idempotent (safe to retry)
- [ ] Type-safe API contracts (Zod schemas)
- [ ] Comprehensive error handling (network, validation, business logic)

**UX:**
- [ ] Clear progress (1 progress bar, no hidden steps)
- [ ] Smooth transitions (no jarring state changes)
- [ ] Helpful error messages (actionable, not cryptic)
- [ ] Mobile responsive (375px+)

---

## Architecture Changes

### State Management: Database-First

**Before (Triple State):**
```
Zustand (localStorage) ←→ Database ←→ Clerk Metadata
   ↑ Can drift ↑        ↑ Can drift ↑
```

**After (Single Source of Truth):**
```
Database OnboardingProgress → Zustand (ephemeral, hydrated on mount)
                           → Middleware check (no Clerk metadata)
```

### Tenant Creation: Deferred Until Final Step

**Before:**
```
Step 1 (Welcome) → Step 2 (Essential Info) → /initialize API → Tenant created
                                                               → User closes browser
                                                               → Orphaned tenant ❌
```

**After:**
```
Step 1-3 → Collect all data → Step 4 (Bank) → /complete API → Tenant created ✅
                                               → Transaction wraps all creation
                                               → Rollback on error
```

### Flow Simplification

**Before (Split):**
```
/onboarding (wizard) → /onboarding/complete (optional steps) → /overview
```

**After (Unified):**
```
/onboarding (4 steps) → /overview
```

---

## Tasks

### **Phase 1: Database & API Foundation** (2-3 days)

#### Task 1: Add Resume State to OnboardingProgress
**File:** `packages/db/prisma/schema.prisma`
**What:** Add `currentStep` (int), `stepData` (Json) fields to `OnboardingProgress` model. This stores the current step (0-3) and collected form data for resume capability.
**Depends on:** none
**Risk:** low (schema addition)
**Review:** `prisma-migration-reviewer`
**Success:** Migration runs, new fields queryable

```prisma
model OnboardingProgress {
  // ... existing fields

  currentStep       Int     @default(0)  // 0=Welcome, 1=Intent, 2=EssentialInfo, 3=Bank
  stepData          Json?   // Stores collected form data for resume
}
```

---

#### Task 2: Create GET /onboarding/resume Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Add `GET /onboarding/resume` endpoint. Returns `{ currentStep, stepData, tenantId?, entityId? }`. If user has no OnboardingProgress, returns step 0. If onboarding complete, returns redirect to `/overview`.
**Depends on:** Task 1
**Risk:** low
**Success:** Endpoint returns resume state, handles new users (no progress record)

**Response types:**
```typescript
// New user (no progress)
{ currentStep: 0, stepData: null, status: 'new' }

// Mid-flow user
{ currentStep: 2, stepData: { accountType, intents, entityName, ... }, status: 'in_progress' }

// Completed user
{ status: 'completed', redirectTo: '/overview' }
```

---

#### Task 3: Create POST /onboarding/save-step Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Add `POST /onboarding/save-step` endpoint. Accepts `{ step, data }`. Upserts OnboardingProgress with current step + data. Does NOT create tenant (deferred). Idempotent (can be called repeatedly).
**Depends on:** Task 1
**Risk:** low
**Success:** Endpoint saves step progress, handles concurrent requests (upsert)

**Schema:**
```typescript
const SaveStepSchema = z.object({
  step: z.number().int().min(0).max(3),
  data: z.object({
    accountType: z.enum(['personal', 'business']).optional(),
    intents: z.array(z.string()).optional(),
    entityName: z.string().optional(),
    country: z.string().length(2).optional(),
    currency: z.string().length(3).optional(),
    // ... all form fields from steps 0-2
  })
})
```

---

#### Task 4: Refactor POST /onboarding/complete for Deferred Tenant Creation
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Update `/complete` endpoint to:
1. Accept ALL collected data (not just tenantId)
2. Create tenant, entity, TenantUser, GL accounts in ONE transaction
3. Update OnboardingProgress to 100%, mark `completed`
4. Update Clerk metadata (`tenantId`, `onboardingCompleted: true`)
5. Return `{ tenantId, entityId, redirectTo: '/overview' }`
6. Idempotent (check if tenant already exists for this user)
**Depends on:** Task 3
**Risk:** high (financial data creation, transaction handling)
**Review:** `financial-data-validator`, `security-sentinel`, `prisma-migration-reviewer`
**Success:** Endpoint creates all resources atomically, handles retries gracefully

**Schema:**
```typescript
const CompleteOnboardingSchema = z.object({
  accountType: z.enum(['personal', 'business']),
  intents: z.array(z.string()).min(1),
  entityName: z.string().min(1).max(255),
  entityType: z.enum(['PERSONAL', 'CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC']),
  phoneNumber: z.string().optional(),
  timezone: z.string(),
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
  fiscalYearEnd: z.number().int().min(1).max(12),
  industry: z.string().optional(),
  // Bank connection fields (optional)
  skipBankConnection: z.boolean().default(false),
  bankAccountName: z.string().optional(),
  bankAccountType: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD']).optional(),
  openingBalance: z.number().int().optional(), // Integer cents
})
```

**Transaction logic:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create tenant
  const tenant = await tx.tenant.create({ ... })

  // 2. Create tenant user membership (OWNER)
  await tx.tenantUser.create({ tenantId: tenant.id, userId, role: 'OWNER' })

  // 3. Create entity
  const entity = await tx.entity.create({ tenantId: tenant.id, ... })

  // 4. Create default GL accounts (6 accounts)
  await tx.gLAccount.createMany({ data: [...], skipDuplicates: true })

  // 5. Create fiscal calendar
  await tx.fiscalCalendar.upsert({ ... })

  // 6. Create bank account (if provided)
  if (!skipBankConnection && bankAccountName) {
    await tx.account.create({ ... })
  }

  // 7. Mark onboarding complete
  await tx.onboardingProgress.update({
    where: { userId },
    data: {
      completionPercentage: 100,
      businessDetailsComplete: true,
      bankConnectionComplete: !skipBankConnection,
      onboardingStatus: 'COMPLETED'
    }
  })

  return { tenant, entity }
})
```

---

#### Task 5: Add Tests for New Endpoints
**File:** `apps/api/src/domains/system/routes/__tests__/onboarding.test.ts`
**What:** Write tests for:
- `GET /resume` — new user, mid-flow user, completed user
- `POST /save-step` — idempotency, validation, concurrent requests
- `POST /complete` — full flow, bank skip, retry after partial failure, tenant already exists
**Depends on:** Tasks 2-4
**Risk:** low
**Success:** ≥ 90% coverage, all tests pass

---

### **Phase 2: Middleware & Security** (1 day)

#### Task 6: Enable Database-Driven Middleware Redirect
**File:** `apps/web/src/middleware.ts`
**What:** Uncomment and refactor onboarding redirect (lines 71-76):
1. Fetch onboarding status from DATABASE (not Clerk metadata)
2. Check `Tenant.onboardingStatus` via API call (cache for 5 min)
3. Redirect to `/onboarding` if status !== 'COMPLETED'
4. Allow `/onboarding/*`, `/sign-in`, `/sign-up` without redirect
**Depends on:** none (can run parallel)
**Risk:** medium (affects all authenticated routes)
**Review:** `security-sentinel`, `nextjs-app-router-reviewer`
**Success:** Middleware redirects incomplete users, allows completed users, no infinite loops

**Implementation:**
```typescript
export default clerkMiddleware(async (auth, request) => {
  // ... existing public route checks

  const { userId, sessionClaims } = await auth.protect()

  // Skip onboarding check for onboarding routes
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.next()
  }

  // Check onboarding status (cached in-memory for 5 min)
  const status = await getOnboardingStatus(userId) // Fetch from DB

  if (status !== 'COMPLETED' && !request.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // ... rest of middleware
})
```

---

#### Task 7: Add Force Reset Script for Test Users
**File:** `apps/api/src/scripts/reset-onboarding.ts`
**What:** Create admin script to reset onboarding for specific users:
1. Delete tenant, entity, GL accounts, fiscal calendar (cascade)
2. Reset OnboardingProgress to step 0
3. Clear Clerk metadata
4. Takes userId or email as argument
**Depends on:** none
**Risk:** high (destructive operation)
**Success:** Script resets user cleanly, can be re-run idempotently

**Usage:**
```bash
pnpm --filter api run script:reset-onboarding user@example.com
```

---

### **Phase 3: Frontend Refactor** (3-4 days)

#### Task 8: Remove Zustand Persistence
**File:** `apps/web/src/stores/onboardingStore.ts`
**What:** Remove `persist` middleware from Zustand store. Make all fields ephemeral (reset on page reload). Add `hydrate(data)` action to populate from API.
**Depends on:** none
**Risk:** low
**Success:** Store no longer persists to localStorage, migration from v4 removed

**Changes:**
```typescript
// BEFORE
export const useOnboardingStore = create<OnboardingState>()(
  persist((set) => ({ ... }), { name: 'onboarding-storage', version: 4 })
)

// AFTER
export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialState,

  // NEW: Hydrate from API
  hydrate: (data: Partial<OnboardingState>) => set(data),

  // ... rest of actions
}))
```

---

#### Task 9: Update OnboardingWizard to Fetch Resume State
**File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
**What:** On mount, call `GET /onboarding/resume` and hydrate Zustand store. Navigate to `currentStep` from API. Show loading spinner while fetching.
**Depends on:** Task 2, Task 8
**Risk:** medium (critical path)
**Success:** Wizard resumes from last step, handles new users (step 0), redirects completed users

**Implementation:**
```typescript
useEffect(() => {
  async function loadResumeState() {
    try {
      const { currentStep, stepData, status } = await fetchResumeState()

      if (status === 'completed') {
        router.push('/overview')
        return
      }

      if (stepData) {
        hydrate(stepData) // Populate Zustand from API
      }

      goToStep(currentStep)
    } catch (error) {
      console.error('Resume failed:', error)
      // Stay at step 0 for new users
    }
  }

  loadResumeState()
}, [])
```

---

#### Task 10: Add Auto-Save on Step Completion
**Files:** All step components (WelcomeStep, IntentStep, EssentialInfoStep)
**What:** On step submit/next, call `POST /onboarding/save-step` to persist progress. Show subtle "Saving..." indicator. Handle network errors gracefully (retry, show error, keep data in Zustand).
**Depends on:** Task 3, Task 8
**Risk:** low
**Success:** Each step saves to backend, user can close browser and resume

**Pattern:**
```typescript
async function handleNext() {
  setSaving(true)
  try {
    await saveStep(currentStep, getState())
    nextStep() // Zustand action
  } catch (error) {
    setError('Failed to save progress. Please try again.')
  } finally {
    setSaving(false)
  }
}
```

---

#### Task 11: Merge IntentStep and EssentialInfoStep (Optional)
**File:** `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`
**What:** Consider merging Intent (step 1) and Essential Info (step 2) into one form. Reduces total steps from 4 to 3, closer to 90s target.
**Depends on:** Task 10
**Risk:** medium (UX change)
**Success:** Form feels cohesive, not overwhelming, validation works

**Alternative:** Keep split if form feels too long. User feedback will guide.

---

#### Task 12: Add Bank Connection Step
**File:** `apps/web/src/app/onboarding/components/steps/BankConnectionStep.tsx`
**What:** Create new step for bank connection (step 3 or 4):
- "Why connect your bank?" value prop card
- Two CTAs: "Add Manually" (form) / "Skip for now" (link)
- Manual form: Account Name, Type (dropdown), Opening Balance
- Save to Zustand, submit with `/complete` call
**Depends on:** Task 10
**Risk:** low
**Success:** Step feels non-blocking (skip is prominent), manual entry works

**Value prop:**
```tsx
<Card variant="glass">
  <CardHeader>
    <CardTitle className="text-lg">Why connect your bank?</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <p className="text-sm">✓ Auto-sync transactions daily</p>
    <p className="text-sm">✓ See real-time balances</p>
    <p className="text-sm">✓ Smarter categorization</p>
  </CardContent>
</Card>
```

---

#### Task 13: Update CompletionStep to Call /complete Endpoint
**File:** `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx`
**What:** On mount, call `POST /onboarding/complete` with ALL collected data. Show loading spinner with "Setting up your account..." message. On success, redirect to `/overview`. On error, show retry button.
**Depends on:** Task 4, Task 12
**Risk:** high (final submission, can fail)
**Review:** `nextjs-app-router-reviewer`
**Success:** Endpoint called correctly, success redirects to dashboard, error recoverable

**Implementation:**
```typescript
useEffect(() => {
  async function completeOnboarding() {
    setStatus('loading')
    try {
      const allData = getState() // All Zustand fields
      const result = await completeOnboarding(allData)

      // Success animation (checkmark, confetti)
      setStatus('success')

      setTimeout(() => {
        router.push('/overview')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setError(error.message)
    }
  }

  completeOnboarding()
}, [])
```

---

#### Task 14: Remove /onboarding/complete Page
**File:** `apps/web/src/app/onboarding/complete/page.tsx`
**What:** Delete entire `/onboarding/complete` directory and all modal components (BusinessDetailsModal, BankConnectionModal, GoalsSetupModal). These are now part of unified wizard.
**Depends on:** Tasks 12-13
**Risk:** low (cleanup)
**Success:** Directory deleted, no broken imports, build succeeds

---

#### Task 15: Update Progress Indicator to 4 Steps
**File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
**What:** Update progress bar from 4 labels (`['Identity', 'Workspace', 'Intent', 'Ready']`) to new 4-step flow: `['Welcome', 'Goals', 'Details', 'Bank']`. Adjust step indices.
**Depends on:** Tasks 11-12
**Risk:** low
**Success:** Progress bar shows 4 steps, highlights current step, fills on completion

---

### **Phase 4: Error Handling & Polish** (2 days)

#### Task 16: Add Comprehensive Error Handling
**Files:** All step components, API client
**What:** Handle all error types:
- Network errors (API unreachable) → "Can't reach server. Check connection."
- Validation errors (400) → Show field-level errors
- Auth errors (401) → Redirect to sign-in
- Rate limit (429) → "Too many attempts. Try again in 1 minute."
- Server errors (500) → "Something went wrong. We're fixing it."
**Depends on:** All frontend tasks
**Risk:** low
**Success:** All error paths tested, messages helpful, user can recover

---

#### Task 17: Add Loading States & Skeletons
**Files:** All step components
**What:** Add loading states:
- Step transitions: Fade out/in (300ms)
- API calls: Disable submit button, show spinner
- Resume fetch: Skeleton loader (mimics step UI)
- Completion step: Animated checkmark
**Depends on:** Task 16
**Risk:** low
**Success:** No jarring transitions, user always knows what's happening

---

#### Task 18: Mobile Responsive Testing
**Files:** All onboarding components
**What:** Test and fix mobile layouts (375px - 768px):
- Single column forms
- Larger touch targets (min 44px)
- Reduced padding on mobile
- Progress bar readable
- Keyboard doesn't obscure fields
**Depends on:** All frontend tasks
**Risk:** low
**Success:** All steps work on iPhone SE, iPad, desktop

---

#### Task 19: Accessibility Audit
**Files:** All onboarding components
**What:** WCAG 2.1 AA compliance:
- ARIA labels for all interactive elements
- Keyboard navigation (Tab, Enter, Esc)
- Focus visible (ring-2 ring-primary)
- Screen reader announcements (aria-live for errors, progress)
- Color contrast ≥ 4.5:1
**Depends on:** All frontend tasks
**Risk:** low
**Success:** Passes axe DevTools audit, keyboard navigation works

---

### **Phase 5: Testing & Deployment** (2 days)

#### Task 20: Write E2E Tests
**File:** `apps/web/tests/e2e/onboarding.spec.ts` (if E2E setup exists)
**What:** Test full flows:
- Happy path: Complete all steps → Dashboard
- Resume: Stop at step 2, reload → Resume from step 2
- Bank skip: Skip bank connection → Complete at 80%
- Error recovery: API fails → Retry succeeds
**Depends on:** All implementation tasks
**Risk:** low
**Success:** E2E tests pass, cover major flows

---

#### Task 21: Manual QA Checklist
**What:** Test scenarios:
- [ ] New user: Complete full flow (Personal)
- [ ] New user: Complete full flow (Business)
- [ ] Resume: Close browser at step 2, reopen
- [ ] Bank skip: Skip bank connection
- [ ] Mobile: Test on iPhone SE (375px)
- [ ] Errors: Disconnect network, submit form
- [ ] Force reset: Reset user via script, verify clean state
**Depends on:** All implementation tasks
**Risk:** low
**Success:** All scenarios pass, no critical bugs

---

#### Task 22: Deploy with Feature Flag
**What:** Deploy to staging with feature flag `ENABLE_NEW_ONBOARDING`:
1. Deploy backend (Tasks 1-7)
2. Deploy frontend with flag OFF (old flow)
3. Test in staging with flag ON (new flow)
4. Enable for 10% of users (A/B test)
5. Monitor completion rate, errors, time-to-dashboard
6. Roll out to 100% if metrics good
**Depends on:** All implementation tasks
**Risk:** medium (production deployment)
**Success:** New flow works in staging, rollout smooth, rollback plan tested

---

## Reference Files

**Backend Patterns:**
- `apps/api/src/domains/system/routes/onboarding.ts` — Current onboarding endpoints
- `apps/api/src/domains/banking/services/account.service.ts` — Service patterns
- `apps/api/src/domains/system/routes/onboarding-progress.ts` — Progress tracking

**Frontend Patterns:**
- `apps/web/src/app/onboarding/components/OnboardingWizard.tsx` — Wizard structure
- `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx` — Step pattern (GlowCard)
- `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx` — Form validation
- `apps/web/src/stores/onboardingStore.ts` — Zustand state management

**Design System:**
- `.claude/rules/design-aesthetic.md` — Color tokens, glass morphism
- `packages/ui/src/components/glow-card.tsx` — GlowCard component

**Schemas:**
- `packages/db/prisma/schema.prisma` — OnboardingProgress, Tenant, Entity models

---

## Edge Cases

**User abandons at step 2:**
- Solution: Auto-save to database, resume on return
- No orphaned tenant (not created yet)

**API fails during /complete:**
- Solution: Transaction rolls back entire creation
- User sees error, can retry
- OnboardingProgress unchanged

**User refreshes during completion animation:**
- Solution: Check `Tenant.onboardingStatus` on mount
- If `COMPLETED`, redirect to `/overview`
- If `IN_PROGRESS`, resume from last step

**Multiple browser tabs:**
- Solution: Database is source of truth
- Both tabs fetch `/resume`, sync to same state
- Last write wins (upsert)

**Test user reset while logged in:**
- Solution: Script clears Clerk metadata
- Next request fails auth check (tenantId invalid)
- User redirected to sign-in
- Sign-in triggers `/resume` → starts fresh

**Bank connection fails (future Plaid integration):**
- Solution: Mark `skipBankConnection: true`, allow manual entry later
- Show dashboard with "Connect bank" nudge

---

## Testing Strategy

**Unit Tests (Backend):**
- [ ] `GET /resume` — new user, mid-flow, completed
- [ ] `POST /save-step` — idempotency, validation
- [ ] `POST /complete` — transaction rollback, tenant already exists
- [ ] Middleware redirect — status checks, caching

**Component Tests (Frontend):**
- [ ] OnboardingWizard — resume logic, step navigation
- [ ] WelcomeStep — account type selection
- [ ] IntentStep — multi-select intents
- [ ] EssentialInfoStep — form validation, auto-save
- [ ] BankConnectionStep — skip vs manual entry
- [ ] CompletionStep — API call, success/error states

**Integration Tests:**
- [ ] Full flow: API + Frontend
- [ ] Error scenarios: Network failure, validation failure
- [ ] Resume: Interrupt at each step, verify resume

**E2E Tests:**
- [ ] Personal account: Full flow
- [ ] Business account: Full flow
- [ ] Bank skip: Complete without bank
- [ ] Resume: Close browser, reopen

---

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 1 | `prisma-migration-reviewer` |
| Task 4 | `financial-data-validator`, `security-sentinel`, `prisma-migration-reviewer` |
| Task 6 | `security-sentinel`, `nextjs-app-router-reviewer` |
| Task 13 | `nextjs-app-router-reviewer` |

---

## Domain Impact

**Primary domains:**
- System (onboarding, tenant creation)
- Accounting (GL account seeding)

**Adjacent domains:**
- Banking (bank account creation, optional)
- RBAC (tenant user membership, OWNER role)

**Cross-cutting:**
- Auth (Clerk metadata sync)
- Middleware (onboarding redirect enforcement)

---

## Migration Strategy

**Test Users (Force Reset):**
1. Run reset script for all test users: `pnpm --filter api run script:reset-onboarding test@akount.com`
2. Users will be redirected to new onboarding flow on next login

**Production Users (Future):**
- Check `Tenant.onboardingStatus` on first login after deploy
- If `IN_PROGRESS`, show migration message: "We've improved onboarding! Let's complete your setup."
- Reset to step 0, BUT pre-fill with existing Entity data (name, country, currency)

---

## Progress Tracking

### Phase 1: Database & API Foundation (2-3 days)
- [ ] Task 1: Add Resume State to OnboardingProgress
- [ ] Task 2: Create GET /onboarding/resume Endpoint
- [ ] Task 3: Create POST /onboarding/save-step Endpoint
- [ ] Task 4: Refactor POST /onboarding/complete for Deferred Tenant Creation
- [ ] Task 5: Add Tests for New Endpoints

### Phase 2: Middleware & Security (1 day)
- [ ] Task 6: Enable Database-Driven Middleware Redirect
- [ ] Task 7: Add Force Reset Script for Test Users

### Phase 3: Frontend Refactor (3-4 days)
- [ ] Task 8: Remove Zustand Persistence
- [ ] Task 9: Update OnboardingWizard to Fetch Resume State
- [ ] Task 10: Add Auto-Save on Step Completion
- [ ] Task 11: Merge IntentStep and EssentialInfoStep (Optional)
- [ ] Task 12: Add Bank Connection Step
- [ ] Task 13: Update CompletionStep to Call /complete Endpoint
- [ ] Task 14: Remove /onboarding/complete Page
- [ ] Task 15: Update Progress Indicator to 4 Steps

### Phase 4: Error Handling & Polish (2 days)
- [ ] Task 16: Add Comprehensive Error Handling
- [ ] Task 17: Add Loading States & Skeletons
- [ ] Task 18: Mobile Responsive Testing
- [ ] Task 19: Accessibility Audit

### Phase 5: Testing & Deployment (2 days)
- [ ] Task 20: Write E2E Tests
- [ ] Task 21: Manual QA Checklist
- [ ] Task 22: Deploy with Feature Flag

---

## Timeline Estimate

**Total: 10-13 days (2-2.5 weeks)**

**By Phase:**
- Phase 1 (Backend): 2-3 days
- Phase 2 (Middleware): 1 day
- Phase 3 (Frontend): 3-4 days
- Phase 4 (Polish): 2 days
- Phase 5 (Testing): 2 days

**Parallelization:**
- Phase 1 + Phase 2 can run parallel (different files)
- Phase 3 tasks can be split across developers

**Critical Path:**
- Phase 1 (Tasks 1-4) → Phase 3 (Task 13) → Phase 5 (Task 22)

---

## Post-Launch Metrics

**Track for first 30 days:**
- Wizard completion rate (target: ≥ 95%)
- Time to dashboard (target: 90-120s)
- Bank connection rate (target: ≥ 40%)
- Resume usage rate (how many users resume vs restart)
- Error rate (target: ≤ 2%)
- Mobile vs desktop completion (target: ≥ 85% mobile)

**Success indicators:**
- Completion rate higher than old flow (baseline: ~85%)
- Zero orphaned tenants
- Resume works reliably (< 1% failures)

---

## Rollback Plan

**If new flow has critical issues:**
1. Set `ENABLE_NEW_ONBOARDING=false`
2. Old flow resumes instantly
3. Users mid-new-flow will restart at old flow step 0
4. Fix issues in new flow, re-deploy

**Data cleanup (if needed):**
- OnboardingProgress.stepData field unused by old flow (safe)
- New endpoints unused by old flow (safe)

---

## Next Steps

1. **Review Plan:** User approves plan structure and task breakdown
2. **Start Phase 1:** Backend foundation (Tasks 1-5) - 2-3 days
3. **Start Phase 2:** Middleware (Tasks 6-7) - 1 day (parallel with Phase 1)
4. **Start Phase 3:** Frontend refactor (Tasks 8-15) - 3-4 days
5. **Polish:** Phase 4 (Tasks 16-19) - 2 days
6. **Test & Deploy:** Phase 5 (Tasks 20-22) - 2 days

**Total Calendar Time:** ~2-2.5 weeks (with 1-2 developers, tasks parallelized)

---

_Plan ready for execution. Run `/processes:work` to begin implementation._
