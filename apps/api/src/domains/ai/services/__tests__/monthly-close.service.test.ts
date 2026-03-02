import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Hoisted mocks
// ============================================================================

const mocks = vi.hoisted(() => ({
  entityFindFirst: vi.fn(),
  fiscalPeriodFindFirst: vi.fn(),
  transactionCount: vi.fn(),
  invoiceCount: vi.fn(),
  billCount: vi.fn(),
  journalEntryCount: vi.fn(),
  aIActionCount: vi.fn(),
  insightCount: vi.fn(),
  accountFindMany: vi.fn(),
  bankFeedTransactionCount: vi.fn(),
  lockPeriod: vi.fn(),
  closePeriod: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    entity: { findFirst: mocks.entityFindFirst },
    fiscalPeriod: { findFirst: mocks.fiscalPeriodFindFirst },
    transaction: { count: mocks.transactionCount },
    invoice: { count: mocks.invoiceCount },
    bill: { count: mocks.billCount },
    journalEntry: { count: mocks.journalEntryCount },
    aIAction: { count: mocks.aIActionCount },
    insight: { count: mocks.insightCount },
    account: { findMany: mocks.accountFindMany },
    bankFeedTransaction: { count: mocks.bankFeedTransactionCount },
  },
}));

vi.mock('../../../accounting/services/fiscal-period.service', () => {
  return {
    FiscalPeriodService: class MockFiscalPeriodService {
      lockPeriod = mocks.lockPeriod;
      closePeriod = mocks.closePeriod;
    },
  };
});

vi.mock('../../../../lib/audit', () => ({
  createAuditLog: mocks.createAuditLog,
}));

import { MonthlyCloseService } from '../monthly-close.service';
import { AIError } from '../../errors';

// ============================================================================
// Constants
// ============================================================================

const TENANT_ID = 'tenant-close-test';
const USER_ID = 'user-close-test';
const ENTITY_ID = 'entity-close-test';
const PERIOD_ID = 'period-close-test';

const MOCK_PERIOD = {
  id: PERIOD_ID,
  name: 'January 2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  status: 'OPEN',
};

// ============================================================================
// Helper to set up all-passing checklist
// ============================================================================

function setupAllPassing() {
  mocks.entityFindFirst.mockResolvedValue({ id: ENTITY_ID });
  mocks.fiscalPeriodFindFirst.mockResolvedValue(MOCK_PERIOD);
  mocks.transactionCount.mockResolvedValue(0);
  mocks.invoiceCount.mockResolvedValue(0);
  mocks.billCount.mockResolvedValue(0);
  mocks.journalEntryCount.mockResolvedValue(0);
  mocks.aIActionCount.mockResolvedValue(0);
  mocks.insightCount.mockResolvedValue(0);
  mocks.accountFindMany.mockResolvedValue([]);
}

// ============================================================================
// Tests
// ============================================================================

