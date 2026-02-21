# Onboarding Flow Overhaul — Implementation Plan

**Created:** 2026-02-20
**Status:** Draft
**Source:** `/processes:diagnose` session — 7 root causes identified
**Diagnosis:** Missing backend endpoints, competing systems, broken data routing, dead code

## Context

The onboarding flow accumulated structural problems across v1→v2→v3 rewrites. The v3 architecture doc specified DB-backed auto-save/resume, but the backend endpoints (`/save-step`, `/resume`) were never implemented. The frontend silently swallows 404s, making auto-save theater. Additionally, the onboarding seeds a mini 6-account COA instead of the proper 30-account template, business info routing is broken, and 374 lines of dead code remain.

## Success Criteria

- [ ] Auto-save persists wizard state to DB on every change (500ms debounce)
- [ ] Resume works: close browser mid-onboarding → reopen → pick up where you left off
- [ ] "Me + my business" always shows business step (no employment gate)
- [ ] Proper 30-account COA seeded (via `seedDefaultCOA()`) for every entity
- [ ] Address fields optional (only country required)
- [ ] TaxID field available (optional, flows to invoice PDFs)
- [ ] 195 countries available everywhere (already true for CountrySelect)
- [ ] Dead code removed (EssentialInfoStep, legacy store fields)
- [ ] All existing tests pass + new tests for save-step/resume
- [ ] Intents drive dashboard personalization (widget ordering, greeting text)

---

## Sprint 1: Schema Migration — Pre-Tenant Wizard State

> The existing `OnboardingProgress` model is keyed by `tenantId` (required). But the wizard runs BEFORE tenant creation. The v3 architecture doc specified `userId` (unique) + nullable `tenantId`. We need a new model for pre-tenant wizard state.

### Task 1.1: Create `OnboardingWizardState` Prisma model
**File:** `packages/db/prisma/schema.prisma`
**What:** Add a new model for pre-tenant wizard state storage:
```prisma
model OnboardingWizardState {
  id          String   @id @default(cuid())
  clerkUserId String   @unique  // Before tenant exists, keyed by Clerk user
  currentStep Int      @default(0)
  stepData    Json?    // All wizard field values
  version     Int      @default(1)  // Optimistic locking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([clerkUserId])
}
```
**Why not modify existing `OnboardingProgress`?** OnboardingProgress tracks post-onboarding completion (5-step checklist for dashboard nudges). It's tenant-scoped and used by the sidebar/hero card. The wizard state is pre-tenant, temporary, and deleted after completion. Separate concerns = separate models.
**Depends on:** none
**Risk:** high (schema migration)
**Review:** `prisma-migration-reviewer`
**Success:** `npx prisma migrate dev` succeeds, model visible in Prisma Client

### Task 1.2: Generate and apply migration
**File:** `packages/db/prisma/migrations/YYYYMMDD_add_onboarding_wizard_state/migration.sql`
**What:** Run `npx prisma migrate dev --name add_onboarding_wizard_state`
**Depends on:** 1.1
**Success:** Migration applies cleanly, no data loss

---

## Sprint 2: Backend — Save-Step & Resume Endpoints

### Task 2.1: Implement `POST /system/onboarding/save-step`
**File:** `apps/api/src/domains/system/routes/onboarding.ts` (add to existing file)
**What:** New endpoint in the auth-only scope (no tenant middleware):
- Accepts `{ step: number, data: Record<string, unknown>, version: number }`
- Upserts `OnboardingWizardState` by `clerkUserId` (from `request.userId`)
- Implements optimistic locking: if incoming `version` < stored `version`, return 409
- Returns `{ success: true, version: newVersion }`
- Zod schema validation on the body
**Depends on:** 1.2
**Review:** `fastify-api-reviewer`, `security-sentinel`
**Success:** POST with valid body returns 200 + incremented version; POST with stale version returns 409

