# Full Flow Frontend Implementation Plan

**Created:** 2026-02-10
**Status:** Draft
**Brainstorm:** `docs/brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md`
**Prior Plan:** `docs/plans/2026-02-09-onboarding-flow-redesign.md`

## Overview

Wire the complete user journey end-to-end: Clerk signup → 2-step onboarding wizard → dashboard with real data → add entities/accounts → upload PDF/CSV bank statements → view extracted transactions. Apply the "Financial Clarity" dark-first design aesthetic to all pages. Backend APIs are 100% built (Phase 2 complete, 117 tests). This is frontend-only work + design polish.

## Success Criteria

- [ ] New user can sign up via Clerk and land on onboarding wizard in < 5 seconds
- [ ] Onboarding wizard completes in 2 steps (Welcome + Essential Info), calls `/api/system/onboarding/initialize`
- [ ] After onboarding, user sees dashboard with OnboardingHeroCard showing progress
- [ ] User can create entities from dashboard or System > Entities page
- [ ] User can create accounts linked to entities
- [ ] User can upload PDF/CSV at Money Movement > Import, transactions are extracted and visible
- [ ] Dashboard metrics reflect actual uploaded transaction data
- [ ] All pages use Financial Clarity aesthetic (dark surfaces, glass morphism, amber primary, proper typography)

## Architecture

Three parallel work streams (can be executed by separate agents):

```
Stream 1 (Agent 1): CORE FLOW
  Signup → Onboarding → Dashboard → Entity/Account CRUD

Stream 2 (Agent 2): IMPORT & TRANSACTIONS
  Upload PDF/CSV → Preview → Confirm → Transaction List

Stream 3 (Agent 3): DESIGN SYSTEM POLISH
  Apply Financial Clarity to all existing pages/components
```

---

## Stream 1: Core Flow (Agent 1)

### Task 1.1: Wire Onboarding Wizard to API
**Files:**
- `apps/web/src/app/onboarding/components/OnboardingWizard.tsx` (modify)
- `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx` (modify)
- `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx` (modify)
- `apps/web/src/lib/api/onboarding.ts` (create)
**What:** Create API client for onboarding endpoints. Wire EssentialInfoStep to POST `/api/system/onboarding/initialize` with { accountType, entityName, entityType, country, currency }. On success, redirect to `/overview`. Remove EntityDetailsStep (merge into EssentialInfo). Call POST `/api/system/onboarding/update-progress` after each step.
**Depends on:** none
**API endpoints used:**
- POST `/api/system/onboarding/initialize`
- POST `/api/system/onboarding/update-progress`
- GET `/api/system/onboarding/status`
**Success:** User completes 2-step wizard, tenant+entity created, redirected to dashboard.

### Task 1.2: Add Redirect Logic (Auth Guard)
**Files:**
- `apps/web/src/app/(dashboard)/layout.tsx` (modify)
- `apps/web/src/middleware.ts` (modify if exists, or create)
**What:** On dashboard load, check onboarding status via GET `/api/system/onboarding/status`. If status === 'new', redirect to `/onboarding`. If status === 'in_progress', redirect to `/onboarding` (resume). If status === 'completed', show dashboard normally.
**Depends on:** Task 1.1
**Success:** Unonboarded users can never reach dashboard; they always see wizard first.

### Task 1.3: Dashboard Hero Card + Progress Integration
**Files:**
- `apps/web/src/app/(dashboard)/overview/page.tsx` (modify)
- `apps/web/src/components/dashboard/OnboardingHeroCard.tsx` (modify)
- `apps/web/src/components/dashboard/CircularProgress.tsx` (modify)
- `apps/web/src/lib/api/onboarding.ts` (extend)
**What:** Fetch onboarding progress on dashboard load via GET `/api/system/onboarding/progress`. Display OnboardingHeroCard with CircularProgress showing completion %. Show checklist: Basic Info ✅, Entity Setup ✅, Business Details ❌, Bank Connection ❌, Goals ❌. Each incomplete item links to the relevant page/modal. Card is dismissible (POST `/api/system/onboarding/dismiss-card`).
**Depends on:** Task 1.2
**Success:** Dashboard shows progress card with accurate completion state.

