# Onboarding Flow Redesign - Implementation Plan

**Created:** 2026-02-12
**Status:** Ready for Implementation
**Related Docs:**
- Design Spec: `brand/onboarding-user-flow.md`
- Design Aesthetic: `.claude/rules/design-aesthetic.md`
- Brainstorm: N/A (user request)

---

## Overview

Redesign the entire onboarding experience with a "zen" aesthetic following the "Financial Clarity" design system. Implement Option A (Minimal First) flow: 60-second path to dashboard with progressive completion via hero card nudges.

**Current State:**
- Basic 2-step wizard (Welcome → Essential Info → Completion)
- Plain design, not following design aesthetic
- Missing: Purpose capture, enhanced validation, beautiful visuals
- Backend missing: Purpose endpoint, progress tracking, proper error responses

**Target State:**
- Beautiful glass morphism wizard (dark-first, zen, minimal)
- Enhanced validation with helpful error messages
- Purpose capture (post-dashboard modal)
- Dashboard hero card with circular progress
- Comprehensive API with proper error handling
- 60-second onboarding target achieved

---

## Success Criteria

**Functional:**
- [ ] User can complete onboarding in ≤ 90 seconds
- [ ] All 3 account types supported (Personal, Business, Accountant)
- [ ] Form validation prevents invalid submissions
- [ ] API returns detailed error responses matching spec
- [ ] Progress tracked at 40%, 60%, 80%, 100% levels
- [ ] Mobile responsive (375px - 1440px)

