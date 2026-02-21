import { prisma, type GLAccountType, type NormalBalance, type PrismaClient } from '@akount/db';
import { AccountingError } from '../errors';
import { createAuditLog } from '../../../lib/audit';

interface COATemplateAccount {
  code: string;
  name: string;
  type: GLAccountType;
  normalBalance: NormalBalance;
  parentCode?: string;
}

const DEFAULT_COA_TEMPLATE: readonly COATemplateAccount[] = [
  // Assets (1000-1999)
  { code: '1000', name: 'Cash', type: 'ASSET', normalBalance: 'DEBIT' },
  { code: '1010', name: 'Petty Cash', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
  { code: '1100', name: 'Bank Account', type: 'ASSET', normalBalance: 'DEBIT' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT' },
  { code: '1300', name: 'Inventory', type: 'ASSET', normalBalance: 'DEBIT' },
  { code: '1400', name: 'Prepaid Expenses', type: 'ASSET', normalBalance: 'DEBIT' },

  // Liabilities (2000-2999)
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '2100', name: 'Credit Card Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '2200', name: 'Accrued Liabilities', type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '2300', name: 'Sales Tax Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '2400', name: 'Income Tax Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '2500', name: 'Loans Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },

  // Equity (3000-3999)
  { code: '3000', name: "Owner's Equity", type: 'EQUITY', normalBalance: 'CREDIT' },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT' },
  { code: '3200', name: "Owner's Draws", type: 'EQUITY', normalBalance: 'DEBIT' },
  { code: '3300', name: 'Opening Balance Equity', type: 'EQUITY', normalBalance: 'CREDIT' },

  // Income (4000-4999)
  { code: '4000', name: 'Service Revenue', type: 'INCOME', normalBalance: 'CREDIT' },
  { code: '4100', name: 'Product Sales', type: 'INCOME', normalBalance: 'CREDIT' },
  { code: '4200', name: 'Interest Income', type: 'INCOME', normalBalance: 'CREDIT' },
  { code: '4300', name: 'Other Income', type: 'INCOME', normalBalance: 'CREDIT' },

  // Expenses (5000-6999)
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5100', name: 'Advertising & Marketing', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5200', name: 'Bank Fees & Interest', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5300', name: 'Insurance', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5400', name: 'Office Supplies', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5500', name: 'Professional Fees', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5600', name: 'Rent & Utilities', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5700', name: 'Salaries & Wages', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5800', name: 'Travel & Meals', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5900', name: 'Depreciation', type: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5990', name: 'Other Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
] as const satisfies readonly COATemplateAccount[];

// Prisma transaction client type — the subset exposed inside $transaction callbacks
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * Seed default Chart of Accounts for an entity.
 *
 * Atomic + idempotent: skips if entity already has GL accounts.
 * If txClient is provided, runs inside the caller's transaction (no nested $transaction).
 * If txClient is omitted, wraps itself in its own $transaction (backward compatible).
 */
export async function seedDefaultCOA(
  entityId: string,
  tenantId: string,
  userId: string,
  txClient?: TransactionClient
): Promise<{ seeded: boolean; accountCount: number }> {
  async function doSeed(tx: TransactionClient): Promise<{ seeded: boolean; accountCount: number }> {
    // Validate entity belongs to tenant
    const entity = await tx.entity.findFirst({
      where: { id: entityId, tenantId },
      select: { id: true },
    });

    if (!entity) {
      throw new AccountingError(
        'Entity not found',
        'ENTITY_NOT_FOUND',
        403
      );
    }

    // Idempotency: skip if entity already has GL accounts
    const existingCount = await tx.gLAccount.count({
      where: { entityId },
    });

    if (existingCount > 0) {
      return { seeded: false, accountCount: existingCount };
    }

    // Create all accounts (without parent references first)
    const codeToId = new Map<string, string>();

    for (const template of DEFAULT_COA_TEMPLATE) {
      const account = await tx.gLAccount.create({
        data: {
          entityId,
          code: template.code,
          name: template.name,
          type: template.type,
          normalBalance: template.normalBalance,
        },
        select: { id: true },
      });
      codeToId.set(template.code, account.id);
    }

    // Set parent-child relationships
    for (const template of DEFAULT_COA_TEMPLATE) {
      if (template.parentCode) {
        const accountId = codeToId.get(template.code);
        const parentId = codeToId.get(template.parentCode);
        if (accountId && parentId) {
          await tx.gLAccount.update({
            where: { id: accountId },
            data: { parentAccountId: parentId },
          });
        }
      }
    }

    // Audit log (transaction-safe — ARCH-6)
    await createAuditLog({
      tenantId,
      userId,
      entityId,
      model: 'GLAccount',
      recordId: 'seed',
      action: 'CREATE',
      after: {
        operation: 'seed_default_coa',
        accountCount: DEFAULT_COA_TEMPLATE.length,
      },
    }, tx);

    return { seeded: true, accountCount: DEFAULT_COA_TEMPLATE.length };
  }

  // If caller provides a transaction client, run directly (no nested transaction)
  if (txClient) {
    return doSeed(txClient);
  }

  // Otherwise, wrap in own transaction (standalone usage)
  return prisma.$transaction(async (tx) => doSeed(tx));
}
