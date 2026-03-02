import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { entityManagementRoutes } from '../entities';

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

// Mock RBAC middleware
vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

// Mock validation middleware
vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// Mock withPermission — entities.ts uses withPermission for RBAC
vi.mock('../../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async (request: any) => {
      request.userId = 'test-user-id';
      request.tenantId = 'tenant-abc-123';
      request.tenantRole = 'OWNER';
    },
  })),
}));

// Mock EntityService — class-based, vi.hoisted for declaration hoisting
const {
  mockListEntities,
  mockGetEntityDetail,
  mockCreateEntity,
  mockUpdateEntity,
  mockArchiveEntity,
  mockEntityServiceConstructor,
} = vi.hoisted(() => ({
  mockListEntities: vi.fn(),
  mockGetEntityDetail: vi.fn(),
  mockCreateEntity: vi.fn(),
  mockUpdateEntity: vi.fn(),
  mockArchiveEntity: vi.fn(),
  mockEntityServiceConstructor: vi.fn(),
}));

vi.mock('../../services/entity.service', () => ({
  EntityService: function (this: any, tenantId: string, userId: string) {
    mockEntityServiceConstructor(tenantId, userId);
    this.listEntities = mockListEntities;
    this.getEntityDetail = mockGetEntityDetail;
    this.createEntity = mockCreateEntity;
    this.updateEntity = mockUpdateEntity;
    this.archiveEntity = mockArchiveEntity;
  },
}));

// Mock validateTaxId
const { mockValidateTaxId } = vi.hoisted(() => ({
  mockValidateTaxId: vi.fn(),
}));

