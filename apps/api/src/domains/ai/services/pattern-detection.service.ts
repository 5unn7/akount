import { prisma, Prisma, RuleSuggestionStatus } from '@akount/db';
import { logger } from '../../../lib/logger';
import type { RuleConditions, RuleAction } from './rule.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedPattern {
  keyword: string;
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  patternStrength: number; // 0.0-1.0
  exampleTransactions: Array<{ id: string; description: string; amount: number }>;
  suggestedConditions: RuleConditions;
  suggestedAction: RuleAction;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum number of transactions with the same keyword+category to qualify as a pattern */
const PATTERN_THRESHOLD = 3;

/** Minimum pattern strength (ratio) to qualify as a pattern */
const STRENGTH_THRESHOLD = 0.7;

/** Number of days to look back for transaction patterns */
const LOOKBACK_DAYS = 90;

/** Maximum number of example transactions to include per pattern */
const MAX_EXAMPLES = 5;

/**
 * English stop words + common financial noise words.
 * These are excluded during tokenization to avoid false pattern matches.
 */
const STOP_WORDS = new Set([
  // English stop words
  'the', 'is', 'at', 'on', 'in', 'to', 'for', 'of', 'and', 'a', 'an',
  'it', 'its', 'this', 'that', 'was', 'are', 'be', 'been', 'has', 'have',
  'had', 'but', 'not', 'you', 'all', 'can', 'her', 'his', 'him', 'how',
  'may', 'no', 'nor', 'our', 'out', 'own', 'she', 'who', 'why', 'with',
  'from', 'they', 'them', 'then', 'than', 'into', 'each', 'which', 'their',
  'will', 'would', 'there', 'what', 'about', 'when', 'make', 'like',
  'just', 'over', 'such', 'some', 'also', 'after', 'before',

  // Common financial noise words
  'payment', 'transaction', 'pos', 'debit', 'credit', 'card', 'visa',
  'mastercard', 'purchase', 'online', 'mobile', 'check', 'cheque',
  'wire', 'transfer', 'direct', 'deposit', 'withdrawal', 'fee',
  'ref', 'reference', 'number', 'num', 'date', 'memo', 'desc',
  'pending', 'posted', 'cleared', 'hold', 'auth', 'authorization',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tokenize a transaction description into meaningful keywords.
 *
 * Steps:
 * 1. Lowercase
 * 2. Split by whitespace and punctuation
 * 3. Filter out stop words
 * 4. Filter out tokens <= 3 characters
 * 5. Deduplicate
 */
export function tokenizeDescription(description: string): string[] {
  const normalized = description.toLowerCase();
  const rawTokens = normalized.split(/[\s\-_.,;:!?#@()\[\]{}/\\|+*&^%$'"]+/);

  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const token of rawTokens) {
    const trimmed = token.trim();
    if (trimmed.length <= 3) continue;
    if (STOP_WORDS.has(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    tokens.push(trimmed);
  }

  return tokens;
}

/**
 * Build a date threshold for the lookback window.
 */
function getLookbackDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - LOOKBACK_DAYS);
  return date;
}

// ---------------------------------------------------------------------------
// PatternDetectionService
// ---------------------------------------------------------------------------

/**
 * PatternDetectionService
 *
 * Scans categorized transactions to detect recurring keyword->category patterns.
 * When a user manually corrects a transaction's category, this service checks
 * whether a pattern has emerged (3+ similar corrections = suggest a rule).
 *
 * Key features:
 * - Tenant-isolated via entity membership
 * - Tokenization with stop word filtering
 * - Pattern strength calculation (ratio-based)
 * - Deduplication against active rules and pending suggestions
 * - Sorted results by transaction count
 */
export class PatternDetectionService {
  constructor(
    private readonly tenantId: string,
    private readonly userId: string
  ) {}

  /**
   * Full pattern scan: detect all keyword->category patterns for an entity.
   *
   * 1. Load last 90 days of categorized transactions
   * 2. Tokenize descriptions
   * 3. Group by keyword->categoryId combinations
   * 4. Filter by threshold and strength
   * 5. Dedup against active rules and pending suggestions
   * 6. Return sorted by transactionCount desc
   */
  async detectPatterns(entityId: string): Promise<DetectedPattern[]> {
    const lookbackDate = getLookbackDate();

    // Step 1: Load categorized transactions (last 90 days, non-deleted)
    const transactions = await prisma.transaction.findMany({
      where: {
        account: { entityId, entity: { tenantId: this.tenantId } },
        categoryId: { not: null },
        date: { gte: lookbackDate },
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        categoryId: true,
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (transactions.length === 0) {
      return [];
    }

    // Step 2 & 3: Tokenize and group by keyword -> categoryId
    const keywordCategoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        transactions: Array<{ id: string; description: string; amount: number }>;
      }
    >();

    // Track total occurrences of each keyword (across all categories)
    const keywordTotalCount = new Map<string, number>();

    for (const txn of transactions) {
      if (!txn.categoryId || !txn.category) continue;

      const tokens = tokenizeDescription(txn.description);

      for (const token of tokens) {
        // Increment total keyword count
        keywordTotalCount.set(token, (keywordTotalCount.get(token) ?? 0) + 1);

        // Group by keyword+categoryId
        const key = `${token}::${txn.categoryId}`;
        let group = keywordCategoryMap.get(key);
        if (!group) {
          group = {
            categoryId: txn.categoryId,
            categoryName: txn.category.name,
            transactions: [],
          };
          keywordCategoryMap.set(key, group);
        }
        group.transactions.push({
          id: txn.id,
          description: txn.description,
          amount: txn.amount,
        });
      }
    }

    // Step 4: Filter by threshold and strength
    const candidates: Array<{
      keyword: string;
      categoryId: string;
      categoryName: string;
      transactionCount: number;
      patternStrength: number;
      transactions: Array<{ id: string; description: string; amount: number }>;
    }> = [];

    for (const [key, group] of keywordCategoryMap.entries()) {
      const keyword = key.split('::')[0];
      const count = group.transactions.length;

      if (count < PATTERN_THRESHOLD) continue;

      const totalWithKeyword = keywordTotalCount.get(keyword) ?? count;
      const strength = count / totalWithKeyword;

      if (strength < STRENGTH_THRESHOLD) continue;

      candidates.push({
        keyword,
        categoryId: group.categoryId,
        categoryName: group.categoryName,
        transactionCount: count,
        patternStrength: strength,
        transactions: group.transactions,
      });
    }

    if (candidates.length === 0) {
      return [];
    }

    // Step 5: Dedup against active rules
    const activeRules = await prisma.rule.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        isActive: true,
      },
      select: {
        conditions: true,
        action: true,
      },
    });

    // Build a set of "keyword::categoryId" pairs already covered by rules
    const coveredByRules = new Set<string>();
    for (const rule of activeRules) {
      const conditions = rule.conditions as unknown as RuleConditions | null;
      const action = rule.action as unknown as RuleAction | null;

      if (!conditions || !action?.setCategoryId) continue;

      for (const cond of conditions.conditions) {
        if (cond.field === 'description' && cond.op === 'contains' && typeof cond.value === 'string') {
          coveredByRules.add(`${cond.value.toLowerCase()}::${action.setCategoryId}`);
        }
      }
    }

    // Step 5b: Dedup against pending suggestions
    // RuleSuggestion has entityId but no entity relation, so we verify entity ownership
    const entityIds = await prisma.entity.findMany({
      where: { id: entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    const verifiedEntityId = entityIds[0]?.id;
    const pendingSuggestions = verifiedEntityId
      ? await prisma.ruleSuggestion.findMany({
          where: {
            entityId: verifiedEntityId,
            status: RuleSuggestionStatus.PENDING,
          },
          select: {
            suggestedRule: true,
          },
        })
      : [];

    const coveredBySuggestions = new Set<string>();
    for (const suggestion of pendingSuggestions) {
      const suggestedRule = suggestion.suggestedRule as Record<string, unknown> | null;
      if (!suggestedRule) continue;

      const conditions = suggestedRule.conditions as RuleConditions | undefined;
      const action = suggestedRule.action as RuleAction | undefined;

      if (!conditions || !action?.setCategoryId) continue;

      for (const cond of conditions.conditions) {
        if (cond.field === 'description' && cond.op === 'contains' && typeof cond.value === 'string') {
          coveredBySuggestions.add(`${cond.value.toLowerCase()}::${action.setCategoryId}`);
        }
      }
    }

    // Filter out covered patterns
    const filteredCandidates = candidates.filter((c) => {
      const key = `${c.keyword}::${c.categoryId}`;
      return !coveredByRules.has(key) && !coveredBySuggestions.has(key);
    });

    // Step 6: Sort by transactionCount desc and build results
    filteredCandidates.sort((a, b) => b.transactionCount - a.transactionCount);

    const patterns: DetectedPattern[] = filteredCandidates.map((c) => ({
      keyword: c.keyword,
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      transactionCount: c.transactionCount,
      patternStrength: c.patternStrength,
      exampleTransactions: c.transactions.slice(0, MAX_EXAMPLES),
      suggestedConditions: {
        operator: 'AND',
        conditions: [
          { field: 'description', op: 'contains', value: c.keyword },
        ],
      },
      suggestedAction: {
        setCategoryId: c.categoryId,
      },
    }));

    logger.info(
      { entityId, patternCount: patterns.length, totalTransactions: transactions.length },
      'Pattern detection scan complete'
    );

    return patterns;
  }

  /**
   * Analyze a single category correction to detect emerging patterns.
   *
   * Called when a user manually corrects a transaction's category.
   * Checks if any keyword from the corrected transaction's description
   * has reached the pattern threshold with the new category.
   *
   * Returns the strongest pattern if one meets the threshold, or null.
   */
  async analyzeCorrection(
    transactionId: string,
    newCategoryId: string,
    entityId: string
  ): Promise<DetectedPattern | null> {
    // Step 1: Load the corrected transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { entityId, entity: { tenantId: this.tenantId } },
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        amount: true,
      },
    });

    if (!transaction) {
      logger.warn(
        { transactionId, entityId, tenantId: this.tenantId },
        'Transaction not found for correction analysis'
      );
      return null;
    }

    // Step 2: Tokenize the description
    const tokens = tokenizeDescription(transaction.description);
    if (tokens.length === 0) {
      return null;
    }

    // Step 3: For each token, count transactions with same keyword + same categoryId
    const lookbackDate = getLookbackDate();
    const category = await prisma.category.findFirst({
      where: { id: newCategoryId, tenantId: this.tenantId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!category) {
      return null;
    }

    let bestPattern: {
      keyword: string;
      count: number;
      totalWithKeyword: number;
      examples: Array<{ id: string; description: string; amount: number }>;
    } | null = null;

    for (const token of tokens) {
      // Count transactions with this keyword AND the same categoryId
      const matchingTransactions = await prisma.transaction.findMany({
        where: {
          account: { entityId, entity: { tenantId: this.tenantId } },
          categoryId: newCategoryId,
          description: { contains: token, mode: 'insensitive' as Prisma.QueryMode },
          date: { gte: lookbackDate },
          deletedAt: null,
        },
        select: {
          id: true,
          description: true,
          amount: true,
        },
        take: MAX_EXAMPLES + 1, // +1 to check if we have more than MAX_EXAMPLES
      });

      // Count total transactions with this keyword (any category)
      const totalWithKeyword = await prisma.transaction.count({
        where: {
          account: { entityId, entity: { tenantId: this.tenantId } },
          description: { contains: token, mode: 'insensitive' as Prisma.QueryMode },
          date: { gte: lookbackDate },
          deletedAt: null,
        },
      });

      const count = matchingTransactions.length;

      if (count >= PATTERN_THRESHOLD) {
        const strength = totalWithKeyword > 0 ? count / totalWithKeyword : 0;

        if (strength >= STRENGTH_THRESHOLD) {
          if (!bestPattern || count > bestPattern.count) {
            bestPattern = {
              keyword: token,
              count,
              totalWithKeyword,
              examples: matchingTransactions.slice(0, MAX_EXAMPLES),
            };
          }
        }
      }
    }

    if (!bestPattern) {
      return null;
    }

    // Step 4: Check if pattern is already covered by active rule
    const existingRule = await prisma.rule.findFirst({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        isActive: true,
        conditions: {
          path: ['conditions'],
          array_contains: [{ field: 'description', op: 'contains', value: bestPattern.keyword }],
        },
        action: {
          path: ['setCategoryId'],
          equals: newCategoryId,
        },
      },
    });

    if (existingRule) {
      return null;
    }

    // Step 5: Check if pattern has a pending suggestion
    // Verify entity ownership for tenant isolation
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    if (entity) {
      const pendingSuggestion = await prisma.ruleSuggestion.findFirst({
        where: {
          entityId: entity.id,
          status: RuleSuggestionStatus.PENDING,
        },
      });

      if (pendingSuggestion) {
        const suggestedRule = pendingSuggestion.suggestedRule as Record<string, unknown> | null;
        if (suggestedRule) {
          const conditions = suggestedRule.conditions as RuleConditions | undefined;
          const action = suggestedRule.action as RuleAction | undefined;

          if (conditions && action?.setCategoryId === newCategoryId) {
            const hasKeywordCondition = conditions.conditions.some(
              (c) =>
                c.field === 'description' &&
                c.op === 'contains' &&
                typeof c.value === 'string' &&
                c.value.toLowerCase() === bestPattern!.keyword
            );
            if (hasKeywordCondition) {
              return null;
            }
          }
        }
      }
    }

    const strength = bestPattern.totalWithKeyword > 0
      ? bestPattern.count / bestPattern.totalWithKeyword
      : 0;

    logger.info(
      {
        transactionId,
        keyword: bestPattern.keyword,
        categoryId: newCategoryId,
        count: bestPattern.count,
        strength,
      },
      'Pattern detected from correction'
    );

    return {
      keyword: bestPattern.keyword,
      categoryId: newCategoryId,
      categoryName: category.name,
      transactionCount: bestPattern.count,
      patternStrength: strength,
      exampleTransactions: bestPattern.examples,
      suggestedConditions: {
        operator: 'AND',
        conditions: [
          { field: 'description', op: 'contains', value: bestPattern.keyword },
        ],
      },
      suggestedAction: {
        setCategoryId: newCategoryId,
      },
    };
  }
}
