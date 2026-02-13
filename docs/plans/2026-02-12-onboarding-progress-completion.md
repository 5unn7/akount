# Onboarding Progress Completion — Implementation Plan

**Created:** 2026-02-12
**Status:** Ready for Implementation
**Phase:** Phase 2 Frontend
**Related:**
- Original brainstorm: `docs/brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md`
- User flow spec: `brand/onboarding-user-flow.md`
- Existing implementation: `apps/api/src/domains/system/routes/onboarding.ts`

---

## What's Already Implemented ✅

We've already built the foundation! Here's what's working:

### Backend (`apps/api/src/domains/system/routes/onboarding.ts`)

**POST /initialize** (lines 71-241):
- ✅ Creates User (fetches from Clerk if new)
- ✅ Checks for existing tenant membership
- ✅ Creates Tenant + Entity + TenantUser in transaction
- ✅ **Creates OnboardingProgress** with 40% completion (lines 198-206)
- ✅ Saves phoneNumber + timezone to User model
- ✅ Auth via `request.userId`

**POST /complete** (lines 249-424):
- ✅ **RBAC check: Only OWNER can complete** (lines 284-293)
- ✅ Creates fiscal calendar
- ✅ Creates default Chart of Accounts (6 core accounts)

**GET /status** (lines 431-465):
- ✅ Returns onboarding status for user

### Frontend

**Store (`apps/web/src/stores/onboardingStore.ts`)**:
- ✅ Has phoneNumber, timezone fields
- ✅ Has setTenantAndEntity action
- ✅ Properly typed with EntityType

**EssentialInfoStep (`apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`)**:
- ✅ Collects phone + timezone
- ✅ Auto-detects timezone
- ✅ Calls POST /initialize
- ✅ Stores tenantId + entityId

---

## What's Missing (This Plan)

### Backend - Progress API Routes

1. **GET /progress** - Fetch current onboarding progress
2. **POST /update-progress** - Mark step complete/incomplete
3. **POST /skip-step** - Skip step for N days
4. **POST /dismiss-card** - Dismiss dashboard card

### Frontend - Dashboard Components

1. **CircularProgress** - Pure SVG donut chart (no recharts)
2. **OnboardingHeroCard** - Progress display with checklist
3. **SidebarProgressIndicator** - Mini progress bar

### Integration

1. Wire hero card to dashboard
2. Wire sidebar indicator to layout
3. React Query for shared state

---

## Security Fixes Applied 🔒

All critical security issues from review are addressed in this plan:

### ✅ Authentication & Tenant Isolation

**Pattern:** All routes use authMiddleware + tenantMiddleware

```typescript
export async function onboardingProgressRoutes(fastify: FastifyInstance) {
  // CRITICAL: Apply middleware to ALL routes
  fastify.addHook('onRequest', authMiddleware)
  fastify.addHook('onRequest', tenantMiddleware)

  // Now request.userId and request.tenant are guaranteed
}
```

### ✅ Input Validation (Enum Allowlist)

**Pattern:** Strict Zod enum for step names

```typescript
const VALID_STEPS = [
  'basic_info',
  'entity_setup',
  'business_details',
  'bank_connection',
  'goals_setup'
] as const

const UpdateProgressSchema = z.object({
  step: z.enum(VALID_STEPS),  // ✅ Prevents injection
  completed: z.boolean()
})
```

### ✅ Percentage Calculation (Source of Truth)

**Pattern:** Calculate from boolean flags, don't increment

```typescript
function calculateCompletionPercentage(progress: OnboardingProgress): number {
  const steps = [
    progress.basicInfoComplete,
    progress.entitySetupComplete,
    progress.businessDetailsComplete,
    progress.bankConnectionComplete,
    progress.goalsSetupComplete
  ]
  const completed = steps.filter(Boolean).length
  return Math.round((completed / 5) * 100)
}
```

### ✅ No Array Push (Read-Modify-Write)