vi.mock('../../../../lib/validators/tax-id', () => ({
  validateTaxId: mockValidateTaxId,
}));

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ENTITY = {
  id: 'entity-1',
  name: 'Acme Corp',
  type: 'CORPORATION',
  country: 'CA',
  functionalCurrency: 'CAD',
  fiscalYearEnd: 12,
  status: 'ACTIVE',
  taxId: '123456789',
  registrationDate: new Date('2020-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_ENTITY_DETAIL = {
  ...MOCK_ENTITY,
  _count: { clients: 5, vendors: 3, invoices: 12, accounts: 4 },
};

const MOCK_CREATED_ENTITY = {
  id: 'entity-new',
  name: 'New Business',
  type: 'SOLE_PROPRIETORSHIP',
  country: 'US',
  functionalCurrency: 'USD',
  status: 'ACTIVE',
  taxId: '12-3456789',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_UPDATED_ENTITY = {
  ...MOCK_ENTITY,
  name: 'Acme Corp Updated',
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Entity Management Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default happy-path mocks
    mockListEntities.mockResolvedValue([MOCK_ENTITY]);
    mockGetEntityDetail.mockResolvedValue(MOCK_ENTITY_DETAIL);
    mockCreateEntity.mockResolvedValue(MOCK_CREATED_ENTITY);
    mockUpdateEntity.mockResolvedValue(MOCK_UPDATED_ENTITY);
    mockArchiveEntity.mockResolvedValue({ success: true });
    mockValidateTaxId.mockReturnValue({ valid: true, formatted: '123456789' });

    app = Fastify({ logger: false });
    await app.register(entityManagementRoutes, { prefix: '/entities' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // =========================================================================
  // GET / (list entities)
  // =========================================================================

  describe('GET /entities', () => {
    it('should list entities and return 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.entities).toHaveLength(1);
      expect(body.entities[0].name).toBe('Acme Corp');
    });

    it('should pass status filter from query params', async () => {
      await app.inject({
        method: 'GET',
        url: '/entities?status=ARCHIVED',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListEntities).toHaveBeenCalledWith({ status: 'ARCHIVED' });
    });

    it('should return 200 with empty entities array', async () => {
      mockListEntities.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.entities).toEqual([]);
    });

    it('should call listEntities without filter when no status param', async () => {
      await app.inject({
        method: 'GET',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListEntities).toHaveBeenCalledWith(undefined);
    });

    it('should handle service error with 500', async () => {
      mockListEntities.mockRejectedValueOnce(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to fetch entities');
    });
  });

  // =========================================================================
  // GET /:id (entity detail)
  // =========================================================================

  describe('GET /entities/:id', () => {
    it('should return entity with counts and 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('entity-1');
      expect(body.name).toBe('Acme Corp');
      expect(body._count).toBeDefined();
      expect(body._count.clients).toBe(5);
      expect(body._count.vendors).toBe(3);
      expect(body._count.invoices).toBe(12);
      expect(body._count.accounts).toBe(4);
    });

    it('should return 404 when entity not found', async () => {
      mockGetEntityDetail.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Entity not found');
    });

    it('should return 400 for invalid entity ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/entities/not-a-cuid',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('Validation Error');
      expect(body.message).toBe('Invalid entity ID');
    });

    it('should handle service error with 500', async () => {
      mockGetEntityDetail.mockRejectedValueOnce(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to fetch entity');
    });
  });

  // =========================================================================
  // POST / (create entity)
  // =========================================================================

  describe('POST /entities', () => {
    const validCreateData = {
      name: 'New Business',
      type: 'SOLE_PROPRIETORSHIP',
      country: 'US',
      currency: 'USD',
      fiscalYearStart: 1,
      taxId: '123456789',
    };

    it('should create entity and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: validCreateData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBe('entity-new');
      expect(body.name).toBe('New Business');
      expect(body.type).toBe('SOLE_PROPRIETORSHIP');
      expect(body.status).toBe('ACTIVE');
      expect(body.currency).toBe('USD');
      expect(body.country).toBe('US');
    });

    it('should include taxIdWarning when tax ID format is invalid', async () => {
      mockValidateTaxId.mockReturnValueOnce({
        valid: false,
        formatted: '123456789',
        error: 'Invalid tax ID format. Expected: EIN: XX-XXXXXXX',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: validCreateData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.taxIdWarning).toBe(
        'Invalid tax ID format. Expected: EIN: XX-XXXXXXX'
      );
    });

    it('should not include taxIdWarning when tax ID is valid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: validCreateData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.taxIdWarning).toBeUndefined();
    });

    it('should pass correct fields to service.createEntity', async () => {
      const fullData = {
        name: 'New Business',
        type: 'SOLE_PROPRIETORSHIP',
        country: 'US',
        currency: 'USD',
        fiscalYearStart: 3,
        entitySubType: 'freelancer',
        taxId: '123456789',
        address: '100 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
      };

      await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: fullData,
      });

      expect(mockCreateEntity).toHaveBeenCalledWith('test-user-id', {
        name: 'New Business',
        type: 'SOLE_PROPRIETORSHIP',
        country: 'US',
        functionalCurrency: 'USD',
        fiscalYearStart: 3,
        entitySubType: 'freelancer',
        taxId: '123456789',
        address: '100 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
      });
    });

    it('should use formatted tax ID from validator', async () => {
      mockValidateTaxId.mockReturnValueOnce({
        valid: true,
        formatted: '12-3456789',
      });

      await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: validCreateData,
      });

      // The formatted tax ID should be passed to createEntity
      expect(mockCreateEntity).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ taxId: '12-3456789' })
      );
    });

    it('should not call validateTaxId when taxId is not provided', async () => {
      const dataWithoutTaxId = {
        name: 'No Tax ID Corp',
        type: 'CORPORATION',
        country: 'CA',
        currency: 'CAD',
      };

      await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: dataWithoutTaxId,
      });

      expect(mockValidateTaxId).not.toHaveBeenCalled();
    });

    it('should handle service error with 500', async () => {
      mockCreateEntity.mockRejectedValueOnce(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: validCreateData,
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to create entity');
    });
  });

  // =========================================================================
  // PATCH /:id (update entity)
  // =========================================================================

  describe('PATCH /entities/:id', () => {
    const validUpdateData = {
      name: 'Acme Corp Updated',
    };

    it('should update entity and return 200', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: validUpdateData,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Acme Corp Updated');
    });

    it('should return 404 when entity not found (updateEntity returns null)', async () => {
      mockUpdateEntity.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: validUpdateData,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Entity not found');
    });

    it('should return 400 for invalid entity ID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/entities/not-a-cuid',
        headers: { authorization: 'Bearer test-token' },
        payload: validUpdateData,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('Validation Error');
      expect(body.message).toBe('Invalid entity ID');
    });

    it('should validate tax ID against existing entity country', async () => {
      const updateWithTaxId = { taxId: '999888777' };

      await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: updateWithTaxId,
      });

      // Route fetches entity detail to get country, then validates
      expect(mockGetEntityDetail).toHaveBeenCalled();
      expect(mockValidateTaxId).toHaveBeenCalledWith('CA', '999888777');
    });

    it('should return 404 when entity not found during tax ID validation', async () => {
      mockGetEntityDetail.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: { taxId: '999888777' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Entity not found');
    });

    it('should include taxIdWarning in response when tax ID is invalid', async () => {
      mockValidateTaxId.mockReturnValueOnce({
        valid: false,
        formatted: '999888777',
        error: 'Invalid tax ID format. Expected: BN: 9 digits',
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: { taxId: '999888777' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.taxIdWarning).toBe(
        'Invalid tax ID format. Expected: BN: 9 digits'
      );
    });

    it('should convert registrationDate string to Date', async () => {
      const updateWithDate = {
        registrationDate: '2020-06-15T00:00:00.000Z',
      };

      await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: updateWithDate,
      });

      expect(mockUpdateEntity).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          registrationDate: expect.any(Date),
        })
      );

      // Verify the actual Date value
      const callArgs = mockUpdateEntity.mock.calls[0][1];
      expect(callArgs.registrationDate).toEqual(
        new Date('2020-06-15T00:00:00.000Z')
      );
    });

    it('should not call validateTaxId when taxId is not in update payload', async () => {
      await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Just a name update' },
      });

      expect(mockValidateTaxId).not.toHaveBeenCalled();
    });

    it('should handle service error with 500', async () => {
      mockUpdateEntity.mockRejectedValueOnce(new Error('Database error'));

      const response = await app.inject({
        method: 'PATCH',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: validUpdateData,
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to update entity');
    });
  });

  // =========================================================================
  // POST /:id/archive
  // =========================================================================

  describe('POST /entities/:id/archive', () => {
    it('should archive entity and return success', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx/archive',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Entity archived successfully');
    });

    it('should return 409 with blockers when archival is blocked', async () => {
      mockArchiveEntity.mockResolvedValueOnce({
        success: false,
        error: 'Cannot archive entity with active data',
        blockers: [
          'Settle or transfer 2 active accounts before archiving',
          'Close or void 3 outstanding invoices before archiving',
        ],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx/archive',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(409);
      const body = response.json();
      expect(body.error).toBe('Conflict');
      expect(body.message).toBe('Cannot archive entity with active data');
      expect(body.blockers).toHaveLength(2);
      expect(body.blockers[0]).toContain('active accounts');
      expect(body.blockers[1]).toContain('outstanding invoices');
    });

    it('should return 409 when entity not found or already archived', async () => {
      mockArchiveEntity.mockResolvedValueOnce({
        success: false,
        error: 'Entity not found or already archived',
        blockers: [],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx/archive',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(409);
      const body = response.json();
      expect(body.error).toBe('Conflict');
      expect(body.message).toBe('Entity not found or already archived');
    });

    it('should handle invalid entity ID with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/entities/not-a-cuid/archive',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('Validation Error');
      expect(body.message).toBe('Invalid entity ID');
    });

    it('should pass correct entity ID to archiveEntity', async () => {
      await app.inject({
        method: 'POST',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx/archive',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockArchiveEntity).toHaveBeenCalledWith(
        'clxxxxxxxxxxxxxxxxxxxxxxxxx'
      );
    });

    it('should handle service error with 500', async () => {
      mockArchiveEntity.mockRejectedValueOnce(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/entities/clxxxxxxxxxxxxxxxxxxxxxxxxx/archive',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to archive entity');
    });
  });

  // =========================================================================
  // Tenant Isolation
  // =========================================================================

  describe('Tenant Isolation', () => {
    it('should create EntityService with correct tenantId and userId', async () => {
      await app.inject({
        method: 'GET',
        url: '/entities',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockEntityServiceConstructor).toHaveBeenCalledWith(
        'tenant-abc-123',
        'test-user-id'
      );
    });
  });
});