### Task 2.2: Implement `GET /system/onboarding/resume`
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** New endpoint in the auth-only scope:
- Looks up `OnboardingWizardState` by `clerkUserId`
- If found: returns `{ currentStep, stepData, version, isNew: false }`
- If not found: returns `{ currentStep: 0, stepData: {}, version: 0, isNew: true }`
**Depends on:** 1.2
**Success:** Returns saved state after save-step, returns default for new users

### Task 2.3: Clean up wizard state on completion
**File:** `apps/api/src/domains/system/routes/onboarding.ts` (modify `/initialize`)
**What:** After successful tenant+entity creation in `/initialize`, delete the `OnboardingWizardState` row for this `clerkUserId`. The data has been materialized into Tenant/Entity — the temporary wizard state is no longer needed.
**Depends on:** 2.1, 2.2
**Success:** OnboardingWizardState row deleted after successful /initialize

### Task 2.4: Tests for save-step and resume
**File:** `apps/api/src/domains/system/routes/__tests__/onboarding-wizard.test.ts`
**What:** Test cases:
- save-step creates new state for fresh user
- save-step updates existing state
- save-step rejects stale version (409)
- resume returns saved state
- resume returns default for unknown user
- state deleted after /initialize
- Cross-user isolation (user A can't read user B's state)
**Depends on:** 2.1, 2.2, 2.3
**Success:** All tests pass

---

## Sprint 3: Replace Mini COA with Proper Template

### Task 3.1: Replace inline COA with `seedDefaultCOA()` in `/complete`
**File:** `apps/api/src/domains/system/routes/onboarding.ts` (modify `/complete` handler)
**What:** Remove the inline 6-account `defaultAccounts` array and `createMany` call (lines ~417-450). Replace with:
```typescript
import { seedDefaultCOA } from '../../accounting/services/coa-template';
// Inside the transaction, after entity update:
await seedDefaultCOA(entity.id, data.tenantId, user.id);
```
The `seedDefaultCOA` function is already idempotent (skips if accounts exist) and creates 30 accounts with hierarchy + audit trail.
**Depends on:** none (can run in parallel with Sprint 2)
**Risk:** high (accounting data)
**Review:** `financial-data-validator`
**Success:** After onboarding, entity has 30 GL accounts (not 6). Existing users unaffected (idempotent).

### Task 3.2: Seed COA for business entity too
**File:** `apps/api/src/domains/system/routes/onboarding.ts` (modify `/initialize` handler)
**What:** After creating the optional business entity (line ~221-235), call `seedDefaultCOA()` for it too. Currently only the personal entity gets COA via `/complete`, and the business entity gets nothing.
Note: `seedDefaultCOA` requires a userId — pass the user.id we already have in scope.
**Depends on:** 3.1
**Risk:** high (accounting data)
**Review:** `financial-data-validator`
**Success:** Business entity has 30 GL accounts after onboarding

---

## Sprint 4: Fix Business Flow & Make Address Optional

### Task 4.1: Remove employment gate on business step
**File:** `apps/web/src/stores/onboardingStore.ts`
**What:** Change `shouldShowBusinessStep()` from:
```typescript
return accountType === 'business' && employmentStatus !== null && BUSINESS_EMPLOYMENT_STATUSES.includes(employmentStatus)
```
to:
```typescript
return accountType === 'business'
```
If user picks "Me + my business", always show the business step. Employment status remains collected for future personalization but doesn't gatekeep.
**Depends on:** none
**Success:** Selecting "Me + my business" → always see business setup step regardless of employment

### Task 4.2: Make address fields optional, add TaxID
**File:** `apps/web/src/app/onboarding/components/steps/AddressStep.tsx`
**What:**
- Country remains required (drives currency + tax rules)
- Street, city, province, postal code become optional — remove `required` attr and `canSubmit` guards
- Add optional TaxID field: `<input id="taxId" placeholder="e.g., 123456789" />`
- Wire to store: new `taxId` field + `setTaxId` action
- Rename step from "Your location" to "Your details" (it now has TaxID too)
- Continue button enabled as soon as country is selected
**Depends on:** none
**Success:** User can proceed with only country selected; TaxID appears on invoice PDF when set

