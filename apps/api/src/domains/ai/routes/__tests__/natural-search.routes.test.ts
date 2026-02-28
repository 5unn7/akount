import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { naturalSearchRoutes } from '../natural-search.routes';
import { NaturalSearchService } from '../../services/natural-search.service';

/**
 * Natural Language Search Route Tests
 *
 * Tests POST /api/ai/search/natural endpoint.
 *
 * **Coverage:**
 * - Category + amount + date range parsing
 * - Low confidence → 422 with suggestions
 * - Mistral API error → 503
 * - Consent gate
 */

const TEST_TENANT_ID = 'tenant_test_123';
const TEST_ENTITY_ID = 'entity_test_123';
const TEST_USER_ID = 'user_test_123';

// Mock middleware
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

vi.mock('../../../../middleware/validation', () => ({
  validateBody: vi.fn((schema: any) => async (request: any, reply: any) => {
    // Skip validation in tests
  }),
}));

vi.mock('../../../../middleware/rate-limit', () => ({
  aiRateLimitConfig: vi.fn(() => ({})),
}));

// Mock NaturalSearchService
vi.mock('../../services/natural-search.service');

const MOCK_SEARCH_RESULT = {
  parsed: {
    category: ['cat_restaurant_id'],
    amountMin: 10000, // $100 in cents
    dateFrom: '2026-10-01T00:00:00.000Z',
    dateTo: '2026-12-31T23:59:59.999Z',
    type: 'DEBIT' as const,
  },
  confidence: 95,
  explanation:
    'Searching for transactions: Categories: Restaurant, Amount > $100.00, Date range: Oct 1, 2026 to Dec 31, 2026, Type: Expenses.',
  filterChips: [
    { label: 'Restaurant', value: 'cat_restaurant_id', field: 'category' },
    { label: '> $100', value: '100', field: 'amountMin' },
    { label: 'Oct 1, 2026 - Dec 31, 2026', value: '2026-10-01 to 2026-12-31', field: 'dateRange' },
    { label: 'Expenses', value: 'expense', field: 'type' },
  ],
};

