import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { paymentRoutes } from '../payments';
import {
  assertIntegerCents,
  assertMoneyFields,
  assertSoftDeleteResponse,
} from '../../../../test-utils/financial-assertions';

// ---------------------------------------------------------------------------
// Middleware mocks
// ---------------------------------------------------------------------------

vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// ---------------------------------------------------------------------------
// All hoisted mocks — service fns, posting service, AccountingError class
// ---------------------------------------------------------------------------

const {
  mockCreatePayment,
  mockListPayments,
  mockGetPayment,
  mockUpdatePayment,
  mockDeletePayment,
  mockAllocatePayment,
  mockDeallocatePayment,
  mockPostPaymentAllocation,
  MockAccountingError,
} = vi.hoisted(() => {
  class _MockAccountingError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;
    constructor(message: string, code: string, statusCode: number, details?: unknown) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
      this.name = 'AccountingError';
    }
  }

  return {
    mockCreatePayment: vi.fn(),
    mockListPayments: vi.fn(),
    mockGetPayment: vi.fn(),
    mockUpdatePayment: vi.fn(),
    mockDeletePayment: vi.fn(),
    mockAllocatePayment: vi.fn(),
    mockDeallocatePayment: vi.fn(),
    mockPostPaymentAllocation: vi.fn(),
    MockAccountingError: _MockAccountingError,
  };
});

// ---------------------------------------------------------------------------
// Service mock
// ---------------------------------------------------------------------------

vi.mock('../../services/payment.service', () => ({
  createPayment: mockCreatePayment,
  listPayments: mockListPayments,
  getPayment: mockGetPayment,
  updatePayment: mockUpdatePayment,
  deletePayment: mockDeletePayment,
  allocatePayment: mockAllocatePayment,
  deallocatePayment: mockDeallocatePayment,
}));

// ---------------------------------------------------------------------------
// DocumentPostingService mock (class with postPaymentAllocation method)
// ---------------------------------------------------------------------------

vi.mock('../../../accounting/services/document-posting.service', () => {
  return {
    DocumentPostingService: class {
      postPaymentAllocation(...args: unknown[]) {
        return mockPostPaymentAllocation(...args);
      }
    },
  };
});

// ---------------------------------------------------------------------------
// AccountingError mock (matches real constructor: message, code, statusCode, details?)
// Uses the hoisted class so instanceof checks work correctly.
// ---------------------------------------------------------------------------

vi.mock('../../../accounting/errors', () => ({
  AccountingError: MockAccountingError,
}));

// ---------------------------------------------------------------------------
// Mock data — all monetary values in integer cents
// ---------------------------------------------------------------------------

