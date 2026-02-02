# Akount - Current Tasks

**Last Updated:** 2026-02-02
**Current Sprint:** Phase 1 - Accounts Overview
**Sprint Goal:** Build financial dashboard with real account data and multi-currency support

---

## 🎯 This Week's Goals (2026-02-02)

**Target:** Complete Phase 1.4 & 1.5 (Frontend Dashboard + Account Management)

**Success Criteria:**
- [x] Phase 0 foundation complete ✅
- [x] API endpoints ready (GET /api/accounts, /api/dashboard/metrics) ✅
- [ ] Frontend dashboard shows real account data
- [ ] Entity filter dropdown implemented
- [ ] Currency toggle (CAD/USD) implemented
- [ ] Account list page created and functional

---

## ✅ COMPLETED: Priority 1 - Authentication

### Task 0.1.1: Set Up Clerk Account
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 15 minutes

**Steps:**
1. Go to https://clerk.com
2. Sign up for free account
3. Create new application
4. Name it "Akount" (or your preferred name)
5. Choose authentication methods:
   - ✅ Passkeys (WebAuthn)
   - ✅ Email (magic link)
   - ❌ Disable phone authentication (optional for later)
6. Copy publishable key and secret key
7. Keep browser tab open for reference

**Done When:**
- [x] Have NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [x] Have CLERK_SECRET_KEY
- [x] Clerk dashboard accessible

---

### Task 0.1.2: Configure Environment Variables
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 5 minutes

**Steps:**
1. Open `.env` in project root
2. Uncomment Clerk variables
3. Paste publishable key from Clerk dashboard
4. Paste secret key from Clerk dashboard
5. Save file
6. Restart dev server (if running)

**Done When:**
- [x] `.env` has real Clerk keys (not commented out)
- [x] No environment variable errors on startup

---

### Task 0.1.3: Add Clerk Middleware to Next.js
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 10 minutes

**Steps:**
1. Create `apps/web/src/middleware.ts`
2. Add Clerk middleware:
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```
3. Save file

**Done When:**
- [x] `middleware.ts` exists
- [x] No TypeScript errors
- [x] Server restarts without errors

---

### Task 0.1.4: Add ClerkProvider to Root Layout
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 10 minutes

**Steps:**
1. Open `apps/web/src/app/layout.tsx`
2. Import ClerkProvider: `import { ClerkProvider } from '@clerk/nextjs'`
3. Wrap children with `<ClerkProvider>`:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```
4. Save file

**Done When:**
- [x] ClerkProvider wraps entire app
- [x] No TypeScript errors
- [x] No console errors in browser

---

### Task 0.1.5: Create Sign-In Page
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 15 minutes

**Steps:**
1. Create `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`
2. Add Clerk SignIn component:
```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```
3. Save file
4. Visit http://localhost:3000/sign-in in browser
5. Verify sign-in page loads

**Done When:**
- [x] Can access /sign-in route
- [x] Clerk sign-in form displays
- [x] No console errors

---

### Task 0.1.6: Create Sign-Up Page
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 10 minutes

**Steps:**
1. Create `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`
2. Add Clerk SignUp component:
```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```
3. Save file
4. Visit http://localhost:3000/sign-up in browser
5. Verify sign-up page loads

**Done When:**
- [x] Can access /sign-up route
- [x] Clerk sign-up form displays
- [x] No console errors

---

### Task 0.1.7: Test Authentication Flow
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 15 minutes

**Steps:**
1. Go to http://localhost:3000/sign-up
2. Create new account with your email
3. Complete passkey setup (Face ID / Touch ID / Windows Hello)
4. Verify redirect to dashboard after sign up
5. Sign out (if button exists)
6. Go to http://localhost:3000/sign-in
7. Sign in with passkey
8. Verify successful login

**Done When:**
- [x] Can create new account
- [x] Passkey setup works
- [x] Can sign in with passkey
- [x] Redirect after login works

---

### Task 0.1.8: Protect Dashboard Route
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 10 minutes

**Steps:**
1. Open `apps/web/src/app/(dashboard)/layout.tsx`
2. Add auth check at top:
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // ... rest of layout
}
```
3. Save file
4. Test: Try accessing /dashboard while logged out
5. Verify redirect to /sign-in

**Done When:**
- [x] Cannot access dashboard while logged out
- [x] Redirect to /sign-in works
- [x] Can access dashboard when logged in

---

### Task 0.1.9: Add User Menu with Sign Out
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 20 minutes

**Steps:**
1. Open `apps/web/src/components/layout/Navbar.tsx`
2. Import: `import { UserButton } from '@clerk/nextjs'`
3. Replace Avatar with UserButton:
```typescript
<UserButton afterSignOutUrl="/sign-in" />
```
4. Save file
5. Test sign out functionality

**Done When:**
- [x] User button shows in navbar
- [x] Clicking shows user menu
- [x] Sign out works
- [x] Redirects to /sign-in after sign out

---

## ✅ COMPLETED: Priority 2 - Database Setup

### Task 0.2.1: Choose Database Provider
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 10 minutes

**Options:**
- **Railway** (recommended) - Free $5 credit, easy setup
- **Supabase** - Free tier, great for prototypes
- **Local PostgreSQL** - Free but requires local install

**Steps for Railway:**
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Click "Provision PostgreSQL"
5. Wait for database to provision
6. Click database → "Connect" tab
7. Copy "Postgres Connection URL"

**Done When:**
- [x] Have PostgreSQL database provisioned (Railway)
- [x] Have DATABASE_URL connection string

---

### Task 0.2.2: Configure Database Connection
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 5 minutes

**Steps:**
1. Open `.env` file
2. Replace DATABASE_URL with real connection string
3. Format: `postgresql://user:password@host:5432/database`
4. Save file
5. Test connection: `cd packages/db && npx prisma db pull` (should succeed)