### Task 4.3: Add `taxId` to onboarding store and API
**Files:**
- `apps/web/src/stores/onboardingStore.ts` — add `taxId: string` field + `setTaxId` action
- `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx` — include `taxId` in `/initialize` payload
- `apps/api/src/domains/system/routes/onboarding.ts` — add `taxId: z.string().optional()` to schema, pass to Entity creation
**Depends on:** 4.2
**Success:** TaxID entered during onboarding → stored in `Entity.taxId` → appears on invoice PDFs

### Task 4.4: Route business address to business entity
**File:** `apps/web/src/app/onboarding/components/steps/BusinessSetupStep.tsx`
**What:** Add optional address fields to the business form (street, city, province, postal). These go to the business entity, not the personal one. Use same input styling as AddressStep.
**Files also:** `apps/web/src/stores/onboardingStore.ts` — add `businessStreetAddress`, `businessCity`, `businessProvince`, `businessPostalCode` fields
**Files also:** `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx` — include business address in `businessEntity` payload
**Files also:** `apps/api/src/domains/system/routes/onboarding.ts` — add address fields to `businessEntity` schema object, pass to business entity creation
**Depends on:** 4.1
**Success:** Business entity has its own address in DB; shows on business invoice PDFs

---

## Sprint 5: Frontend Fixes

### Task 5.1: Fix wizard auto-save to use real endpoint
**File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
**What:** The auto-save effect (lines 91-148) already calls `/api/system/onboarding/save-step`. After Sprint 2 implements the endpoint, this will work. However, it currently uses bare `fetch()` instead of `apiFetch`. Change to use `apiFetch` so auth tokens are included. Also fix the save payload to match the new endpoint schema.
**Depends on:** 2.1
**Success:** "Saving..." indicator works, "Saved" appears, save-step endpoint receives data

### Task 5.2: Fix server page resume to use real endpoint
**File:** `apps/web/src/app/onboarding/page.tsx`
**What:** The `getOnboardingProgress()` function (lines 11-28) calls `/system/onboarding/resume` with `x-user-id` header. After Sprint 2, this endpoint exists. However, it should use a proper auth token (from Clerk server-side) instead of `x-user-id`. Update to use `getToken()` from `@clerk/nextjs/server`.
**Depends on:** 2.2
**Success:** Refreshing mid-onboarding resumes at correct step with all data preserved

### Task 5.3: Fix step count in progress bar
**File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
**What:** The `getStepLabels()` function returns labels excluding the "Completion" step, which is correct — but the progress bar segment count should match the labels (currently 4 or 5 segments for 5 or 6 total steps). Verify this works correctly after Task 4.1 changes.
**Depends on:** 4.1
**Success:** Progress bar shows correct number of segments, final segment fills on address step

---

## Sprint 6: Dead Code Cleanup

### Task 6.1: Delete `EssentialInfoStep.tsx`
**File:** `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`
**What:** Delete this 374-line dead code file. It's the v1/v2 step with its own 4-country list, API health check, and `/initialize` call. Not imported anywhere.
**Depends on:** none
**Success:** File deleted, no imports break

### Task 6.2: Remove legacy fields from onboarding store
**File:** `apps/web/src/stores/onboardingStore.ts`
**What:** Remove unused legacy fields and their setters:
- `entityName`, `setEntityName` — CompletionStep uses `user.fullName` from Clerk
- `entityType`, `setEntityType` — hardcoded to 'PERSONAL' in CompletionStep
- `phoneNumber`, `setPhoneNumber` — not collected in any current step
- `timezone`, `setTimezone` — auto-detected in CompletionStep
- `fiscalYearEnd`, `setFiscalYearEnd` — hardcoded to 1 (January) in CompletionStep
- `industry`, `setIndustry` — not collected (business has `businessIndustry` instead)
Also remove `BUSINESS_EMPLOYMENT_STATUSES` export (no longer needed after Task 4.1).
**Depends on:** 4.1, 4.3 (ensure nothing else uses these)
**Success:** Store is leaner, no import errors

