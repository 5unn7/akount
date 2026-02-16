# Onboarding Flow Redesign - Implementation Plan

**Created:** 2026-02-09
**Status:** Draft
**Related Brainstorm:** [`docs/brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md`](../brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md)

---

## Overview

Redesign onboarding to be **zen, minimal, and progressive**:

- **Minimal wizard** (2 steps, 60 seconds) gets users to dashboard fast
- **Dashboard hero card** with circular progress tracks completion
- **Sidebar progress indicator** shows percentage and nudges completion
- **Contextual prompts** guide users when features need setup

**Goal:** Get to dashboard in 60 seconds, complete optional steps when ready via smart nudges.

---

## Success Criteria

- [ ] Minimal wizard completes in < 90 seconds
- [ ] Dashboard hero card shows completion progress with circular chart
- [ ] Sidebar shows mini progress bar (60%) with color coding
- [ ] New users see dashboard after 2-step wizard
- [ ] OnboardingProgress model tracks 5 completion steps
- [ ] All tests pass (80%+ coverage)
- [ ] Design system (glass morphism) components used throughout

---

## Implementation Phases

### **Phase 1: Database & API Foundation** (2-3 hours)

Core data model and API routes for tracking progress

### **Phase 2: Minimal Wizard** (3-4 hours)

Simplified 2-step onboarding wizard

### **Phase 3: Dashboard Integration** (4-5 hours)

Hero card + sidebar progress indicator

### **Phase 4: Optional Steps & Modals** (Sprint 2)

Business details, bank connection, goals setup

---

## Phase 1: Database & API Foundation

### Task 1.1: Create OnboardingProgress Model (30m)

**File:** `packages/db/prisma/schema.prisma`

**Actions:**

```prisma
model OnboardingProgress {
  id        String   @id @default(cuid())
  tenantId  String   @unique
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Step completion tracking
  completedSteps    String[]  @default([])  // ['basic_info', 'entity_setup', ...]
  skippedSteps      String[]  @default([])  // ['bank_connection']

  // Individual step flags
  basicInfoComplete       Boolean  @default(false)
  entitySetupComplete     Boolean  @default(false)
  businessDetailsComplete Boolean  @default(false)
  bankConnectionComplete  Boolean  @default(false)
  goalsSetupComplete      Boolean  @default(false)

  // Progress metrics
  completionPercentage  Int  @default(0)

  // Nudge management
  lastNudgedAt               DateTime?
  dashboardCardDismissedAt   DateTime?

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([tenantId])
}
```

**Also add to Tenant model:**

```prisma
model Tenant {
  // ... existing fields
  onboardingProgress  OnboardingProgress?
}
```

**Also add to User model:**

```prisma
model User {
  // ... existing fields
  phoneNumber  String?
  timezone     String?  @default("America/Toronto")
}
```

**Also add to Entity model:**

```prisma
model Entity {
  // ... existing fields

  // Business details (optional, collected post-wizard)
  address       String?
  city          String?
  state         String?
  postalCode    String?
  industry      String?
  businessSize  String?  // 'SOLO', '2-10', '10+'
}
```

**Success:**

- Run `npx prisma db push` successfully
- OnboardingProgress model created
- User, Entity models extended
- No migration errors

---

### Task 1.2: Create Progress API Routes (45m)

**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`

**Create:**

```typescript
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@akount/db'

// Schemas
const UpdateProgressSchema = z.object({
  step: z.enum(['basic_info', 'entity_setup', 'business_details', 'bank_connection', 'goals_setup']),
  completed: z.boolean()
})

const SkipStepSchema = z.object({
  step: z.string(),
  skipDurationDays: z.number().default(7)
})

