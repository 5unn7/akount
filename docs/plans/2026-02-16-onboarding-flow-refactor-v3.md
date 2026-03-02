# Onboarding Flow Refactor v3 - In-Place Fixes

**Created:** 2026-02-16
**Status:** Ready for Implementation
**Previous Plan:** [2026-02-16-onboarding-flow-refactor-v2.md](./2026-02-16-onboarding-flow-refactor-v2.md) (REJECTED - architectural issues)
**Review:** [.reviews/SYNTHESIS.md](../.reviews/SYNTHESIS.md) (4-agent review, 11 P0 blockers)
**Brainstorm:** [2026-02-09-onboarding-flow-redesign-brainstorm.md](../brainstorms/2026-02-09-onboarding-flow-redesign-brainstorm.md)

---

## Overview

**Approach:** Fix onboarding flow problems **in-place** without deferring tenant creation. This preserves middleware compatibility while solving orphaned tenants, triple state drift, and resume capability.

**Key Change from v2:** KEEP tenant creation at step 2 (not deferred to final step). This avoids breaking the authentication contract and 11 P0 blockers identified in code review.

**Core Problems Solved:**
1. ✅ Orphaned tenants → Idempotent `/initialize` + cleanup job
2. ✅ Triple state drift → Database as single source of truth
3. ✅ No resume capability → `/resume` endpoint with proper schema
4. ✅ Middleware disabled → Enable with 30s cache + invalidation
5. ✅ Security gaps → Auth, rate limiting, input validation

---

## Success Criteria

- [ ] Users can resume onboarding after closing browser
- [ ] No orphaned tenants created (idempotent `/initialize`)
- [ ] Abandoned tenants auto-deleted after 7 days
- [ ] Middleware checks onboarding status (30s cache, proper invalidation)
- [ ] All 11 P0 issues from code review resolved
- [ ] Zero hydration errors on resume
- [ ] Auth required on all onboarding endpoints
- [ ] Rate limiting: 10 req/min on `/save-step`
- [ ] Test coverage: 95%+ on new endpoints

---

## Architecture Decision

**✅ APPROVED by 4-agent review:** Security, Prisma, Next.js, Architecture

**Why this approach wins:**
- **Timeline:** 8-10 days vs 17-21 days (tenant deferral)
- **Risk:** LOW vs VERY HIGH (no middleware refactor needed)
- **Blockers:** 0 P0 issues vs 11 P0 issues
- **Test burden:** ~50 tests vs ~100 tests
- **Rollback:** Easy (additive changes) vs Hard (architectural rewrite)

---

## Tasks

### Phase 1: Database Schema & Migration (2 days)

#### Task 1.1: Update OnboardingProgress Schema
**File:** `packages/db/prisma/schema.prisma`
**What:** Add userId field, make tenantId nullable temporarily, add version for optimistic locking
**Depends on:** None
**Risk:** Medium (schema migration)
**Review:** `prisma-migration-reviewer`

**Changes:**
```prisma
model OnboardingProgress {
  id          String   @id @default(cuid())
  userId      String   @unique  // NEW: Query by user before tenant exists
  tenantId    String?  @unique  // Make nullable (but always set in practice)

  currentStep Int      @default(0)
  stepData    Json?    // Will validate with Zod in service layer
  version     Int      @default(1)  // NEW: Optimistic locking

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([tenantId])
}
```

**Migration:**
```typescript
// Migration: Add userId, backfill from TenantUser
await prisma.$executeRaw`
  UPDATE "OnboardingProgress" op
  SET "userId" = (
    SELECT u."clerkUserId"
    FROM "TenantUser" tu
    JOIN "User" u ON tu."userId" = u.id
    WHERE tu."tenantId" = op."tenantId"
    LIMIT 1
  )
  WHERE "userId" IS NULL;
`
```

**Success:** Migration runs without data loss, all existing OnboardingProgress records have userId

---

#### Task 1.2: Remove Duplicate Fields from Tenant
**File:** `packages/db/prisma/schema.prisma`
**What:** Remove onboardingStep, onboardingData from Tenant (duplicate of OnboardingProgress)
**Depends on:** Task 1.1
**Risk:** Low (unused fields in current code)
**Addresses:** P-P0-1 (Duplicate state storage)