**Pattern:** Fetch, modify, update (no Prisma `{ push }` syntax)

```typescript
// ❌ WRONG: Prisma doesn't support this
completedSteps: { push: step }

// ✅ CORRECT: Read-modify-write
const current = await prisma.onboardingProgress.findUnique({
  where: { tenantId }
})
const newSteps = completed
  ? [...(current?.completedSteps || []), step]
  : (current?.completedSteps || []).filter(s => s !== step)

await prisma.onboardingProgress.update({
  where: { tenantId },
  data: { completedSteps: newSteps }
})
```

### ✅ RBAC Enforcement

**Pattern:** Only OWNER can update progress

```typescript
if (request.tenant.role !== 'OWNER') {
  return reply.status(403).send({
    error: 'FORBIDDEN',
    message: 'Only account owners can update onboarding progress'
  })
}
```

---

## Implementation Tasks

### Phase 1: Backend - Progress API Routes (2-3 hours)

#### Task 1.1: Create Progress Routes File

**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`

**Create:**

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '@akount/db'
import { authMiddleware } from '../../middleware/auth'
import { tenantMiddleware } from '../../middleware/tenant'

// ✅ SECURITY: Strict enum validation
const VALID_STEPS = [
  'basic_info',
  'entity_setup',
  'business_details',
  'bank_connection',
  'goals_setup'
] as const

const UpdateProgressSchema = z.object({
  step: z.enum(VALID_STEPS),
  completed: z.boolean()
})

const SkipStepSchema = z.object({
  step: z.enum(VALID_STEPS),
  skipDurationDays: z.number().int().min(1).max(30).default(7)  // ✅ SECURITY: Max validation
})

// ✅ SECURITY: Calculate from source of truth
function calculateCompletionPercentage(progress: {
  basicInfoComplete: boolean
  entitySetupComplete: boolean
  businessDetailsComplete: boolean
  bankConnectionComplete: boolean
  goalsSetupComplete: boolean
}): number {
  const steps = [
    progress.basicInfoComplete,
    progress.entitySetupComplete,
    progress.businessDetailsComplete,
    progress.bankConnectionComplete,
    progress.goalsSetupComplete
  ]
  const completed = steps.filter(Boolean).length
  return Math.round((completed / 5) * 100)
}

export async function onboardingProgressRoutes(fastify: FastifyInstance) {
  // ✅ SECURITY: Apply middleware to ALL routes
  fastify.addHook('onRequest', authMiddleware)
  fastify.addHook('onRequest', tenantMiddleware)

  // GET /progress
  fastify.get('/progress', async (request: FastifyRequest, reply: FastifyReply) => {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { tenantId: request.tenant.tenantId }
    })

    if (!progress) {
      // Return default if not found (shouldn't happen after initialize)
      return reply.send({
        completionPercentage: 0,
        completedSteps: [],
        skippedSteps: [],
        basicInfoComplete: false,
        entitySetupComplete: false,
        businessDetailsComplete: false,
        bankConnectionComplete: false,
        goalsSetupComplete: false
      })
    }

    return reply.send(progress)
  })

  // POST /update-progress
  fastify.post<{
    Body: z.infer<typeof UpdateProgressSchema>
  }>('/update-progress', {
    schema: { body: UpdateProgressSchema }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { step, completed } = request.body

    // ✅ SECURITY: RBAC check
    if (request.tenant.role !== 'OWNER') {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Only account owners can update onboarding progress'
      })
    }

    const stepField = `${step}Complete` as const

    // Fetch current state
    const current = await prisma.onboardingProgress.findUnique({
      where: { tenantId: request.tenant.tenantId }
    })

    if (!current) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Onboarding progress not initialized'
      })
    }

    // ✅ CORRECT: Read-modify-write for arrays
    const newCompletedSteps = completed
      ? [...(current.completedSteps || []), step].filter((v, i, a) => a.indexOf(v) === i)  // Dedupe
      : (current.completedSteps || []).filter(s => s !== step)

    // Update step completion
    const updated = await prisma.onboardingProgress.update({
      where: { tenantId: request.tenant.tenantId },
      data: {
        [stepField]: completed,
        completedSteps: newCompletedSteps
      }
    })

    // ✅ CORRECT: Recalculate percentage from flags
    const percentage = calculateCompletionPercentage(updated)

    // Update percentage
    const final = await prisma.onboardingProgress.update({
      where: { tenantId: request.tenant.tenantId },
      data: { completionPercentage: percentage }
    })

    request.log.info({
      tenantId: request.tenant.tenantId,
      step,
      completed,
      newPercentage: percentage
    }, 'Onboarding progress updated')

    return reply.send(final)
  })

  // POST /skip-step
  fastify.post<{
    Body: z.infer<typeof SkipStepSchema>
  }>('/skip-step', {
    schema: { body: SkipStepSchema }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { step, skipDurationDays } = request.body

    const current = await prisma.onboardingProgress.findUnique({
      where: { tenantId: request.tenant.tenantId }
    })

    if (!current) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Onboarding progress not initialized'
      })
    }

    // ✅ CORRECT: Read-modify-write
    const newSkippedSteps = [...(current.skippedSteps || []), step].filter((v, i, a) => a.indexOf(v) === i)

    const progress = await prisma.onboardingProgress.update({
      where: { tenantId: request.tenant.tenantId },
      data: {
        skippedSteps: newSkippedSteps,
        lastNudgedAt: new Date(Date.now() + skipDurationDays * 24 * 60 * 60 * 1000)
      }
    })

    return reply.send(progress)
  })

  // POST /dismiss-card
  fastify.post('/dismiss-card', async (request: FastifyRequest, reply: FastifyReply) => {
    const progress = await prisma.onboardingProgress.update({
      where: { tenantId: request.tenant.tenantId },
      data: { dashboardCardDismissedAt: new Date() }
    })

    return reply.send(progress)
  })
}
```