describe('MonthlyCloseService', () => {
  let service: MonthlyCloseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MonthlyCloseService(TENANT_ID, USER_ID);
  });

  // --------------------------------------------------------------------------
  // getCloseReadiness
  // --------------------------------------------------------------------------

  describe('getCloseReadiness', () => {
    it('should return 100% score when all checklist items pass', async () => {
      setupAllPassing();

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);

      expect(report.score).toBe(100);
      expect(report.canClose).toBe(true);
      expect(report.periodId).toBe(PERIOD_ID);
      expect(report.periodName).toBe('January 2026');
      expect(report.items).toHaveLength(7);
      expect(report.items.every(i => i.status === 'pass')).toBe(true);
      expect(report.generatedAt).toBeDefined();
    });

    it('should return 0% score when all items fail', async () => {
      mocks.entityFindFirst.mockResolvedValue({ id: ENTITY_ID });
      mocks.fiscalPeriodFindFirst.mockResolvedValue(MOCK_PERIOD);
      mocks.transactionCount.mockResolvedValue(10); // fail
      mocks.invoiceCount.mockResolvedValue(5); // fail
      mocks.billCount.mockResolvedValue(3); // fail
      mocks.journalEntryCount.mockResolvedValue(5); // fail
      mocks.aIActionCount.mockResolvedValue(2); // warn
      mocks.insightCount.mockResolvedValue(3); // warn
      // Account with poor reconciliation
      mocks.accountFindMany.mockResolvedValue([{ id: 'acct-1', name: 'Checking' }]);
      mocks.bankFeedTransactionCount
        .mockResolvedValueOnce(100) // total for acct-1
        .mockResolvedValueOnce(50); // posted for acct-1 (50% = fail)

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);

      expect(report.score).toBeLessThan(50);
      expect(report.canClose).toBe(false);
    });

    it('should correctly weight warnings at 50%', async () => {
      setupAllPassing();
      // Add 2 unreconciled transactions (warn, weight=20) and 1 draft JE (warn, weight=15)
      mocks.transactionCount.mockResolvedValue(2);
      mocks.journalEntryCount.mockResolvedValue(1);

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);

      // warn items: weight 20 * 0.5 + weight 15 * 0.5 = 10 + 7.5 = 17.5
      // pass items: remaining 65 * 1.0 = 65
      // total = (17.5 + 65) / 100 * 100 = 82.5 → rounded to 83
      expect(report.score).toBe(83);
      expect(report.canClose).toBe(false);
    });

    it('should throw ENTITY_NOT_FOUND when entity is invalid', async () => {
      mocks.entityFindFirst.mockResolvedValue(null);

      await expect(
        service.getCloseReadiness('bad-entity', PERIOD_ID),
      ).rejects.toThrow(AIError);
    });

    it('should throw PERIOD_NOT_FOUND when period is invalid', async () => {
      mocks.entityFindFirst.mockResolvedValue({ id: ENTITY_ID });
      mocks.fiscalPeriodFindFirst.mockResolvedValue(null);

      await expect(
        service.getCloseReadiness(ENTITY_ID, 'bad-period'),
      ).rejects.toThrow(AIError);
    });

    it('should throw PERIOD_INVALID_STATUS for CLOSED periods', async () => {
      mocks.entityFindFirst.mockResolvedValue({ id: ENTITY_ID });
      mocks.fiscalPeriodFindFirst.mockResolvedValue({ ...MOCK_PERIOD, status: 'CLOSED' });

      await expect(
        service.getCloseReadiness(ENTITY_ID, PERIOD_ID),
      ).rejects.toThrow(AIError);
    });

    it('should accept LOCKED periods for readiness check', async () => {
      setupAllPassing();
      mocks.fiscalPeriodFindFirst.mockResolvedValue({ ...MOCK_PERIOD, status: 'LOCKED' });

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);

      expect(report.score).toBe(100);
      expect(report.canClose).toBe(true);
    });

    // Checklist-specific tests

    it('should detect unreconciled transactions', async () => {
      setupAllPassing();
      mocks.transactionCount.mockResolvedValue(8);

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);
      const item = report.items.find(i => i.label === 'Unreconciled transactions');

      expect(item?.status).toBe('fail');
      expect(item?.count).toBe(8);
    });

    it('should detect overdue invoices', async () => {
      setupAllPassing();
      mocks.invoiceCount.mockResolvedValue(3);

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);
      const item = report.items.find(i => i.label === 'Overdue invoices');

      expect(item?.status).toBe('fail');
      expect(item?.count).toBe(3);
    });

    it('should detect pending AI actions as warning', async () => {
      setupAllPassing();
      mocks.aIActionCount.mockResolvedValue(2);

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);
      const item = report.items.find(i => i.label === 'Pending AI actions');

      expect(item?.status).toBe('warn');
      expect(item?.count).toBe(2);
    });

    it('should check account reconciliation with mixed results', async () => {
      setupAllPassing();
      mocks.accountFindMany.mockResolvedValue([
        { id: 'acct-1', name: 'Checking' },
        { id: 'acct-2', name: 'Savings' },
      ]);
      // acct-1: 100 total, 98 posted = 98% → pass
      // acct-2: 100 total, 60 posted = 60% → fail
      mocks.bankFeedTransactionCount
        .mockResolvedValueOnce(100).mockResolvedValueOnce(98) // acct-1
        .mockResolvedValueOnce(100).mockResolvedValueOnce(60); // acct-2

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);
      const item = report.items.find(i => i.label === 'Account reconciliation');

      expect(item?.status).toBe('fail');
      expect(item?.count).toBe(1); // 1 failing account
    });

    it('should pass reconciliation when no bank feed data', async () => {
      setupAllPassing();
      mocks.accountFindMany.mockResolvedValue([{ id: 'acct-1', name: 'Checking' }]);
      mocks.bankFeedTransactionCount.mockResolvedValue(0); // no bank feed

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);
      const item = report.items.find(i => i.label === 'Account reconciliation');

      expect(item?.status).toBe('pass');
    });

    it('should return all 7 checklist items with correct weights summing to 100', async () => {
      setupAllPassing();

      const report = await service.getCloseReadiness(ENTITY_ID, PERIOD_ID);

      expect(report.items).toHaveLength(7);
      const totalWeight = report.items.reduce((sum, item) => sum + item.weight, 0);
      expect(totalWeight).toBe(100);
    });
  });

  // --------------------------------------------------------------------------
  // executeClose
  // --------------------------------------------------------------------------

  describe('executeClose', () => {
    it('should lock and close period when score is 100%', async () => {
      setupAllPassing();
      mocks.lockPeriod.mockResolvedValue({ id: PERIOD_ID, status: 'LOCKED' });
      mocks.closePeriod.mockResolvedValue({ id: PERIOD_ID, status: 'CLOSED' });
      // For the second findFirst call in executeClose (status check)
      mocks.fiscalPeriodFindFirst
        .mockResolvedValueOnce(MOCK_PERIOD)        // getCloseReadiness
        .mockResolvedValueOnce({ status: 'OPEN' }); // executeClose status check

      const result = await service.executeClose(ENTITY_ID, PERIOD_ID);

      expect(result.success).toBe(true);
      expect(result.periodId).toBe(PERIOD_ID);
      expect(result.periodName).toBe('January 2026');
      expect(mocks.lockPeriod).toHaveBeenCalledWith(PERIOD_ID);
      expect(mocks.closePeriod).toHaveBeenCalledWith(PERIOD_ID);
      expect(mocks.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          userId: USER_ID,
          entityId: ENTITY_ID,
          model: 'FiscalPeriod',
          recordId: PERIOD_ID,
          action: 'UPDATE',
        }),
      );
    });

    it('should skip lock when period is already LOCKED', async () => {
      setupAllPassing();
      mocks.fiscalPeriodFindFirst
        .mockResolvedValueOnce({ ...MOCK_PERIOD, status: 'LOCKED' })  // getCloseReadiness
        .mockResolvedValueOnce({ status: 'LOCKED' }); // executeClose status check
      mocks.closePeriod.mockResolvedValue({ id: PERIOD_ID, status: 'CLOSED' });

      await service.executeClose(ENTITY_ID, PERIOD_ID);

      expect(mocks.lockPeriod).not.toHaveBeenCalled();
      expect(mocks.closePeriod).toHaveBeenCalledWith(PERIOD_ID);
    });

    it('should reject close when score is not 100%', async () => {
      mocks.entityFindFirst.mockResolvedValue({ id: ENTITY_ID });
      mocks.fiscalPeriodFindFirst.mockResolvedValue(MOCK_PERIOD);
      mocks.transactionCount.mockResolvedValue(10); // fail
      mocks.invoiceCount.mockResolvedValue(0);
      mocks.billCount.mockResolvedValue(0);
      mocks.journalEntryCount.mockResolvedValue(0);
      mocks.aIActionCount.mockResolvedValue(0);
      mocks.insightCount.mockResolvedValue(0);
      mocks.accountFindMany.mockResolvedValue([]);

      try {
        await service.executeClose(ENTITY_ID, PERIOD_ID);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AIError);
        expect((error as AIError).code).toBe('PERIOD_NOT_READY');
        expect((error as AIError).details).toHaveProperty('score');
        expect((error as AIError).details).toHaveProperty('failingItems');
      }
    });

    it('should not call lockPeriod or closePeriod when not ready', async () => {
      mocks.entityFindFirst.mockResolvedValue({ id: ENTITY_ID });
      mocks.fiscalPeriodFindFirst.mockResolvedValue(MOCK_PERIOD);
      mocks.transactionCount.mockResolvedValue(100); // fail
      mocks.invoiceCount.mockResolvedValue(0);
      mocks.billCount.mockResolvedValue(0);
      mocks.journalEntryCount.mockResolvedValue(0);
      mocks.aIActionCount.mockResolvedValue(0);
      mocks.insightCount.mockResolvedValue(0);
      mocks.accountFindMany.mockResolvedValue([]);

      try {
        await service.executeClose(ENTITY_ID, PERIOD_ID);
      } catch {
        // Expected
      }

      expect(mocks.lockPeriod).not.toHaveBeenCalled();
      expect(mocks.closePeriod).not.toHaveBeenCalled();
    });
  });
});
