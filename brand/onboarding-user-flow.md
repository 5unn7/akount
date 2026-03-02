# Account Onboarding User Flow — Akount

> **Purpose:** Complete user flow for account onboarding from sign-up to dashboard
> **Use with:** [ai-design-prompt.md](./ai-design-prompt.md) (Page Context)
> **Status:** Ready for design

---

## Flow Overview

**Philosophy:** "Get to dashboard in 60 seconds. Complete setup when ready, guided by smart nudges."

**Two Flow Options:**

### Option A: Minimal First (Recommended - Current)
```
Sign Up (Clerk) → Account Type → Essential Info → Dashboard → Progressive Completion
     ↓                ↓              ↓              ↓              ↓
   0 sec          10 sec         60 sec      immediate      ongoing
```
**Pros:** Fastest time-to-value, lower abandonment, flexible completion
**Cons:** Requires post-dashboard nudging, some features blocked until complete

### Option B: Comprehensive Upfront (Alternative)
```
Sign Up → Account Type → Essential Info → Purpose → Bank Connection → Dashboard
     ↓         ↓              ↓            ↓            ↓              ↓
   0 sec    10 sec         60 sec       90 sec      120 sec      2 min
```
**Pros:** More context upfront, better personalization, fewer interruptions later
**Cons:** Higher abandonment risk, longer to value, assumes bank ready

**Recommended Approach:** Option A (minimal first) with smart nudging based on user intent.

**Completion Levels:**
- **Minimal (40%)**: Basic info + Entity setup → Dashboard access
- **Good (60%)**: + Purpose/goals captured + Business details (if biz)
- **Better (80%)**: + Bank connection
- **Complete (100%)**: + Full setup verified

**Time to Value:** 60 seconds to dashboard (Option A), 5-8 minutes to 100% completion

---

## User Journey Map

### Personal Account Journey

**Option A: Minimal First (Recommended)**
```
1. Sign Up (Clerk) → Email verified
   ↓
2. Welcome Screen → Select "Personal" account type
   ↓
3. Essential Info → Name, phone, address, timezone, currency
   ↓
4. Success Animation → "Welcome to Akount!"
   ↓
5. Dashboard → Hero card shows 40% complete
   ↓
6. Dashboard Card Nudge → "Tell us your goal" (PURPOSE CAPTURE)
   ↓
7. Purpose Modal → "What brings you to Akount?"
   - Track personal expenses
   - Save for a goal
   - Manage investments
   - Tax preparation
   → Saves intent, shows 50% complete
   ↓
8. Dashboard Card Nudge → "Connect bank" (optional)
   ↓
9. Connect Bank → Plaid or manual entry → 70% complete
   ↓
10. Dashboard Card Nudge → "Set your first goal" (optional)
   ↓
11. Goals Setup → Create savings goal based on purpose → 90% complete
   ↓
12. Dashboard → Hero card removed, sidebar indicator green (100%)
```

**Option B: Comprehensive Upfront**
```
1. Sign Up (Clerk) → Email verified
   ↓
2. Welcome Screen → Select "Personal" account type
   ↓
3. Essential Info → Name, phone, address, timezone, currency
   ↓
4. Purpose Screen → "What brings you to Akount?"
   - Track personal expenses
   - Save for a goal
   - Manage investments
   - Tax preparation
   → Determines dashboard layout & features shown
   ↓
5. Bank Connection → "Connect your primary account"
   - Plaid Link OR Manual entry
   - Can skip (but encouraged)
   ↓
6. Success Animation → "Welcome to Akount!"
   ↓
7. Dashboard → Shows 70% complete (if bank connected) or 50% (if skipped)
   ↓
8. Progressive completion continues...
```

### Business Account Journey

**Option A: Minimal First (Recommended)**
```
1. Sign Up (Clerk) → Email verified
   ↓
2. Welcome Screen → Select "Business" account type
   ↓
3. Essential Info → Personal name, phone, business legal name, country, currency
   ↓
4. Success Animation → "Welcome to Akount!"
   ↓
5. Dashboard → Hero card shows 30% complete
   ↓
6. Dashboard Card Nudge → "Complete business profile" (CRITICAL for invoicing)
   ↓
7. Business Details Modal → Address, Tax ID, Industry, Entity Type → 50% complete
   ↓
8. Dashboard Card Nudge → "Why are you using Akount?" (PURPOSE CAPTURE)
   ↓
9. Purpose Modal → "What's your main goal?"
   - Create professional invoices
   - Track business expenses
   - Prepare for tax season
   - Get financial insights
   - Manage cash flow
   → Saves intent, personalizes dashboard → 60% complete
   ↓
10. Dashboard Card Nudge → "Connect business bank account"
   ↓
11. Connect Bank → Plaid or manual entry → 80% complete
   ↓
12. Dashboard Card Nudge → "Set your revenue goal"
   ↓
13. Goals Setup → Quarterly or annual revenue target → 100% complete
   ↓
14. Dashboard → Hero card removed, sidebar indicator green
```

**Option B: Comprehensive Upfront**
```
1. Sign Up (Clerk) → Email verified
   ↓
2. Welcome Screen → Select "Business" account type
   ↓
3. Essential Info → Personal + Business legal name, country, currency
   ↓
4. Business Details → Address, Tax ID, Industry, Entity Type (required)
   ↓
5. Purpose Screen → "Why are you using Akount?"
   - Create professional invoices
   - Track business expenses
   - Prepare for tax season
   - Get financial insights
   - Manage cash flow
   → Determines features to highlight
   ↓
6. Bank Connection → "Connect your business account"
   - Plaid Link OR Manual entry
   - Can skip but prompted more aggressively
   ↓
7. Success Animation → "Welcome to Akount!"
   ↓
8. Dashboard → Shows 80% complete (all critical data collected)
   ↓
9. Progressive completion continues (goals, team members, etc.)
```

### Accountant Account Journey

**Option A: Minimal First (Recommended)**
```
1. Sign Up (Clerk) → Email verified
   ↓
2. Welcome Screen → Select "Accountant" account type
   ↓
3. Essential Info → Personal name, phone, firm name (if applicable), timezone, country
   ↓
4. Success Animation → "Welcome to Akount!"
   ↓
5. Dashboard → Hero card shows 30% complete
   ↓
6. Dashboard Card Nudge → "Tell us about your practice"
   ↓
7. Purpose Modal → "What services do you provide?"
   - Multi-select: Bookkeeping, Tax prep, Advisory, Payroll, CFO services
   → Determines features and client templates
   ↓
8. Dashboard Card Nudge → "Add your first client"
   ↓
9. Client Entity Setup → Create client entity (wizard) → 70% complete
   ↓
10. Dashboard Card Nudge → "Set up your billing"
   ↓
11. Billing Setup → Hourly rate or flat fee structure → 100% complete
   ↓
12. Dashboard → Hero card removed, client-centric view enabled
```

**Option B: Comprehensive Upfront**
```
1. Sign Up (Clerk) → Email verified
   ↓
2. Welcome Screen → Select "Accountant" account type
   ↓
3. Essential Info → Personal name, phone, firm name, firm address, timezone
   ↓
4. Practice Details → Services provided (multi-select), typical client size
   ↓
5. Client Import → "Do you have existing clients?"
   - Import CSV OR Add first client manually OR Skip (demo client created)
   ↓
6. Success Animation → "Welcome to Akount!"
   ↓
7. Dashboard → Shows client list, 80% complete
   ↓
8. Progressive completion continues (billing setup, team members)
```

---

## Screen Contexts

### Screen 1: Welcome / Account Type Selection

**Purpose:** Determine user's primary use case and set context for entire flow

**User Goal:** Choose account type that matches their needs

**Entry Points:**
- From Clerk sign-up completion (email verified)
- Direct navigation from sign-in (if onboarding incomplete)

**Key Data Displayed:**
- 3 account type cards (Personal, Business, Accountant)
- Brief description of each type
- Icon representing each type

**Primary Actions:**
- Select Personal → Proceeds to Essential Info (personal variant)
- Select Business → Proceeds to Essential Info (business variant)
- Select Accountant → Proceeds to Essential Info (accountant variant)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Welcome to Akount                      │
│     Let's set up your account in 60 seconds         │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │     👤    │  │     🏢    │  │     📊    │      │
│  │           │  │           │  │           │      │
│  │ Personal  │  │ Business  │  │Accountant │      │
│  │           │  │           │  │           │      │
│  │ Manage    │  │ Full      │  │ Manage    │      │
│  │ personal  │  │ business  │  │ multiple  │      │
│  │ finances  │  │ accounting│  │ client    │      │
│  │ and track │  │ and       │  │ entities  │      │
│  │ expenses  │  │ invoicing │  │           │      │
│  └───────────┘  └───────────┘  └───────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Background:** Soft gradient (lavender → cream) — `bg-gradient-to-br from-purple-50 via-white to-orange-50`
- **Cards:** GlassCard component with hover effects
  - Default: `border-slate-200 bg-white/80`
  - Hover: `scale-105 border-primary/50`
  - Selected: `border-primary bg-primary/5 shadow-md`
