import { prisma } from '@akount/db';
import { aiService } from './ai.service';
import { RuleService } from './rule.service';
import { RuleEngineService, type TransactionData } from './rule-engine.service';
import { logger } from '../../../lib/logger';

/**
 * Categorization Service
 *
 * Auto-categorizes transactions using keyword matching and AI fallback.
 * Enhanced with GL account resolution for AI-powered journal entry drafting.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number; // 0-100
  confidenceTier: ConfidenceTier;
  matchReason: string;
  /** Resolved GL account ID for the entity (null if entityId not provided or no match) */
  resolvedGLAccountId: string | null;
  /** Resolved GL account code (e.g. '5800') */
  resolvedGLAccountCode: string | null;
  /** Rule ID that matched (if categorized by a rule) */
  ruleId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Common merchant/keyword patterns for auto-categorization.
 * Format: [keyword, categoryType, categoryName]
 */
const KEYWORD_PATTERNS: ReadonlyArray<readonly [string, string, string]> = [
  // Food & Dining
  ['restaurant', 'expense', 'Meals & Entertainment'],
  ['cafe', 'expense', 'Meals & Entertainment'],
  ['coffee', 'expense', 'Meals & Entertainment'],
  ['starbucks', 'expense', 'Meals & Entertainment'],
  ['tim hortons', 'expense', 'Meals & Entertainment'],
  ['mcdonald', 'expense', 'Meals & Entertainment'],
  ['subway', 'expense', 'Meals & Entertainment'],
  ['pizza', 'expense', 'Meals & Entertainment'],
  ['burger', 'expense', 'Meals & Entertainment'],
  ['doordash', 'expense', 'Meals & Entertainment'],
  ['uber eats', 'expense', 'Meals & Entertainment'],
  ['skip the dishes', 'expense', 'Meals & Entertainment'],
  ['grubhub', 'expense', 'Meals & Entertainment'],

  // Transportation
  ['uber', 'expense', 'Transportation'],
  ['lyft', 'expense', 'Transportation'],
  ['taxi', 'expense', 'Transportation'],
  ['parking', 'expense', 'Transportation'],
  ['gas station', 'expense', 'Transportation'],
  ['shell', 'expense', 'Transportation'],
  ['esso', 'expense', 'Transportation'],
  ['petro-canada', 'expense', 'Transportation'],
  ['transit', 'expense', 'Transportation'],
  ['subway fare', 'expense', 'Transportation'],

  // Office & Supplies
  ['staples', 'expense', 'Office Supplies'],
  ['amazon', 'expense', 'Office Supplies'],
  ['office depot', 'expense', 'Office Supplies'],
  ['best buy', 'expense', 'Office Supplies'],

  // Software & Subscriptions
  ['adobe', 'expense', 'Software & Subscriptions'],
  ['microsoft', 'expense', 'Software & Subscriptions'],
  ['google workspace', 'expense', 'Software & Subscriptions'],
  ['dropbox', 'expense', 'Software & Subscriptions'],
  ['slack', 'expense', 'Software & Subscriptions'],
  ['zoom', 'expense', 'Software & Subscriptions'],
  ['github', 'expense', 'Software & Subscriptions'],
  ['aws', 'expense', 'Software & Subscriptions'],
  ['digitalocean', 'expense', 'Software & Subscriptions'],
  ['heroku', 'expense', 'Software & Subscriptions'],
  ['netlify', 'expense', 'Software & Subscriptions'],
  ['vercel', 'expense', 'Software & Subscriptions'],

  // Utilities
  ['electricity', 'expense', 'Utilities'],
  ['hydro', 'expense', 'Utilities'],
  ['internet', 'expense', 'Utilities'],
  ['phone', 'expense', 'Utilities'],
  ['rogers', 'expense', 'Utilities'],
  ['bell', 'expense', 'Utilities'],
  ['telus', 'expense', 'Utilities'],
  ['shaw', 'expense', 'Utilities'],

  // Rent & Property
  ['rent', 'expense', 'Rent'],
  ['lease', 'expense', 'Rent'],
  ['property management', 'expense', 'Rent'],

  // Professional Services
  ['legal', 'expense', 'Professional Services'],
  ['lawyer', 'expense', 'Professional Services'],
  ['accounting', 'expense', 'Professional Services'],
  ['consultant', 'expense', 'Professional Services'],
  ['consulting', 'expense', 'Professional Services'],

  // Marketing & Advertising
  ['google ads', 'expense', 'Marketing & Advertising'],
  ['facebook ads', 'expense', 'Marketing & Advertising'],
  ['linkedin ads', 'expense', 'Marketing & Advertising'],
  ['advertising', 'expense', 'Marketing & Advertising'],
  ['marketing', 'expense', 'Marketing & Advertising'],

  // Insurance
  ['insurance', 'expense', 'Insurance'],

  // Bank Fees
  ['bank fee', 'expense', 'Bank Fees'],
  ['service charge', 'expense', 'Bank Fees'],
  ['monthly fee', 'expense', 'Bank Fees'],
  ['overdraft', 'expense', 'Bank Fees'],

  // Income
  ['payment received', 'income', 'Sales Revenue'],
  ['invoice payment', 'income', 'Sales Revenue'],
  ['stripe', 'income', 'Sales Revenue'],
  ['paypal', 'income', 'Sales Revenue'],
  ['square', 'income', 'Sales Revenue'],
  ['deposit', 'income', 'Sales Revenue'],
  ['interest', 'income', 'Interest Income'],
  ['dividend', 'income', 'Investment Income'],

  // Payroll
  ['payroll', 'expense', 'Payroll'],
  ['salary', 'expense', 'Payroll'],
  ['wages', 'expense', 'Payroll'],
  ['employee', 'expense', 'Payroll'],

  // Taxes
  ['cra', 'expense', 'Taxes'],
  ['tax payment', 'expense', 'Taxes'],
  ['gst', 'expense', 'Taxes'],
  ['hst', 'expense', 'Taxes'],
  ['pst', 'expense', 'Taxes'],
  ['income tax', 'expense', 'Taxes'],

  // Transfers (should be excluded from categorization)
  ['transfer', 'transfer', 'Transfer'],
  ['e-transfer', 'transfer', 'Transfer'],
  ['interac', 'transfer', 'Transfer'],
];

