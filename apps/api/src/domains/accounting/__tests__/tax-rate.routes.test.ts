import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { taxRateRoutes } from '../routes/tax-rate';
import { AccountingError } from '../errors';
import { mockTaxRate, mockTaxRateInput } from '../../../test-utils';

// Mock middleware
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => {
    const handler = async () => {};
    (handler as any).optional = () => async () => {};
    return handler;
  }),
}));

vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async (request: any) => {
      request.userId = 'test-user-id';
      request.tenantId = 'tenant-abc-123';
      request.tenantRole = 'OWNER';
    },
  })),
}));

// Mock TaxRateService
const mockListTaxRates = vi.fn();
const mockGetTaxRate = vi.fn();
const mockCreateTaxRate = vi.fn();
const mockUpdateTaxRate = vi.fn();
const mockDeactivateTaxRate = vi.fn();

vi.mock('../services/tax-rate.service', () => ({
  TaxRateService: function (this: any) {
    this.listTaxRates = mockListTaxRates;
    this.getTaxRate = mockGetTaxRate;
    this.createTaxRate = mockCreateTaxRate;
    this.updateTaxRate = mockUpdateTaxRate;
    this.deactivateTaxRate = mockDeactivateTaxRate;
  },
}));

// ✅ MIGRATION: Replaced inline mock with type-safe factory
// Before: const MOCK_TAX_RATE = { id, code, rate: 5, ... } (15 lines, breaks on schema change)
// After: mockTaxRate() from test-utils (type-safe, auto-updates with schema)

describe('TaxRate Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    const taxRate = mockTaxRate({ code: 'GST-5', name: 'GST 5%' });
    mockListTaxRates.mockResolvedValue([taxRate]);
    mockGetTaxRate.mockResolvedValue(taxRate);
    mockCreateTaxRate.mockResolvedValue(taxRate);
    mockUpdateTaxRate.mockResolvedValue({ ...taxRate, name: 'Updated GST' });
    mockDeactivateTaxRate.mockResolvedValue({
      ...taxRate,
      isActive: false,
      effectiveTo: new Date('2026-02-22T00:00:00.000Z'),
    });

    app = Fastify({ logger: false });
    await app.register(taxRateRoutes, { prefix: '/tax-rates' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ============================================================================
  // GET /tax-rates
  // ============================================================================

  describe('GET /tax-rates', () => {
    it('should return 200 with tax rates list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveLength(1);
      expect(body[0].code).toBe('GST-5');
    });

    it('should pass query params to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
        query: { jurisdiction: 'Canada', isActive: 'true' },
      });

      expect(mockListTaxRates).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // GET /tax-rates/:id
  // ============================================================================

  describe('GET /tax-rates/:id', () => {
    it('should return 200 with tax rate detail', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tax-rates/tax-rate-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().code).toBe('GST-5');
      expect(response.json().name).toBe('GST 5%');
    });

    it('should return 404 when not found', async () => {
      mockGetTaxRate.mockRejectedValue(
        new AccountingError('Tax rate not found', 'TAX_RATE_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/tax-rates/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('TAX_RATE_NOT_FOUND');
    });
  });

  // ============================================================================
  // POST /tax-rates
  // ============================================================================

  describe('POST /tax-rates', () => {
    it('should return 201 on successful creation', async () => {
      // ✅ Using validated input factory (catches schema drift at test-write time)
      const input = mockTaxRateInput({ code: 'GST-5', name: 'GST 5%' });

      const response = await app.inject({
        method: 'POST',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
        payload: input,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().code).toBe('GST-5');
    });

    it('should return 409 on duplicate code', async () => {
      mockCreateTaxRate.mockRejectedValue(
        new AccountingError("Tax rate code 'GST-5' already exists", 'DUPLICATE_TAX_CODE', 409)
      );

      const input = mockTaxRateInput({ code: 'GST-5', name: 'GST 5%' });

      const response = await app.inject({
        method: 'POST',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
        payload: input,
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toBe('DUPLICATE_TAX_CODE');
    });

    it('should return 400 on invalid date range', async () => {
      mockCreateTaxRate.mockRejectedValue(
        new AccountingError('effectiveTo must be after effectiveFrom', 'INVALID_DATE_RANGE', 400)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          code: 'HST-13',
          name: 'HST 13%',
          rateBasisPoints: 1300,
          jurisdiction: 'Ontario',
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2024-01-01T00:00:00.000Z',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('INVALID_DATE_RANGE');
    });

    it('should return 403 on invalid entity', async () => {
      mockCreateTaxRate.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'wrong-entity',
          code: 'PST-7',
          name: 'PST 7%',
          rateBasisPoints: 700,
          jurisdiction: 'BC',
          effectiveFrom: '2024-01-01T00:00:00.000Z',
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('ENTITY_NOT_FOUND');
    });
  });

  // ============================================================================
  // PATCH /tax-rates/:id
  // ============================================================================

  describe('PATCH /tax-rates/:id', () => {
    it('should return 200 on successful update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/tax-rates/tax-rate-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated GST' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().name).toBe('Updated GST');
    });

    it('should return 404 when tax rate not found', async () => {
      mockUpdateTaxRate.mockRejectedValue(
        new AccountingError('Tax rate not found', 'TAX_RATE_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'PATCH',
        url: '/tax-rates/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('TAX_RATE_NOT_FOUND');
    });
  });

  // ============================================================================
  // DELETE /tax-rates/:id
  // ============================================================================

  describe('DELETE /tax-rates/:id', () => {
    it('should return 200 on successful deactivation', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/tax-rates/tax-rate-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().isActive).toBe(false);
      expect(response.json().effectiveTo).toBeTruthy();
    });

    it('should return 404 when not found', async () => {
      mockDeactivateTaxRate.mockRejectedValue(
        new AccountingError('Tax rate not found', 'TAX_RATE_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/tax-rates/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('TAX_RATE_NOT_FOUND');
    });

    it('should accept optional effectiveTo in body', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/tax-rates/tax-rate-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { effectiveTo: '2026-12-31T23:59:59.000Z' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockDeactivateTaxRate).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Error handling
  // ============================================================================

  describe('Error handling', () => {
    it('should propagate unknown errors as 500', async () => {
      mockListTaxRates.mockRejectedValue(new Error('Database connection failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/tax-rates',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
    });
  });
});