- **Icons:** 5xl emoji (48px), centered
- **Title:** text-xl font-semibold
- **Description:** text-sm text-muted-foreground
- **Grid:** 1 column mobile, 3 columns desktop (768px+ breakpoint)
- **Spacing:** gap-6 between cards, p-8 inside cards
- **Border radius:** rounded-2xl (16px)

**Interaction:**
- Click card → Highlight with primary border → Auto-advance to next step (500ms delay)
- Hover → Scale 1.05, border brightens
- No "Next" button needed — clicking card advances flow

**States:**
- Default: All cards neutral
- Hover: Hovered card lifts and glows
- Selected: Card highlighted, 500ms pause, then slide transition to next screen

**Special Considerations:**
- Account type stored in Zustand onboardingStore
- Can't proceed without selection (no skip)
- Selection determines which fields appear in Essential Info step
- Sets context for entire onboarding experience

**Related Screens:**
- Next: Essential Info Step (variant depends on selection)
- Exit: Can't go back (first step)

---

### Screen 2: Essential Info Step

**Purpose:** Collect minimum required information to create tenant and entity

**User Goal:** Provide basic details quickly to access dashboard

**Entry Points:**
- From Welcome screen after account type selection

**Key Data Displayed:**
- Form fields (6 total)
- Progress indicator at top (Step 2 of 2)
- Account type context (visual reminder of selection)

**Primary Actions:**
- Back → Returns to Welcome screen (can change account type)
- Complete Setup → Validates form, calls API, creates tenant/entity, navigates to Dashboard

**Field List:**

**Universal Fields (All Account Types):**
1. **Full Name** (text input, required)
   - Label: "Full Name"
   - Placeholder: "John Doe"
   - Validation: min 1 character

2. **Phone Number** (tel input, required)
   - Label: "Phone Number"
   - Placeholder: "+1 (555) 123-4567"
   - Validation: min 10 characters
   - Format: Auto-format with country code

3. **Time Zone** (select dropdown, required)
   - Label: "Time Zone"
   - Default: Auto-detected from browser (with override)
   - Options: America/Toronto, America/Vancouver, America/Chicago, America/New_York, Europe/London, etc.

**Personal Account Variant:**
4. **Your Name** (text input, required)
   - Label: "Your Name" (becomes entity name)
   - Placeholder: "John Doe"
   - Pre-filled from Full Name field
   - Validation: min 1 char, max 255 chars

5. **Address** (text input, optional for personal)
   - Label: "Address"
   - Placeholder: "123 Main Street"
   - Validation: max 500 chars
   - Note: Can be added later in settings

**Business Account Variant:**
4. **Business Legal Name** (text input, required)
   - Label: "Business Legal Name"
   - Placeholder: "Acme Inc." or "John Doe (Sole Proprietor)"
   - Validation: min 1 char, max 255 chars
   - Help text: "As registered with government (appears on invoices)"

5. **Business Address** (text input, required for business)
   - Label: "Business Address"
   - Placeholder: "123 Main Street"
   - Validation: min 1 char, max 500 chars
   - Note: Appears on invoices and tax documents

6. **Tax ID** (text input, optional but recommended)
   - Label: "Tax ID / EIN / GST Number"
   - Placeholder: "123456789 RT0001" (Canada) or "12-3456789" (US)
   - Validation: No strict format (varies by country)
   - Help text: "Appears on invoices (can add later)"

**Accountant Account Variant:**
4. **Firm Name** (text input, optional)
   - Label: "Firm Name (if applicable)"
   - Placeholder: "Smith Accounting LLP" or leave blank for sole practitioner
   - Validation: max 255 chars
   - Note: Can use personal name if solo accountant

5. **Firm Address** (text input, optional)
   - Label: "Firm Address (if applicable)"
   - Placeholder: "123 Main Street"
   - Validation: max 500 chars

**Universal Fields (continued):**
6. **Country** (select dropdown, required)
   - Label: "Country"
   - Options:
     - CA (🇨🇦 Canada)
     - US (🇺🇸 United States)
     - GB (🇬🇧 United Kingdom)
     - AU (🇦🇺 Australia)
     - More countries (Phase 2)
   - Determines: Default currency, tax ID format, date format
   - Search enabled for quick selection

7. **Currency** (select dropdown, required)
   - Label: "Base Currency"
   - Default: Auto-populated from country selection
   - Options:
     - CAD (Canadian Dollar - $)
     - USD (US Dollar - $)
     - GBP (British Pound - £)
     - AUD (Australian Dollar - A$)
     - EUR (Euro - €)
   - Can override if needed
   - Help text: "Your primary operating currency (can track others later)"

**Layout (Business Account Example):**
```
┌─────────────────────────────────────────────────────┐
│                   ● ●                               │  Progress dots
│                                                     │
│          Essential Information                      │  H2 heading
│         Just the basics to get started              │  Muted text
│                                                     │
│  ┌─────────────────┬─────────────────┐             │
│  │ Full Name *     │ Phone Number *  │             │  2-column grid
│  │ [John Doe     ] │ [+1 (555)...  ] │             │  (desktop)
│  └─────────────────┴─────────────────┘             │  1-column mobile
│                                                     │
│  ┌─────────────────┬─────────────────┐             │
│  │ Time Zone *     │ Country *       │             │
│  │ [ET (UTC-5)  ▼] │ [🇨🇦 Canada   ▼]│             │
│  └─────────────────┴─────────────────┘             │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ Business Legal Name *               │           │  Full width
│  │ [Acme Inc.                        ] │           │
│  │ As registered with government       │           │  Help text
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ Business Address *                  │           │  Full width
│  │ [123 Main Street, Toronto, ON     ] │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────┬─────────────────┐             │
│  │ Tax ID          │ Base Currency * │             │
│  │ [Optional     ] │ [CAD - $      ▼]│             │  Auto-filled
│  └─────────────────┴─────────────────┘             │  from country
│                                                     │
│  [Back]                    [Continue →]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Container:** Max-width 800px, centered
- **Background:** GlassCard (white/80, backdrop-blur-sm, rounded-3xl, p-12)
- **Progress Dots:** 2 dots at top, current step highlighted (w-8 vs w-2)
- **Heading:** text-3xl font-bold font-heading mb-2
- **Description:** text-muted-foreground mb-8
- **Grid:** 2 columns on desktop (768px+), 1 column mobile
- **Gap:** gap-6 between fields
- **Inputs:** InputGlass variant, h-12, rounded-lg
- **Labels:** text-sm font-medium mb-2
- **Buttons:**
  - Back: ButtonGlass variant="outline"
  - Submit: ButtonGlass variant="solid" className="ml-auto"
- **Spacing:** space-y-6 for form sections

**Interaction:**
- Form validates on submit (not on blur)
- Country selection auto-updates currency (can override)
- Time zone auto-detected but editable
- Submit button shows loading state: "Creating your account..."
- On success: Navigate to Success screen

**States:**
- **Default:** All fields empty (except auto-detected timezone)
- **Filling:** Inline validation on submit only
- **Error:** Red border + error message below field
- **Loading:** Submit button disabled, text changes, spinner
- **Success:** Navigate to success screen

**Validation Rules (Comprehensive):**

**Universal Fields:**
1. **Full Name**
   - Required: Yes
   - Min length: 2 chars
   - Max length: 100 chars
   - Pattern: Letters, spaces, hyphens, apostrophes only
   - Error messages:
     - Empty: "Please enter your full name"
     - Too short: "Name must be at least 2 characters"
     - Invalid chars: "Name can only contain letters, spaces, hyphens, and apostrophes"

2. **Phone Number**
   - Required: Yes
   - Format: E.164 (international format)
   - Min length: 10 digits (excluding formatting)
   - Auto-format: Yes (adds country code, parentheses, hyphens)
   - Libraries: libphonenumber-js for validation
   - Error messages:
     - Empty: "Please enter your phone number"
     - Invalid: "Please enter a valid phone number"
     - Country mismatch: "Phone number doesn't match selected country"

3. **Time Zone**
   - Required: Yes
   - Auto-detect: Yes (Intl.DateTimeFormat().resolvedOptions().timeZone)
   - Validation: Must match IANA timezone database
   - Error: "Please select a valid timezone"

**Account-Type-Specific Fields:**

4. **Business Legal Name** (Business only)
   - Required: Yes
   - Min: 1 char
   - Max: 255 chars
   - Pattern: Alphanumeric + common business characters (& , . - ' Inc Ltd LLC)
   - Errors:
     - Empty: "Please enter your business legal name"
     - Too long: "Business name must be under 255 characters"

5. **Address** (Business: required, Personal: optional)
   - Required: Yes (business), No (personal)
   - Max: 500 chars
   - Pattern: Alphanumeric + , . - # /
   - Errors:
     - Empty (business): "Business address is required for invoicing"
     - Too long: "Address must be under 500 characters"

6. **Tax ID** (Business: optional but recommended, Others: N/A)
   - Required: No
   - Format: Varies by country (no strict validation)
   - Max: 50 chars
   - Warning if empty (business): "Add tax ID now to avoid updating invoices later"
   - Error:
     - Too long: "Tax ID must be under 50 characters"

7. **Country**
   - Required: Yes
   - Validation: Must match ISO 3166-1 alpha-2 code
   - Triggers: Currency auto-select, tax ID format hint
   - Error: "Please select your country"

8. **Currency**
   - Required: Yes
   - Validation: Must match ISO 4217 currency code
   - Default: Auto-set from country (can override)
   - Error: "Please select your base currency"

**Real-Time Validation:**
- On blur (field loses focus): Validate individual field
- On submit: Validate all fields, show first error in focus
- Debounced validation for phone (500ms after typing stops)
- Inline validation for business name (duplicate check against existing entities - Phase 2)

**Error Handling (Comprehensive):**

**Client-Side Validation Errors:**
- Show below each field (red text, text-sm)
- Icon: ❌ or red exclamation mark
- Scroll to first error field
- Focus first invalid field
- Disable submit until all required fields valid

**Network Errors:**
```typescript
// Timeout (> 30s)
Error: "Request timed out. Please check your connection and try again."
Action: Retry button, keep all form data