export async function onboardingProgressRoutes(fastify: FastifyInstance) {
  // GET /progress - Get current progress
  fastify.get('/progress', async (request, reply) => {
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: request.userId },
      include: { tenant: { include: { onboardingProgress: true } } }
    })

    if (!tenantUser) {
      return reply.status(404).send({ error: 'No tenant found' })
    }

    return tenantUser.tenant.onboardingProgress || {
      completionPercentage: 0,
      completedSteps: [],
      skippedSteps: []
    }
  })

  // POST /update-progress - Update step completion
  fastify.post('/update-progress', {
    schema: { body: UpdateProgressSchema }
  }, async (request, reply) => {
    const { step, completed } = request.body

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: request.userId }
    })

    if (!tenantUser) {
      return reply.status(404).send({ error: 'No tenant found' })
    }

    // Calculate new percentage
    const stepWeights = {
      basic_info: 20,
      entity_setup: 20,
      business_details: 20,
      bank_connection: 20,
      goals_setup: 20
    }

    const progress = await prisma.onboardingProgress.upsert({
      where: { tenantId: tenantUser.tenantId },
      create: {
        tenantId: tenantUser.tenantId,
        [`${step}Complete`]: completed,
        completedSteps: completed ? [step] : [],
        completionPercentage: completed ? stepWeights[step] : 0
      },
      update: {
        [`${step}Complete`]: completed,
        completedSteps: completed
          ? { push: step }
          : { set: (prev: string[]) => prev.filter(s => s !== step) },
        completionPercentage: {
          increment: completed ? stepWeights[step] : -stepWeights[step]
        }
      }
    })

    return progress
  })

  // POST /skip-step - Skip step temporarily
  fastify.post('/skip-step', {
    schema: { body: SkipStepSchema }
  }, async (request, reply) => {
    const { step, skipDurationDays } = request.body

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: request.userId }
    })

    if (!tenantUser) {
      return reply.status(404).send({ error: 'No tenant found' })
    }

    const progress = await prisma.onboardingProgress.upsert({
      where: { tenantId: tenantUser.tenantId },
      create: {
        tenantId: tenantUser.tenantId,
        skippedSteps: [step],
        lastNudgedAt: new Date(Date.now() + skipDurationDays * 24 * 60 * 60 * 1000)
      },
      update: {
        skippedSteps: { push: step },
        lastNudgedAt: new Date(Date.now() + skipDurationDays * 24 * 60 * 60 * 1000)
      }
    })

    return progress
  })

  // POST /dismiss-card - Dismiss dashboard card
  fastify.post('/dismiss-card', async (request, reply) => {
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: request.userId }
    })

    if (!tenantUser) {
      return reply.status(404).send({ error: 'No tenant found' })
    }

    const progress = await prisma.onboardingProgress.update({
      where: { tenantId: tenantUser.tenantId },
      data: { dashboardCardDismissedAt: new Date() }
    })

    return progress
  })
}
```

**Success:**

- 4 routes created (GET /progress, POST /update-progress, /skip-step, /dismiss-card)
- Routes registered in `apps/api/src/domains/system/routes.ts`
- Can test with curl/Postman

---

### Task 1.3: Update Existing Onboarding Routes (30m)

**File:** `apps/api/src/domains/system/routes/onboarding.ts`

**Modify POST /initialize:**

```typescript
// After creating tenant and entity, create OnboardingProgress
await tx.onboardingProgress.create({
  data: {
    tenantId: tenant.id,
    basicInfoComplete: true,
    entitySetupComplete: true,
    completedSteps: ['basic_info', 'entity_setup'],
    completionPercentage: 40  // 20% + 20%
  }
})

