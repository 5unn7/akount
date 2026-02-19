import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { Role } from '@akount/types';

// ============================================================================
// Route Matchers
// ============================================================================

// Public routes - no auth required
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/forbidden',
  '/brand(.*)', // Brand portal - public for demos
]);

// Admin-only routes (OWNER, ADMIN)
const adminOnlyRoutes = createRouteMatcher([
  '/system/users(.*)',
  '/system/security(.*)',
  '/system/settings(.*)',
  '/system/integrations(.*)',
  '/system/data-management(.*)',
]);

// Accounting routes (OWNER, ADMIN, ACCOUNTANT)
const accountingRoutes = createRouteMatcher([
  '/accounting(.*)',
  '/accounting/journal(.*)',
  '/accounting/chart-of-accounts(.*)',
  '/accounting/fiscal-periods(.*)',
  '/accounting/assets(.*)',
  '/accounting/tax-rates(.*)',
]);

// Audit log routes (OWNER, ADMIN, ACCOUNTANT)
const auditLogRoutes = createRouteMatcher(['/system/audit-log(.*)']);

// No bookkeeper access (excludes BOOKKEEPER)
const noBookkeeperRoutes = createRouteMatcher([
  '/planning/budgets(.*)',
  '/planning/goals(.*)',
  '/planning/forecasts(.*)',
  '/ai(.*)',
]);

// ============================================================================
// Role Groups (from @akount/types/rbac)
// ============================================================================

const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];
const ACCOUNTING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT'];
const AUDIT_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT'];
const PLANNING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'];

// ============================================================================
// Middleware
// ============================================================================

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes without authentication
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  const { userId, sessionClaims } = await auth.protect();

  // Check if onboarding is complete via Clerk metadata
  // This flag is set by the onboarding API endpoints (onboarding.ts)
  const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
  const onboardingCompleted = metadata.onboardingCompleted as boolean | undefined;

  // Onboarding flow control
  // - onboardingCompleted === false: user started but didn't finish
  // - onboardingCompleted === undefined: new user, hasn't started
  // - onboardingCompleted === true: user finished onboarding
  if (onboardingCompleted !== true) {
    // User hasn't completed onboarding - only allow /onboarding routes
    if (!request.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  } else {
    // User completed onboarding - redirect away from /onboarding to dashboard
    if (request.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/overview', request.url));
    }
  }

  // Get user role from session claims (set in Clerk user metadata during onboarding)
  // Default to OWNER — self-registered users are always owners; invited users get role from metadata
  const role = ((sessionClaims?.metadata as Record<string, unknown>)?.role as Role) || 'OWNER';

  // ============================================================================
  // RBAC Checks
  // ============================================================================

  // Admin-only routes
  if (adminOnlyRoutes(request)) {
    if (!ADMIN_ROLES.includes(role)) {
      console.warn(
        `[RBAC] Denied: ${userId} (${role}) attempted admin route: ${request.nextUrl.pathname}`
      );
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  // Accounting routes
  if (accountingRoutes(request)) {
    if (!ACCOUNTING_ROLES.includes(role)) {
      console.warn(
        `[RBAC] Denied: ${userId} (${role}) attempted accounting route: ${request.nextUrl.pathname}`
      );
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  // Audit log routes
  if (auditLogRoutes(request)) {
    if (!AUDIT_ROLES.includes(role)) {
      console.warn(
        `[RBAC] Denied: ${userId} (${role}) attempted audit route: ${request.nextUrl.pathname}`
      );
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  // No bookkeeper routes (planning, AI)
  if (noBookkeeperRoutes(request)) {
    if (role === 'BOOKKEEPER') {
      console.warn(
        `[RBAC] Denied: ${userId} (${role}) attempted planning/AI route: ${request.nextUrl.pathname}`
      );
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  // ============================================================================
  // Security Headers
  // ============================================================================

  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unnecessary features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  return response;
});

// Next.js requires config to be defined directly in middleware.ts (not re-exported)
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
