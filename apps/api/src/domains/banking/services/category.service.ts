import { prisma } from '@akount/db';
import type { CategoryType } from '@prisma/client';
import { createAuditLog } from '../../../lib/audit';

/**
 * Default categories seeded for new tenants
 */
const DEFAULT_CATEGORIES: Array<{ name: string; type: CategoryType }> = [
  // Expense categories
  { name: 'Meals & Entertainment', type: 'EXPENSE' },
  { name: 'Transportation', type: 'EXPENSE' },
  { name: 'Office Supplies', type: 'EXPENSE' },
  { name: 'Software & Subscriptions', type: 'EXPENSE' },
  { name: 'Utilities', type: 'EXPENSE' },
  { name: 'Rent', type: 'EXPENSE' },
  { name: 'Professional Services', type: 'EXPENSE' },
  { name: 'Marketing & Advertising', type: 'EXPENSE' },
  { name: 'Insurance', type: 'EXPENSE' },
  { name: 'Bank Fees', type: 'EXPENSE' },
  { name: 'Payroll', type: 'EXPENSE' },
  { name: 'Taxes', type: 'EXPENSE' },
  { name: 'Travel', type: 'EXPENSE' },
  { name: 'Education & Training', type: 'EXPENSE' },
  { name: 'Equipment', type: 'EXPENSE' },
  // Income categories
  { name: 'Sales Revenue', type: 'INCOME' },
  { name: 'Interest Income', type: 'INCOME' },
  { name: 'Investment Income', type: 'INCOME' },
  { name: 'Other Income', type: 'INCOME' },
  // Transfer
  { name: 'Transfer', type: 'TRANSFER' },
];

export { DEFAULT_CATEGORIES };

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  parentCategoryId?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
  parentCategoryId?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export interface ListCategoriesParams {
  type?: CategoryType;
  isActive?: boolean;
  includeChildren?: boolean;
}

/**
 * Category Service
 *
 * Manages expense/income/transfer categories for transaction classification.
 * Categories are tenant-scoped with optional hierarchy (parent/child).
 */
export class CategoryService {
  constructor(
    private readonly tenantId: string,
    private readonly userId: string
  ) {}

