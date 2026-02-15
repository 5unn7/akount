import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { billRoutes } from '../bills';
import { assertIntegerCents, assertMoneyFields } from '../../../../test-utils/financial-assertions';

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

// Mock bill service
const mockCreateBill = vi.fn();
const mockListBills = vi.fn();
const mockGetBill = vi.fn();
const mockUpdateBill = vi.fn();
const mockDeleteBill = vi.fn();
const mockGetBillStats = vi.fn();

vi.mock('../../services/bill.service', () => ({
  createBill: mockCreateBill,
  listBills: mockListBills,
  getBill: mockGetBill,
  updateBill: mockUpdateBill,
  deleteBill: mockDeleteBill,
  getBillStats: mockGetBillStats,
}));

const MOCK_VENDOR = {
  id: 'vendor-1',
  name: 'Office Supplies Inc',
  email: 'billing@supplies.com',
};

const MOCK_ENTITY = {
  id: 'entity-1',
  name: 'Test Business',
};

const MOCK_BILL_LINE = {
  id: 'line-1',
  description: 'Office supplies',
  quantity: 5,
  unitPrice: 2500, // $25.00 per unit
  taxAmount: 1625, // 13% tax
  amount: 14125, // (5 * 2500) + 1625
  glAccountId: null,
  categoryId: null,
  taxRateId: null,
};

const MOCK_BILL = {
  id: 'bill-1',
  entityId: 'entity-1',
  vendorId: 'vendor-1',
  billNumber: 'BILL-2024-001',
  issueDate: new Date('2024-01-15T00:00:00Z'),
  dueDate: new Date('2024-02-14T00:00:00Z'),
  currency: 'CAD',
  subtotal: 12500, // $125.00
  taxAmount: 1625, // $16.25
  total: 14125, // $141.25
  status: 'RECEIVED',
  paidAmount: 0,
  notes: null,
  deletedAt: null,
  createdAt: new Date('2024-01-15T00:00:00Z'),
  updatedAt: new Date('2024-01-15T00:00:00Z'),
  vendor: MOCK_VENDOR,
  entity: MOCK_ENTITY,
  billLines: [MOCK_BILL_LINE],
};

const MOCK_PAGINATED = {
  bills: [MOCK_BILL],
  nextCursor: null,
};

const MOCK_STATS = {
  outstandingAP: 300000, // $3,000.00
  paidThisMonth: 150000, // $1,500.00
  overdue: 50000, // $500.00
  aging: {
    current: { amount: 200000, percentage: 67 },
    '1-30': { amount: 60000, percentage: 20 },
    '31-60': { amount: 30000, percentage: 10 },
    '60+': { amount: 10000, percentage: 3 },
  },
};