/**
 * Maps category names to well-known COA codes from the default template.
 * Used as fallback when Category.defaultGLAccountId is not set.
 * Keys are lowercase for case-insensitive matching.
 */
export const CATEGORY_TO_COA_CODE: Readonly<Record<string, string>> = {
  'meals & entertainment': '5800', // Travel & Meals
  'transportation': '5800',        // Travel & Meals
  'office supplies': '5400',       // Office Supplies
  'software & subscriptions': '5400', // Office Supplies
  'utilities': '5600',             // Rent & Utilities
  'rent': '5600',                  // Rent & Utilities
  'professional services': '5500', // Professional Fees
  'marketing & advertising': '5100', // Advertising & Marketing
  'insurance': '5300',             // Insurance
  'bank fees': '5200',             // Bank Fees & Interest
  'sales revenue': '4000',         // Service Revenue
  'interest income': '4200',       // Interest Income
  'investment income': '4300',     // Other Income
  'other income': '4300',          // Other Income
  'payroll': '5700',               // Salaries & Wages
  'cost of goods sold': '5000',    // COGS
  'depreciation': '5900',          // Depreciation
  'taxes': '2400',                 // Income Tax Payable
};

/** Sign-aware default GL codes when no category mapping exists */
const DEFAULT_GL_CODES = {
  income: '4300',  // Other Income
  expense: '5990', // Other Expenses
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 85) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
}

/**
 * Infer category type from keyword patterns or amount sign.
 * Positive amounts are income, negative are expenses.
 */
