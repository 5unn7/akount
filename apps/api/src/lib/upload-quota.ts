import { prisma, TenantPlan } from '@akount/db';
import { logger } from './logger';

/**
 * Upload Quota Enforcement — SEC-12
 *
 * Prevents tenant abuse/DoS by enforcing per-plan upload limits.
 * Tracks imports per calendar month using the existing ImportBatch model.
 *
 * Limits are per-tenant (not per-entity) to prevent circumvention
 * by creating multiple entities.
 */

/** Monthly import limits by plan */
const UPLOAD_LIMITS: Record<TenantPlan, { maxImportsPerMonth: number; maxBytesPerFile: number }> = {
  FREE: { maxImportsPerMonth: 10, maxBytesPerFile: 5 * 1024 * 1024 },       // 5MB, 10 imports/mo
  PRO: { maxImportsPerMonth: 100, maxBytesPerFile: 10 * 1024 * 1024 },      // 10MB, 100 imports/mo
  ENTERPRISE: { maxImportsPerMonth: 1000, maxBytesPerFile: 50 * 1024 * 1024 }, // 50MB, 1000 imports/mo
};

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  usage: {
    importsThisMonth: number;
    limit: number;
    plan: TenantPlan;
  };
}

/**
 * Check if a tenant is within their upload quota for the current month.
 *
 * Counts ImportBatch records created in the current calendar month
 * and compares against the tenant's plan limit.
 */
export async function checkUploadQuota(tenantId: string): Promise<QuotaCheckResult> {
  try {
    // Get tenant plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      return {
        allowed: false,
        reason: 'Tenant not found',
        usage: { importsThisMonth: 0, limit: 0, plan: 'FREE' as TenantPlan },
      };
    }

    const limits = UPLOAD_LIMITS[tenant.plan];

    // Count imports this calendar month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const importsThisMonth = await prisma.importBatch.count({
      where: {
        tenantId,
        createdAt: { gte: monthStart },
      },
    });

    if (importsThisMonth >= limits.maxImportsPerMonth) {
      return {
        allowed: false,
        reason: `Monthly import limit reached (${limits.maxImportsPerMonth} imports for ${tenant.plan} plan). Resets on the 1st of next month.`,
        usage: { importsThisMonth, limit: limits.maxImportsPerMonth, plan: tenant.plan },
      };
    }

    return {
      allowed: true,
      usage: { importsThisMonth, limit: limits.maxImportsPerMonth, plan: tenant.plan },
    };
  } catch (error) {
    logger.error({ err: error, tenantId }, 'Failed to check upload quota');
    // Fail open — don't block uploads if quota check fails
    return {
      allowed: true,
      usage: { importsThisMonth: 0, limit: 0, plan: 'FREE' as TenantPlan },
    };
  }
}

/**
 * Get the maximum file size allowed for a tenant's plan.
 */
export async function getMaxFileSize(tenantId: string): Promise<number> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    return UPLOAD_LIMITS[tenant?.plan ?? 'FREE'].maxBytesPerFile;
  } catch {
    return UPLOAD_LIMITS.FREE.maxBytesPerFile;
  }
}

/** Exported for testing */
export { UPLOAD_LIMITS };