**Changes:**
```prisma
model Tenant {
  // ... existing fields

  onboardingStatus       OnboardingStatus  @default(NEW)
  onboardingCompletedAt  DateTime?
  // REMOVE: onboardingStep String?
  // REMOVE: onboardingData Json?

  onboardingProgress     OnboardingProgress?
}
```

**Success:** Schema compiles, no references to removed fields in codebase

---

### Phase 2: Backend - Core Endpoints (3 days)

#### Task 2.1: Make /initialize Idempotent
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Check for existing tenant before creating, return existing if found
**Depends on:** Task 1.1
**Risk:** High (tenant creation logic)
**Review:** `security-sentinel`, `financial-data-validator`
**Addresses:** Core problem #1 (Orphaned tenants)

**Implementation:**
```typescript
// POST /api/system/onboarding/initialize
export async function initializeOnboarding(request: FastifyRequest) {
  const { userId } = request // From auth middleware
  const body = InitializeSchema.parse(request.body)

  // Check if user already has a tenant
  const existingMembership = await prisma.tenantUser.findFirst({
    where: { user: { clerkUserId: userId } },
    include: { tenant: true }
  })

  if (existingMembership) {
    // Idempotent: Return existing tenant
    request.log.info({ tenantId: existingMembership.tenantId }, 'User already has tenant, skipping creation')

    return {
      tenantId: existingMembership.tenantId,
      entityId: existingMembership.tenant.entities[0]?.id,
      resumed: true,
      message: 'Onboarding already initialized'
    }
  }

  // Create new tenant (existing logic)
  const result = await createTenantWithEntity(body, userId)

  return { ...result, resumed: false }
}
```

**Success:** Calling `/initialize` twice returns same tenant, no duplicates created

---

#### Task 2.2: Create /save-step Endpoint (Database-First)
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Upsert OnboardingProgress with optimistic locking, auth required, rate limited
**Depends on:** Task 1.1
**Risk:** Medium (new endpoint)
**Review:** `security-sentinel`
**Addresses:** S-P0-3 (Race conditions), S-P1-3 (Rate limiting)

**Implementation:**
```typescript
// POST /api/system/onboarding/save-step
// Rate limit: 10 req/min
export const saveStepSchema = {
  body: z.object({
    step: z.number().int().min(0).max(4),
    data: z.record(z.unknown()).optional(), // Validated per-step in service
    version: z.number().int().optional() // For optimistic locking
  })
}

export async function saveStep(request: FastifyRequest) {
  const { userId } = request
  const { step, data, version } = request.body

  // Optimistic locking: Check version if provided
  if (version !== undefined) {
    const current = await prisma.onboardingProgress.findUnique({
      where: { userId },
      select: { version: true }
    })

    if (current && current.version !== version) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Data was modified in another session. Please refresh.'
      })
    }
  }

  // Upsert with version increment
  const progress = await prisma.onboardingProgress.upsert({
    where: { userId },
    create: {
      userId,
      currentStep: step,
      stepData: data || {},
      version: 1
    },
    update: {
      currentStep: step,
      stepData: data,
      version: { increment: 1 }
    }
  })

  request.log.info({ userId, step, version: progress.version }, 'Onboarding step saved')

  return progress
}
```

**Success:** Concurrent requests handled gracefully, version conflicts return 409

---

#### Task 2.3: Create /resume Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Fetch OnboardingProgress by userId, auth required
**Depends on:** Task 1.1
**Risk:** Low
**Review:** `security-sentinel`
**Addresses:** S-P0-2 (Unauthenticated endpoint)

**Implementation:**
```typescript
// GET /api/system/onboarding/resume
// Auth required (via middleware)
export async function resumeOnboarding(request: FastifyRequest) {
  const { userId } = request

  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId },
    select: {
      currentStep: true,
      stepData: true,
      version: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!progress) {
    return {
      currentStep: 0,
      stepData: {},
      version: 0,
      isNew: true
    }
  }

  return { ...progress, isNew: false }
}
```

**Success:** Endpoint returns 401 without auth, returns progress for authenticated user

---

#### Task 2.4: Update /complete with Idempotency & Cache Invalidation
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Make /complete idempotent, invalidate middleware cache, add Clerk rollback
**Depends on:** Task 2.1
**Risk:** High (transaction + external API)
**Review:** `security-sentinel`, `architecture-strategist`
**Addresses:** A-P1-1 (Clerk sync rollback), A-P1-3 (Cache invalidation)