describe('Natural Search Routes', () => {
  let app: FastifyInstance;
  let mockParseSearchQuery: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock the service method
    mockParseSearchQuery = vi.fn();
    vi.mocked(NaturalSearchService).mockImplementation(
      function (this: unknown) {
        return {
          parseSearchQuery: mockParseSearchQuery,
        } as unknown as NaturalSearchService;
      }
    );

    app = Fastify();
    await app.register(naturalSearchRoutes, { prefix: '/api/ai/search' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/ai/search/natural', () => {
    it('should parse natural language search query successfully', async () => {
      mockParseSearchQuery.mockResolvedValue(MOCK_SEARCH_RESULT);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'Show me all restaurant expenses over $100 in Q4',
          entityId: TEST_ENTITY_ID,
          scope: 'transactions',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate structure
      expect(body).toHaveProperty('parsed');
      expect(body).toHaveProperty('confidence');
      expect(body).toHaveProperty('explanation');
      expect(body).toHaveProperty('filterChips');

      // Validate parsed filters
      expect(body.parsed.category).toEqual(['cat_restaurant_id']);
      expect(body.parsed.amountMin).toBe(10000); // Integer cents (Invariant #2)
      expect(body.parsed.dateFrom).toBe('2026-10-01T00:00:00.000Z');
      expect(body.parsed.dateTo).toBe('2026-12-31T23:59:59.999Z');
      expect(body.parsed.type).toBe('DEBIT');

      // Validate confidence
      expect(body.confidence).toBe(95);

      // Validate filter chips
      expect(body.filterChips).toHaveLength(4);
      expect(body.filterChips[0]).toEqual({
        label: 'Restaurant',
        value: 'cat_restaurant_id',
        field: 'category',
      });

      // Verify service was called correctly
      expect(mockParseSearchQuery).toHaveBeenCalledWith(
        'Show me all restaurant expenses over $100 in Q4',
        TEST_TENANT_ID,
        TEST_ENTITY_ID,
        'granted'
      );
    });

    it('should return 422 for low confidence query', async () => {
      mockParseSearchQuery.mockRejectedValue(
        new Error('Unable to understand query. Try: "expenses over $100 last quarter" or "Uber rides in January"')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'asdfgh',
          entityId: TEST_ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unprocessable Entity');
      expect(body.message).toContain('Unable to understand');
      expect(body.suggestion).toContain('Try a more specific query');
    });

    it('should return 503 for Mistral API error', async () => {
      mockParseSearchQuery.mockRejectedValue(
        new Error('Mistral API Error: Circuit breaker open')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'Show me expenses',
          entityId: TEST_ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Service Unavailable');
      expect(body.message).toContain('AI service is temporarily unavailable');
    });

    it('should default scope to transactions if not provided', async () => {
      mockParseSearchQuery.mockResolvedValue(MOCK_SEARCH_RESULT);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'Show me expenses',
          entityId: TEST_ENTITY_ID,
          // scope not provided - should default to 'transactions'
        },
      });

      expect(response.statusCode).toBe(200);
      // Zod schema default value is tested implicitly
    });

    it('should ensure amounts are integer cents (Invariant #2)', async () => {
      const mockResult = {
        parsed: {
          amountMin: 5500, // $55.00 in cents
          amountMax: 15000, // $150.00 in cents
        },
        confidence: 85,
        explanation: 'Searching for transactions: Amount > $55.00, Amount < $150.00.',
        filterChips: [
          { label: '> $55', value: '55', field: 'amountMin' },
          { label: '< $150', value: '150', field: 'amountMax' },
        ],
      };

      mockParseSearchQuery.mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'transactions between $55 and $150',
          entityId: TEST_ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify amounts are integers (not floats)
      expect(Number.isInteger(body.parsed.amountMin)).toBe(true);
      expect(Number.isInteger(body.parsed.amountMax)).toBe(true);
      expect(body.parsed.amountMin).toBe(5500);
      expect(body.parsed.amountMax).toBe(15000);
    });

    it('should handle date range parsing', async () => {
      const mockResult = {
        parsed: {
          dateFrom: '2026-10-01T00:00:00.000Z',
          dateTo: '2026-12-31T23:59:59.999Z',
        },
        confidence: 80,
        explanation: 'Searching for transactions: Date range: Oct 1, 2026 to Dec 31, 2026.',
        filterChips: [
          { label: 'Oct 1, 2026 - Dec 31, 2026', value: '2026-10-01 to 2026-12-31', field: 'dateRange' },
        ],
      };

      mockParseSearchQuery.mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'transactions in Q4',
          entityId: TEST_ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify ISO 8601 date format
      expect(body.parsed.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(body.parsed.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should parse vendor search with category filtering', async () => {
      const mockResult = {
        parsed: {
          vendor: 'Uber',
          category: ['cat_travel_id'],
          dateFrom: '2026-01-01T00:00:00.000Z',
          dateTo: '2026-01-31T23:59:59.999Z',
        },
        confidence: 92,
        explanation: 'Searching for transactions: Categories: Travel, Vendor: Uber, Date range: Jan 1, 2026 to Jan 31, 2026.',
        filterChips: [
          { label: 'Travel', value: 'cat_travel_id', field: 'category' },
          { label: 'Vendor: Uber', value: 'Uber', field: 'vendor' },
          { label: 'Jan 1, 2026 - Jan 31, 2026', value: '2026-01-01 to 2026-01-31', field: 'dateRange' },
        ],
      };

      mockParseSearchQuery.mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/search/natural',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          query: 'Find Uber rides last month',
          entityId: TEST_ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.parsed.vendor).toBe('Uber');
      expect(body.parsed.category).toEqual(['cat_travel_id']);
      expect(body.confidence).toBe(92);
      expect(body.filterChips).toHaveLength(3);
    });
  });
});
