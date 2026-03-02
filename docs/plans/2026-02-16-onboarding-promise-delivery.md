# Onboarding Promise Delivery — Technical Implementation Plan

> **Context:** Architecture to support personal-first onboarding that scales to multi-entity solopreneurs
> **Companion Document:** `2026-02-16-onboarding-personal-first-ux.md` (UX/questions)
> **Date:** 2026-02-16

---

## North Star Use Case

**Solopreneur with multi-country entities:**

- **Personal entity** in Canada (CAD functional currency, tax residence = CA)
- **US LLC** in United States (USD functional currency, Delaware incorporation)
- **India branch** in India (INR functional currency, branch office)

**Requirements:**
- Single login (one Clerk user)
- Single subscription/billing (one Tenant)
- Three entities (personal + 2 business)
- Separate transaction tracking per entity
- Consolidated "All Entities" view (aggregated across CAD, USD, INR)
- Bank account assignment: auto-assign if unambiguous, ask if multiple entities match currency
- Tax residence per entity (personal = Canada, LLC = US, branch = India)
- Migration path: personal-only → personal + business (no data loss, offer recategorization)

---

## Data Model Architecture

### Current Schema (Already Exists)

```prisma
model Tenant {
  id                      String   @id @default(cuid())
  name                    String
  status                  TenantStatus @default(ACTIVE)  // ACTIVE, CLOSED, SUSPENDED
  onboardingStatus        OnboardingStatus @default(IN_PROGRESS)  // IN_PROGRESS, COMPLETED
  onboardingCompletedAt   DateTime?
  createdAt               DateTime @default(now())

  entities                Entity[]
  users                   TenantUser[]
}

model Entity {
  id                    String   @id @default(cuid())
  tenantId              String
  name                  String
  entityType            EntityType  // PERSONAL, CORPORATION, LLC, SOLE_PROPRIETORSHIP, PARTNERSHIP
  country               String  // ISO 2-letter code (CA, US, IN)
  functionalCurrency    String  // ISO 3-letter code (CAD, USD, INR)
  taxResidence          String?  // ISO 2-letter code (can differ from country for expats)
  fiscalYearStart       Int @default(1)  // 1 = January

  tenant                Tenant @relation(fields: [tenantId], references: [id])
  accounts              Account[]
  invoices              Invoice[]
  bills                 Bill[]
  journalEntries        JournalEntry[]
  categories            Category[]
}

model OnboardingProgress {
  id          String   @id @default(cuid())
  userId      String   @unique  // Clerk user ID
  tenantId    String?  // Set after /initialize creates tenant
  currentStep Int      @default(0)
  stepData    Json     @default("{}")  // Stores answers (accountType, employment, intents, etc.)
  version     Int      @default(1)  // Optimistic locking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Key observations:**
- ✅ `Entity.entityType` already supports 'PERSONAL' (no schema change needed)
- ✅ `Entity.country` and `functionalCurrency` already exist
- ✅ `Entity.taxResidence` already exists (nullable for edge cases)
- ✅ `OnboardingProgress.stepData` is JSON (flexible for new fields)
- ⚠️ `OnboardingProgress.tenantId` is nullable (set after tenant creation)

**What's missing:**
- Residential address fields (street, city, province, postal code)
- Employment status (currently not stored)
- Intent selection (currently not stored)

---

### Schema Changes Needed

#### 1. Add User Profile Fields

Create new `UserProfile` model to store personal details (separate from Entity):

```prisma
model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique  // Clerk user ID

  // Personal details (from Clerk + onboarding)
  firstName       String
  lastName        String
  email           String
  phone           String?

  // Residential address (from onboarding Question 5)
  country         String   // ISO 2-letter code
  streetAddress   String
  city            String
  province        String?  // State/province (if applicable)
  postalCode      String

  // Onboarding metadata
  employmentStatus String  // 'student', 'employed-full-time', 'self-employed', 'founder', 'not-working', 'prefer-not-to-say'
  intents         String[] // Array of intent strings: ['track-spending', 'saving', 'tax-ready', 'debt', 'exploring']

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Why separate from Entity?**
- User profile is **person-level** (1 per Clerk user)
- Entity is **business-level** (1-to-many per tenant)
- Personal address is NOT the same as business address
- User profile survives even if tenant is closed

#### 2. Update OnboardingProgress

No schema changes needed — use `stepData` JSON to store:

