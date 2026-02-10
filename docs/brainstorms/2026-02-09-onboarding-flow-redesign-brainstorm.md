# Onboarding Flow Redesign - Brainstorm

**Date:** 2026-02-09
**Status:** Brainstormed
**Related:**
- Existing: `apps/api/src/domains/system/routes/onboarding.ts`
- Existing: `apps/web/src/app/onboarding/`
- Design: `docs/design-system/04-workflows/onboarding-*.md`

---

## Problem Statement

Current onboarding is **too linear and rigid**:
- Collects all info upfront before dashboard access
- No flexibility to skip and return later
- Doesn't leverage design system's glass morphism components
- Missing completion tracking in dashboard/sidebar
- No support for progressive disclosure based on account type

**Goal:** Create a **zen, minimal onboarding** that gets users to dashboard fast while guiding them to complete setup progressively.

---

## User Needs

**Solo entrepreneurs need:**
1. **Fast time-to-value** - See dashboard in 60-90 seconds, not 5-10 minutes
2. **Flexibility** - Skip optional steps (bank connection, goals) and complete later
3. **Clear guidance** - Know what's incomplete and why it matters
4. **Beautiful UX** - Showcase glass morphism design system, feel premium
5. **Smart nudges** - Contextual prompts when features need setup (not nagging)

**Business Context:**
- Personal accounts: Simpler flow, focus on personal finance goals
- Business accounts: Need tax ID, address, industry data eventually
- Accountant accounts: Multi-client management, different needs

---

## Proposed Approach: **Hybrid - Minimal Entry + Smart Completion**

Blend of:
- **Option 1 (Progressive Smart Onboarding)**: Dashboard card, sidebar indicator, optional steps
- **Option 3 (Minimal + In-App Tours)**: Fast wizard, contextual prompts

### Core Philosophy

> "Get to dashboard in 60 seconds. Complete setup when ready, guided by smart nudges."

---

## Key Features

### 1. Minimal Wizard (60-90 seconds)

**Step 1: Welcome + Account Type Selection**
- Visual: 3 large cards (Personal, Business, Accountant)
- Glass morphism design
- Sets context for entire flow

**Step 2: Essential Info (Single Page Form)**
- Full Name
- Phone Number
- Time Zone (auto-detect with override)
- Entity Name (e.g., "John's Consulting")
- Country (dropdown, top countries first)
- Currency (auto-populated from country, editable)

**Design:**
- Single GlassCard, centered, max-width 600px
- All fields on one page (reduces clicks)
- Progress dots at top (not bar - more zen)
- Calm gradient background
- InputGlass components
- ButtonGlass for submit

**Step 3: Completion**
- Success animation (checkmark + confetti)
- "Welcome to Akount!" message
- Auto-redirect to dashboard in 2 seconds

---

### 2. Dashboard Hero Card (Smart Nudge)

**When:** User completes minimal wizard but hasn't finished all steps

**Design:**
```
┌─────────────────────────────────────────────────┐
│  🎯 Complete Your Setup                    [×]  │
│                                                 │
│     ●●●○○                                      │
│     60%                                        │
│                                                 │
│  ✓ Basic information                           │
│  ✓ Entity setup                                │
│  ⏳ Business details (Tax ID, Address)         │
│  ⏳ Connect your bank account                   │
│  ⏳ Set goals & budget                          │
│                                                 │
│  [Continue Setup →]  [Skip for now]           │
└─────────────────────────────────────────────────┘
```

**Component:** GlassCard with circular progress ring (recharts PieChart)
**Position:** Top of dashboard, hero position
**Behavior:**
- Expandable checklist (click to expand/collapse)
- Dismissible with [×] (reappears after 24 hours)
- "Skip for now" hides for 7 days
- Auto-hides when 100% complete

---

### 3. Sidebar Progress Indicator

**Design:**
```
┌──────────────┐
│  JD          │  ← User Avatar
│  ────────    │  ← Mini progress bar (60% filled)
│  60%         │  ← Percentage text (small, muted)
└──────────────┘
```

**Behavior:**
- Color-coded:
  - 🟡 Yellow: 0-79% complete
  - 🟢 Green: 80-100% complete
- Tooltip on hover: "3 of 5 setup steps complete"
- Click opens completion modal (mini wizard for remaining steps)
- Hidden when 100% complete