function inferCategoryType(categoryName: string | null, amount: number): 'income' | 'expense' {
  if (categoryName) {
    const match = KEYWORD_PATTERNS.find(
      ([, , name]) => name.toLowerCase() === categoryName.toLowerCase()
    );
    if (match) {
      return match[1] === 'income' ? 'income' : 'expense';
    }
  }
  // Fall back to amount sign (positive = income, negative = expense)
  return amount >= 0 ? 'income' : 'expense';
}

// ---------------------------------------------------------------------------
// CategorizationService (class-based)
// ---------------------------------------------------------------------------

export class CategorizationService {
  constructor(
    private tenantId: string,
    private entityId?: string
  ) {}

  /**
   * Categorize a single transaction.
   *
   * Priority: Rules (first-match) → Keywords → AI fallback → No match
   */
  async categorize(description: string, amount: number, transactionId?: string): Promise<CategorySuggestion> {
    // Step 0: Rule evaluation (highest priority — skipped if no entityId)
    if (this.entityId && transactionId) {
      try {
        const ruleService = new RuleService(this.tenantId, 'system');
        const ruleEngine = new RuleEngineService(this.tenantId, ruleService);
        const txnData: TransactionData = { id: transactionId, description, amount, accountId: '' };
        const ruleMatch = await ruleEngine.evaluateRules(txnData, this.entityId);

        if (ruleMatch) {
          return {
            categoryId: ruleMatch.categoryId,
            categoryName: ruleMatch.ruleName,
            confidence: ruleMatch.confidence,
            confidenceTier: toConfidenceTier(ruleMatch.confidence),
            matchReason: `Rule: ${ruleMatch.matchReason}`,
            resolvedGLAccountId: ruleMatch.glAccountId,
            resolvedGLAccountCode: null, // GL code resolved by rule action
            ruleId: ruleMatch.ruleId,
          };
        }
      } catch (error) {
        // Non-critical — fall through to keyword matching
        logger.warn({ err: error }, 'Rule evaluation failed, falling back to keywords');
      }
    }

    const normalizedDesc = description.toLowerCase().trim();

    // Step 1: Keyword matching (fast path)
    let bestMatch: { categoryName: string; confidence: number; keyword: string; type: string } | null = null;

    for (const [keyword, type, categoryName] of KEYWORD_PATTERNS) {
      if (normalizedDesc.includes(keyword)) {
        const confidence = 85;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { categoryName, confidence, keyword, type };
        }
      }
    }