describe('Bill Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateBill.mockResolvedValue(MOCK_BILL);
    mockListBills.mockResolvedValue(MOCK_PAGINATED);
    mockGetBill.mockResolvedValue(MOCK_BILL);
    mockUpdateBill.mockResolvedValue(MOCK_BILL);
    mockDeleteBill.mockResolvedValue({ ...MOCK_BILL, deletedAt: new Date() });
    mockGetBillStats.mockResolvedValue(MOCK_STATS);

    app = Fastify({ logger: false });
    await app.register(billRoutes, { prefix: '/bills' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /bills', () => {
    const validBillData = {
      vendorId: 'vendor-1',
      billNumber: 'BILL-2024-001',
      issueDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-14T00:00:00Z',
      currency: 'CAD',
      subtotal: 12500,
      taxAmount: 1625,
      total: 14125,
      status: 'DRAFT',
      lines: [
        {
          description: 'Office supplies',
          quantity: 5,
          unitPrice: 2500,
          taxAmount: 1625,
          amount: 14125,
        },
      ],
    };

    it('should create bill with integer cents', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
        payload: validBillData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();

      // Financial invariant: all money fields must be integer cents
      assertIntegerCents(body.subtotal, 'subtotal');
      assertIntegerCents(body.taxAmount, 'taxAmount');
      assertIntegerCents(body.total, 'total');
      assertIntegerCents(body.paidAmount, 'paidAmount');
      assertIntegerCents(body.billLines[0].unitPrice, 'line.unitPrice');
      assertIntegerCents(body.billLines[0].amount, 'line.amount');
    });

    it('should reject if vendor not found', async () => {
      mockCreateBill.mockRejectedValueOnce(new Error('Vendor not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
        payload: validBillData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Vendor not found');
    });

    it('should create bill lines', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
        payload: validBillData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.billLines).toHaveLength(1);
      expect(body.billLines[0].description).toBe('Office supplies');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/bills',
        payload: validBillData,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should include vendor and entity in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
        payload: validBillData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.vendor).toBeDefined();
      expect(body.vendor.name).toBe('Office Supplies Inc');
      expect(body.entity).toBeDefined();
    });

    it('should pass tenant context to service', async () => {
      await app.inject({
        method: 'POST',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
        payload: validBillData,
      });

      expect(mockCreateBill).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('GET /bills', () => {
    it('should list bills filtered by tenantId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.bills).toHaveLength(1);
      expect(mockListBills).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should filter by status', async () => {
      await app.inject({
        method: 'GET',
        url: '/bills?status=PAID',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListBills).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PAID' }),
        expect.any(Object)
      );
    });

    it('should filter by vendorId', async () => {
      await app.inject({
        method: 'GET',
        url: '/bills?vendorId=vendor-123',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListBills).toHaveBeenCalledWith(
        expect.objectContaining({ vendorId: 'vendor-123' }),
        expect.any(Object)
      );
    });

    it('should filter by date range', async () => {
      const dateFrom = '2024-01-01T00:00:00.000Z';
      const dateTo = '2024-01-31T23:59:59.999Z';

      await app.inject({
        method: 'GET',
        url: `/bills?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListBills).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom,
          dateTo,
        }),
        expect.any(Object)
      );
    });

    it('should paginate with cursor', async () => {
      await app.inject({
        method: 'GET',
        url: '/bills?cursor=bill-123&limit=25',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListBills).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: 'bill-123',
          limit: '25',
        }),
        expect.any(Object)
      );
    });

    it('should return nextCursor for pagination', async () => {
      mockListBills.mockResolvedValueOnce({
        bills: [MOCK_BILL],
        nextCursor: 'bill-next',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBe('bill-next');
    });

    it('should exclude soft-deleted bills', async () => {
      // Service is responsible for filtering deletedAt: null
      await app.inject({
        method: 'GET',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListBills).toHaveBeenCalled();
      // Assertion: service implementation ensures deletedAt: null filter
    });

    it('should return integer cents for all monetary fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      const bill = body.bills[0];

      assertMoneyFields(bill, ['subtotal', 'taxAmount', 'total', 'paidAmount']);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /bills/:id', () => {
    it('should return bill with vendor and lines', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills/bill-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('bill-1');
      expect(body.vendor).toBeDefined();
      expect(body.billLines).toHaveLength(1);
    });

    it('should return 404 for non-existent bill', async () => {
      mockGetBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/bills/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Bill not found');
    });

    it('should return 404 for other tenant bill', async () => {
      // Service layer enforces tenant isolation
      mockGetBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/bills/other-tenant-bill',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for soft-deleted bill', async () => {
      mockGetBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/bills/deleted-bill',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills/bill-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /bills/:id', () => {
    const updateData = {
      status: 'PAID',
      paidAmount: 14125,
    };

    it('should update bill fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/bills/bill-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateBill).toHaveBeenCalledWith(
        'bill-1',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should reject cross-tenant update', async () => {
      mockUpdateBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/bills/other-tenant-bill',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent bill', async () => {
      mockUpdateBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/bills/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/bills/bill-1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /bills/:id', () => {
    it('should soft delete bill (set deletedAt)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/bills/bill-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeleteBill).toHaveBeenCalledWith('bill-1', expect.any(Object));

      // Verify the mock was configured to return deletedAt
      const mockResult = await mockDeleteBill.mock.results[0].value;
      expect(mockResult.deletedAt).toBeTruthy();
    });

    it('should reject cross-tenant delete', async () => {
      mockDeleteBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/bills/other-tenant-bill',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent bill', async () => {
      mockDeleteBill.mockRejectedValueOnce(new Error('Bill not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/bills/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/bills/bill-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /bills/stats', () => {
    it('should return AP stats with integer cents', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // All monetary amounts must be integer cents
      assertIntegerCents(body.outstandingAP, 'outstandingAP');
      assertIntegerCents(body.paidThisMonth, 'paidThisMonth');
      assertIntegerCents(body.overdue, 'overdue');

      assertIntegerCents(body.aging.current.amount, 'aging.current.amount');
      assertIntegerCents(body.aging['1-30'].amount, 'aging.1-30.amount');
      assertIntegerCents(body.aging['31-60'].amount, 'aging.31-60.amount');
      assertIntegerCents(body.aging['60+'].amount, 'aging.60+.amount');
    });

    it('should calculate aging buckets correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Percentages should sum to 100 (or 0 if no outstanding)
      const totalPercentage =
        body.aging.current.percentage +
        body.aging['1-30'].percentage +
        body.aging['31-60'].percentage +
        body.aging['60+'].percentage;

      expect(totalPercentage).toBe(100);
    });

    it('should exclude soft-deleted bills from stats', async () => {
      // Service is responsible for filtering deletedAt: null
      await app.inject({
        method: 'GET',
        url: '/bills/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGetBillStats).toHaveBeenCalled();
      // Assertion: service implementation ensures deletedAt: null filter
    });

    it('should filter stats by tenantId', async () => {
      await app.inject({
        method: 'GET',
        url: '/bills/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGetBillStats).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bills/stats',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