// Server error (500, 502, 503)
Error: "We're experiencing technical difficulties. Please try again in a moment."
Action: Retry button, log error to monitoring

// Conflict (409 - duplicate entity)
Error: "A business with this name already exists in your account."
Action: Suggest different name or link to existing entity

// Validation error from API (400)
Error: Shows specific field errors returned from API
Action: Highlight fields, allow corrections

// Rate limiting (429)
Error: "Too many attempts. Please wait a moment and try again."
Action: Disable submit for 60 seconds, show countdown
```

**Success Flow:**
```typescript
// Optimistic UI update
1. Show loading state: "Creating your account..." (button disabled)
2. Call API (3-5 second expected response)
3. On success:
   - Store tenantId, entityId in Zustand
   - Store auth tokens if needed
   - Navigate to Success screen
4. On error:
   - Keep form data
   - Show error message
   - Re-enable submit button
```

**API Call (Enhanced Contract):**

**Endpoint:** `POST /api/system/onboarding/initialize`

**Request Headers:**
```typescript
{
  'Authorization': 'Bearer <clerk_jwt_token>',
  'Content-Type': 'application/json'
}
```

**Request Body Variants:**

**Personal Account:**
```typescript
{
  accountType: 'personal',
  name: 'John Doe',
  phoneNumber: '+15551234567',
  timezone: 'America/Toronto',
  entityName: 'John Doe', // Same as name for personal
  address: '123 Main St', // Optional
  country: 'CA',
  currency: 'CAD'
}
```

**Business Account:**
```typescript
{
  accountType: 'business',
  name: 'John Doe', // Personal name
  phoneNumber: '+15551234567',
  timezone: 'America/Toronto',
  entityName: 'Acme Inc.', // Business legal name
  address: '123 Main Street, Toronto, ON M5V 3A8', // Required for business
  taxId: '123456789 RT0001', // Optional but recommended
  country: 'CA',
  currency: 'CAD'
}
```

**Accountant Account:**
```typescript
{
  accountType: 'accountant',
  name: 'Jane Smith',
  phoneNumber: '+15551234567',
  timezone: 'America/Toronto',
  entityName: 'Smith Accounting LLP', // Firm name or personal name
  address: '456 Office Blvd', // Optional
  country: 'CA',
  currency: 'CAD'
}
```

**Success Response (201 Created):**
```typescript
{
  success: true,
  data: {
    tenant: {
      id: 'clx123...',
      name: 'Acme Inc.',
      subscriptionTier: 'free',
      createdAt: '2026-02-12T10:30:00Z'
    },
    entity: {
      id: 'cly456...',
      name: 'Acme Inc.',
      type: 'SOLE_PROPRIETORSHIP', // Auto-set based on account type
      country: 'CA',
      currency: 'CAD',
      address: '123 Main Street, Toronto, ON M5V 3A8',
      taxId: '123456789 RT0001'
    },
    user: {
      id: 'user_...', // Clerk user ID
      phoneNumber: '+15551234567',
      timezone: 'America/Toronto'
    },
    onboardingProgress: {
      id: 'prog_123...',
      tenantId: 'clx123...',
      completionPercentage: 40, // Basic info + entity setup
      basicInfoComplete: true,
      entitySetupComplete: true,
      businessDetailsComplete: false,
      bankConnectionComplete: false,
      goalsSetupComplete: false,
      completedSteps: ['basic_info', 'entity_setup'],
      nextRecommendedStep: 'business_details', // Personalized based on account type
      createdAt: '2026-02-12T10:30:00Z',
      updatedAt: '2026-02-12T10:30:00Z'
    }
  }
}
```

**Error Responses:**

**400 Bad Request (Validation Error):**
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: [
      {
        field: 'phoneNumber',
        message: 'Invalid phone number format',
        value: '555-1234' // The invalid value submitted
      },
      {
        field: 'entityName',
        message: 'Entity name is required for business accounts',
        value: null
      }
    ]
  }
}
```

**401 Unauthorized:**
```typescript
{
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Invalid or missing authentication token'
  }
}
```

**409 Conflict (Duplicate Entity):**
```typescript
{
  success: false,
  error: {
    code: 'DUPLICATE_ENTITY',
    message: 'An entity with this name already exists in your account',
    details: {
      existingEntityId: 'cly789...',
      existingEntityName: 'Acme Inc.',
      suggestion: 'Use a different name or manage the existing entity'
    }
  }
}
```

**429 Too Many Requests:**
```typescript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many onboarding attempts. Please try again in 60 seconds.',
    retryAfter: 60 // seconds
  }
}
```

**500 Internal Server Error:**
```typescript
{
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    requestId: 'req_abc123...', // For support debugging
    timestamp: '2026-02-12T10:30:15Z'
  }
}
```

**Backend Processing:**
```typescript
// What the API does internally (transaction)
async function initializeOnboarding(data, userId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        name: data.entityName,
        subscriptionTier: 'free',
        createdBy: userId
      }
    })

    // 2. Create Entity
    const entity = await tx.entity.create({
      data: {
        tenantId: tenant.id,
        name: data.entityName,
        type: determineEntityType(data.accountType), // PERSONAL | SOLE_PROPRIETORSHIP
        country: data.country,
        currency: data.currency,
        address: data.address,
        taxId: data.taxId,
        fiscalYearEnd: '12-31', // Default, can change later
        createdBy: userId
      }
    })

    // 3. Create TenantUser association
    await tx.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: userId,
        role: 'OWNER', // First user is always owner
        entityId: entity.id // Default entity
      }
    })

    // 4. Update User (Clerk user record)
    await tx.user.update({
      where: { id: userId },
      data: {
        phoneNumber: data.phoneNumber,
        timezone: data.timezone
      }
    })

    // 5. Create OnboardingProgress
    const progress = await tx.onboardingProgress.create({
      data: {
        tenantId: tenant.id,
        basicInfoComplete: true,
        entitySetupComplete: true,
        completionPercentage: 40,
        completedSteps: ['basic_info', 'entity_setup'],
        nextRecommendedStep: getNextStep(data.accountType)
      }
    })

    // 6. Create default Chart of Accounts (async job, not blocking)
    queueJob('seed-default-coa', { entityId: entity.id, country: data.country })

    return { tenant, entity, progress }
  })
}
```

**Special Considerations:**
- Entity type auto-set based on account type: Personal → PERSONAL, Business → SOLE_PROPRIETORSHIP (can change later)
- Creates Tenant, Entity, TenantUser, OnboardingProgress in one transaction
- Phone number saved to User model
- Timezone saved to User model
- OnboardingProgress starts at 40% (basic + entity complete)

**Related Screens:**
- Previous: Welcome Screen
- Next: Purpose Screen (Option B) OR Success Screen (Option A)

---

### Screen 2B: Purpose Screen (Optional - Comprehensive Flow Only)

**Purpose:** Understand user's primary goal to personalize dashboard, features, and onboarding prompts

**User Goal:** Quickly indicate what they want to accomplish with Akount

**Entry Points:**
- From Essential Info Step (if using Option B comprehensive flow)
- From Dashboard Hero Card modal (if using Option A minimal flow)

**Key Data Displayed:**
- Account type context (reminder of selection)
- Pre-selected goal options (varies by account type)
- Optional: Brief explanation of how this helps

**Primary Actions:**
- Select goal(s) → Saves to OnboardingProgress.primaryIntent
- Skip for now → Defaults to generic experience

**Field List:**

**Personal Account Goals (Select 1-2):**
- 📊 Track personal expenses
- 💰 Save for a specific goal
- 📈 Manage investments & net worth
- 📄 Prepare for tax season
- 🏠 Manage rental property income
- ✏️ Other (text input)