    // Step 2: Look up category in DB
    if (bestMatch) {
      const category = await prisma.category.findFirst({
        where: {
          tenantId: this.tenantId,
          deletedAt: null,
          name: { contains: bestMatch.categoryName, mode: 'insensitive' },
        },
        select: { id: true, name: true, defaultGLAccountId: true },
      });

      const glResult = await this.resolveGL(
        category?.defaultGLAccountId ?? null,
        bestMatch.categoryName,
        bestMatch.type === 'income' ? 'income' : 'expense'
      );

      if (category) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          confidence: bestMatch.confidence,
          confidenceTier: toConfidenceTier(bestMatch.confidence),
          matchReason: `Keyword match: "${bestMatch.keyword}"`,
          resolvedGLAccountId: glResult.id,
          resolvedGLAccountCode: glResult.code,
        };
      } else {
        return {
          categoryId: null,
          categoryName: bestMatch.categoryName,
          confidence: bestMatch.confidence,
          confidenceTier: toConfidenceTier(bestMatch.confidence),
          matchReason: `Suggested: "${bestMatch.keyword}" (category not found in your account)`,
          resolvedGLAccountId: glResult.id,
          resolvedGLAccountCode: glResult.code,
        };
      }
    }

    // Step 3: AI fallback
    if (aiService.isProviderAvailable('perplexity') || aiService.isProviderAvailable('claude')) {
      try {
        const providerName = aiService.isProviderAvailable('claude') ? 'claude' : 'perplexity';
        const response = await aiService.chat(
          [
            {
              role: 'user',
              content: `Categorize this transaction. Description: "${description}", Amount: ${amount}. Available categories: ${KEYWORD_PATTERNS.map((p) => p[2]).join(', ')}. Return only the category name.`,
            },
          ],
          {
            systemPrompt:
              'You are a financial AI assistant. Your task is to categorize transactions based on their description. Reply with only the category name from the provided list, or "Other" if none match.',
            temperature: 0,
            provider: providerName,
          }
        );

        const suggestedName = response.content.trim();
        const category = await prisma.category.findFirst({
          where: {
            tenantId: this.tenantId,
            deletedAt: null,
            name: { contains: suggestedName, mode: 'insensitive' },
          },
          select: { id: true, name: true, defaultGLAccountId: true },
        });

        const catType = inferCategoryType(suggestedName, amount);
        const glResult = await this.resolveGL(
          category?.defaultGLAccountId ?? null,
          suggestedName !== 'Other' ? suggestedName : null,
          catType
        );

        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            confidence: 75,
            confidenceTier: 'medium',
            matchReason: `AI suggested: "${suggestedName}" (${providerName})`,
            resolvedGLAccountId: glResult.id,
            resolvedGLAccountCode: glResult.code,
          };
        } else {
          return {
            categoryId: null,
            categoryName: suggestedName !== 'Other' ? suggestedName : null,
            confidence: 60,
            confidenceTier: 'medium',
            matchReason: `AI suggested: "${suggestedName}" (category not found in your account)`,
            resolvedGLAccountId: glResult.id,
            resolvedGLAccountCode: glResult.code,
          };
        }
      } catch (error) {
        logger.error({ err: error }, 'AI Categorization failed');
      }
    }

    // No match
    const catType = inferCategoryType(null, amount);
    const glResult = await this.resolveGL(null, null, catType);

    return {
      categoryId: null,
      categoryName: null,
      confidence: 0,
      confidenceTier: 'low',
      matchReason: 'No match found',
      resolvedGLAccountId: glResult.id,
      resolvedGLAccountCode: glResult.code,
    };
  }

  /**
   * Batch categorize multiple transactions efficiently.
   * Fetches categories once to avoid N+1.
   *
   * Priority: Rules (batch) → Keywords → No match (AI fallback not used in batch)
   */
  async categorizeBatch(
    transactions: ReadonlyArray<{ id?: string; description: string; amount: number }>
  ): Promise<CategorySuggestion[]> {
    // Step 0: Rule evaluation (batch) — single DB query for all rules
    let ruleMatches = new Map<string, { ruleId: string; categoryId: string | null; glAccountId: string | null; confidence: number; matchReason: string; ruleName: string }>();
    if (this.entityId) {
      try {
        const ruleService = new RuleService(this.tenantId, 'system');
        const ruleEngine = new RuleEngineService(this.tenantId, ruleService);
        const txnDataList: TransactionData[] = transactions
          .filter((t): t is typeof t & { id: string } => !!t.id)
          .map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            accountId: '',
          }));

        if (txnDataList.length > 0) {
          const matches = await ruleEngine.evaluateRulesBatch(txnDataList, this.entityId);
          ruleMatches = new Map(
            Array.from(matches.entries()).map(([id, m]) => [id, {
              ruleId: m.ruleId,
              categoryId: m.categoryId,
              glAccountId: m.glAccountId,
              confidence: m.confidence,
              matchReason: m.matchReason,
              ruleName: m.ruleName,
            }])
          );
        }
      } catch (error) {
        // Non-critical — fall through to keyword matching for all
        logger.warn({ err: error }, 'Batch rule evaluation failed, falling back to keywords');
      }
    }

    // Pre-fetch all active categories for this tenant
    const categories = await prisma.category.findMany({
      where: { tenantId: this.tenantId, deletedAt: null },
      select: { id: true, name: true, defaultGLAccountId: true },
    });

    const categoryMap = new Map<string, { id: string; name: string; defaultGLAccountId: string | null }>();
    for (const cat of categories) {
      categoryMap.set(cat.name.toLowerCase(), cat);
    }

    // Pre-fetch GL accounts for this entity (if entityId provided)
    const glAccountMap = new Map<string, { id: string; code: string }>();
    if (this.entityId) {
      const glAccounts = await prisma.gLAccount.findMany({
        where: { entityId: this.entityId, isActive: true },
        select: { id: true, code: true },
      });
      for (const gl of glAccounts) {
        glAccountMap.set(gl.code, gl);
      }
    }

    const suggestions: CategorySuggestion[] = [];

    for (const transaction of transactions) {
      // Check if already matched by a rule
      if (transaction.id && ruleMatches.has(transaction.id)) {
        const match = ruleMatches.get(transaction.id)!;
        suggestions.push({
          categoryId: match.categoryId,
          categoryName: match.ruleName,
          confidence: match.confidence,
          confidenceTier: toConfidenceTier(match.confidence),
          matchReason: `Rule: ${match.matchReason}`,
          resolvedGLAccountId: match.glAccountId,
          resolvedGLAccountCode: null,
          ruleId: match.ruleId,
        });
        continue; // Skip keyword matching
      }

      const normalizedDesc = transaction.description.toLowerCase().trim();
      let bestMatch: { categoryName: string; confidence: number; keyword: string; type: string } | null = null;

      for (const [keyword, type, categoryName] of KEYWORD_PATTERNS) {
        if (normalizedDesc.includes(keyword)) {
          const confidence = 85;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { categoryName, confidence, keyword, type };
          }
        }
      }

      if (bestMatch) {
        // Try exact match first, then partial
        let matchedCategory = categoryMap.get(bestMatch.categoryName.toLowerCase());
        if (!matchedCategory) {
          for (const [name, category] of categoryMap.entries()) {
            if (
              name.includes(bestMatch.categoryName.toLowerCase()) ||
              bestMatch.categoryName.toLowerCase().includes(name)
            ) {
              matchedCategory = category;
              break;
            }
          }
        }

        const glResult = this.resolveGLFromMaps(
          matchedCategory?.defaultGLAccountId ?? null,
          bestMatch.categoryName,
          bestMatch.type === 'income' ? 'income' : 'expense',
          glAccountMap
        );

        if (matchedCategory) {
          suggestions.push({
            categoryId: matchedCategory.id,
            categoryName: matchedCategory.name,
            confidence: bestMatch.confidence,
            confidenceTier: toConfidenceTier(bestMatch.confidence),
            matchReason: `Keyword match: "${bestMatch.keyword}"`,
            resolvedGLAccountId: glResult.id,
            resolvedGLAccountCode: glResult.code,
          });
        } else {
          suggestions.push({
            categoryId: null,
            categoryName: bestMatch.categoryName,
            confidence: bestMatch.confidence,
            confidenceTier: toConfidenceTier(bestMatch.confidence),
            matchReason: `Suggested: "${bestMatch.keyword}" (category not found)`,
            resolvedGLAccountId: glResult.id,
            resolvedGLAccountCode: glResult.code,
          });
        }
      } else {
        const catType = inferCategoryType(null, transaction.amount);
        const glResult = this.resolveGLFromMaps(null, null, catType, glAccountMap);

        suggestions.push({
          categoryId: null,
          categoryName: null,
          confidence: 0,
          confidenceTier: 'low',
          matchReason: 'No match found',
          resolvedGLAccountId: glResult.id,
          resolvedGLAccountCode: glResult.code,
        });
      }
    }

    return suggestions;
  }

  /**
   * Resolve GL account for a category using the 3-step fallback chain.
   *
   * 1. Category.defaultGLAccountId (if set)
   * 2. Name-based COA code match (CATEGORY_TO_COA_CODE)
   * 3. Sign-aware fallback: income → 4300, expense → 5990
   *
   * Returns null if no entityId was provided.
   */
  private async resolveGL(
    defaultGLAccountId: string | null,
    categoryName: string | null,
    categoryType: 'income' | 'expense'
  ): Promise<{ id: string | null; code: string | null }> {
    if (!this.entityId) {
      return { id: null, code: null };
    }

    // Step 1: Use Category.defaultGLAccountId if set
    if (defaultGLAccountId) {
      const gl = await prisma.gLAccount.findFirst({
        where: { id: defaultGLAccountId, entityId: this.entityId, isActive: true },
        select: { id: true, code: true },
      });
      if (gl) return gl;
    }

    // Step 2: Name-based COA code match
    if (categoryName) {
      const coaCode = CATEGORY_TO_COA_CODE[categoryName.toLowerCase()];
      if (coaCode) {
        const gl = await prisma.gLAccount.findFirst({
          where: { entityId: this.entityId, code: coaCode, isActive: true },
          select: { id: true, code: true },
        });
        if (gl) return gl;
      }
    }

    // Step 3: Sign-aware fallback
    const fallbackCode = DEFAULT_GL_CODES[categoryType];
    const gl = await prisma.gLAccount.findFirst({
      where: { entityId: this.entityId, code: fallbackCode, isActive: true },
      select: { id: true, code: true },
    });
    if (gl) return gl;

    // No GL account found at all (COA not seeded)
    logger.warn(
      { entityId: this.entityId, categoryName, categoryType },
      'GL resolution failed — no GL account found, COA may not be seeded'
    );
    return { id: null, code: null };
  }

  /**
   * In-memory GL resolution using pre-fetched maps (for batch operations).
   * Same 3-step fallback chain as resolveGL but uses cached data.
   */
  private resolveGLFromMaps(
    defaultGLAccountId: string | null,
    categoryName: string | null,
    categoryType: 'income' | 'expense',
    glAccountMap: Map<string, { id: string; code: string }>
  ): { id: string | null; code: string | null } {
    if (!this.entityId || glAccountMap.size === 0) {
      return { id: null, code: null };
    }

    // Step 1: defaultGLAccountId — need to find by ID, not code
    // For batch, defaultGLAccountId is already an ID, find the code from the map
    if (defaultGLAccountId) {
      for (const gl of glAccountMap.values()) {
        if (gl.id === defaultGLAccountId) return gl;
      }
    }

    // Step 2: Name-based COA code match
    if (categoryName) {
      const coaCode = CATEGORY_TO_COA_CODE[categoryName.toLowerCase()];
      if (coaCode) {
        const gl = glAccountMap.get(coaCode);
        if (gl) return gl;
      }
    }

    // Step 3: Sign-aware fallback
    const fallbackCode = DEFAULT_GL_CODES[categoryType];
    const gl = glAccountMap.get(fallbackCode);
    if (gl) return gl;

    return { id: null, code: null };
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible function exports
// ---------------------------------------------------------------------------

/**
 * Categorize a transaction based on its description and amount.
 * @deprecated Use `new CategorizationService(tenantId, entityId).categorize()` for GL resolution.
 */
export async function categorizeTransaction(
  description: string,
  amount: number,
  tenantId: string
): Promise<CategorySuggestion> {
  const service = new CategorizationService(tenantId);
  return service.categorize(description, amount);
}

/**
 * Batch categorize multiple transactions.
 * @deprecated Use `new CategorizationService(tenantId, entityId).categorizeBatch()` for GL resolution.
 */
export async function categorizeTransactions(
  transactions: Array<{ description: string; amount: number }>,
  tenantId: string
): Promise<CategorySuggestion[]> {
  const service = new CategorizationService(tenantId);
  return service.categorizeBatch(transactions);
}

/**
 * Learn from user's category corrections to improve future suggestions.
 */
export async function learnFromCorrection(
  description: string,
  categoryId: string,
  tenantId: string
): Promise<void> {
  logger.info({ description, categoryId, tenantId }, 'Learning correction logged');
}
