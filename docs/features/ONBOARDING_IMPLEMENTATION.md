# Onboarding Wizard Implementation - Phase 1

**Date:** 2026-02-01
**Status:** Complete
**Related Plan:** `docs/brainstorms/2026-02-01-onboarding-wizard-brainstorm.md`

## Overview

Phase 1 of the onboarding wizard has been implemented, enabling new users to:
1. Automatically sync to the database via Clerk webhooks
2. Create a tenant and entity during guided setup
3. Access the dashboard without 404 errors
4. Have basic Chart of Accounts pre-generated

## What Was Built

### 1. Database Schema Updates
- **Files Modified:** `packages/db/prisma/schema.prisma`
- **Changes:**
  - Added `OnboardingStatus` enum (NEW, IN_PROGRESS, COMPLETED)
  - Added onboarding fields to `Tenant`:
    - `onboardingStatus` - tracks onboarding stage
    - `onboardingStep` - current step identifier
    - `onboardingData` - JSON for storing wizard state
    - `onboardingCompletedAt` - timestamp when complete
  - Added setup fields to `Entity`:
    - `fiscalYearStart` - month when fiscal year starts (1-12)
    - `industryCode` - industry classification (optional)
    - `coaTemplateUsed` - which COA template was used (optional)
    - `setupCompletedAt` - timestamp when entity setup complete

**Migration Required:** Run `npx prisma migrate dev --name add_onboarding_tracking` in `packages/db`

### 2. Clerk Webhook Handler
- **File:** `apps/web/src/app/api/webhooks/clerk/route.ts`
- **Purpose:** Automatically creates User records when Clerk fires user.created event
- **Features:**
  - Verifies webhook signature using svix library
  - Handles race conditions (duplicate event prevention)
  - Logs all operations for debugging
  - Handles errors gracefully

**Setup Steps:**
1. Install svix: `npm install svix`
2. Get webhook secret from Clerk Dashboard
3. Add to `.env`: `CLERK_WEBHOOK_SECRET=whsec_xxxxx`
4. Configure webhook endpoint in Clerk Dashboard:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
   - Events: `user.created`
   - For local dev: Use ngrok tunnel

### 3. Middleware Redirect Logic
- **File:** `apps/web/src/middleware.ts`
- **Purpose:** Redirects users without tenant to onboarding
- **Logic:**
  - Checks if user has any TenantUser membership
  - Redirects to `/onboarding` if no membership exists
  - Skips check for `/onboarding` and webhook routes
  - Uses Prisma query with tenant relationship check

### 4. Zustand Store
- **File:** `apps/web/src/stores/onboardingStore.ts`
- **Purpose:** Client-side state management for wizard
- **Features:**
  - Persists to localStorage with versioning
  - Tracks current step and total steps (adjusts based on account type)
  - Stores form data (entity name, type, country, currency, fiscal year)
  - Stores API response (tenantId, entityId)
  - Provides actions for navigation and state updates

**State Shape:**
```typescript
interface OnboardingState {
  currentStep: number
  totalSteps: number
  accountType: 'personal' | 'business' | 'accountant' | null
  entityName: string
  entityType: EntityType | null
  country: string
  currency: string
  fiscalYearStart: number | null
  tenantId: string | null
  entityId: string | null
}
```

### 5. API Endpoints
- **File:** `apps/api/src/routes/onboarding.ts`
- **Registered:** In `apps/api/src/index.ts` with `/api` prefix

**Endpoints:**

#### POST /api/onboarding/initialize
Creates tenant and entity during onboarding.

**Request:**
```json
{
  "accountType": "personal|business|accountant",
  "entityName": "Business Name",
  "entityType": "PERSONAL|CORPORATION|SOLE_PROPRIETORSHIP|PARTNERSHIP|LLC",
  "country": "CA",
  "currency": "CAD"
}
```

**Response:**
```json
{
  "success": true,
  "tenantId": "...",
  "entityId": "...",
  "message": "Onboarding initialized successfully"
}
```

**Features:**
- Creates tenant in TRIAL plan with FREE tier
- Creates TenantUser membership with OWNER role
- Creates initial entity with country and currency
- Determines region from country code
- Sets onboarding status to IN_PROGRESS
- Stores account type in onboardingData JSON

#### POST /api/onboarding/complete
Completes onboarding, finalizes setup.

**Request:**
```json
{
  "tenantId": "...",
  "entityName": "...",
  "entityType": "...",
  "country": "CA",
  "currency": "CAD",
  "fiscalYearStart": 1
}
```

**Response:**
```json
{
  "success": true,
  "tenantId": "...",
  "entityId": "...",
  "message": "Onboarding completed successfully"
}
```