```typescript
interface OnboardingStepData {
  // Question 1
  accountType?: 'personal' | 'business'

  // Question 2
  intents?: string[]  // ['track-spending', 'tax-ready', etc.]

  // Question 3
  employmentStatus?: 'student' | 'employed-full-time' | 'self-employed' | 'founder' | 'not-working' | 'prefer-not-to-say'

  // Question 4 (conditional)
  businessName?: string
  businessEntityType?: 'SOLE_PROPRIETORSHIP' | 'LLC' | 'CORPORATION' | 'PARTNERSHIP'
  businessCountry?: string
  businessIndustry?: string

  // Question 5
  country?: string
  streetAddress?: string
  city?: string
  province?: string
  postalCode?: string

  // Auto-captured
  ipCountry?: string  // Inferred from IP
  signupReferrer?: string
}
```

---

## Multi-Country Support Architecture

### Currency & Tax Defaults by Country

```typescript
const COUNTRY_DEFAULTS: Record<string, { currency: string; fiscalYearStart: number; timeZone: string }> = {
  CA: { currency: 'CAD', fiscalYearStart: 1, timeZone: 'America/Toronto' },
  US: { currency: 'USD', fiscalYearStart: 1, timeZone: 'America/New_York' },
  IN: { currency: 'INR', fiscalYearStart: 4, timeZone: 'Asia/Kolkata' },  // India fiscal year starts April 1
  GB: { currency: 'GBP', fiscalYearStart: 4, timeZone: 'Europe/London' },  // UK fiscal year starts April 6
  AU: { currency: 'AUD', fiscalYearStart: 7, timeZone: 'Australia/Sydney' },  // Australia fiscal year starts July 1
  DE: { currency: 'EUR', fiscalYearStart: 1, timeZone: 'Europe/Berlin' },
  // ... 189 more countries
}
```

**Source:** Maintain in `packages/db/seed/country-defaults.json` (reference: ISO 4217 for currencies, fiscal year data from tax authorities).

**Usage:**
- When creating Entity, look up defaults: `COUNTRY_DEFAULTS[entity.country]`
- User can override `functionalCurrency` and `fiscalYearStart` in Settings

---

### Address Validation by Country

Use `i18n-postal-address` library for country-aware validation:

```typescript
import { validateAddress } from 'i18n-postal-address'

function validateAddressForCountry(country: string, address: Address): ValidationResult {
  const rules = {
    CA: {
      provinceRequired: true,
      postalCodeFormat: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,  // A1A 1A1
    },
    US: {
      stateRequired: true,
      postalCodeFormat: /^\d{5}(-\d{4})?$/,  // 12345 or 12345-6789
    },
    IN: {
      stateRequired: true,
      postalCodeFormat: /^\d{6}$/,  // 110001
    },
    // ... other countries
  }

  const countryRules = rules[country] || { provinceRequired: false, postalCodeFormat: /.*/ }

  // Validate province requirement
  if (countryRules.provinceRequired && !address.province) {
    return { valid: false, error: 'Province/State is required for this country' }
  }

  // Validate postal code format
  if (!countryRules.postalCodeFormat.test(address.postalCode)) {
    return { valid: false, error: 'Invalid postal code format for this country' }
  }

  return { valid: true }
}
```

**Implementation:**
- Frontend: Dynamic province/state dropdown based on country selection
- Backend: Validate address format before creating `UserProfile`

---

## Entity Architecture: Personal + Business Coexistence

### Pattern 1: "Just me" (Personal-Only)