### Task 1.4: Entity Creation Form
**Files:**
- `apps/web/src/app/(dashboard)/system/entities/page.tsx` (modify)
- `apps/web/src/components/entities/EntityFormSheet.tsx` (create)
- `apps/web/src/lib/api/entities.ts` (extend)
**What:** Create EntityFormSheet (slide-out panel, same pattern as AccountFormSheet). Fields: name, type (SOLE_PROPRIETORSHIP, LLC, CORPORATION, PARTNERSHIP, FREELANCER, OTHER), country, currency. On submit, POST to create entity via API. Also add "Add Entity" button on dashboard EntitiesList. Wire GET `/api/system/entities` to list entities on dashboard.
**Depends on:** Task 1.1
**API note:** Need to check if POST entity endpoint exists. If not, backend stub is needed (flag for Agent 2).
**Success:** User can create entities from dashboard or System > Entities page.

### Task 1.5: Account Creation Flow
**Files:**
- `apps/web/src/components/accounts/AccountFormSheet.tsx` (modify/verify)
- `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` (modify)
**What:** Ensure AccountFormSheet works end-to-end: entity selector dropdown (from fetched entities), account name, type (BANK, CREDIT_CARD, INVESTMENT, LOAN, MORTGAGE, OTHER), currency, institution. POST to `/api/banking/accounts`. After creation, user can immediately upload statements for this account.
**Depends on:** Task 1.4
**Success:** User can create accounts linked to entities.

### Task 1.6: Dashboard Real Data Integration
**Files:**
- `apps/web/src/app/(dashboard)/overview/page.tsx` (modify)
- `apps/web/src/components/dashboard/DashboardMetrics.tsx` (modify)
- `apps/web/src/components/dashboard/EntitiesList.tsx` (modify)
- `apps/web/src/lib/api/dashboard.ts` (extend)
**What:** Wire DashboardMetrics to GET `/api/overview/dashboard/metrics`. Display real values: total balance, income this month, expenses this month, transaction count. Wire EntitiesList to show actual entities with account counts. Add entity filter dropdown. Show "No data yet" states when metrics are empty with CTAs to upload statements.
**Depends on:** Task 1.5
**Success:** Dashboard shows real financial data after statement upload.

---

## Stream 2: Import & Transactions (Agent 2)

### Task 2.1: Refine Import Upload Form
**Files:**
- `apps/web/src/components/import/ImportUploadForm.tsx` (modify)
- `apps/web/src/app/(dashboard)/banking/import/page.tsx` (modify)
**What:** Update ImportUploadForm to use the new simplified API endpoints:
- CSV: POST `/api/banking/imports/csv` with multipart form data
- PDF: POST `/api/banking/imports/pdf` with multipart form data
Require account selection BEFORE upload (dropdown of existing accounts from GET `/api/banking/accounts`). Show upload progress indicator. On success, display ImportPreviewTable with extracted transactions. Add "Confirm Import" button that finalizes the batch.
**Depends on:** none
**Success:** User can upload CSV or PDF, see preview of extracted transactions.

### Task 2.2: Import Preview & Confirmation
**Files:**
- `apps/web/src/components/import/ImportPreviewTable.tsx` (modify)
- `apps/web/src/components/import/ImportConfirmation.tsx` (create)
**What:** After upload, show ImportPreviewTable with: transaction count, duplicate count, date range, total amount. Table columns: Date, Description, Amount, Status (new/duplicate). Add "Confirm & Import" button. On confirm, transactions are committed. Show success message with link to "View Transactions" page.
**Depends on:** Task 2.1
**Success:** User can review and confirm imported transactions.

### Task 2.3: Transaction List with Real Data
**Files:**
- `apps/web/src/app/(dashboard)/banking/transactions/page.tsx` (modify)
- `apps/web/src/components/transactions/TransactionsListClient.tsx` (modify)
- `apps/web/src/components/transactions/TransactionsTable.tsx` (modify)
- `apps/web/src/components/transactions/TransactionsFilters.tsx` (modify)
**What:** Wire transaction list to GET `/api/banking/transactions` with filters. Filters: date range, account selector, category, search text. Table columns: Date, Description, Amount (green/red for income/expense), Account, Category, Source (MANUAL/CSV/PDF badge). Cursor pagination. Show "No transactions" empty state with CTA to import.
**Depends on:** Task 2.2
**Success:** All imported transactions visible in filterable, paginated list.

