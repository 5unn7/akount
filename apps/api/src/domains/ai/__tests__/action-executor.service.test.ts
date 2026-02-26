import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionExecutorService } from '../services/action-executor.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockJEFindFirst = vi.fn();
const mockJEUpdate = vi.fn();
const mockTxnFindFirst = vi.fn();
const mockTxnUpdate = vi.fn();
const mockTxnUpdateMany = vi.fn();
const mockCategoryFindFirst = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    journalEntry: {
      findFirst: (...args: unknown[]) => mockJEFindFirst(...args),
      update: (...args: unknown[]) => mockJEUpdate(...args),
    },
    transaction: {
      findFirst: (...args: unknown[]) => mockTxnFindFirst(...args),
      update: (...args: unknown[]) => mockTxnUpdate(...args),
      updateMany: (...args: unknown[]) => mockTxnUpdateMany(...args),
    },
    category: {
      findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args),
    },
  },
}));

const mockApproveEntry = vi.fn();
vi.mock('../../accounting/services/journal-entry.service', () => ({
  JournalEntryService: function (this: Record<string, unknown>) {
    this.approveEntry = mockApproveEntry;
  },
}));

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'cltest00000000000000entity';
const USER_ID = 'test-user-id';
const JE_ID = 'cltest0000000000000000je01';
const TXN_ID = 'cltest0000000000000000txn1';
const CAT_ID = 'cltest0000000000000000cat1';
const ACTION_ID = 'cltest00000000000000action';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActionExecutorService', () => {
  let service: ActionExecutorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActionExecutorService(TENANT_ID, ENTITY_ID, USER_ID);
  });

  // -------------------------------------------------------------------------
  // JE_DRAFT execution
  // -------------------------------------------------------------------------
  describe('execute — JE_DRAFT', () => {
    const jeDraftAction = {
      id: ACTION_ID,
      type: 'JE_DRAFT',
      payload: {
        journalEntryId: JE_ID,
        transactionId: TXN_ID,
        lines: [
          { glAccountId: 'gl-1', debitAmount: 1000, creditAmount: 0 },
          { glAccountId: 'gl-2', debitAmount: 0, creditAmount: 1000 },
        ],
      },
    };

    it('should approve a DRAFT journal entry', async () => {
      mockJEFindFirst.mockResolvedValue({ id: JE_ID, status: 'DRAFT', entityId: ENTITY_ID });
      mockApproveEntry.mockResolvedValue({ id: JE_ID, status: 'POSTED' });

      const result = await service.execute(jeDraftAction);

      expect(result.success).toBe(true);
      expect(result.type).toBe('JE_DRAFT');
      expect(mockApproveEntry).toHaveBeenCalledWith(JE_ID);
    });

    it('should be idempotent when JE already POSTED', async () => {
      mockJEFindFirst.mockResolvedValue({ id: JE_ID, status: 'POSTED', entityId: ENTITY_ID });

      const result = await service.execute(jeDraftAction);

      expect(result.success).toBe(true);
      expect(result.detail).toContain('idempotent');
      expect(mockApproveEntry).not.toHaveBeenCalled();
    });

    it('should fail when JE is VOIDED', async () => {
      mockJEFindFirst.mockResolvedValue({ id: JE_ID, status: 'VOIDED', entityId: ENTITY_ID });

      const result = await service.execute(jeDraftAction);

      expect(result.success).toBe(false);
      expect(result.error).toContain('voided');
      expect(mockApproveEntry).not.toHaveBeenCalled();
    });

    it('should fail when JE not found', async () => {
      mockJEFindFirst.mockResolvedValue(null);

      const result = await service.execute(jeDraftAction);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when payload missing journalEntryId', async () => {
      const result = await service.execute({
        id: ACTION_ID,
        type: 'JE_DRAFT',
        payload: { transactionId: TXN_ID },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing journalEntryId');
    });

    it('should capture approveEntry error without throwing', async () => {
      mockJEFindFirst.mockResolvedValue({ id: JE_ID, status: 'DRAFT', entityId: ENTITY_ID });
      mockApproveEntry.mockRejectedValue(new Error('Fiscal period closed'));

      const result = await service.execute(jeDraftAction);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fiscal period closed');
    });
  });

  // -------------------------------------------------------------------------
  // CATEGORIZATION execution
  // -------------------------------------------------------------------------
  describe('execute — CATEGORIZATION', () => {
    const catAction = {
      id: ACTION_ID,
      type: 'CATEGORIZATION',
      payload: {
        transactionId: TXN_ID,
        categoryId: CAT_ID,
        categoryName: 'Office Supplies',
        confidence: 85,
      },
    };

    it('should apply category to transaction', async () => {
      mockTxnFindFirst.mockResolvedValue({ id: TXN_ID, categoryId: null });
      mockCategoryFindFirst.mockResolvedValue({ id: CAT_ID });
      mockTxnUpdate.mockResolvedValue({ id: TXN_ID, categoryId: CAT_ID });

      const result = await service.execute(catAction);

      expect(result.success).toBe(true);
      expect(result.type).toBe('CATEGORIZATION');
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TXN_ID },
          data: { categoryId: CAT_ID },
        })
      );
    });

    it('should be idempotent when already categorized', async () => {
      mockTxnFindFirst.mockResolvedValue({ id: TXN_ID, categoryId: CAT_ID });

      const result = await service.execute(catAction);

      expect(result.success).toBe(true);
      expect(result.detail).toContain('idempotent');
      expect(mockTxnUpdate).not.toHaveBeenCalled();
    });

    it('should fail when transaction not found', async () => {
      mockTxnFindFirst.mockResolvedValue(null);

      const result = await service.execute(catAction);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Transaction not found');
    });

    it('should fail when category not found', async () => {
      mockTxnFindFirst.mockResolvedValue({ id: TXN_ID, categoryId: null });
      mockCategoryFindFirst.mockResolvedValue(null);

      const result = await service.execute(catAction);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Category not found');
    });
  });

  // -------------------------------------------------------------------------
  // RULE_SUGGESTION / ALERT (acknowledgment only)
  // -------------------------------------------------------------------------
  describe('execute — acknowledgment types', () => {
    it('should succeed for RULE_SUGGESTION (no side-effect)', async () => {
      const result = await service.execute({
        id: ACTION_ID,
        type: 'RULE_SUGGESTION',
        payload: { suggestion: 'Create recurring categorization rule' },
      });

      expect(result.success).toBe(true);
      expect(result.detail).toContain('Acknowledged');
    });

    it('should succeed for ALERT (no side-effect)', async () => {
      const result = await service.execute({
        id: ACTION_ID,
        type: 'ALERT',
        payload: { message: 'Unusual spending detected' },
      });

      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // handleRejection
  // -------------------------------------------------------------------------
  describe('handleRejection', () => {
    it('should soft-delete draft JE on JE_DRAFT rejection', async () => {
      mockJEFindFirst.mockResolvedValue({ id: JE_ID });
      mockJEUpdate.mockResolvedValue({ id: JE_ID, deletedAt: new Date() });
      mockTxnUpdateMany.mockResolvedValue({ count: 1 });

      await service.handleRejection({
        id: ACTION_ID,
        type: 'JE_DRAFT',
        payload: { journalEntryId: JE_ID, transactionId: TXN_ID, lines: [] },
      });

      expect(mockJEUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: JE_ID },
          data: { deletedAt: expect.any(Date) },
        })
      );
      expect(mockTxnUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TXN_ID, journalEntryId: JE_ID },
          data: { journalEntryId: null },
        })
      );
    });

    it('should skip non-JE_DRAFT rejections', async () => {
      await service.handleRejection({
        id: ACTION_ID,
        type: 'CATEGORIZATION',
        payload: { transactionId: TXN_ID },
      });

      expect(mockJEFindFirst).not.toHaveBeenCalled();
      expect(mockJEUpdate).not.toHaveBeenCalled();
    });

    it('should skip if JE already deleted or not DRAFT', async () => {
      mockJEFindFirst.mockResolvedValue(null);

      await service.handleRejection({
        id: ACTION_ID,
        type: 'JE_DRAFT',
        payload: { journalEntryId: JE_ID, transactionId: TXN_ID, lines: [] },
      });

      expect(mockJEUpdate).not.toHaveBeenCalled();
    });
  });
});