---

### 4. Contextual In-App Prompts

**Banking Section Empty State:**
```
┌─────────────────────────────────────────┐
│  Connect Your First Bank Account       │
│                                         │
│  Securely link your bank to:           │
│  • Auto-import transactions            │
│  • Track real-time balances            │
│  • Enable smart reconciliation         │
│                                         │
│  [Connect with Plaid →] [Add Manually] │
│                                         │
│  Or [Skip for now]                     │
└─────────────────────────────────────────┘
```

**Goals & Budgets Section:**
```
┌─────────────────────────────────────────┐
│  Set Your Financial Goals              │
│                                         │
│  Track progress toward:                │
│  • Revenue targets (Business)          │
│  • Savings goals (Personal)            │
│  • Expense budgets (Both)              │
│                                         │
│  [Create Your First Goal →]           │
└─────────────────────────────────────────┘
```

**First Invoice Creation (Business):**
- Modal prompt: "⚠️ Missing Business Details"
- Message: "To create professional invoices, we need your business address and tax ID."
- Actions: [Complete Setup] [Add Later]

---

### 5. Progressive Completion Steps

**Tracked Steps:**

| Step              | Required? | Personal | Business | Accountant |
|-------------------|-----------|----------|----------|------------|
| Basic Info        | ✅ Yes    | ✓        | ✓        | ✓          |
| Entity Setup      | ✅ Yes    | ✓        | ✓        | ✓          |
| Business Details  | ⚠️ Optional | -        | ✓        | ✓          |
| Bank Connection   | ⚠️ Optional | ✓        | ✓        | -          |
| Goals & Budgets   | ⚠️ Optional | ✓        | ✓        | -          |

**Completion Percentages:**
- Basic Info + Entity Setup: 40% (required baseline)
- Business Details: +20%
- Bank Connection: +20%
- Goals & Budgets: +20%
- **Total:** 100%

**Green Threshold:** 80% (required + most optional)

---

## Data Model Changes

### Tenant Model Extension