### Task 6.3: Update onboarding store tests
**File:** `apps/web/src/stores/__tests__/onboardingStore.test.ts`
**What:** Update test expectations to match removed legacy fields and new fields (`taxId`, business address fields).
**Depends on:** 6.2, 4.3
**Success:** Store tests pass

---

## Sprint 7: Intent-Driven Dashboard Personalization

> User selected intents during onboarding (track-spending, saving, tax-ready, debt, exploring) are currently write-only — stored in `Tenant.onboardingData.intents` but never read. This sprint reads them back and uses them to personalize the dashboard.

### Task 7.1: Create API endpoint to read tenant intents
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts` (add to existing)
**What:** New `GET /system/onboarding/intents` endpoint (auth + tenant scoped):
- Reads `Tenant.onboardingData` JSON, extracts `intents` array
- Returns `{ intents: string[], employmentStatus?: string }`
- If `onboardingData` is null or has no intents, returns `{ intents: [] }`
**Depends on:** none
**Success:** Returns intents array for onboarded user, empty array for user without intents

### Task 7.2: Create `useUserIntents` React Query hook
**File:** `apps/web/src/lib/api/onboarding.ts` (add to existing)
**What:** New hook that fetches intents from Task 7.1's endpoint:
```typescript
export function useUserIntents() {
  return useQuery({
    queryKey: ['onboarding', 'intents'],
    queryFn: () => apiFetch<{ intents: string[] }>('/api/system/onboarding/intents'),
    staleTime: 30 * 60 * 1000, // 30 min — intents rarely change
  })
}
```
**Depends on:** 7.1
**Success:** Hook returns intents, cached for 30 min

### Task 7.3: Create intent-to-dashboard mapping utility
**File:** `apps/web/src/lib/dashboard-personalization.ts` (new file)
**What:** Pure function that maps intents to dashboard widget ordering and greeting:

| Intent | Dashboard Effect |
|--------|-----------------|
| `track-spending` | Expenses stat + Expense chart promoted to row 1, greeting: "Let's see where your money went" |
| `saving` | Cash stat + Net Worth promoted, greeting: "Building your financial foundation" |
| `tax-ready` | Revenue + Expenses stats promoted, greeting: "Staying ahead of tax season" |
| `debt` | Debt stat + Payables promoted, greeting: "Keeping your debt under control" |
| `exploring` | Default order, greeting: "Your financial command center" |

Function signature:
```typescript
export function getDashboardConfig(intents: string[]): {
  greeting: string
  statOrder: string[]   // Reordered stat labels
  highlightWidgets: string[]  // Widget IDs to visually emphasize
}
```
Uses first intent as primary driver (most users pick 1-2). Falls back to default if no intents.
**Depends on:** none
**Success:** Unit-testable pure function, no side effects

### Task 7.4: Wire intents into overview page
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:**
- Server component fetches intents via API (alongside existing metrics fetch)
- Pass `intents` to a new `DashboardGreeting` client component that shows personalized greeting
- Reorder `quickStats` array based on `getDashboardConfig(intents).statOrder`
- Add subtle visual emphasis (brighter border, slight glow) to highlighted stat cards via a `highlighted` prop
**Depends on:** 7.2, 7.3
**Success:** User who picked "track-spending" sees Expenses stats first with personalized greeting; user with no intents sees default layout

### Task 7.5: Tests for intent personalization
**File:** `apps/web/src/lib/__tests__/dashboard-personalization.test.ts`
**What:** Test cases:
- Each intent produces correct stat order
- Multiple intents use first as primary
- Empty intents array returns default config
- Unknown intent gracefully falls back to default
**Also:** Add test for `GET /system/onboarding/intents` endpoint in `apps/api/src/domains/system/routes/__tests__/`
**Depends on:** 7.1, 7.3
**Success:** All tests pass

---

## Reference Files

| File | Purpose |
|------|---------|
| `apps/api/src/domains/system/routes/onboarding.ts` | Main onboarding routes (/initialize, /complete, /status) |
| `apps/api/src/domains/system/routes/onboarding-progress.ts` | Post-onboarding progress tracking |
| `apps/api/src/domains/system/routes.ts` | Route registration (auth-only vs tenant-scoped) |
| `apps/api/src/domains/accounting/services/coa-template.ts` | Proper 30-account COA seed function |
| `apps/web/src/app/onboarding/components/OnboardingWizard.tsx` | Main wizard component |
| `apps/web/src/stores/onboardingStore.ts` | Zustand state store |
| `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx` | Final step that calls /initialize + /complete |
| `apps/web/src/app/onboarding/components/steps/AddressStep.tsx` | Address collection step |
| `apps/web/src/app/onboarding/components/steps/BusinessSetupStep.tsx` | Business entity setup |
| `apps/web/src/app/onboarding/page.tsx` | Server component (resume fetch) |
| `apps/api/src/domains/invoicing/services/pdf.service.ts` | Invoice PDF (consumes entity.address, entity.taxId) |
| `docs/architecture/onboarding-v3-architecture.md` | Original v3 spec (partially implemented) |

## Edge Cases

- **Concurrent tabs:** Optimistic locking (version field) returns 409 on stale writes. Frontend shows "Save failed" and user reloads to get latest.
- **User already onboarded:** `/initialize` returns 400 `AlreadyOnboarded`. CompletionStep already handles this gracefully (checks status, redirects).
- **Business entity without address:** Allowed. `entity.address` is nullable. Invoice PDF handles this — `[].filter(Boolean)` omits empty parts.
- **TaxID format validation:** Not enforced during onboarding (optional field). Can add per-country regex later. For now, just a string.
- **Abandoned wizard state:** Add TTL cleanup job (future task) — delete `OnboardingWizardState` rows older than 30 days with no associated tenant.
- **No intents selected:** Dashboard falls back to default layout and generic greeting. No error.

## Domain Impact

- **Primary:** System (onboarding), Accounting (COA seeding), Overview (dashboard personalization)
- **Adjacent:** Invoicing (entity.taxId, entity.address on PDF), Banking (COA accounts needed for transaction categorization)
- **No breaking changes:** All modifications are additive or fix existing broken behavior

## Testing Strategy

1. **Backend unit tests:** New test file for save-step/resume (Task 2.4), intents endpoint (Task 7.5)
2. **Existing tests:** Run full suite `cd apps/api && npx vitest run` — should all pass
3. **Manual E2E:** Sign up new user → complete onboarding → verify 30 GL accounts, entity has address/taxId, invoice PDF shows business info
4. **Resume test:** Start onboarding → close tab → reopen → verify state restored
5. **Business flow:** Select "Me + my business" → any employment → business step appears → fill form → verify 2 entities created with COA each
6. **Intent personalization:** Complete onboarding with "track-spending" → dashboard shows Expenses first with personalized greeting

## Progress

- [ ] Sprint 1: Schema migration (Tasks 1.1-1.2)
- [ ] Sprint 2: Backend save-step/resume (Tasks 2.1-2.4)
- [ ] Sprint 3: COA fix (Tasks 3.1-3.2)
- [ ] Sprint 4: Business flow + address/TaxID (Tasks 4.1-4.4)
- [ ] Sprint 5: Frontend wiring (Tasks 5.1-5.3)
- [ ] Sprint 6: Dead code cleanup (Tasks 6.1-6.3)
- [ ] Sprint 7: Intent-driven dashboard personalization (Tasks 7.1-7.5)
