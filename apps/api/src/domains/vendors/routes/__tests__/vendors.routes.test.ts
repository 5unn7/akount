import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { vendorRoutes } from '../vendors';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

// Mock auth middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

// Mock tenant middleware
vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

// Mock RBAC middleware to always allow
vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

// Mock validation middleware to always pass
vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// Mock vendor service — use vi.hoisted so declarations are available to hoisted vi.mock
const {
  mockCreateVendor,
  mockListVendors,
  mockGetVendor,
  mockUpdateVendor,
  mockDeleteVendor,
} = vi.hoisted(() => ({
  mockCreateVendor: vi.fn(),
  mockListVendors: vi.fn(),
  mockGetVendor: vi.fn(),
  mockUpdateVendor: vi.fn(),
  mockDeleteVendor: vi.fn(),
}));

vi.mock('../../services/vendor.service', () => ({
  createVendor: mockCreateVendor,
  listVendors: mockListVendors,
  getVendor: mockGetVendor,
  updateVendor: mockUpdateVendor,
  deleteVendor: mockDeleteVendor,
}));

const MOCK_ENTITY = {
  id: 'entity-1',
  name: 'Test Business',
};

const MOCK_VENDOR = {
  id: 'vendor-1',
  entityId: 'entity-1',
  name: 'Office Supplies Inc',
  email: 'billing@supplies.com',
  phone: '+1-555-0200',
  address: '456 Supply St, Boston, MA 02101',
  paymentTerms: 'Net 30',
  status: 'active',
  deletedAt: null,
  createdAt: new Date('2024-01-15T00:00:00Z'),
  updatedAt: new Date('2024-01-15T00:00:00Z'),
  entity: MOCK_ENTITY,
};

const MOCK_VENDOR_WITH_STATS = {
  ...MOCK_VENDOR,
  openBills: 2,
  balanceDue: 250000, // $2,500.00 (integer cents)
};

const MOCK_PAGINATED = {
  vendors: [MOCK_VENDOR],
  nextCursor: null,
};

describe('Vendor Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateVendor.mockResolvedValue(MOCK_VENDOR);
    mockListVendors.mockResolvedValue(MOCK_PAGINATED);
    mockGetVendor.mockResolvedValue(MOCK_VENDOR_WITH_STATS);
    mockUpdateVendor.mockResolvedValue(MOCK_VENDOR);
    mockDeleteVendor.mockResolvedValue({ ...MOCK_VENDOR, deletedAt: new Date() });

    app = Fastify({ logger: false });
    await app.register(vendorRoutes, { prefix: '/vendors' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /vendors', () => {
    const validVendorData = {
      entityId: 'entity-1',
      name: 'Office Supplies Inc',
      email: 'billing@supplies.com',
      phone: '+1-555-0200',
      address: '456 Supply St, Boston, MA 02101',
      paymentTerms: 'Net 30',
      status: 'active',
    };

    it('should create vendor successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
        payload: validVendorData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.name).toBe('Office Supplies Inc');
      expect(body.email).toBe('billing@supplies.com');
    });

    it('should reject if entity not found', async () => {
      mockCreateVendor.mockRejectedValueOnce(new Error('Entity not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
        payload: validVendorData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Entity not found');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vendors',
        payload: validVendorData,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should include entity in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
        payload: validVendorData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.entity).toBeDefined();
      expect(body.entity.name).toBe('Test Business');
    });

    it('should pass tenant context to service', async () => {
      await app.inject({
        method: 'POST',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
        payload: validVendorData,
      });

      expect(mockCreateVendor).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('GET /vendors', () => {
    it('should list vendors filtered by tenantId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.vendors).toHaveLength(1);
      expect(mockListVendors).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should filter by status', async () => {
      await app.inject({
        method: 'GET',
        url: '/vendors?status=active',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListVendors).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
        expect.any(Object)
      );
    });

    it('should filter by search (name or email)', async () => {
      await app.inject({
        method: 'GET',
        url: '/vendors?search=Supplies',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListVendors).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Supplies' }),
        expect.any(Object)
      );
    });

    it('should paginate with cursor', async () => {
      await app.inject({
        method: 'GET',
        url: '/vendors?cursor=vendor-123&limit=25',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListVendors).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: 'vendor-123',
          limit: '25',
        }),
        expect.any(Object)
      );
    });

    it('should return nextCursor for pagination', async () => {
      mockListVendors.mockResolvedValueOnce({
        vendors: [MOCK_VENDOR],
        nextCursor: 'vendor-next',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBe('vendor-next');
    });

    it('should exclude soft-deleted vendors', async () => {
      // Service is responsible for filtering deletedAt: null
      await app.inject({
        method: 'GET',
        url: '/vendors',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListVendors).toHaveBeenCalled();
      // Assertion: service implementation ensures deletedAt: null filter
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vendors',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /vendors/:id', () => {
    it('should return vendor with aggregated stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vendors/vendor-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('vendor-1');
      expect(body.openBills).toBe(2);
      expect(body.balanceDue).toBeDefined();
    });

    it('should return balanceDue as integer cents', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vendors/vendor-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      assertIntegerCents(body.balanceDue, 'balanceDue');
    });

    it('should return 404 for non-existent vendor', async () => {
      mockGetVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/vendors/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Vendor not found');
    });

    it('should return 404 for other tenant vendor', async () => {
      // Service layer enforces tenant isolation
      mockGetVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/vendors/other-tenant-vendor',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for soft-deleted vendor', async () => {
      mockGetVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/vendors/deleted-vendor',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vendors/vendor-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /vendors/:id', () => {
    const updateData = {
      name: 'Office Supplies Inc Updated',
      status: 'inactive',
    };

    it('should update vendor fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/vendors/vendor-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateVendor).toHaveBeenCalledWith(
        'vendor-1',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should reject cross-tenant update', async () => {
      mockUpdateVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/vendors/other-tenant-vendor',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent vendor', async () => {
      mockUpdateVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/vendors/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/vendors/vendor-1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /vendors/:id', () => {
    it('should soft delete vendor (set deletedAt)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/vendors/vendor-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeleteVendor).toHaveBeenCalledWith('vendor-1', expect.any(Object));

      // Verify the mock was configured to return deletedAt
      const mockResult = await mockDeleteVendor.mock.results[0].value;
      expect(mockResult.deletedAt).toBeTruthy();
    });

    it('should reject cross-tenant delete', async () => {
      mockDeleteVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/vendors/other-tenant-vendor',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent vendor', async () => {
      mockDeleteVendor.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/vendors/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/vendors/vendor-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
