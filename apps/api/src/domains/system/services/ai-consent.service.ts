import { prisma } from '@akount/db';
import { logger } from '../../../lib/logger';

/**
 * AI Consent Service (SEC-32)
 *
 * Manages user consent for AI-powered features.
 *
 * **Compliance:**
 * - GDPR Article 22 (automated decision-making requires consent)
 * - PIPEDA 4.3 (consent for collection, use, disclosure)
 * - CCPA ADMT (Automated Decision-Making Technology pre-use notice)
 *
 * **Default:** ALL consent toggles OFF for new users.
 * **30-day training period:** New users (<30 days since registration) require manual confirmation
 * regardless of confidence score.
 *
 * @module ai-consent
 */

export type ConsentFeature =
  | 'autoCreateBills'
  | 'autoCreateInvoices'
  | 'autoMatchTransactions'
  | 'autoCategorize'
  | 'useCorrectionsForLearning';

export interface ConsentStatus {
  userId: string;
  tenantId: string;
  autoCreateBills: boolean;
  autoCreateInvoices: boolean;
  autoMatchTransactions: boolean;
  autoCategorize: boolean;
  useCorrectionsForLearning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateConsentInput {
  autoCreateBills?: boolean;
  autoCreateInvoices?: boolean;
  autoMatchTransactions?: boolean;
  autoCategorize?: boolean;
  useCorrectionsForLearning?: boolean;
}

/**
 * Get user's AI consent status.
 *
 * If no consent record exists, creates one with ALL toggles OFF (default).
 *
 * @param userId - User ID (from auth)
 * @param tenantId - Tenant ID (for isolation)
 * @returns Current consent status
 */
export async function getConsent(userId: string, tenantId: string): Promise<ConsentStatus> {
  // Try to find existing consent
  let consent = await prisma.aIConsent.findUnique({
    where: { userId },
    select: {
      userId: true,
      tenantId: true,
      autoCreateBills: true,
      autoCreateInvoices: true,
      autoMatchTransactions: true,
      autoCategorize: true,
      useCorrectionsForLearning: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // If no consent record exists, create one with defaults (ALL OFF)
  if (!consent) {
    logger.info({ userId, tenantId }, 'Creating default AI consent record (all features OFF)');

    consent = await prisma.aIConsent.create({
      data: {
        userId,
        tenantId,
        // Defaults are set in Prisma schema (all false)
      },
      select: {
        userId: true,
        tenantId: true,
        autoCreateBills: true,
        autoCreateInvoices: true,
        autoMatchTransactions: true,
        autoCategorize: true,
        useCorrectionsForLearning: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Verify tenant isolation (CRITICAL: user's consent must belong to the current tenant)
  if (consent.tenantId !== tenantId) {
    logger.warn(
      { userId, requestTenantId: tenantId, consentTenantId: consent.tenantId },
      'Tenant mismatch in consent lookup'
    );
    throw new Error('Access denied: Consent record belongs to different tenant');
  }

  return consent;
}

/**
 * Update user's AI consent settings.
 *
 * **Audit trail:** Every consent change is logged via audit service.
 *
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param updates - Partial consent updates
 * @returns Updated consent status
 */
export async function updateConsent(
  userId: string,
  tenantId: string,
  updates: UpdateConsentInput
): Promise<ConsentStatus> {
  // Get existing consent (creates if not exists)
  const existing = await getConsent(userId, tenantId);

  // Update consent
  const updated = await prisma.aIConsent.update({
    where: { userId },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
    select: {
      userId: true,
      tenantId: true,
      autoCreateBills: true,
      autoCreateInvoices: true,
      autoMatchTransactions: true,
      autoCategorize: true,
      useCorrectionsForLearning: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info(
    {
      userId,
      tenantId,
      changes: updates,
      before: {
        autoCreateBills: existing.autoCreateBills,
        autoCreateInvoices: existing.autoCreateInvoices,
        autoMatchTransactions: existing.autoMatchTransactions,
        autoCategorize: existing.autoCategorize,
        useCorrectionsForLearning: existing.useCorrectionsForLearning,
      },
      after: {
        autoCreateBills: updated.autoCreateBills,
        autoCreateInvoices: updated.autoCreateInvoices,
        autoMatchTransactions: updated.autoMatchTransactions,
        autoCategorize: updated.autoCategorize,
        useCorrectionsForLearning: updated.useCorrectionsForLearning,
      },
    },
    'AI consent updated'
  );

  return updated;
}

/**
 * Check if a specific AI feature is enabled for the user.
 *
 * **Usage in middleware/routes:**
 * ```typescript
 * const allowed = await checkConsent(userId, tenantId, 'autoCreateBills');
 * if (!allowed) {
 *   return reply.status(403).send({ error: 'Feature not enabled in AI preferences' });
 * }
 * ```
 *
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param feature - Feature to check
 * @returns true if feature is enabled, false otherwise
 */
export async function checkConsent(
  userId: string,
  tenantId: string,
  feature: ConsentFeature
): Promise<boolean> {
  const consent = await getConsent(userId, tenantId);
  return consent[feature];
}

/**
 * Check if user is in 30-day training period.
 *
 * New users (<30 days since registration) require manual confirmation
 * regardless of AI confidence score.
 *
 * @param userId - User ID
 * @returns true if user is in training period
 */
export async function isInTrainingPeriod(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (!user) {
    return true; // Assume training period if user not found (conservative)
  }

  const daysSinceRegistration =
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceRegistration < 30;
}

/**
 * Delete all AI consent data for a user (GDPR right to erasure).
 *
 * Called as part of user deletion cascade or explicit GDPR request.
 *
 * @param userId - User ID
 */
export async function deleteUserConsent(userId: string): Promise<void> {
  await prisma.aIConsent.delete({
    where: { userId },
  });

  logger.info({ userId }, 'AI consent deleted (GDPR erasure)');
}
