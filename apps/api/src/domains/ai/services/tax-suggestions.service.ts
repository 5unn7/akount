import { prisma, CategoryType } from '@akount/db';
import { MistralProvider } from './providers/mistral.provider';
import { AIDecisionLogService } from './ai-decision-log.service';
import { logger } from '../../../lib/logger';

/**
 * Tax Optimization Suggestions Service
 *
 * Analyzes categorized expenses to suggest jurisdiction-specific tax optimizations.
 *
 * **Deduction Categories:**
 * 1. Home Office - Rent portion, utilities, internet
 * 2. Vehicle - Business mileage, auto expenses
 * 3. Equipment Depreciation - Computers, furniture, tools
 * 4. Professional Development - Courses, books, conferences
 * 5. Meals & Entertainment - Business meals (50% deductible in most jurisdictions)
 *
 * **Jurisdictions Supported:**
 * - US (IRS): Home office strict rules, $0.67/mi mileage, Section 179 depreciation
 * - Canada (CRA): Home office workspace %, different depreciation classes
 * - EU: VAT deductibility, country-specific rules
 *
 * **Disclaimers:**
 * - NOT tax advice. Consult accountant before claiming deductions.
 * - Tax laws vary by jurisdiction and individual situation.
 *
 * @module tax-suggestions.service
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaxSuggestion {
  category: string;
  potentialDeduction: number; // Integer cents
  confidence: number; // 0-100
  explanation: string;
  jurisdiction: string;
  disclaimer: string;
  transactionCount?: number;
  evidenceRequired?: string[];
}

export interface TaxSuggestionsResult {
  suggestions: TaxSuggestion[];
  quarterlyEstimate: number; // Integer cents
  jurisdiction: string;
  entityName: string;
  year: number;
  disclaimer: string;
}

interface ExpensePattern {
  category: string;
  totalAmount: number; // Integer cents
  transactionCount: number;
  categoryType: string;
  examples: Array<{ description: string; amount: number }>;
}

// ---------------------------------------------------------------------------
// Jurisdiction-Specific Rules
// ---------------------------------------------------------------------------

const JURISDICTIONS = {
  US: {
    name: 'United States (IRS)',
    homeOfficeRate: 0.14, // Estimate 14% of home expenses
    mileageRatePerKm: 108, // $0.67/mi = $0.42/km = 42 cents/km (in integer cents: 42 * 100 / 100 = 42, but stored as 108 for $1.08 CAD per mile)
    mealsDeductionRate: 0.5, // 50% deductible
    disclaimers: [
      'Home office must be used exclusively and regularly for business',
      'Standard mileage rate is $0.67/mile for 2024',
      'Meals are 50% deductible',
      'Section 179 allows immediate expensing of equipment up to $1,220,000',
    ],
  },
  CA: {
    name: 'Canada (CRA)',
    homeOfficeRate: 0.1, // Conservative 10% workspace estimate
    mileageRatePerKm: 68, // $0.68 CAD/km (in integer cents)
    mealsDeductionRate: 0.5, // 50% deductible
    disclaimers: [
      'Home office workspace must be principal place of business OR used exclusively for business and regular client meetings',
      'Mileage rate is $0.68/km for first 5,000 km (2024)',
      'Meals are 50% deductible',
      'Capital Cost Allowance (CCA) for equipment varies by class',
    ],
  },
  EU: {
    name: 'European Union',
    homeOfficeRate: 0.12,
    mileageRatePerKm: 50, // Varies by country, ~€0.30-0.40/km
    mealsDeductionRate: 0.5,
    disclaimers: [
      'VAT deductibility varies by country and business type',
      'Home office rules differ by EU member state',
      'Business meal deductibility varies by jurisdiction',
      'Consult local tax advisor for country-specific rules',
    ],
  },
} as const;

type JurisdictionCode = keyof typeof JURISDICTIONS;

// ---------------------------------------------------------------------------
// Category Mappings for Deduction Analysis
// ---------------------------------------------------------------------------

const HOME_OFFICE_KEYWORDS = [
  'rent',
  'mortgage',
  'utilities',
  'electricity',
  'hydro',
  'internet',
  'phone',
  'home insurance',
  'property tax',
];

const VEHICLE_KEYWORDS = [
  'gas',
  'fuel',
  'auto',
  'vehicle',
  'car',
  'insurance',
  'maintenance',
  'parking',
  'uber',
  'lyft',
  'taxi',
];

const EQUIPMENT_KEYWORDS = [
  'computer',
  'laptop',
  'monitor',
  'desk',
  'chair',
  'furniture',
  'software',
  'hardware',
  'equipment',
];

const PROFESSIONAL_DEV_KEYWORDS = [
  'course',
  'training',
  'conference',
  'book',
  'subscription',
  'seminar',
  'workshop',
  'certification',
];

const MEALS_KEYWORDS = [
  'restaurant',
  'meal',
  'lunch',
  'dinner',
  'coffee',
  'cafe',
  'starbucks',
  'tim hortons',
  'catering',
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class TaxSuggestionsService {
  private mistralProvider: MistralProvider;
  private decisionLogService: AIDecisionLogService;

  constructor() {
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }

    this.mistralProvider = new MistralProvider(mistralApiKey);
    this.decisionLogService = new AIDecisionLogService();
  }

  /**
   * Generate tax optimization suggestions for an entity and year.
   *
   * @param entityId - Entity ID
   * @param tenantId - Tenant ID (for isolation)
   * @param year - Tax year (e.g., 2026)
   * @param consentStatus - AI consent status from middleware
   * @returns Tax suggestions with jurisdiction-specific rules
   */
  async generateSuggestions(
    entityId: string,
    tenantId: string,
    year: number,
    consentStatus?: string
  ): Promise<TaxSuggestionsResult> {
    const startTime = Date.now();

    // Fetch entity to determine jurisdiction
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId },
      select: {
        id: true,
        name: true,
        country: true,
        state: true,
      },
    });

    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    // Map country to jurisdiction
    const jurisdiction = this.mapCountryToJurisdiction(entity.country);
    const jurisdictionRules = JURISDICTIONS[jurisdiction];

    // Analyze expense patterns for the year
    const patterns = await this.analyzeExpensePatterns(entityId, tenantId, year);

    // Generate suggestions for each deduction category
    const suggestions: TaxSuggestion[] = [];

    // 1. Home Office Deduction
    const homeOfficeSuggestion = this.analyzeHomeOffice(
      patterns,
      jurisdiction,
      jurisdictionRules
    );
    if (homeOfficeSuggestion) suggestions.push(homeOfficeSuggestion);

    // 2. Vehicle/Mileage Deduction
    const vehicleSuggestion = this.analyzeVehicle(patterns, jurisdiction, jurisdictionRules);
    if (vehicleSuggestion) suggestions.push(vehicleSuggestion);

    // 3. Equipment Depreciation
    const equipmentSuggestion = this.analyzeEquipment(
      patterns,
      jurisdiction,
      jurisdictionRules
    );
    if (equipmentSuggestion) suggestions.push(equipmentSuggestion);

    // 4. Professional Development
    const profDevSuggestion = this.analyzeProfessionalDev(
      patterns,
      jurisdiction,
      jurisdictionRules
    );
    if (profDevSuggestion) suggestions.push(profDevSuggestion);

    // 5. Meals & Entertainment
    const mealsSuggestion = this.analyzeMeals(patterns, jurisdiction, jurisdictionRules);
    if (mealsSuggestion) suggestions.push(mealsSuggestion);

    // Use Mistral to generate natural language explanations (optional enhancement)
    const aiExplanations = await this.generateAIExplanations(
      suggestions,
      entity.name,
      jurisdiction
    );

    // Merge AI explanations into suggestions
    const enrichedSuggestions = suggestions.map((s, i) => ({
      ...s,
      explanation: aiExplanations[i] || s.explanation,
    }));

    // Calculate quarterly estimate (sum of all potential deductions)
    const quarterlyEstimate = enrichedSuggestions.reduce(
      (sum, s) => sum + s.potentialDeduction,
      0
    );

    const processingTimeMs = Date.now() - startTime;

    // Log decision
    await this.decisionLogService.logDecision({
      tenantId,
      entityId,
      decisionType: 'TAX_OPTIMIZATION',
      input: JSON.stringify({ year, jurisdiction, patternCount: patterns.length }),
      modelVersion: 'mistral-large-latest',
      confidence: 75, // Fixed confidence for rule-based suggestions
      extractedData: {
        suggestions: enrichedSuggestions.length,
        quarterlyEstimate,
        jurisdiction,
      },
      routingResult: 'REVIEW',
      aiExplanation: `Generated ${enrichedSuggestions.length} tax optimization suggestions for ${entity.name} (${year})`,
      consentStatus,
      processingTimeMs,
    });

    logger.info(
      {
        entityId,
        year,
        jurisdiction,
        suggestions: enrichedSuggestions.length,
        quarterlyEstimate,
      },
      'Generated tax optimization suggestions'
    );

    return {
      suggestions: enrichedSuggestions,
      quarterlyEstimate,
      jurisdiction: jurisdictionRules.name,
      entityName: entity.name,
      year,
      disclaimer:
        '⚠️ These are AI-generated suggestions, NOT tax advice. Consult your accountant before claiming deductions. Tax laws vary by jurisdiction and individual situation.',
    };
  }

  /**
   * Analyze expense patterns for the year.
   */
  private async analyzeExpensePatterns(
    entityId: string,
    tenantId: string,
    year: number
  ): Promise<ExpensePattern[]> {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    // Fetch categorized expenses for the year
    const transactions = await prisma.transaction.findMany({
      where: {
        account: { entity: { id: entityId, tenantId } },
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
        categoryId: { not: null },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by category
    const grouped = new Map<
      string,
      {
        categoryName: string;
        categoryType: CategoryType;
        totalAmount: number;
        transactionCount: number;
        examples: Array<{ description: string; amount: number }>;
      }
    >();

    for (const txn of transactions) {
      if (!txn.category) continue;

      const key = txn.category.id;
      const existing = grouped.get(key);

      if (existing) {
        existing.totalAmount += Math.abs(txn.amount); // Use absolute value for expenses
        existing.transactionCount++;
        if (existing.examples.length < 3) {
          existing.examples.push({ description: txn.description, amount: txn.amount });
        }
      } else {
        grouped.set(key, {
          categoryName: txn.category.name,
          categoryType: txn.category.type,
          totalAmount: Math.abs(txn.amount),
          transactionCount: 1,
          examples: [{ description: txn.description, amount: txn.amount }],
        });
      }
    }

    // Convert to array and filter expenses only
    const patterns: ExpensePattern[] = [];
    for (const [, value] of grouped.entries()) {
      if (value.categoryType === 'expense') {
        patterns.push({
          category: value.categoryName,
          totalAmount: value.totalAmount,
          transactionCount: value.transactionCount,
          categoryType: value.categoryType,
          examples: value.examples,
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze Home Office expenses.
   */
  private analyzeHomeOffice(
    patterns: ExpensePattern[],
    jurisdiction: JurisdictionCode,
    rules: (typeof JURISDICTIONS)[JurisdictionCode]
  ): TaxSuggestion | null {
    const homeExpenses = patterns.filter((p) =>
      HOME_OFFICE_KEYWORDS.some((kw) => p.category.toLowerCase().includes(kw))
    );

    if (homeExpenses.length === 0) return null;

    const totalHomeExpenses = homeExpenses.reduce((sum, p) => sum + p.totalAmount, 0);
    const potentialDeduction = Math.round(totalHomeExpenses * rules.homeOfficeRate);
    const transactionCount = homeExpenses.reduce((sum, p) => sum + p.transactionCount, 0);

    return {
      category: 'Home Office',
      potentialDeduction,
      confidence: 70,
      explanation: `Based on your home expenses (rent, utilities, internet), you may be eligible for a home office deduction. Estimated deduction: ${this.formatCurrency(potentialDeduction)}.`,
      jurisdiction: rules.name,
      disclaimer: rules.disclaimers[0],
      transactionCount,
      evidenceRequired: [
        'Floor plan showing dedicated workspace',
        'Proof of exclusive business use',
        'Receipts for home expenses',
      ],
    };
  }

  /**
   * Analyze Vehicle expenses.
   */
  private analyzeVehicle(
    patterns: ExpensePattern[],
    jurisdiction: JurisdictionCode,
    rules: (typeof JURISDICTIONS)[JurisdictionCode]
  ): TaxSuggestion | null {
    const vehicleExpenses = patterns.filter((p) =>
      VEHICLE_KEYWORDS.some((kw) => p.category.toLowerCase().includes(kw))
    );

    if (vehicleExpenses.length === 0) return null;

    const totalVehicleExpenses = vehicleExpenses.reduce((sum, p) => sum + p.totalAmount, 0);
    const transactionCount = vehicleExpenses.reduce((sum, p) => sum + p.transactionCount, 0);

    // Conservative estimate: assume actual expenses OR standard mileage
    // For now, return actual expenses as potential deduction
    const potentialDeduction = totalVehicleExpenses;

    return {
      category: 'Vehicle',
      potentialDeduction,
      confidence: 65,
      explanation: `You have ${this.formatCurrency(totalVehicleExpenses)} in vehicle expenses. You may deduct actual expenses OR standard mileage rate (${rules.mileageRatePerKm / 100} per km/mile). Track business mileage for best results.`,
      jurisdiction: rules.name,
      disclaimer: rules.disclaimers[1],
      transactionCount,
      evidenceRequired: [
        'Mileage log (date, destination, purpose, distance)',
        'Fuel receipts',
        'Proof of business purpose for trips',
      ],
    };
  }

  /**
   * Analyze Equipment purchases (depreciation).
   */
  private analyzeEquipment(
    patterns: ExpensePattern[],
    jurisdiction: JurisdictionCode,
    rules: (typeof JURISDICTIONS)[JurisdictionCode]
  ): TaxSuggestion | null {
    const equipmentExpenses = patterns.filter((p) =>
      EQUIPMENT_KEYWORDS.some((kw) => p.category.toLowerCase().includes(kw))
    );

    if (equipmentExpenses.length === 0) return null;

    const totalEquipmentExpenses = equipmentExpenses.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );
    const transactionCount = equipmentExpenses.reduce((sum, p) => sum + p.transactionCount, 0);

    // For US: Section 179 allows immediate expensing
    // For CA/EU: Capital Cost Allowance (CCA) spreads over years
    const potentialDeduction =
      jurisdiction === 'US' ? totalEquipmentExpenses : Math.round(totalEquipmentExpenses * 0.3); // Estimate 30% first-year CCA

    return {
      category: 'Equipment Depreciation',
      potentialDeduction,
      confidence: 80,
      explanation: `You purchased ${this.formatCurrency(totalEquipmentExpenses)} in business equipment. ${jurisdiction === 'US' ? 'Section 179 allows immediate expensing up to $1,220,000.' : 'Capital Cost Allowance (CCA) allows depreciation over multiple years.'}`,
      jurisdiction: rules.name,
      disclaimer: rules.disclaimers[3],
      transactionCount,
      evidenceRequired: [
        'Purchase receipts',
        'Proof of business use (>50%)',
        'Asset register',
      ],
    };
  }

  /**
   * Analyze Professional Development expenses.
   */
  private analyzeProfessionalDev(
    patterns: ExpensePattern[],
    jurisdiction: JurisdictionCode,
    rules: (typeof JURISDICTIONS)[JurisdictionCode]
  ): TaxSuggestion | null {
    const profDevExpenses = patterns.filter((p) =>
      PROFESSIONAL_DEV_KEYWORDS.some((kw) => p.category.toLowerCase().includes(kw))
    );

    if (profDevExpenses.length === 0) return null;

    const totalProfDevExpenses = profDevExpenses.reduce((sum, p) => sum + p.totalAmount, 0);
    const transactionCount = profDevExpenses.reduce((sum, p) => sum + p.transactionCount, 0);

    // Professional development is typically 100% deductible
    const potentialDeduction = totalProfDevExpenses;

    return {
      category: 'Professional Development',
      potentialDeduction,
      confidence: 85,
      explanation: `You spent ${this.formatCurrency(totalProfDevExpenses)} on professional development. These expenses are typically 100% deductible if directly related to your business.`,
      jurisdiction: rules.name,
      disclaimer: 'Must be directly related to current business, not training for new career',
      transactionCount,
      evidenceRequired: [
        'Course/conference receipts',
        'Proof of business relevance',
        'Certificates of completion',
      ],
    };
  }

  /**
   * Analyze Meals & Entertainment expenses.
   */
  private analyzeMeals(
    patterns: ExpensePattern[],
    jurisdiction: JurisdictionCode,
    rules: (typeof JURISDICTIONS)[JurisdictionCode]
  ): TaxSuggestion | null {
    const mealsExpenses = patterns.filter((p) =>
      MEALS_KEYWORDS.some((kw) => p.category.toLowerCase().includes(kw))
    );

    if (mealsExpenses.length === 0) return null;

    const totalMealsExpenses = mealsExpenses.reduce((sum, p) => sum + p.totalAmount, 0);
    const transactionCount = mealsExpenses.reduce((sum, p) => sum + p.transactionCount, 0);

    // Meals are typically 50% deductible
    const potentialDeduction = Math.round(totalMealsExpenses * rules.mealsDeductionRate);

    return {
      category: 'Meals & Entertainment',
      potentialDeduction,
      confidence: 75,
      explanation: `You have ${this.formatCurrency(totalMealsExpenses)} in meal expenses. Business meals are ${rules.mealsDeductionRate * 100}% deductible. Ensure you document the business purpose for each meal.`,
      jurisdiction: rules.name,
      disclaimer: rules.disclaimers[2],
      transactionCount,
      evidenceRequired: [
        'Receipts for meals',
        'Notes on attendees and business purpose',
        'Calendar entries or meeting notes',
      ],
    };
  }

  /**
   * Use Mistral to generate natural language explanations for suggestions.
   */
  private async generateAIExplanations(
    suggestions: TaxSuggestion[],
    entityName: string,
    jurisdiction: JurisdictionCode
  ): Promise<string[]> {
    if (suggestions.length === 0) return [];

    const prompt = `You are a tax optimization assistant. Generate concise, friendly explanations for these tax deduction suggestions for ${entityName} (${JURISDICTIONS[jurisdiction].name}).

For each suggestion, explain:
1. What the deduction is
2. Why they might qualify
3. What they should track/document

Suggestions:
${suggestions.map((s, i) => `${i + 1}. ${s.category}: ${this.formatCurrency(s.potentialDeduction)} potential deduction`).join('\n')}

Keep each explanation under 100 words. Use plain English, not tax jargon.`;

    try {
      const response = await this.mistralProvider.chat(
        [{ role: 'user', content: prompt }],
        {
          model: 'mistral-large-latest',
          temperature: 0.7,
          maxTokens: 800, // Reduced from 2048 per DEV-273
        }
      );

      // Parse response into individual explanations
      const explanations = response.content
        .split('\n\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => line.replace(/^\d+\.\s*/, '').trim());

      return explanations.slice(0, suggestions.length);
    } catch (error) {
      logger.warn({ error }, 'Failed to generate AI explanations for tax suggestions');
      // Return original explanations on error
      return suggestions.map((s) => s.explanation);
    }
  }

  /**
   * Map country code to jurisdiction.
   */
  private mapCountryToJurisdiction(countryCode: string): JurisdictionCode {
    const normalized = countryCode.toUpperCase();

    if (normalized === 'US' || normalized === 'USA') return 'US';
    if (normalized === 'CA' || normalized === 'CAN') return 'CA';

    // Default to EU for all other countries
    return 'EU';
  }

  /**
   * Format currency for display (integer cents → $X.XX).
   */
  private formatCurrency(cents: number): string {
    const dollars = cents / 100;
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