**Implementation:**
```typescript
// POST /api/system/onboarding/complete
export async function completeOnboarding(request: FastifyRequest) {
  const { userId } = request
  const membership = await getTenantMembership(userId)

  // Idempotent: Already completed
  if (membership.tenant.onboardingStatus === 'COMPLETED') {
    request.log.info({ tenantId: membership.tenantId }, 'Onboarding already completed')
    return { message: 'Onboarding already completed', alreadyCompleted: true }
  }

  // Transaction: Update tenant + progress
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.update({
      where: { id: membership.tenantId },
      data: {
        onboardingStatus: 'COMPLETED',
        onboardingCompletedAt: new Date()
      }
    })

    await tx.onboardingProgress.update({
      where: { userId },
      data: {
        currentStep: 4, // Final step
        version: { increment: 1 }
      }
    })

    return { tenant }
  })

  // AFTER transaction: Update Clerk metadata
  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingCompleted: true,
        tenantId: membership.tenantId
      }
    })
  } catch (clerkError) {
    // Rollback: Mark tenant as failed, soft-delete
    request.log.error({ err: clerkError, tenantId: membership.tenantId }, 'Clerk sync failed, rolling back')

    await prisma.tenant.update({
      where: { id: membership.tenantId },
      data: {
        onboardingStatus: 'IN_PROGRESS', // Rollback status
        onboardingCompletedAt: null
      }
    })

    throw new Error('Failed to sync with authentication provider. Please try again.')
  }

  // CRITICAL: Invalidate middleware cache
  invalidateOnboardingCache(userId)

  request.log.info({ tenantId: membership.tenantId }, 'Onboarding completed successfully')

  return { message: 'Onboarding completed', tenant: result.tenant }
}
```

**Success:** Clerk failures roll back tenant status, cache invalidated on completion

---

#### Task 2.5: Add Cleanup Job for Abandoned Tenants
**File:** `apps/api/src/domains/system/jobs/cleanup-abandoned-tenants.ts` (NEW)
**What:** Scheduled job (cron) to delete tenants with IN_PROGRESS status older than 7 days
**Depends on:** None
**Risk:** High (destructive operation)
**Review:** `security-sentinel`, `prisma-migration-reviewer`
**Addresses:** Core problem #1 (Orphaned tenants)

**Implementation:**
```typescript
// apps/api/src/domains/system/jobs/cleanup-abandoned-tenants.ts
import { prisma } from '@akount/db'
import { logger } from '../../../lib/logger'

export async function cleanupAbandonedTenants() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const abandoned = await prisma.tenant.findMany({
    where: {
      onboardingStatus: 'IN_PROGRESS',
      createdAt: { lt: sevenDaysAgo },
      deletedAt: null // Not already soft-deleted
    },
    select: { id: true, name: true, createdAt: true }
  })

  logger.info({ count: abandoned.length }, 'Found abandoned tenants for cleanup')

  for (const tenant of abandoned) {
    // Soft delete (CASCADE handles related records)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { deletedAt: new Date() }
    })

    logger.info({ tenantId: tenant.id, name: tenant.name }, 'Soft-deleted abandoned tenant')
  }

  return { deletedCount: abandoned.length }
}

// Schedule: Daily at 2:00 AM
// Add to cron config or Vercel Cron Jobs
```

**Cron Config:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/system/jobs/cleanup-abandoned-tenants",
    "schedule": "0 2 * * *"
  }]
}
```

**Success:** Job runs daily, deletes tenants older than 7 days with IN_PROGRESS status

---

### Phase 3: Middleware & Caching (1.5 days)

#### Task 3.1: Enable Middleware with Database Check & Cache
**File:** `apps/web/src/middleware.ts`
**What:** Check onboarding status from DB, cache for 30s, redirect incomplete users
**Depends on:** Task 2.4
**Risk:** Medium (performance impact)
**Review:** `nextjs-app-router-reviewer`, `performance-oracle`
**Addresses:** A-P1-3 (Cache invalidation)

**Implementation:**
```typescript
// apps/web/src/middleware.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// In-memory cache (30s TTL)
const onboardingCache = new Map<string, { status: string, cachedAt: number }>()

export async function middleware(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.next()

  // Skip onboarding routes
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.next()
  }

  // Check cache (30s TTL)
  const cached = onboardingCache.get(userId)
  const now = Date.now()

  if (cached && (now - cached.cachedAt < 30000)) {
    if (cached.status !== 'COMPLETED') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return NextResponse.next()
  }

  // Fetch from database
  const status = await getOnboardingStatus(userId)

  // Cache result
  onboardingCache.set(userId, { status, cachedAt: now })

  if (status !== 'COMPLETED') {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.next()
}

