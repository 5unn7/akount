# Migrate middleware.ts to proxy.ts

**Date:** 2026-02-03
**Status:** Ready to Execute

Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` (Node.js runtime, not Edge).

## Steps

### 1. Rename file

```bash
mv apps/web/src/middleware.ts apps/web/src/proxy.ts
```

### 2. Update the code (security fix + best practice)

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes - no auth required
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  // Note: /onboarding requires auth (uses useAuth hook)
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Changes from original:**
- Removed `/onboarding(.*)` from public routes (security fix)
- Added explicit `NextResponse.next()` return (best practice)
- Added `NextResponse` import

### 3. Verify

```bash
pnpm dev  # App starts without errors
# Test: Login works, protected routes redirect when unauthenticated
```

## Rollback

```bash
mv apps/web/src/proxy.ts apps/web/src/middleware.ts
```

## References

- [Next.js proxy.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Clerk clerkMiddleware()](https://clerk.com/docs/reference/nextjs/clerk-middleware)
