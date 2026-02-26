import { prisma } from '@akount/db';
import { AIError } from '../errors';
import { FiscalPeriodService } from '../../accounting/services/fiscal-period.service';
import { createAuditLog } from '../../../lib/audit';

// ============================================================================
// Types
// ============================================================================

export type ChecklistStatus = 'pass' | 'fail' | 'warn';

export interface ChecklistItem {
  label: string;
  status: ChecklistStatus;
  count: number;
  details: string;
  weight: number;
}

export interface CloseReadinessReport {
  periodId: string;
  periodName: string;
  score: number;
  canClose: boolean;
  items: ChecklistItem[];
  generatedAt: string;
}

// ============================================================================
// Checklist item definitions with weights (total = 100)
// ============================================================================

interface ChecklistDef {
  label: string;
  weight: number;
  run: (entityId: string, tenantId: string, startDate: Date, endDate: Date) => Promise<Omit<ChecklistItem, 'label' | 'weight'>>;
}

async function checkUnreconciledTransactions(
  entityId: string,
  _tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const count = await prisma.transaction.count({
    where: {
      account: { entityId },
      date: { gte: startDate, lte: endDate },
      journalEntryId: null,
      deletedAt: null,
    },
  });

  const status: ChecklistStatus = count === 0 ? 'pass' : count < 5 ? 'warn' : 'fail';
  return {
    status,
    count,
    details: count === 0
      ? 'All transactions reconciled'
      : `${count} transaction${count === 1 ? '' : 's'} not linked to a journal entry`,
  };
}

async function checkOverdueInvoices(
  entityId: string,
  _tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const count = await prisma.invoice.count({
    where: {
      entityId,
      dueDate: { gte: startDate, lte: endDate },
      status: 'SENT',
      deletedAt: null,
    },
  });

  return {
    status: count === 0 ? 'pass' : 'fail',
    count,
    details: count === 0
      ? 'No overdue invoices in period'
      : `${count} invoice${count === 1 ? '' : 's'} still outstanding (status: SENT)`,
  };
}

async function checkOverdueBills(
  entityId: string,
  _tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const count = await prisma.bill.count({
    where: {
      entityId,
      dueDate: { gte: startDate, lte: endDate },
      status: 'PENDING',
      deletedAt: null,
    },
  });

  return {
    status: count === 0 ? 'pass' : 'fail',
    count,
    details: count === 0
      ? 'No overdue bills in period'
      : `${count} bill${count === 1 ? '' : 's'} still pending`,
  };
}

async function checkDraftJournalEntries(
  entityId: string,
  _tenantId: string,
  startDate: Date,
  endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const count = await prisma.journalEntry.count({
    where: {
      entityId,
      date: { gte: startDate, lte: endDate },
      status: 'DRAFT',
      deletedAt: null,
    },
  });

  const status: ChecklistStatus = count === 0 ? 'pass' : count < 3 ? 'warn' : 'fail';
  return {
    status,
    count,
    details: count === 0
      ? 'No draft journal entries'
      : `${count} journal entr${count === 1 ? 'y' : 'ies'} still in draft`,
  };
}

async function checkPendingAIActions(
  entityId: string,
  _tenantId: string,
  _startDate: Date,
  _endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const count = await prisma.aIAction.count({
    where: {
      entityId,
      status: 'PENDING',
    },
  });

  return {
    status: count === 0 ? 'pass' : 'warn',
    count,
    details: count === 0
      ? 'No pending AI actions'
      : `${count} AI action${count === 1 ? '' : 's'} awaiting review`,
  };
}

async function checkUnresolvedInsights(
  entityId: string,
  _tenantId: string,
  _startDate: Date,
  _endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const count = await prisma.insight.count({
    where: {
      entityId,
      status: 'active',
      priority: { in: ['critical', 'high'] },
    },
  });

  return {
    status: count === 0 ? 'pass' : 'warn',
    count,
    details: count === 0
      ? 'No unresolved critical/high insights'
      : `${count} critical/high insight${count === 1 ? '' : 's'} still active`,
  };
}

async function checkAccountReconciliation(
  entityId: string,
  tenantId: string,
  _startDate: Date,
  _endDate: Date,
): Promise<Omit<ChecklistItem, 'label' | 'weight'>> {
  const accounts = await prisma.account.findMany({
    where: { entityId, entity: { tenantId }, deletedAt: null, isActive: true },
    select: { id: true, name: true },
  });

  if (accounts.length === 0) {
    return { status: 'pass', count: 0, details: 'No active accounts to reconcile' };
  }

  let failCount = 0;
  let warnCount = 0;

  for (const account of accounts) {
    const total = await prisma.bankFeedTransaction.count({
      where: { accountId: account.id, deletedAt: null },
    });

    if (total === 0) continue; // No bank feed data, skip

    const posted = await prisma.bankFeedTransaction.count({
      where: { accountId: account.id, deletedAt: null, status: 'POSTED' },
    });

    const percent = (posted / total) * 100;
    if (percent < 80) failCount++;
    else if (percent < 95) warnCount++;
  }

  const status: ChecklistStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';
  const totalChecked = accounts.length;

  return {
    status,
    count: failCount + warnCount,
    details: status === 'pass'
      ? `All ${totalChecked} account${totalChecked === 1 ? '' : 's'} reconciled above 95%`
      : `${failCount} account${failCount === 1 ? '' : 's'} below 80%, ${warnCount} between 80-95%`,
  };
}

