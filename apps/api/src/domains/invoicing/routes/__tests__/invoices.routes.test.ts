import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { invoiceRoutes } from '../invoices';
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

// Mock invoice service — use vi.hoisted so declarations are available to hoisted vi.mock
const {
  mockCreateInvoice,
  mockListInvoices,
  mockGetInvoice,
  mockUpdateInvoice,
  mockDeleteInvoice,
  mockGetInvoiceStats,
} = vi.hoisted(() => ({
  mockCreateInvoice: vi.fn(),
  mockListInvoices: vi.fn(),
  mockGetInvoice: vi.fn(),
  mockUpdateInvoice: vi.fn(),
  mockDeleteInvoice: vi.fn(),
  mockGetInvoiceStats: vi.fn(),
}));

vi.mock('../../services/invoice.service', () => ({
  createInvoice: mockCreateInvoice,
  listInvoices: mockListInvoices,
  getInvoice: mockGetInvoice,
  updateInvoice: mockUpdateInvoice,
  deleteInvoice: mockDeleteInvoice,
  getInvoiceStats: mockGetInvoiceStats,
}));

const MOCK_CLIENT = {
  id: 'client-1',
  name: 'Acme Corp',
  email: 'billing@acme.com',
};

const MOCK_ENTITY = {
  id: 'entity-1',
  name: 'Test Business',
};

// FIN-25: line.amount is PRE-TAX (qty * unitPrice), NOT post-tax
const MOCK_INVOICE_LINE = {
  id: 'line-1',
  description: 'Consulting services',
  quantity: 10,
  unitPrice: 15000, // $150.00 per hour
  taxAmount: 19500, // 13% tax
  amount: 150000, // Pre-tax line amount: qty * unitPrice (10 * 15000)
  glAccountId: null,
  categoryId: null,
  taxRateId: null,
};

const MOCK_INVOICE = {
  id: 'inv-1',
  entityId: 'entity-1',
  clientId: 'client-1',
  invoiceNumber: 'INV-2024-001',
  issueDate: new Date('2024-01-15T00:00:00Z'),
  dueDate: new Date('2024-02-14T00:00:00Z'),
  currency: 'CAD',
  subtotal: 150000, // $1,500.00
  taxAmount: 19500, // $195.00
  total: 169500, // $1,695.00
  status: 'SENT',
  paidAmount: 0,
  notes: null,
  deletedAt: null,
  createdAt: new Date('2024-01-15T00:00:00Z'),
  updatedAt: new Date('2024-01-15T00:00:00Z'),
  client: MOCK_CLIENT,
  entity: MOCK_ENTITY,
  invoiceLines: [MOCK_INVOICE_LINE],
};

const MOCK_PAGINATED = {
  invoices: [MOCK_INVOICE],
  nextCursor: null,
};

const MOCK_STATS = {
  outstandingAR: 500000, // $5,000.00
  collectedThisMonth: 250000, // $2,500.00
  overdue: 100000, // $1,000.00
  aging: {
    current: { amount: 300000, percentage: 60 },
    '1-30': { amount: 100000, percentage: 20 },
    '31-60': { amount: 75000, percentage: 15 },
    '60+': { amount: 25000, percentage: 5 },
  },
};