async function getOnboardingStatus(userId: string): Promise<string> {
  // Fetch via API route (server-side)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/system/onboarding/status`, {
    headers: { 'x-user-id': userId }
  })
  const data = await res.json()
  return data.status || 'NEW'
}

// Export cache invalidation function
export function invalidateOnboardingCache(userId: string) {
  onboardingCache.delete(userId)
}
```

**Success:** Middleware checks DB, caches for 30s, redirects incomplete users

---

#### Task 3.2: Add Cache Invalidation API Endpoint
**File:** `apps/api/src/domains/system/routes/onboarding.ts`
**What:** Internal endpoint to invalidate Next.js middleware cache
**Depends on:** Task 3.1
**Risk:** Low
**Review:** `security-sentinel`

**Implementation:**
```typescript
// POST /api/system/onboarding/invalidate-cache
// Internal use only (called from /complete)
export async function invalidateCache(request: FastifyRequest) {
  const { userId } = request.body

  // Call Next.js revalidation endpoint
  await fetch(`${process.env.NEXTJS_URL}/api/revalidate-onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })

  return { message: 'Cache invalidated' }
}
```

**Next.js Revalidation Route:**
```typescript
// apps/web/src/app/api/revalidate-onboarding/route.ts
import { invalidateOnboardingCache } from '@/middleware'

export async function POST(request: Request) {
  const { userId } = await request.json()
  invalidateOnboardingCache(userId)
  return Response.json({ revalidated: true })
}
```

**Success:** Calling /complete immediately invalidates middleware cache

---

### Phase 4: Frontend - Server Component Resume (2 days)

#### Task 4.1: Migrate Onboarding Page to Server Component
**File:** `apps/web/src/app/onboarding/page.tsx`
**What:** Server-side resume fetch, pass as props to avoid hydration mismatch
**Depends on:** Task 2.3
**Risk:** Medium (refactor)
**Review:** `nextjs-app-router-reviewer`
**Addresses:** N-P0-1 (Hydration mismatch)

**Implementation:**
```typescript
// apps/web/src/app/onboarding/page.tsx (Server Component)
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './components/OnboardingWizard'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Server-side resume fetch
  const resumeState = await fetchResumeState(userId)

  // Already completed? Redirect to dashboard
  if (resumeState.status === 'COMPLETED') {
    redirect('/overview')
  }

  // Pass resume state as props (no hydration mismatch)
  return (
    <OnboardingWizard
      initialStep={resumeState.currentStep}
      initialData={resumeState.stepData}
      version={resumeState.version}
    />
  )
}

async function fetchResumeState(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/system/onboarding/resume`, {
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
      'x-user-id': userId
    }
  })

  if (!res.ok) {
    return { currentStep: 0, stepData: {}, version: 0, status: 'NEW' }
  }

  return res.json()
}
```

**Success:** No hydration errors, resume state server-rendered

---

#### Task 4.2: Remove Zustand localStorage Persistence
**File:** `apps/web/src/stores/onboardingStore.ts`
**What:** Remove persist middleware, use database as source of truth
**Depends on:** Task 4.1
**Risk:** Low
**Addresses:** Core problem #2 (Triple state drift)

**Changes:**
```typescript
// BEFORE (v2):
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({ ... }),
    { name: 'onboarding-storage' }
  )
)

// AFTER (v3):
export const useOnboardingStore = create<OnboardingStore>()((set) => ({
  // State passed from server via props, synced to DB via /save-step
  currentStep: 0,
  accountType: null,
  // ... no localStorage persistence
}))
```

**Migration Path:**
```typescript
// One-time migration: Check for old localStorage on mount
useEffect(() => {
  const legacyState = localStorage.getItem('onboarding-storage')
  if (legacyState) {
    const parsed = JSON.parse(legacyState)
    // Push to database
    saveStep(parsed.currentStep, parsed).then(() => {
      localStorage.removeItem('onboarding-storage')
    })
  }
}, [])
```

**Success:** No localStorage references, state lives in database only

---

#### Task 4.3: Add Debounced Auto-Save
**File:** `apps/web/src/app/onboarding/components/OnboardingWizard.tsx`
**What:** Auto-save form data to /save-step with 500ms debounce
**Depends on:** Task 2.2
**Risk:** Low
**Review:** `nextjs-app-router-reviewer`
**Addresses:** N-P0-3 (Race condition in auto-save)

**Implementation:**
```typescript
// apps/web/src/app/onboarding/components/OnboardingWizard.tsx
'use client'