// Ordered checklist definitions with weights (total = 100)
const CHECKLIST: ChecklistDef[] = [
  { label: 'Unreconciled transactions', weight: 20, run: checkUnreconciledTransactions },
  { label: 'Overdue invoices', weight: 15, run: checkOverdueInvoices },
  { label: 'Overdue bills', weight: 15, run: checkOverdueBills },
  { label: 'Draft journal entries', weight: 15, run: checkDraftJournalEntries },
  { label: 'Pending AI actions', weight: 10, run: checkPendingAIActions },
  { label: 'Unresolved insights', weight: 10, run: checkUnresolvedInsights },
  { label: 'Account reconciliation', weight: 15, run: checkAccountReconciliation },
];

// ============================================================================
// Service
// ============================================================================

export class MonthlyCloseService {
  constructor(
    private tenantId: string,
    private userId: string,
  ) {}

  /**
   * Generate a close readiness report for a fiscal period.
   * Runs all checklist items and calculates a weighted score.
   */
  async getCloseReadiness(entityId: string, periodId: string): Promise<CloseReadinessReport> {
    // Validate entity ownership
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    if (!entity) {
      throw new AIError('Entity not found', 'ENTITY_NOT_FOUND', 404);
    }

    // Fetch and validate fiscal period
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        id: periodId,
        fiscalCalendar: { entity: { tenantId: this.tenantId } },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!period) {
      throw new AIError('Fiscal period not found', 'PERIOD_NOT_FOUND', 404);
    }

    if (period.status !== 'OPEN' && period.status !== 'LOCKED') {
      throw new AIError(
        `Period is ${period.status} — readiness checks are only available for OPEN or LOCKED periods`,
        'PERIOD_INVALID_STATUS',
        400,
      );
    }

    // Run all checklist items in parallel
    const results = await Promise.all(
      CHECKLIST.map(async (def) => {
        const result = await def.run(entityId, this.tenantId, period.startDate, period.endDate);
        return {
          label: def.label,
          weight: def.weight,
          ...result,
        };
      }),
    );

    // Calculate weighted score
    const PASS_FACTOR = 1.0;
    const WARN_FACTOR = 0.5;
    const FAIL_FACTOR = 0.0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const item of results) {
      totalWeight += item.weight;
      const factor = item.status === 'pass' ? PASS_FACTOR
        : item.status === 'warn' ? WARN_FACTOR
        : FAIL_FACTOR;
      weightedSum += item.weight * factor;
    }

    const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
    const canClose = score === 100; // No failures or warnings

    return {
      periodId: period.id,
      periodName: period.name,
      score,
      canClose,
      items: results,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute monthly close: lock + close the period.
   * Only allowed when readiness score is 100 (all items pass).
   */
  async executeClose(entityId: string, periodId: string): Promise<{ success: true; periodId: string; periodName: string }> {
    // Validate readiness first
    const readiness = await this.getCloseReadiness(entityId, periodId);

    if (!readiness.canClose) {
      const failingItems = readiness.items
        .filter(i => i.status !== 'pass')
        .map(i => `${i.label}: ${i.details}`);

      throw new AIError(
        `Cannot close period — readiness score is ${readiness.score}% (must be 100%)`,
        'PERIOD_NOT_READY',
        400,
        { score: readiness.score, failingItems },
      );
    }

    // Execute close via existing fiscal period service
    const fpService = new FiscalPeriodService(this.tenantId, this.userId);

    // Lock first (OPEN → LOCKED), then close (LOCKED → CLOSED)
    // The fiscal period service handles state validation internally
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId },
      select: { status: true },
    });

    if (period?.status === 'OPEN') {
      await fpService.lockPeriod(periodId);
    }
    await fpService.closePeriod(periodId);

    // Create audit log for the monthly close action
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId,
      model: 'FiscalPeriod',
      recordId: periodId,
      action: 'UPDATE',
      before: { readinessScore: readiness.score },
      after: { action: 'MONTHLY_CLOSE', status: 'CLOSED' },
    });

    return {
      success: true,
      periodId: readiness.periodId,
      periodName: readiness.periodName,
    };
  }
}