**Visual (Zen Experience):**
- [ ] Dark backgrounds (#09090F) with glass morphism cards
- [ ] Subtle purple undertones throughout
- [ ] Amber orange (#F59E0B) primary color for CTAs
- [ ] Smooth transitions (200-300ms ease-in-out)
- [ ] Newsreader font for headings, Manrope for body
- [ ] No harsh borders, gentle glows only
- [ ] Progress indicators use circular charts (donut)

**Technical:**
- [ ] Type-safe API responses (Zod schemas)
- [ ] Zustand state persists across refreshes
- [ ] Error boundaries prevent white screens
- [ ] Analytics events track completion/abandonment

---

## Tasks

### Phase 1: Backend API Updates (Backend - 3-4 days)

#### Task 1: Update Initialize Endpoint Schema
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Enhance `initializeOnboardingSchema` to include `address` (optional personal, required business) and `taxId` (optional business). Update validation rules per spec.
**Depends on:** none
**Risk:** medium (API contract change)
**Success:** Schema validates new fields, existing tests pass with updated mocks

```typescript
const initializeOnboardingSchema = z.object({
  accountType: z.enum(['personal', 'business', 'accountant']),
  name: z.string().min(2).max(100), // Personal name
  phoneNumber: z.string().min(10),
  timezone: z.string(),
  entityName: z.string().min(1).max(255),
  address: z.string().max(500).optional(), // Required for business via refinement
  taxId: z.string().max(50).optional(),
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
}).refine(
  (data) => data.accountType !== 'business' || !!data.address,
  { message: "Business address is required for business accounts", path: ["address"] }
)
```

#### Task 2: Add Enhanced Error Responses
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Update error handling to return structured errors matching spec: `{ success: false, error: { code, message, details? } }`. Handle 400, 409, 429, 500 with specific codes.
**Depends on:** Task 1
**Risk:** low
**Success:** Error responses include `code`, `message`, optional `details` array with field-level errors

#### Task 3: Create Onboarding Progress Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Add `GET /api/system/onboarding/progress` endpoint. Returns full OnboardingProgress record with completion percentage, completed steps, next recommended step. Separate from `/status` (which is lightweight).
**Depends on:** none
**Risk:** low
**Success:** Endpoint returns `{ completionPercentage, basicInfoComplete, entitySetupComplete, businessDetailsComplete, bankConnectionComplete, goalsSetupComplete, nextRecommendedStep }`

#### Task 4: Create Update Progress Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Add `PATCH /api/system/onboarding/update-progress` endpoint. Accepts `{ step, completed, primaryIntent?, otherIntent? }`. Updates OnboardingProgress, recalculates percentage.
**Depends on:** Task 3
**Risk:** medium (progress calculation logic)
**Success:** Endpoint updates specific step completion, percentage recalculated correctly (40% → 60% → 80% → 100%)

```typescript
// Progress calculation
function calculateCompletion(progress: OnboardingProgress): number {
  let total = 0
  if (progress.basicInfoComplete) total += 20
  if (progress.entitySetupComplete) total += 20
  if (progress.businessDetailsComplete) total += 20
  if (progress.bankConnectionComplete) total += 20
  if (progress.goalsSetupComplete) total += 20
  return total
}
```

#### Task 5: Add Skip Step Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Add `POST /api/system/onboarding/skip-step` endpoint. Accepts `{ step, skipDurationDays }`. Adds step to `skippedSteps` array, sets `lastNudgedAt` to avoid re-prompts.
**Depends on:** Task 3
**Risk:** low
**Success:** Endpoint marks step as skipped, hero card respects skip for duration

#### Task 6: Add Dismiss Card Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Add `POST /api/system/onboarding/dismiss-card` endpoint. Sets `dashboardCardDismissedAt`, increments `dismissalCount`. Hides card for 24 hours.
**Depends on:** Task 3
**Risk:** low
**Success:** Endpoint updates dismissal tracking, frontend hides card

#### Task 7: Add Tests for New Endpoints
**File:** `apps/api/src/domains/system/routes/__tests__/onboarding-progress.test.ts`
**What:** Write tests for progress, update-progress, skip-step, dismiss-card endpoints. Test permission boundaries (tenant isolation), validation, edge cases.
**Depends on:** Tasks 3-6
**Risk:** low
**Success:** ≥ 90% coverage for new endpoints, all tests pass

---

### Phase 2: Frontend Core Redesign (Frontend - 4-5 days)

#### Task 8: Update Zustand Store for New Fields
**File:** `apps/web/src/stores/onboardingStore.ts`
**What:** Add `address`, `taxId`, `primaryIntent` (array), `otherIntent` fields. Add actions: `setAddress`, `setTaxId`, `setPrimaryIntent`. Update persistence version to 3.
**Depends on:** none
**Risk:** low
**Success:** Store persists new fields, migration from v2 works

#### Task 9: Redesign Welcome Step (Glass Morphism)
**File:** `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx`
**What:** Complete visual redesign following "Financial Clarity" aesthetic:
- Dark background `bg-[#09090F]`
- Glass cards for account type options
- Hover effects: scale-105, border-primary/50
- Selected state: border-primary, bg-primary/5, checkmark
- Smooth transitions (200ms)
- 5xl emoji icons, centered layout
**Depends on:** none
**Risk:** low
**Success:** Welcome screen matches design spec, smooth animations, responsive mobile/desktop

**Visual Specs:**
```tsx
// Card default
className="relative p-8 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[16px] transition-all duration-200 hover:scale-105 hover:border-primary/50 cursor-pointer"

// Card selected
className="border-primary bg-[rgba(245,158,11,0.14)] shadow-md"

// Icon
className="text-5xl mb-4" // Emoji

// Label
className="text-xl font-semibold text-foreground mb-2"

// Description
className="text-sm text-muted-foreground"
```

#### Task 10: Redesign Essential Info Step
**File:** `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`
**What:** Complete visual redesign + add new fields:
- Glass container (max-width 800px, centered, p-12)
- InputGlass components for all fields
- 2-column grid (desktop), 1-column (mobile)
- Address field (full-width, optional personal, required business)
- Tax ID field (business only, optional, with help text)
- Country dropdown with flag emojis
- Real-time validation (on blur)
- Helpful error messages below fields
**Depends on:** Task 8
**Risk:** medium (complex form validation)
**Success:** Form matches design spec, validation prevents invalid submit, error messages clear

**Field Layout:**
```
Row 1: [Full Name] [Phone Number]
Row 2: [Time Zone] [Country]
Row 3: [Business Legal Name] (full-width)
Row 4: [Business Address] (full-width)
Row 5: [Tax ID] [Base Currency]
```

#### Task 11: Create Input Components (if missing)
**File:** `packages/ui/src/components/InputGlass.tsx` (if doesn't exist)
**What:** Create reusable InputGlass component matching design aesthetic:
- Glass background, subtle border
- Focus state: border-primary, ring-2 ring-primary/20
- Error state: border-red-400, text-red-400 below
- Help text support
- Controlled + uncontrolled modes
**Depends on:** none
**Risk:** low
**Success:** Component reusable across all forms, matches design system

#### Task 12: Redesign Success Screen
**File:** `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx`
**What:** Enhance success animation:
- Large checkmark (120px, green #34D399)
- Scale animation (0.5 → 1.0, spring easing)
- "Welcome to Akount!" heading (text-4xl, font-heading, Newsreader)
- Auto-redirect after 2 seconds
- Optional: Subtle confetti (react-confetti, 2s duration)
**Depends on:** none
**Risk:** low
**Success:** Success screen feels celebratory, smooth transition to dashboard

#### Task 13: Create Dashboard Hero Card
**File:** `apps/web/src/components/dashboard/OnboardingHeroCard.tsx`
**What:** Build onboarding hero card for dashboard:
- GlassCard with primary border (2px border-primary/20)
- Circular progress chart (recharts PieChart, 120px diameter)
- Checklist with ✓ (complete) and ○ (pending) icons
- Collapse/expand functionality (chevron button)
- CTAs: "Continue Setup" (solid), "Skip for now" (outline)
- Dismiss X button (top-right)
**Depends on:** none
**Risk:** medium (chart implementation)
**Success:** Hero card displays progress accurately, collapse/expand works, CTAs navigate correctly

**Checklist Steps (Business Example):**
```tsx
const steps = [
  { label: 'Basic information', complete: true, percentage: 20 },
  { label: 'Entity setup', complete: true, percentage: 20 },
  { label: 'Business details', complete: false, percentage: 20 },
  { label: 'Connect bank account', complete: false, percentage: 20 },
  { label: 'Set business goals', complete: false, percentage: 20 },
]
```

#### Task 14: Update Sidebar Progress Indicator
**File:** `apps/web/src/components/layout/SidebarProgressIndicator.tsx`
**What:** Redesign progress indicator:
- Horizontal progress bar (1.5px height, rounded-full)
- Yellow (#F59E0B) fill for < 80%, green (#34D399) for ≥ 80%
- Percentage text below (font-mono, text-xs)
- Tooltip on hover: "60% complete - Click to continue setup"
- Click navigates to dashboard and scrolls to hero card
**Depends on:** Task 13
**Risk:** low
**Success:** Indicator visible in sidebar, updates when progress changes, click scrolls to hero card

---

### Phase 3: Post-Dashboard Modals (Frontend - 3-4 days)

#### Task 15: Create Purpose Modal
**File:** `apps/web/src/app/onboarding/complete/components/PurposeModal.tsx`
**What:** Build purpose capture modal (triggered from hero card):
- Modal with glass background
- Goal cards in 2-column grid (280px per card)
- Click to select (max 2 for personal/business, unlimited for accountant)
- "Other" text input (optional)
- Continue button enabled when ≥1 selected
- Calls `PATCH /api/system/onboarding/update-progress`
**Depends on:** Task 4
**Risk:** medium (multi-select logic)
**Success:** Modal captures 1-2 goals, saves to backend, personalizes dashboard

**Goal Options (Business):**
```tsx
const businessGoals = [
  { icon: '📧', label: 'Create invoices', key: 'create_invoices' },
  { icon: '💳', label: 'Track expenses', key: 'track_expenses' },
  { icon: '📊', label: 'Financial insights', key: 'financial_insights' },
  { icon: '🏦', label: 'Manage cash flow', key: 'cash_flow' },
  { icon: '📄', label: 'Tax preparation', key: 'tax_prep' },
  { icon: '👥', label: 'Collaborate with accountant', key: 'collaborate_accountant' },
]
```

#### Task 16: Create Business Details Modal
**File:** `apps/web/src/app/onboarding/complete/components/BusinessDetailsModal.tsx`
**What:** Build business details modal (triggered from hero card):
- Form fields: Address (full), City, State, Postal Code, Tax ID, Industry (dropdown)
- All fields optional (can skip)
- Glass styling, InputGlass components
- Save updates Entity model, marks `businessDetailsComplete` true
- Calls `PATCH /api/system/onboarding/update-progress`
**Depends on:** Task 4
**Risk:** low
**Success:** Modal saves business details, progress updates to 50-60%

#### Task 17: Create Bank Connection Modal (Manual Entry Only)
**File:** `apps/web/src/app/onboarding/complete/components/BankConnectionModal.tsx`
**What:** Build bank connection modal (manual entry for MVP, Plaid Phase 2):
- Security badges (🔒 Bank-level security, 👁️ Read-only, ⚡ Daily sync)
- "Add Manually" button (Plaid button placeholder for Phase 2)
- Manual form: Account Name, Account Type (dropdown), Opening Balance, Currency
- Save creates Account record
- Calls `PATCH /api/system/onboarding/update-progress`
**Depends on:** Task 4
**Risk:** low (manual entry only)
**Success:** Modal creates manual account, progress updates to 70-80%

#### Task 18: Create Goals Setup Modal
**File:** `apps/web/src/app/onboarding/complete/components/GoalsSetupModal.tsx`
**What:** Build goals setup modal:
- Goal Type: Radio buttons (Revenue, Savings, Expense Budget)
- Goal Name: Text input
- Target Amount: Number input (formatted as currency)
- Target Date: Date picker (shadcn Calendar)
- Save creates Goal record
- Calls `PATCH /api/system/onboarding/update-progress`
**Depends on:** Task 4
**Risk:** low
**Success:** Modal creates goal, progress updates to 100%, confetti animation

---

### Phase 4: API Integration & Error Handling (Frontend - 2 days)

#### Task 19: Create API Client Functions
**File:** `apps/web/src/lib/api/onboarding.ts`
**What:** Create type-safe API client functions for all onboarding endpoints:
- `initializeOnboarding(data): Promise<{ tenantId, entityId, progress }>`
- `getOnboardingProgress(): Promise<OnboardingProgress>`
- `updateOnboardingProgress(step, completed, intent?): Promise<OnboardingProgress>`
- `skipOnboardingStep(step, duration): Promise<void>`
- `dismissOnboardingCard(): Promise<void>`
- Handle errors, parse responses, include auth headers
**Depends on:** Tasks 1-6 (backend endpoints)
**Risk:** low
**Success:** All API calls type-safe, error handling consistent

#### Task 20: Add Form Validation (Client-Side)
**File:** `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`
**What:** Implement client-side validation using `react-hook-form` + Zod:
- Real-time validation (on blur)
- Error messages below fields
- Prevent submit if invalid
- Validate phone number format (libphonenumber-js)
- Match validation rules from backend schema
**Depends on:** Task 10
**Risk:** low
**Success:** Form prevents invalid submissions, error messages helpful

#### Task 21: Add Error Boundaries
**File:** `apps/web/src/app/onboarding/error.tsx`
**What:** Create error boundary for onboarding flow:
- Catch rendering errors
- Display friendly error message
- "Try again" button (reloads page)
- Log errors to monitoring (Sentry if integrated)
**Depends on:** none
**Risk:** low
**Success:** Errors don't crash app, user can recover

#### Task 22: Add Loading States
**Files:** All modal/form components
**What:** Add loading states to all async actions:
- Submit buttons: Disabled + spinner + "Creating account..." text
- Skeleton loaders for hero card
- Progress indicator: Shimmer animation while fetching
- Modal loading: Spinner overlay
**Depends on:** Tasks 13-18
**Risk:** low
**Success:** No jarring loading transitions, user knows something is happening

---

### Phase 5: Mobile Responsive & Polish (Frontend - 1-2 days)

#### Task 23: Mobile Responsive Layouts
**Files:** All onboarding components
**What:** Ensure all screens work perfectly on mobile (375px - 768px):
- Single column layout on mobile
- Larger touch targets (min 44px)
- Reduced padding on small screens (p-6 instead of p-12)
- Progress dots visible on mobile
- Modals full-screen on mobile
**Depends on:** Tasks 9-18
**Risk:** low
**Success:** All screens work on iPhone SE (375px) and iPad (768px)

#### Task 24: Accessibility Audit
**Files:** All onboarding components
**What:** WCAG 2.1 AA compliance:
- ARIA labels for icon-only buttons
- Keyboard navigation (Tab, Enter, Esc)
- Focus visible (ring-2 ring-primary)
- Screen reader announcements (aria-live for progress)
- Color contrast ≥ 4.5:1 for text
**Depends on:** Tasks 9-18
**Risk:** low
**Success:** Passes axe DevTools audit, keyboard-only navigation works

#### Task 25: Add Analytics Tracking
**Files:** All onboarding components
**What:** Add analytics events for tracking:
- `Onboarding Started` (accountType)
- `Onboarding Step Completed` (step, timeSpent)
- `Onboarding Completed` (totalTime, completionPercentage)
- `Onboarding Abandoned` (step, reason)
- `Hero Card Dismissed` (completionPercentage, dismissalCount)
- `Setup Step Completed` (step, source: 'hero_card' | 'settings')
**Depends on:** All frontend tasks
**Risk:** low
**Success:** Events fire correctly, data in analytics dashboard

#### Task 26: Smooth Transitions & Animations
**Files:** All onboarding components
**What:** Polish all transitions:
- Page transitions: fade + slide (300ms ease-in-out)
- Modal open/close: scale + fade (200ms)
- Checkmark animation: scale spring
- Progress bar fill: smooth width transition (500ms)
- Card hover: scale (200ms ease-out)
**Depends on:** Tasks 9-18
**Risk:** low
**Success:** All animations smooth, no janky transitions

---

## Reference Files

**Backend Patterns:**
- `apps/api/src/domains/system/routes/onboarding.ts` — Current onboarding logic
- `apps/api/src/domains/banking/services/account.service.ts` — Service pattern
- `apps/api/src/domains/banking/routes/accounts.ts` — Route pattern

**Frontend Patterns:**
- `apps/web/src/app/onboarding/components/OnboardingWizard.tsx` — Current wizard structure
- `apps/web/src/stores/onboardingStore.ts` — Zustand state pattern
- `apps/web/src/components/dashboard/OnboardingHeroCard.tsx` — Current hero card (to replace)

**Design System:**
- `.claude/rules/design-aesthetic.md` — "Financial Clarity" aesthetic
- `brand/onboarding-user-flow.md` — Complete design spec
- `brand/inspirations/financial-clarity-final.html` — Visual reference

**Prisma Models:**
- `packages/db/prisma/schema.prisma` — OnboardingProgress model

---

## Edge Cases

**User abandons mid-wizard:**
- Zustand persists state to localStorage
- On return: Pre-fill form with saved data
- Show "Continue where you left off" message

**User dismisses hero card 3+ times:**
- Stop showing on dashboard (track in `dismissalCount`)
- Sidebar indicator remains visible
- Re-prompt only when feature needs missing data (e.g., invoice creation needs business details)

**API network error:**
- Show friendly error message
- Keep form data intact
- Retry button
- Log error to monitoring

**Business user skips address:**
- Allow initial skip (address optional in schema)
- Block invoice creation until address added
- Show prompt: "Add business address to create invoices"

**User changes account type mid-flow:**
- Clear account-type-specific fields
- Preserve common fields (name, phone, timezone)
- Recalculate completion checklist
- Allow via Back button

---

## Testing Strategy

**Backend Tests:**
- [ ] Unit tests for all new endpoints (Tasks 3-6)
- [ ] Validation tests (invalid data rejected)
- [ ] Tenant isolation tests (progress per tenant)
- [ ] Error response tests (correct codes returned)
- [ ] Progress calculation tests (40% → 100%)

**Frontend Tests:**
- [ ] Component tests for Welcome, Essential Info, Success steps
- [ ] Modal tests (Purpose, Business Details, Bank, Goals)
- [ ] Hero card tests (progress display, collapse/expand)
- [ ] Form validation tests (invalid inputs rejected)
- [ ] API integration tests (mock API responses)
- [ ] Responsive tests (mobile snapshots)

**E2E Tests (Optional - Phase 2):**
- [ ] Full onboarding flow (sign-up → dashboard)
- [ ] Purpose capture → dashboard personalization
- [ ] Bank connection → progress update
- [ ] Goals setup → 100% completion

**Manual QA Checklist:**
- [ ] Test all 3 account types (Personal, Business, Accountant)
- [ ] Test mobile (iPhone SE, iPad)
- [ ] Test desktop (1440px)
- [ ] Test form validation (all fields)
- [ ] Test error states (network error, validation error)
- [ ] Test progress tracking (40% → 100%)
- [ ] Test hero card (collapse, dismiss, CTAs)
- [ ] Test modals (Purpose, Business Details, Bank, Goals)

---

## Progress Tracking

### Phase 1: Backend API Updates (3-4 days)
- [ ] Task 1: Update Initialize Schema
- [ ] Task 2: Enhanced Error Responses
- [ ] Task 3: Progress Endpoint
- [ ] Task 4: Update Progress Endpoint
- [ ] Task 5: Skip Step Endpoint
- [ ] Task 6: Dismiss Card Endpoint
- [ ] Task 7: Tests for New Endpoints

### Phase 2: Frontend Core Redesign (4-5 days)
- [ ] Task 8: Update Zustand Store
- [ ] Task 9: Redesign Welcome Step
- [ ] Task 10: Redesign Essential Info Step
- [ ] Task 11: Create Input Components
- [ ] Task 12: Redesign Success Screen
- [ ] Task 13: Create Hero Card
- [ ] Task 14: Update Sidebar Indicator

### Phase 3: Post-Dashboard Modals (3-4 days)
- [ ] Task 15: Purpose Modal
- [ ] Task 16: Business Details Modal
- [ ] Task 17: Bank Connection Modal
- [ ] Task 18: Goals Setup Modal

### Phase 4: API Integration & Error Handling (2 days)
- [ ] Task 19: API Client Functions
- [ ] Task 20: Form Validation
- [ ] Task 21: Error Boundaries
- [ ] Task 22: Loading States

### Phase 5: Mobile Responsive & Polish (1-2 days)
- [ ] Task 23: Mobile Responsive
- [ ] Task 24: Accessibility Audit
- [ ] Task 25: Analytics Tracking
- [ ] Task 26: Smooth Transitions

---

## Timeline Estimate

**Total: 13-17 days (2.5-3.5 weeks)**

**By Role:**
- Backend: 3-4 days (Phase 1)
- Frontend: 10-13 days (Phases 2-5)

**Can parallelize:**
- Backend Phase 1 + Frontend Phase 2 (Tasks 8-12) can run simultaneously
- Tasks 13-14 (Hero Card, Sidebar) can run while modals (Tasks 15-18) are built

**Critical Path:**
- Backend endpoints (Tasks 1-6) → Frontend API integration (Task 19)
- Hero Card (Task 13) → Modals (Tasks 15-18) depend on progress system

---

## Deployment Strategy

**Phase 1: Backend Deploy**
1. Deploy backend API updates (Tasks 1-7)
2. Run API tests in staging
3. Verify error responses match spec

**Phase 2: Frontend Deploy (Feature Flag)**
1. Deploy frontend behind feature flag (`ENABLE_NEW_ONBOARDING=true`)
2. Test in staging with real backend
3. QA all 3 account types
4. Enable for 10% of users (A/B test)

**Phase 3: Rollout**
1. Monitor completion rate, abandonment, time-to-dashboard
2. Fix any issues found
3. Increase to 50%, then 100%
4. Remove old onboarding code

**Rollback Plan:**
- Feature flag toggles back to old flow
- Backend endpoints backwards-compatible (new fields optional)

---

## Post-Launch Metrics

**Track in first 30 days:**
- Wizard completion rate (target: ≥ 95%)
- Time to dashboard (target: ≤ 90s, goal: 60s)
- Error rate (target: ≤ 2%)
- 7-day full completion rate (target: ≥ 60%)
- Hero card dismissal rate (target: ≤ 20%)
- Mobile vs desktop completion (target: ≥ 85% mobile)

**Analytics Setup:**
```typescript
// Example event
analytics.track('Onboarding Started', {
  accountType: 'business',
  source: 'signup', // or 'referral'
  timestamp: new Date().toISOString()
})
```

---

## Next Steps

1. **Review Plan:** User approves plan
2. **Backend First:** Start Phase 1 (Tasks 1-7) - 3-4 days
3. **Frontend Core:** Start Phase 2 (Tasks 8-14) - 4-5 days (can overlap with backend)
4. **Modals:** Build Phase 3 (Tasks 15-18) - 3-4 days
5. **Integration:** Complete Phase 4 (Tasks 19-22) - 2 days
6. **Polish:** Final Phase 5 (Tasks 23-26) - 1-2 days
7. **QA:** Test all flows, fix bugs - 2 days
8. **Deploy:** Feature flag rollout - 1 week monitoring

**Total Calendar Time:** ~3-4 weeks (with 1-2 developers, tasks parallelized)

---

_Plan ready for execution. Run `/processes:work` to begin implementation._