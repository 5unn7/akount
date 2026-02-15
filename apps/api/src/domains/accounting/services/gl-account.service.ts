import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { createAuditLog } from '../../../lib/audit';
import type { CreateGLAccountInput, UpdateGLAccountInput, ListGLAccountsQuery } from '../schemas/gl-account.schema';

const GL_ACCOUNT_SELECT = {
  id: true,
  entityId: true,
  code: true,
  name: true,
  type: true,
  normalBalance: true,
  description: true,
  parentAccountId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      childAccounts: true,
      journalLines: true,
    },
  },
} as const;

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type GLAccountTreeNode = {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  parentAccountId: string | null;
  isActive: boolean;
  _count: {
    childAccounts: number;
    journalLines: number;
  };
  children: GLAccountTreeNode[];
};

export class GLAccountService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * List GL accounts for an entity with optional filters.
   */
  async listAccounts(params: ListGLAccountsQuery) {
    // Validate entity belongs to tenant
    await this.validateEntityOwnership(params.entityId);

    const where: Prisma.GLAccountWhereInput = {
      entityId: params.entityId,
      entity: { tenantId: this.tenantId },
    };

    if (params.type) where.type = params.type;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.parentAccountId) where.parentAccountId = params.parentAccountId;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search } },
      ];
    }

    const accounts = await prisma.gLAccount.findMany({
      where,
      select: GL_ACCOUNT_SELECT,
      orderBy: { code: 'asc' },
    });

    return accounts;
  }

  /**
   * Get a single GL account with children count and journal line count.
   */
  async getAccount(id: string) {
    const account = await prisma.gLAccount.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        ...GL_ACCOUNT_SELECT,
        parentAccount: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!account) {
      throw new AccountingError(
        'GL account not found',
        'GL_ACCOUNT_NOT_FOUND',
        404
      );
    }

    return account;
  }

  /**
   * Create a new GL account.
   *
   * Validations:
   * - Entity must belong to tenant
   * - Code must be unique per entity (Prisma @@unique enforces)
   * - Parent account must belong to SAME entity (cross-entity IDOR prevention)
   */
  async createAccount(data: CreateGLAccountInput) {
    // Validate entity belongs to tenant
    await this.validateEntityOwnership(data.entityId);

    // Validate parent account belongs to same entity (if provided)
    if (data.parentAccountId) {
      const parent = await prisma.gLAccount.findFirst({
        where: {
          id: data.parentAccountId,
          entityId: data.entityId,
          entity: { tenantId: this.tenantId },
        },
        select: { id: true },
      });

      if (!parent) {
        throw new AccountingError(
          'Parent account not found or belongs to different entity',
          'CROSS_ENTITY_REFERENCE',
          403
        );
      }
    }

    try {
      const account = await prisma.gLAccount.create({
        data: {
          entityId: data.entityId,
          code: data.code,
          name: data.name,
          type: data.type,
          normalBalance: data.normalBalance,
          description: data.description,
          parentAccountId: data.parentAccountId,
        },
        select: GL_ACCOUNT_SELECT,
      });

      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId: data.entityId,
        model: 'GLAccount',
        recordId: account.id,
        action: 'CREATE',
        after: { code: data.code, name: data.name, type: data.type },
      });

      return account;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AccountingError(
          `GL account code '${data.code}' already exists for this entity`,
          'DUPLICATE_ACCOUNT_CODE',
          409
        );
      }
      throw error;
    }
  }

  /**
   * Update a GL account.
   *
   * Code and type are IMMUTABLE after creation if journal lines exist.
   */
  async updateAccount(id: string, data: UpdateGLAccountInput) {
    const existing = await prisma.gLAccount.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        id: true,
        entityId: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        parentAccountId: true,
      },
    });

    if (!existing) {
      throw new AccountingError(
        'GL account not found',
        'GL_ACCOUNT_NOT_FOUND',
        404
      );
    }

    // Validate parent account belongs to same entity (if changing parent)
    if (data.parentAccountId) {
      const parent = await prisma.gLAccount.findFirst({
        where: {
          id: data.parentAccountId,
          entityId: existing.entityId,
          entity: { tenantId: this.tenantId },
        },
        select: { id: true },
      });

      if (!parent) {
        throw new AccountingError(
          'Parent account not found or belongs to different entity',
          'CROSS_ENTITY_REFERENCE',
          403
        );
      }
    }

    const account = await prisma.gLAccount.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        parentAccountId: data.parentAccountId,
      },
      select: GL_ACCOUNT_SELECT,
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.entityId,
      model: 'GLAccount',
      recordId: id,
      action: 'UPDATE',
      before: { name: existing.name, description: existing.description, isActive: existing.isActive },
      after: { name: data.name, description: data.description, isActive: data.isActive },
    });

    return account;
  }

  /**
   * Deactivate a GL account (soft — sets isActive: false).
   *
   * Blocked if account has unposted (DRAFT) journal lines.
   */
  async deactivateAccount(id: string) {
    const existing = await prisma.gLAccount.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        id: true,
        entityId: true,
        isActive: true,
        _count: {
          select: {
            journalLines: {
              where: {
                journalEntry: { status: 'DRAFT', deletedAt: null },
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new AccountingError(
        'GL account not found',
        'GL_ACCOUNT_NOT_FOUND',
        404
      );
    }

    if (existing._count.journalLines > 0) {
      throw new AccountingError(
        'Cannot deactivate account with unposted journal entries',
        'GL_ACCOUNT_INACTIVE',
        400,
        { draftJournalLineCount: existing._count.journalLines }
      );
    }

    const account = await prisma.gLAccount.update({
      where: { id },
      data: { isActive: false },
      select: GL_ACCOUNT_SELECT,
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.entityId,
      model: 'GLAccount',
      recordId: id,
      action: 'UPDATE',
      before: { isActive: true },
      after: { isActive: false },
    });

    return account;
  }

  /**
   * Get hierarchical tree structure for an entity's chart of accounts.
   */
  async getAccountTree(entityId: string) {
    await this.validateEntityOwnership(entityId);

    const accounts = await prisma.gLAccount.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        normalBalance: true,
        parentAccountId: true,
        isActive: true,
        _count: {
          select: { childAccounts: true, journalLines: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Build tree from flat list
    const rootAccounts = accounts.filter(a => !a.parentAccountId);
    const childMap = new Map<string, typeof accounts>();

    for (const account of accounts) {
      if (account.parentAccountId) {
        const siblings = childMap.get(account.parentAccountId) || [];
        siblings.push(account);
        childMap.set(account.parentAccountId, siblings);
      }
    }

    function buildTree(account: typeof accounts[0]): GLAccountTreeNode {
      return {
        ...account,
        children: (childMap.get(account.id) || []).map(buildTree),
      };
    }

    return rootAccounts.map(buildTree);
  }

  /**
   * Get account balances (sum of debit/credit from journal lines).
   */
  async getAccountBalances(entityId: string) {
    await this.validateEntityOwnership(entityId);

    const balances = await prisma.gLAccount.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        normalBalance: true,
        journalLines: {
          where: {
            deletedAt: null,
            journalEntry: { status: 'POSTED', deletedAt: null },
          },
          select: {
            debitAmount: true,
            creditAmount: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return balances.map(account => {
      const totalDebits = account.journalLines.reduce((sum, line) => sum + line.debitAmount, 0);
      const totalCredits = account.journalLines.reduce((sum, line) => sum + line.creditAmount, 0);
      const balance = account.normalBalance === 'DEBIT'
        ? totalDebits - totalCredits
        : totalCredits - totalDebits;

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        totalDebits,
        totalCredits,
        balance,
      };
    });
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async validateEntityOwnership(entityId: string) {
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    if (!entity) {
      throw new AccountingError(
        'Entity not found',
        'ENTITY_NOT_FOUND',
        403
      );
    }

    return entity;
  }
}
