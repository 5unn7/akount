# Phase 3: Security Foundation

**Days:** 5-8
**Status:** ✅ COMPLETE (2026-02-04)
**Dependencies:** Phase 1 must be complete ✅
**Can Parallel With:** Phase 2 (UI Components)

---

## Objectives

1. Enhance proxy.ts with RBAC route protection
2. Create API RBAC middleware
3. Implement audit logging service
4. Add SOC 2 compliance controls

---

## Tasks

### 3.1 Enhance proxy.ts with RBAC

**Current file:** `apps/web/src/proxy.ts`
**Reference:** `docs/design-system/05-governance/permissions-matrix.md`

- [ ] Read current proxy.ts to understand existing implementation

- [ ] Update `apps/web/src/proxy.ts` with RBAC:

  ```typescript
  import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
  import { NextResponse } from 'next/server';
  import type { Role } from '@akount/types/rbac';

  // Public routes (no auth required)
  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
  ]);

  // Role-restricted route matchers
  const adminOnlyRoutes = createRouteMatcher([
    '/system/users(.*)',
    '/system/security(.*)',
    '/system/settings(.*)',
  ]);

  const accountingRoutes = createRouteMatcher([
    '/accounting(.*)',
  ]);

  const auditLogRoutes = createRouteMatcher([
    '/system/audit-log(.*)',
  ]);

  // Route to role mapping
  const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];
  const ACCOUNTING_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT'];
  const AUDIT_ROLES: Role[] = ['OWNER', 'ADMIN', 'ACCOUNTANT'];

  export default clerkMiddleware(async (auth, request) => {
    // Allow public routes
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    // Require authentication for all other routes
    const { userId, sessionClaims } = await auth.protect();

    // Get user role from session claims
    // Note: Role must be set in Clerk user metadata
    const role = (sessionClaims?.metadata?.role as Role) || 'INVESTOR';

    // Check admin-only routes
    if (adminOnlyRoutes(request)) {
      if (!ADMIN_ROLES.includes(role)) {
        console.warn(`[RBAC] Denied: ${userId} (${role}) attempted admin route: ${request.url}`);
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }
    }

    // Check accounting routes
    if (accountingRoutes(request)) {
      if (!ACCOUNTING_ROLES.includes(role)) {
        console.warn(`[RBAC] Denied: ${userId} (${role}) attempted accounting route: ${request.url}`);
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }
    }

    // Check audit log routes
    if (auditLogRoutes(request)) {
      if (!AUDIT_ROLES.includes(role)) {
        console.warn(`[RBAC] Denied: ${userId} (${role}) attempted audit route: ${request.url}`);
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'none'; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    return response;
  });

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  };
  ```

- [ ] Create forbidden page `apps/web/src/app/forbidden/page.tsx`:

  ```typescript
  export default function ForbiddenPage() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive">403</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <a
            href="/overview"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }
  ```

**Verification:**

```bash
# Test with different roles in Clerk dashboard
# Login as BOOKKEEPER, try to access /accounting → should redirect to /forbidden
```

---

### 3.2 Create API RBAC Middleware

**File:** `apps/api/src/middleware/rbac.ts`

- [ ] Create RBAC middleware:

  ```typescript
  import type { FastifyRequest, FastifyReply } from 'fastify';
  import {
    type Role,
    type PermissionLevel,
    type PermissionKey,
    canAccess,
  } from '@akount/types/rbac';
  import { prisma } from '@akount/db';

  /**
   * Extend FastifyRequest with tenant context.
   */
  declare module 'fastify' {
    interface FastifyRequest {
      tenantId: string;
      userId: string;
      tenantRole: Role;
    }
  }

  /**
   * Middleware factory for permission-based access control.
   */
  export function requirePermission(
    domain: string,
    resource: string,
    level: PermissionLevel
  ) {
    const key: PermissionKey = `${domain}:${resource}`;

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantRole, tenantId, userId } = request;

      if (!canAccess(key, tenantRole, level)) {
        // Log security event
        await logSecurityEvent({
          tenantId,
          userId,
          action: 'RBAC_DENIED',
          resourceType: key,
          metadata: {
            requiredLevel: level,
            userRole: tenantRole,
            path: request.url,
            method: request.method,
          },
        });

        return reply.status(403).send({
          error: 'Forbidden',
          message: `Insufficient permissions for ${key}`,
        });
      }
    };
  }

  /**
   * Log security event to audit log.
   */
  async function logSecurityEvent(params: {
    tenantId: string;
    userId: string;
    action: string;
    resourceType: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          resourceType: params.resourceType,
          metadata: params.metadata,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('[Audit] Failed to log security event:', error);
    }
  }
  ```

- [ ] Create permission decorator for routes `apps/api/src/middleware/withPermission.ts`:

  ```typescript
  import type { FastifyInstance, RouteOptions } from 'fastify';
  import { requirePermission } from './rbac';
  import type { PermissionLevel } from '@akount/types/rbac';

  /**
   * Helper to add permission check to route.
   */
  export function withPermission(
    domain: string,
    resource: string,
    level: PermissionLevel
  ) {
    return {
      preHandler: requirePermission(domain, resource, level),
    };
  }

  /**
   * Usage example:
   *
   * fastify.get('/journal-entries', {
   *   ...withPermission('accounting', 'journal-entries', 'VIEW'),
   *   handler: async (request, reply) => { ... }
   * });
   */
  ```

**Verification:**