// Also update User with phone and timezone
await tx.user.update({
  where: { id: user.id },
  data: {
    phoneNumber: data.phoneNumber,
    timezone: data.timezone
  }
})
```

**Update initializeOnboardingSchema:**

```typescript
const initializeOnboardingSchema = z.object({
  accountType: z.enum(['personal', 'business', 'accountant']),
  name: z.string().min(1),
  phoneNumber: z.string().min(10),
  timezone: z.string().default('America/Toronto'),
  entityName: z.string().min(1).max(255),
  entityType: z.enum(['PERSONAL', 'CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC']),
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
})
```

**Success:**

- POST /initialize creates OnboardingProgress with 40% completion
- User phoneNumber and timezone saved
- Tests pass

---

### Task 1.4: Write API Tests (45m)

**File:** `apps/api/__tests__/system/onboarding-progress.test.ts`

**Test cases:**

- GET /progress returns 0% for new user
- POST /update-progress increases percentage
- POST /update-progress with completed=false decreases percentage
- POST /skip-step adds to skippedSteps
- POST /dismiss-card sets dashboardCardDismissedAt
- Tenant isolation (can't access other tenant's progress)

**Success:** All tests pass, 80%+ coverage

---

## Phase 2: Minimal Wizard

### Task 2.1: Update Onboarding Store (20m)

**File:** `apps/web/src/stores/onboardingStore.ts`

**Add new fields:**

```typescript
export interface OnboardingState {
  // ... existing fields

  // New fields for single-page form
  phoneNumber: string
  timezone: string

  // New setters
  setPhoneNumber: (phone: string) => void
  setTimezone: (timezone: string) => void
}
```

**Success:** Store compiles, no TypeScript errors

---

### Task 2.2: Create Minimal Wizard Components (1.5h)

**File:** `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx`

**Redesign as glass morphism cards:**

```typescript
'use client'

