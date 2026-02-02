import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@akount/db'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()

    // For protected routes (excluding onboarding), check if user has a tenant
    if (!request.nextUrl.pathname.startsWith('/onboarding')) {
      const { userId } = await auth()

      if (userId) {
        try {
          // Check if user has any tenant membership
          const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
            include: { memberships: true },
          })

          // If user exists but has no tenant membership, redirect to onboarding
          if (user && user.memberships.length === 0) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
          }
        } catch (error) {
          // Log error but don't block the request
          console.error('Error checking tenant membership:', error)
        }
      }
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