import { useDebouncedCallback } from 'use-debounce'
import { useState, useEffect } from 'react'

export function OnboardingWizard({ initialStep, initialData, version }) {
  const [step, setStep] = useState(initialStep)
  const [data, setData] = useState(initialData)
  const [localVersion, setLocalVersion] = useState(version)

  // Debounced auto-save (500ms)
  const debouncedSave = useDebouncedCallback(async (step, data, version) => {
    try {
      const result = await saveStep(step, data, version)
      setLocalVersion(result.version)
    } catch (error) {
      if (error.status === 409) {
        // Conflict: Another tab modified data
        alert('Your data was updated in another tab. Please refresh.')
      }
    }
  }, 500)

  // Auto-save on data change
  useEffect(() => {
    debouncedSave(step, data, localVersion)
  }, [data, step])

  return (
    // ... wizard UI
  )
}
```

**Success:** Form auto-saves after 500ms pause, conflicts detected

---

### Phase 5: Testing & Security (2 days)

#### Task 5.1: Add Rate Limiting to /save-step
**File:** `apps/api/src/domains/system/routes/onboarding-progress.ts`
**What:** Apply rate limit: 10 requests per minute per user
**Depends on:** Task 2.2
**Risk:** Low
**Review:** `security-sentinel`
**Addresses:** S-P1-3 (Rate limiting)

**Implementation:**
```typescript
// Use @fastify/rate-limit
import rateLimit from '@fastify/rate-limit'

fastify.register(rateLimit, {
  max: 10, // 10 requests
  timeWindow: '1 minute',
  keyGenerator: (request) => request.userId // Per user
})

fastify.post('/save-step', {
  config: { rateLimit: { max: 10, timeWindow: 60000 } },
  handler: saveStep
})
```

**Success:** 11th request in 1 minute returns 429 Too Many Requests

---

#### Task 5.2: Add Input Validation Schemas
**File:** `apps/api/src/domains/system/schemas/onboarding.schema.ts`
**What:** Zod schemas for stepData per step (prevent XSS, DoS)
**Depends on:** None
**Risk:** Low
**Review:** `security-sentinel`
**Addresses:** S-P1-2 (stepData validation)

**Implementation:**
```typescript
// apps/api/src/domains/system/schemas/onboarding.schema.ts
import { z } from 'zod'

export const Step0Schema = z.object({
  accountType: z.enum(['personal', 'business'])
})

export const Step1Schema = z.object({
  fullName: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  timezone: z.string().max(50)
})

export const Step2Schema = z.object({
  entityName: z.string().min(1).max(100),
  country: z.string().length(2), // ISO 2-letter code
  currency: z.string().length(3)  // ISO 3-letter code
})

export const Step3Schema = z.object({
  intents: z.array(z.enum(['invoicing', 'expenses', 'reconciliation'])).max(10)
})

