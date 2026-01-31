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
function hasTenantFilter(where: any): boolean {
    if (!where) return false;

    // Check for direct tenantId filter
    if (where.tenantId) return true;

    // Check for nested entity.tenantId filter
    if (where.entity?.tenantId) return true;

    // Check for nested relations (e.g., invoice.entity.tenantId)
    if (where.entity && where.entity.tenantId) return true;

    // Check for AND/OR conditions
    if (where.AND && Array.isArray(where.AND)) {
        return where.AND.some((condition: any) => hasTenantFilter(condition));
    }
    if (where.OR && Array.isArray(where.OR)) {
        return where.OR.some((condition: any) => hasTenantFilter(condition));
    }

    return false;
}

// WARNING: This middleware is in development and should be refined before production
// For now, it logs warnings but doesn't block queries
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

// Graceful shutdown handler
const cleanup = async (): Promise<void> => {
    try {
        await prisma.$disconnect();
        console.log('✓ Database connection closed gracefully');
    } catch (error) {
        console.error('Error during database cleanup:', error);
        process.exit(1);
    }
};

// Handle termination signals (Docker, Kubernetes, process managers)
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
signals.forEach((signal) => {
    process.on(signal, () => {
        console.log(`Received ${signal}, closing database connection...`);
        cleanup();
    });
});

// Handle beforeExit (when event loop is empty)
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