**Features:**
- Updates tenant onboardingStatus to COMPLETED
- Updates entity with fiscalYearStart
- Creates FiscalCalendar for current year
- Creates 12 FiscalPeriods (monthly)
- Generates 6 core GL Accounts:
  - 1000 Bank Account (ASSET, DEBIT)
  - 1100 Accounts Receivable (ASSET, DEBIT)
  - 2000 Accounts Payable (LIABILITY, CREDIT)
  - 3000 Owner Equity (EQUITY, CREDIT)
  - 4000 Revenue (INCOME, CREDIT)
  - 5000 Expenses (EXPENSE, DEBIT)

#### GET /api/onboarding/status
Returns current onboarding status for user.

**Response:**
```json
{
  "status": "new|in_progress|completed",
  "tenantId": "...",
  "currentStep": "..."
}
```

### 6. UI Components

#### Onboarding Page
- **File:** `apps/web/src/app/onboarding/page.tsx`
- **Type:** Server Component
- **Features:** Renders wizard with Suspense boundary and loading fallback
- **Layout:** `apps/web/src/app/onboarding/layout.tsx`
  - Minimal layout (no sidebar)
  - Gradient background (slate to white)
  - Max width container

#### OnboardingWizard Client Component
- **File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
- **Type:** Client Component
- **Features:**
  - Orchestrates step flow
  - Validates step requirements
  - Handles authentication checks
  - Auto-redirects when complete
  - Displays progress indicator (if account type selected)
  - Shows error messages
  - Navigation buttons (Back/Next)

#### WelcomeStep Component
- **File:** `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx`
- **Purpose:** Account type selection
- **Options:**
  - Personal (Recommended): Freelancer/contractor (3 steps total)
  - Business: Company/corp (4 steps total)
  - Accountant: Multi-client (disabled for MVP, coming soon)
- **Features:**
  - Card-based UI with feature lists
  - Auto-advances to next step on selection
  - Status badges (Recommended, Coming Soon)

#### EntityDetailsStep Component
- **File:** `apps/web/src/app/onboarding/components/steps/EntityDetailsStep.tsx`
- **Purpose:** Collect business details
- **Fields:**
  - Entity Name (text input)
  - Entity Type (dropdown)
  - Country (dropdown: CA, US, GB, AU)
  - Currency (dropdown)
  - Fiscal Year Start (month selector, 12 buttons)
- **Features:**
  - Form validation
  - API integration (calls /api/onboarding/initialize)
  - Error handling and display
  - Loading state management
  - Stores response in Zustand

#### CompletionStep Component
- **File:** `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx`
- **Purpose:** Final setup and redirect
- **Features:**
  - Loading state with spinner
  - Checklist animation
  - Calls /api/onboarding/complete on mount
  - Auto-redirects to dashboard on success
  - Error handling with retry button
  - Clears Zustand state before redirect

#### ProgressIndicator Component
- **File:** `apps/web/src/app/onboarding/components/ProgressIndicator.tsx`
- **Features:**
  - Progress bar showing percentage
  - Step circle indicators (numbered or checkmark)
  - Step labels
  - Dynamically adjusts labels based on account type

### 7. Type Definitions
- **File:** `packages/types/src/index.ts`
- **Additions:**
  - `OnboardingAccountType` type
  - `OnboardingEntityType` type
  - `initializeOnboardingSchema` validation
  - `completeOnboardingSchema` validation
  - `onboardingStatusSchema` validation

## User Flow

### New User Signup (End-to-End)
1. User signs up via Clerk (`/sign-up`)
2. Clerk fires `user.created` webhook
3. Webhook handler creates User record in database
4. Clerk redirects to app (typically `/`)
5. Next.js authentication loads user
6. Middleware checks TenantUser membership
7. No membership found → redirect to `/onboarding`
8. Onboarding wizard renders:
   - Step 0: Welcome (account type selection)
   - Step 1: Entity Details (form submission)
   - Step 2: Completion (setup and redirect)
9. After completion, user is redirected to dashboard
10. Dashboard loads successfully with tenant/entity data

## Security Considerations

### Webhook Security
- ✅ Signature verification using Svix library
- ✅ Webhook secret stored in environment variable
- ✅ Race condition handling (duplicate event prevention)
- ✅ Rate limiting delegated to Clerk/Svix

### API Security
- ✅ Authentication required on all onboarding endpoints
- ✅ Tenant isolation: Verify user owns tenant before allowing updates
- ✅ Zod validation on all inputs
- ✅ Transaction safety: All multi-step operations use Prisma transactions
- ✅ Audit ready: All operations create AuditLog entries (via middleware)

### Data Protection
- ✅ No sensitive data in webhook payloads
- ✅ Passwords/tokens never logged
- ✅ User consent model (implicit via signup)
- ✅ GDPR-ready data structure (soft deletes, audit trails)

## Testing Checklist