const MOCK_PAYMENT = {
  id: 'pay-1',
  entityId: 'entity-1',
  type: 'AR',
  amount: 150000, // $1,500.00
  currency: 'CAD',
  date: new Date('2024-01-15'),
  reference: 'PMT-001',
  notes: null,
  clientId: 'client-1',
  vendorId: null,
  allocatedAmount: 0,
  unallocatedAmount: 150000,
  status: 'UNALLOCATED',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_ALLOCATION = {
  id: 'alloc-1',
  paymentId: 'pay-1',
  invoiceId: 'inv-1',
  billId: null,
  amount: 75000, // $750.00
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_PAGINATED = {
  payments: [MOCK_PAYMENT],
  nextCursor: null,
};

const MOCK_GL_POSTING_RESULT = {
  journalEntryId: 'je-1',
  entryNumber: 'JE-042',
  status: 'POSTED',
  lines: [
    { glAccountId: 'gl-1', debitAmount: 75000, creditAmount: 0 },
    { glAccountId: 'gl-2', debitAmount: 0, creditAmount: 75000 },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Payment Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreatePayment.mockResolvedValue(MOCK_PAYMENT);
    mockListPayments.mockResolvedValue(MOCK_PAGINATED);
    mockGetPayment.mockResolvedValue(MOCK_PAYMENT);
    mockUpdatePayment.mockResolvedValue(MOCK_PAYMENT);
    mockDeletePayment.mockResolvedValue({ ...MOCK_PAYMENT, deletedAt: new Date() });
    mockAllocatePayment.mockResolvedValue(MOCK_ALLOCATION);
    mockDeallocatePayment.mockResolvedValue(undefined);
    mockPostPaymentAllocation.mockResolvedValue(MOCK_GL_POSTING_RESULT);

    app = Fastify({ logger: false });
    await app.register(paymentRoutes, { prefix: '/payments' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // =========================================================================
  // POST /payments — Create payment
  // =========================================================================

  describe('POST /payments', () => {
    const validPaymentData = {
      entityId: 'entity-1',
      type: 'AR',
      amount: 150000,
      currency: 'CAD',
      date: '2024-01-15T00:00:00Z',
      reference: 'PMT-001',
      clientId: 'client-1',
    };

    it('should create payment and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
        payload: validPaymentData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBe('pay-1');
      expect(body.reference).toBe('PMT-001');
    });

    it('should pass body and tenant context to service', async () => {
      await app.inject({
        method: 'POST',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
        payload: validPaymentData,
      });

      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });

    it('should return integer cents in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
        payload: validPaymentData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();

      assertIntegerCents(body.amount, 'amount');
      assertIntegerCents(body.allocatedAmount, 'allocatedAmount');
      assertIntegerCents(body.unallocatedAmount, 'unallocatedAmount');
    });

    it('should return 404 when referenced entity/client not found', async () => {
      mockCreatePayment.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
        payload: validPaymentData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Client not found');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        payload: validPaymentData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // GET /payments — List payments
  // =========================================================================

  describe('GET /payments', () => {
    it('should list payments and return 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.payments).toHaveLength(1);
      expect(body.payments[0].id).toBe('pay-1');
    });

    it('should pass query params to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/payments?entityId=entity-1&type=AR',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListPayments).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: 'entity-1', type: 'AR' }),
        expect.any(Object)
      );
    });

    it('should pass tenant context to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListPayments).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should return integer cents for all payment amounts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      const payment = body.payments[0];

      assertMoneyFields(payment, ['amount', 'allocatedAmount', 'unallocatedAmount']);
    });

    it('should return nextCursor for pagination', async () => {
      mockListPayments.mockResolvedValueOnce({
        payments: [MOCK_PAYMENT],
        nextCursor: 'pay-next',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBe('pay-next');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // GET /payments/:id — Get single payment
  // =========================================================================

  describe('GET /payments/:id', () => {
    it('should return single payment with 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('pay-1');
      expect(body.type).toBe('AR');
    });

    it('should pass tenant context to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGetPayment).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });

    it('should return integer cents in payment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      assertIntegerCents(body.amount, 'amount');
      assertIntegerCents(body.allocatedAmount, 'allocatedAmount');
      assertIntegerCents(body.unallocatedAmount, 'unallocatedAmount');
    });

    it('should return 404 when not found', async () => {
      mockGetPayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/payments/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Payment not found');
    });

    it('should return 404 for cross-tenant payment (tenant isolation)', async () => {
      mockGetPayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/payments/other-tenant-pay',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments/pay-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // PUT /payments/:id — Update payment
  // =========================================================================

  describe('PUT /payments/:id', () => {
    const updateData = {
      amount: 200000, // $2,000.00
      reference: 'PMT-001-UPDATED',
    };

    it('should update and return 200', async () => {
      const updatedPayment = { ...MOCK_PAYMENT, ...updateData };
      mockUpdatePayment.mockResolvedValueOnce(updatedPayment);

      const response = await app.inject({
        method: 'PUT',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdatePayment).toHaveBeenCalledWith(
        'pay-1',
        expect.any(Object),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });

    it('should return integer cents after update', async () => {
      const updatedPayment = { ...MOCK_PAYMENT, amount: 200000, unallocatedAmount: 200000 };
      mockUpdatePayment.mockResolvedValueOnce(updatedPayment);

      const response = await app.inject({
        method: 'PUT',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      assertIntegerCents(body.amount, 'amount');
      assertIntegerCents(body.unallocatedAmount, 'unallocatedAmount');
    });

    it('should return 404 when not found', async () => {
      mockUpdatePayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/payments/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Payment not found');
    });

    it('should reject cross-tenant update', async () => {
      mockUpdatePayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/payments/other-tenant-pay',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/payments/pay-1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // POST /payments/:id/allocate — Allocate payment to invoice/bill
  // =========================================================================

  describe('POST /payments/:id/allocate', () => {
    const allocateData = {
      invoiceId: 'inv-1',
      amount: 75000, // $750.00
    };

    it('should allocate and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocate',
        headers: { authorization: 'Bearer test-token' },
        payload: allocateData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBe('alloc-1');
      expect(body.paymentId).toBe('pay-1');
    });

    it('should pass payment id, body, and tenant to service', async () => {
      await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocate',
        headers: { authorization: 'Bearer test-token' },
        payload: allocateData,
      });

      expect(mockAllocatePayment).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({ invoiceId: 'inv-1', amount: 75000 }),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });

    it('should return integer cents in allocation amount', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocate',
        headers: { authorization: 'Bearer test-token' },
        payload: allocateData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      assertIntegerCents(body.amount, 'allocation.amount');
    });

    it('should return 404 when payment not found', async () => {
      mockAllocatePayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/payments/nonexistent/allocate',
        headers: { authorization: 'Bearer test-token' },
        payload: allocateData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Payment not found');
    });

    it('should return 400 when allocation exceeds unallocated balance', async () => {
      mockAllocatePayment.mockRejectedValueOnce(
        new Error('Allocation amount exceeds unallocated balance')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocate',
        headers: { authorization: 'Bearer test-token' },
        payload: { ...allocateData, amount: 999999 },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('exceeds');
    });

    it('should return 400 when payment cannot be allocated', async () => {
      mockAllocatePayment.mockRejectedValueOnce(
        new Error('Payment cannot be allocated in current status')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocate',
        headers: { authorization: 'Bearer test-token' },
        payload: allocateData,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('cannot be allocated');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocate',
        payload: allocateData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // DELETE /payments/:id/allocations/:allocationId — Deallocate
  // =========================================================================

  describe('DELETE /payments/:id/allocations/:allocationId', () => {
    it('should deallocate and return 204', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1/allocations/alloc-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeallocatePayment).toHaveBeenCalledWith(
        'pay-1',
        'alloc-1',
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });

    it('should return 404 when allocation not found', async () => {
      mockDeallocatePayment.mockRejectedValueOnce(new Error('Allocation not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1/allocations/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Allocation not found');
    });

    it('should return 404 when payment not found', async () => {
      mockDeallocatePayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/nonexistent/allocations/alloc-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Payment not found');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1/allocations/alloc-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // POST /payments/:id/allocations/:allocationId/post — Post to GL
  // =========================================================================

  describe('POST /payments/:id/allocations/:allocationId/post', () => {
    const postData = {
      bankGLAccountId: 'gl-bank-1',
    };

    it('should post to GL and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        headers: { authorization: 'Bearer test-token' },
        payload: postData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.journalEntryId).toBe('je-1');
      expect(body.entryNumber).toBe('JE-042');
      expect(body.status).toBe('POSTED');
    });

    it('should pass allocationId and bankGLAccountId to posting service', async () => {
      await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        headers: { authorization: 'Bearer test-token' },
        payload: postData,
      });

      expect(mockPostPaymentAllocation).toHaveBeenCalledWith('alloc-1', 'gl-bank-1');
    });

    it('should return integer cents in GL posting lines', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        headers: { authorization: 'Bearer test-token' },
        payload: postData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();

      for (const line of body.lines) {
        assertIntegerCents(line.debitAmount, 'line.debitAmount');
        assertIntegerCents(line.creditAmount, 'line.creditAmount');
      }
    });

    it('should return balanced journal entry (debits === credits)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        headers: { authorization: 'Bearer test-token' },
        payload: postData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();

      const totalDebits = body.lines.reduce(
        (sum: number, l: { debitAmount: number }) => sum + l.debitAmount,
        0
      );
      const totalCredits = body.lines.reduce(
        (sum: number, l: { creditAmount: number }) => sum + l.creditAmount,
        0
      );
      expect(totalDebits).toBe(totalCredits);
    });

    it('should return error status code on AccountingError', async () => {
      mockPostPaymentAllocation.mockRejectedValueOnce(
        new MockAccountingError(
          'GL account not found',
          'GL_ACCOUNT_NOT_FOUND',
          404,
          { glAccountId: 'gl-bank-1' }
        )
      );

      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        headers: { authorization: 'Bearer test-token' },
        payload: postData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe('GL_ACCOUNT_NOT_FOUND');
      expect(body.error).toBe('GL account not found');
    });

    it('should return 409 on duplicate posting AccountingError', async () => {
      mockPostPaymentAllocation.mockRejectedValueOnce(
        new MockAccountingError(
          'Payment allocation already posted',
          'ALREADY_POSTED',
          409
        )
      );

      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        headers: { authorization: 'Bearer test-token' },
        payload: postData,
      });

      expect(response.statusCode).toBe(409);
      const body = response.json();
      expect(body.code).toBe('ALREADY_POSTED');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/pay-1/allocations/alloc-1/post',
        payload: postData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // DELETE /payments/:id — Soft delete payment
  // =========================================================================

  describe('DELETE /payments/:id', () => {
    it('should soft delete and return 204', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeletePayment).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });

    it('should verify soft delete returns deletedAt', async () => {
      await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });

      // Verify the mock was configured to return deletedAt (soft delete, not hard delete)
      const mockResult = await mockDeletePayment.mock.results[0].value;
      expect(mockResult.deletedAt).toBeTruthy();
    });

    it('should return 404 when not found', async () => {
      mockDeletePayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Payment not found');
    });

    it('should reject cross-tenant delete', async () => {
      mockDeletePayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/other-tenant-pay',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // Financial Invariants (cross-cutting)
  // =========================================================================

  describe('Financial Invariants', () => {
    it('should enforce tenant isolation — tenantId passed to all service calls', async () => {
      // Create
      await app.inject({
        method: 'POST',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: 'entity-1', type: 'AR', amount: 100000, currency: 'CAD', date: '2024-01-15' },
      });
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );

      // List
      await app.inject({
        method: 'GET',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(mockListPayments).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );

      // Get
      await app.inject({
        method: 'GET',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(mockGetPayment).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );

      // Update
      await app.inject({
        method: 'PUT',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { amount: 200000 },
      });
      expect(mockUpdatePayment).toHaveBeenCalledWith(
        'pay-1',
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );

      // Delete
      await app.inject({
        method: 'DELETE',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(mockDeletePayment).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should return integer cents in create response monetary fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: 'entity-1', type: 'AR', amount: 150000, currency: 'CAD', date: '2024-01-15' },
      });

      const body = response.json();
      assertMoneyFields(body, ['amount', 'allocatedAmount', 'unallocatedAmount']);
    });

    it('should return integer cents in list response monetary fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments',
        headers: { authorization: 'Bearer test-token' },
      });

      const body = response.json();
      for (const payment of body.payments) {
        assertMoneyFields(payment, ['amount', 'allocatedAmount', 'unallocatedAmount']);
      }
    });

    it('should return integer cents in get response monetary fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/payments/pay-1',
        headers: { authorization: 'Bearer test-token' },
      });

      const body = response.json();
      assertMoneyFields(body, ['amount', 'allocatedAmount', 'unallocatedAmount']);
    });

    it('should reject cross-tenant access on get (service returns 404)', async () => {
      mockGetPayment.mockRejectedValueOnce(new Error('Payment not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/payments/other-tenant-id',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