**Onboarding creates:**
1. `Tenant` (name = user's full name, onboardingStatus = 'COMPLETED')
2. `Entity` (name = "Personal Account", entityType = 'PERSONAL', country = residential country, currency = country default)
3. `UserProfile` (personal details + residential address)
4. `TenantUser` (userId = Clerk ID, tenantId, role = 'OWNER')

**Frontend display:**
- Dashboard title: "Your Money"
- No entity switcher (hidden with CSS: `display: none` when `tenant.entities.length === 1 && entities[0].entityType === 'PERSONAL'`)
- Account list shows: "Personal Account" or just user's name

**SQL query for dashboard:**
```sql
SELECT * FROM accounts
WHERE entityId = (SELECT id FROM entities WHERE tenantId = $tenantId AND entityType = 'PERSONAL')
  AND deletedAt IS NULL
```

---

### Pattern 2: "Me + my business" (Multi-Entity)

**Onboarding creates:**
1. `Tenant` (name = user's full name)
2. `Entity` #1 (name = "Personal - {Country}", entityType = 'PERSONAL', country = residential country)
3. `Entity` #2 (name = business name, entityType = user choice, country = incorporation country)
4. `UserProfile` (same as Pattern 1)
5. `TenantUser` (same as Pattern 1)

**Frontend display:**
- Dashboard title: "Your Accounts"
- Entity switcher (dropdown in top-right): "Personal - Canada" | "Acme Consulting (US LLC)" | "All Entities"
- Transaction list filtered by selected entity
- "All Entities" view: consolidated (aggregates across entities, converts to tenant's primary currency)

**Entity switcher logic:**
```typescript
// apps/web/src/stores/entityStore.ts
export const useEntityStore = create<EntityStore>((set) => ({
  selectedEntityId: null,  // null = "All Entities"
  entities: [],

  selectEntity: (entityId: string | null) => set({ selectedEntityId: entityId }),

  // Cookie-based persistence (survives page refresh)
  hydrate: async () => {
    const entityId = getCookie('selected-entity-id')
    set({ selectedEntityId: entityId || null })
  }
}))
```

**SQL query for dashboard (All Entities view):**
```sql
SELECT
  a.*,
  e.name as entityName,
  e.functionalCurrency,
  a.currentBalance as originalBalance,
  (a.currentBalance * er.rate) as consolidatedBalance  -- Convert to tenant primary currency
FROM accounts a
INNER JOIN entities e ON a.entityId = e.id
LEFT JOIN exchange_rates er ON er.fromCurrency = e.functionalCurrency AND er.toCurrency = $tenantPrimaryCurrency
WHERE e.tenantId = $tenantId
  AND a.deletedAt IS NULL
ORDER BY e.name, a.name
```

---

## Bank Account Assignment Logic

### Auto-Assignment Rules

When user connects a bank account via Plaid:

```typescript
async function assignAccountToEntity(
  account: PlaidAccount,
  tenantId: string
): Promise<{ entityId: string; confidence: 'auto' | 'manual' }> {
  const entities = await prisma.entity.findMany({
    where: { tenantId, deletedAt: null }
  })

  // Rule 1: If only one entity exists, auto-assign
  if (entities.length === 1) {
    return { entityId: entities[0].id, confidence: 'auto' }
  }

  // Rule 2: Match by currency
  const matchingEntities = entities.filter(e => e.functionalCurrency === account.currency)

  // Rule 2a: If exactly one entity matches currency, auto-assign
  if (matchingEntities.length === 1) {
    return { entityId: matchingEntities[0].id, confidence: 'auto' }
  }

  // Rule 2b: If multiple entities match currency, ask user (ambiguous)
  if (matchingEntities.length > 1) {
    // Return to frontend with options
    throw new AmbiguousEntityError({
      message: 'Multiple entities use this currency',
      options: matchingEntities.map(e => ({ id: e.id, name: e.name, type: e.entityType }))
    })
  }

  // Rule 3: No currency match — ask user to select (edge case)
  throw new AmbiguousEntityError({
    message: 'Could not auto-assign entity',
    options: entities.map(e => ({ id: e.id, name: e.name, type: e.entityType }))
  })
}
```

**Frontend handling:**
```typescript
// apps/web/src/app/(dashboard)/banking/accounts/connect/components/EntitySelector.tsx

'use client'
export function EntitySelector({ account, entities, onConfirm }: Props) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Which account is this for?</DialogTitle>
          <DialogDescription>
            We found multiple entities that use {account.currency}. Which one does this account belong to?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedEntityId} onValueChange={setSelectedEntityId}>
          {entities.map(entity => (
            <div key={entity.id} className="flex items-center space-x-2">
              <RadioGroupItem value={entity.id} />
              <Label>
                {entity.name} ({entity.entityType}, {entity.country})
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button onClick={() => onConfirm(selectedEntityId)} disabled={!selectedEntityId}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Migration Path: Personal → Personal + Business

### Scenario

User signed up 6 months ago as "Just me" (personal-only). Now they want to track business separately.

**Steps:**

1. **User triggers migration:**
   - Settings → Entities → "Add business entity" button
   - OR: Prompt when connecting a foreign currency account: "Is this for a business?"

2. **Backend: Rename personal entity (make concept explicit):**
   ```typescript
   await prisma.entity.update({
     where: { id: personalEntityId },
     data: {
       name: `Personal - ${entity.country}`  // "Your Account" → "Personal - Canada"
     }
   })
   ```

3. **Backend: Create business entity:**
   ```typescript
   const businessEntity = await prisma.entity.create({
     data: {
       tenantId,
       name: businessName,  // e.g., "Acme Consulting"
       entityType: businessEntityType,  // LLC, CORPORATION, etc.
       country: businessCountry,
       functionalCurrency: COUNTRY_DEFAULTS[businessCountry].currency,
       fiscalYearStart: COUNTRY_DEFAULTS[businessCountry].fiscalYearStart,
     }
   })
   ```

4. **Frontend: Show entity switcher (previously hidden):**
   ```typescript
   // apps/web/src/components/layout/entity-switcher.tsx
   // Now visible because tenant.entities.length > 1
   ```

5. **Backend: Offer transaction recategorization (optional):**
   ```typescript
   // Detect transactions that might be business
   const candidateTransactions = await prisma.transaction.findMany({
     where: {
       entityId: personalEntityId,
       OR: [
         { description: { contains: 'business', mode: 'insensitive' } },
         { category: { name: { in: ['Business Expenses', 'Consulting Income'] } } },
         { amount: { gte: 50000 } }  // $500+ transactions
       ]
     }
   })

   // Return to frontend with suggestions
   return {
     businessEntity,
     suggestedTransactions: candidateTransactions,
   }
   ```

6. **Frontend: Recategorization dialog:**
   ```tsx
   <RecategorizationDialog
     transactions={suggestedTransactions}
     sourceEntity={personalEntity}
     targetEntity={businessEntity}
     onConfirm={async (selectedTxIds) => {
       await fetch('/api/banking/transactions/recategorize', {
         method: 'POST',
         body: JSON.stringify({
           transactionIds: selectedTxIds,
           fromEntityId: personalEntity.id,
           toEntityId: businessEntity.id,
         })
       })
     }}
   />
   ```

7. **Backend: Recategorize transactions (non-destructive):**
   ```typescript
   // Update transaction entity (preserves audit trail)
   await prisma.transaction.updateMany({
     where: { id: { in: transactionIds } },
     data: { entityId: businessEntity.id }
   })

   // Update related journal entries (if already posted)
   await prisma.journalEntry.updateMany({
     where: { sourceType: 'TRANSACTION', sourceId: { in: transactionIds } },
     data: { entityId: businessEntity.id }
   })
   ```

**Edge case: User regrets recategorization?**
- Offer "Undo" within 24 hours (stores original entityId in metadata)
- After 24 hours, user must manually recategorize back

---

## IP-Based Country Detection

### Implementation

```typescript
// apps/api/src/lib/geo.ts
import { lookup } from 'geoip-lite'

export function detectCountryFromIP(ip: string): string | null {
  const geo = lookup(ip)
  return geo?.country || null  // Returns 'CA', 'US', 'IN', etc.
}
```

**Usage in onboarding:**
```typescript
// apps/api/src/domains/system/routes/onboarding.ts

fastify.post('/resume', async (request, reply) => {
  const userId = request.userId
  const ipCountry = detectCountryFromIP(request.ip)

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId }
  })

  if (!progress) {
    // New user — create progress with IP-detected country
    const newProgress = await prisma.onboardingProgress.create({
      data: {
        userId,
        currentStep: 0,
        stepData: { ipCountry },  // Store for pre-fill
      }
    })
    return reply.send({ ...newProgress, isNew: true })
  }

  return reply.send(progress)
})
```

**Frontend usage:**
```tsx
// apps/web/src/app/onboarding/page.tsx