### Task 2.4: Import History Page Enhancement
**Files:**
- `apps/web/src/app/(dashboard)/banking/imports/page.tsx` (modify)
- `apps/web/src/components/import/ImportHistoryClient.tsx` (modify)
**What:** Wire import history to GET `/api/banking/imports`. Show table: File Name, Source Type (CSV/PDF badge), Status (color-coded), Date, Transaction Count, Actions. Click row → drill down to GET `/api/banking/imports/:id` showing all transactions from that batch. Add "Upload New" button linking to import page.
**Depends on:** Task 2.1
**Success:** User can see all past imports and drill into batch details.

### Task 2.5: Entity Creation API (Backend - if needed)
**Files:**
- `apps/api/src/domains/system/routes/entities.ts` (modify)
- `apps/api/src/domains/system/services/entity.service.ts` (modify)
**What:** Check if POST `/api/system/entities` exists. If not, create it:
- Schema: { name, type, country, currency }
- Service: Create entity with tenantId from context
- Route: POST with RBAC (OWNER, ADMIN)
**Depends on:** none
**Risk:** high (entity creation is foundation data)
**Success:** POST entity endpoint returns 201 with created entity.

---

## Stream 3: Design System Polish (Agent 3)

### Task 3.1: Dashboard Page — Financial Clarity
**Files:**
- `apps/web/src/app/(dashboard)/overview/page.tsx`
- `apps/web/src/components/dashboard/DashboardMetrics.tsx`
- `apps/web/src/components/dashboard/EntitiesList.tsx`
- `apps/web/src/components/dashboard/OnboardingHeroCard.tsx`
**What:** Apply Financial Clarity aesthetic:
- Page background: `bg-background` (maps to #09090F in dark)
- Stat cards: GlowCard with glass morphism, amber glow on hover
- Values: `font-mono` (JetBrains Mono), large size
- Labels: `font-sans` uppercase, 0.05em letter-spacing, muted color
- Trends: green (#34D399) for positive, red (#F87171) for negative
- OnboardingHeroCard: Glass card with amber accent border, CircularProgress in amber
- EntitiesList: GlowCard per entity, subtle glass borders
**Depends on:** none
**Success:** Dashboard looks like the Financial Clarity reference (dark, glassy, amber accents).

### Task 3.2: Sidebar — Financial Clarity
**Files:**
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/layout/SidebarProgressIndicator.tsx`
**What:** Apply:
- Background: bg-1 level (#0F0F17)
- Borders: rgba(255,255,255,0.06)
- Active item: glass-2 background + amber left border
- Hover: glass-1 background
- Section headers: uppercase, tiny, muted
- Progress indicator: amber fill bar
- Logo area: subtle amber glow
**Depends on:** none
**Success:** Sidebar matches Financial Clarity aesthetic.

### Task 3.3: Navbar — Financial Clarity
**Files:**
- `apps/web/src/components/layout/Navbar.tsx`
**What:** Apply:
- Background: glass (blur 16px, rgba white 0.025)
- Bottom border: rgba(255,255,255,0.06)
- Theme toggle: styled with glass hover
- Search input (if present): glass input style
**Depends on:** none
**Success:** Navbar is transparent glass on dark background.

### Task 3.4: Import Page — Financial Clarity
**Files:**
- `apps/web/src/components/import/ImportUploadForm.tsx`
- `apps/web/src/components/import/ImportPreviewTable.tsx`
- `apps/web/src/components/import/ImportHistoryClient.tsx`
**What:** Apply:
- Upload dropzone: glass border (dashed), amber highlight on drag-over
- File icon: amber colored
- Account selector: glass input style
- Preview table: glass card, glass header row, subtle row borders
- Status badges: dim background (green-dim for success, red-dim for error)
- Import history table: same glass table treatment
**Depends on:** none
**Success:** Import pages use glass morphism and Financial Clarity colors.

### Task 3.5: Transaction List — Financial Clarity
**Files:**
- `apps/web/src/components/transactions/TransactionsTable.tsx`
- `apps/web/src/components/transactions/TransactionsFilters.tsx`
**What:** Apply:
- Table: glass card container, glass header, subtle row hover
- Amount column: `font-mono`, green for income (#34D399), red for expense (#F87171)
- Category badges: colored dim backgrounds
- Source badges: glass dim (CSV in blue-dim, PDF in purple-dim)
- Filters: glass inputs, amber focus ring
- Empty state: glass card with illustration + CTA
**Depends on:** none
**Success:** Transaction list looks polished with Financial Clarity theme.

### Task 3.6: Onboarding Wizard — Financial Clarity
**Files:**
- `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
- `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx`
- `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`
- `apps/web/src/app/onboarding/components/ProgressIndicator.tsx`
**What:** Apply:
- Full-page dark background (bg-0 #09090F)
- Wizard card: centered, glass-2, max-w-lg
- Welcome step: Newsreader heading, amber accent, subtle glow orb animation
- Form inputs: glass input style with amber focus rings
- Progress indicator: amber dots/line
- "Get Started" button: solid amber (#F59E0B), 8px radius
- Account type cards: glass cards with hover lift
**Depends on:** none
**Success:** Onboarding wizard is a beautiful, dark, glassy experience.

### Task 3.7: Account Pages — Financial Clarity
**Files:**
- `apps/web/src/components/accounts/AccountCard.tsx`
- `apps/web/src/components/accounts/AccountsList.tsx`
- `apps/web/src/components/accounts/AccountFormSheet.tsx`
- `apps/web/src/components/accounts/AccountDetailHeader.tsx`
**What:** Apply:
- Account cards: GlowCard, glass, balance in font-mono, account type badge
- Account form sheet: glass background, glass inputs, amber submit button
- Account detail header: glass card, large balance display
- "Add Account" button: ghost or dim variant
**Depends on:** none
**Success:** Account pages match Financial Clarity.

### Task 3.8: Entity & System Pages — Financial Clarity
**Files:**
- `apps/web/src/app/(dashboard)/system/entities/page.tsx`
- Various system page stubs
**What:** Apply Financial Clarity to entities page (glass cards per entity, add entity button). Light-touch styling on other system pages (they're stubs for now).
**Depends on:** none
**Success:** System pages have consistent dark glass aesthetic.

---

## Reference Files

- `brand/inspirations/financial-clarity-final.html` — Canonical design reference
- `.claude/rules/design-aesthetic.md` — Design token spec
- `packages/design-tokens/src/css-variables.css` — CSS variable definitions
- `apps/web/src/app/globals.css` — Tailwind theme + glass utilities
- `apps/api/src/domains/system/routes/onboarding.ts` — Onboarding API
- `apps/api/src/domains/banking/routes/imports.ts` — Import API
- `apps/api/src/domains/banking/routes/account.ts` — Account API
- `docs/plans/2026-02-09-onboarding-flow-redesign.md` — Onboarding design decisions

## Edge Cases

- **No entities yet:** Dashboard shows "Create your first entity" CTA
- **No accounts:** Import page shows "Create an account first" before upload
- **Upload fails:** Show error with retry button, don't lose file selection
- **Empty transactions:** Transaction list shows illustration + "Upload your first statement" CTA
- **Onboarding abandoned:** User returns → check status → resume where left off
- **Multiple entities:** Dashboard entity filter, account selector scoped to entity

## Testing Strategy

- Manual E2E: Full signup → onboard → upload → view flow
- Visual: Screenshot each page in dark mode, compare to Financial Clarity reference
- API integration: Verify all fetch calls handle loading/error states
- Responsive: Test sidebar collapse, mobile upload form

## Agent Instructions

### Agent 2: Import & Transactions (Stream 2)
```
Execute Tasks 2.1–2.5 from docs/plans/2026-02-10-full-flow-frontend.md.

Context:
- Backend APIs are 100% built. Use these endpoints:
  - POST /api/banking/imports/csv (multipart, requires accountId)
  - POST /api/banking/imports/pdf (multipart, requires accountId)
  - GET /api/banking/imports (list batches, cursor pagination)
  - GET /api/banking/imports/:id (batch details with transactions)
  - GET /api/banking/transactions (list with filters)
  - GET /api/banking/accounts (for account dropdown)
- Existing components to modify: ImportUploadForm, ImportPreviewTable, ImportHistoryClient, TransactionsTable
- API client pattern: use apiClient from apps/web/src/lib/api/client.ts
- Apply Financial Clarity design (glass inputs, amber accents, dark surfaces)
- All amounts are integer cents (1050 = $10.50), format with Intl.NumberFormat
- Check if POST /api/system/entities exists; if not, add it (Task 2.5)

Read these files first:
- apps/web/src/lib/api/client.ts (API client pattern)
- apps/web/src/components/import/ImportUploadForm.tsx (existing upload form)
- apps/api/src/domains/banking/routes/imports.ts (API contract)
- .claude/rules/design-aesthetic.md (design tokens)
- .claude/rules/frontend-conventions.md (component patterns)
```

### Agent 3: Design System Polish (Stream 3)
```
Execute Tasks 3.1–3.8 from docs/plans/2026-02-10-full-flow-frontend.md.

Context:
- Apply "Financial Clarity" aesthetic to ALL frontend pages.
- Canonical reference: brand/inspirations/financial-clarity-final.html
- Design spec: .claude/rules/design-aesthetic.md

Key tokens (dark mode):
- Backgrounds: #09090F (bg-0), #0F0F17 (bg-1), #15151F (bg-2), #1A1A26 (bg-3), #22222E (bg-4)
- Glass: rgba(255,255,255, 0.025/0.04/0.06) with blur(16px)
- Borders: rgba(255,255,255, 0.06/0.09/0.13)
- Primary: #F59E0B (amber-500), hover: #FBBF24
- Text: #F0F0F5 primary, #9494A8 secondary, #5C5C72 muted
- Semantic (dark): green #34D399, red #F87171, blue #60A5FA, purple #A78BFA
- Typography: Newsreader (headings), Manrope (body), JetBrains Mono (numbers)

CSS utilities available: `glass`, `glass-2`, `glass-3`, `glow-primary`, `glow-success`, `glow-danger`, `glow-track`
Component: <GlowCard variant="glass"> for interactive cards

Rules:
- No solid white backgrounds in dark mode
- No flat gray borders — use rgba white with low opacity
- No 500-level semantic colors on dark backgrounds — use 400-level
- Button radius: 8px (rounded-lg)
- Card radius: 14px
- All monetary values in font-mono
- Labels: uppercase, tiny, letter-spacing 0.05em

Read these files first:
- .claude/rules/design-aesthetic.md
- apps/web/src/app/globals.css (theme tokens + glass utilities)
- packages/design-tokens/src/css-variables.css
- apps/web/src/components/ui/glow-card.tsx
- brand/inspirations/financial-clarity-final.html (if available)
```

## Progress

- [ ] Task 1.1: Wire Onboarding Wizard to API
- [ ] Task 1.2: Add Redirect Logic (Auth Guard)
- [ ] Task 1.3: Dashboard Hero Card + Progress Integration
- [ ] Task 1.4: Entity Creation Form
- [ ] Task 1.5: Account Creation Flow
- [ ] Task 1.6: Dashboard Real Data Integration
- [ ] Task 2.1: Refine Import Upload Form
- [ ] Task 2.2: Import Preview & Confirmation
- [ ] Task 2.3: Transaction List with Real Data
- [ ] Task 2.4: Import History Page Enhancement
- [ ] Task 2.5: Entity Creation API (if needed)
- [ ] Task 3.1: Dashboard — Financial Clarity
- [ ] Task 3.2: Sidebar — Financial Clarity
- [ ] Task 3.3: Navbar — Financial Clarity
- [ ] Task 3.4: Import Page — Financial Clarity
- [ ] Task 3.5: Transaction List — Financial Clarity
- [ ] Task 3.6: Onboarding Wizard — Financial Clarity
- [ ] Task 3.7: Account Pages — Financial Clarity
- [ ] Task 3.8: Entity & System Pages — Financial Clarity