  /**
   * List categories for the tenant with optional filtering
   */
  async listCategories(params?: ListCategoriesParams) {
    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
      deletedAt: null,
    };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    // Only show top-level categories (no parent) unless children are requested
    if (!params?.includeChildren) {
      where.parentCategoryId = null;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        childCategories: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string) {
    return prisma.category.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        childCategories: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        parentCategory: true,
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryInput) {
    // Validate parent belongs to same tenant if provided
    if (data.parentCategoryId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: data.parentCategoryId,
          tenantId: this.tenantId,
          deletedAt: null,
        },
      });
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    // Check for duplicate name within same tenant + type
    const existing = await prisma.category.findFirst({
      where: {
        tenantId: this.tenantId,
        name: data.name,
        type: data.type,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new Error(`Category "${data.name}" already exists for type ${data.type}`);
    }

    const category = await prisma.category.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        type: data.type,
        parentCategoryId: data.parentCategoryId,
        color: data.color,
      },
      include: {
        childCategories: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      model: 'Category',
      recordId: category.id,
      action: 'CREATE',
      after: { name: data.name, type: data.type },
    });

    return category;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: UpdateCategoryInput) {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    // Validate parent if changing
    if (data.parentCategoryId) {
      if (data.parentCategoryId === id) {
        throw new Error('Category cannot be its own parent');
      }
      const parent = await prisma.category.findFirst({
        where: {
          id: data.parentCategoryId,
          tenantId: this.tenantId,
          deletedAt: null,
        },
      });
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    // Check duplicate name if name is changing
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          tenantId: this.tenantId,
          name: data.name,
          type: data.type || existing.type,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new Error(`Category "${data.name}" already exists`);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        parentCategoryId: data.parentCategoryId === null ? null : data.parentCategoryId,
        color: data.color === null ? null : data.color,
        isActive: data.isActive,
      },
      include: {
        childCategories: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      model: 'Category',
      recordId: id,
      action: 'UPDATE',
      before: { name: existing.name, type: existing.type },
      after: { name: category.name, type: category.type },
    });

    return category;
  }

  /**
   * Soft-delete a category
   *
   * Does NOT remove categoryId from transactions — they keep the historical reference.
   */
  async softDeleteCategory(id: string) {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    // ARCH-8: Soft-delete + audit log in one transaction for atomicity
    const deletedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id },
        data: { deletedAt },
      });
      // Also soft-delete child categories
      await tx.category.updateMany({
        where: {
          parentCategoryId: id,
          tenantId: this.tenantId,
          deletedAt: null,
        },
        data: { deletedAt },
      });

      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        model: 'Category',
        recordId: id,
        action: 'DELETE',
        before: { name: existing.name, type: existing.type },
      }, tx);
    });

    return { id, deletedAt };
  }

  /**
   * Seed default categories for a tenant (idempotent)
   *
   * Called during onboarding or first import. Safe to call multiple times.
   * Also runs deduplication to clean up any previously duplicated categories.
   */
  async seedDefaults(): Promise<{ created: number; existing: number }> {
    // Clean up any existing duplicates first
    await this.deduplicateCategories();

    const existingCount = await prisma.category.count({
      where: { tenantId: this.tenantId, deletedAt: null },
    });

    if (existingCount > 0) {
      return { created: 0, existing: existingCount };
    }

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        tenantId: this.tenantId,
        name: cat.name,
        type: cat.type,
      })),
      skipDuplicates: true,
    });

    return { created: DEFAULT_CATEGORIES.length, existing: 0 };
  }

  /**
   * Deduplicate categories for this tenant.
   *
   * Groups categories by (name, type), keeps the one with the most transactions,
   * reassigns transactions from duplicates to the winner, then soft-deletes duplicates.
   *
   * Returns count of duplicates removed.
   */
  async deduplicateCategories(): Promise<{ removed: number; reassigned: number }> {
    // Get all active categories with transaction counts
    const categories = await prisma.category.findMany({
      where: {
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { transactions: { where: { deletedAt: null } } },
        },
      },
      orderBy: [{ name: 'asc' }, { type: 'asc' }],
    });

    // Group by name + type
    const groups = new Map<string, typeof categories>();
    for (const cat of categories) {
      const key = `${cat.name}::${cat.type}`;
      const group = groups.get(key) ?? [];
      group.push(cat);
      groups.set(key, group);
    }

    let removed = 0;
    let reassigned = 0;

    for (const [, group] of groups) {
      if (group.length <= 1) continue; // No duplicates

      // Keep the one with the most transactions (or the oldest if tied)
      group.sort((a, b) => {
        const countDiff = b._count.transactions - a._count.transactions;
        if (countDiff !== 0) return countDiff;
        return a.createdAt.getTime() - b.createdAt.getTime(); // oldest first
      });

      const winner = group[0];
      const losers = group.slice(1);

      for (const loser of losers) {
        // Reassign transactions from loser to winner
        if (loser._count.transactions > 0) {
          const updated = await prisma.transaction.updateMany({
            where: {
              categoryId: loser.id,
              deletedAt: null,
            },
            data: {
              categoryId: winner.id,
            },
          });
          reassigned += updated.count;
        }

        // Reassign bill lines
        await prisma.billLine.updateMany({
          where: { categoryId: loser.id },
          data: { categoryId: winner.id },
        });

        // Reassign invoice lines
        await prisma.invoiceLine.updateMany({
          where: { categoryId: loser.id },
          data: { categoryId: winner.id },
        });

        // Soft-delete the duplicate
        await prisma.category.update({
          where: { id: loser.id },
          data: { deletedAt: new Date() },
        });
        removed++;
      }
    }

    if (removed > 0) {
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        model: 'Category',
        recordId: 'batch-dedup',
        action: 'UPDATE',
        after: { removed, reassigned },
      });
    }

    return { removed, reassigned };
  }
}