// Validate stepData based on current step
export function validateStepData(step: number, data: unknown) {
  switch (step) {
    case 0: return Step0Schema.parse(data)
    case 1: return Step1Schema.parse(data)
    case 2: return Step2Schema.parse(data)
    case 3: return Step3Schema.parse(data)
    default: return {}
  }
}
```

**Success:** Invalid stepData rejected with 400, max field lengths enforced

---

#### Task 5.3: Add Backend Tests
**File:** `apps/api/src/domains/system/routes/__tests__/onboarding-progress.test.ts`
**What:** Test suite for new endpoints (resume, save-step, cleanup job)
**Depends on:** Tasks 2.1-2.5
**Risk:** Low

**Coverage:**
```typescript
describe('Onboarding Progress', () => {
  describe('POST /save-step', () => {
    it('should save step with auth', async () => { })
    it('should reject without auth (401)', async () => { })
    it('should handle version conflict (409)', async () => { })
    it('should enforce rate limit (429)', async () => { })
    it('should validate stepData per step', async () => { })
  })

  describe('GET /resume', () => {
    it('should return progress for authenticated user', async () => { })
    it('should return default for new user', async () => { })
    it('should reject without auth (401)', async () => { })
  })

  describe('POST /initialize', () => {
    it('should create tenant on first call', async () => { })
    it('should return existing tenant on second call', async () => { })
    it('should not create duplicates', async () => { })
  })

  describe('POST /complete', () => {
    it('should complete onboarding and invalidate cache', async () => { })
    it('should be idempotent (no error on re-call)', async () => { })
    it('should rollback on Clerk sync failure', async () => { })
  })

  describe('Cleanup Job', () => {
    it('should delete tenants older than 7 days with IN_PROGRESS', async () => { })
    it('should not delete recent tenants', async () => { })
    it('should soft delete (not hard delete)', async () => { })
  })
})
```

**Success:** 25+ tests, 95%+ coverage, all passing

---

#### Task 5.4: Add Frontend Tests
**File:** `apps/web/src/app/onboarding/__tests__/onboarding-wizard.test.tsx`
**What:** Test server component resume, debounced save, conflict handling
**Depends on:** Tasks 4.1-4.3
**Risk:** Low

**Coverage:**
```typescript
describe('OnboardingWizard', () => {
  it('should resume from server-fetched state', async () => { })
  it('should auto-save after 500ms debounce', async () => { })
  it('should show conflict alert on 409 response', async () => { })
  it('should not cause hydration errors', async () => { })
  it('should clear legacy localStorage on mount', async () => { })
})
```

**Success:** 10+ tests, no hydration errors in logs

---

#### Task 5.5: Add Monitoring & Alerts
**File:** `apps/api/src/domains/system/routes/onboarding.ts` (instrumentation)
**What:** Sentry events, metrics dashboard, error rate alerts
**Depends on:** None
**Risk:** Low
**Addresses:** A-P2-3 (No monitoring)

**Metrics to Track:**
- `/initialize` idempotency rate (% of resumed vs new)
- `/complete` success rate (target: >98%)
- `/complete` Clerk sync failure rate (alert if >1%)
- Middleware redirect rate (% of users incomplete)
- Cleanup job: Tenants deleted per run

**Implementation:**
```typescript
// Add to /complete handler
Sentry.metrics.increment('onboarding.complete.success', {
  tags: { accountType: body.accountType }
})

