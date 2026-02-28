import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { creditNoteRoutes } from '../credit-notes';
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

// Mock credit note service
const {
  mockCreateCreditNote,
  mockListCreditNotes,
  mockGetCreditNote,
  mockUpdateCreditNote,
  mockDeleteCreditNote,
  mockApproveCreditNote,
  mockApplyCreditNote,
  mockVoidCreditNote,
  mockExportCreditNotesCsv,
} = vi.hoisted(() => ({
  mockCreateCreditNote: vi.fn(),
  mockListCreditNotes: vi.fn(),
  mockGetCreditNote: vi.fn(),
  mockUpdateCreditNote: vi.fn(),
  mockDeleteCreditNote: vi.fn(),
  mockApproveCreditNote: vi.fn(),
  mockApplyCreditNote: vi.fn(),
  mockVoidCreditNote: vi.fn(),
  mockExportCreditNotesCsv: vi.fn(),
}));

vi.mock('../../services/credit-note.service', () => ({
  createCreditNote: mockCreateCreditNote,
  listCreditNotes: mockListCreditNotes,
  getCreditNote: mockGetCreditNote,
  updateCreditNote: mockUpdateCreditNote,
  deleteCreditNote: mockDeleteCreditNote,
  approveCreditNote: mockApproveCreditNote,
  applyCreditNote: mockApplyCreditNote,
  voidCreditNote: mockVoidCreditNote,
  exportCreditNotesCsv: mockExportCreditNotesCsv,
}));

const MOCK_ENTITY = { id: 'entity-1', name: 'Test Corp', tenantId: 'tenant-abc-123' };

const MOCK_CREDIT_NOTE = {
  id: 'cn-1',
  creditNoteNumber: 'CN-001',
  entityId: 'entity-1',
  date: new Date('2026-01-15'),
  currency: 'CAD',
  amount: 50000, // $500.00 in cents
  appliedAmount: 0,
  reason: 'Product return',
  notes: null,
  linkedInvoiceId: null,
  linkedBillId: null,
  status: 'DRAFT',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  entity: MOCK_ENTITY,
  linkedInvoice: null,
  linkedBill: null,
};

const AUTH_HEADERS = { authorization: 'Bearer test-token' };