import { useOnboardingStore } from '@/stores/onboardingStore'

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { accountType, setAccountType } = useOnboardingStore()

  const accountTypes = [
    {
      type: 'personal' as const,
      icon: '👤',
      title: 'Personal',
      description: 'Manage personal finances and track expenses'
    },
    {
      type: 'business' as const,
      icon: '🏢',
      title: 'Business',
      description: 'Full business accounting and invoicing'
    },
    {
      type: 'accountant' as const,
      icon: '📊',
      title: 'Accountant',
      description: 'Manage multiple client entities'
    }
  ]

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-4xl font-bold font-heading mb-4">
          Welcome to Akount
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's set up your account in 60 seconds
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {accountTypes.map((item) => (
          <button
            key={item.type}
            onClick={() => {
              setAccountType(item.type)
              onNext()
            }}
            className={`
              p-8 rounded-2xl border-2 transition-all
              hover:scale-105 hover:shadow-lg
              ${accountType === item.type
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-slate-200 bg-white hover:border-primary/50'
              }
            `}
          >
            <div className="text-5xl mb-4">{item.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

**File:** `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`

**Create new single-page form:**

```typescript
'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function EssentialInfoStep({ onNext, onBack }: {
  onNext: () => void
  onBack: () => void
}) {
  const store = useOnboardingStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Call API to initialize onboarding
      const response = await fetch('/api/system/onboarding/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: store.accountType,
          name: store.name || '',
          phoneNumber: store.phoneNumber,
          timezone: store.timezone,
          entityName: store.entityName,
          entityType: store.entityType || 'PERSONAL',
          country: store.country,
          currency: store.currency
        })
      })

      if (!response.ok) {
        throw new Error('Failed to initialize onboarding')
      }

      const data = await response.json()
      store.setTenantAndEntity(data.tenantId, data.entityId)

      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-heading mb-2">
          Essential Information
        </h2>
        <p className="text-muted-foreground">
          Just the basics to get started
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={store.name || ''}
            onChange={(e) => store.setName(e.target.value)}
            required
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={store.phoneNumber}
            onChange={(e) => store.setPhoneNumber(e.target.value)}
            required
          />
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Time Zone</Label>
          <Select value={store.timezone} onValueChange={store.setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Toronto">Eastern Time</SelectItem>
              <SelectItem value="America/Vancouver">Pacific Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/New_York">New York</SelectItem>
              <SelectItem value="Europe/London">London</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entity Name */}
        <div className="space-y-2">
          <Label htmlFor="entityName">
            {store.accountType === 'personal' ? 'Your Name' : 'Business Name'}
          </Label>
          <Input
            id="entityName"
            value={store.entityName}
            onChange={(e) => store.setEntityName(e.target.value)}
            placeholder={store.accountType === 'personal' ? 'John Doe' : 'Acme Inc.'}
            required
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={store.country} onValueChange={store.setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={store.currency} onValueChange={store.setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
              <SelectItem value="USD">USD (US Dollar)</SelectItem>
              <SelectItem value="GBP">GBP (British Pound)</SelectItem>
              <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
              <SelectItem value="EUR">EUR (Euro)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isLoading} className="ml-auto">
          {isLoading ? 'Creating your account...' : 'Complete Setup'}
        </Button>
      </div>
    </form>
  )
}
```

**Success:**

- Welcome step shows 3 glass cards
- Essential info step has all fields on one page
- Form validates and submits

---

### Task 2.3: Update OnboardingWizard (30m)

**File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`

**Changes:**

- Remove EntityDetailsStep (merged into EssentialInfoStep)
- Update steps array to 2 steps
- Update totalSteps to 2
- Add gradient background

```typescript
// Update steps
const steps = [
  <WelcomeStep key="welcome" onNext={handleNext} />,
  <EssentialInfoStep key="essential" onNext={handleNext} onBack={handlePrevious} />,
]

// Add gradient background wrapper
return (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 py-12">
    <div className="container max-w-6xl mx-auto px-4">
      {/* Progress dots */}
      {currentStep > 0 && (
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i === currentStep ? 'bg-primary w-8' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white">
        {currentStepComponent}
      </div>
    </div>
  </div>
)
```

**Success:**

- Wizard has 2 steps only
- Gradient background applied
- Progress dots show at top

---

## Phase 3: Dashboard Integration

### Task 3.1: Create CircularProgress Component (45m)

**File:** `apps/web/src/components/dashboard/CircularProgress.tsx`

**Create with recharts:**

```typescript
'use client'

import { PieChart, Pie, Cell } from 'recharts'

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
  const data = [
    { name: 'progress', value: Math.min(value, 100) },
    { name: 'remaining', value: 100 - Math.min(value, 100) }
  ]

  const radius = size / 2
  const innerRadius = radius - strokeWidth
  const outerRadius = radius

  // Color based on completion
  const color = value >= 80 ? 'hsl(142, 76%, 36%)' : 'hsl(47, 96%, 53%)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={radius}
          cy={radius}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          <Cell fill={color} />
          <Cell fill="hsl(var(--muted))" />
        </Pie>
      </PieChart>

      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-3xl font-bold font-mono">{value}%</span>
      </div>
    </div>
  )
}
```

**Success:** Component renders donut chart with percentage

---

### Task 3.2: Create OnboardingHeroCard Component (1h)

**File:** `apps/web/src/components/dashboard/OnboardingHeroCard.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CircularProgress } from './CircularProgress'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface OnboardingProgress {
  completionPercentage: number
  completedSteps: string[]
  skippedSteps: string[]
  basicInfoComplete: boolean
  entitySetupComplete: boolean
  businessDetailsComplete: boolean
  bankConnectionComplete: boolean
  goalsSetupComplete: boolean
}

export function OnboardingHeroCard() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  async function fetchProgress() {
    try {
      const response = await fetch('/api/system/onboarding/progress')
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDismiss() {
    await fetch('/api/system/onboarding/dismiss-card', { method: 'POST' })
    setProgress(null)
  }

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
    { key: 'goalsSetupComplete', label: 'Set goals & budget', complete: progress.goalsSetupComplete },
  ]

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <CircularProgress value={progress.completionPercentage} />
            <div>
              <CardTitle className="text-2xl mb-2">🎯 Complete Your Setup</CardTitle>
              <p className="text-muted-foreground">
                {progress.completionPercentage}% complete - Just a few more steps
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-3 mb-6">
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
          </div>

          <div className="flex gap-3">
            <Button className="flex-1">Continue Setup →</Button>
            <Button variant="outline" onClick={() => handleDismiss()}>
              Skip for now
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
```

**Success:**

- Card shows circular progress
- Checklist expands/collapses
- Dismissible with X button

---

### Task 3.3: Create SidebarProgressIndicator Component (45m)

**File:** `apps/web/src/components/layout/SidebarProgressIndicator.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Progress {
  completionPercentage: number
}

export function SidebarProgressIndicator() {
  const [progress, setProgress] = useState<Progress | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/system/onboarding/progress')
      .then(res => res.json())
      .then(setProgress)
      .catch(console.error)
  }, [])

  if (!progress || progress.completionPercentage >= 100) {
    return null
  }

  const percentage = progress.completionPercentage
  const isGreen = percentage >= 80
  const color = isGreen ? 'bg-green-500' : 'bg-yellow-500'

  return (
    <div
      className="mt-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => router.push('/onboarding/complete')}
      title={`${percentage}% complete - Click to continue setup`}
    >
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage text */}
      <div className="text-xs text-muted-foreground text-center mt-1 font-mono">
        {percentage}%
      </div>
    </div>
  )
}
```

**Success:**

- Mini progress bar shows below avatar
- Color-coded (yellow < 80%, green >= 80%)
- Clickable to open completion modal

---

### Task 3.4: Integrate into Dashboard Layout (30m)

**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`

**Add at top of page:**

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

**File:** Find sidebar component and add indicator

**Search for sidebar:**

```bash
Glob "apps/web/src/**/*sidebar*.tsx"
Glob "apps/web/src/**/layout.tsx"
```

**Add after user avatar:**

```typescript
import { SidebarProgressIndicator } from '@/components/layout/SidebarProgressIndicator'

// In sidebar user section:
<div className="p-4 border-t">
  <UserAvatar />
  <SidebarProgressIndicator />
</div>
```

**Success:**

- Hero card appears on dashboard
- Sidebar indicator shows below avatar
- Both components fetch data independently

---

## Phase 4: Testing & Polish

### Task 4.1: Write Frontend Tests (1h)

**File:** `apps/web/__tests__/components/OnboardingHeroCard.test.tsx`

**Test cases:**

- Card doesn't render if 100% complete
- Card shows correct percentage
- Checklist shows correct step states
- Dismiss button hides card
- Continue button navigates

**File:** `apps/web/__tests__/components/SidebarProgressIndicator.test.tsx`

**Test cases:**

- Indicator doesn't render if 100% complete
- Progress bar width matches percentage
- Color changes at 80% threshold
- Click navigates to completion page

**Success:** All tests pass

---

### Task 4.2: Add Completion Modal (Sprint 2)

**File:** `apps/web/src/app/onboarding/complete/page.tsx`

**Create modal page for remaining steps:**

- Business details form
- Bank connection CTA
- Goals setup form

**Defer to Sprint 2**

---

## Files

### Create

**Backend:**

- [ ] `packages/db/prisma/schema.prisma` - Add OnboardingProgress model
- [ ] `apps/api/src/domains/system/routes/onboarding-progress.ts` - Progress API routes
- [ ] `apps/api/__tests__/system/onboarding-progress.test.ts` - API tests

**Frontend:**

- [ ] `apps/web/src/components/dashboard/CircularProgress.tsx` - Donut chart
- [ ] `apps/web/src/components/dashboard/OnboardingHeroCard.tsx` - Dashboard card
- [ ] `apps/web/src/components/layout/SidebarProgressIndicator.tsx` - Sidebar indicator
- [ ] `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx` - Single-page form
- [ ] `apps/web/__tests__/components/OnboardingHeroCard.test.tsx` - Card tests
- [ ] `apps/web/__tests__/components/SidebarProgressIndicator.test.tsx` - Sidebar tests

### Modify

**Backend:**

- [ ] `apps/api/src/domains/system/routes/onboarding.ts` - Update POST /initialize
- [ ] `apps/api/src/domains/system/routes.ts` - Register progress routes

**Frontend:**

- [ ] `apps/web/src/stores/onboardingStore.ts` - Add phone, timezone fields
- [ ] `apps/web/src/app/onboarding/components/OnboardingWizard.tsx` - 2-step flow
- [ ] `apps/web/src/app/onboarding/components/steps/WelcomeStep.tsx` - Glass cards
- [ ] `apps/web/src/app/(dashboard)/overview/page.tsx` - Add hero card
- [ ] Sidebar component - Add progress indicator

### Delete

- [ ] `apps/web/src/app/onboarding/components/steps/EntityDetailsStep.tsx` - Merged into EssentialInfoStep

### Reference

- [ ] `packages/db/prisma/schema.prisma` - Existing models
- [ ] `apps/web/package.json` - Verify shadcn-glass-ui version
- [ ] `docs/brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md` - Requirements

---

## Edge Cases

### User abandons wizard mid-flow

- **Solution:** Zustand persists state; show "Continue where you left off" on return

### User dismisses card repeatedly

- **Solution:** After 3 dismissals (tracked in database), only show sidebar indicator

### User completes steps out of order

- **Solution:** Track per-step completion, not sequential order

### Plaid connection fails (Phase 2)

- **Solution:** Fallback to manual bank entry, mark as partial completion

### User changes account type mid-onboarding

- **Solution:** Allow change, adjust totalSteps dynamically, preserve data

### Progress API call fails

- **Solution:** Show 0% gracefully, log error, allow user to proceed

---

## Testing Strategy

### Unit Tests

- OnboardingProgress API routes (GET, POST)
- CircularProgress component rendering
- OnboardingHeroCard state management
- SidebarProgressIndicator calculations

### Integration Tests

- Complete wizard flow (Welcome → Essential Info → Dashboard)
- Progress updates after wizard completion
- Dashboard card dismiss flow
- Sidebar indicator click navigation

### E2E Tests (Playwright)

- New user signup → onboarding → dashboard
- Skip steps → return later via hero card
- Complete all steps → 100% → card disappears

---

## Rollback Plan

If issues arise:

1. **Database migration fails:**
   - Run `npx prisma migrate dev --create-only` to inspect
   - Fix schema errors, re-run migration

2. **API routes break existing flow:**
   - Progress routes are additive (don't modify existing)
   - Can disable by commenting out route registration

3. **Frontend components break:**
   - All new components are isolated
   - Can remove imports from dashboard/sidebar
   - Old onboarding wizard still works

4. **Performance issues:**
   - Add caching to progress API (Redis)
   - Lazy-load hero card (Suspense boundary)

---

## Progress

### Phase 1: Database & API

- [ ] Task 1.1: Create OnboardingProgress model (30m)
- [ ] Task 1.2: Create progress API routes (45m)
- [ ] Task 1.3: Update existing onboarding routes (30m)
- [ ] Task 1.4: Write API tests (45m)

### Phase 2: Minimal Wizard

- [ ] Task 2.1: Update onboarding store (20m)
- [ ] Task 2.2: Create minimal wizard components (1.5h)
- [ ] Task 2.3: Update OnboardingWizard (30m)

### Phase 3: Dashboard Integration

- [ ] Task 3.1: Create CircularProgress component (45m)
- [ ] Task 3.2: Create OnboardingHeroCard component (1h)
- [ ] Task 3.3: Create SidebarProgressIndicator component (45m)
- [ ] Task 3.4: Integrate into dashboard layout (30m)

### Phase 4: Testing & Polish

- [ ] Task 4.1: Write frontend tests (1h)
- [ ] Task 4.2: Add completion modal (Sprint 2 - deferred)

**Total Estimated Time:** 10-12 hours (Phase 1-3), 2-3 hours (Phase 4)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Run `/processes:work`** to execute Phase 1
3. **Design Figma mockups** (optional, can build directly from brainstorm)
4. **Sprint 2:** Business details, bank connection, goals setup

---

**Plan ready for implementation! 🚀**