export default async function OnboardingPage() {
  const resumeState = await getOnboardingProgress(userId)

  return (
    <OnboardingWizard
      initialState={resumeState}
      ipCountry={resumeState.stepData.ipCountry}  // Pre-fill country dropdown
    />
  )
}
```

---

## Implementation Phases

### Phase 1: Schema Updates (2-3 hours)

**Tasks:**
1. Create Prisma migration for `UserProfile` model
2. Run migration in dev: `npx prisma migrate dev --name add-user-profile`
3. Update `OnboardingStepData` TypeScript interface
4. Add country defaults JSON: `packages/db/seed/country-defaults.json`
5. Seed country defaults: `npx prisma db seed`

**Files modified:**
- `packages/db/prisma/schema.prisma`
- `packages/db/seed/seed.ts`
- `packages/types/src/onboarding.ts` (new interface)

**Tests:**
- Migration runs without errors
- Country defaults seed correctly (195 countries)
- `UserProfile` CRUD operations work

---

### Phase 2: Backend Services (4-5 hours)

**Tasks:**
1. Update onboarding service:
   - Auto-populate from Clerk: `firstName`, `lastName`, `email`, `phone`
   - Detect IP country: `detectCountryFromIP(request.ip)`
   - Create `UserProfile` on /initialize
   - Support business entity creation (conditional)
2. Create entity service methods:
   - `renamePersonalEntity()` (for migration)
   - `createBusinessEntity()`
   - `listEntities(tenantId)` (for entity switcher)
3. Update account connection service:
   - `assignAccountToEntity()` with auto-assignment logic
   - Throw `AmbiguousEntityError` if multiple matches

**Files modified:**
- `apps/api/src/domains/system/services/onboarding.service.ts`
- `apps/api/src/domains/system/services/entity.service.ts` (new file)
- `apps/api/src/domains/banking/services/account.service.ts`
- `apps/api/src/domains/system/routes/onboarding.ts`
- `apps/api/src/domains/system/routes/entity.ts` (new file)

**New endpoints:**
- `POST /system/entities` — Create business entity (for migration)
- `GET /system/entities` — List entities for tenant
- `PATCH /system/entities/:id` — Rename entity
- `POST /banking/transactions/recategorize` — Move transactions between entities

**Tests:**
- Onboarding creates `UserProfile` + `Entity` correctly
- IP country detection works (mock IP in tests)
- Business entity creation respects country defaults
- Account assignment auto-assigns correctly
- Ambiguous entity throws error with options

---

### Phase 3: Frontend Onboarding UI (6-8 hours)

**Tasks:**
1. Update `onboardingStore.ts`:
   - Add fields: `firstName`, `lastName`, `email`, `employment`, `intents`, `businessName`, `businessEntityType`, `businessCountry`
   - Hydrate from Clerk: `currentUser()` → auto-populate name/email
2. Redesign onboarding wizard steps:
   - Step 1: "Who are we organizing money for?" (2 cards)
   - Step 2: "What do you want help with?" (multi-select)
   - Step 3: "Employment situation" (radio buttons)
   - Step 4: "Business tracking?" (conditional, 2 cards)
   - Step 5: "Where do you live?" (address form with country pre-fill)
   - Step 6: "Review" (summary card)
3. Implement country-aware validation:
   - Dynamic province/state dropdown
   - Postal code format validation
   - Use `i18n-postal-address` library
4. Copy updates (see UX brainstorm doc)

**Files modified:**
- `apps/web/src/stores/onboardingStore.ts`
- `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
- `apps/web/src/app/onboarding/components/AccountTypeStep.tsx` (new)
- `apps/web/src/app/onboarding/components/IntentStep.tsx` (new)
- `apps/web/src/app/onboarding/components/EmploymentStep.tsx` (new)
- `apps/web/src/app/onboarding/components/BusinessSetupStep.tsx` (new)
- `apps/web/src/app/onboarding/components/AddressStep.tsx` (redesign)
- `apps/web/src/app/onboarding/components/ReviewStep.tsx` (new)

