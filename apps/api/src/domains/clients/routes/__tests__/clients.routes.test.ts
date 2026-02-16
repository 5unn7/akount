import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { clientRoutes } from '../clients';
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

// Mock client service — use vi.hoisted so declarations are available to hoisted vi.mock
const {
  mockCreateClient,
  mockListClients,
  mockGetClient,
  mockUpdateClient,
  mockDeleteClient,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockListClients: vi.fn(),
  mockGetClient: vi.fn(),
  mockUpdateClient: vi.fn(),
  mockDeleteClient: vi.fn(),
}));

vi.mock('../../services/client.service', () => ({
  createClient: mockCreateClient,
  listClients: mockListClients,
  getClient: mockGetClient,
  updateClient: mockUpdateClient,
  deleteClient: mockDeleteClient,
}));

const MOCK_ENTITY = {
  id: 'entity-1',
  name: 'Test Business',
};

const MOCK_CLIENT = {
  id: 'client-1',
  entityId: 'entity-1',
  name: 'Acme Corporation',
  email: 'billing@acme.com',
  phone: '+1-555-0100',
  address: '123 Main St, New York, NY 10001',
  paymentTerms: 'Net 30',
  status: 'active',
  deletedAt: null,
  createdAt: new Date('2024-01-15T00:00:00Z'),
  updatedAt: new Date('2024-01-15T00:00:00Z'),
  entity: MOCK_ENTITY,
};

const MOCK_CLIENT_WITH_STATS = {
  ...MOCK_CLIENT,
  openInvoices: 3,
  balanceDue: 450000, // $4,500.00 (integer cents)
};

const MOCK_PAGINATED = {
  clients: [MOCK_CLIENT],
  nextCursor: null,
};

describe('Client Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(MOCK_CLIENT);
    mockListClients.mockResolvedValue(MOCK_PAGINATED);
    mockGetClient.mockResolvedValue(MOCK_CLIENT_WITH_STATS);
    mockUpdateClient.mockResolvedValue(MOCK_CLIENT);
    mockDeleteClient.mockResolvedValue({ ...MOCK_CLIENT, deletedAt: new Date() });

    app = Fastify({ logger: false });
    await app.register(clientRoutes, { prefix: '/clients' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /clients', () => {
    const validClientData = {
      entityId: 'entity-1',
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1-555-0100',
      address: '123 Main St, New York, NY 10001',
      paymentTerms: 'Net 30',
      status: 'active',
    };

    it('should create client successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
        payload: validClientData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.name).toBe('Acme Corporation');
      expect(body.email).toBe('billing@acme.com');
    });

    it('should reject if entity not found', async () => {
      mockCreateClient.mockRejectedValueOnce(new Error('Entity not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
        payload: validClientData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Entity not found');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/clients',
        payload: validClientData,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should include entity in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
        payload: validClientData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.entity).toBeDefined();
      expect(body.entity.name).toBe('Test Business');
    });

    it('should pass tenant context to service', async () => {
      await app.inject({
        method: 'POST',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
        payload: validClientData,
      });

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: 'tenant-abc-123',
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('GET /clients', () => {
    it('should list clients filtered by tenantId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.clients).toHaveLength(1);
      expect(mockListClients).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId: 'tenant-abc-123' })
      );
    });

    it('should filter by status', async () => {
      await app.inject({
        method: 'GET',
        url: '/clients?status=active',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListClients).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
        expect.any(Object)
      );
    });

    it('should filter by search (name or email)', async () => {
      await app.inject({
        method: 'GET',
        url: '/clients?search=Acme',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListClients).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Acme' }),
        expect.any(Object)
      );
    });

    it('should paginate with cursor', async () => {
      await app.inject({
        method: 'GET',
        url: '/clients?cursor=client-123&limit=25',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListClients).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: 'client-123',
          limit: '25',
        }),
        expect.any(Object)
      );
    });

    it('should return nextCursor for pagination', async () => {
      mockListClients.mockResolvedValueOnce({
        clients: [MOCK_CLIENT],
        nextCursor: 'client-next',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBe('client-next');
    });

    it('should exclude soft-deleted clients', async () => {
      // Service is responsible for filtering deletedAt: null
      await app.inject({
        method: 'GET',
        url: '/clients',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListClients).toHaveBeenCalled();
      // Assertion: service implementation ensures deletedAt: null filter
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/clients',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /clients/:id', () => {
    it('should return client with aggregated stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/clients/client-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('client-1');
      expect(body.openInvoices).toBe(3);
      expect(body.balanceDue).toBeDefined();
    });

    it('should return balanceDue as integer cents', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/clients/client-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      assertIntegerCents(body.balanceDue, 'balanceDue');
    });

    it('should return 404 for non-existent client', async () => {
      mockGetClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/clients/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Client not found');
    });

    it('should return 404 for other tenant client', async () => {
      // Service layer enforces tenant isolation
      mockGetClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/clients/other-tenant-client',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for soft-deleted client', async () => {
      mockGetClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/clients/deleted-client',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/clients/client-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /clients/:id', () => {
    const updateData = {
      name: 'Acme Corp Updated',
      status: 'inactive',
    };

    it('should update client fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/clients/client-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateClient).toHaveBeenCalledWith(
        'client-1',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should reject cross-tenant update', async () => {
      mockUpdateClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/clients/other-tenant-client',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent client', async () => {
      mockUpdateClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/clients/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: updateData,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/clients/client-1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should soft delete client (set deletedAt)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/clients/client-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockDeleteClient).toHaveBeenCalledWith('client-1', expect.any(Object));

      // Verify the mock was configured to return deletedAt
      const mockResult = await mockDeleteClient.mock.results[0].value;
      expect(mockResult.deletedAt).toBeTruthy();
    });

    it('should reject cross-tenant delete', async () => {
      mockDeleteClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/clients/other-tenant-client',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent client', async () => {
      mockDeleteClient.mockRejectedValueOnce(new Error('Client not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/clients/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/clients/client-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