### Webhook Testing
- [ ] Configure ngrok tunnel for local testing: `ngrok http 3000`
- [ ] Add ngrok URL to Clerk Dashboard webhook endpoint
- [ ] Add `CLERK_WEBHOOK_SECRET` to `.env` (from Clerk Dashboard)
- [ ] Sign up new user via Clerk
- [ ] Check server logs for webhook receipt
- [ ] Verify User record created in database (check via `SELECT * FROM "User"`)

### Onboarding Wizard Testing
- [ ] New user can see Welcome step with 3 account types
- [ ] Selecting "Personal" shows 3 total steps (progress bar correct)
- [ ] Selecting "Business" shows 4 total steps
- [ ] Entity Details form validates required fields
- [ ] Form submission creates tenant + entity in database
- [ ] Verify GL Accounts table has 6 core accounts created
- [ ] Verify FiscalCalendar created with correct year
- [ ] Verify 12 FiscalPeriods created for months
- [ ] Completion step shows loading animation
- [ ] Auto-redirect to dashboard after completion
- [ ] Dashboard loads without 404 errors
- [ ] Entity appears in EntitiesList component

### Error Handling
- [ ] Missing CLERK_WEBHOOK_SECRET → webhook returns 500
- [ ] Invalid webhook signature → webhook returns 400
- [ ] Unauthenticated API call → returns 401
- [ ] Missing required form fields → error message displayed
- [ ] API failure during initialize → error message shown
- [ ] Browser refresh during wizard → state persists from localStorage
- [ ] Back button works correctly
- [ ] Skip logic works for optional steps

## Deployment Notes

### Environment Variables Required
```bash
# Clerk configuration (already exists)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# NEW: Webhook secret from Clerk Dashboard
CLERK_WEBHOOK_SECRET=whsec_...

# Database (already exists)
DATABASE_URL=postgresql://...

# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000 # or production URL
```

### Database Migration
Before deploying to production:
```bash
cd packages/db
npx prisma migrate deploy
```

This applies all pending migrations including `add_onboarding_tracking`.

### Webhook Configuration
1. Go to Clerk Dashboard
2. Navigate to Webhooks section
3. Create new endpoint:
   - **URL:** `https://yourdomain.com/api/webhooks/clerk`
   - **Events:** Select `user.created`
   - **Secret:** Copy and add to `.env` as `CLERK_WEBHOOK_SECRET`

## Next Steps (Phase 2)

### COA Templates & Generation
- Create COA JSON templates for different entity types
- Implement in-memory caching for templates
- Add COA Review step for business accounts
- Track which template was used in Entity

### Enhanced Wizard Features
- Add bank connection optional step
- Add team member invitations
- Add opening balances entry
- Add QuickBooks import option

### Testing & Validation
- Add E2E tests for full signup flow
- Add unit tests for Zustand store
- Add integration tests for API endpoints
- Add webhook simulation tests

## Files Summary

### Created
- `apps/web/src/app/api/webhooks/clerk/route.ts` (webhook handler)
- `apps/web/src/stores/onboardingStore.ts` (Zustand store)
- `apps/web/src/app/onboarding/layout.tsx` (layout)
- `apps/web/src/app/onboarding/page.tsx` (main page)
- `apps/web/src/app/onboarding/components/OnboardingWizard.tsx` (wizard orchestrator)
- `apps/web/src/app/onboarding/components/ProgressIndicator.tsx` (progress bar)
- `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx` (step 0)
- `apps/web/src/app/onboarding/components/steps/EntityDetailsStep.tsx` (step 1)
- `apps/web/src/app/onboarding/components/steps/CompletionStep.tsx` (step 2)
- `apps/api/src/routes/onboarding.ts` (API endpoints)
- `docs/features/ONBOARDING_IMPLEMENTATION.md` (this file)

### Modified
- `packages/db/prisma/schema.prisma` (added onboarding fields)
- `apps/web/src/middleware.ts` (added onboarding redirect)
- `apps/api/src/index.ts` (registered onboarding routes)
- `packages/types/src/index.ts` (added onboarding schemas)
- `apps/web/package.json` (added svix dependency)

## Architecture Alignment

✅ **Multi-Tenancy:** All operations include tenantId, no cross-tenant access possible
✅ **Server-First:** Server components for layout/page, Client components for interactivity
✅ **Type Safety:** Full Zod validation + TypeScript types throughout
✅ **Error Handling:** Comprehensive error handling with user-friendly messages
✅ **Audit Ready:** Transactions ensure consistency, soft deletes preserve history
✅ **Security:** Webhook signature verification, input validation, auth checks
✅ **Separation of Concerns:** Clear boundaries between webhook, API, and UI layers
✅ **Database Design:** Uses existing patterns (cuid, timestamps, soft deletes)

---

**Implementation completed by Claude Code**
**Ready for: Testing → Deployment → Phase 2**
