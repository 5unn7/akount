/**
 * Service Test Template
 *
 * Copy this template when creating new service tests.
 * Replace "Resource" / "resource" with your model name.
 *
 * Uses:
 *   - mockPrisma singleton for Prisma mocking
 *   - mockResource() from mock-factories for model shapes
 *   - mockResourceInput() from input-factories for validated API inputs
 *   - TEST_IDS for consistent tenant/entity IDs
 *   - rewirePrismaMock() to re-wire $transaction after clearAllMocks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrisma,
  rewirePrismaMock,
  TEST_IDS,
  // Import Prisma model mock (for mocking query responses)
  // mockResource,
  // Import Zod input factory (for validated creation data)
  // mockResourceInput,
} from '../../../../test-utils';

// Dynamic import inside factory bypasses vi.mock hoisting constraint.
// See: apps/api/src/test-utils/ARCHITECTURE.md
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Import service under test AFTER vi.mock (hoisting ensures correct order)
// import { ResourceService } from '../resource.service';

// Standard tenant context for all tests
const CTX = {
  tenantId: TEST_IDS.TENANT_ID,
  userId: TEST_IDS.USER_ID,
  role: 'OWNER' as const,
};

describe('ResourceService', () => {
  // let service: ResourceService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock(); // Re-wires $transaction after clearAllMocks
    // service = new ResourceService();
  });

  // =========================================================================
  // List
  // =========================================================================

  describe('listResources', () => {
    it('should list resources for tenant', async () => {
      // Arrange
      // const resources = [mockResource(), mockResource({ id: 'res-2' })];
      // mockPrisma.resource.findMany.mockResolvedValueOnce(resources);

      // Act
      // const result = await service.listResources(CTX);

      // Assert
      // expect(result).toHaveLength(2);
      // expect(mockPrisma.resource.findMany).toHaveBeenCalledWith(
      //   expect.objectContaining({
      //     where: expect.objectContaining({
      //       entity: { tenantId: CTX.tenantId },
      //     }),
      //   }),
      // );
    });
  });

  // =========================================================================
  // Create
  // =========================================================================

  describe('createResource', () => {
    it('should create resource with valid input', async () => {
      // Arrange — use Zod input factory for validated data
      // const input = mockResourceInput({ name: 'Test' });
      // const created = mockResource({ name: input.name });
      // mockPrisma.resource.create.mockResolvedValueOnce(created);

      // Act
      // const result = await service.createResource(input, CTX);

      // Assert
      // expect(result.name).toBe('Test');
      // expect(mockPrisma.resource.create).toHaveBeenCalledWith(
      //   expect.objectContaining({
      //     data: expect.objectContaining({ name: 'Test' }),
      //   }),
      // );
    });
  });

  // =========================================================================
  // Get by ID
  // =========================================================================

  describe('getResource', () => {
    it('should return resource by ID', async () => {
      // const resource = mockResource();
      // mockPrisma.resource.findFirst.mockResolvedValueOnce(resource);
      // const result = await service.getResource('res-1', CTX);
      // expect(result).toEqual(resource);
    });

    it('should return null for wrong tenant (isolation test)', async () => {
      // mockPrisma.resource.findFirst.mockResolvedValueOnce(null);
      // const result = await service.getResource('other-id', CTX);
      // expect(result).toBeNull();
    });
  });

  // =========================================================================
  // Delete (Soft Delete)
  // =========================================================================

  describe('deleteResource', () => {
    it('should soft delete resource', async () => {
      // const existing = mockResource();
      // mockPrisma.resource.findFirst.mockResolvedValueOnce(existing);
      // const deleted = mockResource({ deletedAt: new Date() });
      // mockPrisma.resource.update.mockResolvedValueOnce(deleted);

      // await service.deleteResource('res-1', CTX);

      // expect(mockPrisma.resource.update).toHaveBeenCalledWith(
      //   expect.objectContaining({
      //     data: { deletedAt: expect.any(Date) },
      //   }),
      // );
    });
  });
});