**Business Account Goals (Select 1-2):**
- 📧 Create professional invoices
- 💳 Track business expenses
- 📊 Get financial insights & reports
- 🏦 Manage cash flow
- 📄 Prepare for tax season
- 👥 Collaborate with accountant
- ✏️ Other (text input)

**Accountant Account Services (Multi-select):**
- 📚 Bookkeeping
- 📄 Tax preparation
- 💼 Advisory & CFO services
- 💰 Payroll processing
- 🔍 Audit support
- 📈 Financial planning
- ✏️ Other (text input)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                   ● ● ●                             │  Progress dots
│                                                     │
│          What brings you to Akount?                 │  H2 heading
│         Help us personalize your experience         │  Muted text
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐     │
│  │  📧                │  │  💳                │     │  2-column grid
│  │                   │  │                   │     │  (cards)
│  │ Create invoices   │  │ Track expenses    │     │
│  │                   │  │                   │     │
│  │ Selected ✓        │  │ Click to select   │     │
│  └───────────────────┘  └───────────────────┘     │
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐     │
│  │  📊                │  │  🏦                │     │
│  │                   │  │                   │     │
│  │ Financial insights│  │ Manage cash flow  │     │
│  │                   │  │                   │     │
│  │ Click to select   │  │ Click to select   │     │
│  └───────────────────┘  └───────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │  ✏️ Other: [Describe your goal...      ]  │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  [Back]                           [Continue →]     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Container:** Max-width 900px, centered
- **Progress Dots:** 3 dots (Step 3 of wizard if comprehensive flow)
- **Heading:** text-3xl font-bold font-heading mb-2
- **Description:** text-muted-foreground text-sm mb-8
- **Goal Cards:**
  - GlassCard component
  - Width: 280px per card
  - Height: 140px
  - Grid: 2 columns on desktop, 1 on mobile
  - Gap: gap-4
  - Hover: border-primary/50, scale-102
  - Selected: border-primary, bg-primary/5, checkmark in top-right
  - Icon: text-4xl emoji at top
  - Label: text-lg font-medium, centered
- **Other Input:** InputGlass, full width, h-12, rounded-lg
- **Buttons:**
  - Back: ButtonGlass variant="ghost"
  - Continue: ButtonGlass variant="solid" (enabled when ≥1 selected)

**Interaction:**
- Click card → Toggle selection (up to 2 for personal/business)
- Multi-select enabled for accountant (no limit)
- "Other" text input → Auto-selects that card when typing
- Continue button:
  - Disabled if no selection
  - Enabled when ≥1 selected
  - Shows "Personalizing..." loading state on submit
- On submit: Calls API, then navigates based on flow option

**States:**
- **Default:** No selections, Continue disabled
- **Selecting:** 1-2 cards highlighted
- **Filled:** Continue enabled
- **Submitting:** Loading spinner, "Personalizing your experience..."
- **Success:** Navigate to next screen

**Validation Rules:**
- Minimum 1 selection required
- Maximum 2 for personal/business (enforced by disabling unselected cards after 2 picked)
- No max for accountant
- "Other" text optional, max 100 chars

**API Call:**
```typescript
PATCH /api/system/onboarding/update-progress
Body: {
  primaryIntent: ['create_invoices', 'track_expenses'], // Selected goals
  otherIntent: 'Manage contractor payments', // If "Other" filled
  step: 'purpose_captured',
  completed: true
}
Response: {
  onboardingProgress: {
    completionPercentage: 60, // Updated based on flow
    primaryIntent: ['create_invoices', 'track_expenses'],
    dashboardLayout: 'invoicing_focused' // Determines which widgets show
  }
}
```

**Personalization Logic:**
Based on selected intents, system adjusts:

**Personal:**
- `track_expenses` → Show expense categorization prominently, budget widgets
- `save_for_goal` → Show savings goals card on dashboard, goal progress tracking
- `tax_prep` → Highlight tax category tagging, show tax summary widget
- `investments` → Enable investment tracking, net worth calculations

**Business:**
- `create_invoices` → Invoicing gets priority in nav, show invoice templates
- `track_expenses` → Expense management prioritized, receipt scanning highlighted
- `financial_insights` → Reports tab prominent, AI insights enabled
- `cash_flow` → Cash flow projection widget on dashboard
- `collaborate_accountant` → Accountant invitation prominent

**Accountant:**
- Services selected → Determines default client templates
- `bookkeeping` → Bank reconciliation workflows emphasized
- `tax_prep` → Tax forms and deadlines highlighted
- `advisory` → Forecasting and planning tools prominent

**Special Considerations:**
- Intent stored in OnboardingProgress.primaryIntent (JSON array)
- Can be updated later in Settings → Preferences
- Used by AI advisor to tailor insights
- Determines default dashboard layout (can be customized later)
- If skipped: Generic balanced dashboard, all features equally visible

**Related Screens:**
- Previous: Essential Info Step
- Next (Option B): Bank Connection OR Success Screen
- Next (Option A): Dashboard (as modal)

---

### Screen 3: Success Screen

**Purpose:** Celebrate completion of minimal onboarding, prepare user for dashboard

**User Goal:** Feel confident that setup is working, understand next steps

**Entry Points:**
- From Essential Info Step after successful API call

**Key Data Displayed:**
- Success message: "Welcome to Akount!"
- Checkmark animation (confetti optional)
- Brief text: "Your account is ready. Taking you to your dashboard..."
- Auto-redirect countdown (not shown, just happens)