**Tests:**
- Each step renders correctly
- Conditional business step shows only if employment = self-employed/founder
- Country pre-fill works (mock IP country)
- Province dropdown updates when country changes
- Postal code validation works per country
- Auto-save triggers on field change (existing v3 behavior)

---

### Phase 4: Entity Switcher & Multi-Entity UI (4-5 hours)

**Tasks:**
1. Create `entityStore.ts` (Zustand):
   - `selectedEntityId` state (null = "All Entities")
   - Cookie-based persistence
   - `selectEntity()` action
2. Build entity switcher component:
   - Dropdown in top navbar (right side)
   - Options: "Personal - Canada", "Acme Consulting (US LLC)", "All Entities"
   - Hidden if only 1 personal entity exists
3. Update dashboard pages to filter by entity:
   - Accounts list
   - Transactions list
   - Invoices list
   - Reports (filter parameter)
4. "All Entities" view:
   - Aggregate across entities
   - Convert to tenant primary currency
   - Show entity badge per item

**Files created:**
- `apps/web/src/stores/entityStore.ts`
- `apps/web/src/components/layout/entity-switcher.tsx`

**Files modified:**
- `apps/web/src/app/(dashboard)/layout.tsx` (add entity switcher to navbar)
- `apps/web/src/app/(dashboard)/banking/accounts/page.tsx` (filter by entity)
- `apps/web/src/app/(dashboard)/banking/transactions/page.tsx` (filter by entity)
- `apps/web/src/app/(dashboard)/invoicing/page.tsx` (filter by entity)