describe('Credit Note Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    await app.register(creditNoteRoutes, { prefix: '/credit-notes' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // POST /credit-notes
  // --------------------------------------------------------------------------
  describe('POST /credit-notes', () => {
    it('should create a credit note and return 201', async () => {
      mockCreateCreditNote.mockResolvedValueOnce(MOCK_CREDIT_NOTE);

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes',
        headers: AUTH_HEADERS,
        payload: {
          entityId: 'entity-1',
          date: '2026-01-15',
          currency: 'CAD',
          amount: 50000,
          reason: 'Product return',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      assertIntegerCents(body.amount);
      assertIntegerCents(body.appliedAmount);
    });

    it('should return 401 without auth token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes',
        payload: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for entity not found errors', async () => {
      mockCreateCreditNote.mockRejectedValueOnce(new Error('Entity not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes',
        headers: AUTH_HEADERS,
        payload: {
          entityId: 'bad-entity',
          date: '2026-01-15',
          currency: 'CAD',
          amount: 50000,
          reason: 'Test',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // GET /credit-notes
  // --------------------------------------------------------------------------
  describe('GET /credit-notes', () => {
    it('should list credit notes with pagination', async () => {
      mockListCreditNotes.mockResolvedValueOnce({
        creditNotes: [MOCK_CREDIT_NOTE],
        nextCursor: null,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/credit-notes?limit=25',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.creditNotes).toHaveLength(1);
      assertIntegerCents(body.creditNotes[0].amount);
    });

    it('should return 401 without auth token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-notes',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // GET /credit-notes/export
  // --------------------------------------------------------------------------
  describe('GET /credit-notes/export', () => {
    it('should return CSV with correct Content-Type', async () => {
      mockExportCreditNotesCsv.mockResolvedValueOnce(
        'Credit Note Number,Date,Amount\nCN-001,2026-01-15,500.00'
      );

      const response = await app.inject({
        method: 'GET',
        url: '/credit-notes/export',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.body).toContain('CN-001');
    });
  });

  // --------------------------------------------------------------------------
  // GET /credit-notes/:id
  // --------------------------------------------------------------------------
  describe('GET /credit-notes/:id', () => {
    it('should return credit note by ID', async () => {
      mockGetCreditNote.mockResolvedValueOnce(MOCK_CREDIT_NOTE);

      const response = await app.inject({
        method: 'GET',
        url: '/credit-notes/cn-1',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.creditNoteNumber).toBe('CN-001');
      assertIntegerCents(body.amount);
    });

    it('should return 404 for non-existent credit note', async () => {
      mockGetCreditNote.mockRejectedValueOnce(new Error('Credit note not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/credit-notes/cn-999',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // PUT /credit-notes/:id
  // --------------------------------------------------------------------------
  describe('PUT /credit-notes/:id', () => {
    it('should update a DRAFT credit note', async () => {
      mockUpdateCreditNote.mockResolvedValueOnce({
        ...MOCK_CREDIT_NOTE,
        reason: 'Updated reason',
      });

      const response = await app.inject({
        method: 'PUT',
        url: '/credit-notes/cn-1',
        headers: AUTH_HEADERS,
        payload: { reason: 'Updated reason' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().reason).toBe('Updated reason');
    });

    it('should return 400 for non-DRAFT update', async () => {
      mockUpdateCreditNote.mockRejectedValueOnce(
        new Error('Only DRAFT credit notes can be updated')
      );

      const response = await app.inject({
        method: 'PUT',
        url: '/credit-notes/cn-1',
        headers: AUTH_HEADERS,
        payload: { reason: 'Too late' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // POST /credit-notes/:id/approve
  // --------------------------------------------------------------------------
  describe('POST /credit-notes/:id/approve', () => {
    it('should approve a DRAFT credit note', async () => {
      mockApproveCreditNote.mockResolvedValueOnce({
        ...MOCK_CREDIT_NOTE,
        status: 'APPROVED',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes/cn-1/approve',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('APPROVED');
    });

    it('should return 400 for invalid status transition', async () => {
      mockApproveCreditNote.mockRejectedValueOnce(
        new Error('Invalid status transition: APPLIED → APPROVED')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes/cn-1/approve',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // POST /credit-notes/:id/apply
  // --------------------------------------------------------------------------
  describe('POST /credit-notes/:id/apply', () => {
    it('should apply credit note to an invoice', async () => {
      mockApplyCreditNote.mockResolvedValueOnce({
        ...MOCK_CREDIT_NOTE,
        status: 'APPLIED',
        appliedAmount: 50000,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes/cn-1/apply',
        headers: AUTH_HEADERS,
        payload: { invoiceId: 'inv-1', amount: 50000 },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('APPLIED');
      assertIntegerCents(body.appliedAmount);
    });

    it('should return 400 when exceeding remaining credit', async () => {
      mockApplyCreditNote.mockRejectedValueOnce(
        new Error('Application amount 50000 exceeds remaining credit 20000')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes/cn-1/apply',
        headers: AUTH_HEADERS,
        payload: { invoiceId: 'inv-1', amount: 50000 },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // POST /credit-notes/:id/void
  // --------------------------------------------------------------------------
  describe('POST /credit-notes/:id/void', () => {
    it('should void a DRAFT credit note', async () => {
      mockVoidCreditNote.mockResolvedValueOnce({
        ...MOCK_CREDIT_NOTE,
        status: 'VOIDED',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/credit-notes/cn-1/void',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('VOIDED');
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /credit-notes/:id
  // --------------------------------------------------------------------------
  describe('DELETE /credit-notes/:id', () => {
    it('should soft delete a DRAFT credit note', async () => {
      mockDeleteCreditNote.mockResolvedValueOnce({
        ...MOCK_CREDIT_NOTE,
        deletedAt: new Date(),
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/credit-notes/cn-1',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 400 for non-DRAFT deletion', async () => {
      mockDeleteCreditNote.mockRejectedValueOnce(
        new Error('Only DRAFT credit notes can be deleted')
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/credit-notes/cn-1',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/credit-notes/cn-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