```prisma
model Tenant {
  // ... existing fields

  onboardingStatus       OnboardingStatus  @default(NEW)
  onboardingCompletedAt  DateTime?
  onboardingData         Json?  // Store flexible metadata
  onboardingStep         String?  // Current step if in progress

  // NEW: Track individual step completion
  onboardingProgress     OnboardingProgress?
}

model OnboardingProgress {
  id                String   @id @default(cuid())
  tenantId          String   @unique
  tenant            Tenant   @relation(fields: [tenantId], references: [id])

  completedSteps    String[] // ['basic_info', 'entity_setup', ...]
  skippedSteps      String[] // ['bank_connection']

  basicInfoComplete       Boolean @default(false)
  entitySetupComplete     Boolean @default(false)
  businessDetailsComplete Boolean @default(false)
  bankConnectionComplete  Boolean @default(false)
  goalsSetupComplete      Boolean @default(false)

  completionPercentage    Int     @default(0)

  lastNudgedAt      DateTime?
  dashboardCardDismissedAt DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### User Model Extension

```prisma
model User {
  // ... existing fields

  // NEW: Personal info from onboarding
  phoneNumber  String?
  timezone     String?  @default("America/Toronto")
}
```

### Entity Model Extension

```prisma
model Entity {
  // ... existing fields

  // NEW: Business details (optional, collected post-wizard)
  address            String?
  city               String?
  state              String?
  postalCode         String?
  taxId              String?  // EIN, VAT, etc.
  industry           String?  // "Consulting", "E-commerce", etc.
  businessSize       String?  // "SOLO", "2-10", "10+"
  fiscalYearStart    Int?     // 1-12 (January = 1)
}
```

---

## API Changes

### New Routes

**POST `/api/system/onboarding/update-progress`**
- Body: `{ step: string, completed: boolean }`
- Updates OnboardingProgress model
- Recalculates completionPercentage
- Returns updated progress

**GET `/api/system/onboarding/progress`**
- Returns current OnboardingProgress for user's tenant
- Used by dashboard card and sidebar indicator

**POST `/api/system/onboarding/skip-step`**
- Body: `{ step: string, skipDuration: number }` (7 days default)
- Marks step as skipped
- Sets lastNudgedAt to avoid immediate re-prompts

**POST `/api/system/onboarding/dismiss-card`**
- Records dashboardCardDismissedAt
- Card reappears after 24 hours (or on next login)

### Modified Routes

**POST `/api/system/onboarding/initialize`**
- Simplified: Only requires name, phone, timezone, entityName, country, currency
- Creates OnboardingProgress with 40% completion (basic + entity steps)
- Sets onboardingStatus = 'IN_PROGRESS'

**POST `/api/system/onboarding/complete`**
- Now optional - can be called multiple times to update different steps
- E.g., complete business details, then later complete bank connection
- Sets onboardingStatus = 'COMPLETED' only when 100%

---

## Frontend Components

### New Components

**`OnboardingHeroCard.tsx`** (Client Component)
- GlassCard with circular progress
- Expandable checklist
- Dismissible
- Fetches progress from API

**`SidebarProgressIndicator.tsx`** (Client Component)
- Mini progress bar
- Color-coded
- Tooltip
- Clickable (opens completion modal)

**`CompletionModal.tsx`** (Client Component)
- Modal overlay
- Shows remaining steps
- Links to complete each step
- Can complete steps inline or navigate to dedicated pages

**`BusinessDetailsForm.tsx`** (Client Component)
- Triggered from dashboard card or modal
- Collects: Address, Tax ID, Industry, Business Size
- Validates and updates Entity model

**`BankConnectionPrompt.tsx`** (Client Component)
- Plaid Link integration
- Manual account entry fallback
- Skip option

**`GoalsSetupForm.tsx`** (Client Component)
- Simple form: Goal Type (Revenue, Savings, Expense), Target Amount, Date
- Creates first goal/budget
- Both personal and business accounts

### Modified Components

**`OnboardingWizard.tsx`**
- Simplified to 2 steps (Welcome + Essential Info)
- Single-page form for Step 2
- Glass morphism design
- Progress dots (not bar)

**`DashboardLayout.tsx`**
- Conditionally renders OnboardingHeroCard at top
- Only if completionPercentage < 100%

**`Sidebar.tsx`**
- Add SidebarProgressIndicator below user avatar
- Only if completionPercentage < 100%

---

## User Flows by Account Type

### Personal Account Flow

**Wizard:**
1. Welcome → Select "Personal"
2. Essential Info → Fill form
3. Dashboard ✓

**Dashboard Nudges:**
- ⏳ Connect bank (20%)
- ⏳ Set personal goals (20%)

**Completion:** 40% → 80% → 100%

**Time to Dashboard:** 60 seconds
**Full Completion Time:** ~5 minutes (if user completes all)

---

### Business Account Flow

**Wizard:**
1. Welcome → Select "Business"
2. Essential Info → Fill form
3. Dashboard ✓

**Dashboard Nudges:**
- ⏳ Business details (20%) - Address, Tax ID, Industry
- ⏳ Connect bank (20%)
- ⏳ Set business goals (20%)

**Completion:** 40% → 60% → 80% → 100%

**Time to Dashboard:** 60 seconds
**Full Completion Time:** ~8 minutes

---

### Accountant Account Flow

**Wizard:**
1. Welcome → Select "Accountant"
2. Essential Info → Fill form (professional profile)
3. Dashboard ✓

**Dashboard Nudges:**
- ⏳ Add first client entity
- ⏳ Set up firm billing (future)

**Time to Dashboard:** 60 seconds

---

## Visual Design Language

Following inspiration photos (TWISTY, Crextio, Financial Dashboard):

### Colors
- **Background:** Soft gradient (lavender → cream) - `bg-gradient-soft-purple`
- **Cards:** Glass morphism with backdrop blur
- **Progress:** Circular donut chart (like 36% in Financial Dashboard)
- **Accents:** Primary color (`hsl(var(--primary))`) for CTAs

### Typography
- **Headers:** Newsreader (from design system)
- **Body:** Manrope
- **Numbers/Percentages:** JetBrains Mono (monospace)

### Components
- **GlassCard** - Hero onboarding card, modals
- **ButtonGlass** - Primary CTAs
- **InputGlass** - Form inputs
- **CircularProgress** - Recharts PieChart (donut style)
- **Badge** - Completion status tags

### Animations
- Step transitions: Slide in/out (framer-motion)
- Progress bar: Spring animation on fill
- Checkboxes: Check animation
- Modal: Fade + scale in

---

## Constraints

1. **Multi-tenant Isolation:** All onboarding data scoped to tenantId
2. **Clerk Auth:** User name/email comes from Clerk, phone/timezone collected in onboarding
3. **Minimal Wizard Required:** basic_info + entity_setup must complete before dashboard
4. **Optional Steps Skippable:** business_details, bank_connection, goals_setup can be skipped indefinitely
5. **No Blocking:** Users can use app features even with incomplete onboarding (with contextual prompts)
6. **Plaid Integration:** Bank connection uses Plaid (Phase 2) or manual entry (Phase 1)
7. **Goals/Budgets Available for All:** Personal and Business accounts both get goal-setting features

---

## Edge Cases

### User abandons wizard mid-flow
- **Solution:** Zustand persist saves state, can resume on next login
- Show "Continue where you left off" on dashboard

### User dismisses dashboard card repeatedly
- **Solution:** After 3 dismissals, only show sidebar indicator
- Re-prompt if user tries feature that needs missing data

### User completes steps out of order
- **Solution:** Track completion per step, not sequentially
- Update percentage dynamically

### User has multiple entities (future)
- **Solution:** Onboarding per entity, track completion separately
- Dashboard card shows "Entity X needs setup"

### Plaid connection fails
- **Solution:** Fallback to manual bank entry
- Mark bank_connection as partial (50% of that step)

### User changes account type mid-onboarding
- **Solution:** Allow change, adjust totalSteps and checklist
- Preserve already-collected data

---

## Alternatives Considered

### Alternative 1: Upfront Complete Onboarding
**Why Not:** High friction, loses users during signup, doesn't align with "zen" philosophy

### Alternative 2: Pure In-App Tours (No Dashboard Card)
**Why Not:** Users feel lost, no clear completion tracking, fragments experience

### Alternative 3: Gamified Onboarding with Points/Badges
**Why Not:** Over-engineered for MVP, doesn't fit professional finance app tone

---

## Open Questions

- [ ] **Plaid Integration Timeline:** Phase 1 (manual only) or Phase 2 (Plaid Link)?
- [ ] **Goals/Budgets Data Model:** Separate table or part of Entity model?
- [ ] **Accountant Multi-Client:** How does onboarding work for managing multiple client entities?
- [ ] **Fiscal Year Start:** Ask during wizard or later in business details?
- [ ] **Dashboard Card Persistence:** Use Zustand or database (dismissedAt)?
- [ ] **Sidebar Progress Click Action:** Modal or navigate to `/onboarding/complete`?

---

## Success Metrics

**Primary:**
- Time to dashboard: < 90 seconds (target: 60s)
- Wizard completion rate: > 95%
- Full onboarding completion: > 60% within 7 days

**Secondary:**
- Dashboard card dismissal rate: < 20%
- Bank connection rate: > 40% within 14 days
- Goals setup rate: > 30% within 30 days

**UX:**
- User satisfaction (NPS): > 8/10 on onboarding experience
- Support tickets related to setup: < 5% of users

---

## Next Steps

1. **Create detailed implementation plan** → `/processes:plan onboarding-flow-redesign`
2. **Design mockups** → Figma screens for wizard steps, dashboard card, sidebar indicator
3. **Prototype circular progress component** → Test recharts PieChart styling
4. **Review with stakeholders** → Confirm approach and priorities

---

## Implementation Priority

**Phase 1 (This Sprint - MVP):**
- ✅ Minimal wizard (2 steps: Welcome + Essential Info)
- ✅ Dashboard hero card with checklist + circular progress
- ✅ Sidebar progress indicator
- ✅ OnboardingProgress model + API routes
- ✅ Basic completion tracking

**Phase 2 (Next Sprint):**
- ⏳ Business details modal/form
- ⏳ Bank connection flow (Plaid integration)
- ⏳ Goals & budgets setup form
- ⏳ Contextual in-app prompts

**Phase 3 (Future):**
- ⏳ Smart suggestions based on activity
- ⏳ Accountant-specific flows
- ⏳ Multi-entity onboarding support
- ⏳ Onboarding analytics dashboard

---

**Philosophy:** "Architecture for scale, implement for lean. Get to dashboard fast, complete when ready."