**Done When:**
- [x] `.env` has real DATABASE_URL
- [x] `prisma db pull` succeeds (no error)

---

### Task 0.2.3: Create Initial Migration
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 5 minutes

**Steps:**
1. Open terminal
2. Navigate to packages/db: `cd packages/db`
3. Run migration: `npx prisma migrate dev --name init`
4. Verify migration files created in `prisma/migrations/`
5. Check database with Prisma Studio: `npx prisma studio`

**Done When:**
- [x] Migration files exist in `prisma/migrations/`
- [x] No errors during migration
- [x] Can open Prisma Studio and see tables

---

### Task 0.2.4: Create Seed Script
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 30 minutes

**Steps:**
1. Create `packages/db/prisma/seed.ts`
2. Add sample data:
   - 1 Tenant (workspace)
   - 1 User (your email from Clerk)
   - 1 TenantUser (link user to tenant)
   - 2 Entities (personal + business)
   - 5 Accounts (checking, savings, credit card, investment, loan)
   - 10 GL Accounts (basic chart of accounts)
3. Add seed script to `packages/db/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```
4. Run seed: `npx prisma db seed`

**Done When:**
- [x] Seed script exists
- [x] Seed runs without errors
- [x] Can see data in Prisma Studio

---

### Task 0.2.5: Verify Database Setup
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 10 minutes

**Steps:**
1. Open Prisma Studio: `cd packages/db && npx prisma studio`
2. Verify tables exist:
   - Tenant (1 row)
   - User (1 row)
   - Entity (2 rows)
   - Account (5 rows)
   - GLAccount (10 rows)
3. Check relationships (click through foreign keys)
4. Close Prisma Studio

**Done When:**
- [x] All tables exist with data
- [x] Relationships work in Prisma Studio
- [x] No orphaned records

---

## 🔥 Priority 3: API Foundation (START HERE)

### Task 0.3.1: Set Up Prisma Client in API
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 15 minutes

**Steps:**
1. Install Prisma client in API: `cd apps/api && npm install @prisma/client`
2. Create `apps/api/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
3. Test connection by adding to `apps/api/src/index.ts`:
```typescript
import { prisma } from './lib/prisma'

// Add to health check endpoint
fastify.get('/', async () => {
  const tenantCount = await prisma.tenant.count()
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: { connected: true, tenants: tenantCount }
  }
})
```
4. Start API server and verify health check shows database connection

**Done When:**
- [x] Prisma Client installed in API
- [x] Can query database from API
- [x] Health check endpoint shows database connected

---

### Task 0.3.2: Add Authentication Middleware
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 30 minutes

**Steps:**
1. Install Clerk SDK: `cd apps/api && npm install @clerk/clerk-sdk-node`
2. Create `apps/api/src/middleware/auth.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { createClerkClient } from '@clerk/clerk-sdk-node'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
})

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    const session = await clerkClient.sessions.verifyToken(token)
    request.userId = session.userId
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
```
3. Add TypeScript types for request.userId in `apps/api/src/types/fastify.d.ts`:
```typescript
import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
  }
}
```
4. Test with a protected endpoint

**Done When:**
- [x] Clerk SDK installed (@clerk/backend)
- [x] Auth middleware implemented (apps/api/src/middleware/auth.ts)
- [x] Can verify JWT tokens
- [x] request.userId is populated for authenticated requests
- [x] Test endpoints created (/auth/test, /me)
- [x] Error handling for missing/invalid tokens

---

### Task 0.3.3: Add Zod Validation Middleware
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 20 minutes

**Steps:**
1. Install Zod and Fastify plugin: `cd apps/api && npm install zod @fastify/type-provider-zod`
2. Register type provider in `apps/api/src/index.ts`:
```typescript
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)
```
3. Create error handler in `apps/api/src/middleware/errorHandler.ts`:
```typescript
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      details: error.errors,
    })
  }

  console.error(error)
  return reply.status(500).send({ error: 'Internal Server Error' })
}
```
4. Register error handler in main server file

**Done When:**
- [x] Zod validation working (validateBody, validateQuery, validateParams)
- [x] Error handling middleware in place (errorHandler)
- [x] Can validate request schemas with clear error messages
- [x] Common schemas defined (uuid, pagination, dateRange, etc.)
- [x] Test endpoints created (/validation/test, /validation/query)
- [x] Documentation created (VALIDATION.md)

---

### Task 0.3.4: Create First CRUD Endpoint (GET /api/entities)
**Status:** ✅ Complete
**Completed:** 2026-01-30
**Estimated Time:** 30 minutes

**Steps:**
1. Create `apps/api/src/routes/entities.ts`:
```typescript
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export async function entitiesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>()

  server.get(
    '/entities',
    {
      onRequest: [authMiddleware],
      schema: {
        response: {
          200: z.object({
            entities: z.array(z.object({
              id: z.string(),
              name: z.string(),
              type: z.string(),
              currency: z.string(),
            })),
          }),
        },
      },
    },
    async (request, reply) => {
      // Get user's tenant
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId },
        include: { tenant: true },
      })

      if (!tenantUser) {
        return reply.status(404).send({ error: 'Tenant not found' })
      }

      // Get entities for this tenant
      const entities = await prisma.entity.findMany({
        where: { tenantId: tenantUser.tenantId },
        select: {
          id: true,
          name: true,
          type: true,
          baseCurrency: true,
        },
      })

      return {
        entities: entities.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          currency: e.baseCurrency,
        })),
      }
    }
  )
}
```
2. Register routes in `apps/api/src/index.ts`:
```typescript
import { entitiesRoutes } from './routes/entities'

