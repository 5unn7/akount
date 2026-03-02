import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxSuggestionsService } from '../tax-suggestions.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils/index.js';
import { assertIntegerCents, assertMoneyFields } from '../../../../test-utils/financial-assertions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Mistral provider
const mockChat = vi.fn();

vi.mock('../providers/mistral.provider', () => ({
  MistralProvider: class {
    chat = mockChat;
  },
}));

// Mock AIDecisionLogService
const mockLogDecision = vi.fn();

vi.mock('../ai-decision-log.service', () => ({
  AIDecisionLogService: class {
    logDecision = mockLogDecision;
  },
}));

// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Local aliases for convenience
let mockEntityFindFirst: typeof mockPrisma.entity.findFirst;
let mockTransactionFindMany: typeof mockPrisma.transaction.findMany;

const { TENANT_ID, ENTITY_ID, USER_ID } = TEST_IDS;

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------

function mockEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: ENTITY_ID,
    tenantId: TENANT_ID,
    name: 'Test Business Inc.',
    country: 'US',
    state: 'CA',
    functionalCurrency: 'USD',
    ...overrides,
  };
}

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    accountId: 'acc-1',
    date: new Date('2026-06-15'),
    description: 'Starbucks Coffee',
    amount: -1500, // $15.00 expense (negative)
    currency: 'USD',
    categoryId: 'cat-meals',
    category: {
      id: 'cat-meals',
      name: 'Meals & Entertainment',
      type: 'expense',
    },
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaxSuggestionsService', () => {
  let service: TaxSuggestionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();

    // Re-bind local aliases after rewire
    mockEntityFindFirst = mockPrisma.entity.findFirst;
    mockTransactionFindMany = mockPrisma.transaction.findMany;

    // Mock environment variable
    process.env.MISTRAL_API_KEY = 'test-api-key';

    service = new TaxSuggestionsService();
  });

  describe('generateSuggestions', () => {
    it('should generate tax suggestions for US entity with home office expenses', async () => {
      // Mock entity (US)
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity({ country: 'US' }));

      // Mock transactions with home office expenses
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          id: 'txn-rent',
          description: 'Rent payment',
          amount: -200000, // $2,000
          category: { id: 'cat-rent', name: 'Rent', type: 'expense' },
        }),
        mockTransaction({
          id: 'txn-internet',
          description: 'Internet bill',
          amount: -8000, // $80
          category: { id: 'cat-utilities', name: 'Utilities', type: 'expense' },
        }),
      ]);

      // Mock Mistral response for AI explanations
      mockChat.mockResolvedValueOnce({
        content: `1. Home Office: Based on your rent and utilities, you may qualify for a home office deduction.\n\n2. No other categories detected.`,
      });

      const result = await service.generateSuggestions(
        ENTITY_ID,
        TENANT_ID,
        2026,
        'granted'
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result.entityName).toBe('Test Business Inc.');
      expect(result.year).toBe(2026);
      expect(result.jurisdiction).toBe('United States (IRS)');
      expect(result.disclaimer).toContain('NOT tax advice');

      // Should have at least one suggestion (Home Office)
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Verify Home Office suggestion
      const homeOfficeSuggestion = result.suggestions.find(
        (s) => s.category === 'Home Office'
      );
      expect(homeOfficeSuggestion).toBeDefined();
      expect(homeOfficeSuggestion!.potentialDeduction).toBeGreaterThan(0);
      assertIntegerCents(homeOfficeSuggestion!.potentialDeduction);
      expect(homeOfficeSuggestion!.confidence).toBe(70);
      expect(homeOfficeSuggestion!.jurisdiction).toBe('United States (IRS)');

      // Verify quarterly estimate is integer cents
      assertIntegerCents(result.quarterlyEstimate);
      expect(result.quarterlyEstimate).toBeGreaterThan(0);

      // Verify AIDecisionLog was called
      expect(mockLogDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          entityId: ENTITY_ID,
          decisionType: 'TAX_OPTIMIZATION',
          routingResult: 'REVIEW',
          consentStatus: 'granted',
        })
      );
    });

    it('should generate suggestions for Canadian entity with fuel/auto expenses', async () => {
      // Mock entity (Canada)
      mockEntityFindFirst.mockResolvedValueOnce(
        mockEntity({ country: 'CA', state: 'ON' })
      );

      // Mock transactions with vehicle expenses (category name must include keywords: gas, fuel, auto, vehicle, etc.)
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          id: 'txn-gas',
          description: 'Gas station',
          amount: -5000, // $50
          category: { id: 'cat-auto', name: 'Auto & Fuel', type: 'expense' },
        }),
        mockTransaction({
          id: 'txn-parking',
          description: 'Parking fee',
          amount: -1500, // $15
          category: { id: 'cat-auto', name: 'Auto & Fuel', type: 'expense' },
        }),
      ]);

      // Mock Mistral response (multi-line response)
      mockChat.mockResolvedValueOnce({
        content: `1. Vehicle: Track your business mileage for maximum deduction.\n\n2. Auto: Business auto expenses are deductible.`,
      });

      const result = await service.generateSuggestions(
        ENTITY_ID,
        TENANT_ID,
        2026,
        'granted'
      );

      // Assertions
      expect(result.jurisdiction).toBe('Canada (CRA)');
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Verify first suggestion has correct properties
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion).toBeDefined();
      assertIntegerCents(firstSuggestion.potentialDeduction);
      expect(firstSuggestion.potentialDeduction).toBe(6500); // $50 + $15
    });

    it('should generate suggestions for equipment depreciation (US - Section 179)', async () => {
      // Mock entity (US)
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity({ country: 'US' }));

      // Mock transactions with equipment purchases (category name must include keywords: computer, laptop, equipment, etc.)
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          id: 'txn-laptop',
          description: 'MacBook Pro',
          amount: -250000, // $2,500
          category: { id: 'cat-equipment', name: 'Computer Equipment', type: 'expense' },
        }),
        mockTransaction({
          id: 'txn-desk',
          description: 'Standing desk',
          amount: -80000, // $800
          category: { id: 'cat-furniture', name: 'Office Furniture', type: 'expense' },
        }),
      ]);

      // Mock Mistral response (multi-line)
      mockChat.mockResolvedValueOnce({
        content: `1. Equipment Depreciation: Section 179 allows immediate expensing of business equipment.\n\n2. Office Furniture: Track all office-related purchases.`,
      });

      const result = await service.generateSuggestions(
        ENTITY_ID,
        TENANT_ID,
        2026,
        'granted'
      );

      // Verify at least one suggestion exists
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Verify first suggestion has correct properties
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion.potentialDeduction).toBeGreaterThan(0);
      assertIntegerCents(firstSuggestion.potentialDeduction);
      expect(firstSuggestion.potentialDeduction).toBe(330000); // $2,500 + $800 = $3,300 for US Section 179
      expect(firstSuggestion.confidence).toBe(80);
    });

    it('should apply 50% deduction for meals & entertainment', async () => {
      // Mock entity
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      // Mock transactions with meals expenses (category name must include keywords: restaurant, meal, etc.)
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          id: 'txn-meal1',
          description: 'Restaurant lunch',
          amount: -6000, // $60
          category: { id: 'cat-restaurant', name: 'Restaurant', type: 'expense' },
        }),
        mockTransaction({
          id: 'txn-meal2',
          description: 'Coffee meeting',
          amount: -2000, // $20
          category: { id: 'cat-cafe', name: 'Cafe & Coffee', type: 'expense' },
        }),
      ]);

      // Mock Mistral response (multi-line)
      mockChat.mockResolvedValueOnce({
        content: `1. Meals & Entertainment: Business meals are 50% deductible.\n\n2. Restaurant: Track all business meal expenses.`,
      });

      const result = await service.generateSuggestions(
        ENTITY_ID,
        TENANT_ID,
        2026,
        'granted'
      );

      // Verify at least one suggestion
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Verify the first suggestion has correct properties
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion.potentialDeduction).toBe(4000); // ($60 + $20) * 0.5 = $40
      assertIntegerCents(firstSuggestion.potentialDeduction);
      expect(firstSuggestion.confidence).toBe(75);
      expect(firstSuggestion.explanation).toContain('50%');
    });

    it('should return empty suggestions when no matching expenses found', async () => {
      // Mock entity
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      // Mock transactions with non-deductible categories
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          id: 'txn-income',
          description: 'Client payment',
          amount: 100000, // Income (positive)
          category: { id: 'cat-income', name: 'Revenue', type: 'income' },
        }),
      ]);

      // Mock Mistral response
      mockChat.mockResolvedValueOnce({
        content: `No tax optimization suggestions available for this period.`,
      });

      const result = await service.generateSuggestions(
        ENTITY_ID,
        TENANT_ID,
        2026,
        'granted'
      );

      // Assertions
      expect(result.suggestions).toHaveLength(0);
      expect(result.quarterlyEstimate).toBe(0);
    });

    it('should throw error when entity not found', async () => {
      // Mock entity not found
      mockEntityFindFirst.mockResolvedValueOnce(null);

      await expect(
        service.generateSuggestions(ENTITY_ID, TENANT_ID, 2026, 'granted')
      ).rejects.toThrow('Entity not found or access denied');
    });

    it('should handle Mistral API errors gracefully', async () => {
      // Mock entity
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      // Mock transactions
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          description: 'Rent payment',
          amount: -200000,
          category: { id: 'cat-rent', name: 'Rent', type: 'expense' },
        }),
      ]);

      // Mock Mistral error
      mockChat.mockRejectedValueOnce(new Error('Mistral API Error'));

      const result = await service.generateSuggestions(
        ENTITY_ID,
        TENANT_ID,
        2026,
        'granted'
      );

      // Should still return suggestions with default explanations
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].explanation).toBeDefined();
    });

    it('should enforce tenant isolation via entity ownership', async () => {
      // Mock entity with different tenantId
      mockEntityFindFirst.mockResolvedValueOnce(null);

      await expect(
        service.generateSuggestions('other-entity', 'other-tenant', 2026, 'granted')
      ).rejects.toThrow('Entity not found or access denied');
    });

    it('should log decision to AIDecisionLog', async () => {
      // Mock entity
      mockEntityFindFirst.mockResolvedValueOnce(mockEntity());

      // Mock transactions
      mockTransactionFindMany.mockResolvedValueOnce([
        mockTransaction({
          description: 'Laptop purchase',
          amount: -150000,
          category: { id: 'cat-equipment', name: 'Office Supplies', type: 'expense' },
        }),
      ]);

      // Mock Mistral response
      mockChat.mockResolvedValueOnce({
        content: `1. Equipment: Section 179 allows immediate expensing.`,
      });

      await service.generateSuggestions(ENTITY_ID, TENANT_ID, 2026, 'granted');

      // Verify AIDecisionLog was called with correct parameters
      expect(mockLogDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          entityId: ENTITY_ID,
          decisionType: 'TAX_OPTIMIZATION',
          modelVersion: 'mistral-large-latest',
          confidence: 75,
          routingResult: 'REVIEW',
          consentStatus: 'granted',
          processingTimeMs: expect.any(Number),
        })
      );
    });
  });
});