// Add to cleanup job
Sentry.metrics.gauge('onboarding.abandoned_tenants', deletedCount)
```

**Success:** Metrics visible in Sentry, alerts configured

---

### Phase 6: Documentation & Deployment (0.5 days)

#### Task 6.1: Update API Documentation
**File:** `docs/api/onboarding.md` (NEW)
**What:** Document new endpoints, rate limits, error codes
**Depends on:** Tasks 2.1-2.5
**Risk:** Low

**Contents:**
- Endpoint reference: /initialize, /save-step, /resume, /complete
- Rate limits per endpoint
- Error codes and meanings
- Example requests/responses
- Cron job schedule

**Success:** Documentation complete and reviewed

---

#### Task 6.2: Deploy & Verify
**File:** N/A (deployment)
**What:** Deploy to staging, run smoke tests, monitor for 24h
**Depends on:** All tasks
**Risk:** Medium

**Deployment Checklist:**
- [ ] Database migration runs successfully
- [ ] Cleanup job scheduled (cron config deployed)
- [ ] Middleware cache working (check logs)
- [ ] No hydration errors in browser console
- [ ] Rate limiting active (test with 11th request)
- [ ] Sentry metrics populating
- [ ] /initialize idempotency verified (call twice)
- [ ] /complete Clerk sync verified

**Success:** All checks pass, no errors in 24h monitoring

---

## Reference Files

- `apps/api/src/domains/system/routes/onboarding.ts` — Current /initialize, /complete
- `apps/web/src/app/onboarding/page.tsx` — Current onboarding page (client component)
- `apps/web/src/stores/onboardingStore.ts` — Zustand store with localStorage
- `packages/db/prisma/schema.prisma` — Tenant, OnboardingProgress models
- `apps/web/src/middleware.ts` — Current middleware (disabled)
- `.reviews/SYNTHESIS.md` — 4-agent review findings

---

## Edge Cases

### User abandons onboarding mid-flow
**Solution:** Resume state saved to DB after each step, /resume endpoint restores

### User completes onboarding in 2 tabs simultaneously
**Solution:** Optimistic locking detects conflict, shows alert "Data modified in another tab"

### Clerk metadata sync fails
**Solution:** Transaction rolls back tenant status to IN_PROGRESS, user retries /complete

### Middleware cache shows stale status
**Solution:** 30s TTL + invalidation on /complete = max 30s stale (vs 5min in v2)

### Cleanup job deletes active user's tenant
**Solution:** Only deletes tenants with IN_PROGRESS status AND >7 days old

### User has multiple entities (future)
**Solution:** OnboardingProgress tracks per user (not per tenant), tenantId set on first entity creation

---

## Testing Strategy

**Backend:**
- Unit tests: Schema validation, optimistic locking, idempotency
- Integration tests: Database transactions, Clerk API mocks
- Load tests: Middleware DB query performance (1000 concurrent users)

**Frontend:**
- Component tests: Resume state rendering, debounced save
- E2E tests: Full onboarding flow (Playwright)
- Hydration tests: Server/client HTML comparison

**Security:**
- Penetration tests: Rate limiting bypass attempts
- Input fuzzing: stepData XSS/SQL injection
- Auth tests: Endpoint access without token

---

## Progress

### Phase 1: Database Schema
- [ ] Task 1.1: Update OnboardingProgress schema
- [ ] Task 1.2: Remove duplicate Tenant fields

### Phase 2: Backend Endpoints
- [ ] Task 2.1: Make /initialize idempotent
- [ ] Task 2.2: Create /save-step endpoint
- [ ] Task 2.3: Create /resume endpoint
- [ ] Task 2.4: Update /complete with rollback
- [ ] Task 2.5: Add cleanup job

### Phase 3: Middleware & Caching
- [ ] Task 3.1: Enable middleware with DB check
- [ ] Task 3.2: Add cache invalidation endpoint

### Phase 4: Frontend
- [ ] Task 4.1: Migrate to Server Component
- [ ] Task 4.2: Remove Zustand persistence
- [ ] Task 4.3: Add debounced auto-save

### Phase 5: Testing & Security
- [ ] Task 5.1: Add rate limiting
- [ ] Task 5.2: Add input validation
- [ ] Task 5.3: Backend tests (25+)
- [ ] Task 5.4: Frontend tests (10+)
- [ ] Task 5.5: Monitoring & alerts

### Phase 6: Documentation
- [ ] Task 6.1: API documentation
- [ ] Task 6.2: Deploy & verify

---

## Review Agent Coverage

| Phase | Tasks | Relevant Agents |
|-------|-------|----------------|
| Phase 1 | 1.1-1.2 | `prisma-migration-reviewer` |
| Phase 2 | 2.1-2.5 | `security-sentinel`, `fastify-api-reviewer`, `financial-data-validator` |
| Phase 3 | 3.1-3.2 | `nextjs-app-router-reviewer`, `performance-oracle` |
| Phase 4 | 4.1-4.3 | `nextjs-app-router-reviewer`, `kieran-typescript-reviewer` |
| Phase 5 | 5.1-5.5 | `security-sentinel` |

**Post-implementation review:** Run `/processes:review` before merging to main.

---

## Domain Impact

**Primary domain:** System (onboarding)

**Adjacent domains:** None (isolated feature)

**External dependencies:** Clerk (authentication provider)

---

## Comparison: v2 vs v3

| Metric | v2 (Deferred Tenant) | v3 (In-Place Fixes) |
|--------|---------------------|---------------------|
| **Approach** | Defer tenant to final step | Keep tenant at step 2 |
| **Timeline** | 10-13 days | **8-10 days** |
| **Risk** | HIGH (11 P0 blockers) | **LOW (0 blockers)** |
| **Middleware changes** | Extensive exemptions | **Cache only** |
| **Schema migration** | Breaking (tenantId nullable FK) | **Additive (userId field)** |
| **Test burden** | ~50 tests | **~50 tests** |
| **Review approval** | ⛔ BLOCKED | **✅ APPROVED** |

---

## Timeline Estimate

**Total:** 8-10 days (1 developer)

| Phase | Days |
|-------|------|
| Phase 1: Schema | 2 days |
| Phase 2: Backend | 3 days |
| Phase 3: Middleware | 1.5 days |
| Phase 4: Frontend | 2 days |
| Phase 5: Testing | 2 days |
| Phase 6: Deploy | 0.5 days |

**Buffer:** +2 days for unexpected issues (total 10-12 days)

---

**Next Step:** Run `/processes:work` to execute this plan task-by-task.

_Plan v3 created after 4-agent code review identified architectural flaws in v2. Approved by security, prisma, nextjs, and architecture review agents._
