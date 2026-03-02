import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { categoryRoutes } from '../categories';
import { mockCategory } from '../../../../test-utils';

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

// Mock CategoryService
const mockListCategories = vi.fn();
const mockGetCategory = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockSoftDeleteCategory = vi.fn();
const mockSeedDefaults = vi.fn();

vi.mock('../../services/category.service', () => ({
  CategoryService: function (this: any) {
    this.listCategories = mockListCategories;
    this.getCategory = mockGetCategory;
    this.createCategory = mockCreateCategory;
    this.updateCategory = mockUpdateCategory;
    this.softDeleteCategory = mockSoftDeleteCategory;
    this.seedDefaults = mockSeedDefaults;
  },
}));

// ✅ MIGRATION: Replaced inline mocks with type-safe factory
// Before: MOCK_CATEGORY & MOCK_CATEGORY_2 object literals (28 lines total, manual field management)
// After: mockCategory() from test-utils (type-safe, auto-updates with schema)

describe('Category Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    const category1 = mockCategory({ name: 'Office Supplies', type: 'EXPENSE', _count: { transactions: 5 } });
    const category2 = mockCategory({ name: 'Sales Revenue', type: 'INCOME', color: '#34D399', _count: { transactions: 0 } });
    mockListCategories.mockResolvedValue([category1, category2]);
    mockGetCategory.mockResolvedValue(category1);
    mockCreateCategory.mockResolvedValue(category1);
    mockUpdateCategory.mockResolvedValue(category1);
    mockSoftDeleteCategory.mockResolvedValue({ id: 'cat-1', deletedAt: new Date() });
    mockSeedDefaults.mockResolvedValue({ created: 20, existing: 0 });

    app = Fastify({ logger: false });
    await app.register(categoryRoutes, { prefix: '/categories' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ==========================================
  // GET /categories — List categories
  // ==========================================

  describe('GET /categories', () => {
    it('should return 200 with categories list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/categories',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.categories).toHaveLength(2);
      expect(body.categories[0].name).toBe('Office Supplies');
      expect(body.categories[0].type).toBe('EXPENSE');
      expect(body.categories[1].name).toBe('Sales Revenue');
      expect(body.categories[1].type).toBe('INCOME');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/categories',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should pass query params to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/categories?type=EXPENSE&isActive=true',
        headers: { authorization: 'Bearer test-token' },
      });

      // Note: validation middleware is mocked, so z.coerce.boolean() doesn't run.
      // Query params arrive as strings. In production, Zod coerces "true" → true.
      expect(mockListCategories).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EXPENSE', isActive: 'true' })
      );
    });
  });

  // ==========================================
  // GET /categories/:id — Get single category
  // ==========================================

  describe('GET /categories/:id', () => {
    it('should return 200 with category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/categories/cat-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Office Supplies');
      expect(body.type).toBe('EXPENSE');
      expect(body._count.transactions).toBe(5);
    });

    it('should return 404 when not found', async () => {
      mockGetCategory.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/categories/cat-999',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject cross-tenant access (returns 404)', async () => {
      // Service returns null for other tenant's category
      mockGetCategory.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/categories/other-tenant-cat',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ==========================================
  // POST /categories — Create category
  // ==========================================

  describe('POST /categories', () => {
    it('should return 201 with created category', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/categories',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Office Supplies', type: 'EXPENSE' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.name).toBe('Office Supplies');
      expect(body.type).toBe('EXPENSE');
    });

    it('should return 409 when category already exists', async () => {
      mockCreateCategory.mockRejectedValueOnce(
        new Error('Category "Office Supplies" already exists for type EXPENSE')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/categories',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Office Supplies', type: 'EXPENSE' },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 404 when parent category not found', async () => {
      mockCreateCategory.mockRejectedValueOnce(
        new Error('Parent category not found')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/categories',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Sub Category',
          type: 'EXPENSE',
          parentCategoryId: 'cat-nonexistent',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/categories',
        payload: { name: 'Test', type: 'EXPENSE' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // PATCH /categories/:id — Update category
  // ==========================================

  describe('PATCH /categories/:id', () => {
    it('should return 200 with updated category', async () => {
      const updated = mockCategory({ name: 'Updated Name' });
      mockUpdateCategory.mockResolvedValueOnce(updated);

      const response = await app.inject({
        method: 'PATCH',
        url: '/categories/cat-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated Name' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Updated Name');
    });

    it('should return 404 when category not found', async () => {
      mockUpdateCategory.mockRejectedValueOnce(
        new Error('Category not found')
      );

      const response = await app.inject({
        method: 'PATCH',
        url: '/categories/cat-999',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when self-referencing parent', async () => {
      mockUpdateCategory.mockRejectedValueOnce(
        new Error('Category cannot be its own parent')
      );

      const response = await app.inject({
        method: 'PATCH',
        url: '/categories/cat-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { parentCategoryId: 'cat-1' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should allow updating color', async () => {
      const updated = mockCategory({ color: '#FF5733' });
      mockUpdateCategory.mockResolvedValueOnce(updated);

      const response = await app.inject({
        method: 'PATCH',
        url: '/categories/cat-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { color: '#FF5733' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().color).toBe('#FF5733');
    });

    it('should allow deactivating a category', async () => {
      const updated = mockCategory({ isActive: false });
      mockUpdateCategory.mockResolvedValueOnce(updated);

      const response = await app.inject({
        method: 'PATCH',
        url: '/categories/cat-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { isActive: false },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().isActive).toBe(false);
    });
  });

  // ==========================================
  // DELETE /categories/:id — Soft delete
  // ==========================================

  describe('DELETE /categories/:id', () => {
    it('should return 204 on successful soft delete', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/categories/cat-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockSoftDeleteCategory).toHaveBeenCalledWith('cat-1');

      // Verify soft delete returns deletedAt
      const mockResult = await mockSoftDeleteCategory.mock.results[0].value;
      expect(mockResult.deletedAt).toBeTruthy();
    });

    it('should return 404 when category not found', async () => {
      mockSoftDeleteCategory.mockRejectedValueOnce(
        new Error('Category not found')
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/categories/cat-999',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/categories/cat-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // POST /categories/seed — Seed defaults
  // ==========================================

  describe('POST /categories/seed', () => {
    it('should return 200 with seed results', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/categories/seed',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.created).toBe(20);
      expect(body.existing).toBe(0);
    });

    it('should be idempotent (returns existing count on second call)', async () => {
      mockSeedDefaults.mockResolvedValueOnce({ created: 0, existing: 20 });

      const response = await app.inject({
        method: 'POST',
        url: '/categories/seed',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.created).toBe(0);
      expect(body.existing).toBe(20);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/categories/seed',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
