# Akount - Current Tasks

**Last Updated:** 2026-01-27
**Current Sprint:** Phase 0 - Foundation
**Sprint Goal:** Get auth, database, and first API endpoint working

---

## 🎯 This Week's Goals

**Target:** Complete Phase 0.1 (Authentication) + Phase 0.2 (Database)

**Success Criteria:**
- [ ] Users can sign up and log in
- [ ] Database is connected with migrations
- [ ] Can query database from Prisma Studio

---

## 🔥 Priority 1: Authentication (Start Here)

### Task 0.1.1: Set Up Clerk Account
**Status:** ❌ Not Started
**Assignee:** Unassigned
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
- [ ] Have NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [ ] Have CLERK_SECRET_KEY
- [ ] Clerk dashboard accessible

---

### Task 0.1.2: Configure Environment Variables
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 5 minutes
**Blocked By:** Task 0.1.1

**Steps:**
1. Open `.env` in project root
2. Uncomment Clerk variables
3. Paste publishable key from Clerk dashboard
4. Paste secret key from Clerk dashboard
5. Save file
6. Restart dev server (if running)

**Done When:**
- [ ] `.env` has real Clerk keys (not commented out)
- [ ] No environment variable errors on startup

---

### Task 0.1.3: Add Clerk Middleware to Next.js
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 10 minutes
**Blocked By:** Task 0.1.2

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
- [ ] `middleware.ts` exists
- [ ] No TypeScript errors
- [ ] Server restarts without errors

---

### Task 0.1.4: Add ClerkProvider to Root Layout
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 10 minutes
**Blocked By:** Task 0.1.3

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
- [ ] ClerkProvider wraps entire app
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

### Task 0.1.5: Create Sign-In Page
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 15 minutes
**Blocked By:** Task 0.1.4

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
- [ ] Can access /sign-in route
- [ ] Clerk sign-in form displays
- [ ] No console errors

---

### Task 0.1.6: Create Sign-Up Page
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 10 minutes
**Blocked By:** Task 0.1.4

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
- [ ] Can access /sign-up route
- [ ] Clerk sign-up form displays
- [ ] No console errors

---

### Task 0.1.7: Test Authentication Flow
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 15 minutes
**Blocked By:** Task 0.1.5, Task 0.1.6

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
- [ ] Can create new account
- [ ] Passkey setup works
- [ ] Can sign in with passkey
- [ ] Redirect after login works

---

### Task 0.1.8: Protect Dashboard Route
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 10 minutes
**Blocked By:** Task 0.1.7

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
- [ ] Cannot access dashboard while logged out
- [ ] Redirect to /sign-in works
- [ ] Can access dashboard when logged in

---

### Task 0.1.9: Add User Menu with Sign Out
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 20 minutes
**Blocked By:** Task 0.1.8

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
- [ ] User button shows in navbar
- [ ] Clicking shows user menu
- [ ] Sign out works
- [ ] Redirects to /sign-in after sign out

---

## 🔥 Priority 2: Database Setup

### Task 0.2.1: Choose Database Provider
**Status:** ❌ Not Started
**Assignee:** Unassigned
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
- [ ] Have PostgreSQL database provisioned
- [ ] Have DATABASE_URL connection string

---

### Task 0.2.2: Configure Database Connection
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 5 minutes
**Blocked By:** Task 0.2.1

**Steps:**
1. Open `.env` file
2. Replace DATABASE_URL with real connection string
3. Format: `postgresql://user:password@host:5432/database`
4. Save file
5. Test connection: `cd packages/db && npx prisma db pull` (should succeed)

**Done When:**
- [ ] `.env` has real DATABASE_URL
- [ ] `prisma db pull` succeeds (no error)

---

### Task 0.2.3: Create Initial Migration
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 5 minutes
**Blocked By:** Task 0.2.2

**Steps:**
1. Open terminal
2. Navigate to packages/db: `cd packages/db`
3. Run migration: `npx prisma migrate dev --name init`
4. Verify migration files created in `prisma/migrations/`
5. Check database with Prisma Studio: `npx prisma studio`

**Done When:**
- [ ] Migration files exist in `prisma/migrations/`
- [ ] No errors during migration
- [ ] Can open Prisma Studio and see tables

---

### Task 0.2.4: Create Seed Script
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 30 minutes
**Blocked By:** Task 0.2.3

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
- [ ] Seed script exists
- [ ] Seed runs without errors
- [ ] Can see data in Prisma Studio

---

### Task 0.2.5: Verify Database Setup
**Status:** ❌ Not Started
**Assignee:** Unassigned
**Estimated Time:** 10 minutes
**Blocked By:** Task 0.2.4

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
- [ ] All tables exist with data
- [ ] Relationships work in Prisma Studio
- [ ] No orphaned records

---

## 🔥 Priority 3: API Foundation (Next Week)

### Task 0.3.1: Set Up Prisma Client in API
**Status:** ⏸️ Blocked
**Blocked By:** Task 0.2.5
**Estimated Time:** 15 minutes

### Task 0.3.2: Add Authentication Middleware
**Status:** ⏸️ Blocked
**Blocked By:** Task 0.3.1
**Estimated Time:** 20 minutes

### Task 0.3.3: Create First CRUD Endpoint
**Status:** ⏸️ Blocked
**Blocked By:** Task 0.3.2
**Estimated Time:** 30 minutes

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

**Phase 0.1 (Authentication):** 0 / 9 tasks complete (0%)
**Phase 0.2 (Database):** 0 / 5 tasks complete (0%)

**Total This Week:** 0 / 14 tasks complete (0%)

**Estimated Time Remaining:** ~3-4 hours

---

## 🗓️ Daily Goals

### Monday (Today)
- [ ] Complete Task 0.1.1 - 0.1.4 (Clerk setup)
- [ ] Complete Task 0.1.5 - 0.1.6 (Sign-in/Sign-up pages)
- **Goal:** Authentication pages working

### Tuesday
- [ ] Complete Task 0.1.7 - 0.1.9 (Test auth + protect routes)
- [ ] Complete Task 0.2.1 - 0.2.2 (Database setup)
- **Goal:** Auth complete, database connected

### Wednesday
- [ ] Complete Task 0.2.3 - 0.2.5 (Migrations + seed data)
- **Goal:** Database operational with test data

### Thursday-Friday
- [ ] Start Phase 0.3 (API Foundation)
- **Goal:** First API endpoint working

---

**Next Update:** End of day today (mark completed tasks)
**Sprint Review:** End of week (Friday)
