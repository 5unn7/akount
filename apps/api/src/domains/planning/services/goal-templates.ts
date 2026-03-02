import { prisma } from '@akount/db';

/**
 * Goal Template definition.
 *
 * Each template provides a factory that queries real financial data
 * to calculate a meaningful starting target (integer cents).
 */
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  type: 'REVENUE' | 'SAVINGS' | 'EXPENSE_REDUCTION' | 'CUSTOM';
  calculateTarget: (
    entityId: string,
    tenantId: string
  ) => Promise<{
    targetAmount: number; // Integer cents
    suggestedName: string;
    suggestedAccountId?: string;
    suggestedCategoryId?: string;
    suggestedGlAccountId?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Template implementations
// ---------------------------------------------------------------------------

/**
 * Emergency Fund template.
 *
 * Target: 6 months of average monthly expenses derived from posted
 * journal-line debits over the last 6 months (debit side = expenses
 * in a standard COA). Links to the first active savings/bank account
 * found for the entity.
 */
const emergencyFundTemplate: GoalTemplate = {
  id: 'emergency-fund',
  name: 'Emergency Fund',
  description:
    'Build a safety net equal to 6 months of average monthly expenses.',
  type: 'SAVINGS',
  async calculateTarget(entityId, tenantId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Sum all debit-side journal lines (expense activity) for the last 6 months
    const result = await prisma.journalLine.aggregate({
      where: {
        journalEntry: {
          entityId,
          entity: { tenantId },
          status: 'POSTED',
          date: { gte: sixMonthsAgo },
          deletedAt: null,
        },
        debitAmount: { gt: 0 },
        deletedAt: null,
      },
      _sum: { debitAmount: true },
    });

    const totalExpenses = result._sum.debitAmount ?? 0;
    const monthlyAvg = Math.round(totalExpenses / 6);
    const targetAmount = monthlyAvg * 6; // 6 full months

    // Suggest the first active savings-type (BANK) account
    const savingsAccount = await prisma.account.findFirst({
      where: {
        entityId,
        entity: { tenantId },
        type: 'BANK',
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      targetAmount,
      suggestedName: 'Emergency Fund (6 months)',
      suggestedAccountId: savingsAccount?.id,
    };
  },
};

/**
 * Revenue Target template.
 *
 * Target: 20 % growth over trailing 12-month revenue.
 * Revenue is measured as credits posted to INCOME-type GL accounts.
 * Links to the first INCOME GL account found for the entity.
 */
const revenueTargetTemplate: GoalTemplate = {
  id: 'revenue-target',
  name: 'Revenue Target',
  description:
    'Grow annual revenue by 20 % over the trailing 12-month total.',
  type: 'REVENUE',
  async calculateTarget(entityId, tenantId) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Sum credit-side lines on INCOME GL accounts (revenue recognition)
    const result = await prisma.journalLine.aggregate({
      where: {
        journalEntry: {
          entityId,
          entity: { tenantId },
          status: 'POSTED',
          date: { gte: twelveMonthsAgo },
          deletedAt: null,
        },
        glAccount: { type: 'INCOME' },
        creditAmount: { gt: 0 },
        deletedAt: null,
      },
      _sum: { creditAmount: true },
    });

    const annualRevenue = result._sum.creditAmount ?? 0;
    const targetAmount = Math.round(annualRevenue * 1.2); // +20 %

    // Suggest the first INCOME GL account
    const revenueGL = await prisma.gLAccount.findFirst({
      where: {
        entityId,
        entity: { tenantId },
        type: 'INCOME',
        isActive: true,
      },
      select: { id: true },
      orderBy: { code: 'asc' },
    });

    return {
      targetAmount,
      suggestedName: 'Revenue Growth Target (+20%)',
      suggestedGlAccountId: revenueGL?.id,
    };
  },
};

/**
 * Expense Reduction template.
 *
 * Target: reduce annualised expenses by 10 % based on the trailing
 * 3-month run-rate. Debit-side lines on EXPENSE GL accounts are used
 * as the basis.
 *
 * Calculation:
 *   quarterlyExpenses = SUM(debits on EXPENSE GL, last 3 months)
 *   annualised        = quarterlyExpenses * 4
 *   target            = annualised * 0.9   (10 % reduction)
 */
const expenseReductionTemplate: GoalTemplate = {
  id: 'expense-reduction',
  name: 'Expense Reduction',
  description:
    'Reduce annual expenses by 10 % based on the recent 3-month run-rate.',
  type: 'EXPENSE_REDUCTION',
  async calculateTarget(entityId, tenantId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Sum debit-side lines on EXPENSE GL accounts for the last 3 months
    const result = await prisma.journalLine.aggregate({
      where: {
        journalEntry: {
          entityId,
          entity: { tenantId },
          status: 'POSTED',
          date: { gte: threeMonthsAgo },
          deletedAt: null,
        },
        glAccount: { type: 'EXPENSE' },
        debitAmount: { gt: 0 },
        deletedAt: null,
      },
      _sum: { debitAmount: true },
    });

    const quarterlyExpenses = result._sum.debitAmount ?? 0;
    const annualised = quarterlyExpenses * 4;
    const targetAmount = Math.round(annualised * 0.9); // 10 % reduction

    // Suggest the first EXPENSE GL account (top-level)
    const expenseGL = await prisma.gLAccount.findFirst({
      where: {
        entityId,
        entity: { tenantId },
        type: 'EXPENSE',
        isActive: true,
      },
      select: { id: true },
      orderBy: { code: 'asc' },
    });

    return {
      targetAmount,
      suggestedName: 'Expense Reduction Target (-10%)',
      suggestedGlAccountId: expenseGL?.id,
    };
  },
};

/**
 * Debt Payoff template.
 *
 * Target: the total outstanding balance across all active CREDIT_CARD
 * accounts. Credit-card balances are stored as negative integers (owed
 * money), so we take the absolute value.
 */
const debtPayoffTemplate: GoalTemplate = {
  id: 'debt-payoff',
  name: 'Debt Payoff',
  description:
    'Pay off all credit-card debt by tracking the combined outstanding balance.',
  type: 'CUSTOM',
  async calculateTarget(entityId, tenantId) {
    // Sum currentBalance across all CREDIT_CARD accounts
    const result = await prisma.account.aggregate({
      where: {
        entityId,
        entity: { tenantId },
        type: 'CREDIT_CARD',
        isActive: true,
        deletedAt: null,
      },
      _sum: { currentBalance: true },
    });

    // Balances are negative for money owed; target is the absolute value
    const totalDebt = Math.abs(result._sum.currentBalance ?? 0);

    // Suggest the first credit-card account
    const creditCard = await prisma.account.findFirst({
      where: {
        entityId,
        entity: { tenantId },
        type: 'CREDIT_CARD',
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      targetAmount: totalDebt,
      suggestedName: 'Credit Card Debt Payoff',
      suggestedAccountId: creditCard?.id,
    };
  },
};

// ---------------------------------------------------------------------------
// Master template list (order determines display order)
// ---------------------------------------------------------------------------

const GOAL_TEMPLATES: GoalTemplate[] = [
  emergencyFundTemplate,
  revenueTargetTemplate,
  expenseReductionTemplate,
  debtPayoffTemplate,
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/** Result shape returned for each template after calculation. */
export interface GoalTemplateResult {
  id: string;
  name: string;
  description: string;
  type: string;
  targetAmount: number;
  suggestedName: string;
  suggestedAccountId?: string;
  suggestedCategoryId?: string;
  suggestedGlAccountId?: string;
}

/**
 * GoalTemplateService
 *
 * Provides pre-built goal templates that users can select from to quickly
 * create common financial goals. Each template calculates an initial target
 * amount from real entity data (journal lines, account balances).
 *
 * All amounts are integer cents. Tenant-isolated via `entity: { tenantId }`.
 */
export class GoalTemplateService {
  constructor(private readonly tenantId: string) {}

  /**
   * List all available goal templates with calculated targets for the
   * given entity. Template calculations run in parallel. If a single
   * calculation fails, that template falls back to a zero target so the
   * overall list is never rejected.
   */
  async listTemplates(entityId: string): Promise<GoalTemplateResult[]> {
    const results = await Promise.all(
      GOAL_TEMPLATES.map(async (template) => {
        try {
          const calculated = await template.calculateTarget(
            entityId,
            this.tenantId
          );
          return {
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            ...calculated,
          };
        } catch {
          // Graceful degradation — surface the template with zero target
          return {
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            targetAmount: 0,
            suggestedName: template.name,
          };
        }
      })
    );

    return results;
  }

  /**
   * Retrieve a single template by its id and calculate the target.
   * Returns `null` if no template matches.
   */
  async getTemplate(
    templateId: string,
    entityId: string
  ): Promise<GoalTemplateResult | null> {
    const template = GOAL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return null;

    const calculated = await template.calculateTarget(
      entityId,
      this.tenantId
    );

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      ...calculated,
    };
  }
}
