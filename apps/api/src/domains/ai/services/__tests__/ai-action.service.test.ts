import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIActionService } from '../ai-action.service';
import { AIError } from '../../errors';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockCreate = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockGroupBy = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    aIAction: {
      create: (...args: unknown[]) => mockCreate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
    },
  },
  Prisma: {},
}));

const mockExecute = vi.fn();
const mockHandleRejection = vi.fn();

vi.mock('../action-executor.service', () => ({
  ActionExecutorService: function (this: Record<string, unknown>) {
    this.execute = mockExecute;
    this.handleRejection = mockHandleRejection;
  },
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'entity-xyz-456';

function mockAction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-001',
    entityId: ENTITY_ID,
    type: 'JE_DRAFT',
    title: 'AI-drafted JE: Coffee at Starbucks',
    description: null,
    status: 'PENDING',
    confidence: 92,
    priority: 'MEDIUM',
    payload: { journalEntryId: 'je-001', lines: [] },
    aiProvider: 'claude',
    aiModel: null,
    metadata: null,
    reviewedAt: null,
    reviewedBy: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AIActionService', () => {
  let service: AIActionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIActionService(TENANT_ID, ENTITY_ID);
    mockExecute.mockResolvedValue({ success: true, type: 'JE_DRAFT' });
    mockHandleRejection.mockResolvedValue(undefined);
  });

  // -----------------------------------------------------------------------
  // createAction
  // -----------------------------------------------------------------------

  describe('createAction', () => {
    it('should create an action with required fields', async () => {
      mockCreate.mockResolvedValue({ id: 'act-new' });

      const result = await service.createAction({
        entityId: ENTITY_ID,
        type: 'JE_DRAFT',
        title: 'AI-drafted JE: Coffee',
        payload: { journalEntryId: 'je-001' },
      });

      expect(result.id).toBe('act-new');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: ENTITY_ID,
            type: 'JE_DRAFT',
            title: 'AI-drafted JE: Coffee',
            priority: 'MEDIUM', // default
          }),
        })
      );
    });

    it('should set default 30-day expiry', async () => {
      mockCreate.mockResolvedValue({ id: 'act-new' });

      await service.createAction({
        entityId: ENTITY_ID,
        type: 'CATEGORIZATION',
        title: 'Batch categorization',
        payload: { count: 10 },
      });

      const createArgs = mockCreate.mock.calls[0][0];
      const expiresAt = createArgs.data.expiresAt as Date;
      expect(expiresAt).toBeDefined();
      // Should be ~30 days from now
      const daysDiff = (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeGreaterThan(29);
      expect(daysDiff).toBeLessThan(31);
    });

    it('should accept custom priority and confidence', async () => {
      mockCreate.mockResolvedValue({ id: 'act-new' });

      await service.createAction({
        entityId: ENTITY_ID,
        type: 'ALERT',
        title: 'High-value transaction',
        payload: { amount: 500000 },
        priority: 'HIGH',
        confidence: 95,
      });

      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.data.priority).toBe('HIGH');
      expect(createArgs.data.confidence).toBe(95);
    });
  });

  // -----------------------------------------------------------------------
  // listActions
  // -----------------------------------------------------------------------

  describe('listActions', () => {
    it('should list actions with tenant isolation', async () => {
      const actions = [mockAction()];
      mockFindMany.mockResolvedValue(actions);
      mockCount.mockResolvedValue(1);

      const result = await service.listActions({
        entityId: ENTITY_ID,
        tenantId: TENANT_ID,
      });

      expect(result.actions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityId: ENTITY_ID,
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });

    it('should apply status filter', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await service.listActions({
        entityId: ENTITY_ID,
        tenantId: TENANT_ID,
        status: 'PENDING',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      );
    });

    it('should apply type filter', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await service.listActions({
        entityId: ENTITY_ID,
        tenantId: TENANT_ID,
        type: 'JE_DRAFT',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'JE_DRAFT' }),
        })
      );
    });

    it('should use default limit and offset', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await service.listActions({ entityId: ENTITY_ID, tenantId: TENANT_ID });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // getAction
  // -----------------------------------------------------------------------

  describe('getAction', () => {
    it('should return action with tenant isolation', async () => {
      mockFindFirst.mockResolvedValue(mockAction());

      const action = await service.getAction('act-001');

      expect(action.id).toBe('act-001');
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'act-001',
            entityId: ENTITY_ID,
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });

    it('should throw ACTION_NOT_FOUND for missing action', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(service.getAction('act-missing')).rejects.toThrow(AIError);
      await expect(service.getAction('act-missing')).rejects.toThrow('Action not found');
    });

    it('should reject cross-tenant action access', async () => {
      // Mock returns null because action belongs to different tenant
      mockFindFirst.mockResolvedValue(null);

      // Try to access action that exists but belongs to another tenant
      await expect(service.getAction('act-other-tenant')).rejects.toThrow(AIError);
      await expect(service.getAction('act-other-tenant')).rejects.toThrow('Action not found');

      // Verify tenant isolation was enforced in query
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'act-other-tenant',
            entityId: ENTITY_ID,
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // approveAction
  // -----------------------------------------------------------------------

  describe('approveAction', () => {
    it('should approve a PENDING action and execute it', async () => {
      mockFindFirst.mockResolvedValue(mockAction());
      mockUpdate.mockResolvedValue(mockAction({ status: 'APPROVED' }));

      const result = await service.approveAction('act-001', 'user-001');

      expect(result.action.status).toBe('APPROVED');
      expect(result.execution).toBeDefined();
      expect(result.execution?.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            reviewedBy: 'user-001',
          }),
        })
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'act-001', type: 'JE_DRAFT' })
      );
    });

    it('should reject approval of non-PENDING action', async () => {
      mockFindFirst.mockResolvedValue(mockAction({ status: 'APPROVED' }));

      await expect(service.approveAction('act-001', 'user-001')).rejects.toThrow(
        'Cannot approve action in APPROVED status'
      );
    });

    it('should auto-expire and reject approval of expired action', async () => {
      const expired = mockAction({
        expiresAt: new Date(Date.now() - 1000), // expired 1s ago
      });
      mockFindFirst.mockResolvedValue(expired);
      mockUpdate.mockResolvedValue(expired);

      await expect(service.approveAction('act-001', 'user-001')).rejects.toThrow(
        'Action has expired'
      );

      // Should have updated status to EXPIRED
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'EXPIRED' },
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // rejectAction
  // -----------------------------------------------------------------------

  describe('rejectAction', () => {
    it('should reject a PENDING action', async () => {
      mockFindFirst.mockResolvedValue(mockAction());
      mockUpdate.mockResolvedValue(mockAction({ status: 'REJECTED' }));

      const result = await service.rejectAction('act-001', 'user-001');

      expect(result.status).toBe('REJECTED');
    });

    it('should reject rejection of non-PENDING action', async () => {
      mockFindFirst.mockResolvedValue(mockAction({ status: 'REJECTED' }));

      await expect(service.rejectAction('act-001', 'user-001')).rejects.toThrow(
        'Cannot reject action in REJECTED status'
      );
    });
  });

  // -----------------------------------------------------------------------
  // batchApprove
  // -----------------------------------------------------------------------

  describe('batchApprove', () => {
    it('should approve multiple actions and execute them', async () => {
      // PERF-23: Mock findMany (batched query) instead of findFirst
      mockFindMany.mockResolvedValueOnce([
        mockAction({ id: 'act-001' }),
        mockAction({ id: 'act-002' }),
      ]);
      mockUpdateMany.mockResolvedValue({ count: 2 });
      mockExecute.mockResolvedValue({ success: true });

      const result = await service.batchApprove(['act-001', 'act-002'], 'user-001');

      expect(result.succeeded).toEqual(['act-001', 'act-002']);
      expect(result.failed).toHaveLength(0);
      // Executor called for each approved action (in parallel)
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it('should report failed actions (not found or not pending)', async () => {
      // PERF-23: Mock findMany returning only one action
      mockFindMany.mockResolvedValueOnce([
        mockAction({ id: 'act-001' }), // act-001 found & PENDING
        // act-002 not returned (not found or filtered out)
      ]);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.batchApprove(['act-001', 'act-002'], 'user-001');

      expect(result.succeeded).toEqual(['act-001']);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe('act-002');
      expect(result.failed[0].reason).toContain('Not found');
    });

    it('should handle non-pending actions', async () => {
      // PERF-23: Mock findMany with one action having wrong status
      mockFindMany.mockResolvedValueOnce([
        mockAction({ id: 'act-001', status: 'PENDING' }),
        mockAction({ id: 'act-002', status: 'APPROVED' }), // Already approved
      ]);
      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockExecute.mockResolvedValue({ success: true });

      const result = await service.batchApprove(['act-001', 'act-002'], 'user-001');

      expect(result.succeeded).toEqual(['act-001']);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe('act-002');
      expect(result.failed[0].reason).toBe('Not pending');
    });
  });

  // -----------------------------------------------------------------------
  // batchReject
  // -----------------------------------------------------------------------

  describe('batchReject', () => {
    it('should reject multiple actions and handle side-effects', async () => {
      // PERF-23: Mock findMany (batched query) instead of findFirst
      mockFindMany.mockResolvedValueOnce([
        mockAction({ id: 'act-001' }),
        mockAction({ id: 'act-002' }),
      ]);
      mockUpdateMany.mockResolvedValue({ count: 2 });

      const result = await service.batchReject(['act-001', 'act-002'], 'user-001');

      expect(result.succeeded).toEqual(['act-001', 'act-002']);
      expect(result.failed).toHaveLength(0);
      // Rejection side-effects dispatched for each (in parallel)
      expect(mockHandleRejection).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // getStats
  // -----------------------------------------------------------------------

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      mockCount
        .mockResolvedValueOnce(5)   // pending
        .mockResolvedValueOnce(20)  // approved
        .mockResolvedValueOnce(3)   // rejected
        .mockResolvedValueOnce(1);  // expired
      mockGroupBy.mockResolvedValue([
        { type: 'JE_DRAFT', _count: 3 },
        { type: 'CATEGORIZATION', _count: 2 },
      ]);

      const stats = await service.getStats();

      expect(stats.pending).toBe(5);
      expect(stats.approved).toBe(20);
      expect(stats.rejected).toBe(3);
      expect(stats.expired).toBe(1);
      expect(stats.pendingByType).toEqual({
        JE_DRAFT: 3,
        CATEGORIZATION: 2,
      });
    });
  });

  // -----------------------------------------------------------------------
  // expireStaleActions
  // -----------------------------------------------------------------------

  describe('expireStaleActions', () => {
    it('should expire actions past expiresAt with tenant isolation', async () => {
      mockUpdateMany.mockResolvedValue({ count: 3 });

      const result = await service.expireStaleActions();

      expect(result).toBe(3);
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityId: ENTITY_ID,
            entity: { tenantId: TENANT_ID },
            status: 'PENDING',
            expiresAt: { lte: expect.any(Date) },
          }),
          data: { status: 'EXPIRED' },
        })
      );
    });

    it('should return 0 when no stale actions', async () => {
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const result = await service.expireStaleActions();

      expect(result).toBe(0);
    });
  });
});