**Primary Actions:**
- None (auto-advances after 2 seconds)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                     ✅                              │  Large checkmark
│                                                     │  (animated)
│              Welcome to Akount!                     │
│                                                     │
│      Your account is ready. Taking you to          │
│              your dashboard...                      │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Background:** Same gradient as wizard
- **Container:** Centered, max-width 600px
- **Checkmark:** 120px, green (#34D399), scale animation (0.5 → 1.0, spring)
- **Optional:** Confetti animation (react-confetti, subtle, 2 seconds)
- **Heading:** text-4xl font-bold font-heading mb-4
- **Message:** text-lg text-muted-foreground
- **Spacing:** Vertical center alignment

**Interaction:**
- Checkmark animates in (scale spring)
- Message fades in
- After 2 seconds: Navigate to /overview (dashboard)
- User can't click anything (brief screen)

**States:**
- Animate in → Show → Auto-redirect

**Special Considerations:**
- Brief screen (2 seconds total)
- Sets user expectation that setup continues on dashboard
- Stores tenantId/entityId in Zustand store for dashboard

**Related Screens:**
- Previous: Essential Info Step
- Next: Dashboard (Overview page)

---

### Screen 4: Dashboard with Onboarding Hero Card

**Purpose:** Provide instant financial snapshot while guiding completion of remaining setup

**User Goal:** See financial health at a glance, understand what's left to set up

**Entry Points:**
- From Success Screen (first time)
- From app navigation (subsequent visits)
- From Sidebar progress indicator click

**Key Data Displayed:**

**Hero Card (if completion < 100%):**
- Circular progress chart (donut, recharts PieChart)
- Completion percentage (40%, 60%, 80%, or 100%)
- Checklist of 5 steps with completion status
- CTAs: "Continue Setup" + "Skip for now"

**Dashboard KPIs (always shown):**
- Total Cash (across all accounts)
- Outstanding Receivables (A/R)
- Outstanding Payables (A/P)
- Net Income (this month)

**Recent Activity:**
- Recent Transactions (5 most recent)
- Pending Invoices (if business account)
- AI Insights badge (if uncategorized items)

**Primary Actions:**
- From Hero Card: "Continue Setup" → Opens completion modal OR navigates to specific setup page
- From Hero Card: "Skip for now" → Dismisses card for 7 days
- From Hero Card: X button → Dismisses card for 24 hours

**Secondary Actions:**
- View all accounts → /money/accounts
- View invoices → /income/invoices
- View bills → /expenses/bills
- Create invoice (quick action)
- Create bill (quick action)
- Ask Insights

**Hero Card Layout:**
```
┌───────────────────────────────────────────────────────┐
│  🎯 Complete Your Setup                          [▼][×]│
│                                                       │
│   ┌────┐   ✓ Basic information                       │
│   │ 60%│   ✓ Entity setup                            │
│   │    │   ⏳ Business details (Tax ID, Address)      │
│   └────┘   ⏳ Connect your bank account               │
│            ⏳ Set goals & budget                       │
│  Circular                                             │
│  Progress   [Continue Setup →]  [Skip for now]       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Hero Card Visual Specs:**
- **Component:** GlassCard with special styling
- **Border:** 2px border-primary/20
- **Background:** gradient-to-br from-primary/5 to-transparent
- **Circular Progress:**
  - Size: 120px diameter
  - Stroke width: 12px
  - Color: Yellow (#F59E0B) for < 80%, Green (#34D399) for >= 80%
  - Center text: Percentage in JetBrains Mono, text-3xl
- **Checklist:**
  - Check icon: ✓ in green-500 circle for complete
  - Clock icon: ○ in slate-200 circle for pending
  - Completed items: line-through text-muted-foreground
  - Pending items: normal text
- **Collapse/Expand:**
  - Chevron button (top right, next to X)
  - Collapsed: Shows only progress circle + percentage
  - Expanded: Shows checklist + CTAs
- **Dismiss X:**
  - Ghost button, top-right corner
  - Hover: bg-slate-100
- **CTAs:**
  - Continue: ButtonGlass solid, flex-1
  - Skip: ButtonGlass outline

**Checklist Steps:**

**Personal Account:**
1. ✓ Basic information (40%)
2. ✓ Entity setup (included in 40%)
3. ⏳ Connect your bank account (20% → 60%)
4. ⏳ Set personal savings goals (20% → 80%)
5. ⏳ (hidden - only 4 steps for personal)

**Business Account:**
1. ✓ Basic information (40%)
2. ✓ Entity setup (included in 40%)
3. ⏳ Business details (Tax ID, Address) (20% → 60%)
4. ⏳ Connect your bank account (20% → 80%)
5. ⏳ Set business goals & budget (20% → 100%)

**Accountant Account:**
1. ✓ Basic information (40%)
2. ✓ Entity setup (included in 40%)
3. ⏳ Add first client entity (20% → 60%)
4. ⏳ Set up firm billing (20% → 80%)
5. ⏳ (hidden - only 4 steps)

**Interaction:**
- Hero card fetches progress on mount: `GET /api/system/onboarding/progress`
- Collapse/expand: Click chevron → Smooth height transition
- Continue Setup: Opens completion modal (Phase 2) or navigates to next incomplete step
- Skip for now: `POST /api/system/onboarding/skip-step` → Hides card for 7 days
- Dismiss X: `POST /api/system/onboarding/dismiss-card` → Hides card for 24 hours
- Card auto-hides when completionPercentage === 100

**States:**
- **Loading:** Skeleton (shimmer animation, h-64)
- **Loaded < 100%:** Show hero card + dashboard content
- **Loaded = 100%:** Hide hero card, show only dashboard content
- **Collapsed:** Only progress circle visible, checklist hidden
- **Expanded:** Full card with checklist + CTAs
- **Dismissed:** Card removed, sidebar indicator still shows

**Special Considerations:**
- Hero card positioned at top of dashboard, above KPIs
- Responsive: Full width on mobile, max-width 900px on desktop
- Polling: Refresh progress every 30s (or on window focus) to catch updates
- Multi-entity (future): Show progress per entity, switch with entity selector

**Related Screens:**
- Continue Setup → Completion Modal (Phase 2) or specific setup page
- Sidebar Progress Indicator → Shows same progress, clickable

---

### Screen 5: Sidebar Progress Indicator

**Purpose:** Persistent reminder of onboarding completion status, always visible

**User Goal:** Know setup progress at a glance, quick access to complete remaining steps

**Entry Points:**
- Always visible in sidebar (if completion < 100%)

**Key Data Displayed:**
- Mini progress bar (horizontal)
- Percentage text (e.g., "60%")

**Primary Actions:**
- Click progress bar → Opens completion modal OR navigates to dashboard hero card

**Layout:**
```
┌──────────────┐
│  JD          │  ← User Avatar (unchanged)
│  John Doe    │  ← Name (unchanged)
│              │
│  ────────    │  ← Progress bar (60% filled)
│  60%         │  ← Percentage (center-aligned)
└──────────────┘
```

**Visual Specs:**
- **Position:** In sidebar, below user avatar section
- **Container:** mt-2, full width
- **Progress Bar:**
  - Height: 1.5px (h-1.5)
  - Background: bg-slate-200 (unfilled)
  - Fill: bg-yellow-500 (< 80%) or bg-green-500 (>= 80%)
  - Border radius: rounded-full
  - Transition: transition-all duration-500 (smooth width change)
  - Width: Dynamic based on percentage (style={{ width: `${percentage}%` }})
- **Percentage Text:**
  - Font: font-mono (JetBrains Mono)
  - Size: text-xs
  - Color: text-muted-foreground
  - Position: text-center mt-1
- **Hover State:**
  - Entire indicator: hover:opacity-80 transition-opacity
  - Cursor: cursor-pointer
  - Tooltip: "60% complete - Click to continue setup"

**Interaction:**
- Click anywhere on indicator → Navigate to /overview (dashboard) and scroll to hero card OR open completion modal
- Hover → Tooltip appears with completion status
- Auto-updates when progress changes (polls every 30s or listens to event)
- Hides when completionPercentage === 100

**States:**
- **Loading:** No indicator shown (waits for data)
- **Visible:** Progress bar + percentage
- **Hidden:** completionPercentage === 100
- **Hover:** Opacity 80%, tooltip visible

**Special Considerations:**
- Minimal visual weight (doesn't distract from sidebar navigation)
- Color-coded for quick status check (yellow = more work, green = almost done)
- Always visible on all pages (not just dashboard)
- Fetches progress independently: `GET /api/system/onboarding/progress`

**Related Screens:**
- Click → Dashboard Hero Card (scrolls to it) OR Completion Modal

---

### Screen 6: Business Details Modal (Optional Step)

**Purpose:** Collect business information needed for professional invoicing and compliance

**User Goal:** Provide tax ID, address, industry so invoices look professional and accounting is accurate

**Entry Points:**
- From Dashboard Hero Card → "Continue Setup" (if business_details incomplete)
- From Invoice creation → "Add business details" prompt (blocking)
- From Settings → Business Profile

**Key Data Displayed:**
- Form fields (6 total)
- Explanation: "This information appears on invoices and ensures compliance"

**Primary Actions:**
- Save → Validates, updates Entity model, marks step complete, closes modal
- Skip for now → Skips step, dismisses modal, can complete later

**Field List:**
1. **Business Address** (text input, optional)
   - Label: "Business Address"
   - Placeholder: "123 Main Street"

2. **City** (text input, optional)
   - Label: "City"
   - Placeholder: "Toronto"

3. **State/Province** (text input, optional)
   - Label: "State/Province"
   - Placeholder: "ON"

4. **Postal Code** (text input, optional)
   - Label: "Postal Code"
   - Placeholder: "M5V 3A8"

5. **Tax ID** (text input, optional)
   - Label: "Tax ID (EIN, VAT, GST/HST Number)"
   - Placeholder: "123456789 RT0001"
   - Help text: "Appears on invoices for tax compliance"

6. **Industry** (select dropdown, optional)
   - Label: "Industry"
   - Options: Consulting, E-commerce, SaaS, Professional Services, Creative Services, Construction, Real Estate, Healthcare, Legal, Accounting, Other

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Business Details                              [×]  │
│  This information appears on invoices and ensures   │
│  compliance.                                        │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Business Address                        │       │
│  │ [123 Main Street                      ] │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌────────────────┬────────────┬─────────────┐     │
│  │ City           │ State/Prov │ Postal Code │     │
│  │ [Toronto     ] │ [ON      ] │ [M5V 3A8  ] │     │
│  └────────────────┴────────────┴─────────────┘     │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Tax ID (EIN, VAT, GST/HST Number)       │       │
│  │ [123456789 RT0001                     ] │       │
│  │ Appears on invoices for tax compliance  │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Industry                               ▼│       │
│  │ [Consulting                           ] │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  [Skip for now]                     [Save & Close] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Component:** ModalGlass (glass morphism variant)
- **Width:** max-w-2xl
- **Padding:** p-6
- **Title:** text-2xl font-bold mb-2
- **Description:** text-muted-foreground text-sm mb-6
- **Grid:** 3 columns for City/State/Postal, 1 column for others
- **Inputs:** InputGlass, h-12
- **Help text:** text-xs text-muted-foreground mt-1
- **Buttons:**
  - Skip: ButtonGlass outline
  - Save: ButtonGlass solid, ml-auto

**Interaction:**
- Modal opens with slide + fade animation
- Fields pre-filled if data already exists (editing)
- Save validates and calls API: `PATCH /api/entities/:id`
- Success: Close modal, update progress to 60%, refresh dashboard hero card
- Skip: Adds 'business_details' to skippedSteps, dismisses modal

**States:**
- **Default:** All fields empty (first time) or pre-filled (editing)
- **Editing:** Can modify existing data
- **Saving:** Submit button shows loading state
- **Error:** Show validation errors inline
- **Success:** Close modal, show toast "Business details saved"

**Validation:**
- All fields optional (can submit empty)
- Tax ID: No strict format (varies by country)
- Postal code: No strict format (varies by country)

**API Call:**
```typescript
PATCH /api/entities/:entityId
Body: {
  address: '123 Main Street',
  city: 'Toronto',
  state: 'ON',
  postalCode: 'M5V 3A8',
  taxId: '123456789 RT0001',
  industry: 'Consulting'
}

POST /api/system/onboarding/update-progress
Body: {
  step: 'business_details',
  completed: true
}
```

**Special Considerations:**
- Can skip indefinitely, but blocking prompt appears when creating first invoice
- Industry used for AI categorization suggestions
- Tax ID format varies: US EIN (12-3456789), Canada GST/HST (123456789 RT0001), UK VAT (GB123456789)
- Address appears on generated invoice PDFs

**Related Screens:**
- Triggered from: Dashboard Hero Card, Invoice creation
- After save: Returns to Dashboard (progress updated)

---

### Screen 7: Bank Connection Flow (Optional Step)

**Purpose:** Connect bank account for automatic transaction import

**User Goal:** Link bank securely to automate transaction tracking

**Entry Points:**
- From Dashboard Hero Card → "Continue Setup" (if bank_connection incomplete)
- From Money/Accounts page → "Connect Bank" button
- From Transaction list empty state

**Key Data Displayed:**
- Plaid Link iframe (if Plaid integration complete)
- OR Manual entry form (fallback)
- Security badges (256-bit encryption, read-only access)

**Primary Actions:**
- Connect with Plaid → Opens Plaid Link modal
- Add Manually → Opens manual account form
- Skip for now → Dismisses, can connect later

**Plaid Link Flow:**
```
1. User clicks "Connect with Plaid"
   ↓
2. Plaid modal opens → Select bank
   ↓
3. User enters bank credentials (in Plaid iframe, secure)
   ↓
4. Bank authenticates → Select accounts to link
   ↓
5. Plaid returns access_token → API creates Account records
   ↓
6. Success: "Bank connected! Importing transactions..."
   ↓
7. Background job: Import transactions
   ↓
8. Dashboard: Progress updated to 80%, transactions appear
```

**Manual Entry Flow:**
```
1. User clicks "Add Manually"
   ↓
2. Form appears: Account Name, Account Type, Opening Balance, Currency
   ↓
3. User fills form, submits
   ↓
4. API creates Account record (no Plaid connection)
   ↓
5. Success: "Account created! Add transactions manually or import CSV."
   ↓
6. Dashboard: Progress updated to 80% (partial credit)
```

**Layout (Plaid Option):**
```
┌─────────────────────────────────────────────────────┐
│  Connect Your Bank Account                     [×]  │
│  Securely link your bank to auto-import            │
│  transactions.                                      │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │  🔒 Bank-level security                 │       │
│  │  👁️ Read-only access                     │       │
│  │  ⚡ Automatic daily sync                 │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  [Connect with Plaid →]                            │
│                                                     │
│  ───────────── or ─────────────                    │
│                                                     │
│  [Add Manually]                                    │
│                                                     │
│  [Skip for now]                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Modal:** ModalGlass, max-w-lg
- **Security badges:** GlassCard inset, subtle, flex row
- **Plaid button:** ButtonGlass solid, full width, mb-4
- **Divider:** text-center with "or" text
- **Manual button:** ButtonGlass outline, full width, mb-4
- **Skip button:** ButtonGlass ghost, text-muted-foreground

**Interaction:**
- Plaid button → Opens Plaid Link in modal overlay
- Manual button → Replaces modal content with manual form
- Skip → Marks as skipped, closes modal
- Plaid success → API creates Account, imports transactions, updates progress
- Manual success → API creates Account, updates progress (partial)

**States:**
- **Default:** Plaid + Manual options
- **Plaid Loading:** Plaid modal open, user authenticating
- **Plaid Success:** Importing transactions... spinner, then success message
- **Plaid Error:** Error message, "Try again" button
- **Manual Form:** Form fields, validation
- **Manual Success:** Account created message, close modal

**Manual Form Fields:**
1. Account Name (text, required) — "TD Chequing"
2. Account Type (select, required) — Checking, Savings, Credit Card, Line of Credit
3. Opening Balance (number, required) — $1,000.00
4. Currency (select, required) — CAD, USD, EUR, etc.

**API Call (Plaid):**
```typescript
POST /api/banking/accounts/connect-plaid
Body: {
  publicToken: 'public-sandbox-...',
  accounts: [
    { plaidAccountId: 'acc_...', name: 'TD Chequing', type: 'CHECKING' }
  ]
}
Response: {
  accounts: [{ id: 'clx...', name: 'TD Chequing', currentBalance: 100000 }]
}

POST /api/system/onboarding/update-progress
Body: {
  step: 'bank_connection',
  completed: true
}
```

**API Call (Manual):**
```typescript
POST /api/banking/accounts
Body: {
  name: 'TD Chequing',
  type: 'CHECKING',
  openingBalance: 100000, // cents
  currency: 'CAD'
}

POST /api/system/onboarding/update-progress
Body: {
  step: 'bank_connection',
  completed: true // partial (manual entry)
}
```

**Special Considerations:**
- Plaid integration (Phase 2) — may not be ready for MVP
- Manual entry is fallback, fully functional
- Can connect multiple accounts (progress marked complete after first)
- Security messaging critical (users hesitant to link banks)
- Plaid Link handles all auth/MFA/security (iframe sandboxed)

**Related Screens:**
- Success → Dashboard (progress updated)
- Manual form → Similar to Create Account form

---

### Screen 8: Goals & Budgets Setup (Optional Step)

**Purpose:** Set financial targets to track progress and get AI insights

**User Goal:** Define a goal (revenue target, savings goal, expense budget) to work toward

**Entry Points:**
- From Dashboard Hero Card → "Continue Setup" (if goals_setup incomplete)
- From Planning section → "Create Goal" button

**Key Data Displayed:**
- Form fields (4 total)
- Goal type selector (Revenue, Savings, Expense Budget)
- Explanation of benefits

**Primary Actions:**
- Create Goal → Validates, creates Goal record, marks step complete
- Skip for now → Dismisses, can set later

**Field List:**
1. **Goal Type** (radio buttons, required)
   - Revenue Target (Business)
   - Savings Goal (Personal)
   - Expense Budget (Both)

2. **Goal Name** (text input, required)
   - Placeholder: "Q1 Revenue Target" or "Emergency Fund"
   - Validation: min 1 char, max 100 chars

3. **Target Amount** (number input, required)
   - Placeholder: $10,000.00
   - Currency: Uses entity base currency
   - Validation: > 0

4. **Target Date** (date picker, required)
   - Placeholder: End of quarter, End of year
   - Validation: Future date

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Set Your First Goal                          [×]  │
│  Track progress and get AI insights to help you    │
│  reach your financial targets.                     │
│                                                     │
│  Goal Type:                                        │
│  ○ Revenue Target  ○ Savings Goal  ○ Expense Budget│
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Goal Name                               │       │
│  │ [Q1 Revenue Target                    ] │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌────────────────┬──────────────────────┐         │
│  │ Target Amount  │ Target Date          │         │
│  │ [$10,000.00  ] │ [2026-03-31        ▼]│         │
│  └────────────────┴──────────────────────┘         │
│                                                     │
│  [Skip for now]                  [Create Goal →]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Specs:**
- **Modal:** ModalGlass, max-w-lg
- **Title:** text-2xl font-bold mb-2
- **Description:** text-muted-foreground mb-6
- **Radio buttons:** Horizontal layout, GlassCard for each option
- **Inputs:** InputGlass, h-12
- **Date picker:** shadcn Calendar component
- **Buttons:**
  - Skip: ButtonGlass outline
  - Create: ButtonGlass solid, ml-auto

**Interaction:**
- Goal type selection updates placeholder text dynamically
- Amount input formatted as currency (auto-adds commas, $ symbol)
- Date picker opens on click, defaults to end of quarter
- Create validates and calls API
- Success: Close modal, update progress to 100%, show confetti

**States:**
- **Default:** Revenue target selected (for business), Savings goal (for personal)
- **Selecting:** Radio buttons highlight on click
- **Filling:** Inline validation on submit
- **Creating:** Submit button loading state
- **Success:** Close modal, show toast "Goal created!", confetti animation
- **Error:** Show validation errors inline

**Validation:**
- Goal name: Required, max 100 chars
- Target amount: Required, > 0, formatted as cents
- Target date: Required, must be future date

**API Call:**
```typescript
POST /api/planning/goals
Body: {
  type: 'REVENUE',
  name: 'Q1 Revenue Target',
  targetAmount: 1000000, // $10,000.00 in cents
  targetDate: '2026-03-31',
  currency: 'CAD'
}

POST /api/system/onboarding/update-progress
Body: {
  step: 'goals_setup',
  completed: true
}
```

**Special Considerations:**
- Goal type determines AI insights shown later
- Can create multiple goals, but first one marks step complete
- Revenue goals show on business dashboards prominently
- Savings goals show progress bar on personal dashboards
- Expense budgets trigger alerts when exceeded

**Related Screens:**
- Success → Dashboard (100% complete, confetti, hero card removed)
- Planning section → Full goal management

---

## Flow Diagrams

### Complete Onboarding Flow (Visual)

```
┌─────────────┐
│  Clerk      │
│  Sign Up    │
│             │
│  Email      │
│  Verified   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Screen 1: Welcome                      │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ 👤  │  │ 🏢  │  │ 📊  │            │
│  │Pers.│  │Biz. │  │Acct.│            │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  [Click to select]                     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Screen 2: Essential Info               │
│                                         │
│  [Name] [Phone] [Timezone]             │
│  [Entity Name] [Country] [Currency]    │
│                                         │
│  [Back]           [Complete Setup →]   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Screen 3: Success                      │
│                                         │
│            ✅                            │
│     Welcome to Akount!                  │
│                                         │
│  (Auto-redirect in 2 seconds)          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Screen 4: Dashboard                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🎯 Complete Your Setup       [×] │ │
│  │                                   │ │
│  │  ●●●○○ 60%                       │ │
│  │                                   │ │
│  │  ✓ Basic info                    │ │
│  │  ✓ Entity setup                  │ │
│  │  ⏳ Business details              │ │ ◄─┐
│  │  ⏳ Bank connection               │ │   │
│  │  ⏳ Goals & budgets               │ │   │
│  │                                   │ │   │
│  │  [Continue] [Skip]               │ │   │
│  └───────────────────────────────────┘ │   │
│                                         │   │
│  [KPIs: Cash, A/R, A/P, Net Income]   │   │
│  [Recent Transactions]                 │   │
│  [AI Insights]                         │   │
└─────────────┬───────────────────────────┘   │
              │                               │
              │  Click "Continue"             │
              ▼                               │
         ┌─────────┐                          │
         │ Modal   │                          │
         │ Opens   │                          │
         └────┬────┘                          │
              │                               │
    ┌─────────┼─────────┬──────────┐         │
    │         │         │          │         │
    ▼         ▼         ▼          ▼         │
┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│Business│ │ Bank │ │Goals │ │Done  │       │
│Details │ │Connect│ │Setup │ │100% │       │
│        │ │      │ │      │ │      │       │
│[Save]  │ │[Link]│ │[Save]│ │ 🎉  │       │
└────┬───┘ └───┬──┘ └───┬──┘ └──────┘       │
     │         │        │                    │
     └─────────┴────────┴────────────────────┘
               Updates progress
               Returns to dashboard
```

### Decision Tree by Account Type

```
                    Welcome Screen
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    Personal         Business        Accountant
         │                │                │
         │                │                │
    Essential        Essential        Essential
    Info (4 flds)    Info (6 flds)    Info (5 flds)
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                    Dashboard (40%)
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    Personal         Business        Accountant
    Steps:           Steps:          Steps:
    • Bank (20%)     • Biz Det.(20%) • Client (20%)
    • Goals (20%)    • Bank (20%)    • Billing (20%)
                     • Goals (20%)
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                    100% Complete
                    Hero card removed
                    Sidebar green
```

---

## Edge Cases & Error Handling

### User Abandons Wizard Mid-Flow

**Scenario:** User closes browser on Essential Info step

**Handling:**
- Zustand store persists form data (localStorage)
- On return: Show "Continue where you left off" message
- Pre-fill form with saved data
- Allow user to start fresh if desired

**Implementation:**
```typescript
// onboardingStore.ts
persist: {
  name: 'akount-onboarding',
  storage: createJSONStorage(() => localStorage),
}
```

### User Dismisses Hero Card Repeatedly

**Scenario:** User clicks X button 3+ times over several days

**Handling:**
- After 3 dismissals: Stop showing hero card on dashboard
- Sidebar indicator remains visible
- Re-prompt only if user tries feature that needs missing data (e.g., create invoice without business details)

**Implementation:**
- Track dismissal count in OnboardingProgress.dashboardCardDismissedCount
- Hide card if count > 3
- Show blocking prompt when feature needs data

### Plaid Connection Fails

**Scenario:** User's bank not supported, or Plaid error

**Handling:**
- Show clear error message: "Unable to connect. Try manual entry instead."
- Automatically offer manual entry option
- Log error for debugging
- Don't penalize user (partial credit for manual entry)

**Implementation:**
```typescript
try {
  const plaidResult = await connectPlaid(publicToken)
} catch (error) {
  showError('Unable to connect. Try manual entry instead.')
  setManualEntryMode(true)
}
```

### User Changes Account Type Mid-Onboarding

**Scenario:** User selects "Personal", then goes back and picks "Business"

**Handling:**
- Allow change via Back button
- Preserve common fields (name, phone, timezone)
- Clear account-type-specific data
- Adjust completion checklist

**Implementation:**
- Zustand store updates accountType
- Form re-renders with new fields
- Progress recalculated

### Network Error During Submit

**Scenario:** API call fails (timeout, 500 error)

**Handling:**
- Show red alert: "Unable to create account. Please try again."
- Keep form data intact
- Retry button
- Log error with Sentry or similar

**Implementation:**
```typescript
try {
  await api.post('/onboarding/initialize', data)
} catch (error) {
  setError('Unable to create account. Please try again.')
  // Keep form data, allow retry
}
```

### User Completes Steps Out of Order

**Scenario:** User skips bank connection, sets goals, then later connects bank

**Handling:**
- Track per-step completion independently
- Recalculate percentage dynamically
- Update hero card checklist in real-time

**Implementation:**
- OnboardingProgress has boolean flags per step
- Completion % = sum of completed steps
- Real-time updates via polling or event emitters

---

## Technical Implementation Notes

### State Management (Zustand)

```typescript
// onboardingStore.ts
interface OnboardingState {
  // Wizard state
  accountType: 'personal' | 'business' | 'accountant' | null
  name: string
  phoneNumber: string
  timezone: string
  entityName: string
  country: string
  currency: string

  // IDs (after creation)
  tenantId: string | null
  entityId: string | null

  // Progress tracking
  progress: OnboardingProgress | null

  // Actions
  setAccountType: (type) => void
  setName: (name) => void
  // ... other setters
  fetchProgress: () => Promise<void>
  updateProgress: (step, completed) => Promise<void>
}
```

### API Routes

**POST /api/system/onboarding/initialize**
- Creates: Tenant, Entity, TenantUser, OnboardingProgress (40%)
- Updates: User (phone, timezone)
- Returns: tenantId, entityId, onboardingProgress

**GET /api/system/onboarding/progress**
- Returns: OnboardingProgress for current tenant
- Used by: Dashboard hero card, sidebar indicator

**POST /api/system/onboarding/update-progress**
- Body: { step, completed }
- Updates: OnboardingProgress.completionPercentage
- Recalculates: Percentage based on completed steps

**POST /api/system/onboarding/skip-step**
- Body: { step, skipDurationDays }
- Adds step to skippedSteps array
- Sets lastNudgedAt to avoid immediate re-prompts

**POST /api/system/onboarding/dismiss-card**
- Sets dashboardCardDismissedAt
- Increments dismissalCount
- Hides card for 24 hours

### Completion Percentage Calculation

```typescript
// Weights per step (out of 100%)
const stepWeights = {
  basic_info: 20,        // Required
  entity_setup: 20,      // Required
  business_details: 20,  // Optional (Business only)
  bank_connection: 20,   // Optional
  goals_setup: 20        // Optional
}

// Calculate percentage
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

### Real-Time Progress Updates

**Option 1: Polling (MVP)**
```typescript
// Dashboard hero card
useEffect(() => {
  const interval = setInterval(fetchProgress, 30000) // 30s
  return () => clearInterval(interval)
}, [])
```

**Option 2: WebSockets (Future)**
```typescript
// Server emits 'progress-updated' event
socket.on('progress-updated', (data) => {
  setProgress(data)
})
```

---

## Design Deliverables Needed

For each screen, designers should provide:

1. **High-fidelity mockups** (Figma)
   - Desktop: 1440px width
   - Tablet: 768px width
   - Mobile: 375px width

2. **Interactive prototype** (Figma prototype mode)
   - Click flows between screens
   - Modal open/close animations
   - Form validation states

3. **Component breakdown**
   - List of shadcn/ui components used
   - Custom components needed
   - Glass morphism variants

4. **State variations**
   - Empty states
   - Loading states (skeletons, spinners)
   - Error states (validation, network)
   - Success states (checkmarks, confetti)

5. **Animation specs**
   - Transition timing (ms)
   - Easing functions (spring, ease-out)
   - Trigger events (click, hover, scroll)

6. **Spacing & sizing**
   - Exact px values for margins, padding, gaps
   - Typography sizes (text-xl, text-3xl, etc.)
   - Component dimensions

7. **Accessibility notes**
   - ARIA labels for icon-only buttons
   - Keyboard navigation order
   - Focus states (ring-2 ring-primary)
   - Screen reader announcements

---

## Success Metrics

**Primary Metrics:**
- **Time to Dashboard:** < 90 seconds (target: 60s)
- **Wizard Completion Rate:** > 95% (sign-up → dashboard access)
- **Full Completion Rate:** > 60% within 7 days

**Secondary Metrics:**
- **Bank Connection Rate:** > 40% within 14 days
- **Goals Setup Rate:** > 30% within 30 days
- **Hero Card Dismissal Rate:** < 20% (indicates good relevance)

**UX Metrics:**
- **User Satisfaction (NPS):** > 8/10 on onboarding experience
- **Support Tickets:** < 5% of users need help with setup
- **Feature Adoption:** Users with complete onboarding use 3x more features

---

## Questions for Design Review

Before starting design, answer:

1. **Plaid Integration:** Phase 1 (manual only) or Phase 2 (Plaid)? This affects bank connection screen complexity.

2. **Confetti Animation:** On 100% completion, yes or no? (Subtle vs. none)

3. **Dashboard Card Persistence:** Database (dashboardCardDismissedAt) or LocalStorage? (Affects cross-device experience)

4. **Sidebar Click Action:** Open modal OR scroll to dashboard hero card?

5. **Goals Data Model:** Separate Goals table (future features) or simple Entity fields (MVP)?

6. **Fiscal Year Question:** Ask during wizard (business details) or defer to settings?

---

---

## Flow Comparison & Recommendations

### Option A vs Option B: Detailed Analysis

| Aspect | Option A: Minimal First | Option B: Comprehensive |
|--------|------------------------|-------------------------|
| **Time to Dashboard** | 60 seconds | 120-180 seconds |
| **Wizard Screens** | 2 screens (Welcome, Essential) | 4-5 screens (Welcome, Essential, Purpose, Bank, Success) |
| **Required Fields** | 6 fields (name, phone, timezone, entity, country, currency) | 10-12 fields (adds address, purpose, bank) |
| **Abandonment Risk** | Low (~5-10%) | Medium (~15-25%) |
| **Setup Completion** | 40% on dashboard arrival | 70-80% on dashboard arrival |
| **Feature Readiness** | Limited (missing bank, purpose) | High (most features ready) |
| **Re-engagement Needed** | Yes (hero card nudges) | Minimal (most data collected) |
| **User Control** | High (choose when to complete) | Medium (must complete upfront) |
| **Mobile Experience** | Excellent (fast, simple) | Fair (longer forms on small screen) |
| **Personalization** | Delayed (after dashboard) | Immediate (dashboard pre-configured) |
| **Data Quality** | Lower (skipped fields) | Higher (all fields validated) |
| **Support Burden** | Medium (help with setup) | Low (less "how do I..." questions) |

### Recommended Approach by User Segment

**Personal Users:**
- **Recommended:** Option A (Minimal First)
- **Reason:** Personal users want quick access, explore features first, commit later
- **Exception:** Power users (identified via marketing) could handle Option B

**Business Users (Solopreneurs):**
- **Recommended:** Option A (Minimal First)
- **Reason:** Need to evaluate before full commitment, bank connection can wait
- **Exception:** If coming from "Create Invoice" CTA, skip straight to business details

**Business Users (Established):**
- **Recommended:** Option B (Comprehensive) with skip options
- **Reason:** Have all info ready, want full setup immediately
- **Signal:** If referred by accountant or migrating from another tool

**Accountants:**
- **Recommended:** Option A (Minimal First)
- **Reason:** Want to explore interface before adding clients, billing can wait

### Implementation Recommendation

**Phase 1 (MVP - Ship First):**
- Build Option A (Minimal First) only
- Focus: Speed to dashboard, excellent hero card UX
- Skip: Purpose screen (collect in hero card modal), Bank connection wizard (manual entry only)
- Goal: 60-second onboarding, 95%+ completion rate

**Phase 2 (Post-Launch - Add Depth):**
- Add Purpose screen as optional modal (A/B test placement)
- Add Plaid bank connection wizard
- Enhance hero card with better personalization
- A/B test: Minimal vs Comprehensive flows for business users

**Phase 3 (Optimize):**
- Smart routing: Detect user intent from UTM params, show appropriate flow
- Progressive profiling: Collect data over time, not all upfront
- AI-powered nudges: Predict best time to prompt each setup step

---

## Technical Implementation Priorities

### Must-Have (Phase 1 - MVP)
- [ ] Welcome screen (account type selection)
- [ ] Essential Info form (all 3 variants)
- [ ] Success screen with animation
- [ ] Dashboard with onboarding hero card
- [ ] Sidebar progress indicator
- [ ] Manual account creation (no Plaid)
- [ ] API: POST /onboarding/initialize
- [ ] API: GET /onboarding/progress
- [ ] API: POST /onboarding/update-progress
- [ ] Zustand onboarding store with persistence
- [ ] Form validation (client-side)
- [ ] Error handling (network, validation)
- [ ] Mobile-responsive layouts (375px - 1440px)

### Should-Have (Phase 2 - Post-Launch)
- [ ] Purpose screen (as modal, not wizard step)
- [ ] Business details modal
- [ ] Goals setup modal
- [ ] Plaid bank connection
- [ ] API: POST /onboarding/skip-step
- [ ] API: POST /onboarding/dismiss-card
- [ ] Hero card collapse/expand
- [ ] Confetti animation on 100%
- [ ] Real-time progress updates (polling)
- [ ] Duplicate entity detection

### Nice-to-Have (Phase 3 - Optimize)
- [ ] A/B testing framework (Option A vs B)
- [ ] Smart flow routing (UTM-based)
- [ ] WebSocket progress updates
- [ ] Inline duplicate checking (as user types)
- [ ] Progressive profiling (data collection over time)
- [ ] Onboarding analytics dashboard
- [ ] Session replay (to debug abandonment)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Multi-language support

---

## Development Effort Estimates

**Option A (Minimal First) - Recommended for MVP:**
- Welcome Screen: 1-2 days (design + dev)
- Essential Info Form: 3-4 days (3 variants, validation, API integration)
- Success Screen: 0.5 days (simple animation)
- Dashboard Hero Card: 2-3 days (collapsible, progress chart, checklist)
- Sidebar Indicator: 0.5 days (progress bar)
- API Endpoints: 2-3 days (initialize, progress, update)
- State Management: 1 day (Zustand store, persistence)
- Testing: 2 days (unit + integration)
- **Total: 12-16 days (2.5-3 weeks for 1 developer)**

**Option B (Comprehensive) - If Chosen:**
- All of Option A: 12-16 days
- Purpose Screen: 2 days (card selection UI, API integration)
- Bank Connection Wizard: 4-5 days (Plaid integration, manual fallback, error handling)
- Additional API Endpoints: 1 day
- Extended Testing: 2 days
- **Total: 21-26 days (4-5 weeks for 1 developer)**

**Post-MVP Enhancements (Phase 2):**
- Business Details Modal: 2 days
- Goals Setup Modal: 2 days
- Plaid Integration (if not in MVP): 4-5 days
- Hero Card Enhancements: 2 days
- **Total: 10-13 days (2-2.5 weeks)**

---

## Success Criteria & Metrics

**Primary Success Metrics (P0):**
- [ ] **Wizard Completion Rate:** ≥ 95% (sign-up → dashboard access)
- [ ] **Time to Dashboard:** ≤ 90 seconds (target: 60s)
- [ ] **Error Rate:** ≤ 2% (form submission failures)

**Secondary Success Metrics (P1):**
- [ ] **7-Day Full Completion:** ≥ 60% reach 100%
- [ ] **14-Day Bank Connection:** ≥ 40% connect bank account
- [ ] **30-Day Goals Setup:** ≥ 30% set at least one goal
- [ ] **Hero Card Engagement:** ≤ 20% dismiss without completing

**User Experience Metrics (P2):**
- [ ] **User Satisfaction (NPS):** ≥ 8/10 on onboarding experience
- [ ] **Support Tickets:** ≤ 5% need help with onboarding
- [ ] **Mobile Completion:** ≥ 85% complete on mobile devices

**Tracking Implementation:**
```typescript
// Analytics events to track
analytics.track('Onboarding Started', { accountType })
analytics.track('Onboarding Step Completed', { step, timeSpent })
analytics.track('Onboarding Completed', { totalTime, completionPercentage })
analytics.track('Onboarding Abandoned', { step, reason })
analytics.track('Hero Card Dismissed', { completionPercentage, dismissalCount })
analytics.track('Setup Step Completed', { step, source: 'hero_card' | 'settings' })
```

---

## Final Recommendation

**For Akount MVP:**
1. **Implement Option A (Minimal First)** - Ship fast, validate quickly
2. **Focus on hero card excellence** - Make post-dashboard completion delightful
3. **Manual bank entry only** - Skip Plaid complexity for MVP
4. **Purpose capture in hero card** - Not in wizard, but first post-dashboard modal
5. **Measure everything** - Track completion, abandonment, time-to-value
6. **A/B test later** - Once MVP validated, test comprehensive flow for business users

**Rationale:**
- Faster time-to-market (2-3 weeks vs 4-5 weeks)
- Lower abandonment risk (shorter wizard)
- Easier to iterate (add steps later vs remove them)
- Better mobile experience (critical for solopreneurs)
- Proven pattern (most successful SaaS apps use progressive onboarding)

---

**End of Onboarding User Flow**

Use this flow with [ai-design-prompt.md](./ai-design-prompt.md) Page Context for complete design brief.