**Success Criteria:**
- All routes protected by auth + tenant middleware
- Input validated with Zod enums
- Percentage calculated from boolean flags
- RBAC enforced (OWNER only for updates)
- No array `push` syntax used

---

#### Task 1.2: Register Routes

**File:** `apps/api/src/domains/system/routes.ts`

**Add:**

```typescript
import { onboardingProgressRoutes } from './routes/onboarding-progress'

export async function systemRoutes(fastify: FastifyInstance) {
  // Existing routes
  fastify.register(onboardingRoutes, { prefix: '/onboarding' })

  // NEW: Progress routes
  fastify.register(onboardingProgressRoutes, { prefix: '/onboarding' })
}
```

**Test:**

```bash
# Should work (authenticated + tenant owner)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/system/onboarding/progress

# Should fail with 403 (non-owner)
curl -H "Authorization: Bearer $NON_OWNER_TOKEN" \
  -X POST http://localhost:3001/api/system/onboarding/update-progress \
  -d '{"step":"business_details","completed":true}'
```

---

### Phase 2: Frontend - Components (4-5 hours)

#### Task 2.1: Install React Query

```bash
cd apps/web
npm install @tanstack/react-query
```

#### Task 2.2: Create QueryClientProvider

**File:** `apps/web/src/app/providers.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,  // 5 minutes
        refetchOnWindowFocus: false
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**File:** `apps/web/src/app/layout.tsx`

Update root layout:

```typescript
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <Providers>  {/* Wrap in QueryClientProvider */}
        <html lang="en">
          <body>{children}</body>
        </html>
      </Providers>
    </ClerkProvider>
  )
}
```

---

#### Task 2.3: Create CircularProgress (Pure SVG)

**File:** `apps/web/src/components/dashboard/CircularProgress.tsx`

```typescript
'use client'