```bash
# Add permission check to an existing route
# Test with API client using different role tokens
```

---

### 3.3 Implement Audit Logging Service

**File:** `apps/api/src/services/audit.service.ts`
**Reference:** `docs/design-system/06-compliance/soc2.md`

- [ ] Create audit service:

  ```typescript
  import { prisma } from '@akount/db';
  import type { FastifyRequest } from 'fastify';

  export interface AuditEvent {
    tenantId: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }

  export class AuditService {
    /**
     * Log an audit event.
     */
    async log(event: AuditEvent, request?: FastifyRequest): Promise<void> {
      await prisma.auditLog.create({
        data: {
          tenantId: event.tenantId,
          userId: event.userId,
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          oldValue: event.oldValue,
          newValue: event.newValue,
          metadata: {
            ...event.metadata,
            ipAddress: request?.ip,
            userAgent: request?.headers['user-agent'],
          },
          timestamp: new Date(),
        },
      });
    }

    /**
     * Log a create action.
     */
    async logCreate(
      tenantId: string,
      userId: string,
      resourceType: string,
      resourceId: string,
      newValue: Record<string, unknown>,
      request?: FastifyRequest
    ): Promise<void> {
      await this.log(
        {
          tenantId,
          userId,
          action: 'CREATE',
          resourceType,
          resourceId,
          newValue,
        },
        request
      );
    }

    /**
     * Log an update action.
     */
    async logUpdate(
      tenantId: string,
      userId: string,
      resourceType: string,
      resourceId: string,
      oldValue: Record<string, unknown>,
      newValue: Record<string, unknown>,
      request?: FastifyRequest
    ): Promise<void> {
      await this.log(
        {
          tenantId,
          userId,
          action: 'UPDATE',
          resourceType,
          resourceId,
          oldValue,
          newValue,
        },
        request
      );
    }

    /**
     * Log a delete action (soft delete).
     */
    async logDelete(
      tenantId: string,
      userId: string,
      resourceType: string,
      resourceId: string,
      oldValue: Record<string, unknown>,
      request?: FastifyRequest
    ): Promise<void> {
      await this.log(
        {
          tenantId,
          userId,
          action: 'DELETE',
          resourceType,
          resourceId,
          oldValue,
        },
        request
      );
    }

    /**
     * Log a security event.
     */
    async logSecurity(
      tenantId: string,
      userId: string,
      action: string,
      metadata: Record<string, unknown>,
      request?: FastifyRequest
    ): Promise<void> {
      await this.log(
        {
          tenantId,
          userId,
          action: `SECURITY_${action}`,
          resourceType: 'security',
          metadata,
        },
        request
      );
    }
  }

  export const auditService = new AuditService();
  ```

- [ ] Create audit query service `apps/api/src/services/audit-query.service.ts`:

  ```typescript
  import { prisma } from '@akount/db';

  export interface AuditQueryParams {
    tenantId: string;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }

  export class AuditQueryService {
    async query(params: AuditQueryParams) {
      const {
        tenantId,
        userId,
        resourceType,
        resourceId,
        action,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = params;

      const where = {
        tenantId,
        ...(userId && { userId }),
        ...(resourceType && { resourceType }),
        ...(resourceId && { resourceId }),
        ...(action && { action }),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return { logs, total };
    }
  }

  export const auditQueryService = new AuditQueryService();
  ```

---

### 3.4 Add SOC 2 Compliance Controls

**Reference:** `docs/design-system/06-compliance/soc2.md`

- [ ] Create security headers middleware `apps/api/src/middleware/security-headers.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';

  export async function securityHeaders(fastify: FastifyInstance) {
    fastify.addHook('onSend', async (request, reply) => {
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    });
  }
  ```

- [ ] Create rate limiting middleware `apps/api/src/middleware/rate-limit.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import rateLimit from '@fastify/rate-limit';

  export async function rateLimitMiddleware(fastify: FastifyInstance) {
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      keyGenerator: (request) => {
        // Rate limit by tenant + user
        return `${request.tenantId}:${request.userId}`;
      },
    });
  }
  ```

- [ ] Create input sanitization middleware `apps/api/src/middleware/sanitize.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';

  /**
   * Sanitize string inputs to prevent XSS and injection.
   */
  export function sanitizeString(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  /**
   * Deep sanitize object values.
   */
  export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }
  ```

- [ ] Add dependencies:

  ```bash
  pnpm --filter @akount/api add @fastify/rate-limit
  ```

---

## Verification Checklist

Before marking Phase 3 complete:

- [ ] proxy.ts enhanced with RBAC route protection
- [ ] Forbidden page exists at /forbidden
- [ ] API RBAC middleware created and tested
- [ ] Audit service implemented with create/update/delete logging
- [ ] Audit query service for retrieving logs
- [ ] Security headers applied to all responses
- [ ] Rate limiting configured
- [ ] Input sanitization helper created

**Test RBAC:**

```bash
# 1. Set user role to BOOKKEEPER in Clerk
# 2. Try to access /accounting → should be denied
# 3. Try to access /system/users → should be denied
# 4. Try to access /overview → should work
```

**Test Audit Logging:**

```bash
# 1. Create a journal entry via API
# 2. Query audit log for CREATE action
# 3. Verify log contains tenantId, userId, timestamps
```

---

## Handoff

When complete:

- Phases 4 & 5 can use RBAC middleware
- Phases 4 & 5 can use audit service
- Update status in `docs/restructuring/README.md` to ✅ COMPLETE
