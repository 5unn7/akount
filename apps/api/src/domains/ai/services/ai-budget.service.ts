import { prisma } from '@akount/db';
import { logger } from '../../../lib/logger';

/**
 * AI Budget Service (P0-3)
 *
 * Enforce per-tenant AI spending limits to prevent runaway costs.
 *
 * **Default budget:** $100/month (10,000 cents) per tenant
 * **Cost model:** ~$0.50 per 1K tokens (blended Mistral + Claude)
 *
 * **Behavior:**
 * - Budget resets on first of each month
 * - Check budget BEFORE making AI calls
 * - Track spend AFTER successful AI calls
 * - Return 402 Payment Required when budget exceeded
 *
 * @module ai-budget
 */

/** Default monthly budget in cents ($100) */
const DEFAULT_MONTHLY_BUDGET_CENTS = 10000;

/** Estimated cost per 1K tokens in cents (~$0.50) */
const COST_PER_1K_TOKENS_CENTS = 50;

export interface BudgetStatus {
  tenantId: string;
  monthlyBudgetCents: number;
  currentMonthSpendCents: number;
  remainingCents: number;
  resetDate: Date | null;
  isExceeded: boolean;
  percentUsed: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  status: BudgetStatus;
  reason?: string;
}

export class AIBudgetService {
  /**
   * Check if tenant has budget remaining for an AI call.
   *
   * @param tenantId - Tenant ID
   * @param estimatedTokens - Estimated tokens for this call (optional, defaults to 2K)
   * @returns Budget check result
   */
  async checkBudget(
    tenantId: string,
    estimatedTokens: number = 2000
  ): Promise<BudgetCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        aiMonthlyBudgetCents: true,
        aiCurrentMonthSpendCents: true,
        aiSpendResetDate: true,
      },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Reset budget if we're in a new month
    const now = new Date();
    const resetDate = tenant.aiSpendResetDate;
    const needsReset =
      !resetDate ||
      resetDate.getMonth() !== now.getMonth() ||
      resetDate.getFullYear() !== now.getFullYear();

    if (needsReset) {
      await this.resetMonthlyBudget(tenantId);
      // Refresh tenant data after reset
      return this.checkBudget(tenantId, estimatedTokens);
    }

    // Calculate budget status
    const monthlyBudget = tenant.aiMonthlyBudgetCents ?? DEFAULT_MONTHLY_BUDGET_CENTS;
    const currentSpend = tenant.aiCurrentMonthSpendCents;
    const estimatedCost = Math.ceil((estimatedTokens / 1000) * COST_PER_1K_TOKENS_CENTS);
    const remaining = monthlyBudget - currentSpend;
    const percentUsed = (currentSpend / monthlyBudget) * 100;

    const status: BudgetStatus = {
      tenantId,
      monthlyBudgetCents: monthlyBudget,
      currentMonthSpendCents: currentSpend,
      remainingCents: remaining,
      resetDate,
      isExceeded: remaining < estimatedCost,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };

    // Check if this call would exceed budget
    if (status.isExceeded) {
      logger.warn(
        {
          tenantId,
          monthlyBudget,
          currentSpend,
          estimatedCost,
          remaining,
        },
        'AI budget exceeded'
      );

      return {
        allowed: false,
        status,
        reason: `Monthly AI budget exceeded. Used $${(currentSpend / 100).toFixed(2)} of $${(monthlyBudget / 100).toFixed(2)}. Resets on ${new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]}.`,
      };
    }

    // Warn if approaching budget limit (>80%)
    if (percentUsed > 80) {
      logger.warn(
        { tenantId, percentUsed, remaining },
        'AI budget approaching limit'
      );
    }

    return {
      allowed: true,
      status,
    };
  }

  /**
   * Track AI spending after a successful call.
   *
   * @param tenantId - Tenant ID
   * @param tokensUsed - Actual tokens consumed
   */
  async trackSpend(tenantId: string, tokensUsed: number): Promise<void> {
    const costCents = Math.ceil((tokensUsed / 1000) * COST_PER_1K_TOKENS_CENTS);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiCurrentMonthSpendCents: {
          increment: costCents,
        },
      },
    });

    logger.info(
      { tenantId, tokensUsed, costCents },
      'AI spend tracked'
    );
  }

  /**
   * Reset monthly budget (called automatically on month rollover).
   *
   * @param tenantId - Tenant ID
   */
  async resetMonthlyBudget(tenantId: string): Promise<void> {
    const now = new Date();

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiCurrentMonthSpendCents: 0,
        aiSpendResetDate: now,
      },
    });

    logger.info(
      { tenantId, resetDate: now },
      'AI monthly budget reset'
    );
  }

  /**
   * Get current budget status for a tenant.
   *
   * @param tenantId - Tenant ID
   * @returns Current budget status
   */
  async getBudgetStatus(tenantId: string): Promise<BudgetStatus> {
    const checkResult = await this.checkBudget(tenantId, 0); // 0 tokens = just get status
    return checkResult.status;
  }

  /**
   * Update tenant's monthly budget limit.
   *
   * @param tenantId - Tenant ID
   * @param budgetCents - New monthly budget in cents
   */
  async updateBudgetLimit(tenantId: string, budgetCents: number): Promise<void> {
    if (budgetCents < 0) {
      throw new Error('Budget must be non-negative');
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiMonthlyBudgetCents: budgetCents,
      },
    });

    logger.info(
      { tenantId, newBudget: budgetCents },
      'AI budget limit updated'
    );
  }
}