**Tests:**
- Entity switcher appears only when >1 entity exists
- Entity switcher hidden for personal-only users
- Selecting entity updates URL query param: `?entity=abc123`
- "All Entities" aggregates correctly
- Currency conversion shows correct rates

---

### Phase 5: Migration Flow (3-4 hours)

**Tasks:**
1. Settings → Entities page:
   - List all entities
   - "Add business entity" button (always visible)
   - Edit/rename entity
2. Business entity setup wizard (same as onboarding Step 4):
   - Business name, entity type, country, industry
3. Transaction recategorization flow:
   - Detect candidate transactions (heuristics)
   - Show dialog with checkboxes
   - "Move to business" action
   - Success toast + entity switcher now visible
4. Rename personal entity on migration:
   - "Your Account" → "Personal - {Country}"

**Files created:**
- `apps/web/src/app/(dashboard)/settings/entities/page.tsx`
- `apps/web/src/app/(dashboard)/settings/entities/add-business/page.tsx`
- `apps/web/src/app/(dashboard)/settings/entities/components/RecategorizationDialog.tsx`

**Files modified:**
- `apps/api/src/domains/system/routes/entity.ts` (add migration endpoints)
- `apps/api/src/domains/banking/routes/transaction.ts` (add recategorize endpoint)

**Tests:**
- "Add business entity" wizard completes successfully
- Personal entity renamed automatically
- Entity switcher appears after migration
- Transaction recategorization moves transactions correctly
- Journal entries update entity reference

---

### Phase 6: Testing & Polish (3-4 hours)

**Tasks:**
1. E2E test scenarios:
   - Personal-only onboarding (student path)
   - Personal + business onboarding (self-employed path)
   - Migration: personal → personal + business
   - Multi-country entities (Canada personal + US LLC + India branch)
   - Bank account assignment (auto + manual)
2. Edge case testing:
   - IP detection fails (fallback to manual country selection)
   - User changes country mid-onboarding (re-render validations)
   - Multiple entities with same currency (disambiguation dialog)
   - User closes browser mid-onboarding (auto-save resume)
3. Performance testing:
   - "All Entities" view with 1000+ transactions
   - Entity switcher with 10+ entities
4. Copy polish:
   - Review all onboarding copy against UX doc
   - Ensure "personal-first" tone throughout
5. Accessibility:
   - Keyboard navigation for entity switcher
   - Screen reader labels for radio buttons
   - ARIA labels for multi-select intents

**Tests to write:**
- `apps/api/src/domains/system/__tests__/onboarding-personal-first.test.ts`
- `apps/api/src/domains/system/__tests__/entity-migration.test.ts`
- `apps/api/src/domains/banking/__tests__/account-assignment.test.ts`
- `apps/web/src/app/onboarding/__tests__/onboarding-wizard.test.tsx`

---

## Test Cases

### Backend Tests

#### Test: Personal-only onboarding

```typescript
it('should create personal entity with country defaults', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/system/onboarding/initialize',
    headers: { authorization: 'Bearer test-token' },
    body: {
      accountType: 'personal',
      country: 'CA',
      streetAddress: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      employmentStatus: 'student',
      intents: ['track-spending', 'saving'],
    },
  })

  expect(response.statusCode).toBe(200)
  const body = response.json()

  // Verify tenant created
  expect(body.tenantId).toBeDefined()

  // Verify personal entity created with country defaults
  const entity = await prisma.entity.findFirst({
    where: { tenantId: body.tenantId, entityType: 'PERSONAL' }
  })
  expect(entity).toBeDefined()
  expect(entity.country).toBe('CA')
  expect(entity.functionalCurrency).toBe('CAD')
  expect(entity.fiscalYearStart).toBe(1)  // January

  // Verify UserProfile created
  const profile = await prisma.userProfile.findUnique({
    where: { userId: request.userId }
  })
  expect(profile).toBeDefined()
  expect(profile.country).toBe('CA')
  expect(profile.employmentStatus).toBe('student')
  expect(profile.intents).toEqual(['track-spending', 'saving'])
})
```

#### Test: Business entity creation

