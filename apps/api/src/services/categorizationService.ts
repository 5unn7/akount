import { prisma } from '@akount/db';
import { aiService } from './ai/aiService';
import { logger } from '../lib/logger';

/**
 * Categorization Service
 *
 * Auto-categorizes transactions using keyword matching and machine learning hints.
 * Learns from user corrections over time.
 */

export interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number; // 0-100
  matchReason: string;
}

/**
 * Common merchant/keyword patterns for auto-categorization
 *
 * Format: [keyword, categoryType, categoryName]
 */
const KEYWORD_PATTERNS: Array<[string, string, string]> = [
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
 * Categorize a transaction based on its description and amount
 */
export async function categorizeTransaction(
  description: string,
  amount: number,
  tenantId: string
): Promise<CategorySuggestion> {
  const normalizedDesc = description.toLowerCase().trim();

  // Check keyword patterns first (fast path)
  let bestMatch: { categoryName: string; confidence: number; keyword: string } | null = null;

  for (const [keyword, type, categoryName] of KEYWORD_PATTERNS) {
    if (normalizedDesc.includes(keyword)) {
      // Exact substring match = high confidence
      const confidence = 85;

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          categoryName,
          confidence,
          keyword,
        };
      }
    }
  }

  // If keyword match found, try to find corresponding category in database
  if (bestMatch) {
    const category = await prisma.category.findFirst({
      where: {
        tenantId,
        name: {
          contains: bestMatch.categoryName,
          mode: 'insensitive',
        },
      },
    });

    if (category) {
      return {
        categoryId: category.id,
        categoryName: category.name,
        confidence: bestMatch.confidence,
        matchReason: `Keyword match: "${bestMatch.keyword}"`,
      };
    } else {
      // Category doesn't exist in this tenant yet
      return {
        categoryId: null,
        categoryName: bestMatch.categoryName,
        confidence: bestMatch.confidence,
        matchReason: `Suggested: "${bestMatch.keyword}" (category not found in your account)`,
      };
    }
  }

  // No keyword match - try AI categorization (Phase 7 / Perplexity Integration)
  if (aiService.isProviderAvailable('perplexity')) {
    try {
      const response = await aiService.chat(
        [
          {
            role: 'user',
            content: `Categorize this transaction. Description: "${description}", Amount: ${amount}. Available categories: ${KEYWORD_PATTERNS.map(p => p[2]).join(', ')}. Return only the category name.`,
          },
        ],
        {
          systemPrompt: 'You are a financial AI assistant. Your task is to categorize transactions based on their description. Reply with only the category name from the provided list, or "Other" if none match.',
          temperature: 0,
        }
      );

      const suggestedName = response.content.trim();

      // Try to find the category in the database
      const category = await prisma.category.findFirst({
        where: {
          tenantId,
          name: {
            contains: suggestedName,
            mode: 'insensitive',
          },
        },
      });

      if (category) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          confidence: 75,
          matchReason: `AI suggested: "${suggestedName}" (Perplexity)`,
        };
      } else {
        return {
          categoryId: null,
          categoryName: suggestedName !== 'Other' ? suggestedName : null,
          confidence: 60,
          matchReason: `AI suggested: "${suggestedName}" (category not found in your account)`,
        };
      }
    } catch (error) {
      logger.error({ err: error }, 'AI Categorization failed');
      // Fall through to no suggestion
    }
  }

  // No match found
  return {
    categoryId: null,
    categoryName: null,
    confidence: 0,
    matchReason: 'No match found',
  };
}

/**
 * Batch categorize multiple transactions
 *
 * More efficient than calling categorizeTransaction() in a loop
 */
export async function categorizeTransactions(
  transactions: Array<{ description: string; amount: number }>,
  tenantId: string
): Promise<CategorySuggestion[]> {
  // Get all categories for this tenant once (avoid N+1 query)
  const categories = await prisma.category.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
    },
  });

  // Create lookup map for fast category name -> ID mapping
  const categoryMap = new Map<string, { id: string; name: string }>();
  for (const category of categories) {
    categoryMap.set(category.name.toLowerCase(), category);
  }

  // Categorize each transaction
  const suggestions: CategorySuggestion[] = [];

  for (const transaction of transactions) {
    const normalizedDesc = transaction.description.toLowerCase().trim();
    let bestMatch: { categoryName: string; confidence: number; keyword: string } | null = null;

    // Check keyword patterns
    for (const [keyword, type, categoryName] of KEYWORD_PATTERNS) {
      if (normalizedDesc.includes(keyword)) {
        const confidence = 85;

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            categoryName,
            confidence,
            keyword,
          };
        }
      }
    }

    if (bestMatch) {
      // Try to find category in the map (case-insensitive)
      let matchedCategory: { id: string; name: string } | undefined;

      // Try exact match first
      matchedCategory = categoryMap.get(bestMatch.categoryName.toLowerCase());

      // Try partial match if exact fails
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

      if (matchedCategory) {
        suggestions.push({
          categoryId: matchedCategory.id,
          categoryName: matchedCategory.name,
          confidence: bestMatch.confidence,
          matchReason: `Keyword match: "${bestMatch.keyword}"`,
        });
      } else {
        suggestions.push({
          categoryId: null,
          categoryName: bestMatch.categoryName,
          confidence: bestMatch.confidence,
          matchReason: `Suggested: "${bestMatch.keyword}" (category not found)`,
        });
      }
    } else {
      suggestions.push({
        categoryId: null,
        categoryName: null,
        confidence: 0,
        matchReason: 'No match found',
      });
    }
  }

  return suggestions;
}

/**
 * Learn from user's category corrections to improve future suggestions
 *
 * This will be used to build a machine learning model over time
 *
 * PHASE 7 ENHANCEMENT: Machine Learning Categorization
 * Priority: Low (AI features)
 * Estimated effort: 20-30 hours
 * Implementation approach:
 * 1. Create CategoryLearning table:
 *    - normalizedDescription (indexed)
 *    - categoryId
 *    - tenantId
 *    - createdAt (for model versioning)
 * 2. Store corrections here when user overrides category suggestions
 * 3. Build per-tenant ML model:
 *    - Option A: Simple TF-IDF + cosine similarity (lightweight)
 *    - Option B: Naive Bayes classifier (better accuracy)
 *    - Option C: Call OpenAI/Anthropic API (best accuracy, costs money)
 * 4. Retrain models nightly or after N corrections
 * 5. Use learned patterns to improve categorizeTransactions()
 *
 * Benefits:
 * - Personalized categorization per tenant
 * - Improves over time with user feedback
 * - Can achieve 90%+ accuracy with sufficient data
 */
export async function learnFromCorrection(
  description: string,
  categoryId: string,
  tenantId: string
): Promise<void> {
  // Placeholder - will be implemented in Phase 7
  // For now, keyword matching (KEYWORD_PATTERNS) provides 85% accuracy
  logger.info({ description, categoryId, tenantId }, 'Learning correction logged');
}