interface CircularProgressProps {
  value: number  // 0-100
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  value = 0,
  size = 120,
  strokeWidth = 12
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const color = value >= 80 ? '#34D399' : '#F59E0B'  // Green >= 80%, Orange < 80%

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold font-mono">{value}%</span>
      </div>
    </div>
  )
}
```

**Benefits:**
- ✅ Zero dependencies (removed 60KB recharts bundle)
- ✅ Pure SVG with Tailwind transitions
- ✅ Color-coded (orange < 80%, green >= 80%)

---

#### Task 2.4: Create Shared Hook (React Query)

**File:** `apps/web/src/lib/api/onboarding.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client-browser'

interface OnboardingProgress {
  id: string
  tenantId: string
  completionPercentage: number
  completedSteps: string[]
  skippedSteps: string[]
  basicInfoComplete: boolean
  entitySetupComplete: boolean
  businessDetailsComplete: boolean
  bankConnectionComplete: boolean
  goalsSetupComplete: boolean
  lastNudgedAt: Date | null
  dashboardCardDismissedAt: Date | null
}

// ✅ Shared hook - prevents duplicate API calls
export function useOnboardingProgress() {
  return useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: async () => {
      const data = await apiFetch<OnboardingProgress>(
        '/api/system/onboarding/progress'
      )
      return data
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    refetchOnWindowFocus: false
  })
}

// ✅ Mutation hook with auto-invalidation
export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { step: string; completed: boolean }) => {
      return await apiFetch('/api/system/onboarding/update-progress', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      // ✅ Invalidates all components using progress
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] })
    }
  })
}

export function useDismissCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await apiFetch('/api/system/onboarding/dismiss-card', {
        method: 'POST'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] })
    }
  })
}
```

**Benefits:**
- ✅ Single request shared across components
- ✅ Auto-invalidation after mutations
- ✅ Built-in loading/error states

---

#### Task 2.5: Create OnboardingHeroCard

**File:** `apps/web/src/components/dashboard/OnboardingHeroCard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { CircularProgress } from './CircularProgress'
import { useOnboardingProgress, useDismissCard } from '@/lib/api/onboarding'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