```typescript
it('should create personal + business entities', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/system/onboarding/initialize',
    body: {
      accountType: 'business',
      // Personal details
      country: 'CA',
      streetAddress: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      employmentStatus: 'self-employed',
      intents: ['tax-ready'],
      // Business details
      businessName: 'Acme Consulting',
      businessEntityType: 'LLC',
      businessCountry: 'US',
      businessIndustry: 'Consulting',
    },
  })

  expect(response.statusCode).toBe(200)
  const body = response.json()

  const entities = await prisma.entity.findMany({
    where: { tenantId: body.tenantId }
  })

  expect(entities).toHaveLength(2)

  // Verify personal entity
  const personal = entities.find(e => e.entityType === 'PERSONAL')
  expect(personal.country).toBe('CA')
  expect(personal.functionalCurrency).toBe('CAD')

  // Verify business entity
  const business = entities.find(e => e.entityType === 'LLC')
  expect(business.name).toBe('Acme Consulting')
  expect(business.country).toBe('US')
  expect(business.functionalCurrency).toBe('USD')
})
```

#### Test: Bank account auto-assignment

```typescript
it('should auto-assign account if only one entity matches currency', async () => {
  // Setup: Create tenant with 2 entities (personal CAD + business USD)
  const tenant = await createTestTenant()
  const personalEntity = await createEntity({ tenantId: tenant.id, entityType: 'PERSONAL', currency: 'CAD' })
  const businessEntity = await createEntity({ tenantId: tenant.id, entityType: 'LLC', currency: 'USD' })

  // Connect USD bank account
  const response = await app.inject({
    method: 'POST',
    url: '/api/banking/accounts/connect',
    body: {
      plaidAccountId: 'test-account-usd',
      currency: 'USD',
      // No entityId provided — should auto-assign
    },
  })

  expect(response.statusCode).toBe(200)
  const body = response.json()

  // Verify auto-assigned to business entity (only USD entity)
  expect(body.account.entityId).toBe(businessEntity.id)
  expect(body.confidence).toBe('auto')
})
```

#### Test: Bank account manual assignment (ambiguous)

```typescript
it('should prompt for entity selection if multiple entities match currency', async () => {
  // Setup: Create tenant with 2 USD entities
  const tenant = await createTestTenant()
  const usLLC = await createEntity({ tenantId: tenant.id, entityType: 'LLC', currency: 'USD', country: 'US' })
  const usaCorp = await createEntity({ tenantId: tenant.id, entityType: 'CORPORATION', currency: 'USD', country: 'US' })

  // Connect USD bank account
  const response = await app.inject({
    method: 'POST',
    url: '/api/banking/accounts/connect',
    body: {
      plaidAccountId: 'test-account-usd',
      currency: 'USD',
    },
  })

  // Should return 409 (ambiguous) with entity options
  expect(response.statusCode).toBe(409)
  const body = response.json()
  expect(body.error).toBe('AmbiguousEntity')
  expect(body.options).toHaveLength(2)
  expect(body.options).toContainEqual({ id: usLLC.id, name: usLLC.name, type: 'LLC' })
  expect(body.options).toContainEqual({ id: usaCorp.id, name: usaCorp.name, type: 'CORPORATION' })
})
```

---

### Frontend Tests

#### Test: Onboarding wizard renders correctly

```typescript
describe('OnboardingWizard', () => {
  it('should render step 1 (account type selection)', async () => {
    render(<OnboardingWizard initialState={{ currentStep: 0, stepData: {}, version: 0, isNew: true }} />)

    expect(screen.getByText('Welcome to Akount')).toBeInTheDocument()
    expect(screen.getByText('Just me')).toBeInTheDocument()
    expect(screen.getByText('Me + my business')).toBeInTheDocument()
  })

  it('should auto-populate name and email from Clerk', async () => {
    // Mock Clerk currentUser
    mockClerk.currentUser.mockReturnValue({
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      phoneNumbers: [{ phoneNumber: '+14165550123' }],
    })

    render(<OnboardingWizard initialState={{ ... }} />)

    // Progress to review step
    fireEvent.click(screen.getByText('Just me'))
    // ... skip through steps ...

    // Verify name/email pre-filled
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('+1 (416) 555-0123')).toBeInTheDocument()
  })
})
```

#### Test: Conditional business setup

