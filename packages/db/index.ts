import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

// Extend global namespace for Prisma client (TypeScript-safe)
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma =
    globalThis.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

// Note: Prisma query observer (PERF-28) is attached in apps/api/src/index.ts
// Opt-in via PRISMA_QUERY_LOG=true env var
// Observer detects slow queries (>100ms) and N+1 patterns (same query >5x)

// Tenant Isolation Middleware - Critical for multi-tenant security
// This middleware validates that queries on tenant-scoped models include tenant filtering
const TENANT_SCOPED_MODELS = [
    'Entity',
    'GLAccount',
    'JournalEntry',
    'Invoice',
    'Bill',
    'Client',
    'Vendor',
    'Account',
    'Transaction',
] as const;

// Helper function to check if a where clause includes tenant isolation
// Recursively traverses relation filters to detect tenantId at any depth
// e.g., where.tenantId, where.entity.tenantId, where.account.entity.tenantId
function hasTenantFilter(where: any, depth: number = 0): boolean {
    if (!where || depth > 5) return false;

    // Check for direct tenantId filter
    if (where.tenantId) return true;

    // Check for AND/OR conditions
    if (where.AND && Array.isArray(where.AND)) {
        if (where.AND.some((condition: any) => hasTenantFilter(condition, depth + 1))) return true;
    }
    if (where.OR && Array.isArray(where.OR)) {
        if (where.OR.some((condition: any) => hasTenantFilter(condition, depth + 1))) return true;
    }

    // Recursively check nested relation objects for tenantId
    // This handles patterns like: entity.tenantId, account.entity.tenantId
    const RELATION_KEYS = ['entity', 'account', 'invoice', 'bill', 'client', 'vendor'];
    for (const key of RELATION_KEYS) {
        if (where[key] && typeof where[key] === 'object') {
            if (hasTenantFilter(where[key], depth + 1)) return true;
        }
    }

    return false;
}

// WARNING: This middleware is in development and should be refined before production
// For now, it logs warnings but doesn't block queries
// IMPORTANT: Only register middleware if NOT in Edge Runtime (Next.js middleware doesn't support $use)
if (typeof prisma.$use === 'function') {
    try {
        prisma.$use(async (params, next) => {
            const model = params.model as string | undefined;

            // Check if this is a tenant-scoped model
            if (model && TENANT_SCOPED_MODELS.includes(model as any)) {
                const queryActions = ['findMany', 'findFirst', 'count', 'aggregate'];

                if (queryActions.includes(params.action)) {
                    if (!hasTenantFilter(params.args?.where)) {
                        // In development, log warning
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(
                                `⚠️  TENANT ISOLATION WARNING: Query on ${model} without tenant filter.`,
                                `Action: ${params.action}`,
                                `This could lead to cross-tenant data leaks in production.`
                            );
                        }

                        // In production, consider throwing an error (uncomment when ready):
                        // if (process.env.NODE_ENV === 'production') {
                        //     throw new Error(
                        //         `SECURITY: Query on ${model} must include tenant isolation. ` +
                        //         `Action: ${params.action}`
                        //     );
                        // }
                    }
                }
            }

            return next(params);
        });
    } catch (error) {
        // Silently fail in Edge Runtime - middleware not supported there
        if (process.env.NODE_ENV === 'development') {
            console.log('Prisma middleware not registered (Edge Runtime detected)');
        }
    }
}

// NOTE: Graceful shutdown handlers (process.on, process.exit) are NOT included here
// because this package is imported by Next.js middleware which runs in Edge Runtime.
// Edge Runtime doesn't support Node.js process APIs.
//
// If you need graceful shutdown, add handlers in your server entry point:
// - apps/api/src/index.ts (Fastify server)
// - NOT in shared packages that may be imported by Edge code