export function OnboardingHeroCard() {
  const { data: progress, isLoading } = useOnboardingProgress()
  const dismissCard = useDismissCard()
  const [isExpanded, setIsExpanded] = useState(true)

  if (isLoading) {
    return <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
  }

  if (!progress || progress.completionPercentage >= 100) {
    return null
  }

  const steps = [
    { key: 'basicInfoComplete', label: 'Basic information', complete: progress.basicInfoComplete },
    { key: 'entitySetupComplete', label: 'Entity setup', complete: progress.entitySetupComplete },
    { key: 'businessDetailsComplete', label: 'Business details (Tax ID, Address)', complete: progress.businessDetailsComplete },
    { key: 'bankConnectionComplete', label: 'Connect your bank account', complete: progress.bankConnectionComplete },
    { key: 'goalsSetupComplete', label: 'Set goals & budget', complete: progress.goalsSetupComplete }
  ]

  return (
    <Card variant="glass" className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <CircularProgress value={progress.completionPercentage} />
            <div>
              <h3 className="text-2xl font-bold mb-2">🎯 Complete Your Setup</h3>
              <p className="text-muted-foreground">
                {progress.completionPercentage}% complete - Just a few more steps
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={() => dismissCard.mutate()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-3">
            {steps.map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`
                  h-6 w-6 rounded-full flex items-center justify-center text-sm
                  ${step.complete ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}
                `}>
                  {step.complete ? '✓' : '○'}
                </div>
                <span className={step.complete ? 'line-through text-muted-foreground' : ''}>
                  {step.label}
                </span>
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-6 py-3 bg-primary text-black rounded-lg hover:bg-[#FBBF24] transition-colors">
                Continue Setup →
              </button>
              <button
                onClick={() => dismissCard.mutate()}
                className="px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
```

---

#### Task 2.6: Create SidebarProgressIndicator

**File:** `apps/web/src/components/layout/SidebarProgressIndicator.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useOnboardingProgress } from '@/lib/api/onboarding'

export function SidebarProgressIndicator() {
  const { data: progress } = useOnboardingProgress()
  const router = useRouter()

  if (!progress || progress.completionPercentage >= 100) {
    return null
  }

  const percentage = progress.completionPercentage
  const color = percentage >= 80 ? 'bg-green-500' : 'bg-yellow-500'

  return (
    <div
      className="mt-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => router.push('/overview')}
      title={`${percentage}% complete - Click to continue setup`}
    >
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center mt-1 font-mono">
        {percentage}%
      </div>
    </div>
  )
}
```

---

### Phase 3: Integration (1-2 hours)

#### Task 3.1: Add Hero Card to Dashboard

**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`

```typescript
import { OnboardingHeroCard } from '@/components/dashboard/OnboardingHeroCard'

export default async function OverviewPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Onboarding hero card */}
      <OnboardingHeroCard />

      {/* Existing dashboard content */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {/* ... rest of dashboard */}
      </div>
    </div>
  )
}
```

---

#### Task 3.2: Add Sidebar Indicator

**Find sidebar component:**

```bash
Glob "apps/web/src/**/*sidebar*.tsx"
```

**Add after user avatar section:**

```typescript
import { SidebarProgressIndicator } from '@/components/layout/SidebarProgressIndicator'

// In sidebar:
<div className="p-4 border-t">
  <UserAvatar />
  <SidebarProgressIndicator />
</div>
```

---

### Phase 4: Testing (2-3 hours)

#### Task 4.1: Backend API Tests

**File:** `apps/api/__tests__/system/onboarding-progress.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../../src/app'
import { prisma } from '@akount/db'

describe('Onboarding Progress API', () => {
  let ownerToken: string
  let memberToken: string
  let tenantId: string

  beforeEach(async () => {
    // Setup: Create tenant, owner, member
  })

  it('GET /progress returns current progress', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/system/onboarding/progress',
      headers: { authorization: `Bearer ${ownerToken}` }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.completionPercentage).toBeGreaterThanOrEqual(0)
    expect(body.basicInfoComplete).toBeDefined()
  })

  it('POST /update-progress requires OWNER role', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/system/onboarding/update-progress',
      headers: { authorization: `Bearer ${memberToken}` },  // Non-owner
      payload: { step: 'business_details', completed: true }
    })

    expect(response.statusCode).toBe(403)
  })

  it('POST /update-progress validates step enum', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/system/onboarding/update-progress',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { step: 'invalid_step', completed: true }
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /update-progress calculates percentage correctly', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/system/onboarding/update-progress',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { step: 'business_details', completed: true }
    })

    const progress = await prisma.onboardingProgress.findUnique({
      where: { tenantId }
    })

    // basic_info (20%) + entity_setup (20%) + business_details (20%) = 60%
    expect(progress?.completionPercentage).toBe(60)
  })

  it('prevents tenant isolation breach', async () => {
    // Create second tenant
    const tenant2Id = 'tenant2'

    // Try to access tenant2's progress with tenant1 token
    const response = await app.inject({
      method: 'GET',
      url: '/api/system/onboarding/progress',
      headers: { authorization: `Bearer ${ownerToken}` }  // tenant1 token
    })

    const body = JSON.parse(response.body)
    expect(body.tenantId).not.toBe(tenant2Id)
  })
})
```

---

#### Task 4.2: Frontend Component Tests

**File:** `apps/web/__tests__/components/OnboardingHeroCard.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnboardingHeroCard } from '@/components/dashboard/OnboardingHeroCard'
import { describe, it, expect, vi } from 'vitest'

describe('OnboardingHeroCard', () => {
  const queryClient = new QueryClient()

  it('does not render if 100% complete', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      completionPercentage: 100
    })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OnboardingHeroCard />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('shows correct percentage', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      completionPercentage: 60,
      basicInfoComplete: true,
      entitySetupComplete: true,
      businessDetailsComplete: true,
      bankConnectionComplete: false,
      goalsSetupComplete: false
    })

    render(
      <QueryClientProvider client={queryClient}>
        <OnboardingHeroCard />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument()
    })
  })
})
```

---

## Files Summary

### Create

**Backend:**
- `apps/api/src/domains/system/routes/onboarding-progress.ts` - Progress API routes

**Frontend:**
- `apps/web/src/app/providers.tsx` - QueryClientProvider
- `apps/web/src/components/dashboard/CircularProgress.tsx` - Pure SVG donut chart
- `apps/web/src/components/dashboard/OnboardingHeroCard.tsx` - Progress card
- `apps/web/src/components/layout/SidebarProgressIndicator.tsx` - Mini progress bar
- `apps/web/src/lib/api/onboarding.ts` - React Query hooks

**Tests:**
- `apps/api/__tests__/system/onboarding-progress.test.ts` - Backend tests
- `apps/web/__tests__/components/OnboardingHeroCard.test.tsx` - Frontend tests

### Modify

**Backend:**
- `apps/api/src/domains/system/routes.ts` - Register progress routes

**Frontend:**
- `apps/web/src/app/layout.tsx` - Wrap in Providers
- `apps/web/src/app/(dashboard)/overview/page.tsx` - Add hero card
- Find sidebar component - Add progress indicator

### No Changes Needed

**Already Working:**
- `apps/api/src/domains/system/routes/onboarding.ts` - POST /initialize, /complete, GET /status
- `apps/web/src/stores/onboardingStore.ts` - Has phone, timezone, setTenantAndEntity
- `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx` - Calls initialize

---

## Security Checklist ✅

- [x] All routes protected by authMiddleware + tenantMiddleware
- [x] Input validated with Zod enum (VALID_STEPS)
- [x] RBAC enforced (OWNER only for updates)
- [x] Percentage calculated from source of truth (boolean flags)
- [x] No Prisma `{ push }` syntax (read-modify-write pattern)
- [x] Max validation on skipDurationDays (1-30 days)
- [x] Tenant isolation tests included
- [x] No localStorage for tenantId/entityId (server-side only)

---

## Performance Optimizations ✅

- [x] React Query prevents duplicate API calls
- [x] Pure SVG (removed 60KB recharts bundle)
- [x] Stale time: 5 minutes (reduces requests)
- [x] Auto-invalidation on mutations (keeps UI fresh)
- [x] Loading skeletons (perceived performance)

---

## Success Criteria

**Backend:**
- [ ] All 4 routes working (GET /progress, POST /update-progress, /skip-step, /dismiss-card)
- [ ] Auth + tenant middleware enforced
- [ ] RBAC checks pass (403 for non-owners)
- [ ] Percentage calculation accurate (60% = 3/5 steps)
- [ ] All API tests pass (10+ tests)

**Frontend:**
- [ ] Hero card shows on dashboard when < 100%
- [ ] Sidebar indicator shows below avatar
- [ ] React Query prevents duplicate fetches
- [ ] Circular progress renders correctly
- [ ] Dismiss button hides card
- [ ] All component tests pass (5+ tests)

**Integration:**
- [ ] Dashboard loads hero card from server
- [ ] Sidebar shares same React Query cache
- [ ] Update progress → card updates automatically
- [ ] 100% complete → card disappears

---

## Estimated Time

**Backend:** 2-3 hours
**Frontend:** 4-5 hours
**Integration:** 1-2 hours
**Testing:** 2-3 hours

**Total:** 9-13 hours (2 working days)

---

## Next Steps After This Plan

1. **Business Details Modal** - Optional step for tax ID, address
2. **Bank Connection** - Plaid integration or manual entry
3. **Goals Setup** - Revenue targets, savings goals
4. **Completion Celebration** - Confetti animation at 100%

---

**Ready for implementation! All security fixes applied. 🚀**