await fastify.register(entitiesRoutes, { prefix: '/api' })
```
3. Test with curl or Thunder Client:
```bash
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" http://localhost:4000/api/entities
```

**Done When:**
- [x] GET /api/entities endpoint works
- [x] Returns only entities for authenticated user's tenant
- [x] Validates authentication
- [x] Returns proper JSON response
- [x] Test documentation created (TEST_ENTITIES.md)

---

## 📝 Notes

**Working on a task?**
1. Change status to "🚧 In Progress"
2. Add your name to "Assignee"
3. Update STATUS.md when done

**Stuck on a task?**
1. Check error messages carefully
2. Search Clerk/Prisma docs
3. Ask for help (comment in task or ping team)

**Completed a task?**
1. Mark checkbox ✅
2. Change status to "✅ Complete"
3. Update STATUS.md
4. Move to next task

---

## 📊 Week Progress

**Phase 0.1 (Authentication):** 9 / 9 tasks complete (100%) ✅
**Phase 0.2 (Database):** 5 / 5 tasks complete (100%) ✅
**Phase 0.3 (API Foundation):** 4 / 4 tasks complete (100%) ✅
**Phase 0.4 (First Vertical Slice):** 4 / 4 tasks complete (100%) ✅

**Total Completed:** 22 / 22 tasks complete (100%) 🎉🎉🎉

**🏆 PHASE 0 COMPLETE - FOUNDATION SOLID! 🏆**

---

## 🗓️ This Week (2026-02-02)

### ✅ Phase 0 Complete (2026-02-01)
- [x] Phase 0.1 - Authentication (all 9 tasks) ✅
- [x] Phase 0.2 - Database Setup (all 5 tasks) ✅
- [x] Phase 0.3 - API Foundation (all 4 tasks) ✅
- [x] Phase 0.4 - First Vertical Slice (all 4 tasks) ✅
- [x] Phase 0.5 - Perplexity AI Integration (complete) ✅
- [x] Code Review & Performance Optimization (50x improvement) ✅

### 🔥 Today's Goals (2026-02-02 - PHASE 1 STARTS)

#### Task 1.1: Frontend Dashboard Integration
- [ ] Connect dashboard page to GET /api/dashboard/metrics
- [ ] Display KPI cards with real data (Net Worth, Cash Position, etc.)
- [ ] Add entity filter dropdown (show all entities in tenant)
- [ ] Add currency toggle (base currency vs USD)
- [ ] Test with real database data
- **Estimated:** 3-4 hours

#### Task 1.2: Create Account List Page
- [ ] Create /accounts page layout
- [ ] Create AccountsList component
- [ ] Connect to GET /api/accounts endpoint
- [ ] Display account cards with balances
- [ ] Add filtering UI (by type, entity, etc.)
- [ ] Link to individual account detail pages
- **Estimated:** 2-3 hours

#### Task 1.3: Testing & Validation
- [ ] End-to-end test: Login → View Dashboard → Filter by entity
- [ ] End-to-end test: Navigate to /accounts → See all accounts
- [ ] Test multi-currency calculations
- [ ] Verify performance (dashboard loads < 200ms)
- [ ] Test tenant isolation (can't see other tenant's data)
- **Estimated:** 1 hour

### 🚀 Phase 1 Implementation Plan

**Frontend Components Needed:**
1. DashboardMetrics component (real data)
2. EntityFilter component (dropdown)
3. CurrencyToggle component (CAD/USD)
4. AccountCard component (balance display)
5. AccountsList page integration

**UI Patterns:**
- Use existing Card components from shadcn/ui
- Follow design system (Orange/Violet/Slate colors)
- Mobile responsive layout
- Loading states with Suspense

**Testing Approach:**
- Test in development environment
- Use real database data
- Verify calculations with known values
- Check permissions/tenant isolation

---

**Next Update:** 2026-02-03
**Sprint Goal:** Complete Phase 1 frontend integration by end of week
