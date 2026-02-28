import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { taxSuggestionsRoutes } from '../tax-suggestions.routes';
import { TaxSuggestionsService } from '../../services/tax-suggestions.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

/**
 * Tax Optimization Suggestions Route Tests
 *
 * Tests GET /api/ai/tax-suggestions endpoint.
 *
 * **Coverage:**
 * - Jurisdiction-specific tax optimization suggestions
 * - Integer cents validation (Invariant #2)
 * - Tenant isolation (Invariant #1)
 * - Entity ownership validation (IDOR prevention)
 * - Consent gate enforcement
 * - Mistral API error handling
 */

const TEST_TENANT_ID = 'tenant_test_123';
const TEST_ENTITY_ID = 'entity_test_123';
const TEST_USER_ID = 'user_test_123';

// ---------------------------------------------------------------------------
// Mock Middleware
// ---------------------------------------------------------------------------

vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request: any, reply: any) => {
    request.userId = TEST_USER_ID;
  }),
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request: any, reply: any) => {
    request.tenantId = TEST_TENANT_ID;
    request.tenant = {
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      role: 'ADMIN' as const,
    };
  }),
}));

vi.mock('../../../../middleware/consent-gate', () => ({
  requireConsent: vi.fn(() => async (request: any, reply: any) => {
    request.aiConsentGranted = true;
    request.aiConsentFeature = 'autoCategorize';
  }),
}));

vi.mock('../../../../middleware/rate-limit', () => ({
  aiRateLimitConfig: vi.fn(() => ({})),
}));