```typescript
it('should show business setup only if employment = self-employed', async () => {
  render(<OnboardingWizard initialState={{ currentStep: 2, stepData: {}, version: 0 }} />)

  // Select "Student" employment
  fireEvent.click(screen.getByLabelText('Student'))
  fireEvent.click(screen.getByText('Continue'))

  // Should skip directly to address (step 5)
  expect(screen.getByText('Your location')).toBeInTheDocument()
  expect(screen.queryByText('Want to track your business separately?')).not.toBeInTheDocument()
})

it('should show business setup if employment = self-employed', async () => {
  render(<OnboardingWizard initialState={{ currentStep: 2, stepData: { accountType: 'business' }, version: 0 }} />)

  // Select "Self-employed" employment
  fireEvent.click(screen.getByLabelText('Self-employed / Freelance'))
  fireEvent.click(screen.getByText('Continue'))

  // Should show business setup (step 4)
  expect(screen.getByText('Want to track your business separately?')).toBeInTheDocument()
})
```

---

## Rollout Plan

### Phase 1: Beta Testing (2 weeks)

**Audience:** 50 internal/friendly users
- 30 personal-only users (students, employees)
- 15 self-employed users (offer business setup)
- 5 existing users (test migration flow)

**Success Criteria:**
- >80% completion rate
- <5 support tickets related to confusion
- No data loss during migration

### Phase 2: Gradual Rollout (4 weeks)

- **Week 1:** 10% of new signups (feature flag)
- **Week 2:** 25% of new signups
- **Week 3:** 50% of new signups
- **Week 4:** 100% of new signups

**Monitoring:**
- Onboarding completion rate (target: >85%)
- Time to complete (target: <90s for personal, <3min for business)
- Business entity adoption (target: 30% of self-employed users)
- Support ticket volume (monitor for spikes)

### Phase 3: Existing User Migration (Optional)

Offer existing users (currently on old onboarding) a chance to:
1. Add missing profile fields (employment, intents, address)
2. Set up business entities if applicable
3. Recategorize transactions

**Communication:**
- Dashboard banner: "💡 **New:** Track personal and business separately. [Set up now →]"
- Email campaign: "Upgrade your Akount experience"

---

## Deferred Features (Not in Initial Rollout)

| Feature | When |
|---------|------|
| Date of birth (KYC) | When user connects first bank account |
| Tax ID (SIN/SSN) | When user requests tax filing features |
| Fiscal year override | Settings page (default based on country works for 95%) |
| Multi-tax-residence support | Post-launch (expats, digital nomads) |
| Business entity templates | Post-launch (e.g., "US LLC starter kit") |
| Consolidated financial statements | Post-launch (elimination entries, CTA) |
| Entity-to-entity transfers | Post-launch (intercompany transactions) |
| Entity archival | Post-launch (soft delete for closed businesses) |

---

## Documentation Updates

### Files to Update

1. **apps/api/CLAUDE.md:**
   - New endpoints: `/system/entities`, `/banking/transactions/recategorize`
   - New services: `entity.service.ts`
   - Multi-entity architecture

2. **apps/web/CLAUDE.md:**
   - Entity switcher component
   - Onboarding wizard redesign
   - Multi-entity filtering

3. **packages/db/CLAUDE.md:**
   - New model: `UserProfile`
   - Updated: `OnboardingProgress.stepData` interface
   - Multi-entity patterns

4. **MEMORY.md:**
   - Add patterns: IP-based country detection, entity auto-assignment
   - Add gotchas: Multi-currency entity disambiguation

5. **docs/context-map.md:**
   - Update Entity model description (multi-entity support)
   - Add UserProfile model entry
   - Update onboarding flow diagram

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Onboarding Completion Rate** | >85% | % of users who reach dashboard after signup |
| **Time to Complete (Personal)** | <90 seconds | Median time from signup to dashboard |
| **Time to Complete (Business)** | <3 minutes | Median time including business entity setup |
| **Business Entity Adoption** | 30% | % of self-employed users who set up business during onboarding |
| **Business Entity Adoption (30 days)** | 50% | % of self-employed users who set up business within 30 days |
| **Migration Success Rate** | >95% | % of personal→business migrations with no data loss |
| **Support Ticket Volume** | <10% increase | Onboarding-related tickets vs baseline |
| **Entity Switcher Usage** | >70% | % of multi-entity users who use switcher weekly |
| **"All Entities" View Usage** | >40% | % of multi-entity users who view consolidated |

---

**Document Status:** ✅ COMPLETE (Technical architecture locked)
**Companion Document:** `2026-02-16-onboarding-personal-first-ux.md` (UX decisions)
**Next Step:** Review both documents, then create implementation tasks in TASKS.md