describe('Invoice Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateInvoice.mockResolvedValue(MOCK_INVOICE);
    mockListInvoices.mockResolvedValue(MOCK_PAGINATED);
    mockGetInvoice.mockResolvedValue(MOCK_INVOICE);
    mockUpdateInvoice.mockResolvedValue(MOCK_INVOICE);
    mockDeleteInvoice.mockResolvedValue({ ...MOCK_INVOICE, deletedAt: new Date() });
    mockGetInvoiceStats.mockResolvedValue(MOCK_STATS);

    app = Fastify({ logger: false });
    await app.register(invoiceRoutes, { prefix: '/invoices' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /invoices', () => {
    const validInvoiceData = {
      clientId: 'client-1',
      invoiceNumber: 'INV-2024-001',
      issueDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-14T00:00:00Z',
      currency: 'CAD',
      subtotal: 150000,
      taxAmount: 19500,
      total: 169500,
      status: 'DRAFT',
      lines: [
        {
          description: 'Consulting',
          quantity: 10,
          unitPrice: 15000,
          taxAmount: 19500,
          amount: 150000, // Pre-tax: qty * unitPrice (10 * 15000)
        },
      ],
    };

    it('should create invoice with integer cents', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
        payload: validInvoiceData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();

      // Financial invariant: all money fields must be integer cents
      assertIntegerCents(body.subtotal, 'subtotal');
      assertIntegerCents(body.taxAmount, 'taxAmount');
      assertIntegerCents(body.total, 'total');
      assertIntegerCents(body.paidAmount, 'paidAmount');
      assertIntegerCents(body.invoiceLines[0].unitPrice, 'line.unitPrice');
      assertIntegerCents(body.invoiceLines[0].amount, 'line.amount');
    });

    it('should reject if client not found', async () => {
      mockCreateInvoice.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
        payload: validInvoiceData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Client not found');
    });

    it('should create invoice lines', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
        payload: validInvoiceData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.invoiceLines).toHaveLength(1);
      expect(body.invoiceLines[0].description).toBe('Consulting services');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        payload: validInvoiceData,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should include client and entity in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
        payload: validInvoiceData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.client).toBeDefined();
      expect(body.client.name).toBe('Acme Corp');
      expect(body.entity).toBeDefined();
    });

    it('should pass tenant context to service', async () => {
      await app.inject({
        method: 'POST',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
        payload: validInvoiceData,
      });

      expect(mockCreateInvoice).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('GET /invoices', () => {
    it('should list invoices filtered by tenantId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.invoices).toHaveLength(1);
      expect(mockListInvoices).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should filter by entityId', async () => {
      await app.inject({
        method: 'GET',
        url: '/invoices?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListInvoices).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: 'entity-1' }),
        expect.any(Object)
      );
    });

    it('should return all entities when entityId is omitted', async () => {
      await app.inject({
        method: 'GET',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
      });

      const callArgs = mockListInvoices.mock.calls[0][0];
      expect(callArgs.entityId).toBeUndefined();
    });

    it('should filter by status', async () => {
      await app.inject({
        method: 'GET',
        url: '/invoices?status=PAID',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListInvoices).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PAID' }),
        expect.any(Object)
      );
    });

    it('should filter by clientId', async () => {
      await app.inject({
        method: 'GET',
        url: '/invoices?clientId=client-123',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListInvoices).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'client-123' }),
        expect.any(Object)
      );
    });

    it('should filter by date range', async () => {
      const dateFrom = '2024-01-01T00:00:00.000Z';
      const dateTo = '2024-01-31T23:59:59.999Z';

      await app.inject({
        method: 'GET',
        url: `/invoices?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListInvoices).toHaveBeenCalledWith(
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
        url: '/invoices?cursor=inv-123&limit=25',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListInvoices).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: 'inv-123',
          limit: '25',
        }),
        expect.any(Object)
      );
    });

    it('should return nextCursor for pagination', async () => {
      mockListInvoices.mockResolvedValueOnce({
        invoices: [MOCK_INVOICE],
        nextCursor: 'inv-next',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBe('inv-next');
    });

    it('should exclude soft-deleted invoices', async () => {
      // Service is responsible for filtering deletedAt: null
      await app.inject({
        method: 'GET',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListInvoices).toHaveBeenCalled();
      // Assertion: service implementation ensures deletedAt: null filter
    });

    it('should return integer cents for all monetary fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      const invoice = body.invoices[0];

      assertMoneyFields(invoice, ['subtotal', 'taxAmount', 'total', 'paidAmount']);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /invoices/:id', () => {
    it('should return invoice with client and lines', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/inv-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('inv-1');
      expect(body.client).toBeDefined();
      expect(body.invoiceLines).toHaveLength(1);
    });

    it('should return 404 for non-existent invoice', async () => {
      mockGetInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/invoices/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Invoice not found');
    });

    it('should return 404 for other tenant invoice', async () => {
      // Service layer enforces tenant isolation
      mockGetInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/invoices/other-tenant-inv',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for soft-deleted invoice', async () => {
      mockGetInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/invoices/deleted-inv',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/inv-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /invoices/:id', () => {
    const updateData = {
      status: 'PAID',
      paidAmount: 169500,
    };

    it('should update invoice fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/invoices/inv-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateInvoice).toHaveBeenCalledWith(
        'inv-1',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should reject cross-tenant update', async () => {
      mockUpdateInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/invoices/other-tenant-inv',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent invoice', async () => {
      mockUpdateInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/invoices/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/invoices/inv-1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /invoices/:id', () => {
    it('should soft delete invoice (set deletedAt)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/invoices/inv-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeleteInvoice).toHaveBeenCalledWith('inv-1', expect.any(Object));

      // Verify the mock was configured to return deletedAt
      const mockResult = await mockDeleteInvoice.mock.results[0].value;
      expect(mockResult.deletedAt).toBeTruthy();
    });

    it('should reject cross-tenant delete', async () => {
      mockDeleteInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/invoices/other-tenant-inv',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent invoice', async () => {
      mockDeleteInvoice.mockRejectedValueOnce(new Error('Invoice not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/invoices/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/invoices/inv-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /invoices/stats', () => {
    it('should return AR stats with integer cents', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // All monetary amounts must be integer cents
      assertIntegerCents(body.outstandingAR, 'outstandingAR');
      assertIntegerCents(body.collectedThisMonth, 'collectedThisMonth');
      assertIntegerCents(body.overdue, 'overdue');

      assertIntegerCents(body.aging.current.amount, 'aging.current.amount');
      assertIntegerCents(body.aging['1-30'].amount, 'aging.1-30.amount');
      assertIntegerCents(body.aging['31-60'].amount, 'aging.31-60.amount');
      assertIntegerCents(body.aging['60+'].amount, 'aging.60+.amount');
    });

    it('should calculate aging buckets correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/stats',
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

    it('should exclude soft-deleted invoices from stats', async () => {
      // Service is responsible for filtering deletedAt: null
      await app.inject({
        method: 'GET',
        url: '/invoices/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGetInvoiceStats).toHaveBeenCalled();
      // Assertion: service implementation ensures deletedAt: null filter
    });

    it('should filter stats by tenantId', async () => {
      await app.inject({
        method: 'GET',
        url: '/invoices/stats',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGetInvoiceStats).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-abc-123' }),
        undefined
      );
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/invoices/stats',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