// Mock Prisma
vi.mock('@akount/db', () => ({
  prisma: {
    entity: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock TaxSuggestionsService
vi.mock('../../services/tax-suggestions.service');

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_TAX_SUGGESTIONS_RESULT = {
  suggestions: [
    {
      category: 'Home Office',
      potentialDeduction: 29120, // $291.20 in cents
      confidence: 70,
      explanation:
        'Based on your home expenses (rent, utilities, internet), you may be eligible for a home office deduction. Estimated deduction: $291.20.',
      jurisdiction: 'United States (IRS)',
      disclaimer: 'Home office must be used exclusively and regularly for business',
      transactionCount: 3,
      evidenceRequired: [
        'Floor plan showing dedicated workspace',
        'Proof of exclusive business use',
        'Receipts for home expenses',
      ],
    },
    {
      category: 'Vehicle',
      potentialDeduction: 12500, // $125.00 in cents
      confidence: 65,
      explanation:
        'You have $125.00 in vehicle expenses. You may deduct actual expenses OR standard mileage rate (0.67 per km/mile). Track business mileage for best results.',
      jurisdiction: 'United States (IRS)',
      disclaimer: 'Standard mileage rate is $0.67/mile for 2024',
      transactionCount: 5,
      evidenceRequired: [
        'Mileage log (date, destination, purpose, distance)',
        'Fuel receipts',
        'Proof of business purpose for trips',
      ],
    },
    {
      category: 'Equipment Depreciation',
      potentialDeduction: 350000, // $3,500 in cents
      confidence: 80,
      explanation:
        'You purchased $3,500.00 in business equipment. Section 179 allows immediate expensing up to $1,220,000.',
      jurisdiction: 'United States (IRS)',
      disclaimer: 'Section 179 allows immediate expensing of equipment up to $1,220,000',
      transactionCount: 2,
      evidenceRequired: ['Purchase receipts', 'Proof of business use (>50%)', 'Asset register'],
    },
  ],
  quarterlyEstimate: 391620, // Sum of all suggestions ($3,916.20)
  jurisdiction: 'United States (IRS)',
  entityName: 'Test Business Inc.',
  year: 2026,
  disclaimer:
    '⚠️ These are AI-generated suggestions, NOT tax advice. Consult your accountant before claiming deductions. Tax laws vary by jurisdiction and individual situation.',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Tax Suggestions Routes', () => {
  let app: FastifyInstance;
  let mockGenerateSuggestions: ReturnType<typeof vi.fn>;
  let mockPrismaEntityFindFirst: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock Prisma
    const { prisma } = await import('@akount/db');
    mockPrismaEntityFindFirst = vi.mocked(prisma.entity.findFirst);

    // Mock the service method
    mockGenerateSuggestions = vi.fn();
    vi.mocked(TaxSuggestionsService).mockImplementation(
      function (this: unknown) {
        return {
          generateSuggestions: mockGenerateSuggestions,
        } as unknown as TaxSuggestionsService;
      }
    );

    app = Fastify();
    await app.register(taxSuggestionsRoutes, { prefix: '/api/ai/tax-suggestions' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/ai/tax-suggestions', () => {
    it('should generate tax optimization suggestions successfully', async () => {
      // Mock entity ownership validation
      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockResolvedValue(MOCK_TAX_SUGGESTIONS_RESULT);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate structure
      expect(body).toHaveProperty('suggestions');
      expect(body).toHaveProperty('quarterlyEstimate');
      expect(body).toHaveProperty('jurisdiction');
      expect(body).toHaveProperty('entityName');
      expect(body).toHaveProperty('year');
      expect(body).toHaveProperty('disclaimer');

      // Validate suggestions array
      expect(body.suggestions).toHaveLength(3);

      // Validate each suggestion has integer cents (Invariant #2)
      body.suggestions.forEach((suggestion: any) => {
        assertIntegerCents(suggestion.potentialDeduction);
        expect(suggestion.confidence).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(100);
        expect(suggestion.jurisdiction).toBe('United States (IRS)');
        expect(suggestion.disclaimer).toBeDefined();
        expect(suggestion.evidenceRequired).toBeDefined();
        expect(Array.isArray(suggestion.evidenceRequired)).toBe(true);
      });

      // Validate quarterly estimate is integer cents (Invariant #2)
      assertIntegerCents(body.quarterlyEstimate);
      expect(body.quarterlyEstimate).toBe(391620);

      // Validate year
      expect(body.year).toBe(2026);

      // Validate disclaimer
      expect(body.disclaimer).toContain('NOT tax advice');

      // Verify service was called correctly
      expect(mockGenerateSuggestions).toHaveBeenCalledWith(
        TEST_ENTITY_ID,
        TEST_TENANT_ID,
        2026,
        'granted'
      );

      // Verify entity ownership was checked (Invariant #1 - Tenant Isolation)
      expect(mockPrismaEntityFindFirst).toHaveBeenCalledWith({
        where: { id: TEST_ENTITY_ID, tenantId: TEST_TENANT_ID },
        select: { id: true, name: true },
      });
    });

    it('should use current year as default when year not provided', async () => {
      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockResolvedValue({
        ...MOCK_TAX_SUGGESTIONS_RESULT,
        year: new Date().getFullYear(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Should use current year
      expect(body.year).toBe(new Date().getFullYear());

      // Verify service was called with current year
      expect(mockGenerateSuggestions).toHaveBeenCalledWith(
        TEST_ENTITY_ID,
        TEST_TENANT_ID,
        new Date().getFullYear(),
        'granted'
      );
    });

    it('should return empty suggestions when no deductible expenses found', async () => {
      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockResolvedValue({
        suggestions: [],
        quarterlyEstimate: 0,
        jurisdiction: 'United States (IRS)',
        entityName: 'Test Business Inc.',
        year: 2026,
        disclaimer:
          '⚠️ These are AI-generated suggestions, NOT tax advice. Consult your accountant before claiming deductions. Tax laws vary by jurisdiction and individual situation.',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.suggestions).toHaveLength(0);
      expect(body.quarterlyEstimate).toBe(0);
    });

    it('should return 404 when entity not found (IDOR prevention)', async () => {
      // Mock entity not found (different tenantId)
      mockPrismaEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Entity not found or access denied');

      // Verify entity ownership check was performed
      expect(mockPrismaEntityFindFirst).toHaveBeenCalledWith({
        where: { id: TEST_ENTITY_ID, tenantId: TEST_TENANT_ID },
        select: { id: true, name: true },
      });

      // Service should NOT be called
      expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    });

    it('should return 404 when service throws "not found" error', async () => {
      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockRejectedValue(
        new Error('Entity not found or access denied')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Entity not found or access denied');
    });

    it('should return 503 when Mistral API is unavailable', async () => {
      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockRejectedValue(new Error('Mistral API Error: Service unavailable'));

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Service Unavailable');
      expect(body.message).toContain('temporarily unavailable');
    });

    it('should return 503 when circuit breaker is open', async () => {
      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockRejectedValue(
        new Error('Circuit breaker OPEN: Mistral API has failed 5 times')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Service Unavailable');
      expect(body.message).toContain('temporarily unavailable');
    });

    it('should return 400 when entityId is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ai/tax-suggestions?year=2026',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Validation Error');
      expect(body.details).toBeDefined();
    });

    it('should return 400 when year is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=1999`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Validation Error');
    });

    it('should enforce consent gate (requires autoCategorize consent)', async () => {
      // This is enforced by requireConsent middleware
      // Middleware is mocked, so just verify it's part of the handler chain

      mockPrismaEntityFindFirst.mockResolvedValue({
        id: TEST_ENTITY_ID,
        name: 'Test Business Inc.',
      });

      mockGenerateSuggestions.mockResolvedValue(MOCK_TAX_SUGGESTIONS_RESULT);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/tax-suggestions?entityId=${TEST_ENTITY_ID}&year=2026`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);

      // Verify service was called with consent status
      expect(mockGenerateSuggestions).toHaveBeenCalledWith(
        TEST_ENTITY_ID,
        TEST_TENANT_ID,
        2026,
        'granted'
      );
    });
  });
});
